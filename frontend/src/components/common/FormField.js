import React, { useState } from 'react';
import {
  TextField,
  FormControl,
  FormHelperText,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Switch,
  Radio,
  RadioGroup,
  FormLabel,
  FormGroup,
  IconButton,
  InputAdornment,
  Autocomplete,
  Chip
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker, TimePicker, DateTimePicker } from '@mui/x-date-pickers';
import { es } from 'date-fns/locale';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

// Componente de campo de formulario que maneja diferentes tipos de campos
const FormField = ({
  type = 'text',
  name,
  label,
  value,
  onChange,
  onBlur,
  error,
  helperText,
  required = false,
  disabled = false,
  fullWidth = true,
  options = [],
  multiple = false,
  rows = 4,
  minRows,
  maxRows,
  size = 'medium',
  variant = 'outlined',
  margin = 'normal',
  InputProps,
  placeholder,
  autoFocus = false,
  autoComplete,
  multiline = false,
  handleValueChange,
  startAdornment,
  endAdornment,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);

  // Para manejar la visualización de contraseña
  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  // Para campos que requieren un handleChange personalizado
  const handleChangeValue = (e, newValue) => {
    // Extraer el valor correcto. Para MUI Select, está en e.target.value
    const actualValue = e && e.target && e.target.hasOwnProperty('value') ? e.target.value : newValue;

    if (handleValueChange) {
      // Pasar el valor extraído, no el evento o el segundo argumento directamente
      handleValueChange(actualValue, name); 
    } else if (onChange) {
      // El resto de la lógica original para otros componentes (como DatePicker)
      if (e && e.target) {
        onChange(e);
      } else {
        const event = {
          target: {
            name,
            value: actualValue // Usar actualValue aquí también por consistencia
          }
        };
        onChange(event);
      }
    }
  };

  // Configuración de InputProps para campos tipo password
  const getPasswordInputProps = () => {
    return {
      endAdornment: (
        <InputAdornment position="end">
          <IconButton
            aria-label="toggle password visibility"
            onClick={handleClickShowPassword}
            edge="end"
          >
            {showPassword ? <VisibilityOff /> : <Visibility />}
          </IconButton>
        </InputAdornment>
      ),
      ...InputProps
    };
  };

  // Común para todos los campos
  const commonProps = {
    name,
    disabled,
    required,
    error: !!error,
    fullWidth,
    size,
    variant,
    margin,
    onBlur,
    placeholder,
    autoFocus,
    autoComplete,
    ...(helperText && { helperText }),
    ...props
  };

  // Renderizar según el tipo de campo
  switch (type) {
    case 'text':
    case 'email':
    case 'number':
    case 'tel':
    case 'url':
      return (
        <TextField
          {...commonProps}
          label={label}
          type={type}
          value={value || ''}
          onChange={onChange}
          multiline={multiline}
          rows={multiline ? rows : undefined}
          minRows={multiline ? minRows : undefined}
          maxRows={multiline ? maxRows : undefined}
          InputProps={{
            ...(startAdornment && { startAdornment: <InputAdornment position="start">{startAdornment}</InputAdornment> }),
            ...(endAdornment && { endAdornment: <InputAdornment position="end">{endAdornment}</InputAdornment> }),
            ...InputProps
          }}
        />
      );

    case 'password':
      return (
        <TextField
          {...commonProps}
          label={label}
          type={showPassword ? 'text' : 'password'}
          value={value || ''}
          onChange={onChange}
          InputProps={getPasswordInputProps()}
        />
      );

    case 'textarea':
      return (
        <TextField
          {...commonProps}
          label={label}
          multiline
          rows={rows}
          minRows={minRows}
          maxRows={maxRows}
          value={value || ''}
          onChange={onChange}
        />
      );

    case 'select':
      return (
        <FormControl
          {...commonProps}
          error={!!error}
        >
          <InputLabel id={`${name}-label`}>{label}</InputLabel>
          <Select
            labelId={`${name}-label`}
            id={name}
            value={value || (multiple ? [] : '')}
            label={label}
            onChange={handleChangeValue}
            multiple={multiple}
            renderValue={multiple ? (selected) => (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value) => {
                  const option = options.find(opt => opt.value === value);
                  return (
                    <Chip key={value} label={option ? option.label : value} />
                  );
                })}
              </div>
            ) : undefined}
          >
            {options.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
          {helperText && <FormHelperText>{helperText}</FormHelperText>}
        </FormControl>
      );

    case 'checkbox':
      return (
        <FormControl
          component="fieldset"
          error={!!error}
          fullWidth={fullWidth}
          margin={margin}
        >
          <FormControlLabel
            control={
              <Checkbox
                name={name}
                checked={!!value}
                onChange={onChange}
                disabled={disabled}
                required={required}
                {...props}
              />
            }
            label={label}
          />
          {helperText && <FormHelperText>{helperText}</FormHelperText>}
        </FormControl>
      );

    case 'switch':
      return (
        <FormControl
          component="fieldset"
          error={!!error}
          fullWidth={fullWidth}
          margin={margin}
        >
          <FormControlLabel
            control={
              <Switch
                name={name}
                checked={!!value}
                onChange={onChange}
                disabled={disabled}
                required={required}
                {...props}
              />
            }
            label={label}
          />
          {helperText && <FormHelperText>{helperText}</FormHelperText>}
        </FormControl>
      );

    case 'radio':
      return (
        <FormControl
          component="fieldset"
          error={!!error}
          fullWidth={fullWidth}
          margin={margin}
          disabled={disabled}
          required={required}
        >
          <FormLabel component="legend">{label}</FormLabel>
          <RadioGroup
            aria-label={label}
            name={name}
            value={value || ''}
            onChange={onChange}
            {...props}
          >
            {options.map((option) => (
              <FormControlLabel
                key={option.value}
                value={option.value}
                control={<Radio />}
                label={option.label}
              />
            ))}
          </RadioGroup>
          {helperText && <FormHelperText>{helperText}</FormHelperText>}
        </FormControl>
      );

    case 'checkbox-group':
      return (
        <FormControl
          component="fieldset"
          error={!!error}
          fullWidth={fullWidth}
          margin={margin}
          disabled={disabled}
          required={required}
        >
          <FormLabel component="legend">{label}</FormLabel>
          <FormGroup>
            {options.map((option) => (
              <FormControlLabel
                key={option.value}
                control={
                  <Checkbox
                    checked={Array.isArray(value) ? value.includes(option.value) : false}
                    onChange={onChange}
                    name={option.value}
                    {...props}
                  />
                }
                label={option.label}
              />
            ))}
          </FormGroup>
          {helperText && <FormHelperText>{helperText}</FormHelperText>}
        </FormControl>
      );

    case 'date':
      return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
          <DatePicker
            label={label}
            value={value || null}
            onChange={(newValue) => handleChangeValue(null, newValue)}
            disabled={disabled}
            slotProps={{
              textField: {
                ...commonProps,
                helperText: helperText
              }
            }}
          />
        </LocalizationProvider>
      );

    case 'time':
      return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
          <TimePicker
            label={label}
            value={value || null}
            onChange={(newValue) => handleChangeValue(null, newValue)}
            disabled={disabled}
            slotProps={{
              textField: {
                ...commonProps,
                helperText: helperText
              }
            }}
          />
        </LocalizationProvider>
      );

    case 'datetime':
      return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
          <DateTimePicker
            label={label}
            value={value || null}
            onChange={(newValue) => handleChangeValue(null, newValue)}
            disabled={disabled}
            slotProps={{
              textField: {
                ...commonProps,
                helperText: helperText
              }
            }}
          />
        </LocalizationProvider>
      );

    case 'autocomplete':
      return (
        <Autocomplete
          multiple={multiple}
          options={options}
          getOptionLabel={(option) => typeof option === 'string' ? option : option.label || ''}
          isOptionEqualToValue={(option, value) => 
            option.value === value.value || option === value
          }
          value={value || (multiple ? [] : null)}
          onChange={(e, newValue) => handleChangeValue(e, newValue)}
          disabled={disabled}
          renderInput={(params) => (
            <TextField
              {...params}
              {...commonProps}
              label={label}
              error={!!error}
              helperText={helperText}
            />
          )}
          {...props}
        />
      );

    default:
      return (
        <TextField
          {...commonProps}
          label={label}
          type={type}
          value={value || ''}
          onChange={onChange}
        />
      );
  }
};

export default FormField; 