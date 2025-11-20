import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faLock,
  faEye,
  faEyeSlash,
  faSpinner,
  faSignInAlt,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../hooks/useAuth.jsx";
import Input from "../components/Input";
import Button from "../components/Button";
import Alert from "../components/Alert";

export default function Login() {
  const navigate = useNavigate();
  const { login, loading } = useAuth();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [alert, setAlert] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAlert(null);

    const newErrors = {};
    if (!formData.username.trim()) {
      newErrors.username = "El nombre de usuario es requerido";
    }
    if (!formData.password) {
      newErrors.password = "La contraseña es requerida";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await login({
        username: formData.username,
        password: formData.password,
      });

      if (result?.success) {
        // Detectar rol desde distintas formas de respuesta posibles
        const rol =
          result?.usuario?.rol ||
          result?.user?.rol ||
          result?.data?.usuario?.rol ||
          result?.rol ||
          result?.Usuario?.rol ||
          null;

        const rolNorm = typeof rol === "string" ? rol.toUpperCase() : "";

        // Mensaje de éxito
        setAlert({
          type: "success",
          message:
            rolNorm === "ADMIN"
              ? "¡Bienvenido, administrador! Redirigiendo a tu panel…"
              : "¡Inicio de sesión exitoso! Redirigiendo…",
        });

        // Redirección según rol
        // Si prefieres mantener el retraso visual, deja el setTimeout.
        setTimeout(() => {
          if (rolNorm === "ADMIN") {
            navigate("/admin");
          } else {
            navigate("/catalog");
          }
        }, 800);
      } else {
        setAlert({
          type: "error",
          message: result?.message || "Credenciales inválidas",
        });
      }
    } catch (error) {
      setAlert({
        type: "error",
        message: "Error de conexión. Intenta nuevamente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-4">
            <FontAwesomeIcon
              icon={faSignInAlt}
              className="text-white text-2xl"
            />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Iniciar sesión</h2>
          <p className="mt-2 text-sm text-gray-600">
            Accede a la videoteca universitaria
          </p>
        </div>

        {/* Alert */}
        {alert && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Username */}
            <Input
              label="Nombre de usuario"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              error={errors.username}
              placeholder="Tu nombre de usuario"
              leftIcon={<FontAwesomeIcon icon={faUser} />}
            />

            {/* Password */}
            <Input
              label="Contraseña"
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              placeholder="Tu contraseña"
              leftIcon={<FontAwesomeIcon icon={faLock} />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                </button>
              }
            />
          </div>

          {/* Submit button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {isSubmitting ? (
              <>
                <FontAwesomeIcon
                  icon={faSpinner}
                  className="animate-spin mr-2"
                />
                Iniciando sesión...
              </>
            ) : (
              "Iniciar sesión"
            )}
          </Button>

          {/* Register link */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              ¿No tienes una cuenta?{" "}
              <Link
                to="/register"
                className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
              >
                Regístrate aquí
              </Link>
            </p>
          </div>
        </form>

        {/* Back to home */}
        <div className="text-center">
          <Link
            to="/"
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
