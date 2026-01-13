import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { JSON_SERVER_URL } from '../config/api';
import * as XLSX from 'xlsx';
import { getAllFromTable, insertIntoTable, updateInTable, deleteFromTable, registrarAuditoria } from '../config/supabase';
import { useAuth } from '../context/AuthContext';

const Registros = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [vehiculos, setVehiculos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [empresasList, setEmpresasList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
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
  const [searchTerm, setSearchTerm] = useState('');
  const [searchTermUsuarios, setSearchTermUsuarios] = useState('');
  const [searchTermEmpresas, setSearchTermEmpresas] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageUsuarios, setCurrentPageUsuarios] = useState(1);
  const [currentPageEmpresas, setCurrentPageEmpresas] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [itemsPerPageUsuarios, setItemsPerPageUsuarios] = useState(10);
  const [itemsPerPageEmpresas, setItemsPerPageEmpresas] = useState(10);
  const [activeTab, setActiveTab] = useState('unidades');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [openMenuUsuarioId, setOpenMenuUsuarioId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showFormUsuario, setShowFormUsuario] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [empresas, setEmpresas] = useState([]);
  const [conductores, setConductores] = useState([]);
  const [roles, setRoles] = useState([]);
  const [ordenesTrabajo, setOrdenesTrabajo] = useState([]);
  const [tiposMantenimiento, setTiposMantenimiento] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingUsuario, setIsSubmittingUsuario] = useState(false);
  const [toast, setToast] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [fieldErrorsUsuario, setFieldErrorsUsuario] = useState({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingVehiculoId, setEditingVehiculoId] = useState(null);
  const [editingVehiculoJsonId, setEditingVehiculoJsonId] = useState(null);
  const [isEditModeUsuario, setIsEditModeUsuario] = useState(false);
  const [editingUsuarioId, setEditingUsuarioId] = useState(null);
  const [showFormEmpresa, setShowFormEmpresa] = useState(false);
  const [isEditModeEmpresa, setIsEditModeEmpresa] = useState(false);
  const [editingEmpresaId, setEditingEmpresaId] = useState(null);
  const [isSubmittingEmpresa, setIsSubmittingEmpresa] = useState(false);
  const [fieldErrorsEmpresa, setFieldErrorsEmpresa] = useState({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [vehiculoToDelete, setVehiculoToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteEmpresaModal, setShowDeleteEmpresaModal] = useState(false);
  const [empresaToDelete, setEmpresaToDelete] = useState(null);
  const [isDeletingEmpresa, setIsDeletingEmpresa] = useState(false);
  const [showCargaMasivaModal, setShowCargaMasivaModal] = useState(false);
  const [cargaMasivaErrors, setCargaMasivaErrors] = useState([]);
  const [cargaMasivaSuccess, setCargaMasivaSuccess] = useState(0);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [showCargaMasivaUsuarioModal, setShowCargaMasivaUsuarioModal] = useState(false);
  const [cargaMasivaUsuarioErrors, setCargaMasivaUsuarioErrors] = useState([]);
  const [cargaMasivaUsuarioSuccess, setCargaMasivaUsuarioSuccess] = useState(0);
  const [isProcessingUsuarioFile, setIsProcessingUsuarioFile] = useState(false);
  const [showCargaMasivaEmpresaModal, setShowCargaMasivaEmpresaModal] = useState(false);
  const [cargaMasivaEmpresaErrors, setCargaMasivaEmpresaErrors] = useState([]);
  const [cargaMasivaEmpresaSuccess, setCargaMasivaEmpresaSuccess] = useState(0);
  const [isProcessingEmpresaFile, setIsProcessingEmpresaFile] = useState(false);
  const menuRef = useRef(null);
  const menuUsuarioRef = useRef(null);
  const fileInputRef = useRef(null);
  const fileInputUsuarioRef = useRef(null);
  const fileInputEmpresaRef = useRef(null);
  
  // Estado del formulario de vehículos
  const [formData, setFormData] = useState({
    id_empresa: '',
    interno: '',
    matricula: '',
    marca: '',
    modelo: '',
    anio: '',
    kilometros: '',
    horometro: '',
    tipo_servicio: '',
    id_conductor_activo: '',
    activo: '',
    // booleanos como string para poder exigir selección (required)
    posee_ac: '',
    posee_camara: '',
    nombre_seguro: '',
    tipo_seguro_cobertura: 'Todo riesgo', // Pre-cargado con valor por defecto
    fecha_vencimiento_seguro: '',
    fecha_ultima_rto: ''
  });

  // Estado del formulario de usuarios
  const [formDataUsuario, setFormDataUsuario] = useState({
    nombre_completo: '',
    telefono: '',
    username: '',
    password_hash: '',
    dni: '',
    id_empresa: '',
    email: '',
    id_rol: '',
    activo: ''
  });

  // Estado del formulario de empresas
  const [formDataEmpresa, setFormDataEmpresa] = useState({
    nombre_empresa: '',
    codigo_empresa: '',
    telefono: '',
    cuit: '',
    email: ''
  });

  // Función para formatear número con separadores de miles
  const formatNumber = (num) => {
    return new Intl.NumberFormat('es-AR').format(num);
  };

  // Función para cargar datos de un vehículo en el formulario (modo edición)
  const handleEditVehiculo = (vehiculo) => {
    console.log('=== MODO EDICIÓN ===');
    console.log('Vehículo a editar:', vehiculo);
    
    // Formatear fechas para inputs de tipo date (YYYY-MM-DD)
    const formatDateForInput = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    setFormData({
      id_empresa: String(vehiculo.id_empresa || ''),
      interno: vehiculo.interno || '',
      matricula: vehiculo.matricula || '',
      marca: vehiculo.marca || '',
      modelo: vehiculo.modelo || '',
      anio: String(vehiculo.anio || ''),
      kilometros: String(vehiculo.kilometros || ''),
      horometro: String(vehiculo.horometro || ''),
      tipo_servicio: vehiculo.tipo_servicio || '',
      id_conductor_activo: String(vehiculo.id_conductor_activo || ''),
      activo: String(vehiculo.activo || ''),
      posee_ac: String(vehiculo.posee_ac || ''),
      posee_camara: String(vehiculo.posee_camara || ''),
      nombre_seguro: vehiculo.nombre_seguro || '',
      tipo_seguro_cobertura: vehiculo.tipo_seguro_cobertura || 'Todo riesgo', // Valor por defecto si no existe
      fecha_vencimiento_seguro: formatDateForInput(vehiculo.fecha_vencimiento_seguro),
      fecha_ultima_rto: formatDateForInput(vehiculo.fecha_ultima_rto)
    });

    setIsEditMode(true);
    setEditingVehiculoId(vehiculo.id_vehiculo);
    // Guardar el 'id' de json-server (puede ser diferente de id_vehiculo)
    // json-server usa 'id' como clave primaria, si no existe lo genera automáticamente
    const jsonServerId = vehiculo.id || vehiculo.id_vehiculo;
    setEditingVehiculoJsonId(jsonServerId);
    console.log('ID guardado para edición:', {
      id_vehiculo: vehiculo.id_vehiculo,
      id_json_server: jsonServerId,
      vehiculo_completo: vehiculo
    });
    setShowForm(true);
    setFieldErrors({});
    setOpenMenuId(null);
    
    // Scroll al formulario
    setTimeout(() => {
      const formElement = document.querySelector('[data-form-section]');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Función para eliminar vehículo
  const handleDeleteVehiculo = async () => {
    if (!vehiculoToDelete) return;

    setIsDeleting(true);
    console.log('=== ELIMINANDO VEHÍCULO ===');
    console.log('ID del vehículo:', vehiculoToDelete.id_vehiculo);
    console.log('Vehículo completo:', vehiculoToDelete);

    try {
      // Usar Supabase para eliminar
      const idToDelete = vehiculoToDelete.id || vehiculoToDelete.id_vehiculo;
      
      // Obtener información de la empresa antes de eliminar
      const empresaInfo = empresas.find(e => e.id_empresa === vehiculoToDelete.id_empresa);
      
      await deleteFromTable('vehiculo', idToDelete);
      
      // Registrar auditoría para eliminación
      await registrarAuditoria({
        usuarioNombre: user?.nombre_completo || user?.nombre || 'Usuario desconocido',
        idUsuarioRef: user?.id_usuario || null,
        accion: 'ELIMINAR',
        tipoRegistro: 'vehiculo',
        idRegistro: vehiculoToDelete.id_vehiculo,
        detalle: `Eliminación de vehículo: Matrícula ${vehiculoToDelete.matricula || 'N/A'}, Interno ${vehiculoToDelete.interno || 'N/A'}, Empresa: ${empresaInfo?.nombre_empresa || 'N/A'}`
      });

      // Éxito: mostrar notificación
      setToast({
        type: 'success',
        title: 'Vehículo eliminado',
        message: `El vehículo ${vehiculoToDelete.matricula || vehiculoToDelete.interno} ha sido eliminado exitosamente`
      });

      // Cerrar modal
      setShowDeleteModal(false);
      setVehiculoToDelete(null);

      // Recargar lista de vehículos, órdenes de trabajo y tipos de mantenimiento
      const [vehiculosData, ordenesData, tiposData] = await Promise.all([
        getAllFromTable('vehiculo'),
        getAllFromTable('orden_trabajo'),
        getAllFromTable('tipo_mantenimiento')
      ]);
      setVehiculos(Array.isArray(vehiculosData) ? vehiculosData : []);
      setOrdenesTrabajo(Array.isArray(ordenesData) ? ordenesData : []);
      setTiposMantenimiento(Array.isArray(tiposData) ? tiposData : []);

      // Auto-cerrar la alerta después de 5 segundos
      setTimeout(() => {
        setToast(null);
      }, 5000);

    } catch (error) {
      console.error('Error al eliminar vehículo:', error);
      setToast({
        type: 'error',
        title: 'Error al eliminar vehículo',
        message: error.message || 'Ocurrió un error al intentar eliminar el vehículo. Por favor intente nuevamente.'
      });
      
      // Auto-cerrar la alerta de error después de 5 segundos
      setTimeout(() => {
        setToast(null);
      }, 5000);
    } finally {
      setIsDeleting(false);
    }
  };

  // Función para crear o actualizar vehículo
  const handleCreateVehiculo = async () => {
    const parseBoolean = (value) => value === 'true';

    // Mapeo de campos a nombres legibles
    const fieldNames = {
      'id_empresa': 'Empresa',
      'interno': 'N° de interno',
      'matricula': 'Matrícula / Patente',
      'marca': 'Marca',
      'modelo': 'Modelo',
      'anio': 'Año',
      'kilometros': 'Kilómetros / Odómetro',
      'horometro': 'Horómetro',
      'tipo_servicio': 'Tipo de servicio',
      'id_conductor_activo': 'Conductor asignado',
      'activo': 'Activo',
      'posee_ac': 'Posee aire acondicionado (AC)',
      'posee_camara': 'Posee cámara',
      'nombre_seguro': 'Nombre de seguro',
      'tipo_seguro_cobertura': 'Tipo de seguro / cobertura',
      'fecha_vencimiento_seguro': 'Fecha de vencimiento del seguro',
      'fecha_ultima_rto': 'Fecha última RTO'
    };

    // Validar campos requeridos
    const requiredFields = [
      'id_empresa',
      'interno',
      'matricula',
      'marca',
      'modelo',
      'anio',
      'kilometros',
      'tipo_servicio',
      'id_conductor_activo',
      'activo',
      'posee_ac',
      'posee_camara',
      'nombre_seguro',
      'tipo_seguro_cobertura',
      'fecha_vencimiento_seguro',
      'fecha_ultima_rto'
    ];

    // Validar cada campo y guardar errores
    const errors = {};
    const camposFaltantes = [];

    requiredFields.forEach((field) => {
      const value = formData[field];
      const isEmpty = value === undefined || value === null || String(value).trim() === '';
      
      if (isEmpty) {
        errors[field] = `${fieldNames[field]} es requerido`;
        camposFaltantes.push(fieldNames[field]);
      }
    });

    // Logs detallados para debugging
    console.log('=== VALIDACIÓN DE FORMULARIO ===');
    console.log('FormData completo:', formData);
    console.log('Campos faltantes:', camposFaltantes);
    console.log('Errores por campo:', errors);
    console.log('Total de campos requeridos:', requiredFields.length);
    console.log('Total de campos con errores:', Object.keys(errors).length);

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setToast({
        type: 'error',
        title: isEditMode ? 'Error al actualizar registro' : 'Error al crear registro',
        message: `Por favor complete los siguientes campos: ${camposFaltantes.join(', ')}`
      });
      
      // Scroll al primer campo con error
      const firstErrorField = Object.keys(errors)[0];
      const errorElement = document.querySelector(`[name="${firstErrorField}"], [data-field="${firstErrorField}"]`);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        errorElement.focus();
      }
      
      return;
    }

    // Limpiar errores si la validación pasa
    setFieldErrors({});

    setIsSubmitting(true);

    try {
      // Obtener el último ID de vehículo para calcular el siguiente usando Supabase
      const vehiculosExistentes = await getAllFromTable('vehiculo');
      const ultimoId = vehiculosExistentes.length > 0 
        ? Math.max(...vehiculosExistentes.map(v => v.id_vehiculo || 0))
        : 0;
      // Si estamos en modo edición, usar el ID existente, sino crear uno nuevo
      let vehiculoData;
      
      if (isEditMode && editingVehiculoId && editingVehiculoJsonId) {
        // Modo edición: actualizar vehículo existente
        console.log('=== ACTUALIZANDO VEHÍCULO ===');
        console.log('ID del vehículo (id_vehiculo):', editingVehiculoId);
        console.log('ID de json-server:', editingVehiculoJsonId);
        
        // Usar el ID de json-server que guardamos al cargar el formulario
        const idJsonServer = editingVehiculoJsonId;
        
        // Verificar que el vehículo existe
        const vehiculoExistente = vehiculosExistentes.find(v => 
          (v.id === idJsonServer) || (v.id_vehiculo === editingVehiculoId && v.id === idJsonServer)
        );
        
        if (!vehiculoExistente) {
          console.error('Vehículo no encontrado:', { idJsonServer, editingVehiculoId });
          throw new Error('Vehículo no encontrado. Por favor recargue la página.');
        }
        
        console.log('Vehículo encontrado:', vehiculoExistente);
        
        vehiculoData = {
          id: idJsonServer,
          id_vehiculo: editingVehiculoId,
        id_empresa: parseInt(formData.id_empresa, 10),
        interno: formData.interno.trim(),
        matricula: formData.matricula.trim(),
        marca: formData.marca.trim(),
        modelo: formData.modelo.trim(),
        anio: parseInt(formData.anio, 10),
        kilometros: parseInt(formData.kilometros, 10),
        horometro: parseInt(formData.horometro || '0', 10),
        tipo_servicio: formData.tipo_servicio,
        nombre_seguro: formData.nombre_seguro.trim(),
        tipo_seguro_cobertura: formData.tipo_seguro_cobertura,
        fecha_vencimiento_seguro: new Date(formData.fecha_vencimiento_seguro).toISOString(),
        fecha_ultima_rto: new Date(formData.fecha_ultima_rto).toISOString(),
        id_conductor_activo: parseInt(formData.id_conductor_activo, 10),
        activo: parseBoolean(formData.activo),
        posee_ac: parseBoolean(formData.posee_ac),
        posee_camara: parseBoolean(formData.posee_camara),
          equipamiento_atributos: {}
        };
      } else {
        // Modo creación: crear nuevo vehículo
        const nuevoIdVehiculo = ultimoId + 1;
        
        // Para json-server, el 'id' puede ser diferente del 'id_vehiculo'
        // Calculamos el próximo 'id' basándonos en los IDs existentes de json-server
        const ultimoIdJsonServer = vehiculosExistentes.length > 0
          ? Math.max(...vehiculosExistentes.map(v => v.id || 0))
          : 0;
        const nuevoIdJsonServer = ultimoIdJsonServer + 1;
        
        vehiculoData = {
          id: nuevoIdJsonServer, // Campo requerido por json-server
          id_vehiculo: nuevoIdVehiculo,
          id_empresa: parseInt(formData.id_empresa, 10),
          interno: formData.interno.trim(),
          matricula: formData.matricula.trim(),
          marca: formData.marca.trim(),
          modelo: formData.modelo.trim(),
          anio: parseInt(formData.anio, 10),
          kilometros: parseInt(formData.kilometros, 10),
          horometro: parseInt(formData.horometro || '0', 10),
          tipo_servicio: formData.tipo_servicio,
          nombre_seguro: formData.nombre_seguro.trim(),
          tipo_seguro_cobertura: formData.tipo_seguro_cobertura,
          fecha_vencimiento_seguro: new Date(formData.fecha_vencimiento_seguro).toISOString(),
          fecha_ultima_rto: new Date(formData.fecha_ultima_rto).toISOString(),
          id_conductor_activo: parseInt(formData.id_conductor_activo, 10),
          activo: parseBoolean(formData.activo),
          posee_ac: parseBoolean(formData.posee_ac),
          posee_camara: parseBoolean(formData.posee_camara),
          equipamiento_atributos: {}
        };
      }

      console.log('=== ENVIANDO DATOS ===');
      console.log('Modo:', isEditMode ? 'ACTUALIZAR' : 'CREAR');
      console.log('ID usado:', isEditMode ? editingVehiculoJsonId : 'N/A (POST)');
      console.log('Datos completos:', vehiculoData);

      // Usar Supabase para crear o actualizar
      if (isEditMode) {
        await updateInTable('vehiculo', editingVehiculoJsonId, vehiculoData);
        
        // Registrar auditoría para actualización
        const empresaInfo = empresas.find(e => e.id_empresa === parseInt(formData.id_empresa, 10));
        await registrarAuditoria({
          usuarioNombre: user?.nombre_completo || user?.nombre || 'Usuario desconocido',
          idUsuarioRef: user?.id_usuario || null,
          accion: 'ACTUALIZAR',
          tipoRegistro: 'vehiculo',
          idRegistro: editingVehiculoId,
          detalle: `Actualización de vehículo: Matrícula ${formData.matricula.trim()}, Interno ${formData.interno.trim()}, Empresa: ${empresaInfo?.nombre_empresa || 'N/A'}, Marca: ${formData.marca.trim()}, Modelo: ${formData.modelo.trim()}`
        });
      } else {
        await insertIntoTable('vehiculo', vehiculoData);
        
        // Registrar auditoría para creación
        const empresaInfo = empresas.find(e => e.id_empresa === parseInt(formData.id_empresa, 10));
        await registrarAuditoria({
          usuarioNombre: user?.nombre_completo || user?.nombre || 'Usuario desconocido',
          idUsuarioRef: user?.id_usuario || null,
          accion: 'CREAR',
          tipoRegistro: 'vehiculo',
          idRegistro: vehiculoData.id_vehiculo,
          detalle: `Alta de vehículo: Matrícula ${formData.matricula.trim()}, Interno ${formData.interno.trim()}, Empresa: ${empresaInfo?.nombre_empresa || 'N/A'}, Marca: ${formData.marca.trim()}, Modelo: ${formData.modelo.trim()}`
        });
      }

      // Éxito: mostrar alerta y recargar datos
      setToast({
        type: 'success',
        title: isEditMode ? 'Vehículo actualizado' : 'Nuevo registro creado',
        message: isEditMode 
          ? 'El vehículo ha sido actualizado exitosamente'
          : 'Se ha creado una Nueva Unidad exitosamente'
      });

      // Recargar lista de vehículos, órdenes de trabajo y tipos de mantenimiento
      const [vehiculosData, ordenesData, tiposData] = await Promise.all([
        getAllFromTable('vehiculo'),
        getAllFromTable('orden_trabajo'),
        getAllFromTable('tipo_mantenimiento')
      ]);
      setVehiculos(Array.isArray(vehiculosData) ? vehiculosData : []);
      setOrdenesTrabajo(Array.isArray(ordenesData) ? ordenesData : []);
      setTiposMantenimiento(Array.isArray(tiposData) ? tiposData : []);

      // Cerrar formulario y resetear
      setShowForm(false);
      setIsEditMode(false);
      setEditingVehiculoId(null);
      setFieldErrors({});
      setFormData({
        id_empresa: '',
        interno: '',
        matricula: '',
        marca: '',
        modelo: '',
        anio: '',
        kilometros: '',
        tipo_servicio: '',
        id_conductor_activo: '',
        activo: '',
        posee_ac: '',
        posee_camara: '',
        nombre_seguro: '',
        tipo_seguro_cobertura: 'Todo riesgo', // Pre-cargado
        fecha_vencimiento_seguro: '',
        fecha_ultima_rto: ''
      });

      // Auto-cerrar la alerta después de 5 segundos
      setTimeout(() => {
        setToast(null);
      }, 5000);

    } catch (error) {
      console.error('Error al crear vehículo:', error);
      setToast({
        type: 'error',
        title: isEditMode ? 'Error al actualizar vehículo' : 'Error al crear registro',
        message: error.message || `Ocurrió un error al intentar ${isEditMode ? 'actualizar' : 'crear'} el vehículo. Por favor intente nuevamente.`
      });
      
      // Auto-cerrar la alerta de error después de 5 segundos
      setTimeout(() => {
        setToast(null);
      }, 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Función para editar usuario
  const handleEditarUsuario = (usuario) => {
    setFormDataUsuario({
      nombre_completo: usuario.nombre_completo || '',
      telefono: usuario.telefono || '',
      username: usuario.username || '',
      password_hash: '', // No mostrar la contraseña
      dni: usuario.dni || '',
      id_empresa: usuario.id_empresa ? String(usuario.id_empresa) : '',
      email: usuario.email || '',
      id_rol: usuario.id_rol ? String(usuario.id_rol) : '',
      activo: usuario.activo !== undefined ? String(usuario.activo) : 'true'
    });

    setIsEditModeUsuario(true);
    setEditingUsuarioId(usuario.id_usuario);
    setShowFormUsuario(true);
    setFieldErrorsUsuario({});
    setOpenMenuUsuarioId(null);
    
    // Scroll al formulario
    setTimeout(() => {
      const formElement = document.querySelector('[data-form-section]');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Función para crear o actualizar usuario
  const handleCreateUsuario = async () => {
    // Mapeo de campos a nombres legibles
    const fieldNames = {
      'nombre_completo': 'Nombre completo',
      'telefono': 'Teléfono',
      'username': 'Nombre de usuario autorizado',
      'password_hash': 'Contraseña',
      'dni': 'DNI',
      'email': 'E-Mail',
      'id_rol': 'Rol'
    };

    // Asegurar que username esté sincronizado con email antes de validar
    const emailValue = formDataUsuario.email ? formDataUsuario.email.trim() : '';
    const usernameValue = formDataUsuario.username ? formDataUsuario.username.trim() : '';
    const finalUsername = usernameValue || emailValue;
    
    // Si username está vacío pero email tiene valor, sincronizar antes de validar
    if (!usernameValue && emailValue) {
      setFormDataUsuario({ ...formDataUsuario, username: emailValue });
    }

    // Validar campos requeridos (id_empresa es opcional, puede ser null)
    // En modo edición, password_hash es opcional (solo se actualiza si se proporciona)
    const requiredFields = [
      'nombre_completo',
      'telefono',
      'dni',
      'email',
      'id_rol'
    ];

    // Si no está en modo edición, password_hash es requerido
    if (!isEditModeUsuario) {
      requiredFields.push('password_hash');
    }

    // Validar cada campo y guardar errores
    const errors = {};
    const camposFaltantes = [];

    // Validar email (username se valida junto con email ya que se sincroniza)
    if (!emailValue) {
      errors['email'] = `${fieldNames['email']} es requerido`;
      camposFaltantes.push(fieldNames['email']);
      // También marcar username como error si email está vacío
      errors['username'] = `${fieldNames['username']} es requerido`;
    }

    // Validar el resto de campos requeridos
    requiredFields.forEach((field) => {
      // Saltar email porque ya lo validamos arriba
      if (field === 'email') return;
      
      const value = formDataUsuario[field];
      const isEmpty = value === undefined || value === null || String(value).trim() === '';
      
      if (isEmpty) {
        errors[field] = `${fieldNames[field]} es requerido`;
        camposFaltantes.push(fieldNames[field]);
      }
    });

    // Logs detallados para debugging
    console.log('=== VALIDACIÓN DE FORMULARIO USUARIO ===');
    console.log('FormDataUsuario completo:', formDataUsuario);
    console.log('Campos faltantes:', camposFaltantes);
    console.log('Errores por campo:', errors);

    if (Object.keys(errors).length > 0) {
      setFieldErrorsUsuario(errors);
      setToast({
        type: 'error',
        title: 'Error al crear usuario',
        message: `Por favor complete los siguientes campos: ${camposFaltantes.join(', ')}`
      });
      
      // Scroll al primer campo con error
      const firstErrorField = Object.keys(errors)[0];
      const errorElement = document.querySelector(`[name="${firstErrorField}"], [data-field="${firstErrorField}"]`);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        errorElement.focus();
      }
      
      return;
    }

    // Limpiar errores si la validación pasa
    setFieldErrorsUsuario({});

    setIsSubmittingUsuario(true);

    try {
      // Generar id_rol aleatorio entre 2 y 4
      const idRolAleatorio = Math.floor(Math.random() * 3) + 2; // 2, 3 o 4

      // Determinar id_rol
      const idRolFinal = formDataUsuario.id_rol ? parseInt(formDataUsuario.id_rol, 10) : idRolAleatorio;
      
      // Si el rol es ADMIN (1), Inspector (3) o Auditor (4), forzar id_empresa a null
      const shouldDisableEmpresa = idRolFinal === 1 || idRolFinal === 3 || idRolFinal === 4;
      const idEmpresaFinal = shouldDisableEmpresa 
        ? null 
        : (formDataUsuario.id_empresa ? parseInt(formDataUsuario.id_empresa, 10) : null);

      // Asegurar que username tenga valor (debe estar sincronizado con email)
      const emailTrimmed = formDataUsuario.email.trim();
      const usernameTrimmed = formDataUsuario.username ? formDataUsuario.username.trim() : '';
      const finalUsernameValue = usernameTrimmed || emailTrimmed;

      // Crear objeto de usuario
      // Supabase genera automáticamente id_usuario (SERIAL), no necesitamos enviarlo
      const usuarioData = {
        username: finalUsernameValue,
        email: emailTrimmed,
        password_hash: formDataUsuario.password_hash.trim(),
        activo: isEditModeUsuario 
          ? (formDataUsuario.activo === 'true' ? true : formDataUsuario.activo === 'false' ? false : true)
          : true, // Por defecto true en creación
        id_rol: idRolFinal,
        id_empresa: idEmpresaFinal,
        nombre_completo: formDataUsuario.nombre_completo.trim(),
        dni: formDataUsuario.dni.trim(),
        telefono: formDataUsuario.telefono.trim()
      };

      if (isEditModeUsuario && editingUsuarioId) {
        // Modo edición: actualizar usuario existente
        console.log('=== ACTUALIZANDO USUARIO ===');
        console.log('ID del usuario:', editingUsuarioId);
        console.log('Usuario data:', usuarioData);

        // Preparar datos para actualización (solo incluir password_hash si se proporcionó)
        const updateData = {
          username: usuarioData.username,
          email: usuarioData.email,
          id_rol: usuarioData.id_rol,
          id_empresa: usuarioData.id_empresa,
          nombre_completo: usuarioData.nombre_completo,
          dni: usuarioData.dni,
          telefono: usuarioData.telefono,
          activo: formDataUsuario.activo === 'true' ? true : formDataUsuario.activo === 'false' ? false : usuarioData.activo
        };

        // Solo actualizar password si se proporcionó uno nuevo
        if (formDataUsuario.password_hash && formDataUsuario.password_hash.trim() !== '') {
          updateData.password_hash = formDataUsuario.password_hash.trim();
        }

        // Usar Supabase para actualizar usuario
        await updateInTable('usuario', editingUsuarioId, updateData);

        // Registrar auditoría para actualización
        await registrarAuditoria({
          usuarioNombre: user?.nombre_completo || user?.nombre || 'Usuario desconocido',
          idUsuarioRef: user?.id_usuario || null,
          accion: 'ACTUALIZAR',
          tipoRegistro: 'usuario',
          idRegistro: editingUsuarioId,
          detalle: `Actualización de usuario: ${usuarioData.nombre_completo} (${usuarioData.email})`
        });

        // Éxito: mostrar notificación
        setToast({
          type: 'success',
          title: 'Usuario actualizado',
          message: `El usuario ${formDataUsuario.nombre_completo} ha sido actualizado exitosamente`
        });
      } else {
        // Modo creación: crear nuevo usuario
        console.log('=== CREANDO USUARIO ===');
        console.log('Usuario data:', usuarioData);

        // Usar Supabase para crear usuario
        await insertIntoTable('usuario', usuarioData);

        // Registrar auditoría para creación
        const nuevoUsuario = await getAllFromTable('usuario');
        const usuarioCreado = Array.isArray(nuevoUsuario) 
          ? nuevoUsuario.find(u => u.email === usuarioData.email && u.username === usuarioData.username)
          : null;

        if (usuarioCreado) {
          await registrarAuditoria({
            usuarioNombre: user?.nombre_completo || user?.nombre || 'Usuario desconocido',
            idUsuarioRef: user?.id_usuario || null,
            accion: 'CREAR',
            tipoRegistro: 'usuario',
            idRegistro: usuarioCreado.id_usuario,
            detalle: `Creación de usuario: ${usuarioData.nombre_completo} (${usuarioData.email})`
          });
        }

        // Éxito: mostrar notificación
        setToast({
          type: 'success',
          title: 'Usuario creado',
          message: `El usuario ${formDataUsuario.nombre_completo} ha sido creado exitosamente`
        });
      }

      // Recargar lista de usuarios
      const usuariosData = await getAllFromTable('usuario');
      setUsuarios(Array.isArray(usuariosData) ? usuariosData : []);

      // Cerrar formulario y resetear
      setShowFormUsuario(false);
      setShowPassword(false);
      setIsEditModeUsuario(false);
      setEditingUsuarioId(null);
      setFieldErrorsUsuario({});
      setFormDataUsuario({
        nombre_completo: '',
        telefono: '',
        username: '',
        password_hash: '',
        dni: '',
        id_empresa: '',
        email: '',
        id_rol: '',
        activo: ''
      });

      // Auto-cerrar la alerta después de 5 segundos
      setTimeout(() => {
        setToast(null);
      }, 5000);

    } catch (error) {
      console.error('Error al crear usuario:', error);
      setToast({
        type: 'error',
        title: 'Error al crear usuario',
        message: error.message || 'Ocurrió un error al intentar crear el usuario. Por favor intente nuevamente.'
      });
      
      // Auto-cerrar la alerta de error después de 5 segundos
      setTimeout(() => {
        setToast(null);
      }, 5000);
    } finally {
      setIsSubmittingUsuario(false);
    }
  };

  // Función para editar empresa
  const handleEditarEmpresa = (empresa) => {
    setFormDataEmpresa({
      nombre_empresa: empresa.nombre_empresa || empresa.nombre || '',
      codigo_empresa: empresa.codigo_empresa || '',
      telefono: empresa.telefono || '',
      cuit: empresa.cuit || '',
      email: empresa.email || ''
    });

    setIsEditModeEmpresa(true);
    setEditingEmpresaId(empresa.id_empresa);
    setShowFormEmpresa(true);
    setFieldErrorsEmpresa({});
    
    // Scroll al formulario
    setTimeout(() => {
      const formElement = document.querySelector('[data-form-section-empresa]');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Función para crear o actualizar empresa
  const handleCreateEmpresa = async () => {
    // Mapeo de campos a nombres legibles
    const fieldNames = {
      'nombre_empresa': 'Nombre empresa',
      'codigo_empresa': 'Código empresa',
      'telefono': 'Teléfono',
      'cuit': 'CUIT',
      'email': 'E-mail'
    };

    // Validar campos requeridos
    const requiredFields = [
      'nombre_empresa',
      'codigo_empresa',
      'telefono',
      'cuit',
      'email'
    ];

    // Validar cada campo y guardar errores
    const errors = {};
    const camposFaltantes = [];

    requiredFields.forEach((field) => {
      const value = formDataEmpresa[field];
      const isEmpty = value === undefined || value === null || String(value).trim() === '';
      
      if (isEmpty) {
        errors[field] = `${fieldNames[field]} es requerido`;
        camposFaltantes.push(fieldNames[field]);
      }
    });

    // Validar formato de email
    if (formDataEmpresa.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formDataEmpresa.email.trim())) {
      errors['email'] = 'El formato del email no es válido';
    }

    // Si hay errores, mostrarlos y detener
    if (Object.keys(errors).length > 0) {
      setFieldErrorsEmpresa(errors);
      setToast({
        type: 'error',
        title: isEditModeEmpresa ? 'Error al actualizar empresa' : 'Error al crear empresa',
        message: `Por favor complete todos los campos requeridos: ${camposFaltantes.join(', ')}`
      });
      setTimeout(() => setToast(null), 5000);
      
      // Scroll al primer campo con error
      const firstErrorField = Object.keys(errors)[0];
      const errorElement = document.querySelector(`[name="${firstErrorField}"], [data-field="${firstErrorField}"]`);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        errorElement.focus();
      }
      
      return;
    }

    // Limpiar errores si la validación pasa
    setFieldErrorsEmpresa({});

    setIsSubmittingEmpresa(true);

    try {
      // Asegurarse de no incluir id_empresa en los datos (es auto-incremental)
      const empresaData = {
        nombre_empresa: formDataEmpresa.nombre_empresa.trim(),
        codigo_empresa: formDataEmpresa.codigo_empresa.trim(),
        telefono: formDataEmpresa.telefono.trim(),
        cuit: formDataEmpresa.cuit.trim(),
        email: formDataEmpresa.email.trim()
      };
      
      // Asegurarse de que no se incluya id_empresa
      delete empresaData.id_empresa;

      if (isEditModeEmpresa && editingEmpresaId) {
        // Modo edición: actualizar empresa existente
        console.log('=== ACTUALIZANDO EMPRESA ===');
        console.log('ID de la empresa:', editingEmpresaId);
        console.log('Empresa data:', empresaData);

        await updateInTable('empresa', editingEmpresaId, empresaData);

        // Registrar auditoría
        await registrarAuditoria({
          usuarioNombre: user?.nombre_completo || user?.nombre || 'Usuario desconocido',
          idUsuarioRef: user?.id_usuario || null,
          accion: 'ACTUALIZAR',
          tipoRegistro: 'empresa',
          idRegistro: editingEmpresaId,
          detalle: `Actualización de empresa: ${empresaData.nombre_empresa} (Código: ${empresaData.codigo_empresa})`
        });

        setToast({
          type: 'success',
          title: 'Empresa actualizada',
          message: `La empresa ${empresaData.nombre_empresa} ha sido actualizada exitosamente`
        });
      } else {
        // Modo creación: crear nueva empresa
        console.log('=== CREANDO EMPRESA ===');
        console.log('Empresa data:', empresaData);

        // Verificar si algún campo único ya existe antes de insertar
        try {
          const empresasExistentes = await getAllFromTable('empresa');
          if (Array.isArray(empresasExistentes) && empresasExistentes.length > 0) {
            const errores = {};
            let mensajeError = '';
            
            // Verificar CUIT duplicado
            const cuitExistente = empresasExistentes.find(e => e.cuit && e.cuit.trim() === empresaData.cuit.trim());
            if (cuitExistente) {
              errores.cuit = 'Este CUIT ya está registrado';
              mensajeError = 'El CUIT ingresado ya existe en el sistema. Por favor ingrese un CUIT diferente.';
            }
            
            // Verificar código de empresa duplicado
            const codigoExistente = empresasExistentes.find(e => e.codigo_empresa && e.codigo_empresa.trim() === empresaData.codigo_empresa.trim());
            if (codigoExistente) {
              errores.codigo_empresa = 'Este código ya está registrado';
              if (mensajeError) {
                mensajeError = 'El CUIT y el código de empresa ingresados ya existen en el sistema. Por favor ingrese valores diferentes.';
              } else {
                mensajeError = 'El código de empresa ingresado ya existe en el sistema. Por favor ingrese un código diferente.';
              }
            }
            
            // Verificar email duplicado
            const emailExistente = empresasExistentes.find(e => e.email && e.email.trim().toLowerCase() === empresaData.email.trim().toLowerCase());
            if (emailExistente) {
              errores.email = 'Este email ya está registrado';
              if (mensajeError) {
                mensajeError = 'El CUIT, código de empresa y/o email ingresados ya existen en el sistema. Por favor verifique los datos.';
              } else {
                mensajeError = 'El email ingresado ya existe en el sistema. Por favor ingrese un email diferente.';
              }
            }
            
            // Si hay errores, mostrarlos y detener
            if (Object.keys(errores).length > 0) {
              setFieldErrorsEmpresa(errores);
              setToast({
                type: 'error',
                title: 'Error al crear empresa',
                message: mensajeError
              });
              setTimeout(() => setToast(null), 5000);
              setIsSubmittingEmpresa(false);
              return;
            }
          }
        } catch (checkError) {
          console.warn('Error al verificar empresas existentes:', checkError);
          // Continuar con la inserción si falla la verificación
        }

        await insertIntoTable('empresa', empresaData);

        // Registrar auditoría
        const nuevasEmpresas = await getAllFromTable('empresa');
        const empresaCreada = Array.isArray(nuevasEmpresas) 
          ? nuevasEmpresas.find(e => e.codigo_empresa === empresaData.codigo_empresa && e.nombre_empresa === empresaData.nombre_empresa)
          : null;

        if (empresaCreada) {
          await registrarAuditoria({
            usuarioNombre: user?.nombre_completo || user?.nombre || 'Usuario desconocido',
            idUsuarioRef: user?.id_usuario || null,
            accion: 'CREAR',
            tipoRegistro: 'empresa',
            idRegistro: empresaCreada.id_empresa,
            detalle: `Creación de empresa: ${empresaData.nombre_empresa} (Código: ${empresaData.codigo_empresa})`
          });
        }

        setToast({
          type: 'success',
          title: 'Empresa creada',
          message: `La empresa ${empresaData.nombre_empresa} ha sido creada exitosamente`
        });
      }

      // Recargar lista de empresas
      const empresasData = await getAllFromTable('empresa');
      setEmpresasList(Array.isArray(empresasData) ? empresasData : []);
      setEmpresas(Array.isArray(empresasData) ? empresasData : []);

      // Cerrar formulario y resetear
      setShowFormEmpresa(false);
      setIsEditModeEmpresa(false);
      setEditingEmpresaId(null);
      setFieldErrorsEmpresa({});
      setFormDataEmpresa({
        nombre_empresa: '',
        codigo_empresa: '',
        telefono: '',
        cuit: '',
        email: ''
      });

      // Auto-cerrar la alerta después de 5 segundos
      setTimeout(() => {
        setToast(null);
      }, 5000);

    } catch (error) {
      console.error('Error al crear/actualizar empresa:', error);
      console.error('Error completo:', JSON.stringify(error, null, 2));
      
      // Manejar errores específicos
      let errorMessage = `Ocurrió un error al intentar ${isEditModeEmpresa ? 'actualizar' : 'crear'} la empresa. Por favor intente nuevamente.`;
      const newFieldErrors = { ...fieldErrorsEmpresa };
      
      // Error de CUIT duplicado (código 23505 de PostgreSQL/Supabase)
      // El error de Supabase tiene la estructura: { code, message, details, hint }
      const errorCode = error.code;
      const errorMsg = error.message || '';
      const errorDetails = error.details || '';
      const errorHint = error.hint || '';
      
      // Combinar todos los mensajes para buscar pistas
      const fullErrorText = `${errorMsg} ${errorDetails} ${errorHint}`.toLowerCase();
      
      if (errorCode === '23505' || errorMsg.includes('duplicate key') || errorMsg.includes('unique constraint')) {
        // Si el error es de clave primaria (empresa_pkey), verificar manualmente qué campo está duplicado
        if (errorMsg.includes('empresa_pkey') || errorMsg.includes('pkey')) {
          // Verificar manualmente qué campo está duplicado consultando la base de datos
          try {
            const empresasExistentes = await getAllFromTable('empresa');
            if (Array.isArray(empresasExistentes)) {
              // Verificar CUIT
              const cuitExistente = empresasExistentes.find(e => e.cuit && e.cuit.trim() === formDataEmpresa.cuit.trim());
              if (cuitExistente) {
                errorMessage = 'El CUIT ingresado ya existe en el sistema. Por favor ingrese un CUIT diferente.';
                newFieldErrors.cuit = 'Este CUIT ya está registrado';
              }
              
              // Verificar código de empresa
              const codigoExistente = empresasExistentes.find(e => e.codigo_empresa && e.codigo_empresa.trim() === formDataEmpresa.codigo_empresa.trim());
              if (codigoExistente) {
                errorMessage = errorMessage ? 
                  'El CUIT y el código de empresa ingresados ya existen en el sistema. Por favor ingrese valores diferentes.' :
                  'El código de empresa ingresado ya existe en el sistema. Por favor ingrese un código diferente.';
                newFieldErrors.codigo_empresa = 'Este código ya está registrado';
              }
              
              // Verificar email
              const emailExistente = empresasExistentes.find(e => e.email && e.email.trim().toLowerCase() === formDataEmpresa.email.trim().toLowerCase());
              if (emailExistente) {
                errorMessage = errorMessage ? 
                  'El CUIT, código de empresa y/o email ingresados ya existen en el sistema. Por favor verifique los datos.' :
                  'El email ingresado ya existe en el sistema. Por favor ingrese un email diferente.';
                newFieldErrors.email = 'Este email ya está registrado';
              }
              
              // Si no se encontró ningún duplicado en la verificación manual, usar mensaje genérico
              if (Object.keys(newFieldErrors).length === 0) {
                errorMessage = 'Ya existe una empresa con estos datos. Por favor verifique que el CUIT, código de empresa y email sean únicos.';
              }
            }
          } catch (checkError) {
            console.warn('Error al verificar empresas existentes en catch:', checkError);
            errorMessage = 'Ya existe una empresa con estos datos. Por favor verifique que el CUIT, código de empresa y email sean únicos.';
          }
        } 
        // Detectar qué campo está duplicado basándose en el mensaje
        else if (fullErrorText.includes('cuit') || errorMsg.includes('empresa_cuit') || errorMsg.includes('cuit_key')) {
          errorMessage = 'El CUIT ingresado ya existe en el sistema. Por favor ingrese un CUIT diferente.';
          newFieldErrors.cuit = 'Este CUIT ya está registrado';
        } 
        else if (fullErrorText.includes('codigo') || errorMsg.includes('codigo_empresa') || errorMsg.includes('codigo_key')) {
          errorMessage = 'El código de empresa ingresado ya existe en el sistema. Por favor ingrese un código diferente.';
          newFieldErrors.codigo_empresa = 'Este código ya está registrado';
        } 
        else if (fullErrorText.includes('nombre') || errorMsg.includes('nombre_empresa') || errorMsg.includes('nombre_key')) {
          errorMessage = 'El nombre de empresa ingresado ya existe en el sistema. Por favor ingrese un nombre diferente.';
          newFieldErrors.nombre_empresa = 'Este nombre ya está registrado';
        }
        else if (fullErrorText.includes('email') || errorMsg.includes('email_key')) {
          errorMessage = 'El email ingresado ya existe en el sistema. Por favor ingrese un email diferente.';
          newFieldErrors.email = 'Este email ya está registrado';
        }
        // Si no se puede determinar el campo específico, mostrar mensaje genérico
        else {
          errorMessage = 'Ya existe una empresa con estos datos. Por favor verifique que el CUIT, código de empresa y email sean únicos.';
        }
        setFieldErrorsEmpresa(newFieldErrors);
      } else if (errorMsg) {
        errorMessage = errorMsg;
      }
      
      setToast({
        type: 'error',
        title: isEditModeEmpresa ? 'Error al actualizar empresa' : 'Error al crear empresa',
        message: errorMessage
      });
      
      // Auto-cerrar la alerta de error después de 5 segundos
      setTimeout(() => {
        setToast(null);
      }, 5000);
    } finally {
      setIsSubmittingEmpresa(false);
    }
  };

  // Función para eliminar empresa
  const handleDeleteEmpresa = async () => {
    if (!empresaToDelete) return;

    setIsDeletingEmpresa(true);

    try {
      console.log('=== ELIMINANDO EMPRESA ===');
      console.log('ID de la empresa:', empresaToDelete.id_empresa);

      await deleteFromTable('empresa', empresaToDelete.id_empresa);

      // Registrar auditoría
      await registrarAuditoria({
        usuarioNombre: user?.nombre_completo || user?.nombre || 'Usuario desconocido',
        idUsuarioRef: user?.id_usuario || null,
        accion: 'ELIMINAR',
        tipoRegistro: 'empresa',
        idRegistro: empresaToDelete.id_empresa,
        detalle: `Eliminación de empresa: ${empresaToDelete.nombre_empresa || empresaToDelete.nombre || 'N/A'}`
      });

      setToast({
        type: 'success',
        title: 'Empresa eliminada',
        message: `La empresa ${empresaToDelete.nombre_empresa || empresaToDelete.nombre || ''} ha sido eliminada exitosamente`
      });

      // Recargar lista de empresas
      const empresasData = await getAllFromTable('empresa');
      setEmpresasList(Array.isArray(empresasData) ? empresasData : []);
      setEmpresas(Array.isArray(empresasData) ? empresasData : []);

      // Cerrar modal
      setShowDeleteEmpresaModal(false);
      setEmpresaToDelete(null);

      // Auto-cerrar la alerta después de 5 segundos
      setTimeout(() => {
        setToast(null);
      }, 5000);

    } catch (error) {
      console.error('Error al eliminar empresa:', error);
      setToast({
        type: 'error',
        title: 'Error al eliminar empresa',
        message: error.message || 'Ocurrió un error al intentar eliminar la empresa. Por favor intente nuevamente.'
      });
      
      // Auto-cerrar la alerta de error después de 5 segundos
      setTimeout(() => {
        setToast(null);
      }, 5000);
    } finally {
      setIsDeletingEmpresa(false);
    }
  };

  // Función para descargar plantilla Excel
  const handleDownloadTemplate = async () => {
    try {
      // Obtener datos de conductores y empresas si no están cargados
      let conductoresData = conductores;
      let empresasData = empresas;

      if (conductoresData.length === 0 || empresasData.length === 0) {
        const [conductoresResponse, empresasResponse] = await Promise.all([
          getAllFromTable('conductor').catch(() => []),
          getAllFromTable('empresa').catch(() => [])
        ]);

        if (conductoresResponse.ok) {
          conductoresData = await conductoresResponse.json();
        }
        if (empresasResponse.ok) {
          empresasData = await empresasResponse.json();
        }
      }

      // Hoja 1: Plantilla Unidades
      const templateData = [
        {
          'ID Empresa': '',
          'N° Interno': '',
          'Matrícula / Patente': '',
          'Marca': '',
          'Modelo': '',
          'Año': '',
          'Kilómetros / Odómetro': '',
          'Horómetro': '',
          'Tipo de servicio': '',
          'ID Conductor Activo': '',
          'Activo (true/false)': '',
          'Posee AC (true/false)': '',
          'Posee Cámara (true/false)': '',
          'Nombre de Seguro': '',
          'Tipo de Seguro / Cobertura': '',
          'Fecha Vencimiento Seguro (YYYY-MM-DD)': '',
          'Fecha Última RTO (YYYY-MM-DD)': ''
        }
      ];

      const ws = XLSX.utils.json_to_sheet(templateData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Plantilla Unidades');
      
      // Ajustar ancho de columnas para Plantilla Unidades
      // Orden: ID Empresa, N° Interno, Matrícula, Marca, Modelo, Año, Kilómetros, Horómetro, Tipo servicio, ID Conductor, Activo, Posee AC, Posee Cámara, Nombre Seguro, Tipo Seguro, Fecha Venc Seguro, Fecha RTO
      const colWidths = [
        { wch: 12 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 15 },
        { wch: 8 }, { wch: 20 }, { wch: 15 }, { wch: 18 }, { wch: 20 }, { wch: 18 },
        { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 25 }, { wch: 30 },
        { wch: 30 }
      ];
      ws['!cols'] = colWidths;

      // Hoja 2: CONDUCTOR
      const conductoresDataSheet = Array.isArray(conductoresData) ? conductoresData.map(c => ({
        'ID': c.id_conductor || c.id || '',
        'Nombre Completo': `${c.nombre || ''} ${c.apellido || ''}`.trim() || ''
      })) : [];

      const wsConductores = XLSX.utils.json_to_sheet(conductoresDataSheet);
      XLSX.utils.book_append_sheet(wb, wsConductores, 'CONDUCTOR');
      
      // Ajustar ancho de columnas para CONDUCTOR
      wsConductores['!cols'] = [
        { wch: 10 },
        { wch: 30 }
      ];

      // Hoja 3: EMPRESAS
      const empresasDataSheet = Array.isArray(empresasData) ? empresasData.map(e => ({
        'ID': e.id_empresa || e.id || '',
        'Nombre Empresa': e.nombre_empresa || e.nombre || ''
      })) : [];

      const wsEmpresas = XLSX.utils.json_to_sheet(empresasDataSheet);
      XLSX.utils.book_append_sheet(wb, wsEmpresas, 'EMPRESAS');
      
      // Ajustar ancho de columnas para EMPRESAS
      wsEmpresas['!cols'] = [
        { wch: 10 },
        { wch: 30 }
      ];

      XLSX.writeFile(wb, 'plantilla_carga_masiva_unidades.xlsx');
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

  // Función para descargar plantilla Excel de empresas
  const handleDownloadTemplateEmpresa = async () => {
    try {
      // Hoja 1: Plantilla Empresas
      const templateData = [
        {
          'Nombre empresa': '',
          'Código empresa': '',
          'Teléfono': '',
          'CUIT': '',
          'E-mail': ''
        }
      ];

      const ws = XLSX.utils.json_to_sheet(templateData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Plantilla Empresas');
      
      // Ajustar ancho de columnas
      const colWidths = [
        { wch: 30 }, // Nombre empresa
        { wch: 20 }, // Código empresa
        { wch: 15 }, // Teléfono
        { wch: 15 }, // CUIT
        { wch: 30 }  // E-mail
      ];
      ws['!cols'] = colWidths;

      XLSX.writeFile(wb, 'plantilla_carga_masiva_empresas.xlsx');
    } catch (error) {
      console.error('Error al generar plantilla de empresas:', error);
      setToast({
        type: 'error',
        title: 'Error al generar plantilla',
        message: 'Ocurrió un error al generar la plantilla. Por favor intente nuevamente.'
      });
      setTimeout(() => setToast(null), 5000);
    }
  };

  // Función para descargar plantilla Excel de usuarios
  const handleDownloadTemplateUsuario = async () => {
    try {
      // Obtener datos de roles y empresas si no están cargados
      let rolesData = roles;
      let empresasData = empresas;

      if (rolesData.length === 0 || empresasData.length === 0) {
        const [rolesDataResult, empresasDataResult] = await Promise.all([
          getAllFromTable('rol').catch(() => []),
          getAllFromTable('empresa').catch(() => [])
        ]);

        if (Array.isArray(rolesDataResult)) {
          rolesData = rolesDataResult;
        }
        if (Array.isArray(empresasDataResult)) {
          empresasData = empresasDataResult;
        }
      }

      // Hoja 1: Plantilla Usuarios
      const templateData = [
        {
          'Nombre completo': '',
          'Teléfono': '',
          'E-Mail': '',
          'Contraseña': '',
          'DNI': '',
          'ID Empresa (opcional, dejar vacío si Rol es ADMIN/Inspector/Auditor)': '',
          'ID Rol (1=ADMIN, 2=Empresa, 3=Inspector, 4=Auditor)': ''
        }
      ];

      const ws = XLSX.utils.json_to_sheet(templateData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Plantilla Usuarios');
      
      // Ajustar ancho de columnas para Plantilla Usuarios
      const colWidths = [
        { wch: 25 }, { wch: 15 }, { wch: 30 }, { wch: 15 }, { wch: 12 },
        { wch: 50 }, { wch: 45 }
      ];
      ws['!cols'] = colWidths;

      // Hoja 2: ROL
      const rolesDataSheet = Array.isArray(rolesData) ? rolesData.map(r => ({
        'ID': r.id_rol || r.id || '',
        'Nombre Rol': r.nombre || ''
      })) : [];

      const wsRoles = XLSX.utils.json_to_sheet(rolesDataSheet);
      XLSX.utils.book_append_sheet(wb, wsRoles, 'ROL');
      
      // Ajustar ancho de columnas para ROL
      wsRoles['!cols'] = [
        { wch: 10 },
        { wch: 20 }
      ];

      // Hoja 3: EMPRESAS
      const empresasDataSheet = Array.isArray(empresasData) ? empresasData.map(e => ({
        'ID': e.id_empresa || e.id || '',
        'Nombre Empresa': e.nombre_empresa || e.nombre || ''
      })) : [];

      const wsEmpresas = XLSX.utils.json_to_sheet(empresasDataSheet);
      XLSX.utils.book_append_sheet(wb, wsEmpresas, 'EMPRESAS');
      
      // Ajustar ancho de columnas para EMPRESAS
      wsEmpresas['!cols'] = [
        { wch: 10 },
        { wch: 30 }
      ];

      XLSX.writeFile(wb, 'plantilla_carga_masiva_usuarios.xlsx');
      } catch (error) {
      console.error('Error al generar plantilla de usuarios:', error);
      setToast({
        type: 'error',
        title: 'Error al generar plantilla',
        message: 'Ocurrió un error al generar la plantilla. Por favor intente nuevamente.'
      });
      setTimeout(() => setToast(null), 5000);
    }
  };

  // Función para validar una fila de datos
  const validateRow = (row, rowIndex, empresas, conductores) => {
    const errors = [];
    const fieldNames = {
      'ID Empresa': 'id_empresa',
      'N° Interno': 'interno',
      'Matrícula / Patente': 'matricula',
      'Marca': 'marca',
      'Modelo': 'modelo',
      'Año': 'anio',
      'Kilómetros / Odómetro': 'kilometros',
      'Horómetro': 'horometro',
      'Tipo de servicio': 'tipo_servicio',
      'ID Conductor Activo': 'id_conductor_activo',
      'Activo (true/false)': 'activo',
      'Posee AC (true/false)': 'posee_ac',
      'Posee Cámara (true/false)': 'posee_camara',
      'Nombre de Seguro': 'nombre_seguro',
      'Tipo de Seguro / Cobertura': 'tipo_seguro_cobertura',
      'Fecha Vencimiento Seguro (YYYY-MM-DD)': 'fecha_vencimiento_seguro',
      'Fecha Última RTO (YYYY-MM-DD)': 'fecha_ultima_rto'
    };

    // Validar campos requeridos
    Object.keys(fieldNames).forEach(excelField => {
      const dbField = fieldNames[excelField];
      const value = row[excelField];
      
      if (!value || String(value).trim() === '') {
        errors.push(`Fila ${rowIndex + 2}: El campo "${excelField}" es requerido`);
      }
    });

    // Validar ID Empresa existe
    if (row['ID Empresa']) {
      const idEmpresa = parseInt(row['ID Empresa'], 10);
      if (isNaN(idEmpresa) || !empresas.find(e => e.id_empresa === idEmpresa)) {
        errors.push(`Fila ${rowIndex + 2}: El ID de Empresa "${row['ID Empresa']}" no existe`);
      }
    }

    // Validar ID Conductor existe
    if (row['ID Conductor Activo']) {
      const idConductor = parseInt(row['ID Conductor Activo'], 10);
      if (isNaN(idConductor) || !conductores.find(c => c.id_conductor === idConductor)) {
        errors.push(`Fila ${rowIndex + 2}: El ID de Conductor "${row['ID Conductor Activo']}" no existe`);
      }
    }

    // Validar valores booleanos
    ['Activo (true/false)', 'Posee AC (true/false)', 'Posee Cámara (true/false)'].forEach(field => {
      if (row[field] && !['true', 'false', 'TRUE', 'FALSE', '1', '0'].includes(String(row[field]).trim())) {
        errors.push(`Fila ${rowIndex + 2}: El campo "${field}" debe ser "true" o "false"`);
      }
    });

    // Validar fechas
    ['Fecha Vencimiento Seguro (YYYY-MM-DD)', 'Fecha Última RTO (YYYY-MM-DD)'].forEach(field => {
      if (row[field]) {
        const dateStr = String(row[field]).trim();
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(dateStr)) {
          errors.push(`Fila ${rowIndex + 2}: El campo "${field}" debe tener formato YYYY-MM-DD`);
        } else {
          const date = new Date(dateStr);
          if (isNaN(date.getTime())) {
            errors.push(`Fila ${rowIndex + 2}: El campo "${field}" contiene una fecha inválida`);
          }
        }
      }
    });

    // Validar año
    if (row['Año']) {
      const anio = parseInt(row['Año'], 10);
      if (isNaN(anio) || anio < 1900 || anio > new Date().getFullYear() + 1) {
        errors.push(`Fila ${rowIndex + 2}: El campo "Año" debe ser un número válido entre 1900 y ${new Date().getFullYear() + 1}`);
      }
    }

    // Validar kilómetros
    if (row['Kilómetros / Odómetro']) {
      const km = parseInt(row['Kilómetros / Odómetro'], 10);
      if (isNaN(km) || km < 0) {
        errors.push(`Fila ${rowIndex + 2}: El campo "Kilómetros / Odómetro" debe ser un número positivo`);
      }
    }

    // Validar horómetro (opcional)
    if (row['Horómetro']) {
      const horometro = parseInt(row['Horómetro'], 10);
      if (isNaN(horometro) || horometro < 0) {
        errors.push(`Fila ${rowIndex + 2}: El campo "Horómetro" debe ser un número positivo`);
      }
    }

    return errors;
  };

  // Función para validar una fila de datos de empresa
  const validateRowEmpresa = (row, rowIndex, empresasExistentes) => {
    const errors = [];
    
    // Validar campos requeridos
    const requiredFields = [
      'Nombre empresa',
      'Código empresa',
      'Teléfono',
      'CUIT',
      'E-mail'
    ];
    
    requiredFields.forEach(field => {
      if (!row[field] || String(row[field]).trim() === '') {
        errors.push(`Fila ${rowIndex + 2}: El campo "${field}" es requerido`);
      }
    });

    // Validar formato de email
    if (row['E-mail']) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(String(row['E-mail']).trim())) {
        errors.push(`Fila ${rowIndex + 2}: El campo "E-mail" tiene un formato inválido`);
      }
    }

    // Validar que el CUIT no esté duplicado en el archivo
    if (row['CUIT']) {
      const cuitValue = String(row['CUIT']).trim();
      const empresasExistentesConCuit = empresasExistentes.filter(e => e.cuit && e.cuit.trim() === cuitValue);
      if (empresasExistentesConCuit.length > 0) {
        errors.push(`Fila ${rowIndex + 2}: El CUIT "${cuitValue}" ya existe en la base de datos`);
      }
    }

    // Validar que el código de empresa no esté duplicado en el archivo
    if (row['Código empresa']) {
      const codigoValue = String(row['Código empresa']).trim();
      const empresasExistentesConCodigo = empresasExistentes.filter(e => e.codigo_empresa && e.codigo_empresa.trim() === codigoValue);
      if (empresasExistentesConCodigo.length > 0) {
        errors.push(`Fila ${rowIndex + 2}: El código de empresa "${codigoValue}" ya existe en la base de datos`);
      }
    }

    // Validar que el email no esté duplicado en el archivo
    if (row['E-mail']) {
      const emailValue = String(row['E-mail']).trim().toLowerCase();
      const empresasExistentesConEmail = empresasExistentes.filter(e => e.email && e.email.trim().toLowerCase() === emailValue);
      if (empresasExistentesConEmail.length > 0) {
        errors.push(`Fila ${rowIndex + 2}: El email "${emailValue}" ya existe en la base de datos`);
      }
    }

    return errors;
  };

  // Función para validar una fila de datos de usuario
  const validateRowUsuario = (row, rowIndex, empresas, roles) => {
    const errors = [];
    
    // Validar campos requeridos
    const requiredFields = ['Nombre completo', 'Teléfono', 'E-Mail', 'Contraseña', 'DNI', 'ID Rol (1=ADMIN, 2=Empresa, 3=Inspector, 4=Auditor)'];
    requiredFields.forEach(field => {
      if (!row[field] || String(row[field]).trim() === '') {
        errors.push(`Fila ${rowIndex + 2}: El campo "${field}" es requerido`);
      }
    });

    // Validar formato de email
    if (row['E-Mail']) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(String(row['E-Mail']).trim())) {
        errors.push(`Fila ${rowIndex + 2}: El campo "E-Mail" tiene un formato inválido`);
      }
    }

    // Validar ID Rol existe
    let rolId = null;
    if (row['ID Rol (1=ADMIN, 2=Empresa, 3=Inspector, 4=Auditor)']) {
      rolId = parseInt(row['ID Rol (1=ADMIN, 2=Empresa, 3=Inspector, 4=Auditor)'], 10);
      if (isNaN(rolId) || !roles.find(r => r.id_rol === rolId)) {
        errors.push(`Fila ${rowIndex + 2}: El ID de Rol "${row['ID Rol (1=ADMIN, 2=Empresa, 3=Inspector, 4=Auditor)']}" no existe`);
        rolId = null; // Resetear si no es válido
      } else {
        // Si el rol es ADMIN (1), Inspector (3) o Auditor (4), id_empresa debe estar vacío
        if ((rolId === 1 || rolId === 3 || rolId === 4) && row['ID Empresa (opcional, dejar vacío si Rol es ADMIN/Inspector/Auditor)'] && String(row['ID Empresa (opcional, dejar vacío si Rol es ADMIN/Inspector/Auditor)']).trim() !== '') {
          errors.push(`Fila ${rowIndex + 2}: El campo "ID Empresa" debe estar vacío para los roles ADMIN, Inspector o Auditor`);
        }
      }
    }

    // Validar ID Empresa existe (solo si el rol NO es ADMIN, Inspector o Auditor)
    if (rolId !== null && rolId !== 1 && rolId !== 3 && rolId !== 4) {
      if (row['ID Empresa (opcional, dejar vacío si Rol es ADMIN/Inspector/Auditor)'] && String(row['ID Empresa (opcional, dejar vacío si Rol es ADMIN/Inspector/Auditor)']).trim() !== '') {
        const idEmpresa = parseInt(row['ID Empresa (opcional, dejar vacío si Rol es ADMIN/Inspector/Auditor)'], 10);
        if (isNaN(idEmpresa) || !empresas.find(e => e.id_empresa === idEmpresa)) {
          errors.push(`Fila ${rowIndex + 2}: El ID de Empresa "${row['ID Empresa (opcional, dejar vacío si Rol es ADMIN/Inspector/Auditor)']}" no existe`);
        }
      }
    }

    return errors;
  };

  // Función para procesar archivo Excel
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
      const [empresas, conductores, vehiculosExistentes] = await Promise.all([
        getAllFromTable('empresa'),
        getAllFromTable('conductor'),
        getAllFromTable('vehiculo')
      ]);
      
      // Validar que sean arrays antes de procesar
      const validEmpresas = Array.isArray(empresas) ? empresas : [];
      const validConductores = Array.isArray(conductores) ? conductores : [];
      const validVehiculosExistentes = Array.isArray(vehiculosExistentes) ? vehiculosExistentes : [];
      
      const ultimoId = validVehiculosExistentes.length > 0 
        ? Math.max(...validVehiculosExistentes.map(v => v.id_vehiculo || 0))
        : 0;

      const errors = [];
      const validRows = [];
      let currentId = ultimoId;

      // Validar y procesar cada fila
      jsonData.forEach((row, index) => {
        const rowErrors = validateRow(row, index, validEmpresas, validConductores);
        
        if (rowErrors.length > 0) {
          errors.push(...rowErrors);
        } else {
          // Convertir a formato de base de datos
          const parseBoolean = (value) => {
            const str = String(value).trim().toLowerCase();
            return str === 'true' || str === '1';
          };

          const formatDate = (dateStr) => {
            if (!dateStr) return null;
            const date = new Date(dateStr);
            return date.toISOString();
          };

          currentId++;
          validRows.push({
            id: currentId,
            id_vehiculo: currentId,
            id_empresa: parseInt(row['ID Empresa'], 10),
            interno: String(row['N° Interno']).trim(),
            matricula: String(row['Matrícula / Patente']).trim(),
            marca: String(row['Marca']).trim(),
            modelo: String(row['Modelo']).trim(),
            anio: parseInt(row['Año'], 10),
            kilometros: parseInt(row['Kilómetros / Odómetro'], 10),
            horometro: row['Horómetro'] ? parseInt(row['Horómetro'], 10) : 0,
            tipo_servicio: String(row['Tipo de servicio']).trim(),
            id_conductor_activo: parseInt(row['ID Conductor Activo'], 10),
            activo: parseBoolean(row['Activo (true/false)']),
            posee_ac: parseBoolean(row['Posee AC (true/false)']),
            posee_camara: parseBoolean(row['Posee Cámara (true/false)']),
            nombre_seguro: String(row['Nombre de Seguro']).trim(),
            tipo_seguro_cobertura: String(row['Tipo de Seguro / Cobertura']).trim(),
            fecha_vencimiento_seguro: formatDate(row['Fecha Vencimiento Seguro (YYYY-MM-DD)']),
            fecha_ultima_rto: formatDate(row['Fecha Última RTO (YYYY-MM-DD)']),
            equipamiento_atributos: {}
          });
        }
      });

      // Cargar filas válidas usando Supabase
      if (validRows.length > 0) {
        const promises = validRows.map(vehiculo => 
          insertIntoTable('vehiculo', vehiculo).catch(err => {
            console.error('Error insertando vehículo:', err);
            throw err;
          })
        );

        const results = await Promise.allSettled(promises);
        let successCount = 0;
        let failCount = 0;

        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            successCount++;
            // Registrar auditoría para cada vehículo creado en carga masiva
            const vehiculo = validRows[index];
            const vehiculoCreado = result.value; // Obtener el vehículo creado con su ID real
            const empresaInfo = empresas.find(e => e.id_empresa === vehiculo.id_empresa);
            registrarAuditoria({
              usuarioNombre: user?.nombre_completo || user?.nombre || 'Usuario desconocido',
              idUsuarioRef: user?.id_usuario || null,
              accion: 'CREAR',
              tipoRegistro: 'vehiculo',
              idRegistro: vehiculoCreado?.id_vehiculo || vehiculo.id_vehiculo,
              detalle: `Alta de vehículo (carga masiva): Matrícula ${vehiculo.matricula}, Interno ${vehiculo.interno}, Empresa: ${empresaInfo?.nombre_empresa || 'N/A'}, Marca: ${vehiculo.marca}, Modelo: ${vehiculo.modelo}`
            }).catch(err => console.error('Error al registrar auditoría:', err));
          } else {
            failCount++;
            errors.push(`Fila ${jsonData.findIndex((r, i) => validRows[index] && r['N° Interno'] === validRows[index].interno) + 2}: Error al guardar en la base de datos`);
          }
        });

        setCargaMasivaSuccess(successCount);
        
        if (failCount > 0) {
          errors.push(`${failCount} registro(s) no pudieron ser guardados correctamente`);
        }
      }

      // Recargar lista de vehículos, órdenes de trabajo y tipos de mantenimiento
      const [vehiculosReloadData, ordenesReloadData, tiposReloadData] = await Promise.all([
        getAllFromTable('vehiculo'),
        getAllFromTable('orden_trabajo'),
        getAllFromTable('tipo_mantenimiento')
      ]);
      if (Array.isArray(vehiculosReloadData)) {
        setVehiculos(vehiculosReloadData);
      }
      if (Array.isArray(ordenesReloadData)) {
        setOrdenesTrabajo(ordenesReloadData);
      }
      if (Array.isArray(tiposReloadData)) {
        setTiposMantenimiento(tiposReloadData);
      }

      // Mostrar resultados
      setCargaMasivaErrors(errors);
      
      if (errors.length === 0 && validRows.length > 0) {
        setToast({
          type: 'success',
          title: 'Carga masiva exitosa',
          message: `Se cargaron exitosamente ${validRows.length} unidad(es)`
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
          message: `Se cargaron ${validRows.length} unidad(es) pero hubo ${errors.length} error(es). Revise el informe de errores.`
        });
        setTimeout(() => setToast(null), 5000);
      } else {
        setToast({
          type: 'error',
          title: 'Error en carga masiva',
          message: `No se pudo cargar ninguna unidad. Revise el informe de errores.`
        });
        setTimeout(() => setToast(null), 5000);
      }

    } catch (error) {
      // Manejo silencioso de errores - solo mostrar toast
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

  // Función para procesar archivo Excel de usuarios
  const handleProcessExcelFileUsuario = async (file) => {
    setIsProcessingUsuarioFile(true);
    setCargaMasivaUsuarioErrors([]);
    setCargaMasivaUsuarioSuccess(0);

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
        setIsProcessingUsuarioFile(false);
        return;
      }

      // Obtener datos necesarios para validación usando Supabase
      const [empresasData, rolesData, usuariosExistentes] = await Promise.all([
        getAllFromTable('empresa'),
        getAllFromTable('rol'),
        getAllFromTable('usuario')
      ]);
      
      // Validar que sean arrays antes de procesar
      const validEmpresasUsuarios = Array.isArray(empresasData) ? empresasData : [];
      const validRoles = Array.isArray(rolesData) ? rolesData : [];

      const errors = [];
      const validRows = [];

      // Validar y procesar cada fila
      jsonData.forEach((row, index) => {
        const rowErrors = validateRowUsuario(row, index, validEmpresasUsuarios, validRoles);
        
        if (rowErrors.length > 0) {
          errors.push(...rowErrors);
        } else {
          // Convertir a formato de base de datos
          // Supabase genera automáticamente id_usuario (SERIAL), no necesitamos calcularlo
          const idRol = parseInt(row['ID Rol (1=ADMIN, 2=Empresa, 3=Inspector, 4=Auditor)'], 10);
          const idEmpresaValue = row['ID Empresa (opcional, dejar vacío si Rol es ADMIN/Inspector/Auditor)'];
          const idEmpresa = (idRol === 1 || idRol === 3 || idRol === 4) ? null : (idEmpresaValue && String(idEmpresaValue).trim() !== '' ? parseInt(idEmpresaValue, 10) : null);
          
          validRows.push({
            username: String(row['E-Mail']).trim(),
            password_hash: String(row['Contraseña']).trim(), // En producción esto debería ser un hash
            activo: true,
            id_rol: idRol,
            id_empresa: idEmpresa,
            nombre_completo: String(row['Nombre completo']).trim(),
            dni: String(row['DNI']).trim(),
            telefono: String(row['Teléfono']).trim(),
            email: String(row['E-Mail']).trim()
          });
        }
      });

      // Cargar filas válidas usando Supabase
      if (validRows.length > 0) {
        const promises = validRows.map(usuario => 
          insertIntoTable('usuario', usuario).catch(err => {
            console.error('Error insertando usuario:', err);
            throw err;
          })
        );

        const results = await Promise.allSettled(promises);
        let successCount = 0;
        let failCount = 0;

        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            successCount++;
          } else {
            failCount++;
            errors.push(`Fila ${jsonData.findIndex((r, i) => validRows[index] && r['E-Mail'] === validRows[index].email) + 2}: Error al guardar en la base de datos`);
          }
        });

        setCargaMasivaUsuarioSuccess(successCount);
        
        if (failCount > 0) {
          errors.push(`${failCount} registro(s) no pudieron ser guardados correctamente`);
        }
      }

      // Recargar lista de usuarios
      const usuariosReloadData = await getAllFromTable('usuario');
      if (Array.isArray(usuariosReloadData)) {
        setUsuarios(usuariosReloadData);
      }

      // Mostrar resultados
      setCargaMasivaUsuarioErrors(errors);
      
      if (errors.length === 0 && validRows.length > 0) {
        setToast({
          type: 'success',
          title: 'Carga masiva exitosa',
          message: `Se cargaron exitosamente ${validRows.length} usuario(s)`
        });
        setTimeout(() => {
          setToast(null);
          setShowCargaMasivaUsuarioModal(false);
          setCargaMasivaUsuarioErrors([]);
          setCargaMasivaUsuarioSuccess(0);
          if (fileInputUsuarioRef.current) {
            fileInputUsuarioRef.current.value = '';
          }
        }, 5000);
      } else if (validRows.length > 0) {
        setToast({
          type: 'error',
          title: 'Carga parcial',
          message: `Se cargaron ${validRows.length} usuario(s) pero hubo ${errors.length} error(es). Revise el informe de errores.`
        });
        setTimeout(() => setToast(null), 5000);
      } else {
        setToast({
          type: 'error',
          title: 'Error en carga masiva',
          message: `No se pudo cargar ningún usuario. Revise el informe de errores.`
        });
        setTimeout(() => setToast(null), 5000);
      }

    } catch (error) {
      // Manejo silencioso de errores - solo mostrar toast sin console.error
      setToast({
        type: 'error',
        title: 'Error al procesar archivo',
        message: error.message || 'Ocurrió un error al procesar el archivo Excel. Por favor verifique el formato del archivo.'
      });
      setTimeout(() => setToast(null), 5000);
    } finally {
      setIsProcessingUsuarioFile(false);
    }
  };

  // Función para procesar archivo Excel de empresas
  const handleProcessExcelFileEmpresa = async (file) => {
    setIsProcessingEmpresaFile(true);
    setCargaMasivaEmpresaErrors([]);
    setCargaMasivaEmpresaSuccess(0);

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
        setIsProcessingEmpresaFile(false);
        return;
      }

      // Obtener datos necesarios para validación usando Supabase
      const empresasExistentes = await getAllFromTable('empresa');
      
      // Validar que sean arrays antes de procesar
      const validEmpresasExistentes = Array.isArray(empresasExistentes) ? empresasExistentes : [];

      const errors = [];
      const validRows = [];
      const cuitsEnArchivo = new Set();
      const codigosEnArchivo = new Set();
      const emailsEnArchivo = new Set();

      // Validar y procesar cada fila
      jsonData.forEach((row, index) => {
        const rowErrors = validateRowEmpresa(row, index, validEmpresasExistentes);
        
        // Validar duplicados dentro del mismo archivo
        const cuitValue = row['CUIT'] ? String(row['CUIT']).trim() : '';
        const codigoValue = row['Código empresa'] ? String(row['Código empresa']).trim() : '';
        const emailValue = row['E-mail'] ? String(row['E-mail']).trim().toLowerCase() : '';
        
        if (cuitValue && cuitsEnArchivo.has(cuitValue)) {
          rowErrors.push(`Fila ${index + 2}: El CUIT "${cuitValue}" está duplicado en el archivo`);
        } else if (cuitValue) {
          cuitsEnArchivo.add(cuitValue);
        }
        
        if (codigoValue && codigosEnArchivo.has(codigoValue)) {
          rowErrors.push(`Fila ${index + 2}: El código de empresa "${codigoValue}" está duplicado en el archivo`);
        } else if (codigoValue) {
          codigosEnArchivo.add(codigoValue);
        }
        
        if (emailValue && emailsEnArchivo.has(emailValue)) {
          rowErrors.push(`Fila ${index + 2}: El email "${emailValue}" está duplicado en el archivo`);
        } else if (emailValue) {
          emailsEnArchivo.add(emailValue);
        }
        
        if (rowErrors.length > 0) {
          errors.push(...rowErrors);
        } else {
          // Convertir a formato de base de datos
          validRows.push({
            nombre_empresa: String(row['Nombre empresa']).trim(),
            codigo_empresa: String(row['Código empresa']).trim(),
            telefono: String(row['Teléfono']).trim(),
            cuit: String(row['CUIT']).trim(),
            email: String(row['E-mail']).trim()
          });
        }
      });

      // Cargar filas válidas usando Supabase
      if (validRows.length > 0) {
        const promises = validRows.map(empresa => 
          insertIntoTable('empresa', empresa).catch(err => {
            console.error('Error insertando empresa:', err);
            // Agregar error específico según el tipo
            if (err.code === '23505' || err.message?.includes('duplicate key')) {
              if (err.message?.includes('cuit')) {
                errors.push(`Empresa "${empresa.nombre_empresa}": El CUIT "${empresa.cuit}" ya existe en la base de datos`);
              } else if (err.message?.includes('codigo_empresa')) {
                errors.push(`Empresa "${empresa.nombre_empresa}": El código "${empresa.codigo_empresa}" ya existe en la base de datos`);
              } else if (err.message?.includes('email')) {
                errors.push(`Empresa "${empresa.nombre_empresa}": El email "${empresa.email}" ya existe en la base de datos`);
              } else {
                errors.push(`Empresa "${empresa.nombre_empresa}": Error al guardar - datos duplicados`);
              }
            } else {
              errors.push(`Empresa "${empresa.nombre_empresa}": Error al guardar en la base de datos`);
            }
            throw err;
          })
        );

        const results = await Promise.allSettled(promises);
        let successCount = 0;
        let failCount = 0;

        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            successCount++;
            // Registrar auditoría para cada empresa creada en carga masiva
            const empresa = validRows[index];
            const empresaCreada = result.value;
            registrarAuditoria({
              usuarioNombre: user?.nombre_completo || user?.nombre || 'Usuario desconocido',
              idUsuarioRef: user?.id_usuario || null,
              accion: 'CREAR',
              tipoRegistro: 'empresa',
              idRegistro: empresaCreada?.id_empresa || null,
              detalle: `Alta de empresa (carga masiva): ${empresa.nombre_empresa}, Código: ${empresa.codigo_empresa}, CUIT: ${empresa.cuit}`
            }).catch(err => console.error('Error al registrar auditoría:', err));
          } else {
            failCount++;
          }
        });

        setCargaMasivaEmpresaSuccess(successCount);
        
        if (failCount > 0) {
          errors.push(`${failCount} registro(s) no pudieron ser guardados correctamente`);
        }
      }

      // Recargar lista de empresas
      const empresasReloadData = await getAllFromTable('empresa');
      if (Array.isArray(empresasReloadData)) {
        setEmpresas(empresasReloadData);
        setEmpresasList(empresasReloadData);
      }

      // Mostrar resultados
      setCargaMasivaEmpresaErrors(errors);
      
      if (errors.length === 0 && validRows.length > 0) {
        setToast({
          type: 'success',
          title: 'Carga masiva exitosa',
          message: `Se cargaron exitosamente ${validRows.length} empresa(s)`
        });
        setTimeout(() => {
          setToast(null);
          setShowCargaMasivaEmpresaModal(false);
          setCargaMasivaEmpresaErrors([]);
          setCargaMasivaEmpresaSuccess(0);
          if (fileInputEmpresaRef.current) {
            fileInputEmpresaRef.current.value = '';
          }
        }, 5000);
      } else if (validRows.length > 0) {
        setToast({
          type: 'error',
          title: 'Carga parcial',
          message: `Se cargaron ${validRows.length} empresa(s) pero hubo ${errors.length} error(es). Revise el informe de errores.`
        });
        setTimeout(() => setToast(null), 5000);
      } else {
        setToast({
          type: 'error',
          title: 'Error en carga masiva',
          message: `No se pudo cargar ninguna empresa. Revise el informe de errores.`
        });
        setTimeout(() => setToast(null), 5000);
      }

    } catch (error) {
      // Manejo silencioso de errores - solo mostrar toast
      setToast({
        type: 'error',
        title: 'Error al procesar archivo',
        message: error.message || 'Ocurrió un error al procesar el archivo Excel. Por favor verifique el formato del archivo.'
      });
      setTimeout(() => setToast(null), 5000);
    } finally {
      setIsProcessingEmpresaFile(false);
    }
  };

  // Cargar datos del servidor
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Obtener datos usando Supabase
        const [vehiculosData, empresasData, conductoresData, usuariosData, rolesData, ordenesData, tiposData] = await Promise.all([
          getAllFromTable('vehiculo'),
          getAllFromTable('empresa'),
          getAllFromTable('conductor'),
          getAllFromTable('usuario'),
          getAllFromTable('rol'),
          getAllFromTable('orden_trabajo'),
          getAllFromTable('tipo_mantenimiento')
        ]);
        
        // Validar que los datos sean arrays
        const validVehiculos = Array.isArray(vehiculosData) ? vehiculosData : [];
        const validEmpresas = Array.isArray(empresasData) ? empresasData : [];
        const validConductores = Array.isArray(conductoresData) ? conductoresData : [];
        const validUsuarios = Array.isArray(usuariosData) ? usuariosData : [];
        const validRoles = Array.isArray(rolesData) ? rolesData : [];
        const validOrdenes = Array.isArray(ordenesData) ? ordenesData : [];
        const validTipos = Array.isArray(tiposData) ? tiposData : [];
        
        setVehiculos(validVehiculos);
        setEmpresas(validEmpresas);
        setEmpresasList(validEmpresas); // Lista de empresas para la tabla
        setConductores(validConductores);
        setUsuarios(validUsuarios);
        setRoles(validRoles);
        setOrdenesTrabajo(validOrdenes);
        setTiposMantenimiento(validTipos);
      } catch (error) {
        // Manejo de errores silencioso - solo establecer arrays vacíos
        setVehiculos([]);
        setEmpresas([]);
        setConductores([]);
        setUsuarios([]);
        setRoles([]);
        setOrdenesTrabajo([]);
        setTiposMantenimiento([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Cerrar menú al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
      if (menuUsuarioRef.current && !menuUsuarioRef.current.contains(event.target)) {
        setOpenMenuUsuarioId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
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
    
    // Buscar órdenes de trabajo para este vehículo
    const ordenesVehiculo = validOrdenes.filter(ot => ot.id_vehiculo === vehiculo.id_vehiculo);
    
    if (ordenesVehiculo.length === 0) {
      return 'Operativo';
    }
    
    // Buscar órdenes abiertas (no completadas)
    const ordenesAbiertas = ordenesVehiculo.filter(ot => ot.estado !== 'Completada');
    
    if (ordenesAbiertas.length === 0) {
      return 'Operativo';
    }
    
    // Verificar el tipo de mantenimiento de las órdenes abiertas
    for (const orden of ordenesAbiertas) {
      const tipo = validTipos.find(t => t.id_tipo_mantenimiento === orden.id_tipo_mantenimiento);
      if (tipo) {
        const descripcionTipo = tipo.descripcion?.toLowerCase() || '';
        if (descripcionTipo.includes('preventivo')) {
          return 'Preventivo';
        } else if (descripcionTipo.includes('correctivo')) {
          return 'En mantenimiento';
        }
      }
    }
    
    // Si hay órdenes abiertas pero no se pudo determinar el tipo, asumir "En mantenimiento"
    return 'En mantenimiento';
  };

  // Filtrar datos según búsqueda - Busca en TODAS las columnas
  const filteredData = Array.isArray(vehiculos) ? vehiculos.filter(item => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    
    // Obtener nombre de la empresa
    let nombreEmpresa = '';
    if (item.id_empresa !== null && item.id_empresa !== undefined && empresas && empresas.length > 0) {
      const empresa = empresas.find(e => e.id_empresa === item.id_empresa);
      nombreEmpresa = empresa?.nombre_empresa?.toLowerCase() || '';
    }
    
    // Obtener nombre del conductor
    let nombreConductor = '';
    if (item.id_conductor_activo !== null && item.id_conductor_activo !== undefined && conductores && conductores.length > 0) {
      const idConductorBuscado = parseInt(item.id_conductor_activo, 10);
      const conductor = conductores.find(c => {
        const idConductor = parseInt(c.id_conductor, 10);
        return idConductor === idConductorBuscado;
      });
      if (conductor) {
        const nombre = conductor.nombre || '';
        const apellido = conductor.apellido || '';
        nombreConductor = `${nombre} ${apellido}`.trim().toLowerCase();
      }
    }
    
    // Obtener estado del vehículo
    const estadoVehiculo = getEstadoVehiculo(item);
    
    // Formatear números para búsqueda
    const kilometrosStr = item.kilometros ? formatNumber(item.kilometros).toLowerCase() : '';
    const horometroStr = item.horometro ? formatNumber(item.horometro).toLowerCase() : '';
    const anioStr = item.anio ? item.anio.toString().toLowerCase() : '';
    
    // Crear un string con todos los valores del objeto para búsqueda completa
    const allValuesString = Object.values(item)
      .filter(val => val !== null && val !== undefined)
      .map(val => {
        if (typeof val === 'object' && !Array.isArray(val)) {
          return JSON.stringify(val);
        }
        return String(val);
      })
      .join(' ')
      .toLowerCase();
    
    // Buscar en todas las columnas visibles y campos adicionales
    return (
      // Columnas principales de la tabla
      item.matricula?.toLowerCase().includes(searchLower) ||
      item.interno?.toLowerCase().includes(searchLower) ||
      item.marca?.toLowerCase().includes(searchLower) ||
      item.modelo?.toLowerCase().includes(searchLower) ||
      anioStr.includes(searchLower) ||
      kilometrosStr.includes(searchLower) ||
      horometroStr.includes(searchLower) ||
      nombreEmpresa.includes(searchLower) ||
      nombreConductor.includes(searchLower) ||
      item.tipo_servicio?.toLowerCase().includes(searchLower) ||
      estadoVehiculo.toLowerCase().includes(searchLower) ||
      // Campos adicionales que pueden existir
      item.nombre_seguro?.toLowerCase().includes(searchLower) ||
      item.tipo_seguro_cobertura?.toLowerCase().includes(searchLower) ||
      item.id_vehiculo?.toString().includes(searchLower) ||
      item.id_empresa?.toString().includes(searchLower) ||
      item.id_conductor_activo?.toString().includes(searchLower) ||
      item.posee_ac?.toString().toLowerCase().includes(searchLower) ||
      item.posee_camara?.toString().toLowerCase().includes(searchLower) ||
      item.activo?.toString().toLowerCase().includes(searchLower) ||
      // Búsqueda en todos los valores del objeto (búsqueda completa)
      allValuesString.includes(searchLower)
    );
  }) : [];

  // Filtrar usuarios según búsqueda
  const filteredDataUsuarios = Array.isArray(usuarios) ? usuarios.filter(item => {
    if (!searchTermUsuarios) return true;
    
    const searchLower = searchTermUsuarios.toLowerCase();
    const nombreCompleto = item.nombre_completo?.toLowerCase() || '';
    const dni = item.dni?.toLowerCase() || '';
    const telefono = item.telefono?.toLowerCase() || '';
    const username = item.username?.toLowerCase() || '';
    const email = item.email?.toLowerCase() || '';
    
    // Obtener nombre del rol (manejar arrays vacíos)
    let nombreRol = '';
    if (item.id_rol !== null && item.id_rol !== undefined && roles && roles.length > 0) {
      const rol = roles.find(r => r.id_rol === item.id_rol);
      nombreRol = rol?.nombre ? rol.nombre.toLowerCase() : '';
    }
    
    // Obtener nombre de la empresa (manejar null y arrays vacíos)
    let nombreEmpresa = '';
    if (item.id_empresa !== null && item.id_empresa !== undefined && empresas && empresas.length > 0) {
      const empresa = empresas.find(e => e.id_empresa === item.id_empresa);
      nombreEmpresa = empresa?.nombre_empresa ? empresa.nombre_empresa.toLowerCase() : '';
    }
    
    // Obtener estado (Activo/Inactivo)
    const estadoStr = (item.activo === true || item.activo === 'true' || item.activo === 1) ? 'activo' : 'inactivo';
    
    return nombreCompleto.includes(searchLower) ||
           nombreRol.includes(searchLower) ||
           nombreEmpresa.includes(searchLower) ||
           dni.includes(searchLower) ||
           telefono.includes(searchLower) ||
           email.includes(searchLower) ||
           username.includes(searchLower) ||
           estadoStr.includes(searchLower);
  }) : [];

  // Calcular paginación para vehículos
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  // Filtrar empresas según búsqueda
  const filteredDataEmpresas = Array.isArray(empresasList) ? empresasList.filter(item => {
    if (!searchTermEmpresas) return true;
    const searchLower = searchTermEmpresas.toLowerCase();
    
    return (
      item.id_empresa?.toString().includes(searchLower) ||
      item.codigo_empresa?.toLowerCase().includes(searchLower) ||
      item.nombre_empresa?.toLowerCase().includes(searchLower) ||
      (item.nombre && item.nombre.toLowerCase().includes(searchLower)) ||
      item.email?.toLowerCase().includes(searchLower) ||
      item.telefono?.toLowerCase().includes(searchLower)
    );
  }) : [];

  // Calcular paginación para usuarios
  const totalItemsUsuarios = filteredDataUsuarios.length;
  const totalPagesUsuarios = Math.ceil(totalItemsUsuarios / itemsPerPageUsuarios);
  const startIndexUsuarios = (currentPageUsuarios - 1) * itemsPerPageUsuarios;
  const endIndexUsuarios = startIndexUsuarios + itemsPerPageUsuarios;
  const currentDataUsuarios = filteredDataUsuarios.slice(startIndexUsuarios, endIndexUsuarios);

  // Calcular paginación para empresas
  const totalItemsEmpresas = filteredDataEmpresas.length;
  const totalPagesEmpresas = Math.ceil(totalItemsEmpresas / itemsPerPageEmpresas);
  const startIndexEmpresas = (currentPageEmpresas - 1) * itemsPerPageEmpresas;
  const endIndexEmpresas = startIndexEmpresas + itemsPerPageEmpresas;
  const currentDataEmpresas = filteredDataEmpresas.slice(startIndexEmpresas, endIndexEmpresas);

  // Logs de depuración (solo cuando cambian los datos principales)
  useEffect(() => {
    console.log('=== ESTADO DE DATOS ===');
    console.log('Vehículos totales:', vehiculos.length);
    console.log('Usuarios totales:', usuarios.length);
    console.log('Vehículos filtrados:', filteredData.length);
    console.log('Usuarios filtrados:', filteredDataUsuarios.length);
    console.log('Tab activo:', activeTab);
    console.log('Datos actuales vehículos:', currentData.length);
    console.log('Datos actuales usuarios:', currentDataUsuarios.length);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehiculos.length, usuarios.length, activeTab]);


  return (
    <div className="w-full">
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

      {/* Modal de confirmación para eliminar empresa */}
      {showDeleteEmpresaModal && empresaToDelete && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backgroundColor: 'rgba(0, 124, 138, 0.5)' }}
          onClick={() => {
            if (!isDeletingEmpresa) {
              setShowDeleteEmpresaModal(false);
              setEmpresaToDelete(null);
            }
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
              <div className="flex items-center gap-3">
                <div 
                  className="rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: 'rgba(220, 38, 38, 0.1)',
                    width: '40px',
                    height: '40px'
                  }}
                >
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 
                  className="text-xl font-bold"
                  style={{ 
                    color: '#1F2937'
                  }}
                >
                  Confirmar eliminación
                </h3>
              </div>
            </div>

            {/* Contenido del modal */}
            <div className="px-6 py-4">
              <p 
                className="text-base mb-4"
                style={{ 
                  color: '#374151',
                  lineHeight: '1.6'
                }}
              >
                ¿Está seguro que desea eliminar la empresa <strong>{empresaToDelete.nombre_empresa || empresaToDelete.nombre || 'N/A'}</strong>?
              </p>
              <p 
                className="text-sm"
                style={{ 
                  color: '#6B7280'
                }}
              >
                Esta acción no se puede deshacer.
              </p>
            </div>

            {/* Footer del modal */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  if (!isDeletingEmpresa) {
                    setShowDeleteEmpresaModal(false);
                    setEmpresaToDelete(null);
                  }
                }}
                disabled={isDeletingEmpresa}
                className="px-4 py-2 rounded-lg border border-gray-300 transition-all hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: '#FFFFFF',
                  color: '#374151',
                  fontFamily: 'Lato, sans-serif',
                  fontWeight: 'bold',
                  fontSize: '14px'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteEmpresa}
                disabled={isDeletingEmpresa}
                className="px-4 py-2 rounded-lg shadow-md transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  fontFamily: 'Lato, sans-serif',
                  fontWeight: 'bold',
                  fontSize: '14px'
                }}
              >
                {isDeletingEmpresa ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación para eliminar */}
      {showDeleteModal && vehiculoToDelete && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backgroundColor: 'rgba(0, 124, 138, 0.5)' }}
          onClick={() => {
            if (!isDeleting) {
              setShowDeleteModal(false);
              setVehiculoToDelete(null);
            }
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
              <div className="flex items-center gap-3">
                <div 
                  className="rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: 'rgba(220, 38, 38, 0.1)',
                    width: '40px',
                    height: '40px'
                  }}
                >
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 
                  className="text-xl font-bold"
                  style={{ 
                    color: '#1F2937'
                  }}
                >
                  Confirmar eliminación
                </h3>
              </div>
            </div>

            {/* Contenido del modal */}
            <div className="px-6 py-4">
              <p 
                className="text-base mb-4"
                style={{ 
                  color: '#374151',
                  lineHeight: '1.6'
                }}
              >
                ¿Está seguro que desea eliminar el vehículo <strong>{vehiculoToDelete.matricula || vehiculoToDelete.interno}</strong>?
              </p>
              <p 
                className="text-sm"
                style={{ 
                  color: '#6B7280'
                }}
              >
                Esta acción no se puede deshacer.
              </p>
            </div>

            {/* Footer del modal */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  if (!isDeleting) {
                    setShowDeleteModal(false);
                    setVehiculoToDelete(null);
                  }
                }}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg border border-gray-300 transition-all hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: '#FFFFFF',
                  color: '#374151',
                  fontFamily: 'Lato, sans-serif',
                  fontWeight: 'bold',
                  fontSize: '14px'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteVehiculo}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg shadow-md transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  fontFamily: 'Lato, sans-serif',
                  fontWeight: 'bold',
                  fontSize: '14px'
                }}
              >
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="px-3 sm:px-4 md:px-6 w-full">
        {/* Header */}
        <div 
          className="bg-[#007C8A] w-full px-3 sm:px-6 mb-4 sm:mb-6 rounded-lg mt-4 sm:mt-6 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4"
          style={{
            minHeight: '70px',
            paddingTop: '12px',
            paddingBottom: '12px'
          }}
        >
          <button
            onClick={() => navigate('/home')}
            className="rounded-full flex items-center justify-center transition-all hover:opacity-80 cursor-pointer flex-shrink-0"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              width: isMobile ? '32px' : '40px',
              height: isMobile ? '32px' : '40px'
            }}
          >
            <svg className={isMobile ? "w-5 h-5" : "w-6 h-6"} text-white fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1" style={{ fontFamily: 'Lato, sans-serif', lineHeight: '1.2' }}>
              Registros
            </h1>
            <p className="text-white text-xs sm:text-sm font-normal" style={{ fontFamily: 'Lato, sans-serif', lineHeight: '1.2' }}>
              Alta y baja de unidades y activos
            </p>
          </div>
        </div>

        {/* Control segmentado Unidades/Usuarios y botón Nueva unidad */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 mb-4">
          {/* Control segmentado */}
          <div className="flex flex-1 sm:flex-initial" style={{ borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', minWidth: '200px', maxWidth: isMobile ? '100%' : '493px', width: isMobile ? '100%' : '493px', height: '42px' }}>
            {/* Botón Unidades */}
          <button
            onClick={() => {
              setActiveTab('unidades');
              // Cerrar formularios si están abiertos
              if (showFormUsuario) {
                setShowFormUsuario(false);
                setFieldErrorsUsuario({});
              }
            }}
              className="transition-all"
            style={{
              backgroundColor: activeTab === 'unidades' ? '#007C8A' : '#FFFFFF',
              color: activeTab === 'unidades' ? '#FFFFFF' : '#007C8A',
              fontFamily: 'Lato, sans-serif',
              fontWeight: 'bold',
              fontSize: isMobile ? '14px' : '16px',
                width: '33.33%',
                height: '42px',
                border: activeTab === 'unidades' ? 'none' : '1px solid #007C8A',
                borderRight: 'none',
                borderTopLeftRadius: '8px',
                borderBottomLeftRadius: '8px',
                borderTopRightRadius: '0px',
                borderBottomRightRadius: '0px',
              display: 'flex',
              alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                padding: '0',
                margin: '0'
            }}
          >
            Unidades
          </button>

            {/* Botón Usuarios */}
          <button
            onClick={() => {
              setActiveTab('usuarios');
              // Cerrar formularios si están abiertos
              if (showForm) {
                setShowForm(false);
                setIsEditMode(false);
                setEditingVehiculoId(null);
                setEditingVehiculoJsonId(null);
                setFieldErrors({});
              }
            }}
              className="transition-all"
            style={{
              backgroundColor: activeTab === 'usuarios' ? '#007C8A' : '#FFFFFF',
              color: activeTab === 'usuarios' ? '#FFFFFF' : '#007C8A',
              fontFamily: 'Lato, sans-serif',
              fontWeight: 'bold',
              fontSize: isMobile ? '14px' : '16px',
                width: '33.33%',
                height: '42px',
                border: '1px solid #007C8A',
                borderLeft: 'none',
                borderRight: 'none',
                borderRadius: '0px',
              display: 'flex',
              alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                padding: '0',
                margin: '0'
            }}
          >
            Usuarios
          </button>

            {/* Botón Empresas */}
          <button
            onClick={() => {
              setActiveTab('empresas');
              // Cerrar formularios si están abiertos
              if (showForm) {
                setShowForm(false);
                setIsEditMode(false);
                setEditingVehiculoId(null);
                setEditingVehiculoJsonId(null);
                setFieldErrors({});
              }
              if (showFormUsuario) {
                setShowFormUsuario(false);
                setFieldErrorsUsuario({});
              }
            }}
              className="transition-all"
            style={{
              backgroundColor: activeTab === 'empresas' ? '#007C8A' : '#FFFFFF',
              color: activeTab === 'empresas' ? '#FFFFFF' : '#007C8A',
              fontFamily: 'Lato, sans-serif',
              fontWeight: 'bold',
              fontSize: isMobile ? '14px' : '16px',
                width: '33.33%',
                height: '42px',
                border: '1px solid #007C8A',
                borderLeft: 'none',
                borderTopLeftRadius: '0px',
                borderBottomLeftRadius: '0px',
                borderTopRightRadius: '8px',
                borderBottomRightRadius: '8px',
              display: 'flex',
              alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                padding: '0',
                margin: '0'
            }}
          >
            Empresas
          </button>
          </div>

          {/* Botón Nueva unidad / Nuevo usuario - alineado a la derecha en la misma línea */}
          {!showForm && activeTab === 'unidades' && (
            <div className="w-full sm:w-auto">
          <button
              onClick={() => {
                setIsEditMode(false);
                setEditingVehiculoId(null);
                setEditingVehiculoJsonId(null);
                setFieldErrors({});
                setFormData({
                  id_empresa: '',
                  interno: '',
                  matricula: '',
                  marca: '',
                  modelo: '',
                  anio: '',
                  kilometros: '',
                  tipo_servicio: '',
                  id_conductor_activo: '',
                  activo: '',
                  posee_ac: '',
                  posee_camara: '',
                  nombre_seguro: '',
                  tipo_seguro_cobertura: 'Todo riesgo', // Pre-cargado
                  fecha_vencimiento_seguro: '',
                  fecha_ultima_rto: ''
                });
                setShowForm(true);
              }}
              className="w-full sm:w-auto px-3 sm:px-4 rounded-lg shadow-md flex items-center justify-center gap-2 transition-all hover:shadow-lg whitespace-nowrap"
            style={{
                backgroundColor: '#007C8A',
                color: '#FFFFFF',
              fontFamily: 'Lato, sans-serif',
              fontWeight: 'bold',
                fontSize: isMobile ? '13px' : '14px',
                height: '42px',
                paddingLeft: isMobile ? '12px' : '16px',
                paddingRight: isMobile ? '12px' : '16px',
                borderRadius: '8px'
              }}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Nueva unidad
          </button>
        </div>
          )}
          {!showFormUsuario && activeTab === 'usuarios' && (
            <div className="w-full sm:w-auto">
            <button
              onClick={() => {
                setShowFormUsuario(true);
                setShowPassword(false);
                setFieldErrorsUsuario({});
                setFormDataUsuario({
                  nombre_completo: '',
                  telefono: '',
                  username: '', // Se sincronizará automáticamente con email
                  password_hash: '',
                  dni: '',
                  id_empresa: '',
                  email: '',
                  id_rol: ''
                });
              }}
              className="w-full sm:w-auto px-3 sm:px-4 rounded-lg shadow-md flex items-center justify-center gap-2 transition-all hover:shadow-lg whitespace-nowrap"
              style={{
                backgroundColor: '#007C8A',
                color: '#FFFFFF',
                fontFamily: 'Lato, sans-serif',
                fontWeight: 'bold',
                fontSize: isMobile ? '13px' : '14px',
                height: '42px',
                paddingLeft: isMobile ? '12px' : '16px',
                paddingRight: isMobile ? '12px' : '16px',
                borderRadius: '8px'
              }}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Nuevo usuario
            </button>
          </div>
        )}
          {!showFormEmpresa && activeTab === 'empresas' && (
            <div className="w-full sm:w-auto">
            <button
              onClick={() => {
                setIsEditModeEmpresa(false);
                setEditingEmpresaId(null);
                setFieldErrorsEmpresa({});
                setFormDataEmpresa({
                  nombre_empresa: '',
                  codigo_empresa: '',
                  telefono: '',
                  cuit: '',
                  email: ''
                });
                setShowFormEmpresa(true);
              }}
              className="w-full sm:w-auto px-3 sm:px-4 rounded-lg shadow-md flex items-center justify-center gap-2 transition-all hover:shadow-lg whitespace-nowrap"
              style={{
                backgroundColor: '#007C8A',
                color: '#FFFFFF',
                fontFamily: 'Lato, sans-serif',
                fontWeight: 'bold',
                fontSize: isMobile ? '13px' : '14px',
                height: '42px',
                paddingLeft: isMobile ? '12px' : '16px',
                paddingRight: isMobile ? '12px' : '16px',
                borderRadius: '8px'
              }}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Nueva empresa
            </button>
          </div>
        )}
        </div>

        {/* Formulario de Alta de unidad */}
        {showForm && (
          <div className="mb-6" data-form-section>
            {/* Header del formulario */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div 
                  className="rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: '#E6FFE6',
                    width: '32px',
                    height: '32px'
                  }}
                >
                  <svg className="w-5 h-5 text-[#00B69B]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 
                  className="text-lg sm:text-xl font-bold"
                  style={{ 
                    fontFamily: 'Lato, sans-serif',
                    color: '#1F2937'
                  }}
                >
                  {isEditMode ? 'Editar unidad' : 'Alta de unidad'}
                </h2>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <button
                  onClick={handleDownloadTemplate}
                  className="w-full sm:w-auto px-3 sm:px-4 py-2 rounded-lg shadow-md flex items-center justify-center gap-2 transition-all hover:shadow-lg whitespace-nowrap border border-[#007C8A]"
                  style={{
                    backgroundColor: '#FFFFFF',
                    color: '#007C8A',
                    fontFamily: 'Lato, sans-serif',
                    fontWeight: 'bold',
                    fontSize: isMobile ? '13px' : '14px'
                  }}
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span className="hidden sm:inline">Descargar plantilla</span>
                  <span className="sm:hidden">Plantilla</span>
                </button>
                <button
                  onClick={() => setShowCargaMasivaModal(true)}
                className="w-full sm:w-auto px-3 sm:px-4 py-2 rounded-lg shadow-md flex items-center justify-center gap-2 transition-all hover:shadow-lg whitespace-nowrap"
                style={{
                  backgroundColor: '#007C8A',
                  color: '#FFFFFF',
                  fontFamily: 'Lato, sans-serif',
                  fontWeight: 'bold',
                  fontSize: isMobile ? '13px' : '14px'
                }}
              >
                Carga masiva
              </button>
              </div>
            </div>

            
            <div 
              className="bg-white rounded-lg shadow-md mb-4"
              style={{
                padding: '24px',
                border: '1px solid #E5E7EB'
              }}
            >
              <h3 
                className="text-lg font-bold mb-2"
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  color: '#1F2937'
                }}
              >
                Datos principales
              </h3>
              <p 
                className="text-sm mb-6"
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  color: '#6B7280'
                }}
              >
                Complete la información obligatoria de la unidad
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Matrícula (Patente) */}
                <div>
                  <label 
                    className="block text-sm font-medium mb-2"
                    style={{ 
                      fontFamily: 'Lato, sans-serif',
                      color: '#374151'
                    }}
                  >
                    Matrícula / Patente*
                  </label>
                  <input
                    type="text"
                    name="matricula"
                    data-field="matricula"
                    required
                    value={formData.matricula}
                    onChange={(e) => {
                      setFormData({ ...formData, matricula: e.target.value });
                      if (fieldErrors.matricula) {
                        setFieldErrors({ ...fieldErrors, matricula: '' });
                      }
                    }}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                      fieldErrors.matricula 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-[#007C8A]'
                    }`}
                    style={{ 
                      fontFamily: 'Lato, sans-serif',
                      fontSize: '14px'
                    }}
                    placeholder="ABC-123"
                  />
                  {fieldErrors.matricula && (
                    <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                      {fieldErrors.matricula}
                    </p>
                  )}
                </div>

                {/* N° de interno */}
                <div>
                  <label 
                    className="block text-sm font-medium mb-2"
                    style={{ 
                      fontFamily: 'Lato, sans-serif',
                      color: '#374151'
                    }}
                  >
                    N° de interno*
                  </label>
                  <input
                    type="text"
                    name="interno"
                    data-field="interno"
                    required
                    value={formData.interno}
                    onChange={(e) => {
                      setFormData({ ...formData, interno: e.target.value });
                      if (fieldErrors.interno) {
                        setFieldErrors({ ...fieldErrors, interno: '' });
                      }
                    }}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                      fieldErrors.interno 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-[#007C8A]'
                    }`}
                    style={{ 
                      fontFamily: 'Lato, sans-serif',
                      fontSize: '14px'
                    }}
                    placeholder="INT-001"
                  />
                  {fieldErrors.interno && (
                    <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                      {fieldErrors.interno}
                    </p>
                  )}
                </div>

                {/* Empresa */}
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
                  <select
                    name="id_empresa"
                    data-field="id_empresa"
                    required
                    value={formData.id_empresa}
                    onChange={(e) => {
                      const nuevaEmpresa = e.target.value;
                      // Limpiar el conductor si no pertenece a la nueva empresa
                      let nuevoConductor = formData.id_conductor_activo;
                      if (nuevaEmpresa && nuevoConductor) {
                        const conductorSeleccionado = conductores.find(c => 
                          c.id_conductor === parseInt(nuevoConductor, 10)
                        );
                        if (!conductorSeleccionado || 
                            conductorSeleccionado.id_empresa !== parseInt(nuevaEmpresa, 10)) {
                          nuevoConductor = '';
                        }
                      } else if (!nuevaEmpresa) {
                        nuevoConductor = '';
                      }
                      setFormData({ 
                        ...formData, 
                        id_empresa: nuevaEmpresa,
                        id_conductor_activo: nuevoConductor
                      });
                      if (fieldErrors.id_empresa) {
                        setFieldErrors({ ...fieldErrors, id_empresa: '' });
                      }
                      if (fieldErrors.id_conductor_activo) {
                        setFieldErrors({ ...fieldErrors, id_conductor_activo: '' });
                      }
                    }}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                      fieldErrors.id_empresa 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-[#007C8A]'
                    }`}
                    style={{ 
                      fontFamily: 'Lato, sans-serif',
                      fontSize: '14px',
                      zIndex: 10
                    }}
                  >
                    <option value="">Seleccione una empresa</option>
                    {empresas.map(empresa => (
                      <option key={empresa.id_empresa} value={empresa.id_empresa}>
                        {empresa.nombre_empresa}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.id_empresa && (
                    <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                      {fieldErrors.id_empresa}
                    </p>
                  )}
                </div>

                {/* Conductor activo */}
                <div>
                  <label 
                    className="block text-sm font-medium mb-2"
                    style={{ 
                      fontFamily: 'Lato, sans-serif',
                      color: '#374151'
                    }}
                  >
                    Conductor asignado (activo)*
                  </label>
                  <select
                    name="id_conductor_activo"
                    data-field="id_conductor_activo"
                    required
                    value={formData.id_conductor_activo}
                    onChange={(e) => {
                      setFormData({ ...formData, id_conductor_activo: e.target.value });
                      if (fieldErrors.id_conductor_activo) {
                        setFieldErrors({ ...fieldErrors, id_conductor_activo: '' });
                      }
                    }}
                    disabled={!formData.id_empresa}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                      fieldErrors.id_conductor_activo 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-[#007C8A]'
                    } ${!formData.id_empresa ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    style={{ 
                      fontFamily: 'Lato, sans-serif',
                      fontSize: '14px',
                      zIndex: 10
                    }}
                  >
                    <option value="">
                      {!formData.id_empresa 
                        ? 'Seleccione primero una empresa' 
                        : 'Seleccione un conductor'}
                    </option>
                    {(() => {
                      // Filtrar conductores: solo activos de la empresa seleccionada
                      const conductoresFiltrados = Array.isArray(conductores) 
                        ? conductores.filter(c => {
                            const esActivo = c.activo === true || c.activo === 'true' || c.activo === 1;
                            const perteneceEmpresa = formData.id_empresa 
                              ? c.id_empresa === parseInt(formData.id_empresa, 10)
                              : false;
                            return esActivo && perteneceEmpresa;
                          })
                        : [];
                      
                      return conductoresFiltrados.map((c) => (
                        <option key={c.id_conductor} value={c.id_conductor}>
                          {c.apellido ? `${c.apellido}, ${c.nombre}` : c.nombre} (ID {c.id_conductor})
                        </option>
                      ));
                    })()}
                  </select>
                  {fieldErrors.id_conductor_activo && (
                    <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                      {fieldErrors.id_conductor_activo}
                    </p>
                  )}
                </div>

                {/* Marca */}
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
                    name="marca"
                    data-field="marca"
                    required
                    value={formData.marca}
                    onChange={(e) => {
                      setFormData({ ...formData, marca: e.target.value });
                      if (fieldErrors.marca) {
                        setFieldErrors({ ...fieldErrors, marca: '' });
                      }
                    }}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                      fieldErrors.marca 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-[#007C8A]'
                    }`}
                    style={{ 
                      fontFamily: 'Lato, sans-serif',
                      fontSize: '14px'
                    }}
                    placeholder="Mercedes Benz"
                  />
                  {fieldErrors.marca && (
                    <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                      {fieldErrors.marca}
                    </p>
                  )}
                </div>

                {/* Modelo */}
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
                    name="modelo"
                    data-field="modelo"
                    required
                    value={formData.modelo}
                    onChange={(e) => {
                      setFormData({ ...formData, modelo: e.target.value });
                      if (fieldErrors.modelo) {
                        setFieldErrors({ ...fieldErrors, modelo: '' });
                      }
                    }}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                      fieldErrors.modelo 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-[#007C8A]'
                    }`}
                    style={{ 
                      fontFamily: 'Lato, sans-serif',
                      fontSize: '14px'
                    }}
                    placeholder="OH-1418"
                  />
                  {fieldErrors.modelo && (
                    <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                      {fieldErrors.modelo}
                    </p>
                  )}
                </div>

                {/* Año */}
                <div>
                  <label 
                    className="block text-sm font-medium mb-2"
                    style={{ 
                      fontFamily: 'Lato, sans-serif',
                      color: '#374151'
                    }}
                  >
                    Año*
                  </label>
                  <input
                    type="number"
                    name="anio"
                    data-field="anio"
                    required
                    min={1900}
                    max={3000}
                    value={formData.anio}
                    onChange={(e) => {
                      setFormData({ ...formData, anio: e.target.value });
                      if (fieldErrors.anio) {
                        setFieldErrors({ ...fieldErrors, anio: '' });
                      }
                    }}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                      fieldErrors.anio 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-[#007C8A]'
                    }`}
                    style={{ 
                      fontFamily: 'Lato, sans-serif',
                      fontSize: '14px'
                    }}
                    placeholder="2024"
                  />
                  {fieldErrors.anio && (
                    <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                      {fieldErrors.anio}
                    </p>
                  )}
                </div>

                {/* Kilómetros */}
                <div>
                  <label 
                    className="block text-sm font-medium mb-2"
                    style={{ 
                      fontFamily: 'Lato, sans-serif',
                      color: '#374151'
                    }}
                  >
                    Kilómetros / Odómetro*
                  </label>
                  <input
                    type="number"
                    name="kilometros"
                    data-field="kilometros"
                    required
                    min={0}
                    value={formData.kilometros}
                    onChange={(e) => {
                      setFormData({ ...formData, kilometros: e.target.value });
                      if (fieldErrors.kilometros) {
                        setFieldErrors({ ...fieldErrors, kilometros: '' });
                      }
                    }}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                      fieldErrors.kilometros 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-[#007C8A]'
                    }`}
                    style={{ 
                      fontFamily: 'Lato, sans-serif',
                      fontSize: '14px'
                    }}
                    placeholder="150000"
                  />
                  {fieldErrors.kilometros && (
                    <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                      {fieldErrors.kilometros}
                    </p>
                  )}
                </div>

                {/* Horómetro */}
                <div>
                  <label 
                    className="block text-sm font-medium mb-2"
                    style={{ 
                      fontFamily: 'Lato, sans-serif',
                      color: '#374151'
                    }}
                  >
                    Horómetro
                  </label>
                  <input
                    type="number"
                    name="horometro"
                    data-field="horometro"
                    min={0}
                    value={formData.horometro}
                    onChange={(e) => {
                      setFormData({ ...formData, horometro: e.target.value });
                      if (fieldErrors.horometro) {
                        setFieldErrors({ ...fieldErrors, horometro: '' });
                      }
                    }}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                      fieldErrors.horometro 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-[#007C8A]'
                    }`}
                    style={{ 
                      fontFamily: 'Lato, sans-serif',
                      fontSize: '14px'
                    }}
                    placeholder="50000"
                  />
                  {fieldErrors.horometro && (
                    <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                      {fieldErrors.horometro}
                    </p>
                  )}
                </div>

                {/* Tipo de servicio */}
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
                    name="tipo_servicio"
                    data-field="tipo_servicio"
                    required
                    value={formData.tipo_servicio}
                    onChange={(e) => {
                      setFormData({ ...formData, tipo_servicio: e.target.value });
                      if (fieldErrors.tipo_servicio) {
                        setFieldErrors({ ...fieldErrors, tipo_servicio: '' });
                      }
                    }}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                      fieldErrors.tipo_servicio 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-[#007C8A]'
                    }`}
                    style={{ 
                      fontFamily: 'Lato, sans-serif',
                      fontSize: '14px',
                      zIndex: 10
                    }}
                  >
                    <option value="">Seleccione un tipo</option>
                    <option value="Urbano">Urbano</option>
                    <option value="Larga/media distancia">Larga/media distancia</option>
                  </select>
                  {fieldErrors.tipo_servicio && (
                    <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                      {fieldErrors.tipo_servicio}
                    </p>
                  )}
                </div>

                {/* Activo */}
                <div>
                  <label 
                    className="block text-sm font-medium mb-2"
                    style={{ 
                      fontFamily: 'Lato, sans-serif',
                      color: '#374151'
                    }}
                  >
                    Activo*
                  </label>
                  <select
                    name="activo"
                    data-field="activo"
                    required
                    value={formData.activo}
                    onChange={(e) => {
                      setFormData({ ...formData, activo: e.target.value });
                      if (fieldErrors.activo) {
                        setFieldErrors({ ...fieldErrors, activo: '' });
                      }
                    }}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                      fieldErrors.activo 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-[#007C8A]'
                    }`}
                    style={{ 
                      fontFamily: 'Lato, sans-serif',
                      fontSize: '14px',
                      zIndex: 10
                    }}
                  >
                    <option value="">Seleccione una opción</option>
                    <option value="true">Sí</option>
                    <option value="false">No</option>
                  </select>
                  {fieldErrors.activo && (
                    <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                      {fieldErrors.activo}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Sección 2: Equipamiento */}
            <div 
              className="bg-white rounded-lg shadow-md mb-4"
              style={{
                padding: '24px',
                border: '1px solid #E5E7EB'
              }}
            >
              <h3 
                className="text-lg font-bold mb-2"
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  color: '#1F2937'
                }}
              >
                Equipamiento
              </h3>
              <p 
                className="text-sm mb-6"
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  color: '#6B7280'
                }}
              >
                Indique la disponibilidad (Sí/No) de cada ítem
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Posee aire acondicionado (AC) - Radio buttons */}
                <div>
                  <label 
                    className="block text-sm font-medium mb-2"
                    style={{ 
                      fontFamily: 'Lato, sans-serif',
                      color: '#374151'
                    }}
                  >
                    Posee aire acondicionado (AC)*
                  </label>
                  <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                        type="radio"
                        name="posee_ac"
                        data-field="posee_ac"
                        value="true"
                        checked={formData.posee_ac === 'true'}
                        onChange={(e) => {
                          setFormData({ ...formData, posee_ac: e.target.value });
                          if (fieldErrors.posee_ac) {
                            setFieldErrors({ ...fieldErrors, posee_ac: '' });
                          }
                        }}
                        required
                        className="w-4 h-4 text-[#007C8A] border-gray-300 focus:ring-[#007C8A]"
                        style={{ accentColor: '#007C8A' }}
                  />
                  <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '14px', color: '#374151' }}>
                        Sí
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                        type="radio"
                        name="posee_ac"
                        data-field="posee_ac"
                        value="false"
                        checked={formData.posee_ac === 'false'}
                        onChange={(e) => {
                          setFormData({ ...formData, posee_ac: e.target.value });
                          if (fieldErrors.posee_ac) {
                            setFieldErrors({ ...fieldErrors, posee_ac: '' });
                          }
                        }}
                        required
                        className="w-4 h-4 text-[#007C8A] border-gray-300 focus:ring-[#007C8A]"
                        style={{ accentColor: '#007C8A' }}
                  />
                  <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '14px', color: '#374151' }}>
                        No
                  </span>
                </label>
                  </div>
                  {fieldErrors.posee_ac && (
                    <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                      {fieldErrors.posee_ac}
                    </p>
                  )}
                </div>

                {/* Posee cámara - Radio buttons */}
                <div>
                  <label 
                    className="block text-sm font-medium mb-2"
                    style={{ 
                      fontFamily: 'Lato, sans-serif',
                      color: '#374151'
                    }}
                  >
                    Posee cámara*
                  </label>
                  <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                        type="radio"
                        name="posee_camara"
                        data-field="posee_camara"
                        value="true"
                        checked={formData.posee_camara === 'true'}
                        onChange={(e) => {
                          setFormData({ ...formData, posee_camara: e.target.value });
                          if (fieldErrors.posee_camara) {
                            setFieldErrors({ ...fieldErrors, posee_camara: '' });
                          }
                        }}
                        required
                        className="w-4 h-4 text-[#007C8A] border-gray-300 focus:ring-[#007C8A]"
                        style={{ accentColor: '#007C8A' }}
                  />
                  <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '14px', color: '#374151' }}>
                        Sí
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                        type="radio"
                        name="posee_camara"
                        data-field="posee_camara"
                        value="false"
                        checked={formData.posee_camara === 'false'}
                        onChange={(e) => {
                          setFormData({ ...formData, posee_camara: e.target.value });
                          if (fieldErrors.posee_camara) {
                            setFieldErrors({ ...fieldErrors, posee_camara: '' });
                          }
                        }}
                        required
                        className="w-4 h-4 text-[#007C8A] border-gray-300 focus:ring-[#007C8A]"
                        style={{ accentColor: '#007C8A' }}
                  />
                  <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '14px', color: '#374151' }}>
                        No
                  </span>
                </label>
                  </div>
                  {fieldErrors.posee_camara && (
                    <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                      {fieldErrors.posee_camara}
                    </p>
                  )}
                </div>
              </div>
              </div>

            {/* Sección 3: Seguro y RTO */}
            <div 
              className="bg-white rounded-lg shadow-md mb-4"
              style={{
                padding: '24px',
                border: '1px solid #E5E7EB'
              }}
            >
              <h3 
                className="text-lg font-bold mb-2"
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  color: '#1F2937'
                }}
              >
                Seguro y RTO
              </h3>
              <p 
                className="text-sm mb-6"
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  color: '#6B7280'
                }}
              >
                Complete los datos obligatorios de cobertura y vencimientos
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nombre de seguro */}
                <div>
                  <label 
                    className="block text-sm font-medium mb-2"
                    style={{ 
                      fontFamily: 'Lato, sans-serif',
                      color: '#374151'
                    }}
                  >
                    Nombre de seguro*
                  </label>
                  <input
                    type="text"
                    name="nombre_seguro"
                    data-field="nombre_seguro"
                    required
                    value={formData.nombre_seguro}
                    onChange={(e) => {
                      setFormData({ ...formData, nombre_seguro: e.target.value });
                      if (fieldErrors.nombre_seguro) {
                        setFieldErrors({ ...fieldErrors, nombre_seguro: '' });
                      }
                    }}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                      fieldErrors.nombre_seguro 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-[#007C8A]'
                    }`}
                    style={{ 
                      fontFamily: 'Lato, sans-serif',
                      fontSize: '14px'
                    }}
                    placeholder="Rivadavia"
                  />
                  {fieldErrors.nombre_seguro && (
                    <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                      {fieldErrors.nombre_seguro}
                    </p>
                  )}
                </div>

                {/* Tipo de cobertura */}
                <div>
                  <label 
                    className="block text-sm font-medium mb-2"
                    style={{ 
                      fontFamily: 'Lato, sans-serif',
                      color: '#374151'
                    }}
                  >
                    Tipo de seguro / cobertura*
                  </label>
                  <select
                    name="tipo_seguro_cobertura"
                    data-field="tipo_seguro_cobertura"
                    required
                    value={formData.tipo_seguro_cobertura}
                    readOnly
                    className={`w-full px-4 py-2 border rounded-lg bg-gray-100 ${
                      fieldErrors.tipo_seguro_cobertura 
                        ? 'border-red-500' 
                        : 'border-gray-300'
                    }`}
                    style={{ 
                      fontFamily: 'Lato, sans-serif',
                      fontSize: '14px',
                      cursor: 'not-allowed',
                      opacity: 0.8
                    }}
                    onFocus={(e) => e.target.blur()}
                  >
                    <option value="Todo riesgo">Todo riesgo</option>
                  </select>
                  {fieldErrors.tipo_seguro_cobertura && (
                    <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                      {fieldErrors.tipo_seguro_cobertura}
                    </p>
                  )}
                </div>

                {/* Fecha de vencimiento del seguro */}
                <div>
                  <label 
                    className="block text-sm font-medium mb-2"
                    style={{ 
                      fontFamily: 'Lato, sans-serif',
                      color: '#374151'
                    }}
                  >
                    Fecha de vencimiento del seguro*
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      name="fecha_vencimiento_seguro"
                      data-field="fecha_vencimiento_seguro"
                      required
                      value={formData.fecha_vencimiento_seguro}
                      onChange={(e) => {
                        setFormData({ ...formData, fecha_vencimiento_seguro: e.target.value });
                        if (fieldErrors.fecha_vencimiento_seguro) {
                          setFieldErrors({ ...fieldErrors, fecha_vencimiento_seguro: '' });
                        }
                      }}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                        fieldErrors.fecha_vencimiento_seguro 
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  {fieldErrors.fecha_vencimiento_seguro && (
                    <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                      {fieldErrors.fecha_vencimiento_seguro}
                    </p>
                  )}
                </div>

                {/* Fecha última RTO */}
                <div>
                  <label 
                    className="block text-sm font-medium mb-2"
                    style={{ 
                      fontFamily: 'Lato, sans-serif',
                      color: '#374151'
                    }}
                  >
                    Fecha última RTO*
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      name="fecha_ultima_rto"
                      data-field="fecha_ultima_rto"
                      required
                      value={formData.fecha_ultima_rto}
                      onChange={(e) => {
                        setFormData({ ...formData, fecha_ultima_rto: e.target.value });
                        if (fieldErrors.fecha_ultima_rto) {
                          setFieldErrors({ ...fieldErrors, fecha_ultima_rto: '' });
                        }
                      }}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                        fieldErrors.fecha_ultima_rto 
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  {fieldErrors.fecha_ultima_rto && (
                    <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                      {fieldErrors.fecha_ultima_rto}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowForm(false);
                  setIsEditMode(false);
                  setEditingVehiculoId(null);
                  setFieldErrors({});
                  setFormData({
                    id_empresa: '',
                    interno: '',
                    matricula: '',
                    marca: '',
                    modelo: '',
                    anio: '',
                    kilometros: '',
                    tipo_servicio: '',
                    id_conductor_activo: '',
                    activo: '',
                    posee_ac: '',
                    posee_camara: '',
                    nombre_seguro: '',
                    tipo_seguro_cobertura: '',
                    fecha_vencimiento_seguro: '',
                    fecha_ultima_rto: ''
                  });
                }}
                className="px-6 py-2 rounded-lg border border-[#007C8A] flex items-center gap-2 transition-all hover:bg-gray-50"
                style={{
                  backgroundColor: '#FFFFFF',
                  color: '#007C8A',
                  fontFamily: 'Lato, sans-serif',
                  fontWeight: 'bold',
                  fontSize: '14px'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateVehiculo}
                disabled={isSubmitting}
                className="px-6 py-2 rounded-lg shadow-md flex items-center gap-2 transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: '#007C8A',
                  color: '#FFFFFF',
                  fontFamily: 'Lato, sans-serif',
                  fontWeight: 'bold',
                  fontSize: '14px'
                }}
              >
                {isSubmitting ? (isEditMode ? 'Actualizando...' : 'Creando...') : (isEditMode ? 'Actualizar' : 'Crear')}
              </button>
            </div>
          </div>
        )}

        {/* Formulario de Alta de usuario */}
        {showFormUsuario && activeTab === 'usuarios' && (
          <div className="mb-6" data-form-section>
            {/* Header del formulario */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div 
                  className="rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: '#E6FFE6',
                    width: '32px',
                    height: '32px'
                  }}
                >
                  <svg className="w-5 h-5 text-[#00B69B]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 
                  className="text-lg sm:text-xl font-bold"
                  style={{ 
                    fontFamily: 'Lato, sans-serif',
                    color: '#1F2937'
                  }}
                >
                  {isEditModeUsuario ? 'Editar usuario' : 'Alta de usuario'}
                </h2>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
                <button
                  onClick={handleDownloadTemplateUsuario}
                  className="w-full sm:w-auto px-3 sm:px-4 py-2 rounded-lg shadow-md flex items-center justify-center gap-2 transition-all hover:shadow-lg whitespace-nowrap border border-[#007C8A]"
                  style={{
                    backgroundColor: '#FFFFFF',
                    color: '#007C8A',
                    fontFamily: 'Lato, sans-serif',
                    fontWeight: 'bold',
                    fontSize: isMobile ? '13px' : '14px'
                  }}
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span className="hidden sm:inline">Descargar plantilla</span>
                  <span className="sm:hidden">Plantilla</span>
                </button>
                <button
                  onClick={() => setShowCargaMasivaUsuarioModal(true)}
                  className="w-full sm:w-auto px-3 sm:px-4 py-2 rounded-lg shadow-md flex items-center justify-center gap-2 transition-all hover:shadow-lg whitespace-nowrap"
                  style={{
                    backgroundColor: '#007C8A',
                    color: '#FFFFFF',
                    fontFamily: 'Lato, sans-serif',
                    fontWeight: 'bold',
                    fontSize: isMobile ? '13px' : '14px'
                  }}
                >
                  Carga masiva
                </button>
              </div>
            </div>

            {/* Formulario con borde azul */}
            <div 
              className="bg-white rounded-lg shadow-md"
              style={{
                padding: '24px',
                border: '2px solid #007C8A',
                borderStyle: 'solid'
              }}
            >
              {/* Título y subtítulo */}
              <div className="mb-6">
                <h3 
                  className="text-lg font-bold mb-2"
                  style={{ 
                    fontFamily: 'Lato, sans-serif',
                    color: '#1F2937'
                  }}
                >
                  Nuevo usuario
                </h3>
                <p 
                  className="text-sm"
                  style={{ 
                    fontFamily: 'Lato, sans-serif',
                    color: '#6B7280'
                  }}
                >
                  Completa el formulario de registro
                </p>
              </div>

              {/* Campos del formulario en dos columnas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Columna izquierda */}
                <div className="space-y-4">
                  {/* Nombre completo */}
                  <div>
                    <label 
                      className="block text-sm font-semibold mb-2"
                      style={{ 
                        fontFamily: 'Lato, sans-serif',
                        color: '#374151'
                      }}
                    >
                      Nombre completo <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="nombre_completo"
                      data-field="nombre_completo"
                      required
                      value={formDataUsuario.nombre_completo}
                      onChange={(e) => {
                        setFormDataUsuario({ ...formDataUsuario, nombre_completo: e.target.value });
                        if (fieldErrorsUsuario.nombre_completo) {
                          setFieldErrorsUsuario({ ...fieldErrorsUsuario, nombre_completo: '' });
                        }
                      }}
                      placeholder="Ingrese nombre completo"
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                        fieldErrorsUsuario.nombre_completo
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-[#007C8A]'
                      }`}
                      style={{ 
                        fontFamily: 'Lato, sans-serif',
                        fontSize: '14px'
                      }}
                    />
                    {fieldErrorsUsuario.nombre_completo && (
                      <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                        {fieldErrorsUsuario.nombre_completo}
                      </p>
                    )}
                  </div>

                  {/* Teléfono */}
                  <div>
                    <label 
                      className="block text-sm font-semibold mb-2"
                      style={{ 
                        fontFamily: 'Lato, sans-serif',
                        color: '#374151'
                      }}
                    >
                      Teléfono <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="telefono"
                      data-field="telefono"
                      required
                      value={formDataUsuario.telefono}
                      onChange={(e) => {
                        setFormDataUsuario({ ...formDataUsuario, telefono: e.target.value });
                        if (fieldErrorsUsuario.telefono) {
                          setFieldErrorsUsuario({ ...fieldErrorsUsuario, telefono: '' });
                        }
                      }}
                      placeholder="Ingrese teléfono"
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                        fieldErrorsUsuario.telefono
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-[#007C8A]'
                      }`}
                      style={{ 
                        fontFamily: 'Lato, sans-serif',
                        fontSize: '14px'
                      }}
                    />
                    {fieldErrorsUsuario.telefono && (
                      <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                        {fieldErrorsUsuario.telefono}
                      </p>
                    )}
                  </div>

                  {/* E-Mail */}
                  <div>
                    <label 
                      className="block text-sm font-semibold mb-2"
                      style={{ 
                        fontFamily: 'Lato, sans-serif',
                        color: '#374151'
                      }}
                    >
                      E-Mail <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      data-field="email"
                      required
                      value={formDataUsuario.email}
                      onChange={(e) => {
                        const newEmail = e.target.value;
                        setFormDataUsuario({ 
                          ...formDataUsuario, 
                          email: newEmail,
                          username: newEmail // Sincronizar username con email
                        });
                        if (fieldErrorsUsuario.email) {
                          setFieldErrorsUsuario({ ...fieldErrorsUsuario, email: '' });
                        }
                        if (fieldErrorsUsuario.username) {
                          setFieldErrorsUsuario({ ...fieldErrorsUsuario, username: '' });
                        }
                      }}
                      placeholder="Ingrese e-mail"
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                        fieldErrorsUsuario.email
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-[#007C8A]'
                      }`}
                      style={{ 
                        fontFamily: 'Lato, sans-serif',
                        fontSize: '14px'
                      }}
                    />
                    {fieldErrorsUsuario.email && (
                      <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                        {fieldErrorsUsuario.email}
                      </p>
                    )}
                  </div>

                  {/* Contraseña */}
                  <div>
                    <label 
                      className="block text-sm font-semibold mb-2"
                      style={{ 
                        fontFamily: 'Lato, sans-serif',
                        color: '#374151'
                      }}
                    >
                      Contraseña {!isEditModeUsuario && <span className="text-red-500">*</span>}
                      {isEditModeUsuario && <span className="text-gray-500 text-xs">(Dejar vacío para mantener la actual)</span>}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password_hash"
                        data-field="password_hash"
                        required={!isEditModeUsuario}
                        value={formDataUsuario.password_hash}
                        onChange={(e) => {
                          setFormDataUsuario({ ...formDataUsuario, password_hash: e.target.value });
                          if (fieldErrorsUsuario.password_hash) {
                            setFieldErrorsUsuario({ ...fieldErrorsUsuario, password_hash: '' });
                          }
                        }}
                        placeholder={isEditModeUsuario ? "Dejar vacío para mantener la contraseña actual" : "Ingrese contraseña"}
                        className={`w-full px-4 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                          fieldErrorsUsuario.password_hash
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-300 focus:ring-[#007C8A]'
                        }`}
                        style={{ 
                          fontFamily: 'Lato, sans-serif',
                          fontSize: '14px'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                        style={{ 
                          fontFamily: 'Lato, sans-serif'
                        }}
                      >
                        {showPassword ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0L3 12m3.29-3.29L12 12m-3.29 3.29L12 21m8.71-9L21 12m0 0l-3.29-3.29M21 12l-3.29 3.29" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    {fieldErrorsUsuario.password_hash && (
                      <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                        {fieldErrorsUsuario.password_hash}
                      </p>
                    )}
                  </div>
                </div>

                {/* Columna derecha */}
                <div className="space-y-4">
                  {/* DNI */}
                  <div>
                    <label 
                      className="block text-sm font-semibold mb-2"
                      style={{ 
                        fontFamily: 'Lato, sans-serif',
                        color: '#374151'
                      }}
                    >
                      DNI <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="dni"
                      data-field="dni"
                      required
                      value={formDataUsuario.dni}
                      onChange={(e) => {
                        setFormDataUsuario({ ...formDataUsuario, dni: e.target.value });
                        if (fieldErrorsUsuario.dni) {
                          setFieldErrorsUsuario({ ...fieldErrorsUsuario, dni: '' });
                        }
                      }}
                      placeholder="Ingrese DNI"
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                        fieldErrorsUsuario.dni
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-[#007C8A]'
                      }`}
                      style={{ 
                        fontFamily: 'Lato, sans-serif',
                        fontSize: '14px'
                      }}
                    />
                    {fieldErrorsUsuario.dni && (
                      <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                        {fieldErrorsUsuario.dni}
                      </p>
                    )}
                  </div>

                  {/* Rol */}
                  <div>
                    <label 
                      className="block text-sm font-semibold mb-2"
                      style={{ 
                        fontFamily: 'Lato, sans-serif',
                        color: '#374151'
                      }}
                    >
                      Rol <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="id_rol"
                      data-field="id_rol"
                      required
                      value={formDataUsuario.id_rol}
                      onChange={(e) => {
                        const selectedRolId = e.target.value;
                        const rolIdNum = selectedRolId ? parseInt(selectedRolId, 10) : null;
                        // Si el rol es ADMIN (1), Inspector (3) o Auditor (4), limpiar y deshabilitar empresa
                        const shouldDisableEmpresa = rolIdNum === 1 || rolIdNum === 3 || rolIdNum === 4;
                        setFormDataUsuario({ 
                          ...formDataUsuario, 
                          id_rol: selectedRolId,
                          id_empresa: shouldDisableEmpresa ? '' : formDataUsuario.id_empresa
                        });
                        if (fieldErrorsUsuario.id_rol) {
                          setFieldErrorsUsuario({ ...fieldErrorsUsuario, id_rol: '' });
                        }
                      }}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                        fieldErrorsUsuario.id_rol
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-[#007C8A]'
                      }`}
                      style={{ 
                        fontFamily: 'Lato, sans-serif',
                        fontSize: '14px',
                        zIndex: 10
                      }}
                    >
                      <option value="">Seleccione rol</option>
                      {roles.map(rol => (
                        <option key={rol.id_rol} value={rol.id_rol}>
                          {rol.nombre}
                        </option>
                      ))}
                    </select>
                    {fieldErrorsUsuario.id_rol && (
                      <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                        {fieldErrorsUsuario.id_rol}
                      </p>
                    )}
                  </div>

                  {/* Nombre de usuario autorizado */}
                  <div>
                    <label 
                      className="block text-sm font-semibold mb-2"
                      style={{ 
                        fontFamily: 'Lato, sans-serif',
                        color: '#374151'
                      }}
                    >
                      Nombre de usuario autorizado <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="username"
                      data-field="username"
                      required
                      readOnly
                      value={formDataUsuario.username}
                      placeholder="Se copiará automáticamente del email"
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-gray-50 ${
                        fieldErrorsUsuario.username
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-[#007C8A]'
                      }`}
                      style={{ 
                        fontFamily: 'Lato, sans-serif',
                        fontSize: '14px',
                        cursor: 'not-allowed'
                      }}
                    />
                    {fieldErrorsUsuario.username && (
                      <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                        {fieldErrorsUsuario.username}
                      </p>
                    )}
                  </div>

                  {/* Empresa */}
                  <div>
                    <label 
                      className="block text-sm font-semibold mb-2"
                      style={{ 
                        fontFamily: 'Lato, sans-serif',
                        color: '#374151'
                      }}
                    >
                      Empresa
                    </label>
                    <select
                      name="id_empresa"
                      data-field="id_empresa"
                      value={formDataUsuario.id_empresa}
                      disabled={
                        formDataUsuario.id_rol && 
                        (parseInt(formDataUsuario.id_rol, 10) === 1 || 
                         parseInt(formDataUsuario.id_rol, 10) === 3 || 
                         parseInt(formDataUsuario.id_rol, 10) === 4)
                      }
                      onChange={(e) => {
                        setFormDataUsuario({ ...formDataUsuario, id_empresa: e.target.value });
                        if (fieldErrorsUsuario.id_empresa) {
                          setFieldErrorsUsuario({ ...fieldErrorsUsuario, id_empresa: '' });
                        }
                      }}
                      className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007C8A] ${
                        formDataUsuario.id_rol && 
                        (parseInt(formDataUsuario.id_rol, 10) === 1 || 
                         parseInt(formDataUsuario.id_rol, 10) === 3 || 
                         parseInt(formDataUsuario.id_rol, 10) === 4)
                          ? 'bg-gray-100 cursor-not-allowed'
                          : 'bg-white'
                      }`}
                      style={{ 
                        fontFamily: 'Lato, sans-serif',
                        fontSize: '14px',
                        zIndex: 10
                      }}
                    >
                      <option value="">Seleccione empresa</option>
                      {empresas.map(empresa => (
                        <option key={empresa.id_empresa} value={empresa.id_empresa}>
                          {empresa.nombre_empresa}
                        </option>
                      ))}
                    </select>
                    {fieldErrorsUsuario.id_empresa && (
                      <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                        {fieldErrorsUsuario.id_empresa}
                      </p>
                    )}
                  </div>

                  {/* Activo - Solo en modo edición */}
                  {isEditModeUsuario && (
                    <div>
                      <label 
                        className="block text-sm font-semibold mb-2"
                        style={{ 
                          fontFamily: 'Lato, sans-serif',
                          color: '#374151'
                        }}
                      >
                        Estado <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="activo"
                        data-field="activo"
                        required
                        value={formDataUsuario.activo}
                        onChange={(e) => {
                          setFormDataUsuario({ ...formDataUsuario, activo: e.target.value });
                          if (fieldErrorsUsuario.activo) {
                            setFieldErrorsUsuario({ ...fieldErrorsUsuario, activo: '' });
                          }
                        }}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-white"
                        style={{ 
                          fontFamily: 'Lato, sans-serif',
                          fontSize: '14px',
                          zIndex: 10
                        }}
                      >
                        <option value="">Seleccione estado</option>
                        <option value="true">Activo</option>
                        <option value="false">Inactivo</option>
                      </select>
                      {fieldErrorsUsuario.activo && (
                        <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                          {fieldErrorsUsuario.activo}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex justify-end gap-4 mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowFormUsuario(false);
                    setShowPassword(false);
                    setIsEditModeUsuario(false);
                    setEditingUsuarioId(null);
                    setFieldErrorsUsuario({});
                    setFormDataUsuario({
                      nombre_completo: '',
                      telefono: '',
                      username: '',
                      password_hash: '',
                      dni: '',
                      id_empresa: '',
                      email: '',
                      id_rol: '',
                      activo: ''
                    });
                  }}
                  className="px-6 py-2 rounded-lg border border-[#007C8A] flex items-center gap-2 transition-all hover:bg-gray-50"
                  style={{
                    backgroundColor: '#FFFFFF',
                    color: '#007C8A',
                    fontFamily: 'Lato, sans-serif',
                    fontWeight: 'bold',
                    fontSize: '14px'
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateUsuario}
                  disabled={isSubmittingUsuario}
                  className="px-6 py-2 rounded-lg shadow-md flex items-center gap-2 transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: '#007C8A',
                    color: '#FFFFFF',
                    fontFamily: 'Lato, sans-serif',
                    fontWeight: 'bold',
                    fontSize: '14px'
                  }}
                >
                  {isSubmittingUsuario ? (isEditModeUsuario ? 'Actualizando...' : 'Guardando...') : (isEditModeUsuario ? 'Actualizar' : 'Guardar')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sección de listado - Solo se muestra si no hay formulario abierto */}
        {!showForm && activeTab === 'unidades' && (
          <div 
            className="bg-white rounded-lg shadow-md"
            style={{
              padding: '24px',
              border: '1px solid #E5E7EB',
              backgroundColor: '#FFFFFF'
            }}
          >
          {/* Título, buscador y controles en la misma línea */}
          <div className="mb-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-4">
              <div className="flex-1 w-full lg:w-auto">
            <h2 
              className="text-lg sm:text-xl font-bold mb-2"
              style={{ 
                fontFamily: 'Lato, sans-serif',
                color: '#1F2937'
              }}
            >
              Listado de vehículos
            </h2>
            <p 
              className="text-xs sm:text-sm"
              style={{ 
                fontFamily: 'Lato, sans-serif',
                color: '#6B7280'
              }}
            >
              Detalle de los vehículos de la flota
            </p>
          </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 w-full lg:w-auto">
                <div className="w-full sm:w-auto" style={{ minWidth: isMobile ? '100%' : '250px', maxWidth: isMobile ? '100%' : '400px' }}>
                  <label 
                    htmlFor="search-vehiculos"
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
                      id="search-vehiculos"
                  placeholder="Ingrese su búsqueda"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                      className="w-full px-3 sm:px-4 py-2 pl-9 sm:pl-10 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#007C8A] focus:border-transparent"
                  style={{ 
                    fontFamily: 'Lato, sans-serif',
                    fontSize: isMobile ? '13px' : '14px'
                  }}
                />
                    <svg 
                      className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400"
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
              <button
                  onClick={handleDownloadTemplate}
                  className="w-full sm:w-auto px-3 sm:px-4 py-2 rounded-lg shadow-md flex items-center justify-center gap-2 transition-all hover:shadow-lg whitespace-nowrap border border-[#007C8A]"
                style={{ 
                    backgroundColor: '#FFFFFF',
                    color: '#007C8A',
                  fontFamily: 'Lato, sans-serif',
                    fontWeight: 'bold',
                    fontSize: isMobile ? '13px' : '14px'
                }}
              >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                  <span className="hidden sm:inline">Descargar plantilla</span>
                  <span className="sm:hidden">Plantilla</span>
                </button>
                <button
                  onClick={() => setShowCargaMasivaModal(true)}
                  className="w-full sm:w-auto px-3 sm:px-4 py-2 rounded-lg shadow-md flex items-center justify-center gap-2 transition-all hover:shadow-lg whitespace-nowrap"
                  style={{
                    backgroundColor: '#007C8A',
                    color: '#FFFFFF',
                    fontFamily: 'Lato, sans-serif',
                    fontWeight: 'bold',
                    fontSize: isMobile ? '13px' : '14px'
                  }}
                >
                  Carga masiva
              </button>
              </div>
              </div>
            </div>
          </div>

          {/* Tabla */}
          <div className="bg-white rounded-lg overflow-hidden">
            <div className="overflow-x-auto -mx-3 sm:-mx-4 md:mx-0 w-full">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-gray-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                    Cargando datos...
                  </div>
                </div>
              ) : (
                <div className="inline-block min-w-full align-middle">
                  <table className="w-full min-w-[1300px]" style={{ fontFamily: 'Lato, sans-serif' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F3F4F6' }}>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap" style={{ fontSize: '12px', color: '#374151' }}>Patente</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap" style={{ fontSize: '12px', color: '#374151' }}>Interno</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap" style={{ fontSize: '12px', color: '#374151' }}>Marca</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap" style={{ fontSize: '12px', color: '#374151' }}>Modelo</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap" style={{ fontSize: '12px', color: '#374151' }}>Año</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap" style={{ fontSize: '12px', color: '#374151' }}>Kilómetros</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap" style={{ fontSize: '12px', color: '#374151' }}>Horómetro</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap" style={{ fontSize: '12px', color: '#374151' }}>Empresa</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap" style={{ fontSize: '12px', color: '#374151' }}>Conductor</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap" style={{ fontSize: '12px', color: '#374151' }}>Tipo Servicio</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap" style={{ fontSize: '12px', color: '#374151' }}>Estado</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap" style={{ fontSize: '12px', color: '#374151' }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan="11" className="py-8 text-center text-gray-500">
                          Cargando...
                        </td>
                      </tr>
                    ) : currentData.length === 0 ? (
                      <tr>
                        <td colSpan="11" className="py-8 text-center text-gray-500">
                          {vehiculos.length === 0 
                            ? 'No hay vehículos disponibles' 
                            : searchTerm 
                              ? `No se encontraron vehículos que coincidan con "${searchTerm}"`
                              : 'No hay datos disponibles'}
                        </td>
                      </tr>
                    ) : (
                      currentData.map((item, index) => {
                        // Obtener nombre de la empresa
                        let nombreEmpresa = 'N/A';
                        if (item.id_empresa !== null && item.id_empresa !== undefined && empresas && empresas.length > 0) {
                          const empresa = empresas.find(e => e.id_empresa === item.id_empresa);
                          nombreEmpresa = empresa?.nombre_empresa || 'N/A';
                        }
                        
                        // Obtener nombre del conductor
                        let nombreConductor = 'N/A';
                        if (item.id_conductor_activo !== null && item.id_conductor_activo !== undefined && conductores && conductores.length > 0) {
                          // Convertir ambos IDs a números para comparación segura
                          const idConductorBuscado = parseInt(item.id_conductor_activo, 10);
                          const conductor = conductores.find(c => {
                            const idConductor = parseInt(c.id_conductor, 10);
                            return idConductor === idConductorBuscado;
                          });
                          if (conductor) {
                            // Construir nombre completo desde nombre y apellido
                            const nombre = conductor.nombre || '';
                            const apellido = conductor.apellido || '';
                            nombreConductor = `${nombre} ${apellido}`.trim() || 'N/A';
                          }
                        }
                        
                        return (
                        <tr 
                          key={item.id_vehiculo}
                        style={{ 
                            borderBottom: '1px solid #E5E7EB',
                            backgroundColor: index % 2 === 0 ? '#FFFFFF' : '#F9FAFB'
                          }}
                        >
                          <td className="py-2 sm:py-3 px-2 sm:px-4" style={{ fontSize: '12px', color: '#374151' }}>
                            {item.matricula || 'N/A'}
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4" style={{ fontSize: '12px', color: '#374151' }}>
                            {item.interno || 'N/A'}
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4" style={{ fontSize: '12px', color: '#374151' }}>
                            {item.marca || 'N/A'}
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4" style={{ fontSize: '12px', color: '#374151' }}>
                            {item.modelo || 'N/A'}
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4" style={{ fontSize: '12px', color: '#374151' }}>
                            {item.anio || 'N/A'}
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4" style={{ fontSize: '12px', color: '#374151' }}>
                            {item.kilometros ? `${formatNumber(item.kilometros)} km` : 'N/A'}
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4" style={{ fontSize: '12px', color: '#374151' }}>
                            {item.horometro ? `${formatNumber(item.horometro)} hs` : 'N/A'}
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4" style={{ fontSize: '12px', color: '#374151' }}>
                            {nombreEmpresa}
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4" style={{ fontSize: '12px', color: '#374151' }}>
                            {nombreConductor}
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4" style={{ fontSize: '12px', color: '#374151' }}>
                            {item.tipo_servicio || 'N/A'}
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4">
                            {(() => {
                              const estadoVehiculo = getEstadoVehiculo(item);
                              // Determinar color según el estado
                              let backgroundColor = '#D1FAE5'; // Verde claro por defecto
                              let color = '#065F46'; // Verde oscuro por defecto
                              
                              if (estadoVehiculo === 'Operativo') {
                                backgroundColor = '#E3F2FD';
                                color = '#2196F3';
                              } else if (estadoVehiculo === 'Preventivo') {
                                backgroundColor = '#E0F7F7';
                                color = '#4CAF50';
                              } else if (estadoVehiculo === 'Correctivo') {
                                backgroundColor = '#FFEDED';
                                color = '#E07B7B';
                              } else if (estadoVehiculo === 'En mantenimiento') {
                                backgroundColor = '#E0E7FF';
                                color = '#4F46E5';
                              } else {
                                // Para otros estados
                                backgroundColor = '#F3F4F6';
                                color = '#6B7280';
                              }
                              
                              return (
                                <span
                                  className="px-2 py-1 text-xs font-medium whitespace-nowrap"
                                  style={{
                                    backgroundColor,
                                    color,
                                    border: `1px solid ${color}`,
                                    borderRadius: '4px',
                                    padding: '4px 8px',
                                    display: 'inline-block',
                                    fontFamily: 'Lato, sans-serif',
                                    fontWeight: '500'
                                  }}
                                >
                                  {estadoVehiculo}
                                </span>
                              );
                            })()}
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4">
                            <div className="relative" ref={openMenuId === item.id_vehiculo ? menuRef : null}>
                              <button
                                onClick={() => setOpenMenuId(openMenuId === item.id_vehiculo ? null : item.id_vehiculo)}
                                className="p-1 hover:bg-gray-100 rounded transition-colors"
                                style={{ color: '#6B7280' }}
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                </svg>
                              </button>
                              {openMenuId === item.id_vehiculo && (
                                <div 
                                  className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-[9999]"
                                  style={{ minWidth: '150px' }}
                                >
                                  <button
                                    onClick={() => {
                                      handleEditVehiculo(item);
                                    }}
                                    className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors"
                        style={{ 
                                      fontFamily: 'Lato, sans-serif',
                          fontSize: '14px',
                          color: '#374151'
                        }}
                      >
                                    Editar
                                  </button>
                                  <button
                                    onClick={() => {
                                      setVehiculoToDelete(item);
                                      setShowDeleteModal(true);
                                      setOpenMenuId(null);
                                    }}
                                    className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors border-t border-gray-200"
                        style={{ 
                                      fontFamily: 'Lato, sans-serif',
                          fontSize: '14px',
                                      color: '#DC2626'
                                    }}
                                  >
                                    Eliminar
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
              </div>
              )}
            </div>

            {/* Paginación */}
            {!isLoading && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-200 px-4">
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
                      fontSize: '14px',
                      zIndex: 10
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
        )}

        {/* Sección de listado de usuarios */}
        {!showFormUsuario && activeTab === 'usuarios' && (
          <div 
            className="bg-white rounded-lg shadow-md"
                        style={{ 
              padding: '24px',
              border: '1px solid #E5E7EB',
              backgroundColor: '#FFFFFF'
            }}
          >
          {/* Título, buscador y controles en la misma línea */}
          <div className="mb-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-4">
              <div className="flex-1 w-full lg:w-auto">
                <h2 
                  className="text-lg sm:text-xl font-bold mb-2"
                  style={{ 
                    fontFamily: 'Lato, sans-serif',
                    color: '#1F2937'
                  }}
                >
                  Listado de usuarios
                </h2>
                <p 
                  className="text-xs sm:text-sm"
                  style={{ 
                    fontFamily: 'Lato, sans-serif',
                    color: '#6B7280'
                  }}
                >
                  Detalle de usuarios autorizados
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 w-full lg:w-auto">
                <div className="w-full sm:w-auto" style={{ minWidth: isMobile ? '100%' : '250px', maxWidth: isMobile ? '100%' : '400px' }}>
                  <label 
                    htmlFor="search-usuarios"
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
                      id="search-usuarios"
                      placeholder="Ingrese su búsqueda"
                      value={searchTermUsuarios}
                      onChange={(e) => {
                        setSearchTermUsuarios(e.target.value);
                        setCurrentPageUsuarios(1);
                      }}
                      className="w-full px-3 sm:px-4 py-2 pl-9 sm:pl-10 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#007C8A] focus:border-transparent"
                      style={{ 
                        fontFamily: 'Lato, sans-serif',
                        fontSize: isMobile ? '13px' : '14px'
                      }}
                    />
                    <svg 
                      className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400"
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                <button
                  onClick={handleDownloadTemplateUsuario}
                  className="w-full sm:w-auto px-3 sm:px-4 py-2 rounded-lg shadow-md flex items-center justify-center gap-2 transition-all hover:shadow-lg whitespace-nowrap border border-[#007C8A]"
                  style={{
                    backgroundColor: '#FFFFFF',
                    color: '#007C8A',
                    fontFamily: 'Lato, sans-serif',
                    fontWeight: 'bold',
                    fontSize: isMobile ? '13px' : '14px'
                  }}
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span className="hidden sm:inline">Descargar plantilla</span>
                  <span className="sm:hidden">Plantilla</span>
                </button>
                <button
                  onClick={() => setShowCargaMasivaUsuarioModal(true)}
                  className="w-full sm:w-auto px-3 sm:px-4 py-2 rounded-lg shadow-md flex items-center justify-center gap-2 transition-all hover:shadow-lg whitespace-nowrap"
                  style={{
                    backgroundColor: '#007C8A',
                    color: '#FFFFFF',
                    fontFamily: 'Lato, sans-serif',
                    fontWeight: 'bold',
                    fontSize: isMobile ? '13px' : '14px'
                  }}
                >
                  Carga masiva
                </button>
                </div>
              </div>
            </div>
          </div>

          {/* Tabla de usuarios */}
          <div className="bg-white rounded-lg overflow-hidden">
            <div className="overflow-x-auto -mx-3 sm:-mx-4 md:mx-0 w-full">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-gray-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                    Cargando datos...
                  </div>
                </div>
              ) : (
                <div className="inline-block min-w-full align-middle">
                  <table className="w-full min-w-[1000px]" style={{ fontFamily: 'Lato, sans-serif' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F3F4F6' }}>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap" style={{ fontSize: '12px', color: '#374151' }}>Nombre completo</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap" style={{ fontSize: '12px', color: '#374151' }}>Rol</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap" style={{ fontSize: '12px', color: '#374151' }}>Empresa</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap" style={{ fontSize: '12px', color: '#374151' }}>DNI</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap" style={{ fontSize: '12px', color: '#374151' }}>Teléfono</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap" style={{ fontSize: '12px', color: '#374151' }}>Email</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap" style={{ fontSize: '12px', color: '#374151' }}>Username</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap" style={{ fontSize: '12px', color: '#374151' }}>Estado</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap" style={{ fontSize: '12px', color: '#374151' }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan="9" className="py-8 text-center text-gray-500">
                          Cargando...
                        </td>
                      </tr>
                    ) : currentDataUsuarios.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="py-8 text-center text-gray-500">
                          {usuarios.length === 0 
                            ? 'No hay usuarios disponibles' 
                            : searchTermUsuarios 
                              ? `No se encontraron usuarios que coincidan con "${searchTermUsuarios}"`
                              : 'No hay datos disponibles'}
                        </td>
                      </tr>
                    ) : (
                      currentDataUsuarios.map((item, index) => {
                        // Obtener nombre del rol de forma segura
                        let nombreRol = 'N/A';
                        if (item.id_rol !== null && item.id_rol !== undefined && roles && roles.length > 0) {
                          const rol = roles.find(r => r.id_rol === item.id_rol);
                          nombreRol = rol?.nombre || 'N/A';
                        }
                        
                        // Obtener nombre de la empresa de forma segura
                        let nombreEmpresa = 'N/A';
                        if (item.id_empresa !== null && item.id_empresa !== undefined && empresas && empresas.length > 0) {
                          const empresa = empresas.find(e => e.id_empresa === item.id_empresa);
                          nombreEmpresa = empresa?.nombre_empresa || 'N/A';
                        }
                        
                        // Formatear DNI con puntos
                        const formatDNI = (dni) => {
                          if (!dni) return 'N/A';
                          return dni.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
                        };
                        
                        return (
                        <tr 
                          key={item.id_usuario}
                          style={{ 
                            borderBottom: '1px solid #E5E7EB',
                            backgroundColor: index % 2 === 0 ? '#FFFFFF' : '#F9FAFB'
                          }}
                        >
                          <td className="py-2 sm:py-3 px-2 sm:px-4" style={{ fontSize: '12px', color: '#374151' }}>
                            {item.nombre_completo || 'N/A'}
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4" style={{ fontSize: '12px', color: '#374151' }}>
                            {nombreRol}
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4" style={{ fontSize: '12px', color: '#374151' }}>
                            {nombreEmpresa}
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4" style={{ fontSize: '12px', color: '#374151' }}>
                            {formatDNI(item.dni)}
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4" style={{ fontSize: '12px', color: '#374151' }}>
                            {item.telefono || 'N/A'}
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4" style={{ fontSize: '12px', color: '#374151' }}>
                            {item.email || 'N/A'}
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4" style={{ fontSize: '12px', color: '#374151' }}>
                            {item.username || 'N/A'}
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4">
                            <span
                              className="px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap"
                              style={{
                                backgroundColor: (item.activo === true || item.activo === 'true' || item.activo === 1) ? '#D1FAE5' : '#FEE2E2',
                                color: (item.activo === true || item.activo === 'true' || item.activo === 1) ? '#065F46' : '#991B1B',
                                fontFamily: 'Lato, sans-serif'
                              }}
                            >
                              {(item.activo === true || item.activo === 'true' || item.activo === 1) ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4">
                            <div className="relative" ref={openMenuUsuarioId === item.id_usuario ? menuUsuarioRef : null}>
                              <button
                                onClick={() => setOpenMenuUsuarioId(openMenuUsuarioId === item.id_usuario ? null : item.id_usuario)}
                                className="p-1 hover:bg-gray-100 rounded transition-colors"
                                style={{ color: '#6B7280' }}
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                </svg>
                              </button>
                              {openMenuUsuarioId === item.id_usuario && (
                                <div 
                                  className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-[9999]"
                                  style={{ minWidth: '150px' }}
                                >
                                  <button
                                    onClick={() => handleEditarUsuario(item)}
                                    className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors"
                                    style={{ 
                                      fontFamily: 'Lato, sans-serif',
                                      fontSize: '14px',
                                      color: '#374151'
                                    }}
                                  >
                                    Editar
                                  </button>
                                  <button
                                    onClick={() => {
                                      // TODO: Implementar eliminación de usuario
                                      setOpenMenuUsuarioId(null);
                                    }}
                                    className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors border-t border-gray-200"
                                    style={{ 
                                      fontFamily: 'Lato, sans-serif',
                                      fontSize: '14px',
                                      color: '#DC2626'
                                    }}
                                  >
                                    Eliminar
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
              </div>
              )}
            </div>

            {/* Paginación */}
            {!isLoading && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-200 px-4">
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
                    value={itemsPerPageUsuarios}
                    onChange={(e) => {
                      setItemsPerPageUsuarios(Number(e.target.value));
                      setCurrentPageUsuarios(1);
                    }}
                    className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007C8A] bg-white"
                    style={{ 
                      fontFamily: 'Lato, sans-serif',
                      fontSize: '14px',
                      zIndex: 10
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
                    {startIndexUsuarios + 1} - {Math.min(endIndexUsuarios, totalItemsUsuarios)} de {totalItemsUsuarios}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPageUsuarios(prev => Math.max(1, prev - 1))}
                      disabled={currentPageUsuarios === 1}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed bg-white"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setCurrentPageUsuarios(prev => Math.min(totalPagesUsuarios, prev + 1))}
                      disabled={currentPageUsuarios === totalPagesUsuarios}
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
        )}
      </div>

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
                    Carga masiva de unidades
                  </h3>
                  <p 
                    className="text-sm mt-1"
                    style={{ 
                      color: '#6B7280'
                    }}
                  >
                    Importe un archivo Excel con los datos de las unidades
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
                      {cargaMasivaSuccess} unidad(es) cargada(s) exitosamente
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

            {/* Footer del modal */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCargaMasivaModal(false);
                  setCargaMasivaErrors([]);
                  setCargaMasivaSuccess(0);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                disabled={isProcessingFile}
                className="px-6 py-2 rounded-lg border border-gray-300 transition-all hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: '#FFFFFF',
                  color: '#374151',
                  fontFamily: 'Lato, sans-serif',
                  fontWeight: 'bold',
                  fontSize: '14px'
                }}
              >
                {isProcessingFile ? 'Procesando...' : 'Cerrar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de carga masiva de usuarios */}
      {showCargaMasivaUsuarioModal && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backgroundColor: 'rgba(0, 124, 138, 0.5)' }}
          onClick={() => {
            if (!isProcessingUsuarioFile) {
              setShowCargaMasivaUsuarioModal(false);
              setCargaMasivaUsuarioErrors([]);
              setCargaMasivaUsuarioSuccess(0);
              if (fileInputUsuarioRef.current) {
                fileInputUsuarioRef.current.value = '';
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
                    Carga masiva de usuarios
                  </h3>
                  <p 
                    className="text-sm mt-1"
                    style={{ 
                      color: '#6B7280'
                    }}
                  >
                    Importe un archivo Excel con los datos de los usuarios
                  </p>
                </div>
                {!isProcessingUsuarioFile && (
                  <button
                    onClick={() => {
                      setShowCargaMasivaUsuarioModal(false);
                      setCargaMasivaUsuarioErrors([]);
                      setCargaMasivaUsuarioSuccess(0);
                      if (fileInputUsuarioRef.current) {
                        fileInputUsuarioRef.current.value = '';
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
                  onClick={handleDownloadTemplateUsuario}
                  disabled={isProcessingUsuarioFile}
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
                  ref={fileInputUsuarioRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      handleProcessExcelFileUsuario(file);
                    }
                  }}
                  disabled={isProcessingUsuarioFile}
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
              {isProcessingUsuarioFile && (
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
              {cargaMasivaUsuarioSuccess > 0 && !isProcessingUsuarioFile && (
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
                      {cargaMasivaUsuarioSuccess} usuario(s) cargado(s) exitosamente
                    </p>
                  </div>
                </div>
              )}

              {/* Informe de errores */}
              {cargaMasivaUsuarioErrors.length > 0 && !isProcessingUsuarioFile && (
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
                        Errores encontrados ({cargaMasivaUsuarioErrors.length})
                      </h4>
                    </div>
                    <div 
                      className="max-h-64 overflow-y-auto"
                      style={{ 
                        maxHeight: '256px'
                      }}
                    >
                      <ul className="list-disc list-inside space-y-1">
                        {cargaMasivaUsuarioErrors.map((error, index) => (
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

            {/* Footer del modal */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCargaMasivaUsuarioModal(false);
                  setCargaMasivaUsuarioErrors([]);
                  setCargaMasivaUsuarioSuccess(0);
                  if (fileInputUsuarioRef.current) {
                    fileInputUsuarioRef.current.value = '';
                  }
                }}
                disabled={isProcessingUsuarioFile}
                className="px-6 py-2 rounded-lg border border-gray-300 transition-all hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: '#FFFFFF',
                  color: '#374151',
                  fontFamily: 'Lato, sans-serif',
                  fontWeight: 'bold',
                  fontSize: '14px'
                }}
              >
                {isProcessingUsuarioFile ? 'Procesando...' : 'Cerrar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de carga masiva de empresas */}
      {showCargaMasivaEmpresaModal && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backgroundColor: 'rgba(0, 124, 138, 0.5)' }}
          onClick={() => {
            if (!isProcessingEmpresaFile) {
              setShowCargaMasivaEmpresaModal(false);
              setCargaMasivaEmpresaErrors([]);
              setCargaMasivaEmpresaSuccess(0);
              if (fileInputEmpresaRef.current) {
                fileInputEmpresaRef.current.value = '';
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
                    Carga masiva de empresas
                  </h3>
                  <p 
                    className="text-sm mt-1"
                    style={{ 
                      color: '#6B7280'
                    }}
                  >
                    Importe un archivo Excel con los datos de las empresas
                  </p>
                </div>
                {!isProcessingEmpresaFile && (
                  <button
                    onClick={() => {
                      setShowCargaMasivaEmpresaModal(false);
                      setCargaMasivaEmpresaErrors([]);
                      setCargaMasivaEmpresaSuccess(0);
                      if (fileInputEmpresaRef.current) {
                        fileInputEmpresaRef.current.value = '';
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
                  onClick={handleDownloadTemplateEmpresa}
                  disabled={isProcessingEmpresaFile}
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
                  ref={fileInputEmpresaRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      handleProcessExcelFileEmpresa(file);
                    }
                  }}
                  disabled={isProcessingEmpresaFile}
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
              {isProcessingEmpresaFile && (
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
              {cargaMasivaEmpresaSuccess > 0 && !isProcessingEmpresaFile && (
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
                      {cargaMasivaEmpresaSuccess} empresa(s) cargada(s) exitosamente
                    </p>
                  </div>
                </div>
              )}

              {/* Informe de errores */}
              {cargaMasivaEmpresaErrors.length > 0 && !isProcessingEmpresaFile && (
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
                        Errores encontrados ({cargaMasivaEmpresaErrors.length})
                      </h4>
                    </div>
                    <div 
                      className="max-h-64 overflow-y-auto"
                      style={{ 
                        maxHeight: '256px'
                      }}
                    >
                      <ul className="list-disc list-inside space-y-1">
                        {cargaMasivaEmpresaErrors.map((error, index) => (
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

            {/* Footer del modal */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCargaMasivaEmpresaModal(false);
                  setCargaMasivaEmpresaErrors([]);
                  setCargaMasivaEmpresaSuccess(0);
                  if (fileInputEmpresaRef.current) {
                    fileInputEmpresaRef.current.value = '';
                  }
                }}
                disabled={isProcessingEmpresaFile}
                className="px-6 py-2 rounded-lg border border-gray-300 transition-all hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: '#FFFFFF',
                  color: '#374151',
                  fontFamily: 'Lato, sans-serif',
                  fontWeight: 'bold',
                  fontSize: '14px'
                }}
              >
                {isProcessingEmpresaFile ? 'Procesando...' : 'Cerrar'}
              </button>
            </div>
          </div>
        </div>
      )}

        {/* Formulario de Alta/Edición de Empresa */}
        {showFormEmpresa && activeTab === 'empresas' && (
          <div className="mb-6" data-form-section-empresa>
            {/* Header del formulario */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div 
                  className="rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: '#E6FFE6',
                    width: '40px',
                    height: '40px'
                  }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} style={{ color: '#10B981' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 
                  className="text-xl sm:text-2xl font-bold"
                  style={{ 
                    fontFamily: 'Lato, sans-serif',
                    color: '#111827'
                  }}
                >
                  {isEditModeEmpresa ? 'Editar empresa' : 'Nueva empresa'}
                </h2>
              </div>
            </div>

            {/* Card del formulario */}
            <div 
              className="bg-white rounded-lg shadow-md"
              style={{
                padding: '24px',
                border: '1px solid #E5E7EB'
              }}
            >
              {/* Título de la sección */}
              <div className="mb-6">
                <h3 
                  className="text-lg font-bold mb-1"
                  style={{ 
                    fontFamily: 'Lato, sans-serif',
                    color: '#111827'
                  }}
                >
                  Detalle de empresa
                </h3>
                <p 
                  className="text-sm"
                  style={{ 
                    fontFamily: 'Lato, sans-serif',
                    color: '#6B7280'
                  }}
                >
                  {isEditModeEmpresa ? 'Modifica el formulario de registro' : 'Complete el formulario de registro'}
                </p>
              </div>

              {/* Campos del formulario - Dos columnas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Columna izquierda */}
                <div className="space-y-4">
                  {/* Nombre empresa */}
                  <div>
                    <label 
                      className="block text-sm font-semibold mb-2"
                      style={{ 
                        fontFamily: 'Lato, sans-serif',
                        color: '#374151'
                      }}
                    >
                      Nombre empresa <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="nombre_empresa"
                      data-field="nombre_empresa"
                      required
                      value={formDataEmpresa.nombre_empresa}
                      onChange={(e) => {
                        setFormDataEmpresa({ ...formDataEmpresa, nombre_empresa: e.target.value });
                        if (fieldErrorsEmpresa.nombre_empresa) {
                          setFieldErrorsEmpresa({ ...fieldErrorsEmpresa, nombre_empresa: '' });
                        }
                      }}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                        fieldErrorsEmpresa.nombre_empresa
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-[#007C8A]'
                      }`}
                      style={{ 
                        fontFamily: 'Lato, sans-serif',
                        fontSize: '14px',
                        backgroundColor: '#FFFFFF'
                      }}
                      placeholder="Ingrese el nombre de la empresa"
                    />
                    {fieldErrorsEmpresa.nombre_empresa && (
                      <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                        {fieldErrorsEmpresa.nombre_empresa}
                      </p>
                    )}
                  </div>

                  {/* Código empresa */}
                  <div>
                    <label 
                      className="block text-sm font-semibold mb-2"
                      style={{ 
                        fontFamily: 'Lato, sans-serif',
                        color: '#374151'
                      }}
                    >
                      Código empresa <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="codigo_empresa"
                      data-field="codigo_empresa"
                      required
                      value={formDataEmpresa.codigo_empresa}
                      onChange={(e) => {
                        setFormDataEmpresa({ ...formDataEmpresa, codigo_empresa: e.target.value });
                        if (fieldErrorsEmpresa.codigo_empresa) {
                          setFieldErrorsEmpresa({ ...fieldErrorsEmpresa, codigo_empresa: '' });
                        }
                      }}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                        fieldErrorsEmpresa.codigo_empresa
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-[#007C8A]'
                      }`}
                      style={{ 
                        fontFamily: 'Lato, sans-serif',
                        fontSize: '14px',
                        backgroundColor: '#FFFFFF'
                      }}
                      placeholder="Ingrese el código de la empresa"
                    />
                    {fieldErrorsEmpresa.codigo_empresa && (
                      <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                        {fieldErrorsEmpresa.codigo_empresa}
                      </p>
                    )}
                  </div>

                  {/* Teléfono */}
                  <div>
                    <label 
                      className="block text-sm font-semibold mb-2"
                      style={{ 
                        fontFamily: 'Lato, sans-serif',
                        color: '#374151'
                      }}
                    >
                      Teléfono <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="telefono"
                      data-field="telefono"
                      required
                      value={formDataEmpresa.telefono}
                      onChange={(e) => {
                        setFormDataEmpresa({ ...formDataEmpresa, telefono: e.target.value });
                        if (fieldErrorsEmpresa.telefono) {
                          setFieldErrorsEmpresa({ ...fieldErrorsEmpresa, telefono: '' });
                        }
                      }}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                        fieldErrorsEmpresa.telefono
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-[#007C8A]'
                      }`}
                      style={{ 
                        fontFamily: 'Lato, sans-serif',
                        fontSize: '14px',
                        backgroundColor: '#FFFFFF'
                      }}
                      placeholder="Ingrese el teléfono"
                    />
                    {fieldErrorsEmpresa.telefono && (
                      <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                        {fieldErrorsEmpresa.telefono}
                      </p>
                    )}
                  </div>
                </div>

                {/* Columna derecha */}
                <div className="space-y-4">
                  {/* CUIT */}
                  <div>
                    <label 
                      className="block text-sm font-semibold mb-2"
                      style={{ 
                        fontFamily: 'Lato, sans-serif',
                        color: '#374151'
                      }}
                    >
                      CUIT <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="cuit"
                      data-field="cuit"
                      required
                      value={formDataEmpresa.cuit}
                      onChange={(e) => {
                        setFormDataEmpresa({ ...formDataEmpresa, cuit: e.target.value });
                        if (fieldErrorsEmpresa.cuit) {
                          setFieldErrorsEmpresa({ ...fieldErrorsEmpresa, cuit: '' });
                        }
                      }}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                        fieldErrorsEmpresa.cuit
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-[#007C8A]'
                      }`}
                      style={{ 
                        fontFamily: 'Lato, sans-serif',
                        fontSize: '14px',
                        backgroundColor: '#FFFFFF'
                      }}
                      placeholder="Ingrese el CUIT"
                    />
                    {fieldErrorsEmpresa.cuit && (
                      <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                        {fieldErrorsEmpresa.cuit}
                      </p>
                    )}
                  </div>

                  {/* E-mail */}
                  <div>
                    <label 
                      className="block text-sm font-semibold mb-2"
                      style={{ 
                        fontFamily: 'Lato, sans-serif',
                        color: '#374151'
                      }}
                    >
                      E-mail <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      data-field="email"
                      required
                      value={formDataEmpresa.email}
                      onChange={(e) => {
                        setFormDataEmpresa({ ...formDataEmpresa, email: e.target.value });
                        if (fieldErrorsEmpresa.email) {
                          setFieldErrorsEmpresa({ ...fieldErrorsEmpresa, email: '' });
                        }
                      }}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                        fieldErrorsEmpresa.email
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-[#007C8A]'
                      }`}
                      style={{ 
                        fontFamily: 'Lato, sans-serif',
                        fontSize: '14px',
                        backgroundColor: '#FFFFFF'
                      }}
                      placeholder="Ingrese el email"
                    />
                    {fieldErrorsEmpresa.email && (
                      <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                        {fieldErrorsEmpresa.email}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex justify-end gap-4 mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowFormEmpresa(false);
                    setIsEditModeEmpresa(false);
                    setEditingEmpresaId(null);
                    setFieldErrorsEmpresa({});
                    setFormDataEmpresa({
                      nombre_empresa: '',
                      codigo_empresa: '',
                      telefono: '',
                      cuit: '',
                      email: ''
                    });
                  }}
                  className="px-6 py-2 rounded-lg border border-[#007C8A] flex items-center gap-2 transition-all hover:bg-gray-50"
                  style={{
                    backgroundColor: '#FFFFFF',
                    color: '#007C8A',
                    fontFamily: 'Lato, sans-serif',
                    fontWeight: 'bold',
                    fontSize: '14px'
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateEmpresa}
                  disabled={isSubmittingEmpresa}
                  className="px-6 py-2 rounded-lg shadow-md flex items-center gap-2 transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: '#007C8A',
                    color: '#FFFFFF',
                    fontFamily: 'Lato, sans-serif',
                    fontWeight: 'bold',
                    fontSize: '14px'
                  }}
                >
                  {isSubmittingEmpresa ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sección de listado de empresas */}
        {activeTab === 'empresas' && !showFormEmpresa && (
          <div 
            className="bg-white rounded-lg shadow-md"
            style={{ 
              padding: '24px',
              border: '1px solid #E5E7EB',
              backgroundColor: '#FFFFFF'
            }}
          >
          {/* Título, buscador y controles en la misma línea */}
          <div className="mb-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-4">
              <div className="flex-1 w-full lg:w-auto">
                <h2 
                  className="text-lg sm:text-xl font-bold mb-2"
                  style={{ 
                    fontFamily: 'Lato, sans-serif',
                    color: '#1F2937'
                  }}
                >
                  Listado de empresas
                </h2>
                <p 
                  className="text-xs sm:text-sm"
                  style={{ 
                    fontFamily: 'Lato, sans-serif',
                    color: '#6B7280'
                  }}
                >
                  Detalle de empresas registradas
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 w-full lg:w-auto">
                <div className="w-full sm:w-auto" style={{ minWidth: isMobile ? '100%' : '250px', maxWidth: isMobile ? '100%' : '400px' }}>
                  <label 
                    htmlFor="search-empresas"
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
                      id="search-empresas"
                      placeholder="Ingrese su búsqueda"
                      value={searchTermEmpresas}
                      onChange={(e) => {
                        setSearchTermEmpresas(e.target.value);
                        setCurrentPageEmpresas(1);
                      }}
                      className="w-full px-3 sm:px-4 py-2 pl-9 sm:pl-10 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#007C8A] focus:border-transparent"
                      style={{ 
                        fontFamily: 'Lato, sans-serif',
                        fontSize: isMobile ? '13px' : '14px'
                      }}
                    />
                    <svg 
                      className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400"
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                  <button
                    onClick={handleDownloadTemplateEmpresa}
                    className="w-full sm:w-auto px-3 sm:px-4 py-2 rounded-lg shadow-md flex items-center justify-center gap-2 transition-all hover:shadow-lg whitespace-nowrap border border-[#007C8A]"
                    style={{
                      backgroundColor: '#FFFFFF',
                      color: '#007C8A',
                      fontFamily: 'Lato, sans-serif',
                      fontWeight: 'bold',
                      fontSize: isMobile ? '13px' : '14px'
                    }}
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span className="hidden sm:inline">Descargar plantilla</span>
                    <span className="sm:hidden">Plantilla</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowCargaMasivaEmpresaModal(true);
                      setCargaMasivaEmpresaErrors([]);
                      setCargaMasivaEmpresaSuccess(0);
                    }}
                    className="w-full sm:w-auto px-3 sm:px-4 py-2 rounded-lg shadow-md flex items-center justify-center gap-2 transition-all hover:shadow-lg whitespace-nowrap"
                    style={{
                      backgroundColor: '#007C8A',
                      color: '#FFFFFF',
                      fontFamily: 'Lato, sans-serif',
                      fontWeight: 'bold',
                      fontSize: isMobile ? '13px' : '14px'
                    }}
                  >
                    Carga masiva
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Tabla de empresas */}
          <div className="bg-white rounded-lg overflow-hidden">
            <div className="overflow-x-auto -mx-3 sm:-mx-4 md:mx-0 w-full" style={{ overflow: 'visible' }}>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-gray-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                    Cargando datos...
                  </div>
                </div>
              ) : (
                <div className="inline-block min-w-full align-middle">
                  <table className="w-full min-w-[800px]" style={{ fontFamily: 'Lato, sans-serif' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F3F4F6' }}>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap" style={{ fontSize: '12px', color: '#374151' }}>ID</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap" style={{ fontSize: '12px', color: '#374151' }}>Código empresa</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap" style={{ fontSize: '12px', color: '#374151' }}>Nombre de empresa</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap" style={{ fontSize: '12px', color: '#374151' }}>Email</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap" style={{ fontSize: '12px', color: '#374151' }}>Teléfono</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap" style={{ fontSize: '12px', color: '#374151' }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-gray-500">
                          Cargando...
                        </td>
                      </tr>
                    ) : currentDataEmpresas.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-gray-500">
                          {empresasList.length === 0 
                            ? 'No hay empresas disponibles' 
                            : searchTermEmpresas 
                              ? `No se encontraron empresas que coincidan con "${searchTermEmpresas}"`
                              : 'No hay datos disponibles'}
                        </td>
                      </tr>
                    ) : (
                      currentDataEmpresas.map((item, index) => {
                        return (
                        <tr 
                          key={item.id_empresa}
                          style={{ 
                            borderBottom: '1px solid #E5E7EB',
                            backgroundColor: index % 2 === 0 ? '#FFFFFF' : '#F9FAFB'
                          }}
                        >
                          <td className="py-2 sm:py-3 px-2 sm:px-4" style={{ fontSize: '12px', color: '#374151' }}>
                            {item.id_empresa || 'N/A'}
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4" style={{ fontSize: '12px', color: '#374151' }}>
                            {item.codigo_empresa || 'N/A'}
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4" style={{ fontSize: '12px', color: '#374151' }}>
                            {item.nombre_empresa || item.nombre || 'N/A'}
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4" style={{ fontSize: '12px', color: '#374151' }}>
                            {item.email || 'N/A'}
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4" style={{ fontSize: '12px', color: '#374151' }}>
                            {item.telefono || 'N/A'}
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4">
                            <div className="relative" style={{ zIndex: openMenuId === item.id_empresa ? 100 : 1 }}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuId(openMenuId === item.id_empresa ? null : item.id_empresa);
                                }}
                                className="p-1 hover:bg-gray-100 rounded transition-colors"
                                style={{ color: '#6B7280', position: 'relative' }}
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                </svg>
                              </button>
                              {openMenuId === item.id_empresa && (
                                <div 
                                  className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1"
                                  style={{ 
                                    zIndex: 100,
                                    position: 'absolute',
                                    top: '100%',
                                    right: 0
                                  }}
                                >
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditarEmpresa(item);
                                      setOpenMenuId(null);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                                    style={{ 
                                      fontFamily: 'Lato, sans-serif',
                                      color: '#374151'
                                    }}
                                  >
                                    Editar
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEmpresaToDelete(item);
                                      setShowDeleteEmpresaModal(true);
                                      setOpenMenuId(null);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                                    style={{ 
                                      fontFamily: 'Lato, sans-serif',
                                      color: '#DC2626'
                                    }}
                                  >
                                    Eliminar
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
                </div>
              )}
            </div>

            {/* Paginación para empresas */}
            {!isLoading && currentDataEmpresas.length > 0 && (
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
                    value={itemsPerPageEmpresas}
                    onChange={(e) => {
                      setItemsPerPageEmpresas(Number(e.target.value));
                      setCurrentPageEmpresas(1);
                    }}
                    className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007C8A] bg-white"
                    style={{ 
                      fontFamily: 'Lato, sans-serif',
                      fontSize: '14px',
                      zIndex: 10
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
                    {startIndexEmpresas + 1} - {Math.min(endIndexEmpresas, totalItemsEmpresas)} de {totalItemsEmpresas}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPageEmpresas(prev => Math.max(1, prev - 1))}
                      disabled={currentPageEmpresas === 1}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed bg-white"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setCurrentPageEmpresas(prev => Math.min(totalPagesEmpresas, prev + 1))}
                      disabled={currentPageEmpresas === totalPagesEmpresas}
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
        )}
    </div>
  );
};

export default Registros;
