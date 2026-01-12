-- =====================================================
-- SCRIPT: Asignar DDJJ a Orden de Trabajo Existente
-- =====================================================
-- Este script crea una nueva DDJJ y la asigna a una
-- orden de trabajo ya existente.
-- 
-- IMPORTANTE: Modificar los valores según sea necesario:
-- - id_orden_trabajo: ID de la orden de trabajo a la que asignar la DDJJ
-- - id_empresa: ID de la empresa (opcional, se puede obtener del vehículo)
-- - numero_ddjj: Número de DDJJ (opcional, se genera automáticamente si no se proporciona)
-- =====================================================

-- =====================================================
-- OPCIÓN 1: Asignar DDJJ a una orden de trabajo específica
-- =====================================================
-- Reemplazar el valor de id_orden_trabajo con el ID real
-- 
-- CONFIGURACIÓN:
-- - reasignar_ddjj_existente: Si es TRUE, crea una nueva DDJJ aunque ya exista una
--   Si es FALSE, solo informa si ya tiene DDJJ asignada

DO $$
DECLARE
    id_orden_trabajo_param INTEGER := 1; -- ⚠️ CAMBIAR: ID de la orden de trabajo
    reasignar_ddjj_existente BOOLEAN := FALSE; -- ⚠️ CAMBIAR: TRUE para reasignar si ya tiene DDJJ
    nueva_ddjj_id INTEGER;
    ddjj_existente_id INTEGER;
    numero_ddjj VARCHAR(100);
    id_empresa_ot INTEGER;
    fecha_generacion_ot TIMESTAMP WITH TIME ZONE;
    contador_ddjj INTEGER := 1;
    numero_ddjj_temp VARCHAR(100);
BEGIN
    -- Verificar que la orden de trabajo existe
    IF NOT EXISTS (SELECT 1 FROM orden_trabajo WHERE id_orden = id_orden_trabajo_param) THEN
        RAISE EXCEPTION 'La orden de trabajo con ID % no existe', id_orden_trabajo_param;
    END IF;

    -- Verificar si la orden de trabajo ya tiene una DDJJ asignada
    SELECT id_ddjj INTO ddjj_existente_id
    FROM orden_trabajo
    WHERE id_orden = id_orden_trabajo_param;

    IF ddjj_existente_id IS NOT NULL THEN
        IF reasignar_ddjj_existente THEN
            RAISE NOTICE 'La orden de trabajo con ID % ya tiene una DDJJ asignada (id_ddjj: %). Se creará una nueva DDJJ.', 
                id_orden_trabajo_param, 
                ddjj_existente_id;
        ELSE
            DECLARE
                numero_ddjj_existente VARCHAR(100);
                estado_ddjj_existente VARCHAR(50);
            BEGIN
                SELECT dj.numero_ddjj, dj.estado 
                INTO numero_ddjj_existente, estado_ddjj_existente
                FROM declaracion_jurada dj 
                WHERE dj.id_ddjj = ddjj_existente_id;
                
                RAISE NOTICE 'La orden de trabajo con ID % ya tiene una DDJJ asignada:', id_orden_trabajo_param;
                RAISE NOTICE '  - ID DDJJ: %', ddjj_existente_id;
                RAISE NOTICE '  - Número DDJJ: %', numero_ddjj_existente;
                RAISE NOTICE '  - Estado: %', estado_ddjj_existente;
                RAISE NOTICE '';
                RAISE NOTICE 'Para crear una nueva DDJJ y reasignarla, cambia reasignar_ddjj_existente a TRUE.';
            END;
            RETURN; -- Salir sin hacer cambios
        END IF;
    END IF;

    -- Obtener información de la orden de trabajo
    SELECT 
        ot.fecha_generacion,
        v.id_empresa
    INTO 
        fecha_generacion_ot,
        id_empresa_ot
    FROM orden_trabajo ot
    LEFT JOIN vehiculo v ON ot.id_vehiculo = v.id_vehiculo
    WHERE ot.id_orden = id_orden_trabajo_param;

    -- Generar número de DDJJ único
    -- Formato: DDJJ-YYYYMMDD-XXXXXX
    numero_ddjj := 'DDJJ-' || 
                  TO_CHAR(COALESCE(fecha_generacion_ot::DATE, CURRENT_DATE), 'YYYYMMDD') || 
                  '-' || 
                  LPAD(id_orden_trabajo_param::TEXT, 6, '0');
    
    -- Verificar que el número no exista (muy improbable, pero por seguridad)
    numero_ddjj_temp := numero_ddjj;
    WHILE EXISTS (SELECT 1 FROM declaracion_jurada dj WHERE dj.numero_ddjj = numero_ddjj_temp) LOOP
        numero_ddjj := numero_ddjj || '-' || contador_ddjj::TEXT;
        numero_ddjj_temp := numero_ddjj;
        contador_ddjj := contador_ddjj + 1;
    END LOOP;

    -- Crear la DDJJ
    INSERT INTO declaracion_jurada (
        numero_ddjj,
        id_empresa,
        fecha_creacion,
        estado
    )
    VALUES (
        numero_ddjj,
        id_empresa_ot,
        COALESCE(fecha_generacion_ot, NOW()),
        'Pendiente'
    )
    RETURNING id_ddjj INTO nueva_ddjj_id;

    -- Asignar la DDJJ a la orden de trabajo
    UPDATE orden_trabajo
    SET id_ddjj = nueva_ddjj_id
    WHERE id_orden = id_orden_trabajo_param;

    RAISE NOTICE 'DDJJ creada exitosamente:';
    RAISE NOTICE '  - ID DDJJ: %', nueva_ddjj_id;
    RAISE NOTICE '  - Número DDJJ: %', numero_ddjj;
    RAISE NOTICE '  - ID Empresa: %', id_empresa_ot;
    RAISE NOTICE '  - Asignada a Orden de Trabajo ID: %', id_orden_trabajo_param;

