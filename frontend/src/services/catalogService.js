// src/services/catalogService.js
import api from "./api";

class CatalogService {
  // ===== Helpers internos =====
  // Normaliza respuestas paginadas (DRF) y no paginadas
  unwrap(response) {
    const data = response?.data ?? {};
    const results = Array.isArray(data) ? data : data.results || data;
    const count =
      typeof data.count === "number"
        ? data.count
        : Array.isArray(results)
        ? results.length
        : 0;
    return { results, count };
  }

  // ===== Autenticación =====
  isAuthenticated() {
    const token = localStorage.getItem("access_token");
    console.log(
      "Token presente:",
      !!token,
      token ? "Token length: " + token.length : "No token"
    );
    return !!token;
  }

  // ===== Categorías públicas =====
  async getCategories() {
    try {
      const response = await api.get("/catalogodigital/public/categorias/");
      return response.data;
    } catch (error) {
      console.error("Error getting categories:", error);
      throw error;
    }
  }

  // ===== Videos públicos con filtros =====
  async getVideos(params = {}) {
    try {
      const queryParams = new URLSearchParams();

      if (params.search) queryParams.append("search", params.search);
      if (params.category)
        queryParams.append("capitulo__catalogo__categoria", params.category);
      if (params.sortBy) {
        const ordering =
          params.sortOrder === "asc" ? params.sortBy : `-${params.sortBy}`;
        queryParams.append("ordering", ordering);
      }
      if (params.page) queryParams.append("page", params.page);
      if (params.limit) queryParams.append("page_size", params.limit);

      const response = await api.get(
        `/catalogodigital/public/videos/?${queryParams}`
      );

      // Adaptar la respuesta para que coincida con la estructura esperada
      return {
        videos: response.data.results || response.data,
        total: response.data.count || response.data.length,
        totalPages: response.data.count
          ? Math.ceil(response.data.count / (params.limit || 12))
          : 1,
        currentPage: params.page || 1,
      };
    } catch (error) {
      console.error("Error getting videos:", error);
      throw error;
    }
  }

  // ===== Populares / Recientes (público) =====
  async getPopularVideos() {
    try {
      const response = await api.get(
        "/catalogodigital/public/videos/populares/"
      );
      return response.data;
    } catch (error) {
      console.error("Error getting popular videos:", error);
      throw error;
    }
  }

  async getRecentVideos() {
    try {
      const response = await api.get(
        "/catalogodigital/public/videos/recientes/"
      );
      return response.data;
    } catch (error) {
      console.error("Error getting recent videos:", error);
      throw error;
    }
  }

  // ===== Recomendaciones personalizadas (ML) =====
  async getRecommendations(limit = 10) {
    try {
      if (!this.isAuthenticated()) {
        console.warn(
          "Usuario no autenticado, no se pueden obtener recomendaciones"
        );
        return { results: [], count: 0, message: "Usuario no autenticado" };
      }

      const response = await api.get(
        `/catalogodigital/public/videos/recomendaciones/?limit=${limit}`
      );
      return response.data;
    } catch (error) {
      console.error("Error getting recommendations:", error);
      // Fallback silencioso
      return {
        results: [],
        count: 0,
        message: "Error al obtener recomendaciones",
      };
    }
  }

