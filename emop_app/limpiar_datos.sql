-- =====================================================
-- Script para Limpiar Datos Existentes
-- Ejecuta este script ANTES de migrar los datos
-- =====================================================

-- Limpiar datos en orden inverso (respetando dependencias)
TRUNCATE TABLE orden_x_usuario CASCADE;
TRUNCATE TABLE auditoria CASCADE;
TRUNCATE TABLE rto_registro CASCADE;
TRUNCATE TABLE linea_servicio CASCADE;
TRUNCATE TABLE detalle_insumo CASCADE;
TRUNCATE TABLE orden_x_mecanico CASCADE;
TRUNCATE TABLE orden_trabajo CASCADE;
TRUNCATE TABLE mecanico CASCADE;
TRUNCATE TABLE tipo_mantenimiento CASCADE;
TRUNCATE TABLE insumo_catalogo CASCADE;
TRUNCATE TABLE usuario CASCADE;
TRUNCATE TABLE conductor CASCADE;
TRUNCATE TABLE vehiculo CASCADE;
TRUNCATE TABLE rol CASCADE;
TRUNCATE TABLE empresa CASCADE;
TRUNCATE TABLE users CASCADE;
TRUNCATE TABLE roles CASCADE;
TRUNCATE TABLE companies CASCADE;

-- Reiniciar secuencias (para que los IDs empiecen desde 1)
ALTER SEQUENCE IF EXISTS empresa_id_empresa_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS rol_id_rol_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS usuario_id_usuario_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS conductor_id_conductor_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS vehiculo_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS tipo_mantenimiento_id_tipo_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS orden_trabajo_id_orden_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS mecanico_id_mecanico_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS insumo_catalogo_id_insumo_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS detalle_insumo_id_detalle_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS linea_servicio_id_linea_servicio_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS rto_registro_id_rto_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS orden_x_usuario_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS auditoria_id_auditoria_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS users_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS roles_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS companies_id_seq RESTART WITH 1;

-- =====================================================
-- FIN DEL SCRIPT DE LIMPIEZA
-- =====================================================
