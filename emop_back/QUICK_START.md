# ⚡ Inicio Rápido: Backend con PostgreSQL Local

## Comandos en Orden

```bash
# 1. Ir al directorio del backend
cd emop_back

# 2. Crear base de datos local
./scripts/crear_db_local.sh

# 3. Restaurar backup
./scripts/restaurar_backup_local.sh

# 4. Instalar dependencias (solo primera vez)
npm install

# 5. Iniciar backend
npm run dev
```

## Verificar que Funciona

```bash
# En otra terminal:
curl http://localhost:3001/health

# Debería mostrar: "database": "PostgreSQL Local"
```

## ✅ Listo!

El backend está corriendo en: `http://localhost:3001`

Para más detalles, ver: `PASOS_LEVANTAR_DB_LOCAL.md`
