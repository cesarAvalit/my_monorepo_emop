-- =====================================================
-- TABLA: tipo_notificacion
-- =====================================================
-- Tabla para almacenar los tipos de notificaciones disponibles
-- =====================================================

CREATE TABLE IF NOT EXISTS tipo_notificacion (
    id SERIAL PRIMARY KEY,
    nombre_de_notif VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar los tipos de notificaciones predefinidos
INSERT INTO tipo_notificacion (nombre_de_notif) VALUES
    ('Vto de RTO'),
    ('Vto de Seguro'),
    ('Nueva asignacion')
ON CONFLICT (nombre_de_notif) DO NOTHING;

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_tipo_notificacion_nombre ON tipo_notificacion(nombre_de_notif);

-- Comentarios en la tabla
COMMENT ON TABLE tipo_notificacion IS 'Tipos de notificaciones disponibles en el sistema';
COMMENT ON COLUMN tipo_notificacion.id IS 'Identificador único del tipo de notificación';
COMMENT ON COLUMN tipo_notificacion.nombre_de_notif IS 'Nombre del tipo de notificación (Vto de RTO, Vto de Seguro, Nueva asignacion)';

-- =====================================================
-- TABLA: notificaciones
-- =====================================================
-- Tabla para almacenar las notificaciones de los usuarios
-- =====================================================

CREATE TABLE IF NOT EXISTS notificaciones (
    id SERIAL PRIMARY KEY,
    id_tipo_notificacion INTEGER NOT NULL REFERENCES tipo_notificacion(id) ON DELETE CASCADE,
    id_usuario INTEGER NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    fecha_hora TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    nota TEXT,
    visto BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_notificaciones_id_tipo_notificacion ON notificaciones(id_tipo_notificacion);
CREATE INDEX IF NOT EXISTS idx_notificaciones_id_usuario ON notificaciones(id_usuario);
CREATE INDEX IF NOT EXISTS idx_notificaciones_fecha_hora ON notificaciones(fecha_hora);
CREATE INDEX IF NOT EXISTS idx_notificaciones_visto ON notificaciones(visto);
CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario_visto ON notificaciones(id_usuario, visto);

-- Comentarios en la tabla
COMMENT ON TABLE notificaciones IS 'Notificaciones del sistema para los usuarios';
COMMENT ON COLUMN notificaciones.id IS 'Identificador único de la notificación';
COMMENT ON COLUMN notificaciones.id_tipo_notificacion IS 'Tipo de notificación (FK a tipo_notificacion)';
COMMENT ON COLUMN notificaciones.id_usuario IS 'Usuario al que se le muestra la notificación (FK a usuario)';
COMMENT ON COLUMN notificaciones.fecha_hora IS 'Fecha y hora de la notificación';
COMMENT ON COLUMN notificaciones.nota IS 'Anotaciones o detalles adicionales de la notificación';
COMMENT ON COLUMN notificaciones.visto IS 'Indica si el usuario ha visto la notificación (true = vista, false = no vista)';

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================

