import { useState, useEffect } from 'react';
import { JSON_SERVER_URL } from '../config/api';
import { getAllFromTable, getByForeignKey } from '../config/supabase';

const ReportesDDJJ = () => {
  const [ordenesTrabajo, setOrdenesTrabajo] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [conductores, setConductores] = useState([]);
  const [tiposMantenimiento, setTiposMantenimiento] = useState([]);
  const [mecanicos, setMecanicos] = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [ordenXMecanico, setOrdenXMecanico] = useState([]);
  const [ordenXUsuario, setOrdenXUsuario] = useState([]);
  const [detallesInsumo, setDetallesInsumo] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showConductorModal, setShowConductorModal] = useState(false);
  const [selectedConductor, setSelectedConductor] = useState(null);
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
    if (!num && num !== 0) return '0';
    return new Intl.NumberFormat('es-AR').format(num);
  };

  // Función para formatear moneda
  const formatCurrency = (num) => {
    if (!num && num !== 0) return '0,00';
    return new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  // Función para calcular días, horas y minutos desde fecha_generacion
  const calcularDiasAbierta = (fechaGeneracion) => {
    if (!fechaGeneracion) return { dias: 0, horas: 0, minutos: 0, totalDias: 0 };
    
    const fechaGen = new Date(fechaGeneracion);
    const ahora = new Date();
    const diferencia = ahora - fechaGen;
    
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diferencia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));
    
    // Calcular días totales con decimales para el color
    const totalDias = diferencia / (1000 * 60 * 60 * 24);
    
    return { dias, horas, minutos, totalDias };
  };

  // Función para obtener el color del icono según los días
  const getClockIconColor = (totalDias) => {
    // Rosa para más de 7 días, naranja para 7 días o menos
    if (totalDias > 7) {
      return '#FF6F6F'; // Rosa/Rojo
    } else {
      return '#FF8C00'; // Naranja
    }
  };

  // Cargar datos del servidor
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Obtener datos usando Supabase
        const [ordenesData, vehiculosData, empresasData, conductoresData, tiposData, mecanicosData, insumosData, usuariosData, rolesData, ordenXMecanicoData, ordenXUsuarioData, detallesInsumoData] = await Promise.all([
          getAllFromTable('orden_trabajo'),
          getAllFromTable('vehiculo'),
          getAllFromTable('empresa'),
          getAllFromTable('conductor'),
          getAllFromTable('tipo_mantenimiento'),
          getAllFromTable('mecanico'),
          getAllFromTable('insumo_catalogo'),
          getAllFromTable('usuario'),
          getAllFromTable('rol'),
          getAllFromTable('orden_x_mecanico'),
          getAllFromTable('orden_x_usuario'),
          getAllFromTable('detalle_insumo')
        ]);
        
        // Validar que los datos sean arrays
        const validOrdenes = Array.isArray(ordenesData) ? ordenesData : [];
        const validVehiculos = Array.isArray(vehiculosData) ? vehiculosData : [];
        const validEmpresas = Array.isArray(empresasData) ? empresasData : [];
        const validConductores = Array.isArray(conductoresData) ? conductoresData : [];
        const validTipos = Array.isArray(tiposData) ? tiposData : [];
        const validMecanicos = Array.isArray(mecanicosData) ? mecanicosData : [];
        const validInsumos = Array.isArray(insumosData) ? insumosData : [];
        const validUsuarios = Array.isArray(usuariosData) ? usuariosData : [];
        const validRoles = Array.isArray(rolesData) ? rolesData : [];
        const validOrdenXMecanico = Array.isArray(ordenXMecanicoData) ? ordenXMecanicoData : [];
        const validOrdenXUsuario = Array.isArray(ordenXUsuarioData) ? ordenXUsuarioData : [];
        const validDetallesInsumo = Array.isArray(detallesInsumoData) ? detallesInsumoData : [];
        
        setOrdenesTrabajo(validOrdenes);
        setVehiculos(validVehiculos);
        setEmpresas(validEmpresas);
        setConductores(validConductores);
        setTiposMantenimiento(validTipos);
        setMecanicos(validMecanicos);
        setInsumos(validInsumos);
        setUsuarios(validUsuarios);
        setRoles(validRoles);
        setOrdenXMecanico(validOrdenXMecanico);
        setOrdenXUsuario(validOrdenXUsuario);
        setDetallesInsumo(validDetallesInsumo);
      } catch (error) {
        // Fallback en caso de error inesperado
        setOrdenesTrabajo([]);
        setVehiculos([]);
        setEmpresas([]);
        setConductores([]);
        setTiposMantenimiento([]);
        setMecanicos([]);
        setInsumos([]);
        setUsuarios([]);
        setRoles([]);
        setOrdenXMecanico([]);
        setOrdenXUsuario([]);
        setDetallesInsumo([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Validar que todos los datos sean arrays antes de usarlos
  const validOrdenes = Array.isArray(ordenesTrabajo) ? ordenesTrabajo : [];
  const validVehiculos = Array.isArray(vehiculos) ? vehiculos : [];
  const validEmpresas = Array.isArray(empresas) ? empresas : [];
  const validConductores = Array.isArray(conductores) ? conductores : [];
  const validTipos = Array.isArray(tiposMantenimiento) ? tiposMantenimiento : [];
  const validMecanicos = Array.isArray(mecanicos) ? mecanicos : [];
  const validInsumos = Array.isArray(insumos) ? insumos : [];
  const validUsuarios = Array.isArray(usuarios) ? usuarios : [];
  const validRoles = Array.isArray(roles) ? roles : [];
  const validOrdenXMecanico = Array.isArray(ordenXMecanico) ? ordenXMecanico : [];
  const validOrdenXUsuario = Array.isArray(ordenXUsuario) ? ordenXUsuario : [];
  const validDetallesInsumo = Array.isArray(detallesInsumo) ? detallesInsumo : [];

  // Calcular métricas - todas las órdenes de trabajo (DDJJ)
  const totalDDJJ = validOrdenes.length;
  const mantenimientosPreventivos = validOrdenes.filter(ot => {
    const tipo = validTipos.find(t => t.id_tipo === ot.id_tipo_mantenimiento);
    return tipo?.descripcion === 'Preventivo';
  }).length;
  const mantenimientosCorrectivos = validOrdenes.filter(ot => {
    const tipo = validTipos.find(t => t.id_tipo === ot.id_tipo_mantenimiento);
    return tipo?.descripcion === 'Correctivo';
  }).length;

  // Calcular porcentaje de preventivos sobre total
  const totalMantenimientos = mantenimientosPreventivos + mantenimientosCorrectivos;
  const porcentajePreventivos = totalMantenimientos > 0 
    ? Math.round((mantenimientosPreventivos / totalMantenimientos) * 100)
    : 0;

  // Calcular tendencia para Total de DDJJ (comparando mes actual vs anterior)
  const ahora = new Date();
  const mesActualInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  mesActualInicio.setHours(0, 0, 0, 0);
  const mesAnteriorInicio = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
  mesAnteriorInicio.setHours(0, 0, 0, 0);
  const mesAnteriorFin = new Date(ahora.getFullYear(), ahora.getMonth(), 0, 23, 59, 59);

  const ddjjMesActual = validOrdenes.filter(o => {
    if (!o.fecha_generacion) return false;
    const fecha = new Date(o.fecha_generacion);
    fecha.setHours(0, 0, 0, 0);
    return fecha >= mesActualInicio;
  }).length;

  const ddjjMesAnterior = validOrdenes.filter(o => {
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
    ddjjTendencia = {
      porcentaje: '0',
      esPositiva: true
    };
  }

  // Calcular tendencia para mantenimientos correctivos
  const correctivosMesActual = validOrdenes.filter(ot => {
    const tipo = validTipos.find(t => t.id_tipo === ot.id_tipo_mantenimiento);
    if (tipo?.descripcion !== 'Correctivo') return false;
    if (!ot.fecha_generacion) return false;
    const fecha = new Date(ot.fecha_generacion);
    fecha.setHours(0, 0, 0, 0);
    return fecha >= mesActualInicio;
  }).length;

  const correctivosMesAnterior = validOrdenes.filter(ot => {
    const tipo = validTipos.find(t => t.id_tipo === ot.id_tipo_mantenimiento);
    if (tipo?.descripcion !== 'Correctivo') return false;
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
    correctivosTendencia = {
      porcentaje: '0',
      esPositiva: true
    };
  }

  // Función para filtrar datos por rango de fechas
  const filterByDateRange = (data) => {
    if (!fechaDesde && !fechaHasta) {
      return data;
    }

    return data.filter(ot => {
      // Usar fecha_generacion para filtrar
      if (!ot.fecha_generacion) return false;
      
      const fechaOrden = new Date(ot.fecha_generacion);
      fechaOrden.setHours(0, 0, 0, 0); // Normalizar a inicio del día
      
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
        return fechaOrden >= desdeDate && fechaOrden <= hastaDate;
      } else if (desdeDate) {
        return fechaOrden >= desdeDate;
      } else if (hastaDate) {
        return fechaOrden <= hastaDate;
      }
      
      return true;
    });
  };

  // Filtrar datos según búsqueda
  const filteredBySearch = validOrdenes.filter(ot => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const nroOT = ot.nro_orden_trabajo?.toLowerCase() || '';
    
    // Buscar en vehículo
    const vehiculo = validVehiculos.find(v => v.id_vehiculo === ot.id_vehiculo);
    const interno = vehiculo?.interno?.toLowerCase() || '';
    
    // Buscar en empresa
    const empresa = vehiculo ? validEmpresas.find(e => e.id_empresa === vehiculo.id_empresa) : null;
    const nombreEmpresa = empresa?.nombre_empresa?.toLowerCase() || '';
    
    // Buscar en conductor
    const conductor = validConductores.find(c => c.id_conductor === ot.id_conductor);
    const nombreConductor = conductor?.nombre?.toLowerCase() || '';
    const apellidoConductor = conductor?.apellido?.toLowerCase() || '';
    const conductorCompleto = `${nombreConductor} ${apellidoConductor}`.trim().toLowerCase();
    
    // Formatear fechas para búsqueda
    const fechaInicioStr = ot.fecha_generacion ? new Date(ot.fecha_generacion).toLocaleDateString('es-AR').toLowerCase() : '';
    const fechaFinalizacionStr = ot.fecha_egreso ? new Date(ot.fecha_egreso).toLocaleDateString('es-AR').toLowerCase() : '';
    
    // Calcular días abierta
    const diasAbierta = ot.fecha_generacion && ot.fecha_egreso 
      ? Math.ceil((new Date(ot.fecha_egreso) - new Date(ot.fecha_generacion)) / (1000 * 60 * 60 * 24))
      : null;
    const diasAbiertaStr = diasAbierta !== null ? diasAbierta.toString().toLowerCase() : '';
    
    // Formatear números para búsqueda
    const odometroStr = ot.odometro ? ot.odometro.toString().toLowerCase() : '';
    const horometroStr = ot.horometro ? ot.horometro.toString().toLowerCase() : '';
    
    // Obtener estado
    const tipoMantenimiento = validTipos.find(t => t.id_tipo === ot.id_tipo_mantenimiento);
    const estadoStr = tipoMantenimiento?.descripcion?.toLowerCase() || '';
    
    return nroOT.includes(searchLower) ||
           interno.includes(searchLower) ||
           nombreEmpresa.includes(searchLower) ||
           nombreConductor.includes(searchLower) ||
           apellidoConductor.includes(searchLower) ||
           conductorCompleto.includes(searchLower) ||
           fechaInicioStr.includes(searchLower) ||
           diasAbiertaStr.includes(searchLower) ||
           fechaFinalizacionStr.includes(searchLower) ||
           odometroStr.includes(searchLower) ||
           horometroStr.includes(searchLower) ||
           estadoStr.includes(searchLower);
  });

  // Aplicar filtro de fechas
  const filteredData = filterByDateRange(filteredBySearch);

  // Calcular paginación
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  // Obtener datos relacionados para una orden de trabajo
  const getOrdenData = (ot) => {
    const vehiculo = validVehiculos.find(v => v.id_vehiculo === ot.id_vehiculo);
    const empresa = vehiculo ? validEmpresas.find(e => e.id_empresa === vehiculo.id_empresa) : null;
    const conductor = validConductores.find(c => c.id_conductor === ot.id_conductor);
    const tipoMantenimiento = validTipos.find(t => t.id_tipo === ot.id_tipo_mantenimiento);
    
    return {
      vehiculo,
      empresa,
      conductor,
      tipoMantenimiento
    };
  };

  // Función para obtener el estilo del badge de estado basado en el tipo de mantenimiento
  const getEstadoBadgeStyle = (tipoMantenimiento) => {
    if (!tipoMantenimiento) {
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
  const handleDownloadReport = async () => {
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
    
    // Preparar datos completos con todas las relaciones
    const rows = await Promise.all(dataFiltradaPorFecha.map(async (ot) => {
      const { vehiculo, empresa, conductor, tipoMantenimiento } = getOrdenData(ot);
      
      // Obtener mecánicos asignados
      const mecanicosAsignados = validOrdenXMecanico
        .filter(oxm => oxm.id_orden === ot.id_orden)
        .map(oxm => {
          const mecanico = validMecanicos.find(m => m.id_mecanico === oxm.id_mecanico);
          return mecanico ? `${mecanico.nombre} ${mecanico.apellido || ''}`.trim() : '';
        })
        .filter(Boolean);
      const mecanicosStr = mecanicosAsignados.join('; ') || 'N/A';
      
      // Obtener usuarios asignados (inspector y auditor)
      const usuariosAsignados = validOrdenXUsuario
        .filter(oxu => oxu.id_orden_trabajo === ot.id_orden)
        .map(oxu => {
          const usuario = validUsuarios.find(u => u.id_usuario === oxu.id_usuario);
          if (!usuario) return null;
          const rol = validRoles.find(r => r.id_rol === usuario.id_rol);
          const rolNombre = rol?.nombre || 'N/A';
          return `${usuario.nombre_completo || usuario.username || 'N/A'} (${rolNombre})`;
        })
        .filter(Boolean);
      const usuariosStr = usuariosAsignados.join('; ') || 'N/A';
      
      // Separar inspectores y auditores
      const inspectores = validOrdenXUsuario
        .filter(oxu => oxu.id_orden_trabajo === ot.id_orden)
        .map(oxu => {
          const usuario = validUsuarios.find(u => u.id_usuario === oxu.id_usuario);
          if (!usuario) return null;
          const rol = validRoles.find(r => r.id_rol === usuario.id_rol);
          if (rol?.nombre === 'Inspector' || usuario.id_rol === 3) {
            return usuario.nombre_completo || usuario.username || 'N/A';
          }
          return null;
        })
        .filter(Boolean);
      const inspectoresStr = inspectores.join('; ') || 'N/A';
      
      const auditores = validOrdenXUsuario
        .filter(oxu => oxu.id_orden_trabajo === ot.id_orden)
        .map(oxu => {
          const usuario = validUsuarios.find(u => u.id_usuario === oxu.id_usuario);
          if (!usuario) return null;
          const rol = validRoles.find(r => r.id_rol === usuario.id_rol);
          if (rol?.nombre === 'Auditor' || usuario.id_rol === 4) {
            return usuario.nombre_completo || usuario.username || 'N/A';
          }
          return null;
        })
        .filter(Boolean);
      const auditoresStr = auditores.join('; ') || 'N/A';
      
      // Obtener insumos
      const insumosOrden = validDetallesInsumo
        .filter(di => di.id_orden === ot.id_orden)
        .map(di => {
          const insumo = validInsumos.find(i => i.id_insumo === di.id_insumo);
          return {
            codigo: insumo?.codigo_inventario || 'N/A',
            descripcion: insumo?.descripcion || 'N/A',
            cantidad: di.cantidad || 0,
            costoUnitario: di.costo_unitario_historico || 0,
            costoTotal: di.costo_total || 0
          };
        });
      
      const insumosStr = insumosOrden.length > 0
        ? insumosOrden.map(i => `${i.codigo} - ${i.descripcion} (Cant: ${i.cantidad}, Costo Unit: $${formatCurrency(i.costoUnitario)}, Total: $${formatCurrency(i.costoTotal)})`).join(' | ')
        : 'N/A';
      
      const totalInsumos = insumosOrden.reduce((sum, i) => sum + (parseFloat(i.costoTotal) || 0), 0);
      
      return [
        // Información básica de la orden
        ot.nro_orden_trabajo || '',
        ot.estado || 'N/A',
        formatDate(ot.fecha_generacion),
        formatDate(ot.fecha_egreso),
        ot.odometro ? formatNumber(ot.odometro) : '0',
        ot.horometro ? formatNumber(ot.horometro) : '0',
        
        // Información del vehículo
        vehiculo?.interno || 'N/A',
        vehiculo?.matricula || 'N/A',
        vehiculo?.marca || 'N/A',
        vehiculo?.modelo || 'N/A',
        vehiculo?.anio || 'N/A',
        vehiculo?.tipo_servicio || 'N/A',
        
        // Información de la empresa
        empresa?.nombre_empresa || 'N/A',
        empresa?.cuit || 'N/A',
        
        // Información del conductor
        conductor ? `${conductor.nombre} ${conductor.apellido || ''}`.trim() : 'N/A',
        conductor?.dni || 'N/A',
        conductor?.numero_licencia || 'N/A',
        conductor?.telefono || 'N/A',
        formatDate(conductor?.fecha_vencimiento_licencia),
        
        // Tipo de mantenimiento
        tipoMantenimiento?.descripcion || 'N/A',
        
        // Mecánicos asignados
        mecanicosStr,
        
        // Usuarios asignados
        inspectoresStr,
        auditoresStr,
        usuariosStr,
        
        // Insumos
        insumosStr,
        formatCurrency(totalInsumos),
        
        // Fechas adicionales
        formatDate(ot.created_at),
        formatDate(ot.updated_at)
      ];
    }));
    
    const headers = [
      // Información básica
      'N° Orden de Trabajo',
      'Estado',
      'Fecha de Inicio',
      'Fecha de Finalización',
      'Odómetro',
      'Horómetro',
      
      // Información del vehículo
      'Interno',
      'Matrícula',
      'Marca',
      'Modelo',
      'Año',
      'Tipo de Servicio',
      
      // Información de la empresa
      'Empresa de Transporte',
      'CUIT Empresa',
      
      // Información del conductor
      'Conductor',
      'DNI Conductor',
      'N° Licencia',
      'Teléfono Conductor',
      'Vencimiento Licencia',
      
      // Tipo de mantenimiento
      'Tipo de Mantenimiento',
      
      // Mecánicos
      'Mecánicos Asignados',
      
      // Usuarios
      'Inspector(es)',
      'Auditor(es)',
      'Usuarios Asignados',
      
      // Insumos
      'Insumos Utilizados',
      'Costo Total Insumos',
      
      // Fechas del sistema
      'Fecha de Creación',
      'Fecha de Actualización'
    ];
    
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
    
    const nombreArchivo = `reporte-ddjj-completo_desde-${fechaDesde}_hasta-${fechaHasta}-${new Date().toISOString().split('T')[0]}.csv`;
    
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
            DDJJ rergistradas
          </h1>
          <p className="text-white text-xs sm:text-sm font-normal" style={{ fontFamily: 'Lato, sans-serif', lineHeight: '1.2' }}>
            Consulta los reportes generados en el sistema
          </p>
        </div>

        {/* Tarjetas de métricas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6" style={{ width: '100%' }}>
        {/* Total de mantenimientos */}
        <div 
          className="bg-white rounded-lg shadow-md relative w-full flex flex-col"
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
            <div className="flex items-center justify-center gap-1 mt-1 flex-shrink-0">
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
                {ddjjTendencia.esPositiva ? '+ ' : '- '}{ddjjTendencia.porcentaje}%
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

        {/* Mantenimientos preventivos */}
        <div 
          className="bg-white rounded-lg shadow-md relative w-full flex flex-col"
          style={{
            minHeight: '120px',
            padding: isMobile ? '16px' : '24px'
          }}
        >
          <h3 
            className="mb-2" 
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
          <div className="flex items-center justify-center gap-2 flex-shrink-0">
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
          {/* Texto de porcentaje */}
          <p 
            className="text-center mt-1 flex-shrink-0"
            style={{ 
              color: '#6B7280',
              fontSize: isMobile ? '12px' : '14px',
              fontFamily: 'Lato, sans-serif'
            }}
          >
            {porcentajePreventivos}% del total de mantenimientos
          </p>
        </div>

        {/* Mantenimientos correctivos */}
        <div 
          className="bg-white rounded-lg shadow-md relative w-full flex flex-col"
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
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
          {/* Indicador de tendencia */}
          {correctivosTendencia && (
            <div className="flex items-center justify-center gap-1 mt-1 flex-shrink-0">
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
                {correctivosTendencia.esPositiva ? '+ ' : '- '}{correctivosTendencia.porcentaje}%
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

        {/* Tabla de Órdenes de Trabajo */}
        <div
          className="bg-white rounded-lg shadow-md p-4 sm:p-6"
          style={{
            border: '1px solid #E5E7EB'
          }}
        >
          {/* Título, subtítulo, buscador y botón */}
          <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
            <div className="flex-1">
              <h2
                style={{
                  fontSize: isMobile ? '16px' : '18px',
                  fontWeight: 'bold',
                  color: '#374151',
                  marginBottom: '4px',
                  fontFamily: 'Lato, sans-serif'
                }}
              >
                Tabla de Órdenes de Trabajo
              </h2>
              <p
                style={{
                  fontSize: isMobile ? '12px' : '14px',
                  color: '#6B7280',
                  fontFamily: 'Lato, sans-serif'
                }}
              >
                Detalle de las órdenes de trabajo registradas por empresas
              </p>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-end gap-3 flex-shrink-0 w-full sm:w-auto">
              <div className="w-full sm:max-w-xs lg:max-w-md">
                <label 
                  htmlFor="search-reportes"
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
                    id="search-reportes"
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
                    className="w-4 h-4 sm:w-5 sm:h-5 absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
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
          </div>

          {/* Contenedor con borde para rango de fechas */}
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

          {/* Tabla */}
          <div className="overflow-x-auto -mx-3 sm:-mx-4 md:mx-0 w-full">
            <div className="inline-block min-w-full align-middle">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-gray-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                    Cargando datos...
                  </div>
                </div>
              ) : (
                <table className="w-full min-w-[1200px]" style={{ fontFamily: 'Lato, sans-serif' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap" style={{ fontSize: '12px', color: '#374151' }}>N OT</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap" style={{ fontSize: '12px', color: '#374151' }}>Interno</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap" style={{ fontSize: '12px', color: '#374151' }}>Empresa</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap" style={{ fontSize: '12px', color: '#374151' }}>F. Inicio</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap" style={{ fontSize: '12px', color: '#374151' }}>Días abierta</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap" style={{ fontSize: '12px', color: '#374151' }}>F. Finalización</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap" style={{ fontSize: '12px', color: '#374151' }}>Odómetro</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap" style={{ fontSize: '12px', color: '#374151' }}>Horómetro</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap" style={{ fontSize: '12px', color: '#374151' }}>Conductor</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap" style={{ fontSize: '12px', color: '#374151' }}>Tipo</th>
                    </tr>
                  </thead>
                <tbody>
                  {currentData.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="py-8 text-center text-gray-500">
                        No se encontraron registros
                      </td>
                    </tr>
                  ) : (
                    currentData.map((ot, index) => {
                      const { vehiculo, empresa, conductor, tipoMantenimiento } = getOrdenData(ot);
                      // Determinar el estado según el tipo de mantenimiento
                      let estadoMostrar = 'N/A';
                      if (tipoMantenimiento?.descripcion === 'Preventivo') {
                        estadoMostrar = 'Preventivo';
                      } else if (tipoMantenimiento?.descripcion === 'Correctivo') {
                        estadoMostrar = 'Correcto';
                      }
                      const estadoStyle = getEstadoBadgeStyle(tipoMantenimiento?.descripcion);
                      
                      return (
                        <tr 
                          key={ot.id_orden}
                          style={{ 
                            borderBottom: '1px solid #E5E7EB',
                            backgroundColor: index % 2 === 0 ? '#FFFFFF' : '#F9FAFB'
                          }}
                        >
                          <td className="py-2 sm:py-3 px-2 sm:px-4" style={{ fontSize: '12px', color: '#374151' }}>
                            {ot.nro_orden_trabajo || '-'}
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4" style={{ fontSize: '12px', color: '#374151' }}>
                            {vehiculo?.interno || '-'}
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4" style={{ fontSize: '12px', color: '#374151' }}>
                            {empresa?.nombre_empresa || '-'}
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4" style={{ fontSize: '12px', color: '#374151' }}>
                            {formatDate(ot.fecha_generacion)}
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4" style={{ fontSize: '12px', color: '#374151' }}>
                            {(() => {
                              const tiempoAbierta = calcularDiasAbierta(ot.fecha_generacion);
                              const iconColor = getClockIconColor(tiempoAbierta.totalDias);
                              
                              // Formatear tiempo: días, horas y minutos
                              let tiempoTexto = '';
                              if (tiempoAbierta.dias > 0) {
                                tiempoTexto = `${String(tiempoAbierta.dias).padStart(2, '0')} días`;
                                if (tiempoAbierta.horas > 0) {
                                  tiempoTexto += ` ${String(tiempoAbierta.horas).padStart(2, '0')}h`;
                                }
                                if (tiempoAbierta.minutos > 0) {
                                  tiempoTexto += ` ${String(tiempoAbierta.minutos).padStart(2, '0')}m`;
                                }
                              } else if (tiempoAbierta.horas > 0) {
                                tiempoTexto = `${String(tiempoAbierta.horas).padStart(2, '0')} horas`;
                                if (tiempoAbierta.minutos > 0) {
                                  tiempoTexto += ` ${String(tiempoAbierta.minutos).padStart(2, '0')}m`;
                                }
                              } else {
                                tiempoTexto = `${String(tiempoAbierta.minutos).padStart(2, '0')} minutos`;
                              }
                              
                              return (
                                <div className="flex items-center gap-2">
                                  <svg 
                                    className="w-4 h-4 flex-shrink-0" 
                                    fill="none" 
                                    stroke={iconColor} 
                                    viewBox="0 0 24 24" 
                                    strokeWidth={2}
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span style={{ fontFamily: 'Lato, sans-serif' }}>
                                    {tiempoTexto}
                                  </span>
                                </div>
                              );
                            })()}
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4" style={{ fontSize: '12px', color: '#374151' }}>
                            {formatDate(ot.fecha_egreso)}
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4" style={{ fontSize: '12px', color: '#374151' }}>
                            {ot.odometro ? `${formatNumber(ot.odometro)} km` : '-'}
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4" style={{ fontSize: '12px', color: '#374151' }}>
                            {ot.horometro ? `${formatNumber(ot.horometro)} hs` : '-'}
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4">
                            <button
                              onClick={() => {
                                if (conductor) {
                                  setSelectedConductor(conductor);
                                  setShowConductorModal(true);
                                }
                              }}
                              className="flex items-center gap-1 text-[#007C8A] hover:text-[#005A63] transition-colors"
                              title={conductor ? `${conductor.nombre} ${conductor.apellido}` : 'Sin conductor'}
                              disabled={!conductor}
                            >
                              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4">
                            {estadoMostrar && estadoMostrar !== 'N/A' ? (
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
                                {estadoMostrar}
                              </span>
                            ) : (
                              <span style={{ fontSize: '12px', color: '#9CA3AF' }}>N/A</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
              )}
            </div>
          </div>

          {/* Paginación */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm" style={{ color: '#6B7280', fontFamily: 'Lato, sans-serif' }}>
                Elementos por página
              </span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 sm:px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007C8A] text-xs sm:text-sm"
                style={{
                  fontFamily: 'Lato, sans-serif'
                }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <span className="text-xs sm:text-sm" style={{ color: '#6B7280', fontFamily: 'Lato, sans-serif' }}>
                {startIndex + 1}-{Math.min(endIndex, filteredData.length)} de {filteredData.length}
              </span>
              <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                style={{
                  color: currentPage === 1 ? '#9CA3AF' : '#374151'
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                style={{
                  color: currentPage === totalPages ? '#9CA3AF' : '#374151'
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
          </div>
        </div>
      </div>

      {/* Modal de detalle de conductor */}
      {showConductorModal && selectedConductor && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backgroundColor: 'rgba(0, 124, 138, 0.5)' }}
          onClick={() => {
            setShowConductorModal(false);
            setSelectedConductor(null);
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
                  color: '#1F2937'
                }}
              >
                Detalle de conductor
              </h3>
              <p 
                className="text-sm mt-1"
                style={{ 
                  color: '#6B7280'
                }}
              >
                Nombre y licencia de conductor asignado a reporte
              </p>
            </div>

            {/* Contenido del modal */}
            <div className="px-6 py-6">
              {/* Información del conductor */}
              <div className="flex items-center gap-3 mb-4">
                <div 
                  className="rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: '#E0F7FA',
                    width: '40px',
                    height: '40px'
                  }}
                >
                  <svg className="w-5 h-5 text-[#007C8A]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p 
                    className="text-sm font-medium mb-1"
                    style={{ 
                      color: '#6B7280'
                    }}
                  >
                    Conductor:
                  </p>
                  <p 
                    className="text-base font-semibold"
                    style={{ 
                      color: '#1F2937'
                    }}
                  >
                    {selectedConductor.nombre} {selectedConductor.apellido}
                  </p>
                </div>
              </div>

              {/* Información de la licencia */}
              <div className="flex items-center gap-3">
                <div 
                  className="rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: '#E0F7FA',
                    width: '40px',
                    height: '40px'
                  }}
                >
                  <svg className="w-5 h-5 text-[#007C8A]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p 
                    className="text-sm font-medium mb-1"
                    style={{ 
                      color: '#6B7280'
                    }}
                  >
                    Licencia:
                  </p>
                  <p 
                    className="text-base font-semibold"
                    style={{ 
                      color: '#1F2937'
                    }}
                  >
                    {selectedConductor.numero_licencia || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer del modal */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => {
                  setShowConductorModal(false);
                  setSelectedConductor(null);
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

export default ReportesDDJJ;
