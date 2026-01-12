# Información Necesaria de Supabase

## 🎯 Resumen Rápido

Para migrar tu base de datos a Supabase, necesito **3 cosas principales**:

---

## 1️⃣ Credenciales del Proyecto

### ¿Dónde encontrarlas?

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Navega a: **Settings** → **API**
3. Encontrarás:

#### **Project URL**
```
https://xxxxxxxxxxxxx.supabase.co
```
📋 **Copia esta URL completa**

#### **Project API keys**

**Anon / public key** (para el frontend):
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4eHh4eHh4eHh4eHh4eHgiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0NTg5NzI4MCwiZXhwIjoxOTYxNDczMjgwfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
📋 **Copia esta key (es la pública, segura para el frontend)**

**service_role / secret key** (para migración):
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4eHh4eHh4eHh4eHh4eHgiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjQ1ODk3MjgwLCJleHAiOjE5NjE0NzMyODB9.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
⚠️ **Copia esta key (es secreta, solo para migración - NO la compartas públicamente)**

---

## 2️⃣ Configuración de Seguridad

### Row Level Security (RLS)

**Pregunta**: ¿Quieres habilitar Row Level Security desde el inicio?

- [ ] **NO** - Deshabilitar RLS (más fácil para empezar, recomendado para desarrollo)
- [ ] **SÍ** - Habilitar RLS con políticas permisivas (más seguro, recomendado para producción)

**Mi recomendación**: Empezar con RLS deshabilitado, luego lo configuramos.

---

## 3️⃣ Sistema de Autenticación

**Pregunta**: ¿Qué sistema de autenticación quieres usar?

- [ ] **Opción A**: Usar Supabase Auth (recomendado)
  - Más seguro
  - Manejo de sesiones automático
  - Integración con Supabase completa
  
- [ ] **Opción B**: Mantener sistema actual
  - Usar tabla `users` existente
  - Autenticación personalizada

**Mi recomendación**: Opción A (Supabase Auth) para mejor seguridad y escalabilidad.

---

## 📝 Formato para Compartir

Puedes compartir la información en este formato:

```markdown
## Credenciales Supabase

**Project URL**: 
https://xxxxxxxxxxxxx.supabase.co

**Anon Key (Public)**:
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

**Service Role Key (Secret)**:
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

## Configuración

**RLS**: [ ] Deshabilitado [ ] Habilitado
**Autenticación**: [ ] Supabase Auth [ ] Sistema actual
```

---

## ⚠️ Importante

1. **No compartas las keys en repositorios públicos**
2. **La Service Role Key es muy sensible** - solo úsala para migración
3. **Puedes crear un proyecto de prueba** primero si prefieres

---

## 🚀 Si aún no tienes un proyecto Supabase

1. Ve a [supabase.com](https://supabase.com)
2. Crea una cuenta (si no tienes)
3. Click en "New Project"
4. Completa:
   - **Name**: `emop` (o el nombre que prefieras)
   - **Database Password**: (guárdala bien, la necesitarás)
   - **Region**: Elige la más cercana (ej: `South America`)
5. Espera 2-3 minutos a que se complete el setup
6. Luego obtén las credenciales como se explica arriba

---

## ✅ Checklist

- [ ] Tengo un proyecto Supabase creado
- [ ] Tengo la Project URL
- [ ] Tengo la Anon Key (public)
- [ ] Tengo la Service Role Key (secret)
- [ ] Decidí sobre RLS (deshabilitado/habilitado)
- [ ] Decidí sobre autenticación (Supabase Auth/sistema actual)

---

Una vez que tengas esta información, compártela y comenzaré a crear los scripts de migración. 🎉
