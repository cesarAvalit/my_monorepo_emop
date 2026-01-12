#!/bin/bash

# Script para configurar pg_hba.conf para permitir conexión sin contraseña (solo desarrollo)

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}🔧 Configurando pg_hba.conf para desarrollo local...${NC}\n"

# Variables
DB_USER=${DB_USER:-emop_user}

# Encontrar pg_hba.conf
HBA_FILE=$(find /etc/postgresql -name pg_hba.conf 2>/dev/null | head -1)

if [ -z "$HBA_FILE" ]; then
    echo -e "${RED}❌ No se encontró pg_hba.conf${NC}"
    echo -e "${YELLOW}Busca manualmente:${NC}"
    echo "  find /etc -name pg_hba.conf"
    exit 1
fi

echo -e "${BLUE}Archivo encontrado: $HBA_FILE${NC}\n"

# Hacer backup
BACKUP_FILE="${HBA_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
echo -e "${YELLOW}Haciendo backup a: $BACKUP_FILE${NC}"
sudo cp "$HBA_FILE" "$BACKUP_FILE"
echo -e "${GREEN}✅ Backup creado${NC}\n"

# Verificar si ya existe configuración para emop_user
if grep -q "emop_user.*127.0.0.1/32.*trust" "$HBA_FILE"; then
    echo -e "${YELLOW}Ya existe configuración para $DB_USER${NC}"
else
    echo -e "${YELLOW}Agregando configuración para $DB_USER...${NC}"
    
    # Buscar la línea "IPv4 local connections" y agregar después de ella
    if grep -q "# IPv4 local connections:" "$HBA_FILE"; then
        # Agregar línea específica para emop_user después de "# IPv4 local connections:"
        sudo sed -i "/# IPv4 local connections:/a host    all             $DB_USER        127.0.0.1/32            trust" "$HBA_FILE"
    else
        # Si no existe esa línea, agregar al final
        echo "host    all             $DB_USER        127.0.0.1/32            trust" | sudo tee -a "$HBA_FILE"
    fi
    
    echo -e "${GREEN}✅ Configuración agregada${NC}"
fi

# O cambiar md5 a trust para todas las conexiones locales (alternativa)
read -p "¿Cambiar todas las conexiones localhost de md5 a trust? (s/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${YELLOW}Cambiando md5 a trust para localhost...${NC}"
    sudo sed -i 's/127.0.0.1\/32.*md5/127.0.0.1\/32            trust/g' "$HBA_FILE"
    echo -e "${GREEN}✅ Cambios aplicados${NC}"
fi

echo ""
echo -e "${YELLOW}Reiniciando PostgreSQL...${NC}"
sudo systemctl restart postgresql
sleep 2

# Verificar que PostgreSQL está corriendo
if systemctl is-active --quiet postgresql; then
    echo -e "${GREEN}✅ PostgreSQL reiniciado correctamente${NC}\n"
else
    echo -e "${RED}❌ Error al reiniciar PostgreSQL${NC}"
    echo -e "${YELLOW}Verifica el estado: sudo systemctl status postgresql${NC}"
    exit 1
fi

# Verificar conexión
echo -e "${YELLOW}Verificando conexión...${NC}"
if psql -h localhost -U $DB_USER -d postgres -c "SELECT 1" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ ¡Conexión exitosa sin contraseña!${NC}\n"
    echo -e "${GREEN}✅ Configuración completada correctamente${NC}\n"
else
    echo -e "${RED}❌ Aún hay problemas de conexión${NC}"
    echo -e "${YELLOW}Verifica manualmente:${NC}"
    echo "  1. cat $HBA_FILE | grep $DB_USER"
    echo "  2. sudo systemctl status postgresql"
    exit 1
fi

echo -e "${YELLOW}📝 Resumen:${NC}"
echo "  - Archivo configurado: $HBA_FILE"
echo "  - Backup guardado en: $BACKUP_FILE"
echo "  - Usuario: $DB_USER"
echo "  - Configuración: trust (sin contraseña, solo desarrollo local)"
echo ""
echo -e "${GREEN}✅ ¡Listo! Ahora puedes conectarte sin contraseña${NC}\n"

