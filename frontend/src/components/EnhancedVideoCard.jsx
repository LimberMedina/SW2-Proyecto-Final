// src/components/EnhancedVideoCard.jsx
import { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlay,
  faPause,
  faVolumeUp,
  faVolumeMute,
  faVolumeDown,
  faClosedCaptioning,
  faEllipsisV,
  faBookmark,
  faHeart,
  faComment,
  faShare,
  faCheck,
  faSpinner,
  faEye,
  faClock,
  faFilm,
} from "@fortawesome/free-solid-svg-icons";
import Button from "./Button";
import catalogService from "../services/catalogService";

export default function EnhancedVideoCard({
  video,
  index,
  onVideoClick,
  onComment,
  onProcessVideo,
  isAuthenticated,
  user,
}) {
  // Estados de interacción
  const [isLiked, setIsLiked] = useState(!!video.usuario_ha_dado_like);
  const [isSaved, setIsSaved] = useState(!!video.usuario_ha_guardado);
  const [isShared, setIsShared] = useState(!!video.usuario_ha_compartido);
  const [likes, setLikes] = useState(video.total_likes || 0);
  const [comments, setComments] = useState(video.total_comentarios || 0);
  const [shares, setShares] = useState(video.total_compartidas || 0);
  const [saves, setSaves] = useState(video.total_guardados || 0);

  // Estados de carga
  const [menuOpen, setMenuOpen] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);

  // Estados del reproductor
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(true); // Muted por defecto para autoplay
  const [showControls, setShowControls] = useState(false);
  const [subtitles, setSubtitles] = useState(null);
  const [showSubtitles, setShowSubtitles] = useState(false);
  const [currentSubtitle, setCurrentSubtitle] = useState("");

  const videoRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    setIsLiked(!!video.usuario_ha_dado_like);
    setIsSaved(!!video.usuario_ha_guardado);
    setIsShared(!!video.usuario_ha_compartido);
    setLikes(video.total_likes || 0);
    setComments(video.total_comentarios || 0);
    setShares(video.total_compartidas || 0);
    setSaves(video.total_guardados || 0);
  }, [video]);

  // Setup del video con IntersectionObserver
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    vid.muted = isMuted;
    vid.volume = volume;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTimeUpdate = () => {
      setCurrentTime(vid.currentTime);
      updateSubtitle(vid.currentTime);
    };
    const onLoadedMetadata = () => setDuration(vid.duration);

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
    vid.addEventListener("timeupdate", onTimeUpdate);
    vid.addEventListener("loadedmetadata", onLoadedMetadata);
    observer.observe(vid);

    return () => {
      observer.disconnect();
      vid.removeEventListener("play", onPlay);
      vid.removeEventListener("pause", onPause);
      vid.removeEventListener("timeupdate", onTimeUpdate);
      vid.removeEventListener("loadedmetadata", onLoadedMetadata);
    };
  }, [isMuted, volume]);

  const updateSubtitle = (time) => {
    if (!subtitles || !showSubtitles) {
      setCurrentSubtitle("");
      return;
    }

    const current = subtitles.find(
      (sub) => time >= sub.start && time <= sub.end
    );
    setCurrentSubtitle(current ? current.text : "");
  };

  const guardAuth = () => {
    if (!isAuthenticated) {
      alert("Debes iniciar sesión para realizar esta acción.");
      return false;
    }
    return true;
  };

  const togglePlay = (e) => {
    e.stopPropagation();
    const vid = videoRef.current;
    if (isPlaying) {
      vid.pause();
    } else {
      vid.play();
    }
  };

  const handleTimeChange = (e) => {
    e.stopPropagation();
    const vid = videoRef.current;
    const newTime = (parseFloat(e.target.value) / 100) * duration;
    vid.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e) => {
    e.stopPropagation();
    const newVolume = parseFloat(e.target.value) / 100;
    setVolume(newVolume);
    videoRef.current.volume = newVolume;
    setIsMuted(newVolume === 0);
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    const vid = videoRef.current;
    if (isMuted) {
      vid.volume = volume;
      vid.muted = false;
      setIsMuted(false);
    } else {
      vid.volume = 0;
      vid.muted = true;
      setIsMuted(true);
    }
  };

  const toggleSubtitles = (e) => {
    e.stopPropagation();
    setShowSubtitles(!showSubtitles);
  };

  const formatTime = (time) => {
    if (!time || isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const formatNumber = (num) => {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return String(num);
  };

  const handleLike = async () => {
    if (!guardAuth() || likeLoading) return;
    setLikeLoading(true);
    const prevLiked = isLiked;
    const prevLikes = likes;
    const nextLiked = !prevLiked;
    const nextLikes = prevLikes + (nextLiked ? 1 : -1);
    setIsLiked(nextLiked);
    setLikes(Math.max(0, nextLikes));
    try {
      const result = await catalogService.toggleLike(video.id);
      setIsLiked(!!result.liked);
      setLikes(result.total_likes ?? Math.max(0, nextLikes));
    } catch (error) {
      setIsLiked(prevLiked);
      setLikes(prevLikes);
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
    if (!isAuthenticated) {
      alert("Debes iniciar sesión para compartir videos.");
      return;
    }
    if (shareLoading) return;
    setShareLoading(true);

    // Optimistic update
    const prevShared = isShared;
    const prevShares = shares;
    const nextShared = !prevShared;
    const nextShares = prevShares + (nextShared ? 1 : -1);
    setIsShared(nextShared);
    setShares(Math.max(0, nextShares));

    try {
      const res = await catalogService.toggleShare(video.id, "LINK");
      setIsShared(!!res.shared);
      setShares(res.total_shares ?? Math.max(0, nextShares));

      const shareUrl = `${window.location.origin}/catalog?video=${video.id}`;

      // Solo mostrar modal/compartir si se está activando, no al desactivar
      if (res.shared) {
        if (navigator.share) {
          try {
            await navigator.share({
              title: video.titulo,
              text: video.descripcion,
              url: shareUrl,
            });
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
      // Revertir en caso de error
      setIsShared(prevShared);
      setShares(prevShares);
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
              {isAuthenticated && onProcessVideo && (
                <button
                  onClick={() => {
                    onProcessVideo(video);
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

      {/* Video Container */}
      <div
        ref={containerRef}
        className="relative aspect-video bg-gradient-to-br from-gray-200 to-gray-300"
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        {video.url_video ? (
          <video
            ref={videoRef}
            src={video.url_video}
            className="w-full h-full object-cover"
            poster={video.url_thumbnail}
            loop
            playsInline
            preload="metadata"
          />
        ) : video.url_thumbnail ? (
          <img
            src={video.url_thumbnail}
            alt={video.titulo}
            className="w-full h-full object-cover cursor-pointer"
            onClick={() => onVideoClick(video, index)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <FontAwesomeIcon icon={faFilm} className="text-gray-400 text-6xl" />
          </div>
        )}

        {/* Subtítulos */}
        {currentSubtitle && showSubtitles && (
          <div className="absolute bottom-20 left-0 right-0 flex justify-center px-4">
            <div className="bg-black bg-opacity-80 text-white px-4 py-2 rounded-lg max-w-2xl">
              <p className="text-center text-sm sm:text-base">
                {currentSubtitle}
              </p>
            </div>
          </div>
        )}

        {/* Overlay click para pantalla completa */}
        <div
          className="absolute inset-0 cursor-pointer"
          onClick={() => onVideoClick(video, index)}
        />

        {/* Controles del video */}
        {video.url_video && (
          <div
            className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/70 to-transparent p-4 transition-opacity duration-300 ${
              showControls ? "opacity-100" : "opacity-0"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Barra de progreso */}
            <div className="mb-3">
              <input
                type="range"
                min="0"
                max="100"
                value={duration ? (currentTime / duration) * 100 : 0}
                onChange={handleTimeChange}
                className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${
                    duration ? (currentTime / duration) * 100 : 0
                  }%, #4b5563 ${
                    duration ? (currentTime / duration) * 100 : 0
                  }%, #4b5563 100%)`,
                }}
              />
              <div className="flex justify-between text-xs text-white mt-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Controles principales */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={togglePlay}
                  className="text-white hover:text-blue-400 transition-colors"
                >
                  <FontAwesomeIcon
                    icon={isPlaying ? faPause : faPlay}
                    className="text-lg"
                  />
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={toggleMute}
                    className="text-white hover:text-blue-400 transition-colors"
                  >
                    <FontAwesomeIcon
                      icon={
                        isMuted
                          ? faVolumeMute
                          : volume > 0.5
                          ? faVolumeUp
                          : faVolumeDown
                      }
                      className="text-sm"
                    />
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={isMuted ? 0 : volume * 100}
                    onChange={handleVolumeChange}
                    className="w-16 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>

                {subtitles && (
                  <button
                    onClick={toggleSubtitles}
                    className={`text-white hover:text-blue-400 transition-colors ${
                      showSubtitles ? "text-blue-400" : ""
                    }`}
                    title="Subtítulos"
                  >
                    <FontAwesomeIcon
                      icon={faClosedCaptioning}
                      className="text-sm"
                    />
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-2 text-white text-xs">
                <FontAwesomeIcon icon={faEye} className="text-gray-400" />
                <span>{catalogService.formatViews(video.visualizaciones)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Badge de duración (solo si no hay controles activos) */}
        {video.duracion_display && !showControls && (
          <div className="absolute bottom-4 right-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm">
            <FontAwesomeIcon icon={faClock} className="mr-1" />
            {video.duracion_display}
          </div>
        )}
      </div>

      {/* Acciones sociales */}
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
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                ) : (
                  <FontAwesomeIcon icon={faHeart} className="text-xl" />
                )}
              </Button>
              <span className="text-sm font-medium">{formatNumber(likes)}</span>
            </div>

            {/* Comment */}
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onComment(video)}
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
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
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
                isSaved ? "text-blue-500" : "text-gray-600"
              }`}
            >
              {saveLoading ? (
                <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
              ) : (
                <FontAwesomeIcon icon={faBookmark} className="text-xl" />
              )}
            </Button>
            <span className="text-sm font-medium">{formatNumber(saves)}</span>
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
}
