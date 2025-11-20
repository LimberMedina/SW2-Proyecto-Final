// src/pages/AnunciosPublic.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import api from "../services/api";
import Button from "./Button";

export default function AnunciosPublic() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [idx, setIdx] = useState(0);
  const timerRef = useRef(null);
  const [paused, setPaused] = useState(false);

  // === Cargar anuncios públicos ===
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const { data } = await api.get(
          "/catalogodigital/public/anuncios/?page_size=100&ordering=-fecha_creacion"
        );

        const results = Array.isArray(data?.results)
          ? data.results
          : Array.isArray(data)
          ? data
          : [];

        // (Opcional) Si tu endpoint YA devuelve solo vigentes, podrías omitir este filtro:
        const now = new Date();
        const vigentes = results.filter((a) => {
          if (a.activo === false) return false;
          const ini = a.fecha_inicio ? new Date(a.fecha_inicio) : null;
          const fin = a.fecha_fin ? new Date(a.fecha_fin) : null;
          if (ini && now < ini) return false;
          if (fin && now > fin) return false;
          return true;
        });

        if (mounted) {
          setAds(vigentes);
          setIdx(0);
        }
      } catch (e) {
        if (mounted) setErr("No se pudieron cargar los anuncios.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // === Rotación automática cada 10s ===
  useEffect(() => {
    if (paused || ads.length <= 1) return;
    timerRef.current = setInterval(() => {
      setIdx((i) => (i + 1) % ads.length);
    }, 10000);
    return () => clearInterval(timerRef.current);
  }, [ads.length, paused]);

  const current = useMemo(() => (ads.length ? ads[idx] : null), [ads, idx]);

  const go = (dir) => {
    if (!ads.length) return;
    setIdx((i) =>
      dir === "prev" ? (i - 1 + ads.length) % ads.length : (i + 1) % ads.length
    );
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <div className="h-64 animate-pulse rounded-2xl bg-gray-100" />
      </div>
    );
  }

  if (err) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {err}
        </div>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-gray-500">
          No hay anuncios vigentes por ahora.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div
        className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Imagen */}
        {current.url_imagen ? (
          <div className="relative aspect-video w-full bg-black flex items-center justify-center">
            <img
              src={current.url_imagen}
              alt={current.titulo || "Anuncio"}
              className="max-h-full max-w-full object-contain"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent pointer-events-none" />
          </div>
        ) : (
          <div className="grid aspect-video w-full place-items-center bg-gray-100 text-gray-400">
            Sin imagen
          </div>
        )}

        {/* Contenido */}
        <div className="p-5 md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {current.titulo || "Anuncio"}
              </h2>
              {current.fecha_inicio || current.fecha_fin ? (
                <p className="mt-1 text-xs text-gray-500">
                  {current.fecha_inicio
                    ? new Date(current.fecha_inicio).toLocaleDateString("es-ES")
                    : "—"}{" "}
                  –{" "}
                  {current.fecha_fin
                    ? new Date(current.fecha_fin).toLocaleDateString("es-ES")
                    : "—"}
                </p>
              ) : null}
            </div>
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
              {idx + 1} / {ads.length}
            </span>
          </div>

          {current.descripcion ? (
            <p className="mt-3 text-gray-700 whitespace-pre-line">
              {current.descripcion}
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {current.url_destino ? (
              <a
                href={current.url_destino}
                target="_blank"
                rel="noreferrer nofollow"
              >
                <Button>Ver más</Button>
              </a>
            ) : null}
            <Button variant="outline" onClick={() => go("prev")}>
              ◀ Anterior
            </Button>
            <Button variant="outline" onClick={() => go("next")}>
              Siguiente ▶
            </Button>
            <span className="ml-2 text-xs text-gray-500">
              {paused ? "Pausado (hover)" : "Cambia cada 10s"}
            </span>
          </div>
        </div>

        {/* Dots */}
        {ads.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-2">
            {ads.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={[
                  "h-2 w-2 rounded-full transition",
                  i === idx
                    ? "bg-white ring-2 ring-white"
                    : "bg-white/50 hover:bg-white/80",
                ].join(" ")}
                aria-label={`Ir al anuncio ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