  // ===== Búsqueda semántica con IA (Groq) =====
  async semanticSearch(query) {
    try {
      if (!query || !query.trim()) {
        return {
          results: [],
          count: 0,
          message: "La consulta no puede estar vacía",
        };
      }

      const response = await api.post(
        `/catalogodigital/public/videos/busqueda_semantica/`,
        { query: query.trim() }
      );

      return {
        results: response.data.results || [],
        count: response.data.count || 0,
        message: response.data.message || "Búsqueda completada",
        reasoning: response.data.reasoning || "",
        query: response.data.query || query,
        fallback: response.data.fallback || false,
        error_type: response.data.error_type || null,
      };
    } catch (error) {
      console.error("Error en búsqueda semántica:", error);

      // Si el error es por falta de API key, informar claramente
      if (error.response?.status === 503) {
        return {
          results: [],
          count: 0,
          message:
            error.response.data?.message ||
            "⚠️ Servicio de IA temporalmente no disponible",
          error: error.response.data?.error,
          fallback: true,
        };
      }

      // Si hay error de red o timeout
      if (!error.response) {
        // Fallback automático a búsqueda tradicional
        try {
          const fallbackResponse = await this.getVideos({ search: query });
          return {
            results: fallbackResponse.videos || [],
            count: fallbackResponse.total || 0,
            message: "🔍 Búsqueda tradicional (servicio de IA no disponible)",
            fallback: true,
          };
        } catch (fallbackError) {
          return {
            results: [],
            count: 0,
            message: "❌ Error al realizar la búsqueda",
            error: error.message,
            fallback: true,
          };
        }
      }

      // Fallback: búsqueda tradicional para otros errores
      try {
        const fallbackResponse = await this.getVideos({ search: query });
        return {
          results: fallbackResponse.videos || [],
          count: fallbackResponse.total || 0,
          message: "🔍 Búsqueda tradicional (IA no disponible)",
          fallback: true,
        };
      } catch (fallbackError) {
        return {
          results: [],
          count: 0,
          message: "❌ Error al realizar la búsqueda",
          error: error.message,
          fallback: true,
        };
      }
    }
  }

  // ===== Métricas públicas =====
  async incrementViews(videoId) {
    try {
      const response = await api.post(
        `/catalogodigital/public/videos/${videoId}/incrementar_visualizaciones/`
      );
      return response.data;
    } catch (error) {
      console.error("Error incrementing views:", error);
      throw error;
    }
  }

