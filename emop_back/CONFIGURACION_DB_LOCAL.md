# 🗄️ Configuración de Base de Datos PostgreSQL Local

Esta guía te mostrará cómo configurar una base de datos PostgreSQL local y usarla con el backend de EMOP.

## 📋 Requisitos Previos

1. **PostgreSQL instalado** en tu sistema
2. **Backup de Supabase** descargado (en `backup_supabase/`)
3. **Permisos de sudo** (para crear base de datos)

## 🚀 Pasos para Configurar la Base de Datos Local

### Paso 1: Verificar PostgreSQL

```bash
# Verificar que PostgreSQL esté instalado
psql --version

# Verificar que PostgreSQL esté corriendo
sudo systemctl status postgresql
# O
sudo service postgresql status
```

Si PostgreSQL no está corriendo, inícialo:

```bash
sudo systemctl start postgresql
# O
sudo service postgresql start
```

### Paso 2: Crear la Base de Datos Local

Ejecuta el script de creación:

```bash
cd emop_back
./scripts/crear_db_local.sh
```

Este script:
- ✅ Crea el usuario `emop_user` (si no existe)
- ✅ Crea la base de datos `emop_db` (si no existe)
- ✅ Configura los permisos necesarios
- ✅ Guarda las credenciales en `.env_local`

### Paso 3: Restaurar el Backup

Una vez creada la base de datos, restaura el backup de Supabase:

```bash
cd emop_back
./scripts/restaurar_backup_local.sh
```

Este script:
- ✅ Restaura el esquema (estructura de tablas)
- ✅ Restaura todos los datos del backup
- ✅ Verifica que todo se haya cargado correctamente

### Paso 4: Configurar el Backend

El archivo `.env_local` ya se creó automáticamente con las credenciales. Solo necesitas verificar que exista:

```bash
cat emop_back/.env_local
```

Debería contener:

```env
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=emop_db
DB_USER=emop_user
DB_PASSWORD=emop_password
```

### Paso 5: Instalar Dependencias

Asegúrate de tener instalada la dependencia `pg`:

```bash
cd emop_back
npm install
```

### Paso 6: Iniciar el Backend

Ahora puedes iniciar el backend. El backend detectará automáticamente que debe usar PostgreSQL local porque existe `.env_local` con `DB_TYPE=postgres`:

```bash
cd emop_back
npm run dev
```

Deberías ver:

```
🚀 Servidor EMOP Backend corriendo en http://localhost:3001
📡 Frontend esperado en: http://localhost:5173
🗄️  Base de datos: PostgreSQL Local
🔗 Health check: http://localhost:3001/health
```

## 🔄 Cambiar entre Supabase y PostgreSQL Local

### Usar PostgreSQL Local

Crea o actualiza `.env_local`:

```env
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=emop_db
DB_USER=emop_user
DB_PASSWORD=emop_password
```

### Usar Supabase

Elimina `.env_local` o configura `DB_TYPE=supabase` en `.env`:

```env
# En .env
DB_TYPE=supabase
SUPABASE_URL=https://weberwavolitwvmjfhap.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

**Importante**: El backend prioriza `.env_local` sobre `.env`. Si quieres usar Supabase, asegúrate de que `.env_local` no exista o tenga `DB_TYPE=supabase`.

## 📝 Estructura de Archivos

```
emop_back/
├── .env                  # Configuración Supabase (producción)
├── .env_local            # Configuración PostgreSQL local (desarrollo)
├── config/
│   ├── database.js       # Módulo de conexión (soporta ambos tipos)
│   └── supabase.js       # Compatibilidad (deprecado)
├── scripts/
│   ├── crear_db_local.sh          # Script para crear DB local
│   ├── restaurar_backup_local.sh  # Script para restaurar backup
│   └── restaurar_datos_local.js   # Script Node.js para restaurar datos
└── utils/
    └── dbHelpers.js      # Helpers que funcionan con ambos tipos de DB
```

## ✅ Verificación

### Verificar que la Base de Datos Funciona

```bash
# Conectarse a PostgreSQL
psql -h localhost -U emop_user -d emop_db

# Verificar tablas
\dt

# Verificar datos
SELECT COUNT(*) FROM empresa;
SELECT COUNT(*) FROM usuario;
SELECT COUNT(*) FROM vehiculo;

# Salir
\q
```

### Verificar que el Backend Funciona

```bash
# Health check
curl http://localhost:3001/health

# Debería responder:
# {
#   "status": "ok",
#   "message": "EMOP Backend API está funcionando",
#   "database": "PostgreSQL Local",
#   "timestamp": "..."
# }
```

### Probar un Endpoint

```bash
# Obtener empresas
curl http://localhost:3001/api/empresa

# Debería devolver los datos de las empresas
```

## 🐛 Solución de Problemas

### Error: "PostgreSQL no está corriendo"

```bash
# Iniciar PostgreSQL
sudo systemctl start postgresql

# Verificar estado
sudo systemctl status postgresql
```

### Error: "No se pudo conectar a la base de datos"

1. Verifica que PostgreSQL esté corriendo
2. Verifica las credenciales en `.env_local`
3. Verifica que el usuario y la base de datos existan:

```bash
sudo -u postgres psql -c "\du"  # Ver usuarios
sudo -u postgres psql -c "\l"   # Ver bases de datos
```

### Error: "No se encuentra el módulo 'pg'"

```bash
cd emop_back
npm install
```

### El Backend Sigue Usando Supabase

1. Verifica que existe `.env_local`
2. Verifica que `DB_TYPE=postgres` en `.env_local`
3. Reinicia el backend

### Datos No Se Restauraron Correctamente

1. Verifica que el backup existe en `backup_supabase/`
2. Verifica que el esquema se restauró:

```bash
psql -h localhost -U emop_user -d emop_db -c "\dt"
```

3. Si es necesario, elimina la base de datos y vuelve a crearla:

```bash
sudo -u postgres psql -c "DROP DATABASE IF EXISTS emop_db;"
./scripts/crear_db_local.sh
./scripts/restaurar_backup_local.sh
```

## 📚 Recursos Adicionales

- [Documentación PostgreSQL](https://www.postgresql.org/docs/)
- [Documentación node-postgres](https://node-postgres.com/)

## 💡 Tips

- **Desarrollo Local**: Usa PostgreSQL local para desarrollo rápido sin depender de internet
- **Producción**: Usa Supabase para producción (infraestructura gestionada)
- **Backup**: Haz backups regulares de tu base de datos local con `pg_dump`
- **Migraciones**: Cuando actualices el esquema, actualiza tanto Supabase como la DB local

