-- =====================================================
-- Script para llenar campo costo_unitario con valores aleatorios
-- Sistema EMOP - Supabase
-- Versión optimizada para evitar timeouts
-- =====================================================

-- Actualizar todos los insumos con costo_unitario aleatorio
-- Rango: 10.00 a 5000.00 con exactamente 2 decimales
UPDATE insumo_catalogo 
SET costo_unitario = ROUND(
    (random() * (5000.00 - 10.00) + 10.00)::NUMERIC, 
    2
)
WHERE costo_unitario IS NULL OR costo_unitario = 0.00;

-- Verificar algunos valores (ejecutar por separado si hay problemas)
SELECT 
    id_insumo,
    codigo_inventario,
    descripcion,
    costo_unitario
FROM insumo_catalogo
ORDER BY id_insumo
LIMIT 10;

