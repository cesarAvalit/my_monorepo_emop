# 🚀 Separación Frontend y Backend - EMOP

Este documento explica cómo se ha separado el frontend y backend de EMOP, y cómo configurarlos para que funcionen juntos.

## 📁 Estructura del Proyecto

```
emop-my-back/
├── emop_app/          # Frontend (React + Vite)
└── emop_back/         # Backend (Node.js + Express)
```

## ✅ Cambios Realizados

### Backend (`emop_back/`)

Se ha creado un backend completo que:

1. **Replica todas las operaciones de Supabase** que el frontend hacía directamente
2. **Proporciona una API REST** con endpoints genéricos para todas las tablas
3. **Usa las mismas credenciales de Supabase** (Service Role Key)
4. **Mantiene la misma base de datos** y datos

### Frontend (`emop_app/`)

El frontend ha sido actualizado para:

1. **Usar el backend** en lugar de Supabase directo
2. **Mantener compatibilidad** - todas las funciones tienen la misma interfaz
3. **Configuración simple** - solo necesita la URL del backend

## 🔧 Configuración

### 1. Configurar el Backend

```bash
cd emop_back

# Instalar dependencias
npm install

# Copiar archivo de ejemplo de variables de entorno
cp env.example .env

# Editar .env con tus credenciales
# (Las credenciales ya están en el ejemplo, solo verifica que estén correctas)
```

El archivo `.env` del backend debe contener:

```env
SUPABASE_URL=https://weberwavolitwvmjfhap.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_LDZn81mde7XPA-qb-AMhVQ_bQ2DBa98
PORT=3001
FRONTEND_URL=http://localhost:5173
```

### 2. Configurar el Frontend

```bash
cd emop_app

# Si no tienes .env, copia el ejemplo
cp env.example .env

# Editar .env y agregar la URL del backend
```

El archivo `.env` del frontend debe contener (además de las variables existentes):

```env
# URL del Backend API
VITE_BACKEND_URL=http://localhost:3001
```

## 🚀 Ejecutar el Proyecto

### Terminal 1 - Backend

```bash
cd emop_back
npm run dev
```

El backend estará disponible en: `http://localhost:3001`

### Terminal 2 - Frontend

```bash
cd emop_app
npm run dev
```

El frontend estará disponible en: `http://localhost:5173`

## 📡 Endpoints del Backend

### Operaciones CRUD Genéricas

Todas las tablas soportan estas operaciones:

- `GET /api/:table` - Obtener todos los registros
- `GET /api/:table/:id` - Obtener un registro por ID
- `GET /api/:table/foreign-key/:foreignKey/:foreignId` - Obtener por clave foránea
- `POST /api/:table` - Insertar registro
- `PUT /api/:table/:id` - Actualizar registro por ID
- `PUT /api/:table/by-record` - Actualizar registro por objeto
- `DELETE /api/:table/:id` - Eliminar registro por ID
- `DELETE /api/:table/by-record` - Eliminar registro por objeto

### Auditoría

- `POST /api/auditoria/registrar` - Registrar acción en auditoría

### Health Check

- `GET /health` - Verificar que el backend está funcionando

## 🔄 Migración de Código

El frontend **NO necesita cambios** en las páginas existentes. Todas las funciones mantienen la misma interfaz:

```javascript
// Esto sigue funcionando igual
import { getAllFromTable, insertIntoTable, updateInTable, deleteFromTable } from '../config/supabase';

// Ahora usa el backend en lugar de Supabase directo
const datos = await getAllFromTable('vehiculo');
```

## 📋 Tablas Soportadas

El backend soporta todas las tablas que usa el frontend:

- `empresa`, `rol`, `usuario`, `conductor`, `vehiculo`
- `tipo_mantenimiento`, `orden_trabajo`, `mecanico`
- `insumo_catalogo`, `detalle_insumo`, `linea_servicio`
- `rto_registro`, `orden_x_usuario`, `orden_x_mecanico`
- `auditoria`, `reporte_auditoria_ddjj`, `inspeccion_ddjj`
- `tipo_notificacion`, `notificaciones`, `declaracion_jurada`

## 🔒 Seguridad

- El backend usa **Service Role Key** de Supabase (acceso completo)
- **NUNCA** expongas la Service Role Key en el frontend
- El backend debe estar protegido en producción (autenticación, rate limiting, etc.)

## 🐛 Solución de Problemas

### El frontend no se conecta al backend

1. Verifica que el backend esté corriendo: `http://localhost:3001/health`
2. Verifica que `VITE_BACKEND_URL` esté configurado en `.env` del frontend
3. Verifica CORS - el backend debe tener `FRONTEND_URL` configurado correctamente

### Error de CORS

Asegúrate de que `FRONTEND_URL` en el backend coincida con la URL donde corre el frontend.

### El backend no se conecta a Supabase

1. Verifica que `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` estén en `.env`
2. Verifica que las credenciales sean correctas

## 📝 Notas Importantes

1. **Misma base de datos**: Frontend y backend usan la misma base de datos de Supabase
2. **Mismos datos**: No hay migración de datos necesaria
3. **Compatibilidad**: El código del frontend no necesita cambios
4. **Puertos**: Backend en 3001, Frontend en 5173 (por defecto)

## 🎯 Próximos Pasos

1. Probar todas las funcionalidades del frontend con el backend
2. Agregar autenticación al backend si es necesario
3. Agregar rate limiting para producción
4. Configurar variables de entorno para producción

