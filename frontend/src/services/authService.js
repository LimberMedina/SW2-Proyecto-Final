import api from "./api";

const authService = {
  register: async (userData) => {
    try {
      const response = await api.post("/usuarios/registro/", userData);

      if (response.data.tokens) {
        // Guardar tokens en localStorage
        localStorage.setItem("access_token", response.data.tokens.access);
        localStorage.setItem("refresh_token", response.data.tokens.refresh);
        localStorage.setItem(
          "user_data",
          JSON.stringify(response.data.usuario)
        );
      }

      return {
        success: true,
        data: response.data,
        message: response.data.mensaje || "Usuario registrado exitosamente",
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || { message: "Error de conexión" },
        message: error.response?.data?.mensaje || "Error al registrar usuario",
      };
    }
  },

  login: async (credentials) => {
    try {
      console.log("authService.login - Enviando credenciales:", credentials);
      const response = await api.post("/usuarios/auth/login/", credentials);
      console.log("authService.login - Respuesta del servidor:", response.data);

      // La respuesta ahora incluye access, refresh y usuario directamente
      if (response.data.access && response.data.refresh) {
        // Guardar tokens en localStorage
        localStorage.setItem("access_token", response.data.access);
        localStorage.setItem("refresh_token", response.data.refresh);

        // Guardar información del usuario si está disponible
        if (response.data.usuario) {
          localStorage.setItem(
            "user_data",
            JSON.stringify(response.data.usuario)
          );
          console.log(
            "authService.login - Usuario guardado:",
            response.data.usuario
          );
        }

        console.log(
          "authService.login - Tokens y usuario guardados en localStorage"
        );
      }
      // Mantener compatibilidad con la estructura anterior
      else if (response.data.tokens) {
        // Guardar tokens en localStorage
        localStorage.setItem("access_token", response.data.tokens.access);
        localStorage.setItem("refresh_token", response.data.tokens.refresh);
        localStorage.setItem(
          "user_data",
          JSON.stringify(response.data.usuario)
        );

        console.log(
          "authService.login - Tokens y usuario guardados en localStorage (formato anterior)"
        );
        console.log(
          "authService.login - Usuario guardado:",
          response.data.usuario
        );
      }

      return {
        success: true,
        data: response.data,
        message: "Login exitoso",
      };
    } catch (error) {
      console.error("authService.login - Error:", error);
      return {
        success: false,
        error: error.response?.data || { message: "Error de conexión" },
        message: error.response?.data?.error || "Credenciales inválidas",
      };
    }
  },

  logout: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_data");
  },

  getProfile: async () => {
    try {
      const response = await api.get("/usuarios/me/");
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || { message: "Error de conexión" },
      };
    }
  },

  isAuthenticated: () => {
    return !!localStorage.getItem("access_token");
  },

  getCurrentUser: () => {
    const userData = localStorage.getItem("user_data");
    return userData ? JSON.parse(userData) : null;
  },

  validateAvailability: async (data) => {
    try {
      const response = await api.post(
        "/usuarios/validar-disponibilidad/",
        data
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || { message: "Error de conexión" },
      };
    }
  },

  getUserStatistics: async () => {
    try {
      const response = await api.get("/usuarios/me/estadisticas/");
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || { message: "Error de conexión" },
      };
    }
  },
};

export default authService;
