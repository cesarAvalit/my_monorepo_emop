-- =====================================================
-- SCRIPT: Restructuración DDJJ - Órdenes de Trabajo
-- =====================================================
-- Este script modifica la estructura de la base de datos
-- para permitir que una DDJJ (Declaración Jurada) pueda
-- contener una o más órdenes de trabajo (relación 1:N)
-- =====================================================

-- =====================================================
-- PASO 1: Crear nueva tabla DDJJ (Declaración Jurada)
-- =====================================================

CREATE TABLE IF NOT EXISTS declaracion_jurada (
    id_ddjj SERIAL PRIMARY KEY,
    numero_ddjj VARCHAR(100) UNIQUE NOT NULL,
    id_empresa INTEGER REFERENCES empresa(id_empresa),
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_vencimiento TIMESTAMP WITH TIME ZONE,
    estado VARCHAR(50) DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente', 'En Proceso', 'Completada', 'Cancelada')),
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_declaracion_jurada_id_empresa ON declaracion_jurada(id_empresa);
CREATE INDEX IF NOT EXISTS idx_declaracion_jurada_numero_ddjj ON declaracion_jurada(numero_ddjj);
CREATE INDEX IF NOT EXISTS idx_declaracion_jurada_estado ON declaracion_jurada(estado);
CREATE INDEX IF NOT EXISTS idx_declaracion_jurada_fecha_creacion ON declaracion_jurada(fecha_creacion);

-- Comentarios
COMMENT ON TABLE declaracion_jurada IS 'Declaraciones Juradas que pueden contener múltiples órdenes de trabajo';
COMMENT ON COLUMN declaracion_jurada.id_ddjj IS 'Identificador único de la DDJJ';
COMMENT ON COLUMN declaracion_jurada.numero_ddjj IS 'Número único de la Declaración Jurada';
COMMENT ON COLUMN declaracion_jurada.id_empresa IS 'ID de la empresa a la que pertenece la DDJJ';
COMMENT ON COLUMN declaracion_jurada.fecha_creacion IS 'Fecha de creación de la DDJJ';
COMMENT ON COLUMN declaracion_jurada.fecha_vencimiento IS 'Fecha de vencimiento de la DDJJ';
COMMENT ON COLUMN declaracion_jurada.estado IS 'Estado de la DDJJ: Pendiente, En Proceso, Completada, Cancelada';

-- =====================================================
-- PASO 2: Agregar columna id_ddjj a orden_trabajo
-- =====================================================

-- Agregar columna id_ddjj a orden_trabajo (nullable para migración)
ALTER TABLE orden_trabajo
ADD COLUMN IF NOT EXISTS id_ddjj INTEGER REFERENCES declaracion_jurada(id_ddjj) ON DELETE SET NULL;

-- Crear índice para la nueva FK
CREATE INDEX IF NOT EXISTS idx_orden_trabajo_id_ddjj ON orden_trabajo(id_ddjj);

-- Comentario
COMMENT ON COLUMN orden_trabajo.id_ddjj IS 'ID de la Declaración Jurada a la que pertenece esta orden de trabajo';

-- =====================================================
-- PASO 3: Modificar inspeccion_ddjj para referenciar DDJJ
-- =====================================================

-- Agregar columna id_ddjj a inspeccion_ddjj
ALTER TABLE inspeccion_ddjj
ADD COLUMN IF NOT EXISTS id_ddjj INTEGER REFERENCES declaracion_jurada(id_ddjj) ON DELETE CASCADE;

-- Crear índice para la nueva FK
CREATE INDEX IF NOT EXISTS idx_inspeccion_ddjj_id_ddjj ON inspeccion_ddjj(id_ddjj);

-- Comentario
COMMENT ON COLUMN inspeccion_ddjj.id_ddjj IS 'ID de la Declaración Jurada inspeccionada (referencia principal)';
COMMENT ON COLUMN inspeccion_ddjj.id_orden_trabajo IS 'ID de la orden de trabajo específica inspeccionada (opcional, para granularidad)';

-- =====================================================
-- PASO 4: Modificar reporte_auditoria_ddjj para referenciar DDJJ
-- =====================================================

-- Agregar columna id_ddjj a reporte_auditoria_ddjj
ALTER TABLE reporte_auditoria_ddjj
ADD COLUMN IF NOT EXISTS id_ddjj INTEGER REFERENCES declaracion_jurada(id_ddjj) ON DELETE CASCADE;

-- Crear índice para la nueva FK
CREATE INDEX IF NOT EXISTS idx_reporte_auditoria_ddjj_id_ddjj ON reporte_auditoria_ddjj(id_ddjj);

-- Comentario
COMMENT ON COLUMN reporte_auditoria_ddjj.id_ddjj IS 'ID de la Declaración Jurada auditada (referencia principal)';
COMMENT ON COLUMN reporte_auditoria_ddjj.id_orden_trabajo IS 'ID de la orden de trabajo específica auditada (opcional, para granularidad)';

-- =====================================================
-- PASO 5: Crear tabla de relación DDJJ - Usuario (Inspector/Auditor)
-- =====================================================

CREATE TABLE IF NOT EXISTS ddjj_x_usuario (
    id SERIAL PRIMARY KEY,
    id_ddjj INTEGER NOT NULL REFERENCES declaracion_jurada(id_ddjj) ON DELETE CASCADE,
    id_usuario INTEGER NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    tipo_asignacion VARCHAR(50) DEFAULT 'Inspector' CHECK (tipo_asignacion IN ('Inspector', 'Auditor')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(id_ddjj, id_usuario, tipo_asignacion)
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_ddjj_x_usuario_id_ddjj ON ddjj_x_usuario(id_ddjj);
CREATE INDEX IF NOT EXISTS idx_ddjj_x_usuario_id_usuario ON ddjj_x_usuario(id_usuario);
CREATE INDEX IF NOT EXISTS idx_ddjj_x_usuario_tipo_asignacion ON ddjj_x_usuario(tipo_asignacion);

-- Comentarios
COMMENT ON TABLE ddjj_x_usuario IS 'Relación entre DDJJ y usuarios (inspectores/auditores)';
COMMENT ON COLUMN ddjj_x_usuario.id_ddjj IS 'ID de la Declaración Jurada';
COMMENT ON COLUMN ddjj_x_usuario.id_usuario IS 'ID del usuario asignado (inspector o auditor)';
COMMENT ON COLUMN ddjj_x_usuario.tipo_asignacion IS 'Tipo de asignación: Inspector o Auditor';

-- =====================================================
-- PASO 6: Trigger para updated_at en declaracion_jurada
-- =====================================================

-- Eliminar el trigger si ya existe (para permitir re-ejecución del script)
DROP TRIGGER IF EXISTS update_declaracion_jurada_updated_at ON declaracion_jurada;

-- Crear el trigger
CREATE TRIGGER update_declaracion_jurada_updated_at 
BEFORE UPDATE ON declaracion_jurada
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- PASO 7: Migración de datos existentes (OPCIONAL)
-- =====================================================
-- Este paso crea DDJJ automáticamente para las órdenes de trabajo existentes
-- que no tienen una DDJJ asignada. Se puede ejecutar o no según necesidad.

-- NOTA: Descomentar este bloque si se desea migrar datos existentes
/*
DO $$
DECLARE
    orden_record RECORD;
    nueva_ddjj_id INTEGER;
    contador INTEGER := 1;
BEGIN
    -- Para cada orden de trabajo sin DDJJ, crear una DDJJ individual
    FOR orden_record IN 
        SELECT DISTINCT id_orden, id_vehiculo, fecha_generacion
        FROM orden_trabajo
        WHERE id_ddjj IS NULL
        ORDER BY fecha_generacion DESC
    LOOP
        -- Obtener id_empresa del vehículo
        INSERT INTO declaracion_jurada (
            numero_ddjj,
            id_empresa,
            fecha_creacion,
            estado
        )
        SELECT 
            'DDJJ-' || TO_CHAR(orden_record.fecha_generacion, 'YYYYMMDD') || '-' || LPAD(contador::TEXT, 4, '0'),
            v.id_empresa,
            orden_record.fecha_generacion,
            'Completada'
        FROM vehiculo v
        WHERE v.id_vehiculo = orden_record.id_vehiculo
        LIMIT 1
        RETURNING id_ddjj INTO nueva_ddjj_id;
        
        -- Asignar la DDJJ a la orden de trabajo
        UPDATE orden_trabajo
        SET id_ddjj = nueva_ddjj_id
        WHERE id_orden = orden_record.id_orden;
        
        contador := contador + 1;
    END LOOP;
END $$;
*/

-- =====================================================
-- PASO 8: Migración de inspecciones existentes (OPCIONAL)
-- =====================================================
-- Migrar inspecciones existentes para que referencien la DDJJ
-- a través de la orden de trabajo

-- NOTA: Descomentar este bloque si se desea migrar datos existentes
/*
UPDATE inspeccion_ddjj i
SET id_ddjj = ot.id_ddjj
FROM orden_trabajo ot
WHERE i.id_orden_trabajo = ot.id_orden
  AND ot.id_ddjj IS NOT NULL
  AND i.id_ddjj IS NULL;
*/

-- =====================================================
-- PASO 9: Migración de reportes de auditoría existentes (OPCIONAL)
-- =====================================================
-- Migrar reportes de auditoría existentes para que referencien la DDJJ
-- a través de la orden de trabajo

-- NOTA: Descomentar este bloque si se desea migrar datos existentes
/*
UPDATE reporte_auditoria_ddjj r
SET id_ddjj = ot.id_ddjj
FROM orden_trabajo ot
WHERE r.id_orden_trabajo = ot.id_orden
  AND ot.id_ddjj IS NOT NULL
  AND r.id_ddjj IS NULL;
*/

-- =====================================================
-- PASO 10: Migración de asignaciones de usuarios (OPCIONAL)
-- =====================================================
-- Migrar asignaciones de usuarios desde orden_x_usuario a ddjj_x_usuario
-- basándose en la DDJJ de cada orden

-- NOTA: Descomentar este bloque si se desea migrar datos existentes
/*
INSERT INTO ddjj_x_usuario (id_ddjj, id_usuario, tipo_asignacion, created_at)
SELECT DISTINCT
    ot.id_ddjj,
    oxu.id_usuario,
    CASE 
        WHEN u.id_rol IN (SELECT id_rol FROM rol WHERE nombre ILIKE '%inspector%') THEN 'Inspector'
        WHEN u.id_rol IN (SELECT id_rol FROM rol WHERE nombre ILIKE '%auditor%') THEN 'Auditor'
        ELSE 'Inspector'
    END,
    oxu.created_at
FROM orden_x_usuario oxu
INNER JOIN orden_trabajo ot ON oxu.id_orden_trabajo = ot.id_orden
INNER JOIN usuario u ON oxu.id_usuario = u.id_usuario
WHERE ot.id_ddjj IS NOT NULL
ON CONFLICT (id_ddjj, id_usuario, tipo_asignacion) DO NOTHING;
*/

-- =====================================================
-- RESUMEN DE CAMBIOS
-- =====================================================
-- 1. Nueva tabla: declaracion_jurada
-- 2. orden_trabajo: Agregada columna id_ddjj (FK a declaracion_jurada)
-- 3. inspeccion_ddjj: Agregada columna id_ddjj (FK a declaracion_jurada)
-- 4. reporte_auditoria_ddjj: Agregada columna id_ddjj (FK a declaracion_jurada)
-- 5. Nueva tabla: ddjj_x_usuario (relación DDJJ - Usuario)
-- 6. Triggers y índices creados
-- 7. Scripts de migración opcionales (comentados)
-- =====================================================

