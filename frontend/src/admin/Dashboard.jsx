// Dashboard.jsx
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome,
  faVideo,
  faFolder,
  faAd,
  faFlag,
  faDownload,
  faArrowLeft,
  faLayerGroup,
  faListUl,
  faFilm,
} from "@fortawesome/free-solid-svg-icons";
import Button from "../components/Button";
import api from "../services/api";
import AdminManagement from "./AdminManagement";
import PendingVideosReview from "./PendingVideosReview";
import AdminAnuncios from "./AdminAnuncios";
import AdminReports from "./AdminReports";
import SessionExpiryAlert from "../components/SessionExpiryAlert";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("pending-videos");
  const [managementResource, setManagementResource] = useState(null);

  // ======= Stats =======
  const [stats, setStats] = useState({
    totalVideos: 0,
    videosAprobados: 0,
    videosPendientes: 0,
    videosRechazados: 0,
    totalUsuarios: 0,
  });

  const fetchStats = async () => {
    try {
      const response = await api.get(
        "/catalogodigital/admin/videos/estadisticas/"
      );
      setStats({
        totalVideos: response.data.total_videos || 0,
        videosPendientes: response.data.videos_pendientes || 0,
        videosAprobados: response.data.videos_aprobados || 0,
        videosRechazados: response.data.videos_rechazados || 0,
        totalUsuarios: 0,
      });
    } catch (error) {
      console.error("Error al cargar estadísticas:", error);
      // Mantener valores en 0 en caso de error
      setStats({
        totalVideos: 0,
        videosPendientes: 0,
        videosAprobados: 0,
        videosRechazados: 0,
        totalUsuarios: 0,
      });
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // ajustar contadores desde el subcomponente de revisión
  const handleReviewCounters = ({
    approved = 0,
    rejected = 0,
    pendingDelta = 0,
  }) => {
    setStats((s) => ({
      ...s,
      videosPendientes: Math.max(0, (s.videosPendientes || 0) + pendingDelta),
      videosAprobados: (s.videosAprobados || 0) + approved,
      videosRechazados: (s.videosRechazados || 0) + rejected,
    }));
  };

  // ======= UI Components =======

  const StatCard = ({ title, value, icon, ring, accent }) => (
    <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white/80 p-5 shadow-sm transition hover:shadow-lg">
      <div
        className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition bg-gradient-to-br ${accent}`}
      />
      <div className="relative z-10 flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500">{title}</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
            {Number(value || 0).toLocaleString()}
          </p>
        </div>
        <div
          className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${ring} bg-white`}
        >
          <FontAwesomeIcon className="text-gray-700" icon={icon} />
        </div>
      </div>
    </div>
  );

  const OverviewTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Videos"
          value={stats.totalVideos}
          icon={faFilm}
          ring="ring-1 ring-blue-100"
          accent="from-blue-50/60 to-transparent"
        />
        <StatCard
          title="Pendientes"
          value={stats.videosPendientes}
          icon={faListUl}
          ring="ring-1 ring-amber-100"
          accent="from-amber-50/60 to-transparent"
        />
        <StatCard
          title="Aprobados"
          value={stats.videosAprobados}
          icon={faVideo}
          ring="ring-1 ring-emerald-100"
          accent="from-emerald-50/60 to-transparent"
        />
        <StatCard
          title="Rechazados"
          value={stats.videosRechazados}
          icon={faFlag}
          ring="ring-1 ring-rose-100"
          accent="from-rose-50/60 to-transparent"
        />
      </div>
    </div>
  );

  const ManagementCard = ({ title, subtitle, icon, color, onClick }) => (
    <button
      onClick={onClick}
      className="group relative w-full overflow-hidden rounded-2xl border border-gray-100 bg-white text-left transition hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-50" />
      <div
        className="absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-20 blur-2xl transition group-hover:opacity-30"
        style={{ background: color }}
      />
      <div className="relative p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="grid h-12 w-12 place-items-center rounded-xl text-white shadow"
              style={{ background: color }}
            >
              <FontAwesomeIcon icon={icon} />
            </div>
            <div>
              <p className="text-base font-semibold text-gray-900">{title}</p>
              <p className="text-sm text-gray-500">{subtitle}</p>
            </div>
          </div>
          <div className="text-sm text-blue-600 opacity-0 transition group-hover:opacity-100">
            Abrir →
          </div>
        </div>
      </div>
    </button>
  );

  const CatalogsTab = () => (
    <div className="space-y-6">
      {!managementResource ? (
        <>
          {/* grid con catálogo primero */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2 lg:col-span-1">
              <ManagementCard
                title="Catálogos"
                subtitle="Crear / Editar / Eliminar"
                icon={faLayerGroup}
                color="linear-gradient(135deg,#2563eb,#60a5fa)"
                onClick={() => setManagementResource("catalogos")}
              />
            </div>

            <ManagementCard
              title="Categorías"
              subtitle="Organiza tus contenidos"
              icon={faFolder}
              color="linear-gradient(135deg,#7c3aed,#c084fc)"
              onClick={() => setManagementResource("categorias")}
            />

            <ManagementCard
              title="Capítulos"
              subtitle="Secuencias de aprendizaje"
              icon={faListUl}
              color="linear-gradient(135deg,#f59e0b,#fbbf24)"
              onClick={() => setManagementResource("capitulos")}
            />

            <ManagementCard
              title="Videos"
              subtitle="Alta, edición y orden"
              icon={faVideo}
              color="linear-gradient(135deg,#10b981,#34d399)"
              onClick={() => setManagementResource("videos")}
            />
          </div>

          <div className="rounded-xl border border-dashed border-gray-200 bg-white/60 p-5 text-sm text-gray-600">
            Sugerencia: comienza creando un{" "}
            <span className="font-semibold">Catálogo</span>, luego tus{" "}
            <span className="font-semibold">Categorías</span>, después los{" "}
            <span className="font-semibold">Capítulos</span> y, finalmente, sube
            los <span className="font-semibold">Videos</span>.
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setManagementResource(null)}
              >
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
                Volver
              </Button>
              <h3 className="text-lg font-semibold text-gray-900 capitalize">
                Gestión de {managementResource}
              </h3>
            </div>
          </div>

          <AdminManagement
            resource={managementResource}
            onClose={() => setManagementResource(null)}
          />
        </div>
      )}
    </div>
  );

  const tabs = [
    { id: "overview", label: "Resumen", icon: faHome },
    { id: "pending-videos", label: "Revisión", icon: faListUl },
    { id: "catalogs", label: "Gestión", icon: faLayerGroup },
    { id: "announcements", label: "Anuncios", icon: faAd },
    { id: "reports", label: "Reportes", icon: faFlag },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white">
      <SessionExpiryAlert />
      {/* Header / Hero */}
      <div className="relative border-b">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/60 via-indigo-50/50 to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                Panel de Administración
              </h1>
              <p className="text-gray-600">
                Revisa, aprueba y organiza tu catálogo de contenidos.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline">
                <FontAwesomeIcon icon={faDownload} className="mr-2" />
                Exportar
              </Button>
              <div className="grid h-10 w-10 place-items-center rounded-full bg-blue-600 text-white">
                <span className="text-sm font-semibold">A</span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-lg bg-white/70 p-3 shadow-sm ring-1 ring-gray-100">
              <p className="text-[11px] uppercase tracking-wider text-gray-500">
                Pendientes
              </p>
              <p className="text-xl font-semibold text-gray-900">
                {stats.videosPendientes}
              </p>
            </div>
            <div className="rounded-lg bg-white/70 p-3 shadow-sm ring-1 ring-gray-100">
              <p className="text-[11px] uppercase tracking-wider text-gray-500">
                Aprobados
              </p>
              <p className="text-xl font-semibold text-gray-900">
                {stats.videosAprobados}
              </p>
            </div>
            <div className="rounded-lg bg-white/70 p-3 shadow-sm ring-1 ring-gray-100">
              <p className="text-[11px] uppercase tracking-wider text-gray-500">
                Rechazados
              </p>
              <p className="text-xl font-semibold text-gray-900">
                {stats.videosRechazados}
              </p>
            </div>
            <div className="rounded-lg bg-white/70 p-3 shadow-sm ring-1 ring-gray-100">
              <p className="text-[11px] uppercase tracking-wider text-gray-500">
                Total Videos
              </p>
              <p className="text-xl font-semibold text-gray-900">
                {stats.totalVideos}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setManagementResource(null);
                }}
                className={[
                  "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition",
                  active
                    ? "bg-blue-600 text-white shadow"
                    : "bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50",
                ].join(" ")}
              >
                <FontAwesomeIcon icon={tab.icon} />
                <span>{tab.label}</span>
                {tab.id === "pending-videos" && (
                  <span
                    className={[
                      "ml-1 inline-flex min-w-[1.5rem] justify-center rounded-full px-2 py-0.5 text-xs",
                      active
                        ? "bg-white/20 text-white"
                        : "bg-amber-100 text-amber-800",
                    ].join(" ")}
                  >
                    {stats.videosPendientes}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Contenido */}
        <div className="space-y-8">
          {activeTab === "overview" && <OverviewTab />}

          {activeTab === "pending-videos" && (
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Videos en revisión
                </h2>
                <p className="text-sm text-gray-500">
                  Revisa, aprueba o rechaza los envíos de usuarios.
                </p>
              </div>
              <PendingVideosReview onCountersChange={handleReviewCounters} />
            </div>
          )}

          {activeTab === "catalogs" && <CatalogsTab />}

          {activeTab === "announcements" && <AdminAnuncios />}

          {activeTab === "reports" && <AdminReports />}
        </div>
      </div>
    </div>
  );
}
