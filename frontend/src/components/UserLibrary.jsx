// src/components/UserLibrary.jsx
import { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faBookmark,
  faHeart,
  faSpinner,
  faPlay,
  faClock,
  faEye,
  faComment,
  faShare,
  faEllipsisV,
  faFilm,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../hooks/useAuth";
import catalogService from "../services/catalogService";
import Button from "./Button";
import CommentsPanel from "../components/CommentsPanel";

const TabBtn = ({ active, icon, label, onClick, count }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-lg border transition-colors flex items-center space-x-2 ${
      active
        ? "bg-blue-600 text-white border-blue-600"
        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
    }`}
  >
    <FontAwesomeIcon icon={icon} />
    <span>{label}</span>
    {typeof count === "number" && (
      <span
        className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
          active ? "bg-white text-blue-700" : "bg-gray-100 text-gray-700"
        }`}
      >
        {count}
      </span>
    )}
  </button>
);

/** Tarjeta tipo social (como en Catalog.jsx) */
const SocialVideoCard = ({
  video,
  index = 0,
  onOpenVideo,
  onOpenComments,
  onSaveStateChange,
}) => {
  // Estados de interacciones (inicializa con lo que trae el backend)
  const [isLiked, setIsLiked] = useState(!!video.usuario_ha_dado_like);
  const [isSaved, setIsSaved] = useState(!!video.usuario_ha_guardado);
  const [isShared, setIsShared] = useState(!!video.usuario_ha_compartido);
  const [likes, setLikes] = useState(video.total_likes ?? 0);
  const [comments, setComments] = useState(video.total_comentarios ?? 0);
  const [saves, setSaves] = useState(video.total_guardados ?? 0);
  const [shares, setShares] = useState(video.total_compartidas ?? 0);

  const [likeLoading, setLikeLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    // Si el padre refresca datos, sincroniza estados locales
    setIsLiked(!!video.usuario_ha_dado_like);
    setIsSaved(!!video.usuario_ha_guardado);
    setIsShared(!!video.usuario_ha_compartido);
    setLikes(video.total_likes ?? 0);
    setComments(video.total_comentarios ?? 0);
    setSaves(video.total_guardados ?? 0);
    setShares(video.total_compartidas ?? 0);
  }, [
    video.usuario_ha_dado_like,
    video.usuario_ha_guardado,
    video.usuario_ha_compartido,
    video.total_likes,
    video.total_comentarios,
    video.total_guardados,
    video.total_compartidas,
  ]);

  const formatNumber = (num) => {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return String(num ?? 0);
  };

  const handleLike = async () => {
    try {
      setLikeLoading(true);
      const result = await catalogService.toggleLike(video.id);
      setIsLiked(result.liked);
      setLikes(result.total_likes);
    } catch (error) {
      console.error("Error toggling like:", error);
      alert(
        error?.message ||
          "No se pudo procesar tu like. Inicia sesión e inténtalo nuevamente."
      );
    } finally {
      setLikeLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaveLoading(true);
      const result = await catalogService.toggleSave(video.id);
      const newSaved = result.saved;
      setIsSaved(newSaved);
      // Ajustar conteo localmente
      setSaves((prev) => (newSaved ? prev + 1 : Math.max(0, prev - 1)));
      // Notificar al padre (para tab "Guardados")
      onSaveStateChange?.(video.id, newSaved);
    } catch (error) {
      console.error("Error toggling save:", error);
      alert(
        error?.message ||
          "No se pudo guardar el video. Inicia sesión e inténtalo nuevamente."
      );
    } finally {
      setSaveLoading(false);
    }
  };

  const handleShare = async () => {
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
      const result = await catalogService.toggleShare(video.id, "LINK");
      setIsShared(!!result.shared);
      setShares(result.total_shares ?? Math.max(0, nextShares));

      const url = `${window.location.origin}/catalog?video=${video.id}`;

      // Solo mostrar modal/compartir si se está activando, no al desactivar
      if (result.shared) {
        if (navigator.share) {
          try {
            await navigator.share({
              title: video.titulo,
              text: video.descripcion,
              url,
            });
          } catch (shareErr) {
            // Usuario canceló o error, pero ya se registró el share
            console.log("Share API cancelled or error:", shareErr);
          }
        } else {
          await navigator.clipboard.writeText(url);
          window.dispatchEvent(
            new CustomEvent("showShareModal", {
              detail: {
                url,
                title: video.titulo,
                description: video.descripcion,
              },
            })
          );
        }
      }
    } catch (error) {
      // Revertir en caso de error
      setIsShared(prevShared);
      setShares(prevShares);
      console.error("Error sharing video:", error);
      if (error?.response?.status === 401) {
        alert("Inicia sesión para compartir videos.");
      } else {
        alert("Error al compartir. Intenta nuevamente.");
      }
    } finally {
      setShareLoading(false);
    }
  };

  const openComments = () => onOpenComments?.(video);

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
      {/* Header: categoría/fecha y menú opciones */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">
              {video.categoria_nombre?.charAt(0) || "V"}
            </span>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">
              {video.categoria_nombre || "Categoría"}
            </h4>
            <p className="text-xs text-gray-500">
              {catalogService.formatDate?.(video.fecha_publicacion) || ""}
            </p>
          </div>
        </div>

        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMenuOpen((v) => !v)}
            className="text-gray-500 hover:text-gray-700"
          >
            <FontAwesomeIcon icon={faEllipsisV} />
          </Button>

          {menuOpen && (
            <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg py-2 w-48 z-10">
              <button
                onClick={() => {
                  handleSave();
                  setMenuOpen(false);
                }}
                className={`w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2 ${
                  isSaved ? "text-blue-600" : "text-gray-700"
                }`}
              >
                <FontAwesomeIcon icon={faBookmark} />
                <span>{isSaved ? "Guardado" : "Guardar video"}</span>
              </button>
              <button
                onClick={() => {
                  // Aquí podrías abrir un modal de reporte
                  setMenuOpen(false);
                  alert("Funcionalidad de reporte pendiente.");
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
            src={video.url_video}
            className="w-full h-full object-cover cursor-pointer"
            poster={video.url_thumbnail}
            onClick={() => onOpenVideo?.(video, index)}
            muted
            loop
          />
        ) : video.url_thumbnail ? (
          <img
            src={video.url_thumbnail}
            alt={video.titulo}
            className="w-full h-full object-cover cursor-pointer"
            onClick={() => onOpenVideo?.(video, index)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <FontAwesomeIcon icon={faFilm} className="text-gray-400 text-6xl" />
          </div>
        )}

        {/* Duración */}
        {video.duracion_display && (
          <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
            <FontAwesomeIcon icon={faClock} className="mr-1" />
            {video.duracion_display}
          </div>
        )}
        {/* Visualizaciones */}
        <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
          <FontAwesomeIcon icon={faEye} className="mr-1" />
          {catalogService.formatViews?.(video.visualizaciones) ??
            video.visualizaciones ??
            0}
        </div>

        {/* Botón Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-300">
          <Button
            className="opacity-70 hover:opacity-100 transition-opacity duration-300 bg-white text-gray-900 hover:bg-gray-100 rounded-full w-16 h-16"
            onClick={() => onOpenVideo?.(video, index)}
          >
            <FontAwesomeIcon icon={faPlay} className="text-2xl ml-1" />
          </Button>
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
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                ) : (
                  <FontAwesomeIcon icon={faHeart} className="text-xl" />
                )}
              </Button>
              <span className="text-sm font-medium">{formatNumber(likes)}</span>
            </div>

            {/* Comentarios */}
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={openComments}
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
                } hover:text-green-500`}
                title={isShared ? "Compartido" : "Compartir"}
              >
                {shareLoading ? (
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                ) : (
                  <FontAwesomeIcon icon={faShare} className="text-xl" />
                )}
              </Button>
              <span className="text-sm font-medium">
                {formatNumber(shares)}
              </span>
            </div>
          </div>

          {/* Guardar (icono de barra, además del del menú) */}
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSave}
              disabled={saveLoading}
              className={`${
                isSaved ? "text-blue-500" : "text-gray-600"
              } hover:text-blue-500`}
              title={isSaved ? "Guardado" : "Guardar"}
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

          {/* Chips */}
          <div className="flex flex-wrap gap-2">
            {video.categoria_nombre && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                {video.categoria_nombre}
              </span>
            )}
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

export default function UserLibrary({ initialCounts }) {
  const { user, isAuthenticated } = useAuth();
  const [active, setActive] = useState("pubs"); // 'pubs' | 'saved' | 'likes'
  const [loading, setLoading] = useState(false);
  const [pubs, setPubs] = useState([]);
  const [saved, setSaved] = useState([]);
  const [likes, setLikes] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");

  // Para panel de comentarios
  const [showComments, setShowComments] = useState(false);
  const [selectedVideoForComments, setSelectedVideoForComments] =
    useState(null);

  // Usar conteos iniciales si están disponibles, sino calcular de los arrays
  const counts = useMemo(
    () => ({
      pubs: initialCounts?.pubs ?? pubs.length,
      saved: initialCounts?.saved ?? saved.length,
      likes: initialCounts?.likes ?? likes.length,
    }),
    [pubs, saved, likes, initialCounts]
  );

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    loadTab(active);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, isAuthenticated, user?.id]);

  const loadTab = async (key) => {
    setLoading(true);
    setErrorMsg("");
    try {
      if (key === "pubs") {
        const list = await catalogService.getMyApprovedVideos(user.id);
        // Asegurar forma consistente
        setPubs(Array.isArray(list) ? list : []);
      } else if (key === "saved") {
        const list = await catalogService.getMySavedVideos();
        // Endpoint de guardados puede devolver { id, fecha_creacion, video_info: {...} }
        const mapped = (list || []).map((g) => g.video_info || g.video || g);
        setSaved(mapped);
      } else if (key === "likes") {
        const list = await catalogService.getMyLikedVideos();
        if (Array.isArray(list)) {
          setLikes(list);
        } else {
          setLikes([]);
          setErrorMsg("No se pudieron cargar tus likes. Intenta nuevamente.");
        }
      }
    } catch (e) {
      console.error("Error cargando pestaña", key, e);
      setErrorMsg("No se pudo cargar esta sección. Intenta nuevamente.");
      if (key === "pubs") setPubs([]);
      if (key === "saved") setSaved([]);
      if (key === "likes") setLikes([]);
    } finally {
      setLoading(false);
    }
  };

  const onOpenVideo = async (video) => {
    try {
      await catalogService.incrementViews(video.id);
    } catch (e) {
      console.warn("No se pudo incrementar visualizaciones:", e?.message);
    }
    // Abrir en nueva pestaña el archivo (o podrías abrir tu reproductor modal)
    if (video?.url_video) window.open(video.url_video, "_blank", "noopener");
  };

  const openCommentsPanel = (video) => {
    setSelectedVideoForComments(video);
    setShowComments(true);
  };

  const closeCommentsPanel = () => {
    setShowComments(false);
    setSelectedVideoForComments(null);
  };

  // Si en el tab Guardados el usuario des-guarda un video, lo removemos del listado inmediatamente
  const handleSaveStateChange = (videoId, isNowSaved) => {
    if (active === "saved" && !isNowSaved) {
      setSaved((arr) => arr.filter((v) => v.id !== videoId));
    }
  };

  const renderList = (items) =>
    items.length ? (
      <div className="space-y-8">
        {items.map((v, idx) => (
          <SocialVideoCard
            key={v.id}
            video={v}
            index={idx}
            onOpenVideo={onOpenVideo}
            onOpenComments={openCommentsPanel}
            onSaveStateChange={handleSaveStateChange}
          />
        ))}
      </div>
    ) : (
      <div className="text-center py-10">
        <div className="inline-flex w-12 h-12 rounded-full bg-gray-100 items-center justify-center mb-3">
          <FontAwesomeIcon icon={faCheckCircle} className="text-gray-400" />
        </div>
        <p className="text-gray-600">No hay videos para mostrar.</p>
      </div>
    );

  return (
    <>
      <section className="bg-white rounded-xl shadow-lg border">
        <div className="px-6 py-4 border-b bg-gray-50 rounded-t-xl">
          <h2 className="text-xl font-semibold text-gray-900">Mi Biblioteca</h2>
          <p className="text-sm text-gray-600">
            Tus publicaciones aprobadas, guardados y likes
          </p>
        </div>

        {/* Tabs */}
        <div className="px-6 py-4 flex flex-wrap gap-2">
          <TabBtn
            active={active === "pubs"}
            icon={faCheckCircle}
            label="Publicaciones"
            onClick={() => setActive("pubs")}
            count={counts.pubs}
          />
          <TabBtn
            active={active === "saved"}
            icon={faBookmark}
            label="Guardados"
            onClick={() => setActive("saved")}
            count={counts.saved}
          />
          <TabBtn
            active={active === "likes"}
            icon={faHeart}
            label="Likes"
            onClick={() => setActive("likes")}
            count={counts.likes}
          />
        </div>

        <div className="px-6 pb-6">
          {loading ? (
            <div className="py-10 text-center text-gray-600">
              <FontAwesomeIcon
                icon={faSpinner}
                className="animate-spin text-2xl mb-2"
              />
              <p>Cargando…</p>
            </div>
          ) : errorMsg ? (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg">
              {errorMsg}
            </div>
          ) : active === "pubs" ? (
            renderList(pubs)
          ) : active === "saved" ? (
            renderList(saved)
          ) : (
            renderList(likes)
          )}
        </div>
      </section>

      {/* Panel de comentarios como en el catálogo */}
      <CommentsPanel
        video={selectedVideoForComments}
        isOpen={showComments}
        onClose={closeCommentsPanel}
      />
    </>
  );
}
