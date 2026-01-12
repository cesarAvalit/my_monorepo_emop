-- Script para agregar campos a la tabla empresa
-- Ejecutar en Supabase SQL Editor

ALTER TABLE empresa
ADD COLUMN IF NOT EXISTS codigo_empresa VARCHAR(100),
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS telefono VARCHAR(50);

-- Agregar comentarios a las columnas (opcional)
COMMENT ON COLUMN empresa.codigo_empresa IS 'Código único de la empresa';
COMMENT ON COLUMN empresa.email IS 'Correo electrónico de la empresa';
COMMENT ON COLUMN empresa.telefono IS 'Teléfono de contacto de la empresa';

