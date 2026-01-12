import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { JSON_SERVER_URL } from '../config/api';
import { getAllFromTable, getByForeignKey, insertIntoTable, updateInTable, supabase, registrarAuditoria } from '../config/supabase';

const GestionOT = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [ordenesTrabajo, setOrdenesTrabajo] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [lineasServicio, setLineasServicio] = useState([]);
  const [tiposMantenimiento, setTiposMantenimiento] = useState([]);
  const [detallesInsumo, setDetallesInsumo] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(7);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const menuRef = useRef(null);
  const menuButtonRefs = useRef({});
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [tiposNotificacion, setTiposNotificacion] = useState([]);
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
  const [showDesignarInspectorModal, setShowDesignarInspectorModal] = useState(false);
  const [showDesignarAuditorModal, setShowDesignarAuditorModal] = useState(false);
  const [ordenTrabajoSeleccionada, setOrdenTrabajoSeleccionada] = useState(null);
  const [inspectorAsignado, setInspectorAsignado] = useState(null); // Información del inspector ya asignado
  const [auditorAsignado, setAuditorAsignado] = useState(null); // Información del auditor ya asignado
  const [formDataInspector, setFormDataInspector] = useState({
    id_inspector: '',
    interno_vehiculo: ''
  });
  const [formDataAuditor, setFormDataAuditor] = useState({
    id_auditor: '',
    interno_vehiculo: ''
  });
  const [fieldErrorsInspector, setFieldErrorsInspector] = useState({});
  const [fieldErrorsAuditor, setFieldErrorsAuditor] = useState({});
  const [isSubmittingInspector, setIsSubmittingInspector] = useState(false);
  const [isSubmittingAuditor, setIsSubmittingAuditor] = useState(false);
  const [toast, setToast] = useState(null);
  const [searchInspectorTerm, setSearchInspectorTerm] = useState('');
  const [searchAuditorTerm, setSearchAuditorTerm] = useState('');
  const [showInspectorDropdown, setShowInspectorDropdown] = useState(false);
  const [showAuditorDropdown, setShowAuditorDropdown] = useState(false);
  const inspectorDropdownRef = useRef(null);
  const auditorDropdownRef = useRef(null);

  const COLORS = ['#FF6F6F', '#FFA500', '#90EE90', '#00B69B', '#00B69B'];

  // Función para formatear fecha (DD/MM/YYYY)
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Función para formatear número con separadores de miles
  const formatNumber = (num) => {
    return new Intl.NumberFormat('es-AR').format(num);
  };

  // Función para obtener el tipo de mantenimiento de una orden
  const getTipoMantenimiento = (orden) => {
    // Obtener el tipo de mantenimiento directamente desde la orden de trabajo
    if (!orden || !orden.id_tipo_mantenimiento) return null;
    const tipo = tiposMantenimiento.find(tm => tm.id_tipo === orden.id_tipo_mantenimiento);
    return tipo?.descripcion || null;
  };

  // Función para crear notificación de nueva asignación
  const crearNotificacionAsignacion = async (idUsuario, orden) => {
    try {
      console.log('[Notificación] Iniciando creación de notificación para usuario:', idUsuario);
      console.log('[Notificación] Tipos de notificación disponibles:', tiposNotificacion);
      console.log('[Notificación] Estado de datos:', {
        tiposNotificacionLength: tiposNotificacion.length,
        vehiculosLength: vehiculos.length,
        empresasLength: empresas.length,
        tiposMantenimientoLength: tiposMantenimiento.length
      });
      
      // Verificar que los datos estén cargados
      if (!tiposNotificacion || tiposNotificacion.length === 0) {
        console.error('[Notificación] Los tipos de notificación no están cargados');
        return;
      }
      
      // Buscar el tipo de notificación "Nueva asignacion" (búsqueda flexible)
      const tipoNotificacion = tiposNotificacion.find(tn => {
        const nombre = (tn.nombre_de_notif || '').toLowerCase().trim();
        return nombre === 'nueva asignacion' || 
               nombre === 'nueva asignación' ||
               nombre.includes('asignacion') ||
               nombre.includes('asignación');
      });
      
      if (!tipoNotificacion) {
        console.error('[Notificación] No se encontró el tipo de notificación "Nueva asignacion"');
        console.error('[Notificación] Tipos disponibles:', tiposNotificacion.map(tn => tn.nombre_de_notif));
        return;
      }

      console.log('[Notificación] Tipo de notificación encontrado:', tipoNotificacion);

      // Obtener datos de la orden de trabajo
      const vehiculo = vehiculos.find(v => v.id_vehiculo === orden.id_vehiculo);
      const empresa = vehiculo ? empresas.find(e => e.id_empresa === vehiculo.id_empresa) : null;
      const tipoMantenimiento = getTipoMantenimiento(orden);
      
      console.log('[Notificación] Datos de la orden:', {
        orden: orden.nro_orden_trabajo,
        vehiculo: vehiculo?.matricula,
        empresa: empresa?.nombre_empresa,
        tipoMantenimiento
      });
      
      // Determinar el estado según el tipo de mantenimiento
      let estadoMostrar = 'N/A';
      if (tipoMantenimiento === 'Preventivo') {
        estadoMostrar = 'Preventivo';
      } else if (tipoMantenimiento === 'Correctivo') {
        estadoMostrar = 'Correcto';
      }

      // Formatear fecha de ingreso
      const fechaIngreso = formatDate(orden.fecha_generacion);

      // Construir la nota con el formato requerido
      const nota = `N OT: ${orden.nro_orden_trabajo || 'N/A'}, Matrícula: ${vehiculo?.matricula || 'N/A'}, Empresa: ${empresa?.nombre_empresa || 'N/A'}, Fecha Ingreso: ${fechaIngreso}, Estado: ${estadoMostrar}`;

      console.log('[Notificación] Nota generada:', nota);

      // Crear la notificación
      const notificacionData = {
        id_tipo_notificacion: tipoNotificacion.id,
        id_usuario: idUsuario,
        fecha_hora: new Date().toISOString(),
        nota: nota,
        visto: false
      };

      console.log('[Notificación] Datos a insertar:', notificacionData);

      const resultado = await insertIntoTable('notificaciones', notificacionData);
      console.log('[Notificación] ✅ Notificación creada exitosamente para usuario:', idUsuario, resultado);
    } catch (error) {
      console.error('[Notificación] ❌ Error al crear notificación:', error);
      console.error('[Notificación] Detalles del error:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      // No lanzar el error para no interrumpir el flujo de asignación
    }
  };

  // Función para obtener el estilo del badge según el tipo de mantenimiento
  const getEstadoBadgeStyle = (tipoMantenimiento) => {
    if (!tipoMantenimiento || tipoMantenimiento === 'N/A') {
      return {
        bg: '#F3F4F6',
        text: '#6B7280',
        border: '#6B7280'
      };
    }
    
    const tipo = tipoMantenimiento.toString().trim();
    
    if (tipo === 'Preventivo') {
      return {
        bg: '#E0F7F7',
        text: '#4CAF50',
        border: '#4CAF50'
      };
    } else if (tipo === 'Correctivo') {
      return {
        bg: '#FFEDED',
        text: '#E07B7B',
        border: '#E07B7B'
      };
    }
    
    // Tipo desconocido
    return {
      bg: '#F3F4F6',
      text: '#6B7280',
      border: '#6B7280'
    };
  };

  // Cargar datos del servidor
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Usar Supabase para obtener los datos
        const [ordenesData, vehiculosData, empresasData, lineasData, tiposData, detallesData, usuariosData, rolesData, tiposNotifData] = await Promise.all([
          getAllFromTable('orden_trabajo'),
          getAllFromTable('vehiculo'),
          getAllFromTable('empresa'),
          getAllFromTable('linea_servicio'),
          getAllFromTable('tipo_mantenimiento'),
          getAllFromTable('detalle_insumo'),
          getAllFromTable('usuario'),
          getAllFromTable('rol'),
          getAllFromTable('tipo_notificacion')
        ]);

        // Validar que los datos sean arrays
        const validOrdenes = Array.isArray(ordenesData) ? ordenesData : [];
        const validVehiculos = Array.isArray(vehiculosData) ? vehiculosData : [];
        const validEmpresas = Array.isArray(empresasData) ? empresasData : [];
        const validLineas = Array.isArray(lineasData) ? lineasData : [];
        const validTipos = Array.isArray(tiposData) ? tiposData : [];
        const validDetalles = Array.isArray(detallesData) ? detallesData : [];
        const validUsuarios = Array.isArray(usuariosData) ? usuariosData : [];
        const validRoles = Array.isArray(rolesData) ? rolesData : [];
        const validTiposNotif = Array.isArray(tiposNotifData) ? tiposNotifData : [];

        setOrdenesTrabajo(validOrdenes);
        setVehiculos(validVehiculos);
        setEmpresas(validEmpresas);
        setLineasServicio(validLineas);
        setTiposMantenimiento(validTipos);
        setDetallesInsumo(validDetalles);
        setUsuarios(validUsuarios);
        setRoles(validRoles);
        setTiposNotificacion(validTiposNotif);
      } catch (error) {
        // Fallback en caso de error inesperado
        setOrdenesTrabajo([]);
        setVehiculos([]);
        setEmpresas([]);
        setLineasServicio([]);
        setTiposMantenimiento([]);
        setDetallesInsumo([]);
        setUsuarios([]);
        setRoles([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Cerrar dropdown de inspector y auditor al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inspectorDropdownRef.current && !inspectorDropdownRef.current.contains(event.target)) {
        setShowInspectorDropdown(false);
      }
      if (auditorDropdownRef.current && !auditorDropdownRef.current.contains(event.target)) {
        setShowAuditorDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Cerrar menú al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openMenuId) {
        const buttonRef = menuButtonRefs.current[openMenuId];
        const menuElement = document.querySelector('[data-menu-dropdown]');
        
        if (buttonRef && !buttonRef.contains(event.target) && 
            menuElement && !menuElement.contains(event.target)) {
          setOpenMenuId(null);
        }
      }
    };

    if (openMenuId) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMenuId]);

  // Crear mapas para búsqueda rápida
  const vehiculosMap = {};
  vehiculos.forEach(v => {
    vehiculosMap[v.id_vehiculo] = v;
  });

  const empresasMap = {};
  empresas.forEach(e => {
    empresasMap[e.id_empresa] = e;
  });

  const costoPorOrden = useMemo(() => {
    const map = new Map();
    for (const d of detallesInsumo) {
      const idOrden = d.id_orden;
      const costo = Number(d.costo_total ?? 0);
      map.set(idOrden, (map.get(idOrden) ?? 0) + (Number.isFinite(costo) ? costo : 0));
    }
    return map;
  }, [detallesInsumo]);

  const ordenesAbiertas = useMemo(() => {
    // Consideramos "abierta" cuando no está completada o no tiene fecha de egreso.
    return ordenesTrabajo.filter(o => o.estado !== 'Completada' || !o.fecha_egreso);
  }, [ordenesTrabajo]);

  const costoAcumuladoAbierto = useMemo(() => {
    return ordenesAbiertas.reduce((acc, o) => acc + (costoPorOrden.get(o.id_orden) ?? 0), 0);
  }, [ordenesAbiertas, costoPorOrden]);

  const top5Data = useMemo(() => {
    const vehiculosLocalMap = {};
    vehiculos.forEach(v => {
      vehiculosLocalMap[v.id_vehiculo] = v;
    });
    return [...ordenesAbiertas]
      .map(o => {
        const vehiculo = vehiculosLocalMap[o.id_vehiculo];
        const name = vehiculo?.interno || vehiculo?.matricula || o.nro_orden_trabajo;
        const value = costoPorOrden.get(o.id_orden) ?? 0;
        return { name, value };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
      .map((row, idx) => ({ ...row, color: COLORS[idx] || '#00B69B' }));
  }, [ordenesAbiertas, vehiculos, costoPorOrden]);

  const antiguedadData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const buckets = [
      { key: '0-3', name: '0 - 3 días', value: 0, color: '#00B69B' },
      { key: '4-7', name: '4 - 7 días', value: 0, color: '#FFA500' },
      { key: '7+', name: 'Más de 7 días', value: 0, color: '#FF6F6F' },
    ];

    for (const o of ordenesAbiertas) {
      const fecha = o.fecha_generacion ? new Date(o.fecha_generacion) : null;
      if (!fecha || Number.isNaN(fecha.getTime())) continue;
      fecha.setHours(0, 0, 0, 0);
      const diffDays = Math.floor((today - fecha) / (1000 * 60 * 60 * 24));
      const costo = costoPorOrden.get(o.id_orden) ?? 0;

      if (diffDays <= 3) buckets[0].value += costo;
      else if (diffDays <= 7) buckets[1].value += costo;
      else buckets[2].value += costo;
    }

    return buckets;
  }, [ordenesAbiertas, costoPorOrden]);

  // Combinar datos para la tabla
  const datosTabla = ordenesTrabajo.map(orden => {
    const vehiculo = vehiculosMap[orden.id_vehiculo];
    const empresa = vehiculo ? empresasMap[vehiculo.id_empresa] : null;
    const tipoMantenimiento = getTipoMantenimiento(orden);
    
    // Determinar el estado según el tipo de mantenimiento
    let estadoMostrar = 'N/A';
    if (tipoMantenimiento === 'Preventivo') {
      estadoMostrar = 'Preventivo';
    } else if (tipoMantenimiento === 'Correctivo') {
      estadoMostrar = 'Correcto';
    }

    return {
      id: orden.id_orden,
      nOt: orden.nro_orden_trabajo,
      matricula: vehiculo?.matricula || vehiculo?.interno || 'N/A',
      empresa: empresa?.nombre_empresa || 'N/A',
      fechaIngreso: orden.fecha_generacion,
      fechaEgreso: orden.fecha_egreso,
      odometro: orden.odometro,
      horometro: orden.horometro,
      estado: estadoMostrar,
      tipoMantenimiento: tipoMantenimiento // Guardar también el tipo para el estilo
    };
  });

  // Filtrar datos según búsqueda
  const filteredData = datosTabla.filter(item => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    
    // Formatear fechas para búsqueda
    const fechaIngresoStr = item.fechaIngreso ? formatDate(item.fechaIngreso).toLowerCase() : '';
    const fechaEgresoStr = item.fechaEgreso ? formatDate(item.fechaEgreso).toLowerCase() : '';
    
    // Formatear números para búsqueda
    const odometroStr = item.odometro ? formatNumber(item.odometro).toLowerCase() : '';
    const horometroStr = item.horometro ? formatNumber(item.horometro).toLowerCase() : '';
    
    // Obtener estado
    const estadoStr = item.estado?.toLowerCase() || '';
    
    return (
      item.nOt?.toLowerCase().includes(searchLower) ||
      item.matricula?.toLowerCase().includes(searchLower) ||
      item.empresa?.toLowerCase().includes(searchLower) ||
      fechaIngresoStr.includes(searchLower) ||
      fechaEgresoStr.includes(searchLower) ||
      odometroStr.includes(searchLower) ||
      horometroStr.includes(searchLower) ||
      estadoStr.includes(searchLower)
    );
  });

  // Calcular paginación
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  // Formatear moneda
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Filtrar inspectores (usuarios con id_rol === 3 y activos)
  // Mostrar todos los inspectores activos, o aquellos donde activo no esté definido (asumimos activos)
  const inspectores = Array.isArray(usuarios) && Array.isArray(roles)
    ? usuarios.filter(u => {
        const rol = roles.find(r => r.id_rol === u.id_rol);
        const esInspector = rol?.nombre === 'Inspector' || u.id_rol === 3;
        // Considerar activo si es true, 'true', 1, o si no está definido (null/undefined)
        const estaActivo = u.activo === true || u.activo === 'true' || u.activo === 1 || u.activo === null || u.activo === undefined;
        return esInspector && estaActivo;
      })
    : [];

  // Filtrar inspectores por búsqueda
  // Si no hay término de búsqueda, mostrar todos los inspectores
  const inspectoresFiltrados = !searchInspectorTerm 
    ? inspectores 
    : inspectores.filter(inspector => {
        const searchLower = searchInspectorTerm.toLowerCase();
        const nombreCompleto = inspector.nombre_completo?.toLowerCase() || '';
        return nombreCompleto.includes(searchLower);
      });

  // Filtrar auditores (usuarios con id_rol === 4)
  // Mostrar TODOS los auditores de la DB, sin importar si están activos o tienen asignaciones
  const auditores = Array.isArray(usuarios) && Array.isArray(roles)
    ? usuarios.filter(u => {
        // Verificar directamente por id_rol === 4 primero (más confiable)
        if (u.id_rol === 4) {
          return true;
        }
        // También verificar por nombre del rol por si acaso
        const rol = roles.find(r => r.id_rol === u.id_rol);
        return rol?.nombre === 'Auditor';
      })
    : [];

  // Filtrar auditores por búsqueda
  // Si no hay término de búsqueda, mostrar todos los auditores
  const auditoresFiltrados = !searchAuditorTerm 
    ? auditores 
    : auditores.filter(auditor => {
        const searchLower = searchAuditorTerm.toLowerCase();
        const nombreCompleto = auditor.nombre_completo?.toLowerCase() || '';
        return nombreCompleto.includes(searchLower);
      });

  // Manejar click en menú de acciones
  const handleActionClick = async (id, action) => {
    setOpenMenuId(null);
    const orden = ordenesTrabajo.find(ot => ot.id_orden === id);
    
    if (action === 'designar') {
      setOrdenTrabajoSeleccionada(orden);
      
      // Cargar datos existentes de orden_x_usuario para inspector usando Supabase
      try {
        const ordenUsuarioData = await getByForeignKey('orden_x_usuario', 'id_orden_trabajo', id);
        
        // Buscar el registro del inspector (rol 3)
        const inspectorRegistro = Array.isArray(ordenUsuarioData) 
          ? ordenUsuarioData.find(ou => {
              const usuario = usuarios.find(u => u.id_usuario === ou.id_usuario);
              return usuario && usuario.id_rol === 3;
            })
          : null;
        
        if (inspectorRegistro) {
          // Ya existe un inspector asignado
          const inspectorId = inspectorRegistro.id_usuario;
          const inspectorInfo = inspectores.find(i => i.id_usuario === inspectorId);
          setInspectorAsignado({
            id_usuario: inspectorId,
            nombre_completo: inspectorInfo?.nombre_completo || 'Sin nombre',
            email: inspectorInfo?.email || '',
            dni: inspectorInfo?.dni || ''
          });
          setFormDataInspector({
            id_inspector: '',
            interno_vehiculo: ''
          });
          setSearchInspectorTerm('');
        } else {
          // No hay inspector asignado, permitir asignar
          setInspectorAsignado(null);
          setFormDataInspector({
            id_inspector: '',
            interno_vehiculo: orden ? (vehiculos.find(v => v.id_vehiculo === orden.id_vehiculo)?.interno || '') : ''
          });
          setSearchInspectorTerm('');
        }
      } catch (error) {
        console.error('Error al cargar datos existentes:', error);
        setInspectorAsignado(null);
        setFormDataInspector({
          id_inspector: '',
          interno_vehiculo: orden ? (vehiculos.find(v => v.id_vehiculo === orden.id_vehiculo)?.interno || '') : ''
        });
        setSearchInspectorTerm('');
      }
      
      setFieldErrorsInspector({});
      setShowDesignarInspectorModal(true);
    } else if (action === 'agregar') {
      setOrdenTrabajoSeleccionada(orden);
      
      // Cargar datos existentes de orden_x_usuario para auditor usando Supabase
      try {
        const ordenUsuarioData = await getByForeignKey('orden_x_usuario', 'id_orden_trabajo', id);
        
        // Buscar el registro del auditor (rol 4)
        const auditorRegistro = Array.isArray(ordenUsuarioData) 
          ? ordenUsuarioData.find(ou => {
              const usuario = usuarios.find(u => u.id_usuario === ou.id_usuario);
              return usuario && usuario.id_rol === 4;
            })
          : null;
        
        if (auditorRegistro) {
          // Ya existe un auditor asignado
          const auditorId = auditorRegistro.id_usuario;
          const auditorInfo = auditores.find(a => a.id_usuario === auditorId);
          setAuditorAsignado({
            id_usuario: auditorId,
            nombre_completo: auditorInfo?.nombre_completo || 'Sin nombre',
            email: auditorInfo?.email || '',
            dni: auditorInfo?.dni || ''
          });
          setFormDataAuditor({
            id_auditor: '',
            interno_vehiculo: ''
          });
          setSearchAuditorTerm('');
        } else {
          // No hay auditor asignado, permitir asignar
          setAuditorAsignado(null);
          setFormDataAuditor({
            id_auditor: '',
            interno_vehiculo: orden ? (vehiculos.find(v => v.id_vehiculo === orden.id_vehiculo)?.interno || '') : ''
          });
          setSearchAuditorTerm('');
        }
      } catch (error) {
        console.error('Error al cargar datos existentes:', error);
        setAuditorAsignado(null);
        setFormDataAuditor({
          id_auditor: '',
          interno_vehiculo: orden ? (vehiculos.find(v => v.id_vehiculo === orden.id_vehiculo)?.interno || '') : ''
        });
        setSearchAuditorTerm('');
      }
      
      setFieldErrorsAuditor({});
      setShowDesignarAuditorModal(true);
    }
  };

  // Manejar asignación de inspector
  const handleAsignarInspector = async () => {
    // Validar campos requeridos
    const errors = {};
    const camposFaltantes = [];

    if (!formDataInspector.id_inspector || formDataInspector.id_inspector === '' || formDataInspector.id_inspector === null || formDataInspector.id_inspector === undefined) {
      errors.id_inspector = 'Nombre completo del inspector es requerido';
      camposFaltantes.push('Nombre completo del inspector');
    }

    if (!formDataInspector.interno_vehiculo || String(formDataInspector.interno_vehiculo).trim() === '') {
      errors.interno_vehiculo = 'Interno del vehículo es requerido';
      camposFaltantes.push('Interno del vehículo');
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrorsInspector(errors);
      setToast({
        type: 'error',
        title: 'Error al asignar inspector',
        message: `Por favor complete los siguientes campos: ${camposFaltantes.join(', ')}`
      });
      
      // Scroll al primer campo con error
      const firstErrorField = Object.keys(errors)[0];
      const errorElement = document.querySelector(`[name="${firstErrorField}"]`);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        errorElement.focus();
      }
      
      setTimeout(() => setToast(null), 5000);
      return;
    }

    // Limpiar errores si la validación pasa
    setFieldErrorsInspector({});
    setIsSubmittingInspector(true);

    try {
      if (!ordenTrabajoSeleccionada || !ordenTrabajoSeleccionada.id_orden) {
        throw new Error('No se ha seleccionado una orden de trabajo válida');
      }

      // Verificar si ya existe un registro para esta orden con un inspector usando Supabase
      const ordenUsuarioData = await getByForeignKey('orden_x_usuario', 'id_orden_trabajo', ordenTrabajoSeleccionada.id_orden);
      
      const idInspector = parseInt(formDataInspector.id_inspector, 10);
      const idOrdenNum = parseInt(ordenTrabajoSeleccionada.id_orden, 10);
      
      // Validar que el usuario seleccionado sea realmente un inspector
      const inspectorSeleccionado = inspectores.find(i => i.id_usuario === idInspector);
      if (!inspectorSeleccionado) {
        throw new Error('El usuario seleccionado no es un inspector válido');
      }
      
      // Verificar si ya existe un registro con esta combinación exacta de orden y usuario
      // Comparar como números para evitar problemas de tipo
      // También verificar todos los campos posibles que podrían contener estos valores
      const registroExacto = Array.isArray(ordenUsuarioData) 
        ? ordenUsuarioData.find(ou => {
            const ouIdUsuario = parseInt(ou.id_usuario || ou.idUsuario || ou.usuario_id || 0, 10);
            const ouIdOrden = parseInt(ou.id_orden_trabajo || ou.idOrdenTrabajo || ou.orden_trabajo_id || 0, 10);
            return ouIdUsuario === idInspector && ouIdOrden === idOrdenNum;
          })
        : null;

      if (registroExacto) {
        // Ya existe esta asignación exacta, mostrar mensaje informativo
        setToast({
          type: 'success',
          title: 'Inspector ya asignado',
          message: 'Este inspector ya está asignado a esta orden de trabajo'
        });
        setTimeout(() => {
          setShowDesignarInspectorModal(false);
          setOrdenTrabajoSeleccionada(null);
          setFormDataInspector({
            id_inspector: '',
            interno_vehiculo: ''
          });
          setFieldErrorsInspector({});
          setSearchInspectorTerm('');
          setToast(null);
        }, 2000);
        return;
      }

      // Buscar si ya existe un registro para esta orden con un inspector (cualquier inspector)
      const registroInspectorExistente = Array.isArray(ordenUsuarioData) 
        ? ordenUsuarioData.find(ou => {
            const usuario = usuarios.find(u => u.id_usuario === ou.id_usuario);
            return usuario && usuario.id_rol === 3;
          })
        : null;

      if (registroInspectorExistente) {
        // Actualizar registro existente (reemplazar el inspector anterior)
        await updateInTable('orden_x_usuario', { id: registroInspectorExistente.id }, {
          id_usuario: idInspector
        });
        // Crear notificación para el inspector asignado
        await crearNotificacionAsignacion(idInspector, ordenTrabajoSeleccionada);
      } else {
        // Verificar una vez más con una consulta directa antes de insertar
        const { data: verificacionDirecta, error: errorVerificacion } = await supabase
          .from('orden_x_usuario')
          .select('*')
          .eq('id_orden_trabajo', idOrdenNum)
          .eq('id_usuario', idInspector)
          .maybeSingle();
        
        if (errorVerificacion && errorVerificacion.code !== 'PGRST116') {
          // PGRST116 es "no rows returned", que es esperado si no existe
          console.error('Error verificando registro:', errorVerificacion);
        }
        
        if (verificacionDirecta) {
          // Ya existe esta asignación exacta
          setToast({
            type: 'success',
            title: 'Inspector ya asignado',
            message: 'Este inspector ya está asignado a esta orden de trabajo'
          });
          setTimeout(() => {
            setShowDesignarInspectorModal(false);
            setOrdenTrabajoSeleccionada(null);
            setFormDataInspector({
              id_inspector: '',
              interno_vehiculo: ''
            });
            setFieldErrorsInspector({});
            setSearchInspectorTerm('');
            setToast(null);
          }, 2000);
          return;
        }
        
        // Crear nuevo registro para el inspector
        // Usar try-catch para manejar errores de duplicado
        try {
          await insertIntoTable('orden_x_usuario', {
            id_orden_trabajo: ordenTrabajoSeleccionada.id_orden,
            id_usuario: idInspector
          });
        } catch (insertError) {
          // Si el error es de duplicado (409 o código 23505), mostrar mensaje
          if (insertError.code === '23505' || insertError.code === 409 || insertError.message?.includes('duplicate')) {
            setToast({
              type: 'success',
              title: 'Inspector ya asignado',
              message: 'Este inspector ya está asignado a esta orden de trabajo'
            });
            setTimeout(() => {
              setShowDesignarInspectorModal(false);
              setOrdenTrabajoSeleccionada(null);
              setFormDataInspector({
                id_inspector: '',
                interno_vehiculo: ''
              });
              setFieldErrorsInspector({});
              setSearchInspectorTerm('');
              setToast(null);
            }, 2000);
            return;
          }
          // Si no es un error de duplicado, relanzar el error
          throw insertError;
        }
      }

      // Crear notificación para el inspector asignado
      await crearNotificacionAsignacion(idInspector, ordenTrabajoSeleccionada);
      
      // Obtener información del inspector y vehículo para auditoría
      const inspectorInfo = inspectores.find(i => i.id_usuario === idInspector);
      const vehiculoInfo = vehiculos.find(v => v.id_vehiculo === ordenTrabajoSeleccionada.id_vehiculo);
      
      // Registrar auditoría
      await registrarAuditoria({
        usuarioNombre: user?.nombre || 'Usuario desconocido',
        idUsuarioRef: user?.id_usuario || null,
        accion: 'ASIGNAR',
        tipoRegistro: 'orden_trabajo',
        idRegistro: ordenTrabajoSeleccionada.id_orden,
        idMantenimientoRef: ordenTrabajoSeleccionada.id_orden,
        detalle: `Asignación de Inspector: ${inspectorInfo?.nombre_completo || 'N/A'} a OT N° ${ordenTrabajoSeleccionada.nro_orden_trabajo || 'N/A'}, Matrícula: ${vehiculoInfo?.matricula || 'N/A'}`
      });

      // Éxito: mostrar alerta
      setToast({
        type: 'success',
        title: 'Inspector asignado',
        message: 'El inspector ha sido asignado exitosamente a esta orden de trabajo'
      });

      // Cerrar modal y resetear formulario después de 2 segundos
      setTimeout(() => {
        setShowDesignarInspectorModal(false);
        setOrdenTrabajoSeleccionada(null);
        setFormDataInspector({
          id_inspector: '',
          interno_vehiculo: ''
        });
        setFieldErrorsInspector({});
        setSearchInspectorTerm('');
        setToast(null);
      }, 2000);

    } catch (error) {
      console.error('Error al asignar inspector:', error);
      setToast({
        type: 'error',
        title: 'Error al asignar inspector',
        message: error.message || 'Ocurrió un error al intentar asignar el inspector. Por favor intente nuevamente.'
      });
      setTimeout(() => setToast(null), 5000);
    } finally {
      setIsSubmittingInspector(false);
    }
  };

  // Manejar asignación de auditor
  const handleAsignarAuditor = async () => {
    // Validar campos requeridos
    const errors = {};
    const camposFaltantes = [];

    if (!formDataAuditor.id_auditor || formDataAuditor.id_auditor === '' || formDataAuditor.id_auditor === null || formDataAuditor.id_auditor === undefined) {
      errors.id_auditor = 'Nombre completo del auditor es requerido';
      camposFaltantes.push('Nombre completo del auditor');
    }

    if (!formDataAuditor.interno_vehiculo || String(formDataAuditor.interno_vehiculo).trim() === '') {
      errors.interno_vehiculo = 'Interno del vehículo es requerido';
      camposFaltantes.push('Interno del vehículo');
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrorsAuditor(errors);
      setToast({
        type: 'error',
        title: 'Error al asignar auditor',
        message: `Por favor complete los siguientes campos: ${camposFaltantes.join(', ')}`
      });
      
      // Scroll al primer campo con error
      const firstErrorField = Object.keys(errors)[0];
      const errorElement = document.querySelector(`[name="${firstErrorField}"]`);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        errorElement.focus();
      }
      
      setTimeout(() => setToast(null), 5000);
      return;
    }

    // Limpiar errores si la validación pasa
    setFieldErrorsAuditor({});
    setIsSubmittingAuditor(true);

    try {
      if (!ordenTrabajoSeleccionada || !ordenTrabajoSeleccionada.id_orden) {
        throw new Error('No se ha seleccionado una orden de trabajo válida');
      }

      // Verificar si ya existe un registro para esta orden con un auditor usando Supabase
      const ordenUsuarioData = await getByForeignKey('orden_x_usuario', 'id_orden_trabajo', ordenTrabajoSeleccionada.id_orden);
      
      const idAuditor = parseInt(formDataAuditor.id_auditor, 10);
      const idOrdenNum = parseInt(ordenTrabajoSeleccionada.id_orden, 10);
      
      // Validar que el usuario seleccionado sea realmente un auditor
      const auditorSeleccionado = auditores.find(a => a.id_usuario === idAuditor);
      if (!auditorSeleccionado) {
        throw new Error('El usuario seleccionado no es un auditor válido');
      }
      
      // Verificar si ya existe un registro con esta combinación exacta de orden y usuario
      // Comparar como números para evitar problemas de tipo
      // También verificar todos los campos posibles que podrían contener estos valores
      const registroExacto = Array.isArray(ordenUsuarioData) 
        ? ordenUsuarioData.find(ou => {
            const ouIdUsuario = parseInt(ou.id_usuario || ou.idUsuario || ou.usuario_id, 10);
            const ouIdOrden = parseInt(ou.id_orden_trabajo || ou.idOrdenTrabajo || ou.orden_trabajo_id, 10);
            return ouIdUsuario === idAuditor && ouIdOrden === idOrdenNum;
          })
        : null;

      if (registroExacto) {
        // Ya existe esta asignación exacta, mostrar mensaje informativo
        setToast({
          type: 'success',
          title: 'Auditor ya asignado',
          message: 'Este auditor ya está asignado a esta orden de trabajo'
        });
        setTimeout(() => {
          setShowDesignarAuditorModal(false);
          setOrdenTrabajoSeleccionada(null);
          setFormDataAuditor({
            id_auditor: '',
            interno_vehiculo: ''
          });
          setFieldErrorsAuditor({});
          setSearchAuditorTerm('');
          setToast(null);
        }, 2000);
        return;
      }

      // Buscar si ya existe un registro para esta orden con un auditor (cualquier auditor)
      const registroAuditorExistente = Array.isArray(ordenUsuarioData) 
        ? ordenUsuarioData.find(ou => {
            const usuario = usuarios.find(u => u.id_usuario === ou.id_usuario);
            return usuario && usuario.id_rol === 4;
          })
        : null;

      if (registroAuditorExistente) {
        // Actualizar registro existente (reemplazar el auditor anterior)
        await updateInTable('orden_x_usuario', { id: registroAuditorExistente.id }, {
          id_usuario: idAuditor
        });
        // Crear notificación para el auditor asignado
        await crearNotificacionAsignacion(idAuditor, ordenTrabajoSeleccionada);
      } else {
        // Verificar una vez más con una consulta directa antes de insertar
        const { data: verificacionDirecta, error: errorVerificacion } = await supabase
          .from('orden_x_usuario')
          .select('*')
          .eq('id_orden_trabajo', idOrdenNum)
          .eq('id_usuario', idAuditor)
          .maybeSingle();
        
        if (errorVerificacion && errorVerificacion.code !== 'PGRST116') {
          // PGRST116 es "no rows returned", que es esperado si no existe
          console.error('Error verificando registro:', errorVerificacion);
        }
        
        if (verificacionDirecta) {
          // Ya existe esta asignación exacta
          setToast({
            type: 'success',
            title: 'Auditor ya asignado',
            message: 'Este auditor ya está asignado a esta orden de trabajo'
          });
          setTimeout(() => {
            setShowDesignarAuditorModal(false);
            setOrdenTrabajoSeleccionada(null);
            setFormDataAuditor({
              id_auditor: '',
              interno_vehiculo: ''
            });
            setFieldErrorsAuditor({});
            setSearchAuditorTerm('');
            setToast(null);
          }, 2000);
          return;
        }
        
        // Crear nuevo registro para el auditor
        // Usar try-catch para manejar errores de duplicado
        try {
          await insertIntoTable('orden_x_usuario', {
            id_orden_trabajo: ordenTrabajoSeleccionada.id_orden,
            id_usuario: idAuditor
          });
        } catch (insertError) {
          // Si el error es de duplicado (409 o código 23505), mostrar mensaje
          if (insertError.code === '23505' || insertError.code === 409 || insertError.message?.includes('duplicate')) {
            setToast({
              type: 'success',
              title: 'Auditor ya asignado',
              message: 'Este auditor ya está asignado a esta orden de trabajo'
            });
            setTimeout(() => {
              setShowDesignarAuditorModal(false);
              setOrdenTrabajoSeleccionada(null);
              setFormDataAuditor({
                id_auditor: '',
                interno_vehiculo: ''
              });
              setFieldErrorsAuditor({});
              setSearchAuditorTerm('');
              setToast(null);
            }, 2000);
            return;
          }
          // Si no es un error de duplicado, relanzar el error
          throw insertError;
        }
      }

      // Crear notificación para el auditor asignado
      await crearNotificacionAsignacion(idAuditor, ordenTrabajoSeleccionada);
      
      // Obtener información del auditor y vehículo para auditoría
      const auditorInfo = auditores.find(a => a.id_usuario === idAuditor);
      const vehiculoInfo = vehiculos.find(v => v.id_vehiculo === ordenTrabajoSeleccionada.id_vehiculo);
      
      // Registrar auditoría
      await registrarAuditoria({
        usuarioNombre: user?.nombre || 'Usuario desconocido',
        idUsuarioRef: user?.id_usuario || null,
        accion: 'ASIGNAR',
        tipoRegistro: 'orden_trabajo',
        idRegistro: ordenTrabajoSeleccionada.id_orden,
        idMantenimientoRef: ordenTrabajoSeleccionada.id_orden,
        detalle: `Asignación de Auditor: ${auditorInfo?.nombre_completo || 'N/A'} a OT N° ${ordenTrabajoSeleccionada.nro_orden_trabajo || 'N/A'}, Matrícula: ${vehiculoInfo?.matricula || 'N/A'}`
      });

      // Éxito: mostrar alerta
      setToast({
        type: 'success',
        title: 'Auditor asignado',
        message: 'El auditor ha sido asignado exitosamente a esta orden de trabajo'
      });

      // Cerrar modal y resetear formulario después de 2 segundos
      setTimeout(() => {
        setShowDesignarAuditorModal(false);
        setOrdenTrabajoSeleccionada(null);
        setFormDataAuditor({
          id_auditor: '',
          interno_vehiculo: ''
        });
        setFieldErrorsAuditor({});
        setSearchAuditorTerm('');
        setToast(null);
      }, 2000);

    } catch (error) {
      console.error('Error al asignar auditor:', error);
      setToast({
        type: 'error',
        title: 'Error al asignar auditor',
        message: error.message || 'Ocurrió un error al intentar asignar el auditor. Por favor intente nuevamente.'
      });
      setTimeout(() => setToast(null), 5000);
    } finally {
      setIsSubmittingAuditor(false);
    }
  };

  // Manejar cierre del modal de asignar inspector
  const handleCerrarModalInspector = () => {
    setShowDesignarInspectorModal(false);
    setOrdenTrabajoSeleccionada(null);
    setFormDataInspector({
      id_inspector: '',
      interno_vehiculo: ''
    });
    setFieldErrorsInspector({});
    setSearchInspectorTerm('');
  };

  // Manejar cierre del modal de asignar auditor
  const handleCerrarModalAuditor = () => {
    setShowDesignarAuditorModal(false);
    setOrdenTrabajoSeleccionada(null);
    setFormDataAuditor({
      id_auditor: '',
      interno_vehiculo: ''
    });
    setFieldErrorsAuditor({});
    setSearchAuditorTerm('');
  };

  return (
    <div className="w-full">
      <div className="px-3 sm:px-4 md:px-6 w-full">
        {/* Header de bienvenida */}
        <div 
          className="bg-[#007C8A] w-full px-3 sm:px-6 mb-4 sm:mb-6 rounded-lg mt-4 sm:mt-6 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4"
          style={{
            minHeight: '70px',
            paddingTop: '12px',
            paddingBottom: '12px'
          }}
        >
          <button
            type="button"
            onClick={() => navigate('/home')}
            className="rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              width: window.innerWidth < 640 ? '32px' : '40px',
              height: window.innerWidth < 640 ? '32px' : '40px'
            }}
          >
            <svg className={window.innerWidth < 640 ? "w-5 h-5" : "w-6 h-6"} text-white fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1" style={{ fontFamily: 'Lato, sans-serif', lineHeight: '1.2' }}>
              Gestión de OT
            </h1>
            <p className="text-white text-xs sm:text-sm font-normal" style={{ fontFamily: 'Lato, sans-serif', lineHeight: '1.2' }}>
              Aquí tienes una priorización de OTs junto a sus dato de costo y estado
            </p>
          </div>
        </div>

        {/* Tarjetas de métricas */}
        <div 
          className="flex flex-col lg:flex-row gap-4 mb-6" 
          style={{ 
            width: '100%'
          }}
        >
          {/* Tarjeta 1: Costo acumulado NO fijado */}
          <div 
            className="bg-white rounded-lg shadow-md"
            style={{
              flex: '1 1 0',
              minWidth: isMobile ? '100%' : '300px',
              maxWidth: isMobile ? '100%' : '400px',
              padding: isMobile ? '16px' : '24px',
              backgroundColor: '#FFFEF0'
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5" fill="none" stroke="#FFA500" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <h3 
                className="font-bold"
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  fontSize: '18px',
                  color: '#000000'
                }}
              >
                Costo acumulado
              </h3>
            </div>
            <p 
              className="text-sm mb-4"
              style={{ 
                fontFamily: 'Lato, sans-serif',
                color: '#666666'
              }}
            >
              Costo acumulado de insumos y tareas en OTs abiertas
            </p>
            <div className="mb-4">
              <span 
                className="text-sm"
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  color: '#666666'
                }}
              >
                Total:
              </span>
              <p 
                className="font-bold mt-1"
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  fontSize: '24px',
                  color: '#000000'
                }}
              >
                {isLoading ? '...' : formatCurrency(costoAcumuladoAbierto)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span 
                className="text-xs text-red-500"
                style={{ 
                  fontFamily: 'Lato, sans-serif'
                }}
              >
                Reducir para optimizar
              </span>
            </div>
          </div>

          {/* Tarjeta 2: Top 5 - Concentración de costos */}
          <div 
            className="bg-white rounded-lg shadow-md"
            style={{
              flex: '1 1 0',
              minWidth: isMobile ? '100%' : '300px',
              maxWidth: isMobile ? '100%' : '400px',
              padding: isMobile ? '16px' : '24px',
              backgroundColor: '#FFFEF0'
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5" fill="none" stroke="#FFA500" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <h3 
                className="font-bold"
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  fontSize: '18px',
                  color: '#000000'
                }}
              >
                Top 5 - Concentración de costos
              </h3>
            </div>
            <p 
              className="text-sm mb-4"
              style={{ 
                fontFamily: 'Lato, sans-serif',
                color: '#666666'
              }}
            >
              OTs con mayor costo acumulado pendiente
            </p>
            <div style={{ height: isMobile ? '200px' : '150px', width: '100%', minWidth: '250px', overflow: 'visible' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={top5Data} 
                  layout="vertical" 
                  margin={{ 
                    top: 5, 
                    right: isMobile ? 5 : 30, 
                    left: isMobile ? 5 : 20, 
                    bottom: 5 
                  }}
                >
                  <XAxis 
                    type="number" 
                    domain={[0, 'dataMax']}
                    tick={{ fontSize: isMobile ? 8 : 10 }}
                    tickFormatter={(value) => {
                      if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
                      return formatCurrency(value);
                    }}
                  />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={isMobile ? 30 : 60} 
                    tick={{ fontSize: isMobile ? 8 : 10 }} 
                    hide={isMobile}
                  />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {top5Data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tarjeta 3: Antigüedad de pendiente */}
          <div 
            className="bg-white rounded-lg shadow-md"
            style={{
              flex: '1 1 0',
              minWidth: isMobile ? '100%' : '300px',
              maxWidth: isMobile ? '100%' : '400px',
              padding: isMobile ? '16px' : '24px',
              backgroundColor: '#FFFEF0'
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5" fill="none" stroke="#FFA500" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <h3 
                className="font-bold"
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  fontSize: '18px',
                  color: '#000000'
                }}
              >
                Antiguedad de pendiente
              </h3>
            </div>
            <p 
              className="text-sm mb-4"
              style={{ 
                fontFamily: 'Lato, sans-serif',
                color: '#666666'
              }}
            >
              Distribuición por tiempo de apertura
            </p>
            <div style={{ height: isMobile ? '200px' : '150px', width: '100%', minWidth: '250px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={antiguedadData}
                    cx="50%"
                    cy="50%"
                    innerRadius={isMobile ? 30 : 40}
                    outerRadius={isMobile ? 50 : 60}
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                  >
                    {antiguedadData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {antiguedadData.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: item.color
                      }}
                    ></div>
                    <span 
                      className="text-xs"
                      style={{ 
                        fontFamily: 'Lato, sans-serif',
                        color: '#666666'
                      }}
                    >
                      {item.name}
                    </span>
                  </div>
                  <span 
                    className="text-xs font-semibold"
                    style={{ 
                      fontFamily: 'Lato, sans-serif',
                      color: '#000000'
                    }}
                  >
                    {formatCurrency(item.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sección de búsqueda */}
        {/* Tabla de órdenes de trabajo */}
        <div 
          className="bg-white rounded-lg shadow-md"
          style={{
            border: '1px solid #B3E5FC',
            padding: isMobile ? '12px' : '24px',
            overflow: 'visible'
          }}
        >
          {/* Título, subtítulo y buscador */}
          <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
            <div className="flex-1">
              <h2 
                className="text-lg sm:text-xl font-bold mb-1 sm:mb-2"
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  color: '#000000'
                }}
              >
                Tabla de ordenes de trabajo
              </h2>
              <p 
                className="text-xs sm:text-sm"
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  color: '#666666'
                }}
              >
                Detalle de ordenes de trabajo presentadas
              </p>
            </div>
            <div className="flex-shrink-0 w-full sm:w-auto sm:max-w-lg">
            <label 
              htmlFor="search"
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
                  id="search"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Ingrese su búsqueda"
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
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </div>
          </div>
          </div>

          {/* Tabla */}
          <div 
            className="w-full" 
            style={{ 
              overflowX: 'auto',
              overflow: 'visible'
            }}
          >
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-gray-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                  Cargando datos...
                </div>
              </div>
            ) : (
              <table className="w-full" style={{ fontFamily: 'Lato, sans-serif', tableLayout: 'auto', minWidth: '800px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap" style={{ fontSize: '12px', color: '#374151' }}>N OT</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap" style={{ fontSize: '12px', color: '#374151' }}>Matrícula</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap" style={{ fontSize: '12px', color: '#374151' }}>Empresa</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap" style={{ fontSize: '12px', color: '#374151' }}>F. Ingreso</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap" style={{ fontSize: '12px', color: '#374151' }}>F. Egreso</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap" style={{ fontSize: '12px', color: '#374151' }}>Odómetro</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap" style={{ fontSize: '12px', color: '#374151' }}>Horómetro</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap" style={{ fontSize: '12px', color: '#374151' }}>Tipo</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap" style={{ fontSize: '12px', color: '#374151' }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {currentData.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="py-8 text-center text-gray-500">
                        No hay datos disponibles
                      </td>
                    </tr>
                  ) : (
                    currentData.map((item, index) => {
                      const estadoStyle = getEstadoBadgeStyle(item.tipoMantenimiento);
                      return (
                        <tr 
                          key={item.id}
                          style={{ 
                            borderBottom: '1px solid #E5E7EB',
                            backgroundColor: index % 2 === 0 ? '#FFFFFF' : '#F9FAFB'
                          }}
                        >
                          <td className="py-2 sm:py-3 px-2 sm:px-4" style={{ fontSize: '12px', color: '#374151' }}>
                            {item.nOt}
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4" style={{ fontSize: '12px', color: '#374151' }}>
                            {item.matricula}
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4" style={{ fontSize: '12px', color: '#374151' }}>
                            {item.empresa}
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4" style={{ fontSize: '12px', color: '#374151' }}>
                            {formatDate(item.fechaIngreso)}
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4" style={{ fontSize: '12px', color: '#374151' }}>
                            {formatDate(item.fechaEgreso)}
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4" style={{ fontSize: '12px', color: '#374151' }}>
                            {item.odometro ? `${formatNumber(item.odometro)} km` : 'N/A'}
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4" style={{ fontSize: '12px', color: '#374151' }}>
                            {item.horometro ? `${formatNumber(item.horometro)} hs` : 'N/A'}
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4">
                            {item.estado && item.estado !== 'N/A' ? (
                              <span
                                className="whitespace-nowrap"
                                style={{
                                  backgroundColor: estadoStyle.bg,
                                  color: estadoStyle.text,
                                  border: `1px solid ${estadoStyle.border}`,
                                  borderRadius: '4px',
                                  padding: '4px 8px',
                                  fontSize: '11px',
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
                          <td className="py-2 sm:py-3 px-2 sm:px-4" style={{ position: 'relative' }}>
                            <div className="relative" ref={openMenuId === item.id ? menuRef : null}>
                              <button
                                ref={(el) => {
                                  if (el) menuButtonRefs.current[item.id] = el;
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const buttonRect = e.currentTarget.getBoundingClientRect();
                                  setMenuPosition({
                                    top: buttonRect.bottom + 4,
                                    right: window.innerWidth - buttonRect.right
                                  });
                                  setOpenMenuId(openMenuId === item.id ? null : item.id);
                                }}
                                className="p-1 hover:bg-gray-100 rounded transition-colors"
                                style={{ color: '#6B7280' }}
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                </svg>
                              </button>
                              {openMenuId === item.id && (
                                <div 
                                  data-menu-dropdown
                                  className="fixed bg-white rounded-lg shadow-lg border border-gray-200"
                                  style={{ 
                                    minWidth: '180px',
                                    width: '180px',
                                    zIndex: 99999,
                                    top: `${menuPosition.top}px`,
                                    right: `${menuPosition.right}px`
                                  }}
                                >
                                  <button
                                    onClick={() => handleActionClick(item.id, 'agregar')}
                                    className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors"
                                    style={{ 
                                      fontFamily: 'Lato, sans-serif',
                                      fontSize: '14px',
                                      color: '#374151'
                                    }}
                                  >
                                    Asignar Auditor
                                  </button>
                                  <button
                                    onClick={() => handleActionClick(item.id, 'designar')}
                                    className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors border-t border-gray-200"
                                    style={{ 
                                      fontFamily: 'Lato, sans-serif',
                                      fontSize: '14px',
                                      color: '#374151'
                                    }}
                                  >
                                    Asignar Inspector
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Paginación */}
          {!isLoading && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-200">
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
                  className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007C8A] bg-white"
                  style={{ 
                    fontFamily: 'Lato, sans-serif',
                    fontSize: '14px'
                  }}
                >
                  <option value={7}>07</option>
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
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed bg-white"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed bg-white"
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

      {/* Modal de Asignar Inspector */}
      {showDesignarInspectorModal && ordenTrabajoSeleccionada && (() => {
        const vehiculoOrden = vehiculos.find(v => v.id_vehiculo === ordenTrabajoSeleccionada.id_vehiculo);
        const empresaOrden = vehiculoOrden ? empresas.find(e => e.id_empresa === vehiculoOrden.id_empresa) : null;
        const nroOT = ordenTrabajoSeleccionada.nro_orden_trabajo || '';
        const nombreEmpresa = empresaOrden?.nombre_empresa || '';
        
        return (
          <div 
            className="fixed inset-0 flex items-center justify-center z-50"
            style={{ backgroundColor: 'rgba(0, 124, 138, 0.5)' }}
            onClick={() => {
              setShowDesignarInspectorModal(false);
              setOrdenTrabajoSeleccionada(null);
              setFormDataInspector({ id_inspector: '', interno_vehiculo: '' });
              setFieldErrorsInspector({});
              setSearchInspectorTerm('');
              setInspectorAsignado(null);
            }}
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
              {/* Header del modal */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  {/* Icono de check verde */}
                  <div 
                    className="rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      backgroundColor: '#10B981',
                      width: '32px',
                      height: '32px'
                    }}
                  >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 
                      className="text-xl font-bold"
                      style={{ 
                        color: '#1F2937'
                      }}
                    >
                      Asignar inspector
                    </h3>
                    <p 
                      className="text-sm mt-1"
                      style={{ 
                        color: '#6B7280'
                      }}
                    >
                      {nroOT} {nombreEmpresa}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contenido del modal */}
              <div className="px-6 py-6">
                {inspectorAsignado ? (
                  // Mostrar información del inspector ya asignado
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm font-medium mb-3" style={{ color: '#1F2937', fontFamily: 'Lato, sans-serif' }}>
                        Esta DDJJ ya tiene un inspector asignado:
                      </p>
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm font-semibold" style={{ color: '#374151', fontFamily: 'Lato, sans-serif' }}>
                            Nombre completo:
                          </span>
                          <span className="ml-2 text-sm" style={{ color: '#6B7280', fontFamily: 'Lato, sans-serif' }}>
                            {inspectorAsignado.nombre_completo}
                          </span>
                        </div>
                        {inspectorAsignado.email && (
                          <div>
                            <span className="text-sm font-semibold" style={{ color: '#374151', fontFamily: 'Lato, sans-serif' }}>
                              Email:
                            </span>
                            <span className="ml-2 text-sm" style={{ color: '#6B7280', fontFamily: 'Lato, sans-serif' }}>
                              {inspectorAsignado.email}
                            </span>
                          </div>
                        )}
                        {inspectorAsignado.dni && (
                          <div>
                            <span className="text-sm font-semibold" style={{ color: '#374151', fontFamily: 'Lato, sans-serif' }}>
                              DNI:
                            </span>
                            <span className="ml-2 text-sm" style={{ color: '#6B7280', fontFamily: 'Lato, sans-serif' }}>
                              {inspectorAsignado.dni}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  // Mostrar formulario para asignar inspector
                  <div className="grid grid-cols-2 gap-4">
                    {/* Select de Inspector con buscador */}
                    <div className="relative">
                      <label 
                        htmlFor="id_inspector"
                        className="block text-sm font-medium mb-2"
                        style={{ 
                          fontFamily: 'Lato, sans-serif',
                          color: '#374151'
                        }}
                      >
                        Nombre completo *
                      </label>
                      <div className="relative" ref={inspectorDropdownRef}>
                        <input
                          type="text"
                          name="id_inspector"
                          placeholder="Seleccionar nombre completo"
                          value={searchInspectorTerm}
                          onChange={(e) => {
                            setSearchInspectorTerm(e.target.value);
                            setShowInspectorDropdown(true);
                            if (!e.target.value) {
                              setFormDataInspector({ ...formDataInspector, id_inspector: '' });
                            }
                          }}
                          onFocus={() => setShowInspectorDropdown(true)}
                          className={`w-full px-4 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                            fieldErrorsInspector.id_inspector 
                              ? 'border-red-500 focus:ring-red-500' 
                              : 'border-gray-300 focus:ring-[#007C8A]'
                          }`}
                          style={{ 
                            fontFamily: 'Lato, sans-serif',
                            fontSize: '14px'
                          }}
                        />
                        {/* Icono de flecha hacia abajo */}
                        <svg 
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                        {showInspectorDropdown && (
                          <div 
                            className="fixed z-[9999] bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                            style={{ 
                              fontFamily: 'Lato, sans-serif',
                              width: inspectorDropdownRef.current ? `${inspectorDropdownRef.current.offsetWidth}px` : 'auto',
                              top: inspectorDropdownRef.current ? `${inspectorDropdownRef.current.getBoundingClientRect().bottom + 4}px` : 'auto',
                              left: inspectorDropdownRef.current ? `${inspectorDropdownRef.current.getBoundingClientRect().left}px` : 'auto'
                            }}
                          >
                            {inspectoresFiltrados.length > 0 ? (
                              inspectoresFiltrados.map((inspector) => (
                                <button
                                  key={inspector.id_usuario}
                                  type="button"
                                  onClick={() => {
                                    setFormDataInspector({ ...formDataInspector, id_inspector: inspector.id_usuario });
                                    setSearchInspectorTerm(inspector.nombre_completo || '');
                                    setShowInspectorDropdown(false);
                                    if (fieldErrorsInspector.id_inspector) {
                                      setFieldErrorsInspector({ ...fieldErrorsInspector, id_inspector: '' });
                                    }
                                  }}
                                  className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors"
                                  style={{ 
                                    fontSize: '14px',
                                    color: '#374151'
                                  }}
                                >
                                  {inspector.nombre_completo || 'Sin nombre'}
                                </button>
                              ))
                            ) : (
                              <div className="px-4 py-2 text-sm text-gray-500">
                                No se encontraron inspectores
                              </div>
                            )}
                          </div>
                        )}
                        {fieldErrorsInspector.id_inspector && (
                          <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                            {fieldErrorsInspector.id_inspector}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Input de Interno del vehículo */}
                    <div>
                      <label 
                        htmlFor="interno_vehiculo"
                        className="block text-sm font-medium mb-2"
                        style={{ 
                          fontFamily: 'Lato, sans-serif',
                          color: '#374151'
                        }}
                      >
                        Interno *
                      </label>
                      <input
                        type="text"
                        name="interno_vehiculo"
                        value={formDataInspector.interno_vehiculo}
                        onChange={(e) => {
                          setFormDataInspector({ ...formDataInspector, interno_vehiculo: e.target.value });
                          if (fieldErrorsInspector.interno_vehiculo) {
                            setFieldErrorsInspector({ ...fieldErrorsInspector, interno_vehiculo: '' });
                          }
                        }}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                          fieldErrorsInspector.interno_vehiculo 
                            ? 'border-red-500 focus:ring-red-500' 
                            : 'border-gray-300 focus:ring-[#007C8A]'
                        }`}
                        style={{ 
                          fontFamily: 'Lato, sans-serif',
                          fontSize: '14px'
                        }}
                        placeholder="Ingrese interno"
                      />
                      {fieldErrorsInspector.interno_vehiculo && (
                        <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                          {fieldErrorsInspector.interno_vehiculo}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer del modal */}
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowDesignarInspectorModal(false);
                    setOrdenTrabajoSeleccionada(null);
                    setFormDataInspector({ id_inspector: '', interno_vehiculo: '' });
                    setFieldErrorsInspector({});
                    setSearchInspectorTerm('');
                    setInspectorAsignado(null);
                  }}
                  className="px-6 py-2 rounded-lg border border-[#007C8A] bg-white text-[#007C8A] hover:bg-gray-50 transition-colors"
                  style={{ 
                    fontFamily: 'Lato, sans-serif',
                    fontWeight: 'bold',
                    fontSize: '14px'
                  }}
                >
                  Cancelar
                </button>
                {!inspectorAsignado && (() => {
                  const hasInspector = formDataInspector.id_inspector && (formDataInspector.id_inspector !== '' && formDataInspector.id_inspector !== null && formDataInspector.id_inspector !== undefined);
                  const hasInterno = formDataInspector.interno_vehiculo && String(formDataInspector.interno_vehiculo).trim() !== '';
                  const isEnabled = hasInspector && hasInterno && !isSubmittingInspector;
                  
                  return (
                    <button
                      onClick={handleAsignarInspector}
                      disabled={!isEnabled || isSubmittingInspector}
                      className="px-6 py-2 rounded-lg border border-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        fontFamily: 'Lato, sans-serif',
                        fontWeight: 'bold',
                        fontSize: '14px',
                        backgroundColor: isEnabled ? '#10B981' : '#E5E7EB',
                        color: isEnabled ? '#FFFFFF' : '#9CA3AF'
                      }}
                    >
                      {isSubmittingInspector ? 'Asignando...' : 'Asignar'}
                    </button>
                  );
                })()}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal de Asignar Auditor */}
      {showDesignarAuditorModal && ordenTrabajoSeleccionada && (() => {
        const vehiculoOrden = vehiculos.find(v => v.id_vehiculo === ordenTrabajoSeleccionada.id_vehiculo);
        const empresaOrden = vehiculoOrden ? empresas.find(e => e.id_empresa === vehiculoOrden.id_empresa) : null;
        const nroOT = ordenTrabajoSeleccionada.nro_orden_trabajo || '';
        const nombreEmpresa = empresaOrden?.nombre_empresa || '';
        
        return (
          <div 
            className="fixed inset-0 flex items-center justify-center z-50"
            style={{ backgroundColor: 'rgba(0, 124, 138, 0.5)' }}
            onClick={() => {
              setShowDesignarAuditorModal(false);
              setOrdenTrabajoSeleccionada(null);
              setFormDataAuditor({ id_auditor: '', interno_vehiculo: '' });
              setFieldErrorsAuditor({});
              setSearchAuditorTerm('');
              setAuditorAsignado(null);
            }}
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
              {/* Header del modal */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  {/* Icono de check verde */}
                  <div 
                    className="rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      backgroundColor: '#10B981',
                      width: '32px',
                      height: '32px'
                    }}
                  >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 
                      className="text-xl font-bold"
                      style={{ 
                        color: '#1F2937'
                      }}
                    >
                      Asignar auditor
                    </h3>
                    <p 
                      className="text-sm mt-1"
                      style={{ 
                        color: '#6B7280'
                      }}
                    >
                      {nroOT} {nombreEmpresa}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contenido del modal */}
              <div className="px-6 py-6">
                {auditorAsignado ? (
                  // Mostrar información del auditor ya asignado
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm font-medium mb-3" style={{ color: '#1F2937', fontFamily: 'Lato, sans-serif' }}>
                        Esta DDJJ ya tiene un auditor asignado:
                      </p>
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm font-semibold" style={{ color: '#374151', fontFamily: 'Lato, sans-serif' }}>
                            Nombre completo:
                          </span>
                          <span className="ml-2 text-sm" style={{ color: '#6B7280', fontFamily: 'Lato, sans-serif' }}>
                            {auditorAsignado.nombre_completo}
                          </span>
                        </div>
                        {auditorAsignado.email && (
                          <div>
                            <span className="text-sm font-semibold" style={{ color: '#374151', fontFamily: 'Lato, sans-serif' }}>
                              Email:
                            </span>
                            <span className="ml-2 text-sm" style={{ color: '#6B7280', fontFamily: 'Lato, sans-serif' }}>
                              {auditorAsignado.email}
                            </span>
                          </div>
                        )}
                        {auditorAsignado.dni && (
                          <div>
                            <span className="text-sm font-semibold" style={{ color: '#374151', fontFamily: 'Lato, sans-serif' }}>
                              DNI:
                            </span>
                            <span className="ml-2 text-sm" style={{ color: '#6B7280', fontFamily: 'Lato, sans-serif' }}>
                              {auditorAsignado.dni}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  // Mostrar formulario para asignar auditor
                  <div className="grid grid-cols-2 gap-4">
                    {/* Select de Auditor con buscador */}
                    <div className="relative">
                      <label 
                        htmlFor="id_auditor"
                        className="block text-sm font-medium mb-2"
                        style={{ 
                          fontFamily: 'Lato, sans-serif',
                          color: '#374151'
                        }}
                      >
                        Nombre completo *
                      </label>
                      <div className="relative" ref={auditorDropdownRef}>
                        <input
                          type="text"
                          name="id_auditor"
                          placeholder="Seleccionar nombre completo"
                          value={searchAuditorTerm}
                          onChange={(e) => {
                            setSearchAuditorTerm(e.target.value);
                            setShowAuditorDropdown(true);
                            if (!e.target.value) {
                              setFormDataAuditor({ ...formDataAuditor, id_auditor: '' });
                            }
                          }}
                          onFocus={() => setShowAuditorDropdown(true)}
                          className={`w-full px-4 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                            fieldErrorsAuditor.id_auditor 
                              ? 'border-red-500 focus:ring-red-500' 
                              : 'border-gray-300 focus:ring-[#007C8A]'
                          }`}
                          style={{ 
                            fontFamily: 'Lato, sans-serif',
                            fontSize: '14px'
                          }}
                        />
                        {/* Icono de flecha hacia abajo */}
                        <svg 
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                        {showAuditorDropdown && (
                          <div 
                            className="fixed z-[9999] bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                            style={{ 
                              fontFamily: 'Lato, sans-serif',
                              width: auditorDropdownRef.current ? `${auditorDropdownRef.current.offsetWidth}px` : 'auto',
                              top: auditorDropdownRef.current ? `${auditorDropdownRef.current.getBoundingClientRect().bottom + 4}px` : 'auto',
                              left: auditorDropdownRef.current ? `${auditorDropdownRef.current.getBoundingClientRect().left}px` : 'auto'
                            }}
                          >
                            {auditoresFiltrados.length > 0 ? (
                              auditoresFiltrados.map((auditor) => (
                                <button
                                  key={auditor.id_usuario}
                                  type="button"
                                  onClick={() => {
                                    setFormDataAuditor({ ...formDataAuditor, id_auditor: auditor.id_usuario });
                                    setSearchAuditorTerm(auditor.nombre_completo || '');
                                    setShowAuditorDropdown(false);
                                    if (fieldErrorsAuditor.id_auditor) {
                                      setFieldErrorsAuditor({ ...fieldErrorsAuditor, id_auditor: '' });
                                    }
                                  }}
                                  className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors"
                                  style={{ 
                                    fontSize: '14px',
                                    color: '#374151'
                                  }}
                                >
                                  {auditor.nombre_completo || 'Sin nombre'}
                                </button>
                              ))
                            ) : (
                              <div className="px-4 py-2 text-sm text-gray-500">
                                No se encontraron auditores
                              </div>
                            )}
                          </div>
                        )}
                        {fieldErrorsAuditor.id_auditor && (
                          <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                            {fieldErrorsAuditor.id_auditor}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Input de Interno del vehículo */}
                    <div>
                      <label 
                        htmlFor="interno_vehiculo_auditor"
                        className="block text-sm font-medium mb-2"
                        style={{ 
                          fontFamily: 'Lato, sans-serif',
                          color: '#374151'
                        }}
                      >
                        Interno *
                      </label>
                      <input
                        type="text"
                        name="interno_vehiculo_auditor"
                        value={formDataAuditor.interno_vehiculo}
                        onChange={(e) => {
                          setFormDataAuditor({ ...formDataAuditor, interno_vehiculo: e.target.value });
                          if (fieldErrorsAuditor.interno_vehiculo) {
                            setFieldErrorsAuditor({ ...fieldErrorsAuditor, interno_vehiculo: '' });
                          }
                        }}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                          fieldErrorsAuditor.interno_vehiculo 
                            ? 'border-red-500 focus:ring-red-500' 
                            : 'border-gray-300 focus:ring-[#007C8A]'
                        }`}
                        style={{ 
                          fontFamily: 'Lato, sans-serif',
                          fontSize: '14px'
                        }}
                        placeholder="Ingrese interno"
                      />
                      {fieldErrorsAuditor.interno_vehiculo && (
                        <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                          {fieldErrorsAuditor.interno_vehiculo}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer del modal */}
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowDesignarAuditorModal(false);
                    setOrdenTrabajoSeleccionada(null);
                    setFormDataAuditor({ id_auditor: '', interno_vehiculo: '' });
                    setFieldErrorsAuditor({});
                    setSearchAuditorTerm('');
                    setAuditorAsignado(null);
                  }}
                  className="px-6 py-2 rounded-lg border border-[#007C8A] bg-white text-[#007C8A] hover:bg-gray-50 transition-colors"
                  style={{ 
                    fontFamily: 'Lato, sans-serif',
                    fontWeight: 'bold',
                    fontSize: '14px'
                  }}
                >
                  Cancelar
                </button>
                {!auditorAsignado && (() => {
                  const hasAuditor = formDataAuditor.id_auditor && (formDataAuditor.id_auditor !== '' && formDataAuditor.id_auditor !== null && formDataAuditor.id_auditor !== undefined);
                  const hasInterno = formDataAuditor.interno_vehiculo && String(formDataAuditor.interno_vehiculo).trim() !== '';
                  const isEnabled = hasAuditor && hasInterno && !isSubmittingAuditor;
                  
                  return (
                    <button
                      onClick={handleAsignarAuditor}
                      disabled={!isEnabled || isSubmittingAuditor}
                      className="px-6 py-2 rounded-lg border border-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        fontFamily: 'Lato, sans-serif',
                        fontWeight: 'bold',
                        fontSize: '14px',
                        backgroundColor: isEnabled ? '#10B981' : '#E5E7EB',
                        color: isEnabled ? '#FFFFFF' : '#9CA3AF'
                      }}
                    >
                      {isSubmittingAuditor ? 'Asignando...' : 'Asignar'}
                    </button>
                  );
                })()}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default GestionOT;
