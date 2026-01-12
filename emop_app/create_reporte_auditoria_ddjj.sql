-- =====================================================
-- TABLA: reporte_auditoria_ddjj
-- =====================================================
-- Tabla para almacenar los reportes de auditoría de DDJJ
-- generados por los auditores
-- =====================================================

CREATE TABLE IF NOT EXISTS reporte_auditoria_ddjj (
    id_reporte SERIAL PRIMARY KEY,
    id_usuario INTEGER NOT NULL REFERENCES usuario(id_usuario),
    id_orden_trabajo INTEGER NOT NULL REFERENCES orden_trabajo(id_orden),
    tipo_reporte VARCHAR(50) NOT NULL CHECK (tipo_reporte IN ('correcto', 'discrepancias')),
    observaciones TEXT,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_reporte_auditoria_ddjj_id_usuario ON reporte_auditoria_ddjj(id_usuario);
CREATE INDEX IF NOT EXISTS idx_reporte_auditoria_ddjj_id_orden_trabajo ON reporte_auditoria_ddjj(id_orden_trabajo);
CREATE INDEX IF NOT EXISTS idx_reporte_auditoria_ddjj_fecha_creacion ON reporte_auditoria_ddjj(fecha_creacion);

-- Comentarios en la tabla
COMMENT ON TABLE reporte_auditoria_ddjj IS 'Reportes de auditoría de DDJJ generados por auditores';
COMMENT ON COLUMN reporte_auditoria_ddjj.id_reporte IS 'Identificador único del reporte';
COMMENT ON COLUMN reporte_auditoria_ddjj.id_usuario IS 'ID del usuario auditor que genera el reporte';
COMMENT ON COLUMN reporte_auditoria_ddjj.id_orden_trabajo IS 'ID de la orden de trabajo (DDJJ) auditada';
COMMENT ON COLUMN reporte_auditoria_ddjj.tipo_reporte IS 'Tipo de reporte: correcto o discrepancias';
COMMENT ON COLUMN reporte_auditoria_ddjj.observaciones IS 'Observaciones adicionales del auditor';

