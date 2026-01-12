#!/bin/bash

# Script para iniciar el backend en el puerto 3001
# Detiene cualquier proceso existente antes de iniciar uno nuevo

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_DIR"

echo -e "${BLUE}🚀 Iniciando backend...${NC}\n"

# Verificar si hay procesos corriendo
PIDS=$(pgrep -f "node.*server.js" 2>/dev/null)
if [ ! -z "$PIDS" ]; then
    echo -e "${YELLOW}⚠️  Hay procesos del backend corriendo, deteniéndolos...${NC}"
    pkill -f "node.*server.js"
    sleep 2
    
    # Verificar que se detuvieron
    PIDS_AFTER=$(pgrep -f "node.*server.js" 2>/dev/null)
    if [ ! -z "$PIDS_AFTER" ]; then
        echo -e "${RED}⚠️  Forzando cierre de procesos...${NC}"
        pkill -9 -f "node.*server.js"
        sleep 1
    fi
    echo -e "${GREEN}✅ Procesos anteriores detenidos${NC}\n"
fi

# Verificar si el puerto 3001 está en uso
PORT_IN_USE=$(lsof -i :3001 2>/dev/null | grep LISTEN | wc -l)
if [ "$PORT_IN_USE" -gt 0 ]; then
    echo -e "${RED}❌ Error: Puerto 3001 está en uso${NC}"
    echo -e "${YELLOW}💡 Ejecuta primero: ./scripts/detener_backend.sh${NC}"
    exit 1
fi

# Verificar que las dependencias estén instaladas
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Instalando dependencias...${NC}"
    npm install
    echo ""
fi

# Iniciar el backend
echo -e "${GREEN}✅ Iniciando backend en puerto 3001...${NC}\n"

# Opción 1: Iniciar con npm run dev (con watch)
npm run dev

# Si quieres iniciar en background, descomenta la siguiente línea y comenta la anterior:
# npm run dev > backend.log 2>&1 &
# echo -e "${GREEN}✅ Backend iniciado en background${NC}"
# echo -e "${YELLOW}💡 Para ver los logs: tail -f backend.log${NC}"
# echo -e "${YELLOW}💡 Para detener: ./scripts/detener_backend.sh${NC}"

