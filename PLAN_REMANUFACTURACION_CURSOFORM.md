# Plan de Remanufacturación: `CursoForm.js`

## Justificación
El archivo `CursoForm.js` es actualmente un archivo monolítico de más de 1600 líneas, lo que dificulta su mantenimiento, escalabilidad y testeo. Siguiendo el patrón de modularización del módulo de proyectos, se propone dividir la lógica y la UI en componentes, hooks y utilidades reutilizables.

---

## Nueva Estructura Propuesta

```
frontend/src/pages/cursos/
  CursoForm.js
  hooks/
    useCursoForm.js
    useParticipantes.js
  components/
    CursoInfoSection.js
    CursoFinanzasSection.js
    CursoParticipantesSection.js
    CursoDeclaracionesSection.js
  utils/
    validationUtils.js
    formatUtils.js
  participantes/
    ParticipantesSection.js
    ParticipanteDialog.js
    ParticipanteForm.js
  sesiones/
    ...
```

---

## Desglose de Archivos y Responsabilidades

### 1. **CursoForm.js**
- Componente principal que orquesta el formulario.
- Utiliza hooks personalizados y compone las secciones.
- No contiene lógica de negocio ni renderizado detallado de secciones.

### 2. **hooks/**
- `useCursoForm.js`: Maneja el estado principal del formulario, carga de datos, envío, sincronización SENCE, importación CSV, etc.
- `useParticipantes.js`: Lógica específica para gestión de participantes (añadir, editar, retirar, importar).

### 3. **components/**
- `CursoInfoSection.js`: Renderiza y gestiona la información general del curso (nombre, fechas, modalidad, etc.).
- `CursoFinanzasSection.js`: Renderiza y gestiona la información financiera y la asociación con proyectos.
- `CursoParticipantesSection.js`: Renderiza la sección de participantes, usando los componentes de participantes existentes.
- `CursoDeclaracionesSection.js`: Renderiza la sección de declaraciones juradas y su sincronización.

### 4. **utils/**
- `validationUtils.js`: Esquemas Yup y funciones de validación.
- `formatUtils.js`: Funciones de formateo de fechas, números, etc.

### 5. **participantes/**
- Se reutilizan y mejoran los componentes existentes: `ParticipantesSection.js`, `ParticipanteDialog.js`, `ParticipanteForm.js`.

---

## Orden de Implementación Recomendado

1. **Crear carpetas `hooks/`, `components/`, `utils/` en `cursos/` si no existen.**
2. **Extraer lógica de estado y API de `CursoForm.js` a `useCursoForm.js`.**
3. **Extraer lógica de participantes a `useParticipantes.js`.**
4. **Crear componentes de sección (`CursoInfoSection.js`, `CursoFinanzasSection.js`, etc.) y mover el renderizado correspondiente.**
5. **Extraer validaciones y formateos a `utils/`.**
6. **Actualizar `CursoForm.js` para que solo componga las secciones y pase los props/hook necesarios.**
7. **Revisar y mejorar los componentes de participantes para asegurar su integración.**
8. **Testear cada parte de forma independiente y luego el flujo completo.**

---

## Notas y Buenas Prácticas
- Cada sección debe ser lo más independiente posible.
- Los hooks no deben tener lógica de UI, solo exponer estado y handlers.
- Los componentes deben ser lo más "puros" posible, recibiendo props y callbacks.
- Utilizar PropTypes o TypeScript para tipado si es posible.
- Documentar cada hook y componente brevemente.

---

**Este plan permitirá una migración progresiva y segura, facilitando la mantenibilidad y escalabilidad del módulo de cursos.** 