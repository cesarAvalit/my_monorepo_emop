# Documentación de Endpoints API - Sistema EMOP (Supabase)

Este documento describe todos los endpoints disponibles en el sistema EMOP usando Supabase, sus métodos, parámetros requeridos y estructura de datos.

**Base URL**: Supabase REST API
- URL Base: `https://weberwavolitwvmjfhap.supabase.co/rest/v1/`
- Autenticación: Bearer Token (anon key o service role key)

**Headers requeridos**:
- `apikey`: `sb_publishable_0tzTI6KROnJ-_B2Sylij4Q_FAB4JfOS` (anon key)
- `Authorization`: `Bearer sb_publishable_0tzTI6KROnJ-_B2Sylij4Q_FAB4JfOS`
- `Content-Type`: `application/json` (para POST, PUT, PATCH)
- `Prefer`: `return=representation` (para obtener el registro creado/actualizado)

**Nota**: En el frontend se usan las funciones helper de `src/config/supabase.js` que manejan automáticamente estos headers.

---

## Funciones Helper Disponibles

### `getAllFromTable(tableName, options)`
Obtiene todos los registros de una tabla con opciones de filtrado, ordenamiento y límite.

**Parámetros**:
- `tableName` (string, requerido): Nombre de la tabla
- `options` (object, opcional):
  - `filter` (object): Objeto con pares clave-valor para filtros (ej: `{ activo: true }`)
  - `orderBy` (string): Campo para ordenar
  - `ascending` (boolean): Orden ascendente (default: true)
  - `limit` (number): Límite de registros

**Retorna**: Array de objetos

### `insertIntoTable(tableName, data)`
Inserta un nuevo registro en una tabla.

**Parámetros**:
- `tableName` (string, requerido): Nombre de la tabla
- `data` (object, requerido): Objeto con los datos a insertar

**Retorna**: Objeto insertado

### `updateInTable(tableName, idOrRecord, data)`
Actualiza un registro existente.

**Parámetros**:
- `tableName` (string, requerido): Nombre de la tabla
- `idOrRecord` (number|object, requerido): ID del registro o objeto con la clave primaria
- `data` (object, requerido): Objeto con los datos a actualizar

**Retorna**: Objeto actualizado

### `deleteFromTable(tableName, idOrRecord)`
Elimina un registro.

**Parámetros**:
- `tableName` (string, requerido): Nombre de la tabla
- `idOrRecord` (number|object, requerido): ID del registro o objeto con la clave primaria

**Retorna**: `true` si fue exitoso

### `getByForeignKey(tableName, foreignKey, foreignId)`
Obtiene registros filtrados por una clave foránea.

**Parámetros**:
- `tableName` (string, requerido): Nombre de la tabla
- `foreignKey` (string, requerido): Nombre del campo de clave foránea
- `foreignId` (number, requerido): ID de la clave foránea

**Retorna**: Array de objetos

---

## 1. EMPRESA

### GET - Obtener todas las empresas
```javascript
getAllFromTable('empresa')
```

**Estructura de respuesta**:
```json
[
  {
    "id_empresa": 1,
    "nombre_empresa": "Transporte Mendoza S.A.",
    "cuit": "20-12345678-9",
    "id_grupo": null
  }
]
```

### POST - Crear empresa
```javascript
insertIntoTable('empresa', {
  nombre_empresa: "Nueva Empresa",
  cuit: "20-98765432-1",
  id_grupo: null
})
```

**Campos requeridos**:
- `nombre_empresa` (string): Nombre de la empresa

**Campos opcionales**:
- `cuit` (string, UNIQUE): CUIT de la empresa
- `id_grupo` (integer): ID del grupo

---

## 2. ROL

### GET - Obtener todos los roles
```javascript
getAllFromTable('rol')
```

