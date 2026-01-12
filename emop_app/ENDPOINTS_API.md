# Documentación de Endpoints API - Sistema EMOP

Este documento describe todos los endpoints disponibles en el sistema EMOP, sus métodos HTTP, parámetros requeridos y estructura de datos.

**Base URL**: 
- Desarrollo: `/` (proxyeado por Vite a `http://localhost:3000`)
- Producción: `http://localhost:3000`

**Headers requeridos**:
- `Content-Type: application/json` (para POST, PUT)

---

## 1. Autenticación

### POST `/auth/login`
Inicia sesión en el sistema.

**Parámetros requeridos (Body JSON)**:
```json
{
  "username": "string",  // Email o nombre de usuario
  "password": "string"    // Contraseña del usuario
}
```

**Respuesta exitosa (200)**:
```json
{
  "token": "string",
  "user": {
    "id": "number",
    "username": "string",
    "email": "string",
    "rol": "string"
  }
}
```

**Errores**:
- `400`: Credenciales inválidas
- `401`: No autorizado

---

## 2. Órdenes de Trabajo

### GET `/orden_trabajo`
Obtiene todas las órdenes de trabajo.

**Parámetros**: Ninguno

**Respuesta (200)**: Array de objetos `orden_trabajo`

**Estructura de `orden_trabajo`**:
```json
{
  "id_orden": "number (PK)",
  "id_vehiculo": "number (FK)",
  "id_conductor": "number (FK)",
  "id_tipo_mantenimiento": "number (FK)",
  "nro_orden_trabajo": "string",
  "fecha_generacion": "date (ISO string)",
  "fecha_egreso": "date (ISO string)",
  "odometro": "number",
  "horometro": "number",
  "estado": "string"
}
```

---

## 3. Vehículos

### GET `/vehiculo`
Obtiene todos los vehículos.

**Parámetros**: Ninguno

**Respuesta (200)**: Array de objetos `vehiculo`

### GET `/vehiculo/:id`
Obtiene un vehículo específico por su ID.

**Parámetros de URL**:
- `id` (requerido): ID del vehículo (puede ser `id` o `id_vehiculo`)

### POST `/vehiculo`
Crea un nuevo vehículo.

**Parámetros requeridos (Body JSON)**:
```json
{
  "id": "number",                    // ID interno de json-server (opcional, se genera automáticamente)
  "id_vehiculo": "number",           // ID único del vehículo
  "id_empresa": "number (FK)",       // ID de la empresa
  "interno": "string",               // Número interno del vehículo
  "matricula": "string",             // Matrícula del vehículo
  "marca": "string",                 // Marca del vehículo
  "modelo": "string",                // Modelo del vehículo
  "anio": "number",                  // Año del vehículo
  "kilometros": "number",            // Kilometraje actual
  "tipo_servicio": "string",         // Tipo de servicio
  "nombre_seguro": "string",         // Nombre de la compañía de seguros
  "tipo_seguro_cobertura": "string", // Tipo de seguro/cobertura
  "fecha_vencimiento_seguro": "string (ISO date)", // Fecha de vencimiento del seguro
  "fecha_ultima_rto": "string (ISO date)",         // Fecha de última RTO
  "id_conductor_activo": "number (FK)",            // ID del conductor activo
  "activo": "boolean",               // Estado activo/inactivo
  "posee_ac": "boolean",              // Posee aire acondicionado
  "posee_camara": "boolean",         // Posee cámara
  "equipamiento_atributos": "object"  // Objeto JSON con atributos adicionales (default: {})
}
```

**Respuesta exitosa (201)**: Objeto `vehiculo` creado

### PUT `/vehiculo/:id`
Actualiza un vehículo existente.

**Parámetros de URL**:
- `id` (requerido): ID interno del vehículo en json-server

**Parámetros requeridos (Body JSON)**: Misma estructura que POST, pero todos los campos son opcionales (solo se actualizan los enviados)

**Respuesta exitosa (200)**: Objeto `vehiculo` actualizado

### DELETE `/vehiculo/:id`
Elimina un vehículo.

**Parámetros de URL**:
- `id` (requerido): ID del vehículo (`id` o `id_vehiculo`)

**Respuesta exitosa (200)**: Objeto vacío `{}`

---

## 4. Empresas

### GET `/empresa`
Obtiene todas las empresas.

**Parámetros**: Ninguno

**Respuesta (200)**: Array de objetos `empresa`

**Estructura de `empresa`**:
```json
{
  "id_empresa": "number (PK)",
  "nombre_empresa": "string",
  "cuit": "string",
  "id_grupo": "number"
}
```

---

## 5. Conductores

### GET `/conductor`
Obtiene todos los conductores.

**Parámetros**: Ninguno

**Respuesta (200)**: Array de objetos `conductor`

**Estructura de `conductor`**:
```json
{
  "id_conductor": "number (PK)",
  "id_empresa": "number (FK)",
  "nombre": "string",
  "apellido": "string",
  "numero_licencia": "string",
  "fecha_vencimiento_licencia": "date (ISO string)",
  "dni": "string",
  "telefono": "string",
  "activo": "boolean"
}
```

