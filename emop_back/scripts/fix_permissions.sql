-- Script SQL para corregir permisos en PostgreSQL
-- Ejecuta: sudo -u postgres psql -d emop_db -f fix_permissions.sql

-- Otorgar todos los privilegios al usuario emop_user
GRANT ALL PRIVILEGES ON DATABASE emop_db TO emop_user;
ALTER DATABASE emop_db OWNER TO emop_user;

-- Permisos en el esquema
GRANT ALL ON SCHEMA public TO emop_user;
ALTER SCHEMA public OWNER TO emop_user;

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

-- Otorgar permisos en todas las tablas existentes
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO emop_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO emop_user;

-- Configurar permisos por defecto para tablas futuras
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO emop_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO emop_user;

-- Verificar permisos
SELECT tablename, tableowner FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

