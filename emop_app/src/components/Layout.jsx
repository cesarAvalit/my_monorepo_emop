import { useState, useEffect } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useSidebar } from '../context/SidebarContext';

const Layout = ({ children }) => {
  const { isCollapsed, isMobile: contextIsMobile, isMobileOpen } = useSidebar();
  const [sidebarWidth, setSidebarWidth] = useState(isCollapsed ? 80 : 250);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (contextIsMobile) {
      // En móvil, el sidebar no ocupa espacio (está oculto o con overlay)
      setSidebarWidth(0);
    } else {
      // En desktop, funciona como antes
      setSidebarWidth(isCollapsed ? 80 : 250);
    }
  }, [isCollapsed, contextIsMobile]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f9fafb' }}>
      {/* Navbar fijo en la parte superior */}
      <Navbar />
      
      {/* Contenedor principal con sidebar y contenido */}
      <div className="flex pt-16" style={{ backgroundColor: '#f9fafb' }}>
        {/* Sidebar fijo */}
        <Sidebar />
        
        {/* Área de contenido principal */}
        <main 
          className="flex-1 transition-all duration-300 w-full"
          style={{ 
            // En móvil, el contenido siempre ocupa todo el ancho (sidebar está oculto o con overlay)
            // En desktop, el contenido se ajusta según el ancho del sidebar
            marginLeft: contextIsMobile ? '0px' : `${sidebarWidth}px`,
            padding: isMobile ? '8px' : '16px md:24px',
            maxWidth: '100%',
            overflowX: 'hidden',
            backgroundColor: '#f9fafb'
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
