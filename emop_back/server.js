/**
 * Servidor Express para el Backend de EMOP
 * 
 * Este servidor replica todas las operaciones que el frontend hace
 * directamente con Supabase, proporcionando una API REST.
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import tableRoutes from './routes/tableRoutes.js';
import auditoriaRoutes from './routes/auditoriaRoutes.js';
import { getDatabaseType, closeDatabase } from './config/database.js';

// Cargar variables de entorno
// IMPORTANTE: .env_local sobrescribe .env si existe (override: true)
// Para usar remoto (Supabase): elimina .env_local o no lo crees
// Para usar local: crea/usa .env_local con DB_TYPE=postgres
dotenv.config(); // Carga .env

// Cargar también .env_local si existe (para desarrollo local)
// override: true significa que .env_local SOBRESCRIBE .env
try {
  dotenv.config({ path: '.env_local', override: true });
} catch (err) {
  // .env_local es opcional
}

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Middleware
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  const dbType = getDatabaseType();
  res.json({ 
    status: 'ok', 
    message: 'EMOP Backend API está funcionando',
    database: dbType === 'postgres' ? 'PostgreSQL Local' : 'Supabase',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api', tableRoutes);
app.use('/api/auditoria', auditoriaRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: err.message 
  });
});

// Iniciar servidor
const server = app.listen(PORT, () => {
  const dbType = getDatabaseType();
  console.log(`🚀 Servidor EMOP Backend corriendo en http://localhost:${PORT}`);
  console.log(`📡 Frontend esperado en: ${FRONTEND_URL}`);
  console.log(`🗄️  Base de datos: ${dbType === 'postgres' ? 'PostgreSQL Local' : 'Supabase'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

// Manejar cierre graceful
process.on('SIGTERM', async () => {
  console.log('⚠️ SIGTERM recibido, cerrando servidor...');
  server.close(async () => {
    await closeDatabase();
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('⚠️ SIGINT recibido, cerrando servidor...');
  server.close(async () => {
    await closeDatabase();
    process.exit(0);
  });
});

