-- =====================================================
-- SCRIPT: Rollback de Migración DDJJ
-- =====================================================
-- Este script revierte los cambios realizados durante
-- la migración a la nueva estructura DDJJ.
-- 
-- ⚠️ ADVERTENCIA: Este script eliminará datos.
-- Solo ejecutar si necesitas revertir completamente la migración.
-- =====================================================

-- =====================================================
-- PASO 1: Confirmación (descomentar para ejecutar)
-- =====================================================
-- Por seguridad, este script está comentado.
-- Descomenta las secciones que necesites ejecutar.

-- =====================================================
-- PASO 2: Eliminar asignaciones DDJJ-Usuario
-- =====================================================

-- TRUNCATE TABLE ddjj_x_usuario;
-- RAISE NOTICE 'Tabla ddjj_x_usuario vaciada';

-- =====================================================
-- PASO 3: Desvincular órdenes de trabajo de DDJJ
-- =====================================================

-- UPDATE orden_trabajo
-- SET id_ddjj = NULL
-- WHERE id_ddjj IS NOT NULL;
-- RAISE NOTICE 'Órdenes de trabajo desvinculadas de DDJJ';

-- =====================================================
-- PASO 4: Desvincular inspecciones de DDJJ
-- =====================================================

-- UPDATE inspeccion_ddjj
-- SET id_ddjj = NULL
-- WHERE id_ddjj IS NOT NULL;
-- RAISE NOTICE 'Inspecciones desvinculadas de DDJJ';

-- =====================================================
-- PASO 5: Desvincular reportes de auditoría de DDJJ
-- =====================================================

-- UPDATE reporte_auditoria_ddjj
-- SET id_ddjj = NULL
-- WHERE id_ddjj IS NOT NULL;
-- RAISE NOTICE 'Reportes de auditoría desvinculados de DDJJ';

-- =====================================================
-- PASO 6: Eliminar todas las DDJJ creadas
-- =====================================================

-- DELETE FROM declaracion_jurada;
-- RAISE NOTICE 'Todas las DDJJ eliminadas';

-- =====================================================
-- PASO 7: Eliminar columnas agregadas (OPCIONAL)
-- =====================================================
-- Solo ejecutar si quieres eliminar completamente las columnas.
-- Esto requiere eliminar las foreign keys primero.

-- Paso 7.1: Eliminar índices
-- DROP INDEX IF EXISTS idx_orden_trabajo_id_ddjj;
-- DROP INDEX IF EXISTS idx_inspeccion_ddjj_id_ddjj;
-- DROP INDEX IF EXISTS idx_reporte_auditoria_ddjj_id_ddjj;
-- DROP INDEX IF EXISTS idx_ddjj_x_usuario_id_ddjj;
-- DROP INDEX IF EXISTS idx_ddjj_x_usuario_id_usuario;
-- DROP INDEX IF EXISTS idx_ddjj_x_usuario_tipo_asignacion;

-- Paso 7.2: Eliminar foreign keys
-- ALTER TABLE orden_trabajo DROP CONSTRAINT IF EXISTS orden_trabajo_id_ddjj_fkey;
-- ALTER TABLE inspeccion_ddjj DROP CONSTRAINT IF EXISTS inspeccion_ddjj_id_ddjj_fkey;
-- ALTER TABLE reporte_auditoria_ddjj DROP CONSTRAINT IF EXISTS reporte_auditoria_ddjj_id_ddjj_fkey;
-- ALTER TABLE ddjj_x_usuario DROP CONSTRAINT IF EXISTS ddjj_x_usuario_id_ddjj_fkey;
-- ALTER TABLE ddjj_x_usuario DROP CONSTRAINT IF EXISTS ddjj_x_usuario_id_usuario_fkey;

-- Paso 7.3: Eliminar columnas
-- ALTER TABLE orden_trabajo DROP COLUMN IF EXISTS id_ddjj;
-- ALTER TABLE inspeccion_ddjj DROP COLUMN IF EXISTS id_ddjj;
-- ALTER TABLE reporte_auditoria_ddjj DROP COLUMN IF EXISTS id_ddjj;

-- Paso 7.4: Eliminar tablas
-- DROP TABLE IF EXISTS ddjj_x_usuario;
-- DROP TABLE IF EXISTS declaracion_jurada;

-- Paso 7.5: Eliminar trigger
-- DROP TRIGGER IF EXISTS update_declaracion_jurada_updated_at ON declaracion_jurada;

-- =====================================================
-- NOTA IMPORTANTE
-- =====================================================
-- Este script está comentado por seguridad.
-- Para ejecutarlo:
-- 1. Haz un backup antes
-- 2. Descomenta las secciones que necesites
-- 3. Ejecuta paso a paso
-- 4. Verifica después de cada paso
-- =====================================================

