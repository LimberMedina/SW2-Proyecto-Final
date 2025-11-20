import { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlay,
  faPause,
  faVolumeUp,
  faVolumeMute,
  faExpand,
  faCompress,
  faThumbsUp,
  faComment,
  faShare,
  faEllipsisV,
  faHeart,
  faBookmark,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import videoProcessingService from "../services/videoProcessingService";
import catalogService from "../services/catalogService";
import { useAuth } from "../hooks/useAuth";
import Button from "./Button";

const VideoPlayer = ({ video, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(video.total_likes || 0);
  const [saved, setSaved] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [shared, setShared] = useState(!!video.usuario_ha_compartido);
  const [sharesCount, setSharesCount] = useState(video.total_compartidas || 0);
  const [shareLoading, setShareLoading] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(false);
  const [subtitles, setSubtitles] = useState(null); // [{start, end, text}]
  const [currentSubtitle, setCurrentSubtitle] = useState("");
  const [loadingSubtitles, setLoadingSubtitles] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration);

    video.addEventListener("timeupdate", updateTime);
    video.addEventListener("loadedmetadata", updateDuration);

    return () => {
      video.removeEventListener("timeupdate", updateTime);
      video.removeEventListener("loadedmetadata", updateDuration);
    };
  }, []);

  // Update subtitle on time change
  useEffect(() => {
    if (!subtitles || !showSubtitles) {
      setCurrentSubtitle("");
      return;
    }

    const time = currentTime;
    const cue = subtitles.find((s) => time >= s.start && time <= s.end);
    setCurrentSubtitle(cue ? cue.text : "");
  }, [currentTime, subtitles, showSubtitles]);

  // Parse VTT or SRT text into cues
  const parseVtt = (vttText) => {
    if (!vttText) return [];
    const cues = [];
    // Normalize line endings
    const text = vttText.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    // Regex to capture timestamps and following text
    const pattern =
      /(?:(?:^|\n)(?:[^\n]*\n)?)?(\d{2}:\d{2}:\d{2}\.\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}\.\d{3})\s*\n([\s\S]*?)(?=\n\n|$)/g;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const start = timeToSeconds(match[1]);
      const end = timeToSeconds(match[2]);
      const raw = match[3].trim();
      const cleaned = raw
        .replace(/<[^>]+>/g, "")
        .replace(/\n/g, " ")
        .trim();
      cues.push({ start, end, text: cleaned });
    }
    return cues;
  };

  const timeToSeconds = (ts) => {
    // ts = HH:MM:SS.mmm
    const parts = ts.split(":");
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const secParts = parts[2].split(".");
    const seconds = parseInt(secParts[0], 10);
    const millis = parseInt(secParts[1] || "0", 10);
    return hours * 3600 + minutes * 60 + seconds + millis / 1000;
  };

  const handleToggleSubtitles = async () => {
    if (showSubtitles) {
      // turn off
      setShowSubtitles(false);
      return;
    }

    // turn on
    if (subtitles && subtitles.length) {
      setShowSubtitles(true);
      return;
    }

    setLoadingSubtitles(true);
    try {
      const res = await videoProcessingService.generateSubtitles(
        video.id,
        "es",
        "vtt"
      );
      if (!res.success) {
        const msg = videoProcessingService.getFriendlyErrorMessage(
          res.error_type || "unknown"
        );
        alert(msg + (res.error ? `\nDetalles: ${res.error}` : ""));
        setLoadingSubtitles(false);
        return;
      }

      // res.subtitles contains VTT text
      const cues = parseVtt(
        res.subtitles || res.subtitles_text || res.subtitles || ""
      );
      if (cues.length === 0 && res.subtitles) {
        // try parse as SRT if VTT parsing fails
        const srtCues = parseSrt(res.subtitles);
        setSubtitles(srtCues);
      } else {
        setSubtitles(cues);
      }
      setShowSubtitles(true);
    } catch (err) {
      alert("Error al obtener subtítulos: " + String(err));
    } finally {
      setLoadingSubtitles(false);
    }
  };

  const parseSrt = (srtText) => {
    if (!srtText) return [];
    const text = srtText.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    const blocks = text.split(/\n\n+/);
    const cues = [];
    for (const block of blocks) {
      const lines = block.trim().split("\n");
      if (lines.length >= 2) {
        const timeLine = lines.find((l) => l.includes("-->"));
        if (!timeLine) continue;
        const [startRaw, endRaw] = timeLine.split("-->").map((s) => s.trim());
        const start = srtTimeToSeconds(startRaw);
        const end = srtTimeToSeconds(endRaw);
        const textLines = lines.slice(lines.indexOf(timeLine) + 1).join(" ");
        cues.push({ start, end, text: textLines.replace(/<[^>]+>/g, "") });
      }
    }
    return cues;
  };

  const srtTimeToSeconds = (ts) => {
    // TS = HH:MM:SS,mmm
    const [hms, ms] = ts.split(",");
    const parts = hms.split(":");
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const seconds = parseInt(parts[2], 10);
    const millis = parseInt(ms || "0", 10);
    return hours * 3600 + minutes * 60 + seconds + millis / 1000;
  };

  const handleAnalyzeVideo = async () => {
    if (analyzing) return;
    setAnalyzing(true);
    try {
      const res = await videoProcessingService.analyzeContent(video.id, "es");
      if (!res.success) {
        alert(
          videoProcessingService.getFriendlyErrorMessage(
            res.error_type || "unknown"
          )
        );
        setAnalyzing(false);
        return;
      }
      setAnalysisResult(res.analysis || res);
      // show a simple summary modal/alert
      const summary =
        res.analysis?.resumen || res.resumen || "Análisis completado";
      const keywords = (
        res.analysis?.palabras_clave ||
        res.palabras_clave ||
        []
      ).join(", ");
      alert(`Resumen:\n${summary}\n\nPalabras clave:\n${keywords}`);
    } catch (err) {
      alert("Error al analizar el video: " + String(err));
    } finally {
      setAnalyzing(false);
    }
  };
  const togglePlay = () => {
    const video = videoRef.current;
    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeChange = (e) => {
    const video = videoRef.current;
    const newTime = (e.target.value / 100) * duration;
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e) => {
    const newVolume = e.target.value / 100;
    setVolume(newVolume);
    videoRef.current.volume = newVolume;
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (isMuted) {
      video.volume = volume;
      setIsMuted(false);
    } else {
      video.volume = 0;
      setIsMuted(true);
    }
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  const handleLike = () => {
    if (!isAuthenticated) {
      alert("Debes iniciar sesión para dar me gusta.");
      return;
    }

    const prevLiked = liked;
    const prevCount = likesCount;
    const nextLiked = !prevLiked;
    setLiked(nextLiked);
    setLikesCount((c) => c + (nextLiked ? 1 : -1));

    // Llamada al backend
    catalogService
      .toggleLike(video.id)
      .then((res) => {
        // actualizar con valores reales si vienen
        if (typeof res?.total_likes === "number")
          setLikesCount(res.total_likes);
        setLiked(!!res?.liked);
      })
      .catch((err) => {
        // revertir
        setLiked(prevLiked);
        setLikesCount(prevCount);
        console.error("Error al dar like:", err);
        alert("Error al dar like. Intenta nuevamente.");
      });
  };

  const handleSave = () => {
    setSaved(!saved);
    setShowMenu(false);
    // Aquí puedes agregar la lógica para guardar el video
  };

  const handleFavorite = () => {
    setFavorited(!favorited);
    setShowMenu(false);
    // Aquí puedes agregar la lógica para agregar a favoritos
  };

  const handleShare = () => {
    if (!isAuthenticated) {
      alert("Debes iniciar sesión para compartir videos.");
      return;
    }
    if (shareLoading) return;

    setShareLoading(true);

    // Optimistic update
    const prevShared = shared;
    const prevCount = sharesCount;
    const nextShared = !prevShared;
    setShared(nextShared);
    setSharesCount((c) => c + (nextShared ? 1 : -1));

    catalogService
      .toggleShare(video.id, "LINK")
      .then((res) => {
        setShared(!!res.shared);
        if (typeof res?.total_shares === "number")
          setSharesCount(res.total_shares);

        const shareUrl = `${window.location.origin}/catalog?video=${video.id}`;

        // Solo mostrar modal/compartir si se está activando, no al desactivar
        if (res.shared) {
          if (navigator.share) {
            navigator
              .share({
                title: video.titulo,
                text: video.descripcion,
                url: shareUrl,
              })
              .then(() => {
                window.dispatchEvent(
                  new CustomEvent("showShareModal", {
                    detail: {
                      url: shareUrl,
                      title: video.titulo,
                      description: video.descripcion,
                    },
                  })
                );
              })
              .catch(async () => {
                try {
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
                } catch (e) {
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
              });
          } else {
            navigator.clipboard
              .writeText(shareUrl)
              .then(() => {
                window.dispatchEvent(
                  new CustomEvent("showShareModal", {
                    detail: {
                      url: shareUrl,
                      title: video.titulo,
                      description: video.descripcion,
                    },
                  })
                );
              })
              .catch(() => {
                window.dispatchEvent(
                  new CustomEvent("showShareModal", {
                    detail: {
                      url: shareUrl,
                      title: video.titulo,
                      description: video.descripcion,
                    },
                  })
                );
              });
          }
        }
      })
      .catch((err) => {
        // Revertir en caso de error
        setShared(prevShared);
        setSharesCount(prevCount);
        console.error("Error al compartir:", err);
        alert("Error al compartir. Intenta nuevamente.");
      })
      .finally(() => setShareLoading(false));
  };

  const handleComment = () => {
    // Emitir evento global para que Catalog.jsx abra el panel de comentarios
    try {
      window.dispatchEvent(
        new CustomEvent("openComments", { detail: { videoId: video.id } })
      );
    } catch (e) {
      console.warn("No se pudo abrir panel de comentarios:", e);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
      <div className="w-full h-full max-w-6xl max-h-full flex flex-col">
        {/* Header con título y botón cerrar */}
        <div className="flex justify-between items-center p-4 text-white">
          <h2 className="text-xl font-semibold truncate flex-1 mr-4">
            {video.titulo}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20"
          >
            <FontAwesomeIcon icon={faTimes} />
          </Button>
        </div>

        {/* Container del video */}
        <div className="flex-1 flex items-center justify-center px-4">
          <div
            ref={containerRef}
            className="relative w-full max-w-4xl aspect-video bg-black rounded-lg overflow-hidden"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => isPlaying && setShowControls(false)}
          >
            {/* Menu de opciones */}
            {showMenu && (
              <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg py-2 z-10">
                <button
                  onClick={handleSave}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center"
                >
                  <FontAwesomeIcon icon={faBookmark} className="mr-3" />
                  {saved ? "Quitar de guardados" : "Guardar"}
                </button>
                <button
                  onClick={handleFavorite}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center"
                >
                  <FontAwesomeIcon icon={faHeart} className="mr-3" />
                  {favorited ? "Quitar de favoritos" : "Agregar a favoritos"}
                </button>
              </div>
            )}
            {showMenu && (
              <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg py-2 z-10">
                <button
                  onClick={handleSave}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center"
                >
                  <FontAwesomeIcon icon={faBookmark} className="mr-3" />
                  {saved ? "Quitar de guardados" : "Guardar video"}
                </button>
                <button
                  onClick={handleFavorite}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center"
                >
                  <FontAwesomeIcon icon={faHeart} className="mr-3" />
                  {favorited ? "Quitar de favoritos" : "Agregar a favoritos"}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleSubtitles();
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center"
                >
                  <span className="mr-3">CC</span>
                  <span>
                    {showSubtitles
                      ? "Deshabilitar subtítulos"
                      : loadingSubtitles
                      ? "Cargando subtítulos..."
                      : "Habilitar subtítulos"}
                  </span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAnalyzeVideo();
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center"
                >
                  <span className="mr-3">🤖</span>
                  <span>{analyzing ? "Analizando..." : "Analizar video"}</span>
                </button>
              </div>
            )}

            {/* Botón de menú */}
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full p-2 z-10"
            >
              <FontAwesomeIcon icon={faEllipsisV} />
            </button>

            {/* Video */}
            <video
              ref={videoRef}
              className="w-full h-full object-contain"
              src={video.url_video}
              poster={video.url_thumbnail}
              onClick={togglePlay}
            />

            {/* Subtítulos superpuestos */}
            {showSubtitles && currentSubtitle && (
              <div className="absolute bottom-20 left-0 right-0 flex justify-center px-4 pointer-events-none">
                <div className="bg-black bg-opacity-80 text-white px-4 py-2 rounded-lg text-center max-w-3xl">
                  <span
                    className="text-lg font-medium leading-relaxed"
                    style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.8)" }}
                  >
                    {currentSubtitle}
                  </span>
                </div>
              </div>
            )}

            {/* Controles del video */}
            <div
              className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/50 to-transparent p-4 transition-opacity duration-300 ${
                showControls ? "opacity-100" : "opacity-0"
              }`}
            >
              {/* Barra de progreso */}
              <div className="mb-4">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={duration ? (currentTime / duration) * 100 : 0}
                  onChange={handleTimeChange}
                  className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-white mt-1">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Controles principales */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={togglePlay}
                    className="text-white hover:text-blue-400 transition-colors"
                  >
                    <FontAwesomeIcon
                      icon={isPlaying ? faPause : faPlay}
                      size="lg"
                    />
                  </button>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={toggleMute}
                      className="text-white hover:text-blue-400 transition-colors"
                    >
                      <FontAwesomeIcon
                        icon={isMuted ? faVolumeMute : faVolumeUp}
                      />
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={isMuted ? 0 : volume * 100}
                      onChange={handleVolumeChange}
                      className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>

                <button
                  onClick={toggleFullscreen}
                  className="text-white hover:text-blue-400 transition-colors"
                >
                  <FontAwesomeIcon
                    icon={isFullscreen ? faCompress : faExpand}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Botones de interacción */}
        <div className="p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-center space-x-6 mb-4">
              <button
                onClick={handleLike}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  liked
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                <FontAwesomeIcon icon={faThumbsUp} />
                <span>Me gusta</span>
              </button>

              <button
                onClick={handleComment}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-700 text-gray-300 hover:bg-gray-600 rounded-lg transition-colors"
              >
                <FontAwesomeIcon icon={faComment} />
                <span>Comentar</span>
              </button>

              <button
                onClick={handleShare}
                disabled={shareLoading}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  shared
                    ? "bg-green-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                <FontAwesomeIcon icon={faShare} />
                <span>{shared ? "Compartido" : "Compartir"}</span>
                {sharesCount > 0 && (
                  <span className="ml-1 text-xs">({sharesCount})</span>
                )}
              </button>
            </div>

            {/* Información del video */}
            <div className="text-center text-gray-300">
              <h3 className="text-lg font-semibold mb-2">{video.titulo}</h3>
              <p className="text-sm opacity-80 max-w-2xl mx-auto">
                {video.descripcion}
              </p>
              <div className="flex justify-center items-center space-x-4 mt-2 text-xs">
                <span>{video.categoria_nombre}</span>
                <span>•</span>
                <span>{video.visualizaciones} visualizaciones</span>
                <span>•</span>
                <span>{video.duracion_display}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
