-- =====================================================
-- Script de Creación de Esquema para Supabase
-- Sistema EMOP - Migración desde json-server
-- =====================================================

-- Deshabilitar RLS temporalmente (se puede habilitar después)
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- =====================================================
-- TABLA: empresa
-- =====================================================
CREATE TABLE IF NOT EXISTS empresa (
    id_empresa SERIAL PRIMARY KEY,
    nombre_empresa VARCHAR(255) NOT NULL,
    cuit VARCHAR(50) UNIQUE,
    id_grupo INTEGER
);

-- =====================================================
-- TABLA: rol
-- =====================================================
CREATE TABLE IF NOT EXISTS rol (
    id_rol SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE
);

-- =====================================================
-- TABLA: usuario
-- =====================================================
CREATE TABLE IF NOT EXISTS usuario (
    id_usuario SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    activo BOOLEAN DEFAULT true,
    id_rol INTEGER REFERENCES rol(id_rol),
    id_empresa INTEGER REFERENCES empresa(id_empresa),
    nombre_completo VARCHAR(255),
    dni VARCHAR(50) UNIQUE,
    telefono VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLA: conductor
-- =====================================================
CREATE TABLE IF NOT EXISTS conductor (
    id_conductor SERIAL PRIMARY KEY,
    id_empresa INTEGER REFERENCES empresa(id_empresa),
    nombre VARCHAR(255) NOT NULL,
    apellido VARCHAR(255) NOT NULL,
    numero_licencia VARCHAR(100),
    fecha_vencimiento_licencia TIMESTAMP WITH TIME ZONE,
    dni VARCHAR(50),
    telefono VARCHAR(50),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLA: vehiculo
-- =====================================================
CREATE TABLE IF NOT EXISTS vehiculo (
    id SERIAL PRIMARY KEY,
    id_vehiculo INTEGER UNIQUE NOT NULL,
    id_empresa INTEGER REFERENCES empresa(id_empresa),
    interno VARCHAR(100) UNIQUE,
    matricula VARCHAR(100) UNIQUE,
    marca VARCHAR(255),
    modelo VARCHAR(255),
    anio INTEGER,
    kilometros INTEGER DEFAULT 0,
    tipo_servicio VARCHAR(100),
    nombre_seguro VARCHAR(255),
    tipo_seguro_cobertura VARCHAR(255),
    fecha_vencimiento_seguro TIMESTAMP WITH TIME ZONE,
    fecha_ultima_rto TIMESTAMP WITH TIME ZONE,
    id_conductor_activo INTEGER REFERENCES conductor(id_conductor),
    activo BOOLEAN DEFAULT true,
    posee_ac BOOLEAN DEFAULT false,
    posee_camara BOOLEAN DEFAULT false,
    equipamiento_atributos JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLA: tipo_mantenimiento
-- =====================================================
CREATE TABLE IF NOT EXISTS tipo_mantenimiento (
    id_tipo SERIAL PRIMARY KEY,
    descripcion TEXT
);

-- =====================================================
-- TABLA: orden_trabajo
-- =====================================================
CREATE TABLE IF NOT EXISTS orden_trabajo (
    id_orden SERIAL PRIMARY KEY,
    id_vehiculo INTEGER REFERENCES vehiculo(id_vehiculo),
    id_conductor INTEGER REFERENCES conductor(id_conductor),
    id_tipo_mantenimiento INTEGER REFERENCES tipo_mantenimiento(id_tipo),
    nro_orden_trabajo VARCHAR(100) UNIQUE,
    fecha_generacion TIMESTAMP WITH TIME ZONE,
    fecha_egreso TIMESTAMP WITH TIME ZONE,
    odometro INTEGER DEFAULT 0,
    horometro INTEGER DEFAULT 0,
    estado VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLA: mecanico
-- =====================================================
CREATE TABLE IF NOT EXISTS mecanico (
    id_mecanico SERIAL PRIMARY KEY,
    id_empresa INTEGER REFERENCES empresa(id_empresa),
    nombre VARCHAR(255) NOT NULL,
    apellido VARCHAR(255),
    especialidad VARCHAR(255),
    dni VARCHAR(50),
    telefono VARCHAR(50),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLA: orden_x_mecanico (Pivot)
-- =====================================================
CREATE TABLE IF NOT EXISTS orden_x_mecanico (
    id_orden INTEGER REFERENCES orden_trabajo(id_orden),
    id_mecanico INTEGER REFERENCES mecanico(id_mecanico),
    PRIMARY KEY (id_orden, id_mecanico)
);

-- =====================================================
-- TABLA: insumo_catalogo
-- =====================================================
CREATE TABLE IF NOT EXISTS insumo_catalogo (
    id_insumo SERIAL PRIMARY KEY,
    codigo_inventario VARCHAR(100) UNIQUE,
    descripcion TEXT
);

-- =====================================================
-- TABLA: detalle_insumo
-- =====================================================
CREATE TABLE IF NOT EXISTS detalle_insumo (
    id_detalle SERIAL PRIMARY KEY,
    id_detalle_insumo INTEGER,
    id_orden INTEGER REFERENCES orden_trabajo(id_orden),
    id_insumo INTEGER REFERENCES insumo_catalogo(id_insumo),
    cantidad INTEGER DEFAULT 1,
    costo_unitario_historico DECIMAL(10, 2) DEFAULT 0,
    costo_total DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLA: linea_servicio
-- =====================================================
CREATE TABLE IF NOT EXISTS linea_servicio (
    id_linea SERIAL PRIMARY KEY,
    nombre_linea VARCHAR(255) NOT NULL,
    descripcion TEXT
);

-- =====================================================
-- TABLA: rto_registro
-- =====================================================
CREATE TABLE IF NOT EXISTS rto_registro (
    id_rto SERIAL PRIMARY KEY,
    id_vehiculo INTEGER REFERENCES vehiculo(id_vehiculo),
    fecha_vencimiento TIMESTAMP WITH TIME ZONE,
    fecha_emision TIMESTAMP WITH TIME ZONE,
    numero_certificado VARCHAR(255),
    aprobado BOOLEAN DEFAULT false,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLA: orden_x_usuario (Pivot - Inspector/Auditor)
-- =====================================================
CREATE TABLE IF NOT EXISTS orden_x_usuario (
    id SERIAL PRIMARY KEY,
    id_orden_trabajo INTEGER REFERENCES orden_trabajo(id_orden),
    id_usuario INTEGER REFERENCES usuario(id_usuario),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(id_orden_trabajo, id_usuario)
);

-- =====================================================
-- TABLA: auditoria
-- =====================================================
CREATE TABLE IF NOT EXISTS auditoria (
    id_auditoria SERIAL PRIMARY KEY,
    fecha_hora TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    usuario_nombre VARCHAR(255),
    id_registro INTEGER,
    tipo_registro VARCHAR(100),
    accion VARCHAR(50),
    detalle TEXT,
    id_usuario_ref INTEGER REFERENCES usuario(id_usuario),
    id_mantenimiento_ref INTEGER REFERENCES orden_trabajo(id_orden)
);

-- =====================================================
-- TABLAS ADICIONALES (para compatibilidad con sistema actual)
-- =====================================================

-- Tabla: users (si se mantiene autenticación personalizada)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    id_rol INTEGER,
    id_empresa INTEGER,
    name VARCHAR(255),
    email VARCHAR(255),
    rol VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: roles (si se mantiene autenticación personalizada)
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

-- Tabla: companies (si se mantiene autenticación personalizada)
CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT
);

-- =====================================================
-- ÍNDICES para optimización
-- =====================================================

-- Índices en claves foráneas
CREATE INDEX IF NOT EXISTS idx_vehiculo_id_empresa ON vehiculo(id_empresa);
CREATE INDEX IF NOT EXISTS idx_vehiculo_id_conductor_activo ON vehiculo(id_conductor_activo);
CREATE INDEX IF NOT EXISTS idx_conductor_id_empresa ON conductor(id_empresa);
CREATE INDEX IF NOT EXISTS idx_usuario_id_rol ON usuario(id_rol);
CREATE INDEX IF NOT EXISTS idx_usuario_id_empresa ON usuario(id_empresa);
CREATE INDEX IF NOT EXISTS idx_orden_trabajo_id_vehiculo ON orden_trabajo(id_vehiculo);
CREATE INDEX IF NOT EXISTS idx_orden_trabajo_id_conductor ON orden_trabajo(id_conductor);
CREATE INDEX IF NOT EXISTS idx_orden_trabajo_id_tipo_mantenimiento ON orden_trabajo(id_tipo_mantenimiento);
CREATE INDEX IF NOT EXISTS idx_linea_servicio_id_orden ON linea_servicio(id_orden);
CREATE INDEX IF NOT EXISTS idx_linea_servicio_id_tipo_mantenimiento ON linea_servicio(id_tipo_mantenimiento);
CREATE INDEX IF NOT EXISTS idx_orden_x_usuario_id_orden_trabajo ON orden_x_usuario(id_orden_trabajo);
CREATE INDEX IF NOT EXISTS idx_orden_x_usuario_id_usuario ON orden_x_usuario(id_usuario);
CREATE INDEX IF NOT EXISTS idx_orden_x_mecanico_id_orden ON orden_x_mecanico(id_orden);
CREATE INDEX IF NOT EXISTS idx_orden_x_mecanico_id_mecanico ON orden_x_mecanico(id_mecanico);
CREATE INDEX IF NOT EXISTS idx_detalle_insumo_id_orden ON detalle_insumo(id_orden);
CREATE INDEX IF NOT EXISTS idx_detalle_insumo_id_insumo ON detalle_insumo(id_insumo);
CREATE INDEX IF NOT EXISTS idx_rto_registro_id_vehiculo ON rto_registro(id_vehiculo);
CREATE INDEX IF NOT EXISTS idx_auditoria_id_usuario_ref ON auditoria(id_usuario_ref);
CREATE INDEX IF NOT EXISTS idx_auditoria_id_mantenimiento_ref ON auditoria(id_mantenimiento_ref);

-- Índices en campos de búsqueda frecuente
CREATE INDEX IF NOT EXISTS idx_vehiculo_matricula ON vehiculo(matricula);
CREATE INDEX IF NOT EXISTS idx_vehiculo_interno ON vehiculo(interno);
CREATE INDEX IF NOT EXISTS idx_orden_trabajo_nro_orden ON orden_trabajo(nro_orden_trabajo);
CREATE INDEX IF NOT EXISTS idx_orden_trabajo_estado ON orden_trabajo(estado);
CREATE INDEX IF NOT EXISTS idx_usuario_email ON usuario(email);
CREATE INDEX IF NOT EXISTS idx_usuario_username ON usuario(username);
CREATE INDEX IF NOT EXISTS idx_empresa_cuit ON empresa(cuit);

-- =====================================================
-- FUNCIONES para updated_at automático
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_vehiculo_updated_at BEFORE UPDATE ON vehiculo
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usuario_updated_at BEFORE UPDATE ON usuario
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conductor_updated_at BEFORE UPDATE ON conductor
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orden_trabajo_updated_at BEFORE UPDATE ON orden_trabajo
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mecanico_updated_at BEFORE UPDATE ON mecanico
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMENTARIOS en tablas (documentación)
-- =====================================================

COMMENT ON TABLE empresa IS 'Empresas de transporte';
COMMENT ON TABLE rol IS 'Roles de usuario del sistema';
COMMENT ON TABLE usuario IS 'Usuarios del sistema (inspector, auditor, etc.)';
COMMENT ON TABLE conductor IS 'Conductores de vehículos';
COMMENT ON TABLE vehiculo IS 'Vehículos del sistema';
COMMENT ON TABLE tipo_mantenimiento IS 'Tipos de mantenimiento';
COMMENT ON TABLE orden_trabajo IS 'Órdenes de trabajo';
COMMENT ON TABLE mecanico IS 'Mecánicos';
COMMENT ON TABLE orden_x_mecanico IS 'Relación muchos a muchos entre órdenes y mecánicos';
COMMENT ON TABLE insumo_catalogo IS 'Catálogo de insumos';
COMMENT ON TABLE detalle_insumo IS 'Detalles de insumos por orden';
COMMENT ON TABLE linea_servicio IS 'Líneas de servicio';
COMMENT ON TABLE rto_registro IS 'Registros RTO de vehículos';
COMMENT ON TABLE orden_x_usuario IS 'Relación entre órdenes y usuarios (inspector/auditor)';
COMMENT ON TABLE auditoria IS 'Registros de auditoría del sistema';

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================
