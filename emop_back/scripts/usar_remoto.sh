#!/bin/bash

# Script para cambiar a configuración REMOTA (Supabase)

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_LOCAL="$PROJECT_DIR/.env_local"
ENV_FILE="$PROJECT_DIR/.env"

cd "$PROJECT_DIR"

echo -e "${YELLOW}🔄 Cambiando a configuración REMOTA (Supabase)...${NC}\n"

# Verificar que .env existe
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}❌ Error: .env no existe${NC}"
    echo -e "${YELLOW}💡 Crea .env basado en .env.example${NC}"
    exit 1
fi

# Renombrar .env_local si existe
if [ -f "$ENV_LOCAL" ]; then
    BACKUP_NAME=".env_local.bak.$(date +%Y%m%d_%H%M%S)"
    mv "$ENV_LOCAL" "$PROJECT_DIR/$BACKUP_NAME"
    echo -e "${BLUE}📦 .env_local renombrado a: $BACKUP_NAME${NC}"
else
    echo -e "${BLUE}ℹ️  .env_local no existe (ya estás usando remoto)${NC}"
fi

# Verificar que DB_TYPE=supabase en .env
if ! grep -q "DB_TYPE=supabase" "$ENV_FILE"; then
    echo -e "${YELLOW}⚠️  DB_TYPE no está configurado como 'supabase' en .env${NC}"
    echo -e "${YELLOW}💡 Agregando DB_TYPE=supabase a .env...${NC}"
    if ! grep -q "^DB_TYPE=" "$ENV_FILE"; then
        echo "" >> "$ENV_FILE"
        echo "# Tipo de base de datos: 'supabase' para remoto, 'postgres' para local" >> "$ENV_FILE"
        echo "DB_TYPE=supabase" >> "$ENV_FILE"
        echo -e "${GREEN}✅ DB_TYPE=supabase agregado a .env${NC}"
    fi
fi

echo -e "\n${GREEN}✅ Configuración REMOTA activa${NC}"
echo -e "${YELLOW}📋 El sistema usará Supabase${NC}"
echo -e "${YELLOW}💡 Reinicia el backend para aplicar los cambios${NC}"
echo -e "${YELLOW}   npm run dev${NC}\n"

