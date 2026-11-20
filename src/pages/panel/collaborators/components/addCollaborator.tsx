import { useState } from "react";
import { X, Plus, UserPlus, Mail, Hash, UserCog } from "lucide-react";
import SongService from "../../../../services/songs";
import { useParams } from "react-router-dom";

export default function AddCollaborator({
  compact = false,
  isOwner = true,
}: {
  compact?: boolean;
  isOwner?: boolean;
}) {
  const { id } = useParams();
  const [showCollaboratorsModal, setShowCollaboratorsModal] = useState(false);
  const [method, setMethod] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [role, setRole] = useState("");

  const addNewCollaborator = async () => {
    // Prepare the request payload based on the method
    const requestPayload = {
      songId: id || "",
      ...(method === "email" ? { collaboratorEmail: email } : { collaboratorId: code }),
    };

    const response = await SongService.addCollaborator(requestPayload);

    if (response.success) {
      resetForm();
    } else {
      alert(response.message);
    }
  };

  const resetForm = () => {
    setShowCollaboratorsModal(false);
    setEmail("");
    setCode("");
    setRole("");
  };

  return (
    <>
      {/* Modal */}
      {isOwner && showCollaboratorsModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowCollaboratorsModal(false)}
        >
          <div
            className="mx-4 w-full max-w-md overflow-hidden rounded-xl border border-gray-200 bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-orange-50 p-2">
                  <UserPlus className="h-4 w-4 text-[#F97316]" />
                </div>
                <h3 className="text-base font-bold text-gray-900">Añadir colaborador</h3>
              </div>
              <button
                className="rounded-lg p-1.5 transition-colors hover:bg-gray-100"
                onClick={() => setShowCollaboratorsModal(false)}
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>

            {/* Body */}
            <div className="space-y-5 p-6">
              <p className="text-sm text-gray-500">
                Elige cómo quieres agregar al colaborador al proyecto.
              </p>

              {/* Method toggle */}
              <div className="flex gap-3">
                <button
                  className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                    method === "email"
                      ? "border-orange-200 bg-orange-50 text-[#F97316]"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                  onClick={() => setMethod("email")}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Mail className="h-4 w-4" />
                    Por correo
                  </div>
                </button>
                <button
                  className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                    method === "code"
                      ? "border-orange-200 bg-orange-50 text-[#F97316]"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                  onClick={() => setMethod("code")}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Hash className="h-4 w-4" />
                    Por código
                  </div>
                </button>
              </div>

              {/* Inputs */}
              <div className="space-y-3">
                {method === "email" ? (
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Mail className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      type="email"
                      placeholder="Correo electrónico"
                      className="w-full rounded-lg border border-gray-200 py-2.5 pl-9 pr-4 text-sm outline-none transition-all focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                    />
                  </div>
                ) : (
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Hash className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="Código de usuario"
                      className="w-full rounded-lg border border-gray-200 py-2.5 pl-9 pr-4 text-sm outline-none transition-all focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                    />
                  </div>
                )}
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <UserCog className="h-4 w-4 text-gray-400" />
                  </div>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full appearance-none rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm text-gray-700 outline-none transition-all focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  >
                    <option value="" disabled>
                      Seleccionar rol
                    </option>
                    <option value="singer">Cantante</option>
                    <option value="composer">Compositor</option>
                    <option value="musician">Músico</option>
                    <option value="producer">Productor</option>
                    <option value="arranger">Arreglista</option>
                    <option value="lyricist">Letrista</option>
                    <option value="mixer">Mezclador</option>
                    <option value="mastering">Mastering</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
              <button
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
                onClick={() => setShowCollaboratorsModal(false)}
              >
                Cancelar
              </button>
              <button
                className="flex items-center gap-2 rounded-lg bg-[#F97316] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
                onClick={() => addNewCollaborator()}
              >
                <UserPlus className="h-4 w-4" />
                Añadir colaborador
              </button>
            </div>
          </div>
        </div>
      )}

      {compact
        ? isOwner && (
            <button
              onClick={() => setShowCollaboratorsModal(true)}
              className="flex items-center gap-2 rounded-full bg-[#FF5C00] px-4 py-2.5 text-[12.5px] font-semibold text-white shadow-[0_8px_20px_-6px_rgba(255,92,0,0.35)] transition-colors hover:bg-[#EA580C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              <Plus className="h-[15px] w-[15px]" />
              Agregar colaborador
            </button>
          )
        : isOwner && (
            <button
              className="col-span-3 row-span-1 flex w-full items-center justify-center gap-4 rounded-xl border border-gray-200 bg-white p-5 transition-colors hover:bg-gray-50"
              onClick={() => setShowCollaboratorsModal(true)}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50">
                <Plus className="h-6 w-6 text-[#F97316]" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-lg font-semibold text-gray-900">Agregar</span>
                <span className="text-sm text-gray-500">Nuevo colaborador</span>
              </div>
            </button>
          )}
    </>
  );
}
