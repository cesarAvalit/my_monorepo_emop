/**
 * Script para importar esquema y datos completos a la base de datos
 * 
 * Este script:
 * 1. Lee la configuración del .env
 * 2. Se conecta a la base de datos PostgreSQL
 * 3. Importa el esquema desde esquema.sql
 * 4. Importa los datos desde datos_completos.json
 */

import dotenv from 'dotenv';
import pkg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pkg;

// Configurar __dirname para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '../.env') });

// Configuración de la base de datos
const DB_CONFIG = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSLMODE === 'require' ? { rejectUnauthorized: false } : false,
};

// Rutas de los archivos
const ESQUEMA_PATH = path.join(__dirname, '../../backup_supabase/esquema.sql');
const DATOS_PATH = path.join(__dirname, '../../backup_supabase/datos_completos.json');

// Crear pool de conexiones
const pool = new Pool(DB_CONFIG);

/**
 * Ejecuta el esquema SQL
 */
async function importarEsquema() {
  console.log('📋 Importando esquema de la base de datos...');
  
  try {
    const esquemaSQL = fs.readFileSync(ESQUEMA_PATH, 'utf8');
    
    // Dividir el SQL en comandos individuales
    // Eliminar comentarios y líneas vacías, pero mantener comandos importantes
    const lineas = esquemaSQL.split('\n');
    let comandos = [];
    let comandoActual = '';
    
    for (const linea of lineas) {
      const lineaTrim = linea.trim();
      
      // Saltar comentarios y líneas vacías
      if (lineaTrim.startsWith('--') || lineaTrim.length === 0) {
        continue;
      }
      
      // Acumular líneas hasta encontrar punto y coma
      comandoActual += linea + '\n';
      
      if (lineaTrim.endsWith(';')) {
        const cmd = comandoActual.trim();
        if (cmd.length > 0 && !cmd.startsWith('COMMENT')) {
          comandos.push(cmd);
        }
        comandoActual = '';
      }
    }
    
    // Ejecutar cada comando
    for (const comando of comandos) {
      if (comando.length > 0) {
        try {
          await pool.query(comando);
        } catch (error) {
          // Ignorar errores de "ya existe" para tablas, índices, funciones, triggers, etc.
          if (!error.message.includes('already exists') && 
              !error.message.includes('duplicate') &&
              !error.message.includes('does not exist') &&
              error.code !== '42710' && // duplicate_object
              error.code !== '42P07') { // duplicate_table
            console.warn(`⚠️  Advertencia al ejecutar comando: ${error.message}`);
            console.warn(`   Código: ${error.code}`);
            if (comando.length < 200) {
              console.warn(`   Comando: ${comando}`);
            } else {
              console.warn(`   Comando: ${comando.substring(0, 200)}...`);
            }
          }
        }
      }
    }
    
    console.log('✅ Esquema importado correctamente');
  } catch (error) {
    console.error('❌ Error al importar esquema:', error.message);
    throw error;
  }
}

/**
 * Importa los datos desde el JSON
 */
async function importarDatos() {
  console.log('📦 Importando datos desde JSON...');
  
  try {
    const datosJSON = JSON.parse(fs.readFileSync(DATOS_PATH, 'utf8'));
    
    // Orden de importación respetando las foreign keys
    const ordenTablas = [
      'empresa',
      'rol',
      'usuario',
      'conductor',
      'tipo_mantenimiento',
      'vehiculo',
      'orden_trabajo',
      'mecanico',
      'insumo_catalogo',
      'detalle_insumo',
      'linea_servicio',
      'rto_registro',
      'orden_x_usuario',
      'orden_x_mecanico',
      'auditoria',
      'reporte_auditoria_ddjj',
      'inspeccion_ddjj',
      'tipo_notificacion',
      'notificaciones',
      'declaracion_jurada',
      'ddjj_x_usuario',
      'users',
      'roles',
      'companies'
    ];
    
    // Importar cada tabla en orden
    for (const tabla of ordenTablas) {
      if (datosJSON[tabla] && Array.isArray(datosJSON[tabla]) && datosJSON[tabla].length > 0) {
        await importarTabla(tabla, datosJSON[tabla]);
      }
    }
    
    console.log('✅ Datos importados correctamente');
  } catch (error) {
    console.error('❌ Error al importar datos:', error.message);
    throw error;
  }
}

/**
 * Obtiene las columnas reales de una tabla
 */
