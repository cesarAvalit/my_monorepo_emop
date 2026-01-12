/**
 * Script para comparar estructuras de tablas entre Supabase y PostgreSQL local
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
          character_maximum_length,
          numeric_precision,
          numeric_scale
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
 * Extraer estructura de tabla desde esquema.sql
 */
function obtenerEstructuraDesdeEsquema(tableName) {
  if (!fs.existsSync(ESQUEMA_FILE)) {
    return null;
  }

  const esquema = fs.readFileSync(ESQUEMA_FILE, 'utf8');
  const lines = esquema.split('\n');
  
  let enTabla = false;
  const columnas = [];
  let currentColumn = null;

  for (const line of lines) {
    const trimmed = line.trim();
    
    // Buscar inicio de tabla
    if (trimmed.toUpperCase().includes(`CREATE TABLE ${tableName}`) || 
        trimmed.toUpperCase().includes(`CREATE TABLE IF NOT EXISTS ${tableName}`)) {
      enTabla = true;
      continue;
    }

    if (enTabla) {
      // Fin de tabla
      if (trimmed.startsWith(')') || trimmed.startsWith(');')) {
        break;
      }

      // Línea de columna
      if (trimmed && !trimmed.startsWith('--') && !trimmed.startsWith('CONSTRAINT') && !trimmed.startsWith('PRIMARY KEY')) {
        // Extraer nombre de columna y tipo
        const match = trimmed.match(/^"?(\w+)"?\s+(\w+(?:\([^)]+\))?)/);
        if (match) {
          const colName = match[1];
          const colType = match[2];
          const nullable = !trimmed.includes('NOT NULL');
          const defaultMatch = trimmed.match(/DEFAULT\s+([^,\s)]+)/i);
          const defaultVal = defaultMatch ? defaultMatch[1] : null;

          columnas.push({
            column_name: colName,
            data_type: colType,
            is_nullable: nullable ? 'YES' : 'NO',
            column_default: defaultVal
          });
        }
      }
    }
  }

  return columnas.length > 0 ? columnas : null;
}

/**
 * Comparar estructuras
 */
function compararEstructuras(estructuraLocal, estructuraSupabase, tableName) {
  const diferencias = [];

  const columnasLocal = new Map(estructuraLocal.map(col => [col.column_name, col]));
  const columnasSupabase = new Map(estructuraSupabase.map(col => [col.column_name, col]));

  // Columnas en Supabase pero no en local
  for (const [name, col] of columnasSupabase) {
    if (!columnasLocal.has(name)) {
      diferencias.push({
        tipo: 'faltante_local',
        columna: name,
        detalles: `Falta en local: ${col.data_type}`
      });
    }
  }

  // Columnas en local pero no en Supabase
  for (const [name, col] of columnasLocal) {
    if (!columnasSupabase.has(name)) {
      diferencias.push({
        tipo: 'sobrante_local',
        columna: name,
        detalles: `Sobra en local: ${col.data_type}`
      });
    }
  }

  // Comparar columnas comunes
  for (const [name, colLocal] of columnasLocal) {
    if (columnasSupabase.has(name)) {
      const colSupabase = columnasSupabase.get(name);
      
      // Comparar tipo de dato
      if (colLocal.data_type !== colSupabase.data_type) {
        diferencias.push({
          tipo: 'tipo_diferente',
          columna: name,
          detalles: `Local: ${colLocal.data_type}, Supabase: ${colSupabase.data_type}`
        });
      }

      // Comparar nullable
      if (colLocal.is_nullable !== colSupabase.is_nullable) {
        diferencias.push({
          tipo: 'nullable_diferente',
          columna: name,
          detalles: `Local: ${colLocal.is_nullable}, Supabase: ${colSupabase.is_nullable}`
        });
      }
    }
  }

  return diferencias;
}

/**
 * Función principal
 */
async function main() {
  console.log('🔍 Comparando estructuras de tablas...\n');

  if (!fs.existsSync(ESQUEMA_FILE)) {
    console.error('❌ Error: No se encuentra el archivo de esquema');
    console.error(`   Ejecuta primero: node descargar_db_supabase.js`);
    process.exit(1);
  }

  // Obtener lista de tablas locales
  const client = await postgresPool.connect();
  let tablasLocales;
  try {
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    tablasLocales = result.rows.map(r => r.table_name);
  } finally {
    client.release();
  }

  console.log(`📋 Comparando ${tablasLocales.length} tablas...\n`);
  console.log('='.repeat(80));

  let totalDiferencias = 0;

  for (const tabla of tablasLocales) {
    const estructuraLocal = await obtenerEstructuraLocal(tabla);
    const estructuraSupabase = obtenerEstructuraDesdeEsquema(tabla);

    if (!estructuraLocal) {
      console.log(`\n⚠️  ${tabla}: No se pudo obtener estructura local`);
      continue;
    }

    if (!estructuraSupabase || estructuraSupabase.length === 0) {
      console.log(`\n⚠️  ${tabla}: No se encontró en el esquema de Supabase`);
      continue;
    }

    const diferencias = compararEstructuras(estructuraLocal, estructuraSupabase, tabla);

    if (diferencias.length > 0) {
      totalDiferencias++;
      console.log(`\n📌 ${tabla}: ${diferencias.length} diferencia(s)`);
      diferencias.forEach(diff => {
        console.log(`   - ${diff.tipo}: ${diff.columna} (${diff.detalles})`);
      });
    } else {
      console.log(`\n✅ ${tabla}: Estructura coincide`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log(`\n📊 RESUMEN:`);
  console.log(`Total de tablas: ${tablasLocales.length}`);
  console.log(`Tablas con diferencias: ${totalDiferencias}`);
  console.log(`Tablas sin diferencias: ${tablasLocales.length - totalDiferencias}`);

  await postgresPool.end();
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});

