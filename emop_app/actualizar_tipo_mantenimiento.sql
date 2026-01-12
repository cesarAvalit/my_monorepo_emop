-- =====================================================
-- SCRIPT: Actualizar Tabla tipo_mantenimiento
-- =====================================================
-- OBJETIVO: Dejar solo 3 tipos de mantenimiento:
--   - ID 1: Preventivo
--   - ID 2: Correctivo
--   - ID 3: Operativo
-- =====================================================
-- INSTRUCCIONES:
-- 1. Abre Supabase SQL Editor
-- 2. Copia y pega TODO este script
-- 3. Haz clic en "Run" o "Ejecutar"
-- 4. Revisa los resultados al final
-- =====================================================

-- =====================================================
-- PASO 1: ELIMINAR TODOS LOS REGISTROS EXISTENTES
-- =====================================================
-- Esto elimina todos los tipos de mantenimiento actuales
-- CASCADE elimina automáticamente las referencias en otras tablas
TRUNCATE TABLE tipo_mantenimiento CASCADE;

-- =====================================================
-- PASO 2: OBTENER EL NOMBRE CORRECTO DE LA SECUENCIA
-- =====================================================
-- Primero obtenemos el nombre real de la secuencia
DO $$
DECLARE
    seq_name TEXT;
BEGIN
    -- Obtener el nombre de la secuencia asociada a la columna id_tipo
    SELECT pg_get_serial_sequence('tipo_mantenimiento', 'id_tipo') INTO seq_name;
    
    -- Si la secuencia existe, reiniciarla
    IF seq_name IS NOT NULL THEN
        EXECUTE format('ALTER SEQUENCE %I RESTART WITH 1', seq_name);
        EXECUTE format('SELECT setval(%L, 0, false)', seq_name);
    END IF;
END $$;

-- =====================================================
-- PASO 3: INSERTAR LOS 3 TIPOS DE MANTENIMIENTO
-- =====================================================
-- Insertamos los 3 tipos con sus IDs específicos
-- Usamos OVERRIDING SYSTEM VALUE para permitir insertar IDs manualmente
INSERT INTO tipo_mantenimiento (id_tipo, descripcion) 
OVERRIDING SYSTEM VALUE
VALUES
    (1, 'Preventivo'),
    (2, 'Correctivo'),
    (3, 'Operativo');

-- =====================================================
-- PASO 4: ACTUALIZAR LA SECUENCIA
-- =====================================================
-- Actualizamos la secuencia para que el próximo ID sea 4 (si se agrega uno nuevo)
DO $$
DECLARE
    seq_name TEXT;
BEGIN
    SELECT pg_get_serial_sequence('tipo_mantenimiento', 'id_tipo') INTO seq_name;
    IF seq_name IS NOT NULL THEN
        EXECUTE format('SELECT setval(%L, 3, true)', seq_name);
    END IF;
END $$;

-- =====================================================
-- PASO 5: VERIFICAR LOS DATOS INSERTADOS
-- =====================================================
-- Esta consulta debe mostrar exactamente 3 filas:
--   1 | Preventivo
--   2 | Correctivo
--   3 | Operativo
SELECT 
    id_tipo, 
    descripcion,
    '✅ Tipo válido' as estado
FROM tipo_mantenimiento 
ORDER BY id_tipo;

-- =====================================================
-- PASO 6: VERIFICAR ÓRDENES DE TRABAJO CON TIPOS INVÁLIDOS
-- =====================================================
-- Esta consulta muestra las órdenes que tienen tipos que ya no existen
-- Si aparece alguna fila, significa que hay órdenes con tipos inválidos
-- IMPORTANTE: Esta consulta SOLO LEE datos, NO los modifica
SELECT 
    ot.id_orden,
    ot.nro_orden_trabajo,
    ot.id_tipo_mantenimiento as tipo_invalido,
    '⚠️ Este tipo ya no existe' as advertencia
FROM orden_trabajo ot
WHERE ot.id_tipo_mantenimiento IS NOT NULL 
  AND ot.id_tipo_mantenimiento NOT IN (1, 2, 3);

-- =====================================================
-- PASO 7 (OPCIONAL): CORREGIR ÓRDENES CON TIPOS INVÁLIDOS
-- =====================================================
-- Si en el PASO 6 aparecieron resultados, descomenta UNA de estas opciones:

-- OPCIÓN A: Asignar "Preventivo" (ID 1) como tipo por defecto
-- UPDATE orden_trabajo 
-- SET id_tipo_mantenimiento = 1
-- WHERE id_tipo_mantenimiento IS NOT NULL 
--   AND id_tipo_mantenimiento NOT IN (1, 2, 3);

-- OPCIÓN B: Dejar sin tipo (NULL) las órdenes con tipos inválidos
-- UPDATE orden_trabajo 
-- SET id_tipo_mantenimiento = NULL 
-- WHERE id_tipo_mantenimiento IS NOT NULL 
--   AND id_tipo_mantenimiento NOT IN (1, 2, 3);

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================
-- Ejecuta esta consulta para confirmar que todo está correcto
-- Debe mostrar 0 (cero) órdenes con tipos inválidos
SELECT 
    COUNT(*) as total_ordenes_invalidas,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ Todo correcto'
        ELSE '⚠️ Hay órdenes con tipos inválidos'
    END as estado
FROM orden_trabajo
WHERE id_tipo_mantenimiento IS NOT NULL 
  AND id_tipo_mantenimiento NOT IN (1, 2, 3);

