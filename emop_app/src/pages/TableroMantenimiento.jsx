import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Label } from 'recharts';
import { getAllFromTable } from '../config/supabase';

const TableroMantenimiento = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [vehiculos, setVehiculos] = useState([]);
  const [ordenesTrabajo, setOrdenesTrabajo] = useState([]);
  const [tiposMantenimiento, setTiposMantenimiento] = useState([]);
  const [lineasServicio, setLineasServicio] = useState([]);
  const [empresa, setEmpresa] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);
  const [isMobile, setIsMobile] = useState(false);
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState(null);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);
  
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

  // Función para formatear número con separadores de miles
  const formatNumber = (num) => {
    if (!num && num !== 0) return '0';
    return new Intl.NumberFormat('es-AR').format(num);
  };

  // Función unificada para calcular el estado del vehículo basado en órdenes de trabajo
  const getEstadoVehiculo = (vehiculo, ordenesTrabajoData, tiposMantenimientoData) => {
    // Si el vehículo no está activo, está dado de baja
    if (!vehiculo.activo) {
      return 'Dado de baja';
    }
    
    // Buscar órdenes de trabajo activas para este vehículo
    // Una orden está activa si: estado !== 'Completada' O fecha_egreso es null
    const ordenesActivas = ordenesTrabajoData.filter(ot => 
      ot.id_vehiculo === vehiculo.id_vehiculo && 
      (ot.estado !== 'Completada' || !ot.fecha_egreso || ot.fecha_egreso === null)
    );
    
    // Si no hay órdenes activas, el vehículo está operativo
    if (ordenesActivas.length === 0) {
      return 'Operativo';
    }
    
    // Si hay órdenes activas, determinar el tipo de mantenimiento
    // Priorizar órdenes preventivas
    const ordenPreventiva = ordenesActivas.find(ot => {
      const tipo = tiposMantenimientoData.find(t => t.id_tipo === ot.id_tipo_mantenimiento);
      return tipo?.descripcion === 'Preventivo';
    });
    
    if (ordenPreventiva) {
      return 'Preventivo';
    }
    
    // Verificar si hay órdenes correctivas
    const ordenCorrectiva = ordenesActivas.find(ot => {
      const tipo = tiposMantenimientoData.find(t => t.id_tipo === ot.id_tipo_mantenimiento);
      return tipo?.descripcion === 'Correctivo';
    });
    
    if (ordenCorrectiva) {
      return 'Correctivo';
    }
    
    // Si hay orden activa pero no se puede determinar el tipo, retornar "En mantenimiento"
    return 'En mantenimiento';
  };

  // Cargar datos
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Obtener datos usando Supabase
        const [vehiculosData, ordenesData, empresasData, tiposData, lineasData] = await Promise.all([
          getAllFromTable('vehiculo'),
          getAllFromTable('orden_trabajo'),
          getAllFromTable('empresa'),
          getAllFromTable('tipo_mantenimiento'),
          getAllFromTable('linea_servicio')
        ]);
        
        // Validar que sean arrays
        const validVehiculos = Array.isArray(vehiculosData) ? vehiculosData : [];
        const validOrdenes = Array.isArray(ordenesData) ? ordenesData : [];
        const validEmpresas = Array.isArray(empresasData) ? empresasData : [];
        const validTipos = Array.isArray(tiposData) ? tiposData : [];
        const validLineas = Array.isArray(lineasData) ? lineasData : [];
        
        // Filtrar por empresa del usuario si es usuario Empresa
        let vehiculosFiltrados = validVehiculos;
        let ordenesFiltradas = validOrdenes;
        let lineasFiltradas = validLineas;
        if (idEmpresaUsuario) {
          vehiculosFiltrados = validVehiculos.filter(v => v.id_empresa === idEmpresaUsuario);
          // Filtrar órdenes de trabajo de vehículos de la empresa
          const idsVehiculosEmpresa = vehiculosFiltrados.map(v => v.id_vehiculo);
          ordenesFiltradas = validOrdenes.filter(ot => idsVehiculosEmpresa.includes(ot.id_vehiculo));
          // Filtrar líneas de servicio de las órdenes de trabajo de la empresa
          const idsOrdenesEmpresa = ordenesFiltradas.map(ot => ot.id_orden);
          lineasFiltradas = validLineas.filter(ls => idsOrdenesEmpresa.includes(ls.id_orden));
          const empresaUsuario = validEmpresas.find(e => e.id_empresa === idEmpresaUsuario);
          setEmpresa(empresaUsuario);
        } else {
          // Si es admin, usar todos los vehículos (o el primero disponible)
          setEmpresa(validEmpresas[0] || null);
        }
        
        setVehiculos(vehiculosFiltrados);
        setOrdenesTrabajo(ordenesFiltradas);
        setTiposMantenimiento(validTipos);
        setLineasServicio(lineasFiltradas);
      } catch (error) {
        console.error('Error al cargar datos:', error);
        setVehiculos([]);
        setOrdenesTrabajo([]);
        setTiposMantenimiento([]);
        setLineasServicio([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [idEmpresaUsuario]);

  // Calcular métricas
  const totalVehiculos = vehiculos.length;
  const vehiculosOperativos = vehiculos.filter(v => getEstadoVehiculo(v, ordenesTrabajo, tiposMantenimiento) === 'Operativo').length;
  const vehiculosMantenimiento = vehiculos.filter(v => {
    const estado = getEstadoVehiculo(v, ordenesTrabajo, tiposMantenimiento);
    return estado === 'En mantenimiento' || estado === 'Preventivo';
  }).length;
  const vehiculosBaja = vehiculos.filter(v => getEstadoVehiculo(v, ordenesTrabajo, tiposMantenimiento) === 'Dado de baja').length;

  // Datos para el gráfico de dona
  const distribucionData = [
    { name: 'Operativo', value: vehiculosOperativos, color: '#00B69B' },
    { name: 'En mantenimiento', value: vehiculosMantenimiento, color: '#FFC107' },
    { name: 'Dado de baja', value: vehiculosBaja, color: '#FF6F6F' }
  ];

  // Preparar datos de la tabla con estado
  const vehiculosConEstado = vehiculos.map(v => ({
    ...v,
    estado: getEstadoVehiculo(v, ordenesTrabajo, tiposMantenimiento)
  }));

  // Filtrar datos según búsqueda
  const filteredData = vehiculosConEstado.filter(item => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    
    // Formatear números para búsqueda
    const anioStr = item.anio ? item.anio.toString().toLowerCase() : '';
    const kilometrosStr = item.kilometros ? formatNumber(item.kilometros).toLowerCase() : '';
    
    // Obtener estado
    const estadoStr = item.estado?.toLowerCase() || '';
    
    return (
      item.interno?.toLowerCase().includes(searchLower) ||
      item.matricula?.toLowerCase().includes(searchLower) ||
      item.marca?.toLowerCase().includes(searchLower) ||
      item.modelo?.toLowerCase().includes(searchLower) ||
      anioStr.includes(searchLower) ||
      kilometrosStr.includes(searchLower) ||
      estadoStr.includes(searchLower)
    );
  });

  // Calcular paginación
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  // Función para obtener el estilo del badge según el estado
  const getEstadoBadgeStyle = (estado) => {
    switch (estado) {
      case 'Operativo':
        return {
          bg: '#E3F2FD',
          text: '#2196F3',
          border: '#2196F3'
        };
      case 'Preventivo':
        return {
          bg: '#E0F7F7',
          text: '#4CAF50',
          border: '#4CAF50'
        };
      case 'Correctivo':
        return {
          bg: '#FFEDED',
          text: '#E07B7B',
          border: '#E07B7B'
        };
      case 'En mantenimiento':
        return {
          bg: '#FFFBE6',
          text: '#FFC107',
          border: '#FFC107'
        };
      case 'Dado de baja':
        return {
          bg: '#FFE6E6',
          text: '#FF6F6F',
          border: '#FF6F6F'
        };
      default:
        return {
          bg: '#F3F4F6',
          text: '#6B7280',
          border: '#6B7280'
        };
    }
  };

  // Renderizar leyenda del gráfico
  const renderLegend = (props) => {
    const payload = props?.payload || [];
    return (
      <div style={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
        <ul
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '12px',
            padding: '0 8px',
            margin: 0,
            listStyle: 'none',
            flexWrap: 'wrap',
            fontFamily: 'Lato, sans-serif',
            fontSize: '12px',
          }}
        >
          {payload.map((entry, idx) => (
            <li
              key={`legend-${idx}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: entry?.color || '#374151',
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  color: '#374151',
                }}
              >
                {entry?.value}
              </span>
            </li>
          ))}
        </ul>
      </div>
    );
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
    <div className="w-full" style={{ fontFamily: 'Lato, sans-serif' }}>
      <div className="px-3 sm:px-4 md:px-6 w-full">
        {/* Header */}
        <div 
          className="bg-[#007C8A] w-full mb-4 sm:mb-6 rounded-lg mt-4 sm:mt-6 flex items-center px-3 sm:px-4 lg:px-6"
          style={{
            minHeight: '70px',
            paddingTop: '12px',
            paddingBottom: '12px'
          }}
        >
          <div 
            className="rounded-full flex items-center justify-center cursor-pointer flex-shrink-0 mr-3 sm:mr-4"
            onClick={() => navigate('/home')}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              width: isMobile ? '32px' : '40px',
              height: isMobile ? '32px' : '40px'
            }}
          >
            <svg className={isMobile ? "w-5 h-5" : "w-6 h-6"} fill="none" stroke="white" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1" style={{ fontFamily: 'Lato, sans-serif', lineHeight: '1.2' }}>
              Tablero de mantenimiento
            </h1>
            <p className="text-white text-xs sm:text-sm font-normal" style={{ fontFamily: 'Lato, sans-serif', lineHeight: '1.2' }}>
              Consulta todos los movimientos flota {empresa?.nombre_empresa || 'de tu empresa'}
            </p>
          </div>
        </div>

        {/* Tarjetas de métricas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Tarjeta 1: Total de vehículos reportados */}
          <div 
            className="bg-white rounded-lg shadow-md relative overflow-hidden"
            style={{
              width: '100%',
              minHeight: '150px',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Barra de título */}
            <div 
              style={{ 
                backgroundColor: '#F3F4F6',
                padding: '10px 16px',
                textAlign: 'center',
                flexShrink: 0
              }}
            >
              <h3 
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  fontWeight: '500',
                  fontSize: '13px',
                  lineHeight: '1.4',
                  color: '#1F2937',
                  margin: 0
                }}
              >
                Total de vehículos reportados
              </h3>
            </div>
            {/* Contenido */}
            <div style={{ padding: '16px', position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '8px' }}>
                  <p 
                    className="font-bold" 
                    style={{ 
                      color: '#1F2937',
                      fontSize: '32px',
                      lineHeight: '1.2',
                      margin: 0
                    }}
                  >
                    {isLoading ? '...' : formatNumber(totalVehiculos)}
                  </p>
                  <div 
                    className="rounded-full flex items-center justify-center" 
                    style={{ 
                      backgroundColor: '#F3F4F6',
                      width: '32px',
                      height: '32px',
                      flexShrink: 0
                    }}
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </div>
                </div>
                <p 
                  style={{ 
                    fontFamily: 'Lato, sans-serif',
                    fontSize: '13px',
                    color: '#6B7280',
                    textAlign: 'center',
                    margin: 0,
                    lineHeight: '1.4'
                  }}
                >
                  Unidades en la flota
                </p>
              </div>
            </div>
          </div>

          {/* Tarjeta 2: Vehículos operativos */}
          <div 
            className="bg-white rounded-lg shadow-md relative overflow-hidden"
            style={{
              width: '100%',
              minHeight: '150px',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Barra de título */}
            <div 
              style={{ 
                backgroundColor: '#E6FFE6',
                padding: '10px 16px',
                textAlign: 'center',
                flexShrink: 0
              }}
            >
              <h3 
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  fontWeight: '500',
                  fontSize: '13px',
                  lineHeight: '1.4',
                  color: '#1F2937',
                  margin: 0
                }}
              >
                Vehículos operativos
              </h3>
            </div>
            {/* Contenido */}
            <div style={{ padding: '16px', position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '8px' }}>
                  <p 
                    className="font-bold" 
                    style={{ 
                      color: '#1F2937',
                      fontSize: '32px',
                      lineHeight: '1.2',
                      margin: 0
                    }}
                  >
                    {isLoading ? '...' : formatNumber(vehiculosOperativos)}
                  </p>
                  <div 
                    className="rounded-full flex items-center justify-center" 
                    style={{ 
                      backgroundColor: '#E6FFE6',
                      width: '32px',
                      height: '32px',
                      flexShrink: 0
                    }}
                  >
                    <svg className="w-5 h-5 text-[#00B69B]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <p 
                  style={{ 
                    fontFamily: 'Lato, sans-serif',
                    fontSize: '13px',
                    color: '#6B7280',
                    textAlign: 'center',
                    margin: 0,
                    lineHeight: '1.4'
                  }}
                >
                  Unidades en servicio activo
                </p>
              </div>
            </div>
          </div>

          {/* Tarjeta 3: Vehículos en mantenimiento */}
          <div 
            className="bg-white rounded-lg shadow-md relative overflow-hidden"
            style={{
              width: '100%',
              minHeight: '150px',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Barra de título */}
            <div 
              style={{ 
                backgroundColor: '#FFF2D7',
                padding: '10px 16px',
                textAlign: 'center',
                flexShrink: 0
              }}
            >
              <h3 
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  fontWeight: '500',
                  fontSize: '13px',
                  lineHeight: '1.4',
                  color: '#1F2937',
                  margin: 0
                }}
              >
                Vehículos en mantenimiento
              </h3>
            </div>
            {/* Contenido */}
            <div style={{ padding: '16px', position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '8px' }}>
                  <p 
                    className="font-bold" 
                    style={{ 
                      color: '#1F2937',
                      fontSize: '32px',
                      lineHeight: '1.2',
                      margin: 0
                    }}
                  >
                    {isLoading ? '...' : formatNumber(vehiculosMantenimiento)}
                  </p>
                  <div 
                    className="rounded-full flex items-center justify-center" 
                    style={{ 
                      backgroundColor: '#FFF2D7',
                      width: '32px',
                      height: '32px',
                      flexShrink: 0
                    }}
                  >
                    <svg className="w-5 h-5 text-[#FFC107]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </div>
                <p 
                  style={{ 
                    fontFamily: 'Lato, sans-serif',
                    fontSize: '13px',
                    color: '#6B7280',
                    textAlign: 'center',
                    margin: 0,
                    lineHeight: '1.4'
                  }}
                >
                  En revisión
                </p>
              </div>
            </div>
          </div>

          {/* Tarjeta 4: Vehículos dados de baja */}
          <div 
            className="bg-white rounded-lg shadow-md relative overflow-hidden"
            style={{
              width: '100%',
              minHeight: '150px',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Barra de título */}
            <div 
              style={{ 
                backgroundColor: '#FFE3E3',
                padding: '10px 16px',
                textAlign: 'center',
                flexShrink: 0
              }}
            >
              <h3 
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  fontWeight: '500',
                  fontSize: '13px',
                  lineHeight: '1.4',
                  color: '#1F2937',
                  margin: 0
                }}
              >
                Vehículos dados de baja
              </h3>
            </div>
            {/* Contenido */}
            <div style={{ padding: '16px', position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '8px' }}>
                  <p 
                    className="font-bold" 
                    style={{ 
                      color: '#1F2937',
                      fontSize: '32px',
                      lineHeight: '1.2',
                      margin: 0
                    }}
                  >
                    {isLoading ? '...' : formatNumber(vehiculosBaja).padStart(2, '0')}
                  </p>
                  <div 
                    className="rounded-full flex items-center justify-center" 
                    style={{ 
                      backgroundColor: '#FFE3E3',
                      width: '32px',
                      height: '32px',
                      flexShrink: 0
                    }}
                  >
                    <svg className="w-5 h-5 text-[#FF6F6F]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                </div>
                <p 
                  style={{ 
                    fontFamily: 'Lato, sans-serif',
                    fontSize: '13px',
                    color: '#6B7280',
                    textAlign: 'center',
                    margin: 0,
                    lineHeight: '1.4'
                  }}
                >
                  Fuera de servicio
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sección inferior: Gráfico y Tabla */}
        <div className="flex flex-col lg:flex-row gap-6 mb-6">
          {/* Gráfico de distribución */}
          <div 
            className="bg-white rounded-lg shadow-md w-full lg:w-auto lg:flex-shrink-0"
            style={{
              flex: '0 0 auto',
              minWidth: '300px',
              maxWidth: '100%',
              padding: '24px',
              border: '1px solid #E5E7EB'
            }}
          >
            <h2 
              className="text-xl font-bold mb-2"
              style={{ 
                fontFamily: 'Lato, sans-serif',
                color: '#1F2937'
              }}
            >
              Distribución por estado
            </h2>
            <p 
              className="text-sm mb-6"
              style={{ 
                fontFamily: 'Lato, sans-serif',
                color: '#6B7280'
              }}
            >
              Vista general del estado de la flota
            </p>
            {isLoading ? (
              <div className="flex items-center justify-center" style={{ height: '300px' }}>
                <div className="text-gray-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                  Cargando...
                </div>
              </div>
            ) : (
              <div className="relative" style={{ height: '300px', minHeight: '300px', width: '100%', minWidth: '300px' }}>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={distribucionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {distribucionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                      <Label
                        value={totalVehiculos}
                        position="center"
                        style={{
                          fontFamily: 'Lato, sans-serif',
                          fontSize: 32,
                          fontWeight: 700,
                          fill: '#1F2937',
                        }}
                      />
                    </Pie>
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                      layout="horizontal"
                      align="center"
                      content={renderLegend}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Tabla de vehículos */}
          <div 
            className="bg-white rounded-lg shadow-md w-full lg:flex-1"
            style={{
              padding: '24px',
              border: '1px solid #E5E7EB',
              minWidth: 0
            }}
          >
            {/* Título, subtítulo y buscador en la misma línea */}
            <div className="mb-6 flex items-start justify-between gap-4">
              <div className="flex-1">
                <h2 
                  className="text-xl font-bold mb-2"
                  style={{ 
                    fontFamily: 'Lato, sans-serif',
                    color: '#1F2937'
                  }}
                >
                  Listado de vehículos
                </h2>
                <p 
                  className="text-sm"
                  style={{ 
                    fontFamily: 'Lato, sans-serif',
                    color: '#6B7280'
                  }}
                >
                  Detalle general de la flota
                </p>
              </div>
              <div className="flex-shrink-0" style={{ width: '50%', maxWidth: '256px' }}>
                <label 
                  htmlFor="search-tablero-mantenimiento"
                  className="block text-sm font-medium mb-1 text-right"
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
                    id="search-tablero-mantenimiento"
                    placeholder="Ingrese su búsqueda"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#007C8A] focus:border-transparent"
                    style={{ 
                      fontFamily: 'Lato, sans-serif',
                      fontSize: '14px'
                    }}
                  />
                  <svg 
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
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
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-gray-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                    Cargando datos...
                  </div>
                </div>
              ) : (
                <div className="inline-block min-w-full align-middle">
                  <table className="w-full" style={{ fontFamily: 'Lato, sans-serif' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#F3F4F6' }}>
                        <th 
                          className="text-left py-3 px-4 font-semibold"
                          style={{ 
                            fontSize: '14px',
                            color: '#374151'
                          }}
                        >
                          Interno
                        </th>
                        <th 
                          className="text-left py-3 px-4 font-semibold"
                          style={{ 
                            fontSize: '14px',
                            color: '#374151'
                          }}
                        >
                          Marca
                        </th>
                        <th 
                          className="text-left py-3 px-4 font-semibold"
                          style={{ 
                            fontSize: '14px',
                            color: '#374151'
                          }}
                        >
                          Modelo
                        </th>
                        <th 
                          className="text-left py-3 px-4 font-semibold"
                          style={{ 
                            fontSize: '14px',
                            color: '#374151'
                          }}
                        >
                          Año
                        </th>
                        <th 
                          className="text-left py-3 px-4 font-semibold"
                          style={{ 
                            fontSize: '14px',
                            color: '#374151'
                          }}
                        >
                          Odómetro
                        </th>
                        <th 
                          className="text-left py-3 px-4 font-semibold"
                          style={{ 
                            fontSize: '14px',
                            color: '#374151'
                          }}
                        >
                          Estado
                        </th>
                        <th 
                          className="text-left py-3 px-4 font-semibold"
                          style={{ 
                            fontSize: '14px',
                            color: '#374151'
                          }}
                        >
                          Detalle
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentData.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="py-8 text-center text-gray-500">
                            No hay datos disponibles
                          </td>
                        </tr>
                      ) : (
                        currentData.map((vehiculo, index) => {
                          const estadoStyle = getEstadoBadgeStyle(vehiculo.estado);
                          return (
                            <tr 
                              key={vehiculo.id_vehiculo || index}
                              style={{ 
                                borderBottom: '1px solid #E5E7EB',
                                backgroundColor: index % 2 === 0 ? '#FFFFFF' : '#F9FAFB'
                              }}
                            >
                              <td className="py-3 px-4 font-semibold" style={{ fontSize: '14px', color: '#374151' }}>
                                {vehiculo.interno || vehiculo.matricula || 'N/A'}
                              </td>
                              <td className="py-3 px-4" style={{ fontSize: '14px', color: '#374151' }}>
                                {vehiculo.marca || 'N/A'}
                              </td>
                              <td className="py-3 px-4" style={{ fontSize: '14px', color: '#374151' }}>
                                {vehiculo.modelo || 'N/A'}
                              </td>
                              <td className="py-3 px-4" style={{ fontSize: '14px', color: '#374151' }}>
                                {vehiculo.anio || 'N/A'}
                              </td>
                              <td className="py-3 px-4" style={{ fontSize: '14px', color: '#374151' }}>
                                {vehiculo.kilometros ? `${formatNumber(vehiculo.kilometros)} km` : 'N/A'}
                              </td>
                              <td className="py-3 px-4">
                                <span
                                  style={{
                                    backgroundColor: estadoStyle.bg,
                                    color: estadoStyle.text,
                                    border: `1px solid ${estadoStyle.border}`,
                                    borderRadius: '9999px',
                                    padding: '4px 12px',
                                    fontSize: '12px',
                                    whiteSpace: 'nowrap',
                                    display: 'inline-block',
                                    fontFamily: 'Lato, sans-serif',
                                    fontWeight: '500'
                                  }}
                                >
                                  {vehiculo.estado}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <button
                                  className="text-[#007C8A] hover:text-[#005a63] transition-colors"
                                  onClick={() => {
                                    // Buscar la orden de trabajo más reciente o activa del vehículo
                                    const ordenesVehiculo = ordenesTrabajo.filter(ot => 
                                      ot.id_vehiculo === vehiculo.id_vehiculo
                                    );
                                    
                                    // Priorizar órdenes activas (En proceso o Pendiente), luego la más reciente
                                    let ordenSeleccionada = ordenesVehiculo.find(ot => 
                                      ot.estado === 'En proceso' || ot.estado === 'Pendiente'
                                    );
                                    
                                    if (!ordenSeleccionada && ordenesVehiculo.length > 0) {
                                      // Si no hay activas, tomar la más reciente por fecha_generacion
                                      ordenSeleccionada = ordenesVehiculo.reduce((latest, current) => {
                                        const latestDate = latest.fecha_generacion ? new Date(latest.fecha_generacion) : new Date(0);
                                        const currentDate = current.fecha_generacion ? new Date(current.fecha_generacion) : new Date(0);
                                        return currentDate > latestDate ? current : latest;
                                      });
                                    }
                                    
                                    setVehiculoSeleccionado(vehiculo);
                                    setOrdenSeleccionada(ordenSeleccionada || null);
                                    setShowDetalleModal(true);
                                  }}
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Paginación */}
            {!isLoading && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4" style={{ borderTop: '1px solid #E5E7EB' }}>
                <div className="flex items-center gap-2">
                  <span 
                    className="text-sm"
                    style={{ 
                      fontFamily: 'Lato, sans-serif',
                      color: '#374151'
                    }}
                  >
                    Elementos por página
                  </span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007C8A]"
                    style={{ 
                      fontFamily: 'Lato, sans-serif',
                      fontSize: '14px'
                    }}
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
                <div className="flex items-center gap-4">
                  <span 
                    className="text-sm"
                    style={{ 
                      fontFamily: 'Lato, sans-serif',
                      color: '#374151'
                    }}
                  >
                    {startIndex + 1} - {Math.min(endIndex, totalItems)} de {totalItems}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de detalle */}
      {showDetalleModal && vehiculoSeleccionado && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backgroundColor: 'rgba(0, 124, 138, 0.5)' }}
          onClick={() => {
            setShowDetalleModal(false);
            setVehiculoSeleccionado(null);
            setOrdenSeleccionada(null);
          }}
        >
          <div 
            className="bg-white modal-content rounded-lg shadow-xl max-w-md w-full mx-4"
            data-modal="true"
            onClick={(e) => e.stopPropagation()}
            style={{ 
              fontFamily: 'Lato, sans-serif', 
              backgroundColor: '#FFFFFF',
              background: '#FFFFFF'
            }}
          >
            {/* Header del modal */}
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 
                className="text-xl font-bold"
                style={{ 
                  color: '#007C8A',
                  fontFamily: 'Lato, sans-serif'
                }}
              >
                Ver detalle
              </h3>
              <div className="flex items-center gap-4 mt-2">
                <span 
                  className="text-sm"
                  style={{ 
                    color: '#374151',
                    fontFamily: 'Lato, sans-serif'
                  }}
                >
                  Interno: {vehiculoSeleccionado.interno || vehiculoSeleccionado.matricula || 'N/A'}
                </span>
                <span 
                  className="text-sm"
                  style={{ 
                    color: '#374151',
                    fontFamily: 'Lato, sans-serif'
                  }}
                >
                  Marca: {vehiculoSeleccionado.marca || 'N/A'}
                </span>
              </div>
            </div>

            {/* Contenido del modal */}
            <div className="px-6 py-6">
              <div className="space-y-6">
                {/* Tipo de mantenimiento */}
                <div className="flex items-start gap-4">
                  <div 
                    className="rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      backgroundColor: '#FFFBE6',
                      border: '1px solid #FFC107',
                      width: '40px',
                      height: '40px'
                    }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="#FFC107" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="mb-1">
                      <span className="font-bold" style={{ color: '#374151' }}>
                        Tipo de mantenimiento:{' '}
                      </span>
                      <span style={{ color: '#374151' }}>
                        {ordenSeleccionada ? (() => {
                          const tipo = tiposMantenimiento.find(t => t.id_tipo === ordenSeleccionada.id_tipo_mantenimiento);
                          return tipo?.descripcion ? `${tipo.descripcion} de la unidad` : 'N/A';
                        })() : 'Sin orden de trabajo'}
                      </span>
                    </p>
                    <p style={{ color: '#6B7280', fontSize: '14px' }}>
                      Fecha de ingreso:{' '}
                      {ordenSeleccionada?.fecha_generacion 
                        ? new Date(ordenSeleccionada.fecha_generacion).toLocaleDateString('es-AR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })
                        : 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Detalle de mantenimiento */}
                <div className="flex items-start gap-4">
                  <div 
                    className="rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      backgroundColor: '#E6FFE6',
                      border: '1px solid #00B69B',
                      width: '40px',
                      height: '40px'
                    }}
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                      {/* Documento con esquina doblada - contorno */}
                      <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="#00B69B" strokeWidth="1.5" fill="none"/>
                      {/* Esquina doblada */}
                      <path d="M14 2V8H20" stroke="#00B69B" strokeWidth="1.5" fill="none"/>
                      {/* Dos líneas horizontales dentro del documento */}
                      <line x1="7" y1="12" x2="15" y2="12" stroke="#00B69B" strokeWidth="1.5" strokeLinecap="round"/>
                      <line x1="7" y1="16" x2="15" y2="16" stroke="#00B69B" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p>
                      <span className="font-bold" style={{ color: '#374151' }}>
                        Detalle de mantenimiento:{' '}
                      </span>
                      <span style={{ color: '#374151' }}>
                        {ordenSeleccionada ? (() => {
                          const linea = lineasServicio.find(ls => ls.id_orden === ordenSeleccionada.id_orden);
                          return linea?.descripcion_detallada || linea?.definicion_trabajo || 'Sin detalle disponible';
                        })() : 'Sin orden de trabajo'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer del modal */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => {
                  setShowDetalleModal(false);
                  setVehiculoSeleccionado(null);
                  setOrdenSeleccionada(null);
                }}
                className="px-6 py-2 rounded-lg text-white font-medium transition-colors"
                style={{
                  backgroundColor: '#007C8A',
                  fontFamily: 'Lato, sans-serif'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#005a63';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#007C8A';
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

export default TableroMantenimiento;
