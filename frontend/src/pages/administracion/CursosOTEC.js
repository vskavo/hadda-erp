import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    Alert,
    Chip,
    TextField,
    InputAdornment,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Grid,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    IconButton,
    Tooltip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import UploadIcon from '@mui/icons-material/Upload';
import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import cursoSenceService from '../../services/cursoSenceService';

const CursosOTEC = () => {
    const [cursos, setCursos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredCursos, setFilteredCursos] = useState([]);

    // Estados para modal de curso (crear/editar)
    const [openCursoModal, setOpenCursoModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [cursoFormData, setCursoFormData] = useState({
        codigo_curso: '',
        solicitud_curso: '',
        nombre_curso: '',
        modalidad: '',
        modo: '',
        tipo: '',
        nivel: '',
        horas: '',
        valor_franquicia: '',
        valor_efectivo_participante: '',
        valor_imputable_participante: '',
        resolucion_autorizacion: '',
        estado: '',
        numero_deposito: '',
        fecha_ingreso: '',
        fecha_evaluacion: '',
        fecha_resolucion: '',
        fecha_vigencia: '',
        fecha_pago: ''
    });

    // Estados para eliminación
    const [deletingId, setDeletingId] = useState(null);

    // Estados para modal de carga CSV
    const [openCsvModal, setOpenCsvModal] = useState(false);
    const [uploadingCsv, setUploadingCsv] = useState(false);
    const [csvFile, setCsvFile] = useState(null);
    const [csvResults, setCsvResults] = useState(null);

    // Estados para descargar plantilla
    const [downloadingTemplate, setDownloadingTemplate] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await cursoSenceService.getCursosSence();
                setCursos(response.cursos || []);
            } catch (err) {
                console.error('Error al cargar cursos SENCE:', err);
                setError('Error al cargar los datos. Inténtalo de nuevo.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Filtrar cursos basado en el término de búsqueda
    useEffect(() => {
        if (!cursos.length) {
            setFilteredCursos([]);
            return;
        }

        const filtered = cursos.filter(curso =>
            curso.nombre_curso?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            curso.codigo_curso?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            curso.solicitud_curso?.toLowerCase().includes(searchTerm.toLowerCase())
        );

        setFilteredCursos(filtered);
    }, [cursos, searchTerm]);

    // Funciones para modal de curso (crear/editar)
    const handleOpenCreateModal = () => {
        setIsEditing(false);
        setEditingId(null);
        setCursoFormData({
            codigo_curso: '',
            solicitud_curso: '',
            nombre_curso: '',
            modalidad: '',
            modo: '',
            tipo: '',
            nivel: '',
            horas: '',
            valor_franquicia: '',
            valor_efectivo_participante: '',
            valor_imputable_participante: '',
            resolucion_autorizacion: '',
            estado: '',
            numero_deposito: '',
            fecha_ingreso: '',
            fecha_evaluacion: '',
            fecha_resolucion: '',
            fecha_vigencia: '',
            fecha_pago: ''
        });
        setOpenCursoModal(true);
    };

    const handleOpenEditModal = (curso) => {
        setIsEditing(true);
        setEditingId(curso.id);
        setCursoFormData({
            codigo_curso: curso.codigo_curso || '',
            solicitud_curso: curso.solicitud_curso || '',
            nombre_curso: curso.nombre_curso || '',
            modalidad: curso.modalidad || '',
            modo: curso.modo || '',
            tipo: curso.tipo || '',
            nivel: curso.nivel || '',
            horas: curso.horas || '',
            valor_franquicia: curso.valor_franquicia || '',
            valor_efectivo_participante: curso.valor_efectivo_participante || '',
            valor_imputable_participante: curso.valor_imputable_participante || '',
            resolucion_autorizacion: curso.resolucion_autorizacion || '',
            estado: curso.estado || '',
            numero_deposito: curso.numero_deposito || '',
            fecha_ingreso: curso.fecha_ingreso ? curso.fecha_ingreso.split('T')[0] : '',
            fecha_evaluacion: curso.fecha_evaluacion ? curso.fecha_evaluacion.split('T')[0] : '',
            fecha_resolucion: curso.fecha_resolucion ? curso.fecha_resolucion.split('T')[0] : '',
            fecha_vigencia: curso.fecha_vigencia ? curso.fecha_vigencia.split('T')[0] : '',
            fecha_pago: curso.fecha_pago ? curso.fecha_pago.split('T')[0] : ''
        });
        setOpenCursoModal(true);
    };

    const handleCloseCursoModal = () => {
        setOpenCursoModal(false);
        setIsEditing(false);
        setEditingId(null);
        setCursoFormData({
            codigo_curso: '',
            solicitud_curso: '',
            nombre_curso: '',
            modalidad: '',
            modo: '',
            tipo: '',
            nivel: '',
            horas: '',
            valor_franquicia: '',
            valor_efectivo_participante: '',
            valor_imputable_participante: '',
            resolucion_autorizacion: '',
            estado: '',
            numero_deposito: '',
            fecha_ingreso: '',
            fecha_evaluacion: '',
            fecha_resolucion: '',
            fecha_vigencia: '',
            fecha_pago: ''
        });
    };

    const handleCursoFormChange = (field, value) => {
        setCursoFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSaveCurso = async () => {
        if (!cursoFormData.nombre_curso.trim()) {
            alert('El nombre del curso es obligatorio');
            return;
        }

        setSaving(true);
        try {
            if (isEditing && editingId) {
                await cursoSenceService.updateCursoSence(editingId, cursoFormData);
                alert('Curso actualizado exitosamente');
            } else {
                await cursoSenceService.createCursoSence(cursoFormData);
                alert('Curso creado exitosamente');
            }

            // Recargar los datos
            const response = await cursoSenceService.getCursosSence();
            setCursos(response.cursos || []);

            handleCloseCursoModal();
        } catch (error) {
            console.error('Error al guardar curso:', error);
            alert('Error al guardar el curso: ' + (error.response?.data?.message || error.message));
        } finally {
            setSaving(false);
        }
    };

    // Función para eliminar curso
    const handleDeleteCurso = async (id) => {
        if (!window.confirm('¿Está seguro de que desea eliminar este curso? Esta acción no se puede deshacer.')) {
            return;
        }

        setDeletingId(id);
        try {
            await cursoSenceService.deleteCursoSence(id);

            // Recargar los datos
            const response = await cursoSenceService.getCursosSence();
            setCursos(response.cursos || []);

            alert('Curso eliminado exitosamente');
        } catch (error) {
            console.error('Error al eliminar curso:', error);
            alert('Error al eliminar el curso: ' + (error.response?.data?.message || error.message));
        } finally {
            setDeletingId(null);
        }
    };

    // Funciones para modal de carga CSV
    const handleOpenCsvModal = () => {
        setOpenCsvModal(true);
        setCsvFile(null);
        setCsvResults(null);
    };

    const handleCloseCsvModal = () => {
        setOpenCsvModal(false);
        setCsvFile(null);
        setCsvResults(null);
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file && file.type === 'text/csv') {
            setCsvFile(file);
        } else {
            alert('Por favor selecciona un archivo CSV válido');
            setCsvFile(null);
        }
    };

    const parseCSV = (csvText) => {
        const lines = csvText.split('\n').filter(line => line.trim());
        if (lines.length < 2) return [];

        // Detectar delimitador automáticamente (coma o punto y coma)
        const firstLine = lines[0];
        const commaCount = (firstLine.match(/,/g) || []).length;
        const semicolonCount = (firstLine.match(/;/g) || []).length;
        const delimiter = semicolonCount > commaCount ? ';' : ',';

        console.log('Delimitador detectado:', delimiter);

        const headers = firstLine.split(delimiter).map(h => h.trim().replace(/"/g, ''));
        const expectedHeaders = [
            'codigo_curso', 'solicitud_curso', 'nombre_curso', 'modalidad', 'modo',
            'tipo', 'nivel', 'horas', 'valor_franquicia', 'valor_efectivo_participante',
            'valor_imputable_participante', 'resolucion_autorizacion', 'estado',
            'numero_deposito', 'fecha_ingreso', 'fecha_evaluacion', 'fecha_resolucion',
            'fecha_vigencia', 'fecha_pago'
        ];

        console.log('Headers encontrados:', headers);
        console.log('Headers esperados:', expectedHeaders);

        // Verificar que al menos algunos headers importantes estén presentes
        const importantHeaders = ['codigo_curso', 'nombre_curso', 'estado'];
        const importantHeadersMatch = importantHeaders.every(header => headers.includes(header));

        if (!importantHeadersMatch) {
            console.error('Headers importantes no encontrados. Headers importantes:', importantHeaders, 'Encontrados:', headers);
            throw new Error(`Los headers del CSV no incluyen campos importantes. Headers requeridos: ${importantHeaders.join(', ')}`);
        }

        // Verificar que tengamos al menos 15 de los headers esperados
        const matchingHeaders = expectedHeaders.filter(header => headers.includes(header));
        if (matchingHeaders.length < 15) {
            console.warn(`Solo ${matchingHeaders.length} de ${expectedHeaders.length} headers coinciden. Continuando con los headers encontrados.`);
        }

        // Función para convertir fechas de DD-MM-YYYY a YYYY-MM-DD
        const convertDateFormat = (dateStr) => {
            if (!dateStr || dateStr === 'NULL' || dateStr === '') return null;

            // Si ya está en formato YYYY-MM-DD, devolver tal cual
            if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return dateStr;

            // Convertir de DD-MM-YYYY a YYYY-MM-DD
            const parts = dateStr.split('-');
            if (parts.length === 3 && parts[0].length === 2 && parts[1].length === 2 && parts[2].length === 4) {
                return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }

            return dateStr; // Devolver tal cual si no se puede convertir
        };

        // Función para normalizar valores
        const normalizeValue = (value, fieldName) => {
            if (!value || value === 'NULL' || value === '') return null;

            // Convertir fechas
            if (fieldName.includes('fecha_')) {
                return convertDateFormat(value);
            }

            // Normalizar modalidades
            if (fieldName === 'modalidad') {
                if (value.toLowerCase().includes('distancia')) return 'A distancia';
                if (value.toLowerCase().includes('elearning')) return 'Elearning';
                if (value.toLowerCase().includes('presencial')) return 'Presencial';
                return value;
            }

            // No normalizar modos - mantener valores originales
            // if (fieldName === 'modo') {
            //     if (value.toLowerCase().includes('auto')) return 'Individual';
            //     if (value.toLowerCase().includes('grupal')) return 'Grupal';
            //     return value;
            // }

            return value;
        };

        const data = [];
        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue; // Saltar líneas vacías

            const values = lines[i].split(delimiter).map(v => v.trim().replace(/"/g, ''));
            if (values.length >= headers.length) {
                const rowData = {};
                headers.forEach((header, index) => {
                    rowData[header] = normalizeValue(values[index], header);
                });
                rowData._rowIndex = i + 1; // Para identificar la fila en caso de error
                data.push(rowData);
            }
        }
        console.log('Datos parseados y normalizados:', data.length, 'registros');
        return data;
    };

    const handleUploadCsv = async () => {
        if (!csvFile) {
            alert('Por favor selecciona un archivo CSV');
            return;
        }

        setUploadingCsv(true);
        try {
            const csvText = await csvFile.text();
            console.log('Contenido del CSV:', csvText);

            const cursosData = parseCSV(csvText);
            console.log('Datos parseados a enviar:', cursosData);

            if (cursosData.length === 0) {
                alert('No se encontraron datos válidos en el archivo CSV');
                return;
            }

            console.log(`Enviando ${cursosData.length} registros al backend...`);
            const result = await cursoSenceService.bulkCreateCursosSence(cursosData);
            console.log('Resultado del backend:', result);

            setCsvResults(result);

            // Recargar los datos para mostrar los nuevos
            const response = await cursoSenceService.getCursosSence();
            setCursos(response.cursos || []);

            alert(`Carga completada. Creados: ${result.estadisticas.creados}, Errores: ${result.estadisticas.errores}`);

            // Mostrar detalles de los datos procesados
            if (result.estadisticas.creados > 0) {
                console.log('Primer registro creado (ejemplo):', cursosData[0]);
            }
        } catch (error) {
            console.error('Error al procesar CSV:', error);
            alert('Error al procesar el archivo CSV: ' + error.message);
        } finally {
            setUploadingCsv(false);
        }
    };

    // Función para descargar plantilla
    const handleDownloadTemplate = async () => {
        setDownloadingTemplate(true);
        try {
            const csvBlob = await cursoSenceService.downloadTemplate();
            const url = window.URL.createObjectURL(csvBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'plantilla_cursos_sence.csv';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error al descargar plantilla:', error);
            alert('Error al descargar la plantilla');
        } finally {
            setDownloadingTemplate(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ maxWidth: 'xl', margin: 'auto', mt: 4 }}>
            <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
                Cursos OTEC
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            {/* Botones de acciones */}
            <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleOpenCreateModal}
                    sx={{ minWidth: 200 }}
                >
                    Agregar Curso Manual
                </Button>
                <Button
                    variant="outlined"
                    startIcon={<UploadIcon />}
                    onClick={handleOpenCsvModal}
                    sx={{ minWidth: 200 }}
                >
                    Subir CSV
                </Button>
                <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={handleDownloadTemplate}
                    disabled={downloadingTemplate}
                    sx={{ minWidth: 200 }}
                >
                    {downloadingTemplate ? <CircularProgress size={20} /> : 'Descargar Plantilla'}
                </Button>
            </Box>

            {/* Barra de búsqueda */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <TextField
                    fullWidth
                    label="Buscar cursos"
                    variant="outlined"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        ),
                    }}
                    placeholder="Buscar por nombre, código o solicitud..."
                />
            </Paper>

            {/* Tabla de cursos SENCE */}
            <Paper>
                <TableContainer>
                    <Table>
                        <TableHead sx={{ bgcolor: 'grey.50' }}>
                            <TableRow>
                                <TableCell><strong>ID</strong></TableCell>
                                <TableCell><strong>Código Curso</strong></TableCell>
                                <TableCell><strong>Solicitud Curso</strong></TableCell>
                                <TableCell><strong>Nombre Curso</strong></TableCell>
                                <TableCell><strong>Modalidad</strong></TableCell>
                                <TableCell><strong>Modo</strong></TableCell>
                                <TableCell><strong>Tipo</strong></TableCell>
                                <TableCell><strong>Nivel</strong></TableCell>
                                <TableCell><strong>Horas</strong></TableCell>
                                <TableCell><strong>Valor Franquicia</strong></TableCell>
                                <TableCell><strong>Valor Efectivo Participante</strong></TableCell>
                                <TableCell><strong>Valor Imputable Participante</strong></TableCell>
                                <TableCell><strong>Resolución Autorización</strong></TableCell>
                                <TableCell><strong>Estado</strong></TableCell>
                                <TableCell><strong>Número Depósito</strong></TableCell>
                                <TableCell><strong>Fecha Ingreso</strong></TableCell>
                                <TableCell><strong>Fecha Evaluación</strong></TableCell>
                                <TableCell><strong>Fecha Resolución</strong></TableCell>
                                <TableCell><strong>Fecha Vigencia</strong></TableCell>
                                <TableCell><strong>Fecha Pago</strong></TableCell>
                                <TableCell><strong>Acciones</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredCursos.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={21} align="center" sx={{ py: 4 }}>
                                        <Typography variant="body1" color="text.secondary">
                                            {searchTerm ? 'No se encontraron cursos que coincidan con la búsqueda.' : 'No hay cursos registrados.'}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredCursos.map((curso) => (
                                    <TableRow key={curso.id} hover>
                                        <TableCell>{curso.id}</TableCell>
                                        <TableCell>{curso.codigo_curso || '-'}</TableCell>
                                        <TableCell>{curso.solicitud_curso || '-'}</TableCell>
                                        <TableCell>{curso.nombre_curso}</TableCell>
                                        <TableCell>{curso.modalidad || '-'}</TableCell>
                                        <TableCell>{curso.modo || '-'}</TableCell>
                                        <TableCell>{curso.tipo || '-'}</TableCell>
                                        <TableCell>{curso.nivel || '-'}</TableCell>
                                        <TableCell>{curso.horas || '-'}</TableCell>
                                        <TableCell>
                                            {curso.valor_franquicia ? `$${parseFloat(curso.valor_franquicia).toLocaleString('es-CL')}` : '-'}
                                        </TableCell>
                                        <TableCell>
                                            {curso.valor_efectivo_participante ? `$${parseFloat(curso.valor_efectivo_participante).toLocaleString('es-CL')}` : '-'}
                                        </TableCell>
                                        <TableCell>
                                            {curso.valor_imputable_participante ? `$${parseFloat(curso.valor_imputable_participante).toLocaleString('es-CL')}` : '-'}
                                        </TableCell>
                                        <TableCell>{curso.resolucion_autorizacion || '-'}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={curso.estado || 'Sin estado'}
                                                color={
                                                    curso.estado === 'Aprobado' ? 'success' :
                                                    curso.estado === 'Rechazado' ? 'error' :
                                                    curso.estado === 'En Evaluación' ? 'warning' : 'default'
                                                }
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>{curso.numero_deposito || '-'}</TableCell>
                                        <TableCell>
                                            {curso.fecha_ingreso ? new Date(curso.fecha_ingreso).toLocaleDateString('es-CL') : '-'}
                                        </TableCell>
                                        <TableCell>
                                            {curso.fecha_evaluacion ? new Date(curso.fecha_evaluacion).toLocaleDateString('es-CL') : '-'}
                                        </TableCell>
                                        <TableCell>
                                            {curso.fecha_resolucion ? new Date(curso.fecha_resolucion).toLocaleDateString('es-CL') : '-'}
                                        </TableCell>
                                        <TableCell>
                                            {curso.fecha_vigencia ? new Date(curso.fecha_vigencia).toLocaleDateString('es-CL') : '-'}
                                        </TableCell>
                                        <TableCell>
                                            {curso.fecha_pago ? new Date(curso.fecha_pago).toLocaleDateString('es-CL') : '-'}
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                <Tooltip title="Editar curso">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleOpenEditModal(curso)}
                                                        color="primary"
                                                    >
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Eliminar curso">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleDeleteCurso(curso.id)}
                                                        disabled={deletingId === curso.id}
                                                        color="error"
                                                    >
                                                        {deletingId === curso.id ? (
                                                            <CircularProgress size={16} />
                                                        ) : (
                                                            <DeleteIcon fontSize="small" />
                                                        )}
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* Modal para crear/editar curso */}
            <Dialog
                open={openCursoModal}
                onClose={handleCloseCursoModal}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    {isEditing ? 'Editar Curso SENCE' : 'Agregar Nuevo Curso SENCE'}
                    <IconButton
                        onClick={handleCloseCursoModal}
                        sx={{ position: 'absolute', right: 8, top: 8 }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Código Curso"
                                value={cursoFormData.codigo_curso}
                                onChange={(e) => handleCursoFormChange('codigo_curso', e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Solicitud Curso"
                                value={cursoFormData.solicitud_curso}
                                onChange={(e) => handleCursoFormChange('solicitud_curso', e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                required
                                label="Nombre del Curso"
                                value={cursoFormData.nombre_curso}
                                onChange={(e) => handleCursoFormChange('nombre_curso', e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                                <InputLabel>Modalidad</InputLabel>
                                <Select
                                    value={cursoFormData.modalidad}
                                    onChange={(e) => handleCursoFormChange('modalidad', e.target.value)}
                                >
                                    <MenuItem value="A distancia">A distancia</MenuItem>
                                    <MenuItem value="Elearning">Elearning</MenuItem>
                                    <MenuItem value="Presencial">Presencial</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                                <InputLabel>Modo</InputLabel>
                                <Select
                                    value={cursoFormData.modo}
                                    onChange={(e) => handleCursoFormChange('modo', e.target.value)}
                                >
                                    <MenuItem value="Individual">Individual</MenuItem>
                                    <MenuItem value="Grupal">Grupal</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Tipo"
                                value={cursoFormData.tipo}
                                onChange={(e) => handleCursoFormChange('tipo', e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Nivel"
                                value={cursoFormData.nivel}
                                onChange={(e) => handleCursoFormChange('nivel', e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Horas"
                                value={cursoFormData.horas}
                                onChange={(e) => handleCursoFormChange('horas', e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Valor Franquicia"
                                value={cursoFormData.valor_franquicia}
                                onChange={(e) => handleCursoFormChange('valor_franquicia', e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Valor Efectivo Participante"
                                value={cursoFormData.valor_efectivo_participante}
                                onChange={(e) => handleCursoFormChange('valor_efectivo_participante', e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Valor Imputable Participante"
                                value={cursoFormData.valor_imputable_participante}
                                onChange={(e) => handleCursoFormChange('valor_imputable_participante', e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Resolución Autorización"
                                value={cursoFormData.resolucion_autorizacion}
                                onChange={(e) => handleCursoFormChange('resolucion_autorizacion', e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                                <InputLabel>Estado</InputLabel>
                                <Select
                                    value={cursoFormData.estado}
                                    onChange={(e) => handleCursoFormChange('estado', e.target.value)}
                                >
                                    <MenuItem value="Aprobado">Aprobado</MenuItem>
                                    <MenuItem value="Rechazado">Rechazado</MenuItem>
                                    <MenuItem value="En Evaluación">En Evaluación</MenuItem>
                                    <MenuItem value="Pendiente">Pendiente</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Número Depósito"
                                value={cursoFormData.numero_deposito}
                                onChange={(e) => handleCursoFormChange('numero_deposito', e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                type="date"
                                label="Fecha Ingreso"
                                InputLabelProps={{ shrink: true }}
                                value={cursoFormData.fecha_ingreso}
                                onChange={(e) => handleCursoFormChange('fecha_ingreso', e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                type="date"
                                label="Fecha Evaluación"
                                InputLabelProps={{ shrink: true }}
                                value={cursoFormData.fecha_evaluacion}
                                onChange={(e) => handleCursoFormChange('fecha_evaluacion', e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                type="date"
                                label="Fecha Resolución"
                                InputLabelProps={{ shrink: true }}
                                value={cursoFormData.fecha_resolucion}
                                onChange={(e) => handleCursoFormChange('fecha_resolucion', e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                type="date"
                                label="Fecha Vigencia"
                                InputLabelProps={{ shrink: true }}
                                value={cursoFormData.fecha_vigencia}
                                onChange={(e) => handleCursoFormChange('fecha_vigencia', e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                type="date"
                                label="Fecha Pago"
                                InputLabelProps={{ shrink: true }}
                                value={cursoFormData.fecha_pago}
                                onChange={(e) => handleCursoFormChange('fecha_pago', e.target.value)}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseCursoModal} disabled={saving}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSaveCurso}
                        variant="contained"
                        disabled={saving}
                        startIcon={saving ? <CircularProgress size={20} /> : null}
                    >
                        {saving ? 'Guardando...' : (isEditing ? 'Actualizar Curso' : 'Crear Curso')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Modal para carga CSV */}
            <Dialog
                open={openCsvModal}
                onClose={handleCloseCsvModal}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    Cargar Cursos desde CSV
                    <IconButton
                        onClick={handleCloseCsvModal}
                        sx={{ position: 'absolute', right: 8, top: 8 }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Selecciona un archivo CSV con los cursos SENCE. El archivo debe tener los headers correctos.
                    </Typography>

                    <input
                        accept=".csv"
                        style={{ display: 'none' }}
                        id="csv-file-input"
                        type="file"
                        onChange={handleFileChange}
                    />
                    <label htmlFor="csv-file-input">
                        <Button
                            variant="outlined"
                            component="span"
                            fullWidth
                            startIcon={<UploadIcon />}
                            sx={{ mb: 2 }}
                        >
                            Seleccionar archivo CSV
                        </Button>
                    </label>

                    {csvFile && (
                        <Typography variant="body2" sx={{ mb: 2 }}>
                            Archivo seleccionado: <strong>{csvFile.name}</strong>
                        </Typography>
                    )}

                    {csvResults && (
                        <Alert severity={csvResults.estadisticas.errores > 0 ? 'warning' : 'success'} sx={{ mt: 2 }}>
                            <Typography variant="body2">
                                <strong>Resultados de la carga:</strong><br />
                                Creados: {csvResults.estadisticas.creados}<br />
                                Errores: {csvResults.estadisticas.errores}
                            </Typography>
                            {csvResults.errores.length > 0 && (
                                <Box sx={{ mt: 1 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                        Errores encontrados:
                                    </Typography>
                                    {csvResults.errores.slice(0, 5).map((error, index) => (
                                        <Typography key={index} variant="body2" sx={{ fontSize: '0.75rem' }}>
                                            Fila {error.fila}: {error.error}
                                        </Typography>
                                    ))}
                                    {csvResults.errores.length > 5 && (
                                        <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                                            ...y {csvResults.errores.length - 5} errores más
                                        </Typography>
                                    )}
                                </Box>
                            )}
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseCsvModal} disabled={uploadingCsv}>
                        Cerrar
                    </Button>
                    <Button
                        onClick={handleUploadCsv}
                        variant="contained"
                        disabled={!csvFile || uploadingCsv}
                        startIcon={uploadingCsv ? <CircularProgress size={20} /> : null}
                    >
                        {uploadingCsv ? 'Procesando...' : 'Cargar CSV'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default CursosOTEC;
