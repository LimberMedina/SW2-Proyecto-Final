// src/pages/Profile.jsx
import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faEnvelope,
  faCalendar,
  faEdit,
  faCamera,
  faSave,
  faTimes,
  faEye,
  faHeart,
  faComment,
  faBookmark,
  faShare,
  faCheckCircle, // ⬅️ nuevo icono para publicaciones aprobadas
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../hooks/useAuth";
import Button from "../components/Button";
import Input from "../components/Input";
import Header from "../components/Header";
import authService from "../services/authService";
import catalogService from "../services/catalogService"; // ⬅️ usaremos helpers nuevos
import UserLibrary from "../components/UserLibrary"; // ⬅️ nueva vista debajo del perfil

export default function Profile() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [statistics, setStatistics] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [approvedCount, setApprovedCount] = useState(0); // ⬅️ publicaciones aprobadas
  const [formData, setFormData] = useState({
    nombre: user?.nombre || "",
    apellidos: user?.apellidos || "",
    email: user?.email || "",
    username: user?.username || "",
  });

  useEffect(() => {
    loadUserStatistics();
  }, []);

  const loadUserStatistics = async () => {
    setLoadingStats(true);
    try {
      const result = await authService.getUserStatistics();

      // valores por defecto
      let baseStats = {
        videos_vistos: 0,
        comentarios_realizados: 0,
        likes_dados: 0,
        videos_guardados: 0,
        videos_compartidos: 0,
        videos_publicados: 0,
        tiempo_total_visto: { texto: "0m" },
      };
      if (result?.success && result?.data) {
        baseStats = { ...baseStats, ...result.data };
      }
      setStatistics(baseStats);

      // El conteo de publicaciones aprobadas viene del backend
      setApprovedCount(
        baseStats.videos_publicados || baseStats.publicaciones_aprobadas || 0
      );
    } catch (error) {
      console.error("Error loading statistics:", error);
      setStatistics({
        videos_vistos: 0,
        comentarios_realizados: 0,
        likes_dados: 0,
        videos_guardados: 0,
        videos_compartidos: 0,
        videos_publicados: 0,
        tiempo_total_visto: { texto: "0m" },
      });
      setApprovedCount(0);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleEdit = () => setIsEditing(true);
  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      nombre: user?.nombre || "",
      apellidos: user?.apellidos || "",
      email: user?.email || "",
      username: user?.username || "",
    });
  };
  const handleSave = () => {
    // TODO: persistir cambios de perfil
    console.log("Guardando cambios:", formData);
    setIsEditing(false);
  };
  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Header />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header del perfil */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8">
            <div className="flex items-center space-x-6">
              {/* Avatar */}
              <div className="relative">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-3xl font-bold text-blue-600">
                    {user?.nombre?.charAt(0)?.toUpperCase() ||
                      user?.username?.charAt(0)?.toUpperCase() ||
                      "U"}
                  </span>
                </div>
                <button className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-blue-600 transition-colors">
                  <FontAwesomeIcon icon={faCamera} className="text-sm" />
                </button>
              </div>

              {/* Información básica */}
              <div className="text-white">
                <h1 className="text-3xl font-bold">
                  {user?.nombre} {user?.apellidos}
                </h1>
                <p className="text-blue-100 text-lg">@{user?.username}</p>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-2 ${
                    user?.rol === "ADMIN"
                      ? "bg-purple-500 bg-opacity-20 text-purple-100"
                      : "bg-blue-500 bg-opacity-20 text-blue-100"
                  }`}
                >
                  {user?.rol === "ADMIN" ? "Administrador" : "Usuario"}
                </span>
              </div>

              {/* Botón de editar */}
              <div className="ml-auto">
                {!isEditing ? (
                  <Button
                    onClick={handleEdit}
                    className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white border-white border"
                  >
                    <FontAwesomeIcon icon={faEdit} className="mr-2" />
                    Editar perfil
                  </Button>
                ) : (
                  <div className="flex space-x-2">
                    <Button
                      onClick={handleSave}
                      className="bg-green-500 hover:bg-green-600 text-white"
                    >
                      <FontAwesomeIcon icon={faSave} className="mr-2" />
                      Guardar
                    </Button>
                    <Button
                      onClick={handleCancel}
                      className="bg-red-500 hover:bg-red-600 text-white"
                    >
                      <FontAwesomeIcon icon={faTimes} className="mr-2" />
                      Cancelar
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Contenido del perfil */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Información personal */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Información Personal
                </h2>

                {/* Nombre */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre
                  </label>
                  {isEditing ? (
                    <Input
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleChange}
                      placeholder="Tu nombre"
                    />
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <FontAwesomeIcon
                          icon={faUser}
                          className="text-gray-400 mr-3"
                        />
                        <span className="text-gray-900">
                          {user?.nombre || "No especificado"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Apellidos */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Apellidos
                  </label>
                  {isEditing ? (
                    <Input
                      name="apellidos"
                      value={formData.apellidos}
                      onChange={handleChange}
                      placeholder="Tus apellidos"
                    />
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <FontAwesomeIcon
                          icon={faUser}
                          className="text-gray-400 mr-3"
                        />
                        <span className="text-gray-900">
                          {user?.apellidos || "No especificado"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de usuario
                  </label>
                  {isEditing ? (
                    <Input
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="Tu nombre de usuario"
                    />
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <FontAwesomeIcon
                          icon={faUser}
                          className="text-gray-400 mr-3"
                        />
                        <span className="text-gray-900">@{user?.username}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Correo electrónico
                  </label>
                  {isEditing ? (
                    <Input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="tu@email.com"
                    />
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <FontAwesomeIcon
                          icon={faEnvelope}
                          className="text-gray-400 mr-3"
                        />
                        <span className="text-gray-900">{user?.email}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Estadísticas y actividad */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Actividad
                </h2>

                {loadingStats ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-gray-600">Cargando estadísticas...</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-2xl font-bold text-blue-600">
                              {statistics?.videos_vistos || 0}
                            </div>
                            <div className="text-sm text-blue-600">
                              Videos vistos
                            </div>
                          </div>
                          <FontAwesomeIcon
                            icon={faEye}
                            className="text-blue-400 text-xl"
                          />
                        </div>
                      </div>

                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-2xl font-bold text-green-600">
                              {statistics?.videos_guardados || 0}
                            </div>
                            <div className="text-sm text-green-600">
                              Videos guardados
                            </div>
                          </div>
                          <FontAwesomeIcon
                            icon={faBookmark}
                            className="text-green-400 text-xl"
                          />
                        </div>
                      </div>

                      <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-2xl font-bold text-purple-600">
                              {statistics?.likes_dados ||
                                statistics?.videos_con_like ||
                                0}
                            </div>
                            <div className="text-sm text-purple-600">
                              Likes dados
                            </div>
                          </div>
                          <FontAwesomeIcon
                            icon={faHeart}
                            className="text-purple-400 text-xl"
                          />
                        </div>
                      </div>

                      <div className="bg-orange-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-2xl font-bold text-orange-600">
                              {statistics?.comentarios_realizados || 0}
                            </div>
                            <div className="text-sm text-orange-600">
                              Comentarios
                            </div>
                          </div>
                          <FontAwesomeIcon
                            icon={faComment}
                            className="text-orange-400 text-xl"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Tarjetas: Videos compartidos + Publicaciones aprobadas */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-indigo-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-2xl font-bold text-indigo-600">
                              {statistics?.videos_compartidos || 0}
                            </div>
                            <div className="text-sm text-indigo-600">
                              Videos compartidos
                            </div>
                          </div>
                          <FontAwesomeIcon
                            icon={faShare}
                            className="text-indigo-400 text-xl"
                          />
                        </div>
                      </div>

                      <div className="bg-emerald-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-2xl font-bold text-emerald-600">
                              {approvedCount}
                            </div>
                            <div className="text-sm text-emerald-600">
                              Publicaciones aprobadas
                            </div>
                          </div>
                          <FontAwesomeIcon
                            icon={faCheckCircle}
                            className="text-emerald-400 text-xl"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-medium text-gray-900 mb-2">
                        Tiempo total visto
                      </h3>
                      <div className="flex items-center text-gray-600">
                        <FontAwesomeIcon icon={faEye} className="mr-2" />
                        <span className="text-lg font-semibold">
                          {statistics?.tiempo_total_visto?.texto || "0m"}
                        </span>
                      </div>
                    </div>
                  </>
                )}

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">
                    Miembro desde
                  </h3>
                  <div className="flex items-center text-gray-600">
                    <FontAwesomeIcon icon={faCalendar} className="mr-2" />
                    <span>{statistics?.fecha_registro || "Octubre 2025"}</span>
                  </div>
                  {statistics?.ultimo_acceso &&
                    statistics.ultimo_acceso !== "Nunca" && (
                      <div className="mt-2 text-sm text-gray-500">
                        Último acceso: {statistics.ultimo_acceso}
                      </div>
                    )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ⬇️ Nueva vista: biblioteca del usuario (publicaciones, guardados, likes) */}
        <div className="mt-8">
          <UserLibrary
            initialCounts={{
              pubs: approvedCount,
              saved: statistics?.videos_guardados || 0,
              likes:
                statistics?.likes_dados || statistics?.videos_con_like || 0,
            }}
          />
        </div>
      </div>
    </div>
  );
}
