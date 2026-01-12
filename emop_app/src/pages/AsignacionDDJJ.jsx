import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAllFromTable, getByForeignKey, updateInTable, insertIntoTable } from '../config/supabase';

const AsignacionDDJJ = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ordenesAsignadas, setOrdenesAsignadas] = useState([]);
  const [tiposMantenimiento, setTiposMantenimiento] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [showFormInspeccion, setShowFormInspeccion] = useState(false);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);
  const [datosInspeccion, setDatosInspeccion] = useState(null);
  const [inspeccionesRealizadas, setInspeccionesRealizadas] = useState([]);
  const [formDataInspeccion, setFormDataInspeccion] = useState({
    licencia: false,
    rto: false,
    seguro: false,
    aireAcondicionado: '',
    calefaccion: '',
    camara: '',
    observacion: '',
    conformidad: null // null = no seleccionado, true = CONFORME, false = NO CONFORME
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const idUsuarioInspector = user?.id || user?.id_usuario;
  const nombreUsuario = user?.nombre || 'Usuario';

  // Detectar tamaño de pantalla
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Función para calcular tiempo transcurrido
  const getTimeAgo = (dateString) => {
    if (!dateString) return 'Hace un momento';
    
    const fecha = new Date(dateString);
    const ahora = new Date();
    const diffMs = ahora - fecha;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) {
      return 'Hace un momento';
    } else if (diffMins < 60) {
      return `Hace ${diffMins} ${diffMins === 1 ? 'minuto' : 'minutos'}`;
    } else if (diffHours < 24) {
      return `Hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
    } else {
      return `Hace ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`;
    }
  };

  // Cargar datos
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        if (!idUsuarioInspector) {
          setIsLoading(false);
          return;
        }

        // Obtener asignaciones del inspector
        const asignacionesData = await getByForeignKey('orden_x_usuario', 'id_usuario', idUsuarioInspector);
        const asignaciones = Array.isArray(asignacionesData) ? asignacionesData : [];
        
        // Obtener IDs de órdenes asignadas
        const idsOrdenes = asignaciones.map(a => a.id_orden_trabajo);

        // Obtener todas las órdenes de trabajo, tipos de mantenimiento e inspecciones realizadas
        const [ordenesData, tiposData, inspeccionesData] = await Promise.all([
          getAllFromTable('orden_trabajo'),
          getAllFromTable('tipo_mantenimiento'),
          getByForeignKey('inspeccion_ddjj', 'id_usuario', idUsuarioInspector)
        ]);
        
        const validOrdenes = Array.isArray(ordenesData) ? ordenesData : [];
        const validTipos = Array.isArray(tiposData) ? tiposData : [];
        const validInspecciones = Array.isArray(inspeccionesData) ? inspeccionesData : [];
        
        // Guardar inspecciones realizadas
        setInspeccionesRealizadas(validInspecciones);
        
        // Filtrar solo las órdenes asignadas al inspector
        const ordenesFiltradas = validOrdenes.filter(o => idsOrdenes.includes(o.id_orden));

        // Ordenar por fecha de creación de la asignación (más recientes primero)
        const ordenesConAsignacion = ordenesFiltradas.map(orden => {
          const asignacion = asignaciones.find(a => a.id_orden_trabajo === orden.id_orden);
          return {
            ...orden,
            fechaAsignacion: asignacion?.created_at || orden.fecha_generacion
          };
        }).sort((a, b) => new Date(b.fechaAsignacion) - new Date(a.fechaAsignacion));

        setOrdenesAsignadas(ordenesConAsignacion);
        setTiposMantenimiento(validTipos);
      } catch (error) {
        console.error('Error al cargar datos:', error);
        setOrdenesAsignadas([]);
        setTiposMantenimiento([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [idUsuarioInspector]);

  // Preparar datos de asignaciones
  const asignacionesData = ordenesAsignadas.map(orden => {
    const tipo = tiposMantenimiento.find(t => t.id_tipo === orden.id_tipo_mantenimiento);
    const tipoMantenimiento = tipo?.descripcion || 'N/A';
    
    // Generar ID DDJJ (formato: MNT-YYYY-NNNNN)
    const fechaGen = orden.fecha_generacion ? new Date(orden.fecha_generacion) : new Date();
    const anio = fechaGen.getFullYear();
    const numero = String(orden.id_orden).padStart(5, '0');
    const idDDJJ = `MNT-${anio}-${numero}`;

    // Determinar si es preventivo o correctivo
    const esPreventivo = tipoMantenimiento.toLowerCase().includes('preventivo');
    const esCorrectivo = tipoMantenimiento.toLowerCase().includes('correctivo');
    const tipoReporte = esPreventivo ? 'preventivo' : esCorrectivo ? 'correctivo' : tipoMantenimiento.toLowerCase();

    return {
      id_orden: orden.id_orden,
      idDDJJ,
      tipoMantenimiento,
      tipoReporte,
      fechaAsignacion: orden.fechaAsignacion || orden.fecha_generacion
    };
  });

  const totalAsignaciones = asignacionesData.length;

  // Función para formatear fecha DD/MM/YY
  const formatDateDDMMYY = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  };

  // Función para formatear fecha DD/MM/YYYY
  const formatDateDDMMYYYY = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Función para convertir fecha a formato YYYY-MM-DD para input date
  const convertToDateInputFormat = (dateValue) => {
    if (!dateValue) return '';
    
    // Si ya está en formato YYYY-MM-DD, retornarlo
    if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      return dateValue;
    }
    
    // Si es un objeto Date o un string ISO, convertir directamente
    try {
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    } catch (e) {
      // Si falla, intentar parsear formato DD/MM/YY o DD/MM/YYYY
    }
    
    // Intentar parsear formatos DD/MM/YY o DD/MM/YYYY
    if (typeof dateValue === 'string') {
      const parts = dateValue.split('/');
      if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        let year = parts[2];
        
        // Si el año tiene 2 dígitos, asumir 2000-2099
        if (year.length === 2) {
          year = '20' + year;
        }
        
        return `${year}-${month}-${day}`;
      }
    }
    
    return '';
  };

  // Función para abrir formulario de inspección
  const handleIniciarInspeccion = async (asignacion) => {
    try {
      setIsLoading(true);
      
      // Buscar la orden completa
      const orden = ordenesAsignadas.find(o => o.id_orden === asignacion.id_orden);
      if (!orden) {
        setToast({
          type: 'error',
          title: 'Error',
          message: 'No se pudo encontrar la orden de trabajo'
        });
        return;
      }

      // Obtener datos relacionados
      const [vehiculosData, empresasData, conductoresData, rtoData] = await Promise.all([
        getAllFromTable('vehiculo'),
        getAllFromTable('empresa'),
        getAllFromTable('conductor'),
        getAllFromTable('rto_registro')
      ]);

      const vehiculo = Array.isArray(vehiculosData) ? vehiculosData.find(v => v.id_vehiculo === orden.id_vehiculo) : null;
      const empresa = Array.isArray(empresasData) ? empresasData.find(e => e.id_empresa === vehiculo?.id_empresa) : null;
      const conductor = Array.isArray(conductoresData) ? conductoresData.find(c => c.id_conductor === vehiculo?.id_conductor_activo) : null;
      const rto = Array.isArray(rtoData) 
        ? rtoData
            .filter(r => r.id_vehiculo === vehiculo?.id_vehiculo && r.activo)
            .sort((a, b) => new Date(b.fecha_vencimiento) - new Date(a.fecha_vencimiento))[0]
        : null;

      // Preparar datos declarados
      // Guardamos las fechas originales para poder convertirlas a formato date
      const datosDeclarados = {
        licencia: conductor?.fecha_vencimiento_licencia || '',
        rtoVencimiento: rto?.fecha_vencimiento || '',
        seguroVencimiento: vehiculo?.fecha_vencimiento_seguro || '',
        aireAcondicionado: vehiculo?.posee_ac ? 'Si' : 'No',
        calefaccion: vehiculo?.posee_ac ? 'Si' : 'No', // Por ahora usamos el mismo campo
        camara: vehiculo?.posee_camara ? 'Si' : 'No'
      };

      setOrdenSeleccionada(orden);
      setDatosInspeccion({
        orden,
        vehiculo,
        empresa,
        conductor,
        rto,
        datosDeclarados,
        idDDJJ: asignacion.idDDJJ
      });
      setShowFormInspeccion(true);
    } catch (error) {
      console.error('Error al cargar datos de inspección:', error);
      setToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudieron cargar los datos de la inspección'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Función para manejar cambio en checkboxes
  const handleCheckboxChange = (field) => {
    setFormDataInspeccion(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // Función para generar reporte
  const handleGenerarReporte = async () => {
    try {
      setIsSubmitting(true);

      // Validar que tenemos los datos necesarios
      if (!user || !user.id) {
        setToast({
          type: 'error',
          title: 'Error de autenticación',
          message: 'No se pudo identificar al usuario. Por favor, inicie sesión nuevamente.'
        });
        setTimeout(() => setToast(null), 5000);
        setIsSubmitting(false);
        return;
      }

      if (!ordenSeleccionada || !ordenSeleccionada.id_orden) {
        setToast({
          type: 'error',
          title: 'Error',
          message: 'No se pudo identificar la orden de trabajo.'
        });
        setTimeout(() => setToast(null), 5000);
        setIsSubmitting(false);
        return;
      }

      // Preparar datos para insertar
      const inspeccionData = {
        id_usuario: user.id,
        id_orden_trabajo: ordenSeleccionada.id_orden,
        licencia_correcto: formDataInspeccion.licencia === true,
        rto_correcto: formDataInspeccion.rto === true,
        seguro_correcto: formDataInspeccion.seguro === true,
        aire_acondicionado_correcto: formDataInspeccion.aireAcondicionado === true,
        calefaccion_correcto: formDataInspeccion.calefaccion === true,
        camara_correcto: formDataInspeccion.camara === true,
        observaciones: formDataInspeccion.observacion || null,
        conformidad: formDataInspeccion.conformidad !== null ? formDataInspeccion.conformidad : null
      };

      // Insertar en Supabase
      await insertIntoTable('inspeccion_ddjj', inspeccionData);

      // Recargar inspecciones realizadas para actualizar la UI
      const nuevasInspecciones = await getByForeignKey('inspeccion_ddjj', 'id_usuario', user.id);
      setInspeccionesRealizadas(Array.isArray(nuevasInspecciones) ? nuevasInspecciones : []);

      // Obtener el ID DDJJ de la orden
      const idDDJJ = datosInspeccion?.idDDJJ || ordenSeleccionada.nro_orden_trabajo || 'DDJJ';
      
      // Mostrar toast de éxito
      setToast({
        type: 'success',
        title: 'Reporte generado',
        message: `Se ha realizado la inspección de ${idDDJJ} exitosamente`
      });

      setTimeout(() => {
        setShowFormInspeccion(false);
        setOrdenSeleccionada(null);
        setDatosInspeccion(null);
        setFormDataInspeccion({
          licencia: false,
          rto: false,
          seguro: false,
          aireAcondicionado: false,
          calefaccion: false,
          camara: false,
          observacion: '',
          conformidad: null
        });
        setToast(null);
      }, 2000);
    } catch (error) {
      console.error('Error al generar reporte de inspección:', error);
      const idDDJJ = datosInspeccion?.idDDJJ || ordenSeleccionada?.nro_orden_trabajo || 'DDJJ';
      
      setToast({
        type: 'error',
        title: 'Error al generar reporte',
        message: `No se pudo generar el reporte de inspección de ${idDDJJ}. Por favor, intente nuevamente.`
      });
      
      setTimeout(() => setToast(null), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Función para cancelar
  const handleCancelar = () => {
    setShowFormInspeccion(false);
    setOrdenSeleccionada(null);
    setDatosInspeccion(null);
    setFormDataInspeccion({
      licencia: false,
      rto: false,
      seguro: false,
      aireAcondicionado: '',
      calefaccion: '',
      camara: '',
      observacion: '',
      conformidad: null
    });
  };

  if (isLoading && !showFormInspeccion) {
    return (
      <div className="w-full">
        <div className="px-3 sm:px-4 md:px-6 w-full">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500" style={{ fontFamily: 'Lato, sans-serif' }}>
              Cargando datos...
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Si se muestra el formulario de inspección
  if (showFormInspeccion && datosInspeccion) {
    return (
      <div className="w-full" style={{ fontFamily: 'Lato, sans-serif' }}>
        <div className="px-3 sm:px-4 md:px-6 w-full">
          {/* Header */}
          <div 
            className="bg-[#007C8A] w-full mb-4 sm:mb-6 rounded-lg mt-4 sm:mt-6"
            style={{
              minHeight: '70px',
              paddingTop: '12px',
              paddingBottom: '12px',
              paddingLeft: isMobile ? '12px' : '16px',
              paddingRight: isMobile ? '12px' : '16px'
            }}
          >
            <div className="flex items-center gap-3">
              <div 
                className="rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  backgroundColor: '#E6FFE6',
                  width: isMobile ? '32px' : '40px',
                  height: isMobile ? '32px' : '40px'
                }}
              >
                <svg 
                  className={isMobile ? "w-4 h-4" : "w-5 h-5"} 
                  fill="none" 
                  stroke="#00B69B" 
                  viewBox="0 0 24 24" 
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h1 
                  className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1" 
                  style={{ fontFamily: 'Lato, sans-serif', lineHeight: '1.2' }}
                >
                  Inspección DDJJ
                </h1>
                <p 
                  className="text-white text-xs sm:text-sm font-normal" 
                  style={{ fontFamily: 'Lato, sans-serif', lineHeight: '1.2' }}
                >
                  Detalles a inspeccionar de DDJJ {datosInspeccion.idDDJJ}
                </p>
                <p 
                  className="text-white text-xs sm:text-sm font-normal mt-1" 
                  style={{ fontFamily: 'Lato, sans-serif', lineHeight: '1.2' }}
                >
                  Asignación para {datosInspeccion.empresa?.nombre_empresa || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Formulario de inspección */}
          <div 
            className="bg-white rounded-lg shadow-md"
            style={{
              border: '1px solid #B3E5FC',
              padding: isMobile ? '16px' : '24px'
            }}
          >
            {/* Campos hidden para id_usuario e id_orden_trabajo */}
            <input type="hidden" name="id_usuario" value={user?.id || ''} />
            <input type="hidden" name="id_orden_trabajo" value={ordenSeleccionada?.id_orden || ''} />

            {/* Dos columnas: Declarado e Inspección */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6" style={{ alignItems: 'stretch', gridAutoRows: '1fr' }}>
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
                    <input
                      type="date"
                      value={convertToDateInputFormat(datosInspeccion.datosDeclarados.licencia)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      style={{ 
                        fontFamily: 'Lato, sans-serif',
                        fontSize: '14px',
                        color: '#374151'
                      }}
                    />
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
                    <input
                      type="date"
                      value={convertToDateInputFormat(datosInspeccion.datosDeclarados.rtoVencimiento)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      style={{ 
                        fontFamily: 'Lato, sans-serif',
                        fontSize: '14px',
                        color: '#374151'
                      }}
                    />
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
                    <input
                      type="date"
                      value={convertToDateInputFormat(datosInspeccion.datosDeclarados.seguroVencimiento)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      style={{ 
                        fontFamily: 'Lato, sans-serif',
                        fontSize: '14px',
                        color: '#374151'
                      }}
                    />
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
                    <select
                      value={formDataInspeccion.aireAcondicionado === true ? 'true' : formDataInspeccion.aireAcondicionado === false ? 'false' : ''}
                      onChange={(e) => setFormDataInspeccion(prev => ({ 
                        ...prev, 
                        aireAcondicionado: e.target.value === 'true' ? true : e.target.value === 'false' ? false : ''
                      }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007C8A] bg-white"
                      style={{ 
                        fontFamily: 'Lato, sans-serif',
                        fontSize: '14px'
                      }}
                    >
                      <option value="">Seleccione</option>
                      <option value="true">Si</option>
                      <option value="false">No</option>
                    </select>
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
                    <select
                      value={formDataInspeccion.calefaccion === true ? 'true' : formDataInspeccion.calefaccion === false ? 'false' : ''}
                      onChange={(e) => setFormDataInspeccion(prev => ({ 
                        ...prev, 
                        calefaccion: e.target.value === 'true' ? true : e.target.value === 'false' ? false : ''
                      }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007C8A] bg-white"
                      style={{ 
                        fontFamily: 'Lato, sans-serif',
                        fontSize: '14px'
                      }}
                    >
                      <option value="">Seleccione</option>
                      <option value="true">Si</option>
                      <option value="false">No</option>
                    </select>
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
                    <select
                      value={formDataInspeccion.camara === true ? 'true' : formDataInspeccion.camara === false ? 'false' : ''}
                      onChange={(e) => setFormDataInspeccion(prev => ({ 
                        ...prev, 
                        camara: e.target.value === 'true' ? true : e.target.value === 'false' ? false : ''
                      }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007C8A] bg-white"
                      style={{ 
                        fontFamily: 'Lato, sans-serif',
                        fontSize: '14px'
                      }}
                    >
                      <option value="">Seleccione</option>
                      <option value="true">Si</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Columna derecha: Inspección */}
              <div className="flex flex-col" style={{ minHeight: '100%', display: 'flex' }}>
                <h3 
                  className="text-lg font-bold mb-4"
                  style={{ 
                    fontFamily: 'Lato, sans-serif',
                    color: '#374151'
                  }}
                >
                  Inspección
                </h3>
                <div className="flex flex-col" style={{ gap: '16px', flex: '1 1 auto' }}>
                  {/* Licencia de Conducir - corresponde a "Licencia*" */}
                  <div 
                    className="flex items-start gap-3"
                    style={{ minHeight: '42px' }}
                  >
                    <input
                      type="checkbox"
                      checked={formDataInspeccion.licencia}
                      onChange={() => handleCheckboxChange('licencia')}
                      className="w-5 h-5 rounded border-gray-300 text-[#007C8A] focus:ring-[#007C8A] mt-1"
                      style={{ cursor: 'pointer', flexShrink: 0 }}
                    />
                    <div className="flex-1">
                      <p 
                        className="text-sm font-medium"
                        style={{ 
                          fontFamily: 'Lato, sans-serif',
                          color: '#374151'
                        }}
                      >
                        Licencia de Conducir
                      </p>
                      <p 
                        className="text-xs mt-0.5"
                        style={{ 
                          fontFamily: 'Lato, sans-serif',
                          color: '#6B7280'
                        }}
                      >
                        Verificar vigencia y validez del documento
                      </p>
                      {formDataInspeccion.licencia && (
                        <p 
                          className="text-sm mt-1"
                          style={{ 
                            fontFamily: 'Lato, sans-serif',
                            color: '#374151'
                          }}
                        >
                          Estado: Correcto
                        </p>
                      )}
                    </div>
                  </div>

                  {/* RTO - corresponde a "RTO vencimiento" */}
                  <div 
                    className="flex items-start gap-3"
                    style={{ minHeight: '42px' }}
                  >
                    <input
                      type="checkbox"
                      checked={formDataInspeccion.rto}
                      onChange={() => handleCheckboxChange('rto')}
                      className="w-5 h-5 rounded border-gray-300 text-[#007C8A] focus:ring-[#007C8A] mt-1"
                      style={{ cursor: 'pointer', flexShrink: 0 }}
                    />
                    <div className="flex-1">
                      <p 
                        className="text-sm font-medium"
                        style={{ 
                          fontFamily: 'Lato, sans-serif',
                          color: '#374151'
                        }}
                      >
                        RTO
                      </p>
                      <p 
                        className="text-xs mt-0.5"
                        style={{ 
                          fontFamily: 'Lato, sans-serif',
                          color: '#6B7280'
                        }}
                      >
                        Verificar fecha de vencimiento y estado
                      </p>
                      {formDataInspeccion.rto && (
                        <p 
                          className="text-sm mt-1"
                          style={{ 
                            fontFamily: 'Lato, sans-serif',
                            color: '#374151'
                          }}
                        >
                          Estado: Correcto
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Seguro - corresponde a "Seguro vencimiento" */}
                  <div 
                    className="flex items-start gap-3"
                    style={{ minHeight: '42px' }}
                  >
                    <input
                      type="checkbox"
                      checked={formDataInspeccion.seguro}
                      onChange={() => handleCheckboxChange('seguro')}
                      className="w-5 h-5 rounded border-gray-300 text-[#007C8A] focus:ring-[#007C8A] mt-1"
                      style={{ cursor: 'pointer', flexShrink: 0 }}
                    />
                    <div className="flex-1">
                      <p 
                        className="text-sm font-medium"
                        style={{ 
                          fontFamily: 'Lato, sans-serif',
                          color: '#374151'
                        }}
                      >
                        Seguro
                      </p>
                      <p 
                        className="text-xs mt-0.5"
                        style={{ 
                          fontFamily: 'Lato, sans-serif',
                          color: '#6B7280'
                        }}
                      >
                        Verificar vigencia de la póliza de seguro
                      </p>
                      {formDataInspeccion.seguro && (
                        <p 
                          className="text-sm mt-1"
                          style={{ 
                            fontFamily: 'Lato, sans-serif',
                            color: '#374151'
                          }}
                        >
                          Estado: Correcto
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Aire acondicionado - corresponde a "Aire acondicionado" */}
                  <div 
                    className="flex items-start gap-3"
                    style={{ minHeight: '42px' }}
                  >
                    <input
                      type="checkbox"
                      checked={formDataInspeccion.aireAcondicionado === true}
                      onChange={() => setFormDataInspeccion(prev => ({ 
                        ...prev, 
                        aireAcondicionado: prev.aireAcondicionado === true ? false : true 
                      }))}
                      className="w-5 h-5 rounded border-gray-300 text-[#007C8A] focus:ring-[#007C8A] mt-1"
                      style={{ cursor: 'pointer', flexShrink: 0 }}
                    />
                    <div className="flex-1">
                      <p 
                        className="text-sm font-medium"
                        style={{ 
                          fontFamily: 'Lato, sans-serif',
                          color: '#374151'
                        }}
                      >
                        Aire acondicionado
                      </p>
                      <p 
                        className="text-xs mt-0.5"
                        style={{ 
                          fontFamily: 'Lato, sans-serif',
                          color: '#6B7280'
                        }}
                      >
                        Verificar funcionamiento del sistema
                      </p>
                      {formDataInspeccion.aireAcondicionado === true && (
                        <p 
                          className="text-sm mt-1"
                          style={{ 
                            fontFamily: 'Lato, sans-serif',
                            color: '#374151'
                          }}
                        >
                          Estado: Correcto
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Calefacción - corresponde a "Calefacción" */}
                  <div 
                    className="flex items-start gap-3"
                    style={{ minHeight: '42px' }}
                  >
                    <input
                      type="checkbox"
                      checked={formDataInspeccion.calefaccion === true}
                      onChange={() => setFormDataInspeccion(prev => ({ 
                        ...prev, 
                        calefaccion: prev.calefaccion === true ? false : true 
                      }))}
                      className="w-5 h-5 rounded border-gray-300 text-[#007C8A] focus:ring-[#007C8A] mt-1"
                      style={{ cursor: 'pointer', flexShrink: 0 }}
                    />
                    <div className="flex-1">
                      <p 
                        className="text-sm font-medium"
                        style={{ 
                          fontFamily: 'Lato, sans-serif',
                          color: '#374151'
                        }}
                      >
                        Calefacción
                      </p>
                      <p 
                        className="text-xs mt-0.5"
                        style={{ 
                          fontFamily: 'Lato, sans-serif',
                          color: '#6B7280'
                        }}
                      >
                        Verificar funcionamiento del sistema
                      </p>
                      {formDataInspeccion.calefaccion === true && (
                        <p 
                          className="text-sm mt-1"
                          style={{ 
                            fontFamily: 'Lato, sans-serif',
                            color: '#374151'
                          }}
                        >
                          Estado: Correcto
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Cámara - corresponde a "Cámara" */}
                  <div 
                    className="flex items-start gap-3"
                    style={{ minHeight: '42px' }}
                  >
                    <input
                      type="checkbox"
                      checked={formDataInspeccion.camara === true}
                      onChange={() => setFormDataInspeccion(prev => ({ 
                        ...prev, 
                        camara: prev.camara === true ? false : true 
                      }))}
                      className="w-5 h-5 rounded border-gray-300 text-[#007C8A] focus:ring-[#007C8A] mt-1"
                      style={{ cursor: 'pointer', flexShrink: 0 }}
                    />
                    <div className="flex-1">
                      <p 
                        className="text-sm font-medium"
                        style={{ 
                          fontFamily: 'Lato, sans-serif',
                          color: '#374151'
                        }}
                      >
                        Cámara
                      </p>
                      <p 
                        className="text-xs mt-0.5"
                        style={{ 
                          fontFamily: 'Lato, sans-serif',
                          color: '#6B7280'
                        }}
                      >
                        Verificar instalación y funcionamiento
                      </p>
                      {formDataInspeccion.camara === true && (
                        <p 
                          className="text-sm mt-1"
                          style={{ 
                            fontFamily: 'Lato, sans-serif',
                            color: '#374151'
                          }}
                        >
                          Estado: Correcto
                        </p>
                      )}
                    </div>
                  </div>
                  {/* Espaciador para estirar hasta abajo */}
                  <div style={{ flex: '1 1 auto', minHeight: '100px' }}></div>
                  {/* Espaciador invisible para estirar hasta abajo */}
                  <div style={{ flex: '1 1 auto', minHeight: '0' }}></div>
                </div>
              </div>
            </div>

            {/* Sección Observación */}
            <div className="mb-6">
              <label 
                className="block text-sm font-medium mb-2"
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  color: '#374151'
                }}
              >
                Observación
              </label>
              <textarea
                value={formDataInspeccion.observacion}
                onChange={(e) => setFormDataInspeccion(prev => ({ ...prev, observacion: e.target.value }))}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007C8A] bg-white"
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  fontSize: '14px'
                }}
                placeholder="Agregue comentarios adicionales de la inspección"
              />
            </div>

            {/* Sección Conformidad */}
            <div className="mb-6">
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
                {/* Checkbox CONFORME */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formDataInspeccion.conformidad === true}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormDataInspeccion(prev => ({ ...prev, conformidad: true }));
                      } else {
                        setFormDataInspeccion(prev => ({ ...prev, conformidad: null }));
                      }
                    }}
                    className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    style={{ cursor: 'pointer' }}
                  />
                  <span 
                    className="text-sm font-medium"
                    style={{ 
                      fontFamily: 'Lato, sans-serif',
                      color: '#374151'
                    }}
                  >
                    CONFORME
                  </span>
                </label>

                {/* Checkbox NO CONFORME */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formDataInspeccion.conformidad === false}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormDataInspeccion(prev => ({ ...prev, conformidad: false }));
                      } else {
                        setFormDataInspeccion(prev => ({ ...prev, conformidad: null }));
                      }
                    }}
                    className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-500"
                    style={{ cursor: 'pointer' }}
                  />
                  <span 
                    className="text-sm font-medium"
                    style={{ 
                      fontFamily: 'Lato, sans-serif',
                      color: '#374151'
                    }}
                  >
                    NO CONFORME
                  </span>
                </label>
              </div>
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={handleCancelar}
                disabled={isSubmitting}
                className="px-6 py-2 rounded-lg border border-[#007C8A] text-[#007C8A] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#007C8A] hover:text-white"
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  fontSize: '14px'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleGenerarReporte}
                disabled={isSubmitting}
                className="px-6 py-2 rounded-lg text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                  backgroundColor: '#007C8A',
                  fontFamily: 'Lato, sans-serif',
                  fontSize: '14px'
                }}
                onMouseEnter={(e) => {
                  if (!isSubmitting) {
                    e.target.style.backgroundColor = '#006B7A';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSubmitting) {
                    e.target.style.backgroundColor = '#007C8A';
                  }
                }}
              >
                {isSubmitting ? 'Generando...' : 'Generar reporte'}
              </button>
            </div>
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
      </div>
    );
  }

  return (
    <div className="w-full" style={{ fontFamily: 'Lato, sans-serif' }}>
      <div className="px-3 sm:px-4 md:px-6 w-full">
        {/* Header */}
        <div 
          className="bg-[#007C8A] w-full mb-4 sm:mb-6 rounded-lg mt-4 sm:mt-6"
          style={{
            minHeight: '70px',
            paddingTop: '12px',
            paddingBottom: '12px',
            paddingLeft: isMobile ? '12px' : '16px',
            paddingRight: isMobile ? '12px' : '16px'
          }}
        >
          <h1 
            className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1" 
            style={{ fontFamily: 'Lato, sans-serif', lineHeight: '1.2' }}
          >
            Asignación de DDJJ
          </h1>
          <p 
            className="text-white text-xs sm:text-sm font-normal" 
            style={{ fontFamily: 'Lato, sans-serif', lineHeight: '1.2' }}
          >
            DDJJ asignadas para inspección
          </p>
        </div>

        {/* Contenido principal */}
        <div 
          className="bg-white rounded-lg shadow-md"
          style={{
            border: '1px solid #B3E5FC',
            padding: isMobile ? '16px' : '24px'
          }}
        >
          {/* Resumen con icono verde */}
          {totalAsignaciones > 0 && (
            <div 
              className="flex items-center gap-3 sm:gap-4 mb-6 pb-6"
              style={{ borderBottom: '1px solid #E5E7EB' }}
            >
              <div 
                className="rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  backgroundColor: '#E6FFE6',
                  width: isMobile ? '40px' : '48px',
                  height: isMobile ? '40px' : '48px'
                }}
              >
                <svg 
                  className={isMobile ? "w-5 h-5" : "w-6 h-6"} 
                  fill="none" 
                  stroke="#00B69B" 
                  viewBox="0 0 24 24" 
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p 
                className="text-base sm:text-lg font-bold"
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  color: '#000000'
                }}
              >
                {nombreUsuario.split(' ')[0]} tienes {totalAsignaciones} {totalAsignaciones === 1 ? 'nueva asignación' : 'nuevas asignaciones'} a validar
              </p>
            </div>
          )}

          {/* Lista de asignaciones */}
          <div className="space-y-3 sm:space-y-4">
            {asignacionesData.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500" style={{ fontFamily: 'Lato, sans-serif' }}>
                  No hay asignaciones disponibles
                </p>
              </div>
            ) : (
              asignacionesData.map((asignacion) => (
                <div
                  key={asignacion.id_orden}
                  className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                  style={{ backgroundColor: '#FFFFFF' }}
                >
                  {/* Icono de documento azul claro */}
                  <div 
                    className="flex-shrink-0"
                    style={{ color: '#4A90E2' }}
                  >
                    <svg 
                      className={isMobile ? "w-6 h-6" : "w-8 h-8"} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24" 
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>

                  {/* Descripción y timestamp */}
                  <div className="flex-1 min-w-0">
                    <p 
                      className="text-sm sm:text-base mb-1"
                      style={{ 
                        fontFamily: 'Lato, sans-serif',
                        color: '#374151',
                        lineHeight: '1.5'
                      }}
                    >
                      Se te ha asignado inspección de <span className="font-semibold">{asignacion.idDDJJ}</span>, reporte de mantenimiento {asignacion.tipoReporte}
                    </p>
                    <p 
                      className="text-xs sm:text-sm"
                      style={{ 
                        fontFamily: 'Lato, sans-serif',
                        color: '#9CA3AF'
                      }}
                    >
                      {getTimeAgo(asignacion.fechaAsignacion)}
                    </p>
                  </div>

                  {/* Botón Iniciar inspección o estado Inspeccionado */}
                  {inspeccionesRealizadas.some(inspeccion => inspeccion.id_orden_trabajo === asignacion.id_orden) ? (
                    <div
                      className="w-full sm:w-auto px-4 sm:px-6 py-2 rounded-lg font-medium flex-shrink-0 text-sm sm:text-base flex items-center justify-center gap-2"
                      style={{
                        backgroundColor: '#E0F7FA',
                        color: '#007C8A',
                        fontFamily: 'Lato, sans-serif'
                      }}
                    >
                      <svg 
                        className="w-5 h-5" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Inspeccionado
                    </div>
                  ) : (
                    <button
                      onClick={() => handleIniciarInspeccion(asignacion)}
                      className="w-full sm:w-auto px-4 sm:px-6 py-2 rounded-lg text-white font-medium transition-colors flex-shrink-0 text-sm sm:text-base"
                      style={{
                        backgroundColor: '#007C8A',
                        fontFamily: 'Lato, sans-serif'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#006B7A';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#007C8A';
                      }}
                    >
                      Iniciar inspección
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Toast notifications */}
      {toast && (
        <div 
          className="fixed bottom-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm"
          style={{
            backgroundColor: toast.type === 'success' ? '#E6FFE6' : '#FEE2E2',
            border: `1px solid ${toast.type === 'success' ? '#00B69B' : '#DC2626'}`
          }}
        >
          <p 
            className="font-semibold mb-1"
            style={{ 
              fontFamily: 'Lato, sans-serif',
              color: toast.type === 'success' ? '#00B69B' : '#DC2626'
            }}
          >
            {toast.title}
          </p>
          <p 
            className="text-sm"
            style={{ 
              fontFamily: 'Lato, sans-serif',
              color: '#374151'
            }}
          >
            {toast.message}
          </p>
        </div>
      )}
    </div>
  );
};

export default AsignacionDDJJ;
