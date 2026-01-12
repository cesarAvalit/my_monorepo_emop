import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAllFromTable, updateInTable } from '../config/supabase';

const Notificaciones = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notificaciones, setNotificaciones] = useState([]);
  const [tiposNotificacion, setTiposNotificacion] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const cargarDatos = async () => {
      const userId = user?.id || user?.id_usuario;
      if (!userId) return;

      try {
        setIsLoading(true);
        const [todasNotificaciones, tiposNotifData, empresasData] = await Promise.all([
          getAllFromTable('notificaciones'),
          getAllFromTable('tipo_notificacion'),
          getAllFromTable('empresa')
        ]);

        const validNotificaciones = Array.isArray(todasNotificaciones) ? todasNotificaciones : [];
        const validTiposNotif = Array.isArray(tiposNotifData) ? tiposNotifData : [];
        const validEmpresas = Array.isArray(empresasData) ? empresasData : [];

        setTiposNotificacion(validTiposNotif);
        setEmpresas(validEmpresas);

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
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      cargarDatos();
    }
  }, [user]);

  // Formatear fecha relativa
  const formatFechaRelativa = (fechaString) => {
    if (!fechaString) return '';
    const fecha = new Date(fechaString);
    const ahora = new Date();
    const diffMs = ahora - fecha;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Hace menos de un minuto';
    if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
    
    const day = fecha.getDate().toString().padStart(2, '0');
    const month = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const year = fecha.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Obtener icono según tipo de notificación
  const getIconoNotificacion = (tipoNombre) => {
    const tipoLower = (tipoNombre || '').toLowerCase();
    
    // Icono azul para reportes/DDJJ
    if (tipoLower.includes('reporte') || tipoLower.includes('ddjj') || tipoLower.includes('mnt')) {
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#2196F3' }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    }
    
    // Icono naranja para mantenimiento/inspecciones/asignaciones
    if (tipoLower.includes('asignacion') || tipoLower.includes('mantenimiento') || tipoLower.includes('inspeccion')) {
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#FF8C00' }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    }
    
    // Icono por defecto
    return (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#6B7280' }}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    );
  };

  // Determinar ruta según tipo de notificación
  // Siempre navegar a la sección de notificaciones
  const getRutaNotificacion = (notif) => {
    return '/notificaciones';
  };

  // Manejar click en notificación
  const handleClickNotificacion = async (notif) => {
    // Marcar como vista SIEMPRE (incluso si ya está vista, para asegurar que se actualice)
    try {
      // Usar el endpoint directo con ID para asegurar que funcione
      await updateInTable('notificaciones', notif.id, { visto: true });
      
      // Actualizar estado local inmediatamente
      setNotificaciones(prev =>
        prev.map(n => n.id === notif.id ? { ...n, visto: true } : n)
      );
    } catch (error) {
      console.error('Error al marcar notificación como vista:', error);
      // Continuar con la navegación incluso si hay error
    }

    // Navegar a la sección correspondiente
    const ruta = getRutaNotificacion(notif);
    navigate(ruta);
  };

  // Filtrar notificaciones por búsqueda
  const notificacionesFiltradas = notificaciones.filter(notif => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    
    const tipoNombre = tiposNotificacion.find(t => t.id === notif.id_tipo_notificacion)?.nombre_de_notif || '';
    const nota = notif.nota || '';
    
    // Buscar en nombre de empresa (extraer de la nota si es posible)
    const empresaMatch = empresas.some(emp => {
      const nombreEmpresa = (emp.nombre_empresa || '').toLowerCase();
      return nombreEmpresa.includes(searchLower) && nota.toLowerCase().includes(nombreEmpresa);
    });
    
    return (
      tipoNombre.toLowerCase().includes(searchLower) ||
      nota.toLowerCase().includes(searchLower) ||
      empresaMatch
    );
  });

  // Formatear texto de notificación
  const formatearTextoNotificacion = (nota) => {
    if (!nota) return '';
    
    // Si contiene información de orden de trabajo (N OT:)
    if (nota.includes('N OT:')) {
      // Extraer número de orden
      const match = nota.match(/N OT:\s*([^,]+)/i);
      if (match) {
        const nroOT = match[1].trim();
        // Buscar si hay referencia a MNT
        const mntMatch = nota.match(/MNT[-\s]?(\d{4}[-]\d+)/i);
        if (mntMatch) {
          return `Cargaste un nuevo reporte ${mntMatch[0]}`;
        }
        // Si no hay MNT, usar el formato de asignación
        const matriculaMatch = nota.match(/Matrícula:\s*([^,]+)/i);
        const tipoMantMatch = nota.match(/Estado:\s*(\w+)/i);
        if (matriculaMatch && tipoMantMatch) {
          const matricula = matriculaMatch[1].trim();
          const tipoMant = tipoMantMatch[1].trim().toLowerCase();
          if (tipoMant === 'preventivo') {
            return `Móvil ${matricula} mantenimiento preventivo se te ha asignado para inspección.`;
          }
        }
        return `Cargaste un nuevo reporte ${nroOT}`;
      }
    }
    
    // Si contiene "Cargaste un nuevo reporte" o referencia a MNT
    if (nota.toLowerCase().includes('cargaste') || nota.toLowerCase().includes('reporte') || nota.toLowerCase().includes('mnt')) {
      const match = nota.match(/MNT[-\s]?(\d{4}[-]\d+)/i);
      if (match) {
        return `Cargaste un nuevo reporte ${match[0]}`;
      }
      // Buscar número de orden alternativo
      const otMatch = nota.match(/(\d{4}[-]\d+)/);
      if (otMatch) {
        return `Cargaste un nuevo reporte MNT ${otMatch[1]}`;
      }
    }
    
    // Si contiene información de asignación
    if (nota.toLowerCase().includes('asignado') || nota.toLowerCase().includes('móvil') || nota.toLowerCase().includes('matrícula')) {
      // Extraer matrícula y tipo de mantenimiento
      const matriculaMatch = nota.match(/Matrícula:\s*([^,]+)/i) || nota.match(/([A-Z]{3}[-]?\d{3})/i);
      const mantenimientoMatch = nota.match(/mantenimiento\s+(\w+)/i) || nota.match(/Estado:\s*(\w+)/i);
      
      if (matriculaMatch && mantenimientoMatch) {
        const matricula = matriculaMatch[1].trim();
        const tipoMant = mantenimientoMatch[1].trim().toLowerCase();
        if (tipoMant === 'preventivo') {
          return `Móvil ${matricula} mantenimiento preventivo se te ha asignado para inspección.`;
        }
        return `Móvil ${matricula} mantenimiento ${tipoMant} se te ha asignado para inspección.`;
      }
    }
    
    return nota;
  };

  // Detectar tamaño de pantalla
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="w-full" style={{ fontFamily: 'Lato, sans-serif' }}>
      <div className="px-3 sm:px-4 md:px-6 w-full">
        {/* Header */}
        <div 
          className="bg-[#007C8A] w-full px-3 sm:px-6 mb-4 sm:mb-6 rounded-lg mt-4 sm:mt-6 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 relative"
          style={{
            minHeight: '70px',
            paddingTop: '12px',
            paddingBottom: '12px'
          }}
        >
          <button
            onClick={() => navigate('/home')}
            className="rounded-full flex items-center justify-center transition-all hover:opacity-80 cursor-pointer flex-shrink-0"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              width: isMobile ? '32px' : '40px',
              height: isMobile ? '32px' : '40px'
            }}
          >
            <svg className={isMobile ? "w-5 h-5" : "w-6 h-6"} fill="none" stroke="white" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1" style={{ fontFamily: 'Lato, sans-serif', lineHeight: '1.2' }}>
              Notificaciones
            </h1>
            <p className="text-white text-xs sm:text-sm font-normal" style={{ fontFamily: 'Lato, sans-serif', lineHeight: '1.2' }}>
              Revisa el detalle de las notificaciones del sistema
            </p>
          </div>
        </div>

        {/* Input de búsqueda */}
        <div className="mb-4 sm:mb-6 flex justify-end">
          <div style={{ width: isMobile ? '100%' : '300px' }}>
            <label 
              className="block text-xs sm:text-sm font-medium text-gray-700 mb-1"
              style={{ fontFamily: 'Lato, sans-serif' }}
            >
              Buscar empresa
            </label>
            <div className="relative">
              <svg 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 pointer-events-none"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Empresa de transporte 01"
                className="w-full pl-9 sm:pl-10 pr-4 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#007C8A] focus:border-transparent"
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  fontSize: isMobile ? '13px' : '14px'
                }}
              />
            </div>
          </div>
        </div>

        {/* Card de notificaciones */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 
              className="text-xl font-bold text-gray-800"
              style={{ fontFamily: 'Lato, sans-serif' }}
            >
              Notificaciones importantes
            </h2>
          </div>

          {/* Lista de notificaciones */}
          <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
            {isLoading ? (
              <div className="px-6 py-12 text-center text-gray-500">
                Cargando notificaciones...
              </div>
            ) : notificacionesFiltradas.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-500">
                {searchTerm ? 'No se encontraron notificaciones con ese criterio' : 'No hay notificaciones'}
              </div>
            ) : (
              notificacionesFiltradas.map((notif) => {
                const tipoNombre = tiposNotificacion.find(t => t.id === notif.id_tipo_notificacion)?.nombre_de_notif || 'Notificación';
                const textoNotificacion = formatearTextoNotificacion(notif.nota);
                const estaFijada = false; // Por ahora, todas están sin fijar excepto la primera
                const esPrimera = notificacionesFiltradas.indexOf(notif) === 0;

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleClickNotificacion(notif)}
                    className={`px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer flex items-start gap-4 ${
                      !notif.visto ? 'bg-blue-50' : ''
                    }`}
                  >
                    {/* Icono */}
                    <div className="flex-shrink-0 mt-1">
                      {getIconoNotificacion(tipoNombre)}
                    </div>

                    {/* Contenido */}
                    <div className="flex-1 min-w-0">
                      <p 
                        className="text-sm text-gray-800 mb-1"
                        style={{ fontFamily: 'Lato, sans-serif' }}
                      >
                        {textoNotificacion}
                      </p>
                      <p 
                        className="text-xs text-gray-500"
                        style={{ fontFamily: 'Lato, sans-serif' }}
                      >
                        {formatFechaRelativa(notif.fecha_hora || notif.created_at)}
                      </p>
                    </div>

                    {/* Icono de pin */}
                    <div className="flex-shrink-0">
                      <svg 
                        className="w-5 h-5"
                        fill="currentColor" 
                        viewBox="0 0 24 24"
                        style={{ color: (esPrimera || estaFijada) ? '#2196F3' : '#9CA3AF' }}
                      >
                        <path d="M16 12V4H17V2H7V4H8V12L6 14V16H11.2V22H12.8V16H18V14L16 12Z" />
                      </svg>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notificaciones;

