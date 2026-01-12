import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAllFromTable } from '../config/supabase';

const DDJJRegistradas = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ordenesTrabajo, setOrdenesTrabajo] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [tiposMantenimiento, setTiposMantenimiento] = useState([]);
  const [conductores, setConductores] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  // Función para convertir fecha de formato dd/mm/yyyy a yyyy-mm-dd (para input type="date")
  const convertToDateInputFormat = (dateString) => {
    if (!dateString) return '';
    const parsed = parseDateFromInput(dateString);
    return parsed || '';
  };
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isMobile, setIsMobile] = useState(false);
  const [showConductorModal, setShowConductorModal] = useState(false);
  const [selectedConductor, setSelectedConductor] = useState(null);

  // Determinar si el usuario es de tipo Empresa (id_rol: 2)
  const isEmpresaUser = user?.id_rol === 2;
  const idEmpresaUsuario = user?.id_empresa;

  // Detectar tamaño de pantalla
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Función para formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Función para formatear número con separadores de miles
  const formatNumber = (num) => {
    if (!num && num !== 0) return '-';
    return new Intl.NumberFormat('es-AR').format(num);
  };

  // Función para convertir fecha de formato yyyy-mm-dd a dd/mm/yyyy
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Función para convertir fecha de formato dd/mm/yyyy a yyyy-mm-dd
  const parseDateFromInput = (dateString) => {
    if (!dateString) return '';
    const parts = dateString.split('/');
    if (parts.length !== 3) return '';
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];
    return `${year}-${month}-${day}`;
  };

  // Cargar datos del servidor
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Obtener datos usando Supabase
        const [ordenesData, vehiculosData, tiposData, conductoresData] = await Promise.all([
          getAllFromTable('orden_trabajo'),
          getAllFromTable('vehiculo'),
          getAllFromTable('tipo_mantenimiento'),
          getAllFromTable('conductor')
        ]);
        
        // Validar que los datos sean arrays
        let validOrdenes = Array.isArray(ordenesData) ? ordenesData : [];
        let validVehiculos = Array.isArray(vehiculosData) ? vehiculosData : [];
        const validTipos = Array.isArray(tiposData) ? tiposData : [];
        const validConductores = Array.isArray(conductoresData) ? conductoresData : [];

        // Si el usuario es de tipo Empresa, filtrar por su empresa
        if (isEmpresaUser && idEmpresaUsuario) {
          validVehiculos = validVehiculos.filter(v => v.id_empresa === idEmpresaUsuario);
          validOrdenes = validOrdenes.filter(o => {
            const vehiculoOrden = validVehiculos.find(v => v.id_vehiculo === o.id_vehiculo);
            return vehiculoOrden !== undefined;
          });
        }
        
        setOrdenesTrabajo(validOrdenes);
        setVehiculos(validVehiculos);
        setTiposMantenimiento(validTipos);
        setConductores(validConductores);
      } catch (error) {
        console.error('Error al cargar datos:', error);
        setOrdenesTrabajo([]);
        setVehiculos([]);
        setTiposMantenimiento([]);
        setConductores([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isEmpresaUser, idEmpresaUsuario]);

  // Validar que todos los datos sean arrays antes de usarlos
  const validOrdenes = Array.isArray(ordenesTrabajo) ? ordenesTrabajo : [];
  const validVehiculos = Array.isArray(vehiculos) ? vehiculos : [];
  const validTipos = Array.isArray(tiposMantenimiento) ? tiposMantenimiento : [];
  const validConductores = Array.isArray(conductores) ? conductores : [];

  // Calcular métricas
  // Total de DDJJ: órdenes completadas
  const totalDDJJ = validOrdenes.filter(o => o.estado === 'Completada').length;

  // Calcular tendencia del mes anterior para Total de DDJJ
  const ahora = new Date();
  const mesActualInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  mesActualInicio.setHours(0, 0, 0, 0);
  const mesAnteriorInicio = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
  mesAnteriorInicio.setHours(0, 0, 0, 0);
  const mesAnteriorFin = new Date(ahora.getFullYear(), ahora.getMonth(), 0, 23, 59, 59);

  const ddjjMesActual = validOrdenes.filter(o => {
    if (o.estado !== 'Completada') return false;
    if (!o.fecha_generacion) return false;
    const fecha = new Date(o.fecha_generacion);
    fecha.setHours(0, 0, 0, 0);
    return fecha >= mesActualInicio;
  }).length;

  const ddjjMesAnterior = validOrdenes.filter(o => {
    if (o.estado !== 'Completada') return false;
    if (!o.fecha_generacion) return false;
    const fecha = new Date(o.fecha_generacion);
    fecha.setHours(0, 0, 0, 0);
    return fecha >= mesAnteriorInicio && fecha <= mesAnteriorFin;
  }).length;

  let ddjjTendencia = null;
  if (ddjjMesAnterior > 0) {
    const cambio = ((ddjjMesActual - ddjjMesAnterior) / ddjjMesAnterior) * 100;
    ddjjTendencia = {
      porcentaje: Math.abs(cambio).toFixed(1),
      esPositiva: cambio >= 0
    };
  } else if (ddjjMesAnterior === 0 && ddjjMesActual > 0) {
    ddjjTendencia = {
      porcentaje: '100',
      esPositiva: true
    };
  } else if (ddjjMesAnterior === 0 && ddjjMesActual === 0) {
    // Si no hay datos en ningún mes, mostrar 0%
    ddjjTendencia = {
      porcentaje: '0',
      esPositiva: true
    };
  }

  // Mantenimientos preventivos
  const mantenimientosPreventivos = validOrdenes.filter(ot => {
    const tipo = validTipos.find(t => t.id_tipo === ot.id_tipo_mantenimiento);
    return tipo?.descripcion === 'Preventivo' && ot.estado === 'Completada';
  }).length;

  // Mantenimientos correctivos
  const mantenimientosCorrectivos = validOrdenes.filter(ot => {
    const tipo = validTipos.find(t => t.id_tipo === ot.id_tipo_mantenimiento);
    return tipo?.descripcion === 'Correctivo' && ot.estado === 'Completada';
  }).length;

  // Calcular tendencia para mantenimientos correctivos
  const correctivosMesActual = validOrdenes.filter(ot => {
    const tipo = validTipos.find(t => t.id_tipo === ot.id_tipo_mantenimiento);
    if (tipo?.descripcion !== 'Correctivo' || ot.estado !== 'Completada') return false;
    if (!ot.fecha_generacion) return false;
    const fecha = new Date(ot.fecha_generacion);
    fecha.setHours(0, 0, 0, 0);
    return fecha >= mesActualInicio;
  }).length;

  const correctivosMesAnterior = validOrdenes.filter(ot => {
    const tipo = validTipos.find(t => t.id_tipo === ot.id_tipo_mantenimiento);
    if (tipo?.descripcion !== 'Correctivo' || ot.estado !== 'Completada') return false;
    if (!ot.fecha_generacion) return false;
    const fecha = new Date(ot.fecha_generacion);
    fecha.setHours(0, 0, 0, 0);
    return fecha >= mesAnteriorInicio && fecha <= mesAnteriorFin;
  }).length;

  let correctivosTendencia = null;
  if (correctivosMesAnterior > 0) {
    const cambio = ((correctivosMesActual - correctivosMesAnterior) / correctivosMesAnterior) * 100;
    correctivosTendencia = {
      porcentaje: Math.abs(cambio).toFixed(1),
      esPositiva: cambio >= 0
    };
  } else if (correctivosMesAnterior === 0 && correctivosMesActual > 0) {
    correctivosTendencia = {
      porcentaje: '100',
      esPositiva: true
    };
  } else if (correctivosMesAnterior === 0 && correctivosMesActual === 0) {
    // Si no hay datos en ningún mes, mostrar 0%
    correctivosTendencia = {
      porcentaje: '0',
      esPositiva: true
    };
  }

  // Porcentaje de preventivos sobre total
  const totalMantenimientos = mantenimientosPreventivos + mantenimientosCorrectivos;
  const porcentajePreventivos = totalMantenimientos > 0 
    ? ((mantenimientosPreventivos / totalMantenimientos) * 100).toFixed(0)
    : 0;

  // Preparar datos de la tabla (solo órdenes completadas)
  const datosTabla = validOrdenes
    .filter(o => o.estado === 'Completada')
    .map(orden => {
      const vehiculo = validVehiculos.find(v => v.id_vehiculo === orden.id_vehiculo);
      const tipo = validTipos.find(t => t.id_tipo === orden.id_tipo_mantenimiento);
      const conductor = validConductores.find(c => c.id_conductor === orden.id_conductor);
      
      // Generar ID DDJJ (formato: MNT-YYYY-NNNNN)
      const fechaGen = orden.fecha_generacion ? new Date(orden.fecha_generacion) : new Date();
      const anio = fechaGen.getFullYear();
      const numero = String(orden.id_orden).padStart(5, '0');
      const idDDJJ = `MNT-${anio}-${numero}`;

      // Determinar el estado según el tipo de mantenimiento
      let estadoMostrar = 'N/A';
      if (tipo?.descripcion === 'Preventivo') {
        estadoMostrar = 'Preventivo';
      } else if (tipo?.descripcion === 'Correctivo') {
        estadoMostrar = 'Correcto';
      }

      return {
        id_orden: orden.id_orden,
        idDDJJ,
        interno: vehiculo?.interno || 'N/A',
        fechaIngreso: orden.fecha_generacion,
        fechaEgreso: orden.fecha_egreso,
        odometro: orden.odometro || 0,
        horometro: orden.horometro || 0,
        id_conductor: orden.id_conductor,
        conductor: conductor ? `${conductor.nombre} ${conductor.apellido}` : 'N/A',
        estado: estadoMostrar,
        tipoMantenimiento: tipo?.descripcion || 'N/A'
      };
    });

  // Función para filtrar datos por rango de fechas
  const filterByDateRange = (data) => {
    if (!fechaDesde && !fechaHasta) {
      return data;
    }

    return data.filter(item => {
      if (!item.fechaIngreso) return false;
      
      const fechaIngreso = new Date(item.fechaIngreso);
      fechaIngreso.setHours(0, 0, 0, 0); // Normalizar a inicio del día
      
      let desdeDate = null;
      let hastaDate = null;
      
      if (fechaDesde) {
        const parsedDesde = parseDateFromInput(fechaDesde);
        if (parsedDesde) {
          desdeDate = new Date(parsedDesde);
          desdeDate.setHours(0, 0, 0, 0);
        }
      }
      
      if (fechaHasta) {
        const parsedHasta = parseDateFromInput(fechaHasta);
        if (parsedHasta) {
          hastaDate = new Date(parsedHasta);
          hastaDate.setHours(23, 59, 59, 999); // Incluir todo el día hasta
        }
      }
      
      if (desdeDate && hastaDate) {
        return fechaIngreso >= desdeDate && fechaIngreso <= hastaDate;
      } else if (desdeDate) {
        return fechaIngreso >= desdeDate;
      } else if (hastaDate) {
        return fechaIngreso <= hastaDate;
      }
      
      return true;
    });
  };

  // Filtrar datos según búsqueda
  const filteredBySearch = datosTabla.filter(item => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    
    // Formatear fechas para búsqueda
    const fechaIngresoStr = item.fechaIngreso ? new Date(item.fechaIngreso).toLocaleDateString('es-AR').toLowerCase() : '';
    const fechaEgresoStr = item.fechaEgreso ? new Date(item.fechaEgreso).toLocaleDateString('es-AR').toLowerCase() : '';
    
    // Formatear números para búsqueda
    const odometroStr = item.odometro ? item.odometro.toString().toLowerCase() : '';
    const horometroStr = item.horometro ? item.horometro.toString().toLowerCase() : '';
    
    // Obtener estado
    const estadoStr = item.estado?.toLowerCase() || '';
    
    return (
      item.idDDJJ?.toLowerCase().includes(searchLower) ||
      item.interno?.toLowerCase().includes(searchLower) ||
      fechaIngresoStr.includes(searchLower) ||
      fechaEgresoStr.includes(searchLower) ||
      odometroStr.includes(searchLower) ||
      horometroStr.includes(searchLower) ||
      item.conductor?.toLowerCase().includes(searchLower) ||
      estadoStr.includes(searchLower)
    );
  });

  // Aplicar filtro de fechas
  const filteredData = filterByDateRange(filteredBySearch);

  // Calcular paginación
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  // Función para obtener estilo del badge de estado basado en el tipo de mantenimiento
  const getEstadoBadgeStyle = (tipoMantenimiento) => {
    if (!tipoMantenimiento || tipoMantenimiento === 'N/A') {
      return {
        backgroundColor: '#F3F4F6',
        color: '#6B7280',
        border: '1px solid #6B7280'
      };
    }
    
    const tipo = tipoMantenimiento.toString().trim();
    
    if (tipo === 'Preventivo') {
      return {
        backgroundColor: '#E0F7F7',
        color: '#4CAF50',
        border: '1px solid #4CAF50'
      };
    } else if (tipo === 'Correctivo') {
      return {
        backgroundColor: '#FFEDED',
        color: '#E07B7B',
        border: '1px solid #E07B7B'
      };
    }
    
    // Tipo desconocido
    return {
      backgroundColor: '#F3F4F6',
      color: '#6B7280',
      border: '1px solid #6B7280'
    };
  };

  // Función para descargar reporte
  const handleDownloadReport = () => {
    // Validar que ambas fechas estén seleccionadas
    if (!fechaDesde || !fechaHasta) {
      alert('Por favor, seleccione ambas fechas (Desde y Hasta) para descargar el reporte.');
      return;
    }

    // Validar formato de fechas
    const parsedDesde = parseDateFromInput(fechaDesde);
    const parsedHasta = parseDateFromInput(fechaHasta);
    
    if (!parsedDesde || !parsedHasta) {
      alert('Por favor, ingrese fechas válidas en formato dd/mm/aaaa.');
      return;
    }

    // Validar que la fecha "Hasta" sea mayor o igual a "Desde"
    const desdeDate = new Date(parsedDesde);
    const hastaDate = new Date(parsedHasta);
    
    if (hastaDate < desdeDate) {
      alert('La fecha "Hasta" debe ser mayor o igual a la fecha "Desde".');
      return;
    }

    // Filtrar por rango de fechas antes de generar el CSV
    const dataFiltradaPorFecha = filterByDateRange(filteredBySearch);
    
    // Preparar datos para el CSV
    const headers = [
      'ID DDJJ',
      'Interno',
      'Fecha de Ingreso',
      'Fecha de Egreso',
      'Odómetro',
      'Horómetro',
      'Conductor',
      'Estado'
    ];
    
    const rows = dataFiltradaPorFecha.map(item => {
      return [
        item.idDDJJ || 'N/A',
        item.interno || 'N/A',
        formatDate(item.fechaIngreso),
        formatDate(item.fechaEgreso),
        item.odometro ? `${formatNumber(item.odometro)} km` : 'N/A',
        item.horometro ? `${formatNumber(item.horometro)} hs` : 'N/A',
        item.conductor || 'N/A',
        item.estado || 'N/A'
      ];
    });
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => {
        // Escapar comillas y comas en el contenido
        const cellStr = String(cell || '').replace(/"/g, '""');
        return `"${cellStr}"`;
      }).join(','))
    ].join('\n');
    
    // Agregar BOM para Excel (UTF-8)
    const BOM = '\uFEFF';
    const csvContentWithBOM = BOM + csvContent;
    
    // Usar las fechas en formato yyyy-mm-dd para el nombre del archivo
    const nombreArchivo = `reporte-ddjj-registradas_desde-${parsedDesde}_hasta-${parsedHasta}-${new Date().toISOString().split('T')[0]}.csv`;
    
    const blob = new Blob([csvContentWithBOM], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', nombreArchivo);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Función para ver detalles del conductor
  const handleViewConductor = (conductorId) => {
    const conductor = validConductores.find(c => c.id_conductor === conductorId);
    if (conductor) {
      setSelectedConductor(conductor);
      setShowConductorModal(true);
    }
  };

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
    <div className="w-full">
      <div className="px-3 sm:px-4 md:px-6 w-full">
        {/* Header */}
        <div 
          className="bg-[#007C8A] w-full px-3 sm:px-4 md:px-6 mb-4 sm:mb-6 rounded-lg mt-4 sm:mt-6 flex items-center gap-3 sm:gap-4"
          style={{
            minHeight: '70px',
            paddingTop: '12px',
            paddingBottom: '12px'
          }}
        >
          {/* Icono circular con plus */}
          <div 
            className="flex items-center justify-center flex-shrink-0 rounded-full"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              width: isMobile ? '40px' : '48px',
              height: isMobile ? '40px' : '48px'
            }}
          >
            <svg className={isMobile ? "w-5 h-5" : "w-6 h-6"} fill="none" stroke="white" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1" style={{ fontFamily: 'Lato, sans-serif', lineHeight: '1.2' }}>
              DDJJ registradas
            </h1>
            <p className="text-white text-xs sm:text-sm font-normal" style={{ fontFamily: 'Lato, sans-serif', lineHeight: '1.2' }}>
              Consulta los reportes generados en el sistema
            </p>
          </div>
        </div>

        {/* Tarjetas de métricas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6 w-full">
          {/* Tarjeta 1: Total de DDJJ */}
          <div 
            className="bg-white rounded-lg shadow-md relative w-full"
            style={{
              minHeight: '120px',
              padding: isMobile ? '16px' : '24px'
            }}
          >
            <h3 
              className="mb-2 sm:mb-4" 
              style={{ 
                fontFamily: 'Lato, sans-serif',
                fontWeight: 'bold',
                fontSize: isMobile ? '16px' : '18px',
                lineHeight: '150%',
                letterSpacing: '0%',
                color: '#008080',
                textAlign: 'center',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              Total de DDJJ
            </h3>
            <div className="flex items-center justify-center gap-2">
              <p 
                className="font-bold" 
                style={{ 
                  color: '#000000',
                  fontSize: isMobile ? '24px' : '32px',
                  lineHeight: '1'
                }}
              >
                {formatNumber(totalDDJJ)}
              </p>
              <div 
                className="rounded-full flex items-center justify-center flex-shrink-0" 
                style={{ 
                  backgroundColor: '#E6FFE6',
                  width: isMobile ? '32px' : '40px',
                  height: isMobile ? '32px' : '40px'
                }}
              >
                <svg className={isMobile ? "w-5 h-5" : "w-6 h-6"} viewBox="0 0 24 24" fill="none">
                  {/* Documento con esquina doblada - contorno */}
                  <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="#90EE90" strokeWidth="1.5" fill="none"/>
                  {/* Esquina doblada */}
                  <path d="M14 2V8H20" stroke="#90EE90" strokeWidth="1.5" fill="none"/>
                  {/* Dos líneas horizontales dentro del documento */}
                  <line x1="7" y1="12" x2="15" y2="12" stroke="#90EE90" strokeWidth="1.5" strokeLinecap="round"/>
                  <line x1="7" y1="16" x2="15" y2="16" stroke="#90EE90" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
            </div>
            {/* Indicador de tendencia */}
            {ddjjTendencia && (
              <div className="flex items-center justify-center gap-1 mt-2">
                <svg 
                  className={isMobile ? "w-4 h-4" : "w-5 h-5"} 
                  fill="none" 
                  stroke={ddjjTendencia.esPositiva ? '#10B981' : '#EF4444'} 
                  viewBox="0 0 24 24" 
                  strokeWidth={2}
                  style={{ transform: ddjjTendencia.esPositiva ? 'none' : 'rotate(180deg)' }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span 
                  style={{ 
                    color: ddjjTendencia.esPositiva ? '#10B981' : '#EF4444',
                    fontSize: isMobile ? '12px' : '14px',
                    fontWeight: '500',
                    fontFamily: 'Lato, sans-serif'
                  }}
                >
                  {ddjjTendencia.esPositiva ? '+' : '-'}{ddjjTendencia.porcentaje}%
                </span>
                <span 
                  style={{ 
                    color: '#6B7280',
                    fontSize: isMobile ? '11px' : '13px',
                    fontFamily: 'Lato, sans-serif',
                    marginLeft: '4px'
                  }}
                >
                  Respecto al mes anterior
                </span>
              </div>
            )}
          </div>

          {/* Tarjeta 2: Mantenimientos preventivos */}
          <div 
            className="bg-white rounded-lg shadow-md relative w-full"
            style={{
              minHeight: '120px',
              padding: isMobile ? '16px' : '24px'
            }}
          >
            <h3 
              className="mb-2 sm:mb-4" 
              style={{ 
                fontFamily: 'Lato, sans-serif',
                fontWeight: 'bold',
                fontSize: isMobile ? '16px' : '18px',
                lineHeight: '150%',
                letterSpacing: '0%',
                color: '#008080',
                textAlign: 'center',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              Mantenimientos preventivos
            </h3>
            <div className="flex items-center justify-center gap-2">
              <p 
                className="font-bold" 
                style={{ 
                  color: '#000000',
                  fontSize: isMobile ? '24px' : '32px',
                  lineHeight: '1'
                }}
              >
                {formatNumber(mantenimientosPreventivos)}
              </p>
              <div 
                className="rounded-full flex items-center justify-center flex-shrink-0" 
                style={{ 
                  backgroundColor: '#E6F3FF',
                  width: isMobile ? '32px' : '40px',
                  height: isMobile ? '32px' : '40px'
                }}
              >
                <svg className={isMobile ? "w-5 h-5" : "w-6 h-6"} fill="none" stroke="#4A90E2" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
            <p 
              className="text-center mt-2"
              style={{ 
                color: '#6B7280',
                fontSize: isMobile ? '12px' : '14px',
                fontFamily: 'Lato, sans-serif'
              }}
            >
              {porcentajePreventivos}% del total de mantenimientos
            </p>
          </div>

          {/* Tarjeta 3: Mantenimientos correctivos */}
          <div 
            className="bg-white rounded-lg shadow-md relative w-full"
            style={{
              minHeight: '120px',
              padding: isMobile ? '16px' : '24px'
            }}
          >
            <h3 
              className="mb-2 sm:mb-4" 
              style={{ 
                fontFamily: 'Lato, sans-serif',
                fontWeight: 'bold',
                fontSize: isMobile ? '16px' : '18px',
                lineHeight: '150%',
                letterSpacing: '0%',
                color: '#008080',
                textAlign: 'center',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              Mantenimientos correctivos
            </h3>
            <div className="flex items-center justify-center gap-2">
              <p 
                className="font-bold" 
                style={{ 
                  color: '#000000',
                  fontSize: isMobile ? '24px' : '32px',
                  lineHeight: '1'
                }}
              >
                {formatNumber(mantenimientosCorrectivos)}
              </p>
              <div 
                className="rounded-full flex items-center justify-center flex-shrink-0" 
                style={{ 
                  backgroundColor: '#FFE6E6',
                  width: isMobile ? '32px' : '40px',
                  height: isMobile ? '32px' : '40px'
                }}
              >
                <svg className={isMobile ? "w-5 h-5" : "w-6 h-6"} fill="none" stroke="#FF6F6F" viewBox="0 0 24 24" strokeWidth={2}>
                  {/* Primera llave */}
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  {/* Segunda llave cruzada (rotada 90 grados) */}
                  <g transform="rotate(90 12 12)">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </g>
                </svg>
              </div>
            </div>
            {/* Indicador de tendencia */}
            {correctivosTendencia && (
              <div className="flex items-center justify-center gap-1 mt-2">
                <svg 
                  className={isMobile ? "w-4 h-4" : "w-5 h-5"} 
                  fill="none" 
                  stroke={correctivosTendencia.esPositiva ? '#10B981' : '#EF4444'} 
                  viewBox="0 0 24 24" 
                  strokeWidth={2}
                  style={{ transform: correctivosTendencia.esPositiva ? 'none' : 'rotate(180deg)' }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span 
                  style={{ 
                    color: correctivosTendencia.esPositiva ? '#10B981' : '#EF4444',
                    fontSize: isMobile ? '12px' : '14px',
                    fontWeight: '500',
                    fontFamily: 'Lato, sans-serif'
                  }}
                >
                  {correctivosTendencia.esPositiva ? '+' : '-'}{correctivosTendencia.porcentaje}%
                </span>
                <span 
                  style={{ 
                    color: '#6B7280',
                    fontSize: isMobile ? '11px' : '13px',
                    fontFamily: 'Lato, sans-serif',
                    marginLeft: '4px'
                  }}
                >
                  Respecto al mes anterior
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Tabla de DDJJ */}
        <div 
          className="bg-white rounded-lg shadow-md"
          style={{
            border: '1px solid #B3E5FC',
            padding: isMobile ? '12px' : '24px'
          }}
        >
          {/* Título y subtítulo */}
          <div className="mb-4 sm:mb-6">
            <h2 
              className="text-lg sm:text-xl font-bold mb-1 sm:mb-2"
              style={{ 
                fontFamily: 'Lato, sans-serif',
                color: '#000000'
              }}
            >
              Tabla de DDJJ
            </h2>
            <p 
              className="text-xs sm:text-sm"
              style={{ 
                fontFamily: 'Lato, sans-serif',
                color: '#666666'
              }}
            >
              Detalle de las DDJJ de su empresa
            </p>
          </div>

          {/* Búsqueda */}
          <div className="mb-4 sm:mb-6">
            <div className="w-full sm:max-w-xs lg:max-w-md">
              <div className="relative">
                <input
                  type="text"
                  id="search-ddjj"
                  placeholder="Ingrese su búsqueda"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 sm:px-4 py-2 pl-10 sm:pl-12 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#007C8A] focus:border-transparent"
                  style={{ 
                    fontFamily: 'Lato, sans-serif',
                    fontSize: isMobile ? '13px' : '14px'
                  }}
                />
                <svg 
                  className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 pointer-events-none"
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Filtros de fecha y botón de descarga */}
          <div 
            className="rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 flex flex-col sm:flex-row items-stretch sm:items-end justify-end gap-3"
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
                  value={convertToDateInputFormat(fechaDesde)}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value) {
                      // Convertir de yyyy-mm-dd a dd/mm/yyyy
                      const date = new Date(value);
                      const day = String(date.getDate()).padStart(2, '0');
                      const month = String(date.getMonth() + 1).padStart(2, '0');
                      const year = date.getFullYear();
                      setFechaDesde(`${day}/${month}/${year}`);
                    } else {
                      setFechaDesde('');
                    }
                  }}
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
                  value={convertToDateInputFormat(fechaHasta)}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value) {
                      // Convertir de yyyy-mm-dd a dd/mm/yyyy
                      const date = new Date(value);
                      const day = String(date.getDate()).padStart(2, '0');
                      const month = String(date.getMonth() + 1).padStart(2, '0');
                      const year = date.getFullYear();
                      setFechaHasta(`${day}/${month}/${year}`);
                    } else {
                      setFechaHasta('');
                    }
                  }}
                  min={convertToDateInputFormat(fechaDesde) || undefined}
                  className="w-full sm:w-auto px-2 sm:px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007C8A] focus:border-transparent"
                  style={{ fontFamily: 'Lato, sans-serif', fontSize: isMobile ? '13px' : '14px', minWidth: isMobile ? '100%' : '150px' }}
                  required
                />
              </div>
            </div>

            {/* Botón de descarga - pegado a los inputs */}

            {/* Botón Descargar reporte */}
            <button
              onClick={handleDownloadReport}
              disabled={!fechaDesde || !fechaHasta}
              className="px-4 sm:px-6 py-2 bg-[#007C8A] text-white rounded-lg shadow-md hover:bg-[#005A63] transition-colors flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                fontFamily: 'Lato, sans-serif', 
                fontWeight: 'bold', 
                fontSize: isMobile ? '13px' : '14px',
                minHeight: '38px'
              }}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Descargar reporte</span>
            </button>
          </div>

          {/* Tabla */}
          <div className="overflow-x-auto -mx-3 sm:-mx-4 md:mx-0 w-full">
            <div className="inline-block min-w-full align-middle">
              {!Array.isArray(currentData) || currentData.length === 0 ? (
                <div className="text-center py-8 text-gray-500" style={{ fontFamily: 'Lato, sans-serif' }}>
                  {isLoading ? 'Cargando datos...' : 'No se encontraron registros de DDJJ'}
                </div>
              ) : (
                <table className="w-full min-w-[800px] sm:min-w-[900px]" style={{ fontFamily: 'Lato, sans-serif' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap" style={{ fontSize: '12px', color: '#374151' }}>ID DDJJ</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap" style={{ fontSize: '12px', color: '#374151' }}>Interno</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap hidden sm:table-cell" style={{ fontSize: '12px', color: '#374151' }}>Fecha de ingreso</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap hidden md:table-cell" style={{ fontSize: '12px', color: '#374151' }}>Fecha de egreso</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap hidden lg:table-cell" style={{ fontSize: '12px', color: '#374151' }}>Odómetro</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap hidden lg:table-cell" style={{ fontSize: '12px', color: '#374151' }}>Horómetro</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap" style={{ fontSize: '12px', color: '#374151' }}>Conductor</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap" style={{ fontSize: '12px', color: '#374151' }}>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {                    currentData.map((item, index) => {
                      const estadoStyle = getEstadoBadgeStyle(item.tipoMantenimiento);
                      return (
                        <tr 
                          key={item.id_orden}
                          style={{ 
                            borderBottom: '1px solid #E5E7EB',
                            backgroundColor: index % 2 === 0 ? '#FFFFFF' : '#F9FAFB'
                          }}
                        >
                          <td className="py-2 sm:py-3 px-2 sm:px-4" style={{ fontSize: '12px', color: '#374151' }}>
                            {item.idDDJJ}
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4" style={{ fontSize: '12px', color: '#374151' }}>
                            {item.interno}
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4 hidden sm:table-cell" style={{ fontSize: '12px', color: '#374151' }}>
                            {formatDate(item.fechaIngreso)}
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4 hidden md:table-cell" style={{ fontSize: '12px', color: '#374151' }}>
                            {formatDate(item.fechaEgreso)}
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4 hidden lg:table-cell" style={{ fontSize: '12px', color: '#374151' }}>
                            {item.odometro ? `${formatNumber(item.odometro)} km` : '-'}
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4 hidden lg:table-cell" style={{ fontSize: '12px', color: '#374151' }}>
                            {item.horometro ? `${formatNumber(item.horometro)} hs` : '-'}
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4">
                            <button
                              onClick={() => handleViewConductor(item.id_conductor)}
                              className="flex items-center gap-1 text-[#007C8A] hover:text-[#005A63] transition-colors"
                              title="Ver conductor"
                            >
                              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4">
                            {item.estado && item.estado !== 'N/A' ? (
                              <span
                                className="px-2 py-1 text-xs font-medium whitespace-nowrap"
                                style={{
                                  ...estadoStyle,
                                  borderRadius: '4px',
                                  padding: '4px 8px',
                                  display: 'inline-block',
                                  fontFamily: 'Lato, sans-serif',
                                  fontWeight: '500'
                                }}
                              >
                                {item.estado}
                              </span>
                            ) : (
                              <span style={{ fontSize: '12px', color: '#9CA3AF' }}>N/A</span>
                            )}
                          </td>
                        </tr>
                      );
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
                Elementos por página
              </span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 sm:px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007C8A] bg-white"
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  fontSize: isMobile ? '12px' : '14px'
                }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs sm:text-sm text-gray-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                {startIndex + 1} - {Math.min(endIndex, totalItems)} de {totalItems}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-1 sm:p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ fontFamily: 'Lato, sans-serif' }}
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1 sm:p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ fontFamily: 'Lato, sans-serif' }}
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de detalles del conductor */}
      {showConductorModal && selectedConductor && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 124, 138, 0.5)' }}
        >
          <div 
            className="bg-white modal-content rounded-lg shadow-xl max-w-md w-full p-6"
            data-modal="true"
            style={{ 
              backgroundColor: '#FFFFFF',
              background: '#FFFFFF'
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold" style={{ fontFamily: 'Lato, sans-serif', color: '#1F2937' }}>
                Detalles del Conductor
              </h3>
              <button
                onClick={() => setShowConductorModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <span className="text-sm font-semibold text-gray-700" style={{ fontFamily: 'Lato, sans-serif' }}>Nombre completo: </span>
                <span className="text-sm text-gray-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                  {selectedConductor.nombre} {selectedConductor.apellido}
                </span>
              </div>
              {selectedConductor.dni && (
                <div>
                  <span className="text-sm font-semibold text-gray-700" style={{ fontFamily: 'Lato, sans-serif' }}>DNI: </span>
                  <span className="text-sm text-gray-600" style={{ fontFamily: 'Lato, sans-serif' }}>{selectedConductor.dni}</span>
                </div>
              )}
              {selectedConductor.telefono && (
                <div>
                  <span className="text-sm font-semibold text-gray-700" style={{ fontFamily: 'Lato, sans-serif' }}>Teléfono: </span>
                  <span className="text-sm text-gray-600" style={{ fontFamily: 'Lato, sans-serif' }}>{selectedConductor.telefono}</span>
                </div>
              )}
              {selectedConductor.numero_licencia && (
                <div>
                  <span className="text-sm font-semibold text-gray-700" style={{ fontFamily: 'Lato, sans-serif' }}>Número de licencia: </span>
                  <span className="text-sm text-gray-600" style={{ fontFamily: 'Lato, sans-serif' }}>{selectedConductor.numero_licencia}</span>
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowConductorModal(false)}
                className="px-4 py-2 bg-[#007C8A] text-white rounded-lg hover:bg-[#005A63] transition-colors"
                style={{ fontFamily: 'Lato, sans-serif', fontWeight: 'bold', fontSize: '14px' }}
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

export default DDJJRegistradas;
