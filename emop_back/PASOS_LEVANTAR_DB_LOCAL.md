# 🚀 Pasos para Levantar el Backend con Base de Datos PostgreSQL Local

## 📋 Paso a Paso

### Paso 1: Verificar que PostgreSQL está corriendo

```bash
# Verificar estado de PostgreSQL
sudo systemctl status postgresql

# Si no está corriendo, iniciarlo:
sudo systemctl start postgresql

# Verificar que está funcionando:
psql --version
```

**✅ Verificación**: Deberías ver información sobre PostgreSQL ejecutándose.

---

### Paso 2: Crear la Base de Datos Local

```bash
# Ir al directorio del backend
cd emop_back

# Dar permisos de ejecución al script (si no los tiene)
chmod +x scripts/crear_db_local.sh

# Ejecutar el script de creación
./scripts/crear_db_local.sh
```

**✅ Verificación**: Deberías ver:
- ✅ PostgreSQL está corriendo
- ✅ Usuario creado o ya existe
- ✅ Base de datos creada
- ✅ Credenciales guardadas en .env_local

**📝 Nota**: Este script crea automáticamente el archivo `.env_local` con las credenciales.

---

### Paso 3: Verificar que el Backup Existe

```bash
# Verificar que existe el directorio de backup
ls -la ../backup_supabase/

# Deberías ver:
# - esquema.sql
# - datos_completos.json
# - datos/ (directorio con archivos JSON)
```

**✅ Verificación**: Si no existe el backup, primero descárgalo:

```bash
cd emop_back
node descargar_db_supabase.js
```

---

### Paso 4: Restaurar el Backup en PostgreSQL Local

```bash
# Asegúrate de estar en el directorio del backend
cd emop_back

# Dar permisos de ejecución (si no los tiene)
chmod +x scripts/restaurar_backup_local.sh

# Ejecutar el script de restauración
./scripts/restaurar_backup_local.sh
```

**✅ Verificación**: Deberías ver:
- ✅ Conexión exitosa a PostgreSQL
- ✅ Esquema restaurado
- ✅ Datos restaurados (conteo de registros por tabla)
- ✅ Backup restaurado exitosamente

**⏱️ Tiempo estimado**: 30-60 segundos dependiendo de la cantidad de datos.

---

### Paso 5: Verificar que .env_local Existe

```bash
# Verificar que el archivo .env_local existe y tiene las credenciales correctas
cat .env_local
```

**✅ Debería mostrar**:

```env
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=emop_db
DB_USER=emop_user
DB_PASSWORD=emop_password
```

Si no existe, puedes crearlo manualmente:

```bash
cp .env_local.example .env_local
```

Y luego editar las credenciales si es necesario.

---

### Paso 6: Instalar Dependencias (si no lo has hecho)

```bash
# Asegúrate de estar en el directorio del backend
cd emop_back

# Instalar dependencias (especialmente pg para PostgreSQL)
npm install
```

**✅ Verificación**: Deberías ver:
```
added X packages
found 0 vulnerabilities
```

---

### Paso 7: Verificar Conexión a la Base de Datos (Opcional pero Recomendado)

```bash
# Intentar conectarse a PostgreSQL local
psql -h localhost -U emop_user -d emop_db

# Si te pide contraseña, ingresa: emop_password

# Una vez conectado, verificar tablas:
\dt

# Deberías ver todas las tablas del sistema EMOP

# Verificar que hay datos:
SELECT COUNT(*) FROM empresa;
SELECT COUNT(*) FROM usuario;
SELECT COUNT(*) FROM vehiculo;

# Salir de PostgreSQL:
\q
```

**✅ Verificación**: Deberías ver:
- Lista de tablas al ejecutar `\dt`
- Conteos de registros en las tablas

---

### Paso 8: Iniciar el Backend

```bash
# Asegúrate de estar en el directorio del backend
cd emop_back

# Iniciar el backend en modo desarrollo
npm run dev
```

**✅ Verificación**: Deberías ver en la consola:

