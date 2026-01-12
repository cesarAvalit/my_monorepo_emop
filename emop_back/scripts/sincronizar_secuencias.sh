#!/bin/bash

# Script para sincronizar todas las secuencias con los valores máximos actuales
# Esto evita errores de "duplicate key value violates unique constraint"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🔄 Sincronizando secuencias...${NC}\n"

PGPASSWORD=${DB_PASSWORD:-123456}
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-emop_db}
DB_USER=${DB_USER:-postgres}

# Cargar variables de .env_local si existe
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/../.env_local" ]; then
    export $(cat "$SCRIPT_DIR/../.env_local" | grep -v '^#' | xargs)
    PGPASSWORD=${DB_PASSWORD:-123456}
    DB_HOST=${DB_HOST:-localhost}
    DB_PORT=${DB_PORT:-5432}
    DB_NAME=${DB_NAME:-emop_db}
    DB_USER=${DB_USER:-postgres}
fi

PGPASSWORD=$PGPASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME << 'SQL'
-- Sincronizar todas las secuencias con los valores máximos actuales
DO $$
DECLARE
    rec RECORD;
    seq_name TEXT;
    max_val INTEGER;
    query_text TEXT;
BEGIN
    -- Iterar sobre todas las columnas con secuencias
    FOR rec IN 
        SELECT 
            table_name,
            column_name,
            column_default
        FROM information_schema.columns
        WHERE table_schema = 'public'
            AND column_default LIKE 'nextval%'
            AND data_type = 'integer'
        ORDER BY table_name, column_name
    LOOP
        -- Extraer el nombre de la secuencia del DEFAULT
        seq_name := substring(rec.column_default from '''([^'']+)''');
        
        IF seq_name IS NOT NULL THEN
            -- Obtener el valor máximo actual
            query_text := format('SELECT COALESCE(MAX(%I), 0) FROM %I', rec.column_name, rec.table_name);
            EXECUTE query_text INTO max_val;
            
            -- Sincronizar la secuencia (usar max_val + 1 para el siguiente valor)
            -- El último parámetro 'true' significa que el valor ya fue usado
            EXECUTE format('SELECT setval(%L, %s, true)', seq_name, GREATEST(max_val, 1));
            
            RAISE NOTICE 'Secuencia % sincronizada con MAX(%) = %', seq_name, rec.column_name, max_val;
        END IF;
    END LOOP;
END $$;

-- Verificar secuencias sincronizadas
SELECT 
    table_name,
    column_name,
    column_default,
    (SELECT last_value FROM pg_sequences WHERE sequencename = substring(column_default from '''([^'']+)''')) as last_value
FROM information_schema.columns
WHERE table_schema = 'public'
    AND column_default LIKE 'nextval%'
ORDER BY table_name, column_name;
SQL

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}✅ Secuencias sincronizadas correctamente${NC}"
else
    echo -e "\n${YELLOW}⚠️  Hubo errores al sincronizar secuencias${NC}"
    exit 1
fi

