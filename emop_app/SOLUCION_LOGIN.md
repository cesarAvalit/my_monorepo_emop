# 🔧 Solución al Error 500 en Login

El error 500 indica que el servidor json-server no está corriendo o hay un problema con el endpoint de login.

## ✅ Solución Rápida

### Opción 1: Iniciar el Servidor JSON-Server (Temporal)

El login aún usa el sistema antiguo (json-server). Para que funcione temporalmente:

1. **Abre una nueva terminal**
2. **Ejecuta el servidor**:
   ```bash
   npm run json-server
   ```
   
   O directamente:
   ```bash
   node server.cjs
   ```

3. **Deberías ver**:
   ```
   JSON Server is running on http://localhost:3000
   Login endpoint: POST http://localhost:3000/auth/login
   ```

4. **Mantén esta terminal abierta** mientras usas la aplicación

5. **Vuelve a intentar el login** en el navegador

---

### Opción 2: Migrar Login a Supabase (Recomendado)

Para una solución permanente, podemos migrar el login a usar Supabase. Esto requiere:

1. Actualizar `Login.jsx` para usar Supabase Auth
2. O crear un endpoint de login que consulte la tabla `users` en Supabase

---

## 🔍 Verificar el Problema

El error 500 puede deberse a:

1. **Servidor no está corriendo**: El json-server debe estar activo en el puerto 3000
2. **Problema con db.json**: El archivo puede tener un formato incorrecto
3. **Problema con el endpoint**: El middleware de login puede tener un error

---

## 🚀 Próximos Pasos

**Para ahora (solución rápida)**:
- Ejecuta `npm run json-server` en una terminal separada
- Mantén el servidor corriendo mientras usas la app

**Para después (solución permanente)**:
- Migrar el login a Supabase Auth
- O crear un endpoint de login que use Supabase

---

¿Quieres que migre el login a Supabase ahora o prefieres usar el servidor json-server temporalmente?
