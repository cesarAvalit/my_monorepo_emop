import { createContext, useContext, useState, useEffect } from 'react';

// Definición de roles del sistema
export const ROLES = {
  ADMINISTRADOR: 'ADMINISTRADOR',
  AUDITOR: 'AUDITOR',
  INSPECTOR: 'INSPECTOR',
  EMPRESA: 'EMPRESA'
};

// Contexto de autenticación
const AuthContext = createContext(null);

// Hook personalizado para usar el contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

// Provider del contexto
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar usuario desde localStorage al iniciar
  useEffect(() => {
    const storedUser = localStorage.getItem('emop_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error al cargar usuario desde localStorage:', error);
        localStorage.removeItem('emop_user');
      }
    }
    setIsLoading(false);
  }, []);

  // Función de login
  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('emop_user', JSON.stringify(userData));
  };

  // Función de logout
  const logout = () => {
    setUser(null);
    localStorage.removeItem('emop_user');
  };

  // Verificar si el usuario tiene un rol específico
  const hasRole = (role) => {
    return user?.rol === role;
  };

  // Verificar si el usuario tiene alguno de los roles especificados
  const hasAnyRole = (roles) => {
    return roles.includes(user?.rol);
  };

  const value = {
    user,
    isLoading,
    login,
    logout,
    hasRole,
    hasAnyRole,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