---

## 6. Tipos de Mantenimiento

### GET `/tipo_mantenimiento`
Obtiene todos los tipos de mantenimiento.

**Parámetros**: Ninguno

**Respuesta (200)**: Array de objetos `tipo_mantenimiento`

**Estructura de `tipo_mantenimiento`**:
```json
{
  "id_tipo_mantenimiento": "number (PK)",
  "nombre": "string",
  "descripcion": "string"
}
```

---

## 7. Líneas de Servicio

### GET `/linea_servicio`
Obtiene todas las líneas de servicio.

**Parámetros**: Ninguno

**Respuesta (200)**: Array de objetos `linea_servicio`

**Estructura de `linea_servicio`**:
```json
{
  "id_linea": "number (PK)",
  "nombre_linea": "string",
  "descripcion": "string"
}
```

---

## 8. Detalles de Insumo

### GET `/detalle_insumo`
Obtiene todos los detalles de insumo.

**Parámetros**: Ninguno

**Respuesta (200)**: Array de objetos `detalle_insumo`

**Estructura de `detalle_insumo`**:
```json
{
  "id_detalle": "number (PK)",
  "id_orden": "number (FK)",
  "id_insumo": "number (FK)",
  "cantidad": "number",
  "precio_unitario": "number (decimal)"
}
```

---

## 9. Usuarios

### GET `/usuario`
Obtiene todos los usuarios.

**Parámetros**: Ninguno

**Respuesta (200)**: Array de objetos `usuario`

### POST `/usuario`
Crea un nuevo usuario.

**Parámetros requeridos (Body JSON)**:
```json
{
  "id_usuario": "number",            // ID único del usuario (se genera automáticamente si no se proporciona)
  "username": "string",              // Nombre de usuario (email)
  "email": "string",                 // Email del usuario
  "password_hash": "string",         // Hash de la contraseña
  "activo": "boolean",               // Estado activo/inactivo (default: true)
  "id_rol": "number (FK)",           // ID del rol del usuario
  "id_empresa": "number (FK)",       // ID de la empresa (nullable)
  "nombre_completo": "string",       // Nombre completo del usuario
  "dni": "string",                   // DNI del usuario
  "telefono": "string"              // Teléfono del usuario
}
```

**Respuesta exitosa (201)**: Objeto `usuario` creado

**Estructura de `usuario`**:
```json
{
  "id_usuario": "number (PK)",
  "username": "string",
  "email": "string",
  "password_hash": "string",
  "activo": "boolean",
  "id_rol": "number (FK)",
  "id_empresa": "number (FK, nullable)",
  "nombre_completo": "string",
  "dni": "string",
  "telefono": "string"
}
```

---

## 10. Roles

### GET `/rol`
Obtiene todos los roles.

**Parámetros**: Ninguno

**Respuesta (200)**: Array de objetos `rol`

**Estructura de `rol`**:
```json
{
  "id_rol": "number (PK)",
  "nombre": "string"
}
```

**Roles predefinidos**:
- `id_rol = 1`: ADMINISTRADOR
- `id_rol = 2`: (otros roles)
- `id_rol = 3`: INSPECTOR
- `id_rol = 4`: AUDITOR

---

## 11. Orden X Usuario (Asignaciones)

### GET `/orden_x_usuario`
Obtiene todas las asignaciones de usuarios a órdenes de trabajo.

**Parámetros de Query (opcionales)**:
- `id_orden_trabajo`: Filtra por ID de orden de trabajo
  - Ejemplo: `/orden_x_usuario?id_orden_trabajo=1`

**Respuesta (200)**: Array de objetos `orden_x_usuario`

### GET `/orden_x_usuario/:id`
Obtiene una asignación específica por su ID.

**Parámetros de URL**:
- `id` (requerido): ID de la asignación

### POST `/orden_x_usuario`
Crea una nueva asignación de usuario a orden de trabajo.

**Parámetros requeridos (Body JSON)**:
```json
{
  "id_orden_trabajo": "number (FK)",  // ID de la orden de trabajo
  "id_usuario": "number (FK)"         // ID del usuario (inspector o auditor)
}
```

**Notas**:
- El sistema valida que el usuario tenga el rol correcto (inspector `id_rol = 3` o auditor `id_rol = 4`)
- Si ya existe una asignación para esa orden con un usuario del mismo rol, se debe usar PUT para actualizar

**Respuesta exitosa (201)**: Objeto `orden_x_usuario` creado con `id` generado

### PUT `/orden_x_usuario/:id`
Actualiza una asignación existente.

**Parámetros de URL**:
- `id` (requerido): ID de la asignación a actualizar

**Parámetros requeridos (Body JSON)**:
```json
{
  "id": "number",                     // ID de la asignación (debe coincidir con el :id de la URL)
  "id_orden_trabajo": "number (FK)",  // ID de la orden de trabajo
  "id_usuario": "number (FK)"         // ID del nuevo usuario asignado
}
```

**Notas**:
- Se usa para reemplazar un inspector/auditor existente por otro
- El sistema valida que el nuevo usuario tenga el rol correcto

