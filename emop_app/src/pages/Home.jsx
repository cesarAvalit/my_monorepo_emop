import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { JSON_SERVER_URL } from '../config/api';
import { getAllFromTable, getByForeignKey } from '../config/supabase';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Label, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const nombreUsuario = user?.nombre || 'Usuario';
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(7);
  const [datosTabla, setDatosTabla] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [ordenesTrabajo, setOrdenesTrabajo] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [empresaUsuario, setEmpresaUsuario] = useState(null);
  const [totalVehiculos, setTotalVehiculos] = useState(0);
  const [totalOrdenes, setTotalOrdenes] = useState(0);
  const [alertasVencimiento, setAlertasVencimiento] = useState(0);
  const [ddjjRegistradas, setDdjjRegistradas] = useState(0);
  const [ddjjTendencia, setDdjjTendencia] = useState(null); // { porcentaje: string, esPositiva: boolean }
  const [mantenimientosPreventivos, setMantenimientosPreventivos] = useState(0);
  const [mantenimientosCorrectivos, setMantenimientosCorrectivos] = useState(0);
  const [correctivosTendencia, setCorrectivosTendencia] = useState(null); // { porcentaje: string, esPositiva: boolean }
  const [totalMantenimientos, setTotalMantenimientos] = useState(0);
  const [personal, setPersonal] = useState(0);
  const [tiposMantenimiento, setTiposMantenimiento] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [rtoRegistros, setRtoRegistros] = useState([]);
  
  // Estados para vista de revisión de inspección (Inspector)
  const [showRevisarInspeccionModal, setShowRevisarInspeccionModal] = useState(false);
  const [datosInspeccionRevisar, setDatosInspeccionRevisar] = useState(null);
  const [inspeccionesData, setInspeccionesData] = useState([]);
  const [toast, setToast] = useState(null);
  
  // Estados para datos del Auditor
  const [auditorData, setAuditorData] = useState({
    inspeccionado: { porcentaje: 0, total: 0, cantidad: 0 },
    rtoVigente: { porcentaje: 0, total: 0, cantidad: 0 },
    segurosAlDia: { porcentaje: 0, total: 0, cantidad: 0 },
    licenciasValidadas: { porcentaje: 0, total: 0, cantidad: 0 }
  });
  const [gastosData, setGastosData] = useState([]);
  const [discrepanciasData, setDiscrepanciasData] = useState([]);
  
  // Determinar si el usuario es de tipo Empresa (id_rol: 2), Inspector (id_rol: 3) o Auditor (id_rol: 4)
  const isAdminUser = user?.id_rol === 1;
  const isEmpresaUser = user?.id_rol === 2;
  const isInspectorUser = user?.id_rol === 3;
  const isAuditorUser = user?.id_rol === 4;
  const idEmpresaUsuario = user?.id_empresa;
  const idUsuarioInspector = user?.id || user?.id_usuario;

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
    if (!dateString) return '';
    const date = new Date(dateString);
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return `${date.getDate()}/${months[date.getMonth()]}/${date.getFullYear()}`;
  };

  // Función para formatear fecha en formato DD/MM/YYYY (para Inspector)
  const formatDateDDMMYYYY = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Función para formatear número con separadores de miles
  const formatNumber = (num) => {
    return new Intl.NumberFormat('es-AR').format(num);
  };

  // Función para determinar tipo de vehículo basado en modelo
  const getTipoVehiculo = (modelo) => {
    const modeloLower = modelo?.toLowerCase() || '';
    if (modeloLower.includes('oh') || modeloLower.includes('of')) {
      return 'Urbano';
    }
    return 'Larga distancia';
  };

  // Función unificada para calcular el estado del vehículo basado en órdenes de trabajo
  const getEstadoVehiculo = (vehiculo, ordenesTrabajoData, tiposMantenimientoData) => {
    // Si el vehículo no está activo, está dado de baja
    if (!vehiculo.activo) {
      return 'Dado de baja';
    }
    
    // Buscar órdenes de trabajo activas para este vehículo
    // Una orden está activa si: estado !== 'Completada' O fecha_egreso es null
    const ordenesActivas = ordenesTrabajoData.filter(ot => 
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
      const tipo = tiposMantenimientoData.find(t => t.id_tipo === ot.id_tipo_mantenimiento);
      return tipo?.descripcion === 'Preventivo';
    });
    
    if (ordenPreventiva) {
      return 'Preventivo';
    }
    
    // Verificar si hay órdenes correctivas
    const ordenCorrectiva = ordenesActivas.find(ot => {
      const tipo = tiposMantenimientoData.find(t => t.id_tipo === ot.id_tipo_mantenimiento);
      return tipo?.descripcion === 'Correctivo';
    });
    
    if (ordenCorrectiva) {
      return 'Correctivo';
    }
    
    // Si hay orden activa pero no se puede determinar el tipo, retornar "En mantenimiento"
    return 'En mantenimiento';
  };

  // Cargar datos del servidor
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Obtener datos usando Supabase
        const [ordenes, vehiculos, empresas, conductores, tiposData, rtoData] = await Promise.all([
          getAllFromTable('orden_trabajo'),
          getAllFromTable('vehiculo'),
          getAllFromTable('empresa'),
          getAllFromTable('conductor'),
          getAllFromTable('tipo_mantenimiento'),
          getAllFromTable('rto_registro')
        ]);

        // Validar que sean arrays
        let validOrdenes = Array.isArray(ordenes) ? ordenes : [];
        let validVehiculos = Array.isArray(vehiculos) ? vehiculos : [];
        const validEmpresas = Array.isArray(empresas) ? empresas : [];
        const validConductores = Array.isArray(conductores) ? conductores : [];
        const validTipos = Array.isArray(tiposData) ? tiposData : [];
        const validRto = Array.isArray(rtoData) ? rtoData : [];
        
        setTiposMantenimiento(validTipos);
        setRtoRegistros(validRto);

        // Si el usuario es Inspector, cargar inspecciones realizadas
        let inspeccionesDataTemp = [];
        if (isInspectorUser && idUsuarioInspector) {
          // Cargar inspecciones realizadas por el inspector
          inspeccionesDataTemp = await getByForeignKey('inspeccion_ddjj', 'id_usuario', idUsuarioInspector);
          inspeccionesDataTemp = Array.isArray(inspeccionesDataTemp) ? inspeccionesDataTemp : [];
          setInspeccionesData(inspeccionesDataTemp);
          
          // También cargar asignaciones para mostrar órdenes disponibles
          const asignacionesData = await getByForeignKey('orden_x_usuario', 'id_usuario', idUsuarioInspector);
          const asignaciones = Array.isArray(asignacionesData) ? asignacionesData : [];
          const idsOrdenes = asignaciones.map(a => a.id_orden_trabajo);
          validOrdenes = validOrdenes.filter(o => idsOrdenes.includes(o.id_orden));
          
          // Filtrar vehículos de las órdenes asignadas
          const idsVehiculos = validOrdenes.map(o => o.id_vehiculo);
          validVehiculos = validVehiculos.filter(v => idsVehiculos.includes(v.id_vehiculo));
        }

        // Si el usuario es de tipo Empresa, filtrar por su empresa
        let validConductoresFiltrados = validConductores;
        if (isEmpresaUser && idEmpresaUsuario) {
          validVehiculos = validVehiculos.filter(v => v.id_empresa === idEmpresaUsuario);
          validOrdenes = validOrdenes.filter(o => {
            const vehiculoOrden = validVehiculos.find(v => v.id_vehiculo === o.id_vehiculo);
            return vehiculoOrden !== undefined;
          });
          validConductoresFiltrados = validConductores.filter(c => c.id_empresa === idEmpresaUsuario);
          
          // Obtener datos de la empresa del usuario
          const empresa = validEmpresas.find(e => e.id_empresa === idEmpresaUsuario);
          setEmpresaUsuario(empresa);
        }

        setOrdenesTrabajo(validOrdenes);
        setTotalOrdenes(validOrdenes.length);
        setVehiculos(validVehiculos);
        setTotalVehiculos(validVehiculos.length);
        
        // Calcular métricas específicas para usuarios Empresa
        if (isEmpresaUser && idEmpresaUsuario) {
          // DDJJ registradas: contar TODAS las órdenes de trabajo de la empresa (no solo las completadas)
          const ddjjCount = validOrdenes.length;
          setDdjjRegistradas(ddjjCount);

          // Calcular tendencia comparando con el mes anterior (usando órdenes ya filtradas por empresa)
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

          // Calcular porcentaje de cambio
          if (ddjjMesAnterior > 0) {
            const cambio = ((ddjjMesActual - ddjjMesAnterior) / ddjjMesAnterior) * 100;
            setDdjjTendencia({
              porcentaje: Math.abs(cambio).toFixed(1),
              esPositiva: cambio >= 0
            });
          } else if (ddjjMesAnterior === 0 && ddjjMesActual > 0) {
            // Si no había datos el mes anterior y hay datos este mes, mostrar como positivo
            setDdjjTendencia({
              porcentaje: '100',
              esPositiva: true
            });
          } else {
            setDdjjTendencia(null);
          }
          
          // Mantenimientos preventivos: contar TODAS las órdenes de tipo Preventivo (no solo las completadas)
          const preventivosCount = validOrdenes.filter(o => {
            const tipo = validTipos.find(t => t.id_tipo === o.id_tipo_mantenimiento);
            return tipo?.descripcion === 'Preventivo';
          }).length;
          setMantenimientosPreventivos(preventivosCount);

          // Mantenimientos correctivos: contar TODAS las órdenes de tipo Correctivo (no solo las completadas)
          const correctivosCount = validOrdenes.filter(o => {
            const tipo = validTipos.find(t => t.id_tipo === o.id_tipo_mantenimiento);
            return tipo?.descripcion === 'Correctivo';
          }).length;
          setMantenimientosCorrectivos(correctivosCount);
          
          // Total de mantenimientos: suma de preventivos y correctivos
          const totalMant = preventivosCount + correctivosCount;
          setTotalMantenimientos(totalMant);
          
          // Calcular tendencia para mantenimientos correctivos
          const correctivosMesActual = validOrdenes.filter(o => {
            const tipo = validTipos.find(t => t.id_tipo === o.id_tipo_mantenimiento);
            if (tipo?.descripcion !== 'Correctivo') return false;
            if (!o.fecha_generacion) return false;
            const fecha = new Date(o.fecha_generacion);
            fecha.setHours(0, 0, 0, 0);
            return fecha >= mesActualInicio;
          }).length;

          const correctivosMesAnterior = validOrdenes.filter(o => {
            const tipo = validTipos.find(t => t.id_tipo === o.id_tipo_mantenimiento);
            if (tipo?.descripcion !== 'Correctivo') return false;
            if (!o.fecha_generacion) return false;
            const fecha = new Date(o.fecha_generacion);
            fecha.setHours(0, 0, 0, 0);
            return fecha >= mesAnteriorInicio && fecha <= mesAnteriorFin;
          }).length;

          if (correctivosMesAnterior > 0) {
            const cambio = ((correctivosMesActual - correctivosMesAnterior) / correctivosMesAnterior) * 100;
            setCorrectivosTendencia({
              porcentaje: Math.abs(cambio).toFixed(1),
              esPositiva: cambio >= 0
            });
          } else if (correctivosMesAnterior === 0 && correctivosMesActual > 0) {
            setCorrectivosTendencia({
              porcentaje: '100',
              esPositiva: true
            });
          } else {
            setCorrectivosTendencia(null);
          }
          
          // Personal: contar conductores activos de la empresa
          const personalCount = validConductoresFiltrados.filter(c => c.activo === true).length;
          setPersonal(personalCount);
        } else {
          // Si no es usuario Empresa, inicializar estados
          setDdjjRegistradas(0);
          setDdjjTendencia(null);
          setMantenimientosPreventivos(0);
          setMantenimientosCorrectivos(0);
          setCorrectivosTendencia(null);
          setTotalMantenimientos(0);
          setPersonal(0);
        }

        // Calcular alertas de vencimiento (vehículos con fechas vencidas o próximas a vencer en 30 días)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const alertas = validVehiculos.filter(v => {
          if (!v.fecha_vencimiento_seguro && !v.fecha_ultima_rto) return false;
          
          const fechaSeguro = v.fecha_vencimiento_seguro ? new Date(v.fecha_vencimiento_seguro) : null;
          const fechaRTO = v.fecha_ultima_rto ? new Date(v.fecha_ultima_rto) : null;
          
          if (fechaSeguro) {
            fechaSeguro.setHours(0, 0, 0, 0);
            const diffSeguro = Math.ceil((fechaSeguro - today) / (1000 * 60 * 60 * 24));
            if (diffSeguro <= 30) return true;
          }
          
          if (fechaRTO) {
            fechaRTO.setHours(0, 0, 0, 0);
            const diffRTO = Math.ceil((fechaRTO - today) / (1000 * 60 * 60 * 24));
            if (diffRTO <= 30) return true;
          }
          
          return false;
        }).length;
        setAlertasVencimiento(alertas);

        // Calcular datos del Auditor
        if (isAuditorUser) {
          // Cargar datos adicionales para el Auditor
          const [
            detallesInsumoData,
            reportesAuditoriaData,
            inspeccionesDDJJData,
            mecanicosData,
            ordenXMecanicoData
          ] = await Promise.all([
            getAllFromTable('detalle_insumo'),
            getAllFromTable('reporte_auditoria_ddjj'),
            getAllFromTable('inspeccion_ddjj'),
            getAllFromTable('mecanico'),
            getAllFromTable('orden_x_mecanico')
          ]);

          const validDetallesInsumo = Array.isArray(detallesInsumoData) ? detallesInsumoData : [];
          const validReportesAuditoria = Array.isArray(reportesAuditoriaData) ? reportesAuditoriaData : [];
          const validInspeccionesDDJJ = Array.isArray(inspeccionesDDJJData) ? inspeccionesDDJJData : [];
          const validMecanicos = Array.isArray(mecanicosData) ? mecanicosData : [];
          const validOrdenXMecanico = Array.isArray(ordenXMecanicoData) ? ordenXMecanicoData : [];

          const totalVehiculosAuditor = validVehiculos.length;
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          // Inspeccionado: contar vehículos con inspecciones realizadas (inspeccion_ddjj)
          const vehiculosInspeccionados = new Set();
          validInspeccionesDDJJ.forEach(inspeccion => {
            const orden = validOrdenes.find(o => o.id_orden === inspeccion.id_orden_trabajo);
            if (orden) {
              vehiculosInspeccionados.add(orden.id_vehiculo);
            }
          });
          const inspeccionados = vehiculosInspeccionados.size;
          
          // RTO vigente: contar vehículos con RTO vigente
          const rtoVigentes = validVehiculos.filter(v => {
            const rtoVehiculo = validRto.filter(r => r.id_vehiculo === v.id_vehiculo && r.activo);
            if (rtoVehiculo.length === 0) return false;
            const rtoActivo = rtoVehiculo.sort((a, b) => new Date(b.fecha_vencimiento) - new Date(a.fecha_vencimiento))[0];
            const fechaVencimiento = new Date(rtoActivo.fecha_vencimiento);
            fechaVencimiento.setHours(0, 0, 0, 0);
            return fechaVencimiento >= today;
          }).length;
          
          // Seguros al día: contar vehículos con seguro vigente
          const segurosAlDia = validVehiculos.filter(v => {
            if (!v.fecha_vencimiento_seguro) return false;
            const fechaSeguro = new Date(v.fecha_vencimiento_seguro);
            fechaSeguro.setHours(0, 0, 0, 0);
            return fechaSeguro >= today;
          }).length;
          
          // Licencias validadas: contar conductores con licencia vigente
          const licenciasValidadas = validConductores.filter(c => {
            if (!c.fecha_vencimiento_licencia) return false;
            const fechaLicencia = new Date(c.fecha_vencimiento_licencia);
            fechaLicencia.setHours(0, 0, 0, 0);
            return fechaLicencia >= today;
          }).length;
          
          setAuditorData({
            inspeccionado: {
              porcentaje: totalVehiculosAuditor > 0 ? Math.round((inspeccionados / totalVehiculosAuditor) * 100) : 0,
              total: totalVehiculosAuditor,
              cantidad: inspeccionados
            },
            rtoVigente: {
              porcentaje: totalVehiculosAuditor > 0 ? Math.round((rtoVigentes / totalVehiculosAuditor) * 100) : 0,
              total: totalVehiculosAuditor,
              cantidad: rtoVigentes
            },
            segurosAlDia: {
              porcentaje: totalVehiculosAuditor > 0 ? Math.round((segurosAlDia / totalVehiculosAuditor) * 100) : 0,
              total: totalVehiculosAuditor,
              cantidad: segurosAlDia
            },
            licenciasValidadas: {
              porcentaje: validConductores.length > 0 ? Math.round((licenciasValidadas / validConductores.length) * 100) : 0,
              total: validConductores.length,
              cantidad: licenciasValidadas
            }
          });
          
          // Calcular gastos reales de la base de datos
          // Gastos de insumos: suma de costo_total de detalle_insumo
          const gastosInsumos = validDetallesInsumo.reduce((sum, detalle) => {
            return sum + (parseFloat(detalle.costo_total) || 0);
          }, 0);

          // Gastos de personal: calcular basado en mecánicos asignados a órdenes
          // Estimación: $150,000 por orden con mecánico asignado
          const ordenesConMecanico = new Set(validOrdenXMecanico.map(oxm => oxm.id_orden));
          const gastosPersonal = ordenesConMecanico.size * 150000;
          
          // Gastos de reparaciones: costo total de insumos de órdenes de tipo "Correctivo"
          const ordenesCorrectivas = validOrdenes.filter(o => {
            const tipo = validTipos.find(t => t.id_tipo === o.id_tipo_mantenimiento);
            return tipo?.descripcion === 'Correctivo';
          });
          
          const gastosReparaciones = ordenesCorrectivas.reduce((sum, orden) => {
            const detallesOrden = validDetallesInsumo.filter(d => d.id_orden === orden.id_orden);
            const costoOrden = detallesOrden.reduce((s, d) => s + (parseFloat(d.costo_total) || 0), 0);
            return sum + costoOrden;
          }, 0);
          
          // Si no hay gastos de reparaciones calculados, usar el resto de insumos que no son de reparaciones
          // como gastos de reparaciones (mantenimientos preventivos también pueden tener costos)
          const gastosReparacionesFinal = gastosReparaciones > 0 
            ? gastosReparaciones 
            : Math.max(0, gastosInsumos - (gastosInsumos * 0.3)); // 30% de insumos son para reparaciones

          const totalGastos = gastosInsumos + gastosPersonal + gastosReparacionesFinal;
          
          const gastos = [
            { 
              name: 'Grupo 1', 
              label: 'Gastos de personal', 
              value: gastosPersonal, 
              porcentaje: totalGastos > 0 ? Math.round((gastosPersonal / totalGastos) * 100) : 0, 
              color: '#00B69B' 
            },
            { 
              name: 'Grupo 2', 
              label: 'Gastos de insumos', 
              value: gastosInsumos, 
              porcentaje: totalGastos > 0 ? Math.round((gastosInsumos / totalGastos) * 100) : 0, 
              color: '#FFC107' 
            },
            { 
              name: 'Grupo 3', 
              label: 'Gastos de reparaciones', 
              value: gastosReparacionesFinal, 
              porcentaje: totalGastos > 0 ? Math.round((gastosReparacionesFinal / totalGastos) * 100) : 0, 
              color: '#FF6F6F' 
            }
          ].filter(g => g.value > 0); // Solo mostrar categorías con gastos
          
          setGastosData(gastos);
          
          // Calcular discrepancias basadas en reporte_auditoria_ddjj agrupadas por mes
          const discrepanciasPorMes = {};
          
          validReportesAuditoria.forEach(reporte => {
            const fechaReporte = new Date(reporte.fecha_creacion || reporte.created_at);
            if (isNaN(fechaReporte.getTime())) return; // Saltar fechas inválidas
            
            const mesKey = `${fechaReporte.toLocaleString('es-AR', { month: 'short' })} ${String(fechaReporte.getFullYear()).slice(-2)}`;
            
            if (!discrepanciasPorMes[mesKey]) {
              discrepanciasPorMes[mesKey] = { correcto: 0, discrepancias: 0, fecha: fechaReporte };
            }
            
            const tipoReporte = reporte.tipo_reporte?.toLowerCase();
            if (tipoReporte === 'correcto') {
              discrepanciasPorMes[mesKey].correcto++;
            } else if (tipoReporte === 'discrepancias' || tipoReporte === 'discrepancia') {
              discrepanciasPorMes[mesKey].discrepancias++;
            }
          });

          // Convertir a array y ordenar por fecha (más reciente primero)
          const discrepancias = Object.entries(discrepanciasPorMes)
            .map(([mes, datos]) => ({
              mes,
              correcto: datos.correcto,
              discrepancias: datos.discrepancias,
              fecha: datos.fecha
            }))
            .sort((a, b) => {
              // Ordenar por fecha (más reciente primero)
              return b.fecha - a.fecha;
            })
            .slice(0, 6) // Solo últimos 6 meses
            .map(({ fecha, ...rest }) => rest); // Remover fecha del objeto final
          
          setDiscrepanciasData(discrepancias);
        }

        // Crear mapas para búsqueda rápida
        const vehiculosMap = {};
        validVehiculos.forEach(v => {
          vehiculosMap[v.id_vehiculo] = v;
        });

        const empresasMap = {};
        validEmpresas.forEach(e => {
          empresasMap[e.id_empresa] = e;
        });

        // Combinar datos - para Inspector usar inspecciones, para otros usar vehículos
        let datosCombinados = [];
        
        if (isInspectorUser && inspeccionesDataTemp.length > 0) {
          // Para Inspector: usar datos de inspecciones realizadas
          datosCombinados = await Promise.all(inspeccionesDataTemp.map(async (inspeccion) => {
            // Obtener la orden de trabajo relacionada
            const orden = validOrdenes.find(o => o.id_orden === inspeccion.id_orden_trabajo);
            if (!orden) return null;
            
            // Obtener el vehículo
            const vehiculo = validVehiculos.find(v => v.id_vehiculo === orden.id_vehiculo);
            if (!vehiculo) return null;
            
            // Obtener la empresa
            const empresa = empresasMap[vehiculo.id_empresa];
            
            // Obtener datos del conductor y RTO para fechas
            const conductor = validConductores.find(c => c.id_conductor === vehiculo.id_conductor_activo);
            const rtoVehiculo = validRto
              .filter(r => r.id_vehiculo === vehiculo.id_vehiculo && r.activo)
              .sort((a, b) => new Date(b.fecha_vencimiento) - new Date(a.fecha_vencimiento))[0];
            
            // Formatear fechas según los valores de la inspección
            const licenciaFecha = conductor?.fecha_vencimiento_licencia 
              ? formatDateDDMMYYYY(conductor.fecha_vencimiento_licencia) 
              : '-';
            const rtoFecha = rtoVehiculo?.fecha_vencimiento 
              ? formatDateDDMMYYYY(rtoVehiculo.fecha_vencimiento) 
              : '-';
            const seguroFecha = vehiculo?.fecha_vencimiento_seguro 
              ? formatDateDDMMYYYY(vehiculo.fecha_vencimiento_seguro) 
              : '-';
            
            // Determinar estado: "Operativo" si todas las verificaciones están correctas
            const todasCorrectas = 
              inspeccion.licencia_correcto &&
              inspeccion.rto_correcto &&
              inspeccion.seguro_correcto &&
              inspeccion.aire_acondicionado_correcto &&
              inspeccion.calefaccion_correcto &&
              inspeccion.camara_correcto;
            
            const estadoFinal = todasCorrectas ? 'Operativo' : 'No conforme';
            
            return {
              id_orden: orden.id_orden,
              id_inspeccion: inspeccion.id_inspeccion,
              empresa: empresa?.nombre_empresa || empresa?.nombre || 'N/A',
              interno: vehiculo?.interno || 'N/A',
              licencia: licenciaFecha,
              rto: rtoFecha,
              seguro: seguroFecha,
              camara: inspeccion.camara_correcto ? 'Sí' : 'No',
              aireAcondicionado: inspeccion.aire_acondicionado_correcto ? 'Sí' : 'No',
              calefaccion: inspeccion.calefaccion_correcto ? 'Sí' : 'No',
              estado: estadoFinal,
              conformidad: inspeccion.conformidad !== null 
                ? (inspeccion.conformidad === true ? 'CONFORME' : 'NO CONFORME')
                : '-',
              // Guardar datos originales para ordenamiento/filtrado
              _fechaOriginal: inspeccion.fecha_creacion || inspeccion.created_at || null
            };
          }));
          
          // Filtrar valores null
          datosCombinados = datosCombinados.filter(item => item !== null);
        } else {
          // Para otros usuarios: usar datos de vehículos
          datosCombinados = validVehiculos.map(vehiculo => {
            const empresa = empresasMap[vehiculo.id_empresa];
            
            // Buscar la última orden de trabajo para este vehículo
            const ordenesVehiculo = validOrdenes.filter(o => o.id_vehiculo === vehiculo.id_vehiculo);
            const ultimaOrden = ordenesVehiculo.length > 0 
              ? ordenesVehiculo.sort((a, b) => new Date(b.fecha_generacion) - new Date(a.fecha_generacion))[0]
              : null;

            // Determinar estado usando la función unificada
            const estadoFinal = getEstadoVehiculo(vehiculo, validOrdenes, validTipos);

            // Formatear fechas de vencimiento
            const fechaRTO = vehiculo.fecha_ultima_rto ? formatDate(vehiculo.fecha_ultima_rto) : '-';
            const fechaSeguro = vehiculo.fecha_vencimiento_seguro ? formatDate(vehiculo.fecha_vencimiento_seguro) : '-';
            const nombreSeguro = vehiculo.nombre_seguro || '';

            return {
              interno: vehiculo?.interno || 'N/A',
              matricula: vehiculo?.matricula || 'N/A',
              empresa: empresa?.nombre_empresa || 'N/A',
              marca: vehiculo?.marca || 'N/A',
              modelo: vehiculo?.modelo || 'N/A',
              anio: vehiculo?.anio || 'N/A',
              tipoVehiculo: getTipoVehiculo(vehiculo?.modelo),
              estado: estadoFinal,
              odometro: vehiculo.kilometros ? `${formatNumber(vehiculo.kilometros)} km` : (ultimaOrden ? `${formatNumber(ultimaOrden.odometro)} km` : 'N/A'),
              horometro: vehiculo.horometro ? `${formatNumber(vehiculo.horometro)} hs` : (ultimaOrden && ultimaOrden.horometro ? `${formatNumber(ultimaOrden.horometro)} hs` : 'N/A'),
              fechaRTO,
              fechaSeguro,
              nombreSeguro,
              poseeCamara: vehiculo?.posee_camara || false,
              poseeAC: vehiculo?.posee_ac || false,
              // Guardar datos originales para ordenamiento/filtrado
              _fechaOriginal: ultimaOrden?.fecha_generacion || null,
              _estadoOriginal: ultimaOrden?.estado || null,
              _fechaRTORaw: vehiculo.fecha_ultima_rto,
              _fechaSeguroRaw: vehiculo.fecha_vencimiento_seguro
            };
          });
        }

        // Ordenar según tipo de usuario
        if (isInspectorUser) {
          // Para Inspector: ordenar por fecha de inspección (más reciente primero)
          datosCombinados.sort((a, b) => {
            const fechaA = a._fechaOriginal ? new Date(a._fechaOriginal) : new Date(0);
            const fechaB = b._fechaOriginal ? new Date(b._fechaOriginal) : new Date(0);
            return fechaB - fechaA; // Más reciente primero
          });
        } else {
          // Para otros usuarios: ordenar por matrícula
          datosCombinados.sort((a, b) => {
            return (a.matricula || '').localeCompare(b.matricula || '');
          });
        }

        setDatosTabla(datosCombinados);
      } catch (error) {
        console.error('Error al cargar datos:', error);
        // Si el error es de conexión, mostrar mensaje más claro
        if (error.message.includes('ECONNREFUSED') || error.message.includes('Failed to fetch')) {
          console.warn('⚠️ El servidor JSON no está corriendo. Por favor ejecuta: npm run json-server');
        }
        setDatosTabla([]);
        setTotalOrdenes(0);
        setTotalVehiculos(0);
        setAlertasVencimiento(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isEmpresaUser, idEmpresaUsuario, isInspectorUser, idUsuarioInspector, isAuditorUser]);

  // Función para convertir fecha a formato de input (YYYY-MM-DD)
  const convertToDateInputFormat = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (error) {
      return '';
    }
  };

  // Función para ver inspección (Inspector)
  const handleVerInspeccion = async (item) => {
    try {
      // Obtener la inspección del inspector para esta orden
      const inspeccion = inspeccionesData.find(ins => ins.id_orden_trabajo === item.id_orden);
      
      if (!inspeccion) {
        setToast({
          type: 'error',
          title: 'Sin inspección',
          message: 'No se encontró una inspección para esta DDJJ.'
        });
        setTimeout(() => setToast(null), 5000);
        return;
      }

      // Cargar datos necesarios
      const [ordenesData, vehiculosData, empresasData, conductoresData, rtoData] = await Promise.all([
        getAllFromTable('orden_trabajo'),
        getAllFromTable('vehiculo'),
        getAllFromTable('empresa'),
        getAllFromTable('conductor'),
        getAllFromTable('rto_registro')
      ]);

      const validOrdenes = Array.isArray(ordenesData) ? ordenesData : [];
      const validVehiculos = Array.isArray(vehiculosData) ? vehiculosData : [];
      const validEmpresas = Array.isArray(empresasData) ? empresasData : [];
      const validConductores = Array.isArray(conductoresData) ? conductoresData : [];
      const validRto = Array.isArray(rtoData) ? rtoData : [];

      // Obtener datos relacionados
      const orden = validOrdenes.find(o => o.id_orden === item.id_orden);
      const vehiculo = validVehiculos.find(v => orden && v.id_vehiculo === orden.id_vehiculo);
      const empresa = vehiculo ? validEmpresas.find(e => e.id_empresa === vehiculo.id_empresa) : null;
      const conductor = vehiculo?.id_conductor_activo ? validConductores.find(c => c.id_conductor === vehiculo.id_conductor_activo) : null;
      const rto = validRto
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

      setDatosInspeccionRevisar({
        orden: orden || item,
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
        title: 'Error al cargar',
        message: 'No se pudieron cargar los datos de la inspección. Por favor, intente nuevamente.'
      });
      setTimeout(() => setToast(null), 5000);
    }
  };

  // Filtrar datos según búsqueda
  const filteredData = datosTabla.filter(item => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    
    if (isInspectorUser) {
      // Para Inspector: Empresa, Interno, Licencia, RTO, Seguro, Cámara, Aire acondicionado, Calefacción, Conformidad, Estado
      const licenciaStr = item.licencia?.toLowerCase() || '';
      const rtoStr = item.rto?.toLowerCase() || '';
      const seguroStr = item.seguro?.toLowerCase() || '';
      const camaraStr = item.camara?.toLowerCase() || '';
      const acStr = item.aireAcondicionado?.toLowerCase() || '';
      const calefaccionStr = item.calefaccion?.toLowerCase() || '';
      const conformidadStr = item.conformidad?.toLowerCase() || '';
      const estadoStr = item.estado?.toLowerCase() || '';
      
      return (
        item.empresa?.toLowerCase().includes(searchLower) ||
        item.interno?.toLowerCase().includes(searchLower) ||
        licenciaStr.includes(searchLower) ||
        rtoStr.includes(searchLower) ||
        seguroStr.includes(searchLower) ||
        camaraStr.includes(searchLower) ||
        acStr.includes(searchLower) ||
        calefaccionStr.includes(searchLower) ||
        conformidadStr.includes(searchLower) ||
        estadoStr.includes(searchLower)
      );
    } else if (isEmpresaUser) {
      // Para Empresa: Interno, Matrícula, Modelo, Año, Venc. RTO, Venc. Seguro, Cámara, AC, Estado
      const anioStr = item.anio ? item.anio.toString().toLowerCase() : '';
      const vencRTOStr = item.fechaRTO ? new Date(item.fechaRTO).toLocaleDateString('es-AR').toLowerCase() : '';
      const vencSeguroStr = item.fechaSeguro ? new Date(item.fechaSeguro).toLocaleDateString('es-AR').toLowerCase() : '';
      const camaraStr = item.poseeCamara ? 'sí si' : 'no';
      const acStr = item.poseeAC ? 'sí si' : 'no';
      const estadoStr = item.estado?.toLowerCase() || '';
      
      return (
        item.interno?.toLowerCase().includes(searchLower) ||
        item.matricula?.toLowerCase().includes(searchLower) ||
        item.modelo?.toLowerCase().includes(searchLower) ||
        anioStr.includes(searchLower) ||
        vencRTOStr.includes(searchLower) ||
        vencSeguroStr.includes(searchLower) ||
        camaraStr.includes(searchLower) ||
        acStr.includes(searchLower) ||
        estadoStr.includes(searchLower)
      );
    } else {
      // Para otros usuarios: Matrícula, Empresa, Marca, Modelo, Tipo, Odómetro, Horómetro, Estado
      const odometroStr = item.odometro ? item.odometro.toString().toLowerCase() : '';
      const horometroStr = item.horometro ? item.horometro.toString().toLowerCase() : '';
      const tipoVehiculoStr = item.tipoVehiculo?.toLowerCase() || '';
      const estadoStr = item.estado?.toLowerCase() || '';
      
      return (
        item.matricula?.toLowerCase().includes(searchLower) ||
        item.empresa?.toLowerCase().includes(searchLower) ||
        item.marca?.toLowerCase().includes(searchLower) ||
        item.modelo?.toLowerCase().includes(searchLower) ||
        tipoVehiculoStr.includes(searchLower) ||
        odometroStr.includes(searchLower) ||
        horometroStr.includes(searchLower) ||
        estadoStr.includes(searchLower)
      );
    }
  });

  // Calcular paginación
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  // Si está mostrando la vista de revisar inspección, mostrar solo esa vista
  if (showRevisarInspeccionModal && datosInspeccionRevisar) {
    const generarIdDDJJ = (orden) => {
      if (!orden) return 'N/A';
      const anio = new Date().getFullYear();
      const numero = orden.id_orden ? String(orden.id_orden).padStart(5, '0') : '00000';
      return `MNT-${anio}-${numero}`;
    };

    return (
      <div className="w-full" style={{ padding: '24px', fontFamily: 'Lato, sans-serif' }}>
        <div className="bg-white rounded-lg shadow-xl overflow-hidden" style={{ maxWidth: '100%', margin: '0 auto' }}>
          {/* Header con botón volver */}
          <div className="p-6 sm:p-8 border-b border-gray-200 bg-[#007C8A]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    setShowRevisarInspeccionModal(false);
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
                    style={{ color: '#FFFFFF', fontFamily: 'Lato, sans-serif' }}
                  >
                    Revisar inspección
                  </h2>
                  <p 
                    className="text-sm mt-1"
                    style={{ color: 'rgba(255,255,255,0.9)', fontFamily: 'Lato, sans-serif' }}
                  >
                    DDJJ inspeccionada lista para auditar
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contenido */}
          <div className="px-6 sm:px-8 py-8" style={{ backgroundColor: '#F9FAFB' }}>
            {/* Card de Inspección DDJJ */}
            <div 
              className="bg-white rounded-lg border border-gray-200 p-8 mb-6"
              style={{ 
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                marginBottom: '24px'
              }}
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
                    style={{ color: '#374151', fontFamily: 'Lato, sans-serif' }}
                  >
                    Inspección DDJJ
                  </h3>
                  <p 
                    className="text-sm"
                    style={{ color: '#6B7280', fontFamily: 'Lato, sans-serif' }}
                  >
                    Detalles a inspeccionar de DDJJ {generarIdDDJJ(datosInspeccionRevisar.orden)}
                  </p>
                  <p 
                    className="text-sm"
                    style={{ color: '#6B7280', fontFamily: 'Lato, sans-serif' }}
                  >
                    Asignación para {datosInspeccionRevisar.empresa?.nombre_empresa || datosInspeccionRevisar.empresa?.nombre || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Dos columnas: Declarado e Inspección */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8" style={{ marginTop: '24px' }}>
                {/* Columna izquierda: Declarado */}
                <div className="flex flex-col">
                  <h3 
                    className="text-lg font-bold mb-6"
                    style={{ 
                      fontFamily: 'Lato, sans-serif',
                      color: '#374151',
                      fontSize: '18px',
                      fontWeight: '700'
                    }}
                  >
                    Declarado
                  </h3>
                  <div className="space-y-6">
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
                      <div className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-50" style={{ fontFamily: 'Lato, sans-serif', fontSize: '14px', color: '#374151' }}>
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
                      <div className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-50" style={{ fontFamily: 'Lato, sans-serif', fontSize: '14px', color: '#374151' }}>
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
                      <div className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-50" style={{ fontFamily: 'Lato, sans-serif', fontSize: '14px', color: '#374151' }}>
                        {datosInspeccionRevisar.datosDeclarados.camara}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Columna derecha: Inspección */}
                <div className="flex flex-col">
                  <h3 
                    className="text-lg font-bold mb-6"
                    style={{ 
                      fontFamily: 'Lato, sans-serif',
                      color: '#374151',
                      fontSize: '18px',
                      fontWeight: '700'
                    }}
                  >
                    Inspección
                  </h3>
                  <div className="space-y-6">
                    {/* Licencia de Conducir */}
                    <div className="flex items-center gap-3">
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${datosInspeccionRevisar.datosInspeccion.licencia ? 'bg-green-100' : 'bg-red-100'}`}>
                        {datosInspeccionRevisar.datosInspeccion.licencia ? (
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <div style={{ fontFamily: 'Lato, sans-serif', fontSize: '14px', color: '#374151', fontWeight: '500' }}>
                          Licencia de Conducir
                        </div>
                        <div style={{ fontFamily: 'Lato, sans-serif', fontSize: '12px', color: '#6B7280' }}>
                          Estado: {datosInspeccionRevisar.datosInspeccion.licencia ? 'Correcto' : 'Incorrecto'}
                        </div>
                      </div>
                    </div>

                    {/* RTO */}
                    <div className="flex items-center gap-3">
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${datosInspeccionRevisar.datosInspeccion.rto ? 'bg-green-100' : 'bg-red-100'}`}>
                        {datosInspeccionRevisar.datosInspeccion.rto ? (
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <div style={{ fontFamily: 'Lato, sans-serif', fontSize: '14px', color: '#374151', fontWeight: '500' }}>
                          RTO
                        </div>
                        <div style={{ fontFamily: 'Lato, sans-serif', fontSize: '12px', color: '#6B7280' }}>
                          Estado: {datosInspeccionRevisar.datosInspeccion.rto ? 'Correcto' : 'Incorrecto'}
                        </div>
                      </div>
                    </div>

                    {/* Seguro */}
                    <div className="flex items-center gap-3">
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${datosInspeccionRevisar.datosInspeccion.seguro ? 'bg-green-100' : 'bg-red-100'}`}>
                        {datosInspeccionRevisar.datosInspeccion.seguro ? (
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <div style={{ fontFamily: 'Lato, sans-serif', fontSize: '14px', color: '#374151', fontWeight: '500' }}>
                          Seguro
                        </div>
                        <div style={{ fontFamily: 'Lato, sans-serif', fontSize: '12px', color: '#6B7280' }}>
                          Estado: {datosInspeccionRevisar.datosInspeccion.seguro ? 'Correcto' : 'Incorrecto'}
                        </div>
                      </div>
                    </div>

                    {/* Aire acondicionado */}
                    <div className="flex items-center gap-3">
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${datosInspeccionRevisar.datosInspeccion.aireAcondicionado ? 'bg-green-100' : 'bg-red-100'}`}>
                        {datosInspeccionRevisar.datosInspeccion.aireAcondicionado ? (
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <div style={{ fontFamily: 'Lato, sans-serif', fontSize: '14px', color: '#374151', fontWeight: '500' }}>
                          Aire acondicionado
                        </div>
                        <div style={{ fontFamily: 'Lato, sans-serif', fontSize: '12px', color: '#6B7280' }}>
                          Estado: {datosInspeccionRevisar.datosInspeccion.aireAcondicionado ? 'Correcto' : 'Incorrecto'}
                        </div>
                      </div>
                    </div>

                    {/* Calefacción */}
                    <div className="flex items-center gap-3">
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${datosInspeccionRevisar.datosInspeccion.calefaccion ? 'bg-green-100' : 'bg-red-100'}`}>
                        {datosInspeccionRevisar.datosInspeccion.calefaccion ? (
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <div style={{ fontFamily: 'Lato, sans-serif', fontSize: '14px', color: '#374151', fontWeight: '500' }}>
                          Calefacción
                        </div>
                        <div style={{ fontFamily: 'Lato, sans-serif', fontSize: '12px', color: '#6B7280' }}>
                          Estado: {datosInspeccionRevisar.datosInspeccion.calefaccion ? 'Correcto' : 'Incorrecto'}
                        </div>
                      </div>
                    </div>

                    {/* Cámara */}
                    <div className="flex items-center gap-3">
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${datosInspeccionRevisar.datosInspeccion.camara ? 'bg-green-100' : 'bg-red-100'}`}>
                        {datosInspeccionRevisar.datosInspeccion.camara ? (
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <div style={{ fontFamily: 'Lato, sans-serif', fontSize: '14px', color: '#374151', fontWeight: '500' }}>
                          Cámara
                        </div>
                        <div style={{ fontFamily: 'Lato, sans-serif', fontSize: '12px', color: '#6B7280' }}>
                          Estado: {datosInspeccionRevisar.datosInspeccion.camara ? 'Correcto' : 'Incorrecto'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Observación */}
              <div className="mt-8 pt-6" style={{ borderTop: '1px solid #E5E7EB' }}>
                <label 
                  className="block text-sm font-medium mb-3"
                  style={{ 
                    fontFamily: 'Lato, sans-serif',
                    color: '#374151',
                    fontSize: '16px',
                    fontWeight: '600'
                  }}
                >
                  Observación
                </label>
                <div className="px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 min-h-[100px]" style={{ fontFamily: 'Lato, sans-serif', fontSize: '14px', color: '#374151', lineHeight: '1.5' }}>
                  {datosInspeccionRevisar.datosInspeccion.observaciones || '-'}
                </div>
              </div>

              {/* Conformidad */}
              <div className="mt-6">
                <label 
                  className="block text-sm font-medium mb-3"
                  style={{ 
                    fontFamily: 'Lato, sans-serif',
                    color: '#374151',
                    fontSize: '16px',
                    fontWeight: '600'
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
                  <p className="text-xs mt-2" style={{ color: '#9CA3AF', fontFamily: 'Lato, sans-serif' }}>
                    No especificado
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="px-3 sm:px-4 md:px-6 w-full">
        {/* Header de bienvenida - Apilado verticalmente en móvil */}
        <div 
          className="bg-[#007C8A] w-full px-3 sm:px-4 md:px-6 mb-4 sm:mb-6 rounded-lg mt-2 sm:mt-4 md:mt-6 flex flex-col justify-center"
          style={{
            minHeight: '70px',
            paddingTop: '12px',
            paddingBottom: '12px'
          }}
        >
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white mb-1" style={{ fontFamily: 'Lato, sans-serif', lineHeight: '1.2' }}>
            ¡Bienvenido de nuevo {nombreUsuario.split(' ')[0]}!
            {isEmpresaUser && empresaUsuario && (
              <span className="block sm:inline sm:ml-1">
                {isMobile ? <br /> : ' '}
                ({empresaUsuario.nombre_empresa})
              </span>
            )}
          </h1>
          <p className="text-white text-xs sm:text-sm font-normal" style={{ fontFamily: 'Lato, sans-serif', lineHeight: '1.2' }}>
            {isEmpresaUser 
              ? 'Aquí tienes un resumen rápido de la actividad de tu empresa.'
              : 'Aquí tienes un resumen rápido de la actividad de tu sistema Emop.'
            }
          </p>
        </div>

        {/* Dashboard del Auditor */}
        {isAuditorUser ? (
          <>
            {/* Panel de control */}
            <div className="mb-6">
              <h2 
                className="text-xl font-bold mb-2"
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  color: '#374151'
                }}
              >
                Panel de control
              </h2>
              <p 
                className="text-sm mb-4"
                style={{ 
                  fontFamily: 'Lato, sans-serif',
                  color: '#6B7280'
                }}
              >
                Resumen del estado de flota general
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Inspeccionado */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 
                    className="text-sm font-medium mb-4 text-center"
                    style={{ 
                      fontFamily: 'Lato, sans-serif',
                      color: '#374151'
                    }}
                  >
                    Inspeccionado
                  </h3>
                  <div className="flex justify-center mb-2">
                    <div className="relative" style={{ width: '120px', height: '120px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { value: auditorData.inspeccionado.porcentaje },
                              { value: 100 - auditorData.inspeccionado.porcentaje }
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={60}
                            startAngle={90}
                            endAngle={-270}
                            dataKey="value"
                          >
                            <Cell fill="#00B69B" />
                            <Cell fill="#E5E7EB" />
                          </Pie>
                          <Label
                            value={`${auditorData.inspeccionado.porcentaje}%`}
                            position="center"
                            style={{
                              fontFamily: 'Lato, sans-serif',
                              fontSize: 24,
                              fontWeight: 700,
                              fill: '#1F2937',
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <p 
                    className="text-sm text-center"
                    style={{ 
                      fontFamily: 'Lato, sans-serif',
                      color: '#6B7280'
                    }}
                  >
                    {auditorData.inspeccionado.cantidad} de {auditorData.inspeccionado.total} unidades
                  </p>
                </div>

                {/* RTO vigente */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 
                    className="text-sm font-medium mb-4 text-center"
                    style={{ 
                      fontFamily: 'Lato, sans-serif',
                      color: '#374151'
                    }}
                  >
                    RTO vigente
                  </h3>
                  <div className="flex justify-center mb-2">
                    <div className="relative" style={{ width: '120px', height: '120px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { value: auditorData.rtoVigente.porcentaje },
                              { value: 100 - auditorData.rtoVigente.porcentaje }
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={60}
                            startAngle={90}
                            endAngle={-270}
                            dataKey="value"
                          >
                            <Cell fill="#00B69B" />
                            <Cell fill="#E5E7EB" />
                          </Pie>
                          <Label
                            value={`${auditorData.rtoVigente.porcentaje}%`}
                            position="center"
                            style={{
                              fontFamily: 'Lato, sans-serif',
                              fontSize: 24,
                              fontWeight: 700,
                              fill: '#1F2937',
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <p 
                    className="text-sm text-center"
                    style={{ 
                      fontFamily: 'Lato, sans-serif',
                      color: '#6B7280'
                    }}
                  >
                    {auditorData.rtoVigente.cantidad} de {auditorData.rtoVigente.total} unidades
                  </p>
                </div>

                {/* Seguros al día */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 
                    className="text-sm font-medium mb-4 text-center"
                    style={{ 
                      fontFamily: 'Lato, sans-serif',
                      color: '#374151'
                    }}
                  >
                    Seguros al día
                  </h3>
                  <div className="flex justify-center mb-2">
                    <div className="relative" style={{ width: '120px', height: '120px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { value: auditorData.segurosAlDia.porcentaje },
                              { value: 100 - auditorData.segurosAlDia.porcentaje }
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={60}
                            startAngle={90}
                            endAngle={-270}
                            dataKey="value"
                          >
                            <Cell fill="#FFC107" />
                            <Cell fill="#E5E7EB" />
                          </Pie>
                          <Label
                            value={`${auditorData.segurosAlDia.porcentaje}%`}
                            position="center"
                            style={{
                              fontFamily: 'Lato, sans-serif',
                              fontSize: 24,
                              fontWeight: 700,
                              fill: '#1F2937',
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <p 
                    className="text-sm text-center"
                    style={{ 
                      fontFamily: 'Lato, sans-serif',
                      color: '#6B7280'
                    }}
                  >
                    {auditorData.segurosAlDia.cantidad} de {auditorData.segurosAlDia.total} unidades
                  </p>
                </div>

                {/* Licencias validadas */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 
                    className="text-sm font-medium mb-4 text-center"
                    style={{ 
                      fontFamily: 'Lato, sans-serif',
                      color: '#374151'
                    }}
                  >
                    Licencias validadas
                  </h3>
                  <div className="flex justify-center mb-2">
                    <div className="relative" style={{ width: '120px', height: '120px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { value: auditorData.licenciasValidadas.porcentaje },
                              { value: 100 - auditorData.licenciasValidadas.porcentaje }
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={60}
                            startAngle={90}
                            endAngle={-270}
                            dataKey="value"
                          >
                            <Cell fill="#FF6F6F" />
                            <Cell fill="#E5E7EB" />
                          </Pie>
                          <Label
                            value={`${auditorData.licenciasValidadas.porcentaje}%`}
                            position="center"
                            style={{
                              fontFamily: 'Lato, sans-serif',
                              fontSize: 24,
                              fontWeight: 700,
                              fill: '#1F2937',
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <p 
                    className="text-sm text-center"
                    style={{ 
                      fontFamily: 'Lato, sans-serif',
                      color: '#6B7280'
                    }}
                  >
                    {auditorData.licenciasValidadas.cantidad} de {auditorData.licenciasValidadas.total} unidades
                  </p>
                </div>
              </div>
            </div>

            {/* Resumen de gastos acumulados e Índice de discrepancias */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Resumen de gastos acumulados */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 
                  className="text-xl font-bold mb-2"
                  style={{ 
                    fontFamily: 'Lato, sans-serif',
                    color: '#374151'
                  }}
                >
                  Resumen de gastos acumulados
                </h2>
                <p 
                  className="text-sm mb-4"
                  style={{ 
                    fontFamily: 'Lato, sans-serif',
                    color: '#6B7280'
                  }}
                >
                  Distribución del presupuesto por grupo de gasto
                </p>
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="relative" style={{ width: '200px', height: '200px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={gastosData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {gastosData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `$${formatNumber(value)}`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-3">
                    {gastosData.map((gasto, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: gasto.color }}
                        ></div>
                        <div className="flex-1">
                          <p 
                            className="text-sm font-medium"
                            style={{ 
                              fontFamily: 'Lato, sans-serif',
                              color: '#374151'
                            }}
                          >
                            {gasto.label}
                          </p>
                          <p 
                            className="text-sm"
                            style={{ 
                              fontFamily: 'Lato, sans-serif',
                              color: '#6B7280'
                            }}
                          >
                            ${formatNumber(gasto.value)},00 - {gasto.porcentaje}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p 
                    className="text-sm"
                    style={{ 
                      fontFamily: 'Lato, sans-serif',
                      color: '#6B7280'
                    }}
                  >
                    Categorías: {gastosData.length} grupos
                  </p>
                  <p 
                    className="text-sm"
                    style={{ 
                      fontFamily: 'Lato, sans-serif',
                      color: '#6B7280'
                    }}
                  >
                    Mayor gasto: {gastosData.length > 0 ? gastosData.sort((a, b) => b.value - a.value)[0].label : 'N/A'}
                  </p>
                  <p 
                    className="text-sm"
                    style={{ 
                      fontFamily: 'Lato, sans-serif',
                      color: '#6B7280'
                    }}
                  >
                    Menor gasto: {gastosData.length > 0 ? gastosData.sort((a, b) => a.value - b.value)[0].label : 'N/A'}
                  </p>
                </div>
                <button
                  onClick={() => navigate('/tablero-mantenimiento')}
                  className="mt-4 w-full px-4 py-2 rounded-lg text-white font-medium transition-colors"
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
                  Ver tablero de mantenimiento
                </button>
              </div>

              {/* Índice de discrepancias */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 
                  className="text-xl font-bold mb-2"
                  style={{ 
                    fontFamily: 'Lato, sans-serif',
                    color: '#374151'
                  }}
                >
                  Índice de discrepancias
                </h2>
                <p 
                  className="text-sm mb-4"
                  style={{ 
                    fontFamily: 'Lato, sans-serif',
                    color: '#6B7280'
                  }}
                >
                  OTs con mayor costo acumulado pendiente
                </p>
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
                    <div style={{ height: '200px', width: '100%' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={discrepanciasData}>
                          <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Bar dataKey="correcto" stackId="a" fill="#00B69B" />
                          <Bar dataKey="discrepancias" stackId="a" fill="#FF6F6F" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 flex gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#00B69B' }}></div>
                        <p 
                          className="text-xs"
                          style={{ 
                            fontFamily: 'Lato, sans-serif',
                            color: '#374151'
                          }}
                        >
                          Correcto (Empresa OK, Inspector OK)
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#FF6F6F' }}></div>
                        <p 
                          className="text-xs"
                          style={{ 
                            fontFamily: 'Lato, sans-serif',
                            color: '#374151'
                          }}
                        >
                          Discrepancias (Empresa OK, Inspector NO)
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#00B69B' }}></div>
                        <p 
                          className="text-sm font-medium"
                          style={{ 
                            fontFamily: 'Lato, sans-serif',
                            color: '#374151'
                          }}
                        >
                          {discrepanciasData.reduce((sum, d) => sum + d.correcto, 0)} reportes correctos
                        </p>
                      </div>
                      <p 
                        className="text-xs ml-5"
                        style={{ 
                          fontFamily: 'Lato, sans-serif',
                          color: '#6B7280'
                        }}
                      >
                        Gastos de personal
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#FF6F6F' }}></div>
                        <p 
                          className="text-sm font-medium"
                          style={{ 
                            fontFamily: 'Lato, sans-serif',
                            color: '#374151'
                          }}
                        >
                          {discrepanciasData.reduce((sum, d) => sum + d.discrepancias, 0)} discrepancias en reportes
                        </p>
                      </div>
                      <p 
                        className="text-xs ml-5"
                        style={{ 
                          fontFamily: 'Lato, sans-serif',
                          color: '#6B7280'
                        }}
                      >
                        Gastos de personal
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#FF6F6F' }}></div>
                        <p 
                          className="text-sm font-medium"
                          style={{ 
                            fontFamily: 'Lato, sans-serif',
                            color: '#374151'
                          }}
                        >
                          {discrepanciasData.length > 0 
                            ? ((discrepanciasData.reduce((sum, d) => sum + d.discrepancias, 0) / 
                                (discrepanciasData.reduce((sum, d) => sum + d.correcto, 0) + 
                                 discrepanciasData.reduce((sum, d) => sum + d.discrepancias, 0))) * 100).toFixed(1)
                            : '0'
                          }%
                        </p>
                      </div>
                      <p 
                        className="text-xs ml-5"
                        style={{ 
                          fontFamily: 'Lato, sans-serif',
                          color: '#6B7280'
                        }}
                      >
                        Gastos de personal
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Tarjetas de métricas - Ocultar para Inspector */}
            {!isInspectorUser && (
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${isEmpresaUser ? 'md:grid-cols-2 lg:grid-cols-3' : 'md:grid-cols-2 lg:grid-cols-4'} gap-3 sm:gap-4 mb-4 sm:mb-6 w-full`}>
          {isEmpresaUser ? (
            <>
              {/* Tarjeta 1: Total de DDJJ (solo para Empresa) */}
              <div 
                className="bg-white rounded-lg shadow-md relative cursor-pointer hover:shadow-lg transition-shadow w-full"
                onClick={() => navigate('/reportes-ddjj')}
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
                    {isLoading ? '...' : formatNumber(ddjjRegistradas)}
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
              </div>

              {/* Tarjeta 2: Mantenimientos (solo para Empresa) */}
              <div 
                className="bg-white rounded-lg shadow-md relative cursor-pointer hover:shadow-lg transition-shadow w-full"
                onClick={() => navigate('/tablero-mantenimiento')}
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
                  Mantenimientos
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
                    {isLoading ? '...' : formatNumber(totalMantenimientos)}
                  </p>
                  <div 
                    className="rounded-full flex items-center justify-center flex-shrink-0" 
                    style={{ 
                      backgroundColor: '#FFF0E0',
                      width: isMobile ? '32px' : '40px',
                      height: isMobile ? '32px' : '40px'
                    }}
                  >
                    <svg className={isMobile ? "w-5 h-5" : "w-6 h-6"} fill="none" stroke="#FFA500" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Tarjeta 3: Personal (solo para Empresa) */}
              <div 
                className="bg-white rounded-lg shadow-md relative cursor-pointer hover:shadow-lg transition-shadow w-full"
                onClick={() => navigate('/personal')}
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
                  Personal
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
                    {isLoading ? '...' : formatNumber(personal)}
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
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Tarjetas para usuarios Admin (no Empresa) */}
              {/* Tarjeta 1: Gestión de OT */}
            <div 
              className="bg-white rounded-lg shadow-md relative cursor-pointer hover:shadow-lg transition-shadow w-full"
              onClick={() => navigate('/gestion-ot')}
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
              Gestión de OT
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
              {isLoading ? '...' : totalOrdenes}
            </p>
            <div 
                    className="rounded-full flex items-center justify-center flex-shrink-0" 
              style={{ 
                backgroundColor: '#E6FFE6',
                      width: isMobile ? '32px' : '40px',
                      height: isMobile ? '32px' : '40px'
              }}
            >
                    <svg className={isMobile ? "w-5 h-5" : "w-6 h-6"} fill="none" stroke="#90EE90" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
                  </div>
            </div>
          </div>

          {/* Tarjeta 2: Alerta vencimientos - Solo para Administradores */}
          {isAdminUser && (
          <div 
                className="bg-white rounded-lg shadow-md relative cursor-pointer hover:shadow-lg transition-shadow w-full"
            onClick={() => navigate('/alertas-vencimiento')}
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
              Alerta vencimientos
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
              {isLoading ? '...' : alertasVencimiento}
            </p>
            <div 
                    className="rounded-full flex items-center justify-center flex-shrink-0" 
              style={{ 
                backgroundColor: '#FFE6E6',
                      width: isMobile ? '32px' : '40px',
                      height: isMobile ? '32px' : '40px'
              }}
            >
                    <svg className={isMobile ? "w-5 h-5" : "w-6 h-6"} fill="none" stroke="#FF6B6B" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
                  </div>
            </div>
          </div>
          )}

          {/* Tarjeta 3: Mantenimientos */}
          <div 
                className="bg-white rounded-lg shadow-md relative cursor-pointer hover:shadow-lg transition-shadow w-full"
            onClick={() => navigate('/mantenimientos')}
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
              Mantenimientos
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
                    {isLoading ? '...' : formatNumber(totalOrdenes)}
            </p>
            <div 
                    className="rounded-full flex items-center justify-center flex-shrink-0" 
              style={{ 
                backgroundColor: '#FFF0E0',
                      width: isMobile ? '32px' : '40px',
                      height: isMobile ? '32px' : '40px'
              }}
            >
                    <svg className={isMobile ? "w-5 h-5" : "w-6 h-6"} fill="none" stroke="#FFA500" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
                  </div>
            </div>
          </div>

          {/* Tarjeta 4: Registros */}
          <div 
                className="bg-white rounded-lg shadow-md relative cursor-pointer hover:shadow-lg transition-shadow w-full"
            onClick={() => navigate('/registros')}
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
              Registros
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
              {isLoading ? '...' : formatNumber(totalVehiculos)}
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
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h8m-8 0a2 2 0 100-4h8a2 2 0 100 4m-8 0v10a2 2 0 002 2h4a2 2 0 002-2V7m-6 4h.01M16 11h.01" />
                <circle cx="7" cy="18" r="2" />
                <circle cx="17" cy="18" r="2" />
              </svg>
            </div>
          </div>
          </div>
            </>
          )}
        </div>
          )}
          </>
        )}

        {/* Sección de búsqueda - Apilado verticalmente en móvil */}
        <div 
          className="bg-white rounded-lg shadow-md mb-4 sm:mb-6 w-full"
          style={{
            border: '1px solid #B3E5FC',
            padding: isMobile ? '12px' : '24px'
          }}
        >
          {/* Título, subtítulo y buscador - Apilado en móvil, lado a lado en desktop */}
          <div className="mb-4 sm:mb-6 flex flex-col md:flex-row md:items-start md:justify-between gap-3 md:gap-4">
            <div className="flex-1">
            <h2 
                className="text-lg sm:text-xl font-bold mb-1 sm:mb-2"
              style={{ 
                fontFamily: 'Lato, sans-serif',
                color: '#000000'
              }}
            >
                {isInspectorUser
                  ? 'Resumen de últimas inspecciones realizadas'
                  : isEmpresaUser && empresaUsuario 
                  ? `Resumen de unidades ${empresaUsuario.nombre_empresa}`
                  : 'Resumen de flota'
                }
            </h2>
            <p 
                className="text-xs sm:text-sm"
              style={{ 
                fontFamily: 'Lato, sans-serif',
                color: '#666666'
              }}
            >
                {isInspectorUser
                  ? 'Detalle de inspecciones'
                  : isEmpresaUser 
                  ? `Detalle de la flota total: ${formatNumber(totalVehiculos)} unidades`
                  : 'Detalle de los vehículos de la flota general'
                }
            </p>
          </div>
            <div className="flex-shrink-0 w-full md:w-auto md:max-w-lg">
              <div className="relative">
                <input
                  type="text"
                  id="search"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Buscar..."
                  className="w-full px-3 sm:px-4 py-2 pl-10 sm:pl-12 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#007C8A] focus:border-transparent"
                  style={{ 
                    fontFamily: 'Lato, sans-serif',
                    fontSize: isMobile ? '13px' : '14px'
                  }}
                />
                <svg 
                  className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 pointer-events-none"
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

        {/* Tabla de información */}
        <div 
          className="bg-white rounded-lg shadow-md"
          style={{
            border: '1px solid #B3E5FC',
            padding: isMobile ? '12px' : '24px'
          }}
        >
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
                <table className="w-full min-w-[700px] sm:min-w-[800px]" style={{ fontFamily: 'Lato, sans-serif' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                  {isInspectorUser ? (
                    <>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap" style={{ fontSize: '12px', color: '#374151' }}>Empresa</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap" style={{ fontSize: '12px', color: '#374151' }}>Interno</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap" style={{ fontSize: '12px', color: '#374151' }}>Licencia</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap" style={{ fontSize: '12px', color: '#374151' }}>RTO</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap" style={{ fontSize: '12px', color: '#374151' }}>Seguro</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap" style={{ fontSize: '12px', color: '#374151' }}>Cámara</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap" style={{ fontSize: '12px', color: '#374151' }}>Aire acondicionado</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap" style={{ fontSize: '12px', color: '#374151' }}>Calefacción</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap" style={{ fontSize: '12px', color: '#374151' }}>Conformidad</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap" style={{ fontSize: '12px', color: '#374151' }}>Acción</th>
                    </>
                  ) : isEmpresaUser ? (
                    <>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap" style={{ fontSize: '12px', color: '#374151' }}>Interno</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap" style={{ fontSize: '12px', color: '#374151' }}>Matrícula</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap hidden md:table-cell" style={{ fontSize: '12px', color: '#374151' }}>Modelo</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap hidden lg:table-cell" style={{ fontSize: '12px', color: '#374151' }}>Año</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap" style={{ fontSize: '12px', color: '#374151' }}>Venc. RTO</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap hidden sm:table-cell" style={{ fontSize: '12px', color: '#374151' }}>Venc. Seguro</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap hidden lg:table-cell" style={{ fontSize: '12px', color: '#374151' }}>Cámara</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap hidden lg:table-cell" style={{ fontSize: '12px', color: '#374151' }}>AC</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap" style={{ fontSize: '12px', color: '#374151' }}>Estado</th>
                    </>
                  ) : (
                    <>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap" style={{ fontSize: '12px', color: '#374151' }}>Matrícula</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap" style={{ fontSize: '12px', color: '#374151' }}>Empresa</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap" style={{ fontSize: '12px', color: '#374151' }}>Marca</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap" style={{ fontSize: '12px', color: '#374151' }}>Modelo</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap" style={{ fontSize: '12px', color: '#374151' }}>Tipo</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap" style={{ fontSize: '12px', color: '#374151' }}>Odómetro</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap" style={{ fontSize: '12px', color: '#374151' }}>Horómetro</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold whitespace-nowrap" style={{ fontSize: '12px', color: '#374151' }}>Estado</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {currentData.length === 0 ? (
                  <tr>
                    <td colSpan={isInspectorUser ? 10 : isEmpresaUser ? 9 : 8} className="py-8 text-center text-gray-500">
                      No hay datos disponibles
                    </td>
                  </tr>
                ) : (
                  currentData.map((item, index) => {
                    // Verificar si RTO está próximo a vencer (30 días)
                    const hoy = new Date();
                    hoy.setHours(0, 0, 0, 0);
                    const fechaRTO = item._fechaRTORaw ? new Date(item._fechaRTORaw) : null;
                    const rtoProximoVencer = fechaRTO && (fechaRTO - hoy) / (1000 * 60 * 60 * 24) <= 30 && (fechaRTO - hoy) / (1000 * 60 * 60 * 24) >= 0;

                    if (isInspectorUser) {
                      return (
                        <tr 
                          key={item.id_orden || index}
                          style={{ 
                            borderBottom: '1px solid #E5E7EB',
                            backgroundColor: index % 2 === 0 ? '#FFFFFF' : '#F9FAFB'
                          }}
                        >
                          <td className="py-2 sm:py-3 px-2 sm:px-4" style={{ fontSize: '12px', color: '#374151' }}>{item.empresa}</td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4" style={{ fontSize: '12px', color: '#374151' }}>{item.interno}</td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4" style={{ fontSize: '12px', color: '#374151' }}>{item.licencia}</td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4" style={{ fontSize: '12px', color: '#374151' }}>{item.rto}</td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4" style={{ fontSize: '12px', color: '#374151' }}>{item.seguro}</td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4" style={{ fontSize: '12px', color: '#374151' }}>{item.camara}</td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4" style={{ fontSize: '12px', color: '#374151' }}>{item.aireAcondicionado}</td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4" style={{ fontSize: '12px', color: '#374151' }}>{item.calefaccion}</td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4">
                            {item.conformidad && item.conformidad !== '-' ? (
                              <span 
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                                style={{
                                  backgroundColor: item.conformidad === 'CONFORME' ? '#D1FAE5' : '#FEE2E2',
                                  color: item.conformidad === 'CONFORME' ? '#065F46' : '#991B1B',
                                  fontFamily: 'Lato, sans-serif'
                                }}
                              >
                                {item.conformidad}
                              </span>
                            ) : (
                              <span style={{ fontSize: '12px', color: '#9CA3AF' }}>-</span>
                            )}
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4">
                            <button
                              onClick={() => handleVerInspeccion(item)}
                              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                              style={{ color: '#007C8A' }}
                              title="Ver inspección"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      );
                    } else if (isEmpresaUser) {
                      return (
                    <tr 
                      key={index}
                      style={{ 
                        borderBottom: '1px solid #E5E7EB',
                        backgroundColor: index % 2 === 0 ? '#FFFFFF' : '#F9FAFB'
                      }}
                    >
                          <td className="py-2 sm:py-3 px-2 sm:px-4" style={{ fontSize: '12px', color: '#374151' }}>{item.interno}</td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4" style={{ fontSize: '12px', color: '#374151' }}>{item.matricula}</td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4 hidden md:table-cell" style={{ fontSize: '12px', color: '#374151' }}>{item.modelo}</td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4 hidden lg:table-cell" style={{ fontSize: '12px', color: '#374151' }}>{item.anio}</td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4" style={{ fontSize: '12px', color: '#374151' }}>
                            <div className="flex items-center gap-1">
                              {item.fechaRTO}
                              {rtoProximoVencer && (
                                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                    </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4 hidden sm:table-cell" style={{ fontSize: '12px', color: '#374151' }}>
                            <div>
                              <div>{item.fechaSeguro}</div>
                              {item.nombreSeguro && (
                                <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>{item.nombreSeguro}</div>
                              )}
                            </div>
                    </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4 hidden lg:table-cell" style={{ fontSize: '12px', color: '#374151' }}>
                            {item.poseeCamara ? 'Sí' : 'No'}
                    </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4 hidden lg:table-cell" style={{ fontSize: '12px', color: '#374151' }}>
                            {item.poseeAC ? 'Sí' : 'No'}
                    </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4">
                            {(() => {
                              let backgroundColor = '#F3F4F6';
                              let color = '#6B7280';
                              let border = '#6B7280';
                              
                              if (item.estado === 'Operativo') {
                                backgroundColor = '#E3F2FD';
                                color = '#2196F3';
                                border = '#2196F3';
                              } else if (item.estado === 'Preventivo') {
                                backgroundColor = '#E0F7F7';
                                color = '#4CAF50';
                                border = '#4CAF50';
                              } else if (item.estado === 'Correctivo') {
                                backgroundColor = '#FFEDED';
                                color = '#E07B7B';
                                border = '#E07B7B';
                              } else if (item.estado === 'En mantenimiento') {
                                backgroundColor = '#FFFBE6';
                                color = '#FFC107';
                                border = '#FFC107';
                              } else {
                                backgroundColor = '#F3F4F6';
                                color = '#6B7280';
                                border = '#6B7280';
                              }
                              
                              return (
                                <span
                                  className="inline-flex items-center justify-center font-medium whitespace-nowrap"
                                  style={{
                                    backgroundColor,
                                    color,
                                    border: `1px solid ${border}`,
                                    borderRadius: '4px',
                                    padding: '4px 8px',
                                    fontSize: '11px',
                                    minWidth: '70px',
                                    height: '22px',
                                    opacity: 1,
                                    display: 'inline-block',
                                    fontFamily: 'Lato, sans-serif',
                                    fontWeight: '500'
                                  }}
                                >
                                  {item.estado === 'En mantenimiento' ? 'Mantenimiento' : item.estado}
                                </span>
                              );
                            })()}
                    </td>
                        </tr>
                      );
                    } else {
                      return (
                        <tr 
                          key={index}
                          style={{ 
                            borderBottom: '1px solid #E5E7EB',
                            backgroundColor: index % 2 === 0 ? '#FFFFFF' : '#F9FAFB'
                          }}
                        >
                          <td className="py-2 sm:py-3 px-2 sm:px-4" style={{ fontSize: '12px', color: '#374151' }}>{item.matricula}</td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4" style={{ fontSize: '12px', color: '#374151' }}>{item.empresa}</td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4" style={{ fontSize: '12px', color: '#374151' }}>{item.marca}</td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4" style={{ fontSize: '12px', color: '#374151' }}>{item.modelo || 'N/A'}</td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4" style={{ fontSize: '12px', color: '#374151' }}>{item.tipoVehiculo}</td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4" style={{ fontSize: '12px', color: '#374151' }}>{item.odometro}</td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4" style={{ fontSize: '12px', color: '#374151' }}>{item.horometro}</td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4">
                            {(() => {
                              let backgroundColor = '#F3F4F6';
                              let color = '#6B7280';
                              let border = '#6B7280';
                              
                              if (item.estado === 'Operativo') {
                                backgroundColor = '#E3F2FD';
                                color = '#2196F3';
                                border = '#2196F3';
                              } else if (item.estado === 'Preventivo') {
                                backgroundColor = '#E0F7F7';
                                color = '#4CAF50';
                                border = '#4CAF50';
                              } else if (item.estado === 'Correctivo') {
                                backgroundColor = '#FFEDED';
                                color = '#E07B7B';
                                border = '#E07B7B';
                              } else if (item.estado === 'En mantenimiento') {
                                backgroundColor = '#FFFBE6';
                                color = '#FFC107';
                                border = '#FFC107';
                              } else {
                                backgroundColor = '#F3F4F6';
                                color = '#6B7280';
                                border = '#6B7280';
                              }
                              
                              return (
                                <span
                                  className="inline-flex items-center justify-center font-medium whitespace-nowrap"
                                  style={{
                                    backgroundColor,
                                    color,
                                    border: `1px solid ${border}`,
                                    borderRadius: '4px',
                                    padding: '4px 8px',
                                    fontSize: '11px',
                                    minWidth: '70px',
                                    height: '22px',
                                    opacity: 1,
                                    display: 'inline-block',
                                    fontFamily: 'Lato, sans-serif',
                                    fontWeight: '500'
                                  }}
                                >
                                  {item.estado === 'En mantenimiento' ? 'Mantenimiento' : item.estado}
                                </span>
                              );
                            })()}
                    </td>
                  </tr>
                      );
                    }
                  })
                )}
              </tbody>
            </table>
            )}
            </div>
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

export default Home;
