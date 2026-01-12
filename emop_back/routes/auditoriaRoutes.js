/**
 * Rutas específicas para auditoría
 */

import express from 'express';
import { registrarAuditoria } from '../utils/dbHelpers.js';

const router = express.Router();

/**
 * POST /api/auditoria/registrar
 * Registrar una acción en la tabla de auditoría
 */
router.post('/registrar', async (req, res) => {
  try {
    const {
      usuarioNombre,
      idUsuarioRef,
      accion,
      tipoRegistro,
      idRegistro,
      detalle,
      idMantenimientoRef
    } = req.body;
    
    const result = await registrarAuditoria({
      usuarioNombre,
      idUsuarioRef,
      accion,
      tipoRegistro,
      idRegistro,
      detalle,
      idMantenimientoRef
    });
    
    if (result) {
      res.json({ success: true, message: 'Auditoría registrada correctamente' });
    } else {
      res.status(400).json({ error: 'Error al registrar auditoría' });
    }
  } catch (error) {
    console.error('Error en POST /api/auditoria/registrar:', error);
    res.status(500).json({ error: error.message || 'Error al registrar auditoría' });
  }
});

export default router;

