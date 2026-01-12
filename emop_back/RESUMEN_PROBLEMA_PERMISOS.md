# 🔧 Resumen del Problema y Solución

## ❌ Problema Actual

El backend se conecta correctamente a PostgreSQL pero falla al hacer queries porque:

1. ✅ La conexión funciona (sin contraseña, trust)
2. ✅ Las tablas existen (usuario, rol, empresa, etc.)
3. ❌ El usuario `emop_user` no tiene permisos completos sobre todas las tablas
4. ❌ Algunas tablas tienen owner = `postgres` en lugar de `emop_user`

Error que ves:
```
error: relation "usuario" does not exist
```
O:
```
ERROR: permission denied for table empresa
```

## ✅ Solución (Ejecuta en tu Terminal)

**Opción 1: Script SQL (Más simple)**

```bash
cd /home/cesar/emop-my-back/emop_back
sudo -u postgres psql -d emop_db -f scripts/fix_permissions.sql
```

**Opción 2: Comandos directos**

```bash
sudo -u postgres psql -d emop_db << 'EOF'
GRANT ALL PRIVILEGES ON DATABASE emop_db TO emop_user;
ALTER DATABASE emop_db OWNER TO emop_user;
GRANT ALL ON SCHEMA public TO emop_user;
ALTER SCHEMA public OWNER TO emop_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO emop_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO emop_user;
DO $$ DECLARE r RECORD; BEGIN FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP EXECUTE 'ALTER TABLE ' || quote_ident(r.tablename) || ' OWNER TO emop_user'; END LOOP; END $$;
DO $$ DECLARE r RECORD; BEGIN FOR r IN (SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public') LOOP EXECUTE 'ALTER SEQUENCE ' || quote_ident(r.sequence_name) || ' OWNER TO emop_user'; END LOOP; END $$;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO emop_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO emop_user;
EOF
```

**Opción 3: Script Bash**

```bash
cd /home/cesar/emop-my-back/emop_back
./scripts/fix_permissions_and_schema.sh
```

## ✅ Después de Ejecutar

1. **Verificar permisos**:
   ```bash
   psql -h localhost -U emop_user -d emop_db -c "SELECT COUNT(*) FROM usuario;"
   psql -h localhost -U emop_user -d emop_db -c "SELECT COUNT(*) FROM rol;"
   ```

2. **Reiniciar el backend** (si está corriendo):
   ```bash
   # Ctrl+C en la terminal donde corre el backend
   cd /home/cesar/emop-my-back/emop_back
   npm run dev
   ```

3. **Verificar que funciona**:
   ```bash
   curl http://localhost:3001/api/usuario
   curl http://localhost:3001/api/rol
   ```

## ✅ Resultado Esperado

Después de ejecutar el script, deberías ver:

- ✅ Sin errores "permission denied"
- ✅ Sin errores "relation does not exist"
- ✅ Queries funcionando correctamente
- ✅ Datos devueltos en las respuestas del API

## 📝 Estado Actual

- ✅ Backend configurado para PostgreSQL local
- ✅ Conexión funciona (trust, sin contraseña)
- ✅ Tablas creadas (usuario, rol, empresa, etc.)
- ✅ Datos parcialmente restaurados (65 registros insertados)
- ❌ Permisos incompletos (necesita ejecutar script de permisos)

## 🎯 Siguiente Paso

Ejecuta el script de permisos y reinicia el backend. Todo debería funcionar correctamente.

