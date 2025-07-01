import React from 'react';
import { Box, Grid, Button, Paper, Typography, Divider } from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import FormField from './FormField';

const FormBuilder = ({
  fields,
  initialValues = {},
  validationSchema,
  onSubmit,
  onCancel,
  submitText = 'Guardar',
  cancelText = 'Cancelar',
  loading = false,
  title,
  description,
  gridItemProps = { xs: 12, sm: 6 },
  paperProps = { elevation: 3, sx: { p: 3 } },
  dense = false,
  showCancelButton = true,
  submitButtonProps = {},
  cancelButtonProps = {},
  buttonsContainerProps = {},
  renderButtons,
  id,
}) => {
  // Crear esquema de validación a partir de los campos si no se proporciona
  const generateValidationSchema = () => {
    if (validationSchema) return validationSchema;

    const schema = {};
    fields.forEach((field) => {
      if (field.validation) {
        schema[field.name] = field.validation;
      }
    });

    return Yup.object().shape(schema);
  };

  // Inicializar formik con valores iniciales y validación
  const formik = useFormik({
    initialValues,
    validationSchema: generateValidationSchema(),
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        await onSubmit(values);
        if (onSubmit.resetFormAfterSubmit) {
          resetForm();
        }
      } finally {
        setSubmitting(false);
      }
    },
  });

  // Función para renderizar un campo
  const renderField = (field) => {
    // Si el campo tiene una condición de visualización y no se cumple, no renderizar
    if (field.showIf && !field.showIf(formik.values)) {
      return null;
    }

    // Props comunes para todos los campos
    const fieldProps = {
      id: `${id ? id + '-' : ''}${field.name}`,
      name: field.name,
      label: field.label,
      type: field.type,
      value: formik.values[field.name],
      onChange: field.onChange || formik.handleChange,
      onBlur: formik.handleBlur,
      error: formik.touched[field.name] && Boolean(formik.errors[field.name]),
      helperText: formik.touched[field.name] && formik.errors[field.name],
      required: field.required,
      disabled: loading || field.disabled,
      options: field.options,
      placeholder: field.placeholder,
      fullWidth: field.fullWidth !== undefined ? field.fullWidth : true,
      multiple: field.multiple,
      size: dense ? 'small' : field.size,
      handleValueChange: (newValue, fieldName) => {
        formik.setFieldValue(fieldName, newValue);
        if (field.onValueChange) {
          field.onValueChange(newValue, formik);
        }
      },
      ...field.fieldProps,
    };

    return (
      <Grid
        item
        {...(field.gridProps || gridItemProps)}
        key={field.name}
      >
        {field.render ? (
          field.render({
            field: fieldProps,
            formik,
            loading,
          })
        ) : (
          <FormField {...fieldProps} />
        )}
      </Grid>
    );
  };

  // Renderizar botones del formulario
  const renderFormButtons = () => {
    if (renderButtons) {
      return renderButtons({
        formik,
        loading,
        submitText,
        cancelText,
        onCancel,
      });
    }

    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 2,
          mt: 3,
          ...buttonsContainerProps,
        }}
      >
        {showCancelButton && (
          <Button
            variant="outlined"
            color="secondary"
            onClick={onCancel}
            disabled={loading}
            {...cancelButtonProps}
          >
            {cancelText}
          </Button>
        )}
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={loading || !formik.isValid || !formik.dirty}
          {...submitButtonProps}
        >
          {loading ? 'Procesando...' : submitText}
        </Button>
      </Box>
    );
  };

  return (
    <Paper {...paperProps}>
      {title && (
        <>
          <Typography variant="h5" component="h2" gutterBottom>
            {title}
          </Typography>
          {description && (
            <Typography variant="body2" color="textSecondary" paragraph>
              {description}
            </Typography>
          )}
          <Divider sx={{ mb: 3 }} />
        </>
      )}
      <Box component="form" noValidate onSubmit={formik.handleSubmit}>
        <Grid container spacing={dense ? 1 : 2}>
          {fields.map((field) => renderField(field))}
        </Grid>
        {renderFormButtons()}
      </Box>
    </Paper>
  );
};

export default FormBuilder; 