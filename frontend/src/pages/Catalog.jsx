// src/pages/Catalog.jsx
import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlay,
  faEye,
  faClock,
  faFilm,
  faVideoSlash,
  faSpinner,
  faMobile,
  faVolumeUp,
  faVolumeMute,
  faBackward,
  faForward,
  faHeart,
  faComment,
  faShare,
  faEllipsisV,
  faBookmark,
  faPlus,
  faCheck,
  faChevronDown,
  faChevronUp,
  faExternalLinkAlt,
  faCamera,
  faVideo,
} from "@fortawesome/free-solid-svg-icons";
import Button from "../components/Button";
import Header from "../components/Header";
import VideoPlayer from "../components/VideoPlayer";
import SocialVideoPlayer from "../components/SocialVideoPlayer";
import CommentsPanel from "../components/CommentsPanel";
import SmartSearchBar from "../components/SmartSearchBar";
import SessionExpiryAlert from "../components/SessionExpiryAlert";
import VideoProcessingPanel from "../components/VideoProcessingPanel";
import ShareModal from "../components/ShareModal";
import CatalogBackground from "../components/CatalogBackground";
import catalogService from "../services/catalogService";
import { useAuth } from "../hooks/useAuth";
import api from "../services/api";

export default function Catalog() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [videos, setVideos] = useState([]);
  const [allVideos, setAllVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [socialMode, setSocialMode] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [selectedVideoForComments, setSelectedVideoForComments] =
    useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showProcessingPanel, setShowProcessingPanel] = useState(false);
  const [selectedVideoForProcessing, setSelectedVideoForProcessing] =
    useState(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareData, setShareData] = useState({
    url: "",
    title: "",
    description: "",
  });

  // Carga
  useEffect(() => {
    loadData();
  }, [isAuthenticated]);

  // Escuchar evento global para abrir panel de comentarios desde reproductores
  useEffect(() => {
    const handler = (e) => {
      const vid = e?.detail?.videoId;
      if (!vid) return;
      const found =
        videos.find((v) => v.id === vid) || allVideos.find((v) => v.id === vid);
      if (found) {
        setSelectedVideoForComments(found);
        setShowComments(true);
      }
    };
    window.addEventListener("openComments", handler);
    return () => window.removeEventListener("openComments", handler);
  }, [videos, allVideos]);

  // Listener global para mostrar el modal de compartir
  useEffect(() => {
    const sh = (e) => {
      const d = e?.detail || {};
      setShareData({
        url: d.url || "",
        title: d.title || "",
        description: d.description || "",
      });
      setShareModalOpen(true);
    };
    window.addEventListener("showShareModal", sh);
    return () => window.removeEventListener("showShareModal", sh);
  }, []);

  // Si la URL incluye ?video={id}, abrir ese video (y colocarlo primero en la lista)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const vid = params.get("video");
      if (!vid) return;
      if (!allVideos || allVideos.length === 0) return;
      const found = allVideos.find((v) => String(v.id) === String(vid));
      if (!found) return;
      // Poner el video compartido al inicio de la lista
      const others = allVideos.filter((v) => String(v.id) !== String(vid));
      setVideos([found, ...others]);
      setSelectedVideo(found);
      setCurrentVideoIndex(0);
      // eliminar query param para evitar reaperturas
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete("video");
        window.history.replaceState({}, document.title, url.toString());
      } catch (e) {}
    } catch (e) {
      // no hacer nada
    }
  }, [allVideos]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Cargar videos públicos
      const videosData = await catalogService.getVideos();

      const normalized = (videosData.videos || []).map((v) => ({
        ...v,
        usuario_ha_dado_like: !!v.usuario_ha_dado_like,
        usuario_ha_guardado: !!v.usuario_ha_guardado,
        usuario_ha_compartido: !!v.usuario_ha_compartido,
        total_likes: v.total_likes ?? 0,
        total_comentarios: v.total_comentarios ?? 0,
        total_compartidas: v.total_compartidas ?? 0,
        total_guardados: v.total_guardados ?? 0,
      }));
      setAllVideos(normalized);
      setVideos(normalized);
    } catch (error) {
      console.error("Error loading data:", error);
      setVideos([]);
      setAllVideos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query, category, aiResults = null) => {
    setSearchQuery(query);
    setCategoryFilter(category);

    // Si hay resultados de IA, usarlos directamente
    if (aiResults && Array.isArray(aiResults)) {
      const normalized = aiResults.map((v) => ({
        ...v,
        usuario_ha_dado_like: !!v.usuario_ha_dado_like,
        usuario_ha_guardado: !!v.usuario_ha_guardado,
        usuario_ha_compartido: !!v.usuario_ha_compartido,
        total_likes: v.total_likes ?? 0,
        total_comentarios: v.total_comentarios ?? 0,
        total_compartidas: v.total_compartidas ?? 0,
        total_guardados: v.total_guardados ?? 0,
      }));
      setVideos(normalized);
    } else {
      // Búsqueda tradicional
      filterVideos(query, category);
    }
  };

  const handleFilterChange = (category) => {
    setCategoryFilter(category);
    // Aplicar filtros inmediatamente
    filterVideos(searchQuery, category);
  };

  const filterVideos = (query, category) => {
    let filtered = [...allVideos];

    // Filtrar por búsqueda
    if (query && query.trim()) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(
        (v) =>
          v.titulo?.toLowerCase().includes(lowerQuery) ||
          v.descripcion?.toLowerCase().includes(lowerQuery) ||
          v.categoria_nombre?.toLowerCase().includes(lowerQuery) ||
          v.catalogo_nombre?.toLowerCase().includes(lowerQuery)
      );
    }

    // Filtrar por categoría
    if (category && category.trim() && category !== "") {
      filtered = filtered.filter((v) => {
        const catId =
          v.categoria_id?.toString() || v.categoria?.toString() || "";
        const videoCategoriaNombre = (v.categoria_nombre || "").toLowerCase();
        const videoCatalogoNombre = (v.catalogo_nombre || "").toLowerCase();
        const filterStr = category.toString();
        const filterLower = category.toLowerCase();

        // Comparar por ID exacto o por nombre (con includes para flexibilidad)
        return (
          catId === filterStr ||
          videoCategoriaNombre.includes(filterLower) ||
          videoCatalogoNombre.includes(filterLower)
        );
      });
    }

    setVideos(filtered);
  };

  const handleUploadVideo = () => {
    if (!isAuthenticated) return navigate("/login");
    navigate("/upload");
  };

  const handleVideoClick = async (video, index = 0) => {
    try {
      await catalogService.incrementViews(video.id);
    } catch {}
    setSelectedVideo(video);
    setCurrentVideoIndex(index);
    if (!socialMode) return;
  };

  const handleSocialModeToggle = () => {
    if (!socialMode && videos.length > 0) {
      setSocialMode(true);
      setCurrentVideoIndex(0);
      setSelectedVideo(videos[0]);
    } else {
      setSocialMode(false);
      setSelectedVideo(null);
    }
  };

  const handleNextVideo = () => {
    if (currentVideoIndex < videos.length - 1) {
      const newIndex = currentVideoIndex + 1;
      const v = videos[newIndex];
      setCurrentVideoIndex(newIndex);
      handleVideoClick(v, newIndex);
    }
  };
  const handlePreviousVideo = () => {
    if (currentVideoIndex > 0) {
      const newIndex = currentVideoIndex - 1;
      const v = videos[newIndex];
      setCurrentVideoIndex(newIndex);
      handleVideoClick(v, newIndex);
    }
  };

  const closeVideoPlayer = () => {
    setSelectedVideo(null);
    if (socialMode) setSocialMode(false);
  };

  const closeCommentsPanel = () => {
    setShowComments(false);
    setSelectedVideoForComments(null);
  };

  const closeProcessingPanel = () => {
    setShowProcessingPanel(false);
    setSelectedVideoForProcessing(null);
  };

  const SocialVideoCard = ({ video, index }) => {
    const [isLiked, setIsLiked] = useState(!!video.usuario_ha_dado_like);
    const [isSaved, setIsSaved] = useState(!!video.usuario_ha_guardado);
    const [isShared, setIsShared] = useState(!!video.usuario_ha_compartido);
    const [likes, setLikes] = useState(video.total_likes || 0);
    const [comments, setComments] = useState(video.total_comentarios || 0);
    const [shares, setShares] = useState(video.total_compartidas || 0);
    const [menuOpen, setMenuOpen] = useState(false);
    const [likeLoading, setLikeLoading] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);
    const [shareLoading, setShareLoading] = useState(false);
    const [saves, setSaves] = useState(video.total_guardados || 0);
    const videoRef = useRef(null);
    const [userInteracted, setUserInteracted] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

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

    // Listener para actualizar contador de comentarios cuando se agrega uno
    useEffect(() => {
      const handler = (e) => {
        const { videoId, totalComments } = e?.detail || {};
        if (videoId === video.id && typeof totalComments === "number") {
          setComments(totalComments);
        }
      };
      window.addEventListener("commentAdded", handler);
      return () => window.removeEventListener("commentAdded", handler);
    }, [video.id]);

    useEffect(() => {
      const vid = videoRef.current;
      if (!vid) return;
      // Si el usuario no ha interactuado, mantener autoplay muted como preview
      if (!userInteracted) vid.muted = true;
      const onPlay = () => setIsPlaying(true);
      const onPause = () => setIsPlaying(false);
      const onTime = () => setCurrentTime(vid.currentTime || 0);
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
              vid.play().catch(() => {});
            } else {
              try {
                vid.pause();
              } catch (e) {}
            }
          });
        },
        { threshold: [0.5] }
      );
      vid.addEventListener("play", onPlay);
      vid.addEventListener("pause", onPause);
      vid.addEventListener("timeupdate", onTime);
      observer.observe(vid);
      return () => {
        observer.disconnect();
        vid.removeEventListener("play", onPlay);
        vid.removeEventListener("pause", onPause);
        vid.removeEventListener("timeupdate", onTime);
      };
    }, [videoRef, userInteracted]);

    const guardAuth = () => {
      if (!isAuthenticated) {
        alert("Debes iniciar sesión para realizar esta acción.");
        return false;
      }
      return true;
    };

    const handleLike = async () => {
      if (!guardAuth() || likeLoading) return;
      setLikeLoading(true);
      try {
        const result = await catalogService.toggleLike(video.id);
        // Actualizar estado basado SOLO en la respuesta del servidor
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

    const handleSave = async () => {
      if (!guardAuth() || saveLoading) return;
      setSaveLoading(true);
      const prevSaved = isSaved;
      const prevSaves = saves;
      const nextSaved = !prevSaved;
      const nextSaves = prevSaves + (nextSaved ? 1 : -1);
      setIsSaved(nextSaved);
      setSaves(Math.max(0, nextSaves));
      try {
        await catalogService.toggleSave(video.id);
      } catch (error) {
        setIsSaved(prevSaved);
        setSaves(prevSaves);
        if (error?.response?.status === 401) {
          alert("Inicia sesión para guardar videos.");
        } else {
          alert("Error al guardar. Intenta nuevamente.");
        }
      } finally {
        setSaveLoading(false);
      }
    };

    const handleShare = async () => {
      if (!guardAuth() || shareLoading) return;
      setShareLoading(true);

      // NO hacer optimistic update, esperar respuesta del servidor
      try {
        const res = await catalogService.toggleShare(video.id, "LINK");

        // Actualizar con la respuesta exacta del servidor
        const newShared = !!res.shared;
        const newTotal =
          typeof res.total_shares === "number" ? res.total_shares : shares;

        setIsShared(newShared);
        setShares(newTotal);

        const shareUrl = `${window.location.origin}/catalog?video=${video.id}`;

        // Solo mostrar modal/compartir si se está activando, no al desactivar
        if (newShared) {
          if (navigator.share) {
            try {
              await navigator.share({
                title: video.titulo,
                text: video.descripcion,
                url: shareUrl,
              });
              // still show modal as confirmation
              window.dispatchEvent(
                new CustomEvent("showShareModal", {
                  detail: {
                    url: shareUrl,
                    title: video.titulo,
                    description: video.descripcion,
                  },
                })
              );
            } catch (e) {
              // User cancelled or error, but share already registered
              console.log("Share API cancelled or error:", e);
            }
          } else {
            await navigator.clipboard.writeText(shareUrl);
            window.dispatchEvent(
              new CustomEvent("showShareModal", {
                detail: {
                  url: shareUrl,
                  title: video.titulo,
                  description: video.descripcion,
                },
              })
            );
          }
        }
      } catch (err) {
        console.error("Error sharing video:", err);
        if (err?.response?.status === 401) {
          alert("Inicia sesión para compartir videos.");
        } else {
          alert("Error al compartir. Intenta nuevamente.");
        }
      } finally {
        setShareLoading(false);
      }
    };

    const handleInlinePlayWithAudio = async (e) => {
      e.stopPropagation();
      const vid = videoRef.current;
      if (!vid) return;
      try {
        // Mark user interacted so we enable controls/unmuted playback
        setUserInteracted(true);
        vid.muted = false;
        vid.controls = true;
        vid.loop = false;
        await vid.play();
        setIsPlaying(true);
        try {
          await catalogService.incrementViews(video.id);
        } catch {}
      } catch (err) {
        console.warn("No se pudo reproducir con audio:", err);
      }
    };

    const handleSkip = (seconds) => {
      const vid = videoRef.current;
      if (!vid) return;
      const newTime = Math.max(
        0,
        Math.min(vid.duration || 0, (vid.currentTime || 0) + seconds)
      );
      vid.currentTime = newTime;
      setCurrentTime(newTime);
    };

    const handleComment = () => {
      setSelectedVideoForComments(video);
      setShowComments(true);
    };

    const formatNumber = (num) => {
      if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
      if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
      return String(num);
    };

    return (
      <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {video.categoria_nombre?.charAt(0) || "V"}
              </span>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">
                {video.categoria_nombre}
              </h4>
              <p className="text-xs text-gray-500">
                {catalogService.formatDate(video.fecha_publicacion)}
              </p>
            </div>
          </div>

          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMenuOpen((s) => !s)}
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
                {isAuthenticated && (
                  <button
                    onClick={() => {
                      setSelectedVideoForProcessing(video);
                      setShowProcessingPanel(true);
                      setMenuOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 text-gray-700 flex items-center space-x-2"
                  >
                    <span>🤖</span>
                    <span>Procesar con IA</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    console.log("Reportar video");
                    setMenuOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 text-gray-700"
                >
                  Reportar
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Media */}
        <div className="relative aspect-video bg-gradient-to-br from-gray-200 to-gray-300">
          {video.url_video ? (
            <video
              ref={videoRef}
              src={video.url_video}
              className="w-full h-full object-cover cursor-pointer"
              poster={video.url_thumbnail}
              onClick={() => handleVideoClick(video, index)}
              muted={!userInteracted}
              loop={!userInteracted}
              playsInline
              autoPlay={!userInteracted}
              preload="metadata"
            />
          ) : video.url_thumbnail ? (
            <img
              src={video.url_thumbnail}
              alt={video.titulo}
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => handleVideoClick(video, index)}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <FontAwesomeIcon
                icon={faFilm}
                className="text-gray-400 text-6xl"
              />
            </div>
          )}

          {/* Overlay Play */}
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-300">
              <Button
                className="opacity-70 hover:opacity-100 transition-opacity duration-300 bg-white text-gray-900 hover:bg-gray-100 rounded-full w-16 h-16"
                onClick={() => handleVideoClick(video, index)}
              >
                <FontAwesomeIcon icon={faPlay} className="text-2xl ml-1" />
              </Button>
            </div>
          )}

          {/* Inline audio / seek controls overlay */}
          <div className="absolute left-3 bottom-12 flex items-center space-x-2 z-20">
            {!userInteracted ? (
              <button
                onClick={handleInlinePlayWithAudio}
                className="bg-white bg-opacity-90 px-3 py-2 rounded-lg text-sm flex items-center space-x-2 hover:bg-opacity-100"
              >
                <FontAwesomeIcon icon={faVolumeUp} />
                <span>Escuchar</span>
              </button>
            ) : (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSkip(-10);
                  }}
                  className="bg-white bg-opacity-90 p-2 rounded-lg text-sm flex items-center hover:bg-opacity-100"
                  title="Retroceder 10s"
                >
                  <FontAwesomeIcon icon={faBackward} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSkip(10);
                  }}
                  className="bg-white bg-opacity-90 p-2 rounded-lg text-sm flex items-center hover:bg-opacity-100"
                  title="Adelantar 10s"
                >
                  <FontAwesomeIcon icon={faForward} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const vid = videoRef.current;
                    if (!vid) return;
                    vid.muted = !vid.muted;
                    setUserInteracted(true);
                  }}
                  className="bg-white bg-opacity-90 p-2 rounded-lg text-sm flex items-center hover:bg-opacity-100"
                  title="Silenciar/activar sonido"
                >
                  <FontAwesomeIcon
                    icon={
                      videoRef.current && videoRef.current.muted
                        ? faVolumeMute
                        : faVolumeUp
                    }
                  />
                </button>
              </>
            )}
          </div>

          {/* Duración */}
          {video.duracion_display && (
            <div className="absolute bottom-4 right-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm">
              <FontAwesomeIcon icon={faClock} className="mr-1" />
              {video.duracion_display}
            </div>
          )}

          {/* Views */}
          <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm">
            <FontAwesomeIcon icon={faEye} className="mr-1" />
            {catalogService.formatViews(video.visualizaciones)}
          </div>
        </div>

        {/* Acciones */}
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
                  title={isLiked ? "Te gusta" : "Me gusta"}
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

              {/* Comment */}
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleComment}
                  className="text-gray-600 hover:text-blue-500"
                  title="Comentar"
                >
                  <FontAwesomeIcon icon={faComment} className="text-xl" />
                </Button>
                <span className="text-sm font-medium">
                  {formatNumber(comments)}
                </span>
              </div>

              {/* Share */}
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShare}
                  disabled={shareLoading}
                  className={`${
                    isShared ? "text-green-600" : "text-gray-600"
                  } hover:text-green-600`}
                  title={isShared ? "Compartido" : "Compartir"}
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

            {/* Save */}
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSave}
                disabled={saveLoading}
                title={isSaved ? "Guardado" : "Guardar"}
                className={`hover:text-blue-500 ${
                  isSaved
                    ? "text-blue-500 !hover:text-blue-600 !hover:bg-blue-50"
                    : "text-gray-600"
                }`}
              >
                {saveLoading ? (
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                ) : (
                  <FontAwesomeIcon
                    icon={faBookmark}
                    className={`text-xl transition-colors duration-200 ${
                      isSaved ? "text-blue-500" : "text-gray-600"
                    }`}
                  />
                )}
              </Button>
              <span
                className={`text-sm font-medium transition-colors duration-200 ${
                  isSaved ? "text-blue-600" : "text-gray-800"
                }`}
              >
                {formatNumber(saves)}
              </span>
            </div>
          </div>

          {/* Título/desc */}
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

  const EmptyState = () => (
    <div className="text-center py-16">
      <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <FontAwesomeIcon
          icon={faVideoSlash}
          className="text-gray-400 text-3xl"
        />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        No hay videos disponibles
      </h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        Parece que aún no se han subido videos a la videoteca. Vuelve pronto
        para ver contenido nuevo.
      </p>
      <div className="space-y-2 text-sm text-gray-500">
        <p>🎬 Documentales educativos</p>
        <p>🎓 Conferencias académicas</p>
        <p>📚 Material de estudio</p>
        <p>🎉 Eventos universitarios</p>
      </div>
    </div>
  );

  // ======================= Mini widget flotante de anuncios =======================
  function FloatingPublicAd() {
    const [ads, setAds] = useState([]);
    const [idx, setIdx] = useState(0);
    const [paused, setPaused] = useState(false);
    const [minimized, setMinimized] = useState(false);
    const timerRef = useRef(null);

    useEffect(() => {
      let mounted = true;
      (async () => {
        try {
          const { data } = await api.get(
            "/catalogodigital/public/anuncios/?page_size=10&ordering=-fecha_creacion"
          );
          const results = Array.isArray(data?.results)
            ? data.results
            : Array.isArray(data)
            ? data
            : [];
          const now = new Date();
          const vigentes = results.filter((a) => {
            if (a.activo === false) return false;
            const ini = a.fecha_inicio ? new Date(a.fecha_inicio) : null;
            const fin = a.fecha_fin ? new Date(a.fecha_fin) : null;
            if (ini && now < ini) return false;
            if (fin && now > fin) return false;
            return true;
          });
          if (mounted) setAds(vigentes);
        } catch (e) {}
      })();
      return () => {
        mounted = false;
      };
    }, []);

    useEffect(() => {
      if (paused || ads.length <= 1 || minimized) return;
      timerRef.current = setInterval(() => {
        setIdx((i) => (i + 1) % ads.length);
      }, 12000); // 12s
      return () => clearInterval(timerRef.current);
    }, [ads.length, paused, minimized]);

    const current = ads.length ? ads[idx] : null;
    if (!current) return null;

    return (
      <div className="fixed z-40 left-6 bottom-28 sm:left-8 sm:bottom-28">
        {/* Contenedor compacto */}
        <div
          className={[
            "rounded-xl shadow-2xl border bg-white overflow-hidden",
            "transition-all duration-300",
            minimized ? "w-52" : "w-80 max-w-[92vw]",
          ].join(" ")}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* Header del widget */}
          <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b">
            <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
              <span>Publicidad</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                className="p-1.5 text-gray-500 hover:text-gray-700"
                onClick={() => setMinimized((m) => !m)}
                title={minimized ? "Expandir" : "Minimizar"}
              >
                <FontAwesomeIcon
                  icon={minimized ? faChevronUp : faChevronDown}
                />
              </button>
            </div>
          </div>

          {/* Cuerpo */}
          {!minimized ? (
            <div className="p-3">
              {/* Imagen completa, sin recorte */}
              {current.url_imagen ? (
                <a
                  href={current.url_destino || "#"}
                  target={current.url_destino ? "_blank" : "_self"}
                  rel="noreferrer nofollow"
                  className="block"
                >
                  <div className="relative bg-black rounded-lg overflow-hidden">
                    <div className="aspect-video w-full flex items-center justify-center">
                      <img
                        src={current.url_imagen}
                        alt={current.titulo || "Anuncio"}
                        className="max-h-full max-w-full object-contain"
                        loading="lazy"
                      />
                    </div>
                    <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/30 via-black/10 to-transparent" />
                  </div>
                </a>
              ) : (
                <div className="aspect-video w-full grid place-items-center bg-gray-100 text-gray-400 rounded-lg">
                  Sin imagen
                </div>
              )}

              {/* Texto + CTA */}
              <div className="mt-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">
                    {current.titulo || "Anuncio"}
                  </h3>
                  {ads.length > 1 && (
                    <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                      {idx + 1}/{ads.length}
                    </span>
                  )}
                </div>

                {current.descripcion && (
                  <p className="mt-1 text-xs text-gray-600 line-clamp-2">
                    {current.descripcion}
                  </p>
                )}

                <div className="mt-3 flex items-center gap-2">
                  {current.url_destino && (
                    <a
                      href={current.url_destino}
                      target="_blank"
                      rel="noreferrer nofollow"
                    >
                      <Button size="sm" className="!py-1.5">
                        <FontAwesomeIcon
                          icon={faExternalLinkAlt}
                          className="mr-2"
                        />
                        Ver más
                      </Button>
                    </a>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="!py-1.5"
                    onClick={() => setIdx((i) => (i + 1) % ads.length)}
                    disabled={ads.length <= 1}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            // Vista minimizada (ultra compacta)
            <button
              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => setMinimized(false)}
            >
              {current.titulo || "Anuncio"}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <SessionExpiryAlert />

      {/* Encabezado de página con búsqueda inteligente - STICKY */}
      <div className="sticky top-16 z-40 bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <SmartSearchBar
            onSearch={handleSearch}
            onFilterChange={handleFilterChange}
          />
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-end mb-8">
          <Button
            variant={socialMode ? "primary" : "outline"}
            size="sm"
            onClick={handleSocialModeToggle}
            className="flex items-center"
          >
            <FontAwesomeIcon icon={faMobile} className="mr-2" />
            {socialMode ? "Modo Pantalla Completa" : "Pantalla Completa"}
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <FontAwesomeIcon
              icon={faSpinner}
              className="text-blue-600 text-4xl animate-spin mb-4"
            />
            <p className="text-gray-600">Cargando videos...</p>
          </div>
        ) : videos.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Catálogo principal con ranking AI */}
            <div className="max-w-4xl mx-auto">
              <div className="space-y-8">
                {videos.map((video, index) => (
                  <SocialVideoCard key={video.id} video={video} index={index} />
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Botón flotante de subida */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={handleUploadVideo}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full w-16 h-16 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
          title={
            isAuthenticated ? "Subir video" : "Inicia sesión para subir videos"
          }
        >
          <FontAwesomeIcon
            icon={faPlus}
            className="text-2xl group-hover:rotate-90 transition-transform duration-300"
          />
        </Button>
      </div>

      {/* Widget flotante siempre visible */}
      <FloatingPublicAd />

      {/* Reproductores */}
      {selectedVideo && socialMode && (
        <SocialVideoPlayer
          video={selectedVideo}
          onClose={closeVideoPlayer}
          onNext={handleNextVideo}
          onPrevious={handlePreviousVideo}
        />
      )}
      {selectedVideo && !socialMode && (
        <VideoPlayer video={selectedVideo} onClose={closeVideoPlayer} />
      )}

      {/* Panel de comentarios */}
      <CommentsPanel
        video={selectedVideoForComments}
        isOpen={showComments}
        onClose={closeCommentsPanel}
      />

      {/* Panel de procesamiento con IA */}
      <VideoProcessingPanel
        video={selectedVideoForProcessing}
        isOpen={showProcessingPanel}
        onClose={closeProcessingPanel}
      />

      {/* Modal bonito de compartir */}
      <ShareModal
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        url={shareData.url}
        title={shareData.title}
        description={shareData.description}
      />

      {/* Fondo decorativo con marcas de agua del Canal 11 TVU */}
      <CatalogBackground />
    </div>
  );
}
