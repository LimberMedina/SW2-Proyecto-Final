// AdminReports.jsx
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faVideo,
  faListUl,
  faEye,
  faHeart,
  faFilter,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import api from "../services/api";

export default function AdminReports() {
  const [reportes, setReportes] = useState({
    datosPorPeriodo: [],
    videosPorMes: [],
    reaccionesPorTipo: [],
    videosPorCategoria: [],
    totalVideos: 0,
    totalUsuarios: 0,
    totalVisualizaciones: 0,
    totalComentarios: 0,
    totalLikes: 0,
    totalCompartidos: 0,
  });

  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    metrica: "vistas",
    periodo: "mes",
    fechaInicio: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    fechaFin: new Date().toISOString().split("T")[0],
  });

  const metricaOptions = [
    {
      value: "vistas",
      label: "Visualizaciones",
      icon: faEye,
      color: "#8884d8",
    },
    { value: "likes", label: "Likes", icon: faHeart, color: "#82ca9d" },
    {
      value: "comentarios",
      label: "Comentarios",
      icon: faListUl,
      color: "#ffc658",
    },
    {
      value: "compartidos",
      label: "Compartidos",
      icon: faVideo,
      color: "#ff7c7c",
    },
  ];

  const periodoOptions = [
    { value: "dia", label: "Día" },
    { value: "mes", label: "Mes" },
    { value: "trimestre", label: "Trimestre" },
    { value: "año", label: "Año" },
  ];

  const fetchReportes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        metrica: filters.metrica,
        periodo: filters.periodo,
        fecha_inicio: filters.fechaInicio,
        fecha_fin: filters.fechaFin,
      });

      const response = await api.get(
        `/catalogodigital/admin/reportes/?${params}`
      );
      const data = response.data;

      // Formatear datos por periodo
      const datosPorPeriodo = (data.datos_por_periodo || []).map((item) => ({
        fecha: new Date(item.periodo_fecha).toLocaleDateString("es-ES", {
          day: filters.periodo === "dia" ? "numeric" : undefined,
          month: "short",
          year: filters.periodo === "año" ? "numeric" : "numeric",
        }),
        cantidad: item.cantidad,
      }));

      // Mapear videos por mes
      const videosPorMes = (data.videos_por_mes || []).map((item) => ({
        mes: new Date(item.mes).toLocaleDateString("es-ES", {
          month: "short",
          year: "numeric",
        }),
        videos: item.cantidad,
      }));

      // Mapear reacciones por tipo
      const reaccionesPorTipo = (data.reacciones_por_tipo || []).map(
        (item) => ({
          name: item.tipo.charAt(0).toUpperCase() + item.tipo.slice(1),
          value: item.cantidad,
          color:
            item.tipo === "likes"
              ? "#8884d8"
              : item.tipo === "comentarios"
              ? "#82ca9d"
              : item.tipo === "compartidos"
              ? "#ffc658"
              : "#ff7c7c",
        })
      );

      // Mapear videos por categoria
      const videosPorCategoria = (data.videos_por_categoria || []).map(
        (item) => ({
          categoria: item.nombre,
          videos: item.cantidad_videos,
        })
      );

      setReportes({
        datosPorPeriodo,
        videosPorMes,
        reaccionesPorTipo,
        videosPorCategoria,
        totalVideos: data.total_videos || 0,
        totalUsuarios: data.total_usuarios || 0,
        totalVisualizaciones: data.total_visualizaciones || 0,
        totalComentarios: data.total_comentarios || 0,
        totalLikes: data.total_likes || 0,
        totalCompartidos: data.total_compartidos || 0,
      });
    } catch (error) {
      console.error("Error al cargar reportes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportes();
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const getMetricaActual = () => {
    return metricaOptions.find((m) => m.value === filters.metrica);
  };

  return (
    <div className="space-y-8">
      {/* Filtros */}
      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
        <div className="flex items-center mb-4">
          <FontAwesomeIcon icon={faFilter} className="text-blue-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">
            Filtros de Reporte
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Métrica */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Métrica
            </label>
            <select
              value={filters.metrica}
              onChange={(e) => handleFilterChange("metrica", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {metricaOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Periodo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Periodo
            </label>
            <select
              value={filters.periodo}
              onChange={(e) => handleFilterChange("periodo", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {periodoOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Fecha Inicio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha Inicio
            </label>
            <input
              type="date"
              value={filters.fechaInicio}
              onChange={(e) =>
                handleFilterChange("fechaInicio", e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Fecha Fin */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha Fin
            </label>
            <input
              type="date"
              value={filters.fechaFin}
              onChange={(e) => handleFilterChange("fechaFin", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center items-center py-12">
          <FontAwesomeIcon
            icon={faSpinner}
            spin
            className="text-4xl text-blue-600"
          />
        </div>
      )}

      {!loading && (
        <>
          {/* Engagement Overview */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Videos
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {reportes.totalVideos.toLocaleString()}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-red-100 p-3">
                  <FontAwesomeIcon icon={faVideo} className="text-red-600" />
                </div>
              </div>
            </div>
            <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Usuarios
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {reportes.totalUsuarios.toLocaleString()}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-blue-100 p-3">
                  <FontAwesomeIcon icon={faListUl} className="text-blue-600" />
                </div>
              </div>
            </div>
            <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Visualizaciones
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {reportes.totalVisualizaciones.toLocaleString()}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-green-100 p-3">
                  <FontAwesomeIcon icon={faEye} className="text-green-600" />
                </div>
              </div>
            </div>
            <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Likes
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {reportes.totalLikes.toLocaleString()}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-purple-100 p-3">
                  <FontAwesomeIcon icon={faHeart} className="text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Datos por Periodo - Gráfico Principal Dinámico */}
            <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100 lg:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {getMetricaActual()?.label} por{" "}
                {periodoOptions.find((p) => p.value === filters.periodo)?.label}
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={reportes.datosPorPeriodo}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fecha" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="cantidad"
                    name={getMetricaActual()?.label}
                    stroke={getMetricaActual()?.color || "#8884d8"}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Videos por Mes */}
            <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Videos Subidos por Mes
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={reportes.videosPorMes}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="videos"
                    stroke="#8884d8"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Reacciones por Tipo */}
            <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Distribución de Reacciones
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={reportes.reaccionesPorTipo}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {reportes.reaccionesPorTipo.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Videos por Categoría */}
            <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100 lg:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Videos por Categoría (Top 10)
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reportes.videosPorCategoria}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="categoria" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="videos" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
