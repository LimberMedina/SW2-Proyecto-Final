// FormUsers.jsx
import React from "react";
import Button from "../components/Button";
import Input from "../components/Input";

const FormUsers = React.memo(function FormUsers({
  form,
  handleChange,
  submit,
  saving,
  editing,
  onCancelEdit,
}) {
  return (
    <form onSubmit={submit} className="grid md:grid-cols-2 gap-4">
      <Input
        label="Nombre de usuario"
        name="username"
        value={form.username || ""}
        onChange={(e) => handleChange("username", e.target.value)}
        required
        disabled={editing}
        placeholder="usuario123"
      />

      <Input
        label="Email"
        name="email"
        type="email"
        value={form.email || ""}
        onChange={(e) => handleChange("email", e.target.value)}
        required
        placeholder="usuario@ejemplo.com"
      />

      <Input
        label="Nombre"
        name="nombre"
        value={form.nombre || ""}
        onChange={(e) => handleChange("nombre", e.target.value)}
        placeholder="Juan"
      />

      <Input
        label="Apellidos"
        name="apellidos"
        value={form.apellidos || ""}
        onChange={(e) => handleChange("apellidos", e.target.value)}
        placeholder="Pérez"
      />

      {!editing && (
        <Input
          label="Contraseña"
          name="contraseña"
          type="password"
          value={form.contraseña || ""}
          onChange={(e) => handleChange("contraseña", e.target.value)}
          required={!editing}
          placeholder="Mínimo 8 caracteres"
          helperText="Mínimo 8 caracteres"
        />
      )}

      <div>
        <label className="block text-sm text-gray-700 mb-1">Rol</label>
        <select
          className="w-full border rounded-md px-3 py-2"
          value={form.rol || "USER"}
          onChange={(e) => handleChange("rol", e.target.value)}
          required
        >
          <option value="USER">Usuario</option>
          <option value="ADMIN">Administrador</option>
        </select>
      </div>

      <div className="md:col-span-1 flex items-end">
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.is_active !== false}
            onChange={(e) => handleChange("is_active", e.target.checked)}
          />
          <span className="text-sm">Cuenta activa</span>
        </label>
      </div>

      {editing && (
        <div className="md:col-span-2">
          <details className="text-sm text-gray-600">
            <summary className="cursor-pointer hover:text-gray-900">
              Cambiar contraseña (opcional)
            </summary>
            <div className="mt-2">
              <Input
                label="Nueva contraseña"
                name="contraseña"
                type="password"
                value={form.contraseña || ""}
                onChange={(e) => handleChange("contraseña", e.target.value)}
                placeholder="Dejar vacío para mantener la actual"
                helperText="Mínimo 8 caracteres. Dejar vacío para no cambiar."
              />
            </div>
          </details>
        </div>
      )}

      <div className="md:col-span-2 flex gap-2 justify-end">
        {editing && (
          <Button variant="outline" onClick={onCancelEdit} type="button">
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={saving}>
          {saving
            ? "Guardando…"
            : editing
            ? "Actualizar Usuario"
            : "Crear Usuario"}
        </Button>
      </div>
    </form>
  );
});

export default FormUsers;
