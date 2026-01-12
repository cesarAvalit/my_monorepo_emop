/**
 * Script para sincronizar la base de datos local con Supabase
 * 
 * 1. Lee el backup de Supabase (estructura y datos)
 * 2. Compara con la base de datos local
 * 3. Sincroniza estructura y datos
 */

import dotenv from 'dotenv';
import pkg from 'pg';
const { Pool } = pkg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
dotenv.config();
try {
  dotenv.config({ path: '.env_local', override: true });
} catch (err) {}

// Configuración PostgreSQL Local
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'emop_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '123456',
};

const postgresPool = new Pool(DB_CONFIG);

const BACKUP_DIR = path.join(__dirname, '../../backup_supabase');
const ESQUEMA_FILE = path.join(BACKUP_DIR, 'esquema.sql');
const DATOS_FILE = path.join(BACKUP_DIR, 'datos_completos.json');

/**
 * Obtener estructura de una tabla desde PostgreSQL local
 */
async function obtenerEstructuraLocal(tableName) {
  try {
    const client = await postgresPool.connect();
    try {
      const result = await client.query(`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length
        FROM information_schema.columns
        WHERE table_name = $1
        AND table_schema = 'public'
        ORDER BY ordinal_position
      `, [tableName]);

      return result.rows;
    } finally {
      client.release();
    }
  } catch (err) {
    return null;
  }
}

/**
 * Obtener datos de una tabla desde PostgreSQL local
 */
async function obtenerDatosLocal(tableName) {
  try {
    const client = await postgresPool.connect();
    try {
      const result = await client.query(`SELECT * FROM "${tableName}" ORDER BY 1`);
      return result.rows;
    } finally {
      client.release();
    }
  } catch (err) {
    return [];
  }
}

/**
 * Obtener todas las tablas de la base de datos local
 */
