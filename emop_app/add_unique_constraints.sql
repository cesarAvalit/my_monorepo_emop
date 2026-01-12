-- =====================================================
-- Script para Agregar Restricciones UNIQUE
-- Sistema EMOP - Supabase
-- =====================================================
-- Este script agrega restricciones UNIQUE a campos específicos
-- para garantizar la integridad de los datos
-- =====================================================

-- =====================================================
-- TABLA: usuario
-- =====================================================

-- Agregar restricción UNIQUE a dni (si no existe)
-- Nota: email ya tiene UNIQUE en el schema original
DO $$
BEGIN
    -- Verificar si la restricción ya existe antes de crearla
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'usuario_dni_key' 
        AND conrelid = 'usuario'::regclass
    ) THEN
        -- Primero, eliminar posibles duplicados (opcional, comentado por seguridad)
        -- DELETE FROM usuario WHERE id_usuario NOT IN (
        --     SELECT MIN(id_usuario) FROM usuario GROUP BY dni HAVING dni IS NOT NULL
        -- );
        
        -- Agregar restricción UNIQUE a dni
        ALTER TABLE usuario 
        ADD CONSTRAINT usuario_dni_key UNIQUE (dni);
        
        RAISE NOTICE 'Restricción UNIQUE agregada a usuario.dni';
    ELSE
        RAISE NOTICE 'La restricción UNIQUE en usuario.dni ya existe';
    END IF;
END $$;

-- =====================================================
-- TABLA: vehiculo
-- =====================================================

-- Agregar restricción UNIQUE a interno (si no existe)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'vehiculo_interno_key' 
        AND conrelid = 'vehiculo'::regclass
    ) THEN
        -- Primero, eliminar posibles duplicados (opcional, comentado por seguridad)
        -- DELETE FROM vehiculo WHERE id NOT IN (
        --     SELECT MIN(id) FROM vehiculo GROUP BY interno HAVING interno IS NOT NULL
        -- );
        
        -- Agregar restricción UNIQUE a interno
        ALTER TABLE vehiculo 
        ADD CONSTRAINT vehiculo_interno_key UNIQUE (interno);
        
        RAISE NOTICE 'Restricción UNIQUE agregada a vehiculo.interno';
    ELSE
        RAISE NOTICE 'La restricción UNIQUE en vehiculo.interno ya existe';
    END IF;
END $$;

-- Agregar restricción UNIQUE a matricula (si no existe)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'vehiculo_matricula_key' 
        AND conrelid = 'vehiculo'::regclass
    ) THEN
        -- Primero, eliminar posibles duplicados (opcional, comentado por seguridad)
        -- DELETE FROM vehiculo WHERE id NOT IN (
        --     SELECT MIN(id) FROM vehiculo GROUP BY matricula HAVING matricula IS NOT NULL
        -- );
        
        -- Agregar restricción UNIQUE a matricula
        ALTER TABLE vehiculo 
        ADD CONSTRAINT vehiculo_matricula_key UNIQUE (matricula);
        
        RAISE NOTICE 'Restricción UNIQUE agregada a vehiculo.matricula';
    ELSE
        RAISE NOTICE 'La restricción UNIQUE en vehiculo.matricula ya existe';
    END IF;
END $$;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Mostrar todas las restricciones UNIQUE creadas
SELECT 
    tc.table_name,
    kcu.column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'UNIQUE'
    AND tc.table_name IN ('usuario', 'vehiculo')
    AND kcu.column_name IN ('dni', 'email', 'interno', 'matricula')
ORDER BY tc.table_name, kcu.column_name;

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================
-- 
-- NOTAS IMPORTANTES:
-- 
-- 1. Este script verifica si las restricciones ya existen antes de crearlas
--    para evitar errores si se ejecuta múltiples veces.
-- 
-- 2. Si hay datos duplicados en los campos antes de ejecutar este script,
--    la creación de la restricción fallará. En ese caso, necesitarás:
--    a) Limpiar los duplicados manualmente
--    b) O descomentar las secciones DELETE para eliminar duplicados
--       (¡CUIDADO! Esto eliminará registros)
-- 
-- 3. Los campos NULL no violan restricciones UNIQUE en PostgreSQL,
--    por lo que múltiples registros con NULL están permitidos.
-- 
-- 4. Para verificar duplicados antes de ejecutar:
--    SELECT dni, COUNT(*) FROM usuario WHERE dni IS NOT NULL GROUP BY dni HAVING COUNT(*) > 1;
--    SELECT interno, COUNT(*) FROM vehiculo WHERE interno IS NOT NULL GROUP BY interno HAVING COUNT(*) > 1;
--    SELECT matricula, COUNT(*) FROM vehiculo WHERE matricula IS NOT NULL GROUP BY matricula HAVING COUNT(*) > 1;

