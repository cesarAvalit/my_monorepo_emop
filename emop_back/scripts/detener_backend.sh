#!/bin/bash

# Script para detener el backend que está corriendo en el puerto 3001

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🛑 Deteniendo backend en puerto 3001...${NC}\n"

# Buscar procesos de Node.js relacionados con server.js
PIDS=$(pgrep -f "node.*server.js" 2>/dev/null)

if [ -z "$PIDS" ]; then
    echo -e "${YELLOW}ℹ️  No se encontraron procesos de server.js corriendo${NC}"
else
    echo -e "${YELLOW}📋 Procesos encontrados:${NC}"
    ps aux | grep -E "node.*server.js" | grep -v grep
    
    # Detener procesos
    echo -e "\n${YELLOW}🛑 Deteniendo procesos...${NC}"
    pkill -f "node.*server.js"
    sleep 2
    
    # Verificar que se detuvieron
    PIDS_AFTER=$(pgrep -f "node.*server.js" 2>/dev/null)
    if [ -z "$PIDS_AFTER" ]; then
        echo -e "${GREEN}✅ Procesos detenidos correctamente${NC}"
    else
        echo -e "${RED}⚠️  Algunos procesos no se detuvieron, forzando cierre...${NC}"
        pkill -9 -f "node.*server.js"
        sleep 1
        echo -e "${GREEN}✅ Procesos forzados a cerrar${NC}"
    fi
fi

# Verificar si el puerto 3001 está libre
PORT_IN_USE=$(lsof -i :3001 2>/dev/null | wc -l)
if [ "$PORT_IN_USE" -eq 0 ]; then
    echo -e "\n${GREEN}✅ Puerto 3001 está libre${NC}"
else
    echo -e "\n${YELLOW}⚠️  Puerto 3001 aún está en uso:${NC}"
    lsof -i :3001 2>/dev/null
    echo -e "\n${YELLOW}💡 Para liberar el puerto manualmente:${NC}"
    echo "   lsof -i :3001"
    echo "   kill -9 <PID>"
fi

echo ""

