import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import {
    Box,
    Button,
    TextField as MuiTextField,
    Typography,
    CircularProgress,
    Alert,
    Checkbox,
    Paper,
    Grid,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    ListSubheader,
    FormControl,
    FormLabel,
    FormHelperText
} from '@mui/material';
import { getPermisos, getRolById, createRol, updateRol } from '../../../services/rolesService';

// Esquema de validación
const RolSchema = Yup.object().shape({
    nombre: Yup.string()
        .min(3, 'El nombre debe tener al menos 3 caracteres')
        .required('El nombre es requerido'),
    descripcion: Yup.string(),
    permisos: Yup.array()
        .min(1, 'Debe seleccionar al menos un permiso')
        .required('Debe seleccionar al menos un permiso'),
});

const RolForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [initialValues, setInitialValues] = useState({ nombre: '', descripcion: '', permisos: [] });
    const [allPermisos, setAllPermisos] = useState([]);
    const isEditMode = Boolean(id);

    // Cargar todos los permisos disponibles
    useEffect(() => {
        const fetchPermisos = async () => {
            try {
                const permisosData = await getPermisos();
                console.log("Permisos disponibles cargados:", permisosData);
                setAllPermisos(permisosData || []); // Asegurar que sea un array
            } catch (err) {
                console.error("Error al cargar permisos:", err);
                setError('Error al cargar la lista de permisos.');
                setAllPermisos([]); // Establecer array vacío en caso de error
            }
        };
        fetchPermisos();
    }, []);

    // Agrupar permisos por módulo usando useMemo para eficiencia
    const permisosAgrupados = useMemo(() => {
        if (!allPermisos || allPermisos.length === 0) return {};
        return allPermisos.reduce((acc, permiso) => {
            const modulo = permiso.modulo || 'Otros'; // Agrupar sin módulo en 'Otros'
            if (!acc[modulo]) {
                acc[modulo] = [];
            }
            acc[modulo].push(permiso);
            // Ordenar permisos dentro de cada módulo por nombre
            acc[modulo].sort((a, b) => a.nombre.localeCompare(b.nombre));
            return acc;
        }, {});
    }, [allPermisos]);

    // Cargar datos del rol si estamos en modo edición
    useEffect(() => {
        if (isEditMode && allPermisos.length > 0) {
            const fetchRolData = async () => {
                setLoading(true);
                setError(null);
                try {
                    const rolData = await getRolById(id);
                    console.log("Datos del rol para editar:", rolData);
                    console.log("Permisos asociados al rol:", rolData.permisos);
                    // Mapear solo los IDs de los permisos asociados para el estado inicial
                    const permisosIdsSeleccionados = rolData.permisos ? rolData.permisos.map(p => p.id) : [];
                    setInitialValues({
                        nombre: rolData.nombre || '',
                        descripcion: rolData.descripcion || '',
                        permisos: permisosIdsSeleccionados,
                    });
                } catch (err) {
                    console.error("Error al cargar datos del rol:", err);
                    setError('Error al cargar los datos del rol.');
                    navigate('/admin/roles');
                } finally {
                    setLoading(false);
                }
            };
            fetchRolData();
        } else if (!isEditMode) {
            setInitialValues({ nombre: '', descripcion: '', permisos: [] });
        }
    // OJO: La dependencia de allPermisos aquí puede causar re-renderizados. 
    // Se podría optimizar, pero por ahora es funcional.
    }, [id, isEditMode, navigate, allPermisos]); 

    const handleSubmit = async (values, { setSubmitting }) => {
        setLoading(true);
        setError(null);
        
        // 'values.permisos' ya contiene los IDs seleccionados directamente
        const payload = {
            nombre: values.nombre,
            descripcion: values.descripcion,
            permisos: values.permisos,
        };
        console.log("Enviando payload:", payload);

        try {
            if (isEditMode) {
                await updateRol(id, payload);
            } else {
                await createRol(payload);
            }
            navigate('/admin/roles');
        } catch (err) {
             console.error("Error al guardar rol:", err);
            setError(err.message || `Error al ${isEditMode ? 'actualizar' : 'crear'} el rol.`);
        } finally {
            setLoading(false);
            setSubmitting(false);
        }
    };

    if (loading && !isEditMode) { // Mostrar carga solo al cargar permisos o editar
         return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
    }
     if (isEditMode && loading) { // Muestra carga completa cuando edita
        return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
    }

    return (
        <Paper sx={{ p: 3, maxWidth: 'md', margin: 'auto', mt: 4 }}>
            <Typography variant="h4" gutterBottom>
                {isEditMode ? 'Editar Rol' : 'Crear Nuevo Rol'}
            </Typography>
            
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Formik
                initialValues={initialValues}
                validationSchema={RolSchema}
                onSubmit={handleSubmit}
                enableReinitialize
            >
                {({ isSubmitting, setFieldValue, values, errors, touched }) => (
                    <Form>
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <Field name="nombre">
                                    {({ field }) => (
                                        <MuiTextField {...field} label="Nombre del Rol" variant="outlined" fullWidth required error={touched.nombre && Boolean(errors.nombre)} helperText={touched.nombre && errors.nombre} />
                                    )}
                                </Field>
                            </Grid>
                            <Grid item xs={12}>
                                <Field name="descripcion">
                                    {({ field }) => (
                                        <MuiTextField {...field} label="Descripción (Opcional)" variant="outlined" fullWidth multiline rows={3} error={touched.descripcion && Boolean(errors.descripcion)} helperText={touched.descripcion && errors.descripcion} />
                                    )}
                                </Field>
                            </Grid>
                            <Grid item xs={12}>
                                <FormControl 
                                    required 
                                    error={touched.permisos && Boolean(errors.permisos)} 
                                    component="fieldset" 
                                    variant="standard"
                                    fullWidth
                                >
                                    <FormLabel component="legend" sx={{ mb: 1, fontWeight: 'bold' }}>Permisos Asignados</FormLabel>
                                    <Paper variant="outlined" sx={{ maxHeight: 400, overflow: 'auto' }}>
                                        <List dense disablePadding>
                                            {Object.entries(permisosAgrupados)
                                                // Ordenar módulos alfabéticamente
                                                .sort(([moduloA], [moduloB]) => moduloA.localeCompare(moduloB))
                                                .map(([modulo, permisosDelModulo]) => (
                                                <li key={modulo}>
                                                    <ul style={{ padding: 0, margin: 0, listStyle: 'none' }}>
                                                        <ListSubheader sx={{ bgcolor: 'grey.100', lineHeight: '30px' }}>{modulo}</ListSubheader>
                                                        {permisosDelModulo.map((permiso) => {
                                                            const labelId = `checkbox-list-label-${permiso.id}`;
                                                            // Verificar si el ID del permiso actual está en el array de IDs seleccionados
                                                            const isChecked = values.permisos.includes(permiso.id);

                                                            return (
                                                                <ListItem key={permiso.id} disablePadding>
                                                                    <ListItemButton 
                                                                        role={undefined} 
                                                                        onClick={() => {
                                                                            const currentPermisos = values.permisos;
                                                                            const currentIndex = currentPermisos.indexOf(permiso.id);
                                                                            const newPermisos = [...currentPermisos];

                                                                            if (currentIndex === -1) {
                                                                                newPermisos.push(permiso.id); // Añadir ID
                                                                            } else {
                                                                                newPermisos.splice(currentIndex, 1); // Quitar ID
                                                                            }
                                                                            setFieldValue('permisos', newPermisos); // Actualizar Formik con array de IDs
                                                                        }} 
                                                                        dense
                                                                    >
                                                                        <ListItemIcon sx={{ minWidth: 0, mr: 1 }}>
                                                                            <Checkbox
                                                                                edge="start"
                                                                                checked={isChecked}
                                                                                tabIndex={-1}
                                                                                disableRipple
                                                                                inputProps={{ 'aria-labelledby': labelId }}
                                                                            />
                                                                        </ListItemIcon>
                                                                        <ListItemText 
                                                                            id={labelId} 
                                                                            primary={permiso.nombre} 
                                                                            secondary={permiso.descripcion || `(${permiso.codigo})`} // Mostrar descripción o código
                                                                        />
                                                                    </ListItemButton>
                                                                </ListItem>
                                                            );
                                                        })}
                                                    </ul>
                                                </li>
                                            ))}
                                        </List>
                                    </Paper>
                                    {/* Mostrar error de validación para los permisos */}
                                    {touched.permisos && errors.permisos && (
                                        <FormHelperText error>{errors.permisos}</FormHelperText>
                                    )}
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                                <Button onClick={() => navigate('/admin/roles')} variant="outlined" disabled={isSubmitting}>
                                    Cancelar
                                </Button>
                                <Button type="submit" variant="contained" disabled={isSubmitting || loading} startIcon={isSubmitting ? <CircularProgress size={20} /> : null}>
                                    {isEditMode ? 'Guardar Cambios' : 'Crear Rol'}
                                </Button>
                            </Grid>
                        </Grid>
                    </Form>
                )}
            </Formik>
        </Paper>
    );
};

export default RolForm; 