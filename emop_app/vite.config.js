import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  appType: 'spa', // Configurar como SPA para manejar rutas del cliente
  plugins: [
    react(),
    tailwindcss(),
    // Plugin personalizado para manejar SPA routing
    {
      name: 'spa-fallback',
      configureServer(server) {
        return () => {
          // Lista de rutas que van al proxy (API)
          const apiRoutes = [
            '/auth',
            '/orden_trabajo',
            '/vehiculo',
            '/empresa',
            '/conductor',
            '/tipo_mantenimiento',
            '/insumo_catalogo',
            '/mecanico',
            '/linea_servicio',
            '/detalle_insumo',
            '/orden_x_mecanico',
            '/orden_x_usuario',
            '/usuario',
            '/rol'
          ];
          
          server.middlewares.use((req, res, next) => {
            // Si la petición es para una ruta del cliente (no es un archivo estático)
            // y no coincide con ninguna ruta del proxy, servir index.html
            const url = req.url.split('?')[0]; // Remover query params
            
            // Verificar si es una ruta de API
            // /auditoria no necesita proxy ya que usa Supabase directamente
            const isApiRoute = apiRoutes.some(route => url.startsWith(route));
            
            // Si es una petición GET, no es un archivo estático, y no es una ruta de API, servir index.html
            if (req.method === 'GET' && 
                !url.includes('.') && 
                !isApiRoute &&
                url !== '/' &&
                !url.startsWith('/src/') &&
                !url.startsWith('/node_modules/') &&
                !url.startsWith('/@') &&
                !url.startsWith('/api/')) {
              req.url = '/index.html'
            }
            next()
          })
        }
      }
    }
  ],
  server: {
    port: 5173,
    // Configuración para manejar SPA routing
    // Vite automáticamente sirve index.html para rutas no encontradas
    // pero necesitamos asegurarnos de que el proxy no interfiera
    // Las rutas del cliente (como /auditoria-modificaciones) no deben ser interceptadas por el proxy
    proxy: {
      '/auth': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      // Proxy para todas las rutas de datos del JSON Server
      '/orden_trabajo': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/vehiculo': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/empresa': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/conductor': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/tipo_mantenimiento': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/insumo_catalogo': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/mecanico': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/linea_servicio': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/detalle_insumo': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/orden_x_mecanico': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/orden_x_usuario': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/usuario': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/rol': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      // No hay proxy para /auditoria ya que todas las llamadas usan Supabase directamente
    },
  },
})
