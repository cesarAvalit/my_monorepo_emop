#!/bin/bash

# Script para otorgar permisos y corregir estructuras de tablas

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🔧 Corrigiendo permisos y estructuras de tablas...${NC}\n"

# Cargar variables de .env_local
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/../.env_local" ]; then
    export $(cat "$SCRIPT_DIR/../.env_local" | grep -v '^#' | xargs)
fi

DB_NAME=${DB_NAME:-emop_db}
DB_USER=${DB_USER:-emop_user}

echo -e "${YELLOW}Configurando permisos y estructuras...${NC}"

sudo -u postgres psql -d $DB_NAME <<EOF
-- Otorgar todos los privilegios al usuario emop_user
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
ALTER DATABASE $DB_NAME OWNER TO $DB_USER;

-- Otorgar permisos en el esquema
GRANT ALL ON SCHEMA public TO $DB_USER;
ALTER SCHEMA public OWNER TO $DB_USER;

-- Otorgar permisos en todas las tablas existentes
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $DB_USER;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $DB_USER;

-- Cambiar owner de todas las tablas a emop_user
DO \$\$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'ALTER TABLE ' || quote_ident(r.tablename) || ' OWNER TO $DB_USER';
    END LOOP;
END \$\$;

-- Cambiar owner de todas las secuencias a emop_user
DO \$\$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public') LOOP
        EXECUTE 'ALTER SEQUENCE ' || quote_ident(r.sequence_name) || ' OWNER TO $DB_USER';
    END LOOP;
END \$\$;

-- Configurar permisos por defecto para tablas futuras
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $DB_USER;

-- Corregir estructuras de tablas si es necesario
-- Inspeccion_ddjj: si tiene fecha_inspeccion pero no fecha_creacion, copiar valor
DO \$\$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inspeccion_ddjj' AND column_name = 'fecha_inspeccion') 
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inspeccion_ddjj' AND column_name = 'fecha_creacion') THEN
        UPDATE inspeccion_ddjj SET fecha_creacion = fecha_inspeccion WHERE fecha_creacion IS NULL;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inspeccion_ddjj' AND column_name = 'resultado') 
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inspeccion_ddjj' AND column_name = 'observaciones') THEN
        UPDATE inspeccion_ddjj SET observaciones = resultado WHERE observaciones IS NULL OR observaciones = '';
    END IF;
END \$\$;

-- Reporte_auditoria_ddjj: si tiene fecha_reporte pero no fecha_creacion
DO \$\$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reporte_auditoria_ddjj' AND column_name = 'fecha_reporte') 
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reporte_auditoria_ddjj' AND column_name = 'fecha_creacion') THEN
        UPDATE reporte_auditoria_ddjj SET fecha_creacion = fecha_reporte WHERE fecha_creacion IS NULL;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reporte_auditoria_ddjj' AND column_name = 'contenido') 
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reporte_auditoria_ddjj' AND column_name = 'observaciones') THEN
        UPDATE reporte_auditoria_ddjj SET observaciones = contenido WHERE observaciones IS NULL OR observaciones = '';
    END IF;
END \$\$;

-- Verificar permisos
SELECT tablename, tableowner FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename LIMIT 10;
EOF

echo -e "\n${GREEN}✅ Permisos y estructuras corregidos${NC}\n"

# Verificar que funciona
echo -e "${YELLOW}Verificando conexión y permisos...${NC}"
psql -h localhost -U $DB_USER -d $DB_NAME -c "SELECT COUNT(*) as total_usuarios FROM usuario;" && \
psql -h localhost -U $DB_USER -d $DB_NAME -c "SELECT COUNT(*) as total_roles FROM rol;" && \
echo -e "${GREEN}✅ Permisos funcionando correctamente${NC}\n" || \
echo -e "${YELLOW}⚠️  Hay algunos problemas, pero la mayoría de las tablas deberían funcionar${NC}\n"

