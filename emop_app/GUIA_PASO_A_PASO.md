# 🚀 Guía Paso a Paso: Crear Tablas en Supabase

Sigue estos pasos en orden para crear todas las tablas en Supabase.

---

## 📋 Paso 1: Abrir Supabase Dashboard

1. Ve a: [https://app.supabase.com](https://app.supabase.com)
2. Inicia sesión con tu cuenta
3. Selecciona tu proyecto: **weberwavolitwvmjfhap**

---

## 📋 Paso 2: Abrir el SQL Editor

1. En el menú lateral izquierdo, busca **"SQL Editor"**
2. Click en **"SQL Editor"**
3. Click en el botón **"New Query"** (arriba a la izquierda)

Deberías ver un editor de texto vacío.

---

## 📋 Paso 3: Copiar el Script SQL

1. En tu editor de código (Cursor/VS Code), abre el archivo: **`supabase_schema.sql`**
2. Selecciona **TODO** el contenido:
   - Presiona `Ctrl+A` (Windows/Linux) o `Cmd+A` (Mac)
3. Copia el contenido:
   - Presiona `Ctrl+C` (Windows/Linux) o `Cmd+C` (Mac)

---

## 📋 Paso 4: Pegar en Supabase

1. Vuelve a la ventana del navegador con Supabase
2. Click dentro del editor SQL (el área de texto vacía)
3. Pega el contenido:
   - Presiona `Ctrl+V` (Windows/Linux) o `Cmd+V` (Mac)

Deberías ver todo el script SQL pegado en el editor.

---

## 📋 Paso 5: Ejecutar el Script

1. Verifica que todo el script esté pegado (debería tener muchas líneas)
2. Click en el botón **"Run"** (arriba a la derecha del editor)
   - O presiona `Ctrl+Enter` (Windows/Linux) o `Cmd+Enter` (Mac)

---

## 📋 Paso 6: Verificar Resultado

### ✅ Si todo salió bien:

Deberías ver:
- Un mensaje verde que dice algo como "Success" o "Query executed successfully"
- En la parte inferior, debería mostrar algo como "0 rows returned" o similar
- **NO debería haber errores en rojo**

### ❌ Si hay errores:

Si ves mensajes en rojo:
- **"relation already exists"**: No es un problema, significa que algunas tablas ya existían
- **Otros errores**: Copia el mensaje de error completo y compártelo

---

## 📋 Paso 7: Verificar que las Tablas se Crearon

1. En el menú lateral izquierdo, busca **"Table Editor"**
2. Click en **"Table Editor"**
3. Deberías ver una lista de tablas en el menú desplegable arriba

Verifica que veas estas tablas (algunas de las principales):
- ✅ `empresa`
- ✅ `vehiculo`
- ✅ `usuario`
- ✅ `rol`
- ✅ `conductor`
- ✅ `orden_trabajo`
- ✅ `mecanico`
- ✅ `orden_x_usuario`
- etc.

---

## 📋 Paso 8: Verificar con el Script

Ahora vamos a verificar que todo esté correcto usando el script:

1. Abre tu terminal en la carpeta del proyecto
2. Ejecuta:

```bash
npm run verify:supabase
```

Deberías ver algo como:

```
🔍 Verificando tablas en Supabase...

📡 Conectando a: https://weberwavolitwvmjfhap.supabase.co

✅ empresa: Existe
✅ rol: Existe
✅ usuario: Existe
✅ conductor: Existe
✅ vehiculo: Existe
... (todas las tablas)

============================================================
📊 RESUMEN DE VERIFICACIÓN
============================================================
✅ Tablas existentes: 15/15
❌ Tablas faltantes: 0
⚠️  Errores: 0

🎉 ¡Todas las tablas existen! Puedes proceder con la migración de datos.
   Ejecuta: npm run migrate:supabase
```

---

## 📋 Paso 9: Migrar los Datos

Si todas las tablas están verificadas, ahora migra los datos:

```bash
npm run migrate:supabase
```

Este proceso tomará unos minutos. Verás el progreso en la terminal.

---

## 🎯 Resumen Visual

```
1. Abrir Supabase Dashboard
   ↓
2. SQL Editor → New Query
   ↓
3. Copiar contenido de supabase_schema.sql
   ↓
4. Pegar en el editor SQL
   ↓
5. Click en "Run"
   ↓
6. Verificar que no haya errores
   ↓
7. Verificar en Table Editor
   ↓
8. Ejecutar: npm run verify:supabase
   ↓
9. Si todo está bien: npm run migrate:supabase
```

---

## ⚠️ Si Algo Sale Mal

### Error: "relation already exists"
- **No es un problema**: Significa que algunas tablas ya existían
- **Solución**: Continúa con el siguiente paso

### Error: "permission denied"
- **Causa**: No tienes permisos
- **Solución**: Verifica que estés en el proyecto correcto

### Error: "syntax error"
- **Causa**: El SQL tiene un error
- **Solución**: Comparte el error específico y lo corregimos

### Las tablas no aparecen en Table Editor
- **Solución**: 
  1. Refresca la página (F5)
  2. O ve a Settings → API → Reload schema cache
  3. Espera 1-2 minutos

---

## ✅ Checklist Final

Antes de continuar, verifica:

- [ ] Ejecuté el script SQL en Supabase
- [ ] No vi errores críticos (solo "already exists" está bien)
- [ ] Veo las tablas en Table Editor
- [ ] Ejecuté `npm run verify:supabase` y todas las tablas aparecen como ✅
- [ ] Estoy listo para migrar los datos

---

## 🆘 ¿Necesitas Ayuda?

Si en cualquier paso encuentras un problema:

1. **Copia el mensaje de error completo**
2. **Dime en qué paso estás**
3. **Comparte una captura de pantalla si es posible**

¡Vamos paso a paso! 🚀
