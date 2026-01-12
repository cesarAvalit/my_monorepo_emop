import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { JSON_SERVER_URL } from '../config/api';
import { getAllFromTable, insertIntoTable } from '../config/supabase';

const AlertasVencimiento = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [datosTabla, setDatosTabla] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isMobile, setIsMobile] = useState(false);
  const [usuarios, setUsuarios] = useState([]);
  const [tiposNotificacion, setTiposNotificacion] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [toast, setToast] = useState(null);
  const [empresasMap, setEmpresasMap] = useState({});
  const [notificacionesEnviadas, setNotificacionesEnviadas] = useState(new Set());

  // Validar que solo los administradores puedan acceder
  useEffect(() => {
    if (user && user.id_rol !== 1) {
      // Si no es administrador, redirigir al home
      navigate('/home', { replace: true });
    }
  }, [user, navigate]);

  // Si no es administrador, no renderizar nada
  if (!user || user.id_rol !== 1) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Acceso Denegado</h2>
          <p className="text-gray-600">Solo los administradores pueden acceder a esta sección.</p>
        </div>
      </div>
    );
  }

  // Detectar tamaño de pantalla
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Función para formatear fecha (DD/MM/YY)
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    return `${day}/${month}/${year}`;
  };

  // Función para generar código RTO
  const generateRTOCode = (idVehiculo) => {
    const base = idVehiculo.toString().padStart(3, '0');
    return `123FE${base}789AS12580I`;
  };


  // Función para obtener el color del badge según la fecha
  const getBadgeColor = (dateString) => {
    if (!dateString) return { bg: '#FF6F6F', text: '#FFFFFF', isVencido: true };
    
    const expirationDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expirationDate.setHours(0, 0, 0, 0);
    
    const diffTime = expirationDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Rojo: fecha <= hoy
    if (diffDays <= 0) {
      return { bg: '#FF6F6F', text: '#FFFFFF', isVencido: true };
    } 
    // Amarillo: fecha > hoy pero <= hoy + 30 días
    else if (diffDays <= 30) {
      return { bg: '#FFC107', text: '#FFFFFF', isVencido: false };
    } 
    // Verde: fecha > hoy + 30 días
    else {
      return { bg: '#00B69B', text: '#FFFFFF', isVencido: false };
    }
  };

  // Cargar datos del servidor
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Obtener datos usando Supabase
        const [vehiculos, empresas, usuariosData, tiposNotifData, rtoRegistros, notificacionesData] = await Promise.all([
          getAllFromTable('vehiculo'),
          getAllFromTable('empresa'),
          getAllFromTable('usuario'),
          getAllFromTable('tipo_notificacion'),
          getAllFromTable('rto_registro'),
          getAllFromTable('notificaciones')
        ]);

        // Validar que sean arrays
        const validVehiculos = Array.isArray(vehiculos) ? vehiculos : [];
        const validEmpresas = Array.isArray(empresas) ? empresas : [];
        const validUsuarios = Array.isArray(usuariosData) ? usuariosData : [];
        const validTiposNotif = Array.isArray(tiposNotifData) ? tiposNotifData : [];
        const validRtoRegistros = Array.isArray(rtoRegistros) ? rtoRegistros : [];
        const validNotificaciones = Array.isArray(notificacionesData) ? notificacionesData : [];

        // Procesar notificaciones para identificar qué vencimientos ya tienen notificaciones
        const notificacionesSet = new Set();
        validNotificaciones.forEach(notif => {
          if (notif.nota) {
            // Extraer matrícula de la nota (formato: "Matrícula ABC-003" o "Matrícula GHI-789")
            const matriculaMatch = notif.nota.match(/Matrícula\s+([A-Z0-9-]+)/);
            if (matriculaMatch) {
              const matricula = matriculaMatch[1];
              // Identificar tipo: RTO o Seguro
              // RTO: contiene "RTO" y "Matrícula" y "Venció"
              // Seguro: contiene "Seguro" y "Matrícula" y "Venció" pero NO contiene "RTO"
              const esRTO = notif.nota.includes('RTO') && notif.nota.includes('Matrícula') && notif.nota.includes('Venció') && !notif.nota.includes('Seguro');
              const esSeguro = notif.nota.includes('Seguro') && notif.nota.includes('Matrícula') && notif.nota.includes('Venció');
              // Crear clave única: matricula-tipo
              if (esRTO) {
                notificacionesSet.add(`${matricula}-RTO`);
              }
              if (esSeguro) {
                notificacionesSet.add(`${matricula}-Seguro`);
              }
            }
          }
        });
        setNotificacionesEnviadas(notificacionesSet);

        // Filtrar usuarios con id_rol = 2 (Empresa)
        const usuariosEmpresa = validUsuarios.filter(u => u.id_rol === 2);
        console.log(`[DEBUG] Usuarios empresa encontrados en total: ${usuariosEmpresa.length}`, usuariosEmpresa.map(u => ({
          id: u.id_usuario,
          nombre: u.nombre_completo,
          id_empresa: u.id_empresa,
          activo: u.activo
        })));
        setUsuarios(usuariosEmpresa);
        setTiposNotificacion(validTiposNotif);

        // Crear mapa para búsqueda rápida
        const empresasMapLocal = {};
        validEmpresas.forEach(e => {
          empresasMapLocal[e.id_empresa] = e;
        });
        setEmpresasMap(empresasMapLocal);

        // Crear mapa de RTO activos por vehículo (el más reciente)
        const rtoMap = {};
        validRtoRegistros
          .filter(rto => rto.activo)
          .forEach(rto => {
            const vehiculoId = rto.id_vehiculo;
            if (!rtoMap[vehiculoId] || new Date(rto.fecha_vencimiento) > new Date(rtoMap[vehiculoId].fecha_vencimiento)) {
              rtoMap[vehiculoId] = rto;
            }
          });

        // Combinar datos
        const datosCombinados = validVehiculos.map(vehiculo => {
          const empresa = empresasMapLocal[vehiculo.id_empresa];
          // Obtener fecha de vencimiento RTO desde la tabla rto_registro (RTO activo más reciente)
          const rtoActivo = rtoMap[vehiculo.id_vehiculo];
          const fechaVencimientoRTO = rtoActivo?.fecha_vencimiento || null;
          // Obtener fecha de vencimiento de seguro desde la tabla vehiculo
          const fechaVencimientoSeguro = vehiculo.fecha_vencimiento_seguro || null;

          return {
            id: vehiculo.id_vehiculo,
            id_empresa: vehiculo.id_empresa,
            matricula: vehiculo.matricula || vehiculo.interno,
            empresa: empresa?.nombre_empresa || 'N/A',
            rto: generateRTOCode(vehiculo.id_vehiculo),
            vencimientoRTO: fechaVencimientoRTO,
            seguro: fechaVencimientoSeguro ? 'Rivadavia' : 'N/A',
            vencimientoSeguro: fechaVencimientoSeguro
          };
        });

        setDatosTabla(datosCombinados);
      } catch (error) {
        console.error('Error al cargar datos:', error);
        if (error.message.includes('ECONNREFUSED') || error.message.includes('Failed to fetch')) {
          console.warn('⚠️ El servidor JSON no está corriendo. Por favor ejecuta: npm run json-server');
        }
        setDatosTabla([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Manejar selección de checkboxes
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = new Set(datosTabla.map(item => item.id));
      setSelectedItems(allIds);
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (id) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  // Función para formatear fecha y hora completa
  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  // Función para enviar notificaciones
  const handleEnviarNotificacion = async () => {
    try {
      setIsSending(true);

      // Obtener los items seleccionados
      const itemsSeleccionados = datosTabla.filter(item => selectedItems.has(item.id));

      if (itemsSeleccionados.length === 0) {
        setToast({
          type: 'error',
          title: 'Sin selección',
          message: 'Por favor selecciona al menos un vehículo para enviar notificaciones.'
        });
        setTimeout(() => setToast(null), 5000);
        return;
      }

      // Obtener los tipos de notificación
      const tipoRTO = tiposNotificacion.find(t => t.nombre_de_notif === 'Vto de RTO');
      const tipoSeguro = tiposNotificacion.find(t => t.nombre_de_notif === 'Vto de Seguro');

      if (!tipoRTO || !tipoSeguro) {
        throw new Error('No se encontraron los tipos de notificación necesarios');
      }

      const fechaHoraActual = new Date().toISOString();
      let notificacionesCreadas = 0;
      let errores = 0;
      let itemsConVencimientos = 0;
      const detallesProcesamiento = []; // Para tracking detallado

      console.log(`[DEBUG] Total items seleccionados: ${itemsSeleccionados.length}`, itemsSeleccionados.map(i => i.matricula));

      // Procesar cada item seleccionado
      for (const item of itemsSeleccionados) {
        console.log(`[DEBUG] Procesando item seleccionado: ${item.matricula}`, {
          vencimientoRTO: item.vencimientoRTO,
          vencimientoSeguro: item.vencimientoSeguro,
          id_empresa: item.id_empresa
        });
        
        const colorRTO = getBadgeColor(item.vencimientoRTO);
        const colorSeguro = getBadgeColor(item.vencimientoSeguro);
        
        // Verificar si tiene algún vencimiento (rojo)
        const tieneRTOVencido = item.vencimientoRTO && colorRTO.isVencido;
        const tieneSeguroVencido = item.vencimientoSeguro && colorSeguro.isVencido;

        console.log(`[DEBUG] Estado de vencimientos para ${item.matricula}:`, {
          tieneRTOVencido,
          tieneSeguroVencido,
          colorRTO,
          colorSeguro
        });

        // Si no tiene ningún vencimiento, saltar este item
        if (!tieneRTOVencido && !tieneSeguroVencido) {
          console.log(`[DEBUG] Saltando ${item.matricula} - no tiene vencimientos`);
          detallesProcesamiento.push({
            matricula: item.matricula,
            estado: 'sin_vencimientos',
            notificaciones: 0
          });
          continue;
        }

        itemsConVencimientos++;

        // Buscar usuarios empresa de la empresa del vehículo
        const usuariosEmpresaItem = usuarios.filter(u => u.id_empresa === item.id_empresa);

        console.log(`[DEBUG] Usuarios empresa encontrados para ${item.matricula}:`, {
          cantidad: usuariosEmpresaItem.length,
          usuarios: usuariosEmpresaItem.map(u => ({ id: u.id_usuario, nombre: u.nombre_completo }))
        });

        if (usuariosEmpresaItem.length === 0) {
          const empresaNombre = empresasMap[item.id_empresa]?.nombre_empresa || 'Desconocida';
          console.warn(`⚠️ No se encontraron usuarios empresa para la empresa "${empresaNombre}" (id_empresa: ${item.id_empresa}) del vehículo ${item.matricula}`);
          console.warn(`   Total usuarios empresa en sistema: ${usuarios.length}`);
          if (usuarios.length > 0) {
            console.warn(`   Usuarios empresa disponibles por empresa:`, 
              usuarios.reduce((acc, u) => {
                const empId = u.id_empresa;
                if (!acc[empId]) acc[empId] = [];
                acc[empId].push(u.nombre_completo);
                return acc;
              }, {})
            );
          } else {
            console.warn(`   ⚠️ No hay usuarios empresa en el sistema. Por favor, crea usuarios con rol "Empresa" (id_rol = 2).`);
          }
          detallesProcesamiento.push({
            matricula: item.matricula,
            empresa: empresaNombre,
            estado: 'sin_usuarios_empresa',
            notificaciones: 0
          });
          continue;
        }

        let notificacionesItem = 0;
        let erroresItem = 0;

        // Crear notificación para RTO vencido (si está vencido)
        if (tieneRTOVencido) {
          console.log(`[DEBUG] Procesando RTO vencido para vehículo ${item.matricula}`, {
            vencimientoRTO: item.vencimientoRTO,
            colorRTO,
            tipoRTOId: tipoRTO.id,
            usuariosEmpresa: usuariosEmpresaItem.length
          });
          
          const fechaVencimientoFormateada = formatDate(item.vencimientoRTO);
          const notaRTO = `El RTO del vehículo Matrícula ${item.matricula}, RTO ${item.rto}, Venció el día ${fechaVencimientoFormateada}`;

          for (const usuario of usuariosEmpresaItem) {
            try {
              const notificacionData = {
                id_tipo_notificacion: tipoRTO.id,
                id_usuario: usuario.id_usuario,
                fecha_hora: fechaHoraActual,
                nota: notaRTO,
                visto: false
              };
              console.log(`[DEBUG] Creando notificación RTO para usuario ${usuario.id_usuario} (${usuario.nombre_completo}):`, notificacionData);
              const resultado = await insertIntoTable('notificaciones', notificacionData);
              if (resultado) {
                notificacionesCreadas++;
                notificacionesItem++;
                console.log(`[DEBUG] ✅ Notificación RTO creada exitosamente para usuario ${usuario.id_usuario}`);
              } else {
                throw new Error('insertIntoTable no devolvió resultado');
              }
            } catch (error) {
              console.error(`❌ Error al crear notificación RTO para usuario ${usuario.id_usuario}:`, error);
              errores++;
              erroresItem++;
            }
          }
        } else {
          console.log(`[DEBUG] RTO NO vencido para vehículo ${item.matricula}`, {
            vencimientoRTO: item.vencimientoRTO,
            colorRTO,
            tieneRTOVencido
          });
        }

        // Crear notificación para Seguro vencido (si está vencido)
        if (tieneSeguroVencido) {
          console.log(`[DEBUG] Procesando Seguro vencido para vehículo ${item.matricula}`, {
            vencimientoSeguro: item.vencimientoSeguro,
            colorSeguro,
            tipoSeguroId: tipoSeguro.id,
            usuariosEmpresa: usuariosEmpresaItem.length
          });

          const fechaVencimientoFormateada = formatDate(item.vencimientoSeguro);
          const notaSeguro = `El Seguro del vehículo Matrícula ${item.matricula}, Venció el día ${fechaVencimientoFormateada}`;

          for (const usuario of usuariosEmpresaItem) {
            try {
              const notificacionData = {
                id_tipo_notificacion: tipoSeguro.id,
                id_usuario: usuario.id_usuario,
                fecha_hora: fechaHoraActual,
                nota: notaSeguro,
                visto: false
              };
              console.log(`[DEBUG] Creando notificación Seguro para usuario ${usuario.id_usuario} (${usuario.nombre_completo}):`, notificacionData);
              const resultado = await insertIntoTable('notificaciones', notificacionData);
              if (resultado) {
                notificacionesCreadas++;
                notificacionesItem++;
                console.log(`[DEBUG] ✅ Notificación Seguro creada exitosamente para usuario ${usuario.id_usuario}`);
              } else {
                throw new Error('insertIntoTable no devolvió resultado');
              }
            } catch (error) {
              console.error(`❌ Error al crear notificación Seguro para usuario ${usuario.id_usuario}:`, error);
              errores++;
              erroresItem++;
            }
          }
        }

        // Registrar detalles del procesamiento de este item
        detallesProcesamiento.push({
          matricula: item.matricula,
          estado: 'procesado',
          tieneRTOVencido,
          tieneSeguroVencido,
          usuariosEmpresa: usuariosEmpresaItem.length,
          notificaciones: notificacionesItem,
          errores: erroresItem
        });
      }

      console.log(`[DEBUG] Resumen del procesamiento:`, {
        itemsSeleccionados: itemsSeleccionados.length,
        itemsConVencimientos,
        notificacionesCreadas,
        errores,
        detalles: detallesProcesamiento
      });

      // Mostrar mensaje de éxito o error
      if (itemsConVencimientos === 0) {
        setToast({
          type: 'error',
          title: 'Sin vencimientos',
          message: 'No hay vencimientos (en rojo) en los items seleccionados. Solo se envían notificaciones para RTO o Seguro vencidos.'
        });
      } else if (notificacionesCreadas > 0) {
        const itemsSinUsuarios = detallesProcesamiento.filter(d => d.estado === 'sin_usuarios_empresa');
        const itemsSinVencimientos = detallesProcesamiento.filter(d => d.estado === 'sin_vencimientos');
        
        let mensajeAdicional = '';
        if (itemsSinUsuarios.length > 0) {
          mensajeAdicional += ` ${itemsSinUsuarios.length} vehículo(s) sin usuarios empresa.`;
        }
        if (itemsSinVencimientos.length > 0) {
          mensajeAdicional += ` ${itemsSinVencimientos.length} vehículo(s) sin vencimientos.`;
        }
        
        setToast({
          type: 'success',
          title: 'Notificaciones enviadas',
          message: `Se enviaron ${notificacionesCreadas} notificación(es) exitosamente de ${itemsConVencimientos} vehículo(s) con vencimientos.${mensajeAdicional}${errores > 0 ? ` ${errores} error(es) ocurrieron.` : ''}`
        });
        // Limpiar selección y recargar notificaciones
        setSelectedItems(new Set());
        // Recargar notificaciones para actualizar el estado
        try {
          const notificacionesData = await getAllFromTable('notificaciones');
          const validNotificaciones = Array.isArray(notificacionesData) ? notificacionesData : [];
          const notificacionesSet = new Set();
          validNotificaciones.forEach(notif => {
            if (notif.nota) {
              const matriculaMatch = notif.nota.match(/Matrícula\s+([A-Z0-9-]+)/);
              if (matriculaMatch) {
                const matricula = matriculaMatch[1];
                // Identificar tipo: RTO o Seguro
                // RTO: contiene "RTO" y "Matrícula" y "Venció"
                // Seguro: contiene "Seguro" y "Matrícula" y "Venció" pero NO contiene "RTO"
                const esRTO = notif.nota.includes('RTO') && notif.nota.includes('Matrícula') && notif.nota.includes('Venció') && !notif.nota.includes('Seguro');
                const esSeguro = notif.nota.includes('Seguro') && notif.nota.includes('Matrícula') && notif.nota.includes('Venció');
                if (esRTO) {
                  notificacionesSet.add(`${matricula}-RTO`);
                }
                if (esSeguro) {
                  notificacionesSet.add(`${matricula}-Seguro`);
                }
              }
            }
          });
          setNotificacionesEnviadas(notificacionesSet);
        } catch (error) {
          console.error('Error al recargar notificaciones:', error);
        }
      } else {
        const itemsSinUsuarios = detallesProcesamiento.filter(d => d.estado === 'sin_usuarios_empresa');
        let mensajeError = `No se pudieron enviar las notificaciones.`;
        if (itemsSinUsuarios.length > 0) {
          const empresasSinUsuarios = itemsSinUsuarios.map(i => i.empresa || i.matricula).join(', ');
          mensajeError += ` ${itemsSinUsuarios.length} vehículo(s) no tienen usuarios empresa asociados (${empresasSinUsuarios}). Por favor, crea usuarios con rol "Empresa" para estas empresas.`;
        }
        setToast({
          type: 'error',
          title: 'Error al enviar notificaciones',
          message: `${mensajeError}${errores > 0 ? ` ${errores} error(es) ocurrieron.` : ''}`
        });
      }

      setTimeout(() => setToast(null), 5000);
    } catch (error) {
      console.error('Error al enviar notificaciones:', error);
      setToast({
        type: 'error',
        title: 'Error al enviar notificaciones',
        message: error.message || 'Ocurrió un error al intentar enviar las notificaciones.'
      });
      setTimeout(() => setToast(null), 5000);
    } finally {
      setIsSending(false);
    }
  };

  // Calcular paginación
  const totalItems = datosTabla.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = datosTabla.slice(startIndex, endIndex);

  return (
    <div className="w-full">
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
            type="button"
            onClick={() => navigate('/home')}
            className="rounded-full flex items-center justify-center flex-shrink-0"
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
              Alertas de vencimiento
            </h1>
            <p className="text-white text-xs sm:text-sm font-normal" style={{ fontFamily: 'Lato, sans-serif', lineHeight: '1.2' }}>
              Aquí tienes un listado de vencimientos de los próximos 30 días
            </p>
          </div>
        </div>

        {/* Tabla de vencimientos */}
        <div 
          className="bg-white rounded-lg shadow-md"
          style={{
            border: '1px solid #B3E5FC',
            padding: isMobile ? '12px' : '24px'
          }}
        >
          {/* Título y botón */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="flex-1">
              <h2 
                className="text-lg sm:text-xl font-bold mb-1 sm:mb-2"
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  color: '#000000'
                }}
              >
                Tabla de vencimientos próximos
              </h2>
              <p 
                className="text-xs sm:text-sm"
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  color: '#666666'
                }}
              >
                Detalle de vencimientos
              </p>
            </div>
            <button
              onClick={handleEnviarNotificacion}
              disabled={selectedItems.size === 0 || isSending}
              className="px-3 sm:px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap w-full sm:w-auto text-white font-medium"
              style={{ 
                fontFamily: 'Lato, sans-serif',
                fontSize: isMobile ? '12px' : '14px',
                backgroundColor: selectedItems.size > 0 && !isSending ? '#007C8A' : '#9CA3AF',
              }}
              onMouseEnter={(e) => {
                if (selectedItems.size > 0 && !isSending) {
                  e.target.style.backgroundColor = '#006B7A';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedItems.size > 0 && !isSending) {
                  e.target.style.backgroundColor = '#007C8A';
                }
              }}
            >
              {isSending ? 'Enviando...' : 'Enviar notificación'}
            </button>
          </div>

          {/* Tabla */}
          <div className="overflow-x-auto -mx-3 sm:-mx-4 md:mx-0 w-full">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-gray-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                  Cargando datos...
                </div>
              </div>
            ) : (
            <table className="w-full min-w-[600px] sm:min-w-[700px]" style={{ fontFamily: 'Lato, sans-serif' }}>
              <thead>
                <tr style={{ backgroundColor: '#F3F4F6' }}>
                  <th 
                    className="text-left py-3 px-4 font-semibold"
                    style={{ 
                      fontSize: '14px',
                      color: '#374151'
                    }}
                  >
                    {(() => {
                      const itemsConCheckbox = datosTabla.filter(item => {
                        const colorRTO = getBadgeColor(item.vencimientoRTO);
                        const colorSeguro = getBadgeColor(item.vencimientoSeguro);
                        const tieneRTOVencido = item.vencimientoRTO && colorRTO.isVencido;
                        const tieneSeguroVencido = item.vencimientoSeguro && colorSeguro.isVencido;
                        const rtoYaEnviado = tieneRTOVencido && notificacionesEnviadas.has(`${item.matricula}-RTO`);
                        const seguroYaEnviado = tieneSeguroVencido && notificacionesEnviadas.has(`${item.matricula}-Seguro`);
                        let todasNotificacionesEnviadas = true;
                        if (tieneRTOVencido && !rtoYaEnviado) todasNotificacionesEnviadas = false;
                        if (tieneSeguroVencido && !seguroYaEnviado) todasNotificacionesEnviadas = false;
                        if (!tieneRTOVencido && !tieneSeguroVencido) todasNotificacionesEnviadas = false;
                        return !todasNotificacionesEnviadas;
                      });
                      return itemsConCheckbox.length > 0 ? (
                        <input
                          type="checkbox"
                          checked={selectedItems.size === itemsConCheckbox.length && itemsConCheckbox.length > 0}
                          onChange={handleSelectAll}
                          className="cursor-pointer"
                        />
                      ) : null;
                    })()}
                  </th>
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
                    Empresa
                  </th>
                  <th 
                    className="text-left py-3 px-4 font-semibold"
                    style={{ 
                      fontSize: '14px',
                      color: '#374151'
                    }}
                  >
                    RTO
                  </th>
                  <th 
                    className="text-left py-3 px-4 font-semibold"
                    style={{ 
                      fontSize: '14px',
                      color: '#374151'
                    }}
                  >
                    Vencimiento RTO
                  </th>
                  <th 
                    className="text-left py-3 px-4 font-semibold"
                    style={{ 
                      fontSize: '14px',
                      color: '#374151'
                    }}
                  >
                    Seguro
                  </th>
                  <th 
                    className="text-left py-3 px-4 font-semibold"
                    style={{ 
                      fontSize: '14px',
                      color: '#374151'
                    }}
                  >
                    Vencimiento seguro
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
                  currentData.map((item, index) => {
                    const colorRTO = getBadgeColor(item.vencimientoRTO);
                    const colorSeguro = getBadgeColor(item.vencimientoSeguro);
                    
                    // Verificar si ya se enviaron notificaciones para este vehículo
                    const tieneRTOVencido = item.vencimientoRTO && colorRTO.isVencido;
                    const tieneSeguroVencido = item.vencimientoSeguro && colorSeguro.isVencido;
                    const rtoYaEnviado = tieneRTOVencido && notificacionesEnviadas.has(`${item.matricula}-RTO`);
                    const seguroYaEnviado = tieneSeguroVencido && notificacionesEnviadas.has(`${item.matricula}-Seguro`);
                    
                    // Ocultar checkbox si TODOS los vencimientos que tiene ya tienen notificaciones enviadas
                    let todasNotificacionesEnviadas = true;
                    if (tieneRTOVencido && !rtoYaEnviado) {
                      todasNotificacionesEnviadas = false;
                    }
                    if (tieneSeguroVencido && !seguroYaEnviado) {
                      todasNotificacionesEnviadas = false;
                    }
                    // Si no tiene vencimientos, mostrar checkbox (aunque no se pueda seleccionar)
                    if (!tieneRTOVencido && !tieneSeguroVencido) {
                      todasNotificacionesEnviadas = false;
                    }
                    
                    return (
                      <tr 
                        key={item.id}
                        style={{ 
                          borderBottom: '1px solid #E5E7EB',
                          backgroundColor: index % 2 === 0 ? '#FFFFFF' : '#F9FAFB'
                        }}
                      >
                        <td className="py-3 px-4">
                          {!todasNotificacionesEnviadas ? (
                            <input
                              type="checkbox"
                              checked={selectedItems.has(item.id)}
                              onChange={() => handleSelectItem(item.id)}
                              className="cursor-pointer"
                            />
                          ) : (
                            <svg 
                              className="w-5 h-5" 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24" 
                              style={{ color: '#007C8A' }}
                            >
                              <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={3} 
                                d="M5 13l4 4L19 7" 
                              />
                            </svg>
                          )}
                        </td>
                        <td className="py-3 px-4" style={{ fontSize: '14px', color: '#374151' }}>
                          {item.matricula}
                        </td>
                        <td className="py-3 px-4" style={{ fontSize: '14px', color: '#374151' }}>
                          {item.empresa}
                        </td>
                        <td className="py-3 px-4" style={{ fontSize: '14px', color: '#374151' }}>
                          {item.rto}
                        </td>
                        <td className="py-3 px-4">
                          {item.vencimientoRTO ? (
                            <span
                              style={{
                                backgroundColor: colorRTO.bg,
                                color: colorRTO.text,
                                borderRadius: '4.5px',
                                padding: '4px 10px',
                                fontSize: '11px',
                                whiteSpace: 'nowrap',
                                height: '24px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontFamily: 'Lato, sans-serif',
                                fontWeight: '500'
                              }}
                            >
                              <svg width="12" height="12" fill="none" stroke={colorRTO.text} viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {colorRTO.isVencido ? `RTO vencido ${formatDate(item.vencimientoRTO)}` : `RTO vence ${formatDate(item.vencimientoRTO)}`}
                            </span>
                          ) : (
                            <span style={{ fontSize: '14px', color: '#9CA3AF' }}>N/A</span>
                          )}
                        </td>
                        <td className="py-3 px-4" style={{ fontSize: '14px', color: '#374151' }}>
                          {item.seguro}
                        </td>
                        <td className="py-3 px-4">
                          {item.vencimientoSeguro ? (
                            <span
                              style={{
                                backgroundColor: colorSeguro.bg,
                                color: colorSeguro.text,
                                borderRadius: '4.5px',
                                padding: '4px 10px',
                                fontSize: '11px',
                                whiteSpace: 'nowrap',
                                height: '24px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontFamily: 'Lato, sans-serif',
                                fontWeight: '500'
                              }}
                            >
                              <svg width="12" height="12" fill="none" stroke={colorSeguro.text} viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {colorSeguro.isVencido ? `Seguro vencido ${formatDate(item.vencimientoSeguro)}` : `Seguro vence ${formatDate(item.vencimientoSeguro)}`}
                            </span>
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
            )}
          </div>

          {/* Paginación */}
          {!isLoading && (
          <div className="flex items-center justify-between mt-6 pt-4" style={{ borderTop: '1px solid #E5E7EB' }}>
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
    </div>
  );
};

export default AlertasVencimiento;
