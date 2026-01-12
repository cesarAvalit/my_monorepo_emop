# 🔧 Actualizar Esquema en Supabase

He corregido el esquema SQL para que coincida con los datos reales de `db.json`. 

## ⚠️ IMPORTANTE: Necesitas actualizar las tablas en Supabase

Las tablas ya creadas tienen la estructura antigua. Necesitas:

### Opción 1: Eliminar y Recrear (Recomendado si no hay datos importantes)

1. Ve a Supabase Dashboard → SQL Editor
2. Ejecuta este script para eliminar las tablas problemáticas:

```sql
-- Eliminar tablas en orden inverso (respetando dependencias)
DROP TABLE IF EXISTS orden_x_usuario CASCADE;
DROP TABLE IF EXISTS auditoria CASCADE;
DROP TABLE IF EXISTS rto_registro CASCADE;
DROP TABLE IF EXISTS linea_servicio CASCADE;
DROP TABLE IF EXISTS detalle_insumo CASCADE;
DROP TABLE IF EXISTS orden_x_mecanico CASCADE;
DROP TABLE IF EXISTS orden_trabajo CASCADE;
DROP TABLE IF EXISTS mecanico CASCADE;
DROP TABLE IF EXISTS tipo_mantenimiento CASCADE;
DROP TABLE IF EXISTS usuario CASCADE;
```

3. Luego ejecuta el script SQL actualizado (`supabase_schema.sql`) completo

### Opción 2: Alterar las Tablas Existentes (Si quieres mantener los datos ya migrados)

Ejecuta estos comandos ALTER en Supabase SQL Editor:

```sql
-- Actualizar tipo_mantenimiento
ALTER TABLE tipo_mantenimiento RENAME COLUMN id_tipo_mantenimiento TO id_tipo;
ALTER TABLE tipo_mantenimiento DROP COLUMN IF EXISTS nombre;

-- Actualizar orden_trabajo (ajustar FK)
ALTER TABLE orden_trabajo DROP CONSTRAINT IF EXISTS orden_trabajo_id_tipo_mantenimiento_fkey;
ALTER TABLE orden_trabajo ADD CONSTRAINT orden_trabajo_id_tipo_mantenimiento_fkey 
  FOREIGN KEY (id_tipo_mantenimiento) REFERENCES tipo_mantenimiento(id_tipo);

-- Actualizar mecanico
ALTER TABLE mecanico ADD COLUMN IF NOT EXISTS dni VARCHAR(50);
ALTER TABLE mecanico ADD COLUMN IF NOT EXISTS telefono VARCHAR(50);
ALTER TABLE mecanico ALTER COLUMN apellido DROP NOT NULL;

-- Actualizar detalle_insumo
ALTER TABLE detalle_insumo ADD COLUMN IF NOT EXISTS id_detalle_insumo INTEGER;
ALTER TABLE detalle_insumo ADD COLUMN IF NOT EXISTS costo_unitario_historico DECIMAL(10, 2);
ALTER TABLE detalle_insumo ADD COLUMN IF NOT EXISTS costo_total DECIMAL(10, 2);
ALTER TABLE detalle_insumo DROP COLUMN IF EXISTS precio_unitario;

-- Actualizar linea_servicio (recrear completamente)
DROP TABLE IF EXISTS linea_servicio CASCADE;
CREATE TABLE linea_servicio (
    id_linea_servicio SERIAL PRIMARY KEY,
    id_orden INTEGER REFERENCES orden_trabajo(id_orden),
    id_tipo_mantenimiento INTEGER REFERENCES tipo_mantenimiento(id_tipo),
    definicion_trabajo VARCHAR(255),
    descripcion_detallada TEXT
);
CREATE INDEX IF NOT EXISTS idx_linea_servicio_id_orden ON linea_servicio(id_orden);
CREATE INDEX IF NOT EXISTS idx_linea_servicio_id_tipo_mantenimiento ON linea_servicio(id_tipo_mantenimiento);

-- Actualizar rto_registro
ALTER TABLE rto_registro ADD COLUMN IF NOT EXISTS aprobado BOOLEAN DEFAULT false;
ALTER TABLE rto_registro ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true;
```

---

## 🚀 Después de Actualizar

Una vez que hayas actualizado el esquema:

1. **Verifica las tablas**:
   ```bash
   npm run verify:supabase
   ```

2. **Migra los datos nuevamente**:
   ```bash
   npm run migrate:supabase
   ```

---

## 📝 Cambios Realizados en el Esquema

1. **tipo_mantenimiento**: 
   - Cambiado `id_tipo_mantenimiento` → `id_tipo`
   - Eliminado campo `nombre`

2. **mecanico**: 
   - Agregados campos `dni` y `telefono`
   - `apellido` ahora es opcional

3. **detalle_insumo**: 
   - Agregados `id_detalle_insumo`, `costo_unitario_historico`, `costo_total`
   - Eliminado `precio_unitario`

4. **linea_servicio**: 
   - Estructura completamente diferente
   - Ahora tiene `id_linea_servicio`, `id_orden`, `id_tipo_mantenimiento`, `definicion_trabajo`, `descripcion_detallada`

5. **rto_registro**: 
   - Agregados campos `aprobado` y `activo`

---

¿Prefieres la Opción 1 (más simple) o la Opción 2 (mantiene datos existentes)?