**Estructura de respuesta**:
```json
[
  {
    "id_rol": 1,
    "nombre": "ADMIN"
  },
  {
    "id_rol": 2,
    "nombre": "Empresa"
  },
  {
    "id_rol": 3,
    "nombre": "Inspector"
  },
  {
    "id_rol": 4,
    "nombre": "Auditor"
  }
]
```

### POST - Crear rol
```javascript
insertIntoTable('rol', {
  nombre: "Nuevo Rol"
})
```

**Campos requeridos**:
- `nombre` (string, UNIQUE): Nombre del rol

---

## 3. USUARIO

### GET - Obtener todos los usuarios
```javascript
getAllFromTable('usuario')
// Con filtros
getAllFromTable('usuario', { filter: { id_rol: 3 } })
```

**Estructura de respuesta**:
```json
[
  {
    "id_usuario": 1,
    "username": "admin@emop.com",
    "email": "admin@emop.com",
    "password_hash": "$2b$10$...",
    "activo": true,
    "id_rol": 1,
    "id_empresa": null,
    "nombre_completo": "Administrador",
    "dni": "12345678",
    "telefono": "261-1234567",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
]
```

### POST - Crear usuario
```javascript
insertIntoTable('usuario', {
  username: "usuario@empresa.com",
  email: "usuario@empresa.com",
  password_hash: "$2b$10$...",
  activo: true,
  id_rol: 2,
  id_empresa: 1,
  nombre_completo: "Juan Pérez",
  dni: "12345678",
  telefono: "261-1234567"
})
```

**Campos requeridos**:
- `username` (string, UNIQUE): Nombre de usuario (generalmente el email)
- `email` (string, UNIQUE): Email del usuario
- `password_hash` (string): Hash de la contraseña

**Campos opcionales**:
- `activo` (boolean, default: true): Estado activo/inactivo
- `id_rol` (integer, FK): ID del rol del usuario
- `id_empresa` (integer, FK, nullable): ID de la empresa (null para ADMIN, Inspector, Auditor)
- `nombre_completo` (string): Nombre completo
- `dni` (string): DNI del usuario
- `telefono` (string): Teléfono del usuario

**Notas**:
- `id_empresa` debe ser `null` si `id_rol` es 1 (ADMIN), 3 (Inspector) o 4 (Auditor)
- `created_at` y `updated_at` se generan automáticamente

### PUT - Actualizar usuario
```javascript
updateInTable('usuario', id_usuario, {
  nombre_completo: "Juan Pérez Actualizado",
  telefono: "261-9876543"
})
```

### DELETE - Eliminar usuario
```javascript
deleteFromTable('usuario', id_usuario)
```

---

## 4. CONDUCTOR

### GET - Obtener todos los conductores
```javascript
getAllFromTable('conductor')
// Filtrar por empresa
getAllFromTable('conductor', { filter: { id_empresa: 1 } })
```

**Estructura de respuesta**:
```json
[
  {
    "id_conductor": 1,
    "id_empresa": 1,
    "nombre": "Carlos",
    "apellido": "González",
    "numero_licencia": "LIC-12345",
    "fecha_vencimiento_licencia": "2025-12-31T00:00:00.000Z",
    "dni": "12345678",
    "telefono": "261-1234567",
    "activo": true,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
]
```

### POST - Crear conductor
```javascript
insertIntoTable('conductor', {
  id_empresa: 1,
  nombre: "Carlos",
  apellido: "González",
  numero_licencia: "LIC-12345",
  fecha_vencimiento_licencia: "2025-12-31T00:00:00.000Z",
  dni: "12345678",
  telefono: "261-1234567",
  activo: true
})
```

**Campos requeridos**:
- `id_empresa` (integer, FK): ID de la empresa
- `nombre` (string): Nombre del conductor
- `apellido` (string): Apellido del conductor

