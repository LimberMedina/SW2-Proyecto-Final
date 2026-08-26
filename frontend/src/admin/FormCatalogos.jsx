import React from "react";
import Input from "../components/Input";
import Button from "../components/Button";

const FormCatalogos = React.memo(function FormCatalogos({
  form,
  handleChange,
  submit,
  saving,
  editing,
  onCancelEdit,
}) {
  return (
    <form onSubmit={submit} className="grid md:grid-cols-5 gap-3">
      <Input
        label="Nombre"
        name="nombre"
        value={form.nombre || ""}
        onChange={(e) => handleChange("nombre", e.target.value)}
        required
      />
      <div>
        <label className="block text-sm text-gray-700 mb-1">Tipo *</label>
        <select
          className="w-full border rounded-md px-3 py-2"
          value={form.tipo || "DIGITAL"}
          onChange={(e) => handleChange("tipo", e.target.value)}
          required
        >
          <option value="DIGITAL">Digital</option>
          <option value="FISICO">Físico</option>
        </select>
      </div>
      <div className="md:col-span-2">
        <label className="block text-sm text-gray-700 mb-1">Descripción</label>
        <textarea
          value={form.descripcion || ""}
          onChange={(e) => handleChange("descripcion", e.target.value)}
          className="w-full border rounded-md px-3 py-2"
          rows={1}
        />
      </div>
      <div className="flex items-end">
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

export default FormCatalogos;
