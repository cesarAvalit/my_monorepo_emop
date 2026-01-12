# Credenciales Supabase - Información Recibida

## ✅ Información que ya tengo:

- **Project URL**: `https://weberwavolitwvmjfhap.supabase.co`
- **PostgreSQL Connection String**: `postgres://postgres:[YOUR-PASSWORD]@db.weberwavolitwvmjfhap.supabase.co:5432/postgres`
- **Publishable Key**: `sb_publishable_0tzTI6KROnJ-_B2Sylij4Q_FAB4JfOS`

---

## ❌ Información que aún necesito:

### 1. **Anon Key (Public Key)** - CRÍTICA

La key que me diste (`sb_publishable_0tzTI6KROnJ-_B2Sylij4Q_FAB4JfOS`) parece ser una "publishable key" que puede ser diferente de la "anon key" estándar.

**¿Dónde encontrarla?**
1. Ve a: **Supabase Dashboard** → **Settings** → **API**
2. Busca la sección **"Project API keys"**
3. Deberías ver dos keys:
   - **`anon` `public`** ← Esta es la que necesito
   - **`service_role` `secret`** ← Esta también la necesito

**Formato esperado**: 
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlYmVyd2F2b2xpdHd2bWpmaGFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDE2NzI4MDAsImV4cCI6MjAxNzI0ODgwMH0.xxxxxxxxxxxxx
```

**Nota**: Si la "publishable key" que me diste es la que aparece como `anon public`, entonces está bien. Pero necesito confirmar que es la correcta.

---

### 2. **Service Role Key (Secret Key)** - CRÍTICA

Esta es la más importante para la migración de datos.

**¿Dónde encontrarla?**
1. Ve a: **Supabase Dashboard** → **Settings** → **API**
2. En la sección **"Project API keys"**
3. Busca: **`service_role` `secret`** ← Esta es la que necesito

**Formato esperado**:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlYmVyd2F2b2xpdHd2bWpmaGFwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwMTY3MjgwMCwiZXhwIjoyMDE3MjQ4ODAwfQ.xxxxxxxxxxxxx
```

⚠️ **IMPORTANTE**: Esta key es muy sensible. Solo la usaré para la migración inicial. Después puedes rotarla si quieres.

---

### 3. **Password de PostgreSQL** (Opcional pero útil)

Si tienes la contraseña de la base de datos PostgreSQL, puedo usarla para crear las tablas directamente desde SQL.

**¿Dónde encontrarla?**
- Es la contraseña que configuraste cuando creaste el proyecto
- O puedes resetearla en: **Settings** → **Database** → **Database password**

---

### 4. **Preferencias de Configuración**

Por favor, confirma tus preferencias:

**Row Level Security (RLS)**:
- [ ] Deshabilitar RLS (más fácil para empezar) ← **Recomendado**
- [ ] Habilitar RLS con políticas permisivas

**Sistema de Autenticación**:
- [ ] Usar Supabase Auth (recomendado) ← **Recomendado**
- [ ] Mantener sistema actual con tabla `users`

---

## 📋 Resumen de lo que necesito:

1. ✅ Project URL: `https://weberwavolitwvmjfhap.supabase.co`
2. ❓ **Anon Key (public)**: `eyJhbGci...` o confirma si `sb_publishable_0tzTI6KROnJ-_B2Sylij4Q_FAB4JfOS` es la correcta
3. ❓ **Service Role Key (secret)**: `eyJhbGci...` ← **CRÍTICA**
4. ⚠️ **Password PostgreSQL** (opcional): `[tu-password]`
5. ⚠️ **RLS**: [ ] Deshabilitado [ ] Habilitado
6. ⚠️ **Auth**: [ ] Supabase Auth [ ] Sistema actual

---

## 🎯 Una vez que tengas esto:

1. Comparte la **Service Role Key** (la más importante)
2. Confirma si la key que me diste es la `anon public` o comparte la correcta
3. Confirma tus preferencias de RLS y Auth
4. (Opcional) Comparte el password de PostgreSQL si quieres que use SQL directo

Con esto, podré crear todos los scripts de migración. 🚀
