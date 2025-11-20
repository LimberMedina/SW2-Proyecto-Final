// src/pages/UploadVideo.jsx
import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUpload,
  faVideo,
  faImage,
  faSpinner,
  faCheck,
  faExclamationTriangle,
  faArrowLeft,
  faTimes,
  faCloudUpload,
} from "@fortawesome/free-solid-svg-icons";
import Header from "../components/Header";
import Button from "../components/Button";
import Input from "../components/Input";
import { useAuth } from "../hooks/useAuth";
import catalogService from "../services/catalogService";
import api from "../services/api";

/* ================== CONSTANTES ================== */
const VIDEO_EXTS = ["mp4", "avi", "mov", "mkv", "webm"];
const IMAGE_EXTS = ["jpg", "jpeg", "png", "webp"];
const MAX_VIDEO_MB = 500; // Ajusta según tu backend/Nginx
const MAX_THUMB_MB = 5;

/* Normaliza "M:SS" o "H:MM:SS" -> "HH:MM:SS" */
const normalizeDuration = (str) => {
  if (!str) return null;
  const parts = str.split(":").map((p) => parseInt(p, 10));
  if (parts.some((n) => Number.isNaN(n))) return null;

  if (parts.length === 2) {
    const [m, s] = parts;
    const pad = (n) => String(n).padStart(2, "0");
    return `00:${pad(m)}:${pad(s)}`;
  }
  if (parts.length === 3) {
    const [h, m, s] = parts;
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  }
  return null;
};

/* Convierte segundos -> HH:MM:SS o MM:SS si < 1h (editable luego) */
const secondsToReadable = (secs) => {
  if (!Number.isFinite(secs)) return "";
  const total = Math.max(0, Math.floor(secs));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
};

