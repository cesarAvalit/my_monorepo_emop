import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { isCollapsed, isMobile, isMobileOpen, collapseSidebar } = useSidebar();
  
  // Determinar si el usuario es de tipo Empresa (id_rol: 2), Inspector (id_rol: 3) o Auditor (id_rol: 4)
  const isEmpresaUser = user?.id_rol === 2;
  const isInspectorUser = user?.id_rol === 3;
  const isAuditorUser = user?.id_rol === 4;

  // Menú para usuarios Empresa: "Inicio" y "Nuevos DDJJ"
  const menuItemsEmpresa = [
    {
      id: 'inicio',
      label: 'Inicio',
      path: '/home',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      id: 'nuevos-ddjj',
      label: 'Nuevos DDJJ',
      path: '/nuevos-ddjj-form',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
  ];

  // Menú para usuarios Inspector: "Home" y "Asignación de DDJJ"
  const menuItemsInspector = [
    {
      id: 'inicio',
      label: 'Home',
      path: '/home',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      id: 'asignacion-ddjj',
      label: 'Asignación de DDJJ',
      path: '/asignacion-ddjj',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
  ];

  // Menú para usuarios Auditor: "Inicio" y "Explorador de Auditorías"
  const menuItemsAuditor = [
    {
      id: 'inicio',
      label: 'Inicio',
      path: '/home',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      id: 'explorador-auditorias',
      label: 'Explorador de Auditorías',
      path: '/explorador-auditorias',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
  ];

  // Menú completo para otros usuarios (Admin, Auditor)
  const menuItemsCompleto = [
    {
      id: 'inicio',
      label: 'Inicio',
      path: '/home',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      id: 'auditoria-modificaciones',
      label: 'Auditoria de modificaciones',
      path: '/auditoria-modificaciones',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      id: 'reportes-ddjj',
      label: 'Reportes DDJJ',
      path: '/reportes-ddjj',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
  ];

  // Seleccionar el menú según el tipo de usuario
  const menuItems = isEmpresaUser 
    ? menuItemsEmpresa 
    : isInspectorUser 
    ? menuItemsInspector 
    : isAuditorUser
    ? menuItemsAuditor
    : menuItemsCompleto;

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  // En móvil, el sidebar está oculto por defecto y aparece con push
  // En desktop, funciona como antes (colapsado/expandido)
  const sidebarWidth = isMobile ? '250px' : (isCollapsed ? '80px' : '250px');
  const sidebarTransform = isMobile 
    ? (isMobileOpen ? 'translateX(0)' : 'translateX(-100%)')
    : 'translateX(0)';

  return (
    <>
      {/* Overlay claro en móvil cuando el sidebar está abierto */}
      {isMobile && isMobileOpen && (
        <div
          className="fixed inset-0 z-40 transition-opacity duration-300"
          onClick={collapseSidebar}
          style={{
            top: '64px', // Debajo del navbar
            backgroundColor: 'rgba(249, 250, 251, 0.7)' // Fondo gris claro con transparencia
          }}
        />
      )}

    <aside 
        className="bg-white border-r border-gray-200 fixed left-0 top-16 bottom-0 overflow-y-auto transition-all duration-300 z-50"
      style={{
          width: sidebarWidth,
          transform: sidebarTransform,
        paddingTop: '40px',
        paddingBottom: '40px',
        paddingLeft: '0px',
          paddingRight: '0px',
          boxShadow: isMobile && isMobileOpen ? '2px 0 8px rgba(0,0,0,0.15)' : 'none'
      }}
    >
      <nav 
        className="flex flex-col"
        style={{
          gap: '32px',
          alignItems: 'stretch'
        }}
      >
        {/* Items principales */}
        {menuItems.map((item) => {
          const active = isActive(item.path);
          
          return (
            <button
              key={item.id}
              onClick={() => {
                navigate(item.path);
                // En móvil, cerrar el sidebar después de navegar
                if (isMobile) {
                  collapseSidebar();
                }
              }}
              className={`
                w-full flex items-center transition-colors relative group
                ${active 
                  ? 'bg-[#E0F7FA]' 
                  : 'bg-white hover:bg-gray-50'
                }
              `}
              style={{
                padding: '0px',
                minHeight: '48px'
              }}
              title={(isMobile ? false : isCollapsed) ? item.label : ''}
            >
              {/* Barra vertical turquesa para elemento activo */}
              {active && (
                <div 
                  className="absolute left-0 top-0 bottom-0"
                  style={{
                    width: '4px',
                    backgroundColor: '#007C8A'
                  }}
                ></div>
              )}
              
              {/* Contenedor del contenido */}
              <div 
                className="flex items-center" 
                style={{ 
                  gap: (isMobile ? false : isCollapsed) ? '0px' : '12px', 
                  width: '100%', 
                  paddingLeft: (isMobile ? false : isCollapsed) ? '0px' : (active ? '20px' : '24px'),
                  paddingRight: (isMobile ? false : isCollapsed) ? '0px' : '24px',
                  justifyContent: (isMobile ? false : isCollapsed) ? 'center' : 'flex-start',
                  position: 'relative'
                }}
              >
                {/* Icono */}
                <span style={{ 
                  color: active ? '#007C8A' : '#374151',
                  display: 'flex',
                  alignItems: 'center',
                  flexShrink: 0,
                  width: '20px',
                  height: '20px',
                  justifyContent: 'center'
                }}>
                  {item.icon}
                </span>
                
                {/* Texto - visible cuando no está colapsado (o en móvil siempre visible cuando está abierto) */}
                {(!isMobile && !isCollapsed) || (isMobile && isMobileOpen) ? (
                <span 
                    className="text-sm font-medium whitespace-nowrap"
                  style={{ 
                    color: active ? '#007C8A' : '#374151',
                      fontFamily: 'Lato, sans-serif',
                      textAlign: 'left'
                  }}
                >
                  {item.label}
                </span>
                ) : null}

                {/* Tooltip cuando está colapsado (solo en desktop) */}
                {!isMobile && isCollapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                    {item.label}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </nav>
    </aside>
    </>
  );
};

export default Sidebar;
