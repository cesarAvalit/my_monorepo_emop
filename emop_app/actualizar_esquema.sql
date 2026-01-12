-- =====================================================
-- Script de Actualización de Esquema
-- Ejecuta este script DESPUÉS de haber creado las tablas iniciales
-- =====================================================

-- =====================================================
-- 1. Actualizar tipo_mantenimiento
-- =====================================================
-- Renombrar columna y eliminar campo nombre
ALTER TABLE tipo_mantenimiento RENAME COLUMN id_tipo_mantenimiento TO id_tipo;
ALTER TABLE tipo_mantenimiento DROP COLUMN IF EXISTS nombre;

-- =====================================================
-- 2. Actualizar orden_trabajo (ajustar FK)
-- =====================================================
-- Primero eliminar la constraint antigua
ALTER TABLE orden_trabajo DROP CONSTRAINT IF EXISTS orden_trabajo_id_tipo_mantenimiento_fkey;
-- Agregar nueva constraint con el nombre correcto
ALTER TABLE orden_trabajo ADD CONSTRAINT orden_trabajo_id_tipo_mantenimiento_fkey 
  FOREIGN KEY (id_tipo_mantenimiento) REFERENCES tipo_mantenimiento(id_tipo);

-- =====================================================
-- 3. Actualizar mecanico
-- =====================================================
ALTER TABLE mecanico ADD COLUMN IF NOT EXISTS dni VARCHAR(50);
ALTER TABLE mecanico ADD COLUMN IF NOT EXISTS telefono VARCHAR(50);
ALTER TABLE mecanico ALTER COLUMN apellido DROP NOT NULL;

-- =====================================================
-- 4. Actualizar detalle_insumo
-- =====================================================
ALTER TABLE detalle_insumo ADD COLUMN IF NOT EXISTS id_detalle_insumo INTEGER;
ALTER TABLE detalle_insumo ADD COLUMN IF NOT EXISTS costo_unitario_historico DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE detalle_insumo ADD COLUMN IF NOT EXISTS costo_total DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE detalle_insumo DROP COLUMN IF EXISTS precio_unitario;

-- =====================================================
-- 5. Recrear linea_servicio (estructura completamente diferente)
-- =====================================================
DROP TABLE IF EXISTS linea_servicio CASCADE;

CREATE TABLE linea_servicio (
    id_linea_servicio SERIAL PRIMARY KEY,
    id_orden INTEGER REFERENCES orden_trabajo(id_orden),
    id_tipo_mantenimiento INTEGER REFERENCES tipo_mantenimiento(id_tipo),
    definicion_trabajo VARCHAR(255),
    descripcion_detallada TEXT
);

CREATE INDEX IF NOT EXISTS idx_linea_servicio_id_orden ON linea_servicio(id_orden);
CREATE INDEX IF NOT EXISTS idx_linea_servicio_id_tipo_mantenimiento ON linea_servicio(id_tipo_mantenimiento);

COMMENT ON TABLE linea_servicio IS 'Líneas de servicio';

-- =====================================================
-- 6. Actualizar rto_registro
-- =====================================================
ALTER TABLE rto_registro ADD COLUMN IF NOT EXISTS aprobado BOOLEAN DEFAULT false;
ALTER TABLE rto_registro ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true;

-- =====================================================
-- FIN DEL SCRIPT DE ACTUALIZACIÓN
-- =====================================================
