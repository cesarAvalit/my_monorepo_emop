-- =====================================================
-- Script de Prueba para Insertar Empresa
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- 1. Primero, verificar las restricciones UNIQUE existentes en la tabla empresa
SELECT 
    tc.table_name as tabla,
    kcu.column_name as columna,
    tc.constraint_name as restriccion
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'UNIQUE'
    AND tc.table_name = 'empresa'
ORDER BY kcu.column_name;

-- 2. Verificar la estructura de la tabla empresa
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'empresa'
ORDER BY ordinal_position;

-- 3. Verificar si hay datos duplicados en campos que deberían ser únicos
SELECT 'CUIT duplicados' as tipo, cuit, COUNT(*) as cantidad
FROM empresa
WHERE cuit IS NOT NULL
GROUP BY cuit
HAVING COUNT(*) > 1;

SELECT 'Código empresa duplicados' as tipo, codigo_empresa, COUNT(*) as cantidad
FROM empresa
WHERE codigo_empresa IS NOT NULL
GROUP BY codigo_empresa
HAVING COUNT(*) > 1;

SELECT 'Email duplicados' as tipo, email, COUNT(*) as cantidad
FROM empresa
WHERE email IS NOT NULL
GROUP BY email
HAVING COUNT(*) > 1;

-- 4. Verificar y corregir la secuencia de id_empresa (IMPORTANTE)
-- Esto resuelve el error "duplicate key value violates unique constraint empresa_pkey"
-- Primero, verificar el estado actual de la secuencia usando last_value
SELECT 
    (SELECT last_value FROM empresa_id_empresa_seq) as secuencia_actual,
    (SELECT MAX(id_empresa) FROM empresa) as max_id_empresa,
    CASE 
        WHEN (SELECT last_value FROM empresa_id_empresa_seq) < COALESCE((SELECT MAX(id_empresa) FROM empresa), 0)
        THEN '⚠️ SECUENCIA DESINCRONIZADA - Necesita corrección'
        ELSE '✅ Secuencia OK'
    END as estado;

-- Corregir la secuencia si está desincronizada
-- Esto establece el siguiente valor de la secuencia al máximo id_empresa + 1
SELECT setval(
    'empresa_id_empresa_seq',
    COALESCE((SELECT MAX(id_empresa) FROM empresa), 0) + 1,
    false
) as secuencia_actualizada;

-- 5. Agregar restricciones UNIQUE si no existen
-- (Solo si no hay duplicados en los pasos anteriores)

-- Agregar restricción UNIQUE a codigo_empresa
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'empresa_codigo_empresa_key'
    ) THEN
        ALTER TABLE empresa 
        ADD CONSTRAINT empresa_codigo_empresa_key UNIQUE (codigo_empresa);
        RAISE NOTICE 'Restricción UNIQUE agregada a empresa.codigo_empresa';
    ELSE
        RAISE NOTICE 'La restricción UNIQUE en empresa.codigo_empresa ya existe';
    END IF;
END $$;

-- Agregar restricción UNIQUE a email
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'empresa_email_key'
    ) THEN
        ALTER TABLE empresa 
        ADD CONSTRAINT empresa_email_key UNIQUE (email);
        RAISE NOTICE 'Restricción UNIQUE agregada a empresa.email';
    ELSE
        RAISE NOTICE 'La restricción UNIQUE en empresa.email ya existe';
    END IF;
END $$;

-- Verificar que CUIT ya tiene restricción UNIQUE (debe existir desde el schema original)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'empresa_cuit_key'
    ) THEN
        ALTER TABLE empresa 
        ADD CONSTRAINT empresa_cuit_key UNIQUE (cuit);
        RAISE NOTICE 'Restricción UNIQUE agregada a empresa.cuit';
    ELSE
        RAISE NOTICE 'La restricción UNIQUE en empresa.cuit ya existe';
    END IF;
END $$;

-- 6. Verificar que las restricciones UNIQUE estén correctas
-- Deben existir solo: CUIT, Email, codigo_empresa
SELECT 
    tc.table_name as tabla,
    kcu.column_name as columna,
    tc.constraint_name as restriccion
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'UNIQUE'
    AND tc.table_name = 'empresa'
    AND kcu.column_name IN ('cuit', 'email', 'codigo_empresa')
ORDER BY kcu.column_name;

-- 7. Datos de prueba para INSERT
-- IMPORTANTE: Cambiar los valores antes de ejecutar para evitar duplicados
-- NUNCA incluir id_empresa en el INSERT (es auto-incremental)

-- Ejemplo 1: Insertar una empresa nueva (cambiar valores)
-- NOTA: No incluir id_empresa, se genera automáticamente
INSERT INTO empresa (nombre_empresa, codigo_empresa, telefono, cuit, email)
VALUES (
    'Empresa de Prueba 1',
    'COD-TEST-001',
    '2611234567',
    '20123456789',
    'prueba1@empresa.com'
)
RETURNING id_empresa, nombre_empresa, codigo_empresa, cuit, email;

-- Ejemplo 2: Intentar insertar con CUIT duplicado (debe fallar)
-- Descomentar para probar el error
/*
INSERT INTO empresa (nombre_empresa, codigo_empresa, telefono, cuit, email)
VALUES (
    'Empresa Duplicada',
    'COD-TEST-002',
    '2617654321',
    '20123456789',  -- Mismo CUIT que el ejemplo anterior
    'duplicado@empresa.com'
)
RETURNING *;
*/

-- Ejemplo 3: Intentar insertar con código duplicado (debe fallar)
-- Descomentar para probar el error
/*
INSERT INTO empresa (nombre_empresa, codigo_empresa, telefono, cuit, email)
VALUES (
    'Empresa Duplicada 2',
    'COD-TEST-001',  -- Mismo código que el ejemplo 1
    '2619999999',
    '20987654321',
    'duplicado2@empresa.com'
)
RETURNING *;
*/

-- Ejemplo 4: Intentar insertar con email duplicado (debe fallar)
-- Descomentar para probar el error
/*
INSERT INTO empresa (nombre_empresa, codigo_empresa, telefono, cuit, email)
VALUES (
    'Empresa Duplicada 3',
    'COD-TEST-003',
    '2618888888',
    '20765432109',
    'prueba1@empresa.com'  -- Mismo email que el ejemplo 1
)
RETURNING *;
*/

-- 8. Verificar los datos insertados
SELECT 
    id_empresa,
    nombre_empresa,
    codigo_empresa,
    cuit,
    email,
    telefono
FROM empresa
ORDER BY id_empresa DESC
LIMIT 5;

-- 9. IMPORTANTE: Si el error persiste, ejecutar esto para resetear la secuencia
-- (Solo ejecutar si es necesario, después de verificar que no hay conflictos)
/*
SELECT setval(
    'empresa_id_empresa_seq',
    (SELECT MAX(id_empresa) FROM empresa) + 1,
    false
) as secuencia_reseteada;
*/

