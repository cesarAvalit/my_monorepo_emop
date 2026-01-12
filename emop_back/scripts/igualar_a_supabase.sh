#!/bin/bash

# Script completo para igualar la base de datos local con Supabase
# 1. Descarga datos actualizados de Supabase
# 2. Restaura esquema desde backup
# 3. Restaura datos desde backup
# 4. Verifica diferencias

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
BACKEND_DIR="$SCRIPT_DIR/.."

echo -e "${BLUE}🔄 Igualando base de datos local con Supabase...${NC}\n"

# Paso 1: Descargar datos actualizados de Supabase
echo -e "${YELLOW}📥 Paso 1: Descargando datos actualizados de Supabase...${NC}"
cd "$BACKEND_DIR"
node descargar_db_supabase.js

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error descargando datos de Supabase${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Datos descargados correctamente${NC}\n"

# Paso 2: Restaurar esquema
echo -e "${YELLOW}📋 Paso 2: Restaurando esquema (estructura)...${NC}"
cd "$BACKEND_DIR"
./scripts/restaurar_esquema_postgres.sh

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Advertencia: Hubo algunos errores restaurando el esquema (puede ser normal si las tablas ya existen)${NC}"
fi

echo ""

# Paso 3: Limpiar y restaurar datos
echo -e "${YELLOW}🧹 Paso 3: Limpiando datos existentes...${NC}"
BACKUP_FILE="$PROJECT_ROOT/backup_supabase/datos_completos.json"

if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}❌ Error: Archivo de backup no encontrado: $BACKUP_FILE${NC}"
    exit 1
fi

# Obtener lista de tablas desde el JSON
TABLAS=$(python3 << PYTHON
import json
import sys

try:
    with open('$BACKUP_FILE', 'r') as f:
        data = json.load(f)
    # Orden inverso para eliminar en orden de dependencias
    tablas = list(data.keys())
    # Tablas con datos primero, luego las vacías
    tablas_con_datos = [t for t in tablas if len(data.get(t, [])) > 0]
    tablas_vacias = [t for t in tablas if len(data.get(t, [])) == 0]
    # Ordenar: eliminar primero las que dependen de otras
    orden_dependencias = [
        'auditoria', 'orden_x_mecanico', 'orden_x_usuario', 'detalle_insumo',
        'linea_servicio', 'orden_trabajo', 'notificaciones', 'rto_registro',
        'ddjj_x_usuario', 'inspeccion_ddjj', 'reporte_auditoria_ddjj',
        'declaracion_jurada', 'conductor', 'vehiculo', 'mecanico',
        'insumo_catalogo', 'tipo_mantenimiento', 'tipo_notificacion',
        'usuario', 'empresa', 'rol'
    ]
    
    # Ordenar tablas según dependencias (invertido para DELETE)
    ordenadas = []
    for tabla in orden_dependencias:
        if tabla in tablas_con_datos:
            ordenadas.append(tabla)
    # Agregar las que no están en la lista
    for tabla in tablas_con_datos:
        if tabla not in ordenadas:
            ordenadas.append(tabla)
    
    print(' '.join(ordenadas))
except Exception as e:
    print('', file=sys.stderr)
    sys.exit(1)
PYTHON
)

if [ -z "$TABLAS" ]; then
    echo -e "${YELLOW}⚠️  No se pudieron obtener las tablas del backup${NC}"
else
    echo -e "${BLUE}🗑️  Limpiando datos de tablas...${NC}"
    PGPASSWORD=${DB_PASSWORD:-123456}
    DB_HOST=${DB_HOST:-localhost}
    DB_PORT=${DB_PORT:-5432}
    DB_NAME=${DB_NAME:-emop_db}
    DB_USER=${DB_USER:-postgres}
    
    if [ -f "$BACKEND_DIR/.env_local" ]; then
        export $(cat "$BACKEND_DIR/.env_local" | grep -v '^#' | xargs)
        PGPASSWORD=${DB_PASSWORD:-123456}
        DB_HOST=${DB_HOST:-localhost}
        DB_PORT=${DB_PORT:-5432}
        DB_NAME=${DB_NAME:-emop_db}
        DB_USER=${DB_USER:-postgres}
    fi
    
    for tabla in $TABLAS; do
        echo -e "  🗑️  Limpiando $tabla..."
        PGPASSWORD=$PGPASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "TRUNCATE TABLE \"$tabla\" CASCADE;" 2>&1 | grep -v "NOTICE:" || true
    done
    
    echo -e "${GREEN}✅ Datos limpiados${NC}\n"
fi

# Paso 4: Restaurar datos
echo -e "${YELLOW}📊 Paso 4: Restaurando datos desde backup...${NC}"
cd "$BACKEND_DIR"
node scripts/restaurar_datos_local.js "$BACKUP_FILE"

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Hubo algunos errores restaurando datos (algunos pueden ser normales por dependencias)${NC}"
fi

echo ""

# Paso 5: Sincronizar secuencias
echo -e "${YELLOW}🔧 Paso 5: Sincronizando secuencias...${NC}"
cd "$BACKEND_DIR"
./scripts/sincronizar_secuencias.sh

echo ""

# Paso 6: Verificar resultados
echo -e "${YELLOW}✅ Paso 6: Verificando resultados...${NC}"
cd "$BACKEND_DIR"
node scripts/comparar_tablas.js | tail -30

echo ""
echo -e "${GREEN}✅ Proceso completado${NC}"
echo -e "${BLUE}💡 Revisa el resumen anterior para verificar que todo está sincronizado${NC}"