**Campos opcionales**:
- `numero_licencia` (string): Número de licencia
- `fecha_vencimiento_licencia` (timestamp): Fecha de vencimiento de la licencia
- `dni` (string): DNI del conductor
- `telefono` (string): Teléfono del conductor
- `activo` (boolean, default: true): Estado activo/inactivo

### PUT - Actualizar conductor
```javascript
updateInTable('conductor', id_conductor, {
  activo: false
})
```

### DELETE - Eliminar conductor
```javascript
deleteFromTable('conductor', id_conductor)
```

---

## 5. VEHICULO

### GET - Obtener todos los vehículos
```javascript
getAllFromTable('vehiculo')
// Con ordenamiento
getAllFromTable('vehiculo', { orderBy: 'matricula', ascending: true })
```

**Estructura de respuesta**:
```json
[
  {
    "id": 1,
    "id_vehiculo": 1,
    "id_empresa": 1,
    "interno": "001",
    "matricula": "ABC123",
    "marca": "Mercedes-Benz",
    "modelo": "Sprinter",
    "anio": 2020,
    "kilometros": 50000,
    "tipo_servicio": "Público",
    "nombre_seguro": "Seguros XYZ",
    "tipo_seguro_cobertura": "Total",
    "fecha_vencimiento_seguro": "2025-12-31T00:00:00.000Z",
    "fecha_ultima_rto": "2025-01-15T00:00:00.000Z",
    "id_conductor_activo": 1,
    "activo": true,
    "posee_ac": true,
    "posee_camara": false,
    "equipamiento_atributos": {},
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
]
```

### POST - Crear vehículo
```javascript
insertIntoTable('vehiculo', {
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
```

**Campos requeridos**:
- `id_vehiculo` (integer, UNIQUE): ID único del vehículo
- `id_empresa` (integer, FK): ID de la empresa

**Campos opcionales**:
- `interno` (string): Número interno del vehículo
- `matricula` (string): Matrícula/patente
- `marca` (string): Marca del vehículo
- `modelo` (string): Modelo del vehículo
- `anio` (integer): Año del vehículo
- `kilometros` (integer, default: 0): Kilometraje actual
- `tipo_servicio` (string): Tipo de servicio
- `nombre_seguro` (string): Nombre de la compañía de seguros
- `tipo_seguro_cobertura` (string): Tipo de seguro/cobertura
- `fecha_vencimiento_seguro` (timestamp): Fecha de vencimiento del seguro
- `fecha_ultima_rto` (timestamp): Fecha de última RTO
- `id_conductor_activo` (integer, FK, nullable): ID del conductor activo
- `activo` (boolean, default: true): Estado activo/inactivo
- `posee_ac` (boolean, default: false): Posee aire acondicionado
- `posee_camara` (boolean, default: false): Posee cámara
- `equipamiento_atributos` (jsonb, default: {}): Objeto JSON con atributos adicionales

### PUT - Actualizar vehículo
```javascript
updateInTable('vehiculo', id_vehiculo, {
  kilometros: 55000,
  activo: false
})
```

### DELETE - Eliminar vehículo
```javascript
deleteFromTable('vehiculo', id_vehiculo)
```

---

## 6. TIPO_MANTENIMIENTO

### GET - Obtener todos los tipos de mantenimiento
```javascript
getAllFromTable('tipo_mantenimiento')
```

**Estructura de respuesta**:
```json
[
  {
    "id_tipo": 1,
    "descripcion": "Preventivo"
  },
  {
    "id_tipo": 2,
    "descripcion": "Correctivo"
  }
]
```

### POST - Crear tipo de mantenimiento
```javascript
insertIntoTable('tipo_mantenimiento', {
  descripcion: "Mantenimiento Mayor"
})
```

**Campos requeridos**:
- `descripcion` (text): Descripción del tipo de mantenimiento

**Nota**: La clave primaria es `id_tipo` (no `id_tipo_mantenimiento`)

---

## 7. ORDEN_TRABAJO

