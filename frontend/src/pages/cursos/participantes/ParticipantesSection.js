import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Tooltip, Typography, CircularProgress, Collapse, Box } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RestoreIcon from '@mui/icons-material/Restore';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import Checkbox from '@mui/material/Checkbox';

const ParticipantesSection = ({
  participantes = [],
  tipo = 'activo', // 'activo' o 'retirado'
  loading = false,
  onEdit,
  onRetirar,
  onReactivar,
  onCertificadoChange,
  onCertificadoMasivoChange
}) => {
  const [openRows, setOpenRows] = useState({});

  // Determinar si todos los certificados están en true
  const allChecked = participantes.length > 0 && participantes.every(p => !!p.certificado);
  const someChecked = participantes.some(p => !!p.certificado);

  const handleHeaderCheck = () => {
    if (!participantes.length) return;
    const nextValue = !allChecked;
    let mensaje = nextValue
      ? '¿Desea marcar TODOS los certificados como enviados?'
      : '¿Desea marcar TODOS los certificados como NO enviados?';
    if (window.confirm(mensaje)) {
      onCertificadoMasivoChange && onCertificadoMasivoChange(nextValue);
    }
  };

  const handleToggleRow = (id) => {
    setOpenRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <>
      <Typography variant="h6" sx={{ mb: 1 }}>
        {tipo === 'activo' ? 'Participantes activos' : 'Participantes retirados'}
      </Typography>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell />
              <TableCell>RUT</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Apellido</TableCell>
              <TableCell>Tramo SENCE</TableCell>
              <TableCell>
                <Checkbox
                  checked={allChecked}
                  indeterminate={!allChecked && someChecked}
                  onChange={handleHeaderCheck}
                  color="primary"
                  inputProps={{ 'aria-label': 'Seleccionar todos los certificados' }}
                  disabled={tipo !== 'activo' || participantes.length === 0}
                />
                Certificado
              </TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            ) : participantes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No hay participantes {tipo === 'activo' ? 'activos' : 'retirados'}
                </TableCell>
              </TableRow>
            ) : (
              participantes.map((p) => (
                <React.Fragment key={p.id}>
                  <TableRow>
                    <TableCell>
                      <IconButton size="small" onClick={() => handleToggleRow(p.id)}>
                        {openRows[p.id] ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                      </IconButton>
                    </TableCell>
                    <TableCell>{p.rut}</TableCell>
                    <TableCell>{p.nombre}</TableCell>
                    <TableCell>{p.apellido}</TableCell>
                    <TableCell>{p.tramo_sence || '-'}</TableCell>
                    <TableCell>
                      <Checkbox
                        checked={!!p.certificado}
                        onChange={e => onCertificadoChange && onCertificadoChange(p, e.target.checked)}
                        color="primary"
                        inputProps={{ 'aria-label': 'Certificado enviado' }}
                        disabled={tipo !== 'activo'}
                      />
                    </TableCell>
                    <TableCell>
                      {tipo === 'activo' && (
                        <>
                          <Tooltip title="Editar">
                            <IconButton size="small" onClick={() => onEdit && onEdit(p)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Retirar">
                            <IconButton size="small" color="error" onClick={() => onRetirar && onRetirar(p)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      {tipo === 'retirado' && (
                        <Tooltip title="Reactivar">
                          <IconButton size="small" color="primary" onClick={() => onReactivar && onReactivar(p)}>
                            <RestoreIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                      <Collapse in={openRows[p.id]} timeout="auto" unmountOnExit>
                        <Box margin={1}>
                          <Typography variant="subtitle2" gutterBottom component="div">
                            Información adicional
                          </Typography>
                          <Box component="div" sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                            <Typography variant="body2"><b>Email:</b> {p.email || '-'}</Typography>
                            <Typography variant="body2"><b>Teléfono:</b> {p.telefono || '-'}</Typography>
                            <Typography variant="body2"><b>Empresa:</b> {p.empresa || '-'}</Typography>
                            <Typography variant="body2"><b>Cargo:</b> {p.cargo || '-'}</Typography>
                          </Box>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};

export default ParticipantesSection; 