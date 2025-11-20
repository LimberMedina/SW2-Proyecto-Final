import { useState, useEffect, createContext, useContext } from "react";
import authService from "../services/authService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log("useAuth.checkAuth - Verificando autenticación...");
        console.log(
          "useAuth.checkAuth - authService.isAuthenticated():",
          authService.isAuthenticated()
        );

        if (authService.isAuthenticated()) {
          const userData = authService.getCurrentUser();
          console.log("useAuth.checkAuth - Usuario obtenido:", userData);
          setUser(userData);
          setIsAuthenticated(true);
          console.log(
            "useAuth.checkAuth - Estado establecido como autenticado"
          );
        } else {
          console.log("useAuth.checkAuth - Usuario no autenticado");
        }
      } finally {
        setLoading(false);
        console.log("useAuth.checkAuth - Loading finalizado");
      }
    };
    checkAuth();
  }, []);

  const login = async (credentials) => {
    setLoading(true);
    try {
      console.log("useAuth.login - Iniciando login...");
      const result = await authService.login(credentials);
      console.log("useAuth.login - Resultado del authService:", result);

      if (result?.success) {
        const userData = result.data?.usuario || result.data || null;
        console.log("useAuth.login - Usuario a establecer:", userData);
        setUser(userData);
        setIsAuthenticated(true);
        console.log(
          "useAuth.login - Estado actualizado - isAuthenticated: true"
        );
      }
      return result;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const result = await authService.register(userData);
      if (result?.success) {
        setUser(result.data?.usuario || result.data || null);
        setIsAuthenticated(true);
      }
      return result;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe ser usado dentro de AuthProvider");
  }
  return context;
};
