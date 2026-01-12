# 📦 Backup de Base de Datos Supabase - EMOP

Este directorio contiene un backup completo de la base de datos de Supabase realizado el **${new Date().toLocaleDateString()}**.

## 📁 Estructura del Backup

```
backup_supabase/
├── README.md                    # Este archivo
├── esquema.sql                  # Estructura completa de las tablas (DDL)
├── datos_completos.json         # Todos los datos en un solo archivo JSON
├── resumen_backup.json          # Resumen estadístico del backup
└── datos/                       # Datos organizados por tabla
    ├── empresa.json
    ├── rol.json
    ├── usuario.json
    ├── vehiculo.json
    ├── orden_trabajo.json
    └── ... (24 tablas en total)
```

## 📊 Resumen del Backup

- **Total de tablas**: 24
- **Total de registros**: 225
- **Tablas descargadas**: 24
- **Tablas no encontradas**: 0

## 📋 Contenido

### 1. Esquema SQL (`esquema.sql`)

Contiene la estructura completa de todas las tablas:
- Definiciones de tablas (CREATE TABLE)
- Claves primarias y foráneas
- Índices
- Constraints y validaciones
- Triggers (si existen)

Este archivo puede usarse para recrear la estructura de la base de datos en un nuevo servidor.

### 2. Datos Completos (`datos_completos.json`)

Archivo JSON con todos los datos de todas las tablas en un solo objeto:

```json
{
  "empresa": [...],
  "rol": [...],
  "usuario": [...],
  ...
}
```

### 3. Datos por Tabla (`datos/*.json`)

Cada tabla tiene su propio archivo JSON con sus datos:
- `empresa.json` - Datos de empresas
- `usuario.json` - Datos de usuarios
- `vehiculo.json` - Datos de vehículos
- etc.

## 🔄 Cómo Usar Este Backup

### Restaurar la Estructura (Esquema)

1. Conectarse a tu base de datos PostgreSQL/Supabase
2. Ejecutar el archivo `esquema.sql`:

```bash
psql -h [HOST] -U [USER] -d [DATABASE] < esquema.sql
```

O desde Supabase Dashboard:
1. Abre SQL Editor
2. Copia y pega el contenido de `esquema.sql`
3. Ejecuta la query

### Restaurar los Datos

Puedes usar el script de restauración que se encuentra en `emop_back/restaurar_db_supabase.js`:

```bash
cd emop_back
node restaurar_db_supabase.js
```

O restaurar manualmente usando el archivo `datos_completos.json` o los archivos individuales.

## ⚠️ Importante

- **Mantén este backup seguro**: Contiene información sensible
- **No compartas públicamente**: Los datos pueden incluir información personal
- **Versiona solo el esquema**: El esquema SQL puede versionarse, pero NO los datos JSON con información sensible

## 🔄 Actualizar el Backup

Para actualizar este backup, ejecuta:

```bash
cd emop_back
node descargar_db_supabase.js
```

Este script descargará nuevamente todos los datos y sobreescribirá los archivos actuales.

## 📝 Notas

- El backup incluye todas las tablas del sistema EMOP
- Algunas tablas pueden estar vacías (como `linea_servicio`)
- Las tablas `users`, `roles`, `companies` son tablas de compatibilidad
- La fecha del backup se guarda en `resumen_backup.json`

