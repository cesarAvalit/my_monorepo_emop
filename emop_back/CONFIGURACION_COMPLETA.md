# ✅ Configuración Completa - PostgreSQL Local con Usuario postgres

## 📋 Estado Actual

✅ **Base de datos configurada**: `emop_db`
✅ **Usuario**: `postgres` / Contraseña: `123456`
✅ **Backend conectado**: PostgreSQL Local
✅ **Datos restaurados**:
  - Usuario: 22 registros
  - Rol: 4 registros
  - Empresa: 19 registros
  - Vehículo: 27 registros
  - Conductor: 17 registros
  - Auditoría: 37 registros
  - Y más...

## 🚀 Pasos para Iniciar el Backend

### Paso 1: Iniciar el Backend

```bash
cd /home/cesar/emop-my-back/emop_back
npm run dev
```

### Paso 2: Verificar que Funciona

Deberías ver:
```
🔌 Conectando a PostgreSQL local...
✅ Conectado a PostgreSQL: localhost:5432/emop_db
🚀 Servidor EMOP Backend corriendo en http://localhost:3001
🗄️  Base de datos: PostgreSQL Local
```

### Paso 3: Probar el Backend

```bash
# Health check
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
curl http://localhost:3001/api/vehiculo
```

## 🔧 Configuración Actual

El archivo `.env_local` contiene:

```env
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=emop_db
DB_USER=postgres
DB_PASSWORD=123456
```

## 📊 Verificar Datos en PostgreSQL

```bash
# Conectarse a PostgreSQL
psql -h localhost -U postgres -d emop_db
# Contraseña: 123456

# Dentro de PostgreSQL:
SELECT COUNT(*) FROM usuario;
SELECT COUNT(*) FROM rol;
SELECT COUNT(*) FROM empresa;
SELECT COUNT(*) FROM vehiculo;
SELECT COUNT(*) FROM conductor;

# Ver todas las tablas
\dt

# Salir
\q
```

## ✅ Estado de las Tablas

| Tabla | Registros |
|-------|-----------|
| usuario | 22 ✅ |
| rol | 4 ✅ |
| empresa | 19 ✅ |
| vehiculo | 27 ✅ |
| conductor | 17 ✅ |
| auditoria | 37 ✅ |

## 🎯 Comandos Útiles

### Reiniciar Base de Datos (Si es Necesario)

```bash
cd /home/cesar/emop-my-back/emop_back

# 1. Configurar base de datos
./scripts/configurar_db_postgres.sh

# 2. Restaurar esquema
./scripts/restaurar_esquema_postgres.sh

# 3. Restaurar datos
./scripts/restaurar_datos_postgres.sh
```

### Ver Logs del Backend

```bash
cd /home/cesar/emop-my-back/emop_back
npm run dev
```

### Verificar Conexión Directa

```bash
PGPASSWORD=123456 psql -h localhost -U postgres -d emop_db -c "SELECT COUNT(*) FROM usuario;"
```

## 🔄 Cambiar Entre Supabase y PostgreSQL Local

### Usar PostgreSQL Local (Actual)

El archivo `.env_local` ya está configurado con:
```env
DB_TYPE=postgres
```

### Usar Supabase

Edita `.env_local` o crea un `.env` con:
```env
DB_TYPE=supabase
```

Luego reinicia el backend.

## ⚠️ Notas Importantes

1. **Contraseña**: La contraseña `123456` está en `.env_local` - solo para desarrollo local
2. **Usuario postgres**: Usamos el usuario `postgres` que tiene todos los privilegios
3. **Puerto Backend**: El backend corre en `http://localhost:3001`
4. **Puerto Frontend**: El frontend esperado está en `http://localhost:5173`

## 🐛 Solución de Problemas

### Error: "password authentication failed"

Verifica que la contraseña sea `123456`:
```bash
psql -h localhost -U postgres -d postgres
# Debe pedirte la contraseña: 123456
```

### Error: "database does not exist"

Ejecuta:
```bash
cd /home/cesar/emop-my-back/emop_back
./scripts/configurar_db_postgres.sh
```

### Error: "relation does not exist"

Ejecuta:
```bash
cd /home/cesar/emop-my-back/emop_back
./scripts/restaurar_esquema_postgres.sh
```

### Backend no inicia

Verifica que PostgreSQL esté corriendo:
```bash
pg_isready -h localhost -p 5432
```

Si no está corriendo:
```bash
sudo systemctl start postgresql
```

## ✅ Todo Listo!

El backend está completamente configurado y funcionando con PostgreSQL local. Puedes usar el backend normalmente como antes, pero ahora está usando tu base de datos PostgreSQL local en lugar de Supabase.

