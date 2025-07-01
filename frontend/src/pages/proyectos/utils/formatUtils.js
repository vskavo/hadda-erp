// Función para formatear números con separadores de miles
export const formatNumber = (value) => {
  if (value === null || value === undefined || value === '') return '';
  
  try {
    // Convertir a número y luego a string para manejar valores con decimales
    const cleanValue = value.toString().replace(/[^\d.-]/g, '');
    const number = parseFloat(cleanValue);
    
    if (isNaN(number)) return '';
    
    // Formatear con separadores de miles
    return number.toLocaleString('es-CL', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  } catch (error) {
    console.error('Error al formatear número:', error);
    return '';
  }
};

// Función para desformatear números (quitar separadores)
export const unformatNumber = (value) => {
  if (value === null || value === undefined || value === '') return '';
  
  try {
    // Quitar todos los caracteres que no sean dígitos
    return value.toString().replace(/[^\d]/g, '');
  } catch (error) {
    console.error('Error al desformatear número:', error);
    return '';
  }
};

// Formatear número como moneda CLP (ej: $1.234.567)
export const formatCurrency = (value) => {
  const number = parseFloat(value) || 0;
  // Usar toLocaleString para formato CLP, eliminando decimales si son .00
  return number.toLocaleString('es-CL', { 
    style: 'currency', 
    currency: 'CLP', 
    minimumFractionDigits: 0, 
    maximumFractionDigits: 0 
  });
}; 