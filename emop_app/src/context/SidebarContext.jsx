import { createContext, useContext, useState, useEffect } from 'react';

const SidebarContext = createContext(null);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar debe ser usado dentro de un SidebarProvider');
  }
  return context;
};

export const SidebarProvider = ({ children }) => {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });

  // En móviles, el sidebar empieza oculto (no visible)
  // En desktop, empieza colapsado si es móvil inicialmente
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768 ? false : false; // En móvil no colapsado, en desktop no colapsado por defecto
    }
    return false;
  });

  // Estado para controlar si el sidebar está abierto en móvil
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Detectar cambios en el tamaño de pantalla
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      // Si cambia de móvil a desktop, cerrar el sidebar móvil
      if (!mobile && isMobileOpen) {
        setIsMobileOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobileOpen]);

  const toggleSidebar = () => {
    if (isMobile) {
      // En móvil, toggle del estado de apertura
      setIsMobileOpen(prev => !prev);
    } else {
      // En desktop, toggle del estado de colapso
      setIsCollapsed(prev => !prev);
    }
  };

  const collapseSidebar = () => {
    if (isMobile) {
      setIsMobileOpen(false);
    } else {
      setIsCollapsed(true);
    }
  };

  const expandSidebar = () => {
    if (isMobile) {
      setIsMobileOpen(true);
    } else {
      setIsCollapsed(false);
    }
  };

  return (
    <SidebarContext.Provider value={{
      isCollapsed,
      isMobile,
      isMobileOpen,
      toggleSidebar,
      collapseSidebar,
      expandSidebar
    }}>
      {children}
    </SidebarContext.Provider>
  );
};

export default SidebarContext;
