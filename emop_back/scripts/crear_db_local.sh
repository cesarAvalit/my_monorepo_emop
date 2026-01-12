#!/bin/bash

# Script para crear la base de datos PostgreSQL local para EMOP
# Este script crea la base de datos, usuario y configura los permisos necesarios

set -e

# Obtener directorio del script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Creando base de datos PostgreSQL local para EMOP...${NC}\n"

# Variables de configuración (pueden ser sobrescritas por variables de entorno)
DB_NAME=${DB_NAME:-emop_db}
DB_USER=${DB_USER:-emop_user}
DB_PASSWORD=${DB_PASSWORD:-emop_password}
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}

echo -e "${YELLOW}📋 Configuración:${NC}"
echo "  - Nombre de BD: $DB_NAME"
echo "  - Usuario: $DB_USER"
echo "  - Host: $DB_HOST"
echo "  - Puerto: $DB_PORT"
echo ""

# Verificar si PostgreSQL está corriendo
echo -e "${YELLOW}🔍 Verificando PostgreSQL...${NC}"
if ! pg_isready -h $DB_HOST -p $DB_PORT > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: PostgreSQL no está corriendo en $DB_HOST:$DB_PORT${NC}"
    echo "  Por favor, inicia PostgreSQL:"
    echo "    sudo systemctl start postgresql"
    echo "  o"
    echo "    sudo service postgresql start"
    exit 1
fi
echo -e "${GREEN}✅ PostgreSQL está corriendo${NC}\n"

# Intentar conectar como postgres (usuario por defecto)
echo -e "${YELLOW}🔐 Conectando a PostgreSQL...${NC}"

# Crear o actualizar usuario
echo -e "${YELLOW}👤 Creando/actualizando usuario '$DB_USER'...${NC}"
sudo -u postgres psql <<EOF
-- Crear usuario si no existe, o actualizar contraseña si ya existe
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_user WHERE usename = '$DB_USER') THEN
        CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
        RAISE NOTICE 'Usuario $DB_USER creado';
    ELSE
        ALTER USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
        RAISE NOTICE 'Usuario $DB_USER ya existe, contraseña actualizada';
    END IF;
END
\$\$;

-- Otorgar privilegios necesarios
ALTER USER $DB_USER WITH CREATEDB;
EOF

# Crear base de datos si no existe
echo -e "${YELLOW}📦 Creando base de datos '$DB_NAME'...${NC}"
sudo -u postgres psql <<EOF
-- Crear base de datos si no existe
SELECT 'CREATE DATABASE $DB_NAME'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME')\gexec

-- Otorgar permisos
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
ALTER DATABASE $DB_NAME OWNER TO $DB_USER;
EOF

# Configurar permisos usando sudo -u postgres (funciona siempre)
echo -e "${YELLOW}🔧 Configurando permisos en la base de datos...${NC}"
sudo -u postgres psql -d $DB_NAME <<EOF
-- Crear esquema público si no existe
CREATE SCHEMA IF NOT EXISTS public;

-- Otorgar permisos en el esquema
GRANT ALL ON SCHEMA public TO $DB_USER;
GRANT ALL ON SCHEMA public TO public;

-- Configurar búsqueda de esquemas
ALTER DATABASE $DB_NAME SET search_path TO public, pg_catalog;

-- Otorgar privilegios en todas las tablas futuras
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $DB_USER;

-- Otorgar privilegios en todas las tablas existentes (si las hay)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $DB_USER;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $DB_USER;
EOF

# Verificar que la contraseña funciona (opcional pero recomendado)
echo -e "${YELLOW}🔍 Verificando autenticación del usuario...${NC}"
if PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Autenticación con contraseña funciona correctamente${NC}\n"
else
    echo -e "${YELLOW}⚠️  Advertencia: No se pudo autenticar con la contraseña${NC}"
    echo -e "${YELLOW}Esto puede ser normal en algunos sistemas. El script configuró los permisos correctamente.${NC}"
    echo -e "${YELLOW}Si necesitas usar la contraseña, ejecuta:${NC}"
    echo "  ./scripts/fix_postgres_auth.sh"
    echo ""
fi


echo -e "\n${GREEN}✅ Base de datos creada exitosamente!${NC}\n"
echo -e "${GREEN}📝 Credenciales de conexión:${NC}"
echo "  DB_NAME=$DB_NAME"
echo "  DB_USER=$DB_USER"
echo "  DB_PASSWORD=$DB_PASSWORD"
echo "  DB_HOST=$DB_HOST"
echo "  DB_PORT=$DB_PORT"
echo ""

# Crear o actualizar .env_local con las credenciales
ENV_LOCAL_PATH="$SCRIPT_DIR/../.env_local"
echo -e "${YELLOW}💾 Guardando credenciales en .env_local...${NC}"

cat > "$ENV_LOCAL_PATH" << EOF
# Configuración de Base de Datos PostgreSQL Local
# Generado automáticamente por crear_db_local.sh

# Tipo de base de datos
DB_TYPE=postgres

# Configuración de PostgreSQL Local
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
EOF

echo -e "${GREEN}✅ Credenciales guardadas en .env_local${NC}\n"
echo -e "${YELLOW}📋 Próximos pasos:${NC}"
echo "  1. Ejecutar: cd emop_back && ./scripts/restaurar_backup_local.sh"
echo "  2. Configurar el backend para usar PostgreSQL local"
echo "  3. Iniciar el backend: npm run dev\n"

