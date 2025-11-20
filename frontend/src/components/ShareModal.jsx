import React, { useState } from "react";

export default function ShareModal({ open, onClose }) {
  // Simple modal: sólo un mensaje bonito y se cierra automáticamente
  if (!open) return null;

  // auto-close after short delay
  setTimeout(() => {
    try {
      onClose && onClose();
    } catch (e) {}
  }, 1400);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-[92%] mx-auto p-6 text-center z-10 pointer-events-auto">
        <div className="mb-1">
          <h3 className="text-lg font-semibold text-gray-900">
            Enlace copiado exitosamente
          </h3>
        </div>
        <div className="mt-3 text-sm text-gray-600">
          Puedes pegarlo donde necesites.
        </div>
      </div>
    </div>
  );
}
