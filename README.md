# Aplicación de Compatibilidad de Medicamentos en el Embarazo

Esta aplicación permite analizar la compatibilidad de medicamentos durante el embarazo, procesando historias clínicas en formato PDF y proporcionando un análisis detallado de los medicamentos encontrados.

## Características

- Análisis de PDFs de historias clínicas
- Detección automática de medicamentos
- Información sobre compatibilidad por trimestre
- Exportación de resultados a PDF
- Historial de análisis
- Interfaz de usuario moderna y responsiva

## Requisitos

- Node.js 14.x o superior
- npm 6.x o superior

## Configuración

### Backend

1. Navega al directorio del backend:
```bash
cd backend
```

2. Instala las dependencias:
```bash
npm install
```

3. Crea un archivo `.env` en el directorio backend con la siguiente configuración:
```
PORT=3001
```

### Frontend

1. Navega al directorio del frontend:
```bash
cd frontend
```

2. Instala las dependencias:
```bash
npm install
```

3. Crea un archivo `.env` en el directorio frontend con la siguiente configuración:
```
REACT_APP_API_URL=http://localhost:3001/api
```

## Ejecución

### Backend

1. En el directorio backend, ejecuta:
```bash
npm run dev
```

El servidor estará disponible en `http://localhost:3001`

### Frontend

1. En el directorio frontend, ejecuta:
```bash
npm start
```

La aplicación estará disponible en `http://localhost:3000`

## Uso

1. Abre la aplicación en tu navegador
2. Selecciona el trimestre de embarazo
3. Sube un archivo PDF con la historia clínica
4. La aplicación analizará automáticamente el documento
5. Revisa los resultados y exporta si es necesario

## Estructura del Proyecto

```
.
├── backend/
│   ├── src/
│   │   └── index.js
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── config.js
│   │   └── App.js
│   ├── package.json
│   └── .env
└── README.md
```

## Tecnologías Utilizadas

- Frontend:
  - React
  - Tailwind CSS
  - html2canvas
  - jsPDF

- Backend:
  - Node.js
  - Express
  - pdf-parse
  - multer

## Contribución

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles. 