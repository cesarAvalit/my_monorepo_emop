#!/bin/bash

# Script para restaurar los datos desde el backup de Supabase

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🚀 Restaurando datos en la base de datos...${NC}\n"

# Directorios
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
BACKUP_DIR="$PROJECT_ROOT/backup_supabase"
DATA_FILE="$BACKUP_DIR/datos_completos.json"

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
echo "  - Archivo de datos: $DATA_FILE"
echo ""

# Verificar que existe el archivo de datos
if [ ! -f "$DATA_FILE" ]; then
    echo -e "${RED}❌ Error: Archivo de datos no encontrado: $DATA_FILE${NC}"
    echo "  Por favor, ejecuta primero: cd emop_back && node descargar_db_supabase.js"
    exit 1
fi

# Verificar conexión
echo -e "${YELLOW}🔍 Verificando conexión...${NC}"
if ! PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1" > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: No se pudo conectar a la base de datos${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Conexión exitosa${NC}\n"

# Restaurar datos usando Node.js
echo -e "${YELLOW}📊 Restaurando datos...${NC}"
cd "$SCRIPT_DIR/.."
node scripts/restaurar_datos_local.js "$DATA_FILE" || {
    echo -e "${YELLOW}⚠️  Algunos datos pudieron no insertarse correctamente (puede ser normal si ya existen)${NC}"
}

echo -e "\n${GREEN}✅ Datos restaurados${NC}\n"

# Verificar datos insertados
echo -e "${YELLOW}📊 Verificando datos...${NC}"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME <<EOF
SELECT 
    'usuario' as tabla, COUNT(*)::text as registros FROM usuario
UNION ALL SELECT 'rol', COUNT(*)::text FROM rol
UNION ALL SELECT 'empresa', COUNT(*)::text FROM empresa
UNION ALL SELECT 'vehiculo', COUNT(*)::text FROM vehiculo
UNION ALL SELECT 'orden_trabajo', COUNT(*)::text FROM orden_trabajo
UNION ALL SELECT 'auditoria', COUNT(*)::text FROM auditoria
ORDER BY tabla;
EOF

echo -e "\n${GREEN}✅ Proceso completado${NC}\n"

