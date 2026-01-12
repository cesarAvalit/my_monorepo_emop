#!/bin/bash
# Script rápido para crear .env_local si no existe

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_LOCAL="$SCRIPT_DIR/.env_local"

if [ -f "$ENV_LOCAL" ]; then
    echo "⚠️  .env_local ya existe"
    cat "$ENV_LOCAL"
else
    echo "Creando .env_local..."
    cat > "$ENV_LOCAL" << 'ENVEOF'
# Configuración de Base de Datos PostgreSQL Local
# Generado automáticamente

# Tipo de base de datos
DB_TYPE=postgres

# Configuración de PostgreSQL Local
DB_HOST=localhost
DB_PORT=5432
DB_NAME=emop_db
DB_USER=emop_user
DB_PASSWORD=emop_password
ENVEOF
    echo "✅ .env_local creado"
    cat "$ENV_LOCAL"
fi
