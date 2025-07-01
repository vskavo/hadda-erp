import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { proyectoService } from '../../../services';
import { unformatNumber } from '../utils/formatUtils';
import { validateCostoForm } from '../utils/validationUtils';

export const useCostos = (proyectoId, setError, ivaValue, retencionHonorariosValue) => {
  // Estados para costos del proyecto
  const [costos, setCostos] = useState([]);
  const [openCostoModal, setOpenCostoModal] = useState(false);
  const [nuevoCosto, setNuevoCosto] = useState({
    concepto: '',
    tipo_costo: 'recursos_humanos',
    monto: '',
    fecha: new Date(),
    proveedor: '',
    aprobado: false,
    aprobado_por: '',
    aplica_iva: true,
    aplica_honorarios: false,
    observaciones: '',
  });
  // Estado para controlar si estamos editando un costo existente
  const [editingCostoId, setEditingCostoId] = useState(null);
  
  // Cargar costos si estamos editando un proyecto
  useEffect(() => {
    const fetchCostos = async () => {
      if (proyectoId) {
        try {
          const proyectoData = await proyectoService.getProyectoById(proyectoId);
          
          // Si hay costos en el proyecto, cargarlos y asegurar la lógica de exclusividad
          if (proyectoData.CostoProyectos) {
            const costosNormalizados = proyectoData.CostoProyectos.map(costo => {
              // Normalizar valores estrictamente a booleanos
              const honorarios = Boolean(costo.aplica_honorarios);
              
              // Asegurar que aplica_iva sea estrictamente booleano y mutuamente exclusivo con honorarios
              let iva = Boolean(costo.aplica_iva);
              
              // Si aplica_iva no está definido explícitamente, establecerlo a true solo si honorarios es false
              if (costo.aplica_iva === undefined) {
                iva = !honorarios;
              }
              
              // Forzar exclusividad: si honorarios es true, iva debe ser false
              if (honorarios) {
                iva = false;
              }
              
              return {
                ...costo,
                concepto: costo.concepto || costo.descripcion || 'Sin concepto',
                proveedor: costo.proveedor || 'N/A',
                monto: parseFloat(costo.monto), 
                aplica_iva: iva,
                aplica_honorarios: honorarios,
              };
            });
            
            setCostos(costosNormalizados);
          }
        } catch (error) {
          console.error('Error al cargar costos del proyecto:', error);
          setError('Error al cargar costos del proyecto: ' + error.message);
        }
      }
    };
    
    fetchCostos();
  }, [proyectoId, setError]);
  
  // Manejo de costos
  const handleOpenCostoModal = () => {
    setOpenCostoModal(true);
  };
  
  const handleCloseCostoModal = () => {
    setOpenCostoModal(false);
    // Resetear el estado del formulario
    setNuevoCosto({
      concepto: '',
      tipo_costo: 'recursos_humanos',
      monto: '',
      fecha: new Date(),
      proveedor: '',
      aprobado: false,
      aprobado_por: '',
      aplica_iva: true,
      aplica_honorarios: false,
      observaciones: '',
    });
    // Limpiar el ID de edición
    setEditingCostoId(null);
  };
  
  const handleCostoInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'monto') {
      const unformattedValue = unformatNumber(value);
      const numericValue = unformattedValue === '' ? '' : unformattedValue;
      setNuevoCosto({
        ...nuevoCosto,
        [name]: numericValue
      });
    } else {
      setNuevoCosto({
        ...nuevoCosto,
        [name]: value
      });
    }
  };
  
  const handleCostoSwitchChange = (e) => {
    const { name, checked } = e.target;
    
    setNuevoCosto(prev => {
      let updatedCosto = { ...prev, [name]: Boolean(checked) }; // Forzar booleano explícito
      
      // Lógica de exclusividad mutua
      if (checked) {
        if (name === 'aplica_iva') {
          updatedCosto.aplica_honorarios = false;
        }
        if (name === 'aplica_honorarios') {
          updatedCosto.aplica_iva = false;
        }
      }
      
      return updatedCosto;
    });
  };
  
  const handleCostoDateChange = (date) => {
    setNuevoCosto({
      ...nuevoCosto,
      fecha: date
    });
  };
  
  // Manejar la edición de un costo existente
  const handleEditCosto = (costoId) => {
    const costoToEdit = costos.find(c => c.id === costoId);
    if (!costoToEdit) {
      setError('No se encontró el costo a editar');
      return;
    }
    
    // Asignar los valores del costo al state de nuevoCosto
    setNuevoCosto({
      concepto: costoToEdit.concepto || '',
      tipo_costo: costoToEdit.tipo_costo || 'recursos_humanos',
      monto: costoToEdit.monto.toString(),
      fecha: costoToEdit.fecha ? new Date(costoToEdit.fecha) : new Date(),
      proveedor: costoToEdit.proveedor || '',
      aprobado: Boolean(costoToEdit.aprobado),
      aprobado_por: costoToEdit.aprobado_por || '',
      aplica_iva: Boolean(costoToEdit.aplica_iva),
      aplica_honorarios: Boolean(costoToEdit.aplica_honorarios),
      observaciones: costoToEdit.observaciones || '',
    });
    
    // Establecer el ID del costo que estamos editando
    setEditingCostoId(costoId);
    
    // Abrir el modal
    setOpenCostoModal(true);
  };
  
  const handleAgregarCosto = async () => {
    try {
      // Validar costo
      const { isValid, errors } = validateCostoForm(nuevoCosto);
      if (!isValid) {
        const errorMessage = Object.values(errors).join(', ');
        setError(errorMessage);
        return;
      }
      
      // Crear copia de los datos del nuevo costo
      const montoNumerico = parseFloat(unformatNumber(nuevoCosto.monto));
      
      // Re-aplicar lógica de exclusividad
      let finalAplicaIva = Boolean(nuevoCosto.aplica_iva);
      let finalAplicaHonorarios = Boolean(nuevoCosto.aplica_honorarios);
  
      if (finalAplicaHonorarios) {
        finalAplicaIva = false; // Si honorarios está activo, IVA debe estar inactivo
      } else if (finalAplicaIva) {
        finalAplicaHonorarios = false; // Si IVA está activo, honorarios debe estar inactivo
      }
  
      const costoData = {
        concepto: nuevoCosto.concepto.trim(),
        tipo_costo: nuevoCosto.tipo_costo || 'recursos_humanos',
        monto: montoNumerico,
        fecha: nuevoCosto.fecha || new Date(),
        proveedor: (nuevoCosto.proveedor || '').trim(),
        aprobado: nuevoCosto.aprobado || false,
        aprobado_por: nuevoCosto.aprobado_por || '',
        tipo_documento: 'factura',
        incluido_rentabilidad: true,
        aplica_iva: finalAplicaIva,
        aplica_honorarios: finalAplicaHonorarios,
        observaciones: nuevoCosto.observaciones || '',
      };

      // Si estamos editando, actualizar el costo existente
      if (editingCostoId) {
        // Verificar si el costo tiene proyecto_id (existe en la base de datos)
        const costoExistente = costos.find(c => c.id === editingCostoId);
        
        if (costoExistente && costoExistente.proyecto_id && proyectoId) {
          // Actualizar en la base de datos
          await proyectoService.updateCostoProyecto(proyectoId, editingCostoId, costoData);
          
          // Actualizar localmente
          setCostos(prevCostos => prevCostos.map(c => 
            c.id === editingCostoId ? { ...c, ...costoData, id: editingCostoId } : c
          ));
        } else {
          // Solo actualizar localmente
          setCostos(prevCostos => prevCostos.map(c => 
            c.id === editingCostoId ? { ...c, ...costoData } : c
          ));
        }
      } else {
        // Crear un nuevo costo
        const costo = {
          ...costoData,
          id: Date.now(), // ID Temporal para manejo local
        };
        
        setCostos(prevCostos => [...prevCostos, costo]);
      }
      
      handleCloseCostoModal();
    } catch (error) {
      console.error('Error al gestionar costo:', error);
      setError('Error al gestionar costo: ' + (error.response?.data?.message || error.message));
    }
  };
  
  const handleEliminarCosto = async (costoId) => {
    try {
      // Encontrar el costo que se va a eliminar
      const costo = costos.find(c => c.id === costoId);
      
      // Si el costo existe en la base de datos (tiene proyecto_id), eliminarlo mediante la API
      if (costo && costo.proyecto_id && proyectoId) {
        await proyectoService.deleteCostoProyecto(proyectoId, costoId);
      }
      
      // Filtrar el costo de la lista local
      const costosFiltrados = costos.filter(c => c.id !== costoId);
      setCostos(costosFiltrados);
      
    } catch (error) {
      console.error('Error al eliminar costo:', error);
      setError('Error al eliminar costo: ' + (error.response?.data?.message || error.message));
    }
  };
  
  // Cálculos financieros
  const costoTotalBase = useMemo(() => {
    // Gastos Totales (Base con IVA): Suma base de costos con IVA
    return costos
      .filter(costo => costo.aplica_iva === true)
      .reduce((total, costo) => total + parseFloat(costo.monto || 0), 0);
  }, [costos]);

  const totalIVAAplicado = useMemo(() => {
    return costos
      .filter(costo => costo.aplica_iva === true)
      .reduce((total, costo) => total + parseFloat(costo.monto || 0) * (ivaValue / 100), 0);
  }, [costos, ivaValue]);

  const totalCostosHonorariosBase = useMemo(() => {
    return costos
      .filter(costo => costo.aplica_honorarios === true)
      .reduce((total, costo) => total + parseFloat(costo.monto || 0), 0);
  }, [costos]);
  
  const totalRetencionHonorarios = useMemo(() => {
    return costos
      .filter(costo => costo.aplica_honorarios === true)
      .reduce((total, costo) => total + parseFloat(costo.monto || 0) * (retencionHonorariosValue / 100), 0);
  }, [costos, retencionHonorariosValue]);
  
  // Preparar costos para guardar en el proyecto
  const getCostosParaGuardar = async (nuevoProyectoId = null) => {
    const targetId = nuevoProyectoId || proyectoId;
    
    if (!targetId) {
      console.error('No se puede guardar costos sin un ID de proyecto');
      return;
    }
    
    // Para proyectos existentes, guardar solo los nuevos costos
    if (proyectoId) {
      for (const costo of costos.filter(c => !c.proyecto_id)) {
        await proyectoService.addCostoProyecto(proyectoId, {
          concepto: costo.concepto,
          tipo_costo: costo.tipo_costo,
          monto: parseFloat(costo.monto),
          fecha: costo.fecha,
          proveedor: costo.proveedor,
          aprobado: costo.aprobado,
          aprobado_por: costo.aprobado_por,
          tipo_documento: 'factura',
          incluido_rentabilidad: true,
          aplica_iva: costo.aplica_iva,
          aplica_honorarios: costo.aplica_honorarios,
          observaciones: costo.observaciones || '',
        });
      }
    } 
    // Para proyectos nuevos, guardar todos los costos
    else if (nuevoProyectoId) {
      for (const costo of costos) {
        await proyectoService.addCostoProyecto(nuevoProyectoId, {
          concepto: costo.concepto,
          tipo_costo: costo.tipo_costo,
          monto: parseFloat(costo.monto),
          fecha: costo.fecha,
          proveedor: costo.proveedor,
          aprobado: costo.aprobado,
          aprobado_por: costo.aprobado_por,
          tipo_documento: 'factura',
          incluido_rentabilidad: true,
          aplica_iva: costo.aplica_iva,
          aplica_honorarios: costo.aplica_honorarios,
          observaciones: costo.observaciones || '',
        });
      }
    }
  };
  
  return {
    costos,
    openCostoModal,
    nuevoCosto,
    editingCostoId,
    costoTotalBase,
    totalIVAAplicado,
    totalCostosHonorariosBase,
    totalRetencionHonorarios,
    handleOpenCostoModal,
    handleCloseCostoModal,
    handleCostoInputChange,
    handleCostoSwitchChange,
    handleCostoDateChange,
    handleEditCosto,
    handleAgregarCosto,
    handleEliminarCosto,
    getCostosParaGuardar
  };
}; 