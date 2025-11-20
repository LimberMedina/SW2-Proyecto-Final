// PendingVideosReview.jsx
import { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faClock,
  faCheckCircle,
  faTimesCircle,
  faPlay,
  faSearch,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import Button from "../components/Button";
import Input from "../components/Input";
import api from "../services/api";

export default function PendingVideosReview({ onCountersChange }) {
  // ======= Estado =======
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [videos, setVideos] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [nextUrl, setNextUrl] = useState(null);
  const [prevUrl, setPrevUrl] = useState(null);

  // Modal / acciones
  const [viewing, setViewing] = useState(null);
  const [approvingId, setApprovingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [globalMsg, setGlobalMsg] = useState("");
  const [globalErr, setGlobalErr] = useState("");
  const [scanningId, setScanningId] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [scanErr, setScanErr] = useState("");

  const currentPage = useMemo(() => (count ? page : 0), [count, page]);

  // ======= Helpers =======
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const d = new Date(dateString);
    return d.toLocaleString("es-ES", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getAutorName = (item) => {
    const a = item.autor_info || item.autor || null;
    if (!a) return "—";
    const full = `${a.first_name || ""} ${a.last_name || ""}`.trim();
    return full || a.username || "—";
  };

  // ======= Cargar pendientes =======
  const load = async (opts = {}) => {
    setLoading(true);
    setError("");
    setGlobalMsg("");
    setGlobalErr("");
    try {
      const params = new URLSearchParams();
      params.set("estado", "REVISION");
      params.set("ordering", "-fecha_creacion");
      params.set("page", String(opts.page || page || 1));
      const q =
        typeof opts.search === "string"
          ? opts.search.trim()
          : searchTerm.trim();
      if (q) params.set("search", q);

      const { data } = await api.get(
        `/catalogodigital/admin/videos/?${params.toString()}`
      );
      const results = data.results || data || [];
      setVideos(Array.isArray(results) ? results : []);
      setCount(data.count || results.length || 0);
      setNextUrl(data.next || null);
      setPrevUrl(data.previous || null);
      setPage(opts.page || page || 1);
    } catch (e) {
      console.error(e);
      setError("No se pudieron cargar los videos en revisión.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ======= Escaneo inteligente (frontend handler) =======
  const handleScan = async (id) => {
    setScanningId(id);
    setScanErr("");
    setScanResult(null);
    try {
      const { data } = await api.post(
        `/catalogodigital/admin/videos/${id}/scan_content/`
      );
      setScanResult(data);
    } catch (e) {
      console.error(e);
      setScanErr(e?.response?.data?.detail || "Error al escanear el video");
    } finally {
      setScanningId(null);
    }
  };

  // ======= Acciones =======
  const approve = async (id) => {
    setApprovingId(id);
    setGlobalMsg("");
    setGlobalErr("");
    try {
      await api.post(`/catalogodigital/admin/videos/${id}/approve/`);
      setGlobalMsg("Video aprobado y publicado.");
      await load();
      // notificar al padre para refrescar contadores si lo desea
      onCountersChange?.({ approved: 1, pendingDelta: -1 });
    } catch (e) {
      console.error(e);
      const msg =
        e?.response?.data?.detail ||
        e?.response?.data?.error ||
        "No se pudo aprobar el video.";
      setGlobalErr(msg);
    } finally {
      setApprovingId(null);
    }
  };

  const reject = async (id) => {
    setRejectingId(id);
    setGlobalMsg("");
    setGlobalErr("");
    try {
      await api.patch(`/catalogodigital/admin/videos/${id}/`, {
        estado: "ARCHIVADO",
      });
      setGlobalMsg("Video rechazado (archivado).");
      await load();
      onCountersChange?.({ rejected: 1, pendingDelta: -1 });
    } catch (e) {
      console.error(e);
      const msg =
        e?.response?.data?.detail ||
        e?.response?.data?.error ||
        "No se pudo rechazar el video.";
      setGlobalErr(msg);
    } finally {
      setRejectingId(null);
    }
  };

  // ======= Render =======
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FontAwesomeIcon icon={faClock} className="text-yellow-600" />
          Videos en Revisión
        </h2>
        <div className="flex gap-2">
          <div className="relative">
            <Input
              type="search"
              placeholder="Buscar por título o descripción…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-72 pr-9"
            />
            <FontAwesomeIcon
              icon={faSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
          </div>
          <Button
            onClick={() => load({ search: searchTerm, page: 1 })}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Buscar
          </Button>
        </div>
      </div>

      {globalMsg && (
        <div className="rounded-lg border border-green-200 bg-green-50 text-green-700 px-3 py-2 text-sm">
          {globalMsg}
        </div>
      )}
      {globalErr && (
        <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">
          {globalErr}
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-gray-600">
            <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
            Cargando videos…
          </div>
        ) : videos.length === 0 ? (
          <div className="text-gray-600">No hay videos pendientes.</div>
        ) : (
          videos.map((video) => (
            <div
              key={video.id}
              className="bg-white rounded-lg shadow-sm border p-6"
            >
              <div className="flex items-start gap-4">
                <div className="w-40 h-24 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                  <FontAwesomeIcon
                    icon={faPlay}
                    className="text-gray-400 text-xl"
                  />
                </div>

                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {video.titulo}
                  </h3>
                  <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                    {video.descripcion}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm text-gray-600 mt-3">
                    <div>
                      <span className="font-medium">Autor:</span>{" "}
                      {getAutorName(video)}
                    </div>
                    <div>
                      <span className="font-medium">Duración:</span>{" "}
                      {video.duracion_display || "—"}
                    </div>
                    <div>
                      <span className="font-medium">Visualizaciones:</span>{" "}
                      {video.visualizaciones ?? 0}
                    </div>
                    <div>
                      <span className="font-medium">Subido:</span>{" "}
                      {formatDate(video.fecha_creacion)}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-4">
                    <Button onClick={() => setViewing(video)} variant="ghost">
                      <FontAwesomeIcon icon={faEye} className="mr-2" />
                      Ver
                    </Button>
                    <Button
                      onClick={() => handleScan(video.id)}
                      variant="outline"
                      className="border-yellow-500 text-yellow-600 hover:bg-yellow-50"
                      disabled={scanningId === video.id}
                    >
                      {scanningId === video.id ? (
                        <>
                          <FontAwesomeIcon
                            icon={faSpinner}
                            className="animate-spin mr-2"
                          />
                          Escaneando…
                        </>
                      ) : (
                        <>
                          <FontAwesomeIcon icon={faSearch} className="mr-2" />
                          Escanear
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => approve(video.id)}
                      className="bg-green-600 hover:bg-green-700 text-white"
                      disabled={approvingId === video.id}
                    >
                      {approvingId === video.id ? (
                        <>
                          <FontAwesomeIcon
                            icon={faSpinner}
                            className="animate-spin mr-2"
                          />
                          Aprobando…
                        </>
                      ) : (
                        <>
                          <FontAwesomeIcon
                            icon={faCheckCircle}
                            className="mr-2"
                          />
                          Aprobar y Publicar
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => reject(video.id)}
                      variant="outline"
                      className="border-red-500 text-red-600 hover:bg-red-50"
                      disabled={rejectingId === video.id}
                    >
                      {rejectingId === video.id ? (
                        <>
                          <FontAwesomeIcon
                            icon={faSpinner}
                            className="animate-spin mr-2"
                          />
                          Rechazando…
                        </>
                      ) : (
                        <>
                          <FontAwesomeIcon
                            icon={faTimesCircle}
                            className="mr-2"
                          />
                          Rechazar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {count > 0 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-600">
            Página {currentPage} — {count.toLocaleString()} resultado
            {count !== 1 ? "s" : ""}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={!prevUrl}
              onClick={() => {
                if (!prevUrl) return;
                const url = new URL(prevUrl);
                const newPage = url.searchParams.get("page") || 1;
                load({ page: Number(newPage) });
              }}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              disabled={!nextUrl}
              onClick={() => {
                if (!nextUrl) return;
                const url = new URL(nextUrl);
                const newPage = url.searchParams.get("page") || 1;
                load({ page: Number(newPage) });
              }}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      {/* Modal Ver Video */}
      {viewing && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">{viewing.titulo}</h3>
              <button
                className="rounded-md p-1 hover:bg-gray-100"
                onClick={() => setViewing(null)}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>
            <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
              {viewing.url_video ? (
                <video
                  src={viewing.url_video}
                  controls
                  className="w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No hay vista previa
                </div>
              )}
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-700">
              <div>
                <span className="font-medium">Autor:</span>{" "}
                {getAutorName(viewing)}
              </div>
              <div>
                <span className="font-medium">Duración:</span>{" "}
                {viewing.duracion_display || "—"}
              </div>
              <div>
                <span className="font-medium">Creado:</span>{" "}
                {formatDate(viewing.fecha_creacion)}
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button
                onClick={() => approve(viewing.id)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                Aprobar y Publicar
              </Button>
              <Button
                onClick={() => reject(viewing.id)}
                variant="outline"
                className="border-red-500 text-red-600 hover:bg-red-50"
              >
                <FontAwesomeIcon icon={faTimesCircle} className="mr-2" />
                Rechazar
              </Button>
              <div className="flex-1" />
              <Button variant="outline" onClick={() => setViewing(null)}>
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de resultados de escaneo */}
      {scanResult && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl p-6 max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">
                🔍 Resultado del Escaneo Inteligente
              </h3>
              <button
                className="rounded-md p-1 hover:bg-gray-100"
                onClick={() => {
                  setScanResult(null);
                  setScanningId(null);
                  setScanErr("");
                }}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Resumen principal */}
              <div className="p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                <div className="font-semibold text-gray-900 mb-1">Resumen:</div>
                <div className="text-sm text-gray-700">
                  {scanResult.summary}
                </div>
              </div>

              {/* Métricas visuales */}
              {scanResult.visual_metrics && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="font-semibold text-gray-900 mb-2">
                    📊 Análisis Visual ({scanResult.frames_analyzed} frames)
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">
                        Movimiento promedio:
                      </span>
                      <span className="ml-2 font-mono">
                        {scanResult.visual_metrics.avg_motion}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Movimiento máximo:</span>
                      <span className="ml-2 font-mono font-semibold">
                        {scanResult.visual_metrics.max_motion}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Rojo promedio:</span>
                      <span className="ml-2 font-mono">
                        {scanResult.visual_metrics.avg_red_intensity}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Rojo máximo:</span>
                      <span className="ml-2 font-mono font-semibold">
                        {scanResult.visual_metrics.max_red_intensity}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Categorías de detección */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                <div
                  className={`p-4 border-2 rounded-lg ${
                    scanResult.violent.flag
                      ? "bg-red-50 border-red-400"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-gray-900">
                      ⚔️ Violencia
                    </div>
                    <div
                      className={`text-xs px-2 py-1 rounded ${
                        scanResult.violent.flag
                          ? "bg-red-200 text-red-800"
                          : "bg-green-200 text-green-800"
                      }`}
                    >
                      {scanResult.violent.flag ? "DETECTADO" : "OK"}
                    </div>
                  </div>
                  <div className="text-sm mb-1">
                    Score:{" "}
                    <span className="font-bold">
                      {scanResult.violent.score}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600">
                    {scanResult.violent.matches.length > 0
                      ? scanResult.violent.matches.join(", ")
                      : "Sin indicadores"}
                  </div>
                </div>

                <div
                  className={`p-4 border-2 rounded-lg ${
                    scanResult.blood.flag
                      ? "bg-red-50 border-red-400"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-gray-900">
                      🩸 Sangre / Gore
                    </div>
                    <div
                      className={`text-xs px-2 py-1 rounded ${
                        scanResult.blood.flag
                          ? "bg-red-200 text-red-800"
                          : "bg-green-200 text-green-800"
                      }`}
                    >
                      {scanResult.blood.flag ? "DETECTADO" : "OK"}
                    </div>
                  </div>
                  <div className="text-sm mb-1">
                    Score:{" "}
                    <span className="font-bold">{scanResult.blood.score}</span>
                  </div>
                  <div className="text-xs text-gray-600">
                    {scanResult.blood.matches.length > 0
                      ? scanResult.blood.matches.join(", ")
                      : "Sin indicadores"}
                  </div>
                </div>

                <div
                  className={`p-4 border-2 rounded-lg ${
                    scanResult.adult.flag
                      ? "bg-orange-50 border-orange-400"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-gray-900">
                      🔞 Contenido adulto
                    </div>
                    <div
                      className={`text-xs px-2 py-1 rounded ${
                        scanResult.adult.flag
                          ? "bg-orange-200 text-orange-800"
                          : "bg-green-200 text-green-800"
                      }`}
                    >
                      {scanResult.adult.flag ? "DETECTADO" : "OK"}
                    </div>
                  </div>
                  <div className="text-sm mb-1">
                    Score:{" "}
                    <span className="font-bold">{scanResult.adult.score}</span>
                  </div>
                  <div className="text-xs text-gray-600">
                    {scanResult.adult.matches.length > 0
                      ? scanResult.adult.matches.join(", ")
                      : "Sin indicadores"}
                  </div>
                </div>

                <div
                  className={`p-4 border-2 rounded-lg ${
                    scanResult.inappropriate.flag
                      ? "bg-yellow-50 border-yellow-400"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-gray-900">
                      ⚠️ Inapropiado
                    </div>
                    <div
                      className={`text-xs px-2 py-1 rounded ${
                        scanResult.inappropriate.flag
                          ? "bg-yellow-200 text-yellow-800"
                          : "bg-green-200 text-green-800"
                      }`}
                    >
                      {scanResult.inappropriate.flag ? "DETECTADO" : "OK"}
                    </div>
                  </div>
                  <div className="text-sm mb-1">
                    Score:{" "}
                    <span className="font-bold">
                      {scanResult.inappropriate.score}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600">
                    {scanResult.inappropriate.matches.length > 0
                      ? scanResult.inappropriate.matches.join(", ")
                      : "Sin indicadores"}
                  </div>
                </div>
              </div>

              {/* Acciones */}
              <div className="mt-6 flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setScanResult(null);
                    setScanningId(null);
                    setScanErr("");
                  }}
                >
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
