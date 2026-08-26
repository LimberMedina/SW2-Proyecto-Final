import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGraduationCap,
  faVideo,
  faMicrophone,
  faBook,
  faSearch,
  faMobile,
  faBullseye,
  faPlay,
  faEye,
  faCalendar,
} from "@fortawesome/free-solid-svg-icons";

export default function Home() {
  const [stats, setStats] = useState({
    totalVideos: 1250,
    videosDigitales: 850,
    videosFisicos: 400,
    usuariosActivos: 320,
  });

  const [featuredCategories] = useState([
    {
      id: 1,
      name: "Documentales Académicos",
      count: 245,
      icon: faGraduationCap,
      description: "Contenido educativo y científico",
    },
    {
      id: 2,
      name: "Producciones Universitarias",
      count: 180,
      icon: faVideo,
      description: "Creaciones de estudiantes y docentes",
    },
    {
      id: 3,
      name: "Conferencias y Seminarios",
      count: 320,
      icon: faMicrophone,
      description: "Eventos académicos registrados",
    },
    {
      id: 4,
      name: "Material Histórico",
      count: 95,
      icon: faBook,
      description: "Archivo histórico universitario",
    },
  ]);
  const [recentVideos] = useState([
    {
      id: 1,
      title: "Conferencia: Inteligencia Artificial en la Educación",
      thumbnail: faGraduationCap,
      duration: "1:45:30",
      views: 234,
      date: "2024-10-01",
    },
    {
      id: 2,
      title: "Tesis: Sostenibilidad Ambiental en Bolivia",
      thumbnail: faBook,
      duration: "45:20",
      views: 156,
      date: "2024-09-28",
    },
    {
      id: 3,
      title: "Seminario: Innovación Tecnológica",
      thumbnail: faMicrophone,
      duration: "2:10:15",
      views: 189,
      date: "2024-09-25",
    },
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-blue-50">
      {/* Header Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-red-600 via-blue-600 to-red-700">
        <div className="absolute inset-0 bg-black/20"></div>
        {/* Patrón decorativo */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full"></div>
          <div className="absolute bottom-20 right-20 w-24 h-24 bg-white rounded-full"></div>
          <div className="absolute top-1/2 left-1/3 w-16 h-16 bg-white rounded-full"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Logo grande del Canal 11 */}
            <div className="flex justify-center mb-8">
              <div className="bg-white rounded-2xl shadow-2xl border-4 border-red-500 px-8 py-6">
                <div className="flex items-center space-x-2">
                  <span className="font-black text-red-600 text-5xl">TV</span>
                  <span className="font-black text-blue-600 text-6xl">11</span>
                </div>
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              VIDEOTECA TVU
              <span className="block text-2xl md:text-4xl font-bold mt-3 text-yellow-300">
                Hernando Sanabria Fernandez
              </span>
            </h1>
            <p className="text-xl md:text-2xl font-semibold text-white mb-4">
              EL PRIMER CANAL DE SANTA CRUZ
            </p>
            <p className="text-lg text-blue-100 mb-8 max-w-3xl mx-auto">
              Descubre contenido educativo, cultural y de entretenimiento
              producido por la Universidad Autónoma Gabriel René Moreno
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/catalog"
                className="bg-white text-red-600 px-8 py-3 rounded-lg font-bold hover:bg-red-50 transition-colors duration-200 shadow-lg flex items-center gap-2 border-2 border-red-500"
              >
                <FontAwesomeIcon icon={faVideo} />
                Explorar Contenido
              </Link>
              <Link
                to="/register"
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors duration-200 shadow-lg border-2 border-blue-700"
              >
                Registrarse
              </Link>
              <Link
                to="/login"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-bold hover:bg-white hover:text-red-600 transition-colors duration-200"
              >
                Iniciar Sesión
              </Link>
            </div>
          </div>
        </div>

        {/* Animated background elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full flex items-center justify-center animate-pulse">
          <FontAwesomeIcon icon={faPlay} className="text-white/30 text-2xl" />
        </div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-white/10 rounded-full flex items-center justify-center animate-bounce">
          <FontAwesomeIcon icon={faVideo} className="text-white/30 text-xl" />
        </div>
        <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center animate-pulse">
          <FontAwesomeIcon icon={faBook} className="text-white/30 text-lg" />
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 text-center shadow-lg hover:shadow-xl transition-shadow duration-300 border-t-4 border-red-500">
            <div className="text-3xl font-bold text-red-600 mb-2">
              {stats.totalVideos.toLocaleString()}
            </div>
            <div className="text-gray-600 font-medium">Videos Totales</div>
          </div>
          <div className="bg-white rounded-xl p-6 text-center shadow-lg hover:shadow-xl transition-shadow duration-300 border-t-4 border-blue-500">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {stats.videosDigitales.toLocaleString()}
            </div>
            <div className="text-gray-600 font-medium">Contenido Digital</div>
          </div>
          <div className="bg-white rounded-xl p-6 text-center shadow-lg hover:shadow-xl transition-shadow duration-300 border-t-4 border-green-500">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {stats.videosFisicos.toLocaleString()}
            </div>
            <div className="text-gray-600 font-medium">Archivo Físico</div>
          </div>
          <div className="bg-white rounded-xl p-6 text-center shadow-lg hover:shadow-xl transition-shadow duration-300 border-t-4 border-orange-500">
            <div className="text-3xl font-bold text-orange-600 mb-2">
              {stats.usuariosActivos.toLocaleString()}
            </div>
            <div className="text-gray-600 font-medium">Usuarios Activos</div>
          </div>
        </div>
      </div>

      {/* Featured Categories */}
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Programación Destacada
          </h2>
          <p className="text-lg text-gray-600">
            Descubre el mejor contenido del Canal 11
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredCategories.map((category, index) => {
            const colors = [
              {
                icon: "text-red-600",
                hover: "group-hover:text-red-700",
                border: "border-red-500",
              },
              {
                icon: "text-blue-600",
                hover: "group-hover:text-blue-700",
                border: "border-blue-500",
              },
              {
                icon: "text-green-600",
                hover: "group-hover:text-green-700",
                border: "border-green-500",
              },
              {
                icon: "text-orange-600",
                hover: "group-hover:text-orange-700",
                border: "border-orange-500",
              },
            ];
            const color = colors[index % colors.length];

            return (
              <div
                key={category.id}
                className={`bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group border-t-4 ${color.border}`}
              >
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  <FontAwesomeIcon
                    icon={category.icon}
                    className={`${color.icon} ${color.hover} transition-colors duration-300`}
                  />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {category.name}
                </h3>
                <p className="text-gray-600 text-sm mb-3">
                  {category.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className={`font-semibold ${color.icon}`}>
                    {category.count} videos
                  </span>
                  <span
                    className={`text-gray-400 ${color.hover} transition-colors duration-300`}
                  >
                    →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Videos */}
      <div className="bg-gradient-to-br from-red-50 to-blue-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Últimos Programas
            </h2>
            <p className="text-lg text-gray-600">Lo más reciente en Canal 11</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentVideos.map((video) => (
              <div
                key={video.id}
                className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
              >
                <div className="h-48 bg-gradient-to-br from-red-100 to-blue-100 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10">
                    <div
                      className="absolute top-0 left-0 w-full h-full"
                      style={{
                        backgroundImage:
                          "linear-gradient(45deg, #ef4444 25%, transparent 25%), linear-gradient(-45deg, #3b82f6 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ef4444 75%), linear-gradient(-45deg, transparent 75%, #3b82f6 75%)",
                        backgroundSize: "20px 20px",
                        backgroundPosition:
                          "0 0, 0 10px, 10px -10px, -10px 0px",
                      }}
                    ></div>
                  </div>
                  <FontAwesomeIcon
                    icon={video.thumbnail}
                    className="text-6xl text-red-600 relative z-10"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {video.title}
                    {video.title}
                  </h3>
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                      <FontAwesomeIcon icon={faPlay} className="text-xs" />
                      {video.duration}
                    </span>
                    <span className="flex items-center gap-1">
                      <FontAwesomeIcon icon={faEye} className="text-xs" />
                      {video.views} visualizaciones
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <FontAwesomeIcon icon={faCalendar} className="text-xs" />
                      {video.date}
                    </span>
                    <button className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                      <FontAwesomeIcon icon={faPlay} className="text-xs" />
                      Ver ahora
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            ¿Por qué elegir nuestra videoteca?
          </h2>
          <p className="text-lg text-gray-600">
            Características que nos hacen únicos
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center group">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors duration-300">
              <FontAwesomeIcon
                icon={faSearch}
                className="text-2xl text-blue-600"
              />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Búsqueda Avanzada
            </h3>
            <p className="text-gray-600">
              Encuentra exactamente lo que necesitas con nuestros filtros
              inteligentes
            </p>
          </div>

          <div className="text-center group">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 transition-colors duration-300">
              <FontAwesomeIcon
                icon={faMobile}
                className="text-2xl text-purple-600"
              />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Acceso Multiplataforma
            </h3>
            <p className="text-gray-600">
              Disfruta del contenido desde cualquier dispositivo, en cualquier
              momento
            </p>
          </div>

          <div className="text-center group">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors duration-300">
              <FontAwesomeIcon
                icon={faBullseye}
                className="text-2xl text-green-600"
              />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Contenido Curado
            </h3>
            <p className="text-gray-600">
              Material académico seleccionado por expertos para garantizar
              calidad
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            ¿Listo para comenzar tu experiencia académica?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Únete a nuestra comunidad universitaria y accede a contenido
            exclusivo
          </p>
          <Link
            to="/register"
            className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors duration-200 shadow-lg inline-block"
          >
            Registrarse Gratis
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Videoteca UAGRM</h3>
              <p className="text-gray-400">
                Tu portal de acceso al conocimiento universitario digitalizado
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Enlaces Rápidos</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link
                    to="/catalog"
                    className="hover:text-white transition-colors"
                  >
                    Catálogo
                  </Link>
                </li>
                <li>
                  <Link
                    to="/categories"
                    className="hover:text-white transition-colors"
                  >
                    Categorías
                  </Link>
                </li>
                <li>
                  <Link
                    to="/about"
                    className="hover:text-white transition-colors"
                  >
                    Acerca de
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Soporte</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link
                    to="/help"
                    className="hover:text-white transition-colors"
                  >
                    Centro de Ayuda
                  </Link>
                </li>
                <li>
                  <Link
                    to="/contact"
                    className="hover:text-white transition-colors"
                  >
                    Contacto
                  </Link>
                </li>
                <li>
                  <Link
                    to="/faq"
                    className="hover:text-white transition-colors"
                  >
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Universidad</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    UAGRM Oficial
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Canal TV
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Radio Universidad
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>
              &copy; 2024 Universidad Autónoma Gabriel René Moreno. Todos los
              derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
