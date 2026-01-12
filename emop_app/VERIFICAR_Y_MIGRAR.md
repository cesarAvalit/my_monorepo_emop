# ✅ Verificar y Migrar Datos

## Paso 1: Verificar Tablas

Ejecuta en tu terminal:

```bash
npm run verify:supabase
```

Deberías ver todas las tablas marcadas con ✅.

---

## Paso 2: Migrar los Datos

Una vez verificado, ejecuta la migración:

```bash
npm run migrate:supabase
```

Esta vez debería funcionar correctamente. El script mejorado:
- ✅ Maneja mejor los errores
- ✅ Intenta insertar registros individualmente si hay problemas en lotes
- ✅ Muestra un resumen detallado al final

---

## Paso 3: Verificar los Datos Migrados

Después de la migración, puedes verificar en Supabase:

1. Ve a **Supabase Dashboard** → **Table Editor**
2. Selecciona cada tabla y verifica que tenga datos
3. O ejecuta este query en SQL Editor:

```sql
SELECT 
  'empresa' as tabla, COUNT(*) as total FROM empresa
UNION ALL
SELECT 'vehiculo', COUNT(*) FROM vehiculo
UNION ALL
SELECT 'usuario', COUNT(*) FROM usuario
UNION ALL
SELECT 'orden_trabajo', COUNT(*) FROM orden_trabajo
UNION ALL
SELECT 'orden_x_usuario', COUNT(*) FROM orden_x_usuario;
```

---

## 🎯 Ejecuta Ahora

```bash
npm run verify:supabase
```

Luego:

```bash
npm run migrate:supabase
```

¡Comparte el resultado cuando termine! 🚀
