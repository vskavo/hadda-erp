import React, { useState } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  TextField,
  InputAdornment,
  IconButton,
  Toolbar,
  Typography,
  Tooltip,
  Chip,
  Menu,
  MenuItem,
  Divider
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { visuallyHidden } from '@mui/utils';

// Función para ordenar datos
function descendingComparator(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

function stableSort(array, comparator) {
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}

const DataTable = ({
  columns,
  rows, // Cambiado de data a rows
  title,
  filters = [],
  onRowClick,
  actions = [],
  // Props para paginación y ordenamiento del lado del servidor
  page,
  rowsPerPage,
  totalItems,
  onPageChange,
  onRowsPerPageChange,
  onRequestSort,
  orderBy,
  order,
  loading,
  // Props anteriores para paginación del lado del cliente (se mantienen por retrocompatibilidad)
  initialOrderBy = '',
  initialOrder = 'asc',
  rowsPerPageOptions = [5, 10, 25],
  defaultRowsPerPage = 10,
  searchPlaceholder = "Buscar...",
  searchFields = [],
  hideSearch = false,
}) => {
  // Determinar si es paginación del lado del servidor
  const isServerSide = page !== undefined && rowsPerPage !== undefined && totalItems !== undefined;

  // Estado interno (solo para paginación del lado del cliente)
  const [internalOrder, setInternalOrder] = useState(initialOrder);
  const [internalOrderBy, setInternalOrderBy] = useState(initialOrderBy);
  const [internalPage, setInternalPage] = useState(0);
  const [internalRowsPerPage, setInternalRowsPerPage] = useState(defaultRowsPerPage);
  const [searchText, setSearchText] = useState('');
  const [activeFilters, setActiveFilters] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);

  const currentOrder = isServerSide ? order : internalOrder;
  const currentOrderBy = isServerSide ? orderBy : internalOrderBy;
  const currentPage = isServerSide ? page : internalPage;
  const currentRowsPerPage = isServerSide ? rowsPerPage : internalRowsPerPage;

  const handleRequestSort = (property) => {
    if (isServerSide) {
      if (onRequestSort) onRequestSort(property);
    } else {
      const isAsc = internalOrderBy === property && internalOrder === 'asc';
      setInternalOrder(isAsc ? 'desc' : 'asc');
      setInternalOrderBy(property);
    }
  };

  const handleChangePage = (event, newPage) => {
    if (isServerSide) {
      if (onPageChange) onPageChange(event, newPage);
    } else {
      setInternalPage(newPage);
    }
  };

  const handleChangeRowsPerPage = (event) => {
    if (isServerSide) {
      if (onRowsPerPageChange) onRowsPerPageChange(event);
    } else {
      setInternalRowsPerPage(parseInt(event.target.value, 10));
      setInternalPage(0);
    }
  };

  const handleSearchChange = (event) => {
    setSearchText(event.target.value);
    if (!isServerSide) {
      setInternalPage(0);
    }
  };

  const handleClearSearch = () => {
    setSearchText('');
  };

  const handleFilterClick = (filter) => {
    if (activeFilters.includes(filter)) {
      setActiveFilters(activeFilters.filter(f => f !== filter));
    } else {
      setActiveFilters([...activeFilters, filter]);
    }
    if (!isServerSide) {
      setInternalPage(0);
    }
  };

  const handleActionsClick = (event, row) => {
    setAnchorEl(event.currentTarget);
    setSelectedRow(row);
  };

  const handleActionClose = () => {
    setAnchorEl(null);
    setSelectedRow(null);
  };

  const handleActionSelect = (action) => {
    if (action.onClick) {
      action.onClick(selectedRow);
    }
    handleActionClose();
  };

  // Asegurarse de que rows es un array antes de filtrar
  const safeData = Array.isArray(rows) ? rows : [];
  
  // Procesamiento de datos (solo para el lado del cliente)
  const processedData = isServerSide 
    ? safeData 
    : (() => {
        const filteredData = safeData.filter(row => {
          if (searchText) {
            const searchLower = searchText.toLowerCase();
            if (searchFields && searchFields.length > 0) {
              return searchFields.some(field => {
                const value = row[field];
                return value !== null && value !== undefined && value.toString().toLowerCase().includes(searchLower);
              });
            }
            return Object.values(row).some(value => 
              value !== null && value !== undefined && value.toString().toLowerCase().includes(searchLower)
            );
          }
          return true;
        }).filter(row => {
          if (activeFilters.length === 0) return true;
          return activeFilters.some(filter => {
            if (filter.field && filter.value) {
              return row[filter.field] === filter.value;
            }
            return true;
          });
        });

        return stableSort(filteredData, getComparator(currentOrder, currentOrderBy))
          .slice(currentPage * currentRowsPerPage, currentPage * currentRowsPerPage + currentRowsPerPage);
      })();

  return (
    <Paper sx={{ width: '100%', mb: 2 }}>
      <Toolbar sx={{ pl: 2, pr: 1, display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="h6" id="tableTitle" component="div">
          {title}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {filters.length > 0 && (
            <Box sx={{ mr: 2 }}>
              {filters.map((filter) => (
                <Tooltip key={filter.label} title={filter.label}>
                  <Chip
                    label={filter.label}
                    clickable
                    onClick={() => handleFilterClick(filter)}
                    color={activeFilters.includes(filter) ? "primary" : "default"}
                    sx={{ mr: 1 }}
                  />
                </Tooltip>
              ))}
            </Box>
          )}
          
          {!hideSearch && (
            <TextField
              variant="outlined"
              size="small"
              placeholder={searchPlaceholder}
              value={searchText}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: searchText && (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="clear search"
                      onClick={handleClearSearch}
                      edge="end"
                      size="small"
                    >
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          )}

          {filters.length > 0 && !hideSearch && (
            <Tooltip title="Filtrar lista">
              <IconButton>
                <FilterListIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Toolbar>
      
      <TableContainer>
        <Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle" size="medium">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.numeric ? 'right' : 'left'}
                  padding={column.disablePadding ? 'none' : 'normal'}
                  sortDirection={currentOrderBy === column.id ? currentOrder : false}
                  style={{ minWidth: column.minWidth }}
                >
                  {column.sortable !== false ? (
                    <TableSortLabel
                      active={currentOrderBy === column.id}
                      direction={currentOrderBy === column.id ? currentOrder : 'asc'}
                      onClick={() => handleRequestSort(column.id)}
                    >
                      {column.label}
                      {currentOrderBy === column.id ? (
                        <Box component="span" sx={visuallyHidden}>
                          {currentOrder === 'desc' ? 'ordenado descendente' : 'ordenado ascendente'}
                        </Box>
                      ) : null}
                    </TableSortLabel>
                  ) : (
                    column.label
                  )}
                </TableCell>
              ))}
              {actions.length > 0 && (
                <TableCell align="right">Acciones</TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {processedData.length > 0 ? (
              processedData.map((row, index) => {
                return (
                  <TableRow
                    hover
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    tabIndex={-1}
                    key={row.id || index}
                    sx={{ cursor: onRowClick ? 'pointer' : 'default' }}
                  >
                    {columns.map((column) => {
                      const value = row[column.id];
                      return (
                        <TableCell key={column.id} align={column.numeric ? 'right' : 'left'}>
                          {column.format ? column.format(value, row) : value}
                        </TableCell>
                      );
                    })}
                    {actions.length > 0 && (
                      <TableCell align="right">
                        <IconButton
                          aria-label="más opciones"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleActionsClick(event, row);
                          }}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length + (actions.length > 0 ? 1 : 0)} align="center">
                  No se encontraron registros
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      <TablePagination
        rowsPerPageOptions={rowsPerPageOptions}
        component="div"
        count={isServerSide ? totalItems : processedData.length}
        rowsPerPage={currentRowsPerPage}
        page={currentPage}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Filas por página:"
        labelDisplayedRows={({ from, to, count }) => {
          const total = isServerSide ? totalItems : count;
          return `${from}-${to} de ${total}`;
        }}
      />

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleActionClose}
      >
        {actions
          .filter(action => !action.hide || !selectedRow || !action.hide(selectedRow))
          .map((action, index, filteredActions) => (
          <React.Fragment key={action.label}>
            <MenuItem 
              onClick={() => handleActionSelect(action)}
              disabled={action.disabled && selectedRow ? action.disabled(selectedRow) : false}
            >
              {action.icon && (
                <Box component="span" sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
                  {action.icon}
                </Box>
              )}
              {action.label}
            </MenuItem>
            {index < filteredActions.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </Menu>
    </Paper>
  );
};

export default DataTable; 