#!/bin/bash

# Script para restaurar el esquema (estructura) desde el backup de Supabase

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🚀 Restaurando esquema (estructura) de la base de datos...${NC}\n"

# Directorios
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
BACKUP_DIR="$PROJECT_ROOT/backup_supabase"
SCHEMA_FILE="$BACKUP_DIR/esquema.sql"

# Cargar variables de .env_local
if [ -f "$SCRIPT_DIR/../.env_local" ]; then
    export $(cat "$SCRIPT_DIR/../.env_local" | grep -v '^#' | xargs)
fi

DB_NAME=${DB_NAME:-emop_db}
DB_USER=${DB_USER:-postgres}
DB_PASSWORD=${DB_PASSWORD:-123456}
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}

echo -e "${YELLOW}📋 Configuración:${NC}"
echo "  - Base de datos: $DB_NAME"
echo "  - Usuario: $DB_USER"
echo "  - Archivo de esquema: $SCHEMA_FILE"
echo ""

# Verificar que existe el archivo de esquema
if [ ! -f "$SCHEMA_FILE" ]; then
    echo -e "${RED}❌ Error: Archivo de esquema no encontrado: $SCHEMA_FILE${NC}"
    echo "  Por favor, ejecuta primero: cd emop_back && node descargar_db_supabase.js"
    exit 1
fi

# Restaurar esquema
echo -e "${YELLOW}📋 Restaurando esquema...${NC}"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$SCHEMA_FILE" 2>&1 | grep -E "(ERROR|CREATE|ALTER|NOTICE|relation.*already exists)" || true

echo -e "\n${GREEN}✅ Esquema restaurado${NC}\n"

# Verificar tablas creadas
echo -e "${YELLOW}📊 Verificando tablas creadas...${NC}"
TABLA_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public';" | tr -d ' ')

echo -e "${GREEN}✅ Total de tablas: $TABLA_COUNT${NC}\n"

echo -e "${YELLOW}📋 Lista de tablas principales:${NC}"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('usuario', 'rol', 'empresa', 'vehiculo', 'orden_trabajo', 'auditoria') ORDER BY tablename;" 2>&1 || true

echo -e "\n${GREEN}✅ Proceso completado${NC}\n"

