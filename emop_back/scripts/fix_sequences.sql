-- Script para crear secuencias para todas las PRIMARY KEYS que no tienen DEFAULT
-- Esto resuelve el problema de "null value in column violates not-null constraint"

-- Función para crear secuencia y asignarla como DEFAULT si no existe
DO $$
DECLARE
    rec RECORD;
    seq_name TEXT;
    max_val INTEGER;
BEGIN
    FOR rec IN 
        SELECT 
            t.table_name,
            k.column_name
        FROM information_schema.table_constraints t
        JOIN information_schema.key_column_usage k 
            ON t.constraint_name = k.constraint_name
            AND t.table_schema = k.table_schema
        JOIN information_schema.columns c
            ON k.table_name = c.table_name
            AND k.column_name = c.column_name
            AND k.table_schema = c.table_schema
        WHERE t.constraint_type = 'PRIMARY KEY'
            AND t.table_schema = 'public'
            AND c.is_nullable = 'NO'
            AND (c.column_default IS NULL OR c.column_default = '')
            AND c.data_type = 'integer'
        ORDER BY t.table_name
    LOOP
        seq_name := rec.table_name || '_' || rec.column_name || '_seq';
        
        -- Crear secuencia si no existe
        EXECUTE format('CREATE SEQUENCE IF NOT EXISTS %I', seq_name);
        
        -- Obtener el valor máximo actual
        EXECUTE format('SELECT COALESCE(MAX(%I), 0) FROM %I', rec.column_name, rec.table_name) INTO max_val;
        
        -- Establecer el valor de la secuencia (mínimo 1, ya que las secuencias no pueden ser 0)
        IF max_val = 0 THEN
            max_val := 1;
        END IF;
        EXECUTE format('SELECT setval(%L, %s, true)', seq_name, max_val);
        
        -- Asignar la secuencia como DEFAULT
        EXECUTE format('ALTER TABLE %I ALTER COLUMN %I SET DEFAULT nextval(%L)', 
            rec.table_name, rec.column_name, seq_name);
        
        RAISE NOTICE 'Secuencia % creada y asignada a %.%.', seq_name, rec.table_name, rec.column_name;
    END LOOP;
END $$;

-- Verificar que las secuencias fueron creadas
SELECT 
    table_name,
    column_name,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND column_default LIKE 'nextval%'
ORDER BY table_name, column_name;

