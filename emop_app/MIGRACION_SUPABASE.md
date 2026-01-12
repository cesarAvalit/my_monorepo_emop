# Plan de Migración a Supabase

Este documento describe los pasos y la información necesaria para migrar la base de datos de json-server a Supabase.

---

## 📋 Información Necesaria de Supabase

Para realizar la migración, necesito que me proporciones la siguiente información de tu proyecto Supabase:

### 1. **Credenciales del Proyecto**

Necesito acceso a:

- **URL del Proyecto**: `https://[tu-proyecto].supabase.co`
  - Se encuentra en: Supabase Dashboard → Settings → API → Project URL

- **Anon Key (Public Key)**: 
  - Se encuentra en: Supabase Dashboard → Settings → API → Project API keys → `anon` `public`
  - Esta key se usará en el frontend para las peticiones desde el navegador

- **Service Role Key (Secret Key)**:
  - Se encuentra en: Supabase Dashboard → Settings → API → Project API keys → `service_role` `secret`
  - ⚠️ **IMPORTANTE**: Esta key es sensible, solo se usará para migraciones y operaciones administrativas
  - ⚠️ **NUNCA** debe exponerse en el frontend

### 2. **Configuración de Seguridad (RLS)**

Necesito saber tu preferencia sobre **Row Level Security (RLS)**:

- **Opción A**: Deshabilitar RLS temporalmente (más fácil para desarrollo)
  - Permite acceso completo sin autenticación
  - Útil para desarrollo y migración inicial

- **Opción B**: Habilitar RLS con políticas permisivas
  - Más seguro pero requiere configuración de políticas
  - Recomendado para producción

**¿Cuál prefieres?** (Recomiendo Opción A para empezar, luego podemos ajustar)

### 3. **Autenticación**

Necesito saber si quieres:

- **Opción A**: Usar el sistema de autenticación de Supabase (Auth)
  - Integración con Supabase Auth
  - Manejo de sesiones automático
  - Más seguro y escalable

- **Opción B**: Mantener el sistema de autenticación actual
  - Usar la tabla `users` existente
  - Implementar autenticación personalizada

**¿Cuál prefieres?** (Recomiendo Opción A para mejor seguridad)

---

## 📊 Estructura de Tablas a Crear

Basándome en tu `db.json` actual, necesito crear las siguientes tablas en Supabase:

### Tablas Principales:

1. **`empresa`** - Empresas de transporte
2. **`vehiculo`** - Vehículos
3. **`conductor`** - Conductores
4. **`orden_trabajo`** - Órdenes de trabajo
5. **`tipo_mantenimiento`** - Tipos de mantenimiento
6. **`insumo_catalogo`** - Catálogo de insumos
7. **`mecanico`** - Mecánicos
8. **`linea_servicio`** - Líneas de servicio
9. **`detalle_insumo`** - Detalles de insumos por orden
10. **`rol`** - Roles de usuario
11. **`usuario`** - Usuarios del sistema
12. **`rto_registro`** - Registros RTO
13. **`auditoria`** - Registros de auditoría

### Tablas de Relación (Pivot):

14. **`orden_x_mecanico`** - Relación muchos a muchos entre órdenes y mecánicos
15. **`orden_x_usuario`** - Relación entre órdenes y usuarios (inspector/auditor)

### Tablas Adicionales (Opcionales):

16. **`users`** - Si mantienes autenticación personalizada
17. **`roles`** - Si mantienes autenticación personalizada
18. **`companies`** - Si mantienes autenticación personalizada

---

## 🔧 Scripts que Crearé

Una vez que me proporciones la información, crearé:

1. **Script SQL de creación de tablas** (`supabase_schema.sql`)
   - Definición de todas las tablas
   - Claves primarias y foráneas
   - Índices para optimización
   - Constraints y validaciones

2. **Script de migración de datos** (`migrate_data.js` o `migrate_data.py`)
   - Lee el `db.json` actual
   - Inserta todos los datos en Supabase
   - Maneja relaciones y dependencias
   - Genera reporte de migración

