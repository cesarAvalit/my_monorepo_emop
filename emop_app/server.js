// Servidor personalizado para JSON Server con endpoint de login
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const require = createRequire(import.meta.url);
const jsonServer = require('json-server');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const server = jsonServer.create();
const router = jsonServer.router(join(__dirname, 'db.json'));
const middlewares = jsonServer.defaults();

// Usar middlewares por defecto
server.use(middlewares);
server.use(jsonServer.bodyParser);

// Middleware personalizado para el login
server.post('/auth/login', (req, res) => {
  const { username, password } = req.body;

  // Validar que se envíen username y password
  if (!username || !password) {
    return res.status(400).json({ 
      message: 'Username y password requeridos' 
    });
  }

  // Obtener la base de datos
  const db = router.db;
  const users = db.get('users').value();
  
  // Buscar usuario
  const user = users.find(
    u => u.username === username && u.password === password
  );

  if (!user) {
    return res.status(401).json({ 
      message: 'Credenciales inválidas' 
    });
  }

  // Retornar datos del usuario (sin la contraseña)
  const { password: _, ...userWithoutPassword } = user;
  
  res.json({
    id: user.id,
    username: user.username,
    email: user.email || user.username,
    nombre: user.name || user.username,
    rol: user.rol || 'ADMINISTRADOR',
    id_rol: user.id_rol,
    id_empresa: user.id_empresa,
    ...userWithoutPassword
  });
});

// Usar el router de JSON Server para las demás rutas
server.use(router);

// Iniciar servidor
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`JSON Server is running on http://localhost:${PORT}`);
});


