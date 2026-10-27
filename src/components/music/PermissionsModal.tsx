import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, ShieldCheck, Loader2 } from "lucide-react";
import { PermissionsService } from "@/services/permissions";
import type {
  PermissionGrantKey,
  PermissionGrantee,
  PermissionResourceType,
} from "@/types/permissions.types";

interface PermissionsModalProps {
  resourceType: PermissionResourceType;
  /** `_id` de la canción, o UPC del álbum. */
  resourceId: string;
  title: string;
  onClose: () => void;
}

const VIEW_OPTIONS: { key: PermissionGrantKey; label: string }[] = [
  { key: "viewIncome", label: "Ver ingresos" },
  { key: "viewStreams", label: "Ver streams" },
  { key: "viewCollaborators", label: "Ver colaboradores" },
  { key: "viewDocuments", label: "Ver documentos" },
];

/** Solo se muestran en filas de label: a un colaborador nunca se le conceden. */
const LABEL_OPTIONS: { key: PermissionGrantKey; label: string }[] = [
  { key: "canEditSplits", label: "Editar splits" },
  { key: "canInviteCollaborators", label: "Invitar colaboradores" },
  { key: "canViewOwnerData", label: "Ver datos del owner" },
];

/**
 * Permisos que el owner da a cada colaborador y label sobre una canción o un
 * álbum. Cada interruptor se guarda al pulsarlo; si el servidor lo rechaza, el
 * interruptor vuelve a como estaba.
 */
export function PermissionsModal({ resourceType, resourceId, title, onClose }: PermissionsModalProps) {
  const [grantees, setGrantees] = useState<PermissionGrantee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    PermissionsService.list(resourceType, resourceId)
      .then((data) => !cancelled && setGrantees(data))
      .catch(() => !cancelled && setError("No se pudieron cargar los permisos."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [resourceType, resourceId]);

  const toggle = async (grantee: PermissionGrantee, key: PermissionGrantKey) => {
    const next = !grantee.grants[key];
    const apply = (value: boolean) =>
      setGrantees((current) =>
        current.map((g) =>
          g.userId === grantee.userId ? { ...g, grants: { ...g.grants, [key]: value } } : g,
        ),
      );

    setError(null);
    apply(next);
    try {
      await PermissionsService.set(resourceType, resourceId, grantee.userId, { [key]: next });
    } catch {
      apply(!next);
      setError("No se pudo guardar el cambio.");
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-label={`Permisos de ${title}`}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-[560px] flex-col overflow-hidden rounded-[26px] bg-white shadow-xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#E8E8EC] px-6 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#FFEADD] text-[#FF5C00]">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h2 className="font-display text-base font-semibold text-[#1C1D22]">Permisos</h2>
              <p className="truncate text-[12px] text-[#71757E]">{title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#A6AAB2] transition-colors hover:bg-[#F4F5F7] hover:text-[#1C1D22]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col gap-4 overflow-y-auto px-6 py-4">
          {error && <p className="text-[12px] font-semibold text-[#E5484D]">{error}</p>}

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-[#A6AAB2]" />
            </div>
          ) : grantees.length === 0 ? (
            <p className="py-6 text-center text-[12.5px] text-[#71757E]">
              Todavía no hay colaboradores ni sellos con acceso a esto.
            </p>
          ) : (
            grantees.map((grantee) => (
              <section key={grantee.userId} className="rounded-[18px] border border-[#E8E8EC] p-4">
                <header className="mb-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-[#1C1D22]">
                      {grantee.name}
                    </p>
                    <p className="truncate text-[11px] text-[#A6AAB2]">{grantee.email}</p>
                  </div>
                  <span className="flex-shrink-0 rounded-full bg-[#F4F5F7] px-2.5 py-1 font-mono text-[9.5px] font-medium tracking-[1.2px] text-[#71757E]">
                    {grantee.role === "label" ? "SELLO" : "COLABORADOR"}
                  </span>
                </header>

                <div className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                  {[...VIEW_OPTIONS, ...(grantee.role === "label" ? LABEL_OPTIONS : [])].map(
                    ({ key, label }) => (
                      <label
                        key={key}
                        className="flex cursor-pointer items-center justify-between gap-3 text-[12.5px] text-[#1C1D22]"
                      >
                        {label}
                        <input
                          type="checkbox"
                          role="switch"
                          checked={grantee.grants[key]}
                          onChange={() => toggle(grantee, key)}
                          className="h-4 w-4 accent-[#FF5C00]"
                        />
                      </label>
                    ),
                  )}
                </div>
              </section>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
