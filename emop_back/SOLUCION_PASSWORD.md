# 🔧 Solución Rápida: Error de Contraseña PostgreSQL

Si obtienes el error:
```
FATAL: password authentication failed for user "emop_user"
```

## ✅ Solución Paso a Paso

### Paso 1: Actualizar la Contraseña del Usuario

Ejecuta estos comandos en tu terminal:

```bash
sudo -u postgres psql
```

Dentro de PostgreSQL, ejecuta:

```sql
-- Actualizar contraseña
ALTER USER emop_user WITH PASSWORD 'emop_password';

-- Otorgar privilegios necesarios
ALTER USER emop_user WITH CREATEDB;

-- Verificar que se actualizó
\du emop_user

-- Salir
\q
```

### Paso 2: Verificar que Funciona

```bash
PGPASSWORD=emop_password psql -h localhost -U emop_user -d postgres -c "SELECT 1"
```

**Si funciona**: Deberías ver `?column?` con el valor `1`

**Si NO funciona**: Continúa con el Paso 3

### Paso 3: Configurar pg_hba.conf (Solo si el Paso 2 falló)

Esta configuración permite conexión sin contraseña **solo para desarrollo local**.

1. **Encontrar el archivo pg_hba.conf**:
   ```bash
   find /etc/postgresql -name pg_hba.conf
   ```
   Generalmente está en: `/etc/postgresql/[versión]/main/pg_hba.conf`

2. **Hacer backup**:
   ```bash
   sudo cp /etc/postgresql/*/main/pg_hba.conf /etc/postgresql/*/main/pg_hba.conf.backup
   ```

3. **Editar el archivo**:
   ```bash
   sudo nano /etc/postgresql/*/main/pg_hba.conf
   ```

4. **Buscar la sección "IPv4 local connections"** y agregar esta línea **antes** de la línea que dice `host    all             all             127.0.0.1/32            md5`:

   ```conf
   # IPv4 local connections:
   host    all             emop_user       127.0.0.1/32            trust
   host    all             all             127.0.0.1/32            md5
   ```

   **O** cambiar `md5` a `trust` solo para esa línea:
   ```conf
   host    all             all             127.0.0.1/32            trust
   ```

5. **Guardar y salir** (Ctrl+X, luego Y, luego Enter)

6. **Reiniciar PostgreSQL**:
   ```bash
   sudo systemctl restart postgresql
   ```

7. **Verificar nuevamente**:
   ```bash
   # Ahora debería funcionar sin contraseña
   psql -h localhost -U emop_user -d postgres -c "SELECT 1"
   ```

### Paso 4: Continuar con el Proceso

Una vez que la conexión funciona:

```bash
cd emop_back
./scripts/restaurar_backup_local.sh
npm run dev
```

## 🔍 Verificación Completa

Después de corregir, verifica que todo funciona:

```bash
# 1. Verificar conexión
psql -h localhost -U emop_user -d emop_db -c "SELECT 1"

# 2. Verificar tablas (después de restaurar backup)
psql -h localhost -U emop_user -d emop_db -c "\dt"

# 3. Verificar datos
psql -h localhost -U emop_user -d emop_db -c "SELECT COUNT(*) FROM empresa;"
```

## ⚠️ Notas Importantes

- **`trust`** permite conexión sin contraseña **solo para desarrollo local**
- **NO uses `trust` en producción** - es inseguro
- Si configuraste `trust`, puedes omitir `PGPASSWORD` en los comandos
- El backend funcionará igual con o sin contraseña si configuraste `trust`

## 🐛 Si Aún No Funciona

1. **Verificar que el usuario existe**:
   ```bash
   sudo -u postgres psql -c "\du emop_user"
   ```

2. **Verificar que la base de datos existe**:
   ```bash
   sudo -u postgres psql -c "\l" | grep emop_db
   ```

3. **Recrear usuario completamente**:
   ```bash
   sudo -u postgres psql <<EOF
   DROP USER IF EXISTS emop_user CASCADE;
   CREATE USER emop_user WITH PASSWORD 'emop_password' CREATEDB;
   GRANT ALL PRIVILEGES ON DATABASE emop_db TO emop_user;
   ALTER DATABASE emop_db OWNER TO emop_user;
   EOF
   ```

4. **Verificar configuración de PostgreSQL**:
   ```bash
   sudo systemctl status postgresql
   sudo journalctl -u postgresql -n 50
   ```

## 💡 Alternativa: Usar el Script de Corrección

También puedes usar el script de corrección (requiere ejecutarlo manualmente):

```bash
cd emop_back
./scripts/fix_password.sh
```

Este script hace automáticamente los pasos 1 y 3.

