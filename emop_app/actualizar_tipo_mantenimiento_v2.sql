-- =====================================================
-- SCRIPT VERSIÓN 2: Actualizar Tabla tipo_mantenimiento
-- =====================================================
-- OBJETIVO: Dejar solo 3 tipos de mantenimiento:
--   - ID 1: Preventivo
--   - ID 2: Correctivo
--   - ID 3: Operativo
-- =====================================================
-- Esta versión NO usa bloques DO $$ para máxima compatibilidad
-- =====================================================

-- =====================================================
-- PASO 1: ELIMINAR TODOS LOS REGISTROS EXISTENTES
-- =====================================================
TRUNCATE TABLE tipo_mantenimiento CASCADE;

-- =====================================================
-- PASO 2: INSERTAR LOS 3 TIPOS DE MANTENIMIENTO
-- =====================================================
-- OVERRIDING SYSTEM VALUE permite insertar IDs específicos
-- sin necesidad de manipular la secuencia
INSERT INTO tipo_mantenimiento (id_tipo, descripcion) 
OVERRIDING SYSTEM VALUE
VALUES
    (1, 'Preventivo'),
    (2, 'Correctivo'),
    (3, 'Operativo');

-- =====================================================
-- PASO 3: VERIFICAR LOS DATOS INSERTADOS
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
-- PASO 4: VERIFICAR ÓRDENES DE TRABAJO CON TIPOS INVÁLIDOS
-- =====================================================
-- Esta consulta muestra las órdenes que tienen tipos que ya no existen
-- Si aparece alguna fila, significa que hay órdenes con tipos inválidos
SELECT 
    ot.id_orden,
    ot.nro_orden_trabajo,
    ot.id_tipo_mantenimiento as tipo_invalido,
    '⚠️ Este tipo ya no existe' as advertencia
FROM orden_trabajo ot
WHERE ot.id_tipo_mantenimiento IS NOT NULL 
  AND ot.id_tipo_mantenimiento NOT IN (1, 2, 3);

-- =====================================================
-- PASO 5 (OPCIONAL): CORREGIR ÓRDENES CON TIPOS INVÁLIDOS
-- =====================================================
-- Si en el PASO 4 aparecieron resultados, descomenta UNA de estas opciones:

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
SELECT 
    COUNT(*) as total_ordenes_invalidas,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ Todo correcto'
        ELSE '⚠️ Hay órdenes con tipos inválidos'
    END as estado
FROM orden_trabajo
WHERE id_tipo_mantenimiento IS NOT NULL 
  AND id_tipo_mantenimiento NOT IN (1, 2, 3);

