-- =====================================================
-- SCRIPT SIMPLIFICADO: Actualizar Tabla tipo_mantenimiento
-- =====================================================
-- OBJETIVO: Dejar solo 3 tipos de mantenimiento:
--   - ID 1: Preventivo
--   - ID 2: Correctivo
--   - ID 3: Operativo
-- =====================================================
-- Esta versión NO requiere conocer el nombre exacto de la secuencia
-- =====================================================

-- =====================================================
-- PASO 1: ELIMINAR TODOS LOS REGISTROS EXISTENTES
-- =====================================================
TRUNCATE TABLE tipo_mantenimiento CASCADE;

-- =====================================================
-- PASO 2: INSERTAR LOS 3 TIPOS DE MANTENIMIENTO
-- =====================================================
-- OVERRIDING SYSTEM VALUE permite insertar IDs específicos
-- sin necesidad de manipular la secuencia manualmente
INSERT INTO tipo_mantenimiento (id_tipo, descripcion) 
OVERRIDING SYSTEM VALUE
VALUES
    (1, 'Preventivo'),
    (2, 'Correctivo'),
    (3, 'Operativo');

-- =====================================================
-- PASO 3: ACTUALIZAR LA SECUENCIA (si existe)
-- =====================================================
-- Intentamos actualizar la secuencia, pero si no existe, no pasa nada
-- Esto es compatible con diferentes versiones de PostgreSQL
DO $$
DECLARE
    seq_name TEXT;
BEGIN
    SELECT pg_get_serial_sequence('tipo_mantenimiento', 'id_tipo') INTO seq_name;
    IF seq_name IS NOT NULL THEN
        EXECUTE format('SELECT setval(%L, 3, true)', seq_name);
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- Si hay algún error, simplemente continuamos
        NULL;
END $$;

-- =====================================================
-- PASO 4: VERIFICAR LOS DATOS INSERTADOS
-- =====================================================
SELECT 
    id_tipo, 
    descripcion,
    '✅ Tipo válido' as estado
FROM tipo_mantenimiento 
ORDER BY id_tipo;

-- =====================================================
-- PASO 5: VERIFICAR ÓRDENES DE TRABAJO CON TIPOS INVÁLIDOS
-- =====================================================
SELECT 
    ot.id_orden,
    ot.nro_orden_trabajo,
    ot.id_tipo_mantenimiento as tipo_invalido,
    '⚠️ Este tipo ya no existe' as advertencia
FROM orden_trabajo ot
WHERE ot.id_tipo_mantenimiento IS NOT NULL 
  AND ot.id_tipo_mantenimiento NOT IN (1, 2, 3);

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

