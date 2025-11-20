// src/components/VideoProcessingPanel.jsx
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClosedCaptioning,
  faChartLine,
  faImage,
  faSpinner,
  faDownload,
  faCheckCircle,
  faExclamationTriangle,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import Button from "./Button";
import videoProcessingService from "../services/videoProcessingService";

export default function VideoProcessingPanel({ video, isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState("subtitles");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Estado para subtítulos
  const [subtitleLanguage, setSubtitleLanguage] = useState("es");
  const [subtitleFormat, setSubtitleFormat] = useState("srt");

  // Estado para análisis
  const [analysisLanguage, setAnalysisLanguage] = useState("es");

  // Estado para thumbnail
  const [thumbnailTimestamp, setThumbnailTimestamp] = useState("");

  if (!isOpen || !video) return null;

  const handleGenerateSubtitles = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    const response = await videoProcessingService.generateSubtitles(
      video.id,
      subtitleLanguage,
      subtitleFormat
    );

    setLoading(false);

    if (response.success) {
      setResult({
        type: "subtitles",
        data: response,
      });
    } else {
      setError(
        videoProcessingService.getFriendlyErrorMessage(response.error_type)
      );
    }
  };

  const handleAnalyzeContent = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    const response = await videoProcessingService.analyzeContent(
      video.id,
      analysisLanguage
    );

    setLoading(false);

    if (response.success) {
      setResult({
        type: "analysis",
        data: videoProcessingService.formatAnalysis(response.analysis),
      });
    } else {
      setError(
        videoProcessingService.getFriendlyErrorMessage(response.error_type)
      );
    }
  };

  const handleGenerateThumbnail = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    const timestamp = thumbnailTimestamp
      ? parseFloat(thumbnailTimestamp)
      : null;
    const response = await videoProcessingService.generateThumbnail(
      video.id,
      timestamp
    );

    setLoading(false);

    if (response.success) {
      setResult({
        type: "thumbnail",
        data: response,
      });
    } else {
      setError(
        videoProcessingService.getFriendlyErrorMessage(response.error_type)
      );
    }
  };

  const handleDownloadSubtitles = () => {
    if (result?.type === "subtitles" && result.data.subtitle_url) {
      videoProcessingService.downloadSubtitles(
        result.data.subtitle_url,
        video.id,
        subtitleFormat
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-purple-600 to-blue-600">
          <div className="text-white">
            <h2 className="text-2xl font-bold">🤖 Procesamiento con IA</h2>
            <p className="text-sm opacity-90 mt-1">{video.titulo}</p>
          </div>
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-white hover:bg-white/20"
          >
            <FontAwesomeIcon icon={faTimes} className="text-xl" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b bg-gray-50">
          <button
            onClick={() => setActiveTab("subtitles")}
            className={`flex-1 py-4 px-6 font-medium transition-all ${
              activeTab === "subtitles"
                ? "bg-white text-purple-600 border-b-2 border-purple-600"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <FontAwesomeIcon icon={faClosedCaptioning} className="mr-2" />
            Subtítulos
          </button>
          <button
            onClick={() => setActiveTab("analysis")}
            className={`flex-1 py-4 px-6 font-medium transition-all ${
              activeTab === "analysis"
                ? "bg-white text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <FontAwesomeIcon icon={faChartLine} className="mr-2" />
            Análisis
          </button>
          <button
            onClick={() => setActiveTab("thumbnail")}
            className={`flex-1 py-4 px-6 font-medium transition-all ${
              activeTab === "thumbnail"
                ? "bg-white text-green-600 border-b-2 border-green-600"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <FontAwesomeIcon icon={faImage} className="mr-2" />
            Thumbnail
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Error Alert */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
              <FontAwesomeIcon
                icon={faExclamationTriangle}
                className="text-red-600 mt-0.5"
              />
              <div>
                <p className="font-medium text-red-800">Error</p>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          )}

          {/* Subtítulos Tab */}
          {activeTab === "subtitles" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Generar Subtítulos Automáticos
                </h3>
                <p className="text-gray-600 mb-6">
                  Usa IA para transcribir el audio del video y generar
                  subtítulos sincronizados.
                </p>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Idioma
                    </label>
                    <select
                      value={subtitleLanguage}
                      onChange={(e) => setSubtitleLanguage(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                      disabled={loading}
                    >
                      <option value="es">Español</option>
                      <option value="en">English</option>
                      <option value="fr">Français</option>
                      <option value="de">Deutsch</option>
                      <option value="pt">Português</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Formato
                    </label>
                    <select
                      value={subtitleFormat}
                      onChange={(e) => setSubtitleFormat(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                      disabled={loading}
                    >
                      <option value="srt">SRT (SubRip)</option>
                      <option value="vtt">VTT (WebVTT)</option>
                      <option value="txt">TXT (Texto plano)</option>
                    </select>
                  </div>
                </div>

                <Button
                  onClick={handleGenerateSubtitles}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <FontAwesomeIcon
                        icon={faSpinner}
                        className="animate-spin mr-2"
                      />
                      Generando subtítulos...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon
                        icon={faClosedCaptioning}
                        className="mr-2"
                      />
                      Generar Subtítulos
                    </>
                  )}
                </Button>
              </div>

              {/* Resultado de subtítulos */}
              {result?.type === "subtitles" && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <FontAwesomeIcon
                        icon={faCheckCircle}
                        className="text-green-600"
                      />
                      <span className="font-medium text-green-800">
                        Subtítulos generados exitosamente
                      </span>
                    </div>
                    <Button size="sm" onClick={handleDownloadSubtitles}>
                      <FontAwesomeIcon icon={faDownload} className="mr-2" />
                      Descargar
                    </Button>
                  </div>
                  <div className="bg-white p-4 rounded border max-h-64 overflow-y-auto">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                      {result.data.subtitles.substring(0, 1000)}
                      {result.data.subtitles.length > 1000 && "..."}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Análisis Tab */}
          {activeTab === "analysis" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Análisis de Contenido con IA
                </h3>
                <p className="text-gray-600 mb-6">
                  Analiza el contenido del video para obtener resumen, palabras
                  clave y más.
                </p>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Idioma del video
                  </label>
                  <select
                    value={analysisLanguage}
                    onChange={(e) => setAnalysisLanguage(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    disabled={loading}
                  >
                    <option value="es">Español</option>
                    <option value="en">English</option>
                  </select>
                </div>

                <Button
                  onClick={handleAnalyzeContent}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? (
                    <>
                      <FontAwesomeIcon
                        icon={faSpinner}
                        className="animate-spin mr-2"
                      />
                      Analizando contenido...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faChartLine} className="mr-2" />
                      Analizar Contenido
                    </>
                  )}
                </Button>
              </div>

              {/* Resultado de análisis */}
              {result?.type === "analysis" && (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">
                      📝 Resumen
                    </h4>
                    <p className="text-gray-700">{result.data.resumen}</p>
                  </div>

                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <h4 className="font-semibold text-purple-900 mb-2">
                      🔑 Palabras Clave
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {result.data.palabrasClave.map((palabra, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                        >
                          {palabra}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-2">
                      📚 Temas
                    </h4>
                    <ul className="list-disc list-inside space-y-1">
                      {result.data.temas.map((tema, idx) => (
                        <li key={idx} className="text-gray-700">
                          {tema}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <h4 className="font-semibold text-orange-900 mb-2">
                        🎯 Nivel
                      </h4>
                      <p className="text-gray-700">{result.data.nivel}</p>
                    </div>
                    <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                      <h4 className="font-semibold text-indigo-900 mb-2">
                        ⏱️ Duración
                      </h4>
                      <p className="text-gray-700">{result.data.duracion}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Thumbnail Tab */}
          {activeTab === "thumbnail" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Generar Thumbnail Inteligente
                </h3>
                <p className="text-gray-600 mb-6">
                  Genera una imagen de portada atractiva para el video.
                </p>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timestamp (segundos) - Opcional
                  </label>
                  <input
                    type="number"
                    value={thumbnailTimestamp}
                    onChange={(e) => setThumbnailTimestamp(e.target.value)}
                    placeholder="Dejar vacío para auto-detectar"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    disabled={loading}
                    min="0"
                    step="0.1"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Si no especificas un momento, se extraerá del medio del
                    video
                  </p>
                </div>

                <Button
                  onClick={handleGenerateThumbnail}
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {loading ? (
                    <>
                      <FontAwesomeIcon
                        icon={faSpinner}
                        className="animate-spin mr-2"
                      />
                      Generando thumbnail...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faImage} className="mr-2" />
                      Generar Thumbnail
                    </>
                  )}
                </Button>
              </div>

              {/* Resultado de thumbnail */}
              {result?.type === "thumbnail" && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-4">
                    <FontAwesomeIcon
                      icon={faCheckCircle}
                      className="text-green-600"
                    />
                    <span className="font-medium text-green-800">
                      Thumbnail generado exitosamente
                    </span>
                  </div>
                  <div className="bg-white p-4 rounded border">
                    <img
                      src={result.data.thumbnail_url}
                      alt="Thumbnail generado"
                      className="w-full rounded-lg shadow-md"
                    />
                    <p className="text-sm text-gray-600 mt-2">
                      Capturado en el segundo {result.data.timestamp.toFixed(1)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
