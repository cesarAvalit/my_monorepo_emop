/**
 * Script de Migración de Datos desde db.json a Supabase
 * 
 * Uso:
 *   node migrate_to_supabase.js
 * 
 * Requisitos:
 *   - npm install @supabase/supabase-js dotenv
 *   - Configurar variables de entorno en .env
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

config(); // Cargar variables de entorno

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuración de Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://weberwavolitwvmjfhap.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_LDZn81mde7XPA-qb-AMhVQ_bQ2DBa98';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Faltan variables de entorno');
  console.error('   NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridas');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Leer db.json
const dbPath = join(__dirname, 'db.json');
const dbData = JSON.parse(readFileSync(dbPath, 'utf8'));

// Orden de migración (respetando dependencias)
const migrationOrder = [
  'empresa',
  'rol',
  'usuario',
  'conductor',
  'vehiculo',
  'tipo_mantenimiento',
  'orden_trabajo',
  'mecanico',
  'orden_x_mecanico',
  'insumo_catalogo',
  'detalle_insumo',
  'linea_servicio',
  'rto_registro',
  'orden_x_usuario',
  'auditoria',
  // Tablas adicionales
  'users',
  'roles',
  'companies'
];

// Estadísticas
const stats = {
  total: 0,
  success: 0,
  errors: 0,
  details: {}
};

/**
 * Migra una tabla específica
 */
async function migrateTable(tableName, data) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    console.log(`⏭️  Tabla ${tableName}: Sin datos para migrar`);
    return;
  }

  console.log(`\n📦 Migrando tabla: ${tableName} (${data.length} registros)...`);

  stats.total += data.length;
  stats.details[tableName] = { total: data.length, success: 0, errors: 0 };

  try {
    // Limpiar datos antes de insertar (remover campos undefined/null problemáticos)
    const cleanedData = data.map(record => {
      const cleaned = {};
      for (const [key, value] of Object.entries(record)) {
        // Solo incluir campos que no sean undefined
        if (value !== undefined) {
          cleaned[key] = value;
        }
      }
      // Remover campo 'id' si existe y la tabla no lo usa como PK
      // (algunas tablas usan id_usuario, id_vehiculo, etc. como PK)
      if (tableName === 'usuario' && cleaned.id !== undefined) {
        delete cleaned.id;
      }
      return cleaned;
    });

    // Determinar la clave primaria para UPSERT
    let primaryKey = 'id';
    if (tableName === 'empresa') primaryKey = 'id_empresa';
    else if (tableName === 'rol') primaryKey = 'id_rol';
    else if (tableName === 'usuario') primaryKey = 'id_usuario';
    else if (tableName === 'conductor') primaryKey = 'id_conductor';
    else if (tableName === 'vehiculo') primaryKey = 'id_vehiculo';
    else if (tableName === 'tipo_mantenimiento') primaryKey = 'id_tipo';
    else if (tableName === 'orden_trabajo') primaryKey = 'id_orden';
    else if (tableName === 'mecanico') primaryKey = 'id_mecanico';
    else if (tableName === 'insumo_catalogo') primaryKey = 'id_insumo';
    else if (tableName === 'detalle_insumo') primaryKey = 'id_detalle';
    else if (tableName === 'linea_servicio') primaryKey = 'id_linea_servicio';
    else if (tableName === 'rto_registro') primaryKey = 'id_rto';
    else if (tableName === 'orden_x_usuario') primaryKey = 'id';
    else if (tableName === 'auditoria') primaryKey = 'id_auditoria';

    // Insertar en lotes de 1000 (límite de Supabase)
    const batchSize = 1000;
    for (let i = 0; i < cleanedData.length; i += batchSize) {
      const batch = cleanedData.slice(i, i + batchSize);
      
      // Usar UPSERT para evitar duplicados
      const { data: insertedData, error } = await supabase
        .from(tableName)
        .upsert(batch, { 
          onConflict: primaryKey,
          ignoreDuplicates: false 
        })
        .select();

      if (error) {
        console.error(`❌ Error en lote ${Math.floor(i / batchSize) + 1} de ${tableName}:`, error.message);
        // Intentar insertar uno por uno para identificar el problema
        if (batch.length > 1) {
          console.log(`   🔍 Intentando insertar registros individualmente...`);
          let individualSuccess = 0;
          for (const record of batch) {
            const { error: singleError } = await supabase
              .from(tableName)
              .insert(record)
              .select();
            if (!singleError) {
              individualSuccess++;
            } else {
              console.error(`   ⚠️  Error en registro individual:`, singleError.message.substring(0, 100));
            }
          }
          stats.success += individualSuccess;
          stats.details[tableName].success += individualSuccess;
          stats.errors += (batch.length - individualSuccess);
          stats.details[tableName].errors += (batch.length - individualSuccess);
        } else {
          stats.errors += batch.length;
          stats.details[tableName].errors += batch.length;
        }
      } else {
        const inserted = insertedData ? insertedData.length : 0;
        console.log(`   ✅ Lote ${Math.floor(i / batchSize) + 1}: ${inserted} registros insertados`);
        stats.success += inserted;
        stats.details[tableName].success += inserted;
      }
    }

    console.log(`✅ Tabla ${tableName}: ${stats.details[tableName].success}/${stats.details[tableName].total} registros migrados`);
  } catch (error) {
    console.error(`❌ Error crítico en tabla ${tableName}:`, error);
    stats.errors += data.length;
    stats.details[tableName].errors += data.length;
  }
}

