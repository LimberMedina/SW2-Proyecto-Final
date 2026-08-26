// src/pages/ForgotPassword.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEnvelope,
  faArrowLeft,
  faCheckCircle,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import Button from "../components/Button";
import Input from "../components/Input";
import api from "../services/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!email.trim()) {
      setError("Por favor ingresa tu email.");
      setLoading(false);
      return;
    }

    // Validación básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Por favor ingresa un email válido.");
      setLoading(false);
      return;
    }

    try {
      await api.post("/usuarios/password-reset/", {
        email: email.trim().toLowerCase(),
      });
      setSuccess(true);
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.error ||
        "Error al procesar la solicitud. Intenta nuevamente.";
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
                ¡Revisa tu email!
              </h2>
              <p className="text-gray-600 mb-6">
                Si el email <strong>{email}</strong> está registrado, recibirás
                un enlace para restablecer tu contraseña.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Revisa tu bandeja de entrada y la carpeta de spam.
              </p>
              <Link to="/login">
                <Button className="w-full">
                  <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
                  Volver al inicio de sesión
                </Button>
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
                icon={faEnvelope}
                className="text-blue-600 text-2xl"
              />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              ¿Olvidaste tu contraseña?
            </h2>
            <p className="text-gray-600">
              No te preocupes, te enviaremos un enlace para restablecerla.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <Input
              label="Email"
              type="email"
              name="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              icon={faEnvelope}
            />

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <FontAwesomeIcon
                    icon={faSpinner}
                    className="mr-2 animate-spin"
                  />
                  Enviando...
                </>
              ) : (
                "Enviar enlace de recuperación"
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
              Volver al inicio de sesión
            </Link>
          </div>
        </div>

        {/* Additional help */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            ¿No tienes cuenta?{" "}
            <Link
              to="/register"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Regístrate aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
