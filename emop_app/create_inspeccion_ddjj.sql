-- =====================================================
-- TABLA: inspeccion_ddjj
-- =====================================================
-- Tabla para almacenar las inspecciones de DDJJ
-- realizadas por los inspectores
-- =====================================================

CREATE TABLE IF NOT EXISTS inspeccion_ddjj (
    id_inspeccion SERIAL PRIMARY KEY,
    id_usuario INTEGER NOT NULL REFERENCES usuario(id_usuario),
    id_orden_trabajo INTEGER NOT NULL REFERENCES orden_trabajo(id_orden),
    licencia_correcto BOOLEAN DEFAULT false,
    rto_correcto BOOLEAN DEFAULT false,
    seguro_correcto BOOLEAN DEFAULT false,
    aire_acondicionado_correcto BOOLEAN DEFAULT false,
    calefaccion_correcto BOOLEAN DEFAULT false,
    camara_correcto BOOLEAN DEFAULT false,
    observaciones TEXT,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_inspeccion_ddjj_id_usuario ON inspeccion_ddjj(id_usuario);
CREATE INDEX IF NOT EXISTS idx_inspeccion_ddjj_id_orden_trabajo ON inspeccion_ddjj(id_orden_trabajo);
CREATE INDEX IF NOT EXISTS idx_inspeccion_ddjj_fecha_creacion ON inspeccion_ddjj(fecha_creacion);

-- Comentarios en la tabla
COMMENT ON TABLE inspeccion_ddjj IS 'Inspecciones de DDJJ realizadas por inspectores';
COMMENT ON COLUMN inspeccion_ddjj.id_inspeccion IS 'Identificador único de la inspección';
COMMENT ON COLUMN inspeccion_ddjj.id_usuario IS 'ID del usuario inspector que realiza la inspección';
COMMENT ON COLUMN inspeccion_ddjj.id_orden_trabajo IS 'ID de la orden de trabajo (DDJJ) inspeccionada';
COMMENT ON COLUMN inspeccion_ddjj.licencia_correcto IS 'Indica si la licencia de conducir está correcta';
COMMENT ON COLUMN inspeccion_ddjj.rto_correcto IS 'Indica si el RTO está correcto';
COMMENT ON COLUMN inspeccion_ddjj.seguro_correcto IS 'Indica si el seguro está correcto';
COMMENT ON COLUMN inspeccion_ddjj.aire_acondicionado_correcto IS 'Indica si el aire acondicionado está correcto';
COMMENT ON COLUMN inspeccion_ddjj.calefaccion_correcto IS 'Indica si la calefacción está correcta';
COMMENT ON COLUMN inspeccion_ddjj.camara_correcto IS 'Indica si la cámara está correcta';
COMMENT ON COLUMN inspeccion_ddjj.observaciones IS 'Observaciones adicionales del inspector';

