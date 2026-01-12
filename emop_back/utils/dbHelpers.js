/**
 * Helpers para operaciones de base de datos
 * Soporta tanto Supabase como PostgreSQL local
 */

import { getClient, getPrimaryKey, getDefaultOrderBy } from '../config/database.js';

/**
 * Obtener todos los registros de una tabla
 */
export async function getAllFromTable(tableName, options = {}) {
  const dbClient = getClient();
  
  if (dbClient.type === 'postgres') {
    return await getAllFromTablePostgres(tableName, options, dbClient.pool);
  } else {
    return await getAllFromTableSupabase(tableName, options, dbClient.client);
  }
}

/**
 * Obtener todos los registros usando Supabase
 */
async function getAllFromTableSupabase(tableName, options, supabase) {
  try {
    let query = supabase.from(tableName).select('*');
    
    // Aplicar filtros si existen
    if (options.filter) {
      Object.entries(options.filter).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }
    
    // Aplicar ordenamiento
    if (options.orderBy) {
      query = query.order(options.orderBy, { ascending: options.ascending !== false });
    } else {
      const defaultOrderBy = getDefaultOrderBy(tableName);
      if (defaultOrderBy) {
        query = query.order(defaultOrderBy, { ascending: false });
      }
    }
    
    // Aplicar límite
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error(`Error obteniendo datos de ${tableName}:`, error);
      throw error;
    }
    
    return data || [];
  } catch (err) {
    console.error(`Error de conexión obteniendo ${tableName}:`, err);
    throw err;
  }
}

/**
 * Obtener todos los registros usando PostgreSQL local
 */
