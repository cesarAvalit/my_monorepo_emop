import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AltaUsuarios = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombreCompleto: '',
    telefono: '',
    dni: '',
    empresa: '',
    rol: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Aquí iría la lógica para guardar el usuario
    console.log('Datos del formulario:', formData);
    // Por ahora solo navegamos de vuelta
    // navigate('/home');
  };

  const handleCancel = () => {
    navigate('/home');
  };

  return (
    <div className="w-full">
      {/* Header con fondo teal */}
      <div 
        className="bg-[#007C8A] w-full px-6 mb-6 rounded-lg flex flex-col justify-center"
        style={{
          height: '82px'
        }}
      >
        <h1 className="text-3xl font-bold text-white mb-1" style={{ fontFamily: 'Lato, sans-serif', lineHeight: '1.2' }}>
          Alta de usuarios
        </h1>
        <p className="text-white text-sm font-normal" style={{ fontFamily: 'Lato, sans-serif', lineHeight: '1.2' }}>
          Formulario para dar de alta nuevos usuarios al sistema
        </p>
      </div>

      {/* Contenedor principal con fondo gris claro */}
      <div className="flex items-center justify-center py-12">
        {/* Contenedor del formulario - 885px x 457px */}
        <div 
          className="bg-white rounded-lg shadow-md border border-gray-200 mx-auto"
          style={{
            width: '885px',
            minHeight: '457px',
            padding: '32px'
          }}
        >
          {/* Título y subtítulo del formulario */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-2" style={{ fontFamily: 'Lato, sans-serif' }}>
              Nuevo usuario
            </h2>
            <p className="text-sm text-gray-600" style={{ fontFamily: 'Lato, sans-serif' }}>
              Completa el formulario de registro
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit}>
            <div className="space-y-6 mb-8">
              {/* Fila 1: Nombre completo y Teléfono */}
              <div className="grid grid-cols-2 gap-6">
                {/* Nombre completo */}
                <div>
                  <label 
                    htmlFor="nombreCompleto" 
                    className="block text-sm font-medium text-gray-700 mb-2"
                    style={{ fontFamily: 'Lato, sans-serif' }}
                  >
                    Nombre completo
                  </label>
                  <input
                    type="text"
                    id="nombreCompleto"
                    name="nombreCompleto"
                    value={formData.nombreCompleto}
                    onChange={handleChange}
                    placeholder="Orlando Salathiel Salazar Hernández"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007C8A] focus:border-transparent"
                    style={{ 
                      fontFamily: 'Lato, sans-serif',
                      fontSize: '14px',
                      color: '#374151'
                    }}
                  />
                </div>

                {/* Teléfono */}
                <div>
                  <label 
                    htmlFor="telefono" 
                    className="block text-sm font-medium text-gray-700 mb-2"
                    style={{ fontFamily: 'Lato, sans-serif' }}
                  >
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    id="telefono"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    placeholder="12 3456 7890"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007C8A] focus:border-transparent"
                    style={{ 
                      fontFamily: 'Lato, sans-serif',
                      fontSize: '14px',
                      color: '#374151'
                    }}
                  />
                </div>
              </div>

              {/* Fila 2: DNI y Empresa */}
              <div className="grid grid-cols-2 gap-6">
                {/* DNI */}
                <div>
                  <label 
                    htmlFor="dni" 
                    className="block text-sm font-medium text-gray-700 mb-2"
                    style={{ fontFamily: 'Lato, sans-serif' }}
                  >
                    DNI
                  </label>
                  <input
                    type="text"
                    id="dni"
                    name="dni"
                    value={formData.dni}
                    onChange={handleChange}
                    placeholder="23456786543"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007C8A] focus:border-transparent"
                    style={{ 
                      fontFamily: 'Lato, sans-serif',
                      fontSize: '14px',
                      color: '#374151'
                    }}
                  />
                </div>

                {/* Empresa */}
                <div>
                  <label 
                    htmlFor="empresa" 
                    className="block text-sm font-medium text-gray-700 mb-2"
                    style={{ fontFamily: 'Lato, sans-serif' }}
                  >
                    Empresa
                  </label>
                  <input
                    type="text"
                    id="empresa"
                    name="empresa"
                    value={formData.empresa}
                    onChange={handleChange}
                    placeholder="Empresa 01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007C8A] focus:border-transparent"
                    style={{ 
                      fontFamily: 'Lato, sans-serif',
                      fontSize: '14px',
                      color: '#374151'
                    }}
                  />
                </div>
              </div>

              {/* Fila 3: Rol (en negrita) */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label 
                    htmlFor="rol" 
                    className="block text-sm font-bold text-gray-700 mb-2"
                    style={{ fontFamily: 'Lato, sans-serif' }}
                  >
                    Rol
                  </label>
                  <div className="relative">
                    <select
                      id="rol"
                      name="rol"
                      value={formData.rol}
                      onChange={handleChange}
                      className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007C8A] focus:border-transparent appearance-none bg-white"
                      style={{ 
                        fontFamily: 'Lato, sans-serif',
                        fontSize: '14px',
                        color: formData.rol ? '#374151' : '#9CA3AF'
                      }}
                    >
                      <option value="">Seleccionar rol</option>
                      <option value="administrador">Administrador</option>
                      <option value="usuario">Usuario</option>
                      <option value="operador">Operador</option>
                    </select>
                    {/* Icono de chevron para el select */}
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div></div>
              </div>
            </div>

            {/* Botones */}
            <div className="flex justify-center gap-4">
              <button
                type="button"
                onClick={handleCancel}
                className="px-8 py-2 border-2 border-[#007C8A] text-[#007C8A] rounded-lg font-medium hover:bg-[#007C8A] hover:text-white transition-colors"
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  fontSize: '14px'
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-8 py-2 bg-[#007C8A] text-white rounded-lg font-medium hover:bg-[#15A7A7] transition-colors"
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  fontSize: '14px'
                }}
              >
                Guardar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AltaUsuarios;



