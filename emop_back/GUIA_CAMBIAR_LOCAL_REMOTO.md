# 🔄 Guía: Cambiar Entre Conexión Local y Remota (Supabase)

## 📋 Cómo Funciona el Sistema

El sistema carga las variables de entorno en este orden:

1. **Primero carga `.env`** (configuración remota/Supabase)
2. **Luego carga `.env_local`** (si existe, **SOBRESCRIBE** `.env`)

Esto significa:
- ✅ Si existe `.env_local` → usa configuración LOCAL (PostgreSQL local)
- ✅ Si NO existe `.env_local` → usa configuración REMOTA (Supabase desde `.env`)

## 🔄 Cambiar Entre Local y Remoto

### Opción 1: Usar Archivo `.env_local` (Recomendado)

#### Para usar LOCAL (PostgreSQL):
1. **Asegúrate de que existe `.env_local`** con:
```env
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=emop_db
DB_USER=postgres
DB_PASSWORD=123456
```

2. **Reinicia el backend**:
```bash
cd /home/cesar/emop-my-back/emop_back
npm run dev
```

Deberías ver:
```
🔌 Conectando a PostgreSQL local...
✅ Conectado a PostgreSQL: localhost:5432/emop_db
🗄️  Base de datos: PostgreSQL Local
```

#### Para usar REMOTO (Supabase):
1. **Renombra o elimina `.env_local`**:
```bash
cd /home/cesar/emop-my-back/emop_back
mv .env_local .env_local.bak
# O elimínalo: rm .env_local
```

2. **Asegúrate de que `.env` tiene**:
```env
DB_TYPE=supabase
SUPABASE_URL=https://weberwavolitwvmjfhap.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_LDZn81mde7XPA-qb-AMhVQ_bQ2DBa98
```

3. **Reinicia el backend**:
```bash
npm run dev
```

Deberías ver:
```
🗄️  Base de datos: Supabase
```

### Opción 2: Modificar `.env_local` Directamente

Puedes cambiar el `DB_TYPE` en `.env_local`:

#### Para usar LOCAL:
```env
DB_TYPE=postgres
# ... resto de configuración PostgreSQL
```

#### Para usar REMOTO:
```env
DB_TYPE=supabase
# No necesitas las otras variables de PostgreSQL si usas Supabase
```

**Nota**: Si solo cambias `DB_TYPE` a `supabase` en `.env_local`, aún necesitarás las credenciales de Supabase en `.env`.

### Opción 3: Script de Cambio Rápido

Puedes crear scripts para cambiar rápidamente:

#### Script para usar LOCAL:
```bash
#!/bin/bash
# usar_local.sh
cd /home/cesar/emop-my-back/emop_back
if [ ! -f .env_local ]; then
  echo "❌ .env_local no existe. Crea uno primero."
  exit 1
fi
echo "✅ Usando configuración LOCAL"
```

#### Script para usar REMOTO:
```bash
#!/bin/bash
# usar_remoto.sh
cd /home/cesar/emop-my-back/emop_back
if [ -f .env_local ]; then
  mv .env_local .env_local.bak
  echo "✅ .env_local renombrado a .env_local.bak"
  echo "✅ Usando configuración REMOTA (Supabase)"
else
  echo "✅ Ya estás usando configuración REMOTA"
fi
```

## 📁 Estructura de Archivos

```
emop_back/
├── .env                 # Configuración REMOTA (Supabase)
├── .env_local           # Configuración LOCAL (PostgreSQL) - Sobrescribe .env si existe
├── .env.example         # Plantilla para .env
└── config/
    └── database.js      # Carga .env primero, luego .env_local (override: true)
```

## ✅ Verificar Qué Configuración Estás Usando

### Método 1: Health Check del Backend

```bash
curl http://localhost:3001/health
```

Respuesta para LOCAL:
```json
{
  "status": "ok",
  "database": "PostgreSQL Local",
  ...
}
```

Respuesta para REMOTO:
```json
{
  "status": "ok",
  "database": "Supabase",
  ...
}
```

### Método 2: Ver Logs al Iniciar

```bash
cd /home/cesar/emop-my-back/emop_back
npm run dev
```

Para LOCAL verás:
```
🔌 Conectando a PostgreSQL local...
✅ Conectado a PostgreSQL: localhost:5432/emop_db
🗄️  Base de datos: PostgreSQL Local
```

Para REMOTO verás:
```
🗄️  Base de datos: Supabase
```

### Método 3: Verificar Variables de Entorno

```bash
cd /home/cesar/emop-my-back/emop_back
node -e "require('dotenv').config(); require('dotenv').config({path: '.env_local', override: true}); console.log('DB_TYPE:', process.env.DB_TYPE);"
```

## 🎯 Resumen Rápido

| Quieres usar | Acción | Resultado |
|--------------|--------|-----------|
| **LOCAL** | Tener `.env_local` con `DB_TYPE=postgres` | Usa PostgreSQL local |
| **REMOTO** | Eliminar/renombrar `.env_local` | Usa Supabase desde `.env` |

## ⚠️ Notas Importantes

1. **`.env_local` siempre sobrescribe `.env`** si existe
2. **Para usar remoto**: elimina o renombra `.env_local`
3. **Para usar local**: asegúrate de que `.env_local` existe y tiene `DB_TYPE=postgres`
4. **Siempre reinicia el backend** después de cambiar la configuración

## 🔧 Solución de Problemas

### Problema: Siempre usa LOCAL aunque quiero REMOTO

**Solución**: Verifica que `.env_local` no existe o está renombrado:
```bash
ls -la /home/cesar/emop-my-back/emop_back/.env_local
# Si existe, renómbralo:
mv .env_local .env_local.bak
```

### Problema: Siempre usa REMOTO aunque quiero LOCAL

**Solución**: Verifica que `.env_local` existe y tiene `DB_TYPE=postgres`:
```bash
cat /home/cesar/emop-my-back/emop_back/.env_local | grep DB_TYPE
# Debe mostrar: DB_TYPE=postgres
```

### Problema: No sé qué configuración está usando

**Solución**: Revisa los logs al iniciar o usa el health check:
```bash
curl http://localhost:3001/health | grep database
```

