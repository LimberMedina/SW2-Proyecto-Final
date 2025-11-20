import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faEnvelope,
  faLock,
  faEye,
  faEyeSlash,
  faUserGraduate,
  faSpinner,
  faCheck,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../hooks/useAuth.jsx";
import Input from "../components/Input";
import Button from "../components/Button";
import Alert from "../components/Alert";

export default function Register() {
  const navigate = useNavigate();
  const { register, loading } = useAuth();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    nombre: "",
    apellidos: "",
    rol: "USER",
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [alert, setAlert] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validaciones en tiempo real
  const validateField = (name, value) => {
    const newErrors = { ...errors };

    switch (name) {
      case "username":
        if (!value.trim()) {
          newErrors.username = "El nombre de usuario es requerido";
        } else if (value.length < 3) {
          newErrors.username = "Mínimo 3 caracteres";
        } else if (!/^[a-zA-Z0-9_]+$/.test(value)) {
          newErrors.username = "Solo letras, números y guiones bajos";
        } else {
          delete newErrors.username;
        }
        break;

      case "email":
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value.trim()) {
          newErrors.email = "El email es requerido";
        } else if (!emailRegex.test(value)) {
          newErrors.email = "Email inválido";
        } else {
          delete newErrors.email;
        }
        break;

      case "password":
        if (!value) {
          newErrors.password = "La contraseña es requerida";
        } else if (value.length < 8) {
          newErrors.password = "Mínimo 8 caracteres";
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
          newErrors.password = "Debe incluir mayúscula, minúscula y número";
        } else {
          delete newErrors.password;
        }
        break;

      case "confirmPassword":
        if (!value) {
          newErrors.confirmPassword = "Confirma tu contraseña";
        } else if (value !== formData.password) {
          newErrors.confirmPassword = "Las contraseñas no coinciden";
        } else {
          delete newErrors.confirmPassword;
        }
        break;

      case "nombre":
        if (!value.trim()) {
          newErrors.nombre = "El nombre es requerido";
        } else if (value.length < 2) {
          newErrors.nombre = "Mínimo 2 caracteres";
        } else {
          delete newErrors.nombre;
        }
        break;

      case "apellidos":
        if (!value.trim()) {
          newErrors.apellidos = "Los apellidos son requeridos";
        } else if (value.length < 2) {
          newErrors.apellidos = "Mínimo 2 caracteres";
        } else {
          delete newErrors.apellidos;
        }
        break;

      default:
        break;
    }

    setErrors(newErrors);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Validar en tiempo real
    validateField(name, value);

    // Si es confirmPassword, también validar cuando cambie password
    if (name === "password" && formData.confirmPassword) {
      validateField("confirmPassword", formData.confirmPassword);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAlert(null);

    // Validar todos los campos
    Object.keys(formData).forEach((key) => {
      if (key !== "rol" && key !== "confirmPassword") {
        validateField(key, formData[key]);
      }
    });

    // Si hay errores, no enviar
    if (Object.keys(errors).length > 0) {
      setIsSubmitting(false);
      setAlert({
        type: "error",
        message: "Por favor corrige los errores en el formulario",
      });
      return;
    }

    try {
      const result = await register({
        username: formData.username,
        email: formData.email,
        contraseña: formData.password,
        nombre: formData.nombre,
        apellidos: formData.apellidos,
        rol: formData.rol,
      });

      if (result.success) {
        setAlert({
          type: "success",
          message: "¡Registro exitoso! Redirigiendo...",
        });

        setTimeout(() => {
          navigate("/catalog");
        }, 2000);
      } else {
        setAlert({
          type: "error",
          message: result.message || "Error al registrar usuario",
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

  const getPasswordStrength = () => {
    const password = formData.password;
    if (!password) return { strength: 0, text: "" };

    let strength = 0;
    const checks = [
      password.length >= 8,
      /[a-z]/.test(password),
      /[A-Z]/.test(password),
      /\d/.test(password),
      /[!@#$%^&*(),.?":{}|<>]/.test(password),
    ];

    strength = checks.filter(Boolean).length;

    const levels = {
      0: { text: "", color: "" },
      1: { text: "Muy débil", color: "text-red-500" },
      2: { text: "Débil", color: "text-orange-500" },
      3: { text: "Regular", color: "text-yellow-500" },
      4: { text: "Fuerte", color: "text-green-500" },
      5: { text: "Muy fuerte", color: "text-green-600" },
    };

    return { strength, ...levels[strength] };
  };

  const passwordStrength = getPasswordStrength();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-4">
            <FontAwesomeIcon
              icon={faUserGraduate}
              className="text-white text-2xl"
            />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Crear cuenta</h2>
          <p className="mt-2 text-sm text-gray-600">
            Únete a la videoteca universitaria
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
            {/* Nombres */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input
                  label="Nombre"
                  name="nombre"
                  type="text"
                  value={formData.nombre}
                  onChange={handleChange}
                  error={errors.nombre}
                  placeholder="Tu nombre"
                  leftIcon={<FontAwesomeIcon icon={faUser} />}
                  rightIcon={
                    formData.nombre && !errors.nombre ? (
                      <FontAwesomeIcon
                        icon={faCheck}
                        className="text-green-500"
                      />
                    ) : null
                  }
                />
              </div>
              <div>
                <Input
                  label="Apellidos"
                  name="apellidos"
                  type="text"
                  value={formData.apellidos}
                  onChange={handleChange}
                  error={errors.apellidos}
                  placeholder="Tus apellidos"
                  rightIcon={
                    formData.apellidos && !errors.apellidos ? (
                      <FontAwesomeIcon
                        icon={faCheck}
                        className="text-green-500"
                      />
                    ) : null
                  }
                />
              </div>
            </div>

            {/* Username */}
            <Input
              label="Nombre de usuario"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              error={errors.username}
              placeholder="@usuario"
              leftIcon={<FontAwesomeIcon icon={faUser} />}
              rightIcon={
                formData.username && !errors.username ? (
                  <FontAwesomeIcon icon={faCheck} className="text-green-500" />
                ) : null
              }
              helpText="Solo letras, números y guiones bajos"
            />

            {/* Email */}
            <Input
              label="Correo electrónico"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              placeholder="tu@email.com"
              leftIcon={<FontAwesomeIcon icon={faEnvelope} />}
              rightIcon={
                formData.email && !errors.email ? (
                  <FontAwesomeIcon icon={faCheck} className="text-green-500" />
                ) : null
              }
            />

            {/* Password */}
            <div>
              <Input
                label="Contraseña"
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                placeholder="Mínimo 8 caracteres"
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

              {/* Password strength indicator */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          passwordStrength.strength === 1
                            ? "bg-red-500 w-1/5"
                            : passwordStrength.strength === 2
                            ? "bg-orange-500 w-2/5"
                            : passwordStrength.strength === 3
                            ? "bg-yellow-500 w-3/5"
                            : passwordStrength.strength === 4
                            ? "bg-green-500 w-4/5"
                            : passwordStrength.strength === 5
                            ? "bg-green-600 w-full"
                            : "w-0"
                        }`}
                      />
                    </div>
                    <span
                      className={`text-xs font-medium ${passwordStrength.color}`}
                    >
                      {passwordStrength.text}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <Input
              label="Confirmar contraseña"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              placeholder="Repite tu contraseña"
              leftIcon={<FontAwesomeIcon icon={faLock} />}
              rightIcon={
                formData.confirmPassword && !errors.confirmPassword ? (
                  <FontAwesomeIcon icon={faCheck} className="text-green-500" />
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FontAwesomeIcon
                      icon={showConfirmPassword ? faEyeSlash : faEye}
                    />
                  </button>
                )
              }
            />
          </div>

          {/* Submit button */}
          <Button
            type="submit"
            disabled={isSubmitting || Object.keys(errors).length > 0}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {isSubmitting ? (
              <>
                <FontAwesomeIcon
                  icon={faSpinner}
                  className="animate-spin mr-2"
                />
                Registrando...
              </>
            ) : (
              "Crear cuenta"
            )}
          </Button>

          {/* Login link */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              ¿Ya tienes una cuenta?{" "}
              <Link
                to="/login"
                className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
              >
                Inicia sesión aquí
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
