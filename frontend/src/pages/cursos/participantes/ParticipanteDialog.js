import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Grid, CircularProgress, Alert } from '@mui/material';

const initialState = { nombre: '', apellido: '', rut: '', email: '', telefono: '' };

const ParticipanteDialog = ({ open, participante, onClose, onSave, loading, error }) => {
  const [form, setForm] = useState(initialState);
  const [touched, setTouched] = useState({});

  useEffect(() => {
    if (participante) {
      setForm({
        nombre: participante.nombre || '',
        apellido: participante.apellido || '',
        rut: participante.rut || '',
        email: participante.email || '',
        telefono: participante.telefono || ''
      });
    } else {
      setForm(initialState);
    }
    setTouched({});
  }, [participante, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const validate = () => {
    const errors = {};
    if (!form.nombre) errors.nombre = 'El nombre es obligatorio';
    if (!form.apellido) errors.apellido = 'El apellido es obligatorio';
    if (!form.rut) errors.rut = 'El RUT es obligatorio';
    // Nueva validación: solo acepta formato 12345678-9
    if (form.rut && !/^\d{7,8}-[\dkK]$/.test(form.rut)) errors.rut = 'Formato de RUT inválido (ej: 12345678-9)';
    if (form.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) errors.email = 'Email inválido';
    return errors;
  };

  const errors = validate();
  const isValid = Object.keys(errors).length === 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched({ nombre: true, apellido: true, rut: true, email: true, telefono: true });
    if (isValid && !loading) {
      onSave(form);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{participante ? 'Editar Participante' : 'Añadir Nuevo Participante'}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <form onSubmit={handleSubmit} id="participante-form">
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nombre"
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                error={touched.nombre && Boolean(errors.nombre)}
                helperText={touched.nombre && errors.nombre}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Apellido"
                name="apellido"
                value={form.apellido}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                error={touched.apellido && Boolean(errors.apellido)}
                helperText={touched.apellido && errors.apellido}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="RUT"
                name="rut"
                value={form.rut}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                error={touched.rut && Boolean(errors.rut)}
                helperText={touched.rut && errors.rut ? errors.rut : 'Formato: 12345678-9'}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.email && Boolean(errors.email)}
                helperText={touched.email && errors.email}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Teléfono"
                name="telefono"
                value={form.telefono}
                onChange={handleChange}
                onBlur={handleBlur}
              />
            </Grid>
          </Grid>
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit" disabled={loading}>Cancelar</Button>
        <Button onClick={handleSubmit} color="primary" variant="contained" disabled={!isValid || loading} form="participante-form">
          {loading ? <CircularProgress size={24} /> : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ParticipanteDialog; 