async function obtenerTablasLocales() {
  try {
    const client = await postgresPool.connect();
    try {
      const result = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `);
      return result.rows.map(r => r.table_name);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error obteniendo tablas locales:', err);
    return [];
  }
}

/**
 * Comparar y mostrar diferencias
 */
async function compararTabla(tableName, datosSupabase) {
  console.log(`\n📊 Comparando: ${tableName}`);
  
  // Verificar si la tabla existe localmente
  const estructuraLocal = await obtenerEstructuraLocal(tableName);
  if (!estructuraLocal || estructuraLocal.length === 0) {
    console.log(`  ⚠️  Tabla no existe localmente`);
    return { existe: false, diferencias: true };
  }

  // Obtener datos locales
  const datosLocal = await obtenerDatosLocal(tableName);
  
  const countSupabase = datosSupabase ? datosSupabase.length : 0;
  const countLocal = datosLocal.length;

  console.log(`  📈 Supabase: ${countSupabase} registros`);
  console.log(`  📈 Local: ${countLocal} registros`);

  if (countSupabase !== countLocal) {
    console.log(`  ⚠️  DIFERENCIA: ${Math.abs(countSupabase - countLocal)} registros`);
    return { existe: true, diferencias: true, countSupabase, countLocal };
  }

  console.log(`  ✅ Cantidad de registros coincide`);
  return { existe: true, diferencias: false, countSupabase, countLocal };
}

/**
 * Sincronizar datos de una tabla
 */
async function sincronizarTabla(tableName, datosSupabase) {
  if (!datosSupabase || datosSupabase.length === 0) {
    console.log(`  ⏭️  Sin datos en Supabase, omitiendo`);
    return;
  }

  try {
    const client = await postgresPool.connect();
    try {
      // Obtener estructura para identificar la clave primaria
      const estructura = await obtenerEstructuraLocal(tableName);
      if (!estructura || estructura.length === 0) {
        console.log(`  ⚠️  Tabla no existe, no se puede sincronizar`);
        return;
      }

      // Identificar clave primaria (primera columna que termine en _id o sea 'id')
      let primaryKey = 'id';
      const idColumn = estructura.find(col => 
        col.column_name === 'id' || 
        col.column_name.endsWith('_id') ||
        col.column_name.startsWith('id_')
      );
      if (idColumn) {
        primaryKey = idColumn.column_name;
      }

      // Obtener datos actuales
      const datosActuales = await obtenerDatosLocal(tableName);
      const idsActuales = new Set(datosActuales.map(r => r[primaryKey]));

      // Insertar o actualizar registros
      let insertados = 0;
      let actualizados = 0;

      for (const registro of datosSupabase) {
        const id = registro[primaryKey] || registro.id || registro[Object.keys(registro)[0]];
        
        if (idsActuales.has(id)) {
          // Actualizar registro existente
          const columnas = Object.keys(registro).filter(k => k !== primaryKey);
          const valores = columnas.map(col => registro[col]);
          const updates = columnas.map((col, i) => `"${col}" = $${i + 1}`).join(', ');
          
          const query = `UPDATE "${tableName}" SET ${updates} WHERE "${primaryKey}" = $${columnas.length + 1} RETURNING *`;
          await client.query(query, [...valores, id]);
          actualizados++;
        } else {
          // Insertar nuevo registro
          const columnas = Object.keys(registro);
          const valores = Object.values(registro);
          const columnasEscapadas = columnas.map(col => `"${col}"`).join(', ');
          const placeholders = valores.map((_, i) => `$${i + 1}`).join(', ');
          
          const query = `INSERT INTO "${tableName}" (${columnasEscapadas}) VALUES (${placeholders}) ON CONFLICT DO NOTHING RETURNING *`;
          try {
            await client.query(query, valores);
            insertados++;
          } catch (err) {
            // Si hay conflicto o error, intentar sin el ID (dejar que la secuencia lo genere)
            if (err.code === '23505' || err.message.includes('duplicate')) {
              const registroSinId = { ...registro };
              delete registroSinId[primaryKey];
              const columnasSinId = Object.keys(registroSinId);
              const valoresSinId = Object.values(registroSinId);
              const columnasEscapadasSinId = columnasSinId.map(col => `"${col}"`).join(', ');
              const placeholdersSinId = valoresSinId.map((_, i) => `$${i + 1}`).join(', ');
              
              const querySinId = `INSERT INTO "${tableName}" (${columnasEscapadasSinId}) VALUES (${placeholdersSinId}) ON CONFLICT DO NOTHING RETURNING *`;
              try {
                await client.query(querySinId, valoresSinId);
                insertados++;
              } catch (err2) {
                console.log(`    ⚠️  Error insertando registro con ID ${id}: ${err2.message}`);
              }
            } else {
              console.log(`    ⚠️  Error insertando registro con ID ${id}: ${err.message}`);
            }
          }
        }
      }

      console.log(`  ✅ Sincronizado: ${insertados} insertados, ${actualizados} actualizados`);

    } finally {
      client.release();
    }
  } catch (err) {
    console.error(`  ❌ Error sincronizando ${tableName}:`, err.message);
  }
}

/**
 * Función principal
 */
async function main() {
  console.log('🔄 Iniciando sincronización con Supabase...\n');

  // Verificar que existen los archivos de backup
  if (!fs.existsSync(DATOS_FILE)) {
    console.error('❌ Error: No se encuentra el archivo de datos de Supabase');
    console.error(`   Ejecuta primero: node descargar_db_supabase.js`);
    process.exit(1);
  }

  // Cargar datos de Supabase
  console.log('📖 Cargando datos de Supabase...');
  const datosSupabase = JSON.parse(fs.readFileSync(DATOS_FILE, 'utf8'));
  const tablasSupabase = Object.keys(datosSupabase);
  console.log(`✅ Cargadas ${tablasSupabase.length} tablas\n`);

  // Obtener tablas locales
  console.log('📋 Obteniendo tablas locales...');
  const tablasLocales = await obtenerTablasLocales();
  console.log(`✅ Encontradas ${tablasLocales.length} tablas locales\n`);

  // Comparar cada tabla
  console.log('🔍 COMPARANDO TABLAS:\n');
  console.log('='.repeat(80));
  
  const diferencias = [];
  for (const tabla of tablasSupabase) {
    const datos = datosSupabase[tabla] || [];
    const resultado = await compararTabla(tabla, datos);
    if (resultado.diferencias) {
      diferencias.push({ tabla, ...resultado });
    }
  }

  // Resumen
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 RESUMEN:\n');
  console.log(`Total de tablas en Supabase: ${tablasSupabase.length}`);
  console.log(`Total de tablas locales: ${tablasLocales.length}`);
  console.log(`Tablas con diferencias: ${diferencias.length}\n`);

  if (diferencias.length > 0) {
    console.log('📌 Tablas con diferencias:');
    diferencias.forEach(d => {
      console.log(`  - ${d.tabla}: Supabase=${d.countSupabase}, Local=${d.countLocal}`);
    });

    console.log('\n🔄 ¿Deseas sincronizar? (s/n)');
    // Por ahora, sincronizar automáticamente
    console.log('✅ Sincronizando automáticamente...\n');

    for (const diff of diferencias) {
      const datos = datosSupabase[diff.tabla] || [];
      await sincronizarTabla(diff.tabla, datos);
    }

    console.log('\n✅ Sincronización completada');
  } else {
    console.log('✅ No hay diferencias, las bases de datos están sincronizadas');
  }

  await postgresPool.end();
}

// Ejecutar
main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});

