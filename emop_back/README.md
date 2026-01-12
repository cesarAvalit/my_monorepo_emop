# EMOP Backend API

Backend separado para EMOP que replica todas las operaciones de base de datos que el frontend realiza directamente con Supabase.

## 🚀 Inicio Rápido

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Copia el archivo `.env.example` a `.env` y completa las credenciales:

```bash
cp .env.example .env
```

Edita `.env` con tus credenciales de Supabase:

```env
SUPABASE_URL=https://weberwavolitwvmjfhap.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
PORT=3001
FRONTEND_URL=http://localhost:5173
```

### 3. Iniciar el servidor

```bash
# Desarrollo (con watch)
npm run dev

# Producción
npm start
```

El servidor estará disponible en `http://localhost:3001`

## 📡 Endpoints API

### Operaciones CRUD Genéricas

Todas las tablas soportan las siguientes operaciones:

#### GET - Obtener todos los registros
```
GET /api/:table
GET /api/:table?filter={"campo":"valor"}
GET /api/:table?orderBy=campo&ascending=false
GET /api/:table?limit=10
```

#### GET - Obtener un registro por ID
```
GET /api/:table/:id
```

#### GET - Obtener por clave foránea
```
GET /api/:table/foreign-key/:foreignKey/:foreignId
```

#### POST - Insertar registro
```
POST /api/:table
Body: { ...datos del registro }
```

#### PUT - Actualizar registro por ID
```
PUT /api/:table/:id
Body: { ...datos a actualizar }
```

#### PUT - Actualizar registro por objeto
```
PUT /api/:table/by-record
Body: { 
  "idOrRecord": { "id": 123 },
  "data": { ...datos a actualizar }
}
```

#### DELETE - Eliminar registro por ID
```
DELETE /api/:table/:id
```

#### DELETE - Eliminar registro por objeto
```
DELETE /api/:table/by-record
Body: { "idOrRecord": { "id": 123 } }
```

### Auditoría

#### POST - Registrar auditoría
```
POST /api/auditoria/registrar
Body: {
  "usuarioNombre": "Nombre Usuario",
  "idUsuarioRef": 1,
  "accion": "CREAR",
  "tipoRegistro": "vehiculo",
  "idRegistro": 123,
  "detalle": "Descripción",
  "idMantenimientoRef": null
}
```

## 📋 Tablas Soportadas

El backend soporta todas las tablas que usa el frontend:

- `empresa`
- `rol`
- `usuario`
- `conductor`
- `vehiculo`
- `tipo_mantenimiento`
- `orden_trabajo`
- `mecanico`
- `insumo_catalogo`
- `detalle_insumo`
- `linea_servicio`
- `rto_registro`
- `orden_x_usuario`
- `orden_x_mecanico`
- `auditoria`
- `reporte_auditoria_ddjj`
- `inspeccion_ddjj`
- `tipo_notificacion`
- `notificaciones`
- `declaracion_jurada`

## 🔧 Configuración

### Variables de Entorno

- `SUPABASE_URL`: URL de tu proyecto Supabase
- `SUPABASE_SERVICE_ROLE_KEY`: Service Role Key de Supabase (acceso completo)
- `PORT`: Puerto del servidor (default: 3001)
- `FRONTEND_URL`: URL del frontend para CORS (default: http://localhost:5173)

## 🔒 Seguridad

- El backend usa **Service Role Key** de Supabase, que tiene acceso completo a la base de datos
- **NUNCA** expongas la Service Role Key en el frontend
- El backend debe estar protegido en producción (autenticación, rate limiting, etc.)

## 📝 Notas

- Este backend replica exactamente las operaciones que el frontend hace con Supabase
- Usa las mismas credenciales y base de datos que el frontend
- El frontend debe actualizarse para usar este backend en lugar de Supabase directo

