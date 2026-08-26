// AdminManagement.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import Button from "../components/Button";
import Input from "../components/Input";
import api from "../services/api";
import FormCatalogos from "./FormCatalogos";
import FormCategorias from "./FormCategorias";

/* ========================= Constantes y utils ========================= */
const baseAdmin = "/catalogodigital/admin";
const ENDPOINTS = {
  catalogos: `${baseAdmin}/catalogos/`,
  categorias: `${baseAdmin}/categorias/`,
  capitulos: `${baseAdmin}/capitulos/`,
  videos: `${baseAdmin}/videos/`,
};

function formatDate(dstr) {
  if (!dstr) return "—";
  const d = new Date(dstr);
  return d.toLocaleString("es-ES", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
const parseDRFList = (data) => {
  const results = data?.results ?? data ?? [];
  return Array.isArray(results) ? results : [];
};

/* ========================= Presentational ========================= */

const HeaderBar = React.memo(function HeaderBar({
  resource,
  ordering,
  setOrdering,
  search,
  setSearch,
  onSearchClick,
  onNewClick,
  onClose,
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
      <h2 className="text-2xl font-bold text-gray-900 capitalize">
        Gestión de {resource}
      </h2>

      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Buscar…"
            name="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
          <Button variant="outline" onClick={onSearchClick}>
            Buscar
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {!!ordering && (
            <select
              value={ordering}
              onChange={(e) => setOrdering(e.target.value)}
              className="border rounded-md px-3 py-2 text-sm"
            >
              {resource === "catalogos" && (
                <>
                  <option value="nombre">Nombre ↑</option>
                  <option value="-nombre">Nombre ↓</option>
                </>
              )}
              {resource === "categorias" && (
                <>
                  <option value="catalogo__nombre,codigo,nombre">
                    Catálogo / Código ↑
                  </option>
                  <option value="-catalogo__nombre,codigo,nombre">
                    Catálogo / Código ↓
                  </option>
                  <option value="codigo">Código ↑</option>
                  <option value="-codigo">Código ↓</option>
                  <option value="nombre">Nombre ↑</option>
                  <option value="-nombre">Nombre ↓</option>
                </>
              )}
              {resource === "capitulos" && (
                <>
                  <option value="categoria__catalogo__nombre,categoria__codigo,nombre">
                    Catálogo/Categoría/Nombre ↑
                  </option>
                  <option value="-categoria__catalogo__nombre,categoria__codigo,-nombre">
                    Catálogo/Categoría/Nombre ↓
                  </option>
                  <option value="nombre">Nombre ↑</option>
                  <option value="-nombre">Nombre ↓</option>
                </>
              )}
              {resource === "videos" && (
                <>
                  <option value="-fecha_creacion">Recientes</option>
                  <option value="fecha_creacion">Antiguos</option>
                  <option value="-visualizaciones">Más vistos</option>
                  <option value="visualizaciones">Menos vistos</option>
                </>
              )}
            </select>
          )}

          <Button onClick={onNewClick}>
            <span className="mr-2">＋</span> Nuevo
          </Button>
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
});

const Table = React.memo(function Table({
  items,
  columns,
  loading,
  onEdit,
  onRemove,
}) {
  return (
    <div className="overflow-x-auto bg-white rounded-xl shadow border">
      <table className="min-w-full">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
              >
                {c.label}
              </th>
            ))}
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y">
          {items.length === 0 && !loading && (
            <tr>
              <td
                colSpan={columns.length + 1}
                className="px-4 py-8 text-center text-gray-500"
              >
                Sin elementos.
              </td>
            </tr>
          )}
          {loading && (
            <tr>
              <td
                colSpan={columns.length + 1}
                className="px-4 py-8 text-center text-gray-500"
              >
                Cargando…
              </td>
            </tr>
          )}
          {!loading &&
            items.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                {columns.map((c) => (
                  <td key={c.key} className="px-4 py-3 text-sm text-gray-800">
                    {c.render ? c.render(r) : r[c.key] ?? "—"}
                  </td>
                ))}
                <td className="px-4 py-3">
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => onEdit(r)}>
                      Editar
                    </Button>
                    <Button variant="danger" onClick={() => onRemove(r)}>
                      Eliminar
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
});

const Pagination = React.memo(function Pagination({
  count,
  page,
  prevUrl,
  nextUrl,
  onGoPage,
}) {
  if (!(count > 0)) return null;
  return (
    <div className="flex items-center justify-between text-sm text-gray-600">
      <div>
        Página {page} — {count.toLocaleString()} resultado
        {count !== 1 ? "s" : ""}
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          disabled={!prevUrl}
          onClick={() => onGoPage("prev")}
        >
          Anterior
        </Button>
        <Button
          variant="outline"
          disabled={!nextUrl}
          onClick={() => onGoPage("next")}
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
});

const Toast = React.memo(function Toast({ toast, onClose }) {
  if (!toast.msg) return null;
  return (
    <div
      className={`rounded-lg border px-3 py-2 text-sm ${
        toast.type === "err"
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-green-200 bg-green-50 text-green-700"
      }`}
    >
      <div className="flex items-center justify-between">
        <span>{toast.msg}</span>
        <button onClick={onClose} className="text-xs underline">
          cerrar
        </button>
      </div>
    </div>
  );
});

const ConfirmModal = React.memo(function ConfirmModal({
  open,
  onCancel,
  onConfirm,
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-5">
        <h3 className="text-lg font-semibold">Confirmar eliminación</h3>
        <p className="mt-2 text-gray-600">
          ¿Seguro que deseas eliminar este elemento? Esta acción no se puede
          deshacer.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            Eliminar
          </Button>
        </div>
      </div>
    </div>
  );
});

/* ========================= Formularios ========================= */

// FormCatalogos moved to ./FormCatalogos.jsx to keep AdminManagement file smaller

// FormCategorias moved to ./FormCategorias.jsx to keep AdminManagement file smaller

const FormCapitulos = React.memo(function FormCapitulos({
  form,
  handleChange,
  submit,
  saving,
  editing,
  onCancelEdit,
  catalogos,
  categorias,
  onCatalogoChange,
}) {
  // Filtrar categorías por catálogo seleccionado
  const categoriasFiltradas = form.catalogo
    ? categorias.filter((cat) => cat.catalogo === parseInt(form.catalogo))
    : [];

  return (
    <form onSubmit={submit} className="grid md:grid-cols-5 gap-3">
      <div className="md:col-span-2">
        <label className="block text-sm text-gray-700 mb-1">Catálogo *</label>
        <select
          className="w-full border rounded-md px-3 py-2"
          value={form.catalogo || ""}
          onChange={(e) => {
            handleChange("catalogo", e.target.value);
            handleChange("categoria", ""); // Reset categoría
            if (onCatalogoChange) onCatalogoChange(e.target.value);
          }}
          required
        >
          <option value="">Seleccione catálogo…</option>
          {catalogos.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre} ({c.tipo || "DIGITAL"})
            </option>
          ))}
        </select>
      </div>
      <div className="md:col-span-2">
        <label className="block text-sm text-gray-700 mb-1">Categoría *</label>
        <select
          className="w-full border rounded-md px-3 py-2"
          value={form.categoria || ""}
          onChange={(e) => handleChange("categoria", e.target.value)}
          required
          disabled={!form.catalogo}
        >
          <option value="">Seleccione categoría…</option>
          {categoriasFiltradas.map((c) => (
            <option key={c.id} value={c.id}>
              {c.codigo} - {c.nombre}
            </option>
          ))}
        </select>
      </div>
      <div className="md:col-span-1 flex items-end">
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!form.activo}
            onChange={(e) => handleChange("activo", e.target.checked)}
          />
          <span>Activo</span>
        </label>
      </div>
      <div className="md:col-span-3">
        <Input
          label="Nombre"
          name="nombre"
          value={form.nombre || ""}
          onChange={(e) => handleChange("nombre", e.target.value)}
          required
        />
      </div>
      <div className="md:col-span-5">
        <label className="block text-sm text-gray-700 mb-1">Descripción</label>
        <textarea
          value={form.descripcion || ""}
          onChange={(e) => handleChange("descripcion", e.target.value)}
          className="w-full border rounded-md px-3 py-2"
          rows={2}
        />
      </div>
      <div className="md:col-span-5 flex gap-2">
        <Button type="submit" disabled={saving}>
          {saving ? "Guardando…" : editing ? "Actualizar" : "Crear"}
        </Button>
        {editing && (
          <Button variant="outline" onClick={onCancelEdit}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
});

const FormVideos = React.memo(function FormVideos({
  form,
  handleChange,
  submit,
  saving,
  editing,
  onCancelEdit,
  catalogos,
  categorias,
  capitulos,
  onCatalogoChange,
  onCategoriaChange,
}) {
  // Filtrar categorías por catálogo
  const categoriasFiltradas = form.catalogo
    ? categorias.filter((cat) => cat.catalogo === parseInt(form.catalogo))
    : [];

  // Filtrar capítulos por categoría
  const capitulosFiltrados = form.categoria
    ? capitulos.filter((cap) => cap.categoria === parseInt(form.categoria))
    : [];

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid md:grid-cols-2 gap-3">
        <Input
          label="Título"
          name="titulo"
          value={form.titulo || ""}
          onChange={(e) => handleChange("titulo", e.target.value)}
          required
        />
        <div>
          <label className="block text-sm text-gray-700 mb-1">Estado</label>
          <select
            className="w-full border rounded-md px-3 py-2"
            value={form.estado || "BORRADOR"}
            onChange={(e) => handleChange("estado", e.target.value)}
          >
            <option value="BORRADOR">BORRADOR</option>
            <option value="REVISION">REVISION</option>
            <option value="PUBLICADO">PUBLICADO</option>
            <option value="ARCHIVADO">ARCHIVADO</option>
          </select>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm text-gray-700 mb-1">Catálogo *</label>
          <select
            className="w-full border rounded-md px-3 py-2"
            value={form.catalogo || ""}
            onChange={(e) => {
              handleChange("catalogo", e.target.value);
              handleChange("categoria", "");
              handleChange("capitulo", "");
              if (onCatalogoChange) onCatalogoChange(e.target.value);
            }}
            required
          >
            <option value="">Seleccione catálogo…</option>
            {catalogos.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} ({c.tipo || "DIGITAL"})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">
            Categoría *
          </label>
          <select
            className="w-full border rounded-md px-3 py-2"
            value={form.categoria || ""}
            onChange={(e) => {
              handleChange("categoria", e.target.value);
              handleChange("capitulo", "");
              if (onCategoriaChange) onCategoriaChange(e.target.value);
            }}
            required
            disabled={!form.catalogo}
          >
            <option value="">Seleccione categoría…</option>
            {categoriasFiltradas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.codigo} - {c.nombre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Capítulo *</label>
          <select
            className="w-full border rounded-md px-3 py-2"
            value={form.capitulo || ""}
            onChange={(e) => handleChange("capitulo", e.target.value)}
            required
            disabled={!form.categoria}
          >
            <option value="">Seleccione capítulo…</option>
            {capitulosFiltrados.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm text-gray-700 mb-1">Descripción</label>
        <textarea
          value={form.descripcion || ""}
          onChange={(e) => handleChange("descripcion", e.target.value)}
          className="w-full border rounded-md px-3 py-2"
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm text-gray-700 mb-1">
          {editing
            ? "Cambiar archivo de video (opcional)"
            : "Archivo de video *"}
        </label>
        {editing && form.url_video && (
          <div className="mb-2 text-sm text-gray-600">
            Video actual:{" "}
            <a
              href={form.url_video}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              Ver video
            </a>
          </div>
        )}
        <input
          type="file"
          accept="video/*"
          onChange={(e) =>
            handleChange("archivo_video", e.target.files?.[0] || null)
          }
          className="w-full"
          required={!editing}
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={saving}>
          {saving ? "Guardando…" : editing ? "Actualizar" : "Crear"}
        </Button>
        {editing && (
          <Button variant="outline" onClick={onCancelEdit}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
});

const FormArea = React.memo(function FormArea({
  resource,
  form,
  handleChange,
  submit,
  saving,
  editing,
  onCancelEdit,
  catalogos,
  categorias,
  capitulos,
  error,
}) {
  return (
    <div className="bg-white rounded-xl shadow border p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">
          {editing ? "Editar" : "Crear nuevo"}
        </h3>
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>

      {resource === "catalogos" && (
        <FormCatalogos
          form={form}
          handleChange={handleChange}
          submit={submit}
          saving={saving}
          editing={editing}
          onCancelEdit={onCancelEdit}
        />
      )}
      {resource === "categorias" && (
        <FormCategorias
          form={form}
          handleChange={handleChange}
          submit={submit}
          saving={saving}
          editing={editing}
          onCancelEdit={onCancelEdit}
          catalogos={catalogos}
        />
      )}
      {resource === "capitulos" && (
        <FormCapitulos
          form={form}
          handleChange={handleChange}
          submit={submit}
          saving={saving}
          editing={editing}
          onCancelEdit={onCancelEdit}
          catalogos={catalogos}
          categorias={categorias}
        />
      )}
      {resource === "videos" && (
        <FormVideos
          form={form}
          handleChange={handleChange}
          submit={submit}
          saving={saving}
          editing={editing}
          onCancelEdit={onCancelEdit}
          catalogos={catalogos}
          categorias={categorias}
          capitulos={capitulos}
        />
      )}
    </div>
  );
});

/* ========================= Contenedor principal ========================= */

function AdminManagement({ resource, onClose }) {
  // Estado base
  const [items, setItems] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [nextUrl, setNextUrl] = useState(null);
  const [prevUrl, setPrevUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ type: "", msg: "" });

  // búsqueda/orden
  const [search, setSearch] = useState("");
  const [ordering, setOrdering] = useState("");

  // edición/creación
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [showForm, setShowForm] = useState(false);

  // selects dependientes
  const [catalogos, setCatalogos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [capitulos, setCapitulos] = useState([]);

  // modal confirmación
  const [confirm, setConfirm] = useState({ open: false, payload: null });

  // Columnas por recurso
  const columns = useMemo(() => {
    switch (resource) {
      case "catalogos":
        return [
          { key: "nombre", label: "Nombre" },
          {
            key: "descripcion",
            label: "Descripción",
            render: (r) => r.descripcion || "—",
          },
          {
            key: "activo",
            label: "Activo",
            render: (r) => (r.activo ? "Sí" : "No"),
          },
          {
            key: "total_capitulos",
            label: "Capítulos",
            render: (r) => r.total_capitulos ?? "—",
          },
          {
            key: "total_videos",
            label: "Videos",
            render: (r) => r.total_videos ?? "—",
          },
        ];
      case "categorias":
        return [
          { key: "codigo", label: "Código" },
          { key: "nombre", label: "Nombre" },
          {
            key: "catalogo",
            label: "Catálogo",
            render: (r) =>
              r.catalogo_info?.nombre ||
              r.catalogo_nombre ||
              r.catalogo?.nombre ||
              "—",
          },
          {
            key: "descripcion",
            label: "Descripción",
            render: (r) => r.descripcion || "—",
          },
          {
            key: "activo",
            label: "Activo",
            render: (r) => (r.activo ? "Sí" : "No"),
          },
          {
            key: "total_capitulos",
            label: "Capítulos",
            render: (r) => r.total_capitulos ?? "—",
          },
          {
            key: "total_videos",
            label: "Videos",
            render: (r) => r.total_videos ?? "—",
          },
        ];

      case "capitulos":
        return [
          { key: "nombre", label: "Nombre" },
          {
            key: "categoria",
            label: "Categoría",
            render: (r) => {
              const info = r.categoria_info;
              if (!info) return "—";
              const catNombre = info?.catalogo?.nombre
                ? `${info.catalogo.nombre} / `
                : "";
              const codigo = info?.codigo ? `${info.codigo} - ` : "";
              return `${catNombre}${codigo}${info?.nombre ?? ""}`;
            },
          },
          {
            key: "activo",
            label: "Activo",
            render: (r) => (r.activo ? "Sí" : "No"),
          },
          {
            key: "total_videos",
            label: "Videos",
            render: (r) => r.total_videos ?? "—",
          },
        ];

      case "videos":
        return [
          { key: "titulo", label: "Título" },
          { key: "estado", label: "Estado" },
          {
            key: "capitulo",
            label: "Capítulo",
            render: (r) => r.capitulo_nombre || r.capitulo?.nombre || "—",
          },
          {
            key: "duracion_display",
            label: "Duración",
            render: (r) => r.duracion_display || "—",
          },
          {
            key: "visualizaciones",
            label: "Vistas",
            render: (r) => r.visualizaciones ?? 0,
          },
          {
            key: "fecha_creacion",
            label: "Creado",
            render: (r) => formatDate(r.fecha_creacion),
          },
        ];
      default:
        return [];
    }
  }, [resource]);

  // Orden por defecto
  useEffect(() => {
    switch (resource) {
      case "catalogos":
        setOrdering("nombre");
        break;
      case "categorias":
        setOrdering("catalogo__nombre,codigo,nombre");
        break;
      case "capitulos":
        setOrdering("categoria__catalogo__nombre,categoria__codigo,nombre");
        break;
      case "videos":
        setOrdering("-fecha_creacion");
        break;
      default:
        setOrdering("");
    }
  }, [resource]);

  const showToast = useCallback((type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast({ type: "", msg: "" }), 4000);
  }, []);

  // Cargas auxiliares
  const preloadSelects = useCallback(async () => {
    try {
      if (resource === "categorias") {
        const { data } = await api.get(
          `${ENDPOINTS.catalogos}?page_size=1000&ordering=nombre`
        );
        setCatalogos(parseDRFList(data));
      }
      if (resource === "capitulos") {
        // Cargar catálogos y categorías
        const [catalogosRes, categoriasRes] = await Promise.all([
          api.get(`${ENDPOINTS.catalogos}?page_size=1000&ordering=nombre`),
          api.get(
            `${ENDPOINTS.categorias}?page_size=1000&ordering=catalogo__nombre,codigo`
          ),
        ]);
        setCatalogos(parseDRFList(catalogosRes.data));
        setCategorias(parseDRFList(categoriasRes.data));
      }
      if (resource === "videos") {
        const [catalogosRes, categoriasRes, capitulosRes] = await Promise.all([
          api.get(`${ENDPOINTS.catalogos}?page_size=1000&ordering=nombre`),
          api.get(
            `${ENDPOINTS.categorias}?page_size=1000&ordering=catalogo__nombre,codigo`
          ),
          api.get(
            `${ENDPOINTS.capitulos}?page_size=1000&ordering=categoria__catalogo__nombre,categoria__codigo,nombre`
          ),
        ]);
        setCatalogos(parseDRFList(catalogosRes.data));
        setCategorias(parseDRFList(categoriasRes.data));
        setCapitulos(parseDRFList(capitulosRes.data));
      }
    } catch {
      // silencioso
    }
  }, [resource]);

  // Cargar lista
  const loadItems = useCallback(
    async (opts = {}) => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams();
        params.set("page", String(opts.page ?? page ?? 1));
        params.set("page_size", String(pageSize));
        if (ordering) params.set("ordering", ordering);
        const q = typeof opts.search === "string" ? opts.search : search;
        if (q && q.trim()) params.set("search", q.trim());

        const url = `${ENDPOINTS[resource]}?${params.toString()}`;
        const { data } = await api.get(url);
        setItems(parseDRFList(data));
        setCount(data?.count ?? (Array.isArray(data) ? data.length : 0));
        setNextUrl(data?.next || null);
        setPrevUrl(data?.previous || null);
        setPage(Number(params.get("page") || 1));
      } catch (e) {
        console.error(e);
        setError("No se pudo cargar la lista.");
      } finally {
        setLoading(false);
      }
    },
    [resource, page, pageSize, ordering, search]
  );

  // Inicial / cambio de recurso
  useEffect(() => {
    if (!resource) return;
    setEditing(null);
    setForm({});
    setSearch("");
    setPage(1);
    preloadSelects();
    loadItems({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resource]); // deps mínimas para evitar loops

  // paginación
  const goPage = useCallback(
    (dir) => {
      const url = dir === "next" ? nextUrl : prevUrl;
      if (!url) return;
      const u = new URL(url);
      const p = Number(u.searchParams.get("page") || 1);
      loadItems({ page: p });
    },
    [nextUrl, prevUrl, loadItems]
  );

  // CRUD
  const startCreate = useCallback(() => {
    setEditing(null);
    setForm({});
    setError("");
    setShowForm(true);
  }, []);

  const startEdit = useCallback(
    (item) => {
      setEditing(item);
      setError("");

      if (resource === "catalogos") {
        setForm({
          nombre: item.nombre || "",
          descripcion: item.descripcion || "",
          activo: !!item.activo,
        });
      } else if (resource === "categorias") {
        setForm({
          codigo: item.codigo || "",
          nombre: item.nombre || "",
          descripcion: item.descripcion || "",
          catalogo:
            item.catalogo?.id ?? item.catalogo_info?.id ?? item.catalogo ?? "",
          activo: !!item.activo,
        });
      } else if (resource === "capitulos") {
        const catInfo = item.categoria_info || item.categoria;
        const catalogoId = catInfo?.catalogo?.id || catInfo?.catalogo || "";
        setForm({
          nombre: item.nombre || "",
          descripcion: item.descripcion || "",
          catalogo: catalogoId,
          categoria:
            item.categoria?.id ??
            item.categoria_info?.id ??
            item.categoria ??
            "",
          activo: !!item.activo,
        });
      } else if (resource === "videos") {
        const capInfo = item.capitulo_info || item.capitulo;
        const catInfo = capInfo?.categoria_info || capInfo?.categoria;
        const catalogoId = catInfo?.catalogo?.id || catInfo?.catalogo || "";
        const categoriaId =
          capInfo?.categoria?.id || capInfo?.categoria || catInfo?.id || "";
        const capituloId =
          item.capitulo?.id ?? item.capitulo_info?.id ?? item.capitulo ?? "";

        setForm({
          titulo: item.titulo || "",
          descripcion: item.descripcion || "",
          estado: item.estado || "BORRADOR",
          catalogo: catalogoId,
          categoria: categoriaId,
          capitulo: capituloId,
          archivo_video: null,
          url_video: item.url_video || "",
        });
      }
      setShowForm(true);
    },
    [resource]
  );

  const handleChange = useCallback((field, value) => {
    if (field === "__reset__") {
      setEditing(null);
      setForm({});
      return;
    }
    setForm((f) => ({ ...f, [field]: value }));
  }, []);

  const submit = useCallback(
    async (e) => {
      e?.preventDefault();
      setSaving(true);
      setError("");
      try {
        if (resource === "videos") {
          const fd = new FormData();
          Object.entries(form).forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== "") {
              fd.append(k, v);
            }
          });
          if (!editing) {
            await api.post(ENDPOINTS[resource], fd, {
              headers: { "Content-Type": "multipart/form-data" },
            });
            showToast("ok", "Video creado.");
          } else {
            await api.patch(`${ENDPOINTS[resource]}${editing.id}/`, fd, {
              headers: { "Content-Type": "multipart/form-data" },
            });
            showToast("ok", "Video actualizado.");
          }
        } else {
          if (!editing) {
            await api.post(ENDPOINTS[resource], form);
            showToast("ok", "Creado correctamente.");
          } else {
            await api.patch(`${ENDPOINTS[resource]}${editing.id}/`, form);
            showToast("ok", "Actualizado correctamente.");
          }
        }
        setEditing(null);
        setForm({});
        setShowForm(false);
        await loadItems({ page: 1 });
      } catch (err) {
        console.error(err);
        const data = err?.response?.data;
        const msg =
          typeof data === "string"
            ? data
            : data?.detail ||
              Object.entries(data || {})
                .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
                .join(" | ") ||
              "Error al guardar.";
        setError(msg);
        showToast("err", "No se pudo guardar.");
      } finally {
        setSaving(false);
      }
    },
    [resource, form, editing, loadItems, showToast]
  );

  const askRemove = useCallback((item) => {
    setConfirm({ open: true, payload: item });
  }, []);

  const doRemove = useCallback(async () => {
    const item = confirm.payload;
    if (!item) return;
    setConfirm({ open: false, payload: null });
    try {
      await api.delete(`${ENDPOINTS[resource]}${item.id}/`);
      showToast("ok", "Eliminado.");
      await loadItems({ page });
    } catch (err) {
      console.error(err);
      showToast("err", "No se pudo eliminar.");
    }
  }, [confirm.payload, resource, loadItems, page, showToast]);

  /* ========================= Render ========================= */

  return (
    <div className="space-y-6">
      <HeaderBar
        resource={resource}
        ordering={ordering}
        setOrdering={setOrdering}
        search={search}
        setSearch={setSearch}
        onSearchClick={() => loadItems({ page: 1, search })}
        onNewClick={startCreate}
        onClose={onClose}
      />

      <Toast toast={toast} onClose={() => setToast({ type: "", msg: "" })} />

      <div className="space-y-4">
        <Table
          items={items}
          columns={columns}
          loading={loading}
          onEdit={startEdit}
          onRemove={askRemove}
        />
        <Pagination
          count={count}
          page={page}
          prevUrl={prevUrl}
          nextUrl={nextUrl}
          onGoPage={goPage}
        />
      </div>

      {/* Modal para crear/editar (media pantalla) */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              setShowForm(false);
              setEditing(null);
              setForm({});
            }}
          />

          <div className="relative bg-white rounded-xl shadow-lg w-1/2 max-h-[90vh] overflow-auto">
            <div className="p-5">
              <FormArea
                resource={resource}
                form={form}
                handleChange={handleChange}
                submit={submit}
                saving={saving}
                editing={editing}
                onCancelEdit={() => {
                  setEditing(null);
                  setForm({});
                  setShowForm(false);
                }}
                catalogos={catalogos}
                categorias={categorias}
                capitulos={capitulos}
                error={error}
              />
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={confirm.open}
        onCancel={() => setConfirm({ open: false, payload: null })}
        onConfirm={doRemove}
      />
    </div>
  );
}

export default React.memo(AdminManagement);
