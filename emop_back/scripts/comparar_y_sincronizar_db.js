/**
 * Script para comparar y sincronizar la base de datos local con Supabase
 * 
 * 1. Descarga estructura y datos de Supabase
 * 2. Compara con la base de datos local
 * 3. Sincroniza estructura y datos
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
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

// Configuración Supabase
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://weberwavolitwvmjfhap.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_LDZn81mde7XPA-qb-AMhVQ_bQ2DBa98';

// Configuración PostgreSQL Local
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'emop_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '123456',
};

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const postgresPool = new Pool(DB_CONFIG);

// Tablas a comparar (excluyendo tablas del sistema)
const TABLAS_EXCLUIDAS = ['pgmigrations', 'schema_migrations', '_prisma_migrations'];

/**
 * Obtener lista de tablas de Supabase
 */
async function obtenerTablasSupabase() {
  try {
    // Obtener todas las tablas consultando information_schema desde Supabase
    const { data, error } = await supabase.rpc('exec_sql', {
      query: `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name;
      `
    }).catch(() => {
      // Si no funciona el RPC, usar método alternativo
      return { data: null, error: 'RPC no disponible' };
    });

    if (error || !data) {
      // Método alternativo: intentar obtener datos de tablas conocidas
      console.log('⚠️  No se puede obtener lista de tablas automáticamente, usando lista conocida');
      return [
        'auditoria', 'companies', 'conductor', 'declaracion_jurada', 'ddjj_x_usuario',
        'detalle_insumo', 'empresa', 'inspeccion_ddjj', 'insumo_catalogo', 'linea_servicio',
        'mecanico', 'notificaciones', 'orden_trabajo', 'orden_x_mecanico', 'orden_x_usuario',
        'reporte_auditoria_ddjj', 'rol', 'roles', 'rto_registro', 'tipo_mantenimiento',
        'tipo_notificacion', 'tipo_seguro', 'tipo_servicio', 'usuario', 'users', 'vehiculo'
      ];
    }

    return data.map(row => row.table_name).filter(t => !TABLAS_EXCLUIDAS.includes(t));
  } catch (err) {
    console.error('Error obteniendo tablas de Supabase:', err);
    return [];
  }
}

/**
 * Obtener estructura de una tabla desde Supabase
 */
async function obtenerEstructuraSupabase(tableName) {
  try {
    // Obtener estructura usando una consulta directa
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(0);

    if (error) {
      console.error(`Error obteniendo estructura de ${tableName} desde Supabase:`, error);
      return null;
    }

    // Obtener columnas usando una consulta SQL directa si es posible
    // Por ahora, usamos el método de obtener un registro vacío
    return { exists: true };
  } catch (err) {
    console.error(`Error en obtenerEstructuraSupabase para ${tableName}:`, err);
    return null;
  }
}

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
    console.error(`Error obteniendo estructura local de ${tableName}:`, err);
    return null;
  }
}

/**
 * Obtener datos de una tabla desde Supabase
 */
async function obtenerDatosSupabase(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error(`Error obteniendo datos de ${tableName} desde Supabase:`, error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error(`Error en obtenerDatosSupabase para ${tableName}:`, err);
    return [];
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
    console.error(`Error obteniendo datos locales de ${tableName}:`, err);
    return [];
  }
}

/**
 * Comparar y sincronizar una tabla
 */
async function compararYSincronizarTabla(tableName) {
  console.log(`\n📊 Comparando tabla: ${tableName}`);
  
  // Obtener estructuras
  const estructuraLocal = await obtenerEstructuraLocal(tableName);
  const estructuraSupabase = await obtenerEstructuraSupabase(tableName);

  if (!estructuraLocal || estructuraLocal.length === 0) {
    console.log(`  ⚠️  Tabla ${tableName} no existe localmente`);
    return;
  }

  // Obtener datos
  const datosSupabase = await obtenerDatosSupabase(tableName);
  const datosLocal = await obtenerDatosLocal(tableName);

  console.log(`  📈 Supabase: ${datosSupabase.length} registros`);
  console.log(`  📈 Local: ${datosLocal.length} registros`);

  if (datosSupabase.length !== datosLocal.length) {
    console.log(`  ⚠️  Diferencia en cantidad de registros`);
  }

  // Comparar datos (simplificado - comparar por ID)
  const idsSupabase = new Set(datosSupabase.map(r => r.id || r[Object.keys(r)[0]]));
  const idsLocal = new Set(datosLocal.map(r => r.id || r[Object.keys(r)[0]]));

  const faltantesEnLocal = datosSupabase.filter(r => {
    const id = r.id || r[Object.keys(r)[0]];
    return !idsLocal.has(id);
  });

  const sobrantesEnLocal = datosLocal.filter(r => {
    const id = r.id || r[Object.keys(r)[0]];
    return !idsSupabase.has(id);
  });

  if (faltantesEnLocal.length > 0) {
    console.log(`  ⚠️  Faltan ${faltantesEnLocal.length} registros en local`);
  }

  if (sobrantesEnLocal.length > 0) {
    console.log(`  ⚠️  Sobran ${sobrantesEnLocal.length} registros en local`);
  }

  return {
    tableName,
    estructuraLocal,
    estructuraSupabase,
    datosSupabase,
    datosLocal,
    faltantesEnLocal,
    sobrantesEnLocal,
    diferencias: {
      cantidad: datosSupabase.length !== datosLocal.length,
      faltantes: faltantesEnLocal.length,
      sobrantes: sobrantesEnLocal.length
    }
  };
}

/**
 * Función principal
 */
async function main() {
  console.log('🔄 Iniciando comparación y sincronización...\n');

  try {
    // Obtener lista de tablas
    console.log('📋 Obteniendo lista de tablas...');
    const tablas = await obtenerTablasSupabase();
    console.log(`✅ Encontradas ${tablas.length} tablas\n`);

    // Comparar cada tabla
    const resultados = [];
    for (const tabla of tablas) {
      try {
        const resultado = await compararYSincronizarTabla(tabla);
        if (resultado) {
          resultados.push(resultado);
        }
      } catch (err) {
        console.error(`❌ Error procesando tabla ${tabla}:`, err.message);
      }
    }

    // Resumen
    console.log('\n📊 RESUMEN DE COMPARACIÓN:\n');
    console.log('='.repeat(80));
    
    let totalDiferencias = 0;
    resultados.forEach(r => {
      if (r.diferencias.cantidad || r.diferencias.faltantes || r.diferencias.sobrantes) {
        totalDiferencias++;
        console.log(`\n📌 ${r.tableName}:`);
        console.log(`   Supabase: ${r.datosSupabase.length} registros`);
        console.log(`   Local: ${r.datosLocal.length} registros`);
        if (r.diferencias.faltantes > 0) {
          console.log(`   ⚠️  Faltan ${r.diferencias.faltantes} registros en local`);
        }
        if (r.diferencias.sobrantes > 0) {
          console.log(`   ⚠️  Sobran ${r.diferencias.sobrantes} registros en local`);
        }
      }
    });

    console.log('\n' + '='.repeat(80));
    console.log(`\n✅ Comparación completada`);
    console.log(`📊 Tablas con diferencias: ${totalDiferencias} de ${resultados.length}`);

    if (totalDiferencias > 0) {
      console.log('\n💡 Para sincronizar, ejecuta:');
      console.log('   node scripts/sincronizar_desde_supabase.js');
    }

  } catch (err) {
    console.error('❌ Error en la comparación:', err);
  } finally {
    await postgresPool.end();
  }
}

// Ejecutar
main().catch(console.error);

