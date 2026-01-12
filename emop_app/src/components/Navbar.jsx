import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { useSidebar } from '../context/SidebarContext';
import { getAllFromTable, updateInTable } from '../config/supabase';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const [avatarErrored, setAvatarErrored] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef(null);
  const [notificaciones, setNotificaciones] = useState([]);
  const [tiposNotificacion, setTiposNotificacion] = useState([]);
  const [isNotificacionesOpen, setIsNotificacionesOpen] = useState(false);
  const notificacionesRef = useRef(null);
  const [empresaUsuario, setEmpresaUsuario] = useState(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [rolUsuario, setRolUsuario] = useState(null);

  useEffect(() => {
    // Si cambia el usuario, reintentar cargar avatar
    setAvatarErrored(false);
  }, [user?.foto, user?.nombre]);

  // Cargar notificaciones del usuario y empresa
  useEffect(() => {
    const cargarNotificaciones = async () => {
      // Obtener el ID del usuario (puede ser user.id o user.id_usuario)
      const userId = user?.id || user?.id_usuario;
      if (!userId) return;
      
      try {
        const [todasNotificaciones, tiposNotifData, empresasData, rolesData, usuariosData] = await Promise.all([
          getAllFromTable('notificaciones'),
          getAllFromTable('tipo_notificacion'),
          getAllFromTable('empresa'),
          getAllFromTable('rol'),
          getAllFromTable('usuario')
        ]);
        
        const validNotificaciones = Array.isArray(todasNotificaciones) ? todasNotificaciones : [];
        const validTiposNotif = Array.isArray(tiposNotifData) ? tiposNotifData : [];
        const validEmpresas = Array.isArray(empresasData) ? empresasData : [];
        const validRoles = Array.isArray(rolesData) ? rolesData : [];
        const validUsuarios = Array.isArray(usuariosData) ? usuariosData : [];
        
        // Guardar tipos de notificación
        setTiposNotificacion(validTiposNotif);
        
        // Obtener el usuario actual desde la tabla usuario de Supabase
        const usuarioActual = validUsuarios.find(u => u.id_usuario === userId);
        
        // Obtener el rol del usuario usando id_rol desde la tabla usuario
        // El id_rol se relaciona con la tabla rol (1=ADMIN, 2=Empresa, 3=Inspector, 4=Auditor)
        let nombreRolFinal = null;
        if (usuarioActual?.id_rol) {
          // Buscar el rol en la tabla rol usando el id_rol del usuario
          const rol = validRoles.find(r => r.id_rol === usuarioActual.id_rol);
          if (rol?.nombre) {
            // Mapear nombres de roles a formato de visualización según la estructura de la BD
            // La tabla rol tiene: "ADMIN", "Empresa", "Inspector", "Auditor"
            if (rol.nombre === 'ADMIN') {
              nombreRolFinal = 'ADMINISTRADOR';
            } else if (rol.nombre === 'Inspector') {
              nombreRolFinal = 'INSPECTOR';
            } else if (rol.nombre === 'Auditor') {
              nombreRolFinal = 'AUDITOR';
            } else if (rol.nombre === 'Empresa') {
              nombreRolFinal = 'EMPRESA';
            } else {
              nombreRolFinal = rol.nombre.toUpperCase();
            }
          }
        }
        
        // Si no se encontró el rol en la BD, usar el que viene en user.rol como fallback
        if (!nombreRolFinal && user?.rol) {
          if (user.rol === 'ADMIN' || user.rol === 'ADMINISTRADOR') {
            nombreRolFinal = 'ADMINISTRADOR';
          } else if (user.rol === 'Inspector' || user.rol === 'INSPECTOR') {
            nombreRolFinal = 'INSPECTOR';
          } else if (user.rol === 'Auditor' || user.rol === 'AUDITOR') {
            nombreRolFinal = 'AUDITOR';
          } else if (user.rol === 'Empresa' || user.rol === 'EMPRESA') {
            nombreRolFinal = 'EMPRESA';
          } else {
            nombreRolFinal = user.rol.toUpperCase();
          }
        }
        
        if (nombreRolFinal) {
          setRolUsuario(nombreRolFinal);
        }
        
        // Obtener empresa del usuario desde la tabla usuario de Supabase
        if (usuarioActual?.id_empresa) {
          const empresa = validEmpresas.find(e => e.id_empresa === usuarioActual.id_empresa);
          setEmpresaUsuario(empresa || null);
        } else if (user?.id_empresa) {
          const empresa = validEmpresas.find(e => e.id_empresa === user.id_empresa);
          setEmpresaUsuario(empresa || null);
        } else {
          setEmpresaUsuario(null);
        }
        
        // Filtrar notificaciones del usuario logueado
        const notificacionesUsuario = validNotificaciones.filter(
          notif => parseInt(notif.id_usuario, 10) === parseInt(userId, 10)
        );
        
        // Ordenar por fecha más reciente primero
        notificacionesUsuario.sort((a, b) => {
          const fechaA = new Date(a.fecha_hora || a.created_at);
          const fechaB = new Date(b.fecha_hora || b.created_at);
          return fechaB - fechaA;
        });
        
        setNotificaciones(notificacionesUsuario);
      } catch (error) {
        console.error('Error al cargar notificaciones:', error);
      }
    };

    if (user) {
      cargarNotificaciones();
      // Recargar notificaciones cada 30 segundos
      const interval = setInterval(cargarNotificaciones, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Cerrar menú móvil y notificaciones al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setIsMobileMenuOpen(false);
      }
      if (notificacionesRef.current && !notificacionesRef.current.contains(event.target)) {
        setIsNotificacionesOpen(false);
      }
    };

    if (isMobileMenuOpen || isNotificacionesOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen, isNotificacionesOpen]);

  const handleLogout = () => {
    setIsMobileMenuOpen(false);
    logout();
    navigate('/login');
  };

  const handleProfileClick = () => {
    setIsMobileMenuOpen(false);
    navigate('/perfil');
  };

  // Contar notificaciones no vistas
  const notificacionesNoVistas = notificaciones.filter(n => !n.visto).length;

  // Formatear fecha de notificación (relativa)
  const formatFechaNotificacion = (fechaString) => {
    if (!fechaString) return '';
    const fecha = new Date(fechaString);
    const ahora = new Date();
    const diffMs = ahora - fecha;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} h`;
    if (diffDays < 7) return `Hace ${diffDays} días`;
    
    const day = fecha.getDate().toString().padStart(2, '0');
    const month = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const year = fecha.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Formatear fecha y hora completa para el pie de página
  const formatFechaHoraCompleta = (fechaString) => {
    if (!fechaString) return '';
    const fecha = new Date(fechaString);
    const day = fecha.getDate().toString().padStart(2, '0');
    const month = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const year = fecha.getFullYear();
    const hours = fecha.getHours().toString().padStart(2, '0');
    const minutes = fecha.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  // Marcar notificación como vista
  const handleMarcarComoVisto = async (notificacionId, visto) => {
    try {
      // Usar el endpoint directo con ID para asegurar que funcione correctamente
      await updateInTable('notificaciones', notificacionId, { visto: visto });
      
      // Actualizar estado local
      setNotificaciones(prev => 
        prev.map(n => n.id === notificacionId ? { ...n, visto: visto } : n)
      );
      
      return true;
    } catch (error) {
      console.error('Error al actualizar notificación:', error);
      throw error;
    }
  };

  // Marcar todas como vistas
  const handleMarcarTodasComoVistas = async () => {
    try {
      const noVistas = notificaciones.filter(n => !n.visto);
      await Promise.all(
        noVistas.map(n => updateInTable('notificaciones', n.id, { visto: true }))
      );
      // Actualizar estado local
      setNotificaciones(prev => prev.map(n => ({ ...n, visto: true })));
    } catch (error) {
      console.error('Error al marcar todas como vistas:', error);
    }
  };

  return (
    <nav className="bg-gray-50 border-b border-gray-200 h-16 flex items-center justify-between px-3 sm:px-6 fixed top-0 left-0 right-0 z-50">
      {/* Lado izquierdo: Botón sidebar y Logo */}
      <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-6">
        {/* Botón para colapsar/expandir sidebar */}
        <button
          onClick={toggleSidebar}
          className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label={isCollapsed ? 'Expandir menú' : 'Colapsar menú'}
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Logo EMOP - más pequeño en móvil */}
        <div className="flex items-center">
          <img 
            src="/logo.png" 
            alt="EMOP - Ente de la Movilidad Provincial Mendoza" 
            className="h-6 sm:h-8 md:h-12 w-auto"
          />
        </div>
      </div>

      {/* Lado derecho: Notificaciones y usuario */}
      <div className="flex items-center space-x-2 sm:space-x-6">
        {/* Icono de notificaciones */}
        <div className="relative" ref={notificacionesRef}>
          <button
            onClick={() => setIsNotificacionesOpen(!isNotificacionesOpen)}
            className="relative cursor-pointer p-1 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Notificaciones"
          >
            <svg 
              className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" 
              />
            </svg>
            {/* Contador de notificaciones */}
            {notificacionesNoVistas > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-[10px] sm:text-xs">
                {notificacionesNoVistas > 9 ? '9+' : notificacionesNoVistas}
              </span>
            )}
          </button>

          {/* Dropdown de notificaciones */}
          {isNotificacionesOpen && (
            <div 
              className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden flex flex-col"
              style={{ fontFamily: 'Lato, sans-serif' }}
            >
              {/* Header del dropdown */}
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-800">Notificaciones</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setIsNotificacionesOpen(false);
                      navigate('/notificaciones');
                    }}
                    className="text-xs text-[#007C8A] hover:text-[#15A7A7] transition-colors"
                  >
                    Ver todas
                  </button>
                  {notificacionesNoVistas > 0 && (
                    <button
                      onClick={handleMarcarTodasComoVistas}
                      className="text-xs text-[#007C8A] hover:text-[#15A7A7] transition-colors"
                    >
                      Marcar todas como vistas
                    </button>
                  )}
                </div>
              </div>

              {/* Lista de notificaciones */}
              <div className="overflow-y-auto flex-1">
                {notificaciones.length === 0 ? (
                  <div className="px-4 py-8 text-center text-gray-500 text-sm">
                    No hay notificaciones
                  </div>
                ) : (
                  notificaciones.map((notif) => {
                    const nota = notif.nota || 'Sin detalles';
                    const tipoNombre = tiposNotificacion.find(t => t.id === notif.id_tipo_notificacion)?.nombre_de_notif || 'Notificación';
                    
                    // Función para formatear el contenido de la nota, destacando el estado
                    const formatearNota = (texto) => {
                      if (!texto || texto === 'Sin detalles') return texto;
                      
                      // Buscar el patrón "Estado: Preventivo" o "Estado: Correcto"
                      const regex = /(Estado:\s*)(Preventivo|Correcto)/gi;
                      const partes = [];
                      let ultimoIndice = 0;
                      let match;
                      
                      while ((match = regex.exec(texto)) !== null) {
                        // Agregar texto antes del match
                        if (match.index > ultimoIndice) {
                          partes.push({ tipo: 'texto', contenido: texto.substring(ultimoIndice, match.index) });
                        }
                        // Agregar "Estado: "
                        partes.push({ tipo: 'texto', contenido: match[1] });
                        // Agregar el estado con formato
                        const estado = match[2];
                        const color = estado.toLowerCase() === 'preventivo' ? '#FF8C00' : '#FF4444';
                        partes.push({ tipo: 'estado', contenido: estado, color });
                        ultimoIndice = regex.lastIndex;
                      }
                      
                      // Agregar texto restante
                      if (ultimoIndice < texto.length) {
                        partes.push({ tipo: 'texto', contenido: texto.substring(ultimoIndice) });
                      }
                      
                      // Si no se encontró ningún match, devolver el texto original
                      if (partes.length === 0) {
                        return texto;
                      }
                      
                      return partes.map((parte, index) => {
                        if (parte.tipo === 'estado') {
                          return (
                            <span key={index} className="font-bold" style={{ color: parte.color }}>
                              {parte.contenido}
                            </span>
                          );
                        }
                        return <span key={index}>{parte.contenido}</span>;
                      });
                    };
                    
                    // Determinar ruta según tipo de notificación
                    const getRutaNotificacion = (notif) => {
                      // Siempre navegar a la sección de notificaciones
                      return '/notificaciones';
                    };

                    const handleClickNotificacion = async (notif) => {
                      // Marcar como vista si no lo está (SIEMPRE, incluso si ya está vista)
                      try {
                        await handleMarcarComoVisto(notif.id, true);
                        // Actualizar estado local inmediatamente
                        setNotificaciones(prev => 
                          prev.map(n => n.id === notif.id ? { ...n, visto: true } : n)
                        );
                      } catch (error) {
                        console.error('Error al marcar notificación como vista:', error);
                      }
                      
                      // Cerrar dropdown
                      setIsNotificacionesOpen(false);
                      
                      // Navegar a la sección correspondiente
                      const ruta = getRutaNotificacion(notif);
                      navigate(ruta);
                    };

                    return (
                      <div
                        key={notif.id}
                        className={`px-4 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${
                          !notif.visto ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => handleClickNotificacion(notif)}
                      >
                        <div className="flex items-start gap-3">
                          {/* Indicador de no visto */}
                          {!notif.visto && (
                            <div className="w-2 h-2 bg-[#007C8A] rounded-full mt-2.5 flex-shrink-0"></div>
                          )}
                          <div className="flex-1 min-w-0">
                            {/* Tipo de notificación y fecha relativa */}
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-base font-bold text-[#007C8A]">
                                {tipoNombre}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatFechaNotificacion(notif.fecha_hora || notif.created_at)}
                              </span>
                            </div>
                            {/* Contenido de la nota (información completa de la OT) */}
                            {nota && nota !== 'Sin detalles' && (
                              <div className="mb-2">
                                <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                                  {formatearNota(nota)}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Información del usuario */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Foto de perfil */}
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-300 overflow-hidden flex items-center justify-center">
            {user?.foto ? (
              <img src={user.foto} alt={user.nombre} className="w-full h-full object-cover" />
            ) : (
              <>
                {!avatarErrored ? (
                  <img
                    src="/user-avatar.jpg"
                    alt="Avatar usuario"
                    className="w-full h-full object-cover"
                    onError={() => setAvatarErrored(true)}
                  />
                ) : (
                  <span className="text-gray-600 font-semibold text-xs sm:text-sm">
                    {user?.nombre?.charAt(0) || 'U'}
                  </span>
                )}
              </>
            )}
          </div>

          {/* Nombre y rol - oculto en móviles muy pequeños */}
          <div className="hidden md:flex flex-col">
            <span className="text-sm font-medium text-gray-800">
              {user?.nombre || 'Usuario'}
            </span>
            <div className="relative inline-block">
              <span 
                className="text-xs text-gray-500 cursor-help"
                onMouseEnter={() => {
                  if ((rolUsuario === 'EMPRESA' || rolUsuario === 'Empresa' || user?.rol === 'Empresa' || user?.rol === 'EMPRESA') && empresaUsuario) {
                    setShowTooltip(true);
                  }
                }}
                onMouseLeave={() => setShowTooltip(false)}
              >
                {(() => {
                  // Determinar el rol a mostrar
                  const rolAMostrar = rolUsuario || user?.rol || 'Usuario';
                  
                  // Si es Empresa y hay empresa asociada, mostrar con el nombre
                  if ((rolAMostrar === 'EMPRESA' || rolAMostrar === 'Empresa') && empresaUsuario) {
                    return `Empresa - ${empresaUsuario.nombre_empresa || 'N/A'}`;
                  }
                  
                  // Mapear el rol a formato de visualización
                  if (rolAMostrar === 'ADMIN' || rolAMostrar === 'ADMINISTRADOR') {
                    return 'ADMINISTRADOR';
                  } else if (rolAMostrar === 'Inspector' || rolAMostrar === 'INSPECTOR') {
                    return 'INSPECTOR';
                  } else if (rolAMostrar === 'Auditor' || rolAMostrar === 'AUDITOR') {
                    return 'AUDITOR';
                  } else if (rolAMostrar === 'Empresa' || rolAMostrar === 'EMPRESA') {
                    return 'EMPRESA';
                  } else {
                    return rolAMostrar.toUpperCase();
                  }
                })()}
              </span>
              {showTooltip && (rolUsuario === 'EMPRESA' || rolUsuario === 'Empresa' || user?.rol === 'Empresa' || user?.rol === 'EMPRESA') && empresaUsuario && (
                <div 
                  className="absolute z-50 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg whitespace-nowrap"
                  style={{
                    bottom: '100%',
                    left: '0',
                    marginBottom: '8px',
                    fontFamily: 'Lato, sans-serif'
                  }}
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                >
                  {empresaUsuario.nombre_empresa || 'N/A'}
                  <div 
                    className="absolute top-full left-4 border-4 border-transparent border-t-gray-900"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Enlaces Perfil y Cerrar sesión - oculto en móviles */}
          <div className="hidden lg:flex items-center space-x-2 ml-2">
            <button
              onClick={() => navigate('/perfil')}
              className="text-sm text-[#007C8A] hover:text-[#15A7A7] font-medium transition-colors duration-200"
            >
              Perfil
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={handleLogout}
              className="text-sm text-[#007C8A] hover:text-[#15A7A7] font-medium transition-colors duration-200"
            >
              Cerrar sesión
            </button>
          </div>

          {/* Menú dropdown para móviles */}
          <div className="lg:hidden relative" ref={mobileMenuRef}>
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Menú de usuario"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>

            {/* Menú desplegable */}
            {isMobileMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="py-1">
                  {/* Opción Perfil */}
                  <button
                    onClick={handleProfileClick}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                    style={{ fontFamily: 'Lato, sans-serif' }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Perfil
                  </button>

                  {/* Separador */}
                  <div className="border-t border-gray-200 my-1"></div>

                  {/* Opción Cerrar sesión */}
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                    style={{ fontFamily: 'Lato, sans-serif' }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Cerrar sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
