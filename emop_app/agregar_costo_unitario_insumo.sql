-- =====================================================
-- Script para agregar campo costo_unitario a la tabla insumo_catalogo
-- Sistema EMOP - Supabase
-- =====================================================

-- Agregar columna costo_unitario a la tabla insumo_catalogo
-- Tipo: DECIMAL(10, 2) - permite hasta 10 dígitos totales, 2 decimales
-- Valor por defecto: 0.00
-- Permite NULL: No (para mantener consistencia)

ALTER TABLE insumo_catalogo 
ADD COLUMN IF NOT EXISTS costo_unitario DECIMAL(10, 2) DEFAULT 0.00 NOT NULL;

-- Verificar que la columna se agregó correctamente
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

-- Verificar algunos registros
SELECT 
    id_insumo,
    codigo_inventario,
    descripcion,
    costo_unitario
FROM insumo_catalogo
LIMIT 5;

