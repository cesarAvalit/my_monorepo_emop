/**
 * Servidor Express para el Backend de EMOP - MODIFICADO PARA PRODUCCIÓN
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import tableRoutes from './routes/tableRoutes.js';
import auditoriaRoutes from './routes/auditoriaRoutes.js';
import { getDatabaseType, closeDatabase } from './config/database.js';

dotenv.config(); 

try {
  dotenv.config({ path: '.env_local', override: true });
} catch (err) {
  // .env_local es opcional
}

const app = express();
// Render asigna el puerto automáticamente, por eso usamos process.env.PORT
const PORT = process.env.PORT || 3001;

// MODIFICACIÓN DE CORS: Permitimos cualquier origen en producción para evitar bloqueos
app.use(cors({
  origin: '*', 
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

// MODIFICACIÓN DE LISTEN: Escuchar en '0.0.0.0' es vital para Render
const server = app.listen(PORT, '0.0.0.0', () => {
  const dbType = getDatabaseType();
  console.log(`🚀 Servidor EMOP Backend iniciado en puerto: ${PORT}`);
  console.log(`🗄️  Base de datos: ${dbType === 'postgres' ? 'PostgreSQL Local' : 'Neon'}`);
});

// Manejar cierre graceful
process.on('SIGTERM', async () => {
  server.close(async () => {
    await closeDatabase();
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  server.close(async () => {
    await closeDatabase();
    process.exit(0);
  });
});