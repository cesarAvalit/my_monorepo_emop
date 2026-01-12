-- =====================================================
-- SCRIPT: Migración de Datos Existentes - DDJJ
-- =====================================================
-- Este script migra los datos existentes a la nueva
-- estructura donde una DDJJ puede contener múltiples
-- órdenes de trabajo.
-- 
-- IMPORTANTE: Ejecutar este script DESPUÉS de ejecutar
-- restructurar_ddjj_ordenes_trabajo.sql
-- =====================================================

-- =====================================================
-- PASO 1: Verificar que las tablas existen
-- =====================================================

DO $$
BEGIN
    -- Verificar que la tabla declaracion_jurada existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_name = 'declaracion_jurada') THEN
        RAISE EXCEPTION 'La tabla declaracion_jurada no existe. Ejecuta primero restructurar_ddjj_ordenes_trabajo.sql';
    END IF;
    
    -- Verificar que la columna id_ddjj existe en orden_trabajo
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orden_trabajo' AND column_name = 'id_ddjj') THEN
        RAISE EXCEPTION 'La columna id_ddjj no existe en orden_trabajo. Ejecuta primero restructurar_ddjj_ordenes_trabajo.sql';
    END IF;
    
    RAISE NOTICE 'Verificación de estructura completada correctamente';
END $$;

-- =====================================================
-- PASO 2: Crear DDJJ para órdenes de trabajo existentes
-- =====================================================
-- Para cada orden de trabajo sin DDJJ, crearemos una DDJJ individual
-- usando el número de orden de trabajo como base para el número de DDJJ

DO $$
DECLARE
    orden_record RECORD;
    nueva_ddjj_id INTEGER;
    contador INTEGER := 1;
    numero_ddjj VARCHAR(100);
    numero_ddjj_temp VARCHAR(100);  -- Variable temporal para evitar ambigüedad
    id_empresa_orden INTEGER;
    fecha_base DATE;
BEGIN
    RAISE NOTICE 'Iniciando migración de órdenes de trabajo a DDJJ...';
    
    -- Obtener fecha base para numeración
    SELECT COALESCE(MIN(fecha_generacion), CURRENT_DATE) INTO fecha_base
    FROM orden_trabajo
    WHERE id_ddjj IS NULL;
    
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
        -- Usar el ID de la orden como parte del número para garantizar unicidad
        numero_ddjj := 'DDJJ-' || 
                      TO_CHAR(COALESCE(orden_record.fecha_generacion::DATE, CURRENT_DATE), 'YYYYMMDD') || 
                      '-' || 
                      LPAD(orden_record.id_orden::TEXT, 6, '0');
        
        -- Verificar que el número no exista (muy improbable, pero por seguridad)
        -- Si existe, agregar un sufijo con el contador
        -- Usar variable temporal para evitar ambigüedad
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
            'Completada'  -- Las órdenes existentes se consideran completadas
        )
        RETURNING id_ddjj INTO nueva_ddjj_id;
        
        -- Asignar la DDJJ a la orden de trabajo
        UPDATE orden_trabajo
        SET id_ddjj = nueva_ddjj_id
        WHERE id_orden = orden_record.id_orden;
        
        contador := contador + 1;
        
        -- Log cada 100 registros
        IF contador % 100 = 0 THEN
            RAISE NOTICE 'Procesadas % órdenes de trabajo...', contador;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Migración de órdenes de trabajo completada. Total procesadas: %', contador - 1;
END $$;

-- =====================================================
-- PASO 3: Migrar inspecciones existentes
-- =====================================================
-- Actualizar inspeccion_ddjj para que referencien la DDJJ
-- a través de la orden de trabajo

DO $$
DECLARE
    inspecciones_actualizadas INTEGER := 0;
BEGIN
    RAISE NOTICE 'Iniciando migración de inspecciones...';
    
    UPDATE inspeccion_ddjj i
    SET id_ddjj = ot.id_ddjj
    FROM orden_trabajo ot
    WHERE i.id_orden_trabajo = ot.id_orden
      AND ot.id_ddjj IS NOT NULL
      AND i.id_ddjj IS NULL;
    
    GET DIAGNOSTICS inspecciones_actualizadas = ROW_COUNT;
    
    RAISE NOTICE 'Inspecciones actualizadas: %', inspecciones_actualizadas;
END $$;

-- =====================================================
-- PASO 4: Migrar reportes de auditoría existentes
-- =====================================================
-- Actualizar reporte_auditoria_ddjj para que referencien la DDJJ
-- a través de la orden de trabajo

DO $$
DECLARE
    reportes_actualizados INTEGER := 0;
BEGIN
    RAISE NOTICE 'Iniciando migración de reportes de auditoría...';
    
    UPDATE reporte_auditoria_ddjj r
    SET id_ddjj = ot.id_ddjj
    FROM orden_trabajo ot
    WHERE r.id_orden_trabajo = ot.id_orden
      AND ot.id_ddjj IS NOT NULL
      AND r.id_ddjj IS NULL;
    
    GET DIAGNOSTICS reportes_actualizados = ROW_COUNT;
    
    RAISE NOTICE 'Reportes de auditoría actualizados: %', reportes_actualizados;
END $$;

