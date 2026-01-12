/**
 * Script para sincronizar completamente la base de datos local con Supabase
 * 1. Compara estructuras de tablas
 * 2. Descarga todos los datos de Supabase
 * 3. Sincroniza estructura (agrega columnas faltantes)
 * 4. Sincroniza datos (inserta/actualiza registros)
 */

import { createClient } from '@supabase/supabase-js';
import pkg from 'pg';
const { Pool } = pkg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
dotenv.config();
try {
  dotenv.config({ path: path.join(__dirname, '..', '.env_local'), override: false });
} catch (err) {}

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://weberwavolitwvmjfhap.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_LDZn81mde7XPA-qb-AMhVQ_bQ2DBa98';

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'emop_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '123456',
};

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const pgPool = new Pool(DB_CONFIG);

// Lista de tablas (en orden de dependencias)
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
  'tipo_notificacion',
  'notificaciones',
  'declaracion_jurada',
  'inspeccion_ddjj',
  'reporte_auditoria_ddjj',
  'ddjj_x_usuario',
  'tipo_seguro',
  'tipo_servicio',
  'users',
  'roles',
  'companies'
];

/**
 * Obtener todas las tablas de Supabase
 */
async function getSupabaseTables() {
  const tables = [];
  for (const tableName of TABLAS) {
    try {
      const { count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      if (count !== null) {
        tables.push(tableName);
      }
    } catch (err) {
      // Tabla no existe o no es accesible
    }
  }
  return tables;
}

/**
 * Descargar todos los datos de una tabla desde Supabase
 */
async function downloadTableData(tableName) {
  try {
    console.log(`  📥 Descargando datos de ${tableName}...`);
    const { data, error } = await supabase
      .from(tableName)
      .select('*');
    
    if (error) {
      console.error(`    ❌ Error descargando ${tableName}:`, error.message);
      return [];
    }
    
    console.log(`    ✅ ${data.length} registros descargados`);
    return data || [];
  } catch (err) {
    console.error(`    ❌ Error descargando ${tableName}:`, err.message);
    return [];
  }
}

/**
 * Obtener estructura de tabla desde Supabase (usando información del esquema)
 */
async function getSupabaseTableStructure(tableName) {
  // No podemos obtener estructura directamente desde Supabase API
  // Usaremos la estructura del backup si existe
  const backupPath = path.join(__dirname, '..', '..', 'backup_supabase', 'esquema.sql');
  
  if (fs.existsSync(backupPath)) {
    const schema = fs.readFileSync(backupPath, 'utf8');
    // Extraer definición de la tabla (simplificado)
    const tableRegex = new RegExp(`CREATE TABLE\\s+"?${tableName}"?[\\s\\S]*?;`, 'i');
    const match = schema.match(tableRegex);
    if (match) {
      return match[0];
    }
  }
  
  return null;
}

/**
 * Comparar estructuras y agregar columnas faltantes
 */
async function syncTableStructure(tableName, supabaseData) {
  if (supabaseData.length === 0) return;
  
  const client = await pgPool.connect();
  try {
    // Obtener columnas actuales de la tabla local
    const result = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = $1 
      AND table_schema = 'public'
    `, [tableName]);
    
    const localColumns = new Set(result.rows.map(r => r.column_name));
    
    // Obtener columnas de los datos de Supabase
    const supabaseColumns = Object.keys(supabaseData[0]);
    
    // Agregar columnas faltantes
    for (const colName of supabaseColumns) {
      if (!localColumns.has(colName)) {
        console.log(`    ⚠️  Columna ${colName} falta en local, intentando agregar...`);
        // Intentar inferir tipo desde los datos
        const sampleValue = supabaseData.find(row => row[colName] !== null)?.[colName];
        if (sampleValue !== undefined) {
          let dataType = 'TEXT';
          if (typeof sampleValue === 'number') {
            dataType = Number.isInteger(sampleValue) ? 'INTEGER' : 'DECIMAL';
          } else if (sampleValue instanceof Date || typeof sampleValue === 'string' && /^\d{4}-\d{2}-\d{2}/.test(sampleValue)) {
            dataType = 'TIMESTAMP WITH TIME ZONE';
          } else if (typeof sampleValue === 'boolean') {
            dataType = 'BOOLEAN';
          } else if (typeof sampleValue === 'object') {
            dataType = 'JSONB';
          }
          
          try {
            await client.query(`ALTER TABLE "${tableName}" ADD COLUMN "${colName}" ${dataType}`);
            console.log(`    ✅ Columna ${colName} agregada (${dataType})`);
          } catch (err) {
            console.log(`    ⚠️  No se pudo agregar ${colName}: ${err.message}`);
          }
        }
      }
    }
  } finally {
    client.release();
  }
}

/**
 * Sincronizar datos de una tabla
 */
async function syncTableData(tableName, supabaseData) {
  if (supabaseData.length === 0) {
    console.log(`  ℹ️  Tabla ${tableName} sin datos en Supabase`);
    return;
  }
  
  const client = await pgPool.connect();
  try {
    // Obtener clave primaria
    const pkResult = await client.query(`
      SELECT kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = $1
        AND tc.constraint_type = 'PRIMARY KEY'
      LIMIT 1
    `, [tableName]);
    
    const primaryKey = pkResult.rows[0]?.column_name || 'id';
    
    console.log(`  🔄 Sincronizando ${supabaseData.length} registros de ${tableName}...`);
    
    let inserted = 0;
    let updated = 0;
    let errors = 0;
    
    for (const row of supabaseData) {
      try {
        // Verificar si existe
        const checkResult = await client.query(
          `SELECT ${primaryKey} FROM "${tableName}" WHERE "${primaryKey}" = $1`,
          [row[primaryKey]]
        );
        
        // Preparar datos (eliminar columnas que no existen en local)
        const localCols = await client.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = $1 
          AND table_schema = 'public'
        `, [tableName]);
        
        const localColSet = new Set(localCols.rows.map(r => r.column_name));
        const filteredRow = {};
        
        for (const [key, value] of Object.entries(row)) {
          if (localColSet.has(key)) {
            filteredRow[key] = value;
          }
        }
        
        const columns = Object.keys(filteredRow);
        const values = Object.values(filteredRow);
        
        if (checkResult.rows.length === 0) {
          // Insertar
          const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
          const columnsStr = columns.map(c => `"${c}"`).join(', ');
          
          try {
            await client.query(
              `INSERT INTO "${tableName}" (${columnsStr}) VALUES (${placeholders})`,
              values
            );
            inserted++;
          } catch (insertErr) {
            // Si falla por clave duplicada, intentar actualizar
            if (insertErr.code === '23505') {
              const updateColumns = columns.filter(c => c !== primaryKey);
              if (updateColumns.length > 0) {
                const updates = updateColumns.map((c, i) => `"${c}" = $${i + 2}`).join(', ');
                const updateValues = updateColumns.map(c => filteredRow[c]);
                
                await client.query(
                  `UPDATE "${tableName}" SET ${updates} WHERE "${primaryKey}" = $1`,
                  [filteredRow[primaryKey], ...updateValues]
                );
                updated++;
              }
            } else {
              throw insertErr;
            }
          }
        } else {
          // Actualizar
          const updateColumns = columns.filter(c => c !== primaryKey);
          if (updateColumns.length > 0) {
            const updates = updateColumns.map((c, i) => `"${c}" = $${i + 2}`).join(', ');
            const updateValues = updateColumns.map(c => filteredRow[c]);
            
            await client.query(
              `UPDATE "${tableName}" SET ${updates} WHERE "${primaryKey}" = $1`,
              [filteredRow[primaryKey], ...updateValues]
            );
            updated++;
          }
        }
      } catch (err) {
        errors++;
        if (errors <= 3) {
          console.log(`    ⚠️  Error procesando registro: ${err.message}`);
        }
      }
    }
    
    console.log(`    ✅ ${inserted} insertados, ${updated} actualizados${errors > 0 ? `, ${errors} errores` : ''}`);
  } finally {
    client.release();
  }
}

