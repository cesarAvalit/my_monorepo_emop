import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Label } from 'recharts';
import { JSON_SERVER_URL } from '../config/api';
import { getAllFromTable } from '../config/supabase';

const Mantenimientos = () => {
  const navigate = useNavigate();
  const [vehiculos, setVehiculos] = useState([]);
  const [ordenesTrabajo, setOrdenesTrabajo] = useState([]);
  const [tiposMantenimiento, setTiposMantenimiento] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
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

  // Función unificada para calcular el estado del vehículo basado en órdenes de trabajo
  const getEstadoVehiculo = (vehiculo) => {
    // Si el vehículo no está activo, está dado de baja
    if (!vehiculo.activo) {
      return 'Dado de baja';
    }
    
    // Validar que tengamos los datos necesarios
    const validOrdenes = Array.isArray(ordenesTrabajo) ? ordenesTrabajo : [];
    const validTipos = Array.isArray(tiposMantenimiento) ? tiposMantenimiento : [];
    
    // Buscar órdenes de trabajo activas para este vehículo
    // Una orden está activa si: estado !== 'Completada' O fecha_egreso es null
    const ordenesActivas = validOrdenes.filter(ot => 
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
      const tipo = validTipos.find(t => t.id_tipo === ot.id_tipo_mantenimiento);
      return tipo?.descripcion === 'Preventivo';
    });
    
    if (ordenPreventiva) {
      return 'Preventivo';
    }
    
    // Verificar si hay órdenes correctivas
    const ordenCorrectiva = ordenesActivas.find(ot => {
      const tipo = validTipos.find(t => t.id_tipo === ot.id_tipo_mantenimiento);
      return tipo?.descripcion === 'Correctivo';
    });
    
    if (ordenCorrectiva) {
      return 'Correctivo';
    }
    
    // Si hay orden activa pero no se puede determinar el tipo, retornar "En mantenimiento"
    return 'En mantenimiento';
  };

  // Calcular métricas
  const totalVehiculos = vehiculos.length;
  const vehiculosOperativos = vehiculos.filter(v => getEstadoVehiculo(v) === 'Operativo').length;
  const vehiculosMantenimiento = vehiculos.filter(v => {
    const estado = getEstadoVehiculo(v);
    return estado === 'En mantenimiento' || estado === 'Preventivo' || estado === 'Correctivo';
  }).length;
  const vehiculosBaja = vehiculos.filter(v => getEstadoVehiculo(v) === 'Dado de baja').length;

  // Datos para el gráfico de dona
  const distribucionData = [
    { name: 'Operativo', value: vehiculosOperativos, color: '#00B69B' },
    { name: 'En mantenimiento', value: vehiculosMantenimiento, color: '#FFC107' },
    { name: 'Dado de baja', value: vehiculosBaja, color: '#FF6F6F' }
  ];

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
            flexWrap: 'nowrap',
            whiteSpace: 'nowrap',
            fontFamily: 'Lato, sans-serif',
            fontSize: '12px',
            maxWidth: '100%',
            overflow: 'hidden',
          }}
        >
          {payload.map((entry, idx) => (
            <li
              key={`legend-${idx}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                minWidth: 0,
                maxWidth: '33%',
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
                  color: entry?.color || '#374151',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={entry?.value}
              >
                {entry?.value}
              </span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  // Función para formatear número con separadores de miles
  const formatNumber = (num) => {
    return new Intl.NumberFormat('es-AR').format(num);
  };

  // Función para obtener el color del badge según el estado
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

  // Cargar datos del servidor
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Obtener datos usando Supabase
        const [vehiculosData, ordenesData, tiposData] = await Promise.all([
          getAllFromTable('vehiculo'),
          getAllFromTable('orden_trabajo'),
          getAllFromTable('tipo_mantenimiento')
        ]);
        
        // Validar que sean arrays
        const validVehiculos = Array.isArray(vehiculosData) ? vehiculosData : [];
        const validOrdenes = Array.isArray(ordenesData) ? ordenesData : [];
        const validTipos = Array.isArray(tiposData) ? tiposData : [];
        
        setVehiculos(validVehiculos);
        setOrdenesTrabajo(validOrdenes);
        setTiposMantenimiento(validTipos);
      } catch (error) {
        console.error('Error al cargar datos:', error);
        setVehiculos([]);
        setOrdenesTrabajo([]);
        setTiposMantenimiento([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filtrar datos según búsqueda y agregar estado calculado
  const filteredData = vehiculos
    .map(vehiculo => ({
      ...vehiculo,
      estado: getEstadoVehiculo(vehiculo)
    }))
    .filter(item => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      
      // Formatear números para búsqueda
      const anioStr = item.anio ? item.anio.toString().toLowerCase() : '';
      const odometroStr = item.kilometros ? item.kilometros.toString().toLowerCase() : '';
      
      // Obtener estado
      const estadoStr = item.estado?.toLowerCase() || '';
      
      return (
        item.matricula?.toLowerCase().includes(searchLower) ||
        item.marca?.toLowerCase().includes(searchLower) ||
        item.modelo?.toLowerCase().includes(searchLower) ||
        anioStr.includes(searchLower) ||
        odometroStr.includes(searchLower) ||
        estadoStr.includes(searchLower)
      );
    });

  // Calcular paginación
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  return (
    <div className="w-full">
      <div className="px-3 sm:px-4 md:px-6 w-full">
        {/* Header */}
        <div 
          className="bg-[#007C8A] w-full mb-4 sm:mb-6 rounded-lg mt-4 sm:mt-6 flex flex-col sm:flex-row sm:items-center px-3 sm:px-6"
          style={{
            minHeight: '70px',
            paddingTop: '12px',
            paddingBottom: '12px'
          }}
        >
          <div 
            className="rounded-full flex items-center justify-center cursor-pointer flex-shrink-0 mb-2 sm:mb-0 sm:mr-4"
            onClick={() => navigate('/home')}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              width: isMobile ? '32px' : '40px',
              height: isMobile ? '32px' : '40px'
            }}
          >
            <svg className={isMobile ? "w-5 h-5" : "w-6 h-6"} text-white fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1" style={{ fontFamily: 'Lato, sans-serif', lineHeight: '1.2' }}>
              Tablero de mantenimiento
            </h1>
            <p className="text-white text-xs sm:text-sm font-normal" style={{ fontFamily: 'Lato, sans-serif', lineHeight: '1.2' }}>
              Consulta todos los movimientos del sistema
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
            <div style={{ padding: '16px', position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ textAlign: 'center' }}>
                <p 
                  className="font-bold" 
                  style={{ 
                    color: '#1F2937',
                    fontSize: '32px',
                    lineHeight: '1.2',
                    textAlign: 'center',
                    marginBottom: '8px',
                    marginTop: '4px'
                  }}
                >
                  {isLoading ? '...' : totalVehiculos}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'nowrap' }}>
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
                  <p 
                    style={{ 
                      fontFamily: 'Lato, sans-serif',
                      fontSize: '13px',
                      color: '#6B7280',
                      textAlign: 'center',
                      margin: 0,
                      lineHeight: '1.4',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Unidades en la flota
                  </p>
                </div>
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
            <div style={{ padding: '16px', position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ textAlign: 'center' }}>
                <p 
                  className="font-bold" 
                  style={{ 
                    color: '#1F2937',
                    fontSize: '32px',
                    lineHeight: '1.2',
                    textAlign: 'center',
                    marginBottom: '8px',
                    marginTop: '4px'
                  }}
                >
                  {isLoading ? '...' : vehiculosOperativos}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'nowrap' }}>
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
                  <p 
                    style={{ 
                      fontFamily: 'Lato, sans-serif',
                      fontSize: '13px',
                      color: '#6B7280',
                      textAlign: 'center',
                      margin: 0,
                      lineHeight: '1.4',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Unidades en servicio activo
                  </p>
                </div>
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
            <div style={{ padding: '16px', position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ textAlign: 'center' }}>
                <p 
                  className="font-bold" 
                  style={{ 
                    color: '#1F2937',
                    fontSize: '32px',
                    lineHeight: '1.2',
                    textAlign: 'center',
                    marginBottom: '8px',
                    marginTop: '4px'
                  }}
                >
                  {isLoading ? '...' : vehiculosMantenimiento}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'nowrap' }}>
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
                  <p 
                    style={{ 
                      fontFamily: 'Lato, sans-serif',
                      fontSize: '12px',
                      color: '#6B7280',
                      textAlign: 'center',
                      margin: 0,
                      lineHeight: '1.4',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    En revisión
                  </p>
                </div>
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
            <div style={{ padding: '16px', position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ textAlign: 'center' }}>
                <p 
                  className="font-bold" 
                  style={{ 
                    color: '#1F2937',
                    fontSize: '32px',
                    lineHeight: '1.2',
                    textAlign: 'center',
                    marginBottom: '8px',
                    marginTop: '4px'
                  }}
                >
                  {isLoading ? '...' : vehiculosBaja}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'nowrap' }}>
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
                  <p 
                    style={{ 
                      fontFamily: 'Lato, sans-serif',
                      fontSize: '12px',
                      color: '#6B7280',
                      textAlign: 'center',
                      margin: 0,
                      lineHeight: '1.4',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Fuera de servicio
                  </p>
                </div>
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
              <div className="relative" style={{ height: '300px' }}>
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
              <div className="flex-shrink-0 w-full max-w-lg">
                <label 
                  htmlFor="search-mantenimientos"
                  className="block text-sm font-medium mb-1"
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
                    id="search-mantenimientos"
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
                        Matrícula
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
                    </tr>
                  </thead>
                  <tbody>
                    {currentData.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-gray-500">
                          No hay datos disponibles
                        </td>
                      </tr>
                    ) : (
                      currentData.map((item, index) => {
                        return (
                          <tr 
                            key={item.id_vehiculo}
                            style={{ 
                              borderBottom: '1px solid #E5E7EB',
                              backgroundColor: index % 2 === 0 ? '#FFFFFF' : '#F9FAFB'
                            }}
                          >
                            <td className="py-3 px-4" style={{ fontSize: '14px', color: '#374151' }}>
                              {item.matricula || item.interno || 'N/A'}
                            </td>
                            <td className="py-3 px-4" style={{ fontSize: '14px', color: '#374151' }}>
                              {item.marca || 'N/A'}
                            </td>
                            <td className="py-3 px-4" style={{ fontSize: '14px', color: '#374151' }}>
                              {item.modelo || 'N/A'}
                            </td>
                            <td className="py-3 px-4" style={{ fontSize: '14px', color: '#374151' }}>
                              {item.anio || 'N/A'}
                            </td>
                            <td className="py-3 px-4" style={{ fontSize: '14px', color: '#374151' }}>
                              {item.kilometros ? `${formatNumber(item.kilometros)} km` : 'N/A'}
                            </td>
                            <td className="py-3 px-4">
                              {item.estado ? (
                                (() => {
                                  const estadoStyle = getEstadoBadgeStyle(item.estado);
                                  return (
                                    <span
                                      style={{
                                        backgroundColor: estadoStyle.bg,
                                        color: estadoStyle.text,
                                        border: `1px solid ${estadoStyle.border}`,
                                        borderRadius: '4px',
                                        padding: '4px 12px',
                                        fontSize: '12px',
                                        whiteSpace: 'nowrap',
                                        display: 'inline-block',
                                        fontFamily: 'Lato, sans-serif',
                                        fontWeight: '500'
                                      }}
                                    >
                                      {item.estado}
                                    </span>
                                  );
                                })()
                              ) : (
                                <span style={{ fontSize: '14px', color: '#9CA3AF' }}>N/A</span>
                              )}
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
    </div>
  );
};

export default Mantenimientos;
