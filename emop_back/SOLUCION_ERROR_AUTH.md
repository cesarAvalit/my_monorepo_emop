# 🔧 Solución: Error de Autenticación PostgreSQL

Si encuentras el error:
```
psql: error: connection to server at "localhost" (127.0.0.1), port 5432 failed: 
FATAL: password authentication failed for user "emop_user"
```

## ✅ Solución Rápida

### Opción 1: Usar el Script de Corrección (Recomendado)

```bash
cd emop_back
./scripts/fix_postgres_auth.sh
```

Este script te guiará para:
1. Eliminar y recrear el usuario con la contraseña correcta
2. Configurar pg_hba.conf para permitir autenticación local

### Opción 2: Configurar pg_hba.conf Manualmente

1. **Encontrar el archivo pg_hba.conf**:
   ```bash
   find /etc/postgresql -name pg_hba.conf
   ```
   Generalmente está en: `/etc/postgresql/[versión]/main/pg_hba.conf`

2. **Hacer backup del archivo**:
   ```bash
   sudo cp /etc/postgresql/*/main/pg_hba.conf /etc/postgresql/*/main/pg_hba.conf.backup
   ```

3. **Editar el archivo**:
   ```bash
   sudo nano /etc/postgresql/*/main/pg_hba.conf
   ```

4. **Buscar la línea para localhost** y cambiarla de `md5` a `trust`:
   ```conf
   # Cambiar de:
   host    all             all             127.0.0.1/32            md5
   
   # A:
   host    all             all             127.0.0.1/32            trust
   
   # O agregar una línea específica para emop_user:
   host    all             emop_user       127.0.0.1/32            trust
   ```

5. **Reiniciar PostgreSQL**:
   ```bash
   sudo systemctl restart postgresql
   ```

### Opción 3: Eliminar y Recrear Usuario Manualmente

```bash
# Conectarse como postgres
sudo -u postgres psql

# Dentro de PostgreSQL:
DROP USER IF EXISTS emop_user CASCADE;
CREATE USER emop_user WITH PASSWORD 'emop_password' CREATEDB;

# Otorgar permisos
GRANT ALL PRIVILEGES ON DATABASE emop_db TO emop_user;
ALTER DATABASE emop_db OWNER TO emop_user;

# Salir
\q
```

## 🔍 Verificar que Funciona

```bash
# Intentar conectar con la contraseña
PGPASSWORD=emop_password psql -h localhost -U emop_user -d emop_db -c "SELECT 1"
```

Si funciona, deberías ver:
```
 ?column? 
----------
        1
(1 row)
```

## ⚠️ Notas Importantes

- **`trust`** permite conexión sin contraseña **solo para desarrollo local**
- **NO uses `trust` en producción**
- Si configuraste `trust`, el backend funcionará sin necesidad de contraseña en `.env_local`
- El script `crear_db_local.sh` ya configuró los permisos, así que aunque la autenticación por contraseña falle, los permisos están correctos

## 📝 Después de Corregir

Una vez corregido, continúa con:

```bash
cd emop_back
./scripts/restaurar_backup_local.sh
npm run dev
```