```
🚀 Servidor EMOP Backend corriendo en http://localhost:3001
📡 Frontend esperado en: http://localhost:5173
🗄️  Base de datos: PostgreSQL Local
🔗 Health check: http://localhost:3001/health
```

**📝 Nota**: Si ves `🗄️  Base de datos: Supabase` en lugar de `PostgreSQL Local`, significa que el backend no está detectando `.env_local`. Verifica que el archivo existe y tiene `DB_TYPE=postgres`.

---

### Paso 9: Verificar que el Backend Funciona

En otra terminal o navegador, ejecuta:

```bash
# Verificar health check
curl http://localhost:3001/health

# O abre en el navegador:
# http://localhost:3001/health
```

**✅ Debería responder**:

```json
{
  "status": "ok",
  "message": "EMOP Backend API está funcionando",
  "database": "PostgreSQL Local",
  "timestamp": "2026-01-08T..."
}
```

---

### Paso 10: Probar un Endpoint (Opcional)

```bash
# Probar obtener empresas
curl http://localhost:3001/api/empresa

# Debería devolver un JSON con las empresas de la base de datos local
```

**✅ Verificación**: Deberías ver datos JSON con las empresas de tu base de datos local.

---

## 🎉 ¡Listo!

Si todos los pasos se completaron exitosamente, tu backend está corriendo con PostgreSQL local.

---

## 🐛 Solución de Problemas

### Problema: PostgreSQL no está corriendo

```bash
# Iniciar PostgreSQL
sudo systemctl start postgresql

# Habilitar para que inicie automáticamente
sudo systemctl enable postgresql
```

### Problema: Error de permisos al ejecutar scripts

```bash
# Dar permisos de ejecución
chmod +x scripts/*.sh
```

### Problema: Error "No se pudo conectar a la base de datos"

1. Verifica que PostgreSQL esté corriendo:
```bash
sudo systemctl status postgresql
```

2. Verifica las credenciales en `.env_local`:
```bash
cat .env_local
```

3. Verifica que la base de datos existe:
```bash
sudo -u postgres psql -c "\l" | grep emop_db
```

### Problema: El backend sigue usando Supabase

1. Verifica que existe `.env_local`:
```bash
ls -la .env_local
```

2. Verifica que tiene `DB_TYPE=postgres`:
```bash
grep DB_TYPE .env_local
```

3. Si no existe o está mal configurado, créalo o corrígelo:
```bash
cp .env_local.example .env_local
# Editar .env_local y asegurarse de que DB_TYPE=postgres
```

### Problema: Error "Module not found: pg"

```bash
# Reinstalar dependencias
cd emop_back
rm -rf node_modules package-lock.json
npm install
```

### Problema: Error al restaurar datos

1. Verifica que el backup existe:
```bash
ls -la ../backup_supabase/datos_completos.json
```

2. Si no existe, descárgalo primero:
```bash
cd emop_back
node descargar_db_supabase.js
```

3. Luego vuelve a ejecutar el script de restauración.

---

## 📝 Notas Importantes

1. **El archivo `.env_local` tiene prioridad sobre `.env`**: Si existe `.env_local` con `DB_TYPE=postgres`, el backend usará PostgreSQL local, incluso si `.env` tiene configuración de Supabase.

2. **Para cambiar a Supabase**: Simplemente elimina `.env_local` o cambia `DB_TYPE=supabase` y reinicia el backend.

3. **Para cambiar a PostgreSQL Local**: Asegúrate de que existe `.env_local` con `DB_TYPE=postgres` y reinicia el backend.

4. **Datos locales vs Supabase**: Los datos en PostgreSQL local son independientes de Supabase. Los cambios en uno no afectan al otro.

---

## 🔄 Comandos Rápidos de Referencia

```bash
# Crear DB local
cd emop_back && ./scripts/crear_db_local.sh

# Restaurar backup
cd emop_back && ./scripts/restaurar_backup_local.sh

# Iniciar backend
cd emop_back && npm run dev

# Verificar conexión
psql -h localhost -U emop_user -d emop_db

# Verificar health check
curl http://localhost:3001/health
```

