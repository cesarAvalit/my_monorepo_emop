#!/bin/bash

# Script rápido para configurar pg_hba.conf y solucionar autenticación

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🔧 Configurando autenticación PostgreSQL para desarrollo local...${NC}\n"

HBA_FILE="/etc/postgresql/16/main/pg_hba.conf"

if [ ! -f "$HBA_FILE" ]; then
    echo -e "${RED}❌ No se encontró $HBA_FILE${NC}"
    echo "Buscando en otras ubicaciones..."
    HBA_FILE=$(find /etc/postgresql -name pg_hba.conf 2>/dev/null | head -1)
    if [ -z "$HBA_FILE" ]; then
        echo -e "${RED}❌ No se encontró pg_hba.conf${NC}"
        exit 1
    fi
fi

echo -e "${YELLOW}Archivo encontrado: $HBA_FILE${NC}\n"

# Backup
BACKUP="${HBA_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
echo -e "${YELLOW}Haciendo backup: $BACKUP${NC}"
sudo cp "$HBA_FILE" "$BACKUP"
echo -e "${GREEN}✅ Backup creado${NC}\n"

# Cambiar md5 a trust para localhost
echo -e "${YELLOW}Configurando autenticación trust para localhost...${NC}"

# Buscar y cambiar línea con md5 para localhost IPv4
if grep -q "127.0.0.1/32.*md5" "$HBA_FILE"; then
    sudo sed -i 's/127.0.0.1\/32.*md5/127.0.0.1\/32            trust/g' "$HBA_FILE"
    echo -e "${GREEN}✅ Cambiado md5 a trust para localhost${NC}"
fi

# También para ::1 (IPv6 localhost)
if grep -q "::1/128.*md5" "$HBA_FILE"; then
    sudo sed -i 's/::1\/128.*md5/::1\/128            trust/g' "$HBA_FILE"
    echo -e "${GREEN}✅ Cambiado md5 a trust para IPv6 localhost${NC}"
fi

# Agregar línea específica para emop_user si no existe
if ! grep -q "emop_user.*127.0.0.1/32.*trust" "$HBA_FILE"; then
    echo -e "${YELLOW}Agregando línea específica para emop_user...${NC}"
    sudo sed -i "/# IPv4 local connections:/a host    all             emop_user        127.0.0.1/32            trust" "$HBA_FILE"
    echo -e "${GREEN}✅ Línea agregada para emop_user${NC}"
fi

echo ""
echo -e "${YELLOW}Reiniciando PostgreSQL...${NC}"
sudo systemctl restart postgresql
sleep 2

# Verificar estado
if systemctl is-active --quiet postgresql; then
    echo -e "${GREEN}✅ PostgreSQL reiniciado${NC}\n"
else
    echo -e "${RED}❌ Error al reiniciar PostgreSQL${NC}"
    exit 1
fi

# Verificar conexión
echo -e "${YELLOW}Verificando conexión...${NC}"
if psql -h localhost -U emop_user -d emop_db -c "SELECT 1" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ ¡Conexión exitosa sin contraseña!${NC}\n"
    echo -e "${GREEN}✅ Configuración completada correctamente${NC}\n"
    echo -e "${YELLOW}Ahora reinicia el backend:${NC}"
    echo "  npm run dev"
    exit 0
else
    echo -e "${RED}❌ Aún hay problemas${NC}"
    echo -e "${YELLOW}Verifica manualmente:${NC}"
    echo "  cat $HBA_FILE | grep -E '(127.0.0.1|emop_user)'"
    exit 1
fi

