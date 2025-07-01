import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Box, 
    Button, 
    Typography, 
    CircularProgress, 
    Alert, 
    IconButton, 
    Tooltip 
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import LockOpenIcon from '@mui/icons-material/LockOpen'; // Icono para permisos
import { getRoles, deleteRol } from '../../../services/rolesService'; 
// Asumiendo que tienes un componente de confirmación
// import ConfirmationDialog from '../../components/common/ConfirmationDialog';

const RolesList = () => {
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // const [confirmOpen, setConfirmOpen] = useState(false);
    // const [roleToDelete, setRoleToDelete] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getRoles();
            // Mapeamos para incluir un id si no lo tiene o es diferente
            // y para mostrar la cantidad de permisos
            setRoles(data.map(rol => ({
                ...rol,
                id: rol.id, // Asegura que el id es el correcto para DataGrid
                permisosCount: rol.permisos ? rol.permisos.length : 0
            })));
        } catch (err) {
            setError(err.message || 'Error al cargar los roles');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        navigate('/admin/roles/nuevo');
    };

    const handleEdit = (id) => {
        navigate(`/admin/roles/editar/${id}`);
    };
    
    // const openDeleteConfirm = (id) => {
    //     setRoleToDelete(id);
    //     setConfirmOpen(true);
    // };

    // const handleCloseConfirm = () => {
    //     setConfirmOpen(false);
    //     setRoleToDelete(null);
    // };

    const handleDelete = async (id) => {
        // Idealmente, usar un diálogo de confirmación antes de eliminar
        // setConfirmOpen(false); 
        if (!window.confirm('¿Estás seguro de que deseas eliminar este rol? Esta acción no se puede deshacer.')) {
             return;
        }
        
        try {
            await deleteRol(id);
            // Volver a cargar los roles después de eliminar
            fetchRoles();
            // Mostrar notificación de éxito (puedes usar un Snackbar de MUI)
            console.log("Rol eliminado con éxito");
        } catch (err) {
            setError(err.message || 'Error al eliminar el rol');
            // Mostrar notificación de error
        }
        // setRoleToDelete(null);
    };

    const columns = [
        { field: 'id', headerName: 'ID', width: 90 },
        { field: 'nombre', headerName: 'Nombre del Rol', flex: 1 },
        { field: 'descripcion', headerName: 'Descripción', flex: 2 },
        {
            field: 'permisosCount',
            headerName: 'Permisos Asignados',
            width: 180,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <LockOpenIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                    {params.value}
                </Box>
            )
        },
        {
            field: 'sistema', 
            headerName: 'Sistema', 
            width: 120,
            type: 'boolean', 
            renderCell: (params) => (params.value ? 'Sí' : 'No')
        },
        {
            field: 'actions',
            headerName: 'Acciones',
            width: 150,
            sortable: false,
            disableColumnMenu: true,
            renderCell: (params) => (
                <Box>
                    <Tooltip title="Editar Rol">
                        <IconButton onClick={() => handleEdit(params.row.id)} size="small">
                            <EditIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar Rol">
                        {/* Deshabilitar si es rol del sistema */}
                        <span>
                             <IconButton 
                                onClick={() => handleDelete(params.row.id)} 
                                size="small" 
                                disabled={params.row.sistema}
                                color={params.row.sistema ? 'default' : 'error'}
                            >
                                <DeleteIcon />
                            </IconButton>
                        </span>
                    </Tooltip>
                </Box>
            ),
        },
    ];

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4" gutterBottom>
                    Gestión de Roles
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreate}
                >
                    Crear Nuevo Rol
                </Button>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <Box sx={{ height: 600, width: '100%' }}>
                    <DataGrid
                        rows={roles}
                        columns={columns}
                        pageSize={10}
                        rowsPerPageOptions={[5, 10, 20]}
                        checkboxSelection={false}
                        disableSelectionOnClick
                        components={{ Toolbar: GridToolbar }}
                        // initialState={{
                        //     pagination: {
                        //         paginationModel: { page: 0, pageSize: 10 },
                        //     },
                        // }}
                        // pageSizeOptions={[5, 10]}
                        // loading={loading} // DataGrid tiene su propio indicador de carga
                    />
                </Box>
            )}
            
            {/* 
            Idealmente, usar un componente de diálogo de confirmación reutilizable 
            <ConfirmationDialog
                open={confirmOpen}
                onClose={handleCloseConfirm}
                onConfirm={handleDelete}
                title="Confirmar Eliminación"
                message={`¿Estás seguro de que deseas eliminar el rol con ID ${roleToDelete}?`}
            /> 
            */}
        </Box>
    );
};

export default RolesList; 