const express = require('express');
const cors = require('cors');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Configuración de Multer para manejar la carga de archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos PDF'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB límite
  }
});

// Datos de medicamentos (copiados del frontend)
const drugData = {
  "azatioprina": {
    first: "✅ Compatible",
    second: "✅ Compatible",
    third: "✅ Compatible",
    notes: "Puede usarse durante todo el embarazo."
  },
  "metotrexato": {
    first: "❌ No compatible",
    second: "❌ No compatible",
    third: "❌ No compatible",
    notes: "Debe suspenderse antes del embarazo. Teratogénico."
  },
  "aine": {
    first: "✅ Uso corto compatible",
    second: "⚠️ Hasta semana 28",
    third: "❌ No compatible",
    notes: "Suspender después de la semana 28 por riesgo de cierre del ductus arterioso."
  },
  "prednisona": {
    first: "✅ Compatible",
    second: "✅ Compatible",
    third: "✅ Compatible",
    notes: "Idealmente ≤5 mg/día."
  },
  "certolizumab": {
    first: "✅ Compatible",
    second: "✅ Compatible",
    third: "✅ Compatible",
    notes: "No requiere suspensión. No se transfiere al feto."
  },
  "infliximab": {
    first: "✅ Compatible",
    second: "✅ Compatible",
    third: "⚠️ Suspender antes de semana 20",
    notes: "Transferencia transplacentaria alta en 3er trimestre."
  },
  "leflunomida": {
    first: "❌ No compatible",
    second: "❌ No compatible",
    third: "❌ No compatible",
    notes: "Requiere lavado con colestiramina."
  },
  "anakinra": {
    first: "✅ Compatible si necesario",
    second: "✅ Compatible si necesario",
    third: "✅ Compatible si necesario",
    notes: "Puede utilizarse en enfermedad activa."
  }
};

// Sinónimos de medicamentos
const drugSynonyms = {
  "azatioprina": ["imuran", "azasan", "imurel"],
  "metotrexato": ["mtx", "trexall", "rheumatrex"],
  "aine": ["antiinflamatorio no esteroideo", "ibuprofeno", "naproxeno", "diclofenaco"],
  "prednisona": ["deltacortil", "prednisone", "cortisona"],
  "certolizumab": ["cimzia"],
  "infliximab": ["remicade"],
  "leflunomida": ["arava"],
  "anakinra": ["kineret"]
};

// Función para normalizar texto
function normalizeText(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

// Función para extraer información de dosis
function extractDosageInfo(text, drugName) {
  const normalizedText = normalizeText(text);
  const drugPattern = new RegExp(`${normalizeText(drugName)}[^.]*?\\d+\\s*(?:mg|g|ml|mcg)[^.]*?(?:\\d+\\s*(?:veces|al día|diario|semanal|mensual))?`, 'gi');
  const matches = normalizedText.match(drugPattern);
  return matches || [];
}

// Función para encontrar medicamentos en el texto
function findDrugsInText(text) {
  const normalizedText = normalizeText(text);
  const foundDrugs = new Map();
  
  Object.keys(drugData).forEach(drug => {
    const normalizedDrug = normalizeText(drug);
    const synonyms = drugSynonyms[drug] || [];
    const allNames = [drug, ...synonyms];
    
    allNames.forEach(name => {
      const normalizedName = normalizeText(name);
      if (normalizedText.includes(normalizedName)) {
        const dosageInfo = extractDosageInfo(text, name);
        foundDrugs.set(drug, {
          originalName: name,
          dosageInfo: dosageInfo
        });
      }
    });
  });
  
  return foundDrugs;
}

// Función para generar el reporte de compatibilidad
function generateCompatibilityReport(foundDrugs, trimester) {
  if (foundDrugs.size === 0) {
    return {
      title: "No se encontraron medicamentos",
      details: "No se detectaron medicamentos en el documento."
    };
  }

  const incompatibleDrugs = [];
  const warningDrugs = [];
  const compatibleDrugs = [];

  foundDrugs.forEach((info, drug) => {
    const drugInfo = {
      name: drug,
      originalName: info.originalName,
      dosageInfo: info.dosageInfo,
      status: drugData[drug][trimester],
      notes: drugData[drug].notes
    };

    if (drugData[drug][trimester].includes("❌")) {
      incompatibleDrugs.push(drugInfo);
    } else if (drugData[drug][trimester].includes("⚠️")) {
      warningDrugs.push(drugInfo);
    } else {
      compatibleDrugs.push(drugInfo);
    }
  });

  return {
    title: "Resumen de Compatibilidad",
    details: {
      incompatible: incompatibleDrugs,
      warnings: warningDrugs,
      compatible: compatibleDrugs
    }
  };
}

// Endpoint para procesar PDF
app.post('/api/analyze-pdf', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se ha proporcionado ningún archivo PDF' });
    }

    const trimester = req.body.trimester || 'first';
    const pdfBuffer = fs.readFileSync(req.file.path);
    const pdfData = await pdfParse(pdfBuffer);
    
    const foundDrugs = findDrugsInText(pdfData.text);
    const report = generateCompatibilityReport(foundDrugs, trimester);

    // Limpiar el archivo después de procesarlo
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      report: report,
      fileName: req.file.originalname
    });
  } catch (error) {
    console.error('Error al procesar el PDF:', error);
    res.status(500).json({
      success: false,
      error: 'Error al procesar el archivo PDF'
    });
  }
});

// Endpoint para obtener la lista de medicamentos disponibles
app.get('/api/drugs', (req, res) => {
  res.json({
    drugs: Object.keys(drugData),
    synonyms: drugSynonyms
  });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: err.message || 'Error interno del servidor'
  });
});

app.listen(port, () => {
  console.log(`Servidor corriendo en el puerto ${port}`);
}); 