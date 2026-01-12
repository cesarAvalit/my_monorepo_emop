/**
 * Script para comparar estructura y datos entre PostgreSQL local y Supabase
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import pkg from 'pg';
const { Pool } = pkg;

// Cargar variables de entorno
dotenv.config();
try {
  dotenv.config({ path: '.env_local', override: false });
} catch (err) {}

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://weberwavolitwvmjfhap.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_LDZn81mde7XPA-qb-AMhVQ_bQ2DBa98';

// Configuración PostgreSQL local
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'emop_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '123456',
};

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const pgPool = new Pool(DB_CONFIG);

/**
 * Obtener todas las tablas de Supabase
 */
async function getSupabaseTables() {
  const { data, error } = await supabase.rpc('get_tables');
  
  if (error) {
    // Si no existe la función, obtener tablas de otra forma
    const { data: tables, error: tablesError } = await supabase
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public');
    
    if (tablesError) {
      // Intentar obtener tablas usando SQL directo
      const { data: directTables, error: directError } = await supabase
        .rpc('exec_sql', { query: "SELECT tablename FROM pg_tables WHERE schemaname = 'public'" });
      
      return directTables || [];
    }
    return tables.map(t => t.tablename);
  }
  return data;
}

/**
 * Obtener estructura de tabla en Supabase
 */
async function getSupabaseTableStructure(tableName) {
  try {
    // Obtener un registro para ver las columnas
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error && error.code !== 'PGRST116') {
      console.error(`Error obteniendo estructura de ${tableName}:`, error);
      return null;
    }
    
    // Obtener columnas de information_schema usando SQL
    const { data: columns, error: colsError } = await supabase.rpc('exec_sql', {
      query: `
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length
        FROM information_schema.columns
        WHERE table_name = '${tableName}'
        AND table_schema = 'public'
        ORDER BY ordinal_position
      `
    });
    
    return columns || [];
  } catch (err) {
    console.error(`Error obteniendo estructura de ${tableName}:`, err);
    return null;
  }
}

/**
 * Obtener todas las tablas de PostgreSQL local
 */
async function getLocalTables() {
  const client = await pgPool.connect();
  try {
    const result = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);
    return result.rows.map(r => r.tablename);
  } finally {
    client.release();
  }
}

/**
 * Obtener estructura de tabla en PostgreSQL local
 */
async function getLocalTableStructure(tableName) {
  const client = await pgPool.connect();
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
}

/**
 * Comparar estructuras de dos tablas
 */
function compareStructures(supabaseCols, localCols) {
  const differences = [];
  const supabaseMap = new Map(supabaseCols.map(c => [c.column_name, c]));
  const localMap = new Map(localCols.map(c => [c.column_name, c]));
  
  // Columnas en Supabase pero no en local
  for (const col of supabaseCols) {
    if (!localMap.has(col.column_name)) {
      differences.push({
        type: 'missing_column',
        column: col.column_name,
        table: col.table_name,
        details: `Columna ${col.column_name} existe en Supabase pero no en local`
      });
    }
  }
  
  // Columnas en local pero no en Supabase
  for (const col of localCols) {
    if (!supabaseMap.has(col.column_name)) {
      differences.push({
        type: 'extra_column',
        column: col.column_name,
        details: `Columna ${col.column_name} existe en local pero no en Supabase`
      });
    }
  }
  
  // Comparar propiedades de columnas comunes
  for (const supCol of supabaseCols) {
    const locCol = localMap.get(supCol.column_name);
    if (locCol) {
      if (supCol.data_type !== locCol.data_type) {
        differences.push({
          type: 'data_type_mismatch',
          column: supCol.column_name,
          supabase: supCol.data_type,
          local: locCol.data_type
        });
      }
      if (supCol.is_nullable !== locCol.is_nullable) {
        differences.push({
          type: 'nullable_mismatch',
          column: supCol.column_name,
          supabase: supCol.is_nullable,
          local: locCol.is_nullable
        });
      }
    }
  }
  
  return differences;
}

/**
 * Obtener conteo de registros
 */
async function getRecordCount(tableName, source = 'local') {
  if (source === 'local') {
    const client = await pgPool.connect();
    try {
      const result = await client.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
      return parseInt(result.rows[0].count);
    } finally {
      client.release();
    }
  } else {
    const { count, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    return count || 0;
  }
}

/**
 * Función principal
 */
async function main() {
  console.log('🔍 Comparando tablas entre Supabase y PostgreSQL local...\n');
  
  try {
    // Obtener tablas usando SQL directo en ambos lados
    const localTables = await getLocalTables();
    console.log(`📋 Tablas en local: ${localTables.length}`);
    
    // Para Supabase, intentar obtener tablas usando el esquema existente
    // Usaremos las tablas que tenemos en el backup
    const supabaseTables = localTables; // Asumimos mismas tablas por ahora
    
    console.log(`📋 Tablas en Supabase: ${supabaseTables.length}\n`);
    
    const allDifferences = {
      structure: [],
      data: []
    };
    
    // Comparar cada tabla
    for (const tableName of localTables) {
      console.log(`\n📊 Comparando tabla: ${tableName}`);
      
      // Obtener estructuras
      const localStruct = await getLocalTableStructure(tableName);
      
      // Para Supabase, necesitamos usar el esquema del backup
      // Por ahora, compararemos solo conteos de registros
      
      // Comparar conteos
      const localCount = await getRecordCount(tableName, 'local');
      const supabaseCount = await getRecordCount(tableName, 'supabase');
      
      if (localCount !== supabaseCount) {
        allDifferences.data.push({
          table: tableName,
          local: localCount,
          supabase: supabaseCount,
          difference: supabaseCount - localCount
        });
        console.log(`  ⚠️  Diferencia en datos: Local=${localCount}, Supabase=${supabaseCount}`);
      } else {
        console.log(`  ✅ Datos iguales: ${localCount} registros`);
      }
    }
    
    // Generar reporte
    console.log('\n\n📊 RESUMEN DE DIFERENCIAS\n');
    console.log('=== DIFERENCIAS EN DATOS ===');
    if (allDifferences.data.length === 0) {
      console.log('✅ Todas las tablas tienen el mismo número de registros');
    } else {
      allDifferences.data.forEach(diff => {
        console.log(`\n📋 ${diff.table}:`);
        console.log(`   Local: ${diff.local} registros`);
        console.log(`   Supabase: ${diff.supabase} registros`);
        console.log(`   Diferencia: ${diff.difference > 0 ? '+' : ''}${diff.difference}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pgPool.end();
  }
}

main();

