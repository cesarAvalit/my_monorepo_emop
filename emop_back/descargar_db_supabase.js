/**
 * Script para descargar la base de datos completa de Supabase
 * Descarga tanto la estructura (schema) como los datos de todas las tablas
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, 'emop_back', '.env') });

const supabaseUrl = process.env.SUPABASE_URL || 'https://weberwavolitwvmjfhap.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_LDZn81mde7XPA-qb-AMhVQ_bQ2DBa98';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Variables de entorno SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no configuradas');
  process.exit(1);
}

// Crear cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Lista de todas las tablas conocidas del sistema
const TABLAS = [
  'empresa',
  'rol',
  'usuario',
  'conductor',
  'vehiculo',
  'tipo_mantenimiento',
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
  'users', // Tablas de compatibilidad
  'roles',
  'companies'
];

/**
 * Obtener el esquema de una tabla usando query directo
 */
async function obtenerEsquemaTabla(tabla) {
  try {
    // Usar PostgREST para obtener información de la tabla
    // Esta es una aproximación, ya que Supabase no expone directamente el DDL
    const { data, error } = await supabase
      .from(tabla)
      .select('*')
      .limit(0);
    
    if (error && error.code === 'PGRST116') {
      return null; // Tabla no existe
    }
    
    // Intentar obtener información de columnas con una query
    // Nota: Esta es una aproximación, el esquema real debería obtenerse de pg_catalog
    return { exists: true };
  } catch (err) {
    return null;
  }
}

/**
 * Obtener todos los datos de una tabla
 */
async function descargarDatosTabla(tabla) {
  try {
    console.log(`  📥 Descargando datos de ${tabla}...`);
    
    // Obtener todos los registros (sin límite)
    const { data, error } = await supabase
      .from(tabla)
      .select('*');
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.log(`  ⚠️  Tabla ${tabla} no existe, saltando...`);
        return null;
      }
      throw error;
    }
    
    console.log(`  ✅ ${tabla}: ${data?.length || 0} registros descargados`);
    return data || [];
  } catch (err) {
    console.error(`  ❌ Error descargando ${tabla}:`, err.message);
    return null;
  }
}

/**
 * Obtener el esquema SQL usando una query directa a PostgreSQL
 * Nota: Esto requiere acceso directo a la base de datos PostgreSQL
 */
async function obtenerEsquemaSQL() {
  try {
    // Intentar obtener el esquema usando la función pg_get_tabledef si está disponible
    // Como alternativa, usaremos el esquema existente del proyecto
    
    console.log('📋 Obteniendo esquema de la base de datos...');
    
    // Leer el esquema existente del proyecto si está disponible
    const projectRoot = path.resolve(__dirname, '..');
    const schemaPath = path.join(projectRoot, 'emop_app', 'supabase_schema.sql');
    
    if (fs.existsSync(schemaPath)) {
      console.log('  ✅ Usando esquema existente de supabase_schema.sql');
      let esquema = fs.readFileSync(schemaPath, 'utf8');
      
      // Agregar información sobre el backup
      const header = `-- =====================================================
-- BACKUP DE BASE DE DATOS SUPABASE - EMOP
-- =====================================================
-- Fecha de backup: ${new Date().toISOString()}
-- Base de datos: ${supabaseUrl}
-- 
-- Este archivo contiene el esquema (estructura) de las tablas.
-- Los datos se encuentran en los archivos JSON en la carpeta 'datos/'
-- =====================================================

`;
      return header + esquema;
    }
    
    // Si no existe, intentar leer otros archivos SQL del proyecto
    const altSchemas = [
      path.join(projectRoot, 'emop_app', 'actualizar_esquema.sql'),
      path.join(projectRoot, 'emop_app', 'restructurar_ddjj_ordenes_trabajo.sql')
    ];
    
    for (const altPath of altSchemas) {
      if (fs.existsSync(altPath)) {
        console.log(`  ⚠️  Usando esquema alternativo: ${path.basename(altPath)}`);
        return fs.readFileSync(altPath, 'utf8');
      }
    }
    
    // Si no existe ningún esquema, crear uno básico con información
    return `-- =====================================================
-- BACKUP DE BASE DE DATOS SUPABASE - EMOP
-- =====================================================
-- Fecha de backup: ${new Date().toISOString()}
-- Base de datos: ${supabaseUrl}
-- 
-- NOTA: No se encontró el archivo supabase_schema.sql en el proyecto.
-- Este es un backup parcial (solo datos, sin esquema completo).
-- Para obtener el esquema completo, ejecuta pg_dump desde Supabase Dashboard
-- o consulta el SQL Editor para obtener el DDL de cada tabla.
-- =====================================================

`;
  } catch (err) {
    console.error('❌ Error obteniendo esquema:', err.message);
    return null;
  }
}

