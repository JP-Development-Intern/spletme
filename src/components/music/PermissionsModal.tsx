import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ShieldCheck, TriangleAlert, Users } from "lucide-react";
import { PermissionsService } from "@/services/permissions";
import {
  FieldLabel,
  FooterNote,
  ModalMark,
  ModalShell,
  PrimaryButton,
} from "@/components/ui/ModalShell";
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

function getInitials(name: string, email: string) {
  const source = (name || email || "?").trim();
  const parts = source.split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

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
    const apply = (value: boolean, prevExplicit?: Partial<PermissionGrants>) =>
      setGrantees((current) =>
        current.map((g) => {
          if (g.userId !== grantee.userId) return g;
          return {
            ...g,
            grants: { ...g.grants, [key]: value },
            ...(g.explicit
              ? { explicit: prevExplicit ?? { ...g.explicit, [key]: value } }
              : {}),
          };
        }),
      );

    const previousExplicit = grantee.explicit ? { ...grantee.explicit } : undefined;
    setError(null);
    apply(next);
    try {
      await PermissionsService.set(resourceType, resourceId, grantee.userId, { [key]: next });
    } catch {
      apply(!next, previousExplicit);
      setError("No se pudo guardar el cambio.");
    }
  };

  return createPortal(
    <ModalShell
      title="Permisos de acceso"
      subtitle={title}
      width="lg"
      onClose={onClose}
      logo={
        <ModalMark tone="accent">
          <ShieldCheck className="h-[19px] w-[19px]" />
        </ModalMark>
      }
      footer={
        <>
          <FooterNote>Cada cambio se guarda automáticamente al instante.</FooterNote>
          <PrimaryButton onClick={onClose}>Listo</PrimaryButton>
        </>
      }
    >
      {error && (
        <div
          role="alert"
          className="flex items-center gap-2.5 rounded-[14px] border border-[#F5C2C4] bg-[#FDECEC] px-3.5 py-2.5 text-[12px] font-medium text-[#E5484D]"
        >
          <TriangleAlert className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col gap-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-[156px] animate-pulse rounded-[20px] bg-[#F4F5F7]" />
          ))}
        </div>
      ) : grantees.length === 0 ? (
        <div className="flex flex-col items-center gap-2.5 rounded-[20px] bg-[#F4F5F7]/70 px-6 py-10 text-center">
          <ModalMark tone="neutral">
            <Users className="h-[18px] w-[18px]" />
          </ModalMark>
          <p className="text-[13.5px] font-semibold text-[#1C1D22]">
            Sin colaboradores ni sellos todavía
          </p>
          <p className="max-w-[320px] text-[12px] leading-relaxed text-[#71757E]">
            Cuando invites y acepten participar aquí, podrás controlar qué información puede ver
            cada uno.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3.5">
          {grantees.map((grantee) => {
            const isLabel = grantee.role === "label";
            return (
              <section
                key={grantee.userId}
                className="flex flex-col gap-3.5 rounded-[20px] border border-[#E8E8EC] bg-[#F8F9FA] p-4"
              >
                <header className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[12px] font-display text-[12px] font-semibold ${
                        isLabel
                          ? "bg-[#FFEADD] text-[#FF5C00]"
                          : "bg-white text-[#1C1D22] ring-1 ring-[#E8E8EC]"
                      }`}
                    >
                      {getInitials(grantee.name, grantee.email)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-[#1C1D22]">
                        {grantee.name}
                      </p>
                      <p className="truncate text-[11px] text-[#71757E]">{grantee.email}</p>
                    </div>
                  </div>
                  <span
                    className={`flex-shrink-0 rounded-full px-2.5 py-1 font-mono text-[9.5px] font-semibold tracking-[1.1px] ${
                      isLabel
                        ? "bg-[#FFEADD] text-[#EA580C]"
                        : "border border-[#E8E8EC] bg-white text-[#71757E]"
                    }`}
                  >
                    {isLabel ? "SELLO" : "COLABORADOR"}
                  </span>
                </header>

                <div className="flex flex-col gap-2">
                  <FieldLabel>PERMISOS DE LECTURA</FieldLabel>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {VIEW_OPTIONS.map(({ key, label }) => (
                      <SwitchTile
                        key={key}
                        label={label}
                        checked={Boolean(grantee.grants[key])}
                        inherited={
                          resourceType !== "all" && grantee.explicit
                            ? grantee.explicit[key] === undefined
                            : undefined
                        }
                        onChange={() => toggle(grantee, key)}
                      />
                    ))}
                  </div>
                </div>

                {isLabel && (
                  <div className="flex flex-col gap-2">
                    <FieldLabel>GESTIÓN DEL SELLO</FieldLabel>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {LABEL_OPTIONS.map(({ key, label }) => (
                        <SwitchTile
                          key={key}
                          label={label}
                          checked={Boolean(grantee.grants[key])}
                          inherited={
                            resourceType !== "all" && grantee.explicit
                              ? grantee.explicit[key] === undefined
                              : undefined
                          }
                          onChange={() => toggle(grantee, key)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </ModalShell>,
    document.body,
  );
}

export function SwitchTile({
  label,
  checked,
  inherited,
  disabled,
  onChange,
}: {
  label: string;
  checked: boolean;
  /** Cuando viene definido, indica si el valor es heredado o fijado en este nivel. */
  inherited?: boolean;
  disabled?: boolean;
  onChange: () => void;
}) {
  return (
    <label
      className={`flex items-center justify-between gap-3 rounded-[14px] border px-3 py-2.5 transition-all ${
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
      } ${
        checked
          ? "border-[#FF5C00]/35 bg-[#FFF8F3] shadow-[0_1px_4px_rgba(255,92,0,0.08)]"
          : "border-[#E8E8EC] bg-white hover:border-[#D9DAE0]"
      }`}
    >
      <span className="flex min-w-0 flex-col gap-0.5">
        <span
          className={`truncate text-[12px] font-medium ${checked ? "text-[#1C1D22]" : "text-[#71757E]"}`}
        >
          {label}
        </span>
        {inherited !== undefined && (
          <span
            className={`font-mono text-[9.5px] ${
              inherited ? "text-[#A6AAB2]" : "text-[#FF5C00]"
            }`}
          >
            {inherited ? "Heredado" : "Personalizado"}
          </span>
        )}
      </span>
      <span className="relative inline-flex flex-shrink-0 items-center">
        <input
          type="checkbox"
          role="switch"
          checked={checked}
          disabled={disabled}
          onChange={onChange}
          className="sr-only"
        />
        <span
          aria-hidden="true"
          className={`flex h-5 w-9 items-center rounded-full p-0.5 transition-colors ${
            checked ? "bg-[#FF5C00]" : "bg-[#D9DAE0]"
          }`}
        >
          <span
            className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
              checked ? "translate-x-4" : "translate-x-0"
            }`}
          />
        </span>
      </span>
    </label>
  );
}
