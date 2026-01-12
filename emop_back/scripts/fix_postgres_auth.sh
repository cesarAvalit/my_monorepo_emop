#!/bin/bash

# Script de ayuda para solucionar problemas de autenticación de PostgreSQL
# Ejecuta este script si tienes problemas de autenticación

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🔧 Script de Corrección de Autenticación PostgreSQL${NC}\n"

# Variables
DB_USER=${DB_USER:-emop_user}
DB_PASSWORD=${DB_PASSWORD:-emop_password}

echo -e "${YELLOW}Opción 1: Eliminar y recrear usuario (Recomendado)${NC}"
echo -e "${YELLOW}Esto eliminará el usuario existente y lo recreará con la contraseña correcta${NC}\n"

read -p "¿Eliminar y recrear usuario $DB_USER? (s/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${YELLOW}Eliminando usuario $DB_USER...${NC}"
    sudo -u postgres psql <<EOF
-- Eliminar usuario si existe (CASCADE elimina dependencias)
DROP USER IF EXISTS $DB_USER CASCADE;

-- Crear usuario nuevo con contraseña
CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD' CREATEDB;

-- Verificar que se creó
\du $DB_USER
EOF
    
    echo -e "${GREEN}✅ Usuario recreado exitosamente${NC}\n"
    
    # Intentar verificar conexión
    echo -e "${YELLOW}Verificando conexión...${NC}"
    if PGPASSWORD=$DB_PASSWORD psql -h localhost -U $DB_USER -d postgres -c "SELECT 1" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Conexión exitosa!${NC}"
    else
        echo -e "${RED}❌ Aún hay problemas de autenticación${NC}"
        echo -e "${YELLOW}Intenta la Opción 2${NC}\n"
    fi
fi

echo -e "\n${YELLOW}Opción 2: Configurar pg_hba.conf para autenticación local${NC}"
echo -e "${YELLOW}Esto permite autenticación sin contraseña para desarrollo local${NC}\n"

read -p "¿Configurar pg_hba.conf? (s/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    # Encontrar archivo pg_hba.conf
    PG_VERSION=$(sudo -u postgres psql -c "SHOW server_version;" -t | head -n1 | cut -d. -f1)
    HBA_FILE="/etc/postgresql/${PG_VERSION}/main/pg_hba.conf"
    
    if [ -f "$HBA_FILE" ]; then
        echo -e "${YELLOW}Archivo encontrado: $HBA_FILE${NC}"
        echo -e "${YELLOW}Haciendo backup del archivo...${NC}"
        sudo cp "$HBA_FILE" "${HBA_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
        
        echo -e "${YELLOW}Configurando autenticación local...${NC}"
        # Agregar línea para autenticación local si no existe
        if ! grep -q "^host.*all.*$DB_USER.*127.0.0.1/32.*trust" "$HBA_FILE"; then
            echo "host    all             $DB_USER             127.0.0.1/32            trust" | sudo tee -a "$HBA_FILE"
        fi
        
        echo -e "${YELLOW}Reiniciando PostgreSQL...${NC}"
        sudo systemctl restart postgresql
        
        echo -e "${GREEN}✅ Configuración completada${NC}"
        echo -e "${YELLOW}⚠️  Nota: Esto permite conexión sin contraseña solo para desarrollo local${NC}"
    else
        echo -e "${RED}❌ No se encontró pg_hba.conf en $HBA_FILE${NC}"
        echo -e "${YELLOW}Busca manualmente el archivo:${NC}"
        echo "  find /etc -name pg_hba.conf 2>/dev/null"
    fi
fi

echo -e "\n${GREEN}✅ Proceso completado${NC}\n"
echo -e "${YELLOW}Ahora intenta ejecutar nuevamente:${NC}"
echo "  ./scripts/crear_db_local.sh"