async function obtenerColumnasTabla(nombreTabla) {
  try {
    const result = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = $1
      ORDER BY ordinal_position
    `, [nombreTabla]);
    
    return result.rows.map(row => row.column_name);
  } catch (error) {
    console.warn(`  ⚠️  No se pudieron obtener columnas de ${nombreTabla}, usando columnas del JSON`);
    return null;
  }
}

/**
 * Mapeo de campos del JSON a columnas de la base de datos
 */
function obtenerMapeoColumnas(nombreTabla) {
  const mapeos = {
    'empresa': {
      'id_empresa': 'id',
      'cuit': 'cult', // Nota: hay un typo en la BD (cult en lugar de cuit)
      'nombre_empresa': 'nombre_empresa',
      'codigo_empresa': null, // No existe en BD
      'email': null, // No existe en BD
      'telefono': null, // No existe en BD
      'id_grupo': 'id_grupo'
    },
    'tipo_mantenimiento': {
      'id_tipo': 'id_tipo',
      'descripcion': 'tipo' // El campo 'tipo' es requerido, usar descripcion
    },
    'orden_trabajo': {
      'id_orden': 'id_orden',
      'id_vehiculo': 'id_vehiculo',
      'id_conductor': 'id_conductor',
      'id_tipo_mantenimiento': 'id_tipo',
      'nro_orden_trabajo': null, // No existe en BD
      'fecha_generacion': 'Fecha_generacion',
      'fecha_egreso': 'Fecha_egreso',
      'odometro': 'odometro',
      'horometro': 'horometro',
      'estado': 'estado',
      'id_ddjj': null // No existe en BD
    },
    'mecanico': {
      'id_mecanico': 'id_mecanico',
      'id_empresa': 'id_empresa',
      'nombre': 'nombre',
      'apellido': 'apellidos', // Plural en BD
      'especialidad': 'especialidad',
      'dni': 'dni',
      'telefono': 'telefono',
      'activo': 'activo'
    }
  };
  
  return mapeos[nombreTabla] || null;
}

/**
 * Importa una tabla específica
 */
async function importarTabla(nombreTabla, registros) {
  console.log(`  📊 Importando tabla: ${nombreTabla} (${registros.length} registros)...`);
  
  if (registros.length === 0) {
    console.log(`  ⏭️  Tabla ${nombreTabla} está vacía, omitiendo...`);
    return;
  }
  
  try {
    // Obtener las columnas reales de la tabla
    const columnasTabla = await obtenerColumnasTabla(nombreTabla);
    
    if (!columnasTabla || columnasTabla.length === 0) {
      console.warn(`  ⚠️  No se pudieron obtener columnas de ${nombreTabla}, omitiendo...`);
      return;
    }
    
    // Obtener mapeo de columnas si existe
    const mapeo = obtenerMapeoColumnas(nombreTabla);
    
    // Obtener las columnas del primer registro
    const columnasJSON = Object.keys(registros[0]);
    
    // Si hay mapeo, usarlo; si no, usar coincidencias directas
    let columnas = [];
    let mapeoInverso = {}; // JSON field -> DB column
    
    if (mapeo) {
      // Usar mapeo personalizado
      for (const [campoJSON, columnaBD] of Object.entries(mapeo)) {
        if (columnaBD && columnasTabla.includes(columnaBD) && columnasJSON.includes(campoJSON)) {
          columnas.push(columnaBD);
          mapeoInverso[campoJSON] = columnaBD;
        }
      }
    } else {
      // Usar coincidencias directas
      columnas = columnasJSON.filter(col => columnasTabla.includes(col));
      columnasJSON.forEach(col => {
        if (columnasTabla.includes(col)) {
          mapeoInverso[col] = col;
        }
      });
    }
    
    if (columnas.length === 0) {
      console.warn(`  ⚠️  No hay columnas coincidentes para ${nombreTabla}, omitiendo...`);
      return;
    }
    
    // Mostrar advertencia si hay columnas en JSON que no están en la tabla
    const columnasFaltantes = columnasJSON.filter(col => !mapeoInverso[col]);
    if (columnasFaltantes.length > 0 && columnasFaltantes.length < columnasJSON.length) {
      console.warn(`  ⚠️  Columnas en JSON no mapeadas (se omitirán): ${columnasFaltantes.join(', ')}`);
    }
    
    // Construir la consulta INSERT
    const placeholders = columnas.map((_, i) => `$${i + 1}`).join(', ');
    const columnasSQL = columnas.map(col => `"${col}"`).join(', ');
    
    // Construir la consulta INSERT con manejo de conflictos
    // Para tablas con claves primarias específicas, usar ON CONFLICT
    let conflictClause = '';
    const primaryKeys = {
      'empresa': 'id',
      'rol': 'id_rol',
      'usuario': 'id_usuario',
      'conductor': 'id_conductor',
      'vehiculo': 'id_vehiculo',
      'tipo_mantenimiento': 'id_tipo',
      'orden_trabajo': 'id_orden',
      'mecanico': 'id_mecanico',
      'insumo_catalogo': 'id_insumo',
      'detalle_insumo': 'id_detalle',
      'rto_registro': 'id_rto',
      'orden_x_usuario': 'id',
      'auditoria': 'id_auditoria',
      'reporte_auditoria_ddjj': 'id_reporte',
      'inspeccion_ddjj': 'id_inspeccion',
      'tipo_notificacion': 'id',
      'notificaciones': 'id',
      'declaracion_jurada': 'id_ddjj',
      'users': 'id',
      'roles': 'id',
      'companies': 'id'
    };
    
    const pk = primaryKeys[nombreTabla];
    if (pk && columnas.includes(pk)) {
      conflictClause = `ON CONFLICT ("${pk}") DO NOTHING`;
    } else {
      // Para tablas sin PK conocida o tablas pivot, intentar sin especificar columna
      // Si falla, usar UPDATE o simplemente intentar insertar
      conflictClause = 'ON CONFLICT DO NOTHING';
    }
    
    const query = `
      INSERT INTO "${nombreTabla}" (${columnasSQL})
      VALUES (${placeholders})
      ${conflictClause}
    `;
    
    // Insertar cada registro
    let insertados = 0;
    let errores = 0;
    for (const registro of registros) {
      const valores = columnas.map(columnaBD => {
        // Encontrar el campo JSON que mapea a esta columna BD
        const campoJSON = Object.keys(mapeoInverso).find(campo => mapeoInverso[campo] === columnaBD);
        
        if (!campoJSON || !(campoJSON in registro)) {
          return null;
        }
        
        const valor = registro[campoJSON];
        
        // Manejar valores null
        if (valor === null || valor === undefined) {
          return null;
        }
        
        // Manejar objetos JSON (equipamiento_atributos, etc.)
        if (typeof valor === 'object' && !Array.isArray(valor) && !(valor instanceof Date)) {
          // Si el objeto está vacío, retornar null o string vacío según el caso
          if (Object.keys(valor).length === 0) {
            return null;
          }
          return JSON.stringify(valor);
        }
        
        // Manejar arrays (convertir a JSON)
        if (Array.isArray(valor)) {
          return JSON.stringify(valor);
        }
        
        // Manejar fechas (ya vienen como strings ISO)
        if (typeof valor === 'string' && valor.match(/^\d{4}-\d{2}-\d{2}/)) {
          return valor;
        }
        
        // Manejar números que vienen como strings en el JSON
        if (typeof valor === 'string' && !isNaN(valor) && valor.trim() !== '') {
          // Si parece un número, intentar convertirlo
          const num = Number(valor);
          if (!isNaN(num)) {
            return num;
          }
        }
        
        return valor;
      });
      
      try {
        await pool.query(query, valores);
        insertados++;
      } catch (error) {
        // Si es error de conflicto, ignorar
        if (error.code === '23505' || error.message.includes('duplicate')) {
          // Ya existe, continuar
        } else {
          console.warn(`    ⚠️  Error al insertar registro en ${nombreTabla}:`, error.message);
          console.warn(`    Registro:`, JSON.stringify(registro).substring(0, 200));
        }
      }
    }
    
    console.log(`  ✅ ${nombreTabla}: ${insertados}/${registros.length} registros insertados`);
  } catch (error) {
    console.error(`  ❌ Error al importar tabla ${nombreTabla}:`, error.message);
    throw error;
  }
}

/**
 * Verifica la conexión a la base de datos
 */
async function verificarConexion() {
  console.log('🔌 Verificando conexión a la base de datos...');
  console.log(`   Host: ${DB_CONFIG.host}`);
  console.log(`   Database: ${DB_CONFIG.database}`);
  console.log(`   User: ${DB_CONFIG.user}`);
  
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Conexión exitosa a la base de datos');
    console.log(`   Hora del servidor: ${result.rows[0].now}`);
    return true;
  } catch (error) {
    console.error('❌ Error al conectar a la base de datos:', error.message);
    return false;
  }
}

/**
 * Función principal
 */
async function main() {
  console.log('🚀 Iniciando importación completa de base de datos...\n');
  
  try {
    // Verificar conexión
    const conectado = await verificarConexion();
    if (!conectado) {
      process.exit(1);
    }
    
    console.log('');
    
    // Importar esquema
    await importarEsquema();
    
    console.log('');
    
    // Importar datos
    await importarDatos();
    
    console.log('');
    console.log('🎉 ¡Importación completada exitosamente!');
    
  } catch (error) {
    console.error('\n❌ Error durante la importación:', error);
    process.exit(1);
  } finally {
    await pool.end();
    console.log('\n🔌 Conexión cerrada');
  }
}

// Ejecutar
main();