  // ===== Interacciones (público, requiere auth) =====
  async toggleLike(videoId) {
    try {
      const token = localStorage.getItem("access_token");
      console.log("toggleLike - Token presente:", !!token);
      console.log("toggleLike - Headers enviados:", api.defaults.headers);

      if (!token) {
        throw new Error("Debes iniciar sesión para dar like");
      }

      const response = await api.post(
        `/catalogodigital/public/videos/${videoId}/toggle_like/`
      );
      return response.data;
    } catch (error) {
      console.error("Error toggling like:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
      throw error;
    }
  }

  async toggleSave(videoId) {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        throw new Error("Debes iniciar sesión para guardar videos");
      }

      const response = await api.post(
        `/catalogodigital/public/videos/${videoId}/toggle_save/`
      );
      return response.data;
    } catch (error) {
      console.error("Error toggling save:", error);
      throw error;
    }
  }

  async toggleShare(videoId, tipo = "LINK") {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        throw new Error("Debes iniciar sesión para compartir videos");
      }

      const response = await api.post(
        `/catalogodigital/public/videos/${videoId}/toggle_share/`,
        { tipo }
      );
      return response.data;
    } catch (error) {
      console.error("Error toggling share:", error);
      throw error;
    }
  }

  async incrementShares(videoId, tipo = "LINK") {
    try {
      const response = await api.post(
        `/catalogodigital/public/videos/${videoId}/increment_shares/`,
        { tipo }
      );
      return response.data;
    } catch (error) {
      console.error("Error incrementing shares:", error);
      throw error;
    }
  }

  // ===== Comentarios =====
  async getComments(videoId) {
    try {
      const response = await api.get(
        `/catalogodigital/public/videos/${videoId}/comentarios/`
      );
      return response.data;
    } catch (error) {
      console.error("Error getting comments:", error);
      return [];
    }
  }

  async createComment(videoId, texto, comentarioPadre = null) {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        throw new Error("Debes iniciar sesión para comentar");
      }

      const response = await api.post(
        `/catalogodigital/public/videos/${videoId}/comentarios/`,
        {
          texto,
          video: videoId,
          comentario_padre: comentarioPadre,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error creating comment:", error);
      throw error;
    }
  }

  async toggleCommentLike(comentarioId) {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        throw new Error("Debes iniciar sesión para dar like");
      }

      const response = await api.post(
        `/catalogodigital/comentarios/${comentarioId}/toggle-like/`
      );
      return response.data;
    } catch (error) {
      console.error("Error toggling comment like:", error);
      throw error;
    }
  }

  // ===== Guardados (panel autenticado) =====
  // Tu método original
  async getSavedVideos() {
    try {
      const response = await api.get(
        `/catalogodigital/admin/videos-guardados/`
      );
      return response.data;
    } catch (error) {
      console.error("Error getting saved videos:", error);
      throw error;
    }
  }

  // Alias limpio (usado por UserLibrary)
  async getMySavedVideos() {
    const res = await this.getSavedVideos();
    // si viene paginado, normalizamos
    if (res?.results || res?.count !== undefined) {
      return res.results ?? [];
    }
    return Array.isArray(res) ? res : [];
  }

  // ===== Mis publicaciones aprobadas (autor + PUBLICADO) =====
  async countMyApprovedVideos(userId) {
    try {
      // DRF paginado: pedimos page_size=1 y usamos `count`
      const res = await api.get(
        `/catalogodigital/admin/videos/?autor=${userId}&estado=PUBLICADO&page_size=1`
      );
      const { count } = this.unwrap(res);
      return count;
    } catch (e) {
      console.error("countMyApprovedVideos error", e);
      return 0;
    }
  }

  async getMyApprovedVideos(userId) {
    const res = await api.get(
      `/catalogodigital/admin/videos/?autor=${userId}&estado=PUBLICADO&ordering=-fecha_publicacion`
    );
    const { results } = this.unwrap(res);
    return (results || []).map((v) => ({
      ...v,
      url_video: v.url_video ?? v.archivo_video, // fallback por si cambia el serializer
    }));
  }

  // ===== Mis likes (endpoint implementado) =====
  async getMyLikedVideos() {
    try {
      const res = await api.get(`/catalogodigital/admin/videos-liked/`);
      const { results } = this.unwrap(res);
      return results;
    } catch (e) {
      console.error("getMyLikedVideos error:", e);
      return [];
    }
  }

  // ===== Mis comentarios (opcional) =====
  async getUserComments() {
    try {
      const response = await api.get(
        `/catalogodigital/admin/comentarios/?usuario=${this.getCurrentUserId()}`
      );
      return response.data;
    } catch (error) {
      console.error("Error getting user comments:", error);
      throw error;
    }
  }

  // ===== Utilidades =====
  getCurrentUserId() {
    const userData = localStorage.getItem("user_data");
    if (userData) {
      const user = JSON.parse(userData);
      return user.id;
    }
    return null;
  }

  formatDuration(duration) {
    if (!duration) return "00:00";
    if (typeof duration === "string") {
      const parts = duration.split(":");
      if (parts.length === 3) {
        const [h, m, s] = parts.map((n) => parseInt(n, 10));
        if (h > 0) {
          return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(
            2,
            "0"
          )}`;
        } else {
          return `${m}:${String(s).padStart(2, "0")}`;
        }
      }
    }
    return duration;
  }

  formatDate(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "Hace 1 día";
    if (diffDays < 7) return `Hace ${diffDays} días`;
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return weeks === 1 ? "Hace 1 semana" : `Hace ${weeks} semanas`;
    }
    if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return months === 1 ? "Hace 1 mes" : `Hace ${months} meses`;
    }
    const years = Math.floor(diffDays / 365);
    return years === 1 ? "Hace 1 año" : `Hace ${years} años`;
  }

  formatViews(views) {
    if (!views) return "0";
    if (views < 1000) return views.toString();
    if (views < 1000000) return `${(views / 1000).toFixed(1)}K`;
    return `${(views / 1000000).toFixed(1)}M`;
  }
}

export default new CatalogService();