END $$;

-- =====================================================
-- OPCIÓN 2: Asignar DDJJ a múltiples órdenes de trabajo sin DDJJ
-- =====================================================
-- Este script crea una DDJJ para cada orden de trabajo
-- que no tenga una DDJJ asignada

/*
DO $$
DECLARE
    orden_record RECORD;
    nueva_ddjj_id INTEGER;
    numero_ddjj VARCHAR(100);
    contador INTEGER := 1;
    numero_ddjj_temp VARCHAR(100);
    id_empresa_orden INTEGER;
    fecha_base DATE;
BEGIN
    RAISE NOTICE 'Iniciando asignación de DDJJ a órdenes de trabajo sin DDJJ...';
    
    -- Para cada orden de trabajo sin DDJJ
    FOR orden_record IN 
        SELECT 
            ot.id_orden,
            ot.id_vehiculo,
            ot.fecha_generacion,
            ot.nro_orden_trabajo,
            v.id_empresa
        FROM orden_trabajo ot
        LEFT JOIN vehiculo v ON ot.id_vehiculo = v.id_vehiculo
        WHERE ot.id_ddjj IS NULL
        ORDER BY ot.fecha_generacion DESC NULLS LAST, ot.id_orden
    LOOP
        -- Generar número de DDJJ único
        -- Formato: DDJJ-YYYYMMDD-XXXXXX (donde XXXXXX es el ID de la orden)
        numero_ddjj := 'DDJJ-' || 
                      TO_CHAR(COALESCE(orden_record.fecha_generacion::DATE, CURRENT_DATE), 'YYYYMMDD') || 
                      '-' || 
                      LPAD(orden_record.id_orden::TEXT, 6, '0');
        
        -- Verificar que el número no exista (muy improbable, pero por seguridad)
        numero_ddjj_temp := numero_ddjj;
        IF EXISTS (SELECT 1 FROM declaracion_jurada dj WHERE dj.numero_ddjj = numero_ddjj_temp) THEN
            numero_ddjj := numero_ddjj || '-' || contador::TEXT;
        END IF;
        
        -- Crear la DDJJ
        INSERT INTO declaracion_jurada (
            numero_ddjj,
            id_empresa,
            fecha_creacion,
            estado
        )
        VALUES (
            numero_ddjj,
            orden_record.id_empresa,
            COALESCE(orden_record.fecha_generacion, NOW()),
            'Pendiente'
        )
        RETURNING id_ddjj INTO nueva_ddjj_id;
        
        -- Asignar la DDJJ a la orden de trabajo
        UPDATE orden_trabajo
        SET id_ddjj = nueva_ddjj_id
        WHERE id_orden = orden_record.id_orden;
        
        contador := contador + 1;
        
        -- Log cada 100 registros
        IF contador % 100 = 0 THEN
            RAISE NOTICE 'Procesadas % órdenes de trabajo...', contador - 1;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Asignación completada. Total procesadas: %', contador - 1;
END $$;
*/

-- =====================================================
-- OPCIÓN 3: Asignar DDJJ manualmente con valores específicos
-- =====================================================
-- Descomentar y modificar los valores según sea necesario

