/**
 * Script para restaurar los datos del backup en la base de datos PostgreSQL local
 * Se ejecuta desde restaurar_backup_local.sh
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '..', '.env_local') });

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'emop_db',
  user: process.env.DB_USER || 'emop_user',
  password: process.env.DB_PASSWORD || 'emop_password',
};

// Crear pool de conexiones
const pool = new Pool(DB_CONFIG);

// Función para escapar nombres de tablas y columnas
function escapeIdentifier(identifier) {
  return `"${identifier}"`;
}

// Función para insertar datos en una tabla
async function insertarDatosTabla(tabla, datos) {
  if (!datos || datos.length === 0) {
    console.log(`  ⏭️  ${tabla}: Sin datos para insertar`);
    return 0;
  }

  try {
    const client = await pool.connect();
    
    try {
      // Obtener columnas disponibles en la tabla local
      const colsResult = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = $1 
        AND table_schema = 'public'
      `, [tabla]);
      const localColumns = new Set(colsResult.rows.map(r => r.column_name));
      
      // Filtrar columnas de los datos para que solo incluya las que existen en local
      const columnas = Object.keys(datos[0]).filter(col => localColumns.has(col));
      const columnasEscapadas = columnas.map(escapeIdentifier).join(', ');
      
      // Crear query de inserción
      const placeholders = columnas.map((_, i) => `$${i + 1}`).join(', ');
      const query = `INSERT INTO ${escapeIdentifier(tabla)} (${columnasEscapadas}) VALUES (${placeholders})`;
      
      let insertados = 0;
      
      // Insertar cada registro
      for (const registro of datos) {
        try {
          const valores = columnas.map(col => {
            const valor = registro[col];
            // Manejar valores especiales
            if (valor === null || valor === undefined) {
              return null;
            }
            if (typeof valor === 'object' && valor !== null) {
              return JSON.stringify(valor);
            }
            return valor;
          });
          
          await client.query(query, valores);
          insertados++;
        } catch (err) {
          // Si es error de duplicado, continuar (los datos ya existen)
          if (err.code === '23505') {
            // Violación de constraint única - registro duplicado
            continue;
          }
          // Otros errores pueden ser por datos inválidos, pero continuamos
          console.warn(`    ⚠️  Error insertando registro en ${tabla}: ${err.message}`);
        }
      }
      
      console.log(`  ✅ ${tabla}: ${insertados}/${datos.length} registros insertados`);
      return insertados;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(`  ❌ Error procesando ${tabla}:`, err.message);
    return 0;
  }
}

// Función principal
async function main() {
  const dataFile = process.argv[2];
  
  if (!dataFile || !fs.existsSync(dataFile)) {
    console.error('❌ Error: Archivo de datos no especificado o no existe');
    process.exit(1);
  }

  console.log(`📖 Leyendo datos de: ${dataFile}\n`);

  // Leer datos
  const datosCompletos = JSON.parse(fs.readFileSync(dataFile, 'utf8'));

  // Orden de tablas (respetando dependencias)
  const ordenTablas = [
    'empresa',
    'rol',
    'tipo_mantenimiento',
    'usuario',
    'conductor',
    'vehiculo',
    'mecanico',
    'insumo_catalogo',
    'linea_servicio',
    'orden_trabajo',
    'detalle_insumo',
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
    'users',
    'roles',
    'companies'
  ];

  console.log('🔄 Restaurando datos de las tablas...\n');

  let totalInsertados = 0;
  let tablasProcesadas = 0;

  // Procesar tablas en orden
  for (const tabla of ordenTablas) {
    if (datosCompletos[tabla]) {
      const insertados = await insertarDatosTabla(tabla, datosCompletos[tabla]);
      totalInsertados += insertados;
      tablasProcesadas++;
    } else {
      console.log(`  ⏭️  ${tabla}: No hay datos en el backup`);
    }
  }

  // Cerrar pool
  await pool.end();

  console.log(`\n✅ Restauración completada:`);
  console.log(`  - Tablas procesadas: ${tablasProcesadas}`);
  console.log(`  - Total de registros insertados: ${totalInsertados}`);
}

// Ejecutar
main().catch(err => {
  console.error('❌ Error fatal:', err);
  process.exit(1);
});

