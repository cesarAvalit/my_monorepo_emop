/**
 * Configuración del Cliente Supabase para el Backend
 * 
 * ⚠️ DEPRECADO: Este archivo mantiene compatibilidad pero ahora se usa database.js
 * Se recomienda usar el módulo database.js que soporta tanto Supabase como PostgreSQL local
 * 
 * Este archivo re-exporta funciones del módulo database.js para mantener compatibilidad
 */

// Re-exportar desde database.js para mantener compatibilidad
export {
  getPrimaryKey,
  getDefaultOrderBy,
  getDatabaseType,
  getClient,
  closeDatabase
} from './database.js';

// Re-exportar supabase si está disponible
export { supabase, database as default } from './database.js';

