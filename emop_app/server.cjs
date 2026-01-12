// Servidor personalizado para JSON Server con endpoint de login
// Usando CommonJS para compatibilidad con json-server
const jsonServer = require('json-server');
const path = require('path');

const server = jsonServer.create();
const router = jsonServer.router(path.join(__dirname, 'db.json'));
const middlewares = jsonServer.defaults();

// Usar middlewares por defecto (incluye bodyParser)
server.use(middlewares);
// Asegurar que express pueda parsear JSON
server.use(require('express').json());

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
  console.log(`Login endpoint: POST http://localhost:${PORT}/auth/login`);
});


