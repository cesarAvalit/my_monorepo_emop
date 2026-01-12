-- =====================================================
-- Script para agregar campo costo_unitario a la tabla insumo_catalogo
-- Sistema EMOP - Supabase
-- Versión simplificada para evitar timeouts
-- =====================================================

-- PASO 1: Agregar columna costo_unitario
ALTER TABLE insumo_catalogo 
ADD COLUMN IF NOT EXISTS costo_unitario DECIMAL(10, 2) DEFAULT 0.00 NOT NULL;

-- PASO 2: Verificar que la columna se agregó (ejecutar por separado si hay problemas)
SELECT 
    column_name, 
    data_type, 
    numeric_precision,
    numeric_scale,
    column_default, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'insumo_catalogo' 
  AND column_name = 'costo_unitario';

