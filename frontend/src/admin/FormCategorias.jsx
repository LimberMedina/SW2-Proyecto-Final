import React from "react";
import Input from "../components/Input";
import Button from "../components/Button";

const FormCategorias = React.memo(function FormCategorias({
  form,
  handleChange,
  submit,
  saving,
  editing,
  onCancelEdit,
  catalogos,
}) {
  return (
    <form onSubmit={submit} className="grid md:grid-cols-5 gap-3">
      <Input
        label="Código"
        name="codigo"
        value={form.codigo || ""}
        onChange={(e) => handleChange("codigo", e.target.value)}
        required
      />
      <Input
        label="Nombre"
        name="nombre"
        value={form.nombre || ""}
        onChange={(e) => handleChange("nombre", e.target.value)}
        required
      />
      <div className="md:col-span-2">
        <label className="block text-sm text-gray-700 mb-1">Catálogo</label>
        <select
          className="w-full border rounded-md px-3 py-2"
          value={form.catalogo || ""}
          onChange={(e) => handleChange("catalogo", e.target.value)}
          required
        >
          <option value="">Seleccione…</option>
          {catalogos.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
      </div>
      <div className="md:col-span-5">
        <label className="block text-sm text-gray-700 mb-1">Descripción</label>
        <textarea
          value={form.descripcion || ""}
          onChange={(e) => handleChange("descripcion", e.target.value)}
          className="w-full border rounded-md px-3 py-2"
          rows={1}
        />
      </div>
      <div className="md:col-span-5 flex items-center gap-4">
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!form.activo}
            onChange={(e) => handleChange("activo", e.target.checked)}
          />
          <span>Activo</span>
        </label>
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

export default FormCategorias;
