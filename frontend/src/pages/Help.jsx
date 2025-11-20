import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faQuestionCircle,
  faSearch,
  faChevronDown,
  faChevronUp,
  faEnvelope,
  faPhone,
  faMapMarkerAlt,
  faClock,
  faBook,
  faVideo,
  faCog,
  faShieldAlt,
} from "@fortawesome/free-solid-svg-icons";
import Header from "../components/Header";
import Input from "../components/Input";
import Button from "../components/Button";

export default function Help() {
  const [searchTerm, setSearchTerm] = useState("");
  const [openFaq, setOpenFaq] = useState(null);

  const faqCategories = [
    {
      id: "general",
      title: "General",
      icon: faQuestionCircle,
      questions: [
        {
          q: "¿Qué es la Videoteca UAGRM?",
          a: "La Videoteca UAGRM es la plataforma digital oficial del Canal Universitario de la Universidad Autónoma Gabriel René Moreno, donde puedes acceder a contenido educativo, conferencias, documentales y material académico.",
        },
        {
          q: "¿Necesito crear una cuenta para ver videos?",
          a: "Puedes ver el catálogo público sin crear una cuenta, pero necesitas registrarte para acceder a funciones como listas de reproducción, comentarios y seguimiento de progreso.",
        },
        {
          q: "¿Es gratuito el acceso a la videoteca?",
          a: "Sí, el acceso a la videoteca es completamente gratuito para toda la comunidad universitaria y el público en general.",
        },
      ],
    },
    {
      id: "videos",
      title: "Videos y Reproducción",
      icon: faVideo,
      questions: [
        {
          q: "¿En qué formatos están disponibles los videos?",
          a: "Los videos están disponibles en formato MP4 con diferentes calidades (360p, 720p, 1080p) para adaptarse a tu conexión de internet.",
        },
        {
          q: "¿Puedo descargar videos para ver offline?",
          a: "Por políticas de derechos de autor, los videos solo están disponibles para streaming online. No se permite la descarga.",
        },
        {
          q: "¿Los videos tienen subtítulos?",
          a: "Muchos videos incluyen subtítulos en español. Puedes activarlos desde el reproductor de video.",
        },
      ],
    },
    {
      id: "account",
      title: "Cuenta y Perfil",
      icon: faCog,
      questions: [
        {
          q: "¿Cómo puedo cambiar mi contraseña?",
          a: "Ve a Configuración > Seguridad y selecciona 'Cambiar contraseña'. Necesitarás tu contraseña actual para confirmar el cambio.",
        },
        {
          q: "¿Puedo cambiar mi nombre de usuario?",
          a: "Sí, puedes cambiar tu nombre de usuario desde tu perfil. Ten en cuenta que el nuevo nombre debe estar disponible.",
        },
        {
          q: "¿Cómo elimino mi cuenta?",
          a: "Puedes eliminar tu cuenta desde Configuración > Datos y privacidad. Esta acción es irreversible.",
        },
      ],
    },
    {
      id: "technical",
      title: "Problemas Técnicos",
      icon: faShieldAlt,
      questions: [
        {
          q: "Los videos no se reproducen correctamente",
          a: "Verifica tu conexión a internet, actualiza tu navegador, o prueba con otro navegador. Si persiste el problema, contacta soporte técnico.",
        },
        {
          q: "La página se carga lentamente",
          a: "Esto puede deberse a una conexión lenta. Intenta refrescar la página o acceder en un horario con menos tráfico.",
        },
        {
          q: "¿Qué navegadores son compatibles?",
          a: "La videoteca es compatible con Chrome, Firefox, Safari y Edge en sus versiones más recientes.",
        },
      ],
    },
  ];

  const contactInfo = {
    email: "videoteca@uagrm.edu.bo",
    phone: "+591 3 336-4000",
    address: "Av. Busch Final, Santa Cruz de la Sierra, Bolivia",
    hours: "Lunes a Viernes: 8:00 - 18:00",
  };

  const toggleFaq = (categoryId, questionIndex) => {
    const faqId = `${categoryId}-${questionIndex}`;
    setOpenFaq(openFaq === faqId ? null : faqId);
  };

  const filteredCategories = faqCategories
    .map((category) => ({
      ...category,
      questions: category.questions.filter(
        (q) =>
          q.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
          q.a.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    }))
    .filter((category) => category.questions.length > 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Header />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <FontAwesomeIcon
              icon={faQuestionCircle}
              className="text-white text-2xl"
            />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Centro de Ayuda
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Encuentra respuestas a las preguntas más frecuentes sobre la
            videoteca
          </p>
        </div>

        {/* Buscador */}
        <div className="max-w-2xl mx-auto mb-12">
          <Input
            type="search"
            placeholder="Buscar en preguntas frecuentes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<FontAwesomeIcon icon={faSearch} />}
            className="text-lg py-3"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* FAQ */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Preguntas Frecuentes
            </h2>

            <div className="space-y-6">
              {filteredCategories.map((category) => (
                <div
                  key={category.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200"
                >
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center">
                      <FontAwesomeIcon
                        icon={category.icon}
                        className="text-blue-600 mr-3"
                      />
                      <h3 className="text-lg font-semibold text-gray-900">
                        {category.title}
                      </h3>
                    </div>
                  </div>

                  <div className="divide-y divide-gray-200">
                    {category.questions.map((question, index) => {
                      const faqId = `${category.id}-${index}`;
                      const isOpen = openFaq === faqId;

                      return (
                        <div key={index}>
                          <button
                            onClick={() => toggleFaq(category.id, index)}
                            className="w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-gray-900">
                                {question.q}
                              </span>
                              <FontAwesomeIcon
                                icon={isOpen ? faChevronUp : faChevronDown}
                                className="text-gray-400 ml-4"
                              />
                            </div>
                          </button>

                          {isOpen && (
                            <div className="px-6 pb-4">
                              <p className="text-gray-600 leading-relaxed">
                                {question.a}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {filteredCategories.length === 0 && searchTerm && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FontAwesomeIcon
                      icon={faSearch}
                      className="text-gray-400 text-xl"
                    />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No se encontraron resultados
                  </h3>
                  <p className="text-gray-600">
                    Intenta con términos de búsqueda diferentes o contacta con
                    soporte
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contacto */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Contacto
              </h3>

              <div className="space-y-4">
                <div className="flex items-start">
                  <FontAwesomeIcon
                    icon={faEnvelope}
                    className="text-blue-600 mt-1 mr-3"
                  />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <a
                      href={`mailto:${contactInfo.email}`}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      {contactInfo.email}
                    </a>
                  </div>
                </div>

                <div className="flex items-start">
                  <FontAwesomeIcon
                    icon={faPhone}
                    className="text-blue-600 mt-1 mr-3"
                  />
                  <div>
                    <p className="text-sm text-gray-600">Teléfono</p>
                    <a
                      href={`tel:${contactInfo.phone}`}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      {contactInfo.phone}
                    </a>
                  </div>
                </div>

                <div className="flex items-start">
                  <FontAwesomeIcon
                    icon={faMapMarkerAlt}
                    className="text-blue-600 mt-1 mr-3"
                  />
                  <div>
                    <p className="text-sm text-gray-600">Dirección</p>
                    <p className="text-gray-900">{contactInfo.address}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <FontAwesomeIcon
                    icon={faClock}
                    className="text-blue-600 mt-1 mr-3"
                  />
                  <div>
                    <p className="text-sm text-gray-600">Horarios</p>
                    <p className="text-gray-900">{contactInfo.hours}</p>
                  </div>
                </div>
              </div>

              <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700">
                Contactar Soporte
              </Button>
            </div>

            {/* Enlaces útiles */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Enlaces Útiles
              </h3>

              <div className="space-y-3">
                <a
                  href="#"
                  className="flex items-center text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <FontAwesomeIcon icon={faBook} className="mr-3" />
                  Guía de usuario
                </a>
                <a
                  href="#"
                  className="flex items-center text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <FontAwesomeIcon icon={faVideo} className="mr-3" />
                  Tutoriales en video
                </a>
                <a
                  href="#"
                  className="flex items-center text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <FontAwesomeIcon icon={faShieldAlt} className="mr-3" />
                  Términos y condiciones
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
