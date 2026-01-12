# 🔧 Solución: Problemas de Permisos PostgreSQL

El error "relation does not exist" o "permission denied" indica que el usuario `emop_user` no tiene permisos completos sobre las tablas.

## ✅ Solución Rápida

Ejecuta este script (requiere sudo):

```bash
cd /home/cesar/emop-my-back/emop_back
./scripts/fix_permissions_and_schema.sh
```

## 🔧 Solución Manual

Ejecuta estos comandos uno por uno:

```bash
sudo -u postgres psql -d emop_db << 'EOF'
-- Otorgar todos los privilegios
GRANT ALL PRIVILEGES ON DATABASE emop_db TO emop_user;
ALTER DATABASE emop_db OWNER TO emop_user;

-- Permisos en el esquema
GRANT ALL ON SCHEMA public TO emop_user;
ALTER SCHEMA public OWNER TO emop_user;

-- Permisos en todas las tablas
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO emop_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO emop_user;

-- Cambiar owner de todas las tablas a emop_user
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'ALTER TABLE ' || quote_ident(r.tablename) || ' OWNER TO emop_user';
    END LOOP;
END $$;

-- Cambiar owner de todas las secuencias a emop_user
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public') LOOP
        EXECUTE 'ALTER SEQUENCE ' || quote_ident(r.sequence_name) || ' OWNER TO emop_user';
    END LOOP;
END $$;

-- Permisos por defecto para tablas futuras
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO emop_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO emop_user;
EOF
```

## ✅ Verificar que Funciona

```bash
# Verificar permisos
psql -h localhost -U emop_user -d emop_db -c "SELECT COUNT(*) FROM usuario;"
psql -h localhost -U emop_user -d emop_db -c "SELECT COUNT(*) FROM rol;"
psql -h localhost -U emop_user -d emop_db -c "SELECT COUNT(*) FROM empresa;"

# Verificar que el backend puede leer las tablas
curl http://localhost:3001/api/usuario
```

## 📝 Después de Corregir Permisos

1. Reinicia el backend (Ctrl+C y luego `npm run dev`)
2. Verifica que las queries funcionan:
   ```bash
   curl http://localhost:3001/api/usuario
   curl http://localhost:3001/api/rol
   ```

## 🐛 Si Aún Hay Problemas

1. Verifica que las tablas existen:
   ```bash
   psql -h localhost -U emop_user -d emop_db -c "\dt"
   ```

2. Verifica el owner de las tablas:
   ```bash
   psql -h localhost -U emop_user -d emop_db -c "SELECT tablename, tableowner FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;"
   ```

3. Todas las tablas deberían tener `tableowner = emop_user`

