# 🔧 Solución a los Errores de Duplicados

Los errores "duplicate key value" indican que los datos ya existen en Supabase de la migración anterior.

## ✅ Solución: Limpiar Datos y Re-migrar

### Paso 1: Limpiar los Datos Existentes

1. Ve a **Supabase Dashboard** → **SQL Editor** → **New Query**

2. Abre el archivo **`limpiar_datos.sql`** (acabo de crearlo)

3. Copia **TODO** el contenido

4. Pégalo en el SQL Editor de Supabase

5. Click en **"Run"**

Este script:
- ✅ Elimina todos los datos existentes
- ✅ Reinicia las secuencias de IDs (para que empiecen desde 1)

---

### Paso 2: Migrar los Datos Nuevamente

Ahora ejecuta la migración (he actualizado el script para usar UPSERT):

```bash
npm run migrate:supabase
```

Esta vez debería funcionar correctamente porque:
- ✅ Los datos están limpios
- ✅ El script usa UPSERT (inserta o actualiza si existe)
- ✅ Se corrigió el problema de la columna 'id' en usuario

---

## 📋 Resumen de Cambios

1. ✅ **Creado `limpiar_datos.sql`**: Script para limpiar todos los datos
2. ✅ **Actualizado `migrate_to_supabase.js`**: 
   - Usa UPSERT en lugar de INSERT
   - Maneja correctamente las claves primarias de cada tabla
   - Remueve el campo 'id' problemático en usuario

---

## 🚀 Ejecuta Ahora

1. **Ejecuta `limpiar_datos.sql` en Supabase**
2. **Luego ejecuta**: `npm run migrate:supabase`

¡Debería funcionar perfectamente esta vez! 🎯
