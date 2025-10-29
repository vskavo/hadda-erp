import { useState, useEffect, useRef } from 'react';
import { useFormik } from 'formik';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { cursoValidationSchema, getInitialValues } from '../utils/validationUtils';
import { parseDateStringRobust, formatFechaAPI } from '../utils/formatUtils';
import usuarioService from '../../../services/usuarioService';

/**
 * Hook principal para manejar el estado y la lógica del formulario de cursos.
 * - Maneja carga de datos, envío, sincronización SENCE, etc.
 * - No debe contener lógica de UI.
 * 
 * @param {Object} params
 * @param {string} [params.id] - ID del curso (si es edición)
 */
export function useCursoForm({ id } = {}) {
  const navigate = useNavigate();
  const isEditing = !!id;
  
  // Estados principales
  const [loading, setLoading] = useState(!!id);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Estados para proyecto
  const [proyectos, setProyectos] = useState([]);
  const [loadingProyectos, setLoadingProyectos] = useState(false);
  const [selectedProyecto, setSelectedProyecto] = useState(null);
  const [loadingProyectoDetails, setLoadingProyectoDetails] = useState(false);
  
  // Estados para sincronización SENCE y declaraciones
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [declaraciones, setDeclaraciones] = useState([]);
  
  // Estado específico para sincronización de declaraciones juradas
  const [declaracionesSyncStatus, setDeclaracionesSyncStatus] = useState('idle'); // 'idle', 'initializing', 'polling', 'completed', 'error'
  const [declaracionesSyncProgress, setDeclaracionesSyncProgress] = useState(0);
  const [declaracionesSyncMessage, setDeclaracionesSyncMessage] = useState('');
  const pollingIntervalRef = useRef(null);
  const syncStartTimeRef = useRef(null);
  
  // Estado para usuarios
  const [usuarios, setUsuarios] = useState([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);
  
  // Limpia el intervalo de polling al desmontar el componente
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Configuración del formulario
  const formik = useFormik({
    initialValues: getInitialValues(isEditing),
    validationSchema: cursoValidationSchema,
    validationContext: { isEditing },
    onSubmit: async (values) => {
      try {
        // Si estamos editando, enviamos todos los campos necesarios
        if (isEditing) {
          // Asegurarse de que id_sence nunca sea null
          const id_sence = values.id_sence || '';
          
          // Formatear fechas para envío a la API
          const formattedValues = {
            ...values,
            id_sence, // Usar el valor asegurado
            fecha_inicio: formatFechaAPI(values.fecha_inicio),
            fecha_fin: formatFechaAPI(values.fecha_fin),
            owner_operaciones: values.owner_operaciones || '',
            owner_operaciones_nombre: values.owner_operaciones_nombre || ''
          };
          
          // Debug: imprimir los valores antes de enviarlos
          console.log('Valores a enviar al actualizar:', formattedValues);
          
          try {
            const response = await axios.put(`/api/cursos/${id}`, formattedValues);
            console.log('Respuesta del servidor:', response.data);
            // Lógica para mostrar mensajes según la sincronización SENCE
            if (response.data.senceSync) {
              if (response.data.senceSync.success) {
                setSuccessMessage('Información del curso actualizada y sincronizada con SENCE correctamente.');
              } else if (response.data.senceSync.message && response.data.senceSync.message.includes('duplicado')) {
                setError('El curso ya existe en SENCE (duplicado).');
              } else {
                setError('Error al sincronizar con SENCE: ' + (response.data.senceSync.message || 'Error desconocido.'));
              }
            } else {
              setSuccessMessage('Información del curso actualizada con éxito');
            }
            // Redirigir después de 2 segundos si no hay error
            setTimeout(() => {
              if (!error) navigate('/cursos');
            }, 2000);
          } catch (updateErr) {
            console.error('Error detallado al actualizar:', updateErr);
            throw updateErr;
          }
        } else {
          // Formatear fechas para envío a la API
          const formattedValues = {
            ...values,
            fecha_inicio: formatFechaAPI(values.fecha_inicio),
            fecha_fin: formatFechaAPI(values.fecha_fin),
            owner_operaciones: values.owner_operaciones || '',
            owner_operaciones_nombre: values.owner_operaciones_nombre || ''
          };

          // Crear nuevo curso
          await axios.post('/api/cursos', formattedValues);
          setSuccessMessage('Curso creado con éxito');
        }

        // Redirigir después de 2 segundos
        setTimeout(() => {
          navigate('/cursos');
        }, 2000);
      } catch (err) {
        setError('Error al guardar el curso: ' + (err.response?.data?.message || err.message));
      }
    },
  });

  // Cargar proyectos
  useEffect(() => {
    const fetchProyectos = async () => {
      setLoadingProyectos(true);
      try {
        const response = await axios.get('/api/proyectos');
        setProyectos(response.data.data || []);
      } catch (err) {
        console.error('Error al cargar proyectos:', err);
      } finally {
        setLoadingProyectos(false);
      }
    };

    // Solo cargamos proyectos si estamos creando un nuevo curso
    if (!isEditing) {
      fetchProyectos();
    }
  }, [isEditing]);

  // Cargar usuarios para el select de responsable de operaciones
  useEffect(() => {
    const fetchUsuarios = async () => {
      setLoadingUsuarios(true);
      try {
        const response = await usuarioService.getUsuarios({ limit: 100 });
        setUsuarios(response.usuarios || []);
      } catch (err) {
        console.error('Error al cargar usuarios:', err);
      } finally {
        setLoadingUsuarios(false);
      }
    };
    fetchUsuarios();
  }, []);

  // Cargar datos del curso si estamos editando
  useEffect(() => {
    if (id) {
      const fetchCurso = async () => {
        setLoading(true);
        try {
          const response = await axios.get(`/api/cursos/${id}`);
          const curso = response.data.data;
          
          const fechaInicioParseada = parseDateStringRobust(curso.fecha_inicio);
          const fechaFinParseada = parseDateStringRobust(curso.fecha_fin);
          
          formik.setValues({
            ...curso,
            fecha_inicio: fechaInicioParseada,
            fecha_fin: fechaFinParseada,
            proyecto_id: curso.proyecto_id || null,
            owner_operaciones: curso.owner_operaciones || '',
            owner_operaciones_nombre: curso.owner_operaciones_nombre || ''
          });

          // --- Inicio: Lógica mejorada para cargar/usar datos del proyecto ---
          if (curso.Proyecto && curso.Proyecto.Cliente && curso.Proyecto.Responsable) {
            // Si ya tenemos los datos completos del proyecto desde /api/cursos/ID
            console.log('Usando datos del proyecto desde /api/cursos');
            setSelectedProyecto(curso.Proyecto);
            setLoadingProyectoDetails(false); // Marcar como no cargando
          } else if (curso.proyecto_id) {
            // Si no vinieron los datos completos, pero hay ID, intentar cargarlos
            console.log('Llamando a loadProyectoDetails como fallback');
            loadProyectoDetails(curso.proyecto_id);
          } else {
            // Si no hay ID de proyecto
            setSelectedProyecto(null);
            setLoadingProyectoDetails(false);
          }
          // --- Fin: Lógica mejorada ---
          
          setDeclaraciones(curso.DeclaracionJuradas || []);
        } catch (err) {
          console.error('Error completo al cargar datos del curso:', err);
          setError('Error al cargar datos del curso: ' + (err.response?.data?.message || err.message));
        } finally {
          setLoading(false);
        }
      };

      fetchCurso();
    }
  }, [id]);

  // Función para cargar detalles del proyecto cuando se selecciona uno
  const loadProyectoDetails = async (proyectoId) => {
    if (!proyectoId) {
      setSelectedProyecto(null);
      return;
    }

    setLoadingProyectoDetails(true);
    try {
      const response = await axios.get(`/api/proyectos/${proyectoId}`);
      const proyecto = response.data.data;
      
      // Verificar si el proyecto tiene la información completa de cliente y responsable
      if ((!proyecto.Cliente || !proyecto.Responsable) && proyecto.cliente_id) {
        try {
          // Obtener detalles completos del proyecto con sus relaciones
          const proyectoCompleto = await axios.get(`/api/proyectos/${proyectoId}/completo`);
          if (proyectoCompleto.data.success) {
            setSelectedProyecto(proyectoCompleto.data.data);
          } else {
            setSelectedProyecto(proyecto);
          }
        } catch (err) {
          console.error('Error al cargar detalles completos del proyecto:', err);
          setSelectedProyecto(proyecto);
        }
      } else {
        setSelectedProyecto(proyecto);
      }
    } catch (err) {
      console.error('Error al cargar detalles del proyecto:', err);
    } finally {
      setLoadingProyectoDetails(false);
    }
  };

  // Manejar cambio de proyecto
  const handleProyectoChange = (event, newValue) => {
    const proyectoId = newValue ? newValue.id : null;
    formik.setFieldValue('proyecto_id', proyectoId);
    loadProyectoDetails(proyectoId);
  };

  // Calcular valor total automáticamente al cambiar valor hora o duración horas
  useEffect(() => {
    if (!isEditing && formik.values.valor_hora && formik.values.duracion_horas) {
      const valorTotal = formik.values.valor_hora * formik.values.duracion_horas;
      formik.setFieldValue('valor_total', valorTotal);
    }
  }, [formik.values.valor_hora, formik.values.duracion_horas, isEditing]);

  // Función para sincronizar manualmente con SENCE
  const handleSyncSence = async (onSuccessCallback) => {
    setSyncLoading(true);
    setSyncResult(null);
    setError('');
    try {
      if (!formik.values.id_sence) {
        setError('Debe ingresar un ID SENCE para sincronizar.');
        setSyncLoading(false);
        return;
      }
      const response = await axios.post(`/api/cursos/${id}/sincronizar-sence`);
      setSyncResult(response.data);
      if (response.data.success) {
        setSuccessMessage('Sincronización con SENCE exitosa.');

        // Ejecutar callback si se proporciona (para recargar participantes)
        if (onSuccessCallback && typeof onSuccessCallback === 'function') {
          onSuccessCallback(response.data);
        }
      } else {
        setError(response.data.message || 'Error al sincronizar con SENCE');
      }
    } catch (err) {
      setError('Error al sincronizar con SENCE: ' + (err.response?.data?.message || err.message));
    } finally {
      setSyncLoading(false);
    }
  };

  // Verificar estado de sincronización de declaraciones
  const checkSyncStatus = async () => {
    try {
      // Verificar si ha pasado más de 3 minutos (timeout)
      const currentTime = Date.now();
      const elapsedTime = currentTime - syncStartTimeRef.current;
      if (elapsedTime > 3 * 60 * 1000) { // 3 minutos en milisegundos
        clearInterval(pollingIntervalRef.current);
        setDeclaracionesSyncStatus('error');
        setDeclaracionesSyncMessage('La sincronización ha excedido el tiempo máximo de espera.');
        setSyncLoading(false);
        return;
      }

      // Consultar el estado actual de las declaraciones
      const response = await axios.get(`/api/declaraciones-juradas/sync-status/${id}`);
      
      if (response.data.success) {
        // Actualizar el progreso
        setDeclaracionesSyncProgress(response.data.data.progress || 0);
        
        // Verificar si ha terminado
        if (response.data.data.estado === 'completado') {
          clearInterval(pollingIntervalRef.current);
          setDeclaracionesSyncStatus('completed');
          setDeclaracionesSyncMessage('Sincronización completada con éxito');
          
          // Recargar las declaraciones
          const cursoResponse = await axios.get(`/api/cursos/${id}`);
          setDeclaraciones(cursoResponse.data.data.DeclaracionJuradas || []);
          
          setSyncLoading(false);
          setSuccessMessage('Declaraciones juradas sincronizadas correctamente');
        } else if (response.data.data.estado === 'error') {
          clearInterval(pollingIntervalRef.current);
          setDeclaracionesSyncStatus('error');
          setDeclaracionesSyncMessage('Error: ' + response.data.data.mensaje || 'Ocurrió un error durante la sincronización');
          setSyncLoading(false);
          setError('Error durante la sincronización de declaraciones juradas');
        } else {
          // Sigue en progreso
          setDeclaracionesSyncStatus('polling');
          setDeclaracionesSyncMessage(`Sincronizando... ${response.data.data.mensaje || ''}`);
        }
      } else {
        if (response.data.message === 'No hay sincronización en progreso') {
          // No hay sincronización activa
          clearInterval(pollingIntervalRef.current);
          setDeclaracionesSyncStatus('completed');
          setDeclaracionesSyncMessage('No hay sincronización activa');
          setSyncLoading(false);
        } else {
          setDeclaracionesSyncMessage(`Estado: ${response.data.message}`);
        }
      }
    } catch (err) {
      console.error('Error al verificar el estado de sincronización:', err);
      // Si hay error de conexión, seguimos intentando, no cancelamos el polling
      setDeclaracionesSyncMessage('Error temporal al verificar el estado. Reintentando...');
    }
  };

  // Función mejorada para sincronizar declaraciones juradas
  const handleSyncDeclaraciones = async () => {
    // Limpiar estados previos
    setDeclaracionesSyncStatus('initializing');
    setDeclaracionesSyncProgress(0);
    setDeclaracionesSyncMessage('Iniciando sincronización...');
    setSyncLoading(true);
    setError('');
    
    // Limpiar intervalo anterior si existe
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    
    try {
      // Iniciar la sincronización
      const response = await axios.post(`/api/declaraciones-juradas/sincronizar/${id}`);
      
      if (response.data.success) {
        // La sincronización se ha iniciado correctamente
        setDeclaracionesSyncStatus('polling');
        setDeclaracionesSyncMessage('Sincronización en progreso...');
        
        // Guardar tiempo de inicio
        syncStartTimeRef.current = Date.now();
        
        // Iniciar polling cada 10 segundos
        pollingIntervalRef.current = setInterval(checkSyncStatus, 10000);
        
        // Hacer una primera verificación inmediata
        setTimeout(checkSyncStatus, 1000);
      } else {
        // Si el backend indica que no se pudo iniciar la sincronización
        setDeclaracionesSyncStatus('error');
        setDeclaracionesSyncMessage(response.data.message || 'No se pudo iniciar la sincronización');
        setSyncLoading(false);
        setError('Error al iniciar sincronización: ' + response.data.message);
      }
    } catch (err) {
      console.error('Error al sincronizar declaraciones juradas:', err);
      setDeclaracionesSyncStatus('error');
      setDeclaracionesSyncMessage('Error al iniciar la sincronización');
      setSyncLoading(false);
      setError('Error al sincronizar declaraciones juradas: ' + (err.response?.data?.message || err.message));
    }
  };

  // Cancelar sincronización de declaraciones
  const cancelSyncDeclaraciones = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    
    setDeclaracionesSyncStatus('idle');
    setDeclaracionesSyncProgress(0);
    setDeclaracionesSyncMessage('');
    setSyncLoading(false);
    
    // No hay endpoint de cancelación implementado en el backend
    // pero podemos limpiar el estado local
  };

  // Manejo directo del envío para casos especiales (botón fuera del formik)
  const handleSubmit = () => {
    if (isEditing) {
      // Asegurarse de que id_sence nunca sea null
      const id_sence = formik.values.id_sence || '';
      
      // Formatear fechas para envío a la API
      const formattedValues = {
        ...formik.values,
        id_sence, // Usar el valor asegurado
        fecha_inicio: formatFechaAPI(formik.values.fecha_inicio),
        fecha_fin: formatFechaAPI(formik.values.fecha_fin),
        owner_operaciones: formik.values.owner_operaciones || '',
        owner_operaciones_nombre: formik.values.owner_operaciones_nombre || ''
      };
      
      // Debug: imprimir los valores antes de enviarlos
      console.log('Valores a enviar al actualizar desde onClick:', formattedValues);
      
      axios.put(`/api/cursos/${id}`, formattedValues)
        .then(response => {
          console.log('Respuesta del servidor:', response.data);
          // Lógica para mostrar mensajes según la sincronización SENCE
          if (response.data.senceSync) {
            if (response.data.senceSync.success) {
              setSuccessMessage('Información del curso actualizada y sincronizada con SENCE correctamente.');
            } else if (response.data.senceSync.message && response.data.senceSync.message.includes('duplicado')) {
              setError('El curso ya existe en SENCE (duplicado).');
            } else {
              setError('Error al sincronizar con SENCE: ' + (response.data.senceSync.message || 'Error desconocido.'));
            }
          } else {
            setSuccessMessage('Información del curso actualizada con éxito');
          }
          // Redirigir después de 2 segundos si no hay error
          setTimeout(() => {
            if (!error) navigate('/cursos');
          }, 2000);
        })
        .catch(updateErr => {
          console.error('Error detallado al actualizar:', updateErr);
          setError('Error al actualizar el curso: ' + (updateErr.response?.data?.message || updateErr.message));
        });
    } else {
      formik.handleSubmit();
    }
  };

  return {
    formik,
    loading,
    isEditing,
    error,
    setError,
    successMessage,
    setSuccessMessage,
    proyectos,
    loadingProyectos,
    selectedProyecto,
    loadingProyectoDetails,
    handleProyectoChange,
    handleSyncSence,
    syncLoading,
    syncResult,
    usuarios,
    loadingUsuarios,
    declaraciones,
    handleSyncDeclaraciones,
    cancelSyncDeclaraciones,
    declaracionesSyncStatus,
    declaracionesSyncProgress,
    declaracionesSyncMessage,
    handleSubmit
  };
} 