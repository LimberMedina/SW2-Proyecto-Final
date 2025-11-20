import { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlay,
  faPause,
  faVolumeUp,
  faVolumeMute,
  faHeart,
  faComment,
  faShare,
  faEllipsisV,
  faBookmark,
  faUserPlus,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import Button from "./Button";

const SocialVideoPlayer = ({ video, onClose, onNext, onPrevious }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [likes, setLikes] = useState(
    video.likes || Math.floor(Math.random() * 1000) + 50
  );
  const [comments, setComments] = useState(
    video.comments || Math.floor(Math.random() * 100) + 10
  );
  const [shares, setShares] = useState(
    video.shares || Math.floor(Math.random() * 50) + 5
  );

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      const updateTime = () => setCurrentTime(video.currentTime);
      const updateDuration = () => setDuration(video.duration);

      video.addEventListener("timeupdate", updateTime);
      video.addEventListener("loadedmetadata", updateDuration);

      // Auto-play cuando se carga
      video
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch(console.error);

      return () => {
        video.removeEventListener("timeupdate", updateTime);
        video.removeEventListener("loadedmetadata", updateDuration);
      };
    }
  }, [video]);

  // Ocultar controles después de 3 segundos
  useEffect(() => {
    if (showControls) {
      const timer = setTimeout(() => {
        setShowControls(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showControls]);

  const togglePlay = () => {
    const videoElement = videoRef.current;
    if (videoElement) {
      if (isPlaying) {
        videoElement.pause();
      } else {
        videoElement.play();
      }
      setIsPlaying(!isPlaying);
    }
    setShowControls(true);
  };

  const toggleMute = () => {
    const videoElement = videoRef.current;
    if (videoElement) {
      videoElement.muted = !isMuted;
      setIsMuted(!isMuted);
    }
    setShowControls(true);
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikes((prev) => (isLiked ? prev - 1 : prev + 1));
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: video.titulo,
        text: video.descripcion,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Enlace copiado al portapapeles");
    }
    setShares((prev) => prev + 1);
  };

  const handleComment = () => {
    // Aquí puedes implementar la funcionalidad de comentarios
    console.log("Abrir comentarios");
  };

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Manejar scroll para cambiar videos
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowUp" && onPrevious) {
        onPrevious();
      } else if (e.key === "ArrowDown" && onNext) {
        onNext();
      } else if (e.key === "Escape") {
        onClose();
      } else if (e.key === " ") {
        e.preventDefault();
        togglePlay();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onNext, onPrevious, onClose]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex">
      {/* Video Container */}
      <div
        className="relative flex-1 flex items-center justify-center"
        onClick={() => setShowControls(!showControls)}
      >
        {/* Video */}
        <video
          ref={videoRef}
          src={video.url_video}
          className="max-h-full max-w-full object-contain"
          loop
          muted={isMuted}
          playsInline
          onClick={(e) => {
            e.stopPropagation();
            togglePlay();
          }}
        />

        {/* Play/Pause Overlay */}
        {showControls && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className="bg-black bg-opacity-50 rounded-full p-4 pointer-events-auto cursor-pointer"
              onClick={togglePlay}
            >
              <FontAwesomeIcon
                icon={isPlaying ? faPause : faPlay}
                className="text-white text-3xl"
              />
            </div>
          </div>
        )}

        {/* Controls */}
        {showControls && (
          <>
            {/* Top Controls */}
            <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-white hover:bg-white hover:bg-opacity-20"
                >
                  <FontAwesomeIcon icon={faTimes} />
                </Button>
                <div className="text-white">
                  <h3 className="font-semibold">{video.titulo}</h3>
                  <p className="text-sm opacity-75">{video.categoria_nombre}</p>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMute}
                className="text-white hover:bg-white hover:bg-opacity-20"
              >
                <FontAwesomeIcon icon={isMuted ? faVolumeMute : faVolumeUp} />
              </Button>
            </div>

            {/* Bottom Progress */}
            <div className="absolute bottom-4 left-4 right-20">
              <div className="bg-white bg-opacity-30 rounded-full h-1">
                <div
                  className="bg-white rounded-full h-1 transition-all duration-300"
                  style={{
                    width: `${duration ? (currentTime / duration) * 100 : 0}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-white text-xs mt-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Side Panel */}
      <div className="w-16 bg-black bg-opacity-50 flex flex-col items-center justify-end pb-20 space-y-6">
        {/* Profile */}
        <div className="flex flex-col items-center space-y-2">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">
              {video.categoria_nombre?.charAt(0) || "V"}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white hover:bg-opacity-20 w-6 h-6 rounded-full"
          >
            <FontAwesomeIcon icon={faUserPlus} className="text-xs" />
          </Button>
        </div>

        {/* Like */}
        <div className="flex flex-col items-center space-y-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className={`text-white hover:bg-white hover:bg-opacity-20 transition-colors ${
              isLiked ? "text-red-500" : ""
            }`}
          >
            <FontAwesomeIcon
              icon={faHeart}
              className={`text-2xl ${isLiked ? "animate-pulse" : ""}`}
            />
          </Button>
          <span className="text-white text-xs">{formatNumber(likes)}</span>
        </div>

        {/* Comment */}
        <div className="flex flex-col items-center space-y-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleComment}
            className="text-white hover:bg-white hover:bg-opacity-20"
          >
            <FontAwesomeIcon icon={faComment} className="text-2xl" />
          </Button>
          <span className="text-white text-xs">{formatNumber(comments)}</span>
        </div>

        {/* Share */}
        <div className="flex flex-col items-center space-y-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
            className="text-white hover:bg-white hover:bg-opacity-20"
          >
            <FontAwesomeIcon icon={faShare} className="text-2xl" />
          </Button>
          <span className="text-white text-xs">{formatNumber(shares)}</span>
        </div>

        {/* More Options */}
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowOptions(!showOptions)}
            className="text-white hover:bg-white hover:bg-opacity-20"
          >
            <FontAwesomeIcon icon={faEllipsisV} className="text-xl" />
          </Button>

          {/* Options Menu */}
          {showOptions && (
            <div className="absolute right-16 bottom-0 bg-white rounded-lg shadow-lg py-2 w-48">
              <button
                onClick={handleSave}
                className={`w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2 ${
                  isSaved ? "text-blue-600" : "text-gray-700"
                }`}
              >
                <FontAwesomeIcon icon={faBookmark} />
                <span>{isSaved ? "Guardado" : "Guardar video"}</span>
              </button>
              <button
                onClick={() => {
                  console.log("Reportar video");
                  setShowOptions(false);
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 text-gray-700"
              >
                Reportar
              </button>
              <button
                onClick={() => {
                  console.log("No me interesa");
                  setShowOptions(false);
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 text-gray-700"
              >
                No me interesa
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Video Info Overlay */}
      {showControls && (
        <div className="absolute bottom-20 left-4 right-20 text-white">
          <h3 className="font-bold text-lg mb-1">{video.titulo}</h3>
          <p className="text-sm opacity-90 line-clamp-3 mb-2">
            {video.descripcion}
          </p>
          <div className="flex items-center space-x-4 text-xs opacity-75">
            <span>{video.visualizaciones} visualizaciones</span>
            <span>•</span>
            <span>{video.categoria_nombre}</span>
            {video.catalogo_nombre && (
              <>
                <span>•</span>
                <span>{video.catalogo_nombre}</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Navigation hints */}
      <div className="absolute left-1/2 transform -translate-x-1/2 bottom-4 text-white text-xs opacity-50">
        <div className="flex items-center space-x-4">
          <span>↑ Video anterior</span>
          <span>↓ Siguiente video</span>
          <span>Espacio: Pausar/Reproducir</span>
          <span>Esc: Salir</span>
        </div>
      </div>
    </div>
  );
};

export default SocialVideoPlayer;
