// AdminReports.jsx
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faVideo,
  faListUl,
  faAd,
  faFolder,
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

  const fetchReportes = async () => {
    try {
      const response = await api.get("/catalogodigital/admin/reportes");
      const data = response.data;

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
      // Fallback a datos mock en caso de error
      setReportes({
        videosPorMes: [
          { mes: "Ene", videos: 12 },
          { mes: "Feb", videos: 19 },
          { mes: "Mar", videos: 15 },
          { mes: "Abr", videos: 25 },
          { mes: "May", videos: 22 },
          { mes: "Jun", videos: 30 },
        ],
        reaccionesPorTipo: [
          { name: "Likes", value: 2400, color: "#8884d8" },
          { name: "Comentarios", value: 1398, color: "#82ca9d" },
          { name: "Compartidas", value: 980, color: "#ffc658" },
          { name: "Guardados", value: 390, color: "#ff7c7c" },
        ],
        videosPorCategoria: [
          { categoria: "Matemáticas", videos: 15 },
          { categoria: "Historia", videos: 10 },
          { categoria: "Ciencias", videos: 20 },
          { categoria: "Literatura", videos: 8 },
          { categoria: "Arte", videos: 12 },
        ],
        totalVideos: 120,
        totalUsuarios: 45,
        totalVisualizaciones: 2500,
        totalComentarios: 1398,
        totalLikes: 2400,
        totalCompartidos: 980,
      });
    }
  };

  useEffect(() => {
    fetchReportes();
  }, []);

  return (
    <div className="space-y-8">
      {/* Engagement Overview */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Videos</p>
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
              <FontAwesomeIcon icon={faAd} className="text-green-600" />
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Likes</p>
              <p className="text-2xl font-bold text-gray-900">
                {reportes.totalLikes.toLocaleString()}
              </p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-purple-100 p-3">
              <FontAwesomeIcon icon={faFolder} className="text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
            Videos por Categoría
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
    </div>
  );
}
