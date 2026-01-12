# Solución al Error: "Could not find the table 'public.empresa'"

## 🔍 Diagnóstico

El error `PGRST205: Could not find the table 'public.empresa' in the schema cache` indica que:

**Las tablas NO se han creado aún en Supabase.**

---

## ✅ Solución Paso a Paso

### Paso 1: Verificar si las tablas existen

Ejecuta el script de verificación:

```bash
npm run verify:supabase
```

O directamente:

```bash
node verificar_tablas.js
```

Este script te dirá exactamente qué tablas faltan.

---

### Paso 2: Crear las Tablas en Supabase

Si las tablas no existen, necesitas ejecutar el script SQL:

1. **Ve a Supabase Dashboard**:
   - Abre [https://app.supabase.com](https://app.supabase.com)
   - Selecciona tu proyecto: `weberwavolitwvmjfhap`

2. **Abre el SQL Editor**:
   - En el menú lateral, click en **"SQL Editor"**
   - Click en **"New Query"**

3. **Copia el script SQL**:
   - Abre el archivo `supabase_schema.sql` en tu editor
   - Selecciona **TODO** el contenido (Ctrl+A / Cmd+A)
   - Copia (Ctrl+C / Cmd+C)

4. **Pega y ejecuta**:
   - Pega el contenido en el SQL Editor de Supabase
   - Click en el botón **"Run"** (o presiona `Ctrl+Enter` / `Cmd+Enter`)
   - Espera a que termine (debería tomar 5-10 segundos)

5. **Verifica que no haya errores**:
   - Si hay errores, aparecerán en rojo
   - Si todo está bien, verás un mensaje de éxito

---

### Paso 3: Refrescar el Schema Cache (si es necesario)

A veces Supabase necesita refrescar su cache. Para hacerlo:

1. Ve a **Settings** → **API**
2. Scroll hasta abajo
3. Click en **"Reload schema cache"** o **"Refresh"**

O simplemente espera 1-2 minutos y vuelve a intentar.

---

### Paso 4: Verificar nuevamente

Ejecuta el script de verificación otra vez:

```bash
npm run verify:supabase
```

Deberías ver todas las tablas marcadas con ✅.

---

### Paso 5: Ejecutar la migración

Una vez que todas las tablas existan, ejecuta la migración:

```bash
npm run migrate:supabase
```

---

## 🔧 Solución Rápida (Todo en uno)

Si quieres hacerlo todo de una vez:

```bash
# 1. Verificar tablas
npm run verify:supabase

# 2. Si faltan tablas, ejecuta el SQL en Supabase Dashboard
# (Sigue los pasos del Paso 2 arriba)

# 3. Verificar nuevamente
npm run verify:supabase

# 4. Si todo está bien, migrar datos
npm run migrate:supabase
```

---

## ⚠️ Errores Comunes

### Error: "relation already exists"
- **Causa**: Las tablas ya existen
- **Solución**: No es un problema, puedes continuar con la migración

### Error: "permission denied"
- **Causa**: No tienes permisos para crear tablas
- **Solución**: Verifica que estés usando la cuenta correcta de Supabase

### Error: "syntax error"
- **Causa**: El SQL tiene un error
- **Solución**: Revisa el archivo `supabase_schema.sql` o compárteme el error específico

### Error: "schema cache" persiste
- **Causa**: El cache de Supabase no se ha actualizado
- **Solución**: 
  1. Espera 1-2 minutos
  2. O ve a Settings → API → Reload schema cache
  3. O reinicia el proyecto en Supabase Dashboard

---

## 📋 Checklist

- [ ] Ejecuté `npm run verify:supabase`
- [ ] Identifiqué las tablas faltantes
- [ ] Ejecuté el script SQL en Supabase Dashboard
- [ ] Verifiqué que no hubo errores en el SQL
- [ ] Ejecuté `npm run verify:supabase` nuevamente
- [ ] Todas las tablas aparecen como ✅
- [ ] Ejecuté `npm run migrate:supabase`

---

## 🆘 Si el problema persiste

1. **Verifica las credenciales** en `.env`:
   ```env
   VITE_SUPABASE_URL=https://weberwavolitwvmjfhap.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=sb_secret_LDZn81mde7XPA-qb-AMhVQ_bQ2DBa98
   ```

2. **Verifica que el proyecto esté activo**:
   - Ve a Supabase Dashboard
   - Verifica que el proyecto no esté pausado

3. **Revisa los logs**:
   - En Supabase Dashboard → Logs
   - Busca errores relacionados con las tablas

4. **Comparte el error completo**:
   - Copia el mensaje de error completo
   - Incluye qué comando ejecutaste
   - Incluye qué tablas faltan (si el script de verificación lo muestra)

---

## ✅ Estado Esperado

Después de seguir estos pasos, deberías poder:

1. ✅ Ver todas las tablas en Supabase Dashboard → Table Editor
2. ✅ Ejecutar `npm run verify:supabase` sin errores
3. ✅ Ejecutar `npm run migrate:supabase` exitosamente
4. ✅ Ver tus datos en Supabase Table Editor

---

¡Buena suerte! Si necesitas ayuda con algún paso específico, avísame. 🚀
