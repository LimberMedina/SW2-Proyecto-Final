/**
 * Servicio de frontend para procesamiento audiovisual con IA.
 */

import api from "./api";

class VideoProcessingService {
  /**
   * Genera subtítulos automáticos para un video
   * @param {number} videoId - ID del video
   * @param {string} language - Código de idioma (es, en, etc.)
   * @param {string} format - Formato (srt, vtt, txt)
   * @returns {Promise<Object>} Subtítulos generados
   */
  async generateSubtitles(videoId, language = "es", format = "srt") {
    try {
      const response = await api.post(
        `/catalogodigital/admin/videos/${videoId}/generar_subtitulos/`,
        { language, format }
      );
      return {
        success: true,
        ...response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Error al generar subtítulos",
        error_type: error.response?.data?.error_type || "unknown",
      };
    }
  }

  /**
   * Analiza el contenido de un video con IA
   * @param {number} videoId - ID del video
   * @param {string} language - Código de idioma
   * @returns {Promise<Object>} Análisis del contenido
   */
  async analyzeContent(videoId, language = "es") {
    try {
      const response = await api.post(
        `/catalogodigital/admin/videos/${videoId}/analizar_contenido/`,
        { language }
      );
      return {
        success: true,
        ...response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Error al analizar contenido",
        error_type: error.response?.data?.error_type || "unknown",
      };
    }
  }

  /**
   * Genera un thumbnail inteligente para un video
   * @param {number} videoId - ID del video
   * @param {number|null} timestamp - Segundo específico (opcional)
   * @returns {Promise<Object>} Thumbnail generado
   */
  async generateThumbnail(videoId, timestamp = null) {
    try {
      const response = await api.post(
        `/catalogodigital/admin/videos/${videoId}/generar_thumbnail/`,
        timestamp !== null ? { timestamp } : {}
      );
      return {
        success: true,
        ...response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Error al generar thumbnail",
        error_type: error.response?.data?.error_type || "unknown",
      };
    }
  }

  /**
   * Descarga subtítulos generados
   * @param {string} subtitleUrl - URL de los subtítulos
   * @param {number} videoId - ID del video
   * @param {string} format - Formato del archivo
   */
  downloadSubtitles(subtitleUrl, videoId, format = "srt") {
    const link = document.createElement("a");
    link.href = subtitleUrl;
    link.download = `subtitles_${videoId}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Obtiene mensaje de error amigable según el tipo
   * @param {string} errorType - Tipo de error
   * @returns {string} Mensaje amigable
   */
  getFriendlyErrorMessage(errorType) {
    const messages = {
      config_error: "⚙️ Servicio de IA no configurado",
      import_error: "📦 Librerías de procesamiento no disponibles",
      groq_service_unavailable: "🔄 Servicio de IA temporalmente no disponible",
      rate_limit: "⏱️ Límite de uso excedido. Intenta más tarde",
      file_too_large: "📁 Archivo muy grande (máx. 25MB)",
      timeout: "⏰ Tiempo de espera agotado",
      extraction_error: "🎵 Error al extraer audio del video",
      generation_error: "🖼️ Error al generar thumbnail",
      unknown: "❌ Error desconocido",
    };
    return messages[errorType] || messages.unknown;
  }

  /**
   * Formatea el análisis de contenido para mostrar en UI
   * @param {Object} analysis - Objeto de análisis
   * @returns {Object} Análisis formateado
   */
  formatAnalysis(analysis) {
    return {
      resumen: analysis.resumen || "No disponible",
      palabrasClave: analysis.palabras_clave || [],
      temas: analysis.temas || [],
      nivel: this.formatNivel(analysis.nivel),
      duracion: analysis.duracion_sugerida || "No especificada",
    };
  }

  /**
   * Formatea el nivel educativo
   * @param {string} nivel - Nivel crudo
   * @returns {string} Nivel formateado
   */
  formatNivel(nivel) {
    const niveles = {
      principiante: "🟢 Principiante",
      intermedio: "🟡 Intermedio",
      avanzado: "🔴 Avanzado",
    };
    return niveles[nivel?.toLowerCase()] || "⚪ No especificado";
  }
}

export default new VideoProcessingService();
