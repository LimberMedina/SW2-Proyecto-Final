// src/components/SessionExpiryAlert.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Alert from "./Alert";

// Decode JWT payload (no deps)
function decodeJwtPayload(token) {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(payload)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

export default function SessionExpiryAlert({ checkIntervalMs = 10000 }) {
  const navigate = useNavigate();
  const [state, setState] = useState({
    visible: false,
    type: "info",
    message: "",
    timeLeft: null,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkToken = () => {
      const token = localStorage.getItem("access_token");
      const refresh = localStorage.getItem("refresh_token");
      if (!token) {
        // no session
        setState((s) => ({ ...s, visible: false }));
        return;
      }

      const payload = decodeJwtPayload(token);
      if (!payload || !payload.exp) {
        setState({ visible: false });
        return;
      }

      const expMs = payload.exp * 1000;
      const now = Date.now();
      const diff = expMs - now;

      if (diff <= 0) {
        // expired
        setState({
          visible: true,
          type: "error",
          message: (
            <div>
              <div className="font-medium">Tu sesión ha expirado</div>
              <div className="mt-1 text-sm text-gray-700">
                Por seguridad, debes iniciar sesión nuevamente o intentar
                extender la sesión si tu refresh token aún es válido.
              </div>
            </div>
          ),
          timeLeft: 0,
        });
        return;
      }

      // If less than 2 minutes left, warn
      const twoMinutes = 2 * 60 * 1000;
      if (diff <= twoMinutes) {
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setState({
          visible: true,
          type: "warning",
          message: (
            <div>
              <div className="font-medium">Tu sesión expirará pronto</div>
              <div className="mt-1 text-sm text-gray-700">
                Expira en {minutes}:{String(seconds).padStart(2, "0")}. Puedes
                extender la sesión.
              </div>
            </div>
          ),
          timeLeft: diff,
        });
        return;
      }

      // session ok
      setState((s) => ({ ...s, visible: false }));
    };

    checkToken();
    const t = setInterval(() => {
      if (mounted) checkToken();
    }, checkIntervalMs);

    return () => {
      mounted = false;
      clearInterval(t);
    };
  }, [checkIntervalMs]);

  const handleExtend = async () => {
    const refresh = localStorage.getItem("refresh_token");
    if (!refresh) {
      // no refresh token available
      setState({
        visible: true,
        type: "error",
        message: (
          <div>
            <div className="font-medium">No es posible extender la sesión</div>
            <div className="mt-1 text-sm text-gray-700">
              Inicia sesión de nuevo para continuar.
            </div>
          </div>
        ),
      });
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/usuarios/auth/refresh/", { refresh });
      // respuesta pudiera devolver access o tokens
      const data = res.data || {};
      if (data.access) {
        localStorage.setItem("access_token", data.access);
        if (data.refresh) localStorage.setItem("refresh_token", data.refresh);
        setState({ visible: false });
      } else if (data.tokens && data.tokens.access) {
        localStorage.setItem("access_token", data.tokens.access);
        if (data.tokens.refresh)
          localStorage.setItem("refresh_token", data.tokens.refresh);
        setState({ visible: false });
      } else {
        // fallback: try expected shape
        setState({
          visible: true,
          type: "error",
          message: (
            <div>
              <div className="font-medium">
                No fue posible extender la sesión
              </div>
              <div className="mt-1 text-sm text-gray-700">
                Inicia sesión nuevamente.
              </div>
            </div>
          ),
        });
      }
    } catch (e) {
      setState({
        visible: true,
        type: "error",
        message: (
          <div>
            <div className="font-medium">Extensión fallida</div>
            <div className="mt-1 text-sm text-gray-700">
              Tu sesión no pudo ser extendida. Inicia sesión de nuevo.
            </div>
          </div>
        ),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    // navigate to login page
    navigate("/login");
  };

  if (!state.visible) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <Alert
        type={
          state.type === "warning"
            ? "warning"
            : state.type === "error"
            ? "error"
            : "info"
        }
        title={null}
        message={state.message}
        onClose={() => setState((s) => ({ ...s, visible: false }))}
        className="flex items-center justify-between"
      />

      <div className="mt-3 flex gap-2 justify-end">
        <button
          onClick={handleExtend}
          disabled={loading}
          className="px-4 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-60"
        >
          {loading ? "Extendiéndose..." : "Extender sesión"}
        </button>
        <button
          onClick={handleLogin}
          className="px-4 py-2 bg-white border border-gray-200 text-gray-800 rounded-full hover:bg-gray-50"
        >
          Iniciar sesión
        </button>
      </div>
    </div>
  );
}
