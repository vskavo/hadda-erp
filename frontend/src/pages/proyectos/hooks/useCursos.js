import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { cursoSenceService, proyectoService } from '../../../services';
import { unformatNumber } from '../utils/formatUtils';
import { validateCursoForm } from '../utils/validationUtils';

export const useCursos = (proyectoId, formData, setError) => {
  // Log para depuración
  console.log('useCursos hook iniciado con proyectoId:', proyectoId);
  
  // Estados para datos de cursos
  const [cursosSence, setCursosSence] = useState([]);
  const [modalidades, setModalidades] = useState([]);
  const [modos, setModos] = useState([]);
  const [cursosAgregados, setCursosAgregados] = useState([]);
  const [cursoTemp, setCursoTemp] = useState({
    curso_sence_id: '',
    id: null,
    nombre: '',
    cantidad_participantes: '',
    duracion_horas: '',
    valor_por_persona: '',
    valor_participante: '',
    valor_total: '',
    codigo_sence: '',
    id_sence: '',
    modalidad: '',
    estado_sence: 'pendiente',
    tipo_de_contrato: 'Normal',
    estado_pre_contrato: 'No Aplica'
  });
  const [openCursoModal, setOpenCursoModal] = useState(false);
  const [editingCursoIndex, setEditingCursoIndex] = useState(-1);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [filteredCursos, setFilteredCursos] = useState([]);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  
  // Efecto para debounce en la búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300); // 300ms de retraso
    
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  // Cargar datos iniciales de cursos
  useEffect(() => {
    const fetchCursosData = async () => {
      try {
        // Cargar datos de cursos SENCE
        const cursosSenceResponse = await cursoSenceService.getCursosSence();
        setCursosSence(cursosSenceResponse.cursos || []);
        setFilteredCursos(cursosSenceResponse.cursos || []);
        
        // Obtener modalidades
        const modalidadesResponse = await cursoSenceService.getModalidades();
        setModalidades(modalidadesResponse.modalidades || []);
        
        // Obtener modos
        const modosResponse = await cursoSenceService.getModos();
        setModos(modosResponse.modos || []);
        
        // Si estamos editando, cargar cursos asociados al proyecto
        if (proyectoId) {
          console.log('Cargando cursos para el proyecto ID:', proyectoId);
          try {
            const cursosAsociadosResponse = await proyectoService.getCursosProyecto(proyectoId);
            console.log('Respuesta de cursos asociados:', cursosAsociadosResponse);
            
            if (cursosAsociadosResponse && cursosAsociadosResponse.cursos && cursosAsociadosResponse.cursos.length > 0) {
              // Mapear los cursos para que tengan el formato esperado por el componente
              const cursosMapeados = cursosAsociadosResponse.cursos.map(curso => {
                // Aseguramos que las horas estén definidas, probando varios campos posibles
                let horasCurso = curso.duracion_horas;
                if (!horasCurso && horasCurso !== 0) horasCurso = curso.nro_horas;
                if (!horasCurso && horasCurso !== 0) horasCurso = curso.horas;
                
                console.log(`Curso "${curso.nombre}" - horas encontradas:`, {
                  duracion_horas: curso.duracion_horas,
                  nro_horas: curso.nro_horas,
                  horas: curso.horas,
                  horasFinales: horasCurso
                });
                
                return {
                  id: curso.id,
                  nombre: curso.nombre,
                  cantidad_participantes: curso.nro_participantes,
                  duracion_horas: horasCurso ? horasCurso.toString() : '',
                  valor_participante: curso.valor_participante || '0',
                  valor_total: curso.valor_total || '0',
                  codigo_sence: curso.codigo_sence || '',
                  id_sence: curso.id_sence || '',
                  modalidad: curso.modalidad || 'presencial',
                  fecha_inicio: curso.fecha_inicio || formData.fecha_inicio,
                  fecha_fin: curso.fecha_fin || formData.fecha_fin,
                  estado_sence: curso.estado_sence || 'pendiente',
                  tipo_de_contrato: curso.tipo_de_contrato || 'Normal',
                  estado_pre_contrato: curso.estado_pre_contrato || 'No Aplica'
                };
              });
              console.log('Cursos mapeados para mostrar:', cursosMapeados);
              setCursosAgregados(cursosMapeados);
            } else {
              console.log('No se encontraron cursos asociados al proyecto o el formato de respuesta es inesperado');
            }
          } catch (error) {
            console.error('Error al cargar cursos asociados al proyecto:', error);
          }
        } else {
          console.log('No hay ID de proyecto, no se cargarán cursos asociados');
        }
      } catch (error) {
        console.error('Error al cargar datos de cursos SENCE:', error);
        setError('Error al cargar datos de cursos SENCE: ' + error.message);
      }
    };
    
    fetchCursosData();
  }, [proyectoId, formData.fecha_inicio, formData.fecha_fin, setError]);
  
  // Manejar búsqueda de cursos
  const handleSearchCursos = () => {
    if (!debouncedSearchQuery.trim()) {
      setFilteredCursos(cursosSence);
      return;
    }
    
    const query = debouncedSearchQuery.toLowerCase();
    const filtered = cursosSence.filter(curso => 
      curso.nombre_curso?.toLowerCase().includes(query) || 
      curso.codigo_curso?.toLowerCase().includes(query)
    );
    
    setFilteredCursos(filtered);
  };
  
  // Actualizar filtros cuando cambia la búsqueda
  useEffect(() => {
    handleSearchCursos();
  }, [debouncedSearchQuery]);
  
  // Manejar apertura del modal de cursos
  const handleOpenCursoModal = (index = -1) => {
    if (index >= 0) {
      // Editando curso existente de la lista cursosAgregados
      const cursoExistente = cursosAgregados[index];
      // Encontrar el curso SENCE correspondiente (ej. por codigo_sence) para obtener valor_por_persona
      const cursoSenceOriginal = cursosSence.find(cs => cs.codigo_curso === cursoExistente.codigo_sence);
      
      setCursoTemp({
        ...cursoExistente,
        curso_sence_id: cursoSenceOriginal ? cursoSenceOriginal.id : '', // Guardar ID SENCE para el Select
        valor_por_persona: cursoSenceOriginal ? (cursoSenceOriginal.valor_imputable_participante || '').toString() : '' // Cargar valor SENCE
      });
      setEditingCursoIndex(index);
    } else {
      // Agregando nuevo curso (resetear cursoTemp)
      setCursoTemp({
        curso_sence_id: '',
        id: null, 
        nombre: '',
        cantidad_participantes: '',
        duracion_horas: '',
        valor_por_persona: '',
        valor_participante: '',
        valor_total: '',
        codigo_sence: '',
        id_sence: '',
        modalidad: '',
        estado_sence: 'pendiente',
        tipo_de_contrato: 'Normal',
        estado_pre_contrato: 'No Aplica'
      });
      setEditingCursoIndex(-1);
    }
    setSearchQuery(''); // Resetear búsqueda en modal
    setOpenCursoModal(true);
  };
  
  // Manejar cierre del modal de cursos
  const handleCloseCursoModal = () => {
    setOpenCursoModal(false);
    setSearchQuery('');
  };
  
  // Manejar cambios en los campos del curso temporal
  const handleCursoTempChange = (e) => {
    const { name, value } = e.target;
    let numericValue = value;

    // Manejar campos numéricos con formato
    if (name === 'cantidad_participantes' || name === 'valor_participante' || name === 'valor_total') {
      const unformattedValue = unformatNumber(value);
      numericValue = unformattedValue === '' ? '' : unformattedValue;
      
      // Validar límites de la base de datos
      if (name === 'valor_total' && parseFloat(numericValue) >= 100000000) {
        setError('El valor total no puede ser mayor a $99,999,999.99');
        return;
      }
      if (name === 'valor_participante' && parseFloat(numericValue) >= 100000000) {
        setError('El valor por participante no puede ser mayor a $99,999,999.99');
        return;
      }
      
      setCursoTemp(prev => ({
        ...prev,
        [name]: numericValue
      }));
    } 
    // Manejar específicamente las horas del curso
    else if (name === 'duracion_horas') {
      // Aceptar sólo valores numéricos y convertir a string
      const horasValue = value === '' ? '' : String(parseInt(value) || 0);
      console.log('Cambiando horas del curso a:', horasValue);
      
      setCursoTemp(prev => ({
        ...prev,
        duracion_horas: horasValue
      }));
    }
    else {
      setCursoTemp(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Recalcular valor total si cambia participantes o valor por participante
    if (name === 'cantidad_participantes' || name === 'valor_participante') {
      const participantes = name === 'cantidad_participantes' 
        ? parseFloat(numericValue) || 0
        : parseFloat(cursoTemp.cantidad_participantes) || 0;
      
      const valorUnitario = name === 'valor_participante'
        ? parseFloat(numericValue) || 0
        : parseFloat(cursoTemp.valor_participante) || 0;
      
      const nuevoValorTotal = participantes * valorUnitario;
      
      // Validar que el valor total no exceda el límite
      if (nuevoValorTotal >= 100000000) {
        setError('El valor total calculado excede el límite permitido de $99,999,999.99');
        return;
      }
      
      setCursoTemp(prev => ({
        ...prev,
        valor_total: nuevoValorTotal.toString()
      }));
    }
    // Recalcular valor por participante si cambia valor total
    else if (name === 'valor_total') {
      const participantes = parseFloat(cursoTemp.cantidad_participantes) || 0;
      if (participantes > 0) {
        const valorTotalNum = parseFloat(numericValue) || 0;
        const nuevoValorParticipante = valorTotalNum / participantes;
        
        // Validar que el valor por participante no exceda el límite
        if (nuevoValorParticipante >= 100000000) {
          setError('El valor por participante calculado excede el límite permitido de $99,999,999.99');
          return;
        }
        
        setCursoTemp(prev => ({
          ...prev,
          valor_participante: nuevoValorParticipante.toString()
        }));
      }
    }

    // Cuando se selecciona un curso SENCE, cargar sus datos
    if (name === 'curso_sence_id' && value) {
      const cursoSenceSeleccionado = cursosSence.find(c => c.id === parseInt(value));
      if (cursoSenceSeleccionado) {
        console.log('Curso SENCE seleccionado:', cursoSenceSeleccionado);
        const participantes = parseFloat(cursoTemp.cantidad_participantes) || 0;
        const valorPersona = parseFloat(cursoSenceSeleccionado.valor_imputable_participante) || 0;
        const valorTotalCalc = participantes * valorPersona;
        
        // Validar que el valor total inicial no exceda el límite
        if (valorTotalCalc >= 100000000) {
          setError('El valor total inicial excede el límite permitido de $99,999,999.99');
          return;
        }

        // Asegurarse de que las horas se capturen correctamente
        // Intentar obtener las horas de diferentes campos posibles
        let horasCurso = cursoSenceSeleccionado.horas;
        if (!horasCurso && horasCurso !== 0) horasCurso = cursoSenceSeleccionado.duracion_horas;
        if (!horasCurso && horasCurso !== 0) horasCurso = cursoSenceSeleccionado.nro_horas;
        
        // Convertir a string para mantener formato consistente
        const horasString = horasCurso ? String(parseInt(horasCurso) || 0) : '0';
        
        console.log('Horas del curso seleccionado:', {
          original: horasCurso,
          convertido: horasString
        });

        setCursoTemp(prev => ({
          ...prev,
          curso_sence_id: value,
          nombre: cursoSenceSeleccionado.nombre_curso || '',
          duracion_horas: horasString, // Usar el valor de horas normalizado
          valor_por_persona: valorPersona.toString(),
          valor_participante: valorPersona.toString(),
          valor_total: valorTotalCalc.toString(),
          codigo_sence: cursoSenceSeleccionado.codigo_curso || '',
          id_sence: cursoSenceSeleccionado.id_sence || '',
          modalidad: cursoSenceSeleccionado.modalidad || ''
        }));
        
        console.log('CursoTemp actualizado con el curso seleccionado:', {
          ...cursoTemp,
          curso_sence_id: value,
          nombre: cursoSenceSeleccionado.nombre_curso || '',
          duracion_horas: horasString, // Loggear horas normalizadas
          // Otros campos...
        });
      }
    }
  };
  
  // Agregar o actualizar un curso a la lista cursosAgregados
  const handleAgregarCurso = () => {
    // Validar formulario
    const { isValid, errors } = validateCursoForm(cursoTemp);
    if (!isValid) {
      const errorMessage = Object.values(errors).join(', ');
      setError(errorMessage);
      return;
    }

    console.log('Agregando/actualizando curso con datos:', cursoTemp);
    
    // Verificar que el curso tenga nombre y horas
    if (!cursoTemp.nombre) {
      console.error('Error: Intentando agregar curso sin nombre');
      setError('El curso debe tener un nombre válido');
      return;
    }
    
    // Verificar las horas del curso
    const duracion_horas = parseInt(cursoTemp.duracion_horas) || 0;
    if (duracion_horas <= 0) {
      console.warn('Advertencia: Curso sin horas definidas o con valor cero');
    }

    // Crear objeto para guardar/actualizar en cursosAgregados
    const cursoParaGuardar = {
      id: editingCursoIndex >= 0 ? cursosAgregados[editingCursoIndex].id : null, // Mantener ID tabla 'cursos' si se edita, null si es nuevo
      curso_sence_id: cursoTemp.curso_sence_id, // Guardar referencia SENCE
      nombre: cursoTemp.nombre, // IMPORTANTE: Usar el nombre del curso seleccionado
      cantidad_participantes: cursoTemp.cantidad_participantes,
      duracion_horas: duracion_horas.toString(), // Convertir a string para consistencia
      valor_participante: cursoTemp.valor_participante,
      valor_total: cursoTemp.valor_total,
      codigo_sence: cursoTemp.codigo_sence,
      id_sence: cursoTemp.id_sence,
      modalidad: cursoTemp.modalidad,
      estado_sence: cursoTemp.estado_sence,
      tipo_de_contrato: cursoTemp.tipo_de_contrato,
      estado_pre_contrato: cursoTemp.estado_pre_contrato,
      // Heredar fechas del proyecto si no están definidas específicamente
      fecha_inicio: cursoTemp.fecha_inicio || formData.fecha_inicio,
      fecha_fin: cursoTemp.fecha_fin || formData.fecha_fin,
    };

    console.log('Curso listo para agregar/actualizar:', cursoParaGuardar);

    if (editingCursoIndex >= 0) {
      // Actualizar curso existente
      const nuevosCursos = [...cursosAgregados];
      nuevosCursos[editingCursoIndex] = cursoParaGuardar;
      setCursosAgregados(nuevosCursos);
      console.log('Curso actualizado en posición', editingCursoIndex);
    } else {
      // Agregar nuevo curso
      setCursosAgregados(prevCursos => {
        const nuevaLista = [...prevCursos, cursoParaGuardar];
        console.log('Nueva lista de cursos después de agregar:', nuevaLista);
        return nuevaLista;
      });
    }

    handleCloseCursoModal();
  };
  
  // Eliminar un curso de la lista
  const handleEliminarCurso = (index) => {
    const nuevosCursos = [...cursosAgregados];
    nuevosCursos.splice(index, 1);
    setCursosAgregados(nuevosCursos);
  };
  
  // Preparar cursos para guardar en el proyecto
  const getCursosParaGuardar = () => {
    console.log('Preparando cursos para guardar. Cursos agregados:', cursosAgregados);
    
    return cursosAgregados.map(curso => {
      // Asegurarse de que los valores numéricos se procesen correctamente
      const valor_participante = parseFloat(unformatNumber(curso.valor_participante)) || 0;
      const cantidad_participantes = parseInt(unformatNumber(curso.cantidad_participantes)) || 0;
      // Convertir duracion_horas a número y luego a string para normalizar
      const duracion_horas = parseInt(curso.duracion_horas) || 0;
      
      // Calcular el valor total correctamente
      const valor_total = valor_participante * cantidad_participantes;

      // Log de depuración para las horas
      console.log(`Preparando curso "${curso.nombre}" para guardar - horas:`, {
        horasOriginal: curso.duracion_horas,
        horasConvertidas: duracion_horas
      });

      // IMPORTANTE: Asegurarse de que el nombre y las horas del curso se mantengan y no se sobrescriban
      const cursoParaEnviar = {
        id: curso.id, // ID de tabla 'cursos' (null si es nuevo)
        nombre: curso.nombre, // Usar el nombre del curso, NO el del proyecto
        cantidad_participantes: cantidad_participantes,
        horas_curso: duracion_horas, // Enviar como número con la clave correcta
        valor_participante: valor_participante,
        valor_total: valor_total,
        codigo_sence: curso.codigo_sence || '',
        id_sence: curso.id_sence || '',
        modalidad: curso.modalidad || 'presencial',
        fecha_inicio: curso.fecha_inicio ? format(new Date(curso.fecha_inicio), 'yyyy-MM-dd') : (formData.fecha_inicio ? format(new Date(formData.fecha_inicio), 'yyyy-MM-dd') : null),
        fecha_fin: curso.fecha_fin ? format(new Date(curso.fecha_fin), 'yyyy-MM-dd') : (formData.fecha_fin ? format(new Date(formData.fecha_fin), 'yyyy-MM-dd') : null),
        estado_sence: curso.estado_sence || 'pendiente',
        tipo_de_contrato: curso.tipo_de_contrato || 'Normal',
        estado_pre_contrato: curso.estado_pre_contrato || 'No Aplica'
      };
      
      console.log('Curso preparado para enviar:', cursoParaEnviar);
      return cursoParaEnviar;
    });
  };
  
  // Calcular el valor total de los ingresos de cursos
  const calcularValorIngresosCursos = () => {
    return cursosAgregados.reduce(
      (total, curso) => total + parseFloat(curso.valor_total || 0), 
      0
    );
  };
  
  return {
    cursosSence,
    modalidades,
    modos,
    cursosAgregados,
    setCursosAgregados,
    cursoTemp,
    openCursoModal,
    editingCursoIndex,
    searchQuery,
    setSearchQuery,
    filteredCursos,
    handleSearchCursos,
    handleOpenCursoModal,
    handleCloseCursoModal,
    handleCursoTempChange,
    handleAgregarCurso,
    handleEliminarCurso,
    getCursosParaGuardar,
    calcularValorIngresosCursos
  };
}; 