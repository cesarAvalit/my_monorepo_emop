# 🚀 Pasos para Configurar PostgreSQL Local con Usuario postgres

## 📋 Configuración Actual

- **Usuario**: `postgres`
- **Contraseña**: `123456`
- **Base de datos**: `emop_db`
- **Host**: `localhost`
- **Puerto**: `5432`

## ✅ Pasos a Seguir

### Paso 1: Configurar la Base de Datos

```bash
cd /home/cesar/emop-my-back/emop_back
./scripts/configurar_db_postgres.sh
```

Este script:
- ✅ Verifica que PostgreSQL está corriendo
- ✅ Verifica conexión con postgres/123456
- ✅ Crea la base de datos `emop_db` si no existe
- ✅ Configura permisos
- ✅ Actualiza `.env_local` con las credenciales correctas

### Paso 2: Restaurar el Esquema (Estructura)

```bash
cd /home/cesar/emop-my-back/emop_back
./scripts/restaurar_esquema_postgres.sh
```

Este script:
- ✅ Restaura todas las tablas desde `backup_supabase/esquema.sql`
- ✅ Verifica que las tablas se crearon correctamente

### Paso 3: Restaurar los Datos

```bash
cd /home/cesar/emop-my-back/emop_back
./scripts/restaurar_datos_postgres.sh
```

Este script:
- ✅ Restaura todos los datos desde `backup_supabase/datos_completos.json`
- ✅ Inserta registros en todas las tablas
- ✅ Verifica que los datos se insertaron correctamente

### Paso 4: Verificar que Todo Funciona

```bash
# Verificar que puedes conectarte
psql -h localhost -U postgres -d emop_db
# Contraseña: 123456

# Dentro de PostgreSQL:
SELECT COUNT(*) FROM usuario;
SELECT COUNT(*) FROM rol;
SELECT COUNT(*) FROM empresa;
\q
```

### Paso 5: Iniciar el Backend

```bash
cd /home/cesar/emop-my-back/emop_back
npm run dev
```

Deberías ver:
```
🔌 Conectando a PostgreSQL local...
✅ Conectado a PostgreSQL: localhost:5432/emop_db
🚀 Servidor EMOP Backend corriendo en http://localhost:3001
🗄️  Base de datos: PostgreSQL Local
```

### Paso 6: Probar el Backend

```bash
# Verificar health check
curl http://localhost:3001/health

# Debería responder:
# {
#   "status": "ok",
#   "database": "PostgreSQL Local",
#   ...
# }

# Probar endpoints
curl http://localhost:3001/api/usuario
curl http://localhost:3001/api/rol
curl http://localhost:3001/api/empresa
```

## 🎯 Comandos Rápidos (Todo en Uno)

```bash
cd /home/cesar/emop-my-back/emop_back

# 1. Configurar base de datos
./scripts/configurar_db_postgres.sh

# 2. Restaurar esquema
./scripts/restaurar_esquema_postgres.sh

# 3. Restaurar datos
./scripts/restaurar_datos_postgres.sh

# 4. Iniciar backend
npm run dev
```

## ✅ Verificaciones

### Verificar que la base de datos existe

```bash
psql -h localhost -U postgres -d postgres -c "\l" | grep emop_db
```

### Verificar tablas creadas

```bash
psql -h localhost -U postgres -d emop_db -c "\dt"
```

### Verificar datos

```bash
psql -h localhost -U postgres -d emop_db -c "SELECT COUNT(*) FROM usuario;"
psql -h localhost -U postgres -d emop_db -c "SELECT COUNT(*) FROM rol;"
psql -h localhost -U postgres -d emop_db -c "SELECT COUNT(*) FROM empresa;"
```

## 🔧 Configuración Actualizada

El archivo `.env_local` ahora contiene:

```env
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=emop_db
DB_USER=postgres
DB_PASSWORD=123456
```

El backend usará estas credenciales para conectarse a PostgreSQL local.

## ⚠️ Notas Importantes

1. **Contraseña**: La contraseña `123456` está en el archivo `.env_local` - solo para desarrollo local
2. **Usuario postgres**: Usamos el usuario `postgres` que tiene todos los privilegios
3. **Permisos**: No hay problemas de permisos porque usamos el usuario `postgres`
4. **Backup**: Asegúrate de que existe `backup_supabase/esquema.sql` y `backup_supabase/datos_completos.json`

## 🐛 Si Hay Problemas

### Error: "database does not exist"

Ejecuta manualmente:
```bash
PGPASSWORD=123456 psql -h localhost -U postgres -d postgres -c "CREATE DATABASE emop_db;"
```

### Error: "password authentication failed"

Verifica que la contraseña sea `123456`:
```bash
psql -h localhost -U postgres -d postgres
# Debe pedirte la contraseña
```

### Error: "relation does not exist"

Ejecuta el script de restaurar esquema:
```bash
./scripts/restaurar_esquema_postgres.sh
```

## ✅ Estado Final Esperado

Cuando todo esté correcto:
- ✅ Base de datos `emop_db` creada
- ✅ Todas las tablas creadas (27+ tablas)
- ✅ Todos los datos restaurados (225+ registros)
- ✅ Backend conectado a PostgreSQL local
- ✅ API funcionando correctamente

