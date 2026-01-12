# Instrucciones de Migración a Supabase

Este documento te guiará paso a paso para migrar tu base de datos de json-server a Supabase.

---

## 📋 Prerrequisitos

1. **Node.js instalado** (versión 16 o superior)
2. **Proyecto Supabase creado** con las credenciales disponibles
3. **Acceso a la terminal/consola**

---

## 🚀 Paso 1: Instalar Dependencias

Instala el cliente de Supabase para Node.js (necesario para el script de migración):

```bash
npm install @supabase/supabase-js dotenv
```

O si usas yarn:

```bash
yarn add @supabase/supabase-js dotenv
```

---

## 🚀 Paso 2: Configurar Variables de Entorno

1. **Crea un archivo `.env` en la raíz del proyecto**:

```bash
cp .env.example .env
```

2. **Edita el archivo `.env`** y completa con tus credenciales:

```env
VITE_SUPABASE_URL=https://weberwavolitwvmjfhap.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_0tzTI6KROnJ-_B2Sylij4Q_FAB4JfOS
SUPABASE_SERVICE_ROLE_KEY=sb_secret_LDZn81mde7XPA-qb-AMhVQ_bQ2DBa98
NEXT_PUBLIC_SUPABASE_URL=https://weberwavolitwvmjfhap.supabase.co
```

⚠️ **IMPORTANTE**: 
- El archivo `.env` NO debe subirse a Git (ya está en `.gitignore`)
- La `SUPABASE_SERVICE_ROLE_KEY` es muy sensible, no la compartas

---

## 🚀 Paso 3: Crear las Tablas en Supabase

Tienes dos opciones:

### Opción A: Usando el SQL Editor de Supabase (Recomendado)

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Navega a: **SQL Editor** → **New Query**
3. Abre el archivo `supabase_schema.sql` en tu editor
4. Copia TODO el contenido del archivo
5. Pégalo en el SQL Editor de Supabase
6. Click en **Run** (o presiona `Ctrl+Enter` / `Cmd+Enter`)
7. Verifica que no haya errores

### Opción B: Usando psql (Línea de comandos)

Si tienes `psql` instalado y la contraseña de PostgreSQL:

```bash
psql "postgresql://postgres:[TU-PASSWORD]@db.weberwavolitwvmjfhap.supabase.co:5432/postgres" -f supabase_schema.sql
```

---

## 🚀 Paso 4: Migrar los Datos

Una vez que las tablas estén creadas, ejecuta el script de migración:

```bash
node migrate_to_supabase.js
```

El script:
- ✅ Lee todos los datos de `db.json`
- ✅ Los inserta en Supabase respetando el orden de dependencias
- ✅ Muestra un resumen de la migración
- ✅ Indica cuántos registros se migraron exitosamente

**Tiempo estimado**: 2-5 minutos dependiendo del volumen de datos.

---

## 🚀 Paso 5: Verificar la Migración

1. Ve a **Supabase Dashboard** → **Table Editor**
2. Verifica que todas las tablas tengan datos:
   - `empresa` - Debe tener registros
   - `vehiculo` - Debe tener registros
   - `usuario` - Debe tener registros
   - `orden_trabajo` - Debe tener registros
   - etc.

3. Verifica algunas relaciones:
   - Los vehículos deben tener `id_empresa` válidos
   - Las órdenes de trabajo deben tener `id_vehiculo` válidos
   - Los usuarios deben tener `id_rol` válidos

---

## 🚀 Paso 6: Instalar el Cliente de Supabase en el Frontend

Si aún no lo has hecho, instala el cliente de Supabase:

```bash
npm install @supabase/supabase-js
```

El archivo `src/config/supabase.js` ya está creado y configurado.

---

## 🚀 Paso 7: Actualizar el Código (Opcional - Gradual)

Por ahora, puedes mantener el código actual funcionando con json-server mientras migras gradualmente.

Cuando estés listo para usar Supabase completamente:

1. **Actualiza `src/config/api.js`** para usar Supabase en lugar de json-server
2. **Reemplaza las llamadas `fetch`** por el cliente de Supabase
3. **Usa los helpers** en `src/config/supabase.js` para facilitar las queries

Ejemplo de migración:

**Antes (json-server)**:
```javascript
const response = await fetch(`${JSON_SERVER_URL}/vehiculo`);
const data = await response.json();
```

**Después (Supabase)**:
```javascript
import { getAllFromTable } from '../config/supabase';
const data = await getAllFromTable('vehiculo');
```

---

## ⚠️ Solución de Problemas

### Error: "relation does not exist"
- **Causa**: Las tablas no se crearon correctamente
- **Solución**: Ejecuta el script SQL nuevamente en Supabase SQL Editor

### Error: "duplicate key value"
- **Causa**: Los datos ya existen en Supabase
- **Solución**: 
  - Opción 1: Elimina los datos existentes y vuelve a ejecutar la migración
  - Opción 2: Modifica el script para usar `upsert` en lugar de `insert`

### Error: "foreign key constraint"
- **Causa**: Hay referencias a registros que no existen
- **Solución**: Verifica que todas las tablas padre se migraron antes que las hijas

### Error de conexión
- **Causa**: Credenciales incorrectas o proyecto inactivo
- **Solución**: 
  - Verifica las credenciales en `.env`
  - Verifica que el proyecto Supabase esté activo
  - Verifica tu conexión a internet

---

## 📊 Verificación Post-Migración

Ejecuta estas queries en Supabase SQL Editor para verificar:

```sql
-- Contar registros por tabla
SELECT 'empresa' as tabla, COUNT(*) as total FROM empresa
UNION ALL
SELECT 'vehiculo', COUNT(*) FROM vehiculo
UNION ALL
SELECT 'usuario', COUNT(*) FROM usuario
UNION ALL
SELECT 'orden_trabajo', COUNT(*) FROM orden_trabajo
UNION ALL
SELECT 'orden_x_usuario', COUNT(*) FROM orden_x_usuario;

-- Verificar relaciones
SELECT 
  v.id_vehiculo,
  v.interno,
  e.nombre_empresa
FROM vehiculo v
LEFT JOIN empresa e ON v.id_empresa = e.id_empresa
LIMIT 10;
```

---

## ✅ Checklist Final

- [ ] Dependencias instaladas (`@supabase/supabase-js`)
- [ ] Archivo `.env` configurado con credenciales
- [ ] Script SQL ejecutado en Supabase (tablas creadas)
- [ ] Script de migración ejecutado (`node migrate_to_supabase.js`)
- [ ] Datos verificados en Supabase Table Editor
- [ ] Relaciones verificadas (claves foráneas)
- [ ] Cliente de Supabase configurado en el frontend

---

## 🎉 ¡Listo!

Una vez completados todos los pasos, tu base de datos estará migrada a Supabase y lista para usar.

Si tienes problemas durante la migración, revisa la sección de "Solución de Problemas" o consulta los logs del script de migración.

---

## 📝 Notas Adicionales

- **RLS (Row Level Security)**: Por defecto está deshabilitado. Puedes habilitarlo después desde Supabase Dashboard → Authentication → Policies
- **Backup**: Tu `db.json` original no se modifica, así que siempre puedes volver atrás si es necesario
- **Performance**: Supabase es mucho más rápido que json-server, especialmente con grandes volúmenes de datos
