#!/bin/bash

# Script para cambiar a configuración LOCAL (PostgreSQL)

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_LOCAL="$PROJECT_DIR/.env_local"

cd "$PROJECT_DIR"

echo -e "${YELLOW}🔄 Cambiando a configuración LOCAL (PostgreSQL)...${NC}\n"

# Verificar que .env_local existe
if [ ! -f "$ENV_LOCAL" ]; then
    echo -e "${RED}❌ Error: .env_local no existe${NC}"
    echo -e "${YELLOW}💡 Crea .env_local con:${NC}"
    echo "   DB_TYPE=postgres"
    echo "   DB_HOST=localhost"
    echo "   DB_PORT=5432"
    echo "   DB_NAME=emop_db"
    echo "   DB_USER=postgres"
    echo "   DB_PASSWORD=123456"
    exit 1
fi

# Verificar que DB_TYPE=postgres en .env_local
if ! grep -q "DB_TYPE=postgres" "$ENV_LOCAL"; then
    echo -e "${YELLOW}⚠️  DB_TYPE no está configurado como 'postgres' en .env_local${NC}"
    echo -e "${YELLOW}💡 Asegúrate de que .env_local tiene: DB_TYPE=postgres${NC}"
fi

echo -e "${GREEN}✅ Configuración LOCAL activa${NC}"
echo -e "${YELLOW}📋 El sistema usará PostgreSQL local${NC}"
echo -e "${YELLOW}💡 Reinicia el backend para aplicar los cambios${NC}"
echo -e "${YELLOW}   npm run dev${NC}\n"