### GET - Obtener todas las órdenes de trabajo
```javascript
getAllFromTable('orden_trabajo')
// Filtrar por vehículo
getByForeignKey('orden_trabajo', 'id_vehiculo', 1)
// Filtrar por estado
getAllFromTable('orden_trabajo', { filter: { estado: 'En proceso' } })
```

**Estructura de respuesta**:
```json
[
  {
    "id_orden": 1,
    "id_vehiculo": 1,
    "id_conductor": 1,
    "id_tipo_mantenimiento": 1,
    "nro_orden_trabajo": "OT-2024-001",
    "fecha_generacion": "2024-01-15T08:00:00.000Z",
    "fecha_egreso": "2024-01-18T16:30:00.000Z",
    "odometro": 125000,
    "horometro": 8500,
    "estado": "Completada",
    "created_at": "2024-01-15T08:00:00.000Z",
    "updated_at": "2024-01-18T16:30:00.000Z"
  }
]
```

### POST - Crear orden de trabajo
```javascript
insertIntoTable('orden_trabajo', {
  id_vehiculo: 1,
  id_conductor: 1,
  id_tipo_mantenimiento: 1,
  nro_orden_trabajo: "OT-2024-001",
  fecha_generacion: "2024-01-15T08:00:00.000Z",
  fecha_egreso: null,
  odometro: 125000,
  horometro: 8500,
  estado: "Pendiente"
})
```

**Campos requeridos**:
- `id_vehiculo` (integer, FK): ID del vehículo
- `id_tipo_mantenimiento` (integer, FK): ID del tipo de mantenimiento
- `nro_orden_trabajo` (string, UNIQUE): Número único de orden de trabajo
- `fecha_generacion` (timestamp): Fecha de generación de la orden
- `estado` (string): Estado de la orden (Pendiente, En proceso, Completada)

**Campos opcionales**:
- `id_conductor` (integer, FK, nullable): ID del conductor
- `fecha_egreso` (timestamp, nullable): Fecha de egreso
- `odometro` (integer, default: 0): Odómetro al momento de la orden
- `horometro` (integer, default: 0): Horómetro al momento de la orden

### PUT - Actualizar orden de trabajo
```javascript
updateInTable('orden_trabajo', id_orden, {
  estado: "Completada",
  fecha_egreso: "2024-01-18T16:30:00.000Z"
})
```

### DELETE - Eliminar orden de trabajo
```javascript
deleteFromTable('orden_trabajo', id_orden)
```

---

## 8. MECANICO

### GET - Obtener todos los mecánicos
```javascript
getAllFromTable('mecanico')
// Filtrar por empresa
getAllFromTable('mecanico', { filter: { id_empresa: 1 } })
```

**Estructura de respuesta**:
```json
[
  {
    "id_mecanico": 1,
    "id_empresa": 1,
    "nombre": "Roberto",
    "apellido": "Martínez",
    "especialidad": "Motor",
    "dni": "12345678",
    "telefono": "261-1234567",
    "activo": true,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
]
```

### POST - Crear mecánico
```javascript
insertIntoTable('mecanico', {
  id_empresa: 1,
  nombre: "Roberto",
  apellido: "Martínez",
  especialidad: "Motor",
  dni: "12345678",
  telefono: "261-1234567",
  activo: true
})
```

**Campos requeridos**:
- `id_empresa` (integer, FK): ID de la empresa
- `nombre` (string): Nombre del mecánico

**Campos opcionales**:
- `apellido` (string, nullable): Apellido del mecánico
- `especialidad` (string): Especialidad del mecánico
- `dni` (string): DNI del mecánico
- `telefono` (string): Teléfono del mecánico
- `activo` (boolean, default: true): Estado activo/inactivo

### PUT - Actualizar mecánico
```javascript
updateInTable('mecanico', id_mecanico, {
  especialidad: "Transmisión"
})
```

### DELETE - Eliminar mecánico
```javascript
deleteFromTable('mecanico', id_mecanico)
```

