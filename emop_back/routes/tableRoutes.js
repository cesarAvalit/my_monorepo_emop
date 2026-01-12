/**
 * Rutas genéricas para operaciones CRUD en tablas
 * Replica las operaciones que el frontend hace directamente con Supabase
 */

import express from 'express';
import {
  getAllFromTable,
  getById,
  getByForeignKey,
  insertIntoTable,
  updateInTable,
  deleteFromTable
} from '../utils/dbHelpers.js';

const router = express.Router();

/**
 * GET /api/:table
 * Obtener todos los registros de una tabla
 * Query params: filter, orderBy, ascending, limit
 */
router.get('/:table', async (req, res) => {
  try {
    const { table } = req.params;
    const { filter, orderBy, ascending, limit } = req.query;
    
    const options = {};
    
    // Parsear filtros si existen
    if (filter) {
      try {
        options.filter = JSON.parse(filter);
      } catch (e) {
        // Si no es JSON, intentar como query params simples
        options.filter = {};
        Object.keys(req.query).forEach(key => {
          if (key !== 'orderBy' && key !== 'ascending' && key !== 'limit' && key !== 'filter') {
            options.filter[key] = req.query[key];
          }
        });
      }
    } else {
      // Si no hay filter explícito, buscar otros query params como filtros
      options.filter = {};
      Object.keys(req.query).forEach(key => {
        if (key !== 'orderBy' && key !== 'ascending' && key !== 'limit') {
          options.filter[key] = req.query[key];
        }
      });
      if (Object.keys(options.filter).length === 0) {
        delete options.filter;
      }
    }
    
    if (orderBy) {
      options.orderBy = orderBy;
    }
    
    if (ascending !== undefined) {
      options.ascending = ascending === 'true';
    }
    
    if (limit) {
      options.limit = parseInt(limit);
    }
    
    const data = await getAllFromTable(table, options);
    res.json(data);
  } catch (error) {
    console.error(`Error en GET /api/${req.params.table}:`, error);
    res.status(500).json({ error: error.message || 'Error al obtener datos' });
  }
});

/**
 * GET /api/:table/:id
 * Obtener un registro por ID
 */
router.get('/:table/:id', async (req, res) => {
  try {
    const { table, id } = req.params;
    const data = await getById(table, id);
    res.json(data);
  } catch (error) {
    console.error(`Error en GET /api/${req.params.table}/${req.params.id}:`, error);
    res.status(500).json({ error: error.message || 'Error al obtener el registro' });
  }
});

/**
 * GET /api/:table/foreign-key/:foreignKey/:foreignId
 * Obtener registros por clave foránea
 */
router.get('/:table/foreign-key/:foreignKey/:foreignId', async (req, res) => {
  try {
    const { table, foreignKey, foreignId } = req.params;
    const data = await getByForeignKey(table, foreignKey, foreignId);
    res.json(data);
  } catch (error) {
    console.error(`Error en GET /api/${table}/foreign-key/${foreignKey}/${foreignId}:`, error);
    res.status(500).json({ error: error.message || 'Error al obtener registros' });
  }
});

/**
 * POST /api/:table
 * Insertar un nuevo registro
 */
router.post('/:table', async (req, res) => {
  try {
    const { table } = req.params;
    const data = req.body;
    const result = await insertIntoTable(table, data);
    res.status(201).json(result);
  } catch (error) {
    console.error(`Error en POST /api/${req.params.table}:`, error);
    res.status(500).json({ error: error.message || 'Error al insertar el registro' });
  }
});

/**
 * PUT /api/:table/:id
 * Actualizar un registro por ID
 */
router.put('/:table/:id', async (req, res) => {
  try {
    const { table, id } = req.params;
    const data = req.body;
    const result = await updateInTable(table, id, data);
    res.json(result);
  } catch (error) {
    console.error(`Error en PUT /api/${req.params.table}/${req.params.id}:`, error);
    res.status(500).json({ error: error.message || 'Error al actualizar el registro' });
  }
});

/**
 * PUT /api/:table/by-record
 * Actualizar un registro usando un objeto con la clave primaria
 * Body debe incluir los campos de la clave primaria y los datos a actualizar
 */
router.put('/:table/by-record', async (req, res) => {
  try {
    const { table } = req.params;
    const { idOrRecord, data } = req.body;
    const result = await updateInTable(table, idOrRecord, data);
    res.json(result);
  } catch (error) {
    console.error(`Error en PUT /api/${req.params.table}/by-record:`, error);
    res.status(500).json({ error: error.message || 'Error al actualizar el registro' });
  }
});

/**
 * DELETE /api/:table/:id
 * Eliminar un registro por ID
 */
router.delete('/:table/:id', async (req, res) => {
  try {
    const { table, id } = req.params;
    await deleteFromTable(table, id);
    res.json({ success: true, message: 'Registro eliminado correctamente' });
  } catch (error) {
    console.error(`Error en DELETE /api/${req.params.table}/${req.params.id}:`, error);
    res.status(500).json({ error: error.message || 'Error al eliminar el registro' });
  }
});

/**
 * DELETE /api/:table/by-record
 * Eliminar un registro usando un objeto con la clave primaria
 */
router.delete('/:table/by-record', async (req, res) => {
  try {
    const { table } = req.params;
    const { idOrRecord } = req.body;
    await deleteFromTable(table, idOrRecord);
    res.json({ success: true, message: 'Registro eliminado correctamente' });
  } catch (error) {
    console.error(`Error en DELETE /api/${req.params.table}/by-record:`, error);
    res.status(500).json({ error: error.message || 'Error al eliminar el registro' });
  }
});

export default router;

