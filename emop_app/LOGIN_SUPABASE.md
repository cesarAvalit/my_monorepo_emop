# ✅ Login Migrado a Supabase

He actualizado el login para que funcione con Supabase. Ahora el sistema:

1. **Primero intenta usar Supabase** (tabla `users`)
2. **Si falla, intenta con json-server** (fallback para compatibilidad)

---

## 🔑 Credenciales para Probar

Según tu `db.json`, las credenciales son:

- **Usuario**: `emop_admin@mendoza.ar`
- **Contraseña**: `Admin1234`

---

## ✅ Cambios Realizados

1. **Actualizado `Login.jsx`**:
   - Agregado import de `getAllFromTable` de Supabase
   - Modificado `handleSubmit` para intentar primero con Supabase
   - Mantiene fallback a json-server si Supabase falla
   - Mejorado manejo de errores

2. **Usuario por defecto actualizado**:
   - Cambiado de `cupellof@emop.com.ar` a `emop_admin@mendoza.ar`

---

## 🚀 Prueba Ahora

1. **Recarga la página de login** (F5)
2. **Ingresa las credenciales**:
   - Usuario: `emop_admin@mendoza.ar`
   - Contraseña: `Admin1234`
3. **Click en "Iniciar sesión"**

Debería funcionar ahora usando Supabase directamente, sin necesidad de json-server.

---

## ⚠️ Si Aún No Funciona

Si aún hay problemas:

1. **Verifica que las credenciales de Supabase estén en `.env`**:
   ```env
   VITE_SUPABASE_URL=https://weberwavolitwvmjfhap.supabase.co
   VITE_SUPABASE_ANON_KEY=sb_publishable_0tzTI6KROnJ-_B2Sylij4Q_FAB4JfOS
   ```

2. **Verifica que la tabla `users` tenga datos en Supabase**:
   - Ve a Supabase Dashboard → Table Editor → `users`
   - Debería tener al menos 1 registro

3. **Revisa la consola del navegador** para ver errores específicos

---

¡Prueba ahora y avísame si funciona! 🎯
