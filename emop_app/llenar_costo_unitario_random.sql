-- =====================================================
-- Script para llenar campo costo_unitario con valores aleatorios
-- Sistema EMOP - Supabase
-- =====================================================
-- OBJETIVO: Actualizar el campo costo_unitario de todos los insumos
-- con valores aleatorios entre 10.00 y 5000.00 (precios monetarios)
-- con exactamente 2 decimales
-- =====================================================

-- Actualizar todos los insumos con costo_unitario aleatorio
-- Rango: 10.00 a 5000.00 (precios razonables para insumos de mantenimiento)
-- Usa ROUND para asegurar exactamente 2 decimales
UPDATE insumo_catalogo 
SET costo_unitario = ROUND(
    (random() * (5000.00 - 10.00) + 10.00)::NUMERIC, 
    2
)
WHERE costo_unitario IS NULL OR costo_unitario = 0.00;

-- Verificar los valores actualizados
SELECT 
    id_insumo,
    codigo_inventario,
    descripcion,
    costo_unitario,
    CASE 
        WHEN costo_unitario >= 10.00 AND costo_unitario <= 5000.00 THEN '✅ Rango válido'
        ELSE '⚠️ Fuera de rango'
    END as validacion
FROM insumo_catalogo
ORDER BY id_insumo
LIMIT 20;

-- Estadísticas de los valores generados
SELECT 
    COUNT(*) as total_insumos,
    MIN(costo_unitario) as costo_minimo,
    MAX(costo_unitario) as costo_maximo,
    AVG(costo_unitario)::NUMERIC(10,2) as costo_promedio,
    SUM(costo_unitario)::NUMERIC(10,2) as costo_total,
    COUNT(CASE WHEN costo_unitario >= 10.00 AND costo_unitario <= 5000.00 THEN 1 END) as dentro_rango,
    COUNT(CASE WHEN costo_unitario < 10.00 OR costo_unitario > 5000.00 THEN 1 END) as fuera_rango
FROM insumo_catalogo;

-- Verificar que todos los valores tienen exactamente 2 decimales
SELECT 
    id_insumo,
    codigo_inventario,
    costo_unitario,
    CASE 
        WHEN costo_unitario::TEXT ~ '^\d+\.\d{2}$' THEN '✅ 2 decimales'
        ELSE '⚠️ Formato incorrecto'
    END as formato_decimal
FROM insumo_catalogo
LIMIT 10;

