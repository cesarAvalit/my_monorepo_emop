import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAllFromTable, updateInTable } from '../config/supabase';
import { useNavigate } from 'react-router-dom';

const Perfil = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [roles, setRoles] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [empresaUsuario, setEmpresaUsuario] = useState(null);
  const [avatarErrored, setAvatarErrored] = useState(false);
  const fileInputRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);
  const [toast, setToast] = useState(null);
  const [showTooltip, setShowTooltip] = useState(false);

  const [formData, setFormData] = useState({
    rol: '',
    telefono: '',
    email: '',
    nombrePerfil: '',
    foto: null // Para la nueva imagen seleccionada
  });

  const [originalData, setOriginalData] = useState({});

  // Detectar tamaño de pantalla
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Cargar datos del usuario y roles
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        if (!user?.id) {
          setIsLoading(false);
          return;
        }

        // Obtener roles y empresas
        const [rolesData, empresasData] = await Promise.all([
          getAllFromTable('rol'),
          getAllFromTable('empresa')
        ]);
        setRoles(Array.isArray(rolesData) ? rolesData : []);
        setEmpresas(Array.isArray(empresasData) ? empresasData : []);

        // Obtener datos completos del usuario desde Supabase
        const usuariosData = await getAllFromTable('usuario');
        const usuarioCompleto = usuariosData.find(u => u.id_usuario === user.id);
        
        // Obtener empresa del usuario si tiene id_empresa
        if (usuarioCompleto?.id_empresa) {
          const empresa = empresasData.find(e => e.id_empresa === usuarioCompleto.id_empresa);
          setEmpresaUsuario(empresa || null);
        } else if (user?.id_empresa) {
          const empresa = empresasData.find(e => e.id_empresa === user.id_empresa);
          setEmpresaUsuario(empresa || null);
        } else {
          setEmpresaUsuario(null);
        }

        if (usuarioCompleto) {
          // Obtener nombre del rol
          const rolData = rolesData.find(r => r.id_rol === usuarioCompleto.id_rol);
          const nombreRol = rolData?.nombre || '';

          const initialData = {
            rol: nombreRol,
            telefono: usuarioCompleto.telefono || '',
            email: usuarioCompleto.email || user.email || '',
            nombrePerfil: usuarioCompleto.nombre_completo || user.nombre || '',
            foto: user.foto || null
          };

          setFormData(initialData);
          setOriginalData(initialData);
        } else {
          // Si no se encuentra en Supabase, usar datos del contexto
          const rolData = rolesData.find(r => r.id_rol === user.id_rol);
          const nombreRol = rolData?.nombre || user.rol || '';

          const initialData = {
            rol: nombreRol,
            telefono: '',
            email: user.email || '',
            nombrePerfil: user.nombre || '',
            foto: user.foto || null
          };

          setFormData(initialData);
          setOriginalData(initialData);
        }
      } catch (error) {
        console.error('Error al cargar datos del perfil:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Manejar cambio de imagen
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        setToast({
          type: 'error',
          title: 'Error al cargar imagen',
          message: 'Por favor, selecciona un archivo de imagen válido'
        });
        setTimeout(() => setToast(null), 5000);
        return;
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setToast({
          type: 'error',
          title: 'Error al cargar imagen',
          message: 'La imagen no debe superar los 5MB'
        });
        setTimeout(() => setToast(null), 5000);
        return;
      }

      // Crear URL temporal para previsualización
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          foto: reader.result // Base64 o URL temporal
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Manejar clic en el icono de edición de foto
  const handleEditPhotoClick = () => {
    fileInputRef.current?.click();
  };

  // Manejar cancelar
  const handleCancel = () => {
    setFormData(originalData);
    navigate('/home');
  };

  // Verificar si hay cambios (excluyendo la foto para comparación)
  const hasChanges = 
    formData.telefono !== originalData.telefono ||
    formData.email !== originalData.email ||
    formData.nombrePerfil !== originalData.nombrePerfil ||
    formData.foto !== originalData.foto;

  // Manejar guardar
  const handleSave = async () => {
    try {
      setIsSaving(true);

      if (!user?.id) {
        setToast({
          type: 'error',
          title: 'Error al guardar',
          message: 'No se pudo identificar al usuario'
        });
        setTimeout(() => setToast(null), 5000);
        return;
      }

      // Preparar datos para actualizar
      const updateData = {
        nombre_completo: formData.nombrePerfil,
        telefono: formData.telefono,
        email: formData.email,
        updated_at: new Date().toISOString()
      };

      // Actualizar en Supabase
      await updateInTable('usuario', user.id, updateData);

      // Actualizar el contexto de autenticación con los nuevos datos
      const updatedUser = {
        ...user,
        nombre: formData.nombrePerfil,
        email: formData.email,
        telefono: formData.telefono,
        foto: formData.foto
      };

      login(updatedUser);

      // Actualizar originalData para reflejar los cambios guardados
      setOriginalData({
        ...formData
      });

      // Mostrar mensaje de éxito
      setToast({
        type: 'success',
        title: 'Perfil actualizado',
        message: 'Perfil actualizado correctamente'
      });
      setTimeout(() => {
        setToast(null);
        navigate('/home');
      }, 2000);
    } catch (error) {
      console.error('Error al guardar perfil:', error);
      setToast({
        type: 'error',
        title: 'Error al guardar',
        message: 'Error al guardar el perfil. Por favor, intenta nuevamente.'
      });
      setTimeout(() => setToast(null), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p style={{ fontFamily: 'Lato, sans-serif', color: '#374151' }}>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="w-full" style={{ fontFamily: 'Lato, sans-serif' }}>
      <div className="px-3 sm:px-4 md:px-6 w-full pt-20">
        {/* Banner */}
        <div 
          className="bg-[#007C8A] w-full mb-6 sm:mb-8 rounded-lg mt-4 sm:mt-6"
          style={{
            minHeight: '70px',
            paddingTop: '12px',
            paddingBottom: '12px',
            paddingLeft: isMobile ? '12px' : '16px',
            paddingRight: isMobile ? '12px' : '16px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}
        >
          <h1 
            className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1"
            style={{ 
              color: '#FFFFFF',
              fontFamily: 'Lato, sans-serif',
              lineHeight: '1.2'
            }}
          >
            ¡Bienvenido a tu perfil {user?.nombre?.split(' ')[0] || 'Usuario'}!
          </h1>
          <p 
            className="text-sm sm:text-base"
            style={{ 
              color: 'rgba(255,255,255,0.9)',
              fontFamily: 'Lato, sans-serif'
            }}
          >
            Revisa el detalle de tu perfil
          </p>
        </div>

        {/* Contenido principal */}
        <div className="flex flex-col items-center">
          {/* Foto de perfil */}
          <div className="relative mb-4">
            <div 
              className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gray-300 overflow-hidden flex items-center justify-center"
              style={{ border: '3px solid #FFFFFF', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
            >
              {formData.foto ? (
                <img 
                  src={formData.foto} 
                  alt={formData.nombrePerfil || 'Usuario'} 
                  className="w-full h-full object-cover"
                  onError={() => setAvatarErrored(true)}
                />
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
                    <span 
                      className="text-gray-600 font-semibold"
                      style={{ fontSize: '48px' }}
                    >
                      {formData.nombrePerfil?.charAt(0)?.toUpperCase() || user?.nombre?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  )}
                </>
              )}
            </div>
            {/* Icono de edición */}
            <button
              onClick={handleEditPhotoClick}
              className="absolute bottom-0 right-0 bg-[#007C8A] rounded-full p-2 shadow-lg hover:bg-[#005a63] transition-colors"
              style={{ border: '3px solid #FFFFFF' }}
            >
              <svg 
                className="w-4 h-4 sm:w-5 sm:h-5 text-white" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" 
                />
              </svg>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>

          {/* Nombre completo */}
          <h2 
            className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8"
            style={{ color: '#007C8A' }}
          >
            {formData.nombrePerfil || user?.nombre || 'Usuario'}
          </h2>

          {/* Formulario */}
          <div 
            className="bg-white rounded-lg shadow-md w-full max-w-4xl p-6 sm:p-8"
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Columna izquierda */}
              <div className="space-y-6">
                {/* Rol */}
                <div>
                  <label 
                    className="block text-sm font-medium mb-2"
                    style={{ color: '#374151' }}
                  >
                    Rol
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.rol}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                      style={{ fontFamily: 'Lato, sans-serif' }}
                    />
                    {formData.rol === 'Empresa' && empresaUsuario && (
                      <div 
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        onMouseEnter={() => setShowTooltip(true)}
                        onMouseLeave={() => setShowTooltip(false)}
                      >
                        <span 
                          className="text-xs text-gray-500 cursor-help underline decoration-dotted"
                          style={{ pointerEvents: 'auto' }}
                        >
                          {empresaUsuario.nombre_empresa || 'N/A'}
                        </span>
                        {showTooltip && (
                          <div 
                            className="absolute z-50 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg whitespace-nowrap"
                            style={{
                              bottom: '100%',
                              right: '0',
                              marginBottom: '8px',
                              fontFamily: 'Lato, sans-serif'
                            }}
                          >
                            {empresaUsuario.nombre_empresa || 'N/A'}
                            <div 
                              className="absolute top-full right-4 border-4 border-transparent border-t-gray-900"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Teléfono */}
                <div>
                  <label 
                    className="block text-sm font-medium mb-2"
                    style={{ color: '#374151' }}
                  >
                    Teléfono
                  </label>
                  <input
                    type="text"
                    value={formData.telefono}
                    onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007C8A] focus:border-transparent"
                    style={{ fontFamily: 'Lato, sans-serif', color: '#374151' }}
                    placeholder="261 6124569"
                  />
                </div>
              </div>

              {/* Columna derecha */}
              <div className="space-y-6">
                {/* E-mail */}
                <div>
                  <label 
                    className="block text-sm font-medium mb-2"
                    style={{ color: '#374151' }}
                  >
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007C8A] focus:border-transparent"
                    style={{ fontFamily: 'Lato, sans-serif', color: '#374151' }}
                    placeholder="domingoc@emop.com.ar"
                  />
                </div>

                {/* Nombre de perfil */}
                <div>
                  <label 
                    className="block text-sm font-medium mb-2"
                    style={{ color: '#374151' }}
                  >
                    Nombre de perfil
                  </label>
                  <input
                    type="text"
                    value={formData.nombrePerfil}
                    onChange={(e) => setFormData(prev => ({ ...prev, nombrePerfil: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007C8A] focus:border-transparent"
                    style={{ fontFamily: 'Lato, sans-serif', color: '#374151' }}
                    placeholder="Carlos Domingo"
                  />
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="px-6 py-2 rounded-lg font-medium transition-colors border-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  borderColor: '#007C8A',
                  color: '#007C8A',
                  backgroundColor: '#FFFFFF',
                  fontFamily: 'Lato, sans-serif'
                }}
                onMouseEnter={(e) => {
                  if (!isSaving) {
                    e.target.style.backgroundColor = '#F0FDFA';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSaving) {
                    e.target.style.backgroundColor = '#FFFFFF';
                  }
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !hasChanges}
                className="px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: isSaving || !hasChanges ? '#E5E7EB' : '#007C8A',
                  color: isSaving || !hasChanges ? '#374151' : '#FFFFFF',
                  fontFamily: 'Lato, sans-serif'
                }}
                onMouseEnter={(e) => {
                  if (!isSaving && hasChanges) {
                    e.target.style.backgroundColor = '#005a63';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSaving && hasChanges) {
                    e.target.style.backgroundColor = '#007C8A';
                  }
                }}
              >
                {isSaving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Toast de notificaciones - Estilo unificado del sitio */}
      {toast && (
        <div 
          className="fixed top-4 right-4 z-[9999] rounded-lg shadow-lg p-5 max-w-md animate-slide-in"
          style={{
            backgroundColor: toast.type === 'success' ? '#007C8A' : toast.type === 'error' ? '#EF4444' : toast.type === 'warning' ? '#FFC107' : '#007C8A',
            fontFamily: 'Lato, sans-serif',
            minWidth: '400px',
            maxWidth: '500px',
            animation: 'slideIn 0.3s ease-out',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)'
          }}
        >
          <div className="flex items-start gap-4">
            {/* Icono en círculo */}
            <div 
              className="rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                width: '48px',
                height: '48px'
              }}
            >
              {toast.type === 'success' && (
                <svg className="w-7 h-7" fill="none" stroke="#FFFFFF" viewBox="0 0 24 24" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 13l4 4L19 7" />
                </svg>
              )}
              {toast.type === 'error' && (
                <svg className="w-7 h-7" fill="none" stroke="#FFFFFF" viewBox="0 0 24 24" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              {toast.type === 'warning' && (
                <svg className="w-7 h-7" fill="none" stroke="#FFFFFF" viewBox="0 0 24 24" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
              {(!toast.type || toast.type === 'info') && (
                <svg className="w-7 h-7" fill="none" stroke="#FFFFFF" viewBox="0 0 24 24" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            
            {/* Contenido del toast */}
            <div className="flex-1 pt-1">
              {toast.title && (
                <h4 
                  className="font-bold mb-2"
                  style={{ 
                    color: '#FFFFFF',
                    fontSize: '18px',
                    lineHeight: '1.3',
                    fontFamily: 'Lato, sans-serif'
                  }}
                >
                  {toast.title}
                </h4>
              )}
              <p 
                className="text-sm leading-relaxed"
                style={{ 
                  color: '#FFFFFF',
                  fontSize: '14px',
                  lineHeight: '1.4',
                  fontFamily: 'Lato, sans-serif'
                }}
              >
                {toast.message}
              </p>
            </div>
            
            {/* Botón de cerrar */}
            <button
              onClick={() => setToast(null)}
              className="flex-shrink-0 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors p-1"
              style={{
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              aria-label="Cerrar"
            >
              <svg className="w-5 h-5" fill="none" stroke="#FFFFFF" viewBox="0 0 24 24" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <style>{`
            @keyframes slideIn {
              from {
                transform: translateX(100%);
                opacity: 0;
              }
              to {
                transform: translateX(0);
                opacity: 1;
              }
            }
            .animate-slide-in {
              animation: slideIn 0.3s ease-out;
            }
          `}</style>
        </div>
      )}
    </div>
  );
};

export default Perfil;

