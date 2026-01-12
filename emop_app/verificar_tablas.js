/**
 * Script de Verificación de Tablas en Supabase
 * 
 * Este script verifica si las tablas necesarias existen en Supabase
 * antes de intentar migrar los datos.
 * 
 * Uso:
 *   node verificar_tablas.js
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://weberwavolitwvmjfhap.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_LDZn81mde7XPA-qb-AMhVQ_bQ2DBa98';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Faltan variables de entorno');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Lista de tablas que deben existir
const requiredTables = [
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
  'auditoria'
];

async function verificarTablas() {
  console.log('🔍 Verificando tablas en Supabase...\n');
  console.log(`📡 Conectando a: ${SUPABASE_URL}\n`);

  const resultados = {
    existentes: [],
    faltantes: [],
    errores: []
  };

  for (const tableName of requiredTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('count')
        .limit(1);

      if (error) {
        if (error.code === 'PGRST205' || error.message.includes('does not exist') || error.message.includes('schema cache')) {
          resultados.faltantes.push(tableName);
          console.log(`❌ ${tableName}: NO EXISTE`);
        } else {
          resultados.errores.push({ table: tableName, error: error.message });
          console.log(`⚠️  ${tableName}: Error - ${error.message}`);
        }
      } else {
        resultados.existentes.push(tableName);
        console.log(`✅ ${tableName}: Existe`);
      }
    } catch (err) {
      resultados.errores.push({ table: tableName, error: err.message });
      console.log(`⚠️  ${tableName}: Error - ${err.message}`);
    }
  }

  // Resumen
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN DE VERIFICACIÓN');
  console.log('='.repeat(60));
  console.log(`✅ Tablas existentes: ${resultados.existentes.length}/${requiredTables.length}`);
  console.log(`❌ Tablas faltantes: ${resultados.faltantes.length}`);
  console.log(`⚠️  Errores: ${resultados.errores.length}`);

  if (resultados.faltantes.length > 0) {
    console.log('\n❌ TABLAS FALTANTES:');
    resultados.faltantes.forEach(table => {
      console.log(`   - ${table}`);
    });
    console.log('\n📝 ACCIÓN REQUERIDA:');
    console.log('   1. Ve a Supabase Dashboard → SQL Editor');
    console.log('   2. Abre el archivo supabase_schema.sql');
    console.log('   3. Copia TODO el contenido');
    console.log('   4. Pégalo en el SQL Editor y ejecútalo (Run)');
    console.log('   5. Luego vuelve a ejecutar este script para verificar\n');
    process.exit(1);
  }

  if (resultados.errores.length > 0) {
    console.log('\n⚠️  ERRORES ENCONTRADOS:');
    resultados.errores.forEach(({ table, error }) => {
      console.log(`   - ${table}: ${error}`);
    });
  }

  if (resultados.faltantes.length === 0 && resultados.errores.length === 0) {
    console.log('\n🎉 ¡Todas las tablas existen! Puedes proceder con la migración de datos.');
    console.log('   Ejecuta: npm run migrate:supabase\n');
  }
}

verificarTablas().catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
