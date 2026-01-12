-- =====================================================
-- SCRIPT: Agregar campo conformidad a inspeccion_ddjj
-- =====================================================
-- Este script agrega el campo conformidad (BOOLEAN)
-- a la tabla inspeccion_ddjj para almacenar si la
-- inspección es CONFORME o NO CONFORME
-- =====================================================

-- Agregar columna conformidad
ALTER TABLE inspeccion_ddjj
ADD COLUMN IF NOT EXISTS conformidad BOOLEAN;

-- Comentario en la columna
COMMENT ON COLUMN inspeccion_ddjj.conformidad IS 'Indica si la inspección es CONFORME (true) o NO CONFORME (false). NULL si no se ha especificado.';

-- =====================================================
-- NOTAS:
-- =====================================================
-- - El campo es nullable para permitir inspecciones
--   que no tengan conformidad especificada aún
-- - true = CONFORME
-- - false = NO CONFORME
-- - NULL = No especificado
-- =====================================================

