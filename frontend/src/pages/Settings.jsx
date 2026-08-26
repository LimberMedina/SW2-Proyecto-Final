import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell,
  faEye,
  faLock,
  faGlobe,
  faPalette,
  faDownload,
  faTrash,
  faCheck,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../hooks/useAuth";
import Button from "../components/Button";
import Header from "../components/Header";
import api from "../services/api";

export default function Settings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: false,
      newVideos: true,
      comments: true,
    },
    privacy: {
      profileVisible: true,
      showEmail: false,
      showActivity: true,
    },
    playback: {
      autoplay: false,
      quality: "auto",
      captions: false,
    },
    appearance: {
      theme: "light",
      language: "es",
    },
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [saved, setSaved] = useState(false);

  // Cargar preferencias al montar el componente
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const response = await api.get("/usuarios/me/preferencias/");
      const prefs = response.data;

      setSettings({
        notifications: {
          email: prefs.notif_email,
          push: prefs.notif_push,
          newVideos: prefs.notif_nuevos_videos,
          comments: prefs.notif_comentarios,
        },
        privacy: {
          profileVisible: prefs.perfil_visible,
          showEmail: prefs.mostrar_email,
          showActivity: prefs.mostrar_actividad,
        },
        playback: {
          autoplay: prefs.autoplay,
          quality: prefs.calidad_video,
          captions: prefs.subtitulos_auto,
        },
        appearance: {
          theme: prefs.tema,
          language: prefs.idioma,
        },
      });
    } catch (error) {
      console.error("Error cargando preferencias:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (category, setting, value) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value,
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Mapear las preferencias del frontend al formato del backend
      const prefsData = {
        tema: settings.appearance.theme,
        idioma: settings.appearance.language,
        notif_email: settings.notifications.email,
        notif_push: settings.notifications.push,
        notif_nuevos_videos: settings.notifications.newVideos,
        notif_comentarios: settings.notifications.comments,
        perfil_visible: settings.privacy.profileVisible,
        mostrar_email: settings.privacy.showEmail,
        mostrar_actividad: settings.privacy.showActivity,
        autoplay: settings.playback.autoplay,
        calidad_video: settings.playback.quality,
        subtitulos_auto: settings.playback.captions,
      };

      await api.patch("/usuarios/me/preferencias/", prefsData);

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Error guardando preferencias:", error);
      alert("Error al guardar las preferencias. Por favor intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadData = async () => {
    setDownloading(true);
    try {
      const response = await api.get("/usuarios/me/respaldo/", {
        responseType: "blob",
      });

      // Crear URL del blob y descargar
      const blob = new Blob([response.data], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // Obtener el nombre del archivo del header Content-Disposition o usar uno por defecto
      const contentDisposition = response.headers["content-disposition"];
      let filename = `respaldo_${user?.username || "usuario"}_${
        new Date().toISOString().split("T")[0]
      }.json`;

      if (contentDisposition) {
        const matches = /filename="([^"]*)"/.exec(contentDisposition);
        if (matches && matches[1]) {
          filename = matches[1];
        }
      }

      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      alert("Datos descargados exitosamente");
    } catch (error) {
      console.error("Error descargando datos:", error);
      alert("Error al descargar los datos. Por favor intenta de nuevo.");
    } finally {
      setDownloading(false);
    }
  };

  const SettingSection = ({ title, icon, children }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center mb-4">
        <FontAwesomeIcon icon={icon} className="text-blue-600 mr-3" />
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );

  const ToggleSetting = ({ label, description, checked, onChange }) => (
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-sm font-medium text-gray-900">{label}</h3>
        {description && <p className="text-sm text-gray-500">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? "bg-blue-600" : "bg-gray-200"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );

  const SelectSetting = ({ label, value, options, onChange }) => (
    <div>
      <label className="block text-sm font-medium text-gray-900 mb-2">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Header />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
          <p className="text-gray-600 mt-2">
            Personaliza tu experiencia en la videoteca
          </p>
        </div>

        {/* Loading state */}
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
            {/* Mensaje de guardado */}
            {saved && (
              <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <FontAwesomeIcon
                    icon={faCheck}
                    className="text-green-600 mr-2"
                  />
                  <span className="text-green-800">
                    Configuración guardada exitosamente
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-6">
              {/* Notificaciones */}
              <SettingSection title="Notificaciones" icon={faBell}>
                <ToggleSetting
                  label="Notificaciones por email"
                  description="Recibe actualizaciones importantes por correo electrónico"
                  checked={settings.notifications.email}
                  onChange={(value) =>
                    handleSettingChange("notifications", "email", value)
                  }
                />
                <ToggleSetting
                  label="Notificaciones push"
                  description="Recibe notificaciones en tiempo real en el navegador"
                  checked={settings.notifications.push}
                  onChange={(value) =>
                    handleSettingChange("notifications", "push", value)
                  }
                />
                <ToggleSetting
                  label="Nuevos videos"
                  description="Notificarme cuando se publiquen nuevos videos"
                  checked={settings.notifications.newVideos}
                  onChange={(value) =>
                    handleSettingChange("notifications", "newVideos", value)
                  }
                />
                <ToggleSetting
                  label="Comentarios"
                  description="Notificarme sobre respuestas a mis comentarios"
                  checked={settings.notifications.comments}
                  onChange={(value) =>
                    handleSettingChange("notifications", "comments", value)
                  }
                />
              </SettingSection>

              {/* Privacidad */}
              <SettingSection title="Privacidad" icon={faEye}>
                <ToggleSetting
                  label="Perfil público"
                  description="Permite que otros usuarios vean tu perfil"
                  checked={settings.privacy.profileVisible}
                  onChange={(value) =>
                    handleSettingChange("privacy", "profileVisible", value)
                  }
                />
                <ToggleSetting
                  label="Mostrar email"
                  description="Hacer visible tu dirección de correo en el perfil"
                  checked={settings.privacy.showEmail}
                  onChange={(value) =>
                    handleSettingChange("privacy", "showEmail", value)
                  }
                />
                <ToggleSetting
                  label="Mostrar actividad"
                  description="Permitir que otros vean tu actividad reciente"
                  checked={settings.privacy.showActivity}
                  onChange={(value) =>
                    handleSettingChange("privacy", "showActivity", value)
                  }
                />
              </SettingSection>

              {/* Reproducción */}
              <SettingSection title="Reproducción" icon={faGlobe}>
                <ToggleSetting
                  label="Reproducción automática"
                  description="Reproducir automáticamente el siguiente video"
                  checked={settings.playback.autoplay}
                  onChange={(value) =>
                    handleSettingChange("playback", "autoplay", value)
                  }
                />
                <SelectSetting
                  label="Calidad de video predeterminada"
                  value={settings.playback.quality}
                  options={[
                    { value: "auto", label: "Automática" },
                    { value: "hd", label: "HD" },
                    { value: "sd", label: "SD" },
                  ]}
                  onChange={(value) =>
                    handleSettingChange("playback", "quality", value)
                  }
                />
                <ToggleSetting
                  label="Subtítulos automáticos"
                  description="Activar subtítulos automáticamente cuando estén disponibles"
                  checked={settings.playback.captions}
                  onChange={(value) =>
                    handleSettingChange("playback", "captions", value)
                  }
                />
              </SettingSection>

              {/* Apariencia */}
              <SettingSection title="Apariencia" icon={faPalette}>
                <SelectSetting
                  label="Tema"
                  value={settings.appearance.theme}
                  options={[
                    { value: "light", label: "Claro" },
                    { value: "dark", label: "Oscuro" },
                    { value: "auto", label: "Automático" },
                  ]}
                  onChange={(value) =>
                    handleSettingChange("appearance", "theme", value)
                  }
                />
                <SelectSetting
                  label="Idioma"
                  value={settings.appearance.language}
                  options={[
                    { value: "es", label: "Español" },
                    { value: "en", label: "English" },
                    { value: "pt", label: "Português" },
                  ]}
                  onChange={(value) =>
                    handleSettingChange("appearance", "language", value)
                  }
                />
              </SettingSection>

              {/* Datos y privacidad */}
              <SettingSection title="Datos y privacidad" icon={faLock}>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">
                      Gestión de datos
                    </h3>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadData}
                        disabled={downloading}
                      >
                        <FontAwesomeIcon
                          icon={downloading ? faSpinner : faDownload}
                          className="mr-2"
                          spin={downloading}
                        />
                        {downloading ? "Descargando..." : "Descargar mis datos"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-600 hover:bg-red-50"
                      >
                        <FontAwesomeIcon icon={faTrash} className="mr-2" />
                        Eliminar cuenta
                      </Button>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    <p>
                      • Los datos descargados incluyen tu perfil, actividad y
                      preferencias
                    </p>
                    <p>
                      • La eliminación de cuenta es permanente e irreversible
                    </p>
                  </div>
                </div>
              </SettingSection>
            </div>

            {/* Botón guardar */}
            <div className="mt-8 flex justify-end">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {saving ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                    Guardando...
                  </>
                ) : (
                  "Guardar cambios"
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
