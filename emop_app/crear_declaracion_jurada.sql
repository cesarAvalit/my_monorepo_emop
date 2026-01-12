-- =====================================================
-- SCRIPT: Crear Nueva Declaración Jurada (DDJJ)
-- =====================================================
-- Este script crea una nueva DDJJ en la tabla
-- declaracion_jurada.
-- 
-- IMPORTANTE: Modificar los valores según sea necesario:
-- - id_empresa: ID de la empresa (opcional)
-- - numero_ddjj: Número de DDJJ (opcional, se genera automáticamente si no se proporciona)
-- - fecha_creacion: Fecha de creación (opcional, se usa NOW() si no se proporciona)
-- - fecha_vencimiento: Fecha de vencimiento (opcional)
-- - estado: Estado de la DDJJ (opcional, default: 'Pendiente')
-- - observaciones: Observaciones (opcional)
-- =====================================================

-- =====================================================
-- OPCIÓN 1: Crear DDJJ con valores específicos
-- =====================================================
-- Reemplazar los valores según sea necesario

DO $$
DECLARE
    id_empresa_param INTEGER := NULL; -- ⚠️ CAMBIAR: ID de la empresa (opcional)
    numero_ddjj_param VARCHAR(100) := NULL; -- ⚠️ CAMBIAR: Número de DDJJ (opcional, se genera si es NULL)
    fecha_creacion_param TIMESTAMP WITH TIME ZONE := NULL; -- ⚠️ CAMBIAR: Fecha de creación (opcional)
    fecha_vencimiento_param TIMESTAMP WITH TIME ZONE := NULL; -- ⚠️ CAMBIAR: Fecha de vencimiento (opcional)
    estado_param VARCHAR(50) := 'Pendiente'; -- ⚠️ CAMBIAR: Estado (Pendiente, En Proceso, Completada, Cancelada)
    observaciones_param TEXT := NULL; -- ⚠️ CAMBIAR: Observaciones (opcional)
    
    nueva_ddjj_id INTEGER;
    numero_ddjj_final VARCHAR(100);
    fecha_creacion_final TIMESTAMP WITH TIME ZONE;
    contador_ddjj INTEGER := 1;
    numero_ddjj_temp VARCHAR(100);
BEGIN
    -- Si no se proporciona número de DDJJ, generarlo automáticamente
    IF numero_ddjj_param IS NULL THEN
        -- Obtener la fecha base para la numeración
        fecha_creacion_final := COALESCE(fecha_creacion_param, NOW());
        
        -- Generar número de DDJJ único
        -- Formato: DDJJ-YYYYMMDD-XXXXXX
        numero_ddjj_final := 'DDJJ-' || 
                           TO_CHAR(fecha_creacion_final::DATE, 'YYYYMMDD') || 
                           '-' || 
                           LPAD((COALESCE((SELECT MAX(id_ddjj) FROM declaracion_jurada), 0) + 1)::TEXT, 6, '0');
        
        -- Verificar que el número no exista (muy improbable, pero por seguridad)
        numero_ddjj_temp := numero_ddjj_final;
        WHILE EXISTS (SELECT 1 FROM declaracion_jurada dj WHERE dj.numero_ddjj = numero_ddjj_temp) LOOP
            numero_ddjj_final := 'DDJJ-' || 
                               TO_CHAR(fecha_creacion_final::DATE, 'YYYYMMDD') || 
                               '-' || 
                               LPAD((COALESCE((SELECT MAX(id_ddjj) FROM declaracion_jurada), 0) + contador_ddjj)::TEXT, 6, '0');
            numero_ddjj_temp := numero_ddjj_final;
            contador_ddjj := contador_ddjj + 1;
        END LOOP;
    ELSE
        numero_ddjj_final := numero_ddjj_param;
        fecha_creacion_final := COALESCE(fecha_creacion_param, NOW());
        
        -- Verificar que el número de DDJJ no exista
        IF EXISTS (SELECT 1 FROM declaracion_jurada WHERE numero_ddjj = numero_ddjj_final) THEN
            RAISE EXCEPTION 'El número de DDJJ % ya existe', numero_ddjj_final;
        END IF;
    END IF;

    -- Validar estado
    IF estado_param NOT IN ('Pendiente', 'En Proceso', 'Completada', 'Cancelada') THEN
        RAISE EXCEPTION 'El estado % no es válido. Debe ser: Pendiente, En Proceso, Completada o Cancelada', estado_param;
    END IF;

    -- Validar empresa si se proporciona
    IF id_empresa_param IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM empresa WHERE id_empresa = id_empresa_param) THEN
            RAISE EXCEPTION 'La empresa con ID % no existe', id_empresa_param;
        END IF;
    END IF;

    -- Crear la DDJJ
    INSERT INTO declaracion_jurada (
        numero_ddjj,
        id_empresa,
        fecha_creacion,
        fecha_vencimiento,
        estado,
        observaciones
    )
    VALUES (
        numero_ddjj_final,
        id_empresa_param,
        fecha_creacion_final,
        fecha_vencimiento_param,
        estado_param,
        observaciones_param
    )
    RETURNING id_ddjj INTO nueva_ddjj_id;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'DDJJ creada exitosamente:';
    RAISE NOTICE '========================================';
    RAISE NOTICE '  - ID DDJJ: %', nueva_ddjj_id;
    RAISE NOTICE '  - Número DDJJ: %', numero_ddjj_final;
    RAISE NOTICE '  - ID Empresa: %', COALESCE(id_empresa_param::TEXT, 'NULL');
    RAISE NOTICE '  - Fecha creación: %', fecha_creacion_final;
    RAISE NOTICE '  - Fecha vencimiento: %', COALESCE(fecha_vencimiento_param::TEXT, 'NULL');
    RAISE NOTICE '  - Estado: %', estado_param;
    RAISE NOTICE '  - Observaciones: %', COALESCE(observaciones_param, 'NULL');
    RAISE NOTICE '========================================';

