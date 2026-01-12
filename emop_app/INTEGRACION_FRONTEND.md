# 🚀 Integración del Frontend con Supabase

## ✅ Cambios Realizados

### 1. **Actualizado `src/config/supabase.js`**
   - ✅ Agregado helper `getByForeignKey()` para consultas por clave foránea
   - ✅ Mejorado `updateInTable()` para manejar claves primarias personalizadas
   - ✅ Mejorado `deleteFromTable()` para manejar claves primarias personalizadas
   - ✅ Agregada función `getPrimaryKey()` para determinar la PK correcta según la tabla

### 2. **Actualizado `src/pages/GestionOT.jsx`**
   - ✅ Reemplazado `fetch()` por `getAllFromTable()` para cargar datos iniciales
   - ✅ Reemplazado `fetch()` por `getByForeignKey()` para cargar `orden_x_usuario`
   - ✅ Reemplazado `fetch()` POST/PUT por `insertIntoTable()` / `updateInTable()` para guardar asignaciones

---

## 📋 Próximos Pasos

### Archivos que aún necesitan actualización:

1. **`src/pages/Home.jsx`** - Carga de órdenes y vehículos
2. **`src/pages/Registros.jsx`** - CRUD completo de vehículos y usuarios
3. **`src/pages/ReportesDDJJ.jsx`** - Carga de datos para reportes
4. **`src/pages/AuditoriaModificaciones.jsx`** - Carga de auditoría
5. **`src/pages/AlertasVencimiento.jsx`** - Carga de vehículos y empresas
6. **`src/pages/Mantenimientos.jsx`** - Carga de datos

---

## 🔧 Cómo Actualizar los Otros Archivos

### Patrón para reemplazar `fetch()` por Supabase:

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

### Para filtros:
```javascript
// Antes
const response = await fetch(`${JSON_SERVER_URL}/orden_x_usuario?id_orden_trabajo=${id}`);

// Después
import { getByForeignKey } from '../config/supabase';
const data = await getByForeignKey('orden_x_usuario', 'id_orden_trabajo', id);
```

### Para INSERT:
```javascript
// Antes
await fetch(`${JSON_SERVER_URL}/vehiculo`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});

// Después
import { insertIntoTable } from '../config/supabase';
await insertIntoTable('vehiculo', data);
```

### Para UPDATE:
```javascript
// Antes
await fetch(`${JSON_SERVER_URL}/vehiculo/${id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});

// Después
import { updateInTable } from '../config/supabase';
await updateInTable('vehiculo', id, data);
```

### Para DELETE:
```javascript
// Antes
await fetch(`${JSON_SERVER_URL}/vehiculo/${id}`, {
  method: 'DELETE'
});

// Después
import { deleteFromTable } from '../config/supabase';
await deleteFromTable('vehiculo', id);
```

---

## ✅ Estado Actual

- ✅ **GestionOT.jsx**: Completamente migrado a Supabase
- ⏳ **Otros archivos**: Pendientes de migración

---

## 🎯 ¿Continuamos?

¿Quieres que actualice los otros archivos ahora o prefieres hacerlo gradualmente?
