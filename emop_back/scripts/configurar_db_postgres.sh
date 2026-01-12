#!/bin/bash

# Script para configurar la base de datos PostgreSQL local con usuario postgres
# Usa las credenciales: usuario=postgres, password=123456

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}🚀 Configurando base de datos PostgreSQL local...${NC}\n"

# Variables de configuración
DB_NAME=${DB_NAME:-emop_db}
DB_USER=${DB_USER:-postgres}
DB_PASSWORD=${DB_PASSWORD:-123456}
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}

echo -e "${YELLOW}📋 Configuración:${NC}"
echo "  - Base de datos: $DB_NAME"
echo "  - Usuario: $DB_USER"
echo "  - Host: $DB_HOST"
echo "  - Puerto: $DB_PORT"
echo ""

# Verificar que PostgreSQL está corriendo
echo -e "${YELLOW}🔍 Verificando PostgreSQL...${NC}"
if ! pg_isready -h $DB_HOST -p $DB_PORT > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: PostgreSQL no está corriendo${NC}"
    exit 1
fi
echo -e "${GREEN}✅ PostgreSQL está corriendo${NC}\n"

# Verificar conexión con postgres
echo -e "${YELLOW}🔐 Verificando conexión con usuario postgres...${NC}"
if ! PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "SELECT 1" > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: No se pudo conectar con usuario postgres y contraseña 123456${NC}"
    echo "  Verifica las credenciales"
    exit 1
fi
echo -e "${GREEN}✅ Conexión exitosa${NC}\n"

# Crear base de datos si no existe
echo -e "${YELLOW}📦 Creando base de datos '$DB_NAME'...${NC}"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres <<EOF
-- Crear base de datos si no existe
SELECT 'CREATE DATABASE $DB_NAME'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME')\gexec
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Base de datos creada o ya existe${NC}\n"
else
    echo -e "${YELLOW}⚠️  Base de datos podría ya existir${NC}\n"
fi

# Configurar permisos en la base de datos
echo -e "${YELLOW}🔧 Configurando permisos...${NC}"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME <<EOF
-- Crear esquema público si no existe
CREATE SCHEMA IF NOT EXISTS public;

-- Configurar búsqueda de esquemas
ALTER DATABASE $DB_NAME SET search_path TO public, pg_catalog;

-- Permisos por defecto
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $DB_USER;
EOF

echo -e "${GREEN}✅ Permisos configurados${NC}\n"

# Actualizar .env_local
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_LOCAL_PATH="$SCRIPT_DIR/../.env_local"

echo -e "${YELLOW}💾 Actualizando .env_local...${NC}"
cat > "$ENV_LOCAL_PATH" << EOF
# Configuración de Base de Datos PostgreSQL Local
# Configurado automáticamente

# Tipo de base de datos
DB_TYPE=postgres

# Configuración de PostgreSQL Local
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
EOF

echo -e "${GREEN}✅ .env_local actualizado${NC}\n"

echo -e "${GREEN}✅ Base de datos configurada correctamente!${NC}\n"
echo -e "${YELLOW}📋 Próximos pasos:${NC}"
echo "  1. Restaurar esquema: ./scripts/restaurar_esquema_postgres.sh"
echo "  2. Restaurar datos: ./scripts/restaurar_datos_postgres.sh"
echo "  3. Iniciar backend: npm run dev\n"

