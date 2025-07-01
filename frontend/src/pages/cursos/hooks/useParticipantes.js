import { useState, useEffect } from 'react';
import axios from 'axios';
import Papa from 'papaparse';

/**
 * Hook para manejar la lógica de gestión de participantes en un curso.
 * - Añadir, editar, retirar, importar participantes, etc.
 * - No debe contener lógica de UI.
 */
export function useParticipantes({ cursoId, onUpdateSuccess }) {
  // Estados principales
  const [participantes, setParticipantes] = useState([]);
  const [loadingParticipantes, setLoadingParticipantes] = useState(false);
  const [errorParticipantes, setErrorParticipantes] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Estados para diálogo de participante
  const [openParticipanteDialog, setOpenParticipanteDialog] = useState(false);
  const [editingParticipante, setEditingParticipante] = useState(null);
  const [newParticipante, setNewParticipante] = useState({
    nombre: '',
    apellido: '',
    rut: '',
    email: '',
    telefono: ''
  });
  
  // Estados para importación CSV
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [importError, setImportError] = useState('');
  
  // Estado para participantes eliminados
  const [participantesToDelete, setParticipantesToDelete] = useState([]);
  
  // Efecto para cargar participantes al montar el componente o cuando cambia cursoId
  useEffect(() => {
    if (cursoId) {
      loadParticipantes();
    }
  }, [cursoId]);
  
  // Cargar participantes
  const loadParticipantes = async () => {
    if (!cursoId) return;
    
    setLoadingParticipantes(true);
    try {
      const response = await axios.get(`/api/cursos/${cursoId}`);
      if (response.data.success) {
        setParticipantes(response.data.data.Participantes || []);
      }
    } catch (err) {
      console.error('Error al cargar participantes:', err);
      setErrorParticipantes('Error al cargar participantes: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoadingParticipantes(false);
    }
  };
  
  // Manejar cambios en el formulario de nuevo participante
  const handleParticipanteChange = (e) => {
    const { name, value } = e.target;
    setNewParticipante({
      ...newParticipante,
      [name]: value
    });
  };
  
  // Abrir diálogo para añadir/editar participante
  const handleOpenParticipanteDialog = (participante = null) => {
    if (participante) {
      setEditingParticipante(participante);
      setNewParticipante({
        nombre: participante.nombre || '',
        apellido: participante.apellido || '',
        rut: participante.rut || '',
        email: participante.email || '',
        telefono: participante.telefono || ''
      });
    } else {
      setEditingParticipante(null);
      setNewParticipante({
        nombre: '',
        apellido: '',
        rut: '',
        email: '',
        telefono: ''
      });
    }
    setOpenParticipanteDialog(true);
  };
  
  // Cerrar diálogo de participante
  const handleCloseParticipanteDialog = () => {
    setOpenParticipanteDialog(false);
    setEditingParticipante(null);
    setErrorParticipantes('');
  };
  
  // Eliminar/retirar participante
  const handleDeleteParticipante = async (participante) => {
    if (!participante || !participante.id) {
      setErrorParticipantes('Participante no válido');
      return;
    }

    if (window.confirm(`¿Está seguro de eliminar al participante ${participante.nombre} ${participante.apellido}?`)) {
      try {
        // En lugar de eliminar al participante, lo marcamos como inactivo o retirado
        const updateResponse = await axios.put(`/api/participantes/${participante.id}`, {
          ...participante,
          estado: 'retirado', // Marcamos como retirado en lugar de eliminar físicamente
          curso_id: cursoId
        });
        
        if (updateResponse.data && updateResponse.data.success) {
          // Actualizar la lista local de participantes
          setParticipantes(prev => prev.filter(p => p.id !== participante.id));
          
          // Añadir a la lista de participantes eliminados
          setParticipantesToDelete(prev => [...prev, participante.id]);
          
          setSuccessMessage('Participante retirado con éxito');
          
          // Notificar al componente padre para actualizar contadores
          if (onUpdateSuccess) {
            onUpdateSuccess({
              type: 'delete',
              participante
            });
          }
          
          // Recargar datos para mantener actualizada la información
          loadParticipantes();
        } else {
          setErrorParticipantes('Error al retirar el participante: La operación no fue exitosa');
        }
      } catch (err) {
        console.error('Error completo al retirar participante:', err);
        setErrorParticipantes('Error al retirar el participante: ' + (err.response?.data?.message || err.message));
      }
    }
  };
  
  // Guardar nuevo participante o actualizar existente
  const handleSaveParticipante = async (formData) => {
    if (!cursoId) {
      setErrorParticipantes('No hay un curso seleccionado');
      return;
    }
    
    try {
      if (!formData.nombre || !formData.apellido || !formData.rut) {
        setErrorParticipantes('Nombre, apellido y RUT del participante son obligatorios');
        return;
      }
      
      const data = {
        ...formData,
        email: formData.email?.trim() === '' ? null : formData.email,
        telefono: formData.telefono?.trim() === '' ? null : formData.telefono,
        curso_id: cursoId
      };
      
      if (editingParticipante) {
        // Actualizar participante existente
        const response = await axios.put(`/api/participantes/${editingParticipante.id}`, data);
        
        if (response.data && response.data.success) {
          // Actualizar la lista de participantes
          setParticipantes(prev => 
            prev.map(p => p.id === editingParticipante.id ? response.data.data : p)
          );
          setSuccessMessage('Participante actualizado con éxito');
          
          // Notificar al componente padre
          if (onUpdateSuccess) {
            onUpdateSuccess({
              type: 'update',
              participante: response.data.data
            });
          }
        } else {
          setErrorParticipantes('Error al actualizar el participante: La operación no fue exitosa');
        }
      } else {
        // Añadir nuevo participante
        const response = await axios.post('/api/participantes', data);
        
        if (response.data && response.data.success) {
          // Actualizar la lista de participantes
          setParticipantes(prev => [...prev, response.data.data]);
          setSuccessMessage('Participante añadido con éxito');
          
          // Notificar al componente padre
          if (onUpdateSuccess) {
            onUpdateSuccess({
              type: 'add',
              participante: response.data.data
            });
          }
        } else {
          setErrorParticipantes('Error al añadir el participante: La operación no fue exitosa');
        }
      }
      
      // Cerrar el diálogo
      handleCloseParticipanteDialog();
      
      // Recargar datos para mantener actualizada la información
      loadParticipantes();
    } catch (err) {
      console.error('Error completo al guardar participante:', err);
      setErrorParticipantes('Error al guardar el participante: ' + (err.response?.data?.message || err.message));
    }
  };
  
  // Importar participantes desde CSV
  const handleImportCSV = (file) => {
    if (!file || !cursoId) return;
    
    setImportLoading(true);
    setImportError('');
    setImportResult(null);
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          // Enviar los datos al backend
          const response = await axios.post(`/api/participantes/importar/curso/${cursoId}`, {
            participantes: results.data
          });
          
          setImportResult(response.data.data);
          setSuccessMessage(response.data.message || 'Importación completada');
          
          // Notificar al componente padre
          if (onUpdateSuccess) {
            onUpdateSuccess({
              type: 'import',
              result: response.data.data
            });
          }
          
          // Recargar participantes
          loadParticipantes();
        } catch (err) {
          setImportError('Error al importar participantes: ' + (err.response?.data?.message || err.message));
        } finally {
          setImportLoading(false);
        }
      },
      error: (err) => {
        setImportError('Error al leer el archivo CSV: ' + err.message);
        setImportLoading(false);
      }
    });
  };
  
  // Reactivar participante retirado
  const handleReactivarParticipante = async (participante) => {
    if (!participante || !participante.id) {
      setErrorParticipantes('Participante no válido');
      return;
    }

    if (window.confirm(`¿Está seguro de reactivar al participante ${participante.nombre} ${participante.apellido}?`)) {
      try {
        const updateResponse = await axios.put(`/api/participantes/${participante.id}`, {
          ...participante,
          estado: 'activo',
          curso_id: cursoId
        });
        
        if (updateResponse.data && updateResponse.data.success) {
          setSuccessMessage('Participante reactivado con éxito');
          
          // Notificar al componente padre
          if (onUpdateSuccess) {
            onUpdateSuccess({
              type: 'reactivate',
              participante: updateResponse.data.data
            });
          }
          
          // Recargar datos para mantener actualizada la información
          loadParticipantes();
        } else {
          setErrorParticipantes('Error al reactivar el participante: La operación no fue exitosa');
        }
      } catch (err) {
        setErrorParticipantes('Error al reactivar el participante: ' + (err.response?.data?.message || err.message));
      }
    }
  };
  
  // Obtener participantes activos y retirados
  const getParticipantesActivos = () => participantes.filter(p => p.estado !== 'retirado');
  const getParticipantesRetirados = () => participantes.filter(p => p.estado === 'retirado');

  // Limpiar mensajes y estados
  const clearMessages = () => {
    setErrorParticipantes('');
    setSuccessMessage('');
    setImportError('');
    setImportResult(null);
  };

  // Cambiar el estado del certificado
  const handleCertificadoChange = async (participante, checked) => {
    if (!participante || !participante.id) return;
    try {
      const response = await axios.put(`/api/participantes/${participante.id}`, {
        ...participante,
        certificado: checked
      });
      if (response.data && response.data.success) {
        setParticipantes(prev => prev.map(p => p.id === participante.id ? { ...p, certificado: checked } : p));
        setSuccessMessage('Estado de certificado actualizado');
      } else {
        setErrorParticipantes('No se pudo actualizar el estado del certificado');
      }
    } catch (err) {
      setErrorParticipantes('Error al actualizar el certificado: ' + (err.response?.data?.message || err.message));
    }
  };

  // Cambiar el estado de todos los certificados de participantes activos
  const handleCertificadoMasivoChange = async (checked) => {
    if (!cursoId) return;
    try {
      const response = await axios.patch(`/api/cursos/${cursoId}/participantes/certificados-masivo`, { certificado: checked });
      if (response.data && response.data.success) {
        setParticipantes(prev => prev.map(p => p.estado !== 'retirado' ? { ...p, certificado: checked } : p));
        setSuccessMessage('Certificados actualizados masivamente');
      } else {
        setErrorParticipantes('No se pudo actualizar el estado de los certificados');
      }
    } catch (err) {
      setErrorParticipantes('Error al actualizar certificados masivos: ' + (err.response?.data?.message || err.message));
    }
  };

  return {
    participantes,
    participantesActivos: getParticipantesActivos(),
    participantesRetirados: getParticipantesRetirados(),
    loadingParticipantes,
    errorParticipantes,
    setErrorParticipantes,
    successMessage,
    setSuccessMessage,
    openParticipanteDialog,
    editingParticipante,
    newParticipante,
    importLoading,
    importResult,
    importError,
    participantesToDelete,
    loadParticipantes,
    handleParticipanteChange,
    handleOpenParticipanteDialog,
    handleCloseParticipanteDialog,
    handleDeleteParticipante,
    handleSaveParticipante,
    handleImportCSV,
    handleReactivarParticipante,
    clearMessages,
    handleCertificadoChange,
    handleCertificadoMasivoChange
  };
} 