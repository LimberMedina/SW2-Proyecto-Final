// src/pages/ResetPassword.jsx
import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLock,
  faEye,
  faEyeSlash,
  faCheckCircle,
  faSpinner,
  faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";
import Button from "../components/Button";
import Input from "../components/Input";
import api from "../services/api";

export default function ResetPassword() {
  const navigate = useNavigate();
  const { uid, token } = useParams();

  const [formData, setFormData] = useState({
    new_password: "",
    confirm_password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const validatePassword = () => {
    if (formData.new_password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return false;
    }
    if (formData.new_password !== formData.confirm_password) {
      setError("Las contraseñas no coinciden.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validatePassword()) return;

    setLoading(true);

    try {
      await api.post("/usuarios/password-reset-confirm/", {
        uid,
        token,
        new_password: formData.new_password,
      });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.error ||
        "Error al resetear la contraseña. El enlace puede haber expirado.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <FontAwesomeIcon
                  icon={faCheckCircle}
                  className="text-green-600 text-3xl"
                />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                ¡Contraseña actualizada!
              </h2>
              <p className="text-gray-600 mb-6">
                Tu contraseña ha sido restablecida correctamente. Serás
                redirigido al inicio de sesión...
              </p>
              <Link to="/login">
                <Button className="w-full">Ir al inicio de sesión</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!uid || !token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <FontAwesomeIcon
                  icon={faExclamationTriangle}
                  className="text-red-600 text-3xl"
                />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Enlace inválido
              </h2>
              <p className="text-gray-600 mb-6">
                El enlace de recuperación es inválido o ha expirado.
              </p>
              <Link to="/forgot-password">
                <Button className="w-full">Solicitar nuevo enlace</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <FontAwesomeIcon
                icon={faLock}
                className="text-blue-600 text-2xl"
              />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Nueva Contraseña
            </h2>
            <p className="text-gray-600">
              Ingresa tu nueva contraseña a continuación.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Password */}
            <div className="relative">
              <Input
                label="Nueva Contraseña"
                type={showPassword ? "text" : "password"}
                name="new_password"
                placeholder="Mínimo 8 caracteres"
                value={formData.new_password}
                onChange={handleChange}
                required
                icon={faLock}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
              >
                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
              </button>
            </div>

            {/* Confirm Password */}
            <div className="relative">
              <Input
                label="Confirmar Contraseña"
                type={showConfirmPassword ? "text" : "password"}
                name="confirm_password"
                placeholder="Repite tu contraseña"
                value={formData.confirm_password}
                onChange={handleChange}
                required
                icon={faLock}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
              >
                <FontAwesomeIcon
                  icon={showConfirmPassword ? faEyeSlash : faEye}
                />
              </button>
            </div>

            {/* Password strength indicator */}
            {formData.new_password && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs">
                  <div
                    className={`h-1 flex-1 rounded ${
                      formData.new_password.length >= 8
                        ? "bg-green-500"
                        : "bg-gray-300"
                    }`}
                  />
                  <div
                    className={`h-1 flex-1 rounded ${
                      formData.new_password.length >= 12
                        ? "bg-green-500"
                        : "bg-gray-300"
                    }`}
                  />
                  <div
                    className={`h-1 flex-1 rounded ${
                      /[A-Z]/.test(formData.new_password) &&
                      /[0-9]/.test(formData.new_password)
                        ? "bg-green-500"
                        : "bg-gray-300"
                    }`}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  {formData.new_password.length < 8
                    ? "Mínimo 8 caracteres"
                    : formData.new_password.length < 12
                    ? "Contraseña débil"
                    : "Contraseña fuerte"}
                </p>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <FontAwesomeIcon
                    icon={faSpinner}
                    className="mr-2 animate-spin"
                  />
                  Actualizando...
                </>
              ) : (
                "Restablecer Contraseña"
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
