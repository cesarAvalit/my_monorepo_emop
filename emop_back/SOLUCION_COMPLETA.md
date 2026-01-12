# 🔧 Solución Completa: Problemas de Autenticación y Configuración

## ❌ Problemas Detectados

1. ✅ Error de autenticación: `password authentication failed for user "emop_user"`
2. ✅ Backend usando Supabase en lugar de PostgreSQL local
3. ✅ Archivo `.env_local` probablemente no existe o está mal configurado

## ✅ Solución Paso a Paso

### Paso 1: Crear/Verificar .env_local

```bash
cd /home/cesar/emop-my-back/emop_back

# Crear .env_local si no existe
./CREAR_ENV_LOCAL.sh

# O crearlo manualmente
cat > .env_local << 'EOF'
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=emop_db
DB_USER=emop_user
DB_PASSWORD=emop_password
EOF
```

### Paso 2: Configurar pg_hba.conf (Permite conexión sin contraseña)

```bash
cd /home/cesar/emop-my-back/emop_back

# Usar el script automático
./scripts/configurar_pg_hba.sh
```

**O manualmente:**

```bash
# 1. Encontrar pg_hba.conf
find /etc/postgresql -name pg_hba.conf

# 2. Editar (reemplaza [VERSION] con tu versión)
sudo nano /etc/postgresql/*/main/pg_hba.conf

# 3. Buscar esta línea:
#    host    all             all             127.0.0.1/32            md5
#    Y cambiarla a:
#    host    all             all             127.0.0.1/32            trust

# O agregar esta línea específica ANTES de la línea anterior:
#    host    all             emop_user       127.0.0.1/32            trust

# 4. Guardar (Ctrl+X, Y, Enter)

# 5. Reiniciar PostgreSQL
sudo systemctl restart postgresql
```

### Paso 3: Verificar Conexión

```bash
# Ahora debería funcionar sin contraseña
psql -h localhost -U emop_user -d emop_db -c "SELECT 1"

# Debería mostrar:
#  ?column? 
# ----------
#         1
# (1 row)
```

### Paso 4: Restaurar Backup

```bash
cd /home/cesar/emop-my-back/emop_back
./scripts/restaurar_backup_local.sh
```

### Paso 5: Iniciar Backend

```bash
cd /home/cesar/emop-my-back/emop_back
npm run dev
```

**✅ Deberías ver:**
```
🚀 Servidor EMOP Backend corriendo en http://localhost:3001
📡 Frontend esperado en: http://localhost:5173
🗄️  Base de datos: PostgreSQL Local  ← Esto confirma que usa PostgreSQL local
🔗 Health check: http://localhost:3001/health
```

## 🔍 Verificaciones

### Verificar que .env_local existe y está correcto

```bash
cat /home/cesar/emop-my-back/emop_back/.env_local
```

Debería mostrar:
```
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=emop_db
DB_USER=emop_user
DB_PASSWORD=emop_password
```

### Verificar que pg_hba.conf está configurado

```bash
sudo grep -E "(emop_user|127.0.0.1.*trust)" /etc/postgresql/*/main/pg_hba.conf
```

Deberías ver una línea con `trust` para `emop_user` o para todas las conexiones locales.

### Verificar conexión a PostgreSQL

```bash
psql -h localhost -U emop_user -d emop_db -c "SELECT 1"
```

### Verificar que el backend detecta PostgreSQL local

```bash
curl http://localhost:3001/health
```

Debería mostrar:
```json
{
  "status": "ok",
  "database": "PostgreSQL Local",
  ...
}
```

## ⚠️ Si el Backend Sigue Usando Supabase

1. **Verifica que .env_local existe**:
   ```bash
   ls -la /home/cesar/emop-my-back/emop_back/.env_local
   ```

2. **Verifica que tiene DB_TYPE=postgres**:
   ```bash
   grep DB_TYPE /home/cesar/emop-my-back/emop_back/.env_local
   ```

3. **Reinicia el backend** (Ctrl+C y `npm run dev` nuevamente)

4. **Verifica que está leyendo .env_local**:
   El backend debería cargar `.env_local` automáticamente si existe.

## 💡 Comandos Rápidos (Todo en Uno)

```bash
# 1. Ir al directorio
cd /home/cesar/emop-my-back/emop_back

# 2. Crear .env_local
./CREAR_ENV_LOCAL.sh

# 3. Configurar pg_hba.conf
./scripts/configurar_pg_hba.sh

# 4. Verificar conexión
psql -h localhost -U emop_user -d emop_db -c "SELECT 1"

# 5. Restaurar backup
./scripts/restaurar_backup_local.sh

# 6. Iniciar backend
npm run dev
```

## 🎯 Resultado Esperado

Cuando todo esté correcto:

- ✅ `.env_local` existe con `DB_TYPE=postgres`
- ✅ PostgreSQL permite conexión sin contraseña (trust) para desarrollo local
- ✅ El script de restauración funciona sin errores
- ✅ El backend muestra `🗄️  Base de datos: PostgreSQL Local`
- ✅ Health check responde con `"database": "PostgreSQL Local"`

