/**
 * Configuración del Backend API
 * 
 * Este archivo proporciona funciones para comunicarse con el backend
 * en lugar de usar Supabase directamente desde el frontend.
 */

// URL del backend
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

/**
 * Helper para hacer requests al backend de forma segura
 */
async function safeFetch(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
      throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (err) {
    console.error('Error en request al backend:', err);
    throw err;
  }
}

/**
 * Helper para obtener todos los registros de una tabla
 * Por defecto ordena por el registro más reciente primero (DESC)
 */
export async function getAllFromTable(tableName, options = {}) {
  try {
    const params = new URLSearchParams();
    
    // Aplicar filtros si existen
    if (options.filter) {
      params.append('filter', JSON.stringify(options.filter));
    }
    
    // Aplicar ordenamiento
    if (options.orderBy) {
      params.append('orderBy', options.orderBy);
      if (options.ascending !== undefined) {
        params.append('ascending', options.ascending.toString());
      }
    }
    
    // Aplicar límite
    if (options.limit) {
      params.append('limit', options.limit.toString());
    }
    
    const queryString = params.toString();
    const url = `${BACKEND_URL}/api/${tableName}${queryString ? `?${queryString}` : ''}`;
    
    const data = await safeFetch(url);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error(`Error obteniendo datos de ${tableName}:`, err);
    return [];
  }
}

/**
 * Helper para obtener un registro por ID
 */
export async function getById(tableName, id) {
  try {
    const url = `${BACKEND_URL}/api/${tableName}/${id}`;
    return await safeFetch(url);
  } catch (err) {
    console.error(`Error obteniendo ${tableName} por ID:`, err);
    return null;
  }
}

/**
 * Helper para obtener registros con filtro por clave foránea
 */
export async function getByForeignKey(tableName, foreignKey, foreignId) {
  try {
    const url = `${BACKEND_URL}/api/${tableName}/foreign-key/${foreignKey}/${foreignId}`;
    const data = await safeFetch(url);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error(`Error obteniendo ${tableName} por ${foreignKey}:`, err);
    return [];
  }
}

/**
 * Helper para insertar un registro
 */
export async function insertIntoTable(tableName, data) {
  try {
    const url = `${BACKEND_URL}/api/${tableName}`;
    const result = await safeFetch(url, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return result;
  } catch (err) {
    console.error(`Error insertando en ${tableName}:`, err);
    throw err;
  }
}

/**
 * Helper para actualizar un registro
 * @param {string} tableName - Nombre de la tabla
 * @param {number|object} idOrRecord - ID del registro o objeto con la clave primaria
 * @param {object} data - Datos a actualizar
 */
export async function updateInTable(tableName, idOrRecord, data) {
  try {
    let url;
    let body;
    
    if (typeof idOrRecord === 'object') {
      // Si es un objeto, usar el endpoint by-record
      url = `${BACKEND_URL}/api/${tableName}/by-record`;
      body = JSON.stringify({ idOrRecord, data });
    } else {
      // Si es un ID simple, usar el endpoint normal
      url = `${BACKEND_URL}/api/${tableName}/${idOrRecord}`;
      body = JSON.stringify(data);
    }
    
    const result = await safeFetch(url, {
      method: 'PUT',
      body,
    });
    return result;
  } catch (err) {
    console.error(`Error actualizando en ${tableName}:`, err);
    throw err;
  }
}

/**
 * Helper para eliminar un registro
 * @param {string} tableName - Nombre de la tabla
 * @param {number|object} idOrRecord - ID del registro o objeto con la clave primaria
 */
export async function deleteFromTable(tableName, idOrRecord) {
  try {
    let url;
    let options = {};
    
    if (typeof idOrRecord === 'object') {
      // Si es un objeto, usar el endpoint by-record
      url = `${BACKEND_URL}/api/${tableName}/by-record`;
      options = {
        method: 'DELETE',
        body: JSON.stringify({ idOrRecord }),
      };
    } else {
      // Si es un ID simple, usar el endpoint normal
      url = `${BACKEND_URL}/api/${tableName}/${idOrRecord}`;
      options = {
        method: 'DELETE',
      };
    }
    
    await safeFetch(url, options);
    return true;
  } catch (err) {
    console.error(`Error eliminando de ${tableName}:`, err);
    throw err;
  }
}

/**
 * Helper para registrar acciones en la tabla de auditoría
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
    // Validar parámetros requeridos
    if (!usuarioNombre || !accion || !tipoRegistro || !idRegistro || !detalle) {
      console.warn('⚠️ Auditoría: Faltan parámetros requeridos', {
        usuarioNombre,
        accion,
        tipoRegistro,
        idRegistro,
        detalle
      });
      return false;
    }

    const url = `${BACKEND_URL}/api/auditoria/registrar`;
    const result = await safeFetch(url, {
      method: 'POST',
      body: JSON.stringify({
        usuarioNombre,
        idUsuarioRef,
        accion,
        tipoRegistro,
        idRegistro,
        detalle,
        idMantenimientoRef
      }),
    });

    return result.success || false;
  } catch (err) {
    // No lanzar error para no interrumpir el flujo principal
    console.error('Error de conexión al registrar auditoría:', err);
    return false;
  }
}

export default {
  getAllFromTable,
  getById,
  getByForeignKey,
  insertIntoTable,
  updateInTable,
  deleteFromTable,
  registrarAuditoria,
};

