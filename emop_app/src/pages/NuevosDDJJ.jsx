import { useState, useEffect, useRef } from 'react';
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
    marca: '',
    modelo: '',
    interno: '',
    numero_licencia: '',
    odometro: '',
    horometro: '',
    // Sección 2: Estado y vencimientos de unidad
    fecha_rto: '',
    fecha_vencimiento_seguro: '',
    tipo_seguro: 'Todo riesgo',
    posee_camaras: false,
    posee_aire_acondicionado: false,
    posee_calefaccion: false,
    posee_seguro: false,
    descripcion_siniestros: '',
    // Sección 3: Información de trabajo
    numero_orden_trabajo: '',
    fecha_orden_trabajo: '',
    fecha: '',
    taller: '',
    definicion_trabajo: '',
    mecanico_autorizado: '', // Cambiado de id_mecanico a texto simple
    tipo_mantenimiento: '',
    tarea_descripcion: '',
    codigo_articulo: '', // Cambiado de id_insumo a texto simple
    cantidad: '',
    costo_unitario: '', // Ahora editable
    costo_total: '', // Ahora editable
    descripcion_insumo: ''
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [showCargaMasivaModal, setShowCargaMasivaModal] = useState(false);
  const [cargaMasivaErrors, setCargaMasivaErrors] = useState([]);
  const [cargaMasivaSuccess, setCargaMasivaSuccess] = useState(0);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const fileInputRef = useRef(null);
  const vehiculoDropdownRef = useRef(null);
  const [costoUnitarioFocused, setCostoUnitarioFocused] = useState(false);

  // Detectar tamaño de pantalla
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
        setConductores(validConductores);
        setMecanicos(mecanicosFiltrados);
        setInsumos(validInsumos);
        setOrdenesTrabajo(ordenesFiltradas);
        setUsuarios(validUsuarios);
        setRoles(validRoles);
        setTiposMantenimiento(validTipos);

        // Generar número de orden de trabajo automático
        const siguienteNumero = generarSiguienteNumeroOrden(validOrdenes);
        setFormData(prev => ({
          ...prev,
          numero_orden_trabajo: siguienteNumero
        }));
      } catch (error) {
        console.error('Error al cargar datos:', error);
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

  // Función eliminada - ya no se usa selección de insumo desde tabla
  // Los campos codigo_articulo, costo_unitario, costo_total ahora son inputs de texto simples

  // Manejar selección de vehículo
  const handleVehiculoChange = (idVehiculo) => {
    const vehiculoId = parseInt(idVehiculo, 10);
    const vehiculo = vehiculos.find(v => v.id_vehiculo === vehiculoId);
    if (vehiculo) {
      // Obtener el conductor activo del vehículo
      let numeroLicencia = '';
      if (vehiculo.id_conductor_activo && conductores.length > 0) {
        const conductorId = parseInt(vehiculo.id_conductor_activo, 10);
        const conductor = conductores.find(c => {
          const cId = parseInt(c.id_conductor, 10);
          return cId === conductorId;
        });
        numeroLicencia = conductor?.numero_licencia || '';
      }

      setFormData(prev => ({
        ...prev,
        id_vehiculo: vehiculo.id_vehiculo,
        matricula: vehiculo.matricula || '',
        marca: vehiculo.marca || '',
        modelo: vehiculo.modelo || '',
        interno: vehiculo.interno || '',
        tipo_servicio: vehiculo.tipo_servicio || '',
        numero_licencia: numeroLicencia,
        odometro: vehiculo.kilometros ? String(vehiculo.kilometros) : '',
        horometro: vehiculo.horometro ? String(vehiculo.horometro) : '',
        fecha_rto: formatDateForInput(vehiculo.fecha_ultima_rto),
        fecha_vencimiento_seguro: formatDateForInput(vehiculo.fecha_vencimiento_seguro),
        tipo_seguro: vehiculo.tipo_seguro_cobertura || 'Todo riesgo',
        posee_camaras: vehiculo.posee_camara || false,
        posee_aire_acondicionado: vehiculo.posee_ac || false,
        posee_calefaccion: false, // Campo no existe en BD, se puede agregar después
        posee_seguro: vehiculo.fecha_vencimiento_seguro ? true : false
      }));
      setVehiculoSearchTerm(''); // Limpiar búsqueda después de seleccionar
    }
  };

  // Filtrar vehículos por término de búsqueda (matrícula o interno)
  const vehiculosFiltrados = vehiculos.filter(v => {
    if (!vehiculoSearchTerm) return true;
    const searchLower = vehiculoSearchTerm.toLowerCase();
    const matricula = (v.matricula || '').toLowerCase();
    const interno = (v.interno || '').toLowerCase();
    return matricula.includes(searchLower) || interno.includes(searchLower);
  });

  // Validar formulario
  const validateForm = () => {
    const errors = {};
    const requiredFields = [
      'id_vehiculo', 'tipo_servicio', 'marca', 'modelo', 'interno',
      'numero_orden_trabajo', 'fecha', 'fecha_orden_trabajo', 'odometro', 'horometro',
      'taller', 'definicion_trabajo', 'mecanico_autorizado', 'tarea_descripcion', 'tipo_mantenimiento',
      'codigo_articulo', 'cantidad', 'costo_unitario', 'costo_total', 'descripcion_insumo',
      'fecha_rto', 'fecha_vencimiento_seguro', 'tipo_seguro'
    ];

    // Mapeo de nombres de campos para mensajes de error
    const fieldNames = {
      'id_vehiculo': 'Vehículo',
      'tipo_servicio': 'Tipo de servicio',
      'marca': 'Marca',
      'modelo': 'Modelo',
      'interno': 'Interno',
      'numero_orden_trabajo': 'N° orden de trabajo',
      'fecha': 'Fecha Estimacion final',
      'fecha_orden_trabajo': 'Fecha de orden de trabajo',
      'odometro': 'Odómetro',
      'horometro': 'Horómetro',
      'taller': 'Taller autorizado',
      'definicion_trabajo': 'Definición del trabajo (categoría)',
      'mecanico_autorizado': 'Mecánico autorizado',
      'tarea_descripcion': 'Tarea (descripción detallada)',
      'tipo_mantenimiento': 'Tipo de mantenimiento',
      'codigo_articulo': 'Código de artículo',
      'cantidad': 'Cantidad',
      'costo_unitario': 'Costo Unitario',
      'costo_total': 'Costo total',
      'descripcion_insumo': 'Descripción (artículo/insumo utilizado)',
      'fecha_rto': 'Fecha RTO',
      'fecha_vencimiento_seguro': 'Fecha de vencimiento seguro',
      'tipo_seguro': 'Tipo de Seguro'
    };

    requiredFields.forEach(field => {
      const value = formData[field];
      // Para odometro y horometro, validar que existan valores numéricos
      if (field === 'odometro' || field === 'horometro') {
        if (!value || value.trim() === '' || isNaN(parseInt(value, 10))) {
          errors[field] = `${fieldNames[field] || field} es requerido`;
        }
      } else if (!value || (typeof value === 'string' && value.trim() === '')) {
        errors[field] = `${fieldNames[field] || field} es requerido`;
      }
    });

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setToast({
        type: 'error',
        title: 'Error de validación',
        message: 'Por favor complete todos los campos requeridos'
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

      // Convertir fechas a formato ISO
      const fechaGeneracion = formData.fecha_orden_trabajo && formData.fecha_orden_trabajo.trim() !== ''
        ? new Date(formData.fecha_orden_trabajo).toISOString() 
        : null;
      
      const fechaEgreso = formData.fecha && formData.fecha.trim() !== ''
        ? new Date(formData.fecha).toISOString() 
        : null;

      // Convertir odómetro y horómetro a números
      const odometroValue = formData.odometro 
        ? parseInt(formData.odometro, 10) 
        : 0;
      
      const horometroValue = formData.horometro 
        ? parseInt(formData.horometro, 10) 
        : 0;

      // Validar que el número de orden de trabajo no exista
      const ordenesExistentes = await getAllFromTable('orden_trabajo');
      const validOrdenesExistentes = Array.isArray(ordenesExistentes) ? ordenesExistentes : [];
      const numeroOrdenExiste = validOrdenesExistentes.some(
        o => o.nro_orden_trabajo === formData.numero_orden_trabajo.trim()
      );

      if (numeroOrdenExiste) {
        setToast({
          type: 'error',
          title: 'Error de validación',
          message: 'El número de orden de trabajo ya existe. Por favor ingrese otro número.'
        });
        setTimeout(() => setToast(null), 5000);
        setIsSubmitting(false);
        return;
      }

      // Validar que el número de orden sea consecutivo
      const numerosOrden = validOrdenesExistentes
        .map(o => {
          const nro = o.nro_orden_trabajo;
          // Intentar convertir a número si es posible
          if (nro && /^\d+$/.test(String(nro))) {
            return parseInt(String(nro), 10);
          }
          return null;
        })
        .filter(n => n !== null);
      
      if (numerosOrden.length > 0) {
        const maxNumero = Math.max(...numerosOrden);
        const numeroIngresado = parseInt(formData.numero_orden_trabajo.trim(), 10);
        
        // Si el número ingresado es numérico, validar consecutividad
        if (!isNaN(numeroIngresado)) {
          const siguienteEsperado = maxNumero + 1;
          if (numeroIngresado !== siguienteEsperado) {
            setToast({
              type: 'warning',
              title: 'Advertencia',
              message: `El número de orden debería ser ${siguienteEsperado} (siguiente consecutivo después de ${maxNumero}). ¿Desea continuar con ${numeroIngresado}?`
            });
            // No bloquear, solo advertir - el usuario puede continuar si lo desea
          }
        }
      }

      // Obtener la empresa del vehículo
      const idEmpresaVehiculo = vehiculoSeleccionado.id_empresa || idEmpresaUsuario || null;

      // PASO 1: Crear la DDJJ primero
      const ddjjExistentes = await getAllFromTable('declaracion_jurada').catch(() => []);
      const validDDJJExistentes = Array.isArray(ddjjExistentes) ? ddjjExistentes : [];
      const numeroDDJJ = generarNumeroDDJJ(validDDJJExistentes, fechaGeneracion);

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
        fecha_creacion: fechaGeneracion || new Date().toISOString(),
        estado: 'Pendiente'
      };

      const ddjjInsertada = await insertIntoTable('declaracion_jurada', ddjjData);
      
      if (!ddjjInsertada || !ddjjInsertada.id_ddjj) {
        throw new Error('No se pudo crear la Declaración Jurada');
      }

      const idDDJJ = ddjjInsertada.id_ddjj;

      // PASO 2: Crear la orden de trabajo asociada a la DDJJ
      const ordenTrabajoData = {
        id_vehiculo: parseInt(formData.id_vehiculo, 10),
        id_conductor: idConductor,
        id_tipo_mantenimiento: parseInt(formData.tipo_mantenimiento, 10),
        id_ddjj: idDDJJ, // Asociar la orden de trabajo a la DDJJ
        nro_orden_trabajo: formData.numero_orden_trabajo.trim(),
        fecha_generacion: fechaGeneracion,
        fecha_egreso: fechaEgreso,
        odometro: odometroValue,
        horometro: horometroValue,
        estado: 'Pendiente'
      };

      // Insertar orden de trabajo
      const ordenInsertada = await insertIntoTable('orden_trabajo', ordenTrabajoData);
      
      if (!ordenInsertada || !ordenInsertada.id_orden) {
        throw new Error('No se pudo crear la orden de trabajo');
      }

      const idOrdenTrabajo = ordenInsertada.id_orden;
      
      // Obtener información del vehículo y tipo de mantenimiento para el detalle
      const vehiculoInfo = vehiculos.find(v => v.id_vehiculo === parseInt(formData.id_vehiculo, 10));
      const tipoMantenimientoInfo = tiposMantenimiento.find(t => t.id_tipo === parseInt(formData.tipo_mantenimiento, 10));
      
      // Registrar auditoría para la DDJJ
      await registrarAuditoria({
        usuarioNombre: user?.nombre || 'Usuario desconocido',
        idUsuarioRef: user?.id_usuario || null,
        accion: 'CREAR',
        tipoRegistro: 'declaracion_jurada',
        idRegistro: idDDJJ,
        idMantenimientoRef: idDDJJ,
        detalle: `Carga DDJJ: N° DDJJ ${numeroDDJJ}, N° OT ${formData.numero_orden_trabajo.trim()}, Matrícula: ${vehiculoInfo?.matricula || 'N/A'}, Tipo: ${tipoMantenimientoInfo?.descripcion || 'N/A'}`
      });

      // Registrar auditoría para la orden de trabajo
      await registrarAuditoria({
        usuarioNombre: user?.nombre || 'Usuario desconocido',
        idUsuarioRef: user?.id_usuario || null,
        accion: 'CREAR',
        tipoRegistro: 'orden_trabajo',
        idRegistro: idOrdenTrabajo,
        idMantenimientoRef: idOrdenTrabajo,
        detalle: `Carga DDJJ: N° DDJJ ${numeroDDJJ}, N° OT ${formData.numero_orden_trabajo.trim()}, Matrícula: ${vehiculoInfo?.matricula || 'N/A'}, Tipo: ${tipoMantenimientoInfo?.descripcion || 'N/A'}`
      });

      // Mecánico autorizado ahora es texto simple, no se guarda en tabla
      // Los insumos ahora son texto simple, no se guardan en tabla
      // Se pueden guardar en observaciones o en un campo de texto adicional si es necesario

      // Mostrar mensaje de éxito
      setToast({
        type: 'success',
        title: 'DDJJ y Orden de trabajo creadas',
        message: `La DDJJ ${numeroDDJJ} y la orden de trabajo se han guardado correctamente`
      });
      setTimeout(() => {
        setToast(null);
        // Limpiar formulario y redirigir
        setFormData({
          empresa: '',
          id_vehiculo: '',
          matricula: '',
          tipo_servicio: '',
          marca: '',
          modelo: '',
          interno: '',
          numero_licencia: '',
          numero_orden_trabajo: '',
          fecha: '',
          fecha_orden_trabajo: '',
          odometro: '',
          horometro: '',
          inspector: '',
          auditor: '',
          observaciones: '',
          taller: '',
          definicion_trabajo: '',
          mecanico_autorizado: '',
          tarea_descripcion: '',
          tipo_mantenimiento: '',
          codigo_articulo: '',
          cantidad: '',
          costo_unitario: '',
          costo_total: '',
          descripcion_insumo: '',
          fecha_rto: '',
          fecha_vencimiento_seguro: '',
          tipo_seguro: 'Todo riesgo',
          posee_camaras: false,
          posee_aire_acondicionado: false,
          posee_calefaccion: false,
          posee_seguro: false,
          descripcion_siniestros: ''
        });
        setFieldErrors({});
        navigate('/home');
      }, 2000);
    } catch (error) {
      console.error('Error al guardar:', error);
      let errorMessage = 'Ocurrió un error al guardar la orden de trabajo';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.code === '23505' || error.code === 409) {
        errorMessage = 'El número de orden de trabajo ya existe. Por favor ingrese otro número.';
      } else if (error.message?.includes('duplicate')) {
        errorMessage = 'El número de orden de trabajo ya existe. Por favor ingrese otro número.';
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
        className="bg-[#007C8A] w-full mb-4 rounded-lg mt-4 sm:mt-6 flex items-center px-3 sm:px-4 lg:px-6"
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
            Formulario para dar de alta nuevos usuarios al sistema
          </p>
        </div>
      </div>

      {/* Botones y filtros de fecha debajo del banner */}
      <div className="px-3 sm:px-4 md:px-6 mb-6">
        {/* Contenedor con borde para rango de fechas y botones */}
        <div 
          className="rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-end justify-end gap-3"
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
              />
            </div>
          </div>

          {/* Botones */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={handleDownloadTemplate}
              disabled={isProcessingFile}
              className="px-4 py-2 rounded-lg shadow-md flex items-center justify-center gap-2 transition-all hover:shadow-lg whitespace-nowrap border border-[#007C8A]"
              style={{
                backgroundColor: '#FFFFFF',
                color: '#007C8A',
                fontFamily: 'Lato, sans-serif',
                fontWeight: 'bold',
                fontSize: '14px'
              }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span className="hidden sm:inline">Descargar plantilla</span>
              <span className="sm:hidden">Plantilla</span>
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
        </div>
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
                Empresa
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

            {/* Select de vehículos con búsqueda */}
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
                  value={vehiculoSearchTerm || (formData.id_vehiculo ? `${formData.matricula || ''} - ${formData.interno || ''}` : '')}
                  onChange={(e) => {
                    setVehiculoSearchTerm(e.target.value);
                    // Si el usuario está editando y ya hay un vehículo seleccionado, limpiar la selección
                    if (formData.id_vehiculo && e.target.value !== `${formData.matricula || ''} - ${formData.interno || ''}`) {
                      setFormData(prev => ({
                        ...prev,
                        id_vehiculo: '',
                        matricula: '',
                        marca: '',
                        modelo: '',
                        interno: '',
                        tipo_servicio: '',
                        numero_licencia: '',
                        odometro: '',
                        horometro: ''
                      }));
                    }
                  }}
                  onFocus={() => {
                    if (formData.id_vehiculo) {
                      setVehiculoSearchTerm('');
                    }
                  }}
                  placeholder="Buscar por matrícula o interno..."
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
              {vehiculoSearchTerm && vehiculosFiltrados.length > 0 && (
                <div className="mt-1 border border-gray-300 rounded-lg bg-white shadow-lg max-h-60 overflow-y-auto z-50 absolute w-full">
                  {vehiculosFiltrados.map(v => (
                    <div
                      key={v.id_vehiculo}
                      onClick={() => {
                        handleVehiculoChange(v.id_vehiculo);
                        setVehiculoSearchTerm('');
                      }}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                      style={{ fontFamily: 'Lato, sans-serif', fontSize: '14px' }}
                    >
                      <div className="font-medium" style={{ color: '#374151' }}>
                        {v.matricula || 'Sin matrícula'}
                      </div>
                      <div className="text-sm" style={{ color: '#6B7280' }}>
                        Interno: {v.interno || 'N/A'} | {v.marca || ''} {v.modelo || ''}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {vehiculoSearchTerm && vehiculosFiltrados.length === 0 && (
                <div className="mt-1 px-4 py-2 text-sm text-gray-500 border border-gray-300 rounded-lg bg-white z-50 absolute w-full">
                  No se encontraron vehículos
                </div>
              )}
              {!formData.id_vehiculo && !vehiculoSearchTerm && (
                <p className="mt-1 text-xs text-gray-500" style={{ fontFamily: 'Lato, sans-serif' }}>
                  Busca por matrícula o interno para seleccionar un vehículo
                </p>
              )}
              {formData.id_vehiculo && !vehiculoSearchTerm && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm font-medium text-green-800" style={{ fontFamily: 'Lato, sans-serif' }}>
                    ✓ Vehículo seleccionado: {formData.matricula} - {formData.interno}
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
                Marca*
              </label>
              <input
                type="text"
                value={formData.marca}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  fontSize: '14px',
                  color: '#6B7280'
                }}
                placeholder="Ingresa marca"
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
                Modelo*
              </label>
              <input
                type="text"
                value={formData.modelo}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  fontSize: '14px',
                  color: '#6B7280'
                }}
                placeholder="Ingresa modelo"
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
                Tipo de servicio*
              </label>
           <input
                type="text"
                value={formData.tipo_servicio}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  fontSize: '14px',
                  color: '#6B7280'
                }}
                placeholder="Tipo de servicio"
              />
              {fieldErrors.tipo_servicio && (
                <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                  {fieldErrors.tipo_servicio}
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
                Interno*
              </label>
              <input
                type="text"
                value={formData.interno}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  fontSize: '14px',
                  color: '#6B7280'
                }}
                placeholder="Ingresa interno"
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
                Licencia*
              </label>
              <input
                type="text"
                value={formData.numero_licencia}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  fontSize: '14px',
                  color: '#6B7280'
                }}
                placeholder="Número de licencia"
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
                value={formData.odometro ? `${formData.odometro} km` : ''}
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
                value={formData.horometro ? `${formData.horometro} hs` : ''}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  fontSize: '14px',
                  color: '#6B7280'
                }}
                placeholder="0 hs"
              />
            </div>
          </div>
        </div>

        {/* Sección 2: Estado y vencimientos de unidad */}
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
            Estado y vencimientos de unidad
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
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 pr-10"
                  style={{ 
                    fontFamily: 'Lato, sans-serif',
                    fontSize: '14px',
                    color: '#6B7280'
                  }}
                />
                <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#007C8A] pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              {fieldErrors.fecha_rto && (
                <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                  {fieldErrors.fecha_rto}
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
                Fecha de vencimiento seguro*
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={formData.fecha_vencimiento_seguro}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 pr-10"
                  style={{ 
                    fontFamily: 'Lato, sans-serif',
                    fontSize: '14px',
                    color: '#6B7280'
                  }}
                />
                <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#007C8A] pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              {fieldErrors.fecha_vencimiento_seguro && (
                <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                  {fieldErrors.fecha_vencimiento_seguro}
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
                Tipo de Seguro*
              </label>
              <input
                type="text"
                value={formData.tipo_seguro}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  fontSize: '14px',
                  color: '#6B7280'
                }}
                placeholder="Todo riesgo"
              />
              {fieldErrors.tipo_seguro && (
                <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                  {fieldErrors.tipo_seguro}
                </p>
              )}
            </div>

            {/* Checkboxes */}
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.posee_camaras}
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
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.posee_aire_acondicionado}
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
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.posee_calefaccion}
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
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.posee_seguro}
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
                placeholder="Ingresa la descripción de siniestros (opcional)"
              />
            </div>
          </div>
        </div>

        {/* Sección 3: Información de trabajo */}
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
                value={formData.numero_orden_trabajo}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  fontSize: '14px',
                  color: '#6B7280'
                }}
                placeholder="Generado automáticamente"
              />
              {fieldErrors.numero_orden_trabajo && (
                <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                  {fieldErrors.numero_orden_trabajo}
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
                  value={formData.fecha_orden_trabajo ? formData.fecha_orden_trabajo.split('T')[0] : ''}
                  onChange={(e) => {
                    const dateValue = e.target.value;
                    const timeValue = formData.fecha_orden_trabajo ? formData.fecha_orden_trabajo.split('T')[1] || '00:00' : '00:00';
                    handleChange('fecha_orden_trabajo', dateValue ? `${dateValue}T${timeValue}` : '');
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
              {fieldErrors.fecha_orden_trabajo && (
                <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                  {fieldErrors.fecha_orden_trabajo}
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
                  value={formData.fecha ? formData.fecha.split('T')[0] : ''}
                  onChange={(e) => {
                    const dateValue = e.target.value;
                    const timeValue = formData.fecha ? formData.fecha.split('T')[1] || '00:00' : '00:00';
                    handleChange('fecha', dateValue ? `${dateValue}T${timeValue}` : '');
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-white pr-10 ${
                    fieldErrors.fecha 
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
              {fieldErrors.fecha && (
                <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                  {fieldErrors.fecha}
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
                value={formData.taller}
                onChange={(e) => handleChange('taller', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                  fieldErrors.taller 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-[#007C8A]'
                }`}
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  fontSize: '14px'
                }}
                placeholder="Ingresa el taller autorizado"
              />
              {fieldErrors.taller && (
                <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                  {fieldErrors.taller}
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
                value={formData.definicion_trabajo}
                onChange={(e) => handleChange('definicion_trabajo', e.target.value)}
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
              {fieldErrors.definicion_trabajo && (
                <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                  {fieldErrors.definicion_trabajo}
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
                value={formData.mecanico_autorizado}
                onChange={(e) => handleChange('mecanico_autorizado', e.target.value)}
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
              {fieldErrors.mecanico_autorizado && (
                <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                  {fieldErrors.mecanico_autorizado}
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
                value={formData.tipo_mantenimiento}
                onChange={(e) => handleChange('tipo_mantenimiento', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                  fieldErrors.tipo_mantenimiento 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-[#007C8A]'
                }`}
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  fontSize: '14px'
                }}
              >
                <option value="">Selecciona tipo de mantenimiento</option>
                {tiposMantenimiento
                  .filter(tipo => tipo.id_tipo === 1 || tipo.id_tipo === 2)
                  .map(tipo => (
                    <option key={tipo.id_tipo} value={tipo.id_tipo}>
                      {tipo.descripcion}
                    </option>
                  ))}
              </select>
              {fieldErrors.tipo_mantenimiento && (
                <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                  {fieldErrors.tipo_mantenimiento}
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
                value={formData.tarea_descripcion}
                onChange={(e) => handleChange('tarea_descripcion', e.target.value)}
                rows={3}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                  fieldErrors.tarea_descripcion 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-[#007C8A]'
                }`}
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  fontSize: '14px'
                }}
                placeholder="Ingresa la descripción detallada de la tarea"
              />
              {fieldErrors.tarea_descripcion && (
                <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                  {fieldErrors.tarea_descripcion}
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
                Código de artículo*
              </label>
              <input
                type="text"
                value={formData.codigo_articulo}
                onChange={(e) => handleChange('codigo_articulo', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                  fieldErrors.codigo_articulo 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-[#007C8A]'
                }`}
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  fontSize: '14px'
                }}
                placeholder="Ingresa el código de artículo"
              />
              {fieldErrors.codigo_articulo && (
                <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                  {fieldErrors.codigo_articulo}
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
                Cantidad*
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={formData.cantidad}
                  onChange={(e) => handleChange('cantidad', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-white pr-10 ${
                    fieldErrors.cantidad 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-[#007C8A]'
                  }`}
                  style={{ 
                    fontFamily: 'Lato, sans-serif',
                    fontSize: '14px'
                  }}
                  placeholder="1"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              {fieldErrors.cantidad && (
                <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                  {fieldErrors.cantidad}
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
                Costo Unitario*
              </label>
              <input
                type="text"
                value={costoUnitarioFocused 
                  ? (formData.costo_unitario || '') 
                  : (formData.costo_unitario ? formatCurrency(formData.costo_unitario) : '')
                }
                onChange={(e) => {
                  // Permitir escribir solo números y punto/coma decimal
                  const inputValue = e.target.value;
                  // Permitir números, punto, coma y espacios en blanco (que se eliminarán)
                  const cleaned = inputValue.replace(/[^\d,.-]/g, '').replace(',', '.');
                  // Si hay múltiples puntos, mantener solo el primero
                  const parts = cleaned.split('.');
                  const finalValue = parts.length > 2 
                    ? parts[0] + '.' + parts.slice(1).join('')
                    : cleaned;
                  
                  handleChange('costo_unitario', finalValue);
                }}
                onFocus={() => {
                  setCostoUnitarioFocused(true);
                }}
                onBlur={() => {
                  setCostoUnitarioFocused(false);
                  // Asegurar que el valor sea numérico válido
                  if (formData.costo_unitario) {
                    const numValue = parseFloat(formData.costo_unitario) || 0;
                    handleChange('costo_unitario', String(numValue));
                  }
                }}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                  fieldErrors.costo_unitario 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-[#007C8A]'
                }`}
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  fontSize: '14px'
                }}
                placeholder="$ 0,00"
              />
              {fieldErrors.costo_unitario && (
                <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                  {fieldErrors.costo_unitario}
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
                Costo total*
              </label>
              <input
                type="text"
                value={formData.costo_total ? formatCurrency(formData.costo_total) : ''}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  fontSize: '14px',
                  color: '#6B7280'
                }}
                placeholder="$ 0,00"
              />
              {fieldErrors.costo_total && (
                <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                  {fieldErrors.costo_total}
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
                Descripción (artículo/insumo utilizado)*
              </label>
              <textarea
                value={formData.descripcion_insumo}
                onChange={(e) => handleChange('descripcion_insumo', e.target.value)}
                rows={3}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                  fieldErrors.descripcion_insumo 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-[#007C8A]'
                }`}
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  fontSize: '14px'
                }}
                placeholder="Ingresa la descripción del artículo/insumo utilizado (nota)"
              />
              {fieldErrors.descripcion_insumo && (
                <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                  {fieldErrors.descripcion_insumo}
                </p>
              )}
            </div>
          </div>

            {/* Botón + Insumos */}
            <div className="md:col-span-2 mt-4">
              <button
                type="button"
                className="px-4 py-2 bg-[#007C8A] text-white rounded-lg hover:bg-[#005A63] transition-colors font-medium text-sm flex items-center gap-2"
                style={{ fontFamily: 'Lato, sans-serif' }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                + Insumos
              </button>
            </div>
          </div>
        </div>
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
            Estado y vencimientos de unidad
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
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 pr-10"
                  style={{ 
                    fontFamily: 'Lato, sans-serif',
                    fontSize: '14px',
                    color: '#6B7280'
                  }}
                />
                <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#007C8A] pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              {fieldErrors.fecha_rto && (
                <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                  {fieldErrors.fecha_rto}
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
                Fecha de vencimiento seguro*
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={formData.fecha_vencimiento_seguro}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 pr-10"
                  style={{ 
                    fontFamily: 'Lato, sans-serif',
                    fontSize: '14px',
                    color: '#6B7280'
                  }}
                />
                <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#007C8A] pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              {fieldErrors.fecha_vencimiento_seguro && (
                <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                  {fieldErrors.fecha_vencimiento_seguro}
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
                Tipo de Seguro*
              </label>
              <input
                type="text"
                value={formData.tipo_seguro}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  fontSize: '14px',
                  color: '#6B7280'
                }}
                placeholder="Todo riesgo"
              />
              {fieldErrors.tipo_seguro && (
                <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                  {fieldErrors.tipo_seguro}
                </p>
              )}
            </div>

            {/* Checkboxes */}
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.posee_camaras}
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
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.posee_aire_acondicionado}
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
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.posee_calefaccion}
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
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.posee_seguro}
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
                placeholder="Ingresa la descripción de siniestros (opcional)"
              />
            </div>
          </div>
        </div>
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
            className="px-6 py-2 rounded-lg bg-gray-600 text-white transition-all hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              fontFamily: 'Lato, sans-serif',
              fontWeight: 'bold',
              fontSize: '14px'
            }}
          >
            {isSubmitting ? 'Generando reporte...' : 'Generar reporte'}
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
