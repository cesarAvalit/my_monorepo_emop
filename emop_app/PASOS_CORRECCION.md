# 🔧 Pasos para Corregir el Esquema

He identificado y corregido los problemas. Sigue estos pasos:

---

## 📋 Paso 1: Ejecutar Script de Actualización

1. Ve a **Supabase Dashboard** → **SQL Editor** → **New Query**

2. Abre el archivo **`actualizar_esquema.sql`** en tu editor

3. Copia **TODO** el contenido

4. Pégalo en el SQL Editor de Supabase

5. Click en **"Run"**

6. Verifica que no haya errores críticos (algunos warnings están bien)

---

## 📋 Paso 2: Verificar que las Tablas se Actualizaron

Ejecuta en tu terminal:

```bash
npm run verify:supabase
```

Deberías ver todas las tablas marcadas con ✅.

---

## 📋 Paso 3: Migrar los Datos Nuevamente

Ahora ejecuta la migración:

```bash
npm run migrate:supabase
```

Esta vez debería funcionar correctamente. El script mejorado también intentará insertar registros individualmente si hay errores en lotes.

---

## ⚠️ Si Hay Errores

Si aún hay errores después de ejecutar `actualizar_esquema.sql`:

### Opción A: Eliminar y Recrear (Más Simple)

1. Ve a Supabase Dashboard → SQL Editor
2. Ejecuta este script para eliminar las tablas problemáticas:

```sql
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

3. Luego ejecuta el script SQL completo actualizado (`supabase_schema.sql`)

4. Finalmente ejecuta la migración de datos

---

## ✅ Resumen de Cambios

He corregido:

1. ✅ **tipo_mantenimiento**: Cambiado `id_tipo_mantenimiento` → `id_tipo`
2. ✅ **mecanico**: Agregados campos `dni` y `telefono`
3. ✅ **detalle_insumo**: Agregados campos `costo_total` y `costo_unitario_historico`
4. ✅ **linea_servicio**: Estructura completamente actualizada
5. ✅ **rto_registro**: Agregados campos `aprobado` y `activo`
6. ✅ **Script de migración**: Mejorado para manejar errores mejor

---

## 🚀 Siguiente Paso

**Ejecuta el script `actualizar_esquema.sql` en Supabase** y luego vuelve a ejecutar la migración.

¿Listo para continuar? 🎯
