import { useState, useEffect } from 'react';
import { JSON_SERVER_URL } from '../config/api';
import { getAllFromTable } from '../config/supabase';

const AuditoriaModificaciones = () => {
  const [auditoria, setAuditoria] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAuditoria, setSelectedAuditoria] = useState(null);
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  // Detectar tamaño de pantalla
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Función para formatear fecha y hora
  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds} hs`;
  };

  // Cargar datos del servidor
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Obtener datos usando Supabase (ya ordenados por fecha_hora DESC por defecto)
        const [auditoriaData, usuariosData] = await Promise.all([
          getAllFromTable('auditoria'),
          getAllFromTable('usuario')
        ]);
        
        // Validar que los datos sean arrays
        const validAuditoria = Array.isArray(auditoriaData) ? auditoriaData : [];
        const validUsuarios = Array.isArray(usuariosData) ? usuariosData : [];
        
        // Los datos ya vienen ordenados por fecha_hora DESC desde getAllFromTable
        setAuditoria(validAuditoria);
        setUsuarios(validUsuarios);
      } catch (error) {
        // Fallback en caso de error inesperado
        setAuditoria([]);
        setUsuarios([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Función para obtener el estilo del badge de acción
  const getAccionBadgeStyle = (accion) => {
    const accionUpper = accion?.toUpperCase() || '';
    
    if (accionUpper === 'CREAR' || accionUpper.includes('ALTA') || accionUpper.includes('CARGA')) {
      return {
        backgroundColor: '#22C55E',
        color: '#FFFFFF',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '600'
      };
    } else if (accionUpper === 'ASIGNAR') {
      return {
        backgroundColor: '#3B82F6',
        color: '#FFFFFF',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '600'
      };
    } else if (accionUpper === 'ACTUALIZAR' || accionUpper.includes('MODIFICACION') || accionUpper.includes('MODIFICACIÓN')) {
      return {
        backgroundColor: '#FBBF24',
        color: '#FFFFFF',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '600'
      };
    } else if (accionUpper === 'ELIMINAR') {
      return {
        backgroundColor: '#EF4444',
        color: '#FFFFFF',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '600'
      };
    } else if (accionUpper.includes('CERRADA') || accionUpper.includes('CERRAR')) {
      return {
        backgroundColor: '#6EE7B7',
        color: '#FFFFFF',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '600'
      };
    }
    
    // Default
    return {
      backgroundColor: '#9CA3AF',
      color: '#FFFFFF',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '4px 12px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '600'
    };
  };

  // Función para obtener el texto de la acción formateado
  const getAccionText = (accion, detalle) => {
    const accionUpper = accion?.toUpperCase() || '';
    const detalleUpper = detalle?.toUpperCase() || '';
    
    if (accionUpper === 'ASIGNAR') {
      if (detalleUpper.includes('INSPECTOR')) {
        return 'Asignación Inspector';
      } else if (detalleUpper.includes('AUDITOR')) {
        return 'Asignación Auditor';
      }
      return 'Asignación';
    } else if (accionUpper === 'CREAR') {
      if (detalleUpper.includes('DDJJ') || detalleUpper.includes('ORDEN DE TRABAJO') || detalleUpper.includes('CARGA DDJJ')) {
        return 'Carga DDJJ';
      } else if (detalleUpper.includes('CONDUCTOR') || detalleUpper.includes('ALTA DE CONDUCTOR')) {
        return 'Alta de conductor';
      } else if (detalleUpper.includes('USUARIO') || detalleUpper.includes('ALTA DE USUARIO')) {
        return 'Alta de usuario';
      }
      return 'Creación';
    } else if (accionUpper === 'ACTUALIZAR') {
      return 'Modificación';
    } else if (accionUpper === 'ELIMINAR') {
      return 'Eliminación';
    } else if (accionUpper === 'VER') {
      return 'Consulta';
    } else if (accionUpper.includes('CERRADA') || accionUpper.includes('CERRAR')) {
      return 'OT cerrada';
    }
    
    return accion || 'Acción';
  };

  // Validar que los datos sean arrays antes de usarlos
  const validAuditoria = Array.isArray(auditoria) ? auditoria : [];
  const validUsuarios = Array.isArray(usuarios) ? usuarios : [];

  // Función para filtrar datos por rango de fechas
  const filterByDateRange = (data) => {
    if (!fechaDesde && !fechaHasta) {
      return data;
    }

    return data.filter(aud => {
      if (!aud.fecha_hora) return false;
      
      const fechaAuditoria = new Date(aud.fecha_hora);
      fechaAuditoria.setHours(0, 0, 0, 0); // Normalizar a inicio del día
      
      let desdeDate = null;
      let hastaDate = null;
      
      if (fechaDesde) {
        desdeDate = new Date(fechaDesde);
        desdeDate.setHours(0, 0, 0, 0);
      }
      
      if (fechaHasta) {
        hastaDate = new Date(fechaHasta);
        hastaDate.setHours(23, 59, 59, 999); // Incluir todo el día hasta
      }
      
      if (desdeDate && hastaDate) {
        return fechaAuditoria >= desdeDate && fechaAuditoria <= hastaDate;
      } else if (desdeDate) {
        return fechaAuditoria >= desdeDate;
      } else if (hastaDate) {
        return fechaAuditoria <= hastaDate;
      }
      
      return true;
    });
  };

  // Filtrar datos según búsqueda
  const filteredBySearch = Array.isArray(validAuditoria) 
    ? validAuditoria.filter(aud => {
        if (!aud) return false;
        if (!searchTerm) return true;
        
        const searchLower = searchTerm.toLowerCase();
        const usuarioNombre = aud.usuario_nombre?.toLowerCase() || '';
        const idRegistro = aud.id_registro?.toString().toLowerCase() || '';
        const accion = aud.accion?.toLowerCase() || '';
        const detalle = aud.detalle?.toLowerCase() || '';
        const tipoRegistro = aud.tipo_registro?.toLowerCase() || '';
        
        // Formatear fecha y hora para búsqueda
        const fechaHoraStr = aud.fecha_hora ? new Date(aud.fecha_hora).toLocaleString('es-AR').toLowerCase() : '';
        
        return usuarioNombre.includes(searchLower) ||
               idRegistro.includes(searchLower) ||
               accion.includes(searchLower) ||
               detalle.includes(searchLower) ||
               tipoRegistro.includes(searchLower) ||
               fechaHoraStr.includes(searchLower);
      })
    : [];

  // Aplicar filtro de fechas
  const filteredData = filterByDateRange(filteredBySearch);

  // Calcular paginación con validaciones
  const safeFilteredData = Array.isArray(filteredData) ? filteredData : [];
  const safeItemsPerPage = Number.isInteger(itemsPerPage) && itemsPerPage > 0 ? itemsPerPage : 10;
  const safeCurrentPage = Number.isInteger(currentPage) && currentPage > 0 ? currentPage : 1;
  const totalPages = Math.max(1, Math.ceil(safeFilteredData.length / safeItemsPerPage));
  const startIndex = Math.max(0, (safeCurrentPage - 1) * safeItemsPerPage);
  const endIndex = Math.min(startIndex + safeItemsPerPage, safeFilteredData.length);
  const currentData = Array.isArray(safeFilteredData) 
    ? safeFilteredData.slice(startIndex, endIndex)
    : [];

  // Función para descargar reporte
  const handleDownloadReport = () => {
    // Validar que ambas fechas estén seleccionadas
    if (!fechaDesde || !fechaHasta) {
      alert('Por favor, seleccione ambas fechas (Desde y Hasta) para descargar el reporte.');
      return;
    }

    // Validar que la fecha "Hasta" sea mayor o igual a "Desde"
    if (new Date(fechaHasta) < new Date(fechaDesde)) {
      alert('La fecha "Hasta" debe ser mayor o igual a la fecha "Desde".');
      return;
    }

    // Filtrar por rango de fechas antes de generar el CSV
    const dataFiltradaPorFecha = filterByDateRange(filteredData);
    
    const headers = ['Fecha y hora', 'Usuario', 'ID de registro', 'Acción', 'Detalle'];
    const rows = dataFiltradaPorFecha.map(aud => {
      return [
        formatDateTime(aud.fecha_hora),
        aud.usuario_nombre || '',
        aud.id_registro || '',
        getAccionText(aud.accion, aud.detalle),
        aud.detalle || ''
      ];
    });
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const nombreArchivo = `auditoria-modificaciones_desde-${fechaDesde}_hasta-${fechaHasta}-${new Date().toISOString().split('T')[0]}.csv`;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', nombreArchivo);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Mostrar estado de carga
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500" style={{ fontFamily: 'Lato, sans-serif' }}>
          Cargando datos...
        </div>
      </div>
    );
  }

  return (
      <div className="w-full" style={{ fontFamily: 'Lato, sans-serif' }}>
      <div className="px-4 sm:px-6">
        {/* Header */}
        <div 
          className="bg-[#007C8A] w-full px-3 sm:px-4 lg:px-6 mb-4 sm:mb-6 rounded-lg mt-4 sm:mt-6 flex flex-col justify-center"
          style={{
            minHeight: '70px',
            paddingTop: '12px',
            paddingBottom: '12px'
          }}
        >
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1" style={{ fontFamily: 'Lato, sans-serif', lineHeight: '1.2' }}>
            Auditoria modificaciones del sistema
          </h1>
          <p className="text-white text-xs sm:text-sm font-normal" style={{ fontFamily: 'Lato, sans-serif', lineHeight: '1.2' }}>
            Registro inmutable de las acciones realizadas en el sistema
          </p>
        </div>

        {/* Contenedor de tabla */}
        <div 
          className="bg-white rounded-lg shadow-md p-4 sm:p-6"
          style={{ border: '1px solid #E5E7EB' }}
        >
          {/* Título y subtítulo */}
          <div className="mb-4">
            <h2 
              className="text-lg sm:text-xl font-bold mb-1"
              style={{ 
                color: '#1F2937',
                fontFamily: 'Lato, sans-serif'
              }}
            >
              Tabla de modificaciones
            </h2>
            <p 
              className="text-xs sm:text-sm"
              style={{ 
                color: '#6B7280',
                fontFamily: 'Lato, sans-serif'
              }}
            >
              Detalle de las acciones realizadas.
            </p>
          </div>

          {/* Contenedor con borde para rango de fechas y botón de descarga */}
          <div 
            className="rounded-lg p-3 sm:p-4 mb-4 flex flex-col sm:flex-row items-stretch sm:items-end justify-end gap-3"
            style={{ 
              border: '1px solid #9CA3AF',
              fontFamily: 'Lato, sans-serif'
            }}
          >
            {/* Rango de fechas - alineados a la derecha */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2 sm:gap-3">
              <div className="flex-1 sm:flex-initial">
                <label 
                  className="block text-xs sm:text-sm font-medium mb-1"
                  style={{ 
                    color: '#374151',
                    fontFamily: 'Lato, sans-serif'
                  }}
                >
                  Desde
                </label>
                <input
                  type="date"
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                  className="w-full sm:w-auto px-2 sm:px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007C8A] focus:border-transparent"
                  style={{ fontFamily: 'Lato, sans-serif', fontSize: isMobile ? '13px' : '14px', minWidth: isMobile ? '100%' : '150px' }}
                  required
                />
              </div>
              <div className="flex-1 sm:flex-initial">
                <label 
                  className="block text-xs sm:text-sm font-medium mb-1"
                  style={{ 
                    color: '#374151',
                    fontFamily: 'Lato, sans-serif'
                  }}
                >
                  Hasta
                </label>
                <input
                  type="date"
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.target.value)}
                  min={fechaDesde || undefined}
                  className="w-full sm:w-auto px-2 sm:px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007C8A] focus:border-transparent"
                  style={{ fontFamily: 'Lato, sans-serif', fontSize: isMobile ? '13px' : '14px', minWidth: isMobile ? '100%' : '150px' }}
                  required
                />
              </div>
            </div>

            {/* Botón de descarga - pegado a los inputs */}
            <button
              onClick={handleDownloadReport}
              disabled={!fechaDesde || !fechaHasta}
              className="px-3 sm:px-4 py-2 bg-[#007C8A] text-white rounded-lg shadow-md hover:bg-[#005A63] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
              style={{ fontFamily: 'Lato, sans-serif', fontWeight: 'bold', fontSize: isMobile ? '12px' : '14px' }}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span className="hidden sm:inline">Descargar reporte</span>
              <span className="sm:hidden">Descargar</span>
            </button>
          </div>

          {/* Input de búsqueda */}
          <div className="mb-4">
            <div className="w-full sm:max-w-xs lg:max-w-md">
              <label 
                htmlFor="search-auditoria"
                className="block text-xs sm:text-sm font-medium mb-1"
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  color: '#374151'
                }}
              >
                Buscar
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="search-auditoria"
                  placeholder="Ingrese su búsqueda"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 sm:px-4 py-2 pl-8 sm:pl-10 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#007C8A] focus:border-transparent"
                  style={{ 
                    fontFamily: 'Lato, sans-serif',
                    fontSize: isMobile ? '13px' : '14px'
                  }}
                />
                <svg 
                  className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400"
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Tabla */}
          <div className="overflow-x-auto -mx-3 sm:-mx-4 md:mx-0 w-full">
            <div className="inline-block min-w-full align-middle">
              {!Array.isArray(currentData) || currentData.length === 0 ? (
                <div className="text-center py-8 text-gray-500" style={{ fontFamily: 'Lato, sans-serif' }}>
                  {isLoading ? 'Cargando datos...' : 'No se encontraron registros de auditoría'}
                </div>
              ) : (
                <table className="w-full min-w-[800px]" style={{ fontFamily: 'Lato, sans-serif' }}>
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap" style={{ fontSize: '12px', color: '#374151' }}>Fecha y hora</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap" style={{ fontSize: '12px', color: '#374151' }}>Usuario</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap" style={{ fontSize: '12px', color: '#374151' }}>ID registro</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap" style={{ fontSize: '12px', color: '#374151' }}>Acción</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap" style={{ fontSize: '12px', color: '#374151' }}>Detalle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(currentData) && currentData.map((aud, index) => {
                      if (!aud || typeof aud !== 'object') return null;
                      try {
                        const accionStyle = getAccionBadgeStyle(aud.accion);
                        const accionText = getAccionText(aud.accion, aud.detalle);
                        const uniqueKey = aud.id_auditoria || `aud-${index}`;
                        
                        return (
                          <tr key={uniqueKey} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-2 sm:py-3 px-2 sm:px-4" style={{ fontSize: '12px', color: '#374151' }}>
                              {aud.fecha_hora ? formatDateTime(aud.fecha_hora) : '-'}
                            </td>
                            <td className="py-2 sm:py-3 px-2 sm:px-4" style={{ fontSize: '12px', color: '#374151' }}>
                              {aud.usuario_nombre || '-'}
                            </td>
                            <td className="py-2 sm:py-3 px-2 sm:px-4" style={{ fontSize: '12px', color: '#374151', textAlign: 'left' }}>
                              {aud.id_registro || '-'}
                            </td>
                            <td className="py-2 sm:py-3 px-2 sm:px-4">
                              <span className="whitespace-nowrap" style={accionStyle}>
                                <svg className="w-3 h-3 sm:w-4 sm:h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="ml-1">{accionText}</span>
                              </span>
                            </td>
                            <td className="py-2 sm:py-3 px-2 sm:px-4">
                              <button
                                onClick={() => {
                                  setSelectedAuditoria(aud);
                                  setShowDetailModal(true);
                                }}
                                className="flex items-center gap-1 text-[#007C8A] hover:text-[#005A63] transition-colors"
                                title="Ver detalles"
                              >
                                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        );
                      } catch (error) {
                        console.warn('Error al renderizar fila de auditoría:', error);
                        return null;
                      }
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Paginación */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm text-gray-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                Mostrar
              </span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border border-gray-300 rounded px-2 py-1 text-xs sm:text-sm"
                style={{ fontFamily: 'Lato, sans-serif' }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-xs sm:text-sm text-gray-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                de {safeFilteredData.length} registros
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={safeCurrentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                style={{ fontFamily: 'Lato, sans-serif' }}
              >
                Anterior
              </button>
              <span className="text-xs sm:text-sm text-gray-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                Página {currentPage} de {totalPages || 1}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-3 py-1 border border-gray-300 rounded text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                style={{ fontFamily: 'Lato, sans-serif' }}
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de detalle */}
      {showDetailModal && selectedAuditoria && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backgroundColor: 'rgba(0, 124, 138, 0.5)' }}
          onClick={() => {
            setShowDetailModal(false);
            setSelectedAuditoria(null);
          }}
        >
          <div 
            className="bg-white modal-content rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            data-modal="true"
            id="modal-detalle-auditoria"
            onClick={(e) => e.stopPropagation()}
            style={{ 
              fontFamily: 'Lato, sans-serif', 
              backgroundColor: '#FFFFFF',
              background: '#FFFFFF',
              backgroundImage: 'none',
              backgroundClip: 'padding-box'
            }}
          >
            {/* Header del modal */}
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 
                className="text-xl font-bold"
                style={{ 
                  color: '#1F2937'
                }}
              >
                Detalle de la acción
              </h3>
              <p 
                className="text-sm mt-1"
                style={{ 
                  color: '#6B7280'
                }}
              >
                Información completa del registro de auditoría
              </p>
            </div>

            {/* Contenido del modal */}
            <div className="px-6 py-6">
              <div className="space-y-4">
                <div>
                  <p 
                    className="text-sm font-medium mb-1"
                    style={{ 
                      color: '#6B7280'
                    }}
                  >
                    Fecha y hora:
                  </p>
                  <p 
                    className="text-base font-semibold"
                    style={{ 
                      color: '#1F2937'
                    }}
                  >
                    {selectedAuditoria?.fecha_hora ? formatDateTime(selectedAuditoria.fecha_hora) : '-'}
                  </p>
                </div>

                <div>
                  <p 
                    className="text-sm font-medium mb-1"
                    style={{ 
                      color: '#6B7280'
                    }}
                  >
                    Usuario:
                  </p>
                  <p 
                    className="text-base font-semibold"
                    style={{ 
                      color: '#1F2937'
                    }}
                  >
                    {selectedAuditoria.usuario_nombre || '-'}
                  </p>
                </div>

                <div>
                  <p 
                    className="text-sm font-medium mb-1"
                    style={{ 
                      color: '#6B7280'
                    }}
                  >
                    ID de registro:
                  </p>
                  <p 
                    className="text-base font-semibold"
                    style={{ 
                      color: '#1F2937'
                    }}
                  >
                    {selectedAuditoria.id_registro || '-'}
                  </p>
                </div>

                <div>
                  <p 
                    className="text-sm font-medium mb-1"
                    style={{ 
                      color: '#6B7280'
                    }}
                  >
                    Acción:
                  </p>
                  <span style={getAccionBadgeStyle(selectedAuditoria?.accion)}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {getAccionText(selectedAuditoria?.accion, selectedAuditoria?.detalle)}
                  </span>
                </div>

                <div>
                  <p 
                    className="text-sm font-medium mb-1"
                    style={{ 
                      color: '#6B7280'
                    }}
                  >
                    Detalle:
                  </p>
                  <p 
                    className="text-base"
                    style={{ 
                      color: '#1F2937',
                      lineHeight: '1.6'
                    }}
                  >
                    {selectedAuditoria.detalle || '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer del modal */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedAuditoria(null);
                }}
                className="px-6 py-2 rounded-lg shadow-md transition-all hover:shadow-lg"
                style={{
                  backgroundColor: '#007C8A',
                  color: '#FFFFFF',
                  fontFamily: 'Lato, sans-serif',
                  fontWeight: 'bold',
                  fontSize: '14px'
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditoriaModificaciones;
