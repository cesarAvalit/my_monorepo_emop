-- =====================================================
-- Script para agregar campo horometro a la tabla vehiculo
-- Sistema EMOP - Supabase
-- =====================================================

-- Agregar columna horometro a la tabla vehiculo
-- Tipo: INTEGER (similar a kilometros)
-- Valor por defecto: 0
-- Permite NULL: No (para mantener consistencia con kilometros)

ALTER TABLE vehiculo 
ADD COLUMN IF NOT EXISTS horometro INTEGER DEFAULT 0;

-- Verificar que la columna se agregó correctamente
SELECT 
    column_name, 
    data_type, 
    column_default, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'vehiculo' 
  AND column_name = 'horometro';

-- Opcional: Actualizar valores existentes si es necesario
-- Si quieres establecer un valor inicial para vehículos existentes que tengan NULL
-- UPDATE vehiculo SET horometro = 0 WHERE horometro IS NULL;

-- Verificar algunos registros
SELECT 
    id_vehiculo,
    matricula,
    interno,
    kilometros,
    horometro
FROM vehiculo
LIMIT 5;

