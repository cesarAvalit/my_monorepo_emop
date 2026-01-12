// Configuración de la API
// En desarrollo, usamos la ruta relativa que será proxeada por Vite
// En producción, cambiar a la URL completa del backend
export const API_BASE_URL = import.meta.env.PROD 
  ? 'http://localhost:3000/auth' 
  : '/auth';

// URL base para datos del JSON Server
export const JSON_SERVER_URL = import.meta.env.PROD 
  ? 'http://localhost:3000' 
  : '';