/**
 * Función principal
 */
async function main() {
  console.log('🚀 Iniciando descarga de base de datos de Supabase...\n');
  console.log(`📡 Conectado a: ${supabaseUrl}\n`);

  // Crear directorio para los datos en la raíz del proyecto
  const projectRoot = path.resolve(__dirname, '..');
  const outputDir = path.join(projectRoot, 'backup_supabase');
  const datosDir = path.join(outputDir, 'datos');
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  if (!fs.existsSync(datosDir)) {
    fs.mkdirSync(datosDir, { recursive: true });
  }

  // 1. Descargar esquema
  console.log('📋 Paso 1: Descargando estructura de la base de datos...');
  const esquema = await obtenerEsquemaSQL();
  if (esquema) {
    const esquemaPath = path.join(outputDir, 'esquema.sql');
    fs.writeFileSync(esquemaPath, esquema, 'utf8');
    console.log(`  ✅ Esquema guardado en: ${esquemaPath}\n`);
  }

  // 2. Descargar datos de todas las tablas
  console.log('📊 Paso 2: Descargando datos de las tablas...\n');
  const datosCompletos = {};
  const resumen = {
    tablas_existentes: 0,
    tablas_no_encontradas: [],
    total_registros: 0,
    fecha_backup: new Date().toISOString()
  };

  for (const tabla of TABLAS) {
    const datos = await descargarDatosTabla(tabla);
    
    if (datos !== null) {
      datosCompletos[tabla] = datos;
      resumen.tablas_existentes++;
      resumen.total_registros += datos.length;
      
      // Guardar datos individuales de cada tabla
      const tablaPath = path.join(datosDir, `${tabla}.json`);
      fs.writeFileSync(tablaPath, JSON.stringify(datos, null, 2), 'utf8');
    } else {
      resumen.tablas_no_encontradas.push(tabla);
    }
  }

  // 3. Guardar datos completos en un solo archivo
  console.log('\n💾 Guardando datos completos...');
  const datosCompletosPath = path.join(outputDir, 'datos_completos.json');
  fs.writeFileSync(datosCompletosPath, JSON.stringify(datosCompletos, null, 2), 'utf8');
  console.log(`  ✅ Datos completos guardados en: ${datosCompletosPath}`);

  // 4. Guardar resumen
  const resumenPath = path.join(outputDir, 'resumen_backup.json');
  fs.writeFileSync(resumenPath, JSON.stringify(resumen, null, 2), 'utf8');
  console.log(`  ✅ Resumen guardado en: ${resumenPath}\n`);

  // 5. Mostrar resumen
  console.log('═══════════════════════════════════════════════════════');
  console.log('📊 RESUMEN DEL BACKUP');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`✅ Tablas descargadas: ${resumen.tablas_existentes}`);
  console.log(`📦 Total de registros: ${resumen.total_registros}`);
  console.log(`❌ Tablas no encontradas: ${resumen.tablas_no_encontradas.length}`);
  if (resumen.tablas_no_encontradas.length > 0) {
    console.log(`   ${resumen.tablas_no_encontradas.join(', ')}`);
  }
  console.log(`📁 Ubicación: ${outputDir}`);
  console.log(`📅 Fecha: ${resumen.fecha_backup}`);
  console.log('═══════════════════════════════════════════════════════\n');

  console.log('✅ ¡Backup completado exitosamente!');
}

// Ejecutar
main().catch(err => {
  console.error('❌ Error fatal:', err);
  process.exit(1);
});