export default function UploadVideo() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  /* ======= Estado UI ======= */
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState(null); // 'uploading' | 'success' | 'error'
  const [errors, setErrors] = useState({}); // { campo: "mensaje" } o shape del backend

  /* ======= Cascada ======= */
  const [categories, setCategories] = useState([]);
  const [catalogs, setCatalogs] = useState([]);
  const [chapters, setChapters] = useState([]);

  /* ======= Formulario ======= */
  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
    categoria: "",
    catalogo: "",
    capitulo: "",
    numero_orden: 1,
    duracion: "",
    videoFile: null,
    thumbnailFile: null,
  });

  /* ======= Previews/Duración ======= */
  const [videoPreview, setVideoPreview] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const videoProbeRef = useRef(null);
  const videoObjectURL = useMemo(
    () => (formData.videoFile ? URL.createObjectURL(formData.videoFile) : ""),
    [formData.videoFile]
  );

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    loadCategories();
  }, [isAuthenticated, navigate]);

  const loadCategories = async () => {
    try {
      const data = await catalogService.getCategories(); // Ajusta internamente si tu ruta difiere
      setCategories(data?.results || data || []);
    } catch (e) {
      console.error(e);
      setCategories([]);
      setErrors((prev) => ({
        ...prev,
        general: "No se pudieron cargar categorías.",
      }));
    }
  };

  /* ======= Cascada: al cambiar categoría ======= */
  const handleCategoryChange = async (categoryId) => {
    setFormData((prev) => ({
      ...prev,
      categoria: categoryId,
      catalogo: "",
      capitulo: "",
    }));
    setCatalogs([]);
    setChapters([]);

    if (!categoryId) return;

    try {
      // Tus ViewSets privados (admin) permiten filtrar por categoria
      const res = await api.get(
        `/catalogodigital/admin/catalogos/?categoria=${categoryId}&activo=true&ordering=nombre`
      );
      setCatalogs(res.data?.results || res.data || []);
    } catch (e) {
      console.error(e);
      setCatalogs([]);
      setErrors((prev) => ({
        ...prev,
        general: "No se pudieron cargar catálogos.",
      }));
    }
  };

  /* ======= Cascada: al cambiar catálogo ======= */
  const handleCatalogChange = async (catalogId) => {
    setFormData((prev) => ({
      ...prev,
      catalogo: catalogId,
      capitulo: "",
    }));
    setChapters([]);

    if (!catalogId) return;

    try {
      const res = await api.get(
        `/catalogodigital/admin/capitulos/?catalogo=${catalogId}&activo=true&ordering=numero_orden`
      );
      setChapters(res.data?.results || res.data || []);
    } catch (e) {
      console.error(e);
      setChapters([]);
      setErrors((prev) => ({
        ...prev,
        general: "No se pudieron cargar capítulos.",
      }));
    }
  };

  /* ======= Campos simples ======= */
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: name === "numero_orden" ? Number(value) : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  /* ======= Video ======= */
  const handleVideoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // MIME check (ayuda, pero confiar en extensión también)
    if (!file.type.startsWith("video/")) {
      setErrors((prev) => ({
        ...prev,
        videoFile: "Solo se permiten archivos de video.",
      }));
      return;
    }
    // Extensión por si el MIME no viene preciso
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!VIDEO_EXTS.includes(ext)) {
      setErrors((prev) => ({
        ...prev,
        videoFile: `Formato inválido. Permitidos: ${VIDEO_EXTS.join(", ")}`,
      }));
      return;
    }
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        videoFile: `El video excede ${MAX_VIDEO_MB}MB.`,
      }));
      return;
    }

    setFormData((prev) => ({ ...prev, videoFile: file }));
    setErrors((prev) => ({ ...prev, videoFile: "" }));

    const url = URL.createObjectURL(file);
    setVideoPreview(url);

    // Lee duración
    const v = document.createElement("video");
    videoProbeRef.current = v;
    v.preload = "metadata";
    v.src = url;
    v.onloadedmetadata = () => {
      const readable = secondsToReadable(v.duration);
      setFormData((prev) => ({ ...prev, duracion: readable || "" }));
      try {
        URL.revokeObjectURL(url);
      } catch {}
    };
    v.onerror = () => {
      // Si no puede leer, el usuario puede ingresarla manual luego
      setFormData((prev) => ({ ...prev, duracion: "" }));
    };
  };

  const removeVideo = () => {
    setFormData((prev) => ({ ...prev, videoFile: null, duracion: "" }));
    setVideoPreview(null);
    if (errors.videoFile) setErrors((prev) => ({ ...prev, videoFile: "" }));
  };

  /* ======= Thumbnail ======= */
  const handleThumbnailChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrors((prev) => ({
        ...prev,
        thumbnailFile: "Solo se permiten imágenes.",
      }));
      return;
    }
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!IMAGE_EXTS.includes(ext)) {
      setErrors((prev) => ({
        ...prev,
        thumbnailFile: `Formato inválido. Permitidos: ${IMAGE_EXTS.join(", ")}`,
      }));
      return;
    }
    if (file.size > MAX_THUMB_MB * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        thumbnailFile: `La imagen excede ${MAX_THUMB_MB}MB.`,
      }));
      return;
    }

    setFormData((prev) => ({ ...prev, thumbnailFile: file }));
    setErrors((prev) => ({ ...prev, thumbnailFile: "" }));

    const url = URL.createObjectURL(file);
    setThumbnailPreview(url);
  };

  const removeThumbnail = () => {
    setFormData((prev) => ({ ...prev, thumbnailFile: null }));
    setThumbnailPreview(null);
    if (errors.thumbnailFile)
      setErrors((prev) => ({ ...prev, thumbnailFile: "" }));
  };

  /* ======= Validación previa ======= */
  const validateForm = () => {
    const newErrors = {};
    if (!formData.titulo.trim()) newErrors.titulo = "El título es requerido.";
    if (!formData.descripcion.trim())
      newErrors.descripcion = "La descripción es requerida.";
    if (!formData.categoria) newErrors.categoria = "La categoría es requerida.";
    if (!formData.catalogo) newErrors.catalogo = "El catálogo es requerido.";
    if (!formData.capitulo) newErrors.capitulo = "El capítulo es requerido.";
    if (!formData.numero_orden || Number(formData.numero_orden) <= 0)
      newErrors.numero_orden = "Debe ser > 0.";
    if (!formData.videoFile)
      newErrors.videoFile = "El archivo de video es requerido.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ======= Submit ======= */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors((prev) => ({ ...prev, general: "" }));

    if (!validateForm()) return;

    setLoading(true);
    setUploadStatus("uploading");
    setUploadProgress(0);

    try {
      const fd = new FormData();
      fd.append("titulo", formData.titulo.trim());
      fd.append("descripcion", formData.descripcion.trim());
      fd.append("capitulo", String(formData.capitulo));
      fd.append("numero_orden", String(formData.numero_orden || 1));

      const dur = normalizeDuration(formData.duracion);
      if (dur) fd.append("duracion", dur);

      fd.append("archivo_video", formData.videoFile);
      if (formData.thumbnailFile)
        fd.append("thumbnail", formData.thumbnailFile);

      // ¡OJO! NO fijes manualmente Content-Type; deja que el navegador ponga multipart boundary
      const res = await api.post("/catalogodigital/admin/videos/", fd, {
        onUploadProgress: (evt) => {
          if (!evt.total) return;
          const pct = Math.round((evt.loaded * 100) / evt.total);
          setUploadProgress(pct);
        },
      });

      // Backend (según tus serializers) pondrá REVISION si el usuario NO es admin
      setUploadStatus("success");

      // Limpieza
      setFormData({
        titulo: "",
        descripcion: "",
        categoria: "",
        catalogo: "",
        capitulo: "",
        numero_orden: 1,
        duracion: "",
        videoFile: null,
        thumbnailFile: null,
      });
      setVideoPreview(null);
      setThumbnailPreview(null);

      // Redirige al perfil (o donde prefieras)
      setTimeout(() => navigate("/profile"), 1800);
    } catch (err) {
      console.error(err);
      setUploadStatus("error");

      // Mapea errores del backend a los campos (DRF suele devolver dict por campo)
      const data = err?.response?.data;
      if (data && typeof data === "object") {
        const mapped = {};
        Object.keys(data).forEach((k) => {
          // Si viene como array de mensajes -> une
          const val = Array.isArray(data[k])
            ? data[k].join(" ")
            : String(data[k]);
          mapped[k] = val;
        });
        // Mensaje general si lo hay
        if (!mapped.general && (data.detail || data.error)) {
          mapped.general = data.detail || data.error;
        }
        setErrors((prev) => ({ ...prev, ...mapped }));
      } else {
        setErrors((prev) => ({
          ...prev,
          general:
            "Error al subir el video. Revisa los datos e inténtalo nuevamente.",
        }));
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Volver */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4 text-gray-600 hover:text-gray-800"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
            Volver
          </Button>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">Subir Video</h1>
          <p className="text-gray-600">
            Comparte tu contenido con la comunidad. Los videos enviados por
            usuarios no administradores quedan en <b>REVISION</b> hasta ser
            aprobados por un administrador.
          </p>
        </div>

        {/* Estados de subida */}
        {uploadStatus === "uploading" && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center mb-2">
              <FontAwesomeIcon
                icon={faSpinner}
                className="text-blue-600 animate-spin mr-2"
              />
              <span className="text-blue-800 font-medium">Subiendo video…</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-blue-700 text-sm mt-1">
              {uploadProgress}% completado
            </p>
          </div>
        )}

        {uploadStatus === "success" && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <FontAwesomeIcon icon={faCheck} className="text-green-600 mr-2" />
              <span className="text-green-800 font-medium">
                ¡Video subido! Quedó en revisión. Te avisaremos cuando sea
                aprobado.
              </span>
            </div>
          </div>
        )}

        {uploadStatus === "error" && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <FontAwesomeIcon
                icon={faExclamationTriangle}
                className="text-red-600 mr-2"
              />
              <span className="text-red-800 font-medium">
                No se pudo completar la subida. Revisa los campos e inténtalo
                nuevamente.
              </span>
            </div>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            {/* VIDEO */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                <FontAwesomeIcon icon={faVideo} className="mr-2" />
                Archivo de Video
              </h2>

              {!videoPreview ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    accept={VIDEO_EXTS.map((e) => "." + e).join(",")}
                    onChange={handleVideoChange}
                    className="hidden"
                    id="video-upload"
                  />
                  <label
                    htmlFor="video-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <FontAwesomeIcon
                      icon={faCloudUpload}
                      className="text-4xl text-gray-400 mb-4"
                    />
                    <p className="text-lg font-medium text-gray-700 mb-2">
                      Haz clic para seleccionar un video
                    </p>
                    <p className="text-sm text-gray-500">
                      {VIDEO_EXTS.join(", ").toUpperCase()} hasta {MAX_VIDEO_MB}
                      MB
                    </p>
                  </label>
                </div>
              ) : (
                <div className="relative">
                  <video
                    src={videoPreview}
                    controls
                    className="w-full max-w-md mx-auto rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removeVideo}
                    className="absolute top-2 right-2 bg-red-500 text-white hover:bg-red-600"
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </Button>
                </div>
              )}

              {errors.videoFile && (
                <p className="text-red-600 text-sm mt-2">{errors.videoFile}</p>
              )}
              {errors.archivo_video && (
                <p className="text-red-600 text-sm mt-2">
                  {errors.archivo_video}
                </p>
              )}
            </div>

            {/* THUMBNAIL */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                <FontAwesomeIcon icon={faImage} className="mr-2" />
                Miniatura (Opcional)
              </h2>

              {!thumbnailPreview ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    accept={IMAGE_EXTS.map((e) => "." + e).join(",")}
                    onChange={handleThumbnailChange}
                    className="hidden"
                    id="thumbnail-upload"
                  />
                  <label
                    htmlFor="thumbnail-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <FontAwesomeIcon
                      icon={faImage}
                      className="text-3xl text-gray-400 mb-2"
                    />
                    <p className="text-sm text-gray-600">
                      Imagen de portada (JPG/PNG/WEBP)
                    </p>
                    <p className="text-xs text-gray-500">
                      Hasta {MAX_THUMB_MB}MB
                    </p>
                  </label>
                </div>
              ) : (
                <div className="relative inline-block">
                  <img
                    src={thumbnailPreview}
                    alt="Thumbnail preview"
                    className="w-48 h-32 object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removeThumbnail}
                    className="absolute top-2 right-2 bg-red-500 text-white hover:bg-red-600"
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </Button>
                </div>
              )}

              {errors.thumbnailFile && (
                <p className="text-red-600 text-sm mt-2">
                  {errors.thumbnailFile}
                </p>
              )}
              {errors.thumbnail && (
                <p className="text-red-600 text-sm mt-2">{errors.thumbnail}</p>
              )}
            </div>

            {/* INFO */}
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título *
                </label>
                <Input
                  type="text"
                  name="titulo"
                  value={formData.titulo}
                  onChange={handleInputChange}
                  placeholder="Ingresa un título descriptivo"
                  error={errors.titulo}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción *
                </label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe el contenido de tu video"
                />
                {errors.descripcion && (
                  <p className="text-red-600 text-sm mt-1">
                    {errors.descripcion}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* CATEGORÍA */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoría *
                  </label>
                  <select
                    name="categoria"
                    value={formData.categoria}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Seleccionar categoría</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                  {errors.categoria && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.categoria}
                    </p>
                  )}
                </div>

                {/* CATALOGO */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Catálogo *
                  </label>
                  <select
                    name="catalogo"
                    value={formData.catalogo}
                    onChange={(e) => handleCatalogChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={!formData.categoria}
                  >
                    <option value="">Seleccionar catálogo</option>
                    {catalogs.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.nombre}
                      </option>
                    ))}
                  </select>
                  {errors.catalogo && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.catalogo}
                    </p>
                  )}
                </div>

                {/* CAPITULO */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Capítulo *
                  </label>
                  <select
                    name="capitulo"
                    value={formData.capitulo}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={!formData.catalogo}
                  >
                    <option value="">Seleccionar capítulo</option>
                    {chapters.map((ch) => (
                      <option key={ch.id} value={ch.id}>
                        {ch.nombre}
                      </option>
                    ))}
                  </select>
                  {errors.capitulo && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.capitulo}
                    </p>
                  )}
                </div>
              </div>

              {/* NUMERO ORDEN */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número de orden *
                  </label>
                  <Input
                    type="number"
                    name="numero_orden"
                    min={1}
                    value={formData.numero_orden}
                    onChange={handleInputChange}
                    placeholder="1, 2, 3…"
                    error={errors.numero_orden}
                  />
                </div>

                {/* DURACION (editable por si no se pudo leer) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duración (MM:SS o HH:MM:SS)
                  </label>
                  <Input
                    type="text"
                    name="duracion"
                    value={formData.duracion}
                    onChange={handleInputChange}
                    placeholder="Ej. 05:23 o 01:02:45"
                  />
                  {errors.duracion && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.duracion}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Errores generales */}
            {errors.general && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
                {errors.general}
              </div>
            )}
          </div>

          {/* Acciones */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || uploadStatus === "uploading"}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <FontAwesomeIcon
                    icon={faSpinner}
                    className="animate-spin mr-2"
                  />
                  Subiendo…
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faUpload} className="mr-2" />
                  Subir Video
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Info */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-2">
            Proceso de Revisión
          </h3>
          <ul className="text-blue-800 text-sm space-y-1">
            <li>
              • Tu video será revisado por un administrador antes de ser
              publicado.
            </li>
            <li>• Una vez aprobado, quedará visible en el catálogo.</li>
            <li>
              • Si no eres ADMIN, tu video se crea automáticamente en estado
              REVISION.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
