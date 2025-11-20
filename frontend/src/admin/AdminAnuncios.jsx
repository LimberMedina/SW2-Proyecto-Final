import React, { useEffect, useState, useCallback, useMemo } from "react";
import Button from "../components/Button";
import Input from "../components/Input";
import api from "../services/api";

/* ========================= Constantes ========================= */
const ENDPOINT = "/catalogodigital/admin/anuncios/";

function formatDate(dstr) {
  if (!dstr) return "—";
  const d = new Date(dstr);
  return d.toLocaleString("es-BO", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toDateInputValue(iso) {
  // Asegura yyyy-mm-dd para <input type="date">
  if (!iso) return "";
  // iso puede venir con zona; tomamos la parte de fecha
  return iso.slice(0, 10);
}

/* ========================= Componentes ========================= */

const Table = React.memo(({ items, loading, onEdit, onDelete }) => (
  <div className="overflow-x-auto bg-white rounded-xl shadow border">
    <table className="min-w-full">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
            Imagen
          </th>
          <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
            Título
          </th>
          <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
            Fecha inicio
          </th>
          <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
            Fecha fin
          </th>
          <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
            Activo
          </th>
          <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700">
            Acciones
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
        {loading && (
          <tr>
            <td colSpan={6} className="p-4 text-center text-gray-500">
              Cargando…
            </td>
          </tr>
        )}
        {!loading && items.length === 0 && (
          <tr>
            <td colSpan={6} className="p-4 text-center text-gray-500">
              Sin anuncios registrados.
            </td>
          </tr>
        )}
        {!loading &&
          items.map((a) => (
            <tr key={a.id} className="hover:bg-gray-50">
              <td className="px-4 py-2">
                {a.url_imagen ? (
                  <img
                    src={a.url_imagen}
                    alt={a.titulo || "anuncio"}
                    className="h-12 w-20 object-cover rounded-md border"
                    loading="lazy"
                  />
                ) : (
                  <div className="h-12 w-20 bg-gray-100 rounded-md border flex items-center justify-center text-xs text-gray-400">
                    Sin imagen
                  </div>
                )}
              </td>
              <td className="px-4 py-2 text-sm text-gray-900">{a.titulo}</td>
              <td className="px-4 py-2 text-sm text-gray-600">
                {formatDate(a.fecha_inicio)}
              </td>
              <td className="px-4 py-2 text-sm text-gray-600">
                {formatDate(a.fecha_fin)}
              </td>
              <td className="px-4 py-2 text-sm">
                {a.activo ? (
                  <span className="text-green-600 font-medium">Sí</span>
                ) : (
                  <span className="text-red-500">No</span>
                )}
              </td>
              <td className="px-4 py-2 text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => onEdit(a)}>
                    Editar
                  </Button>
                  <Button variant="danger" onClick={() => onDelete(a)}>
                    Eliminar
                  </Button>
                </div>
              </td>
            </tr>
          ))}
      </tbody>
    </table>
  </div>
));

const FormAnuncio = React.memo(
  ({ form, handleChange, submit, saving, editing, onCancelEdit }) => (
    <form
      onSubmit={submit}
      className="grid md:grid-cols-2 gap-3 bg-white p-5 rounded-xl shadow border"
    >
      <Input
        label="Título"
        name="titulo"
        value={form.titulo || ""}
        onChange={(e) => handleChange("titulo", e.target.value)}
        required
      />
      <Input
        label="URL destino (opcional)"
        name="url_destino"
        value={form.url_destino || ""}
        onChange={(e) => handleChange("url_destino", e.target.value)}
      />
      <div>
        <label className="block text-sm text-gray-700 mb-1">
          Imagen (opcional)
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleChange("archivo", e.target.files?.[0] || null)}
          className="w-full border rounded-md px-3 py-2"
        />
        {editing?.url_imagen && (
          <div className="mt-2 flex items-center gap-3">
            <img
              src={editing.url_imagen}
              alt="actual"
              className="h-12 w-20 object-cover rounded-md border"
            />
            <span className="text-xs text-gray-500">
              (Dejar vacío si no querés cambiar la imagen)
            </span>
          </div>
        )}
      </div>
      <Input
        label="Fecha de inicio"
        type="date"
        name="fecha_inicio"
        value={form.fecha_inicio || ""}
        onChange={(e) => handleChange("fecha_inicio", e.target.value)}
        required
      />
      <Input
        label="Fecha de finalización"
        type="date"
        name="fecha_fin"
        value={form.fecha_fin || ""}
        onChange={(e) => handleChange("fecha_fin", e.target.value)}
        required
      />
      <label className="flex items-center gap-2 mt-2">
        <input
          type="checkbox"
          checked={!!form.activo}
          onChange={(e) => handleChange("activo", e.target.checked)}
        />
        <span>Activo</span>
      </label>
      <div className="md:col-span-2 flex gap-2 pt-3">
        <Button type="submit" disabled={saving}>
          {saving ? "Guardando..." : editing ? "Actualizar" : "Crear"}
        </Button>
        {editing && (
          <Button type="button" variant="outline" onClick={onCancelEdit}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  )
);

/* ========================= Componente principal ========================= */

export default function AdminAnuncios() {
  const [anuncios, setAnuncios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false); // <-- oculto por defecto

  const loadAnuncios = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(ENDPOINT);
      setAnuncios(data.results ?? data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnuncios();
  }, [loadAnuncios]);

  const handleChange = (field, value) =>
    setForm((f) => ({ ...f, [field]: value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      // Mapear 'archivo' -> 'imagen' para el backend
      Object.entries(form).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") {
          if (k === "archivo") {
            fd.append("imagen", v);
          } else {
            fd.append(k, v);
          }
        }
      });

      if (editing) {
        await api.patch(`${ENDPOINT}${editing.id}/`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await api.post(ENDPOINT, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      setForm({});
      setEditing(null);
      setShowForm(false);
      await loadAnuncios();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const onEdit = (a) => {
    setEditing(a);
    setShowForm(true);
    setForm({
      titulo: a.titulo,
      url_destino: a.url_destino,
      // Normalizamos a yyyy-mm-dd para el input date
      fecha_inicio: toDateInputValue(a.fecha_inicio),
      fecha_fin: toDateInputValue(a.fecha_fin),
      activo: a.activo,
      archivo: null,
    });
  };

  const onDelete = async (a) => {
    if (!window.confirm("¿Eliminar este anuncio?")) return;
    try {
      await api.delete(`${ENDPOINT}${a.id}/`);
      await loadAnuncios();
    } catch (err) {
      console.error(err);
    }
  };

  const onClickNuevo = () => {
    setEditing(null);
    setForm({
      titulo: "",
      url_destino: "",
      fecha_inicio: "",
      fecha_fin: "",
      activo: true,
      archivo: null,
    });
    setShowForm(true);
  };

  const onCancelEdit = () => {
    setEditing(null);
    setForm({});
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          Gestión de Anuncios
        </h2>
        {!showForm ? (
          <Button onClick={onClickNuevo}>Nuevo</Button>
        ) : (
          <Button variant="outline" onClick={onCancelEdit}>
            Cerrar formulario
          </Button>
        )}
      </div>

      <Table
        items={anuncios}
        loading={loading}
        onEdit={onEdit}
        onDelete={onDelete}
      />

      {/* Modal mitad de pantalla para crear/editar anuncio */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => onCancelEdit()}
          />

          <div className="relative bg-white rounded-xl shadow-lg w-1/2 max-h-[90vh] overflow-auto">
            <div className="p-5">
              <FormAnuncio
                form={form}
                handleChange={handleChange}
                submit={submit}
                saving={saving}
                editing={editing}
                onCancelEdit={onCancelEdit}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
