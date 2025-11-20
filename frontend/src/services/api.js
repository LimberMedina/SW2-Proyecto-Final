import axios from "axios";

// Configuración base de la API
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api";

// Crear instancia de axios
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Interceptor para agregar token de autenticación
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    console.log("API Request Interceptor - Token presente:", !!token);
    console.log("API Request Interceptor - URL:", config.url);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("API Request Interceptor - Header Authorization agregado");
    } else {
      console.log("API Request Interceptor - No hay token disponible");
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y errores
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si el token expiró (401) y no hemos intentado renovarlo
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refresh_token");
        if (refreshToken) {
          const response = await axios.post(
            `${API_BASE_URL}/usuarios/auth/refresh/`,
            {
              refresh: refreshToken,
            }
          );

          const { access } = response.data;
          localStorage.setItem("access_token", access);

          // Reintentar la petición original
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Si falla el refresh, limpiar tokens y redirigir al login
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user_data");
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;
