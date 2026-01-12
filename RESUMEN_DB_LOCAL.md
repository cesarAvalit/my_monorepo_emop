# 📦 Resumen: Configuración de Base de Datos PostgreSQL Local

## ✅ Tareas Completadas

### 1. ✅ Scripts Creados

- **`emop_back/scripts/crear_db_local.sh`**: Script para crear la base de datos PostgreSQL local
  - Crea usuario y base de datos
  - Configura permisos
  - Genera archivo `.env_local` automáticamente

- **`emop_back/scripts/restaurar_backup_local.sh`**: Script para restaurar el backup de Supabase
  - Restaura el esquema (estructura de tablas)
  - Restaura todos los datos del backup
  - Verifica que todo se haya cargado correctamente

- **`emop_back/scripts/restaurar_datos_local.js`**: Script Node.js para insertar datos en PostgreSQL
  - Lee el archivo `datos_completos.json` del backup
  - Inserta datos respetando dependencias entre tablas
  - Maneja errores de duplicados y datos inválidos

### 2. ✅ Módulo de Conexión de Base de Datos

- **`emop_back/config/database.js`**: Módulo principal de conexión
  - Soporta tanto Supabase como PostgreSQL local
  - Detecta automáticamente el tipo de base de datos según configuración
  - Carga variables de `.env` o `.env_local`
  - Gestiona pool de conexiones para PostgreSQL

### 3. ✅ Helpers de Base de Datos Actualizados

- **`emop_back/utils/dbHelpers.js`**: Funciones helper actualizadas
  - Funcionan con ambos tipos de base de datos (Supabase y PostgreSQL)
  - Mismas funciones: `getAllFromTable`, `getById`, `getByForeignKey`, etc.
  - El código no necesita cambios cuando se cambia de base de datos

### 4. ✅ Archivos de Configuración

- **`emop_back/.env_local.example`**: Archivo de ejemplo con credenciales de PostgreSQL local
- **`emop_back/.env_local`**: Se genera automáticamente al ejecutar `crear_db_local.sh`

### 5. ✅ Backend Actualizado

- **`emop_back/server.js`**: Actualizado para mostrar el tipo de base de datos en uso
- **`emop_back/config/supabase.js`**: Actualizado para mantener compatibilidad (re-exporta desde `database.js`)

### 6. ✅ Dependencias

- **`emop_back/package.json`**: Agregada dependencia `pg@^8.11.3` para PostgreSQL

### 7. ✅ Documentación

- **`emop_back/CONFIGURACION_DB_LOCAL.md`**: Guía completa de configuración
- **`RESUMEN_DB_LOCAL.md`**: Este archivo con el resumen

## 🚀 Cómo Usar

### Paso 1: Crear la Base de Datos Local

```bash
cd emop_back
./scripts/crear_db_local.sh
```

Esto creará:
- Usuario: `emop_user`
- Base de datos: `emop_db`
- Archivo `.env_local` con las credenciales

### Paso 2: Restaurar el Backup

```bash
cd emop_back
./scripts/restaurar_backup_local.sh
```

Esto restaurará:
- El esquema completo (estructura de tablas)
- Todos los datos del backup de Supabase

### Paso 3: Iniciar el Backend

```bash
cd emop_back
npm install  # Solo la primera vez
npm run dev
```

El backend detectará automáticamente que debe usar PostgreSQL local porque existe `.env_local` con `DB_TYPE=postgres`.

## 🔄 Cambiar entre Bases de Datos

### Usar PostgreSQL Local

1. Asegúrate de que existe `.env_local` con:
```env
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=emop_db
DB_USER=emop_user
DB_PASSWORD=emop_password
```

2. Inicia el backend

### Usar Supabase

1. Elimina `.env_local` o configura `DB_TYPE=supabase` en `.env`

2. Asegúrate de que `.env` tiene:
```env
SUPABASE_URL=https://weberwavolitwvmjfhap.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

3. Inicia el backend

## 📁 Estructura de Archivos

```
emop-my-back/
├── emop_back/
│   ├── config/
│   │   ├── database.js          # Módulo de conexión (soporta ambos)
│   │   └── supabase.js          # Compatibilidad (deprecado)
│   ├── utils/
│   │   └── dbHelpers.js         # Helpers que funcionan con ambos
│   ├── scripts/
│   │   ├── crear_db_local.sh           # Crear DB local
│   │   ├── restaurar_backup_local.sh   # Restaurar backup
│   │   └── restaurar_datos_local.js    # Insertar datos
│   ├── .env                    # Configuración Supabase
│   ├── .env_local              # Configuración PostgreSQL local
│   ├── .env_local.example      # Ejemplo de .env_local
│   ├── CONFIGURACION_DB_LOCAL.md  # Documentación completa
│   └── package.json            # Incluye dependencia 'pg'
├── backup_supabase/            # Backup de Supabase
│   ├── esquema.sql
│   ├── datos_completos.json
│   └── datos/
└── RESUMEN_DB_LOCAL.md         # Este archivo
```

## ✅ Verificación

### Verificar que PostgreSQL está corriendo

```bash
sudo systemctl status postgresql
```

### Verificar que la base de datos existe

```bash
psql -h localhost -U emop_user -d emop_db -c "\dt"
```

### Verificar que el backend funciona

```bash
curl http://localhost:3001/health
# Debería mostrar: "database": "PostgreSQL Local"
```

## 🎯 Ventajas

1. **Desarrollo Local**: Trabaja sin conexión a internet
2. **Más Rápido**: No hay latencia de red
3. **Gratis**: No usa recursos de Supabase para desarrollo
4. **Fácil de Cambiar**: Solo cambia la configuración, sin cambiar código
5. **Mismo Código**: El código funciona igual con ambas bases de datos

## 📝 Notas Importantes

- El backend **prioriza** `.env_local` sobre `.env`
- Si `.env_local` existe y tiene `DB_TYPE=postgres`, usará PostgreSQL local
- Si no existe `.env_local` o tiene `DB_TYPE=supabase`, usará Supabase
- El código del backend **no necesita cambios** para cambiar de base de datos
- Los helpers (`dbHelpers.js`) funcionan con ambos tipos automáticamente

## 🐛 Solución de Problemas

Ver la documentación completa en `emop_back/CONFIGURACION_DB_LOCAL.md` para solución de problemas detallada.

