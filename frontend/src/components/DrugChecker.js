import { useState, useMemo, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { API_ENDPOINTS } from '../config'

export default function DrugChecker() {
  const [drug, setDrug] = useState("")
  const [trimester, setTrimester] = useState("first")
  const [pdfFile, setPdfFile] = useState(null)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisHistory, setAnalysisHistory] = useState([])
  const [availableDrugs, setAvailableDrugs] = useState([])
  const analysisRef = useRef(null)

  // Cargar lista de medicamentos disponibles al montar el componente
  useEffect(() => {
    const fetchDrugs = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.getDrugs);
        const data = await response.json();
        setAvailableDrugs(data.drugs);
      } catch (error) {
        console.error('Error al cargar la lista de medicamentos:', error);
      }
    };
    fetchDrugs();
  }, []);

  const handlePdfUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsAnalyzing(true);
    setPdfFile(file);

    try {
      const formData = new FormData();
      formData.append('pdf', file);
      formData.append('trimester', trimester);

      const response = await fetch(API_ENDPOINTS.analyzePdf, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Error al analizar el PDF');
      }

      const data = await response.json();
      
      // Añadir al historial
      const newAnalysis = {
        id: Date.now(),
        date: new Date().toLocaleString(),
        fileName: data.fileName,
        report: data.report
      };
      
      setAnalysisHistory(prev => [newAnalysis, ...prev]);
      setAnalysisResult(data.report);
    } catch (error) {
      console.error('Error al analizar el PDF:', error);
      setAnalysisResult({
        title: "Error",
        details: "Hubo un error al analizar el documento PDF."
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExportPDF = () => {
    if (analysisRef.current) {
      exportToPDF('analysis-result', `analisis-medicamentos-${new Date().toISOString().split('T')[0]}.pdf`);
    }
  };

  // Función para exportar a PDF
  const exportToPDF = async (elementId, filename) => {
    const element = document.getElementById(elementId);
    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL('image/png');
    
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth * ratio, imgHeight * ratio);
    pdf.save(filename);
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Compatibilidad de Fármacos en el Embarazo</h1>
      
      <div className="mb-4">
        <label htmlFor="drug-input" className="block text-sm font-medium mb-1">
          Nombre del fármaco
        </label>
        <Input 
          id="drug-input"
          placeholder="Introduce el nombre del fármaco" 
          onChange={e => setDrug(e.target.value)} 
          className="mb-2"
          list="drug-list"
          aria-label="Nombre del fármaco"
        />
        <datalist id="drug-list">
          {availableDrugs.map(drug => (
            <option key={drug} value={drug} />
          ))}
        </datalist>
      </div>

      <div className="mb-4">
        <label htmlFor="trimester-select" className="block text-sm font-medium mb-1">
          Trimestre
        </label>
        <Select 
          onValueChange={setTrimester} 
          defaultValue="first"
          aria-label="Selecciona el trimestre"
        >
          <SelectTrigger id="trimester-select" className="mb-4">
            <SelectValue placeholder="Selecciona el trimestre" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="first">1º Trimestre</SelectItem>
            <SelectItem value="second">2º Trimestre</SelectItem>
            <SelectItem value="third">3º Trimestre</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mb-4">
        <label htmlFor="pdf-upload" className="block text-sm font-medium mb-1">
          Cargar Historia Clínica (PDF)
        </label>
        <Input 
          id="pdf-upload"
          type="file"
          accept=".pdf"
          onChange={handlePdfUpload}
          className="mb-2"
          aria-label="Cargar archivo PDF"
        />
      </div>

      {isAnalyzing && (
        <div className="text-center p-4">
          <p>Analizando documento...</p>
        </div>
      )}

      {analysisResult && !isAnalyzing && (
        <div id="analysis-result" ref={analysisRef}>
          <Card className="mt-4">
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">{analysisResult.title}</h2>
                <button
                  onClick={handleExportPDF}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Exportar PDF
                </button>
              </div>
              
              {analysisResult.details.incompatible?.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-semibold text-red-600">Medicamentos No Compatibles:</h3>
                  {analysisResult.details.incompatible.map(drug => (
                    <div key={drug.name} className="ml-4 mt-2">
                      <p className="font-medium">{drug.name}</p>
                      <p className="text-red-600">{drug.status}</p>
                      <p className="text-sm text-gray-600">{drug.notes}</p>
                      {drug.dosageInfo.length > 0 && (
                        <p className="text-sm text-gray-600">
                          Dosis encontrada: {drug.dosageInfo.join(', ')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {analysisResult.details.warnings?.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-semibold text-yellow-600">Medicamentos con Advertencias:</h3>
                  {analysisResult.details.warnings.map(drug => (
                    <div key={drug.name} className="ml-4 mt-2">
                      <p className="font-medium">{drug.name}</p>
                      <p className="text-yellow-600">{drug.status}</p>
                      <p className="text-sm text-gray-600">{drug.notes}</p>
                      {drug.dosageInfo.length > 0 && (
                        <p className="text-sm text-gray-600">
                          Dosis encontrada: {drug.dosageInfo.join(', ')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {analysisResult.details.compatible?.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-semibold text-green-600">Medicamentos Compatibles:</h3>
                  {analysisResult.details.compatible.map(drug => (
                    <div key={drug.name} className="ml-4 mt-2">
                      <p className="font-medium">{drug.name}</p>
                      <p className="text-green-600">{drug.status}</p>
                      <p className="text-sm text-gray-600">{drug.notes}</p>
                      {drug.dosageInfo.length > 0 && (
                        <p className="text-sm text-gray-600">
                          Dosis encontrada: {drug.dosageInfo.join(', ')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analysis History */}
      {analysisHistory.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-bold mb-4">Historial de Análisis</h2>
          <div className="space-y-4">
            {analysisHistory.map(analysis => (
              <Card key={analysis.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{analysis.fileName}</p>
                      <p className="text-sm text-gray-600">{analysis.date}</p>
                    </div>
                    <button
                      onClick={() => setAnalysisResult(analysis.report)}
                      className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                    >
                      Ver Detalles
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 