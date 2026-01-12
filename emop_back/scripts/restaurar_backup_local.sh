#!/bin/bash

# Script para restaurar el backup de Supabase en la base de datos PostgreSQL local
# Este script carga el esquema y los datos del backup

set -e

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Restaurando backup de Supabase en base de datos local...${NC}\n"

# Directorios
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
BACKUP_DIR="$PROJECT_ROOT/backup_supabase"
SCHEMA_FILE="$BACKUP_DIR/esquema.sql"
DATA_DIR="$BACKUP_DIR/datos"
DATA_COMPLETE="$BACKUP_DIR/datos_completos.json"

# Variables de configuración (pueden ser sobrescritas por variables de entorno o .env_local)
DB_NAME=${DB_NAME:-emop_db}
DB_USER=${DB_USER:-emop_user}
DB_PASSWORD=${DB_PASSWORD:-emop_password}
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}

# Cargar variables de .env_local si existe
if [ -f "$SCRIPT_DIR/../.env_local" ]; then
    echo -e "${BLUE}📄 Cargando variables de .env_local...${NC}"
    export $(cat "$SCRIPT_DIR/../.env_local" | grep -v '^#' | xargs)
fi

echo -e "${YELLOW}📋 Configuración:${NC}"
echo "  - Base de datos: $DB_NAME"
echo "  - Usuario: $DB_USER"
echo "  - Host: $DB_HOST"
echo "  - Puerto: $DB_PORT"
echo "  - Backup dir: $BACKUP_DIR"
echo ""

# Verificar que existan los archivos de backup
if [ ! -d "$BACKUP_DIR" ]; then
    echo -e "${RED}❌ Error: Directorio de backup no encontrado: $BACKUP_DIR${NC}"
    echo "  Por favor, ejecuta primero el script de descarga de backup:"
    echo "    cd emop_back && node descargar_db_supabase.js"
    exit 1
fi

if [ ! -f "$SCHEMA_FILE" ]; then
    echo -e "${RED}❌ Error: Archivo de esquema no encontrado: $SCHEMA_FILE${NC}"
    exit 1
fi

if [ ! -f "$DATA_COMPLETE" ]; then
    echo -e "${RED}❌ Error: Archivo de datos no encontrado: $DATA_COMPLETE${NC}"
    exit 1
fi

# Verificar conexión a PostgreSQL
echo -e "${YELLOW}🔍 Verificando conexión a PostgreSQL...${NC}"

# Intentar primero con contraseña
if PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Conexión exitosa con contraseña${NC}\n"
    USE_PASSWORD=true
# Si falla, intentar sin contraseña (para desarrollo con trust)
elif psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Conexión exitosa sin contraseña (configuración trust)${NC}\n"
    USE_PASSWORD=false
else
    echo -e "${RED}❌ Error: No se pudo conectar a la base de datos${NC}"
    echo -e "${YELLOW}Intentando usar sudo para verificar permisos...${NC}"
    
    # Verificar que la base de datos existe usando sudo
    if sudo -u postgres psql -d $DB_NAME -c "SELECT 1" > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  La base de datos existe pero hay problemas de autenticación${NC}"
        echo -e "${YELLOW}Configurando permisos...${NC}"
        
        # Configurar permisos usando sudo
        sudo -u postgres psql -d $DB_NAME <<EOF
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
ALTER DATABASE $DB_NAME OWNER TO $DB_USER;
GRANT ALL ON SCHEMA public TO $DB_USER;
EOF
        
        # Intentar nuevamente sin contraseña
        if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Conexión exitosa (usando configuración trust)${NC}\n"
            USE_PASSWORD=false
        else
            echo -e "${RED}❌ Error: Aún no se puede conectar${NC}"
            echo -e "${YELLOW}💡 Solución: Configura pg_hba.conf:${NC}"
            echo "  1. sudo nano /etc/postgresql/*/main/pg_hba.conf"
            echo "  2. Cambiar 'md5' a 'trust' para localhost"
            echo "  3. sudo systemctl restart postgresql"
            exit 1
        fi
    else
        echo -e "${RED}❌ Error: La base de datos no existe${NC}"
        echo "  Ejecuta primero: ./scripts/crear_db_local.sh"
        exit 1
    fi
fi

# Paso 1: Restaurar esquema
echo -e "${YELLOW}📋 Paso 1: Restaurando esquema (estructura)...${NC}"
if [ "$USE_PASSWORD" = true ]; then
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$SCHEMA_FILE" || {
        echo -e "${YELLOW}⚠️  Algunos errores en el esquema (pueden ser normales si las tablas ya existen)${NC}"
    }
else
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$SCHEMA_FILE" || {
        echo -e "${YELLOW}⚠️  Algunos errores en el esquema (pueden ser normales si las tablas ya existen)${NC}"
    }
fi
echo -e "${GREEN}✅ Esquema restaurado${NC}\n"

# Paso 2: Restaurar datos usando Node.js
echo -e "${YELLOW}📊 Paso 2: Restaurando datos...${NC}"
cd "$SCRIPT_DIR/.."
node scripts/restaurar_datos_local.js "$DATA_COMPLETE" || {
    echo -e "${RED}❌ Error restaurando datos${NC}"
    exit 1
}

echo -e "\n${GREEN}✅ Backup restaurado exitosamente!${NC}\n"
echo -e "${GREEN}🎉 La base de datos local está lista para usar${NC}\n"

