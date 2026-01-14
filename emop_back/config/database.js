/**
 * Configuración de Base de Datos
 * 
 * Este módulo permite usar tanto Supabase como PostgreSQL local
 * según la configuración en las variables de entorno.
 * 
 * Se usa Supabase si DB_TYPE=supabase o si no está configurado
 * Se usa PostgreSQL local si DB_TYPE=postgres y están configuradas las credenciales locales
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import pkg from 'pg';
const { Pool } = pkg;

// Cargar variables de entorno
// IMPORTANTE: El orden importa:
// 1. Primero carga .env (configuración remota/Supabase)
// 2. Luego carga .env_local si existe (sobrescribe para desarrollo local)
// Esto permite usar .env_local para desarrollo local y .env para producción/remoto

dotenv.config(); // Carga .env

// Cargar también .env_local si existe (para desarrollo local)
// override: true significa que .env_local SOBRESCRIBE .env si existe
// Esto permite cambiar fácilmente entre local y remoto:
// - Para usar local: crea/usa .env_local con DB_TYPE=postgres
// - Para usar remoto: elimina .env_local o no lo crees, usa solo .env con DB_TYPE=supabase
try {
  dotenv.config({ path: '.env_local', override: true });
} catch (err) {
  // .env_local es opcional - si no existe, se usa .env
}

const DB_TYPE = process.env.DB_TYPE || 'supabase'; // 'supabase' o 'postgres'

// Configuración para Supabase
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://weberwavolitwvmjfhap.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_LDZn81mde7XPA-qb-AMhVQ_bQ2DBa98';

// Configuración para PostgreSQL (local o Neon)
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'emop_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '123456',
};

// Configuración SSL para Neon (requerido)
const DB_SSLMODE = process.env.DB_SSLMODE || 'prefer';

// Pool de conexiones para PostgreSQL local
let postgresPool = null;

/**
 * Obtiene el cliente de base de datos según la configuración
 */
function getDatabaseClient() {
  if (DB_TYPE === 'postgres') {
    if (!postgresPool) {
      const isNeon = DB_CONFIG.host && DB_CONFIG.host.includes('neon.tech');
      console.log(`🔌 Conectando a PostgreSQL${isNeon ? ' (Neon)' : ' local'}...`);
      
      // Configuración de conexión
      const poolConfig = {
        ...DB_CONFIG,
        // Configuraciones adicionales para manejar mejor la autenticación
        connectionTimeoutMillis: 5000,
        idleTimeoutMillis: 30000,
      };
      
      // Configurar SSL si está especificado (requerido para Neon)
      if (DB_SSLMODE && DB_SSLMODE !== 'disable') {
        poolConfig.ssl = DB_SSLMODE === 'require' 
          ? { rejectUnauthorized: false } // Para Neon
          : true; // Para otros casos
      }
      
      postgresPool = new Pool(poolConfig);
      
      // Manejar errores de conexión
      postgresPool.on('error', (err) => {
        console.error('❌ Error inesperado en el pool de PostgreSQL:', err);
        // Si es error de autenticación, dar sugerencias
        if (err.code === '28P01') {
          console.error('💡 Sugerencia: Configura pg_hba.conf o ejecuta: ./scripts/configurar_pg_hba.sh');
        }
      });
      
      // Probar conexión al crear el pool (sin bloquear el inicio)
      postgresPool.query('SELECT 1')
        .then(() => {
          console.log(`✅ Conectado a PostgreSQL: ${DB_CONFIG.host}:${DB_CONFIG.port}/${DB_CONFIG.database}`);
        })
        .catch((err) => {
          if (err.code === '28P01') {
            // Error de autenticación - intentar sin contraseña
            console.warn('⚠️  Error de autenticación con contraseña, intentando sin contraseña...');
            
            // Solo intentar sin contraseña si no es Neon (Neon siempre requiere contraseña)
            if (DB_CONFIG.host && DB_CONFIG.host.includes('neon.tech')) {
              console.error('❌ Neon requiere autenticación. Verifica las credenciales en .env');
              return;
            }
            
            // Cerrar pool anterior
            postgresPool.end().catch(() => {});
            
            // Crear nuevo pool sin contraseña (solo para local)
            const poolConfigNoPassword = {
              ...poolConfig,
              password: undefined,
            };
            delete poolConfigNoPassword.password;
            
            postgresPool = new Pool(poolConfigNoPassword);
            
            // Intentar nuevamente sin contraseña
            postgresPool.query('SELECT 1')
              .then(() => {
                console.log(`✅ Conectado a PostgreSQL (sin contraseña - modo trust): ${DB_CONFIG.host}:${DB_CONFIG.port}/${DB_CONFIG.database}`);
                console.warn('💡 Configura pg_hba.conf con trust para desarrollo local: ./scripts/fix_auth_rapido.sh');
              })
              .catch((err2) => {
                console.error('❌ Error al conectar a PostgreSQL:', err2.message);
                console.error('💡 Ejecuta: cd emop_back && ./scripts/fix_auth_rapido.sh');
                console.error('   Esto configurará pg_hba.conf para permitir conexión sin contraseña');
              });
          } else {
            console.error('❌ Error al conectar a PostgreSQL:', err.message);
          }
        });
    }
    return { type: 'postgres', pool: postgresPool };
  } else {
    // Usar Supabase por defecto
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    return { type: 'supabase', client: supabase };
  }
}

