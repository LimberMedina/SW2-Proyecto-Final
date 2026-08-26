// src/pages/Recommendations.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSpinner,
  faLightbulb,
  faHeart,
  faComment,
  faShare,
  faBookmark,
  faPlay,
  faEye,
  faClock,
  faRobot,
  faChartLine,
  faVideo,
  faEllipsisV,
  faVolumeUp,
  faVolumeMute,
  faBackward,
  faForward,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";
import Header from "../components/Header";
import Button from "../components/Button";
import VideoPlayer from "../components/VideoPlayer";
import { useAuth } from "../hooks/useAuth";
import api from "../services/api";
import catalogService from "../services/catalogService";

export default function Recommendations() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    loadRecommendations();
  }, [isAuthenticated]);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      // Obtener estadísticas del usuario
      const statsResponse = await api.get("/usuarios/me/estadisticas/");
      setStats(statsResponse.data);

      // Obtener todos los videos públicos
      const videosResponse = await api.get("/catalogodigital/public/videos/");
      const allVideos = videosResponse.data.results || videosResponse.data;

      // Obtener interacciones del usuario
      const [likesRes, commentsRes, savedRes] = await Promise.all([
        api.get("/catalogodigital/mis-likes/").catch(() => ({ data: [] })),
        api
          .get("/catalogodigital/mis-comentarios/")
          .catch(() => ({ data: [] })),
        api.get("/catalogodigital/mis-guardados/").catch(() => ({ data: [] })),
      ]);

      const likedVideos = likesRes.data.map((l) => l.video);
      const commentedVideos = commentsRes.data.map((c) => c.video);
      const savedVideos = savedRes.data.map((s) => s.video);

      // Construir perfil del usuario basado en interacciones con jerarquía completa
      const userProfile = {
        categories: new Map(), // categoria_id -> peso
        catalogs: new Map(), // catalogo_id -> peso
        chapters: new Map(), // capitulo_id -> peso
      };

      // Pesos para cada tipo de interacción
      const weights = {
        like: 3,
        comment: 2,
        saved: 4,
      };

      // Procesar likes
      likedVideos.forEach((v) => {
        if (v.categoria_id) {
          userProfile.categories.set(
            v.categoria_id,
            (userProfile.categories.get(v.categoria_id) || 0) + weights.like
          );
        }
        if (v.catalogo_id) {
          userProfile.catalogs.set(
            v.catalogo_id,
            (userProfile.catalogs.get(v.catalogo_id) || 0) + weights.like
          );
        }
        if (v.capitulo_id) {
          userProfile.chapters.set(
            v.capitulo_id,
            (userProfile.chapters.get(v.capitulo_id) || 0) + weights.like
          );
        }
      });

      // Procesar comentarios
      commentedVideos.forEach((v) => {
        if (v.categoria_id) {
          userProfile.categories.set(
            v.categoria_id,
            (userProfile.categories.get(v.categoria_id) || 0) + weights.comment
          );
        }
        if (v.catalogo_id) {
          userProfile.catalogs.set(
            v.catalogo_id,
            (userProfile.catalogs.get(v.catalogo_id) || 0) + weights.comment
          );
        }
        if (v.capitulo_id) {
          userProfile.chapters.set(
            v.capitulo_id,
            (userProfile.chapters.get(v.capitulo_id) || 0) + weights.comment
          );
        }
      });

      // Procesar guardados (mayor peso)
      savedVideos.forEach((v) => {
        if (v.categoria_id) {
          userProfile.categories.set(
            v.categoria_id,
            (userProfile.categories.get(v.categoria_id) || 0) + weights.saved
          );
        }
        if (v.catalogo_id) {
          userProfile.catalogs.set(
            v.catalogo_id,
            (userProfile.catalogs.get(v.catalogo_id) || 0) + weights.saved
          );
        }
        if (v.capitulo_id) {
          userProfile.chapters.set(
            v.capitulo_id,
            (userProfile.chapters.get(v.capitulo_id) || 0) + weights.saved
          );
        }
      });

      // IDs de videos ya interactuados
      const interactedVideoIds = new Set([
        ...likedVideos.map((v) => v.id),
        ...commentedVideos.map((v) => v.id),
        ...savedVideos.map((v) => v.id),
      ]);

      // Calcular score de recomendación para cada video usando jerarquía completa
      const videoScores = allVideos
        .filter((v) => !interactedVideoIds.has(v.id))
        .map((video) => {
          let score = 0;

          // Score basado en jerarquía (capítulo > categoría > catálogo)
          if (
            video.capitulo_id &&
            userProfile.chapters.has(video.capitulo_id)
          ) {
            score += userProfile.chapters.get(video.capitulo_id) * 3;
          }

          if (
            video.categoria_id &&
            userProfile.categories.has(video.categoria_id)
          ) {
            score += userProfile.categories.get(video.categoria_id) * 2;
          }

          if (
            video.catalogo_id &&
            userProfile.catalogs.has(video.catalogo_id)
          ) {
            score += userProfile.catalogs.get(video.catalogo_id) * 1;
          }

          // Score de popularidad
          const popularityScore =
            (video.total_likes || 0) * 1.5 +
            (video.total_comentarios || 0) * 1.2 +
            (video.visualizaciones || 0) * 0.05;

          // Combinar: 70% perfil, 30% popularidad (o 100% popularidad si es usuario nuevo)
          const hasInteractions =
            userProfile.categories.size > 0 ||
            userProfile.catalogs.size > 0 ||
            userProfile.chapters.size > 0;

          if (hasInteractions) {
            score = score * 0.7 + popularityScore * 0.3;
          } else {
            score = popularityScore;
          }

          return { video, score };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 20)
        .map((item) => item.video);

      setRecommendations(videoScores);
    } catch (error) {
      console.error("Error cargando recomendaciones:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoClick = (video) => {
    // Abrir el reproductor de video
    setSelectedVideo(video);
  };

  const closeVideoPlayer = () => {
    setSelectedVideo(null);
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num?.toString() || "0";
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Hoy";
    if (days === 1) return "Ayer";
    if (days < 7) return `Hace ${days} días`;
    if (days < 30) return `Hace ${Math.floor(days / 7)} semanas`;
    if (days < 365) return `Hace ${Math.floor(days / 30)} meses`;
    return `Hace ${Math.floor(days / 365)} años`;
  };

  // Componente de tarjeta de video con previsualización
  const VideoCard = ({ video, index }) => {
    const [isLiked, setIsLiked] = useState(!!video.usuario_ha_dado_like);
    const [isSaved, setIsSaved] = useState(!!video.usuario_ha_guardado);
    const [isShared, setIsShared] = useState(!!video.usuario_ha_compartido);
    const [likes, setLikes] = useState(video.total_likes || 0);
    const [comments, setComments] = useState(video.total_comentarios || 0);
    const [shares, setShares] = useState(video.total_compartidas || 0);
    const [saves, setSaves] = useState(video.total_guardados || 0);
    const [menuOpen, setMenuOpen] = useState(false);
    const [likeLoading, setLikeLoading] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);
    const [shareLoading, setShareLoading] = useState(false);
    const [isHovering, setIsHovering] = useState(false);
    const videoRef = useRef(null);
    const hoverTimeoutRef = useRef(null);

    useEffect(() => {
      setIsLiked(!!video.usuario_ha_dado_like);
      setIsSaved(!!video.usuario_ha_guardado);
      setIsShared(!!video.usuario_ha_compartido);
      setLikes(video.total_likes || 0);
      setComments(video.total_comentarios || 0);
      setShares(video.total_compartidas || 0);
      setSaves(video.total_guardados || 0);
    }, [
      video.id,
      video.usuario_ha_dado_like,
      video.usuario_ha_guardado,
      video.usuario_ha_compartido,
      video.total_likes,
      video.total_comentarios,
      video.total_compartidas,
      video.total_guardados,
    ]);

    // Manejar hover para previsualización
    const handleMouseEnter = () => {
      hoverTimeoutRef.current = setTimeout(() => {
        setIsHovering(true);
        if (videoRef.current) {
          videoRef.current.muted = true;
          videoRef.current.currentTime = 0;
          videoRef.current.play().catch(() => {});
        }
      }, 500); // Esperar 500ms antes de iniciar
    };

    const handleMouseLeave = () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      setIsHovering(false);
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    };

    const guardAuth = () => {
      if (!isAuthenticated) {
        alert("Debes iniciar sesión para realizar esta acción.");
        return false;
      }
      return true;
    };

    const handleLike = async (e) => {
      e.stopPropagation();
      if (!guardAuth() || likeLoading) return;
      setLikeLoading(true);
      try {
        const result = await catalogService.toggleLike(video.id);
        setIsLiked(!!result.liked);
        setLikes(result.total_likes || 0);
      } catch (error) {
        console.error("Error al dar like:", error);
        if (error?.response?.status === 401) {
          alert("Inicia sesión para dar like.");
        } else {
          alert("Error al dar like. Intenta nuevamente.");
        }
      } finally {
        setLikeLoading(false);
      }
    };

    const handleSave = async (e) => {
      e.stopPropagation();
      if (!guardAuth() || saveLoading) return;
      setSaveLoading(true);
      try {
        const result = await catalogService.toggleSave(video.id);
        setIsSaved(!!result.guardado);
        setSaves(result.total_guardados || saves);
      } catch (error) {
        console.error("Error al guardar:", error);
        alert("Error al guardar video.");
      } finally {
        setSaveLoading(false);
        setMenuOpen(false);
      }
    };

    const handleShare = async (e) => {
      e.stopPropagation();
      if (!guardAuth() || shareLoading) return;
      setSaveLoading(true);
      try {
        await catalogService.shareVideo(video.id, "other");
        setIsShared(true);
        setShares((s) => s + 1);

        const videoUrl = `${window.location.origin}/?video=${video.id}`;
        window.dispatchEvent(
          new CustomEvent("showShareModal", {
            detail: {
              url: videoUrl,
              title: video.titulo,
              description: video.descripcion,
            },
          })
        );
      } catch (error) {
        console.error("Error al compartir:", error);
      } finally {
        setShareLoading(false);
      }
    };

    return (
      <div
        className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-xl transition-shadow duration-300"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Header con categoría */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {video.categoria_nombre?.charAt(0) || "V"}
              </span>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 text-sm">
                {video.categoria_nombre}
              </h4>
              <p className="text-xs text-gray-500">
                {formatDate(video.fecha_publicacion)}
              </p>
            </div>
          </div>

          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((s) => !s);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <FontAwesomeIcon icon={faEllipsisV} />
            </Button>

            {menuOpen && (
              <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg py-2 w-56 z-10">
                <button
                  onClick={handleSave}
                  className={`w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2 ${
                    isSaved ? "text-blue-600" : "text-gray-700"
                  }`}
                >
                  <FontAwesomeIcon icon={faBookmark} />
                  <span>{isSaved ? "Guardado" : "Guardar video"}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Video/Thumbnail con previsualización */}
        <div
          className="relative aspect-video bg-gradient-to-br from-gray-200 to-gray-300 cursor-pointer"
          onClick={() => handleVideoClick(video)}
        >
          {video.url_video ? (
            <>
              {!isHovering && video.url_thumbnail && (
                <img
                  src={video.url_thumbnail}
                  alt={video.titulo}
                  className="w-full h-full object-cover absolute inset-0"
                />
              )}
              <video
                ref={videoRef}
                src={video.url_video}
                className={`w-full h-full object-cover ${
                  isHovering ? "opacity-100" : "opacity-0"
                }`}
                muted
                loop
                playsInline
                preload="metadata"
              />
            </>
          ) : video.url_thumbnail ? (
            <img
              src={video.url_thumbnail}
              alt={video.titulo}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <FontAwesomeIcon
                icon={faVideo}
                className="text-gray-400 text-6xl"
              />
            </div>
          )}

          {/* Play overlay */}
          {!isHovering && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-300">
              <Button className="opacity-70 hover:opacity-100 transition-opacity duration-300 bg-white text-gray-900 hover:bg-gray-100 rounded-full w-16 h-16">
                <FontAwesomeIcon icon={faPlay} className="text-2xl ml-1" />
              </Button>
            </div>
          )}

          {/* Duración */}
          {video.duracion_display && (
            <div className="absolute bottom-4 right-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm">
              <FontAwesomeIcon icon={faClock} className="mr-1" />
              {video.duracion_display}
            </div>
          )}

          {/* Vistas */}
          <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm">
            <FontAwesomeIcon icon={faEye} className="mr-1" />
            {formatNumber(video.visualizaciones)}
          </div>
        </div>

        {/* Acciones e información */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-6">
              {/* Like */}
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLike}
                  disabled={likeLoading}
                  className={`${
                    isLiked ? "text-red-500" : "text-gray-600"
                  } hover:text-red-500`}
                >
                  {likeLoading ? (
                    <FontAwesomeIcon
                      icon={faSpinner}
                      className="animate-spin"
                    />
                  ) : (
                    <FontAwesomeIcon icon={faHeart} className="text-xl" />
                  )}
                </Button>
                <span className="text-sm font-medium">
                  {formatNumber(likes)}
                </span>
              </div>

              {/* Comentarios */}
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleVideoClick(video);
                  }}
                  className="text-gray-600 hover:text-blue-500"
                >
                  <FontAwesomeIcon icon={faComment} className="text-xl" />
                </Button>
                <span className="text-sm font-medium">
                  {formatNumber(comments)}
                </span>
              </div>

              {/* Compartir */}
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShare}
                  disabled={shareLoading}
                  className={`${
                    isShared ? "text-green-600" : "text-gray-600"
                  } hover:text-green-600`}
                >
                  {shareLoading ? (
                    <FontAwesomeIcon
                      icon={faSpinner}
                      className="animate-spin"
                    />
                  ) : isShared ? (
                    <FontAwesomeIcon icon={faCheck} className="text-xl" />
                  ) : (
                    <FontAwesomeIcon icon={faShare} className="text-xl" />
                  )}
                </Button>
                <span className="text-sm font-medium">
                  {formatNumber(shares)}
                </span>
              </div>
            </div>

            {/* Guardar */}
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSave}
                disabled={saveLoading}
                className={`hover:text-blue-500 ${
                  isSaved ? "text-blue-500" : "text-gray-600"
                }`}
              >
                {saveLoading ? (
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                ) : (
                  <FontAwesomeIcon icon={faBookmark} className="text-xl" />
                )}
              </Button>
              <span
                className={`text-sm font-medium ${
                  isSaved ? "text-blue-600" : "text-gray-800"
                }`}
              >
                {formatNumber(saves)}
              </span>
            </div>
          </div>

          {/* Título y descripción */}
          <div>
            <h3 className="font-bold text-lg mb-2 text-gray-900 line-clamp-2">
              {video.titulo}
            </h3>
            <p className="text-gray-600 text-sm line-clamp-3 mb-3">
              {video.descripcion}
            </p>

            <div className="flex flex-wrap gap-2">
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                {video.categoria_nombre}
              </span>
              {video.catalogo_nombre && (
                <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
                  {video.catalogo_nombre}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header de Recomendaciones */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <FontAwesomeIcon icon={faRobot} className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Recomendaciones para ti
              </h1>
              <p className="text-gray-600">
                Videos personalizados basados en tu actividad
              </p>
            </div>
          </div>

          {/* Estadísticas del usuario */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white rounded-xl shadow-sm p-6">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <FontAwesomeIcon
                    icon={faEye}
                    className="text-blue-500 text-2xl"
                  />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.videos_vistos || 0}
                </p>
                <p className="text-sm text-gray-600">Videos vistos</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <FontAwesomeIcon
                    icon={faHeart}
                    className="text-red-500 text-2xl"
                  />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.likes_dados || 0}
                </p>
                <p className="text-sm text-gray-600">Likes dados</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <FontAwesomeIcon
                    icon={faComment}
                    className="text-green-500 text-2xl"
                  />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.comentarios_realizados || 0}
                </p>
                <p className="text-sm text-gray-600">Comentarios</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <FontAwesomeIcon
                    icon={faBookmark}
                    className="text-purple-500 text-2xl"
                  />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.videos_guardados || 0}
                </p>
                <p className="text-sm text-gray-600">Videos guardados</p>
              </div>
            </div>
          )}
        </div>

        {/* Contenido */}
        {loading ? (
          <div className="text-center py-16">
            <FontAwesomeIcon
              icon={faSpinner}
              className="text-blue-600 text-4xl animate-spin mb-4"
            />
            <p className="text-gray-600">
              Analizando tus preferencias y generando recomendaciones...
            </p>
          </div>
        ) : recommendations.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <FontAwesomeIcon
                icon={faLightbulb}
                className="text-gray-400 text-3xl"
              />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Aún no tenemos suficiente información
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Interactúa con videos (dale like, comenta, guarda) para que
              podamos recomendarte contenido personalizado.
            </p>
            <Button
              onClick={() => navigate("/Catalog")}
              className="bg-gradient-to-r from-blue-600 to-purple-600"
            >
              Explorar Catálogo
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600">
                Hemos encontrado{" "}
                <span className="font-bold text-gray-900">
                  {recommendations.length}
                </span>{" "}
                videos que podrían interesarte
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={loadRecommendations}
                className="flex items-center"
              >
                <FontAwesomeIcon icon={faChartLine} className="mr-2" />
                Actualizar
              </Button>
            </div>

            {/* Grid de videos recomendados */}
            <div className="max-w-4xl mx-auto">
              <div className="space-y-8">
                {recommendations.map((video, index) => (
                  <VideoCard key={video.id} video={video} index={index} />
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Reproductor de video */}
      {selectedVideo && (
        <VideoPlayer video={selectedVideo} onClose={closeVideoPlayer} />
      )}
    </div>
  );
}