-- =====================================================
-- PASO 5: Migrar asignaciones de usuarios
-- =====================================================
-- Migrar asignaciones desde orden_x_usuario a ddjj_x_usuario
-- basándose en la DDJJ de cada orden

DO $$
DECLARE
    asignaciones_migradas INTEGER := 0;
    tipo_asignacion_determinado VARCHAR(50);
BEGIN
    RAISE NOTICE 'Iniciando migración de asignaciones de usuarios...';
    
    -- Para cada asignación en orden_x_usuario
    FOR tipo_asignacion_determinado IN 
        SELECT DISTINCT 
            CASE 
                WHEN r.nombre ILIKE '%inspector%' OR r.nombre ILIKE '%inspector%' THEN 'Inspector'
                WHEN r.nombre ILIKE '%auditor%' OR r.nombre ILIKE '%auditor%' THEN 'Auditor'
                ELSE 'Inspector'  -- Por defecto
            END as tipo
        FROM orden_x_usuario oxu
        INNER JOIN usuario u ON oxu.id_usuario = u.id_usuario
        INNER JOIN rol r ON u.id_rol = r.id_rol
        INNER JOIN orden_trabajo ot ON oxu.id_orden_trabajo = ot.id_orden
        WHERE ot.id_ddjj IS NOT NULL
    LOOP
        -- Insertar asignaciones agrupadas por DDJJ
        INSERT INTO ddjj_x_usuario (id_ddjj, id_usuario, tipo_asignacion, created_at)
        SELECT DISTINCT
            ot.id_ddjj,
            oxu.id_usuario,
            CASE 
                WHEN r.nombre ILIKE '%inspector%' OR r.nombre ILIKE '%inspector%' THEN 'Inspector'
                WHEN r.nombre ILIKE '%auditor%' OR r.nombre ILIKE '%auditor%' THEN 'Auditor'
                ELSE 'Inspector'
            END,
            MIN(oxu.created_at)  -- Usar la fecha de asignación más antigua
        FROM orden_x_usuario oxu
        INNER JOIN orden_trabajo ot ON oxu.id_orden_trabajo = ot.id_orden
        INNER JOIN usuario u ON oxu.id_usuario = u.id_usuario
        INNER JOIN rol r ON u.id_rol = r.id_rol
        WHERE ot.id_ddjj IS NOT NULL
        GROUP BY ot.id_ddjj, oxu.id_usuario, r.nombre
        ON CONFLICT (id_ddjj, id_usuario, tipo_asignacion) DO NOTHING;
    END LOOP;
    
    SELECT COUNT(*) INTO asignaciones_migradas FROM ddjj_x_usuario;
    
    RAISE NOTICE 'Asignaciones migradas: %', asignaciones_migradas;
END $$;

-- =====================================================
-- PASO 6: Verificación y estadísticas
-- =====================================================

DO $$
DECLARE
    total_ddjj INTEGER;
    total_ordenes_con_ddjj INTEGER;
    total_ordenes_sin_ddjj INTEGER;
    total_inspecciones_con_ddjj INTEGER;
    total_reportes_con_ddjj INTEGER;
    total_asignaciones INTEGER;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'VERIFICACIÓN DE MIGRACIÓN';
    RAISE NOTICE '========================================';
    
    -- Contar DDJJ creadas
    SELECT COUNT(*) INTO total_ddjj FROM declaracion_jurada;
    RAISE NOTICE 'Total de DDJJ creadas: %', total_ddjj;
    
    -- Contar órdenes con DDJJ
    SELECT COUNT(*) INTO total_ordenes_con_ddjj 
    FROM orden_trabajo 
    WHERE id_ddjj IS NOT NULL;
    RAISE NOTICE 'Órdenes de trabajo con DDJJ: %', total_ordenes_con_ddjj;
    
    -- Contar órdenes sin DDJJ
    SELECT COUNT(*) INTO total_ordenes_sin_ddjj 
    FROM orden_trabajo 
    WHERE id_ddjj IS NULL;
    RAISE NOTICE 'Órdenes de trabajo sin DDJJ: %', total_ordenes_sin_ddjj;
    
    -- Contar inspecciones con DDJJ
    SELECT COUNT(*) INTO total_inspecciones_con_ddjj 
    FROM inspeccion_ddjj 
    WHERE id_ddjj IS NOT NULL;
    RAISE NOTICE 'Inspecciones con DDJJ: %', total_inspecciones_con_ddjj;
    
    -- Contar reportes con DDJJ
    SELECT COUNT(*) INTO total_reportes_con_ddjj 
    FROM reporte_auditoria_ddjj 
    WHERE id_ddjj IS NOT NULL;
    RAISE NOTICE 'Reportes de auditoría con DDJJ: %', total_reportes_con_ddjj;
    
    -- Contar asignaciones
    SELECT COUNT(*) INTO total_asignaciones FROM ddjj_x_usuario;
    RAISE NOTICE 'Asignaciones DDJJ-Usuario: %', total_asignaciones;
    
    RAISE NOTICE '========================================';
    
    -- Advertencia si hay órdenes sin DDJJ
    IF total_ordenes_sin_ddjj > 0 THEN
        RAISE WARNING 'Hay % órdenes de trabajo sin DDJJ asignada. Revisar manualmente.', total_ordenes_sin_ddjj;
    END IF;
END $$;

-- =====================================================
-- FIN DE LA MIGRACIÓN
-- =====================================================

