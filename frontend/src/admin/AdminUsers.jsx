// AdminUsers.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import Button from "../components/Button";
import Input from "../components/Input";
import api from "../services/api";
import FormUsers from "./FormUsers";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faUserShield,
  faCheckCircle,
  faTimesCircle,
  faUserPlus,
} from "@fortawesome/free-solid-svg-icons";

const formatDate = (dstr) => {
  if (!dstr) return "—";
  const d = new Date(dstr);
  return d.toLocaleString("es-ES", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const parseDRFList = (data) => {
  const results = data?.results ?? data ?? [];
  return Array.isArray(results) ? results : [];
};

const HeaderBar = React.memo(function HeaderBar({
  ordering,
  setOrdering,
  search,
  setSearch,
  onSearchClick,
  onNewClick,
  onClose,
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FontAwesomeIcon icon={faUser} className="text-blue-600" />
          Gestión de Usuarios
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Administra los usuarios del sistema
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Buscar usuarios..."
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
          <select
            value={ordering}
            onChange={(e) => setOrdering(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm"
          >
            <option value="-date_joined">Más recientes</option>
            <option value="date_joined">Más antiguos</option>
            <option value="username">Usuario A-Z</option>
            <option value="-username">Usuario Z-A</option>
            <option value="email">Email A-Z</option>
            <option value="-email">Email Z-A</option>
            <option value="rol">Rol</option>
          </select>

          <Button onClick={onNewClick}>
            <FontAwesomeIcon icon={faUserPlus} className="mr-2" />
            Nuevo Usuario
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
  loading,
  onEdit,
  onRemove,
  onToggleActive,
}) {
  const columns = [
    { key: "username", label: "Usuario" },
    {
      key: "nombre_completo",
      label: "Nombre",
      render: (r) => {
        const nombre = r.nombre || "";
        const apellidos = r.apellidos || "";
        return nombre || apellidos ? `${nombre} ${apellidos}`.trim() : "—";
      },
    },
    { key: "email", label: "Email" },
    {
      key: "rol",
      label: "Rol",
      render: (r) => (
        <span
          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
            r.rol === "ADMIN"
              ? "bg-purple-100 text-purple-800"
              : "bg-blue-100 text-blue-800"
          }`}
        >
          <FontAwesomeIcon icon={r.rol === "ADMIN" ? faUserShield : faUser} />
          {r.rol === "ADMIN" ? "Administrador" : "Usuario"}
        </span>
      ),
    },
    {
      key: "is_active",
      label: "Estado",
      render: (r) => (
        <span
          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
            r.is_active
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          <FontAwesomeIcon icon={r.is_active ? faCheckCircle : faTimesCircle} />
          {r.is_active ? "Activo" : "Inactivo"}
        </span>
      ),
    },
    {
      key: "fecha_registro",
      label: "Registro",
      render: (r) => formatDate(r.fecha_registro),
    },
    {
      key: "ultimo_acceso",
      label: "Último acceso",
      render: (r) => (r.ultimo_acceso ? formatDate(r.ultimo_acceso) : "Nunca"),
    },
  ];

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
                No hay usuarios registrados.
              </td>
            </tr>
          )}
          {loading && (
            <tr>
              <td
                colSpan={columns.length + 1}
                className="px-4 py-8 text-center text-gray-500"
              >
                Cargando usuarios...
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onToggleActive(r)}
                    >
                      {r.is_active ? "Desactivar" : "Activar"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(r)}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => onRemove(r)}
                    >
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
    <div className="flex items-center justify-between text-sm text-gray-600 mt-4">
      <div>
        Página {page} — {count.toLocaleString()} usuario{count !== 1 ? "s" : ""}
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!prevUrl}
          onClick={() => onGoPage("prev")}
        >
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
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
      className={`rounded-lg border px-3 py-2 text-sm mb-4 ${
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
  title,
  message,
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-5">
        <h3 className="text-lg font-semibold">{title || "Confirmar acción"}</h3>
        <p className="mt-2 text-gray-600">
          {message || "¿Está seguro que desea realizar esta acción?"}
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            Confirmar
          </Button>
        </div>
      </div>
    </div>
  );
});

function AdminUsers({ onClose }) {
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

  const [search, setSearch] = useState("");
  const [ordering, setOrdering] = useState("-date_joined");

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [showForm, setShowForm] = useState(false);

  const [confirm, setConfirm] = useState({
    open: false,
    payload: null,
    action: null,
  });

  const showToast = useCallback((type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast({ type: "", msg: "" }), 4000);
  }, []);

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

        const url = `/usuarios/admin/users/?${params.toString()}`;
        const { data } = await api.get(url);
        setItems(parseDRFList(data));
        setCount(data?.count ?? (Array.isArray(data) ? data.length : 0));
        setNextUrl(data?.next || null);
        setPrevUrl(data?.previous || null);
        setPage(Number(params.get("page") || 1));
      } catch (e) {
        console.error(e);
        setError("No se pudo cargar la lista de usuarios.");
        showToast("err", "Error al cargar usuarios.");
      } finally {
        setLoading(false);
      }
    },
    [page, pageSize, ordering, search, showToast]
  );

  useEffect(() => {
    loadItems({ page: 1 });
  }, [ordering]);

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

  const startCreate = useCallback(() => {
    setEditing(null);
    setForm({ is_active: true, rol: "USER" });
    setError("");
    setShowForm(true);
  }, []);

  const startEdit = useCallback((item) => {
    setEditing(item);
    setError("");
    setForm({
      username: item.username || "",
      email: item.email || "",
      nombre: item.nombre || "",
      apellidos: item.apellidos || "",
      rol: item.rol || "USER",
      is_active: item.is_active !== false,
      contraseña: "",
    });
    setShowForm(true);
  }, []);

  const handleChange = useCallback((field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
  }, []);

  const submit = useCallback(
    async (e) => {
      e?.preventDefault();
      setSaving(true);
      setError("");
      try {
        const payload = { ...form };
        // Si no hay contraseña en edición, no enviarla
        if (editing && !payload.contraseña) {
          delete payload.contraseña;
        }

        if (!editing) {
          await api.post("/usuarios/admin/users/", payload);
          showToast("ok", "Usuario creado correctamente.");
        } else {
          await api.patch(`/usuarios/admin/users/${editing.id}/`, payload);
          showToast("ok", "Usuario actualizado correctamente.");
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
              "Error al guardar usuario.";
        setError(msg);
        showToast("err", "No se pudo guardar el usuario.");
      } finally {
        setSaving(false);
      }
    },
    [form, editing, loadItems, showToast]
  );

  const askRemove = useCallback((item) => {
    setConfirm({
      open: true,
      payload: item,
      action: "delete",
      title: "Eliminar usuario",
      message: `¿Está seguro que desea eliminar al usuario "${item.username}"? Esta acción no se puede deshacer.`,
    });
  }, []);

  const askToggleActive = useCallback((item) => {
    const accion = item.is_active ? "desactivar" : "activar";
    setConfirm({
      open: true,
      payload: item,
      action: "toggle",
      title: `${accion.charAt(0).toUpperCase() + accion.slice(1)} usuario`,
      message: `¿Está seguro que desea ${accion} al usuario "${item.username}"?`,
    });
  }, []);

  const doConfirmAction = useCallback(async () => {
    const { payload, action } = confirm;
    if (!payload) return;
    setConfirm({ open: false, payload: null, action: null });

    try {
      if (action === "delete") {
        await api.delete(`/usuarios/admin/users/${payload.id}/`);
        showToast("ok", "Usuario eliminado correctamente.");
      } else if (action === "toggle") {
        await api.post(`/usuarios/admin/users/${payload.id}/toggle_active/`);
        showToast(
          "ok",
          payload.is_active ? "Usuario desactivado." : "Usuario activado."
        );
      }
      await loadItems({ page });
    } catch (err) {
      console.error(err);
      showToast("err", "No se pudo completar la acción.");
    }
  }, [confirm, loadItems, page, showToast]);

  return (
    <div className="space-y-6">
      <HeaderBar
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
          loading={loading}
          onEdit={startEdit}
          onRemove={askRemove}
          onToggleActive={askToggleActive}
        />
        <Pagination
          count={count}
          page={page}
          prevUrl={prevUrl}
          nextUrl={nextUrl}
          onGoPage={goPage}
        />
      </div>

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

          <div className="relative bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-4">
                {editing ? "Editar Usuario" : "Crear Nuevo Usuario"}
              </h3>
              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
              <FormUsers
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
              />
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={confirm.open}
        title={confirm.title}
        message={confirm.message}
        onCancel={() =>
          setConfirm({ open: false, payload: null, action: null })
        }
        onConfirm={doConfirmAction}
      />
    </div>
  );
}

export default React.memo(AdminUsers);
