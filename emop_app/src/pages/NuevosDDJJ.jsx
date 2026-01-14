import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAllFromTable, insertIntoTable, registrarAuditoria } from '../config/supabase';
import * as XLSX from 'xlsx';

const NuevosDDJJ = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const idEmpresaUsuario = user?.id_empresa;
  const [isMobile, setIsMobile] = useState(false);
  const [vehiculoSearchTerm, setVehiculoSearchTerm] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  // Estados para datos
  const [empresa, setEmpresa] = useState(null);
  const [empresas, setEmpresas] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [conductores, setConductores] = useState([]);
  const [mecanicos, setMecanicos] = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [ordenesTrabajo, setOrdenesTrabajo] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [tiposMantenimiento, setTiposMantenimiento] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados del formulario
  const [formData, setFormData] = useState({
    // Sección 1: Identificación del vehículo y servicio
    empresa: '',
    id_vehiculo: '',
    matricula: '',
    tipo_servicio: '',
    odometro: '',
    grupo: '',
    vehiculo: '',
    licencia: '',
    horometro: '',
    // Sección 2: Estado y movimientos de unidad
    fecha_rto: '',
    fecha_vencimiento_seguro: '',
    tipo_seguro: 'Todo riesgo',
    posee_camaras: false,
    aire_acondicionado: false,
    posee_calefaccion: false,
    posee_seguro: false,
    descripcion_siniestros: '',
    // Sección 3: Información de trabajo
    numero_orden_trabajo: '',
    fecha_orden_trabajo: '',
    fecha_egreso: '',
    // Subsección: Ejecución y tareas
    taller_autorizado: '',
    definicion_trabajo: '',
    mecanico_autorizado: '',
    tipo_mantenimiento: '',
    tarea_descripcion: '',
    // Subsección: Detalle de insumos/artículos (ahora es un array)
  });

  // Estado para manejar múltiples insumos del formulario
  const [insumosForm, setInsumosForm] = useState([
    {
      id: 1,
      codigo_articulo: '',
      cantidad: '1',
      costo_unitario: '',
      costo_total: '',
      descripcion_insumo: ''
    }
  ]);

  // Estado para manejar múltiples órdenes de trabajo
  const [ordenesTrabajoForm, setOrdenesTrabajoForm] = useState([
    {
      id: 1,
      numero_orden_trabajo: '',
      fecha_orden_trabajo: '',
      fecha_egreso: '',
      taller_autorizado: '',
      definicion_trabajo: '',
      mecanico_autorizado: '',
      tipo_mantenimiento: '',
      tarea_descripcion: ''
    }
  ]);
  const [nextOrdenId, setNextOrdenId] = useState(2);

  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [showCargaMasivaModal, setShowCargaMasivaModal] = useState(false);
  const [cargaMasivaErrors, setCargaMasivaErrors] = useState([]);
  const [cargaMasivaSuccess, setCargaMasivaSuccess] = useState(0);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const fileInputRef = useRef(null);
  const vehiculoDropdownRef = useRef(null);
  const subtotalRef = useRef(null);
  const totalRef = useRef(null);
  const codigoArtRef = useRef(null);
  const costoUnitarioRef = useRef(null);
  const cantidadRef = useRef(null);
  const [costoUnitarioFocused, setCostoUnitarioFocused] = useState({});
  const [nextInsumoId, setNextInsumoId] = useState(2);

  // Detectar tamaño de pantalla
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Sincronizar los anchos de los campos para alinear TOTAL debajo de SUBTOTAL
  useEffect(() => {
    const syncWidths = () => {
      // Sincronizar TOTAL con SUBTOTAL
      if (subtotalRef.current && totalRef.current) {
        totalRef.current.style.width = `${subtotalRef.current.offsetWidth}px`;
      }
      
      // Sincronizar espaciadores con los campos correspondientes
      const espaciadores = document.querySelectorAll('[data-espaciador]');
      if (codigoArtRef.current && espaciadores[0]) {
        espaciadores[0].style.width = `${codigoArtRef.current.offsetWidth}px`;
      }
      if (costoUnitarioRef.current && espaciadores[1]) {
        espaciadores[1].style.width = `${costoUnitarioRef.current.offsetWidth}px`;
      }
      if (cantidadRef.current && espaciadores[2]) {
        espaciadores[2].style.width = `${cantidadRef.current.offsetWidth}px`;
      }
    };
    
    // Usar setTimeout para asegurar que los elementos estén renderizados
    setTimeout(syncWidths, 0);
    window.addEventListener('resize', syncWidths);
    return () => window.removeEventListener('resize', syncWidths);
  }, [insumosForm]);

  // Función para generar el siguiente número de orden de trabajo
  const generarSiguienteNumeroOrden = (ordenesExistentes) => {
    const numeroBase = 602569;
    const siguienteInicial = 602570;

    if (!Array.isArray(ordenesExistentes) || ordenesExistentes.length === 0) {
      return String(siguienteInicial);
    }

    // Extraer todos los números de orden que sean >= 602569
    const numerosOrden = ordenesExistentes
      .map(ot => {
        const nro = ot.nro_orden_trabajo || ot.numero_orden_trabajo;
        if (!nro) return null;
        // Intentar convertir a número
        const num = parseInt(String(nro).replace(/\D/g, ''), 10);
        return isNaN(num) ? null : num;
      })
      .filter(n => n !== null && n >= numeroBase);

    if (numerosOrden.length === 0) {
      return String(siguienteInicial);
    }

    // Encontrar el número más alto y sumarle 1
    const numeroMaximo = Math.max(...numerosOrden);
    return String(numeroMaximo + 1);
  };

  // Función para generar el número de DDJJ
  const generarNumeroDDJJ = (ddjjExistentes, fechaCreacion) => {
    const fecha = fechaCreacion ? new Date(fechaCreacion) : new Date();
    const fechaStr = fecha.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD
    
    // Buscar el último número de DDJJ del mismo día
    const ddjjDelDia = ddjjExistentes
      .filter(ddjj => {
        if (!ddjj.numero_ddjj) return false;
        // Formato: DDJJ-YYYYMMDD-XXXXXX
        const match = ddjj.numero_ddjj.match(/^DDJJ-(\d{8})-/);
        return match && match[1] === fechaStr;
      })
      .map(ddjj => {
        const match = ddjj.numero_ddjj.match(/^DDJJ-\d{8}-(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(n => !isNaN(n) && n > 0);

    // Obtener el siguiente número secuencial
    const siguienteNumero = ddjjDelDia.length > 0 
      ? Math.max(...ddjjDelDia) + 1 
      : 1;
    
    // Formato: DDJJ-YYYYMMDD-XXXXXX (6 dígitos)
    return `DDJJ-${fechaStr}-${String(siguienteNumero).padStart(6, '0')}`;
  };

  // Cargar datos
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        const [vehiculosData, ordenesData, empresasData, usuariosData, rolesData, tiposData, conductoresData, mecanicosData, insumosData, ddjjData] = await Promise.all([
          getAllFromTable('vehiculo'),
          getAllFromTable('orden_trabajo'),
          getAllFromTable('empresa'),
          getAllFromTable('usuario'),
          getAllFromTable('rol'),
          getAllFromTable('tipo_mantenimiento'),
          getAllFromTable('conductor'),
          getAllFromTable('mecanico'),
          getAllFromTable('insumo_catalogo'),
          getAllFromTable('declaracion_jurada').catch(() => []) // Manejar error si la tabla no existe aún
        ]);

        const validVehiculos = Array.isArray(vehiculosData) ? vehiculosData : [];
        const validOrdenes = Array.isArray(ordenesData) ? ordenesData : [];
        const validEmpresas = Array.isArray(empresasData) ? empresasData : [];
        const validUsuarios = Array.isArray(usuariosData) ? usuariosData : [];
        const validRoles = Array.isArray(rolesData) ? rolesData : [];
        const validTipos = Array.isArray(tiposData) ? tiposData : [];
        console.log('Tipos de mantenimiento cargados:', validTipos); // Debug: ver qué datos se están cargando
        const validConductores = Array.isArray(conductoresData) ? conductoresData : [];
        const validMecanicos = Array.isArray(mecanicosData) ? mecanicosData : [];
        const validInsumos = Array.isArray(insumosData) ? insumosData : [];
        const validDDJJ = Array.isArray(ddjjData) ? ddjjData : [];

        // Filtrar por empresa del usuario
        let vehiculosFiltrados = validVehiculos;
        let ordenesFiltradas = validOrdenes;
        if (idEmpresaUsuario) {
          vehiculosFiltrados = validVehiculos.filter(v => v.id_empresa === idEmpresaUsuario);
          const idsVehiculosEmpresa = vehiculosFiltrados.map(v => v.id_vehiculo);
          ordenesFiltradas = validOrdenes.filter(ot => idsVehiculosEmpresa.includes(ot.id_vehiculo));
          const empresaUsuario = validEmpresas.find(e => e.id_empresa === idEmpresaUsuario);
          setEmpresa(empresaUsuario);
          if (empresaUsuario) {
            setFormData(prev => ({
              ...prev,
              empresa: empresaUsuario.nombre_empresa || ''
            }));
          }
        }

        // Filtrar mecánicos por empresa
        let mecanicosFiltrados = validMecanicos;
        if (idEmpresaUsuario) {
          mecanicosFiltrados = validMecanicos.filter(m => m.id_empresa === idEmpresaUsuario);
        }

        setVehiculos(vehiculosFiltrados);
        setEmpresas(validEmpresas); // Guardar todas las empresas para poder buscar por id_empresa
        setConductores(validConductores);
        setMecanicos(mecanicosFiltrados);
        setInsumos(validInsumos);
        setOrdenesTrabajo(ordenesFiltradas);
        setUsuarios(validUsuarios);
        setRoles(validRoles);
        setTiposMantenimiento(validTipos);

        // Generar número de orden de trabajo automático para la primera orden
        const siguienteNumero = generarSiguienteNumeroOrden(validOrdenes);
        setOrdenesTrabajoForm(prev => {
          if (prev.length > 0 && !prev[0].numero_orden_trabajo) {
            return prev.map((orden, index) => 
              index === 0 ? { ...orden, numero_orden_trabajo: siguienteNumero } : orden
            );
          }
          return prev;
        });

        // Log para debugging
        console.log('Vehículos cargados:', vehiculosFiltrados.length);
        console.log('Vehículos de la empresa:', vehiculosFiltrados);
        if (vehiculosFiltrados.length === 0) {
          console.warn('⚠️ No se encontraron vehículos para la empresa:', idEmpresaUsuario);
        }
      } catch (error) {
        console.error('Error al cargar datos:', error);
        setToast({
          type: 'error',
          title: 'Error al cargar datos',
          message: 'No se pudieron cargar los vehículos. Por favor, verifique la conexión con el backend.'
        });
        setTimeout(() => setToast(null), 5000);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [idEmpresaUsuario]);

  // Obtener inspectores y auditores
  const inspectores = usuarios.filter(u => {
    const rol = roles.find(r => r.id_rol === u.id_rol);
    return rol?.nombre === 'Inspector' || u.id_rol === 3;
  });

  const auditores = usuarios.filter(u => {
    const rol = roles.find(r => r.id_rol === u.id_rol);
    return rol?.nombre === 'Auditor' || u.id_rol === 4;
  });

  // Obtener tipos de servicio únicos de los vehículos
  const tiposServicio = [...new Set(vehiculos.map(v => v.tipo_servicio).filter(Boolean))];

  // Función para formatear fecha (DD/MM/YYYY)
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Función para formatear fecha para mostrar (DD/MM/YYYY)
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Función para formatear números con separadores de miles
  const formatNumber = (value) => {
    if (!value && value !== 0) return '';
    const num = parseFloat(value);
    if (isNaN(num)) return '';
    return new Intl.NumberFormat('es-AR').format(num);
  };

  // Función para formatear moneda (formato argentino: $ X.XXX,XX)
  const formatCurrency = (value) => {
    if (!value && value !== 0) return '';
    const num = parseFloat(value);
    if (isNaN(num)) return '';
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  // Función para parsear valor monetario (remover símbolos y convertir a número)
  const parseCurrency = (value) => {
    if (!value) return '';
    // Remover símbolos de moneda, puntos y comas, luego convertir
    const cleaned = String(value).replace(/[$\s.]/g, '').replace(',', '.');
    return cleaned;
  };

  // Manejar cambios en el formulario
  const handleChange = (field, value) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };

      // Calcular costo total automáticamente cuando cambia cantidad o costo unitario
      if (field === 'cantidad' || field === 'costo_unitario') {
        const cantidad = parseFloat(newData.cantidad) || 0;
        // Si el campo es costo_unitario, el value ya viene parseado (sin formato)
        // Si es cantidad, necesitamos parsear el costo_unitario que ya está guardado
        const costoUnitario = field === 'costo_unitario' 
          ? parseFloat(value) || 0 
          : parseFloat(newData.costo_unitario) || 0;
        
        // Calcular automáticamente el costo total
        if (cantidad > 0 && costoUnitario > 0) {
          const costoTotal = cantidad * costoUnitario;
          newData.costo_total = String(costoTotal);
        } else {
          newData.costo_total = '';
        }
      }

      return newData;
    });
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Funciones para manejar insumos del formulario
  const agregarInsumo = () => {
    setInsumosForm(prev => [
      ...prev,
      {
        id: nextInsumoId,
        codigo_articulo: '',
        cantidad: '1',
        costo_unitario: '',
        costo_total: '',
        descripcion_insumo: ''
      }
    ]);
    setNextInsumoId(prev => prev + 1);
  };

  const eliminarInsumo = (id) => {
    if (insumosForm.length > 1) {
      setInsumosForm(prev => prev.filter(insumo => insumo.id !== id));
    }
  };

  // Función helper para limpiar y parsear valores numéricos
  const cleanAndParseNumber = (value) => {
    if (!value && value !== 0) return 0;
    // Convertir a string y limpiar
    const str = String(value);
    // Remover espacios, símbolos de moneda, puntos (separadores de miles) y mantener solo números, comas y puntos decimales
    const cleaned = str
      .replace(/[$\s]/g, '') // Remover $ y espacios
      .replace(/\./g, '') // Remover puntos (separadores de miles)
      .replace(',', '.'); // Reemplazar coma por punto para parseFloat
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  const actualizarInsumo = (id, field, value) => {
    setInsumosForm(prev => prev.map(insumo => {
      if (insumo.id === id) {
        const updated = { ...insumo, [field]: value };
        
        // Calcular costo total automáticamente
        if (field === 'cantidad' || field === 'costo_unitario') {
          const cantidad = parseFloat(updated.cantidad) || 0;
          // Limpiar y parsear el costo unitario correctamente
          const costoUnit = field === 'costo_unitario' 
            ? cleanAndParseNumber(value)
            : cleanAndParseNumber(updated.costo_unitario);
          
          if (cantidad > 0 && costoUnit > 0) {
            updated.costo_total = String(cantidad * costoUnit);
          } else {
            updated.costo_total = '';
          }
        }
        
        return updated;
      }
      return insumo;
    }));
  };

  // Calcular total general de todos los insumos
  const calcularTotalGeneral = () => {
    return insumosForm.reduce((total, insumo) => {
      const costoTotal = parseFloat(insumo.costo_total) || 0;
      return total + costoTotal;
    }, 0);
  };

  // Funciones para manejar órdenes de trabajo
  const agregarOrdenTrabajo = () => {
    const nuevoNumero = generarSiguienteNumeroOrden(ordenesTrabajo);
    setOrdenesTrabajoForm(prev => [
      ...prev,
      {
        id: nextOrdenId,
        numero_orden_trabajo: nuevoNumero,
        fecha_orden_trabajo: '',
        fecha_egreso: '',
        taller_autorizado: '',
        definicion_trabajo: '',
        mecanico_autorizado: '',
        tipo_mantenimiento: '',
        tarea_descripcion: ''
      }
    ]);
    setNextOrdenId(prev => prev + 1);
  };

  const eliminarOrdenTrabajo = (id) => {
    if (ordenesTrabajoForm.length > 1) {
      setOrdenesTrabajoForm(prev => prev.filter(orden => orden.id !== id));
    }
  };

  const actualizarOrdenTrabajo = (id, field, value) => {
    setOrdenesTrabajoForm(prev => prev.map(orden => {
      if (orden.id === id) {
        return { ...orden, [field]: value };
      }
      return orden;
    }));
  };

  // Manejar selección de vehículo
  const handleVehiculoChange = (idVehiculo) => {
    const vehiculoId = parseInt(idVehiculo, 10);
    const vehiculo = vehiculos.find(v => v.id_vehiculo === vehiculoId);
    if (vehiculo) {
      console.log('Vehículo seleccionado:', vehiculo);
      
      // Obtener el conductor activo del vehículo
      let numeroLicencia = '';
      if (vehiculo.id_conductor_activo && conductores.length > 0) {
        const conductorId = parseInt(vehiculo.id_conductor_activo, 10);
        const conductor = conductores.find(c => {
          const cId = parseInt(c.id_conductor, 10);
          return cId === conductorId;
        });
        if (conductor) {
          numeroLicencia = conductor.numero_licencia || '';
          console.log('Conductor encontrado:', conductor, 'Licencia:', numeroLicencia);
        } else {
          console.log('Conductor no encontrado para ID:', conductorId);
        }
      } else {
        console.log('Vehículo sin conductor activo o sin conductores disponibles');
      }

      // Obtener empresa del vehículo para grupo
      let grupoValue = '';
      if (vehiculo.id_empresa && empresas && empresas.length > 0) {
        const empresaVehiculo = empresas.find(e => e.id_empresa === vehiculo.id_empresa);
        // El grupo podría venir de un campo específico o del id_grupo de la empresa
        grupoValue = empresaVehiculo?.id_grupo ? String(empresaVehiculo.id_grupo) : '';
        console.log('Empresa del vehículo:', empresaVehiculo, 'Grupo:', grupoValue);
      }

      // Actualizar todos los campos del formulario con los datos del vehículo
      setFormData(prev => ({
        ...prev,
        id_vehiculo: vehiculo.id_vehiculo,
        matricula: vehiculo.matricula || '',
        vehiculo: vehiculo.interno || '',
        tipo_servicio: vehiculo.tipo_servicio || '',
        odometro: vehiculo.kilometros ? String(vehiculo.kilometros) : '',
        horometro: vehiculo.horometro ? String(vehiculo.horometro) : '',
        grupo: grupoValue,
        licencia: numeroLicencia || '', // Licencia del conductor activo
        fecha_rto: formatDateForInput(vehiculo.fecha_ultima_rto),
        fecha_vencimiento_seguro: formatDateForInput(vehiculo.fecha_vencimiento_seguro),
        tipo_seguro: vehiculo.tipo_seguro_cobertura || 'Todo riesgo',
        posee_camaras: vehiculo.posee_camara || false,
        aire_acondicionado: vehiculo.posee_ac || false,
        posee_calefaccion: false,
        posee_seguro: vehiculo.fecha_vencimiento_seguro ? true : false
      }));
      setVehiculoSearchTerm(''); // Limpiar búsqueda después de seleccionar
      
      console.log('Formulario actualizado con datos del vehículo');
    } else {
      console.error('Vehículo no encontrado con ID:', idVehiculo);
    }
  };

  // Filtrar vehículos por término de búsqueda (matrícula o interno)
  // Nota: vehiculos ya está filtrado por empresa del usuario en el useEffect
  const vehiculosFiltrados = useMemo(() => {
    if (!vehiculoSearchTerm || vehiculoSearchTerm.trim() === '') {
      return []; // No mostrar nada si no hay búsqueda
    }
    
    if (!Array.isArray(vehiculos) || vehiculos.length === 0) {
      console.warn('⚠️ No hay vehículos disponibles para filtrar');
      return [];
    }
    
    const searchLower = vehiculoSearchTerm.toLowerCase().trim();
    
    const filtrados = vehiculos.filter(v => {
      const matricula = (v.matricula || '').toLowerCase();
      const interno = (v.interno || '').toLowerCase();
      const marca = (v.marca || '').toLowerCase();
      const modelo = (v.modelo || '').toLowerCase();
      
      // Buscar en matrícula, interno, marca y modelo
      const matches = matricula.includes(searchLower) || 
                     interno.includes(searchLower) || 
                     marca.includes(searchLower) || 
                     modelo.includes(searchLower);
      
      return matches;
    });
    
    console.log(`Búsqueda: "${vehiculoSearchTerm}" - Encontrados: ${filtrados.length} de ${vehiculos.length} vehículos`);
    
    return filtrados;
  }, [vehiculoSearchTerm, vehiculos]);

  // Función para validar formulario completo
  const validateForm = () => {
    const errors = {};
    const fieldNames = {
      'empresa': 'Empresa',
      'grupo': 'Grupo',
      'matricula': 'Matrícula',
      'vehiculo': 'Vehículo',
      'tipo_servicio': 'Tipo de servicio',
      'licencia': 'Licencia',
      'odometro': 'Odómetro',
      'horometro': 'Horómetro',
      'fecha_rto': 'Fecha RTO',
      'fecha_vencimiento_seguro': 'Fecha de vencimiento seguro',
      'tipo_seguro': 'Tipo de Seguro'
    };

    // Validar campos de la sección 1 y 2 (identificación del vehículo)
    const requiredFieldsSeccion12 = [
      'empresa', 'grupo', 'matricula', 'vehiculo', 'tipo_servicio', 
      'licencia', 'odometro', 'horometro', 'fecha_rto', 
      'fecha_vencimiento_seguro', 'tipo_seguro'
    ];

    requiredFieldsSeccion12.forEach(field => {
      const value = formData[field];
      if (field === 'odometro' || field === 'horometro') {
        if (!value || value.trim() === '' || isNaN(parseInt(value, 10))) {
          errors[field] = `${fieldNames[field] || field} es requerido`;
        }
      } else if (!value || (typeof value === 'string' && value.trim() === '')) {
        errors[field] = `${fieldNames[field] || field} es requerido`;
      }
    });

    // Validar todas las órdenes de trabajo
    ordenesTrabajoForm.forEach((orden, index) => {
      if (!orden.numero_orden_trabajo || orden.numero_orden_trabajo.trim() === '') {
        errors[`numero_orden_trabajo_${orden.id}`] = 'N° orden de trabajo es requerido';
      }
      if (!orden.fecha_orden_trabajo || orden.fecha_orden_trabajo.trim() === '') {
        errors[`fecha_orden_trabajo_${orden.id}`] = 'Fecha de orden de trabajo es requerida';
      }
      if (!orden.fecha_egreso || orden.fecha_egreso.trim() === '') {
        errors[`fecha_egreso_${orden.id}`] = 'Fecha de egreso es requerida';
      }
      if (!orden.taller_autorizado || orden.taller_autorizado.trim() === '') {
        errors[`taller_autorizado_${orden.id}`] = 'Taller autorizado es requerido';
      }
      if (!orden.definicion_trabajo || orden.definicion_trabajo.trim() === '') {
        errors[`definicion_trabajo_${orden.id}`] = 'Definición del trabajo (categoría) es requerida';
      }
      if (!orden.mecanico_autorizado || orden.mecanico_autorizado.trim() === '') {
        errors[`mecanico_autorizado_${orden.id}`] = 'Mecánico autorizado es requerido';
      }
      if (!orden.tipo_mantenimiento || orden.tipo_mantenimiento.trim() === '') {
        errors[`tipo_mantenimiento_${orden.id}`] = 'Tipo de mantenimiento es requerido';
      }
      if (!orden.tarea_descripcion || orden.tarea_descripcion.trim() === '') {
        errors[`tarea_descripcion_${orden.id}`] = 'Tarea (descripción detallada) es requerida';
      }
    });

    // Validar insumos (al menos uno debe tener código y costo)
    const insumosValidos = insumosForm.filter(insumo => 
      insumo.codigo_articulo && insumo.codigo_articulo.trim() !== '' &&
      insumo.costo_unitario && parseFloat(insumo.costo_unitario) > 0
    );

    if (insumosValidos.length === 0 && insumosForm.length > 0) {
      errors['insumos'] = 'Debe agregar al menos un insumo válido con código y costo unitario';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const camposFaltantes = Object.values(errors).slice(0, 5).join(', ');
      setToast({
        type: 'error',
        title: 'Error de validación',
        message: `Por favor complete los siguientes campos: ${camposFaltantes}${Object.keys(errors).length > 5 ? '...' : ''}`
      });
      setTimeout(() => setToast(null), 5000);
      
      // Scroll al primer campo con error
      const firstErrorField = Object.keys(errors)[0];
      const errorElement = document.querySelector(`[name="${firstErrorField}"], [data-field="${firstErrorField}"]`);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => errorElement.focus(), 300);
      }
      
      return false;
    }

    setFieldErrors({});
    return true;
  };

  // Función para descargar plantilla Excel de órdenes de trabajo
  const handleDownloadTemplate = async () => {
    try {
      // Obtener datos necesarios para las hojas de referencia
      const [vehiculosData, conductoresData, tiposMantenimientoData] = await Promise.all([
        getAllFromTable('vehiculo').catch(() => []),
        getAllFromTable('conductor').catch(() => []),
        getAllFromTable('tipo_mantenimiento').catch(() => [])
      ]);

      const validVehiculos = Array.isArray(vehiculosData) ? vehiculosData : [];
      const validConductores = Array.isArray(conductoresData) ? conductoresData : [];
      const validTiposMantenimiento = Array.isArray(tiposMantenimientoData) ? tiposMantenimientoData : [];

      // Filtrar vehículos por empresa si es usuario Empresa
      let vehiculosFiltrados = validVehiculos;
      if (idEmpresaUsuario) {
        vehiculosFiltrados = validVehiculos.filter(v => v.id_empresa === idEmpresaUsuario);
      }

      // Hoja 1: Plantilla Órdenes de Trabajo
      const templateData = [
        {
          'ID Vehículo*': '',
          'ID Conductor (opcional)': '',
          'ID Tipo Mantenimiento*': '',
          'N° Orden de Trabajo*': '',
          'Fecha Generación (YYYY-MM-DD)*': '',
          'Fecha Egreso (YYYY-MM-DD, opcional)': '',
          'Odómetro (opcional)': '',
          'Horómetro (opcional)': '',
          'Estado* (Pendiente/En proceso/Completada)': ''
        }
      ];

      const ws = XLSX.utils.json_to_sheet(templateData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Plantilla Órdenes');
      
      // Ajustar ancho de columnas
      ws['!cols'] = [
        { wch: 15 }, { wch: 20 }, { wch: 25 }, { wch: 25 },
        { wch: 30 }, { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 40 }
      ];

      // Hoja 2: VEHICULOS
      const vehiculosDataSheet = vehiculosFiltrados.map(v => ({
        'ID': v.id_vehiculo || v.id || '',
        'Interno': v.interno || '',
        'Matrícula': v.matricula || '',
        'Marca': v.marca || '',
        'Modelo': v.modelo || ''
      }));

      const wsVehiculos = XLSX.utils.json_to_sheet(vehiculosDataSheet);
      XLSX.utils.book_append_sheet(wb, wsVehiculos, 'VEHICULOS');
      
      wsVehiculos['!cols'] = [
        { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 20 }
      ];

      // Hoja 3: CONDUCTORES
      const conductoresDataSheet = validConductores.map(c => ({
        'ID': c.id_conductor || c.id || '',
        'Nombre': c.nombre || '',
        'Apellido': c.apellido || '',
        'DNI': c.dni || ''
      }));

      const wsConductores = XLSX.utils.json_to_sheet(conductoresDataSheet);
      XLSX.utils.book_append_sheet(wb, wsConductores, 'CONDUCTORES');
      
      wsConductores['!cols'] = [
        { wch: 10 }, { wch: 20 }, { wch: 20 }, { wch: 15 }
      ];

      // Hoja 4: TIPOS MANTENIMIENTO
      const tiposDataSheet = validTiposMantenimiento.map(t => ({
        'ID': t.id_tipo || t.id_tipo_mantenimiento || '',
        'Descripción': t.descripcion || ''
      }));

      const wsTipos = XLSX.utils.json_to_sheet(tiposDataSheet);
      XLSX.utils.book_append_sheet(wb, wsTipos, 'TIPOS MANTENIMIENTO');
      
      wsTipos['!cols'] = [
        { wch: 10 },
        { wch: 40 }
      ];

      XLSX.writeFile(wb, 'plantilla_carga_masiva_ordenes_trabajo.xlsx');
      
      setToast({
        type: 'success',
        title: 'Plantilla descargada',
        message: 'La plantilla se ha descargado correctamente'
      });
      setTimeout(() => setToast(null), 5000);
    } catch (error) {
      console.error('Error al generar plantilla:', error);
      setToast({
        type: 'error',
        title: 'Error al generar plantilla',
        message: 'Ocurrió un error al generar la plantilla. Por favor intente nuevamente.'
      });
      setTimeout(() => setToast(null), 5000);
    }
  };

  // Función para validar una fila de datos de orden de trabajo
  const validateRowOrdenTrabajo = (row, rowIndex, vehiculos, conductores, tiposMantenimiento) => {
    const errors = [];
    
    // Validar campos requeridos
    const requiredFields = ['ID Vehículo*', 'ID Tipo Mantenimiento*', 'N° Orden de Trabajo*', 'Fecha Generación (YYYY-MM-DD)*', 'Estado* (Pendiente/En proceso/Completada)'];
    requiredFields.forEach(field => {
      if (!row[field] || String(row[field]).trim() === '') {
        errors.push(`Fila ${rowIndex + 2}: El campo "${field}" es requerido`);
      }
    });

    // Validar ID Vehículo existe
    if (row['ID Vehículo*']) {
      const idVehiculo = parseInt(row['ID Vehículo*'], 10);
      if (isNaN(idVehiculo) || !vehiculos.find(v => v.id_vehiculo === idVehiculo)) {
        errors.push(`Fila ${rowIndex + 2}: El ID de Vehículo "${row['ID Vehículo*']}" no existe`);
      }
    }

    // Validar ID Conductor existe (si se proporciona)
    if (row['ID Conductor (opcional)'] && String(row['ID Conductor (opcional)']).trim() !== '') {
      const idConductor = parseInt(row['ID Conductor (opcional)'], 10);
      if (isNaN(idConductor) || !conductores.find(c => c.id_conductor === idConductor)) {
        errors.push(`Fila ${rowIndex + 2}: El ID de Conductor "${row['ID Conductor (opcional)']}" no existe`);
      }
    }

    // Validar ID Tipo Mantenimiento existe
    if (row['ID Tipo Mantenimiento*']) {
      const idTipo = parseInt(row['ID Tipo Mantenimiento*'], 10);
      if (isNaN(idTipo) || !tiposMantenimiento.find(t => (t.id_tipo || t.id_tipo_mantenimiento) === idTipo)) {
        errors.push(`Fila ${rowIndex + 2}: El ID de Tipo Mantenimiento "${row['ID Tipo Mantenimiento*']}" no existe`);
      }
    }

    // Validar formato de fecha generación
    if (row['Fecha Generación (YYYY-MM-DD)*']) {
      const dateStr = String(row['Fecha Generación (YYYY-MM-DD)*']).trim();
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(dateStr)) {
        errors.push(`Fila ${rowIndex + 2}: El campo "Fecha Generación" debe tener formato YYYY-MM-DD`);
      } else {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
          errors.push(`Fila ${rowIndex + 2}: El campo "Fecha Generación" contiene una fecha inválida`);
        }
      }
    }

    // Validar formato de fecha egreso (si se proporciona)
    if (row['Fecha Egreso (YYYY-MM-DD, opcional)'] && String(row['Fecha Egreso (YYYY-MM-DD, opcional)']).trim() !== '') {
      const dateStr = String(row['Fecha Egreso (YYYY-MM-DD, opcional)']).trim();
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(dateStr)) {
        errors.push(`Fila ${rowIndex + 2}: El campo "Fecha Egreso" debe tener formato YYYY-MM-DD`);
      } else {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
          errors.push(`Fila ${rowIndex + 2}: El campo "Fecha Egreso" contiene una fecha inválida`);
        }
      }
    }

    // Validar estado
    if (row['Estado* (Pendiente/En proceso/Completada)']) {
      const estado = String(row['Estado* (Pendiente/En proceso/Completada)']).trim();
      const estadosValidos = ['Pendiente', 'En proceso', 'Completada', 'En Proceso'];
      if (!estadosValidos.includes(estado)) {
        errors.push(`Fila ${rowIndex + 2}: El campo "Estado" debe ser "Pendiente", "En proceso" o "Completada"`);
      }
    }

    // Validar odómetro (si se proporciona)
    if (row['Odómetro (opcional)'] && String(row['Odómetro (opcional)']).trim() !== '') {
      const odometro = parseInt(row['Odómetro (opcional)'], 10);
      if (isNaN(odometro) || odometro < 0) {
        errors.push(`Fila ${rowIndex + 2}: El campo "Odómetro" debe ser un número positivo`);
      }
    }

    // Validar horómetro (si se proporciona)
    if (row['Horómetro (opcional)'] && String(row['Horómetro (opcional)']).trim() !== '') {
      const horometro = parseInt(row['Horómetro (opcional)'], 10);
      if (isNaN(horometro) || horometro < 0) {
        errors.push(`Fila ${rowIndex + 2}: El campo "Horómetro" debe ser un número positivo`);
      }
    }

    return errors;
  };

  // Función para procesar archivo Excel de órdenes de trabajo
  const handleProcessExcelFile = async (file) => {
    setIsProcessingFile(true);
    setCargaMasivaErrors([]);
    setCargaMasivaSuccess(0);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet);

      if (jsonData.length === 0) {
        setToast({
          type: 'error',
          title: 'Archivo vacío',
          message: 'El archivo Excel no contiene datos para procesar'
        });
        setTimeout(() => setToast(null), 5000);
        setIsProcessingFile(false);
        return;
      }

      // Obtener datos necesarios para validación usando Supabase
      const [vehiculosData, conductoresData, tiposMantenimientoData, ordenesExistentes] = await Promise.all([
        getAllFromTable('vehiculo'),
        getAllFromTable('conductor'),
        getAllFromTable('tipo_mantenimiento'),
        getAllFromTable('orden_trabajo')
      ]);
      
      // Validar que sean arrays antes de procesar
      let validVehiculos = Array.isArray(vehiculosData) ? vehiculosData : [];
      const validConductores = Array.isArray(conductoresData) ? conductoresData : [];
      const validTiposMantenimiento = Array.isArray(tiposMantenimientoData) ? tiposMantenimientoData : [];
      const validOrdenesExistentes = Array.isArray(ordenesExistentes) ? ordenesExistentes : [];
      
      // Filtrar vehículos por empresa si es usuario Empresa
      if (idEmpresaUsuario) {
        validVehiculos = validVehiculos.filter(v => v.id_empresa === idEmpresaUsuario);
      }
      
      // NO usar id_orden manual - la secuencia lo generará automáticamente
      const errors = [];
      const validRows = [];
      const numerosOrdenExistentes = new Set(validOrdenesExistentes.map(o => o.nro_orden_trabajo).filter(Boolean));
      
      // Obtener el máximo número de orden para validar consecutividad
      const numerosOrden = validOrdenesExistentes
        .map(o => {
          const nro = o.nro_orden_trabajo;
          if (nro && /^\d+$/.test(String(nro))) {
            return parseInt(String(nro), 10);
          }
          return null;
        })
        .filter(n => n !== null);
      const maxNumeroOrden = numerosOrden.length > 0 ? Math.max(...numerosOrden) : 602569;

      // Validar y procesar cada fila
      jsonData.forEach((row, index) => {
        const rowErrors = validateRowOrdenTrabajo(row, index, validVehiculos, validConductores, validTiposMantenimiento);
        
        // Validar que el número de orden no esté duplicado en el archivo
        const nroOrden = String(row['N° Orden de Trabajo*'] || '').trim();
        if (nroOrden && numerosOrdenExistentes.has(nroOrden)) {
          rowErrors.push(`Fila ${index + 2}: El número de orden "${nroOrden}" ya existe en la base de datos`);
        }
        if (nroOrden) {
          numerosOrdenExistentes.add(nroOrden);
          
          // Validar consecutividad del número de orden
          const nroOrdenNum = parseInt(nroOrden, 10);
          if (!isNaN(nroOrdenNum)) {
            // Calcular el siguiente esperado basado en el máximo actual + índice
            const siguienteEsperado = maxNumeroOrden + validRows.length + 1;
            if (nroOrdenNum !== siguienteEsperado) {
              rowErrors.push(`Fila ${index + 2}: El número de orden debería ser ${siguienteEsperado} (siguiente consecutivo), pero se ingresó ${nroOrdenNum}`);
            }
          }
        }
        
        if (rowErrors.length > 0) {
          errors.push(...rowErrors);
        } else {
          // Convertir a formato de base de datos
          // NO incrementar currentId - la secuencia generará el id_orden automáticamente
          
          const formatDate = (dateStr) => {
            if (!dateStr || String(dateStr).trim() === '') return null;
            const date = new Date(dateStr);
            return date.toISOString();
          };

          const parseEstado = (estado) => {
            const estadoStr = String(estado).trim();
            if (estadoStr === 'En Proceso' || estadoStr === 'En proceso') {
              return 'En proceso';
            }
            return estadoStr;
          };

          // NO incluir id_orden - la secuencia lo generará automáticamente
          validRows.push({
            // id_orden se genera automáticamente por la secuencia, NO incluirlo
            id_vehiculo: parseInt(row['ID Vehículo*'], 10),
            id_conductor: row['ID Conductor (opcional)'] && String(row['ID Conductor (opcional)']).trim() !== '' 
              ? parseInt(row['ID Conductor (opcional)'], 10) 
              : null,
            id_tipo_mantenimiento: parseInt(row['ID Tipo Mantenimiento*'], 10),
            nro_orden_trabajo: nroOrden,
            fecha_generacion: formatDate(row['Fecha Generación (YYYY-MM-DD)*']),
            fecha_egreso: formatDate(row['Fecha Egreso (YYYY-MM-DD, opcional)']),
            odometro: row['Odómetro (opcional)'] && String(row['Odómetro (opcional)']).trim() !== '' 
              ? parseInt(row['Odómetro (opcional)'], 10) 
              : 0,
            horometro: row['Horómetro (opcional)'] && String(row['Horómetro (opcional)']).trim() !== '' 
              ? parseInt(row['Horómetro (opcional)'], 10) 
              : 0,
            estado: parseEstado(row['Estado* (Pendiente/En proceso/Completada)'])
          });
        }
      });

      // Cargar filas válidas usando Supabase
      if (validRows.length > 0) {
        const promises = validRows.map(orden => 
          insertIntoTable('orden_trabajo', orden).catch(err => {
            console.error('Error insertando orden de trabajo:', err);
            throw err;
          })
        );

        const results = await Promise.allSettled(promises);
        let successCount = 0;
        let failCount = 0;

        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            successCount++;
            // Registrar auditoría para cada orden creada
            const orden = validRows[index];
            // El id_orden viene del resultado de la inserción
            const idOrdenInsertado = result.value?.id_orden || result.value?.id || orden.nro_orden_trabajo;
            registrarAuditoria({
              usuarioNombre: user?.nombre || 'Usuario desconocido',
              idUsuarioRef: user?.id_usuario || null,
              accion: 'CREAR',
              tipoRegistro: 'orden_trabajo',
              idRegistro: idOrdenInsertado,
              idMantenimientoRef: result.value?.id_orden || result.value?.id || null,
              detalle: `Carga DDJJ (carga masiva): N° OT ${orden.nro_orden_trabajo || 'N/A'}`
            }).catch(err => console.error('Error al registrar auditoría:', err));
          } else {
            failCount++;
            errors.push(`Fila ${jsonData.findIndex((r, i) => validRows[index] && r['N° Orden de Trabajo*'] === validRows[index].nro_orden_trabajo) + 2}: Error al guardar en la base de datos`);
          }
        });

        setCargaMasivaSuccess(successCount);
        
        if (failCount > 0) {
          errors.push(`${failCount} registro(s) no pudieron ser guardados correctamente`);
        }
      }

      // Recargar lista de órdenes de trabajo
      const ordenesReloadData = await getAllFromTable('orden_trabajo');
      if (Array.isArray(ordenesReloadData)) {
        setOrdenesTrabajo(ordenesReloadData);
      }

      // Mostrar resultados
      setCargaMasivaErrors(errors);
      
      if (errors.length === 0 && validRows.length > 0) {
        setToast({
          type: 'success',
          title: 'Carga masiva exitosa',
          message: `Se cargaron exitosamente ${validRows.length} orden(es) de trabajo`
        });
        setTimeout(() => {
          setToast(null);
          setShowCargaMasivaModal(false);
          setCargaMasivaErrors([]);
          setCargaMasivaSuccess(0);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }, 5000);
      } else if (validRows.length > 0) {
        setToast({
          type: 'error',
          title: 'Carga parcial',
          message: `Se cargaron ${validRows.length} orden(es) de trabajo pero hubo ${errors.length} error(es). Revise el informe de errores.`
        });
        setTimeout(() => setToast(null), 5000);
      } else {
        setToast({
          type: 'error',
          title: 'Error en carga masiva',
          message: `No se pudo cargar ninguna orden de trabajo. Revise el informe de errores.`
        });
        setTimeout(() => setToast(null), 5000);
      }

    } catch (error) {
      setToast({
        type: 'error',
        title: 'Error al procesar archivo',
        message: error.message || 'Ocurrió un error al procesar el archivo Excel. Por favor verifique el formato del archivo.'
      });
      setTimeout(() => setToast(null), 5000);
    } finally {
      setIsProcessingFile(false);
    }
  };

  // Guardar formulario
  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Obtener el vehículo seleccionado para obtener el conductor activo
      const vehiculoSeleccionado = vehiculos.find(v => v.id_vehiculo === parseInt(formData.id_vehiculo, 10));
      if (!vehiculoSeleccionado) {
        throw new Error('Vehículo no encontrado');
      }

      // Obtener el conductor activo del vehículo
      const idConductor = vehiculoSeleccionado.id_conductor_activo 
        ? parseInt(vehiculoSeleccionado.id_conductor_activo, 10) 
        : null;

      // Convertir odómetro y horómetro a números
      const odometroValue = formData.odometro 
        ? parseInt(formData.odometro, 10) 
        : 0;
      
      const horometroValue = formData.horometro 
        ? parseInt(formData.horometro, 10) 
        : 0;

      // Validar que los números de orden de trabajo no existan
      const ordenesExistentes = await getAllFromTable('orden_trabajo');
      const validOrdenesExistentes = Array.isArray(ordenesExistentes) ? ordenesExistentes : [];
      
      // Validar números de orden únicos
      const numerosOrdenForm = ordenesTrabajoForm.map(o => o.numero_orden_trabajo.trim());
      const numerosDuplicados = numerosOrdenForm.filter((nro, index) => numerosOrdenForm.indexOf(nro) !== index);
      if (numerosDuplicados.length > 0) {
        setToast({
          type: 'error',
          title: 'Error de validación',
          message: `Los siguientes números de orden están duplicados: ${numerosDuplicados.join(', ')}`
        });
        setTimeout(() => setToast(null), 5000);
        setIsSubmitting(false);
        return;
      }

      // Validar que los números de orden no existan en la base de datos
      const numerosOrdenExistentes = validOrdenesExistentes.map(o => o.nro_orden_trabajo);
      const numerosExistentes = numerosOrdenForm.filter(nro => numerosOrdenExistentes.includes(nro));
      if (numerosExistentes.length > 0) {
        setToast({
          type: 'error',
          title: 'Error de validación',
          message: `Los siguientes números de orden ya existen: ${numerosExistentes.join(', ')}`
        });
        setTimeout(() => setToast(null), 5000);
        setIsSubmitting(false);
        return;
      }

      // Obtener la empresa del vehículo
      const idEmpresaVehiculo = vehiculoSeleccionado.id_empresa || idEmpresaUsuario || null;

      // PASO 1: Crear la DDJJ primero
      const ddjjExistentes = await getAllFromTable('declaracion_jurada').catch(() => []);
      const validDDJJExistentes = Array.isArray(ddjjExistentes) ? ddjjExistentes : [];
      
      // Usar la fecha de la primera orden para generar el número DDJJ
      const primeraFecha = ordenesTrabajoForm[0]?.fecha_orden_trabajo 
        ? new Date(ordenesTrabajoForm[0].fecha_orden_trabajo).toISOString()
        : new Date().toISOString();
      
      const numeroDDJJ = generarNumeroDDJJ(validDDJJExistentes, primeraFecha);

      // Verificar que el número de DDJJ no exista
      const numeroDDJJExiste = validDDJJExistentes.some(
        d => d.numero_ddjj === numeroDDJJ
      );

      if (numeroDDJJExiste) {
        setToast({
          type: 'error',
          title: 'Error de validación',
          message: 'El número de DDJJ generado ya existe. Por favor intente nuevamente.'
        });
        setTimeout(() => setToast(null), 5000);
        setIsSubmitting(false);
        return;
      }

      // Crear la DDJJ
      const ddjjData = {
        numero_ddjj: numeroDDJJ,
        id_empresa: idEmpresaVehiculo,
        fecha_creacion: primeraFecha,
        estado: 'Pendiente'
      };

      const ddjjInsertada = await insertIntoTable('declaracion_jurada', ddjjData);
      
      if (!ddjjInsertada || !ddjjInsertada.id_ddjj) {
        throw new Error('No se pudo crear la Declaración Jurada');
      }

      const idDDJJ = ddjjInsertada.id_ddjj;

      // PASO 2: Crear todas las órdenes de trabajo asociadas a la DDJJ
      const ordenesInsertadas = [];
      const vehiculoInfo = vehiculos.find(v => v.id_vehiculo === parseInt(formData.id_vehiculo, 10));

      for (const orden of ordenesTrabajoForm) {
        // Convertir fechas a formato ISO
        const fechaGeneracion = orden.fecha_orden_trabajo && orden.fecha_orden_trabajo.trim() !== ''
          ? new Date(orden.fecha_orden_trabajo).toISOString() 
          : new Date().toISOString();
        
        const fechaEgreso = orden.fecha_egreso && orden.fecha_egreso.trim() !== ''
          ? new Date(orden.fecha_egreso).toISOString() 
          : null;

        const ordenTrabajoData = {
          id_vehiculo: parseInt(formData.id_vehiculo, 10),
          id_conductor: idConductor,
          id_tipo_mantenimiento: parseInt(orden.tipo_mantenimiento, 10),
          id_ddjj: idDDJJ,
          nro_orden_trabajo: orden.numero_orden_trabajo.trim(),
          fecha_generacion: fechaGeneracion,
          fecha_egreso: fechaEgreso,
          odometro: odometroValue,
          horometro: horometroValue,
          estado: 'Pendiente'
        };

        const ordenInsertada = await insertIntoTable('orden_trabajo', ordenTrabajoData);
        
        if (!ordenInsertada || !ordenInsertada.id_orden) {
          throw new Error(`No se pudo crear la orden de trabajo ${orden.numero_orden_trabajo}`);
        }

        ordenesInsertadas.push(ordenInsertada);

        // Registrar auditoría para cada orden de trabajo
        const tipoMantenimientoInfo = tiposMantenimiento.find(t => t.id_tipo === parseInt(orden.tipo_mantenimiento, 10));
        await registrarAuditoria({
          usuarioNombre: user?.nombre || 'Usuario desconocido',
          idUsuarioRef: user?.id_usuario || null,
          accion: 'CREAR',
          tipoRegistro: 'orden_trabajo',
          idRegistro: ordenInsertada.id_orden,
          idMantenimientoRef: ordenInsertada.id_orden,
          detalle: `Carga DDJJ: N° DDJJ ${numeroDDJJ}, N° OT ${orden.numero_orden_trabajo.trim()}, Matrícula: ${vehiculoInfo?.matricula || 'N/A'}, Tipo: ${tipoMantenimientoInfo?.descripcion || tipoMantenimientoInfo?.tipo || 'N/A'}`
        });
      }

      // PASO 3: Crear los detalles de insumos para cada orden
      // Asociar insumos a todas las órdenes creadas
      const insumosValidos = insumosForm.filter(insumo => 
        insumo.codigo_articulo && insumo.codigo_articulo.trim() !== '' &&
        insumo.costo_unitario && parseFloat(insumo.costo_unitario) > 0
      );

      let insumosInsertados = 0;
      if (insumosValidos.length > 0) {
        // Buscar o crear insumos en el catálogo
        for (const insumo of insumosValidos) {
          try {
            // Buscar el insumo en el catálogo por código
            let insumoCatalogo = insumos.find(i => 
              i.codigo_inventario === insumo.codigo_articulo.trim()
            );

            // Si no existe, crear uno nuevo en el catálogo
            if (!insumoCatalogo) {
              try {
                const nuevoInsumo = await insertIntoTable('insumo_catalogo', {
                  codigo_inventario: insumo.codigo_articulo.trim(),
                  descripcion: insumo.descripcion_insumo || insumo.codigo_articulo.trim()
                });
                insumoCatalogo = nuevoInsumo;
              } catch (error) {
                // Si falla al crear (puede ser por código duplicado), intentar buscar de nuevo
                console.warn(`Error al crear insumo ${insumo.codigo_articulo}, intentando buscar nuevamente:`, error);
                const insumosActualizados = await getAllFromTable('insumo_catalogo');
                insumoCatalogo = insumosActualizados.find(i => 
                  i.codigo_inventario === insumo.codigo_articulo.trim()
                );
                if (!insumoCatalogo) {
                  console.error(`No se pudo crear ni encontrar el insumo ${insumo.codigo_articulo}`);
                  continue; // Saltar este insumo
                }
              }
            }

            const idInsumo = insumoCatalogo.id_insumo || insumoCatalogo.id;
            if (!idInsumo) {
              console.error(`No se pudo obtener el ID del insumo ${insumo.codigo_articulo}`);
              continue; // Saltar este insumo
            }

            const cantidad = parseInt(insumo.cantidad, 10) || 1;
            const costoUnitario = parseFloat(insumo.costo_unitario) || 0;
            const costoTotal = parseFloat(insumo.costo_total) || (cantidad * costoUnitario);

            // Asociar el insumo a todas las órdenes creadas
            for (const ordenInsertada of ordenesInsertadas) {
              const detalleInsumoData = {
                id_orden: ordenInsertada.id_orden,
                id_insumo: idInsumo,
                cantidad: cantidad,
                costo_unitario_historico: costoUnitario,
                costo_total: costoTotal
              };

              await insertIntoTable('detalle_insumo', detalleInsumoData);
              insumosInsertados++;
            }
          } catch (error) {
            console.error(`Error al procesar insumo ${insumo.codigo_articulo}:`, error);
            // Continuar con el siguiente insumo en lugar de fallar todo
          }
        }
      }

      // Registrar auditoría para la DDJJ
      await registrarAuditoria({
        usuarioNombre: user?.nombre || 'Usuario desconocido',
        idUsuarioRef: user?.id_usuario || null,
        accion: 'CREAR',
        tipoRegistro: 'declaracion_jurada',
        idRegistro: idDDJJ,
        idMantenimientoRef: idDDJJ,
        detalle: `Carga DDJJ: N° DDJJ ${numeroDDJJ}, ${ordenesInsertadas.length} orden(es) de trabajo, Matrícula: ${vehiculoInfo?.matricula || 'N/A'}`
      });

      // Mostrar mensaje de éxito
      const mensajeInsumos = insumosInsertados > 0 
        ? `con ${insumosInsertados} detalle(s) de insumo(s)`
        : '';
      setToast({
        type: 'success',
        title: 'DDJJ creada exitosamente',
        message: `La DDJJ ${numeroDDJJ} con ${ordenesInsertadas.length} orden(es) de trabajo ${mensajeInsumos} se ha guardado correctamente`
      });
      
      setTimeout(() => {
        setToast(null);
        // Limpiar formulario y redirigir
        setFormData({
          empresa: empresa?.nombre_empresa || '',
          id_vehiculo: '',
          matricula: '',
          tipo_servicio: '',
          odometro: '',
          grupo: '',
          vehiculo: '',
          licencia: '',
          horometro: '',
          fecha_rto: '',
          fecha_vencimiento_seguro: '',
          tipo_seguro: 'Todo riesgo',
          posee_camaras: false,
          aire_acondicionado: false,
          posee_calefaccion: false,
          posee_seguro: false,
          descripcion_siniestros: ''
        });
        
        // Resetear órdenes a una inicial
        const siguienteNumero = generarSiguienteNumeroOrden(ordenesTrabajo);
        setOrdenesTrabajoForm([{
          id: 1,
          numero_orden_trabajo: siguienteNumero,
          fecha_orden_trabajo: '',
          fecha_egreso: '',
          taller_autorizado: '',
          definicion_trabajo: '',
          mecanico_autorizado: '',
          tipo_mantenimiento: '',
          tarea_descripcion: ''
        }]);
        setNextOrdenId(2);
        
        // Resetear insumos
        setInsumosForm([{
          id: 1,
          codigo_articulo: '',
          cantidad: '1',
          costo_unitario: '',
          costo_total: '',
          descripcion_insumo: ''
        }]);
        setNextInsumoId(2);
        setFieldErrors({});
        setCostoUnitarioFocused({});
        navigate('/home');
      }, 2000);
    } catch (error) {
      console.error('Error al guardar:', error);
      let errorMessage = 'Ocurrió un error al guardar la DDJJ';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.code === '23505' || error.code === 409) {
        errorMessage = 'Uno o más números de orden de trabajo ya existen. Por favor verifique los números ingresados.';
      } else if (error.message?.includes('duplicate')) {
        errorMessage = 'Uno o más números de orden de trabajo ya existen. Por favor verifique los números ingresados.';
      }

      setToast({
        type: 'error',
        title: 'Error al guardar',
        message: errorMessage
      });
      setTimeout(() => setToast(null), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cancelar
  const handleCancel = () => {
    navigate('/home');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500" style={{ fontFamily: 'Lato, sans-serif' }}>
          Cargando...
        </div>
      </div>
    );
  }

  return (
    <div className="w-full" style={{ fontFamily: 'Lato, sans-serif' }}>
      {/* Header */}
      <div 
        className="bg-[#007C8A] w-full mb-4 rounded-lg mt-4 sm:mt-6 flex items-center justify-between px-3 sm:px-4 lg:px-6"
        style={{
          minHeight: '70px',
          paddingTop: '12px',
          paddingBottom: '12px'
        }}
      >
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1" style={{ fontFamily: 'Lato, sans-serif', lineHeight: '1.2' }}>
            Generador de declaración jurada
          </h1>
          <p className="text-white text-xs sm:text-sm font-normal" style={{ fontFamily: 'Lato, sans-serif', lineHeight: '1.2' }}>
            Formulario para dar de alta nuevas declaraciones juradas
          </p>
        </div>
      </div>

      {/* Botones superiores */}
      <div className="px-3 sm:px-4 md:px-6 mb-6 flex items-center justify-end gap-3">
        <button
          onClick={handleDownloadTemplate}
          disabled={isProcessingFile}
          className="px-4 py-2 rounded-lg shadow-md flex items-center justify-center gap-2 transition-all hover:shadow-lg whitespace-nowrap border border-gray-300 bg-white"
          style={{
            color: '#374151',
            fontFamily: 'Lato, sans-serif',
            fontWeight: 'bold',
            fontSize: '14px'
          }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Descargar plantilla
        </button>
        <button
          onClick={() => setShowCargaMasivaModal(true)}
          disabled={isProcessingFile}
          className="px-4 py-2 rounded-lg shadow-md flex items-center justify-center gap-2 transition-all hover:shadow-lg whitespace-nowrap"
          style={{
            backgroundColor: '#007C8A',
            color: '#FFFFFF',
            fontFamily: 'Lato, sans-serif',
            fontWeight: 'bold',
            fontSize: '14px'
          }}
        >
          Carga masiva
        </button>
      </div>

      {/* Contenido del formulario */}
      <div className="px-3 sm:px-4 md:px-6 pb-6" style={{ backgroundColor: '#F9FAFB' }}>
        {/* Sección 1: Identificación del vehículo y servicio */}
        <div 
          className="bg-white rounded-lg shadow-md mb-6"
          style={{
            padding: '24px',
            border: '1px solid #E5E7EB'
          }}
        >
          <h2 
            className="text-lg font-bold mb-2"
            style={{ 
              fontFamily: 'Lato, sans-serif',
              color: '#1F2937'
            }}
          >
            Identificación del vehículo y servicio
          </h2>
          <p 
            className="text-sm mb-6"
            style={{ 
              fontFamily: 'Lato, sans-serif',
              color: '#6B7280'
            }}
          >
            Llenar los campos obligatorios.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Columna izquierda */}
            <div>
              <label 
                className="block text-sm font-medium mb-2"
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  color: '#374151'
                }}
              >
                Empresa*
              </label>
              <input
                type="text"
                value={formData.empresa}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  fontSize: '14px',
                  color: '#6B7280'
                }}
                placeholder="Empresa actual"
              />
            </div>

            {/* Columna derecha */}
            <div>
              <label 
                className="block text-sm font-medium mb-2"
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  color: '#374151'
                }}
              >
                Grupo*
              </label>
              <input
                type="text"
                value={formData.grupo}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  fontSize: '14px',
                  color: '#6B7280'
                }}
                placeholder="Grupo"
              />
            </div>

            <div>
              <label 
                className="block text-sm font-medium mb-2"
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  color: '#374151'
                }}
              >
                Matrícula*
              </label>
              <input
                type="text"
                value={formData.matricula}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  fontSize: '14px',
                  color: '#6B7280'
                }}
                placeholder="Matrícula del vehículo seleccionado"
              />
            </div>

            {/* Select de vehículos con búsqueda - Vehículo */}
            <div className="relative" ref={vehiculoDropdownRef}>
              <label 
                className="block text-sm font-medium mb-2"
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  color: '#374151'
                }}
              >
                Vehículo*
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={vehiculoSearchTerm || (formData.id_vehiculo ? `${formData.matricula || ''} - ${formData.vehiculo || ''}` : '')}
                  onChange={(e) => {
                    setVehiculoSearchTerm(e.target.value);
                    if (formData.id_vehiculo && e.target.value !== `${formData.matricula || ''} - ${formData.vehiculo || ''}`) {
                      setFormData(prev => ({
                        ...prev,
                        id_vehiculo: '',
                        matricula: '',
                        vehiculo: '',
                        tipo_servicio: '',
                        odometro: '',
                        horometro: '',
                        grupo: '',
                        licencia: '',
                        fecha_rto: '',
                        fecha_vencimiento_seguro: '',
                        tipo_seguro: 'Todo riesgo',
                        posee_camaras: false,
                        aire_acondicionado: false,
                        posee_calefaccion: false,
                        posee_seguro: false
                      }));
                    }
                  }}
                  onFocus={() => {
                    if (formData.id_vehiculo) {
                      setVehiculoSearchTerm('');
                    }
                  }}
                  placeholder="Buscar vehículo por matrícula..."
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-white pr-10 ${
                    fieldErrors.id_vehiculo 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-[#007C8A]'
                  }`}
                  style={{ 
                    fontFamily: 'Lato, sans-serif',
                    fontSize: '14px'
                  }}
                />
                <svg 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              {vehiculoSearchTerm && vehiculoSearchTerm.trim() !== '' && vehiculosFiltrados.length > 0 && (
                <div className="mt-1 border border-gray-300 rounded-lg bg-white shadow-lg max-h-60 overflow-y-auto z-50 absolute w-full">
                  {vehiculosFiltrados.map(v => (
                    <div
                      key={v.id_vehiculo}
                      onClick={() => {
                        handleVehiculoChange(v.id_vehiculo);
                        setVehiculoSearchTerm('');
                      }}
                      className="px-4 py-2 hover:bg-[#007C8A] hover:text-white cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                      style={{ fontFamily: 'Lato, sans-serif', fontSize: '14px' }}
                    >
                      <div className="font-medium" style={{ color: 'inherit' }}>
                        {v.matricula || 'Sin matrícula'} - {v.interno || 'N/A'}
                      </div>
                      <div className="text-sm opacity-90">
                        {v.marca && v.modelo ? `${v.marca} ${v.modelo}` : 'Sin información adicional'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {vehiculoSearchTerm && vehiculoSearchTerm.trim() !== '' && vehiculosFiltrados.length === 0 && (
                <div className="mt-1 px-4 py-2 text-sm text-gray-500 border border-gray-300 rounded-lg bg-white z-50 absolute w-full">
                  No se encontraron vehículos de la empresa
                </div>
              )}
              {!formData.id_vehiculo && !vehiculoSearchTerm && (
                <div className="mt-1">
                  <p className="text-xs text-gray-500" style={{ fontFamily: 'Lato, sans-serif' }}>
                    Busca por matrícula para seleccionar un vehículo de la empresa
                  </p>
                  {vehiculos.length === 0 && (
                    <p className="text-xs text-orange-600 mt-1" style={{ fontFamily: 'Lato, sans-serif' }}>
                      ⚠️ No hay vehículos disponibles para esta empresa
                    </p>
                  )}
                  {vehiculos.length > 0 && (
                    <p className="text-xs text-gray-400 mt-1" style={{ fontFamily: 'Lato, sans-serif' }}>
                      {vehiculos.length} vehículo(s) disponible(s)
                    </p>
                  )}
                </div>
              )}
              {formData.id_vehiculo && !vehiculoSearchTerm && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm font-medium text-green-800" style={{ fontFamily: 'Lato, sans-serif' }}>
                    ✓ Vehículo seleccionado: {formData.matricula} - {formData.vehiculo}
                  </p>
                </div>
              )}
              {fieldErrors.id_vehiculo && (
                <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                  {fieldErrors.id_vehiculo}
                </p>
              )}
            </div>

            <div>
              <label 
                className="block text-sm font-medium mb-2"
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  color: '#374151'
                }}
              >
                Tipo de servicio*
              </label>
              <select
                value={formData.tipo_servicio}
                onChange={(e) => handleChange('tipo_servicio', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007C8A] bg-white"
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  fontSize: '14px'
                }}
              >
                <option value="">Selecciona tipo de servicio</option>
                {tiposServicio.map((tipo, index) => (
                  <option key={index} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
            </div>

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
              <input
                type="text"
                value={formData.licencia}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  fontSize: '14px',
                  color: '#6B7280'
                }}
                placeholder="Licencia"
              />
            </div>

            <div>
              <label 
                className="block text-sm font-medium mb-2"
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  color: '#374151'
                }}
              >
                Odómetro*
              </label>
              <input
                type="text"
                value={formData.odometro ? `${formatNumber(formData.odometro)} km` : ''}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  fontSize: '14px',
                  color: '#6B7280'
                }}
                placeholder="0 km"
              />
            </div>

            <div>
              <label 
                className="block text-sm font-medium mb-2"
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  color: '#374151'
                }}
              >
                Horómetro*
              </label>
              <input
                type="text"
                value={formData.horometro ? `${formatNumber(formData.horometro)} hr` : ''}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  fontSize: '14px',
                  color: '#6B7280'
                }}
                placeholder="0 hr"
              />
            </div>
          </div>
        </div>

        {/* Sección 2: Estado y movimientos de unidad */}
        <div 
          className="bg-white rounded-lg shadow-md mb-6"
          style={{
            padding: '24px',
            border: '1px solid #E5E7EB'
          }}
        >
          <h2 
            className="text-lg font-bold mb-2"
            style={{ 
              fontFamily: 'Lato, sans-serif',
              color: '#1F2937'
            }}
          >
            Estado y movimientos de unidad
          </h2>
          <p 
            className="text-sm mb-6"
            style={{ 
              fontFamily: 'Lato, sans-serif',
              color: '#6B7280'
            }}
          >
            Llenar los campos obligatorios.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Columna izquierda */}
            <div>
              <label 
                className="block text-sm font-medium mb-2"
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  color: '#374151'
                }}
              >
                Fecha RTO*
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={formData.fecha_rto}
                  onChange={(e) => handleChange('fecha_rto', e.target.value)}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 pr-10"
                  style={{ 
                    fontFamily: 'Lato, sans-serif',
                    fontSize: '14px',
                    color: '#6B7280'
                  }}
                />
                <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>

            {/* Columna derecha */}
            <div>
              <label 
                className="block text-sm font-medium mb-2"
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  color: '#374151'
                }}
              >
                Tipo de Seguro*
              </label>
              <input
                type="text"
                value={formData.tipo_seguro}
                onChange={(e) => handleChange('tipo_seguro', e.target.value)}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  fontSize: '14px',
                  color: '#6B7280'
                }}
                placeholder="Todo riesgo"
              />
            </div>

            <div>
              <label 
                className="block text-sm font-medium mb-2"
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  color: '#374151'
                }}
              >
                Fecha de vencimiento seguro*
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={formData.fecha_vencimiento_seguro}
                  onChange={(e) => handleChange('fecha_vencimiento_seguro', e.target.value)}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 pr-10"
                  style={{ 
                    fontFamily: 'Lato, sans-serif',
                    fontSize: '14px',
                    color: '#6B7280'
                  }}
                />
                <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>

            {/* Checkboxes - Columna izquierda */}
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-2 cursor-not-allowed opacity-60">
                <input
                  type="checkbox"
                  checked={formData.posee_camaras}
                  onChange={(e) => handleChange('posee_camaras', e.target.checked)}
                  disabled
                  className="w-4 h-4 text-[#007C8A] focus:ring-[#007C8A] rounded border-gray-300"
                  style={{ 
                    accentColor: '#007C8A'
                  }}
                />
                <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '14px', color: '#374151' }}>
                  Cámaras
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-not-allowed opacity-60">
                <input
                  type="checkbox"
                  checked={formData.aire_acondicionado}
                  onChange={(e) => handleChange('aire_acondicionado', e.target.checked)}
                  disabled
                  className="w-4 h-4 text-[#007C8A] focus:ring-[#007C8A] rounded border-gray-300"
                  style={{ 
                    accentColor: '#007C8A'
                  }}
                />
                <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '14px', color: '#374151' }}>
                  Aire acondicionado
                </span>
              </label>
            </div>

            {/* Checkboxes - Columna derecha */}
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-2 cursor-not-allowed opacity-60">
                <input
                  type="checkbox"
                  checked={formData.posee_calefaccion}
                  onChange={(e) => handleChange('posee_calefaccion', e.target.checked)}
                  disabled
                  className="w-4 h-4 text-[#007C8A] focus:ring-[#007C8A] rounded border-gray-300"
                  style={{ 
                    accentColor: '#007C8A'
                  }}
                />
                <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '14px', color: '#374151' }}>
                  Calefacción
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-not-allowed opacity-60">
                <input
                  type="checkbox"
                  checked={formData.posee_seguro}
                  onChange={(e) => handleChange('posee_seguro', e.target.checked)}
                  disabled
                  className="w-4 h-4 text-[#007C8A] focus:ring-[#007C8A] rounded border-gray-300"
                  style={{ 
                    accentColor: '#007C8A'
                  }}
                />
                <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '14px', color: '#374151' }}>
                  Seguro
                </span>
              </label>
            </div>

            {/* Descripción siniestros - campo completo */}
            <div className="md:col-span-2">
              <label 
                className="block text-sm font-medium mb-2"
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  color: '#374151'
                }}
              >
                Descripción siniestros
              </label>
              <textarea
                value={formData.descripcion_siniestros}
                onChange={(e) => handleChange('descripcion_siniestros', e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007C8A] bg-white"
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  fontSize: '14px'
                }}
                placeholder="Ingresa la descripción de siniestros"
              />
            </div>
          </div>
        </div>

        {/* Sección 3: Información de trabajo - Múltiples órdenes */}
        {ordenesTrabajoForm.map((orden, ordenIndex) => (
          <div 
            key={orden.id}
            className="bg-white rounded-lg shadow-md mb-6"
            style={{
              padding: '24px',
              border: '1px solid #E5E7EB'
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 
                  className="text-lg font-bold mb-2"
                  style={{ 
                    fontFamily: 'Lato, sans-serif',
                    color: '#1F2937'
                  }}
                >
                  Información de trabajo
                </h2>
                <p 
                  className="text-sm mb-6"
                  style={{ 
                    fontFamily: 'Lato, sans-serif',
                    color: '#6B7280'
                  }}
                >
                  Llenar los campos obligatorios.
                </p>
              </div>
              {/* Botón eliminar orden - solo si hay más de una */}
              {ordenesTrabajoForm.length > 1 && (
                <button
                  type="button"
                  onClick={() => eliminarOrdenTrabajo(orden.id)}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap flex items-center gap-2"
                  style={{ 
                    fontFamily: 'Lato, sans-serif',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#007C8A'
                  }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#007C8A' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
              )}
            </div>
          
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Columna izquierda */}
            <div>
              <label 
                className="block text-sm font-medium mb-2"
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  color: '#374151'
                }}
              >
                N° orden de trabajo*
              </label>
              <input
                type="text"
                value={orden.numero_orden_trabajo}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  fontSize: '14px',
                  color: '#6B7280'
                }}
                placeholder="Generado automáticamente"
              />
              {fieldErrors[`numero_orden_trabajo_${orden.id}`] && (
                <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                  {fieldErrors[`numero_orden_trabajo_${orden.id}`]}
                </p>
              )}
            </div>

            {/* Columna derecha */}
            <div>
              <label 
                className="block text-sm font-medium mb-2"
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  color: '#374151'
                }}
              >
                Fecha de orden de trabajo*
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={orden.fecha_orden_trabajo ? orden.fecha_orden_trabajo.split('T')[0] : ''}
                  onChange={(e) => {
                    const dateValue = e.target.value;
                    const timeValue = orden.fecha_orden_trabajo ? orden.fecha_orden_trabajo.split('T')[1] || '00:00' : '00:00';
                    actualizarOrdenTrabajo(orden.id, 'fecha_orden_trabajo', dateValue ? `${dateValue}T${timeValue}` : '');
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-white pr-10 ${
                    fieldErrors.fecha_orden_trabajo 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-[#007C8A]'
                  }`}
                  style={{ 
                    fontFamily: 'Lato, sans-serif',
                    fontSize: '14px'
                  }}
                />
                <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#007C8A] pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              {fieldErrors[`fecha_orden_trabajo_${orden.id}`] && (
                <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                  {fieldErrors[`fecha_orden_trabajo_${orden.id}`]}
                </p>
              )}
            </div>

            <div>
              <label 
                className="block text-sm font-medium mb-2"
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  color: '#374151'
                }}
              >
                Fecha de egreso*
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={orden.fecha_egreso ? orden.fecha_egreso.split('T')[0] : ''}
                  onChange={(e) => {
                    const dateValue = e.target.value;
                    const timeValue = orden.fecha_egreso ? orden.fecha_egreso.split('T')[1] || '00:00' : '00:00';
                    actualizarOrdenTrabajo(orden.id, 'fecha_egreso', dateValue ? `${dateValue}T${timeValue}` : '');
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-white pr-10 ${
                    fieldErrors.fecha_egreso 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-[#007C8A]'
                  }`}
                  style={{ 
                    fontFamily: 'Lato, sans-serif',
                    fontSize: '14px'
                  }}
                />
                <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#007C8A] pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              {fieldErrors[`fecha_egreso_${orden.id}`] && (
                <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                  {fieldErrors[`fecha_egreso_${orden.id}`]}
                </p>
              )}
            </div>

            {/* Subtítulo: Ejecución y tareas */}
            <div className="md:col-span-2 mt-6 mb-4">
              <h3 
                className="text-base font-bold"
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  color: '#1F2937'
                }}
              >
                Ejecución y tareas
              </h3>
              <p 
                className="text-sm mt-1"
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  color: '#6B7280'
                }}
              >
                Llenar los campos obligatorios.
              </p>
            </div>

            <div>
              <label 
                className="block text-sm font-medium mb-2"
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  color: '#374151'
                }}
              >
                Taller autorizado*
              </label>
              <input
                type="text"
                value={orden.taller_autorizado}
                onChange={(e) => actualizarOrdenTrabajo(orden.id, 'taller_autorizado', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                  fieldErrors.taller_autorizado 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-[#007C8A]'
                }`}
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  fontSize: '14px'
                }}
                placeholder="Ingresa el taller autorizado"
              />
              {fieldErrors[`taller_autorizado_${orden.id}`] && (
                <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                  {fieldErrors[`taller_autorizado_${orden.id}`]}
                </p>
              )}
            </div>

            <div>
              <label 
                className="block text-sm font-medium mb-2"
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  color: '#374151'
                }}
              >
                Definición del trabajo (categoría)*
              </label>
              <select
                value={orden.definicion_trabajo}
                onChange={(e) => actualizarOrdenTrabajo(orden.id, 'definicion_trabajo', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                  fieldErrors.definicion_trabajo 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-[#007C8A]'
                }`}
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  fontSize: '14px'
                }}
              >
                <option value="">Selecciona categoría</option>
                <option value="Carrocería">Carrocería</option>
                <option value="Gomería">Gomería</option>
                <option value="Motor">Motor</option>
                <option value="Frenos">Frenos</option>
                <option value="Electricidad/Electrónica">Electricidad/Electrónica</option>
                <option value="Otros">Otros</option>
              </select>
              {fieldErrors[`definicion_trabajo_${orden.id}`] && (
                <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                  {fieldErrors[`definicion_trabajo_${orden.id}`]}
                </p>
              )}
            </div>

            <div>
              <label 
                className="block text-sm font-medium mb-2"
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  color: '#374151'
                }}
              >
                Mecánico autorizado*
              </label>
              <input
                type="text"
                value={orden.mecanico_autorizado}
                onChange={(e) => actualizarOrdenTrabajo(orden.id, 'mecanico_autorizado', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                  fieldErrors.mecanico_autorizado 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-[#007C8A]'
                }`}
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  fontSize: '14px'
                }}
                placeholder="Ingresa el nombre del mecánico autorizado"
              />
              {fieldErrors[`mecanico_autorizado_${orden.id}`] && (
                <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                  {fieldErrors[`mecanico_autorizado_${orden.id}`]}
                </p>
              )}
            </div>

            <div>
              <label 
                className="block text-sm font-medium mb-2"
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  color: '#374151'
                }}
              >
                Tipo de mantenimiento*
              </label>
              <select
                value={orden.tipo_mantenimiento}
                onChange={(e) => actualizarOrdenTrabajo(orden.id, 'tipo_mantenimiento', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                  fieldErrors[`tipo_mantenimiento_${orden.id}`] 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-[#007C8A]'
                }`}
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  fontSize: '14px'
                }}
              >
                <option value="">Selecciona tipo de mantenimiento</option>
                {tiposMantenimiento && tiposMantenimiento.length > 0 ? (
                  tiposMantenimiento.map(tipo => (
                    <option key={tipo.id_tipo} value={tipo.id_tipo}>
                      {tipo.tipo || tipo.descripcion || 'Sin descripción'}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>Cargando tipos de mantenimiento...</option>
                )}
              </select>
              {fieldErrors[`tipo_mantenimiento_${orden.id}`] && (
                <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                  {fieldErrors[`tipo_mantenimiento_${orden.id}`]}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label 
                className="block text-sm font-medium mb-2"
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  color: '#374151'
                }}
              >
                Tarea (descripción detallada)*
              </label>
              <textarea
                value={orden.tarea_descripcion}
                onChange={(e) => actualizarOrdenTrabajo(orden.id, 'tarea_descripcion', e.target.value)}
                rows={3}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                  fieldErrors[`tarea_descripcion_${orden.id}`] 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-[#007C8A]'
                }`}
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  fontSize: '14px'
                }}
                placeholder="Ingresa la descripción detallada de la tarea"
              />
              {fieldErrors[`tarea_descripcion_${orden.id}`] && (
                <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                  {fieldErrors[`tarea_descripcion_${orden.id}`]}
                </p>
              )}
            </div>

            {/* Subtítulo: Detalle de insumos / artículos */}
            <div className="md:col-span-2 mt-6 mb-4">
              <h3 
                className="text-base font-bold"
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  color: '#1F2937'
                }}
              >
                Detalle de insumos / artículos
              </h3>
              <p 
                className="text-sm mt-1"
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  color: '#6B7280'
                }}
              >
                Llenar los campos obligatorios.
              </p>
            </div>
            
            {/* Contenedor de insumos que ocupa el 100% del ancho */}
            <div className="md:col-span-2 w-full" style={{ width: '100%' }}>
              {/* Lista de insumos - Cada insumo en una fila horizontal según imagen */}
              {insumosForm.map((insumo, index) => (
                <div key={insumo.id} className="mb-4 w-full">
                  {/* Primera fila: Campos del insumo */}
                  <div className="flex flex-nowrap gap-4 items-end w-full mb-4" style={{ width: '100%', maxWidth: '100%' }}>
                    {/* Código de artículo */}
                    <div 
                      ref={index === 0 ? codigoArtRef : null}
                      className="flex-1" 
                      style={{ flex: '1 1 auto', minWidth: 0 }}
                    >
                      <label 
                        className="block text-sm font-medium mb-2"
                        style={{ 
                          fontFamily: 'Lato, sans-serif',
                          color: '#374151'
                        }}
                      >
                        Codigo art*
                      </label>
                      <input
                        type="text"
                        value={insumo.codigo_articulo}
                        onChange={(e) => actualizarInsumo(insumo.id, 'codigo_articulo', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007C8A] bg-white"
                        style={{ 
                          fontFamily: 'Lato, sans-serif',
                          fontSize: '14px'
                        }}
                        placeholder="MP1-A1-000002356"
                      />
                    </div>

                    {/* Costo Unitario */}
                    <div 
                      ref={index === 0 ? costoUnitarioRef : null}
                      className="flex-1" 
                      style={{ flex: '1 1 auto', minWidth: 0 }}
                    >
                      <label 
                        className="block text-sm font-medium mb-2"
                        style={{ 
                          fontFamily: 'Lato, sans-serif',
                          color: '#374151'
                        }}
                      >
                        Costo unitario*
                      </label>
                      <input
                        type="text"
                        value={costoUnitarioFocused[insumo.id]
                          ? (insumo.costo_unitario || '') 
                          : (insumo.costo_unitario ? formatCurrency(insumo.costo_unitario) : '')
                        }
                        onChange={(e) => {
                          const inputValue = e.target.value;
                          // Permitir que el usuario escriba con formato (puntos y comas)
                          // Solo remover caracteres no numéricos excepto puntos y comas
                          const cleaned = inputValue.replace(/[^\d,.]/g, '');
                          // Guardar el valor tal como está (con formato) para que el usuario lo vea
                          // El cálculo se hará correctamente con cleanAndParseNumber
                          actualizarInsumo(insumo.id, 'costo_unitario', cleaned);
                        }}
                        onFocus={() => {
                          setCostoUnitarioFocused(prev => ({ ...prev, [insumo.id]: true }));
                        }}
                        onBlur={() => {
                          setCostoUnitarioFocused(prev => ({ ...prev, [insumo.id]: false }));
                          if (insumo.costo_unitario) {
                            // Limpiar y parsear correctamente el valor antes de guardarlo
                            const numValue = cleanAndParseNumber(insumo.costo_unitario);
                            actualizarInsumo(insumo.id, 'costo_unitario', String(numValue));
                          }
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007C8A] bg-white"
                        style={{ 
                          fontFamily: 'Lato, sans-serif',
                          fontSize: '14px'
                        }}
                        placeholder="250.000,00"
                      />
                    </div>

                    {/* Cantidad */}
                    <div 
                      ref={index === 0 ? cantidadRef : null}
                      className="flex-1" 
                      style={{ flex: '1 1 auto', minWidth: 0 }}
                    >
                      <label 
                        className="block text-sm font-medium mb-2"
                        style={{ 
                          fontFamily: 'Lato, sans-serif',
                          color: '#374151'
                        }}
                      >
                        cant*
                      </label>
                      <select
                        value={insumo.cantidad || '1'}
                        onChange={(e) => actualizarInsumo(insumo.id, 'cantidad', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007C8A] bg-white"
                        style={{ 
                          fontFamily: 'Lato, sans-serif',
                          fontSize: '14px'
                        }}
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 25, 30, 50, 100].map(num => (
                          <option key={num} value={String(num)}>{num}</option>
                        ))}
                      </select>
                    </div>

                    {/* SUBTOTAL - Al lado de cant */}
                    <div 
                      ref={index === 0 ? subtotalRef : null}
                      className="flex-1" 
                      style={{ flex: '1 1 auto', minWidth: 0 }}
                    >
                      <label 
                        className="block text-sm font-medium mb-2"
                        style={{ 
                          fontFamily: 'Lato, sans-serif',
                          color: '#374151'
                        }}
                      >
                        SUBTOTAL*
                      </label>
                      <input
                        type="text"
                        value={insumo.costo_total && parseFloat(insumo.costo_total) > 0 
                          ? formatCurrency(insumo.costo_total) 
                          : '$ 0,00'}
                        disabled
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                        style={{ 
                          fontFamily: 'Lato, sans-serif',
                          fontSize: '14px',
                          color: '#6B7280'
                        }}
                      />
                    </div>

                    {/* Botón: + AGREGAR solo en la primera fila, - Quitar en las demás */}
                    <div className="flex items-end flex-shrink-0">
                      {index === 0 ? (
                        <button
                          type="button"
                          onClick={agregarInsumo}
                          className="px-4 py-2 bg-[#007C8A] text-white rounded-lg hover:bg-[#005A63] transition-colors whitespace-nowrap flex items-center gap-2"
                          style={{ 
                            fontFamily: 'Lato, sans-serif',
                            fontSize: '14px',
                            fontWeight: '500'
                          }}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => eliminarInsumo(insumo.id)}
                          className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap flex items-center gap-2"
                          style={{ 
                            fontFamily: 'Lato, sans-serif',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#007C8A'
                          }}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#007C8A' }}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                          </svg>
                           
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* TOTAL - Siempre al pie, debajo de todas las filas, alineado con SUBTOTAL */}
              <div className="flex flex-nowrap gap-4 items-end w-full mt-4" style={{ width: '100%', maxWidth: '100%' }}>
                {/* Espaciadores para alinear con los campos de arriba - mismos anchos exactos */}
                <div 
                  data-espaciador="0"
                  style={{ 
                    flexShrink: 0,
                    width: codigoArtRef.current ? `${codigoArtRef.current.offsetWidth}px` : 'auto'
                  }}
                ></div>
                <div 
                  data-espaciador="1"
                  style={{ 
                    flexShrink: 0,
                    width: costoUnitarioRef.current ? `${costoUnitarioRef.current.offsetWidth}px` : 'auto'
                  }}
                ></div>
                <div 
                  data-espaciador="2"
                  style={{ 
                    flexShrink: 0,
                    width: cantidadRef.current ? `${cantidadRef.current.offsetWidth}px` : 'auto'
                  }}
                ></div>
                
                {/* TOTAL - Justo debajo de SUBTOTAL, mismo tamaño que SUBTOTAL */}
                <div 
                  ref={totalRef}
                  style={{ 
                    flexShrink: 0,
                    width: subtotalRef.current ? `${subtotalRef.current.offsetWidth}px` : 'auto'
                  }}
                >
                  <label 
                    className="block text-sm font-medium mb-2"
                    style={{ 
                      fontFamily: 'Lato, sans-serif',
                      color: '#374151'
                    }}
                  >
                    TOTAL
                  </label>
                  <input
                    type="text"
                    value={calcularTotalGeneral() > 0 
                      ? formatCurrency(calcularTotalGeneral()) 
                      : '$ 0,00'}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    style={{ 
                      fontFamily: 'Lato, sans-serif',
                      fontSize: '14px',
                      color: '#6B7280',
                      fontWeight: '600'
                    }}
                  />
                </div>
                
                {/* Espaciador para mantener alineación con el botón */}
                <div className="flex-shrink-0" style={{ width: 'auto' }}></div>
              </div>
            </div>
          </div>
        </div>
        ))}
      </div>

      {/* Botón Nueva orden de trabajo - Posicionado después de las órdenes */}
      <div className="px-3 sm:px-4 md:px-6 mb-6 flex justify-start">
        <button
          onClick={agregarOrdenTrabajo}
          disabled={isSubmitting}
          className="px-6 py-2 rounded-lg bg-[#007C8A] text-white transition-all hover:bg-[#005A63] disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            fontFamily: 'Lato, sans-serif',
            fontWeight: 'bold',
            fontSize: '14px'
          }}
        >
          Nueva orden de trabajo
        </button>
      </div>

      {/* Footer */}
      <div className="px-3 sm:px-4 md:px-6 py-4 border-t border-gray-200 bg-white flex items-center justify-between">
        <a 
          href="#" 
          className="text-[#007C8A] hover:underline"
          style={{ 
            fontFamily: 'Lato, sans-serif',
            fontSize: '14px'
          }}
        >
          Necesitas ayuda?
        </a>
        <div className="flex items-center gap-3">
          <button
            onClick={handleCancel}
            disabled={isSubmitting}
            className="px-6 py-2 rounded-lg border-2 border-[#007C8A] text-[#007C8A] transition-all hover:bg-[#007C8A] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              fontFamily: 'Lato, sans-serif',
              fontWeight: 'bold',
              fontSize: '14px'
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isSubmitting}
            className="px-6 py-2 rounded-lg bg-[#007C8A] text-white transition-all hover:bg-[#005A63] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              fontFamily: 'Lato, sans-serif',
              fontWeight: 'bold',
              fontSize: '14px'
            }}
          >
            {isSubmitting ? 'Generando DDJJ...' : 'Generar DDJJ'}
          </button>
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

      {/* Modal de carga masiva */}
      {showCargaMasivaModal && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backgroundColor: 'rgba(0, 124, 138, 0.5)' }}
          onClick={() => {
            if (!isProcessingFile) {
              setShowCargaMasivaModal(false);
              setCargaMasivaErrors([]);
              setCargaMasivaSuccess(0);
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
            }
          }}
        >
          <div 
            className="bg-white modal-content rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto"
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
              <div className="flex items-center justify-between">
                <div>
                  <h3 
                    className="text-xl font-bold"
                    style={{ 
                      color: '#1F2937'
                    }}
                  >
                    Carga masiva de órdenes de trabajo
                  </h3>
                  <p 
                    className="text-sm mt-1"
                    style={{ 
                      color: '#6B7280'
                    }}
                  >
                    Importe un archivo Excel con los datos de las órdenes de trabajo
                  </p>
                </div>
                {!isProcessingFile && (
                  <button
                    onClick={() => {
                      setShowCargaMasivaModal(false);
                      setCargaMasivaErrors([]);
                      setCargaMasivaSuccess(0);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Contenido del modal */}
            <div className="px-6 py-6">
              {/* Botón de descargar plantilla */}
              <div className="mb-6">
                <button
                  onClick={handleDownloadTemplate}
                  disabled={isProcessingFile}
                  className="w-full px-4 py-3 rounded-lg shadow-md flex items-center justify-center gap-2 transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: '#10B981',
                    color: '#FFFFFF',
                    fontFamily: 'Lato, sans-serif',
                    fontWeight: 'bold',
                    fontSize: '14px'
                  }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Descargar plantilla de datos
                </button>
              </div>

              {/* Input de archivo */}
              <div className="mb-6">
                <label 
                  className="block text-sm font-medium mb-2"
                  style={{ 
                    color: '#374151',
                    fontFamily: 'Lato, sans-serif'
                  }}
                >
                  Seleccionar archivo Excel
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      handleProcessExcelFile(file);
                    }
                  }}
                  disabled={isProcessingFile}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007C8A] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ fontFamily: 'Lato, sans-serif' }}
                />
                <p 
                  className="text-xs mt-2"
                  style={{ 
                    color: '#6B7280',
                    fontFamily: 'Lato, sans-serif'
                  }}
                >
                  Formatos soportados: .xlsx, .xls
                </p>
              </div>

              {/* Indicador de procesamiento */}
              {isProcessingFile && (
                <div className="mb-6 text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#007C8A]"></div>
                  <p 
                    className="mt-2 text-sm"
                    style={{ 
                      color: '#6B7280',
                      fontFamily: 'Lato, sans-serif'
                    }}
                  >
                    Procesando archivo...
                  </p>
                </div>
              )}

              {/* Informe de éxito */}
              {cargaMasivaSuccess > 0 && !isProcessingFile && (
                <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: '#E6FFE6', border: '1px solid #22C55E' }}>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p 
                      className="text-sm font-medium"
                      style={{ 
                        color: '#166534',
                        fontFamily: 'Lato, sans-serif'
                      }}
                    >
                      {cargaMasivaSuccess} orden(es) de trabajo cargada(s) exitosamente
                    </p>
                  </div>
                </div>
              )}

              {/* Informe de errores */}
              {cargaMasivaErrors.length > 0 && !isProcessingFile && (
                <div className="mb-6">
                  <div className="p-4 rounded-lg mb-4" style={{ backgroundColor: '#FEF2F2', border: '1px solid #EF4444' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <h4 
                        className="text-sm font-bold"
                        style={{ 
                          color: '#991B1B',
                          fontFamily: 'Lato, sans-serif'
                        }}
                      >
                        Errores encontrados ({cargaMasivaErrors.length})
                      </h4>
                    </div>
                    <div 
                      className="max-h-64 overflow-y-auto"
                      style={{ 
                        maxHeight: '256px'
                      }}
                    >
                      <ul className="list-disc list-inside space-y-1">
                        {cargaMasivaErrors.map((error, index) => (
                          <li 
                            key={index}
                            className="text-xs"
                            style={{ 
                              color: '#991B1B',
                              fontFamily: 'Lato, sans-serif'
                            }}
                          >
                            {error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NuevosDDJJ;
