# 🔒 Habilitar Row Level Security (RLS) en Supabase

Este documento explica cómo habilitar RLS en Supabase para permitir operaciones CRUD en el sistema EMOP.

## 📋 Pasos para Habilitar RLS

### Paso 1: Acceder a Supabase SQL Editor

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Navega a **SQL Editor** en el menú lateral
3. Haz clic en **New Query**

### Paso 2: Ejecutar el Script

Copia y pega el contenido completo del archivo `supabase_rls_policies_dev.sql` en el editor SQL y ejecútalo.

**O ejecuta este script simplificado:**

```sql
-- Habilitar RLS en todas las tablas
ALTER TABLE empresa ENABLE ROW LEVEL SECURITY;
ALTER TABLE rol ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuario ENABLE ROW LEVEL SECURITY;
ALTER TABLE conductor ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehiculo ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipo_mantenimiento ENABLE ROW LEVEL SECURITY;
ALTER TABLE orden_trabajo ENABLE ROW LEVEL SECURITY;
ALTER TABLE mecanico ENABLE ROW LEVEL SECURITY;
ALTER TABLE orden_x_mecanico ENABLE ROW LEVEL SECURITY;
ALTER TABLE insumo_catalogo ENABLE ROW LEVEL SECURITY;
ALTER TABLE detalle_insumo ENABLE ROW LEVEL SECURITY;
ALTER TABLE linea_servicio ENABLE ROW LEVEL SECURITY;
ALTER TABLE rto_registro ENABLE ROW LEVEL SECURITY;
ALTER TABLE orden_x_usuario ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditoria ENABLE ROW LEVEL SECURITY;

-- Crear políticas permisivas para desarrollo (permiten todo)
CREATE POLICY "empresa_all_access" ON empresa FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "rol_all_access" ON rol FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "usuario_all_access" ON usuario FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "conductor_all_access" ON conductor FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "vehiculo_all_access" ON vehiculo FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "tipo_mantenimiento_all_access" ON tipo_mantenimiento FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "orden_trabajo_all_access" ON orden_trabajo FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "mecanico_all_access" ON mecanico FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "orden_x_mecanico_all_access" ON orden_x_mecanico FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "insumo_catalogo_all_access" ON insumo_catalogo FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "detalle_insumo_all_access" ON detalle_insumo FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "linea_servicio_all_access" ON linea_servicio FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "rto_registro_all_access" ON rto_registro FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "orden_x_usuario_all_access" ON orden_x_usuario FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "auditoria_all_access" ON auditoria FOR ALL USING (true) WITH CHECK (true);
```

### Paso 3: Verificar que RLS está Habilitado

Ejecuta esta consulta para verificar:

```sql
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'empresa', 'rol', 'usuario', 'conductor', 'vehiculo',
    'tipo_mantenimiento', 'orden_trabajo', 'mecanico',
    'orden_x_mecanico', 'insumo_catalogo', 'detalle_insumo',
    'linea_servicio', 'rto_registro', 'orden_x_usuario', 'auditoria'
  )
ORDER BY tablename;
```

Todas las tablas deben mostrar `rls_enabled = true`.

### Paso 4: Verificar Políticas Creadas

```sql
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

Debes ver una política `*_all_access` para cada tabla.

## ✅ Probar el CRUD de Conductor

Una vez habilitado RLS, puedes probar el formulario de nuevo conductor:

1. Ve a la sección **Personal** en la aplicación
2. Haz clic en el botón para crear un nuevo conductor
3. Completa el formulario con los datos:
   - Nombre: (requerido)
   - Apellido: (requerido)
   - DNI: (requerido)
   - Número de Licencia: (requerido)
   - Fecha Vencimiento Licencia: (requerido)
   - Teléfono: (requerido)
4. Haz clic en **Guardar**

El conductor debería crearse exitosamente en Supabase.

## 🔧 Solución de Problemas

### Error: "new row violates row-level security policy"

Si recibes este error, significa que RLS está habilitado pero las políticas no permiten la operación. Verifica:

1. Que las políticas `*_all_access` estén creadas
2. Que estés usando la anon key correcta en el cliente de Supabase
3. Ejecuta el script de políticas nuevamente

### Deshabilitar RLS Temporalmente

Si necesitas deshabilitar RLS en una tabla específica para debugging:

```sql
ALTER TABLE conductor DISABLE ROW LEVEL SECURITY;
```

**⚠️ ADVERTENCIA**: Solo haz esto en desarrollo, nunca en producción.

### Eliminar Todas las Políticas

Si necesitas empezar de cero:

```sql
-- Eliminar políticas de conductor
DROP POLICY IF EXISTS "conductor_all_access" ON conductor;

-- Repetir para todas las tablas...
```

## 📝 Notas Importantes

1. **Modo Desarrollo**: Las políticas actuales permiten **TODAS** las operaciones CRUD para cualquier usuario. Esto es adecuado para desarrollo pero **NO para producción**.

2. **Producción**: En producción, deberás crear políticas más restrictivas que:
   - Limiten el acceso según el rol del usuario
   - Filtren por empresa para usuarios Empresa
   - Respeten las relaciones entre entidades

3. **Autenticación**: El sistema actual usa autenticación personalizada (no Supabase Auth), por lo que las políticas usan `true` para permitir todo. Si migras a Supabase Auth, podrás usar `auth.uid()` y `auth.jwt()` en las políticas.

## 🚀 Próximos Pasos

Una vez que RLS esté habilitado y funcionando:

1. Prueba crear un nuevo conductor
2. Prueba editar un conductor existente
3. Prueba eliminar un conductor
4. Verifica que los datos se guarden correctamente en Supabase

Si todo funciona correctamente, puedes proceder a refinar las políticas para producción.

