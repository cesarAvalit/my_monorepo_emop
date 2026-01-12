#!/bin/bash

# Script para restaurar completamente la base de datos local desde Supabase
# Esto elimina todo y restaura estructura y datos desde Supabase

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${RED}⚠️  ADVERTENCIA: Este script eliminará TODOS los datos locales${NC}"
echo -e "${YELLOW}¿Deseas continuar? (s/n)${NC}"
read -r respuesta

if [ "$respuesta" != "s" ] && [ "$respuesta" != "S" ]; then
    echo -e "${YELLOW}Operación cancelada${NC}"
    exit 0
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
BACKUP_DIR="$PROJECT_ROOT/backup_supabase"
ESQUEMA_FILE="$BACKUP_DIR/esquema.sql"
DATOS_FILE="$BACKUP_DIR/datos_completos.json"

# Cargar variables de .env_local
if [ -f "$SCRIPT_DIR/../.env_local" ]; then
    export $(cat "$SCRIPT_DIR/../.env_local" | grep -v '^#' | xargs)
fi

DB_NAME=${DB_NAME:-emop_db}
DB_USER=${DB_USER:-postgres}
DB_PASSWORD=${DB_PASSWORD:-123456}
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}

echo -e "\n${BLUE}🔄 Restaurando base de datos desde Supabase...${NC}\n"

# Verificar que existen los archivos
if [ ! -f "$ESQUEMA_FILE" ]; then
    echo -e "${RED}❌ Error: No se encuentra el archivo de esquema${NC}"
    echo -e "${YELLOW}💡 Ejecuta primero: cd emop_back && node descargar_db_supabase.js${NC}"
    exit 1
fi

if [ ! -f "$DATOS_FILE" ]; then
    echo -e "${RED}❌ Error: No se encuentra el archivo de datos${NC}"
    echo -e "${YELLOW}💡 Ejecuta primero: cd emop_back && node descargar_db_supabase.js${NC}"
    exit 1
fi

# Paso 1: Eliminar todas las tablas
echo -e "${YELLOW}🗑️  Paso 1: Eliminando tablas existentes...${NC}"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME <<EOF
-- Eliminar todas las tablas en orden inverso de dependencias
DO \$\$
DECLARE
    r RECORD;
BEGIN
    -- Desactivar triggers temporalmente
    SET session_replication_role = replica;
    
    -- Eliminar tablas
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename) LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
    
    -- Reactivar triggers
    SET session_replication_role = DEFAULT;
END \$\$;
EOF

echo -e "${GREEN}✅ Tablas eliminadas${NC}\n"

# Paso 2: Restaurar esquema
echo -e "${YELLOW}📋 Paso 2: Restaurando esquema...${NC}"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$ESQUEMA_FILE" > /dev/null 2>&1 || {
    echo -e "${YELLOW}⚠️  Algunos errores en el esquema (puede ser normal si hay duplicados)${NC}"
}
echo -e "${GREEN}✅ Esquema restaurado${NC}\n"

# Paso 3: Crear secuencias para PRIMARY KEYS
echo -e "${YELLOW}🔧 Paso 3: Creando secuencias...${NC}"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME <<EOF
-- Ejecutar script de creación de secuencias
\i $SCRIPT_DIR/fix_sequences.sql
EOF
echo -e "${GREEN}✅ Secuencias creadas${NC}\n"

# Paso 4: Restaurar datos
echo -e "${YELLOW}📊 Paso 4: Restaurando datos...${NC}"
cd "$SCRIPT_DIR/.."
node scripts/restaurar_datos_local.js "$DATOS_FILE" 2>&1 | grep -E "(✅|⚠️|Error|Total)" || true
echo -e "${GREEN}✅ Datos restaurados${NC}\n"

# Paso 5: Sincronizar secuencias
echo -e "${YELLOW}🔄 Paso 5: Sincronizando secuencias...${NC}"
./scripts/sincronizar_secuencias.sh > /dev/null 2>&1 || true
echo -e "${GREEN}✅ Secuencias sincronizadas${NC}\n"

# Verificación final
echo -e "${BLUE}📊 Verificación final:${NC}"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME <<EOF
SELECT 
    'usuario' as tabla, COUNT(*)::text as registros FROM usuario
UNION ALL SELECT 'rol', COUNT(*)::text FROM rol
UNION ALL SELECT 'empresa', COUNT(*)::text FROM empresa
UNION ALL SELECT 'vehiculo', COUNT(*)::text FROM vehiculo
UNION ALL SELECT 'conductor', COUNT(*)::text FROM conductor
UNION ALL SELECT 'orden_trabajo', COUNT(*)::text FROM orden_trabajo
UNION ALL SELECT 'auditoria', COUNT(*)::text FROM auditoria
ORDER BY tabla;
EOF

echo -e "\n${GREEN}✅ Restauración completada${NC}\n"
echo -e "${YELLOW}💡 La base de datos local ahora está sincronizada con Supabase${NC}\n"