async function getAllFromTablePostgres(tableName, options, pool) {
  try {
    const client = await pool.connect();
    
    try {
      let query = `SELECT * FROM "${tableName}"`;
      const params = [];
      let paramIndex = 1;
      
      // Aplicar filtros
      if (options.filter && Object.keys(options.filter).length > 0) {
        const conditions = Object.entries(options.filter).map(([key, value]) => {
          params.push(value);
          return `"${key}" = $${paramIndex++}`;
        });
        query += ' WHERE ' + conditions.join(' AND ');
      }
      
      // Aplicar ordenamiento (con verificación de existencia de columna)
      if (options.orderBy) {
        // Verificar que la columna existe antes de usarla
        const columnExists = await checkColumnExists(client, tableName, options.orderBy);
        if (columnExists) {
          query += ` ORDER BY "${options.orderBy}" ${options.ascending !== false ? 'ASC' : 'DESC'}`;
        } else {
          console.warn(`⚠️  Columna de ordenamiento "${options.orderBy}" no existe en ${tableName}, omitiendo ORDER BY`);
        }
      } else {
        const defaultOrderBy = getDefaultOrderBy(tableName);
        if (defaultOrderBy) {
          // Verificar que la columna existe antes de usarla
          const columnExists = await checkColumnExists(client, tableName, defaultOrderBy);
          if (columnExists) {
            query += ` ORDER BY "${defaultOrderBy}" DESC`;
          } else {
            // Si no existe, intentar alternativas o simplemente no ordenar
            console.warn(`⚠️  Columna de ordenamiento "${defaultOrderBy}" no existe en ${tableName}, omitiendo ORDER BY`);
            const alternative = getAlternativeOrderBy(tableName);
            if (alternative) {
              const altExists = await checkColumnExists(client, tableName, alternative);
              if (altExists) {
                query += ` ORDER BY "${alternative}" DESC`;
              }
            }
          }
        }
      }
      
      // Aplicar límite
      if (options.limit) {
        query += ` LIMIT $${paramIndex++}`;
        params.push(options.limit);
      }
      
      const result = await client.query(query, params);
      return result.rows || [];
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(`Error obteniendo datos de ${tableName}:`, err);
    throw err;
  }
}

/**
 * Verificar si una columna existe en una tabla (PostgreSQL)
 */
async function checkColumnExists(client, tableName, columnName) {
  try {
    const result = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = $1 AND column_name = $2
    `, [tableName, columnName]);
    return result.rows.length > 0;
  } catch (err) {
    return false;
  }
}

/**
 * Obtener columna alternativa para ordenamiento si la principal no existe
 */
function getAlternativeOrderBy(tableName) {
  const alternatives = {
    'notificaciones': 'fecha_creacion', // Usar fecha_creacion como alternativa si fecha_hora no existe
  };
  return alternatives[tableName] || null;
}

/**
 * Obtener un registro por ID
 */
export async function getById(tableName, id) {
  const dbClient = getClient();
  const primaryKey = getPrimaryKey(tableName);
  
  if (dbClient.type === 'postgres') {
    const client = await dbClient.pool.connect();
    try {
      const query = `SELECT * FROM "${tableName}" WHERE "${primaryKey}" = $1 LIMIT 1`;
      const result = await client.query(query, [id]);
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  } else {
    const { data, error } = await dbClient.client
      .from(tableName)
      .select('*')
      .eq(primaryKey, id)
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  }
}

/**
 * Obtener registros por clave foránea
 */
export async function getByForeignKey(tableName, foreignKey, foreignId) {
  const dbClient = getClient();
  
  if (dbClient.type === 'postgres') {
    const client = await dbClient.pool.connect();
    try {
      const query = `SELECT * FROM "${tableName}" WHERE "${foreignKey}" = $1`;
      const result = await client.query(query, [foreignId]);
      return result.rows || [];
    } finally {
      client.release();
    }
  } else {
    const { data, error } = await dbClient.client
      .from(tableName)
      .select('*')
      .eq(foreignKey, foreignId);
    
    if (error) {
      throw error;
    }
    
    return data || [];
  }
}

/**
 * Insertar un registro
 */
export async function insertIntoTable(tableName, data) {
  const dbClient = getClient();
  
  // Limpiar datos para tablas con SERIAL/AUTO_INCREMENT
  // Eliminar IDs que tienen secuencias automáticas para que PostgreSQL los genere
  const dataToInsert = { ...data };
  
  // Obtener la clave primaria de la tabla
  const primaryKey = getPrimaryKey(tableName);
  
  // Si existe la clave primaria en los datos y la tabla tiene DEFAULT (secuencia), eliminarla
  if (primaryKey && dataToInsert[primaryKey] !== undefined) {
    // Verificar si la columna tiene DEFAULT (secuencia) consultando la base de datos
    // Por ahora, eliminamos los IDs comunes que sabemos que tienen secuencias
    if (tableName === 'empresa' && dataToInsert.id_empresa !== undefined) {
      delete dataToInsert.id_empresa;
    }
    if (tableName === 'usuario' && dataToInsert.id_usuario !== undefined) {
      delete dataToInsert.id_usuario;
    }
    if (tableName === 'conductor' && dataToInsert.id_conductor !== undefined) {
      delete dataToInsert.id_conductor;
    }
    if (tableName === 'auditoria' && dataToInsert.id_auditoria !== undefined) {
      delete dataToInsert.id_auditoria;
    }
    if (tableName === 'vehiculo' && dataToInsert.id_vehiculo !== undefined) {
      delete dataToInsert.id_vehiculo;
    }
    if (tableName === 'mecanico' && dataToInsert.id_mecanico !== undefined) {
      delete dataToInsert.id_mecanico;
    }
    if (tableName === 'orden_trabajo' && dataToInsert.id_orden !== undefined) {
      delete dataToInsert.id_orden;
    }
    if (tableName === 'tipo_mantenimiento' && dataToInsert.id_tipo !== undefined) {
      delete dataToInsert.id_tipo;
    }
    if (tableName === 'insumo_catalogo' && dataToInsert.id_insumo !== undefined) {
      delete dataToInsert.id_insumo;
    }
    if (tableName === 'linea_servicio' && dataToInsert.id_linea_servicio !== undefined) {
      delete dataToInsert.id_linea_servicio;
    }
    if (tableName === 'rol' && dataToInsert.id_rol !== undefined) {
      delete dataToInsert.id_rol;
    }
    if (tableName === 'rto_registro' && dataToInsert.id_rto !== undefined) {
      delete dataToInsert.id_rto;
    }
  }
  
  if (dbClient.type === 'postgres') {
    const client = await dbClient.pool.connect();
    try {
      const columnas = Object.keys(dataToInsert);
      const valores = Object.values(dataToInsert);
      const columnasEscapadas = columnas.map(col => `"${col}"`).join(', ');
      const placeholders = valores.map((_, i) => `$${i + 1}`).join(', ');
      const query = `INSERT INTO "${tableName}" (${columnasEscapadas}) VALUES (${placeholders}) RETURNING *`;
      
      const result = await client.query(query, valores);
      return result.rows[0];
    } finally {
      client.release();
    }
  } else {
    const { data: insertedData, error } = await dbClient.client
      .from(tableName)
      .insert(dataToInsert)
      .select('*')
      .single();
    
    if (error) {
      throw error;
    }
    
    return insertedData;
  }
}

/**
 * Actualizar un registro
 */
export async function updateInTable(tableName, idOrRecord, data) {
  const dbClient = getClient();
  
  if (dbClient.type === 'postgres') {
    const client = await dbClient.pool.connect();
    try {
      let whereClause;
      let whereParams = [];
      
      if (typeof idOrRecord === 'object') {
        const conditions = Object.entries(idOrRecord).map(([key, value], index) => {
          whereParams.push(value);
          return `"${key}" = $${whereParams.length}`;
        });
        whereClause = conditions.join(' AND ');
      } else {
        const primaryKey = getPrimaryKey(tableName);
        whereParams.push(idOrRecord);
        whereClause = `"${primaryKey}" = $1`;
      }
      
      const columnas = Object.keys(data);
      const valores = Object.values(data);
      const updates = columnas.map((col, index) => {
        return `"${col}" = $${whereParams.length + index + 1}`;
      }).join(', ');
      
      const allParams = [...whereParams, ...valores];
      const query = `UPDATE "${tableName}" SET ${updates} WHERE ${whereClause} RETURNING *`;
      
      const result = await client.query(query, allParams);
      return result.rows[0];
    } finally {
      client.release();
    }
  } else {
    let query = dbClient.client.from(tableName).update(data);
    
    if (typeof idOrRecord === 'object') {
      Object.entries(idOrRecord).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    } else {
      const primaryKey = getPrimaryKey(tableName);
      query = query.eq(primaryKey, idOrRecord);
    }
    
    const { data: updatedData, error } = await query.select().single();
    
    if (error) {
      throw error;
    }
    
    return updatedData;
  }
}

/**
 * Eliminar un registro
 */
export async function deleteFromTable(tableName, idOrRecord) {
  const dbClient = getClient();
  
  if (dbClient.type === 'postgres') {
    const client = await dbClient.pool.connect();
    try {
      let whereClause;
      let whereParams = [];
      
      if (typeof idOrRecord === 'object') {
        const conditions = Object.entries(idOrRecord).map(([key, value], index) => {
          whereParams.push(value);
          return `"${key}" = $${whereParams.length}`;
        });
        whereClause = conditions.join(' AND ');
      } else {
        const primaryKey = getPrimaryKey(tableName);
        whereParams.push(idOrRecord);
        whereClause = `"${primaryKey}" = $1`;
      }
      
      const query = `DELETE FROM "${tableName}" WHERE ${whereClause}`;
      await client.query(query, whereParams);
      return true;
    } finally {
      client.release();
    }
  } else {
    let query = dbClient.client.from(tableName).delete();
    
    if (typeof idOrRecord === 'object') {
      Object.entries(idOrRecord).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    } else {
      const primaryKey = getPrimaryKey(tableName);
      query = query.eq(primaryKey, idOrRecord);
    }
    
    const { error } = await query;
    
    if (error) {
      throw error;
    }
    
    return true;
  }
}

/**
 * Registrar acciones en la tabla de auditoría
 */
export async function registrarAuditoria({
  usuarioNombre,
  idUsuarioRef = null,
  accion,
  tipoRegistro,
  idRegistro,
  detalle,
  idMantenimientoRef = null
}) {
  try {
    if (!usuarioNombre || !accion || !tipoRegistro || !idRegistro || !detalle) {
      console.warn('⚠️ Auditoría: Faltan parámetros requeridos');
      return false;
    }

    const auditoriaData = {
      usuario_nombre: usuarioNombre,
      id_usuario_ref: idUsuarioRef,
      accion: accion.toUpperCase(),
      tipo_registro: tipoRegistro.toLowerCase(),
      id_registro: String(idRegistro),
      detalle: detalle,
      id_mantenimiento_ref: idMantenimientoRef,
      fecha_hora: new Date().toISOString()
    };

    await insertIntoTable('auditoria', auditoriaData);
    return true;
  } catch (err) {
    console.error('Error de conexión al registrar auditoría:', err);
    return false;
  }
}
