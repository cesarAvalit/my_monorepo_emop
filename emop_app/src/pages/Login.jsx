import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';
import { getAllFromTable } from '../config/supabase';

const Login = () => {
  const [usuario, setUsuario] = useState('emop_admin@mendoza.ar');
  const [contraseña, setContraseña] = useState('');
  const [mostrarContraseña, setMostrarContraseña] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Intentar primero con Supabase (nuevo sistema)
      try {
        // Obtener usuarios y roles de Supabase
        const [usuarios, roles] = await Promise.all([
          getAllFromTable('usuario'),
          getAllFromTable('rol')
        ]);
        
        // Buscar usuario en la tabla usuario de Supabase
        // Comparar username o email, y password_hash
        const user = usuarios.find(
          u => (u.username === usuario || u.email === usuario) && 
               u.password_hash === contraseña &&
               u.activo !== false
        );

        if (user) {
          // Obtener el nombre del rol
          const rolData = roles.find(r => r.id_rol === user.id_rol);
          const nombreRol = rolData?.nombre || 'ADMINISTRADOR';
          
          // Login exitoso con Supabase
          login({
            id: user.id_usuario,
            email: user.email || user.username,
            nombre: user.nombre_completo || user.username,
            rol: nombreRol,
            id_rol: user.id_rol,
            id_empresa: user.id_empresa,
            username: user.username,
          });

          navigate('/home');
          return;
        } else {
          // Usuario no encontrado o credenciales incorrectas
          throw new Error('Credenciales inválidas. Por favor, verifica tu usuario y contraseña.');
        }
      } catch (supabaseError) {
        // Si es un error de credenciales, lanzarlo directamente
        if (supabaseError.message && supabaseError.message.includes('Credenciales')) {
          throw supabaseError;
        }
        console.warn('Error al intentar login con Supabase, intentando con json-server:', supabaseError);
      }

      // Fallback: Intentar con json-server (sistema antiguo) solo si Supabase falló completamente
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: usuario,
          password: contraseña,
        }),
      });

      // Verificar si la respuesta es JSON antes de parsearla
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(text || `Error ${response.status}: ${response.statusText}`);
      }

      if (!response.ok) {
        throw new Error(data.message || 'Credenciales inválidas');
      }

      // Si el login es exitoso, guardar los datos del usuario
      login({
        email: usuario,
        nombre: data.nombre || data.username || usuario,
        rol: data.rol || 'ADMINISTRADOR',
        ...data, // Incluir cualquier otro dato que venga del backend
      });

      navigate('/home');
      } catch (fetchError) {
        // Si json-server también falla, lanzar el error
        throw new Error('No se pudo conectar con el servidor. Verifica que Supabase esté configurado correctamente.');
      }
    } catch (err) {
      // Manejar diferentes tipos de errores
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('No se pudo conectar con el servidor. Verifica que el backend esté corriendo o que Supabase esté configurado correctamente.');
      } else {
        setError(err.message || 'Credenciales inválidas. Por favor, verifica tu usuario y contraseña.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Fondo con propiedades específicas */}
      <div 
        style={{
          position: 'absolute',
          width: '1599px',
          height: '1330px',
          left: '-43px',
          top: '-174px',
          background: 'rgba(0, 124, 138, 0.67)',
          backdropFilter: 'blur(8.65px)',
          WebkitBackdropFilter: 'blur(8.65px)',
          borderRadius: '0px'
        }}
      />
      
      {/* Tarjeta de login */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Logo EMOP */}
          <div className="flex items-center justify-center mb-8">
            <img 
              src="/logo.png" 
              alt="EMOP - Ente de la Movilidad Provincial Mendoza" 
              className="max-w-full h-auto"
            />
          </div>

          {/* Mensaje de bienvenida */}
          <div className="mb-8 text-center">
            <h3 className="text-[34px] font-montserrat font-bold mb-2">Bienvenido a EMOP</h3>
            <p className="text-sm text-gray-600">Inicia sesión en tu cuenta para ingresar al sistema</p>
          </div>

          {/* Mensaje de error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campo Usuario */}
            <div>
              <label htmlFor="usuario" className="block text-sm font-medium text-gray-700 mb-2">
                Usuario
              </label>
              <input
                type="text"
                id="usuario"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                disabled={isLoading}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007C8A] focus:border-transparent outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Ingresa tu usuario"
                required
              />
            </div>

            {/* Campo Contraseña */}
            <div>
              <label htmlFor="contraseña" className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={mostrarContraseña ? 'text' : 'password'}
                  id="contraseña"
                  value={contraseña}
                  onChange={(e) => setContraseña(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007C8A] focus:border-transparent outline-none transition-all pr-12 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Ingresa tu contraseña"
                  required
                />
                <button
                  type="button"
                  onClick={() => setMostrarContraseña(!mostrarContraseña)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  aria-label={mostrarContraseña ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {mostrarContraseña ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Botón de inicio de sesión */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>
          </form>

          {/* Link de contraseña olvidada */}
          <div className="mt-6 text-center">
            <a 
              href="#" 
              className="text-[#007C8A] hover:text-[#15A7A7] text-sm underline transition-colors duration-200"
              onClick={(e) => {
                e.preventDefault();
                // Aquí puedes agregar la lógica para recuperar contraseña
              }}
            >
              ¿Olvidaste tu contraseña?
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