END $$;

-- =====================================================
-- OPCIÓN 2: Crear DDJJ simple (solo con número automático)
-- =====================================================
-- Descomentar para usar esta versión simplificada

/*
DO $$
DECLARE
    nueva_ddjj_id INTEGER;
    numero_ddjj VARCHAR(100);
    fecha_creacion TIMESTAMP WITH TIME ZONE;
    contador INTEGER := 1;
    numero_ddjj_temp VARCHAR(100);
BEGIN
    fecha_creacion := NOW();
    
    -- Generar número de DDJJ único
    numero_ddjj := 'DDJJ-' || 
                  TO_CHAR(fecha_creacion::DATE, 'YYYYMMDD') || 
                  '-' || 
                  LPAD((COALESCE((SELECT MAX(id_ddjj) FROM declaracion_jurada), 0) + 1)::TEXT, 6, '0');
    
    -- Verificar que el número no exista
    numero_ddjj_temp := numero_ddjj;
    WHILE EXISTS (SELECT 1 FROM declaracion_jurada dj WHERE dj.numero_ddjj = numero_ddjj_temp) LOOP
        numero_ddjj := 'DDJJ-' || 
                      TO_CHAR(fecha_creacion::DATE, 'YYYYMMDD') || 
                      '-' || 
                      LPAD((COALESCE((SELECT MAX(id_ddjj) FROM declaracion_jurada), 0) + contador)::TEXT, 6, '0');
        numero_ddjj_temp := numero_ddjj;
        contador := contador + 1;
    END LOOP;

    -- Crear la DDJJ
    INSERT INTO declaracion_jurada (
        numero_ddjj,
        fecha_creacion,
        estado
    )
    VALUES (
        numero_ddjj,
        fecha_creacion,
        'Pendiente'
    )
    RETURNING id_ddjj INTO nueva_ddjj_id;

    RAISE NOTICE 'DDJJ creada exitosamente:';
    RAISE NOTICE '  - ID DDJJ: %', nueva_ddjj_id;
    RAISE NOTICE '  - Número DDJJ: %', numero_ddjj;

END $$;
*/

-- =====================================================
-- OPCIÓN 3: Crear DDJJ con INSERT directo
-- =====================================================
-- Descomentar y modificar los valores según sea necesario

/*
INSERT INTO declaracion_jurada (
    numero_ddjj,
    id_empresa,
    fecha_creacion,
    fecha_vencimiento,
    estado,
    observaciones
)
VALUES (
    'DDJJ-20260109-000001',  -- ⚠️ CAMBIAR: Número de DDJJ (debe ser único)
    1,                        -- ⚠️ CAMBIAR: ID de la empresa (opcional, puede ser NULL)
    NOW(),                    -- ⚠️ CAMBIAR: Fecha de creación (opcional, puede ser NOW())
    NULL,                     -- ⚠️ CAMBIAR: Fecha de vencimiento (opcional)
    'Pendiente',              -- ⚠️ CAMBIAR: Estado (Pendiente, En Proceso, Completada, Cancelada)
    NULL                      -- ⚠️ CAMBIAR: Observaciones (opcional)
)
RETURNING id_ddjj, numero_ddjj, fecha_creacion, estado;
*/

-- =====================================================
-- VERIFICACIÓN: Consultar DDJJ creadas recientemente
-- =====================================================
-- Descomentar para verificar los resultados

/*
SELECT 
    dj.id_ddjj,
    dj.numero_ddjj,
    dj.id_empresa,
    e.nombre_empresa,
    dj.fecha_creacion,
    dj.fecha_vencimiento,
    dj.estado,
    dj.observaciones,
    dj.created_at,
    dj.updated_at,
    COUNT(ot.id_orden) as cantidad_ordenes_trabajo
FROM declaracion_jurada dj
LEFT JOIN empresa e ON dj.id_empresa = e.id_empresa
LEFT JOIN orden_trabajo ot ON dj.id_ddjj = ot.id_ddjj
GROUP BY dj.id_ddjj, dj.numero_ddjj, dj.id_empresa, e.nombre_empresa, 
         dj.fecha_creacion, dj.fecha_vencimiento, dj.estado, dj.observaciones,
         dj.created_at, dj.updated_at
ORDER BY dj.fecha_creacion DESC
LIMIT 10;
*/

-- =====================================================
-- VERIFICACIÓN: Consultar DDJJ sin órdenes de trabajo
-- =====================================================
-- Descomentar para ver DDJJ que aún no tienen órdenes asignadas

/*
SELECT 
    dj.id_ddjj,
    dj.numero_ddjj,
    dj.id_empresa,
    e.nombre_empresa,
    dj.fecha_creacion,
    dj.estado
FROM declaracion_jurada dj
LEFT JOIN empresa e ON dj.id_empresa = e.id_empresa
LEFT JOIN orden_trabajo ot ON dj.id_ddjj = ot.id_ddjj
WHERE ot.id_orden IS NULL
ORDER BY dj.fecha_creacion DESC
LIMIT 10;
*/

