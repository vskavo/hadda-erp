/**
 * Ejemplos de uso del servicio de generación de PDFs
 * Este archivo es solo una referencia y no se utiliza en la aplicación.
 */

// Ejemplo de cómo generar una factura desde el frontend
const generarFacturaEjemplo = async () => {
  try {
    const datosFactura = {
      numero: 'F-001234',
      fecha: '2024-03-20',
      cliente: 'Empresa ABC SpA',
      rut: '12.345.678-9',
      direccion: 'Av. Principal 123, Santiago',
      items: [
        {
          descripcion: 'Curso de Excel Avanzado',
          cantidad: 1,
          precioUnitario: 150000,
          total: 150000
        },
        {
          descripcion: 'Material didáctico',
          cantidad: 10,
          precioUnitario: 5000,
          total: 50000
        }
      ],
      subtotal: 200000,
      iva: 38000,
      total: 238000,
      observaciones: 'Factura electrónica'
    };

    const response = await fetch('/api/pdf/factura', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem('token')
      },
      body: JSON.stringify(datosFactura)
    });

    const result = await response.json();

    if (result.success) {
      // Crear un enlace para descargar el PDF
      const link = document.createElement('a');
      link.href = `data:${result.contentType};base64,${result.pdf}`;
      link.download = result.filename;
      link.click();
    } else {
      console.error('Error al generar la factura:', result.error);
    }
  } catch (error) {
    console.error('Error en la solicitud:', error);
  }
};

// Ejemplo de cómo generar un certificado desde el frontend
const generarCertificadoEjemplo = async () => {
  try {
    const datosCertificado = {
      participante: 'Juan Pérez González',
      rut: '12.345.678-9',
      curso: 'Desarrollo de Aplicaciones Web con React',
      fechaInicio: '2024-01-15',
      fechaTermino: '2024-03-15',
      horas: 80,
      nota: 6.5,
      instructor: 'María Rodríguez',
      codigoSence: 'SENCE-1234-567',
      numeroRegistro: 'CERT-2024-123',
      fecha: '2024-03-20',
      firmante: 'Pedro Sánchez',
      cargoFirmante: 'Director Académico'
    };

    const response = await fetch('/api/pdf/certificado', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem('token')
      },
      body: JSON.stringify(datosCertificado)
    });

    const result = await response.json();

    if (result.success) {
      // Crear un enlace para descargar el PDF
      const link = document.createElement('a');
      link.href = `data:${result.contentType};base64,${result.pdf}`;
      link.download = result.filename;
      link.click();
    } else {
      console.error('Error al generar el certificado:', result.error);
    }
  } catch (error) {
    console.error('Error en la solicitud:', error);
  }
};

// Ejemplo de cómo generar una declaración jurada desde el frontend
const generarDeclaracionJuradaEjemplo = async () => {
  try {
    const datosDeclaracion = {
      otec: 'Centro de Capacitación ABC',
      rutOtec: '12.345.678-9',
      curso: 'Desarrollo de Aplicaciones Web con React',
      codigoSence: 'SENCE-1234-567',
      fechaInicio: '2024-01-15',
      fechaTermino: '2024-03-15',
      participantes: [
        {
          nombre: 'Juan Pérez González',
          rut: '12.345.678-9',
          asistencia: 100,
          aprobado: true
        },
        {
          nombre: 'María López Silva',
          rut: '9.876.543-2',
          asistencia: 85,
          aprobado: true
        }
      ],
      fecha: '2024-03-20',
      declarante: 'Pedro Sánchez',
      rutDeclarante: '11.111.111-1',
      cargoDeclarante: 'Director Académico'
    };

    const response = await fetch('/api/pdf/declaracion-jurada', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem('token')
      },
      body: JSON.stringify(datosDeclaracion)
    });

    const result = await response.json();

    if (result.success) {
      // Crear un enlace para descargar el PDF
      const link = document.createElement('a');
      link.href = `data:${result.contentType};base64,${result.pdf}`;
      link.download = result.filename;
      link.click();
    } else {
      console.error('Error al generar la declaración jurada:', result.error);
    }
  } catch (error) {
    console.error('Error en la solicitud:', error);
  }
};

// Ejemplo de cómo generar un informe desde el frontend
const generarInformeEjemplo = async () => {
  try {
    const datosInforme = {
      titulo: 'Informe de Cursos Realizados - Primer Trimestre 2024',
      subtitulo: 'Análisis de desempeño y resultados',
      fecha: '2024-03-31',
      autor: 'María Rodríguez',
      cargo: 'Jefa de Operaciones',
      seccion1: {
        titulo: 'Resumen Ejecutivo',
        contenido: 'Durante el primer trimestre de 2024, se han realizado 10 cursos con un total de 150 participantes...'
      },
      seccion2: {
        titulo: 'Cursos Realizados',
        contenido: 'A continuación se detallan los cursos realizados en el período...',
        tabla: [
          { curso: 'Excel Avanzado', participantes: 15, aprobados: 14, satisfaccion: 4.7 },
          { curso: 'Desarrollo Web', participantes: 20, aprobados: 18, satisfaccion: 4.5 },
          { curso: 'Liderazgo', participantes: 12, aprobados: 12, satisfaccion: 4.9 }
        ]
      },
      seccion3: {
        titulo: 'Conclusiones',
        contenido: 'En base a los resultados obtenidos, se recomienda...'
      },
      grafico1: {
        titulo: 'Participantes por Curso',
        tipo: 'bar',
        datos: {
          labels: ['Excel', 'Desarrollo Web', 'Liderazgo'],
          datasets: [15, 20, 12]
        }
      }
    };

    const response = await fetch('/api/pdf/informe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem('token')
      },
      body: JSON.stringify(datosInforme)
    });

    const result = await response.json();

    if (result.success) {
      // Crear un enlace para descargar el PDF
      const link = document.createElement('a');
      link.href = `data:${result.contentType};base64,${result.pdf}`;
      link.download = result.filename;
      link.click();
    } else {
      console.error('Error al generar el informe:', result.error);
    }
  } catch (error) {
    console.error('Error en la solicitud:', error);
  }
};

// Ejemplo de cómo verificar la conexión con la Azure Function
const verificarConexionEjemplo = async () => {
  try {
    const response = await fetch('/api/pdf/verificar-conexion', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('token')
      }
    });

    const result = await response.json();

    if (result.success) {
      console.log('Conexión con Azure Function establecida correctamente');
    } else {
      console.error('Error al verificar la conexión:', result.error);
    }
  } catch (error) {
    console.error('Error en la solicitud:', error);
  }
};

// No exportamos nada, este archivo es solo para referencia 