---

## 9. ORDEN_X_MECANICO (Tabla Pivot)

### GET - Obtener todas las asignaciones
```javascript
getAllFromTable('orden_x_mecanico')
// Filtrar por orden
getByForeignKey('orden_x_mecanico', 'id_orden', 1)
// Filtrar por mecánico
getByForeignKey('orden_x_mecanico', 'id_mecanico', 1)
```

**Estructura de respuesta**:
```json
[
  {
    "id_orden": 1,
    "id_mecanico": 1
  }
]
```

### POST - Asignar mecánico a orden
```javascript
insertIntoTable('orden_x_mecanico', {
  id_orden: 1,
  id_mecanico: 1
})
```

**Campos requeridos**:
- `id_orden` (integer, FK): ID de la orden de trabajo
- `id_mecanico` (integer, FK): ID del mecánico

**Nota**: La clave primaria es compuesta `(id_orden, id_mecanico)`, por lo que no se puede duplicar la misma asignación.

### DELETE - Eliminar asignación
```javascript
deleteFromTable('orden_x_mecanico', { id_orden: 1, id_mecanico: 1 })
```

---

## 10. INSUMO_CATALOGO

### GET - Obtener todos los insumos
```javascript
getAllFromTable('insumo_catalogo')
```

**Estructura de respuesta**:
```json
[
  {
    "id_insumo": 1,
    "codigo_inventario": "INS-001",
    "descripcion": "Aceite de motor 15W40"
  }
]
```

### POST - Crear insumo
```javascript
insertIntoTable('insumo_catalogo', {
  codigo_inventario: "INS-001",
  descripcion: "Aceite de motor 15W40"
})
```

**Campos requeridos**:
- `codigo_inventario` (string, UNIQUE): Código único de inventario
- `descripcion` (text): Descripción del insumo

---

## 11. DETALLE_INSUMO

### GET - Obtener todos los detalles de insumo
```javascript
getAllFromTable('detalle_insumo')
// Filtrar por orden
getByForeignKey('detalle_insumo', 'id_orden', 1)
```

**Estructura de respuesta**:
```json
[
  {
    "id_detalle": 1,
    "id_detalle_insumo": 1,
    "id_orden": 1,
    "id_insumo": 1,
    "cantidad": 5,
    "costo_unitario_historico": 1500.50,
    "costo_total": 7502.50,
    "created_at": "2024-01-15T08:00:00.000Z"
  }
]
```

### POST - Crear detalle de insumo
```javascript
insertIntoTable('detalle_insumo', {
  id_detalle_insumo: 1,
  id_orden: 1,
  id_insumo: 1,
  cantidad: 5,
  costo_unitario_historico: 1500.50,
  costo_total: 7502.50
})
```

**Campos requeridos**:
- `id_orden` (integer, FK): ID de la orden de trabajo
- `id_insumo` (integer, FK): ID del insumo del catálogo

**Campos opcionales**:
- `id_detalle_insumo` (integer): ID interno del detalle
- `cantidad` (integer, default: 1): Cantidad de insumos
- `costo_unitario_historico` (decimal, default: 0): Costo unitario al momento de la orden
- `costo_total` (decimal, default: 0): Costo total (cantidad × costo_unitario)

### PUT - Actualizar detalle de insumo
```javascript
updateInTable('detalle_insumo', id_detalle, {
  cantidad: 6,
  costo_total: 9003.00
})
```

### DELETE - Eliminar detalle de insumo
```javascript
deleteFromTable('detalle_insumo', id_detalle)
```

---

## 12. LINEA_SERVICIO

### GET - Obtener todas las líneas de servicio
```javascript
getAllFromTable('linea_servicio')
```

**Estructura de respuesta**:
```json
[
  {
    "id_linea": 1,
    "nombre_linea": "Línea 1",
    "descripcion": "Descripción de la línea de servicio"
  }
]
```