**Respuesta exitosa (200)**: Objeto `orden_x_usuario` actualizado

**Estructura de `orden_x_usuario`**:
```json
{
  "id": "number (PK)",
  "id_orden_trabajo": "number (FK)",
  "id_usuario": "number (FK)"
}
```

---

## 12. Auditoría

### GET `/auditoria`
Obtiene todos los registros de auditoría.

**Parámetros de Query (opcionales)**:
- Filtros estándar de json-server (ej: `?_sort=fecha_hora&_order=desc`)

**Respuesta (200)**: Array de objetos `auditoria`

**Estructura de `auditoria`**:
```json
{
  "id_auditoria": "number (PK)",
  "fecha_hora": "datetime (ISO string)",
  "usuario_nombre": "string",
  "id_registro": "number",
  "tipo_registro": "string",
  "accion": "string",
  "detalle": "string",
  "id_usuario_ref": "number (FK)",
  "id_mantenimiento_ref": "number (FK, nullable)"
}
```

---

## 13. Mecánicos

### GET `/mecanico`
Obtiene todos los mecánicos.

**Parámetros**: Ninguno

**Respuesta (200)**: Array de objetos `mecanico`

**Estructura de `mecanico`**:
```json
{
  "id_mecanico": "number (PK)",
  "id_empresa": "number (FK)",
  "nombre": "string",
  "apellido": "string",
  "especialidad": "string",
  "activo": "boolean"
}
```

---

## 14. Orden X Mecánico

### GET `/orden_x_mecanico`
Obtiene todas las asignaciones de mecánicos a órdenes de trabajo.

**Parámetros**: Ninguno

**Respuesta (200)**: Array de objetos `orden_x_mecanico`

**Estructura de `orden_x_mecanico`**:
```json
{
  "id_orden": "number (FK)",
  "id_mecanico": "number (FK)"
}
```

---

## 15. Insumo Catálogo

### GET `/insumo_catalogo`
Obtiene todos los insumos del catálogo.

**Parámetros**: Ninguno

**Respuesta (200)**: Array de objetos `insumo_catalogo`

**Estructura de `insumo_catalogo`**:
```json
{
  "id_insumo": "number (PK)",
  "codigo_inventario": "string",
  "descripcion": "string"
}
```

---

## Notas Importantes

### Manejo de Errores
- Todos los endpoints devuelven códigos de estado HTTP estándar:
  - `200`: Éxito (GET, PUT)
  - `201`: Creado (POST)
  - `400`: Solicitud incorrecta
  - `404`: No encontrado
  - `500`: Error del servidor

### Validaciones del Sistema
1. **Asignación de Inspector/Auditor**:
   - El sistema valida que el usuario tenga `id_rol = 3` (inspector) o `id_rol = 4` (auditor)
   - Solo se permite un inspector y un auditor por orden de trabajo
   - Si ya existe una asignación del mismo rol, se actualiza en lugar de crear una nueva

2. **Relaciones de Claves Foráneas**:
   - Todos los campos FK deben referenciar IDs válidos en sus tablas correspondientes
   - El sistema no valida automáticamente estas relaciones (depende del backend)

3. **Fechas**:
   - Todas las fechas deben enviarse en formato ISO 8601: `YYYY-MM-DDTHH:mm:ss.sssZ`
   - Ejemplo: `"2025-12-17T10:30:00.000Z"`

### Filtros y Búsquedas
json-server soporta filtros mediante query parameters:
- `?campo=valor`: Filtro exacto
- `?campo_like=valor`: Búsqueda parcial (case-insensitive)
- `?_sort=campo&_order=asc|desc`: Ordenamiento
- `?_page=1&_limit=10`: Paginación

Ejemplos:
- `/orden_x_usuario?id_orden_trabajo=1`
- `/usuario?id_rol=3`
- `/vehiculo?activo=true&_sort=matricula&_order=asc`

---

## Ejemplos de Uso

### Crear un vehículo
```javascript
const response = await fetch('/vehiculo', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id_vehiculo: 100,
    id_empresa: 1,
    interno: "001",
    matricula: "ABC123",
    marca: "Mercedes-Benz",
    modelo: "Sprinter",
    anio: 2020,
    kilometros: 50000,
    tipo_servicio: "Público",
    nombre_seguro: "Seguros XYZ",
    tipo_seguro_cobertura: "Total",
    fecha_vencimiento_seguro: "2025-12-31T00:00:00.000Z",
    fecha_ultima_rto: "2025-01-15T00:00:00.000Z",
    id_conductor_activo: 1,
    activo: true,
    posee_ac: true,
    posee_camara: false,
    equipamiento_atributos: {}
  })
});
```

### Asignar un inspector a una orden
```javascript
const response = await fetch('/orden_x_usuario', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id_orden_trabajo: 1,
    id_usuario: 6  // Usuario con id_rol = 3 (Inspector)
  })
});
```

### Actualizar asignación de inspector
```javascript
const response = await fetch('/orden_x_usuario/1', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id: 1,
    id_orden_trabajo: 1,
    id_usuario: 7  // Nuevo inspector
  })
});

// Commentas 1
```
