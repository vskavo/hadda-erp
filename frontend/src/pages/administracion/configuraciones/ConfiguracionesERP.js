import React, { useState, useEffect } from 'react';
import { 
    Box, 
    Typography, 
    Paper, 
    Grid, 
    TextField, 
    Button, 
    CircularProgress, 
    Alert,
    FormControl, // Para agrupar label y input si es necesario
    InputAdornment, // Para unidades como %
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Tooltip,
    Skeleton,
    Autocomplete,
    InputLabel,
    Select,
    MenuItem,
    Tabs,
    Tab
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save'; // Para el modo edición
import CancelIcon from '@mui/icons-material/Cancel'; // Para el modo edición
import settingService from '../../../services/settingService';
import comisionService from '../../../services/comisionService'; // Importar nuevo servicio
import rolesService from '../../../services/rolesService'; // Importar servicio de roles
import otecDataService from '../../../services/otecDataService';
import usuariosSenceService from '../../../services/usuariosSenceService';
import usuarioSiiService from '../../../services/usuarioSiiService';

// Claves de las configuraciones que queremos manejar
const CONFIG_KEYS = [
    'retencion_honorarios',
    'IVA',
    'ppm',
    'gastos_administracion',
    'ahorro_caja'
];

const ConfiguracionesERP = () => {
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    // Estado para comisiones
    const [comisiones, setComisiones] = useState([]);
    const [loadingComisiones, setLoadingComisiones] = useState(true);
    const [errorComisiones, setErrorComisiones] = useState(null);
    const [newRolId, setNewRolId] = useState('');
    const [newMargenDesde, setNewMargenDesde] = useState('');
    const [newMargenHasta, setNewMargenHasta] = useState('');
    const [newComisionValor, setNewComisionValor] = useState('');
    const [isAddingComision, setIsAddingComision] = useState(false);
    const [editMode, setEditMode] = useState({ active: false, id: null, rol_id: '', desde: '', hasta: '', comision: '' });
    const [isDeletingComision, setIsDeletingComision] = useState(null);
    const [isSavingComision, setIsSavingComision] = useState(null);

    // Estado para lista de roles
    const [roles, setRoles] = useState([]);
    const [loadingRoles, setLoadingRoles] = useState(true);

    // Nuevo estado para el filtro de rol
    const [filtroRolId, setFiltroRolId] = useState('');

    // Estado para OTEC Data
    const [otecDataList, setOtecDataList] = useState([]);
    const [loadingOtec, setLoadingOtec] = useState(true);
    const [errorOtec, setErrorOtec] = useState(null);
    const [newOtec, setNewOtec] = useState({ rut: '', razon_social_otec: '', nombre_otec: '' });
    const [isAddingOtec, setIsAddingOtec] = useState(false);
    const [isDeletingOtec, setIsDeletingOtec] = useState(null);

    // Estado para Usuarios Sence
    const [usuariosSenceList, setUsuariosSenceList] = useState([]);
    const [loadingUsuariosSence, setLoadingUsuariosSence] = useState(true);
    const [errorUsuariosSence, setErrorUsuariosSence] = useState(null);
    const [newUsuarioSence, setNewUsuarioSence] = useState({ rut: '', nombre: '', clave_unica: '' });
    const [isAddingUsuarioSence, setIsAddingUsuarioSence] = useState(false);
    const [isDeletingUsuarioSence, setIsDeletingUsuarioSence] = useState(null);

    // Estado para Usuarios Servicio de Impuestos Internos
    const [usuariosSiiList, setUsuariosSiiList] = useState([]);
    const [loadingUsuariosSii, setLoadingUsuariosSii] = useState(true);
    const [errorUsuariosSii, setErrorUsuariosSii] = useState(null);
    const [newUsuarioSii, setNewUsuarioSii] = useState({ rut: '', nombre: '', clave_unica: '' });
    const [isAddingUsuarioSii, setIsAddingUsuarioSii] = useState(false);
    const [isDeletingUsuarioSii, setIsDeletingUsuarioSii] = useState(null);

    const [tabIndex, setTabIndex] = useState(0);
    const handleTabChange = (event, newValue) => setTabIndex(newValue);

    const [editUsuarioSence, setEditUsuarioSence] = useState({ rut: null, nombre: '', clave_unica: '' });
    const [isSavingUsuarioSence, setIsSavingUsuarioSence] = useState(null);

    const [editUsuarioSii, setEditUsuarioSii] = useState({ rut: null, nombre: '', clave_unica: '' });
    const [isSavingUsuarioSii, setIsSavingUsuarioSii] = useState(null);

    useEffect(() => {
        const fetchSettings = async () => {
            setLoading(true);
            setError(null);
            try {
                // Opción 1: Cargar todas las configuraciones y filtrar
                const allSettingsData = await settingService.getSettings();
                const relevantSettings = allSettingsData.filter(s => CONFIG_KEYS.includes(s.key));
                
                // Convertir a un objeto para fácil acceso: { key: {value, description, type...} }
                const settingsMap = relevantSettings.reduce((acc, setting) => {
                    acc[setting.key] = setting;
                    return acc;
                }, {});
                
                // Inicializar si alguna clave falta (aunque no debería si existen en DB)
                CONFIG_KEYS.forEach(key => {
                    if (!settingsMap[key]) {
                        console.warn(`Configuración "${key}" no encontrada en la DB.`);
                        // Podríamos inicializarla con valores por defecto si es necesario
                        // settingsMap[key] = { key, value: '0', description: 'Valor no encontrado', type: 'number', category: 'erp' };
                    }
                });

                setSettings(settingsMap);

            } catch (err) {
                console.error("Error al cargar configuraciones:", err);
                setError('Error al cargar las configuraciones. Inténtalo de nuevo.');
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, []);

    // Cargar lista de roles
    useEffect(() => {
        const fetchRoles = async () => {
            setLoadingRoles(true);
            try {
                const rolesData = await rolesService.getRoles();
                // Filtrar roles de sistema si no son relevantes para comisiones
                setRoles(rolesData.filter(r => !r.sistema) || []); 
            } catch (error) {
                console.error("Error al cargar roles:", error);
                // Podríamos mostrar un error específico para roles
                setErrorComisiones('Error al cargar lista de roles necesarios.'); 
            } finally {
                setLoadingRoles(false);
            }
        };
        fetchRoles();
    }, []);

    // Cargar comisiones (ahora depende de roles cargados para mostrar nombre)
    const fetchComisiones = async () => {
        setLoadingComisiones(true);
        setErrorComisiones(null);
        try {
            const data = await comisionService.getComisiones();
            // SIMPLIFICADO: Asumir que el backend ya incluye el objeto Rol
            setComisiones(data || []); 
        } catch (err) {
            console.error("Error al cargar rangos de comisión:", err);
            setErrorComisiones('Error al cargar los rangos de comisión.');
        } finally {
            setLoadingComisiones(false);
        }
    };

    useEffect(() => {
        // Solo cargar comisiones una vez que los roles estén disponibles (o si la carga de roles falló)
        if (!loadingRoles) { 
          fetchComisiones();
        }
    }, [loadingRoles]); // Dependencia de loadingRoles

    // Cargar datos OTEC
    useEffect(() => {
        const fetchOtecData = async () => {
            setLoadingOtec(true);
            setErrorOtec(null);
            try {
                const data = await otecDataService.getOtecData();
                setOtecDataList(data);
            } catch (err) {
                setErrorOtec('Error al cargar los datos OTEC.');
            } finally {
                setLoadingOtec(false);
            }
        };
        fetchOtecData();
    }, []);

    // Cargar usuarios Sence
    useEffect(() => {
        const fetchUsuariosSence = async () => {
            setLoadingUsuariosSence(true);
            setErrorUsuariosSence(null);
            try {
                const data = await usuariosSenceService.getUsuariosSence();
                setUsuariosSenceList(data);
            } catch (err) {
                setErrorUsuariosSence('Error al cargar los usuarios Sence.');
            } finally {
                setLoadingUsuariosSence(false);
            }
        };
        fetchUsuariosSence();
    }, []);

    // Cargar usuarios Servicio de Impuestos Internos
    useEffect(() => {
        const fetchUsuariosSii = async () => {
            setLoadingUsuariosSii(true);
            setErrorUsuariosSii(null);
            try {
                const data = await usuarioSiiService.getUsuariosSii();
                setUsuariosSiiList(data);
            } catch (err) {
                setErrorUsuariosSii('Error al cargar los usuarios Servicio de Impuestos Internos.');
            } finally {
                setLoadingUsuariosSii(false);
            }
        };
        fetchUsuariosSii();
    }, []);

    const handleChange = (key, value) => {
        setSettings(prev => ({
            ...prev,
            [key]: { ...prev[key], value: value }
        }));
        // Limpiar mensajes al empezar a editar
        setError(null);
        setSuccessMessage('');
    };

    const handleSave = async () => {
        setIsSaving(true);
        setError(null);
        setSuccessMessage('');
        let hasError = false;

        // Iterar sobre las claves que tenemos en el estado y guardarlas
        for (const key of Object.keys(settings)) {
            try {
                // Validar que el valor no esté vacío (podría añadirse validación numérica)
                if (settings[key].value.trim() === '') {
                    setError(`El valor para "${settings[key].description || key}" no puede estar vacío.`);
                    hasError = true;
                    break; // Detener el guardado si hay un error
                }
                
                // Asegurarse de que el tipo es correcto (ej: número para valores numéricos)
                if (settings[key].type === 'number') {
                  if (isNaN(parseFloat(settings[key].value))) {
                    setError(`El valor para "${settings[key].description || key}" debe ser un número válido.`);
                    hasError = true;
                    break;
                  }
                }

                // Solo enviar la actualización si el setting existe (puede que se haya filtrado)
                if(settings[key].id) { // Asumiendo que los settings cargados tienen id
                  await settingService.updateSetting(key, {
                      value: settings[key].value,
                      // Podríamos enviar otros campos si fueran editables
                      // description: settings[key].description,
                      // type: settings[key].type,
                  });
                } else {
                   console.warn(`Intentando guardar la configuración "${key}" que no fue cargada inicialmente.`);
                   // O podríamos intentar crearla si no existe: await settingService.createSetting(settings[key]);
                }
            } catch (err) {
                console.error(`Error al guardar configuración ${key}:`, err);
                setError(`Error al guardar "${settings[key].description || key}". ${err.message || ''}`);
                hasError = true;
                break; // Detener en el primer error
            }
        }

        setIsSaving(false);
        if (!hasError) {
            setSuccessMessage('Configuraciones guardadas exitosamente.');
        }
    };

    // --- Actualizar Manejadores para Rangos de Comisión ---

    const handleAddComision = async () => {
        // Validar nuevos campos
        if (!newRolId || !newMargenDesde || !newMargenHasta || !newComisionValor) {
            setErrorComisiones("Debe completar todos los campos: Rol, Margen Desde/Hasta y Comisión.");
            return;
        }
        if (isNaN(parseFloat(newMargenDesde)) || isNaN(parseFloat(newMargenHasta)) || isNaN(parseFloat(newComisionValor))) {
             setErrorComisiones("Los márgenes y la comisión deben ser números válidos.");
            return;
        }
         if (parseFloat(newMargenDesde) >= parseFloat(newMargenHasta)) {
            setErrorComisiones('El margen "desde" debe ser menor que el margen "hasta".');
            return;
        }
        if (parseFloat(newComisionValor) < 0) {
            setErrorComisiones('La comisión no puede ser negativa.');
            return;
        }

        setIsAddingComision(true);
        setErrorComisiones(null);
        try {
            // Enviar todos los campos al servicio
            await comisionService.createComision({ 
                rol_id: parseInt(newRolId),
                margen_desde: parseFloat(newMargenDesde),
                margen_hasta: parseFloat(newMargenHasta),
                comision: parseFloat(newComisionValor)
            });
            // Resetear formulario
            setNewRolId('');
            setNewMargenDesde('');
            setNewMargenHasta('');
            setNewComisionValor('');
            await fetchComisiones(); // Recargar la lista
        } catch (err) {
            console.error("Error al añadir rango de comisión:", err);
            setErrorComisiones(err.message || 'Error al añadir el rango.');
        } finally {
            setIsAddingComision(false);
        }
    };

    const handleDeleteComision = async (id) => {
        // Opcional: Añadir confirmación
        // if (!window.confirm("¿Está seguro de eliminar este rango?")) return;
        
        setIsDeletingComision(id); // Mostrar spinner en este botón
        setErrorComisiones(null);
        try {
            await comisionService.deleteComision(id);
            await fetchComisiones(); // Recargar la lista
        } catch (err) {
            console.error("Error al eliminar rango de comisión:", err);
            setErrorComisiones(err.message || 'Error al eliminar el rango.');
        } finally {
            setIsDeletingComision(null);
        }
    };

    const handleEditClick = (comision) => {
        setEditMode({ 
            active: true, 
            id: comision.margen_id, 
            rol_id: comision.rol_id,
            desde: comision.margen_desde,
            hasta: comision.margen_hasta,
            comision: comision.comision
        });
        setErrorComisiones(null);
    };

    const handleCancelEdit = () => {
        setEditMode({ active: false, id: null, rol_id: '', desde: '', hasta: '', comision: '' });
        setErrorComisiones(null);
    };

    const handleSaveEdit = async () => {
        // Validar campos en modo edición
        if (!editMode.rol_id || !editMode.desde || !editMode.hasta || !editMode.comision) {
            setErrorComisiones("Todos los campos (Rol, Márgenes, Comisión) son requeridos.");
            return;
        }
         if (isNaN(parseFloat(editMode.desde)) || isNaN(parseFloat(editMode.hasta)) || isNaN(parseFloat(editMode.comision)) || isNaN(parseInt(editMode.rol_id)) ) {
             setErrorComisiones("Los márgenes, comisión y rol deben ser válidos.");
            return;
        }
        if (parseFloat(editMode.desde) >= parseFloat(editMode.hasta)) {
            setErrorComisiones('El margen "desde" debe ser menor que el margen "hasta".');
            return;
        }
         if (parseFloat(editMode.comision) < 0) {
            setErrorComisiones('La comisión no puede ser negativa.');
            return;
        }
        
        setIsSavingComision(editMode.id);
        setErrorComisiones(null);
        try {
             // Enviar todos los campos actualizados
             await comisionService.updateComision(editMode.id, { 
                rol_id: parseInt(editMode.rol_id),
                margen_desde: parseFloat(editMode.desde),
                margen_hasta: parseFloat(editMode.hasta),
                comision: parseFloat(editMode.comision)
            });
            handleCancelEdit(); 
            await fetchComisiones(); // Recargar la lista
        } catch (err) {
             console.error("Error al guardar edición del rango de comisión:", err);
            setErrorComisiones(err.message || 'Error al guardar cambios en el rango.');
        } finally {
            setIsSavingComision(null);
        }
    };

    const handleChangeOtec = (e) => {
        setNewOtec({ ...newOtec, [e.target.name]: e.target.value });
        setErrorOtec(null);
    };

    const handleAddOtec = async () => {
        if (!newOtec.rut || !newOtec.razon_social_otec || !newOtec.nombre_otec) {
            setErrorOtec('Todos los campos son obligatorios.');
            return;
        }
        setIsAddingOtec(true);
        setErrorOtec(null);
        try {
            await otecDataService.createOtecData(newOtec);
            setNewOtec({ rut: '', razon_social_otec: '', nombre_otec: '' });
            const data = await otecDataService.getOtecData();
            setOtecDataList(data);
        } catch (err) {
            setErrorOtec(err.message || 'Error al agregar el dato OTEC.');
        } finally {
            setIsAddingOtec(false);
        }
    };

    const handleDeleteOtec = async (rut) => {
        setIsDeletingOtec(rut);
        setErrorOtec(null);
        try {
            await otecDataService.deleteOtecData(rut);
            setOtecDataList(otecDataList.filter(item => item.rut !== rut));
        } catch (err) {
            setErrorOtec(err.message || 'Error al eliminar el dato OTEC.');
        } finally {
            setIsDeletingOtec(null);
        }
    };

    const handleChangeUsuarioSence = (e) => {
        setNewUsuarioSence({ ...newUsuarioSence, [e.target.name]: e.target.value });
        setErrorUsuariosSence(null);
    };

    const handleChangeUsuarioSii = (e) => {
        setNewUsuarioSii({ ...newUsuarioSii, [e.target.name]: e.target.value });
        setErrorUsuariosSii(null);
    };

    const handleAddUsuarioSence = async () => {
        if (!newUsuarioSence.rut || !newUsuarioSence.nombre || !newUsuarioSence.clave_unica) {
            setErrorUsuariosSence('Todos los campos son obligatorios.');
            return;
        }
        setIsAddingUsuarioSence(true);
        setErrorUsuariosSence(null);
        try {
            await usuariosSenceService.createUsuarioSence(newUsuarioSence);
            setNewUsuarioSence({ rut: '', nombre: '', clave_unica: '' });
            const data = await usuariosSenceService.getUsuariosSence();
            setUsuariosSenceList(data);
        } catch (err) {
            setErrorUsuariosSence(err.message || 'Error al agregar el usuario Sence.');
        } finally {
            setIsAddingUsuarioSence(false);
        }
    };

    const handleDeleteUsuarioSence = async (rut) => {
        setIsDeletingUsuarioSence(rut);
        setErrorUsuariosSence(null);
        try {
            await usuariosSenceService.deleteUsuarioSence(rut);
            setUsuariosSenceList(usuariosSenceList.filter(item => item.rut !== rut));
        } catch (err) {
            setErrorUsuariosSence(err.message || 'Error al eliminar el usuario Sence.');
        } finally {
            setIsDeletingUsuarioSence(null);
        }
    };

    const handleEditUsuarioSenceClick = (usuario) => {
        setEditUsuarioSence({ rut: usuario.rut, nombre: usuario.nombre, clave_unica: usuario.clave_unica });
        setErrorUsuariosSence(null);
    };

    const handleCancelEditUsuarioSence = () => {
        setEditUsuarioSence({ rut: null, nombre: '', clave_unica: '' });
        setErrorUsuariosSence(null);
    };

    const handleEditUsuarioSenceChange = (e) => {
        setEditUsuarioSence({ ...editUsuarioSence, [e.target.name]: e.target.value });
    };

    const handleSaveEditUsuarioSence = async () => {
        if (!editUsuarioSence.nombre || !editUsuarioSence.clave_unica) {
            setErrorUsuariosSence('Todos los campos son obligatorios.');
            return;
        }
        setIsSavingUsuarioSence(editUsuarioSence.rut);
        setErrorUsuariosSence(null);
        try {
            await usuariosSenceService.updateUsuarioSence(editUsuarioSence.rut, {
                nombre: editUsuarioSence.nombre,
                clave_unica: editUsuarioSence.clave_unica
            });
            setEditUsuarioSence({ rut: null, nombre: '', clave_unica: '' });
            const data = await usuariosSenceService.getUsuariosSence();
            setUsuariosSenceList(data);
        } catch (err) {
            setErrorUsuariosSence(err.message || 'Error al actualizar el usuario Sence.');
        } finally {
            setIsSavingUsuarioSence(null);
        }
    };

    const handleAddUsuarioSii = async () => {
        if (!newUsuarioSii.rut || !newUsuarioSii.nombre || !newUsuarioSii.clave_unica) {
            setErrorUsuariosSii('Todos los campos son obligatorios.');
            return;
        }
        setIsAddingUsuarioSii(true);
        setErrorUsuariosSii(null);
        try {
            await usuarioSiiService.createUsuarioSii(newUsuarioSii);
            setNewUsuarioSii({ rut: '', nombre: '', clave_unica: '' });
            const data = await usuarioSiiService.getUsuariosSii();
            setUsuariosSiiList(data);
        } catch (err) {
            setErrorUsuariosSii(err.message || 'Error al agregar el usuario Servicio de Impuestos Internos.');
        } finally {
            setIsAddingUsuarioSii(false);
        }
    };

    const handleDeleteUsuarioSii = async (rut) => {
        setIsDeletingUsuarioSii(rut);
        setErrorUsuariosSii(null);
        try {
            await usuarioSiiService.deleteUsuarioSii(rut);
            setUsuariosSiiList(usuariosSiiList.filter(item => item.rut !== rut));
        } catch (err) {
            setErrorUsuariosSii(err.message || 'Error al eliminar el usuario Servicio de Impuestos Internos.');
        } finally {
            setIsDeletingUsuarioSii(null);
        }
    };

    const handleEditUsuarioSiiClick = (usuario) => {
        setEditUsuarioSii({ rut: usuario.rut, nombre: usuario.nombre, clave_unica: usuario.clave_unica });
        setErrorUsuariosSii(null);
    };

    const handleCancelEditUsuarioSii = () => {
        setEditUsuarioSii({ rut: null, nombre: '', clave_unica: '' });
        setErrorUsuariosSii(null);
    };

    const handleEditUsuarioSiiChange = (e) => {
        setEditUsuarioSii({ ...editUsuarioSii, [e.target.name]: e.target.value });
    };

    const handleSaveEditUsuarioSii = async () => {
        if (!editUsuarioSii.nombre || !editUsuarioSii.clave_unica) {
            setErrorUsuariosSii('Todos los campos son obligatorios.');
            return;
        }
        setIsSavingUsuarioSii(editUsuarioSii.rut);
        setErrorUsuariosSii(null);
        try {
            await usuarioSiiService.updateUsuarioSii(editUsuarioSii.rut, {
                nombre: editUsuarioSii.nombre,
                clave_unica: editUsuarioSii.clave_unica
            });
            setEditUsuarioSii({ rut: null, nombre: '', clave_unica: '' });
            const data = await usuarioSiiService.getUsuariosSii();
            setUsuariosSiiList(data);
        } catch (err) {
            setErrorUsuariosSii(err.message || 'Error al actualizar el usuario Servicio de Impuestos Internos.');
        } finally {
            setIsSavingUsuarioSii(null);
        }
    };

    if (loading || loadingRoles || loadingComisiones || loadingOtec || loadingUsuariosSence || loadingUsuariosSii) { 
        return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
    }

    return (
        <Paper sx={{ p: 3, maxWidth: 'lg', margin: 'auto', mt: 4 }}>
            <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
                Configuraciones Generales del ERP
            </Typography>
            <Tabs value={tabIndex} onChange={handleTabChange} sx={{ mb: 3 }}>
                <Tab label="Configuraciones Generales" />
                <Tab label="Información OTEC" />
                <Tab label="Rangos de Comisión" />
                <Tab label="Usuarios Sence" />
                <Tab label="Usuarios Servicio de Impuestos Internos" />
            </Tabs>
            {tabIndex === 0 && (
                <Box>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}
                    <Box component="form" noValidate autoComplete="off">
                        <Grid container spacing={3}>
                            {CONFIG_KEYS.map((key) => {
                                const setting = settings[key];
                                if (!setting) return null;
                                const isNumber = setting.type === 'number';
                                let adornment = null;
                                if (key === 'retencion_honorarios' || key === 'IVA' || key === 'ppm' || key === 'ahorro_caja') {
                                    adornment = '%';
                                } else if (key === 'gastos_administracion') {
                                    adornment = 'CLP';
                                }
                                return (
                                    <Grid item xs={12} sm={6} md={4} key={key}>
                                        <FormControl fullWidth variant="outlined">
                                            <TextField
                                                id={key}
                                                label={setting.description || key}
                                                value={setting.value || ''}
                                                onChange={(e) => handleChange(key, e.target.value)}
                                                type={isNumber ? 'number' : 'text'}
                                                InputProps={{
                                                    ...(isNumber && { inputProps: { step: key === 'gastos_administracion' ? "1" : "0.01", min: "0" } }),
                                                    ...(adornment && { endAdornment: <InputAdornment position="end">{adornment}</InputAdornment> })
                                                }}
                                                variant="outlined"
                                                disabled={isSaving}
                                            />
                                        </FormControl>
                                    </Grid>
                                );
                            })}
                            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                                <Button 
                                    variant="contained" 
                                    onClick={handleSave} 
                                    disabled={loading || isSaving}
                                    startIcon={isSaving ? <CircularProgress size={20} /> : null}
                                >
                                    Guardar Cambios
                                </Button>
                            </Grid>
                        </Grid>
                    </Box>
                </Box>
            )}
            {tabIndex === 1 && (
                <Box>
                    <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
                        Información del OTEC (RUT OTEC)
                    </Typography>
                    {errorOtec && <Alert severity="error" sx={{ mb: 2 }}>{errorOtec}</Alert>}
                    <Box sx={{ mb: 2 }}>
                        <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} sm={3}>
                                <TextField
                                    label="RUT OTEC"
                                    name="rut"
                                    value={newOtec.rut}
                                    onChange={handleChangeOtec}
                                    fullWidth
                                    size="small"
                                />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    label="Razón Social OTEC"
                                    name="razon_social_otec"
                                    value={newOtec.razon_social_otec}
                                    onChange={handleChangeOtec}
                                    fullWidth
                                    size="small"
                                />
                            </Grid>
                            <Grid item xs={12} sm={3}>
                                <TextField
                                    label="Nombre OTEC"
                                    name="nombre_otec"
                                    value={newOtec.nombre_otec}
                                    onChange={handleChangeOtec}
                                    fullWidth
                                    size="small"
                                />
                            </Grid>
                            <Grid item xs={12} sm={2}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={handleAddOtec}
                                    disabled={isAddingOtec}
                                    startIcon={<AddIcon />}
                                    fullWidth
                                >
                                    {isAddingOtec ? <CircularProgress size={20} /> : 'Agregar'}
                                </Button>
                            </Grid>
                        </Grid>
                    </Box>
                    <TableContainer component={Paper} sx={{ mb: 4 }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>RUT OTEC</TableCell>
                                    <TableCell>Razón Social</TableCell>
                                    <TableCell>Nombre</TableCell>
                                    <TableCell align="right">Acciones</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loadingOtec ? (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center">
                                            <CircularProgress size={24} />
                                        </TableCell>
                                    </TableRow>
                                ) : otecDataList.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center">
                                            No hay datos registrados.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    otecDataList.map((item) => (
                                        <TableRow key={item.rut}>
                                            <TableCell>{item.rut}</TableCell>
                                            <TableCell>{item.razon_social_otec}</TableCell>
                                            <TableCell>{item.nombre_otec}</TableCell>
                                            <TableCell align="right">
                                                <Tooltip title="Eliminar">
                                                    <span>
                                                        <IconButton
                                                            color="error"
                                                            onClick={() => handleDeleteOtec(item.rut)}
                                                            disabled={isDeletingOtec === item.rut}
                                                        >
                                                            {isDeletingOtec === item.rut ? <CircularProgress size={20} /> : <DeleteIcon />}
                                                        </IconButton>
                                                    </span>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            )}
            {tabIndex === 2 && (
                <Box>
                    <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
                        Rangos de Comisión por Rol y Margen
                    </Typography>
                    {errorComisiones && <Alert severity="error" sx={{ mb: 2 }}>{errorComisiones}</Alert>}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3, alignItems: 'center' }}>
                        <FormControl size="small" sx={{ minWidth: 150 }} disabled={isAddingComision || editMode.active || loadingRoles}>
                            <InputLabel id="new-rol-label">Rol</InputLabel>
                            <Select
                                labelId="new-rol-label"
                                id="new-rol-select"
                                value={newRolId}
                                label="Rol"
                                onChange={(e) => setNewRolId(e.target.value)}
                            >
                                <MenuItem value="">
                                    <em>Seleccione un Rol</em>
                                </MenuItem>
                                {roles.map((rol) => (
                                    <MenuItem key={rol.id} value={rol.id}>{rol.nombre}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField
                            label="Margen Desde (%)"
                            variant="outlined"
                            size="small"
                            type="number"
                            value={newMargenDesde}
                            onChange={(e) => setNewMargenDesde(e.target.value)}
                            InputProps={{ inputProps: { step: "0.01", min: "0" } }}
                            disabled={isAddingComision || editMode.active}
                            sx={{ width: { xs: '100%', sm: 150 } }}
                        />
                        <TextField
                            label="Margen Hasta (%)"
                            variant="outlined"
                            size="small"
                            type="number"
                            value={newMargenHasta}
                            onChange={(e) => setNewMargenHasta(e.target.value)}
                            InputProps={{ inputProps: { step: "0.01", min: "0" } }}
                            disabled={isAddingComision || editMode.active}
                            sx={{ width: { xs: '100%', sm: 150 } }}
                        />
                        <TextField
                            label="Comisión (%)"
                            variant="outlined"
                            size="small"
                            type="number"
                            value={newComisionValor}
                            onChange={(e) => setNewComisionValor(e.target.value)}
                            InputProps={{ inputProps: { step: "0.01", min: "0" } }}
                            disabled={isAddingComision || editMode.active}
                            sx={{ width: { xs: '100%', sm: 150 } }}
                        />
                        <Button
                            variant="contained"
                            onClick={handleAddComision}
                            disabled={loadingComisiones || isAddingComision || editMode.active || loadingRoles}
                            startIcon={isAddingComision ? <CircularProgress size={20} /> : <AddIcon />}
                        >
                            Añadir Rango
                        </Button>
                    </Box>
                    <Box sx={{ my: 2, maxWidth: 300 }}>
                        <Autocomplete
                            id="filter-rol-autocomplete"
                            size="small"
                            options={roles}
                            getOptionLabel={(option) => option.nombre || ""}
                            value={roles.find(r => r.id === parseInt(filtroRolId)) || null}
                            onChange={(event, newValue) => {
                                setFiltroRolId(newValue ? newValue.id.toString() : '');
                            }}
                            isOptionEqualToValue={(option, value) => option.id === value.id}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Filtrar por Rol"
                                    variant="outlined"
                                />
                            )}
                            disabled={loadingRoles}
                            loading={loadingRoles}
                            loadingText="Cargando roles..."
                        />
                    </Box>
                    {loadingComisiones ? (
                        <Skeleton variant="rectangular" width="100%" height={200} />
                    ) : (
                        <TableContainer component={Paper} variant="outlined">
                            <Table size="small">
                                <TableHead sx={{ backgroundColor: 'grey.100' }}>
                                    <TableRow>
                                        <TableCell>Rol</TableCell>
                                        <TableCell>Margen Desde (%)</TableCell>
                                        <TableCell>Margen Hasta (%)</TableCell>
                                        <TableCell>Comisión (%)</TableCell>
                                        <TableCell align="right">Acciones</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {comisiones
                                        .filter(comision =>
                                            !filtroRolId || comision.rol_id === parseInt(filtroRolId)
                                        )
                                        .map((comision) => (
                                            <TableRow key={comision.margen_id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                                {editMode.active && editMode.id === comision.margen_id ? (
                                                    <>
                                                        <TableCell padding="none">
                                                            <FormControl size="small" fullWidth variant="standard">
                                                                <Select
                                                                    value={editMode.rol_id}
                                                                    onChange={(e) => setEditMode({ ...editMode, rol_id: e.target.value })}
                                                                    disabled={loadingRoles}
                                                                    sx={{ fontSize: '0.875rem' }}
                                                                >
                                                                    {roles.map((rol) => (
                                                                        <MenuItem key={rol.id} value={rol.id}>{rol.nombre}</MenuItem>
                                                                    ))}
                                                                </Select>
                                                            </FormControl>
                                                        </TableCell>
                                                        <TableCell padding="none">
                                                            <TextField
                                                                size="small"
                                                                type="number"
                                                                value={editMode.desde}
                                                                onChange={(e) => setEditMode({ ...editMode, desde: e.target.value })}
                                                                InputProps={{ inputProps: { step: "0.01", min: "0" } }}
                                                                error={errorComisiones && errorComisiones.includes('desde')}
                                                                variant="standard"
                                                                fullWidth
                                                                sx={{ fontSize: '0.875rem' }}
                                                            />
                                                        </TableCell>
                                                        <TableCell padding="none">
                                                            <TextField
                                                                size="small"
                                                                type="number"
                                                                value={editMode.hasta}
                                                                onChange={(e) => setEditMode({ ...editMode, hasta: e.target.value })}
                                                                InputProps={{ inputProps: { step: "0.01", min: "0" } }}
                                                                error={errorComisiones && errorComisiones.includes('hasta')}
                                                                variant="standard"
                                                                fullWidth
                                                                sx={{ fontSize: '0.875rem' }}
                                                            />
                                                        </TableCell>
                                                        <TableCell padding="none">
                                                            <TextField
                                                                size="small"
                                                                type="number"
                                                                value={editMode.comision}
                                                                onChange={(e) => setEditMode({ ...editMode, comision: e.target.value })}
                                                                InputProps={{ inputProps: { step: "0.01", min: "0" } }}
                                                                error={errorComisiones && errorComisiones.includes('comisión')}
                                                                variant="standard"
                                                                fullWidth
                                                                sx={{ fontSize: '0.875rem' }}
                                                            />
                                                        </TableCell>
                                                        <TableCell align="right" padding="none">
                                                            <Tooltip title="Guardar Cambios">
                                                                <IconButton size="small" onClick={handleSaveEdit} disabled={isSavingComision === editMode.id || loadingRoles}>
                                                                    {isSavingComision === editMode.id ? <CircularProgress size={20} /> : <SaveIcon fontSize="small" color="primary" />}
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Tooltip title="Cancelar Edición">
                                                                <IconButton size="small" onClick={handleCancelEdit} disabled={isSavingComision === editMode.id}>
                                                                    <CancelIcon fontSize="small" color="action" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </TableCell>
                                                    </>
                                                ) : (
                                                    <>
                                                        <TableCell>{comision.Rol?.nombre || 'Rol no encontrado'}</TableCell>
                                                        <TableCell>{comision.margen_desde}</TableCell>
                                                        <TableCell>{comision.margen_hasta}</TableCell>
                                                        <TableCell>{comision.comision}</TableCell>
                                                        <TableCell align="right">
                                                            <Tooltip title="Editar Rango">
                                                                <IconButton size="small" onClick={() => handleEditClick(comision)} disabled={editMode.active || isDeletingComision === comision.margen_id || loadingRoles}>
                                                                    <EditIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Tooltip title="Eliminar Rango">
                                                                <IconButton size="small" onClick={() => handleDeleteComision(comision.margen_id)} disabled={editMode.active || isDeletingComision === comision.margen_id}>
                                                                    {isDeletingComision === comision.margen_id ? <CircularProgress size={20} /> : <DeleteIcon fontSize="small" color="error" />}
                                                                </IconButton>
                                                            </Tooltip>
                                                        </TableCell>
                                                    </>
                                                )}
                                            </TableRow>
                                        ))}
                                    {comisiones.filter(comision => !filtroRolId || comision.rol_id === parseInt(filtroRolId)).length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} align="center">No se encontraron rangos para el rol seleccionado.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Box>
            )}
            {tabIndex === 3 && (
                <Box>
                    <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
                        Usuarios Sence
                    </Typography>
                    {errorUsuariosSence && <Alert severity="error" sx={{ mb: 2 }}>{errorUsuariosSence}</Alert>}
                    <Box sx={{ mb: 2 }}>
                        <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} sm={3}>
                                <TextField
                                    label="RUT Usuario Sence"
                                    name="rut"
                                    value={newUsuarioSence.rut}
                                    onChange={handleChangeUsuarioSence}
                                    fullWidth
                                    size="small"
                                />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    label="Nombre Usuario Sence"
                                    name="nombre"
                                    value={newUsuarioSence.nombre}
                                    onChange={handleChangeUsuarioSence}
                                    fullWidth
                                    size="small"
                                />
                            </Grid>
                            <Grid item xs={12} sm={3}>
                                <TextField
                                    label="Clave Única Usuario Sence"
                                    name="clave_unica"
                                    value={newUsuarioSence.clave_unica}
                                    onChange={handleChangeUsuarioSence}
                                    fullWidth
                                    size="small"
                                />
                            </Grid>
                            <Grid item xs={12} sm={2}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={handleAddUsuarioSence}
                                    disabled={isAddingUsuarioSence}
                                    startIcon={<AddIcon />}
                                    fullWidth
                                >
                                    {isAddingUsuarioSence ? <CircularProgress size={20} /> : 'Agregar'}
                                </Button>
                            </Grid>
                        </Grid>
                    </Box>
                    <TableContainer component={Paper} sx={{ mb: 4 }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>RUT Usuario Sence</TableCell>
                                    <TableCell>Nombre</TableCell>
                                    <TableCell>Clave Única</TableCell>
                                    <TableCell align="right">Acciones</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loadingUsuariosSence ? (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center">
                                            <CircularProgress size={24} />
                                        </TableCell>
                                    </TableRow>
                                ) : usuariosSenceList.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center">
                                            No hay datos registrados.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    usuariosSenceList.map((item) => (
                                        <TableRow key={item.rut}>
                                            {editUsuarioSence.rut === item.rut ? (
                                                <>
                                                    <TableCell>{item.rut}</TableCell>
                                                    <TableCell>
                                                        <TextField
                                                            name="nombre"
                                                            value={editUsuarioSence.nombre}
                                                            onChange={handleEditUsuarioSenceChange}
                                                            size="small"
                                                            fullWidth
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <TextField
                                                            name="clave_unica"
                                                            value={editUsuarioSence.clave_unica}
                                                            onChange={handleEditUsuarioSenceChange}
                                                            size="small"
                                                            fullWidth
                                                            type="password"
                                                        />
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Tooltip title="Guardar Cambios">
                                                            <IconButton size="small" onClick={handleSaveEditUsuarioSence} disabled={isSavingUsuarioSence === item.rut}>
                                                                {isSavingUsuarioSence === item.rut ? <CircularProgress size={20} /> : <SaveIcon fontSize="small" color="primary" />}
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Cancelar Edición">
                                                            <IconButton size="small" onClick={handleCancelEditUsuarioSence} disabled={isSavingUsuarioSence === item.rut}>
                                                                <CancelIcon fontSize="small" color="action" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </TableCell>
                                                </>
                                            ) : (
                                                <>
                                                    <TableCell>{item.rut}</TableCell>
                                                    <TableCell>{item.nombre}</TableCell>
                                                    <TableCell>
                                                        <TextField
                                                            value={item.clave_unica}
                                                            type="password"
                                                            size="small"
                                                            fullWidth
                                                            disabled
                                                        />
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Tooltip title="Editar">
                                                            <span>
                                                                <IconButton color="primary" onClick={() => handleEditUsuarioSenceClick(item)} disabled={!!editUsuarioSence.rut}>
                                                                    <EditIcon />
                                                                </IconButton>
                                                            </span>
                                                        </Tooltip>
                                                        <Tooltip title="Eliminar">
                                                            <span>
                                                                <IconButton
                                                                    color="error"
                                                                    onClick={() => handleDeleteUsuarioSence(item.rut)}
                                                                    disabled={isDeletingUsuarioSence === item.rut || !!editUsuarioSence.rut}
                                                                >
                                                                    {isDeletingUsuarioSence === item.rut ? <CircularProgress size={20} /> : <DeleteIcon />}
                                                                </IconButton>
                                                            </span>
                                                        </Tooltip>
                                                    </TableCell>
                                                </>
                                            )}
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            )}
            {tabIndex === 4 && (
                <Box>
                    <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
                        Usuarios Servicio de Impuestos Internos
                    </Typography>
                    {errorUsuariosSii && <Alert severity="error" sx={{ mb: 2 }}>{errorUsuariosSii}</Alert>}
                    <Box sx={{ mb: 2 }}>
                        <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} sm={3}>
                                <TextField
                                    label="RUT Usuario SII"
                                    name="rut"
                                    value={newUsuarioSii.rut}
                                    onChange={handleChangeUsuarioSii}
                                    fullWidth
                                    size="small"
                                />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    label="Nombre Usuario SII"
                                    name="nombre"
                                    value={newUsuarioSii.nombre}
                                    onChange={handleChangeUsuarioSii}
                                    fullWidth
                                    size="small"
                                />
                            </Grid>
                            <Grid item xs={12} sm={3}>
                                <TextField
                                    label="Clave Única Usuario SII"
                                    name="clave_unica"
                                    value={newUsuarioSii.clave_unica}
                                    onChange={handleChangeUsuarioSii}
                                    fullWidth
                                    size="small"
                                />
                            </Grid>
                            <Grid item xs={12} sm={2}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={handleAddUsuarioSii}
                                    disabled={isAddingUsuarioSii}
                                    startIcon={<AddIcon />}
                                    fullWidth
                                >
                                    {isAddingUsuarioSii ? <CircularProgress size={20} /> : 'Agregar'}
                                </Button>
                            </Grid>
                        </Grid>
                    </Box>
                    <TableContainer component={Paper} sx={{ mb: 4 }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>RUT Usuario SII</TableCell>
                                    <TableCell>Nombre</TableCell>
                                    <TableCell>Clave Única</TableCell>
                                    <TableCell align="right">Acciones</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loadingUsuariosSii ? (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center">
                                            <CircularProgress size={24} />
                                        </TableCell>
                                    </TableRow>
                                ) : usuariosSiiList.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center">
                                            No hay datos registrados.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    usuariosSiiList.map((item) => (
                                        <TableRow key={item.rut}>
                                            {editUsuarioSii.rut === item.rut ? (
                                                <>
                                                    <TableCell>{item.rut}</TableCell>
                                                    <TableCell>
                                                        <TextField
                                                            name="nombre"
                                                            value={editUsuarioSii.nombre}
                                                            onChange={handleEditUsuarioSiiChange}
                                                            size="small"
                                                            fullWidth
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <TextField
                                                            name="clave_unica"
                                                            value={editUsuarioSii.clave_unica}
                                                            onChange={handleEditUsuarioSiiChange}
                                                            size="small"
                                                            fullWidth
                                                            type="password"
                                                        />
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Tooltip title="Guardar Cambios">
                                                            <IconButton size="small" onClick={handleSaveEditUsuarioSii} disabled={isSavingUsuarioSii === item.rut}>
                                                                {isSavingUsuarioSii === item.rut ? <CircularProgress size={20} /> : <SaveIcon fontSize="small" color="primary" />}
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Cancelar Edición">
                                                            <IconButton size="small" onClick={handleCancelEditUsuarioSii} disabled={isSavingUsuarioSii === item.rut}>
                                                                <CancelIcon fontSize="small" color="action" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </TableCell>
                                                </>
                                            ) : (
                                                <>
                                                    <TableCell>{item.rut}</TableCell>
                                                    <TableCell>{item.nombre}</TableCell>
                                                    <TableCell>
                                                        <TextField
                                                            value={item.clave_unica}
                                                            type="password"
                                                            size="small"
                                                            fullWidth
                                                            disabled
                                                        />
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Tooltip title="Editar">
                                                            <span>
                                                                <IconButton color="primary" onClick={() => handleEditUsuarioSiiClick(item)} disabled={!!editUsuarioSii.rut}>
                                                                    <EditIcon />
                                                                </IconButton>
                                                            </span>
                                                        </Tooltip>
                                                        <Tooltip title="Eliminar">
                                                            <span>
                                                                <IconButton
                                                                    color="error"
                                                                    onClick={() => handleDeleteUsuarioSii(item.rut)}
                                                                    disabled={isDeletingUsuarioSii === item.rut || !!editUsuarioSii.rut}
                                                                >
                                                                    {isDeletingUsuarioSii === item.rut ? <CircularProgress size={20} /> : <DeleteIcon />}
                                                                </IconButton>
                                                            </span>
                                                        </Tooltip>
                                                    </TableCell>
                                                </>
                                            )}
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            )}
        </Paper>
    );
};

export default ConfiguracionesERP; 