### POST - Crear línea de servicio
```javascript
insertIntoTable('linea_servicio', {
  nombre_linea: "Línea 1",
  descripcion: "Descripción de la línea de servicio"
})
```

**Campos requeridos**:
- `nombre_linea` (string): Nombre de la línea de servicio

**Campos opcionales**:
- `descripcion` (text): Descripción de la línea

---

## 13. RTO_REGISTRO

### GET - Obtener todos los registros RTO
```javascript
getAllFromTable('rto_registro')
// Filtrar por vehículo
getByForeignKey('rto_registro', 'id_vehiculo', 1)
```

**Estructura de respuesta**:
```json
[
  {
    "id_rto": 1,
    "id_vehiculo": 1,
    "fecha_vencimiento": "2025-12-31T00:00:00.000Z",
    "fecha_emision": "2024-01-15T00:00:00.000Z",
    "numero_certificado": "RTO-2024-001",
    "aprobado": true,
    "activo": true,
    "created_at": "2024-01-15T00:00:00.000Z"
  }
]
```

### POST - Crear registro RTO
```javascript
insertIntoTable('rto_registro', {
  id_vehiculo: 1,
  fecha_vencimiento: "2025-12-31T00:00:00.000Z",
  fecha_emision: "2024-01-15T00:00:00.000Z",
  numero_certificado: "RTO-2024-001",
  aprobado: true,
  activo: true
})
```

**Campos requeridos**:
- `id_vehiculo` (integer, FK): ID del vehículo

**Campos opcionales**:
- `fecha_vencimiento` (timestamp): Fecha de vencimiento del RTO
- `fecha_emision` (timestamp): Fecha de emisión del RTO
- `numero_certificado` (string): Número del certificado RTO
- `aprobado` (boolean, default: false): Estado de aprobación
- `activo` (boolean, default: true): Estado activo/inactivo

### PUT - Actualizar registro RTO
```javascript
updateInTable('rto_registro', id_rto, {
  aprobado: true,
  activo: false
})
```

### DELETE - Eliminar registro RTO
```javascript
deleteFromTable('rto_registro', id_rto)
```

---

## 14. ORDEN_X_USUARIO (Tabla Pivot)

### GET - Obtener todas las asignaciones
```javascript
getAllFromTable('orden_x_usuario')
// Filtrar por orden
getByForeignKey('orden_x_usuario', 'id_orden_trabajo', 1)
// Filtrar por usuario
getByForeignKey('orden_x_usuario', 'id_usuario', 1)
```

**Estructura de respuesta**:
```json
[
  {
    "id": 1,
    "id_orden_trabajo": 1,
    "id_usuario": 6,
    "created_at": "2024-01-15T08:00:00.000Z"
  }
]
```

### POST - Asignar usuario a orden
```javascript
insertIntoTable('orden_x_usuario', {
  id_orden_trabajo: 1,
  id_usuario: 6
})
```

**Campos requeridos**:
- `id_orden_trabajo` (integer, FK): ID de la orden de trabajo
- `id_usuario` (integer, FK): ID del usuario (debe ser Inspector o Auditor)

**Nota**: 
- Constraint UNIQUE en `(id_orden_trabajo, id_usuario)` - no se puede duplicar la misma asignación
- El usuario debe tener `id_rol = 3` (Inspector) o `id_rol = 4` (Auditor)

### PUT - Actualizar asignación
```javascript
updateInTable('orden_x_usuario', id, {
  id_usuario: 7  // Cambiar el usuario asignado
})
```

### DELETE - Eliminar asignación
```javascript
deleteFromTable('orden_x_usuario', id)
```

---

## 15. AUDITORIA