3. **Configuración del cliente Supabase** (`src/config/supabase.js`)
   - Cliente de Supabase para el frontend
   - Configuración de autenticación
   - Helpers para queries

4. **Actualización de endpoints** (si es necesario)
   - Adaptar las llamadas de `fetch` a Supabase client
   - Mantener compatibilidad con el código existente

---

## 📝 Checklist de Información Requerida

Por favor, proporciona:

- [ ] **URL del Proyecto Supabase**: `https://[tu-proyecto].supabase.co`
- [ ] **Anon Key (Public)**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- [ ] **Service Role Key (Secret)**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- [ ] **Preferencia de RLS**: [ ] Opción A (Deshabilitar) [ ] Opción B (Habilitar con políticas)
- [ ] **Preferencia de Autenticación**: [ ] Opción A (Supabase Auth) [ ] Opción B (Sistema actual)

---

## 🚀 Próximos Pasos

Una vez que tengas la información:

1. **Crear el proyecto en Supabase** (si aún no lo tienes):
   - Ve a [supabase.com](https://supabase.com)
   - Crea un nuevo proyecto
   - Espera a que se complete el setup (2-3 minutos)

2. **Obtener las credenciales**:
   - Ve a Settings → API
   - Copia la URL del proyecto y las keys

3. **Compartir la información**:
   - Puedes compartirla aquí o crear un archivo `.env.example` con los valores (sin las keys reales)

4. **Ejecutar la migración**:
   - Ejecutaré los scripts SQL en tu proyecto
   - Migraré todos los datos
   - Verificaré la integridad de los datos

---

## ⚠️ Consideraciones Importantes

### Nombres de Tablas
- Supabase usa PostgreSQL, que es case-sensitive para nombres entre comillas
- Usaré nombres en minúsculas con guiones bajos para compatibilidad
- Ejemplo: `orden_trabajo` en lugar de `ordenTrabajo`

### Tipos de Datos
- **JSON**: Los campos `equipamiento_atributos` se convertirán a tipo `jsonb` en PostgreSQL
- **Fechas**: Se mantendrán como `timestamp with time zone`
- **Booleanos**: Se mantendrán como `boolean`
- **Números**: Se usarán `integer` o `bigint` según corresponda

### Claves Primarias
- Usaré `SERIAL` o `BIGSERIAL` para auto-incremento
- Mantendré los IDs existentes cuando sea posible
- Para tablas con IDs personalizados (como `id_vehiculo`), usaré `UNIQUE` constraints

### Relaciones
- Todas las claves foráneas tendrán constraints
- Se crearán índices en las claves foráneas para optimizar queries
- Las relaciones se validarán en la base de datos

---

## 📞 Preguntas Frecuentes

**P: ¿Puedo mantener json-server funcionando mientras migro?**
R: Sí, la migración es no destructiva. Los datos en `db.json` no se modificarán.

**P: ¿Qué pasa si hay errores durante la migración?**
R: Los scripts incluirán validaciones y manejo de errores. Si algo falla, podremos corregirlo y reintentar.

**P: ¿Necesito cambiar el código del frontend inmediatamente?**
R: No necesariamente. Puedo crear un adaptador que mantenga la compatibilidad con el código actual mientras migramos gradualmente.

**P: ¿Cuánto tiempo tomará la migración?**
R: Depende del volumen de datos, pero estimo 5-10 minutos para crear las tablas y migrar los datos.

---

## 🔒 Seguridad

**IMPORTANTE**: 
- Nunca compartas las keys en repositorios públicos
- Usa variables de entorno para las credenciales
- La Service Role Key solo debe usarse en el backend o scripts de migración
- Considera usar diferentes proyectos para desarrollo y producción

---

¿Tienes alguna pregunta antes de comenzar? Una vez que tengas la información, podemos proceder con la migración.