/*
DO $$
DECLARE
    id_orden_trabajo_param INTEGER := 1; -- ⚠️ CAMBIAR: ID de la orden de trabajo
    id_empresa_param INTEGER := 1; -- ⚠️ CAMBIAR: ID de la empresa (opcional)
    numero_ddjj_param VARCHAR(100) := NULL; -- ⚠️ CAMBIAR: Número de DDJJ (opcional, se genera si es NULL)
    reasignar_ddjj_existente BOOLEAN := FALSE; -- ⚠️ CAMBIAR: TRUE para reasignar si ya tiene DDJJ
    nueva_ddjj_id INTEGER;
    ddjj_existente_id INTEGER;
    numero_ddjj_final VARCHAR(100);
    fecha_generacion_ot TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Verificar que la orden de trabajo existe
    IF NOT EXISTS (SELECT 1 FROM orden_trabajo WHERE id_orden = id_orden_trabajo_param) THEN
        RAISE EXCEPTION 'La orden de trabajo con ID % no existe', id_orden_trabajo_param;
    END IF;

    -- Verificar si la orden de trabajo ya tiene una DDJJ asignada
    SELECT id_ddjj INTO ddjj_existente_id
    FROM orden_trabajo
    WHERE id_orden = id_orden_trabajo_param;

    IF ddjj_existente_id IS NOT NULL AND NOT reasignar_ddjj_existente THEN
        RAISE NOTICE 'La orden de trabajo con ID % ya tiene una DDJJ asignada (id_ddjj: %).', 
            id_orden_trabajo_param, 
            ddjj_existente_id;
        RAISE NOTICE 'Para crear una nueva DDJJ, cambia reasignar_ddjj_existente a TRUE.';
        RETURN;
    END IF;

    -- Obtener fecha de generación de la orden de trabajo
    SELECT fecha_generacion INTO fecha_generacion_ot
    FROM orden_trabajo
    WHERE id_orden = id_orden_trabajo_param;

    -- Si no se proporciona número de DDJJ, generarlo automáticamente
    IF numero_ddjj_param IS NULL THEN
        numero_ddjj_final := 'DDJJ-' || 
                           TO_CHAR(COALESCE(fecha_generacion_ot::DATE, CURRENT_DATE), 'YYYYMMDD') || 
                           '-' || 
                           LPAD(id_orden_trabajo_param::TEXT, 6, '0');
    ELSE
        numero_ddjj_final := numero_ddjj_param;
    END IF;

    -- Verificar que el número de DDJJ no exista
    IF EXISTS (SELECT 1 FROM declaracion_jurada WHERE numero_ddjj = numero_ddjj_final) THEN
        RAISE EXCEPTION 'El número de DDJJ % ya existe', numero_ddjj_final;
    END IF;

    -- Si no se proporciona id_empresa, obtenerlo del vehículo
    IF id_empresa_param IS NULL THEN
        SELECT v.id_empresa INTO id_empresa_param
        FROM orden_trabajo ot
        JOIN vehiculo v ON ot.id_vehiculo = v.id_vehiculo
        WHERE ot.id_orden = id_orden_trabajo_param;
    END IF;

    -- Crear la DDJJ
    INSERT INTO declaracion_jurada (
        numero_ddjj,
        id_empresa,
        fecha_creacion,
        estado
    )
    VALUES (
        numero_ddjj_final,
        id_empresa_param,
        COALESCE(fecha_generacion_ot, NOW()),
        'Pendiente'
    )
    RETURNING id_ddjj INTO nueva_ddjj_id;

    -- Asignar la DDJJ a la orden de trabajo
    UPDATE orden_trabajo
    SET id_ddjj = nueva_ddjj_id
    WHERE id_orden = id_orden_trabajo_param;

    RAISE NOTICE 'DDJJ creada y asignada exitosamente:';
    RAISE NOTICE '  - ID DDJJ: %', nueva_ddjj_id;
    RAISE NOTICE '  - Número DDJJ: %', numero_ddjj_final;
    RAISE NOTICE '  - ID Empresa: %', id_empresa_param;
    RAISE NOTICE '  - Asignada a Orden de Trabajo ID: %', id_orden_trabajo_param;

END $$;
*/

-- =====================================================
-- VERIFICACIÓN: Consultar órdenes de trabajo con DDJJ asignada
-- =====================================================
-- Descomentar para verificar los resultados

/*
SELECT 
    ot.id_orden,
    ot.nro_orden_trabajo,
    ot.fecha_generacion,
    ot.id_ddjj,
    dj.numero_ddjj,
    dj.id_empresa,
    e.nombre_empresa,
    dj.estado as estado_ddjj
FROM orden_trabajo ot
LEFT JOIN declaracion_jurada dj ON ot.id_ddjj = dj.id_ddjj
LEFT JOIN empresa e ON dj.id_empresa = e.id_empresa
WHERE ot.id_ddjj IS NOT NULL
ORDER BY ot.fecha_generacion DESC
LIMIT 10;
*/

-- =====================================================
-- VERIFICACIÓN: Consultar órdenes de trabajo SIN DDJJ asignada
-- =====================================================
-- Descomentar para ver órdenes que aún no tienen DDJJ

/*
SELECT 
    ot.id_orden,
    ot.nro_orden_trabajo,
    ot.fecha_generacion,
    ot.id_ddjj,
    v.id_empresa,
    e.nombre_empresa
FROM orden_trabajo ot
LEFT JOIN vehiculo v ON ot.id_vehiculo = v.id_vehiculo
LEFT JOIN empresa e ON v.id_empresa = e.id_empresa
WHERE ot.id_ddjj IS NULL
ORDER BY ot.fecha_generacion DESC
LIMIT 10;
*/

