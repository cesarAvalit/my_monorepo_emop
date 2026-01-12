-- =====================================================
-- Script para llenar campo horometro con valores aleatorios
-- Sistema EMOP - Supabase
-- =====================================================
-- OBJETIVO: Actualizar el campo horometro de todos los vehículos
-- con valores aleatorios entre 20000 y 100000 horas
-- =====================================================

-- Actualizar todos los vehículos con horómetro aleatorio
-- Rango: 20000 a 100000 horas
-- Usa floor(random() * (max - min + 1) + min) para generar números aleatorios
UPDATE vehiculo 
SET horometro = floor(random() * (100000 - 20000 + 1) + 20000)::INTEGER
WHERE horometro IS NULL OR horometro = 0;

-- Verificar los valores actualizados
SELECT 
    id_vehiculo,
    matricula,
    interno,
    kilometros,
    horometro,
    CASE 
        WHEN horometro >= 20000 AND horometro <= 100000 THEN '✅ Rango válido'
        ELSE '⚠️ Fuera de rango'
    END as validacion
FROM vehiculo
ORDER BY id_vehiculo
LIMIT 20;

-- Estadísticas de los valores generados
SELECT 
    COUNT(*) as total_vehiculos,
    MIN(horometro) as horometro_minimo,
    MAX(horometro) as horometro_maximo,
    AVG(horometro)::INTEGER as horometro_promedio,
    COUNT(CASE WHEN horometro >= 20000 AND horometro <= 100000 THEN 1 END) as dentro_rango,
    COUNT(CASE WHEN horometro < 20000 OR horometro > 100000 THEN 1 END) as fuera_rango
FROM vehiculo;

