# 🚀 Guía: Iniciar el Backend

## ⚠️ Problema: EADDRINUSE (Puerto ya en uso)

Si ves este error:
```
Error: listen EADDRINUSE: address already in use :::3001
```

**Solución rápida:**
```bash
cd /home/cesar/emop-my-back/emop_back
./scripts/detener_backend.sh
npm run dev
```

## ⚠️ Problema: ERR_CONNECTION_REFUSED

Si ves errores en la consola del navegador como:

```
GET http://localhost:3001/api/rol
net::ERR_CONNECTION_REFUSED
TypeError: Failed to fetch
```

Esto significa que **el backend no está corriendo**.

## ✅ Solución: Iniciar el Backend

### Opción 1: Usar Script de Inicio (Recomendado)

```bash
cd /home/cesar/emop-my-back/emop_back
./scripts/iniciar_backend.sh
```

Este script:
- ✅ Detiene cualquier proceso existente
- ✅ Verifica que el puerto esté libre
- ✅ Instala dependencias si faltan
- ✅ Inicia el backend

### Opción 2: Iniciar Manualmente

```bash
cd /home/cesar/emop-my-back/emop_back
npm run dev
```

Deberías ver:
```
🔌 Conectando a PostgreSQL local...
✅ Conectado a PostgreSQL: localhost:5432/emop_db
🚀 Servidor EMOP Backend corriendo en http://localhost:3001
🗄️  Base de datos: PostgreSQL Local
```

### Opción 2: Iniciar en Background

```bash
cd /home/cesar/emop-my-back/emop_back
npm run dev &
```

### Opción 3: Usar PM2 (Recomendado para Producción)

```bash
# Instalar PM2 globalmente (si no está instalado)
npm install -g pm2

# Iniciar el backend con PM2
cd /home/cesar/emop-my-back/emop_back
pm2 start npm --name "emop-backend" -- run dev

# Ver estado
pm2 status

# Ver logs
pm2 logs emop-backend

# Detener
pm2 stop emop-backend

# Reiniciar
pm2 restart emop-backend
```

## ✅ Verificar que el Backend está Corriendo

### 1. Health Check

```bash
curl http://localhost:3001/health
```

Debería responder:
```json
{
  "status": "ok",
  "message": "EMOP Backend API está funcionando",
  "database": "PostgreSQL Local",
  "timestamp": "2026-01-08T20:30:04.378Z"
}
```

### 2. Probar Endpoints

```bash
# Probar endpoint de roles
curl http://localhost:3001/api/rol

# Probar endpoint de usuarios
curl http://localhost:3001/api/usuario

# Probar endpoint de empresas
curl http://localhost:3001/api/empresa
```

### 3. Verificar en el Navegador

Abre tu navegador y ve a: `http://localhost:3001/health`

Deberías ver la respuesta JSON del health check.

## 🔧 Solución de Problemas

### Error: "Port 3001 already in use" (EADDRINUSE)

Si el puerto 3001 ya está en uso:

**Solución rápida:**
```bash
cd /home/cesar/emop-my-back/emop_back
./scripts/detener_backend.sh
npm run dev
```

**Solución manual:**

1. **Encontrar el proceso:**
```bash
lsof -i :3001
# O
pgrep -f "node.*server.js"
```

2. **Matar el proceso:**
```bash
pkill -f "node.*server.js"
# O forzar si no se detiene
pkill -9 -f "node.*server.js"
```

3. **O cambiar el puerto** en `.env_local`:
```env
PORT=3002
```

Y actualizar el frontend en `emop_app/.env`:
```env
VITE_BACKEND_URL=http://localhost:3002
```

### Error: "Cannot find module"

Asegúrate de tener todas las dependencias instaladas:

```bash
cd /home/cesar/emop-my-back/emop_back
npm install
```

### Error: "Database connection failed"

Verifica que PostgreSQL esté corriendo:

```bash
pg_isready -h localhost -p 5432
```

Si no está corriendo:
```bash
sudo systemctl start postgresql
```

Verifica las credenciales en `.env_local`:
```bash
cat /home/cesar/emop-my-back/emop_back/.env_local
```

## 📋 Comandos Útiles

### Ver Logs del Backend

Si está corriendo con `npm run dev`:
- Los logs aparecen en la terminal donde lo iniciaste

Si está corriendo con PM2:
```bash
pm2 logs emop-backend
```

### Reiniciar el Backend

```bash
# Si está corriendo manualmente
# Presiona Ctrl+C y vuelve a ejecutar: npm run dev

# Si está corriendo con PM2
pm2 restart emop-backend
```

### Detener el Backend

```bash
# Si está corriendo manualmente
# Presiona Ctrl+C

# Si está corriendo con PM2
pm2 stop emop-backend

# Si está corriendo en background
pkill -f "node.*server.js"
```

## 🎯 Estado Actual

✅ **Backend está corriendo en**: `http://localhost:3001`
✅ **Base de datos**: PostgreSQL Local
✅ **Health check**: Funcionando
✅ **Endpoints**: `/api/rol`, `/api/usuario`, etc. funcionando

## 💡 Tips

1. **Mantén el backend corriendo** mientras desarrollas el frontend
2. **Usa PM2** si necesitas que el backend corra en background permanentemente
3. **Verifica el health check** si el frontend no puede conectarse
4. **Revisa los logs** si hay errores