### GET - Obtener todos los registros de auditoría
```javascript
getAllFromTable('auditoria')
// Ordenar por fecha descendente
getAllFromTable('auditoria', { orderBy: 'fecha_hora', ascending: false })
// Filtrar por usuario
getByForeignKey('auditoria', 'id_usuario_ref', 1)
// Filtrar por orden de trabajo
getByForeignKey('auditoria', 'id_mantenimiento_ref', 1)
```

**Estructura de respuesta**:
```json
[
  {
    "id_auditoria": 1,
    "fecha_hora": "2024-01-15T10:30:00.000Z",
    "usuario_nombre": "Juan Pérez",
    "id_registro": 123,
    "tipo_registro": "vehiculo",
    "accion": "UPDATE",
    "detalle": "Actualización de kilometraje",
    "id_usuario_ref": 1,
    "id_mantenimiento_ref": 1
  }
]
```

### POST - Crear registro de auditoría
```javascript
insertIntoTable('auditoria', {
  usuario_nombre: "Juan Pérez",
  id_registro: 123,
  tipo_registro: "vehiculo",
  accion: "UPDATE",
  detalle: "Actualización de kilometraje",
  id_usuario_ref: 1,
  id_mantenimiento_ref: 1
})
```

**Campos opcionales**:
- `fecha_hora` (timestamp, default: NOW()): Fecha y hora del registro
- `usuario_nombre` (string): Nombre del usuario que realizó la acción
- `id_registro` (integer): ID del registro modificado
- `tipo_registro` (string): Tipo de registro (vehiculo, orden_trabajo, etc.)
- `accion` (string): Acción realizada (INSERT, UPDATE, DELETE)
- `detalle` (text): Detalle de la acción
- `id_usuario_ref` (integer, FK, nullable): ID del usuario que realizó la acción
- `id_mantenimiento_ref` (integer, FK, nullable): ID de la orden de trabajo relacionada

**Nota**: `fecha_hora` se genera automáticamente si no se proporciona.

---

## Validaciones y Restricciones

### Validaciones de Negocio

1. **USUARIO**:
   - Si `id_rol = 1` (ADMIN), `id_rol = 3` (Inspector) o `id_rol = 4` (Auditor), entonces `id_empresa` debe ser `null`
   - `username` y `email` deben ser únicos

2. **ORDEN_X_USUARIO**:
   - El usuario asignado debe tener `id_rol = 3` (Inspector) o `id_rol = 4` (Auditor)
   - No se puede duplicar la misma asignación (constraint UNIQUE)

3. **ORDEN_TRABAJO**:
   - `nro_orden_trabajo` debe ser único
   - `id_vehiculo` debe existir en la tabla `vehiculo`
   - `id_tipo_mantenimiento` debe existir en la tabla `tipo_mantenimiento`

4. **VEHICULO**:
   - `id_vehiculo` debe ser único
   - `id_empresa` debe existir en la tabla `empresa`
   - `id_conductor_activo` debe existir en la tabla `conductor` (si no es null)

### Claves Primarias

| Tabla | Clave Primaria |
|-------|----------------|
| empresa | `id_empresa` |
| rol | `id_rol` |
| usuario | `id_usuario` |
| conductor | `id_conductor` |
| vehiculo | `id` (pero se usa `id_vehiculo` como identificador único) |
| tipo_mantenimiento | `id_tipo` |
| orden_trabajo | `id_orden` |
| mecanico | `id_mecanico` |
| orden_x_mecanico | `(id_orden, id_mecanico)` (compuesta) |
| insumo_catalogo | `id_insumo` |
| detalle_insumo | `id_detalle` |
| linea_servicio | `id_linea` |
| rto_registro | `id_rto` |
| orden_x_usuario | `id` |
| auditoria | `id_auditoria` |

### Campos UNIQUE

- `empresa.cuit`
- `rol.nombre`
- `usuario.username`
- `usuario.email`
- `vehiculo.id_vehiculo`
- `orden_trabajo.nro_orden_trabajo`
- `insumo_catalogo.codigo_inventario`
- `orden_x_usuario(id_orden_trabajo, id_usuario)` (constraint UNIQUE)

