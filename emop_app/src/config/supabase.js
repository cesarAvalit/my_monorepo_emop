/**
 * Configuración del Cliente Supabase
 * 
 * ⚠️ IMPORTANTE: Este archivo ahora usa el backend en lugar de Supabase directo.
 * Las funciones mantienen la misma interfaz para compatibilidad con el código existente.
 * 
 * Para usar el backend, asegúrate de tener configurado VITE_BACKEND_URL en .env
 * Ejemplo: VITE_BACKEND_URL=http://localhost:3001
 */

// Re-exportar funciones del backend para mantener compatibilidad
export {
  getAllFromTable,
  getById,
  getByForeignKey,
  insertIntoTable,
  updateInTable,
  deleteFromTable,
  registrarAuditoria
} from './backend.js';

// Mantener el cliente de Supabase para casos especiales (como autenticación si se necesita)
import { createClient } from '@supabase/supabase-js';

// Obtener las credenciales desde variables de entorno
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://weberwavolitwvmjfhap.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_0tzTI6KROnJ-_B2Sylij4Q_FAB4JfOS';

// Crear y exportar el cliente de Supabase (solo para casos especiales)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

/**
 * Helper para hacer queries a Supabase de forma segura
 * (Mantenido para compatibilidad, pero se recomienda usar el backend)
 */
export async function safeSupabaseQuery(queryFn) {
  try {
    const { data, error } = await queryFn();
    if (error) {
      console.error('Error en query de Supabase:', error);
      return null;
    }
    return data;
  } catch (err) {
    console.error('Error de conexión con Supabase:', err);
    return null;
  }
}

export default supabase;
