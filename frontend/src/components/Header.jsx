import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faUserCircle,
  faCog,
  faQuestionCircle,
  faSignOutAlt,
  faVideo,
  faBars,
  faTimes,
  faBell, // <-- NUEVO
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../hooks/useAuth";
import Button from "./Button";
import { useNotifications } from "../hooks/useNotifications"; // <-- NUEVO

export default function Header() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false); // <-- NUEVO
  const profileMenuRef = useRef(null);
  const notifMenuRef = useRef(null); // <-- NUEVO

  // Notificaciones (hook)
  const {
    notifications,
    unreadCount,
    markAllAsRead,
    markAsRead,
    refresh,
    loading: notifLoading,
    error: notifError,
  } = useNotifications();

  // Cerrar menús al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target)
      ) {
        setIsProfileMenuOpen(false);
      }
      if (
        notifMenuRef.current &&
        !notifMenuRef.current.contains(event.target)
      ) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      setIsProfileMenuOpen(false);
      navigate("/");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const profileMenuItems = [
    {
      icon: faUserCircle,
      label: "Ver perfil",
      action: () => {
        navigate("/profile");
        setIsProfileMenuOpen(false);
      },
    },
    {
      icon: faCog,
      label: "Configuración",
      action: () => {
        navigate("/settings");
        setIsProfileMenuOpen(false);
      },
    },
    {
      icon: faQuestionCircle,
      label: "Ayuda",
      action: () => {
        navigate("/help");
        setIsProfileMenuOpen(false);
      },
    },
    {
      icon: faSignOutAlt,
      label: "Cerrar sesión",
      action: handleLogout,
      className: "text-red-600 hover:text-red-700 hover:bg-red-50",
    },
  ];

  return (
    <header className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo y marca */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <FontAwesomeIcon
                  icon={faVideo}
                  className="text-white text-lg"
                />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-gray-900">
                  Videoteca UAGRM
                </h1>
                <p className="text-xs text-gray-500">Canal Universitario</p>
              </div>
            </Link>
          </div>

          {/* Acciones del usuario */}
          <div className="flex items-center space-x-4">
            {/* Campana de notificaciones */}
            {isAuthenticated && (
              <div className="relative" ref={notifMenuRef}>
                <button
                  onClick={() => setIsNotifOpen((v) => !v)}
                  className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="Notificaciones"
                >
                  <FontAwesomeIcon icon={faBell} className="text-gray-700" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center h-5 min-w-[1.25rem] px-1.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </button>

                {/* Dropdown de notificaciones */}
                {isNotifOpen && (
                  <div className="absolute right-0 mt-2 w-96 max-w-[95vw] bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 pb-2 flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-800">
                        Notificaciones
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={refresh}
                          className="text-xs text-blue-600 hover:underline disabled:opacity-50"
                          disabled={notifLoading}
                        >
                          {notifLoading ? "Actualizando…" : "Actualizar"}
                        </button>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-xs text-gray-600 hover:underline"
                          >
                            Marcar todas como leídas
                          </button>
                        )}
                      </div>
                    </div>

                    {notifError && (
                      <div className="px-4 py-2 text-xs text-red-600">
                        {notifError}
                      </div>
                    )}

                    <div className="max-h-96 overflow-auto">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-6 text-sm text-gray-500">
                          No tienes notificaciones.
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <button
                            key={n.id}
                            onClick={() => {
                              markAsRead(n.id);
                              if (n.link) {
                                setIsNotifOpen(false);
                                navigate(n.link);
                              }
                            }}
                            className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors ${
                              n.read ? "opacity-80" : ""
                            }`}
                          >
                            <div
                              className={`mt-1 h-2 w-2 rounded-full ${
                                n.read ? "bg-gray-300" : "bg-blue-600"
                              }`}
                            />
                            <div className="flex-1">
                              <p className="text-sm text-gray-900 font-medium">
                                {n.title}
                              </p>
                              <p className="text-xs text-gray-600 mt-0.5">
                                {n.message}
                              </p>
                              <p className="text-[11px] text-gray-400 mt-1">
                                {n.timeLabel}
                              </p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>

                    <div className="px-4 pt-2 border-t border-gray-100">
                      <button
                        onClick={() => {
                          setIsNotifOpen(false);
                          navigate("/profile"); // o a una pantalla dedicada /notifications
                        }}
                        className="w-full text-center text-sm text-blue-600 hover:underline py-2"
                      >
                        Ver todas
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {isAuthenticated ? (
              // Usuario autenticado
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center space-x-2 bg-gray-50 hover:bg-gray-100 rounded-full pl-3 pr-2 py-2 transition-colors duration-200"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">
                      {user?.nombre?.charAt(0)?.toUpperCase() ||
                        user?.username?.charAt(0)?.toUpperCase() ||
                        "U"}
                    </span>
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-gray-700">
                    {user?.nombre || user?.username || "Usuario"}
                  </span>
                  <FontAwesomeIcon
                    icon={faChevronDown}
                    className={`text-gray-500 text-xs transition-transform duration-200 ${
                      isProfileMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold">
                            {user?.nombre?.charAt(0)?.toUpperCase() ||
                              user?.username?.charAt(0)?.toUpperCase() ||
                              "U"}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {user?.nombre || user?.username || "Usuario"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {user?.email ||
                              user?.correo ||
                              user?.email_address ||
                              `@${user?.username || "usuario"}`}
                          </p>
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                              user?.rol === "ADMIN"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {user?.rol === "ADMIN"
                              ? "Administrador"
                              : "Usuario"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {profileMenuItems.map((item, index) => (
                      <button
                        key={index}
                        onClick={item.action}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center space-x-3 ${
                          item.className || "text-gray-700 hover:text-gray-900"
                        }`}
                      >
                        <FontAwesomeIcon
                          icon={item.icon}
                          className="text-base"
                        />
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // Usuario no autenticado
              <div className="flex items-center space-x-3">
                <Link to="/login">
                  <Button variant="outline" size="sm">
                    Iniciar sesión
                  </Button>
                </Link>
                <Link to="/register">
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    Registrarse
                  </Button>
                </Link>
              </div>
            )}

            {/* Botón menú móvil */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100"
            >
              <FontAwesomeIcon icon={isMobileMenuOpen ? faTimes : faBars} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