/**
 * Función principal
 */
async function main() {
  console.log('🔄 Sincronizando base de datos local con Supabase...\n');
  
  try {
    // Obtener tablas de Supabase
    console.log('📋 Obteniendo lista de tablas de Supabase...');
    const tables = await getSupabaseTables();
    console.log(`✅ ${tables.length} tablas encontradas\n`);
    
    // Descargar datos y sincronizar cada tabla
    for (const tableName of TABLAS) {
      if (!tables.includes(tableName)) {
        console.log(`\n⏭️  Tabla ${tableName} no existe en Supabase, omitiendo...`);
        continue;
      }
      
      console.log(`\n📊 Procesando tabla: ${tableName}`);
      
      // Descargar datos
      const data = await downloadTableData(tableName);
      
      if (data.length === 0) {
        console.log(`  ℹ️  Tabla ${tableName} sin datos`);
        continue;
      }
      
      // Sincronizar estructura
      await syncTableStructure(tableName, data);
      
      // Sincronizar datos
      await syncTableData(tableName, data);
    }
    
    console.log('\n\n✅ Sincronización completada');
    
    // Mostrar resumen
    console.log('\n📊 RESUMEN FINAL\n');
    const client = await pgPool.connect();
    try {
      for (const tableName of TABLAS) {
        const result = await client.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
        const supabaseCount = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true })
          .then(r => r.count || 0);
        
        const localCount = parseInt(result.rows[0].count);
        const status = localCount === supabaseCount ? '✅' : '⚠️';
        console.log(`${status} ${tableName}: Local=${localCount}, Supabase=${supabaseCount}`);
      }
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pgPool.end();
  }
}

main();

