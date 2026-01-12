#!/bin/bash

# Script rápido para corregir la contraseña del usuario emop_user

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

DB_USER=${DB_USER:-emop_user}
DB_PASSWORD=${DB_PASSWORD:-emop_password}

echo -e "${GREEN}🔧 Corrigiendo contraseña de $DB_USER...${NC}\n"

# Actualizar la contraseña usando sudo -u postgres (siempre funciona)
echo -e "${YELLOW}Actualizando contraseña del usuario...${NC}"
sudo -u postgres psql <<EOF
-- Asegurar que el usuario existe y tiene la contraseña correcta
ALTER USER $DB_USER WITH PASSWORD '$DB_PASSWORD';

-- Otorgar privilegios necesarios
ALTER USER $DB_USER WITH CREATEDB;

-- Verificar que se actualizó
\du $DB_USER
EOF

echo -e "\n${GREEN}✅ Contraseña actualizada${NC}\n"

# Intentar conectar para verificar
echo -e "${YELLOW}Verificando conexión...${NC}"
if PGPASSWORD=$DB_PASSWORD psql -h localhost -U $DB_USER -d postgres -c "SELECT 1" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ ¡Conexión exitosa!${NC}\n"
    exit 0
else
    echo -e "${YELLOW}⚠️  Aún hay problemas de autenticación${NC}"
    echo -e "${YELLOW}Configurando pg_hba.conf para permitir autenticación local...${NC}\n"
    
    # Encontrar pg_hba.conf
    HBA_FILE=$(find /etc/postgresql -name pg_hba.conf 2>/dev/null | head -1)
    
    if [ -z "$HBA_FILE" ]; then
        echo -e "${RED}❌ No se encontró pg_hba.conf${NC}"
        echo -e "${YELLOW}Busca manualmente: find /etc -name pg_hba.conf${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}Archivo encontrado: $HBA_FILE${NC}"
    echo -e "${YELLOW}Haciendo backup...${NC}"
    sudo cp "$HBA_FILE" "${HBA_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
    
    # Verificar si ya existe la línea para emop_user
    if grep -q "emop_user.*127.0.0.1/32.*trust" "$HBA_FILE"; then
        echo -e "${YELLOW}Ya existe configuración para emop_user${NC}"
    else
        echo -e "${YELLOW}Agregando configuración para emop_user...${NC}"
        # Agregar línea antes de la última línea (generalmente es un comentario)
        sudo sed -i "/^# IPv4 local connections:/a host    all             $DB_USER        127.0.0.1/32            trust" "$HBA_FILE"
    fi
    
    echo -e "${YELLOW}Reiniciando PostgreSQL...${NC}"
    sudo systemctl restart postgresql
    sleep 2
    
    # Verificar nuevamente
    echo -e "${YELLOW}Verificando conexión nuevamente...${NC}"
    if psql -h localhost -U $DB_USER -d postgres -c "SELECT 1" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ ¡Conexión exitosa! (sin contraseña, solo para desarrollo local)${NC}\n"
    else
        echo -e "${RED}❌ Aún hay problemas. Verifica manualmente:${NC}"
        echo "  1. sudo nano $HBA_FILE"
        echo "  2. Busca y verifica la línea para emop_user"
        echo "  3. Debe ser: host    all    $DB_USER    127.0.0.1/32    trust"
        echo "  4. sudo systemctl restart postgresql"
        exit 1
    fi
fi

echo -e "${GREEN}✅ Todo configurado correctamente${NC}\n"

