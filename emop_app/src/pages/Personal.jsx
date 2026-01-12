import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAllFromTable, insertIntoTable, updateInTable, deleteFromTable, registrarAuditoria } from '../config/supabase';
import * as XLSX from 'xlsx';

const Personal = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [conductores, setConductores] = useState([]);
  const [empresa, setEmpresa] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isMobile, setIsMobile] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [conductorToDelete, setConductorToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCargaMasivaModal, setShowCargaMasivaModal] = useState(false);
  const [cargaMasivaErrors, setCargaMasivaErrors] = useState([]);
  const [cargaMasivaSuccess, setCargaMasivaSuccess] = useState(0);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [toast, setToast] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingConductorId, setEditingConductorId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    dni: '',
    numero_licencia: '',
    fecha_vencimiento_licencia: '',
    telefono: '',
    activo: 'true'
  });
  const [nombreCompletoInput, setNombreCompletoInput] = useState('');
  const menuRef = useRef(null);
  const fileInputRef = useRef(null);
  
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

  // Generar interno del conductor (CND-XXX)
  const generarInterno = (idConductor) => {
    return `CND-${String(idConductor).padStart(3, '0')}`;
  };

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

  // Función para descargar plantilla Excel
  const handleDownloadTemplate = async () => {
    try {
      // Obtener datos de empresas y roles
      let empresasData = [];
      let rolesData = [];
      
      if (!empresa) {
        const empresasResponse = await getAllFromTable('empresa');
        empresasData = Array.isArray(empresasResponse) ? empresasResponse : [];
      } else {
        empresasData = [empresa];
      }

      // Obtener solo el rol Empresa (id_rol = 2)
      const rolesResponse = await getAllFromTable('rol');
      const allRoles = Array.isArray(rolesResponse) ? rolesResponse : [];
      rolesData = allRoles.filter(r => (r.id_rol || r.id) === 2);

      // Plantilla de conductores
      const templateData = [
        {
          'ID Empresa': idEmpresaUsuario || '',
          'Nombre': '',
          'Apellido': '',
          'DNI': '',
          'Número de Licencia': '',
          'Fecha Vencimiento Licencia (YYYY-MM-DD)': '',
          'Teléfono': '',
          'Activo (true/false)': 'true'
        }
      ];

      const ws = XLSX.utils.json_to_sheet(templateData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Plantilla Conductores');
      
      // Ajustar ancho de columnas
      ws['!cols'] = [
        { wch: 12 }, { wch: 20 }, { wch: 20 }, { wch: 15 },
        { wch: 20 }, { wch: 30 }, { wch: 15 }, { wch: 18 }
      ];

      // Hoja 2: EMPRESAS
      const empresasDataSheet = empresasData.map(e => ({
        'ID': e.id_empresa || e.id || '',
        'Nombre Empresa': e.nombre_empresa || e.nombre || ''
      }));

      const wsEmpresas = XLSX.utils.json_to_sheet(empresasDataSheet);
      XLSX.utils.book_append_sheet(wb, wsEmpresas, 'EMPRESAS');
      
      wsEmpresas['!cols'] = [
        { wch: 10 },
        { wch: 30 }
      ];

      // Hoja 3: ROLES (solo Empresa)
      const rolesDataSheet = rolesData.map(r => ({
        'ID | Nombre': `${r.id_rol || r.id || ''} | ${r.nombre || ''}`
      }));

      const wsRoles = XLSX.utils.json_to_sheet(rolesDataSheet);
      XLSX.utils.book_append_sheet(wb, wsRoles, 'ROLES');
      
      wsRoles['!cols'] = [
        { wch: 40 }
      ];

      XLSX.writeFile(wb, 'plantilla_carga_masiva_conductores.xlsx');
      
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

  // Función para validar una fila de datos de conductor
  const validateRowConductor = (row, rowIndex, empresas) => {
    const errors = [];
    
    // Validar campos requeridos
    const requiredFields = ['Nombre', 'Apellido', 'DNI', 'Número de Licencia', 'ID Empresa', 'Activo (true/false)'];
    requiredFields.forEach(field => {
      if (!row[field] || String(row[field]).trim() === '') {
        errors.push(`Fila ${rowIndex + 2}: El campo "${field}" es requerido`);
      }
    });

    // Validar ID Empresa existe
    if (row['ID Empresa']) {
      const idEmpresa = parseInt(row['ID Empresa'], 10);
      if (isNaN(idEmpresa) || !empresas.find(e => e.id_empresa === idEmpresa)) {
        errors.push(`Fila ${rowIndex + 2}: El ID de Empresa "${row['ID Empresa']}" no existe`);
      }
    }

    // Validar valores booleanos
    if (row['Activo (true/false)'] && !['true', 'false', 'TRUE', 'FALSE', '1', '0'].includes(String(row['Activo (true/false)']).trim())) {
      errors.push(`Fila ${rowIndex + 2}: El campo "Activo (true/false)" debe ser "true" o "false"`);
    }

    // Validar fecha de vencimiento de licencia
    if (row['Fecha Vencimiento Licencia (YYYY-MM-DD)']) {
      const dateStr = String(row['Fecha Vencimiento Licencia (YYYY-MM-DD)']).trim();
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(dateStr)) {
        errors.push(`Fila ${rowIndex + 2}: El campo "Fecha Vencimiento Licencia" debe tener formato YYYY-MM-DD`);
      } else {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
          errors.push(`Fila ${rowIndex + 2}: El campo "Fecha Vencimiento Licencia" contiene una fecha inválida`);
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

      // Obtener datos necesarios para validación
      const empresasData = await getAllFromTable('empresa');
      const conductoresExistentes = await getAllFromTable('conductor');
      
      const validEmpresas = Array.isArray(empresasData) ? empresasData : [];
      const validConductoresExistentes = Array.isArray(conductoresExistentes) ? conductoresExistentes : [];
      
      const ultimoId = validConductoresExistentes.length > 0 
        ? Math.max(...validConductoresExistentes.map(c => c.id_conductor || 0))
        : 0;

      const errors = [];
      const validRows = [];
      let currentId = ultimoId;

      // Validar y procesar cada fila
      jsonData.forEach((row, index) => {
        const rowErrors = validateRowConductor(row, index, validEmpresas);
        
        if (rowErrors.length > 0) {
          errors.push(...rowErrors);
        } else {
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
            id_conductor: currentId,
            id_empresa: parseInt(row['ID Empresa'], 10),
            nombre: String(row['Nombre']).trim(),
            apellido: String(row['Apellido']).trim(),
            dni: String(row['DNI']).trim(),
            numero_licencia: String(row['Número de Licencia']).trim(),
            fecha_vencimiento_licencia: formatDate(row['Fecha Vencimiento Licencia (YYYY-MM-DD)']),
            telefono: String(row['Teléfono'] || '').trim(),
            activo: parseBoolean(row['Activo (true/false)'])
          });
        }
      });

      // Cargar filas válidas
      if (validRows.length > 0) {
        const promises = validRows.map(conductor => 
          insertIntoTable('conductor', conductor).catch(err => {
            console.error('Error insertando conductor:', err);
            throw err;
          })
        );

        const results = await Promise.allSettled(promises);
        let successCount = 0;
        let failCount = 0;

        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            successCount++;
            // Registrar auditoría para cada conductor creado
            const conductor = validRows[index];
            registrarAuditoria({
              usuarioNombre: user?.nombre || 'Usuario desconocido',
              idUsuarioRef: user?.id_usuario || null,
              accion: 'CREAR',
              tipoRegistro: 'conductor',
              idRegistro: conductor.id_conductor,
              detalle: `Alta de conductor (carga masiva): ${conductor.nombre} ${conductor.apellido} (DNI: ${conductor.dni || 'N/A'}, Licencia: ${conductor.numero_licencia || 'N/A'})`
            }).catch(err => console.error('Error al registrar auditoría:', err));
          } else {
            failCount++;
            errors.push(`Fila ${jsonData.findIndex((r, i) => validRows[index] && r['Nombre'] === validRows[index].nombre) + 2}: Error al guardar en la base de datos`);
          }
        });

        setCargaMasivaSuccess(successCount);
        
        if (failCount > 0) {
          errors.push(`${failCount} registro(s) no pudieron ser guardados correctamente`);
        }
      }

      // Recargar lista de conductores
      const conductoresReloadData = await getAllFromTable('conductor');
      if (Array.isArray(conductoresReloadData)) {
        let conductoresFiltrados = conductoresReloadData;
        if (idEmpresaUsuario) {
          conductoresFiltrados = conductoresReloadData.filter(c => c.id_empresa === idEmpresaUsuario);
        }
        setConductores(conductoresFiltrados);
      }

      // Mostrar resultados
      setCargaMasivaErrors(errors);
      
      if (errors.length === 0 && validRows.length > 0) {
        setToast({
          type: 'success',
          title: 'Carga masiva exitosa',
          message: `Se cargaron exitosamente ${validRows.length} conductor(es)`
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
          message: `Se cargaron ${validRows.length} conductor(es) pero hubo ${errors.length} error(es). Revise el informe de errores.`
        });
        setTimeout(() => setToast(null), 5000);
      } else {
        setToast({
          type: 'error',
          title: 'Error en carga masiva',
          message: `No se pudo cargar ningún conductor. Revise el informe de errores.`
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

  // Función para validar formulario
  const validateForm = () => {
    const errors = {};
    const fieldNames = {
      nombre: 'Nombre',
      apellido: 'Apellido',
      dni: 'DNI',
      numero_licencia: 'Licencia',
      fecha_vencimiento_licencia: 'Fecha de vencimiento de licencia',
      telefono: 'Teléfono'
    };

    const requiredFields = ['nombre', 'apellido', 'dni', 'numero_licencia', 'fecha_vencimiento_licencia', 'telefono'];
    
    requiredFields.forEach(field => {
      const value = formData[field];
      const isEmpty = value === undefined || value === null || String(value).trim() === '';
      
      if (isEmpty) {
        errors[field] = `${fieldNames[field]} es requerido`;
      }
    });

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setToast({
        type: 'error',
        title: isEditMode ? 'Error al actualizar conductor' : 'Error al crear conductor',
        message: 'Por favor complete todos los campos requeridos'
      });
      setTimeout(() => setToast(null), 5000);
      
      // Scroll al primer campo con error
      const firstErrorField = Object.keys(errors)[0];
      const errorElement = document.querySelector(`[name="${firstErrorField}"], [data-field="${firstErrorField}"]`);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        errorElement.focus();
      }
      
      return false;
    }

    setFieldErrors({});
    return true;
  };

  // Función para manejar el envío del formulario
  const handleSubmitConductor = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const parseBoolean = (value) => {
        const str = String(value).trim().toLowerCase();
        return str === 'true' || str === '1';
      };

      const formatDate = (dateStr) => {
        if (!dateStr) return null;
        const date = new Date(dateStr);
        return date.toISOString();
      };

      if (isEditMode && editingConductorId) {
        // Modo edición: actualizar conductor existente
        const conductorData = {
          id_empresa: idEmpresaUsuario, // Siempre usar la empresa del usuario logueado
          nombre: formData.nombre.trim(),
          apellido: formData.apellido.trim(),
          dni: formData.dni.trim(),
          numero_licencia: formData.numero_licencia.trim(),
          fecha_vencimiento_licencia: formatDate(formData.fecha_vencimiento_licencia),
          telefono: formData.telefono.trim() || null,
          activo: formData.activo === 'true' ? true : formData.activo === 'false' ? false : true
        };

        await updateInTable('conductor', editingConductorId, conductorData);
        
        // Registrar auditoría
        await registrarAuditoria({
          usuarioNombre: user?.nombre || 'Usuario desconocido',
          idUsuarioRef: user?.id_usuario || null,
          accion: 'ACTUALIZAR',
          tipoRegistro: 'conductor',
          idRegistro: editingConductorId,
          detalle: `Actualización de conductor: ${formData.nombre.trim()} ${formData.apellido.trim()} (DNI: ${formData.dni.trim()})`
        });
        
        setToast({
          type: 'success',
          title: 'Conductor actualizado',
          message: 'El conductor ha sido actualizado correctamente'
        });
      } else {
        // Modo creación: crear nuevo conductor
        const conductoresExistentes = await getAllFromTable('conductor');
        const ultimoId = conductoresExistentes.length > 0 
          ? Math.max(...conductoresExistentes.map(c => c.id_conductor || 0))
          : 0;

        const nuevoIdConductor = ultimoId + 1;

        const conductorData = {
          id_conductor: nuevoIdConductor,
          id_empresa: idEmpresaUsuario, // Siempre usar la empresa del usuario logueado
          nombre: formData.nombre.trim(),
          apellido: formData.apellido.trim(),
          dni: formData.dni.trim(),
          numero_licencia: formData.numero_licencia.trim(),
          fecha_vencimiento_licencia: formatDate(formData.fecha_vencimiento_licencia),
          telefono: formData.telefono.trim() || null,
          activo: true // Siempre true
        };

        const conductorCreado = await insertIntoTable('conductor', conductorData);
        
        // Registrar auditoría
        await registrarAuditoria({
          usuarioNombre: user?.nombre || 'Usuario desconocido',
          idUsuarioRef: user?.id_usuario || null,
          accion: 'CREAR',
          tipoRegistro: 'conductor',
          idRegistro: nuevoIdConductor,
          detalle: `Alta de conductor: ${formData.nombre.trim()} ${formData.apellido.trim()} (DNI: ${formData.dni.trim()}, Licencia: ${formData.numero_licencia.trim()})`
        });
        
        setToast({
          type: 'success',
          title: 'Conductor creado',
          message: 'El conductor ha sido creado correctamente'
        });
      }

      setTimeout(() => setToast(null), 5000);

      // Recargar lista
      const conductoresData = await getAllFromTable('conductor');
      const validConductores = Array.isArray(conductoresData) ? conductoresData : [];
      let conductoresFiltrados = validConductores;
      if (idEmpresaUsuario) {
        conductoresFiltrados = validConductores.filter(c => c.id_empresa === idEmpresaUsuario);
      }
      setConductores(conductoresFiltrados);

      // Limpiar formulario
      setShowForm(false);
      setIsEditMode(false);
      setEditingConductorId(null);
      setFormData({
        nombre: '',
        apellido: '',
        dni: '',
        numero_licencia: '',
        fecha_vencimiento_licencia: '',
        telefono: '',
        activo: 'true'
      });
      setNombreCompletoInput('');
      setFieldErrors({});

    } catch (error) {
      console.error('Error al guardar conductor:', error);
      setToast({
        type: 'error',
        title: 'Error al guardar',
        message: error.message || 'Ocurrió un error al guardar el conductor. Por favor intente nuevamente.'
      });
      setTimeout(() => setToast(null), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Función para cargar datos del conductor en el formulario (modo edición)
  const handleEditConductor = (conductor) => {
    const formatDateForInput = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Separar nombre completo en nombre y apellido si viene como nombreCompleto
    let nombre = conductor.nombre || '';
    let apellido = conductor.apellido || '';
    
    if (!nombre && !apellido && conductor.nombreCompleto) {
      const parts = conductor.nombreCompleto.trim().split(' ');
      nombre = parts[0] || '';
      apellido = parts.slice(1).join(' ') || '';
    }

    setFormData({
      nombre: nombre,
      apellido: apellido,
      dni: conductor.dni || '',
      numero_licencia: conductor.numero_licencia || '',
      fecha_vencimiento_licencia: formatDateForInput(conductor.fecha_vencimiento_licencia),
      telefono: conductor.telefono || '',
      activo: String(conductor.activo !== undefined ? conductor.activo : true)
    });
    
    // Actualizar el input de nombre completo
    setNombreCompletoInput(`${nombre} ${apellido}`.trim());

    setIsEditMode(true);
    setEditingConductorId(conductor.id_conductor);
    setShowForm(true);
    setFieldErrors({});
    setOpenMenuId(null);
    
    // Scroll al formulario
    setTimeout(() => {
      const formSection = document.querySelector('[data-form-section]');
      if (formSection) {
        formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Función para eliminar conductor
  const handleDeleteConductor = async () => {
    if (!conductorToDelete) return;

    try {
      setIsDeleting(true);
      const conductorNombre = `${conductorToDelete.nombre || ''} ${conductorToDelete.apellido || ''}`.trim();
      await deleteFromTable('conductor', conductorToDelete.id_conductor);
      
      // Registrar auditoría
      await registrarAuditoria({
        usuarioNombre: user?.nombre || 'Usuario desconocido',
        idUsuarioRef: user?.id_usuario || null,
        accion: 'ELIMINAR',
        tipoRegistro: 'conductor',
        idRegistro: conductorToDelete.id_conductor,
        detalle: `Eliminación de conductor: ${conductorNombre} (DNI: ${conductorToDelete.dni || 'N/A'})`
      });
      
      setToast({
        type: 'success',
        title: 'Conductor eliminado',
        message: 'El conductor ha sido eliminado correctamente'
      });
      setTimeout(() => setToast(null), 5000);

      // Recargar lista
      const conductoresData = await getAllFromTable('conductor');
      const validConductores = Array.isArray(conductoresData) ? conductoresData : [];
      let conductoresFiltrados = validConductores;
      if (idEmpresaUsuario) {
        conductoresFiltrados = validConductores.filter(c => c.id_empresa === idEmpresaUsuario);
      }
      setConductores(conductoresFiltrados);

      setShowDeleteModal(false);
      setConductorToDelete(null);
    } catch (error) {
      console.error('Error al eliminar conductor:', error);
      setToast({
        type: 'error',
        title: 'Error al eliminar',
        message: 'Ocurrió un error al eliminar el conductor. Por favor intente nuevamente.'
      });
      setTimeout(() => setToast(null), 5000);
    } finally {
      setIsDeleting(false);
    }
  };

  // Cargar datos
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Obtener datos usando Supabase
        const [conductoresData, empresasData] = await Promise.all([
          getAllFromTable('conductor'),
          getAllFromTable('empresa')
        ]);
        
        // Validar que sean arrays
        const validConductores = Array.isArray(conductoresData) ? conductoresData : [];
        const validEmpresas = Array.isArray(empresasData) ? empresasData : [];
        
        // Filtrar por empresa del usuario si es usuario Empresa
        let conductoresFiltrados = validConductores;
        if (idEmpresaUsuario) {
          conductoresFiltrados = validConductores.filter(c => c.id_empresa === idEmpresaUsuario);
          const empresaUsuario = validEmpresas.find(e => e.id_empresa === idEmpresaUsuario);
          setEmpresa(empresaUsuario);
        } else {
          // Si es admin, usar todos los conductores (o el primero disponible)
          setEmpresa(validEmpresas[0] || null);
        }
        
        setConductores(conductoresFiltrados);
      } catch (error) {
        console.error('Error al cargar datos:', error);
        setConductores([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [idEmpresaUsuario]);

  // Preparar datos de la tabla con nombre completo e interno
  const conductoresConDatos = conductores.map(c => ({
    ...c,
    nombreCompleto: `${c.nombre || ''} ${c.apellido || ''}`.trim(),
    interno: generarInterno(c.id_conductor)
  }));

  // Filtrar datos según búsqueda
  const filteredData = conductoresConDatos.filter(item => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    
    // Formatear fecha de ingreso para búsqueda (usar created_at)
    const fechaIngresoStr = item.created_at ? formatDate(item.created_at).toLowerCase() : '';
    
    // Obtener estado (Activo/Inactivo)
    const estadoStr = item.activo ? 'activo' : 'inactivo';
    
    return (
      item.nombreCompleto?.toLowerCase().includes(searchLower) ||
      item.interno?.toLowerCase().includes(searchLower) ||
      item.dni?.toLowerCase().includes(searchLower) ||
      item.numero_licencia?.toLowerCase().includes(searchLower) ||
      item.telefono?.toLowerCase().includes(searchLower) ||
      fechaIngresoStr.includes(searchLower) ||
      estadoStr.includes(searchLower)
    );
  });

  // Calcular paginación
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return 'N/A';
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
    <div className="w-full" style={{ fontFamily: 'Lato, sans-serif' }}>
      <div className="px-3 sm:px-4 md:px-6 w-full">
        {/* Header */}
        <div 
          className="bg-[#007C8A] w-full mb-4 sm:mb-6 rounded-lg mt-4 sm:mt-6 flex items-center justify-between px-3 sm:px-4 lg:px-6"
          style={{
            minHeight: '70px',
            paddingTop: '12px',
            paddingBottom: '12px'
          }}
        >
          <div className="flex items-center flex-1 min-w-0">
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
                Personal
              </h1>
              <p className="text-white text-xs sm:text-sm font-normal" style={{ fontFamily: 'Lato, sans-serif', lineHeight: '1.2' }}>
                Listado de personal autorizado de {empresa?.nombre_empresa || 'tu empresa'}
              </p>
            </div>
          </div>
        </div>

        {/* Botón Nuevo conductor flotado a la derecha */}
        {!showForm && (
          <div className="flex justify-end" style={{ marginTop: '2px' }}>
            <button
              onClick={() => {
                setNombreCompletoInput('');
                setShowForm(true);
                setIsEditMode(false);
                setEditingConductorId(null);
                setFieldErrors({});
                setFormData({
                  nombre: '',
                  apellido: '',
                  dni: '',
                  numero_licencia: '',
                  fecha_vencimiento_licencia: '',
                  telefono: '',
                  activo: 'true'
                });
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-colors flex-shrink-0"
              style={{
                backgroundColor: '#007C8A',
                fontFamily: 'Lato, sans-serif',
                textShadow: 'none',
                marginBottom: '2px'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#005a63';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#007C8A';
              }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline" style={{ textShadow: 'none' }}>Nuevo conductor</span>
              <span className="sm:hidden" style={{ textShadow: 'none' }}>+Nuevo</span>
            </button>
          </div>
        )}

        {/* Formulario de Nuevo/Editar Conductor */}
        {showForm && (
          <div className="mb-6" data-form-section>
            {/* Header del formulario */}
            <div className="flex items-center gap-3 mb-4">
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
                className="text-xl font-bold"
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  color: '#1F2937'
                }}
              >
                {isEditMode ? 'Editar conductor' : 'Nuevo conductor'}
              </h2>
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
                {isEditMode ? `Editar conductor ${generarInterno(editingConductorId)}` : 'Nuevo conductor'}
              </h3>
              <p 
                className="text-sm mb-6"
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  color: '#6B7280'
                }}
              >
                {isEditMode ? 'Edita el formulario de registro' : 'Complete la información del conductor'}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Columna izquierda */}
                {/* Nombre completo */}
                <div>
                  <label 
                    className="block text-sm font-medium mb-2"
                    style={{ 
                      fontFamily: 'Lato, sans-serif',
                      color: '#374151'
                    }}
                  >
                    Nombre completo*
                  </label>
                  <input
                    type="text"
                    name="nombreCompleto"
                    data-field="nombre"
                    required
                    value={nombreCompletoInput}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Permitir todos los caracteres incluyendo espacios
                      setNombreCompletoInput(value);
                      // Actualizar formData sin hacer trim para permitir espacios mientras se escribe
                      // Solo dividir en nombre y apellido para validación, pero mantener el valor completo
                      const trimmedValue = value.trim();
                      const parts = trimmedValue ? trimmedValue.split(/\s+/) : [];
                      const nombre = parts[0] || '';
                      const apellido = parts.slice(1).join(' ') || '';
                      setFormData({ ...formData, nombre, apellido });
                      if (fieldErrors.nombre || fieldErrors.apellido) {
                        setFieldErrors({ ...fieldErrors, nombre: '', apellido: '' });
                      }
                    }}
                    onBlur={(e) => {
                      // Hacer trim() solo cuando el usuario sale del campo
                      const value = e.target.value.trim();
                      setNombreCompletoInput(value);
                      const parts = value.split(' ').filter(part => part !== '');
                      const nombre = parts[0] || '';
                      const apellido = parts.slice(1).join(' ') || '';
                      setFormData({ ...formData, nombre, apellido });
                    }}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                      fieldErrors.nombre || fieldErrors.apellido
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-[#007C8A]'
                    }`}
                    style={{ 
                      fontFamily: 'Lato, sans-serif',
                      fontSize: '14px'
                    }}
                    placeholder="Mauro Villaruel"
                  />
                  {(fieldErrors.nombre || fieldErrors.apellido) && (
                    <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                      {fieldErrors.nombre || fieldErrors.apellido || 'Nombre completo es requerido'}
                    </p>
                  )}
                </div>

                {/* Columna derecha */}
                {/* DNI */}
                <div>
                  <label 
                    className="block text-sm font-medium mb-2"
                    style={{ 
                      fontFamily: 'Lato, sans-serif',
                      color: '#374151'
                    }}
                  >
                    DNI*
                  </label>
                  <input
                    type="text"
                    name="dni"
                    data-field="dni"
                    required
                    value={formData.dni}
                    onChange={(e) => {
                      setFormData({ ...formData, dni: e.target.value });
                      if (fieldErrors.dni) {
                        setFieldErrors({ ...fieldErrors, dni: '' });
                      }
                    }}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                      fieldErrors.dni 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-[#007C8A]'
                    }`}
                    style={{ 
                      fontFamily: 'Lato, sans-serif',
                      fontSize: '14px'
                    }}
                    placeholder="29.589.324"
                  />
                  {fieldErrors.dni && (
                    <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                      {fieldErrors.dni}
                    </p>
                  )}
                </div>

                {/* Columna izquierda */}
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
                  <input
                    type="text"
                    name="numero_licencia"
                    data-field="numero_licencia"
                    required
                    value={formData.numero_licencia}
                    onChange={(e) => {
                      setFormData({ ...formData, numero_licencia: e.target.value });
                      if (fieldErrors.numero_licencia) {
                        setFieldErrors({ ...fieldErrors, numero_licencia: '' });
                      }
                    }}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                      fieldErrors.numero_licencia 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-[#007C8A]'
                    }`}
                    style={{ 
                      fontFamily: 'Lato, sans-serif',
                      fontSize: '14px'
                    }}
                    placeholder="D3 29.589.324"
                  />
                  {fieldErrors.numero_licencia && (
                    <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                      {fieldErrors.numero_licencia}
                    </p>
                  )}
                </div>

                {/* Columna izquierda */}
                {/* Fecha de vencimiento de licencia */}
                <div>
                  <label 
                    className="block text-sm font-medium mb-2"
                    style={{ 
                      fontFamily: 'Lato, sans-serif',
                      color: '#374151'
                    }}
                  >
                    Fecha de vencimiento de licencia*
                  </label>
                  <input
                    type="date"
                    name="fecha_vencimiento_licencia"
                    data-field="fecha_vencimiento_licencia"
                    required
                    value={formData.fecha_vencimiento_licencia}
                    onChange={(e) => {
                      setFormData({ ...formData, fecha_vencimiento_licencia: e.target.value });
                      if (fieldErrors.fecha_vencimiento_licencia) {
                        setFieldErrors({ ...fieldErrors, fecha_vencimiento_licencia: '' });
                      }
                    }}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                      fieldErrors.fecha_vencimiento_licencia 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-[#007C8A]'
                    }`}
                    style={{ 
                      fontFamily: 'Lato, sans-serif',
                      fontSize: '14px'
                    }}
                  />
                  {fieldErrors.fecha_vencimiento_licencia && (
                    <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                      {fieldErrors.fecha_vencimiento_licencia}
                    </p>
                  )}
                </div>

                {/* Columna derecha */}
                {/* Teléfono */}
                <div>
                  <label 
                    className="block text-sm font-medium mb-2"
                    style={{ 
                      fontFamily: 'Lato, sans-serif',
                      color: '#374151'
                    }}
                  >
                    Teléfono*
                  </label>
                  <input
                    type="text"
                    name="telefono"
                    data-field="telefono"
                    required
                    value={formData.telefono}
                    onChange={(e) => {
                      setFormData({ ...formData, telefono: e.target.value });
                      if (fieldErrors.telefono) {
                        setFieldErrors({ ...fieldErrors, telefono: '' });
                      }
                    }}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                      fieldErrors.telefono 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-[#007C8A]'
                    }`}
                    style={{ 
                      fontFamily: 'Lato, sans-serif',
                      fontSize: '14px'
                    }}
                    placeholder="+54 9 11 1234-5678"
                  />
                  {fieldErrors.telefono && (
                    <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                      {fieldErrors.telefono}
                    </p>
                  )}
                </div>

                {/* Activo - Solo en modo edición */}
                {isEditMode && (
                  <div>
                    <label 
                      className="block text-sm font-medium mb-2"
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
                      value={formData.activo}
                      onChange={(e) => {
                        setFormData({ ...formData, activo: e.target.value });
                        if (fieldErrors.activo) {
                          setFieldErrors({ ...fieldErrors, activo: '' });
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
                    {fieldErrors.activo && (
                      <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                        {fieldErrors.activo}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Botones de acción */}
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowForm(false);
                    setIsEditMode(false);
                    setEditingConductorId(null);
                    setNombreCompletoInput('');
                    setFormData({
                      nombre: '',
                      apellido: '',
                      dni: '',
                      numero_licencia: '',
                      fecha_vencimiento_licencia: '',
                      telefono: '',
                      activo: 'true'
                    });
                    setFieldErrors({});
                  }}
                  disabled={isSubmitting}
                  className="px-6 py-2 rounded-lg border border-gray-300 transition-all hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  onClick={handleSubmitConductor}
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
                  {isSubmitting ? (isEditMode ? 'Actualizando...' : 'Guardando...') : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Contenido principal */}
        {!showForm && (
        <div 
          className="bg-white rounded-lg shadow-md w-full"
          style={{
            padding: '24px',
            border: '1px solid #E5E7EB'
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
                Listado de conductores
              </h2>
              <p 
                className="text-sm"
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  color: '#6B7280'
                }}
              >
                Detalle de conductores autorizados
              </p>
            </div>
            <div className="flex items-end gap-3 flex-shrink-0">
              <div className="w-full" style={{ minWidth: '400px', maxWidth: '600px' }}>
                <label 
                  htmlFor="search-personal"
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
                    id="search-personal"
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
              <button
                onClick={handleDownloadTemplate}
                className="px-4 py-2 rounded-lg shadow-md flex items-center gap-2 transition-all hover:shadow-lg whitespace-nowrap border border-[#007C8A]"
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
                Descargar plantilla
              </button>
              <button
                onClick={() => setShowCargaMasivaModal(true)}
                className="px-4 py-2 rounded-lg shadow-md flex items-center gap-2 transition-all hover:shadow-lg whitespace-nowrap"
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

          {/* Tabla */}
          <div className="bg-white rounded-lg" style={{ overflow: 'visible' }}>
            <div className="w-full" style={{ overflow: 'visible' }}>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-gray-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                  Cargando datos...
                </div>
              </div>
            ) : (
              <div className="inline-block min-w-full align-middle">
                <table className="w-full min-w-[600px]" style={{ fontFamily: 'Lato, sans-serif' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F3F4F6' }}>
                      <th 
                        className="text-left py-3 px-4 font-semibold hidden sm:table-cell"
                        style={{ 
                          fontSize: '14px',
                          color: '#374151'
                        }}
                      >
                        Nombre completo
                      </th>
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
                        className="text-left py-3 px-4 font-semibold hidden md:table-cell"
                        style={{ 
                          fontSize: '14px',
                          color: '#374151'
                        }}
                      >
                        DNI
                      </th>
                      <th 
                        className="text-left py-3 px-4 font-semibold hidden lg:table-cell"
                        style={{ 
                          fontSize: '14px',
                          color: '#374151'
                        }}
                      >
                        Licencia
                      </th>
                      <th 
                        className="text-left py-3 px-4 font-semibold hidden lg:table-cell"
                        style={{ 
                          fontSize: '14px',
                          color: '#374151'
                        }}
                      >
                        Teléfono
                      </th>
                      <th 
                        className="text-left py-3 px-4 font-semibold hidden md:table-cell"
                        style={{ 
                          fontSize: '14px',
                          color: '#374151'
                        }}
                      >
                        Fecha de ingreso
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
                        Acción
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentData.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="py-8 text-center text-gray-500" style={{ fontFamily: 'Lato, sans-serif' }}>
                          No hay datos disponibles
                        </td>
                      </tr>
                    ) : (
                      currentData.map((conductor, index) => {
                        const estadoStyle = conductor.activo 
                          ? { bg: '#E6FFE6', text: '#00B69B', border: '#00B69B' }
                          : { bg: '#FFE6E6', text: '#FF6F6F', border: '#FF6F6F' };
                        
                        return (
                          <tr 
                            key={conductor.id_conductor || index}
                            style={{ 
                              borderBottom: '1px solid #E5E7EB',
                              backgroundColor: index % 2 === 0 ? '#FFFFFF' : '#F9FAFB'
                            }}
                          >
                            <td className="py-3 px-4 font-semibold hidden sm:table-cell" style={{ fontSize: '14px', color: '#374151' }}>
                              {conductor.nombreCompleto || 'N/A'}
                            </td>
                            <td className="py-3 px-4 font-semibold" style={{ fontSize: '14px', color: '#374151' }}>
                              {conductor.interno || 'N/A'}
                            </td>
                            <td className="py-3 px-4 hidden md:table-cell" style={{ fontSize: '14px', color: '#374151' }}>
                              {conductor.dni || 'N/A'}
                            </td>
                            <td className="py-3 px-4 hidden lg:table-cell" style={{ fontSize: '14px', color: '#374151' }}>
                              {conductor.numero_licencia || 'N/A'}
                            </td>
                            <td className="py-3 px-4 hidden lg:table-cell" style={{ fontSize: '14px', color: '#374151' }}>
                              {conductor.telefono || 'N/A'}
                            </td>
                            <td className="py-3 px-4 hidden md:table-cell" style={{ fontSize: '14px', color: '#374151' }}>
                              {formatDate(conductor.created_at)}
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
                                {conductor.activo ? 'Activo' : 'Inactivo'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="relative" ref={openMenuId === conductor.id_conductor ? menuRef : null}>
                                <button
                                  onClick={() => setOpenMenuId(openMenuId === conductor.id_conductor ? null : conductor.id_conductor)}
                                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                                  style={{ color: '#6B7280' }}
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                  </svg>
                                </button>
                                {openMenuId === conductor.id_conductor && (
                                  <div 
                                    className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200"
                                    style={{ 
                                      minWidth: '150px',
                                      zIndex: 9999
                                    }}
                                  >
                                    <button
                                      onClick={() => {
                                        handleEditConductor(conductor);
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
                                        setConductorToDelete(conductor);
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
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                Mostrando {startIndex + 1} a {Math.min(endIndex, totalItems)} de {totalItems} resultados
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  style={{
                    fontFamily: 'Lato, sans-serif'
                  }}
                >
                  Anterior
                </button>
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-2 rounded-lg border transition-colors ${
                          currentPage === pageNum
                            ? 'bg-[#007C8A] text-white border-[#007C8A]'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                        style={{
                          fontFamily: 'Lato, sans-serif'
                        }}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  style={{
                    fontFamily: 'Lato, sans-serif'
                  }}
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
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

        {/* Modal de eliminación */}
        {showDeleteModal && conductorToDelete && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backgroundColor: 'rgba(0, 124, 138, 0.5)' }}
          onClick={() => {
            if (!isDeleting) {
              setShowDeleteModal(false);
              setConductorToDelete(null);
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
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 
                className="text-xl font-bold"
                style={{ 
                  color: '#1F2937',
                  fontFamily: 'Lato, sans-serif'
                }}
              >
                Eliminar conductor
              </h3>
            </div>
            <div className="px-6 py-6">
              <p style={{ color: '#374151', fontFamily: 'Lato, sans-serif' }}>
                ¿Está seguro que desea eliminar al conductor <strong>{conductorToDelete.nombreCompleto || `${conductorToDelete.nombre} ${conductorToDelete.apellido}`}</strong>? Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setConductorToDelete(null);
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
                onClick={handleDeleteConductor}
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
            className="bg-white modal-content rounded-lg shadow-xl max-w-3xl w-full mx-4"
            data-modal="true"
            onClick={(e) => e.stopPropagation()}
            style={{ 
              fontFamily: 'Lato, sans-serif', 
              maxHeight: '90vh', 
              overflowY: 'auto', 
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
                    Carga masiva de conductores
                  </h3>
                  <p 
                    className="text-sm mt-1"
                    style={{ 
                      color: '#6B7280'
                    }}
                  >
                    Importe un archivo Excel con los datos de los conductores
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
                      {cargaMasivaSuccess} conductor(es) cargado(s) exitosamente
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
                      style={{ 
                        maxHeight: 'none',
                        overflow: 'visible'
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
      </div>
    </div>
  );
};

export default Personal;
