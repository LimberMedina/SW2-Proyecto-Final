// Mock data para desarrollo - reemplazar con llamadas reales a la API

export const videoService = {
  // Datos de ejemplo
  mockVideos: [
    {
      id: 1,
      titulo: "Historia de la Universidad Autónoma Gabriel René Moreno",
      descripcion:
        "Documental completo sobre los orígenes y evolución de nuestra casa de estudios superiores.",
      categoria: "Documentales",
      categoria_id: 1,
      duracion: "45:30",
      fecha_creacion: "2024-01-15",
      visualizaciones: 1250,
      thumbnail: "/thumbnails/historia-uagrm.jpg",
      tipo: "digital",
    },
    {
      id: 2,
      titulo: "Conferencia: Innovación Tecnológica en la Educación",
      descripcion:
        "Ponencia magistral sobre el futuro de la educación superior y el rol de la tecnología.",
      categoria: "Conferencias",
      categoria_id: 2,
      duracion: "1:20:15",
      fecha_creacion: "2024-02-10",
      visualizaciones: 890,
      thumbnail: "/thumbnails/innovacion-tech.jpg",
      tipo: "digital",
    },
    {
      id: 3,
      titulo: "Tutorial: Introducción a la Programación en Python",
      descripcion:
        "Serie educativa para estudiantes que comienzan en el mundo de la programación.",
      categoria: "Tutoriales",
      categoria_id: 3,
      duracion: "2:15:45",
      fecha_creacion: "2024-01-28",
      visualizaciones: 2100,
      thumbnail: "/thumbnails/python-tutorial.jpg",
      tipo: "digital",
    },
    {
      id: 4,
      titulo: "Ceremonia de Graduación 2023",
      descripcion:
        "Registro completo de la ceremonia de graduación de la gestión 2023.",
      categoria: "Ceremonias",
      categoria_id: 5,
      duracion: "3:45:20",
      fecha_creacion: "2023-12-15",
      visualizaciones: 3200,
      thumbnail: "/thumbnails/graduacion-2023.jpg",
      tipo: "digital",
    },
    {
      id: 5,
      titulo: "Investigación: Biodiversidad en el Chaco Boliviano",
      descripcion:
        "Estudio científico sobre la flora y fauna del ecosistema chaqueño.",
      categoria: "Documentales",
      categoria_id: 1,
      duracion: "55:12",
      fecha_creacion: "2024-03-05",
      visualizaciones: 650,
      thumbnail: "/thumbnails/biodiversidad-chaco.jpg",
      tipo: "digital",
    },
    {
      id: 6,
      titulo: "Mesa Redonda: Sostenibilidad Ambiental",
      descripcion:
        "Debate entre expertos sobre políticas ambientales y desarrollo sostenible.",
      categoria: "Eventos",
      categoria_id: 4,
      duracion: "1:35:40",
      fecha_creacion: "2024-02-22",
      visualizaciones: 420,
      thumbnail: "/thumbnails/sostenibilidad.jpg",
      tipo: "digital",
    },
    {
      id: 7,
      titulo: "Curso: Fundamentos de Ingeniería Civil",
      descripcion:
        "Material didáctico complementario para estudiantes de ingeniería civil.",
      categoria: "Tutoriales",
      categoria_id: 3,
      duracion: "4:20:30",
      fecha_creacion: "2024-01-08",
      visualizaciones: 1800,
      thumbnail: "/thumbnails/ingenieria-civil.jpg",
      tipo: "digital",
    },
    {
      id: 8,
      titulo: "Entrevista: Egresados Destacados",
      descripcion:
        "Conversación con ex-alumnos que han destacado en sus áreas profesionales.",
      categoria: "Entrevistas",
      categoria_id: 6,
      duracion: "42:18",
      fecha_creacion: "2024-03-12",
      visualizaciones: 950,
      thumbnail: "/thumbnails/egresados.jpg",
      tipo: "digital",
    },
    {
      id: 9,
      titulo: "Seminario: Emprendimiento Universitario",
      descripcion:
        "Taller práctico sobre cómo desarrollar ideas de negocio desde la universidad.",
      categoria: "Conferencias",
      categoria_id: 2,
      duracion: "2:10:25",
      fecha_creacion: "2024-02-28",
      visualizaciones: 1350,
      thumbnail: "/thumbnails/emprendimiento.jpg",
      tipo: "digital",
    },
    {
      id: 10,
      titulo: "Archivo Histórico: UAGRM en los 80s",
      descripcion:
        "Material de archivo que muestra la vida universitaria en la década de los 80.",
      categoria: "Material Histórico",
      categoria_id: 4,
      duracion: "28:45",
      fecha_creacion: "2024-01-20",
      visualizaciones: 780,
      thumbnail: "/thumbnails/archivo-80s.jpg",
      tipo: "fisico",
    },
    {
      id: 11,
      titulo: "Laboratorio Virtual: Química Orgánica",
      descripcion:
        "Experimentos de química orgánica explicados paso a paso para estudiantes.",
      categoria: "Tutoriales",
      categoria_id: 3,
      duracion: "1:45:30",
      fecha_creacion: "2024-03-01",
      visualizaciones: 1150,
      thumbnail: "/thumbnails/quimica-organica.jpg",
      tipo: "digital",
    },
    {
      id: 12,
      titulo: "Concierto: Coro Universitario",
      descripcion:
        "Presentación del coro universitario en el festival cultural anual.",
      categoria: "Eventos",
      categoria_id: 4,
      duracion: "1:15:20",
      fecha_creacion: "2024-02-14",
      visualizaciones: 2500,
      thumbnail: "/thumbnails/coro-universitario.jpg",
      tipo: "digital",
    },
  ],

  mockCategories: [
    {
      id: 1,
      nombre: "Documentales",
      descripcion: "Contenido educativo y científico",
      count: 3,
    },
    {
      id: 2,
      nombre: "Conferencias",
      descripcion: "Charlas y ponencias académicas",
      count: 2,
    },
    {
      id: 3,
      nombre: "Tutoriales",
      descripcion: "Material didáctico y educativo",
      count: 3,
    },
    {
      id: 4,
      nombre: "Eventos",
      descripcion: "Ceremonias y actividades universitarias",
      count: 2,
    },
    {
      id: 5,
      nombre: "Ceremonias",
      descripcion: "Graduaciones y actos oficiales",
      count: 1,
    },
    {
      id: 6,
      nombre: "Entrevistas",
      descripcion: "Conversaciones con personalidades",
      count: 1,
    },
  ],

  // Simulación de API calls
  async getVideos(params = {}) {
    const {
      page = 1,
      limit = 12,
      search = "",
      category = "",
      sortBy = "fecha_creacion",
      sortOrder = "desc",
    } = params;

    // Simular latencia de red
    await new Promise((resolve) => setTimeout(resolve, 800));

    let filteredVideos = [...this.mockVideos];

    // Filtrar por búsqueda
    if (search) {
      filteredVideos = filteredVideos.filter(
        (video) =>
          video.titulo.toLowerCase().includes(search.toLowerCase()) ||
          video.descripcion.toLowerCase().includes(search.toLowerCase()) ||
          video.categoria.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Filtrar por categoría
    if (category) {
      filteredVideos = filteredVideos.filter(
        (video) => video.categoria_id.toString() === category.toString()
      );
    }

    // Ordenar
    filteredVideos.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case "titulo":
          aValue = a.titulo.toLowerCase();
          bValue = b.titulo.toLowerCase();
          break;
        case "fecha_creacion":
          aValue = new Date(a.fecha_creacion);
          bValue = new Date(b.fecha_creacion);
          break;
        case "visualizaciones":
          aValue = a.visualizaciones;
          bValue = b.visualizaciones;
          break;
        default:
          aValue = a.fecha_creacion;
          bValue = b.fecha_creacion;
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // Paginar
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedVideos = filteredVideos.slice(startIndex, endIndex);

    return {
      videos: paginatedVideos,
      total: filteredVideos.length,
      totalPages: Math.ceil(filteredVideos.length / limit),
      currentPage: page,
      hasNext: endIndex < filteredVideos.length,
      hasPrev: page > 1,
    };
  },

  async getCategories() {
    // Simular latencia de red
    await new Promise((resolve) => setTimeout(resolve, 300));
    return this.mockCategories;
  },

  async getVideoById(id) {
    // Simular latencia de red
    await new Promise((resolve) => setTimeout(resolve, 500));
    return this.mockVideos.find((video) => video.id === parseInt(id));
  },

  // Formatear duración para mostrar
  formatDuration(duration) {
    if (!duration) return "00:00";

    const parts = duration.split(":");
    if (parts.length === 3) {
      const hours = parseInt(parts[0]);
      const minutes = parseInt(parts[1]);
      const seconds = parseInt(parts[2]);

      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      } else {
        return `${minutes}:${seconds.toString().padStart(2, "0")}`;
      }
    }
    return duration;
  },

  // Formatear fecha
  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  },
};
