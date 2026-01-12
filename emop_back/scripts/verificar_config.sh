#!/bin/bash

# Script para verificar qué configuración está usando el sistema

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_LOCAL="$PROJECT_DIR/.env_local"
ENV_FILE="$PROJECT_DIR/.env"

cd "$PROJECT_DIR"

echo -e "${BLUE}🔍 Verificando configuración actual...${NC}\n"

# Verificar archivos
echo -e "${YELLOW}📁 Archivos de configuración:${NC}"
if [ -f "$ENV_FILE" ]; then
    echo -e "  ✅ .env existe"
    DB_TYPE_ENV=$(grep "^DB_TYPE=" "$ENV_FILE" | cut -d '=' -f2 || echo "no configurado")
    echo -e "     DB_TYPE en .env: ${GREEN}$DB_TYPE_ENV${NC}"
else
    echo -e "  ❌ .env no existe"
fi

if [ -f "$ENV_LOCAL" ]; then
    echo -e "  ✅ .env_local existe (SOBRESCRIBE .env)"
    DB_TYPE_LOCAL=$(grep "^DB_TYPE=" "$ENV_LOCAL" | cut -d '=' -f2 || echo "no configurado")
    echo -e "     DB_TYPE en .env_local: ${GREEN}$DB_TYPE_LOCAL${NC}"
    echo -e "  ${YELLOW}⚠️  El sistema usará .env_local (LOCAL)${NC}"
else
    echo -e "  ℹ️  .env_local no existe"
    echo -e "  ${YELLOW}ℹ️  El sistema usará .env (REMOTO)${NC}"
fi

echo ""

# Determinar qué configuración se usará
if [ -f "$ENV_LOCAL" ]; then
    DB_TYPE=$(grep "^DB_TYPE=" "$ENV_LOCAL" | cut -d '=' -f2 || echo "postgres")
    echo -e "${YELLOW}📋 Configuración que se usará:${NC}"
    if [ "$DB_TYPE" = "postgres" ]; then
        echo -e "  ${GREEN}✅ LOCAL (PostgreSQL)${NC}"
        echo -e "  ${BLUE}   Host: localhost${NC}"
        echo -e "  ${BLUE}   DB: emop_db${NC}"
        echo -e "  ${BLUE}   Usuario: postgres${NC}"
    else
        echo -e "  ${GREEN}✅ REMOTO (Supabase)${NC}"
    fi
else
    DB_TYPE=$(grep "^DB_TYPE=" "$ENV_FILE" | cut -d '=' -f2 || echo "supabase")
    echo -e "${YELLOW}📋 Configuración que se usará:${NC}"
    if [ "$DB_TYPE" = "supabase" ]; then
        echo -e "  ${GREEN}✅ REMOTO (Supabase)${NC}"
    else
        echo -e "  ${GREEN}✅ LOCAL (PostgreSQL)${NC}"
    fi
fi

echo ""

# Verificar si el backend está corriendo
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo -e "${YELLOW}🌐 Backend está corriendo${NC}"
    DB_STATUS=$(curl -s http://localhost:3001/health | grep -o '"database":"[^"]*"' | cut -d '"' -f4)
    if [ "$DB_STATUS" = "PostgreSQL Local" ]; then
        echo -e "  ${GREEN}✅ Usando: PostgreSQL Local${NC}"
    elif [ "$DB_STATUS" = "Supabase" ]; then
        echo -e "  ${GREEN}✅ Usando: Supabase${NC}"
    fi
else
    echo -e "${YELLOW}ℹ️  Backend no está corriendo${NC}"
fi

echo ""