// Cliente de base de datos
const dbClient = getDatabaseClient();

/**
 * Cierra las conexiones de base de datos
 */
export async function closeDatabase() {
  if (postgresPool) {
    await postgresPool.end();
    postgresPool = null;
    console.log('🔌 Conexión a PostgreSQL cerrada');
  }
}

/**
 * Obtiene el tipo de base de datos actual
 */
export function getDatabaseType() {
  return dbClient.type;
}

/**
 * Obtiene el cliente de base de datos
 */
export function getClient() {
  return dbClient;
}

/**
 * Helper para escapar identificadores SQL
 */
function escapeIdentifier(identifier) {
  return `"${identifier}"`;
}

/**
 * Obtiene la clave primaria correcta según la tabla
 */
export function getPrimaryKey(tableName) {
  const primaryKeys = {
    'empresa': 'id_empresa',
    'rol': 'id_rol',
    'usuario': 'id_usuario',
    'conductor': 'id_conductor',
    'vehiculo': 'id_vehiculo',
    'tipo_mantenimiento': 'id_tipo',
    'orden_trabajo': 'id_orden',
    'mecanico': 'id_mecanico',
    'insumo_catalogo': 'id_insumo',
    'detalle_insumo': 'id_detalle',
    'linea_servicio': 'id_linea_servicio',
    'rto_registro': 'id_rto',
    'orden_x_usuario': 'id',
    'orden_x_mecanico': 'id_orden',
    'auditoria': 'id_auditoria',
    'reporte_auditoria_ddjj': 'id_reporte',
    'inspeccion_ddjj': 'id_inspeccion',
    'tipo_notificacion': 'id',
    'notificaciones': 'id',
    'declaracion_jurada': 'id_ddjj',
  };
  return primaryKeys[tableName] || 'id';
}

/**
 * Obtiene el campo de ordenamiento por defecto según la tabla
 */
export function getDefaultOrderBy(tableName) {
  const tableOrderMap = {
    'empresa': 'id_empresa',
    'usuario': 'created_at',
    'conductor': 'created_at',
    'vehiculo': 'created_at',
    'orden_trabajo': 'fecha_generacion',
    'auditoria': 'fecha_hora',
    'tipo_mantenimiento': 'id_tipo',
    'mecanico': 'id_mecanico',
    'insumo_catalogo': 'id_insumo',
    'linea_servicio': 'id_linea_servicio',
    'rto_registro': 'created_at',
    'inspeccion_ddjj': 'created_at',
    'orden_x_usuario': 'created_at',
    'orden_x_mecanico': 'id_orden',
    'detalle_insumo': 'id_detalle',
    'rol': 'id_rol',
    'notificaciones': 'fecha_hora', // Usar fecha_hora en lugar de created_at (que no existe)
    'declaracion_jurada': 'created_at',
  };
  return tableOrderMap[tableName] || null;
}

// Exportar cliente por compatibilidad
export const database = dbClient;

// Para compatibilidad con código existente que usa supabase
export const supabase = dbClient.type === 'supabase' ? dbClient.client : null;

export default database;