/**
 * Función principal de migración
 */
async function migrate() {
  console.log('🚀 Iniciando migración a Supabase...\n');
  console.log(`📡 Conectando a: ${SUPABASE_URL}\n`);

  // Verificar conexión y existencia de tablas
  console.log('🔍 Verificando conexión y tablas...\n');
  
  const { data: testData, error: testError } = await supabase
    .from('empresa')
    .select('count')
    .limit(1);
  
  if (testError) {
    if (testError.code === 'PGRST205' || testError.message.includes('does not exist') || testError.message.includes('schema cache')) {
      console.error('❌ ERROR: Las tablas no existen en Supabase.');
      console.error('   Por favor, ejecuta primero el script SQL en Supabase Dashboard:');
      console.error('   1. Ve a Supabase Dashboard → SQL Editor');
      console.error('   2. Abre el archivo supabase_schema.sql');
      console.error('   3. Copia TODO el contenido y ejecútalo');
      console.error('   4. Luego vuelve a ejecutar este script\n');
      process.exit(1);
    } else {
      console.error('❌ Error de conexión:', testError);
      process.exit(1);
    }
  }
  
  console.log('✅ Conexión exitosa y tablas encontradas\n');

  // Migrar tablas en orden
  for (const tableName of migrationOrder) {
    if (dbData[tableName]) {
      await migrateTable(tableName, dbData[tableName]);
    } else {
      console.log(`⏭️  Tabla ${tableName}: No existe en db.json`);
    }
  }

  // Mostrar resumen
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN DE MIGRACIÓN');
  console.log('='.repeat(60));
  console.log(`Total de registros procesados: ${stats.total}`);
  console.log(`✅ Exitosos: ${stats.success}`);
  console.log(`❌ Errores: ${stats.errors}`);
  console.log('\n📋 Detalle por tabla:');
  
  for (const [table, detail] of Object.entries(stats.details)) {
    const status = detail.errors === 0 ? '✅' : '⚠️';
    console.log(`   ${status} ${table}: ${detail.success}/${detail.total} (${detail.errors} errores)`);
  }

  console.log('\n' + '='.repeat(60));
  
  if (stats.errors === 0) {
    console.log('🎉 ¡Migración completada exitosamente!');
  } else {
    console.log('⚠️  Migración completada con algunos errores. Revisa los detalles arriba.');
  }
}

// Ejecutar migración
migrate().catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
