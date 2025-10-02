import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { proyectoService, clienteService, usuarioService, settingService, cursoSenceService, comisionService } from '../../../services';
import { useAuth } from '../../../hooks/useAuth';
import { usePermissions } from '../../../hooks/usePermissions';
import { validateProyectoForm } from '../utils/validationUtils';
import { unformatNumber } from '../utils/formatUtils';
import { useCursos } from './useCursos';
import { useCostos } from './useCostos';

export const useProyectoForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  const { user } = useAuth();
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  const userRole = user?.rol;
  const isComercial = userRole === 'ventas';
  
  // Estados para formulario
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    cliente_id: '',
    fecha_inicio: new Date(),
    fecha_fin: new Date(),
    presupuesto: '',
    costo_real: '0',
    estado: 'No iniciado',
    responsable_id: '',
    observaciones: '',
    prioridad: 'media',
    // Detalles del curso
    curso_id: '',
    cantidad_participantes: '',
    horas_curso: '',
    valor_por_persona: '',
    valor_total: '',
    codigo_sence: '',
    modalidad: '',
    modo: '',
    estado_sence: 'pendiente',
    tipo_de_contrato: 'Normal',
    estado_pre_contrato: 'No Aplica',
    aprobado: false,
    // Campos para comisión
    comision_proyecto: 0,
    porcentaje_comision: 0,
    // Campo proyect_id para mostrar en edición
    proyect_id: ''
  });

  // Estado para filtros de cliente
  const [clientes, setClientes] = useState([]);
  const [allResponsables, setAllResponsables] = useState([]);
  const [responsablesDisponibles, setResponsablesDisponibles] = useState([]);
  const [holdings, setHoldings] = useState([]);
  const [holdingFilter, setHoldingFilter] = useState('');
  const [empresaFilter, setEmpresaFilter] = useState('');
  const [rutFilter, setRutFilter] = useState('');
  const [filteredClientes, setFilteredClientes] = useState([]);
  
  // Estados para UI
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Estado para valores financieros
  const [ivaValue, setIvaValue] = useState(19);
  const [retencionHonorariosValue, setRetencionHonorariosValue] = useState(13.75);
  
  // --- INICIO: Estados y lógica para PPM --- 
  const [ppmPercentage, setPpmPercentage] = useState(0);
  const [ppmCalculatedValue, setPpmCalculatedValue] = useState(0);
  // --- FIN: Estados y lógica para PPM ---
  
  // --- INICIO: Estado para Gastos Admin desde Settings ---
  const [gastosAdminSettingValue, setGastosAdminSettingValue] = useState(0); // Valor por defecto
  // --- FIN: Estado para Gastos Admin desde Settings ---
  
  // --- INICIO: Estados para Fondo Ahorro --- 
  const [fondoAhorroPercentage, setFondoAhorroPercentage] = useState(0);
  const [fondoAhorroCalculatedValue, setFondoAhorroCalculatedValue] = useState(0);
  // --- FIN: Estados para Fondo Ahorro ---
  
  // --- INICIO: Estados para Comisión de Ventas ---
  const [comisionVentaPercentage, setComisionVentaPercentage] = useState(0);
  const [comisionVentaCalculatedValue, setComisionVentaCalculatedValue] = useState(0);
  // --- FIN: Estados para Comisión de Ventas ---
  
  const [isResponsableDisabled, setIsResponsableDisabled] = useState(true);

  // --- INICIO: Estados para Comisión Manual ---
  const [usarComisionManual, setUsarComisionManual] = useState(false);
  const [comisionManual, setComisionManual] = useState('');
  const [tipoComision, setTipoComision] = useState('automatica');
  const [fuenteComision, setFuenteComision] = useState(null);
  // --- FIN: Estados para Comisión Manual ---
  
  const PERMISO_ASIGNAR_RESPONSABLE = 'proyectos:assign:responsable';
  
  // Cargar datos iniciales
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Cargar valor del IVA
      try {
        const ivaResponse = await settingService.getIVA();
        if (ivaResponse && typeof ivaResponse.value === 'number') {
          setIvaValue(ivaResponse.value);
        } else {
          setIvaValue(19);
        }
      } catch (ivaError) {
        console.error('Error al obtener el valor del IVA:', ivaError);
        setIvaValue(19);
      }
      
      // Verificar si existen comisiones configuradas en el sistema
      try {
        console.log("Verificando comisiones en el sistema...");
        // Solo para depuración, verificamos las comisiones para rol ID 3 (típicamente ventas)
        const comisionesVentas = await comisionService.verificarComisionesPorRol(3);
        console.log("Comisiones para ventas:", comisionesVentas);
      } catch (comisionError) {
        console.error("Error al verificar comisiones:", comisionError);
      }
      
      // Cargar valor de Retención de Honorarios
      try {
        const retencionResponse = await settingService.getRetencionHonorarios();
        if (retencionResponse && typeof retencionResponse.value === 'number') {
          setRetencionHonorariosValue(retencionResponse.value);
        } else {
          setRetencionHonorariosValue(13.75);
        }
      } catch (retencionError) {
        console.error('Error al obtener el valor de Retención Honorarios:', retencionError);
        setRetencionHonorariosValue(13.75);
      }
      
      // --- INICIO: Mover lógica PPM aquí ---
      // PPM
      const ppmData = await settingService.getSettingByKey('ppm');
      if (ppmData && ppmData.value !== undefined) {
        const percentage = parseFloat(ppmData.value) || 0;
        setPpmPercentage(percentage);
      } else {
        setPpmPercentage(0);
      }
      // --- FIN: Mover lógica PPM aquí ---
      
      // --- INICIO: Obtener Gastos Admin Setting ---
      try {
        const gastosData = await settingService.getSettingByKey('gastos_administracion');
        if (gastosData && gastosData.value !== undefined) {
          setGastosAdminSettingValue(parseFloat(gastosData.value) || 0);
        } else {
          setGastosAdminSettingValue(0); // Default si no se encuentra
        }
      } catch (gastosError) {
        console.error("Error fetching 'gastos_administracion' setting:", gastosError);
        setGastosAdminSettingValue(0); // Default en caso de error
      }
      // --- FIN: Obtener Gastos Admin Setting ---
      
      // --- INICIO: Obtener Fondo Ahorro Setting ---
      try {
        const ahorroData = await settingService.getSettingByKey('ahorro_caja');
        if (ahorroData && ahorroData.value !== undefined) {
          setFondoAhorroPercentage(parseFloat(ahorroData.value) || 0);
        } else {
          setFondoAhorroPercentage(0); // Default si no se encuentra
        }
      } catch (ahorroError) {
        console.error("Error fetching 'ahorro_caja' setting:", ahorroError);
        setFondoAhorroPercentage(0); // Default en caso de error
      }
      // --- FIN: Obtener Fondo Ahorro Setting ---
      
      // Cargar lista de clientes
      const clientesResponse = await clienteService.getClientes();
      const clientesList = clientesResponse.clientes || [];
      setClientes(clientesList);
      setFilteredClientes(clientesList);
      
      // Extraer holdings únicos de la lista de clientes
      const uniqueHoldings = [...new Set(clientesList
        .filter(c => c.holding && c.holding.trim() !== '')
        .map(c => c.holding))]
        .sort();
      setHoldings(uniqueHoldings);
      
      // Cargar lista COMPLETA de responsables (usuarios)
      const usuariosResponse = await usuarioService.getUsuarios();
      setAllResponsables(usuariosResponse.usuarios || []);
      
      // Filtrar responsables y preseleccionar si es comercial creando
      if (!isEditing && isComercial && user) {
        const currentUser = usuariosResponse.usuarios.find(u => u.id === user.id);
        setResponsablesDisponibles(currentUser ? [currentUser] : []);
        // Preseleccionar responsable
        setFormData(prev => ({ ...prev, responsable_id: user.id || '' }));
      } else {
        // Para admin/gerencia o comercial editando, mostrar todos
        setResponsablesDisponibles(usuariosResponse.usuarios);
      }
      
      // Si estamos editando, cargar datos del proyecto
      let proyectoData = null;
      if (isEditing) {
        proyectoData = await proyectoService.getProyectoById(id);
        
        setFormData({
          nombre: proyectoData.nombre || '',
          descripcion: proyectoData.descripcion || '',
          cliente_id: proyectoData.cliente_id || '',
          fecha_inicio: proyectoData.fecha_inicio ? new Date(proyectoData.fecha_inicio) : new Date(),
          fecha_fin: proyectoData.fecha_fin ? new Date(proyectoData.fecha_fin) : null,
          presupuesto: proyectoData.presupuesto ? proyectoData.presupuesto.toString() : '',
          costo_real: proyectoData.costo_real ? proyectoData.costo_real.toString() : '0',
          estado: proyectoData.estado || 'No iniciado',
          responsable_id: proyectoData.responsable_id || '',
          observaciones: proyectoData.observaciones || '',
          prioridad: proyectoData.prioridad || 'media',
          // porcentaje_avance: proyectoData.porcentaje_avance || 0, // REMOVED
          // Nuevos campos
          curso_id: proyectoData.curso_id || '',
          cantidad_participantes: proyectoData.cantidad_participantes || '',
          horas_curso: proyectoData.horas_curso || '',
          valor_por_persona: proyectoData.valor_por_persona || '',
          valor_total: proyectoData.valor_total || '',
          codigo_sence: proyectoData.codigo_sence || '',
          modalidad: proyectoData.modalidad || '',
          modo: proyectoData.modo || '',
          estado_sence: proyectoData.estado_sence || 'pendiente',
          tipo_de_contrato: proyectoData.tipo_de_contrato || 'Normal',
          estado_pre_contrato: proyectoData.estado_pre_contrato || 'No Aplica',
          aprobado: proyectoData.aprobado || false,
          // Nuevos campos de comisión
          comision_proyecto: proyectoData.comision_proyecto !== undefined ? proyectoData.comision_proyecto : 0,
          porcentaje_comision: proyectoData.porcentaje_comision !== undefined ? proyectoData.porcentaje_comision : 0,
          // Campo proyect_id para mostrar en edición
          proyect_id: proyectoData.proyect_id || ''
        });
        
        // Poblar filtros de cliente al editar
        if (proyectoData.cliente_id && clientesList.length > 0) {
          const selectedClienteData = clientesList.find(c => c.id === proyectoData.cliente_id);
          if (selectedClienteData) {
            setHoldingFilter(selectedClienteData.holding || '');
            setEmpresaFilter(selectedClienteData.razon_social || '');
            setRutFilter(selectedClienteData.rut || '');
          }
        }

        // En fetchData, si es edición, cargar los campos manuales
        if (proyectoData) {
          setUsarComisionManual(!!proyectoData.usar_comision_manual);
          setComisionManual(proyectoData.comision_manual !== null ? proyectoData.comision_manual.toString() : '');
          setTipoComision(proyectoData.tipo_comision || 'automatica');
          setFuenteComision(proyectoData.fuente_comision || null);
        }
      }

      // --- Lógica para determinar si el campo responsable debe estar deshabilitado --- 
      // Mover esta lógica aquí, después de cargar permisos (o al menos saber que terminaron de cargar)
      const puedeAsignar = hasPermission(PERMISO_ASIGNAR_RESPONSABLE);
      const isDisabled = !puedeAsignar && user?.rol !== 'administrador';
      setIsResponsableDisabled(isDisabled);
      // --------------------------------------------------------------------------

      // --- Establecer valores iniciales --- 
      let initialResponsableId = proyectoData?.responsable_id || '';
      // Si es CREACIÓN y el campo está DESHABILITADO (por falta de permiso)
      if (!id && isDisabled && user?.id) {
          initialResponsableId = user.id; // Asignar al usuario actual
      }
      // ---------------------------------

      setFormData(prev => ({
        ...prev,
        responsable_id: initialResponsableId
      }));
    } catch (err) {
      console.error('Error al cargar datos iniciales:', err);
      setError('Error al cargar datos. ' + (err.response?.data?.message || ''));
    } finally {
      setLoading(false);
    }
  }, [id, isEditing, user, isComercial, hasPermission, PERMISO_ASIGNAR_RESPONSABLE]);
  
  useEffect(() => {
    // Ejecutar fetchData solo cuando los permisos hayan cargado
    if (!permissionsLoading) {
      fetchData();
    }
  }, [fetchData, permissionsLoading]);
  
  // Filtrar clientes basados en holding, empresa y RUT
  useEffect(() => {
    let filtered = [...clientes];
    
    // Filtrar por holding
    if (holdingFilter) {
      filtered = filtered.filter(c => c.holding === holdingFilter);
    }
    
    // Filtrar por empresa (razón social)
    if (empresaFilter) {
      filtered = filtered.filter(c => c.razon_social && 
        c.razon_social.toLowerCase().includes(empresaFilter.toLowerCase()));
    }
    
    // Filtrar por RUT
    if (rutFilter) {
      filtered = filtered.filter(c => c.rut && 
        c.rut.toLowerCase().includes(rutFilter.toLowerCase()));
    }
    
    setFilteredClientes(filtered);
  }, [holdingFilter, empresaFilter, rutFilter, clientes]);
  
  // Manejar cambio de holding
  const handleHoldingChange = (e) => {
    const selectedHolding = e.target.value;
    setHoldingFilter(selectedHolding);
    
    // Si cambia el holding, resetear el filtro de empresa y RUT
    if (selectedHolding !== holdingFilter) {
      setEmpresaFilter('');
      setRutFilter('');
    }
  };
  
  // Manejar cambio de empresa
  const handleEmpresaChange = (e) => {
    const selectedEmpresa = e.target.value;
    setEmpresaFilter(selectedEmpresa);
    
    // Si selecciona una empresa específica, actualizar automáticamente el RUT
    if (selectedEmpresa) {
      const selectedCliente = clientes.find(c => c.razon_social === selectedEmpresa);
      if (selectedCliente) {
        setRutFilter(selectedCliente.rut || '');
        // Actualizar el cliente_id en el formulario
        setFormData(prev => ({
          ...prev,
          cliente_id: selectedCliente.id
        }));
      }
    } else {
      setRutFilter('');
    }
  };
  
  // Manejar cambio de RUT
  const handleRutChange = (e) => {
    const selectedRut = e.target.value;
    setRutFilter(selectedRut);
    
    // Si selecciona un RUT específico, actualizar automáticamente la empresa
    if (selectedRut) {
      const selectedCliente = clientes.find(c => c.rut === selectedRut);
      if (selectedCliente) {
        setEmpresaFilter(selectedCliente.razon_social || '');
        
        // También actualizar el holding si existe
        if (selectedCliente.holding) {
          setHoldingFilter(selectedCliente.holding);
        }
        
        // Actualizar el cliente_id en el formulario
        setFormData(prev => ({
          ...prev,
          cliente_id: selectedCliente.id
        }));
      }
    } else if (!empresaFilter) {
      // Solo limpiar el cliente_id si la empresa también está vacía
      setFormData(prev => ({
        ...prev,
        cliente_id: ''
      }));
    }
  };
  
  // Manejo de cambios en el formulario
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData((prev) => {
      let newValue = type === 'checkbox' ? checked : value;
      
      // Evitar actualizar porcentaje_avance si el campo ya no existe
      if (name === 'porcentaje_avance') {
        return prev; // No hacer nada si el campo es porcentaje_avance
      }
      
      // Manejar campos numéricos con formato
      if (name === 'presupuesto' || name === 'costo_real' || name === 'monto' || 
          name === 'cantidad_participantes' || name === 'valor_por_persona' || name === 'valor_total') {
        const unformattedValue = unformatNumber(newValue);
        const numericValue = unformattedValue === '' ? '' : unformattedValue;
        newValue = numericValue;
      }

      // Calcular valor total cuando cambian cantidad_participantes o valor_por_persona
      if (name === 'cantidad_participantes') {
        const participantes = parseFloat(newValue) || 0;
        const valorPersona = parseFloat(formData.valor_por_persona) || 0;
        newValue = participantes * valorPersona;
      }
      
      // Cuando se selecciona un curso, cargar sus datos
      if (name === 'curso_id' && newValue) {
        loadCursoDetails(newValue);
      }
      
      return {
        ...prev,
        [name]: newValue
      };
    });
  };
  
  // Manejo de cambios en las fechas
  const handleDateChange = (field) => (date) => {
    // Asegurarse de que date no sea null o undefined
    if (date === null && field === 'fecha_fin') {
      // Para fecha_fin, permitimos null
      setFormData(prev => ({
        ...prev,
        [field]: null
      }));
      return;
    }
    
    // Para otros campos, usar la fecha actual si es null
    const safeDate = date || new Date();
    
    setFormData(prev => ({
      ...prev,
      [field]: safeDate
    }));
  };
  
  // Cargar detalles del curso seleccionado
  const loadCursoDetails = async (cursoId) => {
    try {
      setLoading(true);
      const curso = await cursoSenceService.getCursoSenceById(cursoId);
      
      if (curso) {
        // Actualizar los campos relacionados con el curso
        setFormData(prev => ({
          ...prev,
          // Nuevos campos de comisión
          comision_proyecto: curso.comision_proyecto !== undefined ? curso.comision_proyecto : 0,
          porcentaje_comision: curso.porcentaje_comision !== undefined ? curso.porcentaje_comision : 0,
          horas_curso: curso.horas || '',
          valor_por_persona: curso.valor_imputable_participante ? curso.valor_imputable_participante.toString() : '',
          codigo_sence: curso.codigo_curso || '',
          modalidad: curso.modalidad || '',
          modo: curso.modo || '',
          estado_sence: curso.estado_sence || 'pendiente',
          tipo_de_contrato: curso.tipo_de_contrato || 'Normal',
          estado_pre_contrato: curso.estado_pre_contrato || 'No Aplica'
        }));
        
        // Calcular el valor total
        const participantes = parseFloat(formData.cantidad_participantes) || 0;
        const valorPersona = parseFloat(curso.valor_imputable_participante) || 0;
        const valorTotal = participantes * valorPersona;
        
        setFormData(prev => ({
          ...prev,
          valor_total: valorTotal.toString()
        }));
      }
    } catch (error) {
      console.error('Error al cargar detalles del curso:', error);
      setError('Error al cargar detalles del curso: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Envío del formulario
  const handleSubmit = async (e, updatedData) => {
    if (e) {
      e.preventDefault();
    }
    
    setError('');
    setSuccess('');
    setSaving(true);
    
    const dataToSubmit = updatedData || formData;
    
    // Validar formulario
    const { isValid, errors } = validateProyectoForm(dataToSubmit);
    if (!isValid) {
      const errorMessages = Object.values(errors).join(', ');
      setError(errorMessages);
      setSaving(false);
      return;
    }
    
    try {
      // Crear un objeto con los datos a enviar, excluyendo porcentaje_avance
      const { porcentaje_avance, ...finalData } = dataToSubmit;
      
      // Añadir los valores finales de comisión calculados al objeto a enviar
      finalData.comision_proyecto = comisionVentaCalculatedValue || 0;
      finalData.porcentaje_comision = comisionVentaPercentage || 0;
      
      // Añadir los campos manuales al objeto a enviar
      finalData.usar_comision_manual = usarComisionManual;
      finalData.comision_manual = usarComisionManual ? parseFloat(comisionManual) : null;
      
      // Asegurar que las fechas se envían en formato correcto
      const formattedData = {
        ...finalData,
        fecha_inicio: finalData.fecha_inicio ? format(new Date(finalData.fecha_inicio), 'yyyy-MM-dd') : null,
        fecha_fin: finalData.fecha_fin ? format(new Date(finalData.fecha_fin), 'yyyy-MM-dd') : null,
        presupuesto: finalData.presupuesto ? parseFloat(unformatNumber(finalData.presupuesto)) : 0,
        costo_real: finalData.costo_real ? parseFloat(unformatNumber(finalData.costo_real)) : 0,
        aprobado: finalData.aprobado || false // Asegurarse que aprobado es booleano
      };
      
      let response;
      if (isEditing) {
        response = await proyectoService.updateProyecto(id, formattedData);
        setSuccess('Proyecto actualizado correctamente');
      } else {
        response = await proyectoService.createProyecto(formattedData);
        console.log('Respuesta al crear proyecto:', response);
        setSuccess('Proyecto creado correctamente');
        // Navegar al modo edición después de crear
        const newId = response.id || (response.proyecto && response.proyecto.id) || (response.data && response.data.id);
        if (newId) {
          navigate(`/proyectos/${newId}/editar`);
        } else {
          setError('No se pudo obtener el ID del proyecto creado.');
        }
      }
    } catch (err) {
      console.error('Error al guardar proyecto:', err);
      setError('Error al guardar proyecto: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };
  
  // Volver a la lista de proyectos
  const handleVolver = () => {
    navigate('/proyectos');
  };
  
  // --- INICIO: Calcular PPM cuando cambie el porcentaje o el valor de cursos ---
  const calcularPPM = (ingresosCursos) => {
    if (ppmPercentage > 0 && ingresosCursos > 0) {
      const ppmValue = (ingresosCursos * ppmPercentage) / 100;
      setPpmCalculatedValue(ppmValue);
    } else {
      setPpmCalculatedValue(0);
    }
  };
  // --- FIN: Calcular PPM ---
  
  // --- INICIO: Calcular Fondo Ahorro --- 
  const calcularFondoAhorro = (ingresosCursos) => {
    if (fondoAhorroPercentage > 0 && ingresosCursos > 0) {
      const ahorroValue = (ingresosCursos * fondoAhorroPercentage) / 100;
      setFondoAhorroCalculatedValue(ahorroValue);
    } else {
      setFondoAhorroCalculatedValue(0);
    }
  };
  // --- FIN: Calcular Fondo Ahorro ---
  
  // --- INICIO: Calcular Comisión de Ventas ---
  const calcularComisionVentas = useCallback(async (margenRentabilidad, rolId, valorIngresos, comisionForzada = null) => {
    if (comisionForzada !== null) {
      const comisionCalculada = (valorIngresos * comisionForzada) / 100;
      setComisionVentaPercentage(comisionForzada);
      setComisionVentaCalculatedValue(comisionCalculada);
      return {
        porcentaje: comisionForzada,
        calculado: comisionCalculada,
        forzada: true
      };
    }

    if (rolId === undefined || rolId === null) {
      console.warn("Rol ID no definido, no se puede calcular comisión de ventas.");
      setComisionVentaPercentage(0);
      setComisionVentaCalculatedValue(0);
      return { porcentaje: 0, calculado: 0 };
    }
    
    console.log('[Comisiones] Iniciando cálculo de comisión para rol:', rolId, 'con margen:', margenRentabilidad);

    try {
      const data = await comisionService.calcularComision({ margen_rentabilidad: margenRentabilidad, rol_id: rolId });
      console.log('[Comisiones] Respuesta de API comisiones/calculo:', data);
      
      if (data && data.porcentaje_comision !== undefined) {
        const porcentaje = parseFloat(data.porcentaje_comision);
        const comisionCalculada = (valorIngresos * porcentaje) / 100;
        
        setComisionVentaPercentage(porcentaje);
        setComisionVentaCalculatedValue(comisionCalculada);
        console.log(`[Comisiones] Comisión calculada: ${porcentaje}%, Valor: ${comisionCalculada}`);
        return { porcentaje, calculado: comisionCalculada };
      } else {
        console.warn('[Comisiones] No se encontró un rango de comisión aplicable o la respuesta no tiene el formato esperado. Se usará 0%. Respuesta:', data);
        setComisionVentaPercentage(0);
        setComisionVentaCalculatedValue(0);
        return { porcentaje: 0, calculado: 0 };
      }
    } catch (error) {
      console.error('[Comisiones] Error al calcular comisión:', error);
      // Si la API devuelve 404 (no encontrado) o cualquier otro error, asumimos 0% de comisión
      // para evitar bloquear el flujo o usar valores incorrectos.
      if (error.response && error.response.status === 404) {
        console.warn('[Comisiones] API devolvió 404, no se encontraron rangos de comisión. Asumiendo 0%.');
      } else {
        console.error('[Comisiones] Error inesperado al calcular comisión. Asumiendo 0%.', error);
      }
      setComisionVentaPercentage(0);
      setComisionVentaCalculatedValue(0);
      return { porcentaje: 0, calculado: 0, error: true, detalleError: error };
    }
  }, []); // Array de dependencias vacío
  // --- FIN: Calcular Comisión de Ventas ---
  
  // --- INICIO: Función para aprobar/desaprobar el proyecto ---
  const handleAprobarProyecto = async (nuevoEstadoAprobado) => {
    if (!isEditing) return; // Solo para proyectos existentes
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await proyectoService.aprobarProyecto(id, { aprobado: nuevoEstadoAprobado });
      setFormData(prev => ({ ...prev, aprobado: nuevoEstadoAprobado }));
      setSuccess(`Proyecto ${nuevoEstadoAprobado ? 'aprobado' : 'desaprobado'} correctamente.`);
    } catch (err) {
      console.error('Error al aprobar/desaprobar proyecto:', err);
      setError('Error al cambiar el estado de aprobación: ' + (err.response?.data?.message || ''));
    } finally {
      setSaving(false);
    }
  };
  // --- FIN: Función para aprobar/desaprobar el proyecto ---

  // Handler para alternar comisión manual
  const handleToggleComisionManual = () => {
    setUsarComisionManual((prev) => !prev);
    // Si se desactiva, limpiar el valor manual
    if (usarComisionManual) setComisionManual('');
  };

  // Handler para editar el valor manual
  const handleChangeComisionManual = (e) => {
    const value = e.target.value.replace(',', '.');
    // Solo permitir números y máximo 2 decimales
    if (/^\d*(\.?\d{0,2})?$/.test(value)) {
      setComisionManual(value);
    }
  };

  return {
    formData,
    setFormData,
    isEditing,
    loading,
    saving,
    error,
    success,
    setError,
    setSuccess,
    clientes,
    setClientes,
    allResponsables,
    responsablesDisponibles,
    userRole,
    holdings,
    holdingFilter,
    empresaFilter,
    rutFilter,
    filteredClientes,
    ivaValue,
    retencionHonorariosValue,
    gastosAdminSettingValue,
    ppmCalculatedValue,
    ppmPercentage,
    fondoAhorroCalculatedValue,
    fondoAhorroPercentage,
    comisionVentaPercentage,
    comisionVentaCalculatedValue,
    handleChange,
    handleDateChange,
    handleSubmit,
    handleVolver,
    handleHoldingChange,
    handleEmpresaChange,
    handleRutChange,
    calcularPPM,
    calcularFondoAhorro,
    calcularComisionVentas,
    handleAprobarProyecto,
    isResponsableDisabled,
    usarComisionManual,
    setUsarComisionManual,
    comisionManual,
    setComisionManual,
    tipoComision,
    fuenteComision,
    handleToggleComisionManual,
    handleChangeComisionManual
  };
}; 