import { useState, useEffect, useRef } from 'react';
import { getAllFromTable, insertIntoTable } from '../config/supabase';
import { useAuth } from '../context/AuthContext';

const ExploradorAuditorias = () => {
  const { user } = useAuth();
  const [ordenesTrabajo, setOrdenesTrabajo] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [tiposMantenimiento, setTiposMantenimiento] = useState([]);
  const [ordenXUsuario, setOrdenXUsuario] = useState([]);
  const [lineasServicio, setLineasServicio] = useState([]);
  const [detallesInsumo, setDetallesInsumo] = useState([]);
  const [insumosCatalogo, setInsumosCatalogo] = useState([]);
  const [mecanicos, setMecanicos] = useState([]);
  const [ordenXMecanico, setOrdenXMecanico] = useState([]);
  const [conductores, setConductores] = useState([]);
  const [inspeccionesDDJJ, setInspeccionesDDJJ] = useState([]);
  const [rtoRegistros, setRtoRegistros] = useState([]);
  const [reportesAuditoria, setReportesAuditoria] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showVerDDJJModal, setShowVerDDJJModal] = useState(false);
  const [ordenSeleccionadaVer, setOrdenSeleccionadaVer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isMobile, setIsMobile] = useState(false);

  // Métricas
  const [totalVehiculos, setTotalVehiculos] = useState(0);
  const [reportesConformes, setReportesConformes] = useState(0);
  const [reportesNoConformes, setReportesNoConformes] = useState(0);
  const [costoTotal, setCostoTotal] = useState(0);
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);
  const [showRevisarModal, setShowRevisarModal] = useState(false);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);
  const [formDataRevisar, setFormDataRevisar] = useState({
    tipoReporte: '', // 'correcto' o 'discrepancias'
    observaciones: ''
  });
  const [showRevisarInspeccionModal, setShowRevisarInspeccionModal] = useState(false);
  const [ordenSeleccionadaRevisarInspeccion, setOrdenSeleccionadaRevisarInspeccion] = useState(null);
  const [datosInspeccionRevisar, setDatosInspeccionRevisar] = useState(null);
  const [showGenerarReporteModal, setShowGenerarReporteModal] = useState(false);
  const [showConfirmacionModal, setShowConfirmacionModal] = useState(false);
  const [ordenSeleccionadaGenerar, setOrdenSeleccionadaGenerar] = useState(null);
  const [formDataGenerarReporte, setFormDataGenerarReporte] = useState({
    tipoReporte: '', // 'correcto' o 'discrepancias'
    observaciones: ''
  });
  const [toast, setToast] = useState(null);
  const [showAuditarModal, setShowAuditarModal] = useState(false);
  const [ordenSeleccionadaAuditar, setOrdenSeleccionadaAuditar] = useState(null);
  const [resultadoAuditoria, setResultadoAuditoria] = useState(null);
  const [observacionesAuditar, setObservacionesAuditar] = useState('');
  const [isGuardandoAuditar, setIsGuardandoAuditar] = useState(false);

  // Detectar tamaño de pantalla
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    };

    if (openMenuId) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMenuId]);

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
    if (!num && num !== 0) return '$0,00';
    return `$${new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num)}`;
  };

  // Función para convertir fecha a formato input date (YYYY-MM-DD)
  const convertToDateInputFormat = (fecha) => {
    if (!fecha) return '';
    try {
      const date = new Date(fecha);
      if (isNaN(date.getTime())) return '';
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (error) {
      return '';
    }
  };

  // Función para generar ID DDJJ (formato: MNT-YYYY-NNNNN)
  const generarIdDDJJ = (orden) => {
    if (orden.nro_orden_trabajo) return orden.nro_orden_trabajo;
    const fechaGen = orden.fecha_generacion ? new Date(orden.fecha_generacion) : new Date();
    const anio = fechaGen.getFullYear();
    const numero = String(orden.id_orden).padStart(5, '0');
    return `MNT-${anio}-${numero}`;
  };

  // Cargar datos
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Obtener todos los datos (Auditor ve todo)
        const [
          ordenesData,
          vehiculosData,
          empresasData,
          tiposData,
          ordenXUsuarioData,
          lineasData,
          detallesData,
          insumosData,
          mecanicosData,
          ordenXMecanicoData,
          conductoresData,
          inspeccionesData,
          rtoData,
          reportesAuditoriaData
        ] = await Promise.all([
          getAllFromTable('orden_trabajo'),
          getAllFromTable('vehiculo'),
          getAllFromTable('empresa'),
          getAllFromTable('tipo_mantenimiento'),
          getAllFromTable('orden_x_usuario'),
          getAllFromTable('linea_servicio'),
          getAllFromTable('detalle_insumo'),
          getAllFromTable('insumo_catalogo'),
          getAllFromTable('mecanico'),
          getAllFromTable('orden_x_mecanico'),
          getAllFromTable('conductor'),
          getAllFromTable('inspeccion_ddjj'),
          getAllFromTable('rto_registro'),
          getAllFromTable('reporte_auditoria_ddjj')
        ]);
        
        // Validar que sean arrays
        const validOrdenes = Array.isArray(ordenesData) ? ordenesData : [];
        const validVehiculos = Array.isArray(vehiculosData) ? vehiculosData : [];
        const validEmpresas = Array.isArray(empresasData) ? empresasData : [];
        const validTipos = Array.isArray(tiposData) ? tiposData : [];
        const validOrdenXUsuario = Array.isArray(ordenXUsuarioData) ? ordenXUsuarioData : [];
        const validLineas = Array.isArray(lineasData) ? lineasData : [];
        const validDetalles = Array.isArray(detallesData) ? detallesData : [];
        const validInsumos = Array.isArray(insumosData) ? insumosData : [];
        const validMecanicos = Array.isArray(mecanicosData) ? mecanicosData : [];
        const validOrdenXMecanico = Array.isArray(ordenXMecanicoData) ? ordenXMecanicoData : [];
        const validConductores = Array.isArray(conductoresData) ? conductoresData : [];
        const validInspecciones = Array.isArray(inspeccionesData) ? inspeccionesData : [];
        const validRtoRegistros = Array.isArray(rtoData) ? rtoData : [];
        const validReportesAuditoria = Array.isArray(reportesAuditoriaData) ? reportesAuditoriaData : [];
        
        setOrdenesTrabajo(validOrdenes);
        setVehiculos(validVehiculos);
        setEmpresas(validEmpresas);
        setTiposMantenimiento(validTipos);
        setOrdenXUsuario(validOrdenXUsuario);
        setLineasServicio(validLineas);
        setDetallesInsumo(validDetalles);
        setInsumosCatalogo(validInsumos);
        setMecanicos(validMecanicos);
        setOrdenXMecanico(validOrdenXMecanico);
        setConductores(validConductores);
        setInspeccionesDDJJ(validInspecciones);
        setRtoRegistros(validRtoRegistros);
        setReportesAuditoria(validReportesAuditoria);

        // Calcular métricas basadas en reportes de auditoría
        
        // 1. Total de vehículos reportados = Total de órdenes de trabajo (DDJJ)
        const totalOrdenes = validOrdenes.length;
        setTotalVehiculos(totalOrdenes);

        // 2. Calcular reportes conformes y no conformes basados en reporte_auditoria_ddjj
        const reportesCorrectos = validReportesAuditoria.filter(
          r => r.tipo_reporte === 'correcto' || r.tipo_reporte === 'Correcto'
        );
        const reportesDiscrepancias = validReportesAuditoria.filter(
          r => r.tipo_reporte === 'discrepancias' || r.tipo_reporte === 'Discrepancias' || 
               r.tipo_reporte === 'discrepancia' || r.tipo_reporte === 'Discrepancia'
        );

        setReportesConformes(reportesCorrectos.length);
        setReportesNoConformes(reportesDiscrepancias.length);

        // 3. Calcular costo total acumulado de los últimos 30 días
        // Solo incluir órdenes que tienen reporte de auditoría creado en los últimos 30 días
        const hoy = new Date();
        const hace30Dias = new Date(hoy);
        hace30Dias.setDate(hace30Dias.getDate() - 30);
        hace30Dias.setHours(0, 0, 0, 0);

        // Filtrar reportes de auditoría de los últimos 30 días
        const reportesUltimos30Dias = validReportesAuditoria.filter(r => {
          const fechaReporte = new Date(r.fecha_creacion || r.created_at);
          fechaReporte.setHours(0, 0, 0, 0);
          return fechaReporte >= hace30Dias;
        });

        // Obtener IDs de órdenes que tienen reportes de auditoría en los últimos 30 días
        const idsOrdenesAuditadas = new Set(
          reportesUltimos30Dias.map(r => r.id_orden_trabajo)
        );

        // Calcular costo total sumando los costos de detalle_insumo de esas órdenes
        const costo = validDetalles.reduce((sum, detalle) => {
          // Solo incluir si la orden tiene reporte de auditoría en los últimos 30 días
          if (idsOrdenesAuditadas.has(detalle.id_orden)) {
            const costoDetalle = parseFloat(detalle.costo_total) || 0;
            return sum + costoDetalle;
          }
          return sum;
        }, 0);

        setCostoTotal(costo);
      } catch (error) {
        console.error('Error al cargar datos:', error);
        setOrdenesTrabajo([]);
        setVehiculos([]);
        setEmpresas([]);
        setTiposMantenimiento([]);
        setOrdenXUsuario([]);
        setLineasServicio([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Obtener ID del usuario auditor actual
  const idUsuarioAuditor = user?.id || user?.id_usuario;

  // Preparar datos para la tabla
  const datosTabla = ordenesTrabajo.map(orden => {
    const vehiculo = vehiculos.find(v => v.id_vehiculo === orden.id_vehiculo);
    const empresa = vehiculo ? empresas.find(e => e.id_empresa === vehiculo.id_empresa) : null;
    const tipo = tiposMantenimiento.find(t => t.id_tipo_mantenimiento === orden.id_tipo_mantenimiento);
    const asignacion = ordenXUsuario.find(oxu => oxu.id_orden_trabajo === orden.id_orden);
    
    // Buscar reporte de auditoría para esta orden
    const reporteAuditoria = reportesAuditoria.find(
      r => r.id_orden_trabajo === orden.id_orden
    );
    
    // Verificar si esta orden está asignada al auditor actual
    const estaAsignadaAlAuditor = idUsuarioAuditor && asignacion 
      ? parseInt(asignacion.id_usuario, 10) === parseInt(idUsuarioAuditor, 10)
      : false;
    
    // Determinar estado basado en el reporte de auditoría
    // Si existe un reporte, usar el tipo_reporte (mapeado a 'Correcto' o 'Discrepancia')
    // Si no existe reporte, mostrar '-' o estado por defecto
    let estado = '-';
    if (reporteAuditoria) {
      estado = reporteAuditoria.tipo_reporte === 'correcto' ? 'Correcto' : 'Discrepancia';
    }

    return {
      ...orden,
      vehiculo,
      empresa,
      tipo,
      asignacion,
      estado,
      reporteAuditoria, // Incluir el reporte de auditoría
      tieneReporteAuditoria: !!reporteAuditoria, // Flag para saber si tiene reporte
      estaAsignadaAlAuditor, // Nueva propiedad para indicar si está asignada al auditor actual
      interno: vehiculo?.interno || '-',
      nombreEmpresa: empresa?.nombre_empresa || empresa?.nombre || '-',
      nombreTarea: tipo?.descripcion || tipo?.nombre || '-',
      idDDJJ: generarIdDDJJ(orden)
    };
  });

  // Filtrar datos
  const filteredData = datosTabla.filter(item => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    
    // Formatear fechas para búsqueda
    const fechaIngresoStr = item.fecha_generacion ? new Date(item.fecha_generacion).toLocaleDateString('es-AR').toLowerCase() : '';
    
    // Formatear números para búsqueda
    const odometroStr = item.odometro ? item.odometro.toString().toLowerCase() : '';
    const horometroStr = item.horometro ? item.horometro.toString().toLowerCase() : '';
    
    // Obtener estado
    const estadoStr = item.estado?.toLowerCase() || '';
    
    return (
      (item.nro_orden_trabajo && item.nro_orden_trabajo.toLowerCase().includes(searchLower)) ||
      (item.interno && item.interno.toLowerCase().includes(searchLower)) ||
      (item.nombreEmpresa && item.nombreEmpresa.toLowerCase().includes(searchLower)) ||
      (item.nombreTarea && item.nombreTarea.toLowerCase().includes(searchLower)) ||
      fechaIngresoStr.includes(searchLower) ||
      odometroStr.includes(searchLower) ||
      horometroStr.includes(searchLower) ||
      estadoStr.includes(searchLower)
    );
  });

  // Paginación
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  // Función para comparar DDJJ con inspección del inspector
  const compararDDJJConInspeccion = (item) => {
    // Obtener la inspección del inspector para esta orden
    const inspeccion = inspeccionesDDJJ.find(ins => ins.id_orden_trabajo === item.id_orden);
    
    if (!inspeccion) {
      return {
        tieneInspeccion: false,
        diferencias: [],
        todoCorrecto: false
      };
    }

    // Obtener datos relacionados
    const vehiculo = vehiculos.find(v => v.id_vehiculo === item.id_vehiculo);
    const empresa = vehiculo ? empresas.find(e => e.id_empresa === vehiculo.id_empresa) : null;
    const conductor = vehiculo?.id_conductor_activo ? conductores.find(c => c.id_conductor === vehiculo.id_conductor_activo) : null;
    const rto = rtoRegistros
      .filter(r => r.id_vehiculo === vehiculo?.id_vehiculo && r.activo)
      .sort((a, b) => new Date(b.fecha_vencimiento || 0) - new Date(a.fecha_vencimiento || 0))[0];

    // Preparar datos declarados (DDJJ)
    const datosDeclarados = {
      licencia: conductor?.fecha_vencimiento_licencia || '',
      rtoVencimiento: rto?.fecha_vencimiento || '',
      seguroVencimiento: vehiculo?.fecha_vencimiento_seguro || '',
      aireAcondicionado: vehiculo?.posee_ac || false,
      calefaccion: vehiculo?.posee_calefaccion || false,
      camara: vehiculo?.posee_camara || false
    };

    // Preparar datos de inspección del inspector
    const datosInspeccion = {
      licencia: inspeccion.licencia_correcto,
      rto: inspeccion.rto_correcto,
      seguro: inspeccion.seguro_correcto,
      aireAcondicionado: inspeccion.aire_acondicionado_correcto,
      calefaccion: inspeccion.calefaccion_correcto,
      camara: inspeccion.camara_correcto
    };

    // Comparar y encontrar diferencias
    const diferencias = [];

    // Comparar Licencia
    if (datosDeclarados.licencia && datosInspeccion.licencia === false) {
      diferencias.push({
        campo: 'Licencia',
        declarado: datosDeclarados.licencia ? 'Presente' : 'No presente',
        inspeccion: datosInspeccion.licencia ? 'Correcto' : 'Incorrecto',
        mensaje: 'La licencia fue declarada pero el inspector marcó que es incorrecta'
      });
    } else if (!datosDeclarados.licencia && datosInspeccion.licencia === true) {
      diferencias.push({
        campo: 'Licencia',
        declarado: 'No presente',
        inspeccion: 'Correcto',
        mensaje: 'La licencia no fue declarada pero el inspector marcó que es correcta'
      });
    }

    // Comparar RTO
    if (datosDeclarados.rtoVencimiento && datosInspeccion.rto === false) {
      diferencias.push({
        campo: 'RTO',
        declarado: datosDeclarados.rtoVencimiento ? formatDate(datosDeclarados.rtoVencimiento) : 'No presente',
        inspeccion: datosInspeccion.rto ? 'Correcto' : 'Incorrecto',
        mensaje: 'El RTO fue declarado pero el inspector marcó que es incorrecto'
      });
    } else if (!datosDeclarados.rtoVencimiento && datosInspeccion.rto === true) {
      diferencias.push({
        campo: 'RTO',
        declarado: 'No presente',
        inspeccion: 'Correcto',
        mensaje: 'El RTO no fue declarado pero el inspector marcó que es correcto'
      });
    }

    // Comparar Seguro
    if (datosDeclarados.seguroVencimiento && datosInspeccion.seguro === false) {
      diferencias.push({
        campo: 'Seguro',
        declarado: datosDeclarados.seguroVencimiento ? formatDate(datosDeclarados.seguroVencimiento) : 'No presente',
        inspeccion: datosInspeccion.seguro ? 'Correcto' : 'Incorrecto',
        mensaje: 'El seguro fue declarado pero el inspector marcó que es incorrecto'
      });
    } else if (!datosDeclarados.seguroVencimiento && datosInspeccion.seguro === true) {
      diferencias.push({
        campo: 'Seguro',
        declarado: 'No presente',
        inspeccion: 'Correcto',
        mensaje: 'El seguro no fue declarado pero el inspector marcó que es correcto'
      });
    }

    // Comparar Aire acondicionado
    if (datosDeclarados.aireAcondicionado !== datosInspeccion.aireAcondicionado) {
      diferencias.push({
        campo: 'Aire acondicionado',
        declarado: datosDeclarados.aireAcondicionado ? 'Sí' : 'No',
        inspeccion: datosInspeccion.aireAcondicionado ? 'Correcto' : 'Incorrecto',
        mensaje: `Se declaró ${datosDeclarados.aireAcondicionado ? 'con' : 'sin'} aire acondicionado pero el inspector marcó ${datosInspeccion.aireAcondicionado ? 'correcto' : 'incorrecto'}`
      });
    }

    // Comparar Calefacción
    if (datosDeclarados.calefaccion !== datosInspeccion.calefaccion) {
      diferencias.push({
        campo: 'Calefacción',
        declarado: datosDeclarados.calefaccion ? 'Sí' : 'No',
        inspeccion: datosInspeccion.calefaccion ? 'Correcto' : 'Incorrecto',
        mensaje: `Se declaró ${datosDeclarados.calefaccion ? 'con' : 'sin'} calefacción pero el inspector marcó ${datosInspeccion.calefaccion ? 'correcto' : 'incorrecto'}`
      });
    }

    // Comparar Cámara
    if (datosDeclarados.camara !== datosInspeccion.camara) {
      diferencias.push({
        campo: 'Cámara',
        declarado: datosDeclarados.camara ? 'Sí' : 'No',
        inspeccion: datosInspeccion.camara ? 'Correcto' : 'Incorrecto',
        mensaje: `Se declaró ${datosDeclarados.camara ? 'con' : 'sin'} cámara pero el inspector marcó ${datosInspeccion.camara ? 'correcto' : 'incorrecto'}`
      });
    }

    return {
      tieneInspeccion: true,
      diferencias,
      todoCorrecto: diferencias.length === 0,
      datosDeclarados,
      datosInspeccion,
      inspeccion,
      vehiculo,
      empresa,
      conductor,
      rto
    };
  };

  // Handler para auditar DDJJ
  const handleAuditarDDJJ = (item) => {
    const resultado = compararDDJJConInspeccion(item);
    setOrdenSeleccionadaAuditar(item);
    setResultadoAuditoria(resultado);
    setObservacionesAuditar(''); // Limpiar observaciones al abrir el modal
    setShowAuditarModal(true);
  };

  // Función para guardar el resultado de la auditoría
  const handleGuardarAuditoria = async (tipoReporte) => {
    if (!ordenSeleccionadaAuditar || !user) {
      return;
    }

    setIsGuardandoAuditar(true);
    try {
      // Obtener el id_ddjj de la orden de trabajo
      const idDDJJ = ordenSeleccionadaAuditar.id_ddjj || null;

      // Preparar datos para insertar en reporte_auditoria_ddjj
      const reporteData = {
        id_usuario: user.id_usuario || user.id,
        id_orden_trabajo: ordenSeleccionadaAuditar.id_orden,
        id_ddjj: idDDJJ,
        tipo_reporte: tipoReporte, // 'correcto' o 'discrepancias'
        observaciones: observacionesAuditar.trim() || null
      };

      // Insertar en Supabase
      await insertIntoTable('reporte_auditoria_ddjj', reporteData);

      // Recargar reportes de auditoría para actualizar la tabla
      const nuevosReportes = await getAllFromTable('reporte_auditoria_ddjj');
      setReportesAuditoria(Array.isArray(nuevosReportes) ? nuevosReportes : []);

      // Mostrar toast de éxito
      setToast({
        type: 'success',
        title: 'Auditoría guardada',
        message: `Se ha guardado el reporte como "${tipoReporte === 'correcto' ? 'Correcto' : 'Discrepancias'}" exitosamente.`
      });

      // Cerrar modal y limpiar estados
      setShowAuditarModal(false);
      setOrdenSeleccionadaAuditar(null);
      setResultadoAuditoria(null);
      setObservacionesAuditar('');

      // Auto-cerrar toast después de 5 segundos
      setTimeout(() => setToast(null), 5000);
    } catch (error) {
      console.error('Error al guardar auditoría:', error);
      setToast({
        type: 'error',
        title: 'Error al guardar',
        message: 'No se pudo guardar el reporte de auditoría. Por favor, intente nuevamente.'
      });
      setTimeout(() => setToast(null), 5000);
    } finally {
      setIsGuardandoAuditar(false);
    }
  };

  // Handlers para las acciones del menú
  const handleRevisarInspeccion = async (item) => {
    setOpenMenuId(null);
    
    try {
      // Obtener la inspección del inspector para esta orden
      const inspeccion = inspeccionesDDJJ.find(ins => ins.id_orden_trabajo === item.id_orden);
      
      if (!inspeccion) {
        setToast({
          type: 'error',
          title: 'Sin inspección',
          message: 'No se encontró una inspección para esta DDJJ. El inspector aún no ha realizado la inspección.'
        });
        setTimeout(() => setToast(null), 5000);
        return;
      }

      // Obtener datos relacionados
      const vehiculo = vehiculos.find(v => v.id_vehiculo === item.id_vehiculo);
      const empresa = vehiculo ? empresas.find(e => e.id_empresa === vehiculo.id_empresa) : null;
      const conductor = vehiculo?.id_conductor_activo ? conductores.find(c => c.id_conductor === vehiculo.id_conductor_activo) : null;
      const rto = rtoRegistros
        .filter(r => r.id_vehiculo === vehiculo?.id_vehiculo && r.activo)
        .sort((a, b) => new Date(b.fecha_vencimiento || 0) - new Date(a.fecha_vencimiento || 0))[0];

      // Preparar datos declarados
      const datosDeclarados = {
        licencia: conductor?.fecha_vencimiento_licencia || '',
        rtoVencimiento: rto?.fecha_vencimiento || '',
        seguroVencimiento: vehiculo?.fecha_vencimiento_seguro || '',
        aireAcondicionado: vehiculo?.posee_ac ? 'Si' : 'No',
        calefaccion: vehiculo?.posee_ac ? 'Si' : 'No',
        camara: vehiculo?.posee_camara ? 'Si' : 'No'
      };

      // Preparar datos de inspección
      const datosInspeccion = {
        licencia: inspeccion.licencia_correcto,
        rto: inspeccion.rto_correcto,
        seguro: inspeccion.seguro_correcto,
        aireAcondicionado: inspeccion.aire_acondicionado_correcto,
        calefaccion: inspeccion.calefaccion_correcto,
        camara: inspeccion.camara_correcto,
        observaciones: inspeccion.observaciones || '',
        conformidad: inspeccion.conformidad // true = CONFORME, false = NO CONFORME, null = no especificado
      };

      setOrdenSeleccionadaRevisarInspeccion(item);
      setDatosInspeccionRevisar({
        orden: item,
        vehiculo,
        empresa,
        conductor,
        rto,
        datosDeclarados,
        datosInspeccion,
        inspeccion
      });
      setShowRevisarInspeccionModal(true);
    } catch (error) {
      console.error('Error al cargar datos de inspección:', error);
      setToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudieron cargar los datos de la inspección'
      });
      setTimeout(() => setToast(null), 5000);
    }
  };

  const handleCancelarRevisar = () => {
    setShowRevisarModal(false);
    setOrdenSeleccionada(null);
    setFormDataRevisar({
      tipoReporte: '',
      observaciones: ''
    });
  };

  const handleGenerarReporteRevisar = () => {
    // TODO: Implementar lógica para generar reporte
    console.log('Generar reporte:', {
      orden: ordenSeleccionada,
      tipoReporte: formDataRevisar.tipoReporte,
      observaciones: formDataRevisar.observaciones
    });
    handleCancelarRevisar();
  };

  const handleGenerarReporte = (item) => {
    setOpenMenuId(null);
    setOrdenSeleccionadaGenerar(item);
    setFormDataGenerarReporte({
      tipoReporte: '',
      observaciones: ''
    });
    setShowGenerarReporteModal(true);
  };

  const handleCancelarGenerarReporte = () => {
    setShowGenerarReporteModal(false);
    setOrdenSeleccionadaGenerar(null);
    setFormDataGenerarReporte({
      tipoReporte: '',
      observaciones: ''
    });
  };

  const handleConfirmarGenerarReporte = () => {
    // Mostrar modal de confirmación
    setShowConfirmacionModal(true);
  };

  const handleCancelarConfirmacion = () => {
    setShowConfirmacionModal(false);
  };

  const handleEjecutarGenerarReporte = async () => {
    try {
      // Validar que tenemos los datos necesarios
      if (!user || !user.id) {
        setToast({
          type: 'error',
          title: 'Error de autenticación',
          message: 'No se pudo identificar al usuario. Por favor, inicie sesión nuevamente.'
        });
        setTimeout(() => setToast(null), 5000);
        return;
      }

      if (!ordenSeleccionadaGenerar || !ordenSeleccionadaGenerar.id_orden) {
        setToast({
          type: 'error',
          title: 'Error',
          message: 'No se pudo identificar la orden de trabajo.'
        });
        setTimeout(() => setToast(null), 5000);
        return;
      }

      if (!formDataGenerarReporte.tipoReporte) {
        setToast({
          type: 'error',
          title: 'Error de validación',
          message: 'Debe seleccionar un tipo de reporte.'
        });
        setTimeout(() => setToast(null), 5000);
        return;
      }

      // Preparar datos para insertar
      const reporteData = {
        id_usuario: user.id,
        id_orden_trabajo: ordenSeleccionadaGenerar.id_orden,
        tipo_reporte: formDataGenerarReporte.tipoReporte,
        observaciones: formDataGenerarReporte.observaciones || null
      };

      // Insertar en Supabase
      await insertIntoTable('reporte_auditoria_ddjj', reporteData);

      // Obtener el ID DDJJ de la orden
      const idDDJJ = ordenSeleccionadaGenerar?.idDDJJ || generarIdDDJJ(ordenSeleccionadaGenerar);
      
      // Mostrar toast de éxito
      setToast({
        type: 'success',
        title: 'Reporte generado',
        message: `Se ha realizado el reporte de ${idDDJJ} exitosamente`
      });
      
      // Cerrar modales
      setShowConfirmacionModal(false);
      handleCancelarGenerarReporte();
      
      // Auto-cerrar toast después de 5 segundos
      setTimeout(() => setToast(null), 5000);
    } catch (error) {
      console.error('Error al generar reporte:', error);
      const idDDJJ = ordenSeleccionadaGenerar?.idDDJJ || generarIdDDJJ(ordenSeleccionadaGenerar);
      
      setToast({
        type: 'error',
        title: 'Error al generar reporte',
        message: `No se pudo generar el reporte de ${idDDJJ}. Por favor, intente nuevamente.`
      });
      
      setTimeout(() => setToast(null), 5000);
    }
  };

  return (
    <div className="w-full" style={{ fontFamily: 'Lato, sans-serif' }}>
      <div className="px-3 sm:px-4 md:px-6 w-full">
        {/* Banner */}
        <div 
          className="bg-[#007C8A] w-full mb-4 sm:mb-6 rounded-lg mt-4 sm:mt-6"
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
            Explorador de auditoría
          </h1>
          <p 
            className="text-sm sm:text-base"
            style={{ 
              color: 'rgba(255,255,255,0.9)',
              fontFamily: 'Lato, sans-serif'
            }}
          >
            Registro inmutable de las acciones realizadas en el sistema
          </p>
        </div>

        {/* Tarjetas de métricas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 sm:mb-6">
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

          {/* Tarjeta 2: Reportes conformes */}
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
                Reportes conformes
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
                    {isLoading ? '...' : formatNumber(reportesConformes)}
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
                  Reportes validados correctamente
                </p>
              </div>
            </div>
          </div>

          {/* Tarjeta 3: Reportes no conformes */}
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
                Reportes no conformes
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
                    {isLoading ? '...' : formatNumber(reportesNoConformes)}
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
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
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
                  Reportes con discrepancias
                </p>
              </div>
            </div>
          </div>

          {/* Tarjeta 4: Costo total acumulado */}
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
                Costo total acumulado
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
                      fontSize: '24px',
                      lineHeight: '1.2',
                      margin: 0
                    }}
                  >
                    {isLoading ? '...' : formatCurrency(costoTotal)}
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
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
                  Costo total de los últimos 30 días
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Vista de revisar inspección */}
        {showRevisarInspeccionModal && ordenSeleccionadaRevisarInspeccion && datosInspeccionRevisar ? (
          // Vista de revisar inspección del inspector
          (() => {
            return (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* Header con botón volver */}
                <div className="p-4 sm:p-6 border-b border-gray-200 bg-[#007C8A]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => {
                          setShowRevisarInspeccionModal(false);
                          setOrdenSeleccionadaRevisarInspeccion(null);
                          setDatosInspeccionRevisar(null);
                        }}
                        className="text-white hover:opacity-80 transition-opacity flex items-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        <span>Volver</span>
                      </button>
                      <div>
                        <h2 
                          className="text-xl sm:text-2xl font-bold"
                          style={{ color: '#FFFFFF' }}
                        >
                          Revisar inspección
                        </h2>
                        <p 
                          className="text-sm mt-1"
                          style={{ color: 'rgba(255,255,255,0.9)' }}
                        >
                          DDJJ inspeccionada lista para auditar
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contenido */}
                <div className="px-4 sm:px-6 py-6">
                  {/* Card de Inspección DDJJ */}
                  <div 
                    className="bg-white rounded-lg border border-gray-200 p-6 mb-6"
                    style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
                  >
                    {/* Título con checkmark */}
                    <div className="flex items-center gap-3 mb-4">
                      <div 
                        className="rounded-full flex items-center justify-center flex-shrink-0"
                        style={{
                          backgroundColor: '#E6FFE6',
                          width: '40px',
                          height: '40px'
                        }}
                      >
                        <svg 
                          className="w-6 h-6" 
                          fill="none" 
                          stroke="#00B69B" 
                          viewBox="0 0 24 24" 
                          strokeWidth={3}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <h3 
                          className="text-xl font-bold"
                          style={{ color: '#374151' }}
                        >
                          Inspección DDJJ
                        </h3>
                        <p 
                          className="text-sm"
                          style={{ color: '#6B7280' }}
                        >
                          Detalles a inspeccionar de DDJJ {ordenSeleccionadaRevisarInspeccion.idDDJJ || generarIdDDJJ(ordenSeleccionadaRevisarInspeccion)}
                        </p>
                        <p 
                          className="text-sm"
                          style={{ color: '#6B7280' }}
                        >
                          Asignación para {datosInspeccionRevisar.empresa?.nombre_empresa || datosInspeccionRevisar.empresa?.nombre || 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* Dos columnas: Declarado e Inspección */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Columna izquierda: Declarado */}
                      <div className="flex flex-col">
                        <h3 
                          className="text-lg font-bold mb-4"
                          style={{ 
                            fontFamily: 'Lato, sans-serif',
                            color: '#374151'
                          }}
                        >
                          Declarado
                        </h3>
                        <div className="space-y-4">
                          {/* Licencia */}
                          <div>
                            <label 
                              className="block text-sm font-medium mb-2"
                              style={{ 
                                fontFamily: 'Lato, sans-serif',
                                color: '#374151'
                              }}
                            >
                              Licencia*
                            </label>
                            <div className="relative">
                              <input
                                type="date"
                                value={convertToDateInputFormat(datosInspeccionRevisar.datosDeclarados.licencia)}
                                readOnly
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                                style={{ 
                                  fontFamily: 'Lato, sans-serif',
                                  fontSize: '14px',
                                  color: '#374151',
                                  cursor: 'not-allowed'
                                }}
                              />
                              <svg 
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          </div>

                          {/* RTO vencimiento */}
                          <div>
                            <label 
                              className="block text-sm font-medium mb-2"
                              style={{ 
                                fontFamily: 'Lato, sans-serif',
                                color: '#374151'
                              }}
                            >
                              RTO vencimiento
                            </label>
                            <div className="relative">
                              <input
                                type="date"
                                value={convertToDateInputFormat(datosInspeccionRevisar.datosDeclarados.rtoVencimiento)}
                                readOnly
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                                style={{ 
                                  fontFamily: 'Lato, sans-serif',
                                  fontSize: '14px',
                                  color: '#374151',
                                  cursor: 'not-allowed'
                                }}
                              />
                              <svg 
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          </div>

                          {/* Seguro vencimiento */}
                          <div>
                            <label 
                              className="block text-sm font-medium mb-2"
                              style={{ 
                                fontFamily: 'Lato, sans-serif',
                                color: '#374151'
                              }}
                            >
                              Seguro vencimiento
                            </label>
                            <div className="relative">
                              <input
                                type="date"
                                value={convertToDateInputFormat(datosInspeccionRevisar.datosDeclarados.seguroVencimiento)}
                                readOnly
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                                style={{ 
                                  fontFamily: 'Lato, sans-serif',
                                  fontSize: '14px',
                                  color: '#374151',
                                  cursor: 'not-allowed'
                                }}
                              />
                              <svg 
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          </div>

                          {/* Aire acondicionado */}
                          <div>
                            <label 
                              className="block text-sm font-medium mb-2"
                              style={{ 
                                fontFamily: 'Lato, sans-serif',
                                color: '#374151'
                              }}
                            >
                              Aire acondicionado
                            </label>
                            <div className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-50" style={{ color: '#374151' }}>
                              {datosInspeccionRevisar.datosDeclarados.aireAcondicionado}
                            </div>
                          </div>

                          {/* Calefacción */}
                          <div>
                            <label 
                              className="block text-sm font-medium mb-2"
                              style={{ 
                                fontFamily: 'Lato, sans-serif',
                                color: '#374151'
                              }}
                            >
                              Calefacción
                            </label>
                            <div className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-50" style={{ color: '#374151' }}>
                              {datosInspeccionRevisar.datosDeclarados.calefaccion}
                            </div>
                          </div>

                          {/* Cámara */}
                          <div>
                            <label 
                              className="block text-sm font-medium mb-2"
                              style={{ 
                                fontFamily: 'Lato, sans-serif',
                                color: '#374151'
                              }}
                            >
                              Cámara
                            </label>
                            <div className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-50" style={{ color: '#374151' }}>
                              {datosInspeccionRevisar.datosDeclarados.camara}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Columna derecha: Inspección */}
                      <div className="flex flex-col">
                        <h3 
                          className="text-lg font-bold mb-4"
                          style={{ 
                            fontFamily: 'Lato, sans-serif',
                            color: '#374151'
                          }}
                        >
                          Inspección
                        </h3>
                        <div className="space-y-4">
                          {/* Licencia de Conducir */}
                          <div>
                            <label className="flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={datosInspeccionRevisar.datosInspeccion.licencia || false}
                                readOnly
                                className="w-4 h-4 border-gray-300 rounded focus:ring-2 focus:ring-teal-500"
                                style={{ 
                                  accentColor: '#007C8A',
                                  borderRadius: '2px'
                                }}
                              />
                              <span className="ml-2 text-sm font-medium" style={{ color: '#374151' }}>
                                Licencia de Conducir
                              </span>
                            </label>
                            <p className="text-xs mt-1 ml-6" style={{ color: '#6B7280' }}>
                              Estado: {datosInspeccionRevisar.datosInspeccion.licencia ? 'Correcto' : 'Incorrecto'}
                            </p>
                          </div>

                          {/* RTO */}
                          <div>
                            <label className="flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={datosInspeccionRevisar.datosInspeccion.rto || false}
                                readOnly
                                className="w-4 h-4 border-gray-300 rounded focus:ring-2 focus:ring-teal-500"
                                style={{ 
                                  accentColor: '#007C8A',
                                  borderRadius: '2px'
                                }}
                              />
                              <span className="ml-2 text-sm font-medium" style={{ color: '#374151' }}>
                                RTO
                              </span>
                            </label>
                            <p className="text-xs mt-1 ml-6" style={{ color: '#6B7280' }}>
                              Estado: {datosInspeccionRevisar.datosInspeccion.rto ? 'Correcto' : 'Incorrecto'}
                            </p>
                          </div>

                          {/* Seguro */}
                          <div>
                            <label className="flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={datosInspeccionRevisar.datosInspeccion.seguro || false}
                                readOnly
                                className="w-4 h-4 border-gray-300 rounded focus:ring-2 focus:ring-teal-500"
                                style={{ 
                                  accentColor: '#007C8A',
                                  borderRadius: '2px'
                                }}
                              />
                              <span className="ml-2 text-sm font-medium" style={{ color: '#374151' }}>
                                Seguro
                              </span>
                            </label>
                            <p className="text-xs mt-1 ml-6" style={{ color: '#6B7280' }}>
                              Estado: {datosInspeccionRevisar.datosInspeccion.seguro ? 'Correcto' : 'Incorrecto'}
                            </p>
                          </div>

                          {/* Aire acondicionado */}
                          <div>
                            <label className="flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={datosInspeccionRevisar.datosInspeccion.aireAcondicionado || false}
                                readOnly
                                className="w-4 h-4 border-gray-300 rounded focus:ring-2 focus:ring-teal-500"
                                style={{ 
                                  accentColor: '#007C8A',
                                  borderRadius: '2px'
                                }}
                              />
                              <span className="ml-2 text-sm font-medium" style={{ color: '#374151' }}>
                                Aire acondicionado
                              </span>
                            </label>
                            <p className="text-xs mt-1 ml-6" style={{ color: '#6B7280' }}>
                              Estado: {datosInspeccionRevisar.datosInspeccion.aireAcondicionado ? 'Correcto' : 'Incorrecto'}
                            </p>
                          </div>

                          {/* Calefacción */}
                          <div>
                            <label className="flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={datosInspeccionRevisar.datosInspeccion.calefaccion || false}
                                readOnly
                                className="w-4 h-4 border-gray-300 rounded focus:ring-2 focus:ring-teal-500"
                                style={{ 
                                  accentColor: '#007C8A',
                                  borderRadius: '2px'
                                }}
                              />
                              <span className="ml-2 text-sm font-medium" style={{ color: '#374151' }}>
                                Calefacción
                              </span>
                            </label>
                            <p className="text-xs mt-1 ml-6" style={{ color: '#6B7280' }}>
                              Estado: {datosInspeccionRevisar.datosInspeccion.calefaccion ? 'Correcto' : 'Incorrecto'}
                            </p>
                          </div>

                          {/* Cámara */}
                          <div>
                            <label className="flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={datosInspeccionRevisar.datosInspeccion.camara || false}
                                readOnly
                                className="w-4 h-4 border-gray-300 rounded focus:ring-2 focus:ring-teal-500"
                                style={{ 
                                  accentColor: '#007C8A',
                                  borderRadius: '2px'
                                }}
                              />
                              <span className="ml-2 text-sm font-medium" style={{ color: '#374151' }}>
                                Cámara
                              </span>
                            </label>
                            <p className="text-xs mt-1 ml-6" style={{ color: '#6B7280' }}>
                              Estado: {datosInspeccionRevisar.datosInspeccion.camara ? 'Correcto' : 'Incorrecto'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Observación */}
                    <div className="mt-6">
                      <label 
                        className="block text-sm font-medium mb-2"
                        style={{ 
                          fontFamily: 'Lato, sans-serif',
                          color: '#374151'
                        }}
                      >
                        Observación
                      </label>
                      <div className="px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 min-h-[80px]" style={{ color: '#374151' }}>
                        {datosInspeccionRevisar.datosInspeccion.observaciones || '-'}
                      </div>
                    </div>

                    {/* Conformidad */}
                    <div className="mt-6">
                      <label 
                        className="block text-sm font-medium mb-3"
                        style={{ 
                          fontFamily: 'Lato, sans-serif',
                          color: '#374151'
                        }}
                      >
                        Conformidad
                      </label>
                      <div className="flex gap-6">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={datosInspeccionRevisar.datosInspeccion.conformidad === true}
                            readOnly
                            className="w-5 h-5 rounded border-gray-300 text-green-600"
                            style={{ cursor: 'default' }}
                          />
                          <span 
                            className="text-sm font-medium"
                            style={{ 
                              fontFamily: 'Lato, sans-serif',
                              color: datosInspeccionRevisar.datosInspeccion.conformidad === true ? '#065F46' : '#9CA3AF'
                            }}
                          >
                            CONFORME
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={datosInspeccionRevisar.datosInspeccion.conformidad === false}
                            readOnly
                            className="w-5 h-5 rounded border-gray-300 text-red-600"
                            style={{ cursor: 'default' }}
                          />
                          <span 
                            className="text-sm font-medium"
                            style={{ 
                              fontFamily: 'Lato, sans-serif',
                              color: datosInspeccionRevisar.datosInspeccion.conformidad === false ? '#991B1B' : '#9CA3AF'
                            }}
                          >
                            NO CONFORME
                          </span>
                        </div>
                      </div>
                      {datosInspeccionRevisar.datosInspeccion.conformidad === null && (
                        <p className="text-xs mt-2" style={{ color: '#9CA3AF' }}>
                          No especificado
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()
        ) : showVerDDJJModal && ordenSeleccionadaVer ? (
          // Vista de detalle DDJJ
          (() => {
            // Obtener datos relacionados
            const vehiculo = vehiculos.find(v => v.id_vehiculo === ordenSeleccionadaVer.id_vehiculo);
            const empresa = vehiculo ? empresas.find(e => e.id_empresa === vehiculo.id_empresa) : null;
            const tipoMantenimiento = tiposMantenimiento.find(t => t.id_tipo === ordenSeleccionadaVer.id_tipo_mantenimiento);
            const conductor = ordenSeleccionadaVer.id_conductor ? conductores.find(c => c.id_conductor === ordenSeleccionadaVer.id_conductor) : null;
            const lineaServicio = lineasServicio.find(ls => ls.id_orden === ordenSeleccionadaVer.id_orden);
            const mecanicosAsignados = ordenXMecanico
              .filter(oxm => oxm.id_orden === ordenSeleccionadaVer.id_orden)
              .map(oxm => mecanicos.find(m => m.id_mecanico === oxm.id_mecanico))
              .filter(m => m);
            const detallesInsumosOrden = detallesInsumo
              .filter(di => di.id_orden === ordenSeleccionadaVer.id_orden)
              .map(di => {
                const insumo = insumosCatalogo.find(ic => ic.id_insumo === di.id_insumo);
                return { ...di, insumo };
              });

            // Obtener inspección del inspector para esta orden
            const inspeccion = inspeccionesDDJJ.find(ins => ins.id_orden_trabajo === ordenSeleccionadaVer.id_orden);
            
            // Obtener RTO activo más reciente del vehículo
            const rtoActivo = rtoRegistros
              .filter(rto => rto.id_vehiculo === vehiculo?.id_vehiculo && rto.activo)
              .sort((a, b) => new Date(b.fecha_vencimiento || 0) - new Date(a.fecha_vencimiento || 0))[0];

            // Formatear fecha
            const formatFecha = (fecha) => {
              if (!fecha) return '-';
              const date = new Date(fecha);
              const day = String(date.getDate()).padStart(2, '0');
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const year = date.getFullYear();
              const hours = String(date.getHours()).padStart(2, '0');
              const minutes = String(date.getMinutes()).padStart(2, '0');
              return `${day}/${month}/${year} ${hours}:${minutes}`;
            };

            // Formatear fecha solo fecha
            const formatFechaSolo = (fecha) => {
              if (!fecha) return '-';
              const date = new Date(fecha);
              const day = String(date.getDate()).padStart(2, '0');
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const year = date.getFullYear();
              return `${day}/${month}/${year}`;
            };

            // Formatear fecha para input date (YYYY-MM-DD)
            const formatFechaInput = (fecha) => {
              if (!fecha) return '';
              const date = new Date(fecha);
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const day = String(date.getDate()).padStart(2, '0');
              return `${year}-${month}-${day}`;
            };

            // Calcular monto total
            const montoTotal = detallesInsumosOrden.reduce((sum, di) => sum + (parseFloat(di.costo_total) || 0), 0);

            return (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* Header con botón volver */}
                <div className="p-4 sm:p-6 border-b border-gray-200 bg-[#007C8A]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => {
                          setShowVerDDJJModal(false);
                          setOrdenSeleccionadaVer(null);
                        }}
                        className="text-white hover:opacity-80 transition-opacity flex items-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        <span>Volver</span>
                      </button>
                      <div>
                        <h2 
                          className="text-xl sm:text-2xl font-bold"
                          style={{ color: '#FFFFFF' }}
                        >
                          Reporte auditoría de DDJJ
                        </h2>
                        <p 
                          className="text-sm mt-1"
                          style={{ color: 'rgba(255,255,255,0.9)' }}
                        >
                          {ordenSeleccionadaVer.idDDJJ || generarIdDDJJ(ordenSeleccionadaVer)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contenido */}
                <div className="px-4 sm:px-6 py-6">
                  {/* Sección 1: Identificación del vehículo y Servicio */}
                  <div className="mb-6">
                    <h3 
                      className="text-lg font-bold mb-2"
                      style={{ color: '#374151' }}
                    >
                      1. Identificación del vehículo y Servicio
                    </h3>
                    <p 
                      className="text-sm mb-4"
                      style={{ color: '#6B7280' }}
                    >
                      Llenar los campos obligatorios
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
                          Empresa<span style={{ color: '#EF4444' }}>*</span>
                        </label>
                        <div className="px-3 py-2 bg-gray-100 rounded-lg" style={{ color: '#374151' }}>
                          {empresa?.nombre_empresa || empresa?.nombre || '-'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
                          Orden<span style={{ color: '#EF4444' }}>*</span>
                        </label>
                        <div className="px-3 py-2 bg-gray-100 rounded-lg" style={{ color: '#374151' }}>
                          {ordenSeleccionadaVer.nro_orden_trabajo || '-'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
                          Matrícula<span style={{ color: '#EF4444' }}>*</span>
                        </label>
                        <div className="px-3 py-2 bg-gray-100 rounded-lg" style={{ color: '#374151' }}>
                          {vehiculo?.matricula || '-'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
                          Vehículo<span style={{ color: '#EF4444' }}>*</span>
                        </label>
                        <div className="px-3 py-2 bg-gray-100 rounded-lg" style={{ color: '#374151' }}>
                          {vehiculo?.interno || '-'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
                          Tipo de servicio<span style={{ color: '#EF4444' }}>*</span>
                        </label>
                        <div className="px-3 py-2 bg-gray-100 rounded-lg" style={{ color: '#374151' }}>
                          {vehiculo?.tipo_servicio || '-'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
                          Línea/s<span style={{ color: '#EF4444' }}>*</span>
                        </label>
                        <div className="px-3 py-2 bg-gray-100 rounded-lg" style={{ color: '#374151' }}>
                          {lineaServicio?.nombre_linea || lineaServicio?.definicion_trabajo || '-'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sección 2: Información de la orden de trabajo (OT) */}
                  <div className="mb-6">
                    <h3 
                      className="text-lg font-bold mb-2"
                      style={{ color: '#374151' }}
                    >
                      2. Información de la orden de trabajo (OT)
                    </h3>
                    <p 
                      className="text-sm mb-4"
                      style={{ color: '#6B7280' }}
                    >
                      Llenar los campos obligatorios
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
                          N° orden de trabajo<span style={{ color: '#EF4444' }}>*</span>
                        </label>
                        <div className="px-3 py-2 bg-gray-100 rounded-lg" style={{ color: '#374151' }}>
                          {ordenSeleccionadaVer.nro_orden_trabajo || '-'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
                          Estado de orden de trabajo<span style={{ color: '#EF4444' }}>*</span>
                        </label>
                        <div className="px-3 py-2 bg-gray-100 rounded-lg" style={{ color: '#374151' }}>
                          {ordenSeleccionadaVer.estado || '-'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
                          Fecha<span style={{ color: '#EF4444' }}>*</span>
                        </label>
                        <div className="px-3 py-2 bg-gray-100 rounded-lg" style={{ color: '#374151' }}>
                          {formatFecha(ordenSeleccionadaVer.fecha_generacion)}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
                          Monto total<span style={{ color: '#EF4444' }}>*</span>
                        </label>
                        <div className="px-3 py-2 bg-gray-100 rounded-lg" style={{ color: '#374151' }}>
                          {formatCurrency(montoTotal)}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
                          Kilómetros<span style={{ color: '#EF4444' }}>*</span>
                        </label>
                        <div className="px-3 py-2 bg-gray-100 rounded-lg" style={{ color: '#374151' }}>
                          {ordenSeleccionadaVer.odometro ? `${formatNumber(ordenSeleccionadaVer.odometro)} km` : '-'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sección 3: Ejecución y Tareas */}
                  <div className="mb-6">
                    <h3 
                      className="text-lg font-bold mb-2"
                      style={{ color: '#374151' }}
                    >
                      3. Ejecución y Tareas
                    </h3>
                    <p 
                      className="text-sm mb-4"
                      style={{ color: '#6B7280' }}
                    >
                      Llenar los campos obligatorios
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
                          Taller asignado<span style={{ color: '#EF4444' }}>*</span>
                        </label>
                        <div className="px-3 py-2 bg-gray-100 rounded-lg" style={{ color: '#374151' }}>
                          {empresa?.nombre_empresa || empresa?.nombre || '-'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
                          Definición de la tarea (categoría)<span style={{ color: '#EF4444' }}>*</span>
                        </label>
                        <div className="px-3 py-2 bg-gray-100 rounded-lg" style={{ color: '#374151' }}>
                          {tipoMantenimiento?.descripcion || '-'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
                          Mecánico asignado<span style={{ color: '#EF4444' }}>*</span>
                        </label>
                        <div className="px-3 py-2 bg-gray-100 rounded-lg" style={{ color: '#374151' }}>
                          {mecanicosAsignados.length > 0 
                            ? mecanicosAsignados.map(m => `${m.nombre}${m.apellido ? ` ${m.apellido}` : ''}`).join(', ')
                            : '-'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
                          Tipo de mantenimiento<span style={{ color: '#EF4444' }}>*</span>
                        </label>
                        <div className="px-3 py-2 bg-gray-100 rounded-lg" style={{ color: '#374151' }}>
                          {tipoMantenimiento?.descripcion || '-'}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
                          Breve descripción del trabajo<span style={{ color: '#EF4444' }}>*</span>
                        </label>
                        <div className="px-3 py-2 bg-gray-100 rounded-lg min-h-[80px]" style={{ color: '#374151' }}>
                          {lineaServicio?.descripcion_detallada || lineaServicio?.descripcion || lineaServicio?.definicion_trabajo || '-'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sección 4: Detalle de Insumos / artículos */}
                  <div className="mb-6">
                    <h3 
                      className="text-lg font-bold mb-2"
                      style={{ color: '#374151' }}
                    >
                      4. Detalle de Insumos / artículos
                    </h3>
                    <p 
                      className="text-sm mb-4"
                      style={{ color: '#6B7280' }}
                    >
                      Llenar los campos obligatorios
                    </p>
                    {detallesInsumosOrden.length > 0 ? (
                      <div className="space-y-4">
                        {detallesInsumosOrden.map((detalle, index) => (
                          <div key={detalle.id_detalle || index} className="grid grid-cols-2 gap-4 border-b border-gray-200 pb-4">
                            <div>
                              <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
                                Código de artículo<span style={{ color: '#EF4444' }}>*</span>
                              </label>
                              <div className="px-3 py-2 bg-gray-100 rounded-lg" style={{ color: '#374151' }}>
                                {detalle.insumo?.codigo_inventario || '-'}
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
                                Cantidad<span style={{ color: '#EF4444' }}>*</span>
                              </label>
                              <div className="px-3 py-2 bg-gray-100 rounded-lg" style={{ color: '#374151' }}>
                                {detalle.cantidad || '-'}
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
                                Costo unitario<span style={{ color: '#EF4444' }}>*</span>
                              </label>
                              <div className="px-3 py-2 bg-gray-100 rounded-lg" style={{ color: '#374151' }}>
                                {formatCurrency(detalle.costo_unitario_historico || 0)}
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
                                Costo total<span style={{ color: '#EF4444' }}>*</span>
                              </label>
                              <div className="px-3 py-2 bg-gray-100 rounded-lg" style={{ color: '#374151' }}>
                                {formatCurrency(detalle.costo_total || 0)}
                              </div>
                            </div>
                            <div className="col-span-2">
                              <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
                                Descripción del insumo/artículo<span style={{ color: '#EF4444' }}>*</span>
                              </label>
                              <div className="px-3 py-2 bg-gray-100 rounded-lg min-h-[60px]" style={{ color: '#374151' }}>
                                {detalle.insumo?.descripcion || '-'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="px-3 py-2 bg-gray-100 rounded-lg text-center" style={{ color: '#6B7280' }}>
                        No hay insumos registrados
                      </div>
                    )}
                  </div>

                  {/* Sección 5: Estado de Fiscalización (DDJJ) */}
                  <div className="mb-6">
                    <h3 
                      className="text-lg font-bold mb-2"
                      style={{ color: '#374151' }}
                    >
                      5. Estado de Fiscalización (DDJJ)
                    </h3>
                    <p 
                      className="text-sm mb-4"
                      style={{ color: '#6B7280' }}
                    >
                      Llenar los campos obligatorios
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
                          Fecha RTO<span style={{ color: '#EF4444' }}>*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="date"
                            value={rtoActivo?.fecha_vencimiento ? formatFechaInput(rtoActivo.fecha_vencimiento) : ''}
                            readOnly
                            className="w-full px-3 py-2 bg-gray-100 rounded-lg border border-gray-300"
                            style={{ 
                              fontFamily: 'Lato, sans-serif',
                              color: '#374151',
                              cursor: 'not-allowed'
                            }}
                          />
                          <svg 
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
                          Tipo de Seguro<span style={{ color: '#EF4444' }}>*</span>
                        </label>
                        <div className="px-3 py-2 bg-gray-100 rounded-lg" style={{ color: '#374151' }}>
                          {vehiculo?.tipo_seguro_cobertura || '-'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
                          Fecha de vencimiento seguro<span style={{ color: '#EF4444' }}>*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="date"
                            value={vehiculo?.fecha_vencimiento_seguro ? formatFechaInput(vehiculo.fecha_vencimiento_seguro) : ''}
                            readOnly
                            className="w-full px-3 py-2 bg-gray-100 rounded-lg border border-gray-300"
                            style={{ 
                              fontFamily: 'Lato, sans-serif',
                              color: '#374151',
                              cursor: 'not-allowed'
                            }}
                          />
                          <svg 
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      </div>
                      <div className="col-span-2">
                        <div className="grid grid-cols-2 gap-4">
                          {/* Columna izquierda */}
                          <div className="space-y-4">
                            <label className="flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={inspeccion?.camara_correcto || false}
                                readOnly
                                className="w-4 h-4 border-gray-300 rounded focus:ring-2 focus:ring-teal-500"
                                style={{ 
                                  accentColor: '#007C8A',
                                  borderRadius: '2px'
                                }}
                              />
                              <span className="ml-2 text-sm" style={{ color: '#374151' }}>
                                Cámaras
                              </span>
                            </label>
                            <label className="flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={inspeccion?.aire_acondicionado_correcto || false}
                                readOnly
                                className="w-4 h-4 border-gray-300 rounded focus:ring-2 focus:ring-teal-500"
                                style={{ 
                                  accentColor: '#007C8A',
                                  borderRadius: '2px'
                                }}
                              />
                              <span className="ml-2 text-sm" style={{ color: '#374151' }}>
                                Aire acondicionado
                              </span>
                            </label>
                          </div>
                          {/* Columna derecha */}
                          <div className="space-y-4">
                            <label className="flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={inspeccion?.calefaccion_correcto || false}
                                readOnly
                                className="w-4 h-4 border-gray-300 rounded focus:ring-2 focus:ring-teal-500"
                                style={{ 
                                  accentColor: '#007C8A',
                                  borderRadius: '2px'
                                }}
                              />
                              <span className="ml-2 text-sm" style={{ color: '#374151' }}>
                                Calefacción
                              </span>
                            </label>
                            <label className="flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={inspeccion?.seguro_correcto || false}
                                readOnly
                                className="w-4 h-4 border-gray-300 rounded focus:ring-2 focus:ring-teal-500"
                                style={{ 
                                  accentColor: '#007C8A',
                                  borderRadius: '2px'
                                }}
                              />
                              <span className="ml-2 text-sm" style={{ color: '#374151' }}>
                                Seguro
                              </span>
                            </label>
                          </div>
                        </div>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
                          Descripción siniestros<span style={{ color: '#EF4444' }}>*</span>
                        </label>
                        <div className="px-3 py-2 bg-gray-100 rounded-lg min-h-[80px]" style={{ color: '#374151' }}>
                          {inspeccion?.observaciones || '-'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()
        ) : (
          // Tabla de auditoría
          <div className="bg-white rounded-lg shadow-md" style={{ overflow: 'visible' }}>
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 
                    className="text-lg sm:text-xl font-bold mb-1"
                    style={{ color: '#374151' }}
                  >
                    Tabla de auditoría
                  </h2>
                  <p 
                    className="text-sm"
                    style={{ color: '#6B7280' }}
                  >
                    Detalle de las DDJJ de toda la flota
                  </p>
                </div>
                <div className="flex-1 sm:max-w-xs">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                      }}
                      placeholder="Ingrese su búsqueda"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      style={{ fontFamily: 'Lato, sans-serif' }}
                    />
                    <svg 
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="p-8 text-center">
                <p style={{ color: '#6B7280' }}>Cargando datos...</p>
              </div>
            ) : paginatedData.length === 0 ? (
              <div className="p-8 text-center">
                <p style={{ color: '#6B7280' }}>No se encontraron registros</p>
              </div>
            ) : (
              <>
                <div className="w-full" style={{ overflowX: 'auto', overflowY: 'visible' }}>
                  <div className="inline-block min-w-full align-middle">
                    <table className="w-full" style={{ fontFamily: 'Lato, sans-serif', tableLayout: 'fixed', width: '100%' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '2px solid #E5E7EB' }}>
                        <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: '#374151', width: '8%' }}>N OT</th>
                        <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: '#374151', width: '8%' }}>Interno</th>
                        <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: '#374151', width: '12%' }}>Empresa</th>
                        <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: '#374151', width: '10%' }}>Fecha ingreso</th>
                        <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: '#374151', width: '10%' }}>Odómetro</th>
                        <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: '#374151', width: '10%' }}>Horómetro</th>
                        <th className="px-2 py-2 text-center text-xs font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: '#374151', width: '8%' }}>Ver DDJJ</th>
                        <th className="px-2 py-2 text-center text-xs font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: '#374151', width: '10%' }}>Estado</th>
                        <th className="px-2 py-2 text-center text-xs font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: '#374151', width: '12%' }}>Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                    {paginatedData.map((item, index) => (
                      <tr key={item.id_orden || index} className="hover:bg-gray-50">
                        <td className="px-2 py-2 text-xs" style={{ color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.idDDJJ || item.nro_orden_trabajo || '-'}
                        </td>
                        <td className="px-2 py-2 text-xs" style={{ color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.interno}
                        </td>
                        <td className="px-2 py-2 text-xs" style={{ color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.nombreEmpresa}
                        </td>
                        <td className="px-2 py-2 text-xs" style={{ color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {formatDate(item.fecha_generacion)}
                        </td>
                        <td className="px-2 py-2 text-xs" style={{ color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.odometro ? `${formatNumber(item.odometro)} km` : '-'}
                        </td>
                        <td className="px-2 py-2 text-xs" style={{ color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.horometro ? `${formatNumber(item.horometro)} hs` : '-'}
                        </td>
                        <td className="px-2 py-2 text-center">
                          <button 
                            onClick={() => {
                              setOrdenSeleccionadaVer(item);
                              setShowVerDDJJModal(true);
                            }}
                            className="text-teal-600 hover:text-teal-800 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        </td>
                        <td className="px-2 py-2 text-center">
                          {item.estado !== '-' ? (
                            <span 
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                              style={{
                                backgroundColor: item.estado === 'Correcto' ? '#D1FAE5' : '#FEE2E2',
                                color: item.estado === 'Correcto' ? '#065F46' : '#991B1B'
                              }}
                            >
                              {item.estado}
                            </span>
                          ) : (
                            <span style={{ color: '#9CA3AF', fontSize: '12px' }}>-</span>
                          )}
                        </td>
                        <td className="px-2 py-2 text-center">
                          <div className="relative" ref={openMenuId === item.id_orden ? menuRef : null} style={{ position: 'relative' }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(openMenuId === item.id_orden ? null : item.id_orden);
                              }}
                              className="p-1 hover:bg-gray-100 rounded transition-colors"
                              style={{ color: '#6B7280', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                              </svg>
                            </button>
                            {openMenuId === item.id_orden && (
                              <div 
                                className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-[9999]"
                                style={{ 
                                  minWidth: '180px',
                                  position: 'absolute',
                                  top: '100%',
                                  right: '0'
                                }}
                              >
                                <button
                                  onClick={() => handleRevisarInspeccion(item)}
                                  className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors"
                                  style={{
                                    fontFamily: 'Lato, sans-serif',
                                    fontSize: '14px',
                                    color: '#374151'
                                  }}
                                >
                                  Revisar inspección
                                </button>
                                {!item.tieneReporteAuditoria && (
                                  <button
                                    onClick={() => {
                                      handleAuditarDDJJ(item);
                                      setOpenMenuId(null);
                                    }}
                                    className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors border-t border-gray-200"
                                    style={{
                                      fontFamily: 'Lato, sans-serif',
                                      fontSize: '14px',
                                      color: '#374151'
                                    }}
                                  >
                                    Auditar ddjj
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Paginación */}
              <div className="px-4 py-3 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm" style={{ color: '#6B7280' }}>Elementos por página:</label>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm bg-white"
                    style={{ fontFamily: 'Lato, sans-serif' }}
                  >
                    <option value={6}>06</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm" style={{ color: '#6B7280' }}>
                    {startIndex + 1} - {Math.min(endIndex, filteredData.length)} de {filteredData.length}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-2 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      style={{ fontFamily: 'Lato, sans-serif', color: '#374151' }}
                    >
                      &lt;
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-2 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      style={{ fontFamily: 'Lato, sans-serif', color: '#374151' }}
                    >
                      &gt;
                    </button>
                  </div>
                </div>
              </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Modal de Revisar Inspección */}
      {showRevisarModal && ordenSeleccionada && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backgroundColor: 'rgba(0, 124, 138, 0.5)' }}
          onClick={handleCancelarRevisar}
        >
          <div 
            className="bg-white modal-content rounded-lg shadow-xl max-w-2xl w-full mx-4"
            data-modal="true"
            onClick={(e) => e.stopPropagation()}
            style={{ 
              fontFamily: 'Lato, sans-serif', 
              backgroundColor: '#FFFFFF',
              background: '#FFFFFF'
            }}
          >
            {/* Contenido del modal */}
            <div className="p-6">
              {/* Título */}
              <h2 
                className="text-xl font-bold mb-2"
                style={{ color: '#374151' }}
              >
                Reporte auditoría de DDJJ {ordenSeleccionada.idDDJJ || generarIdDDJJ(ordenSeleccionada)}
              </h2>
              
              {/* Subtítulo */}
              <p 
                className="text-sm mb-6"
                style={{ color: '#6B7280' }}
              >
                Asignación para {ordenSeleccionada.nombreEmpresa || 'Empresa'}
              </p>

              {/* Opciones de tipo de reporte */}
              <div className="flex gap-6 mb-6">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formDataRevisar.tipoReporte === 'correcto'}
                    onChange={(e) => {
                      setFormDataRevisar(prev => ({
                        ...prev,
                        tipoReporte: e.target.checked ? 'correcto' : ''
                      }));
                    }}
                    className="w-4 h-4 border-gray-300 rounded focus:ring-2 focus:ring-teal-500"
                    style={{ 
                      accentColor: '#007C8A',
                      borderRadius: '2px'
                    }}
                  />
                  <span 
                    className="ml-2 text-sm"
                    style={{ color: '#374151' }}
                  >
                    Reporte correcto
                  </span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formDataRevisar.tipoReporte === 'discrepancias'}
                    onChange={(e) => {
                      setFormDataRevisar(prev => ({
                        ...prev,
                        tipoReporte: e.target.checked ? 'discrepancias' : ''
                      }));
                    }}
                    className="w-4 h-4 border-gray-300 rounded focus:ring-2 focus:ring-teal-500"
                    style={{ 
                      accentColor: '#007C8A',
                      borderRadius: '2px'
                    }}
                  />
                  <span 
                    className="ml-2 text-sm"
                    style={{ color: '#374151' }}
                  >
                    Reporte con discrepancias
                  </span>
                </label>
              </div>

              {/* Observaciones */}
              <div className="mb-6">
                <label 
                  className="block text-sm font-medium mb-2"
                  style={{ color: '#374151' }}
                >
                  Observaciones
                </label>
                <textarea
                  value={formDataRevisar.observaciones}
                  onChange={(e) => setFormDataRevisar(prev => ({
                    ...prev,
                    observaciones: e.target.value
                  }))}
                  placeholder="Agregue comentarios adicionales de la inspección"
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                  style={{ 
                    fontFamily: 'Lato, sans-serif',
                    color: '#374151',
                    backgroundColor: '#FFFFFF'
                  }}
                />
              </div>

              {/* Botones */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleCancelarRevisar}
                  className="px-6 py-2 rounded-lg font-medium transition-colors border-2"
                  style={{
                    borderColor: '#007C8A',
                    color: '#007C8A',
                    backgroundColor: '#FFFFFF',
                    fontFamily: 'Lato, sans-serif'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#F0FDFA';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#FFFFFF';
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleGenerarReporteRevisar}
                  disabled={!formDataRevisar.tipoReporte}
                  className="px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: formDataRevisar.tipoReporte ? '#E5E7EB' : '#F3F4F6',
                    color: formDataRevisar.tipoReporte ? '#374151' : '#9CA3AF',
                    fontFamily: 'Lato, sans-serif'
                  }}
                  onMouseEnter={(e) => {
                    if (formDataRevisar.tipoReporte) {
                      e.target.style.backgroundColor = '#D1D5DB';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (formDataRevisar.tipoReporte) {
                      e.target.style.backgroundColor = '#E5E7EB';
                    }
                  }}
                >
                  Generar reporte
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Generar Reportes */}
      {showGenerarReporteModal && ordenSeleccionadaGenerar && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backgroundColor: 'rgba(0, 124, 138, 0.5)' }}
          onClick={handleCancelarGenerarReporte}
        >
          <div 
            className="bg-white modal-content rounded-lg shadow-xl max-w-2xl w-full mx-4"
            data-modal="true"
            onClick={(e) => e.stopPropagation()}
            style={{ 
              fontFamily: 'Lato, sans-serif', 
              backgroundColor: '#FFFFFF',
              background: '#FFFFFF'
            }}
          >
            {/* Contenido del modal */}
            <div className="p-6">
              {/* Título */}
              <h2 
                className="text-xl font-bold mb-2"
                style={{ color: '#374151' }}
              >
                Reporte auditoría de DDJJ {ordenSeleccionadaGenerar.idDDJJ || generarIdDDJJ(ordenSeleccionadaGenerar)}
              </h2>
              
              {/* Subtítulo */}
              <p 
                className="text-sm mb-6"
                style={{ color: '#6B7280' }}
              >
                Asignación para {ordenSeleccionadaGenerar.nombreEmpresa || 'Empresa'}
              </p>

              {/* Campos hidden para id_usuario e id_orden_trabajo */}
              <input type="hidden" name="id_usuario" value={user?.id || ''} />
              <input type="hidden" name="id_orden_trabajo" value={ordenSeleccionadaGenerar.id_orden || ''} />

              {/* Opciones de tipo de reporte */}
              <div className="flex gap-6 mb-6">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formDataGenerarReporte.tipoReporte === 'correcto'}
                    onChange={(e) => {
                      setFormDataGenerarReporte(prev => ({
                        ...prev,
                        tipoReporte: e.target.checked ? 'correcto' : ''
                      }));
                    }}
                    className="w-4 h-4 border-gray-300 rounded focus:ring-2 focus:ring-teal-500"
                    style={{ 
                      accentColor: '#007C8A',
                      borderRadius: '2px'
                    }}
                  />
                  <span 
                    className="ml-2 text-sm"
                    style={{ color: '#374151' }}
                  >
                    Reporte correcto
                  </span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formDataGenerarReporte.tipoReporte === 'discrepancias'}
                    onChange={(e) => {
                      setFormDataGenerarReporte(prev => ({
                        ...prev,
                        tipoReporte: e.target.checked ? 'discrepancias' : ''
                      }));
                    }}
                    className="w-4 h-4 border-gray-300 rounded focus:ring-2 focus:ring-teal-500"
                    style={{ 
                      accentColor: '#007C8A',
                      borderRadius: '2px'
                    }}
                  />
                  <span 
                    className="ml-2 text-sm"
                    style={{ color: '#374151' }}
                  >
                    Reporte con discrepancias
                  </span>
                </label>
              </div>

              {/* Observaciones */}
              <div className="mb-6">
                <label 
                  className="block text-sm font-medium mb-2"
                  style={{ color: '#374151' }}
                >
                  Observaciones
                </label>
                <textarea
                  value={formDataGenerarReporte.observaciones}
                  onChange={(e) => setFormDataGenerarReporte(prev => ({
                    ...prev,
                    observaciones: e.target.value
                  }))}
                  placeholder="Agregue comentarios adicionales de la inspección"
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                  style={{ 
                    fontFamily: 'Lato, sans-serif',
                    color: '#374151',
                    backgroundColor: '#FFFFFF'
                  }}
                />
              </div>

              {/* Botones */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleCancelarGenerarReporte}
                  className="px-6 py-2 rounded-lg font-medium transition-colors border-2"
                  style={{
                    borderColor: '#007C8A',
                    color: '#007C8A',
                    backgroundColor: '#FFFFFF',
                    fontFamily: 'Lato, sans-serif'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#F0FDFA';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#FFFFFF';
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmarGenerarReporte}
                  disabled={!formDataGenerarReporte.tipoReporte}
                  className="px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: formDataGenerarReporte.tipoReporte ? '#007C8A' : '#F3F4F6',
                    color: formDataGenerarReporte.tipoReporte ? '#FFFFFF' : '#9CA3AF',
                    fontFamily: 'Lato, sans-serif'
                  }}
                  onMouseEnter={(e) => {
                    if (formDataGenerarReporte.tipoReporte) {
                      e.target.style.backgroundColor = '#005a63';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (formDataGenerarReporte.tipoReporte) {
                      e.target.style.backgroundColor = '#007C8A';
                    }
                  }}
                >
                  Generar reporte
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación */}
      {showConfirmacionModal && ordenSeleccionadaGenerar && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-[60]"
          style={{ backgroundColor: 'rgba(0, 124, 138, 0.5)' }}
          onClick={handleCancelarConfirmacion}
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
            {/* Contenido del modal */}
            <div className="p-6">
              {/* Mensaje de confirmación */}
              <p 
                className="text-base mb-6"
                style={{ color: '#374151' }}
              >
                ¿Estás seguro que deseas generar un reporte de auditoría para DDJJ {ordenSeleccionadaGenerar.idDDJJ || generarIdDDJJ(ordenSeleccionadaGenerar)}?
              </p>

              {/* Botones */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleCancelarConfirmacion}
                  className="px-6 py-2 rounded-lg font-medium transition-colors border-2"
                  style={{
                    borderColor: '#007C8A',
                    color: '#007C8A',
                    backgroundColor: '#FFFFFF',
                    fontFamily: 'Lato, sans-serif'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#F0FDFA';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#FFFFFF';
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleEjecutarGenerarReporte}
                  className="px-6 py-2 rounded-lg font-medium transition-colors"
                  style={{
                    backgroundColor: '#007C8A',
                    color: '#FFFFFF',
                    fontFamily: 'Lato, sans-serif'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#005a63';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#007C8A';
                  }}
                >
                  Generar reporte
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modales de Revisar y Generar Reporte */}

      {/* Modal de Auditoría */}
      {showAuditarModal && ordenSeleccionadaAuditar && resultadoAuditoria && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0, 124, 138, 0.5)' }}
          onClick={() => {
            setShowAuditarModal(false);
            setOrdenSeleccionadaAuditar(null);
            setResultadoAuditoria(null);
          }}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            style={{ fontFamily: 'Lato, sans-serif' }}
            data-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-200 bg-[#007C8A]">
              <div className="flex items-center justify-between">
                <div>
                  <h2 
                    className="text-2xl font-bold"
                    style={{ color: '#FFFFFF' }}
                  >
                    Auditoría Automática
                  </h2>
                  <p 
                    className="text-sm mt-1"
                    style={{ color: 'rgba(255,255,255,0.9)' }}
                  >
                    Comparación entre DDJJ e Inspección
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowAuditarModal(false);
                    setOrdenSeleccionadaAuditar(null);
                    setResultadoAuditoria(null);
                  }}
                  className="text-white hover:opacity-80 transition-opacity"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Contenido */}
            <div className="p-6">
              {!resultadoAuditoria.tieneInspeccion ? (
                <div className="text-center py-8">
                  <div className="mb-4">
                    <svg className="w-16 h-16 mx-auto text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold mb-2" style={{ color: '#374151' }}>
                    Sin Inspección
                  </h3>
                  <p style={{ color: '#6B7280' }}>
                    No se encontró una inspección para esta DDJJ. El inspector aún no ha realizado la inspección.
                  </p>
                </div>
              ) : resultadoAuditoria.todoCorrecto ? (
                <div className="text-center py-8">
                  <div className="mb-4">
                    <div 
                      className="rounded-full flex items-center justify-center mx-auto"
                      style={{
                        backgroundColor: '#E6FFE6',
                        width: '80px',
                        height: '80px'
                      }}
                    >
                      <svg 
                        className="w-10 h-10" 
                        fill="none" 
                        stroke="#00B69B" 
                        viewBox="0 0 24 24" 
                        strokeWidth={3}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-2" style={{ color: '#065F46' }}>
                    Todo Correcto
                  </h3>
                  <p style={{ color: '#6B7280', fontSize: '16px' }}>
                    No se encontraron discrepancias entre la DDJJ y la inspección realizada por el inspector.
                  </p>
                </div>
              ) : (
                <div>
                  <div className="mb-6">
                    <div className="mb-4">
                      <div 
                        className="rounded-full flex items-center justify-center mx-auto"
                        style={{
                          backgroundColor: '#FEE2E2',
                          width: '60px',
                          height: '60px'
                        }}
                      >
                        <svg 
                          className="w-8 h-8" 
                          fill="none" 
                          stroke="#DC2626" 
                          viewBox="0 0 24 24" 
                          strokeWidth={3}
                          style={{ display: 'block', margin: '0 auto' }}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold mb-2" style={{ color: '#991B1B' }}>
                      Se encontraron {resultadoAuditoria.diferencias.length} discrepancia(s)
                    </h3>
                    <p style={{ color: '#6B7280' }}>
                      Se detectaron diferencias entre la DDJJ y la inspección realizada por el inspector.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {resultadoAuditoria.diferencias.map((diferencia, index) => (
                      <div 
                        key={index}
                        className="border border-red-200 rounded-lg p-4 bg-red-50"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold mb-2" style={{ color: '#991B1B', fontSize: '16px' }}>
                              {diferencia.campo}
                            </h4>
                            <div className="space-y-1 text-sm">
                              <div>
                                <span className="font-medium" style={{ color: '#374151' }}>Declarado: </span>
                                <span style={{ color: '#6B7280' }}>{diferencia.declarado}</span>
                              </div>
                              <div>
                                <span className="font-medium" style={{ color: '#374151' }}>Inspección: </span>
                                <span style={{ color: '#6B7280' }}>{diferencia.inspeccion}</span>
                              </div>
                              <div className="mt-2 pt-2 border-t border-red-200">
                                <span style={{ color: '#991B1B', fontSize: '14px' }}>{diferencia.mensaje}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Botones de acción - Solo mostrar si hay inspección */}
              {resultadoAuditoria.tieneInspeccion && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  {/* Textarea para observaciones */}
                  <div className="mb-6">
                    <label 
                      htmlFor="observaciones-auditar"
                      className="block text-sm font-medium mb-2"
                      style={{ 
                        fontFamily: 'Lato, sans-serif',
                        color: '#374151'
                      }}
                    >
                      Nota / Observaciones
                    </label>
                    <textarea
                      id="observaciones-auditar"
                      value={observacionesAuditar}
                      onChange={(e) => setObservacionesAuditar(e.target.value)}
                      placeholder="Ingrese sus observaciones o notas sobre esta auditoría..."
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007C8A] focus:border-transparent resize-none"
                      style={{ 
                        fontFamily: 'Lato, sans-serif',
                        fontSize: '14px',
                        color: '#374151'
                      }}
                    />
                  </div>

                  {/* Botones de acción */}
                  <div className="flex justify-end gap-4">
                    <button
                      onClick={() => handleGuardarAuditoria('correcto')}
                      disabled={isGuardandoAuditar}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ fontFamily: 'Lato, sans-serif' }}
                    >
                      {isGuardandoAuditar ? 'Guardando...' : 'Correcto'}
                    </button>
                    <button
                      onClick={() => handleGuardarAuditoria('discrepancias')}
                      disabled={isGuardandoAuditar}
                      className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ fontFamily: 'Lato, sans-serif' }}
                    >
                      {isGuardandoAuditar ? 'Guardando...' : 'Discrepancia'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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

export default ExploradorAuditorias;