---

## Ejemplos de Uso Completo

### Crear una orden de trabajo completa
```javascript
// 1. Crear la orden
const orden = await insertIntoTable('orden_trabajo', {
  id_vehiculo: 1,
  id_conductor: 1,
  id_tipo_mantenimiento: 1,
  nro_orden_trabajo: "OT-2024-100",
  fecha_generacion: new Date().toISOString(),
  estado: "Pendiente",
  odometro: 125000,
  horometro: 8500
});

// 2. Asignar inspector
await insertIntoTable('orden_x_usuario', {
  id_orden_trabajo: orden.id_orden,
  id_usuario: 6  // Usuario con id_rol = 3 (Inspector)
});

// 3. Asignar auditor
await insertIntoTable('orden_x_usuario', {
  id_orden_trabajo: orden.id_orden,
  id_usuario: 7  // Usuario con id_rol = 4 (Auditor)
});

// 4. Asignar mecánicos
await insertIntoTable('orden_x_mecanico', {
  id_orden: orden.id_orden,
  id_mecanico: 1
});

// 5. Agregar insumos
await insertIntoTable('detalle_insumo', {
  id_orden: orden.id_orden,
  id_insumo: 1,
  cantidad: 5,
  costo_unitario_historico: 1500.50,
  costo_total: 7502.50
});
```

### Obtener órdenes de trabajo con relaciones
```javascript
// Obtener todas las órdenes
const ordenes = await getAllFromTable('orden_trabajo');

// Para cada orden, obtener relaciones
for (const orden of ordenes) {
  // Obtener vehículo
  const vehiculos = await getAllFromTable('vehiculo', { 
    filter: { id_vehiculo: orden.id_vehiculo } 
  });
  
  // Obtener usuarios asignados
  const usuariosAsignados = await getByForeignKey(
    'orden_x_usuario', 
    'id_orden_trabajo', 
    orden.id_orden
  );
  
  // Obtener mecánicos asignados
  const mecanicosAsignados = await getByForeignKey(
    'orden_x_mecanico', 
    'id_orden', 
    orden.id_orden
  );
  
  // Obtener insumos
  const insumos = await getByForeignKey(
    'detalle_insumo', 
    'id_orden', 
    orden.id_orden
  );
}
```

---

## Manejo de Errores

Todas las funciones helper manejan errores y retornan valores seguros:

- **getAllFromTable**: Retorna `[]` (array vacío) en caso de error
- **insertIntoTable**: Lanza excepción que debe ser capturada con `try/catch`
- **updateInTable**: Lanza excepción que debe ser capturada con `try/catch`
- **deleteFromTable**: Lanza excepción que debe ser capturada con `try/catch`
- **getByForeignKey**: Retorna `[]` (array vacío) en caso de error

**Ejemplo de manejo de errores**:
```javascript
try {
  const nuevoVehiculo = await insertIntoTable('vehiculo', {
    id_vehiculo: 100,
    id_empresa: 1,
    matricula: "ABC123"
  });
  console.log('Vehículo creado:', nuevoVehiculo);
} catch (error) {
  console.error('Error al crear vehículo:', error);
  // Manejar el error (mostrar mensaje al usuario, etc.)
}
```

---

## Notas Importantes

1. **Timestamps**: Todas las fechas deben enviarse en formato ISO 8601: `YYYY-MM-DDTHH:mm:ss.sssZ`
2. **Campos automáticos**: `created_at` y `updated_at` se generan automáticamente en las tablas que los tienen
3. **Triggers**: Los triggers automáticos actualizan `updated_at` cuando se modifica un registro
4. **RLS (Row Level Security)**: Actualmente deshabilitado, pero puede habilitarse para mayor seguridad
5. **Índices**: El esquema incluye índices optimizados en claves foráneas y campos de búsqueda frecuente

