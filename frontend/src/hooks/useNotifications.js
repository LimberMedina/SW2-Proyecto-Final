// src/hooks/useNotifications.js
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import api from "../services/api";
import { useAuth } from "./useAuth";

/**
 * Tipos de notificación soportados:
 *  - approval   : Tu video fue aprobado/publicado
 *  - comment    : Alguien comentó tu video
 *  - like       : (TODO backend) Alguien reaccionó a tu video
 *  - save       : (TODO backend) Alguien guardó tu video
 *  - share      : (TODO backend) Alguien compartió tu video
 *
 * Estructura interna:
 * {
 *   id: string,           // único (ej. "approval:videoId:fecha_publicacion")
 *   type: "approval" | "comment" | "like" | "save" | "share",
 *   title: string,
 *   message: string,
 *   link?: string,        // a dónde navegar
 *   createdAt: string,    // ISO
 *   read: boolean,
 *   timeLabel: string,    // "Hace 2 h", etc
 * }
 */

const STORAGE_KEY = (uid) => `videoteca:notifications:v1:${uid || "anon"}`;
const READ_SET_KEY = (uid) =>
  `videoteca:notifications:readset:v1:${uid || "anon"}`;

/** Utilidad de tiempo "hace X". */
function timeAgoLabel(iso) {
  const d = new Date(iso);
  const diff = Math.max(0, Date.now() - d.getTime());
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `Hace ${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `Hace ${min} min`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `Hace ${hr} h`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `Hace ${day} d`;
  return d.toLocaleString("es-ES", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Lee set de ids leídos desde localStorage */
function loadReadSet(uid) {
  try {
    const raw = localStorage.getItem(READ_SET_KEY(uid));
    if (!raw) return new Set();
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
}

/** Persiste set de ids leídos */
function saveReadSet(uid, setObj) {
  try {
    localStorage.setItem(READ_SET_KEY(uid), JSON.stringify(Array.from(setObj)));
  } catch {}
}

/** Persiste snapshot (opcional, útil si quieres cache inicial) */
function saveSnapshot(uid, list) {
  try {
    localStorage.setItem(STORAGE_KEY(uid), JSON.stringify(list));
  } catch {}
}

/** Carga snapshot (opcional) */
function loadSnapshot(uid) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY(uid));
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function useNotifications({ intervalMs = 30000 } = {}) {
  const { user, isAuthenticated } = useAuth();
  const uid = user?.id || null;
  const [list, setList] = useState(() => loadSnapshot(uid));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const readSetRef = useRef(loadReadSet(uid));
  const timerRef = useRef(null);

  // --------- Normalizadores de eventos desde API ---------

  /** 1) Aprobaciones: videos del usuario con estado=PUBLICADO */
  const fetchApprovals = useCallback(async () => {
    if (!uid) return [];
    const params = new URLSearchParams();
    params.set("autor", String(uid));
    params.set("estado", "PUBLICADO");
    params.set("ordering", "-fecha_publicacion");
    params.set("page_size", "20"); // ajusta a lo que prefieras

    const { data } = await api.get(
      `/catalogodigital/admin/videos/?${params.toString()}`
    );
    const rows = data.results || data || [];
    const items = rows.map((v) => {
      const id = `approval:${v.id}:${v.fecha_publicacion || v.fecha_creacion}`;
      return {
        id,
        type: "approval",
        title: "Tu video fue aprobado",
        message: `“${v.titulo}” ya es público en el catálogo.`,
        link: `/catalog?video=${v.id}`,
        createdAt: v.fecha_publicacion || v.fecha_creacion,
      };
    });
    return items;
  }, [uid]);

  /** 2) Comentarios: para cada video del usuario, cargar comentarios */
  const fetchComments = useCallback(async () => {
    if (!uid) return [];
    // Primero, trae los videos del usuario (activos o todos, mejor todos)
    const params = new URLSearchParams();
    params.set("autor", String(uid));
    params.set("ordering", "-fecha_creacion");
    params.set("page_size", "10"); // limita para no sobrecargar
    const { data } = await api.get(
      `/catalogodigital/admin/videos/?${params.toString()}`
    );
    const videos = data.results || data || [];
    const all = [];
    // Para cada video, trae comentarios principales (tu action GET comentarios)
    for (const v of videos) {
      try {
        const { data: cdata } = await api.get(
          `/catalogodigital/admin/videos/${v.id}/comentarios/`
        );
        const comentarios = Array.isArray(cdata) ? cdata : [];
        comentarios.forEach((c) => {
          const actor = c.usuario_nombre || c.usuario_username || "Alguien";
          const id = `comment:${v.id}:${c.id}`;
          all.push({
            id,
            type: "comment",
            title: "Nuevo comentario en tu video",
            message: `${actor}: ${c.texto?.slice(0, 100) || ""}`,
            link: `/catalog?video=${v.id}#comment-${c.id}`,
            createdAt: c.fecha_creacion,
          });
        });
      } catch {
        // ignora errores puntuales de un video
      }
    }
    return all;
  }, [uid]);

  /** 3) Likes / Guardados / Compartidas – placeholders a la espera de endpoints */
  const fetchLikes = useCallback(async () => {
    // TODO: cuando tengas endpoint: GET /likes/?video__autor=<uid>
    return [];
  }, []);
  const fetchSaves = useCallback(async () => {
    // TODO: cuando tengas endpoint: GET /guardados/?video__autor=<uid>
    return [];
  }, []);
  const fetchShares = useCallback(async () => {
    // TODO: cuando tengas endpoint: GET /compartidas/?video__autor=<uid>
    return [];
  }, []);

  // --------- Agregador principal ---------
  const aggregate = useCallback(async () => {
    if (!isAuthenticated || !uid) {
      setList([]);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [approvals, comments, likes, saves, shares] = await Promise.all([
        fetchApprovals(),
        fetchComments(),
        fetchLikes(),
        fetchSaves(),
        fetchShares(),
      ]);

      // Unir, ordenar por fecha desc, limitar a 50
      const merged = [...approvals, ...comments, ...likes, ...saves, ...shares]
        .filter((n) => !!n && !!n.id)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 50)
        .map((n) => ({
          ...n,
          timeLabel: timeAgoLabel(n.createdAt),
          read: readSetRef.current.has(n.id),
        }));

      setList(merged);
      saveSnapshot(uid, merged);
    } catch (e) {
      console.error(e);
      setError("No se pudieron cargar las notificaciones.");
    } finally {
      setLoading(false);
    }
  }, [
    uid,
    isAuthenticated,
    fetchApprovals,
    fetchComments,
    fetchLikes,
    fetchSaves,
    fetchShares,
  ]);

  // --------- Acciones públicas ---------
  const markAllAsRead = useCallback(() => {
    const ns = new Set(readSetRef.current);
    list.forEach((n) => ns.add(n.id));
    readSetRef.current = ns;
    saveReadSet(uid, ns);
    setList((prev) => prev.map((n) => ({ ...n, read: true })));
  }, [list, uid]);

  const markAsRead = useCallback(
    (id) => {
      const ns = new Set(readSetRef.current);
      ns.add(id);
      readSetRef.current = ns;
      saveReadSet(uid, ns);
      setList((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    },
    [uid]
  );

  const refresh = useCallback(() => {
    aggregate();
  }, [aggregate]);

  // --------- Efectos ---------
  useEffect(() => {
    // recarga set de leídos al cambiar de usuario
    readSetRef.current = loadReadSet(uid);
    setList(loadSnapshot(uid));
    aggregate();

    if (timerRef.current) clearInterval(timerRef.current);
    if (isAuthenticated && uid) {
      timerRef.current = setInterval(() => aggregate(), intervalMs);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, isAuthenticated, intervalMs]);

  const unreadCount = useMemo(() => list.filter((n) => !n.read).length, [list]);

  return {
    notifications: list,
    unreadCount,
    loading,
    error,
    markAllAsRead,
    markAsRead,
    refresh,
  };
}
