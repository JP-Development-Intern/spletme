import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Loader2, RefreshCw, SlidersHorizontal, Tag, TriangleAlert, Users } from "lucide-react";
import { PermissionsService } from "@/services/permissions";
import { SwitchTile } from "@/components/music/PermissionsModal";
import {
  FieldLabel,
  FooterNote,
  ModalMark,
  ModalShell,
  PrimaryButton,
  SecondaryButton,
} from "@/components/ui/ModalShell";
import type {
  GranteeRole,
  PermissionGrantKey,
  PermissionGrants,
} from "@/types/permissions.types";

interface PermissionsDefaultsModalProps {
  onClose: () => void;
}

const VIEW_OPTIONS: { key: PermissionGrantKey; label: string }[] = [
  { key: "viewIncome", label: "Ver ingresos" },
  { key: "viewStreams", label: "Ver streams" },
  { key: "viewCollaborators", label: "Ver colaboradores" },
  { key: "viewDocuments", label: "Ver documentos" },
];

const LABEL_OPTIONS: { key: PermissionGrantKey; label: string }[] = [
  { key: "canEditSplits", label: "Editar splits" },
  { key: "canInviteCollaborators", label: "Invitar colaboradores" },
  { key: "canViewOwnerData", label: "Ver datos del owner" },
];

const EMPTY_GRANTS: PermissionGrants = {
  viewIncome: false,
  viewStreams: false,
  viewCollaborators: false,
  viewDocuments: false,
  canEditSplits: false,
  canInviteCollaborators: false,
  canViewOwnerData: false,
};

/**
 * Plantilla general de permisos por defecto del owner para nuevos invitados
 * (`collaborator` y `label`), con opción de propagar a los existentes.
 */
export function PermissionsDefaultsModal({ onClose }: PermissionsDefaultsModalProps) {
  const [role, setRole] = useState<GranteeRole>("collaborator");
  const [grants, setGrants] = useState<PermissionGrants>(EMPTY_GRANTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setFeedback(null);

    PermissionsService.getDefaults(role)
      .then((data) => {
        if (!cancelled) setGrants({ ...EMPTY_GRANTS, ...data });
      })
      .catch(() => {
        if (!cancelled) setError("No se pudo cargar la plantilla de permisos.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [role]);

  const toggle = (key: PermissionGrantKey) => {
    setFeedback(null);
    setError(null);
    setGrants((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const payloadForRole = (currentRole: GranteeRole, currentGrants: PermissionGrants): Partial<PermissionGrants> => {
    const base: Partial<PermissionGrants> = {
      viewIncome: currentGrants.viewIncome,
      viewStreams: currentGrants.viewStreams,
      viewCollaborators: currentGrants.viewCollaborators,
      viewDocuments: currentGrants.viewDocuments,
    };
    if (currentRole === "label") {
      base.canEditSplits = currentGrants.canEditSplits;
      base.canInviteCollaborators = currentGrants.canInviteCollaborators;
      base.canViewOwnerData = currentGrants.canViewOwnerData;
    }
    return base;
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setFeedback(null);
    try {
      const updated = await PermissionsService.setDefaults(role, payloadForRole(role, grants));
      setGrants({ ...EMPTY_GRANTS, ...updated });
      setFeedback("Plantilla guardada para próximas invitaciones.");
    } catch {
      setError("No se pudo guardar la plantilla.");
    } finally {
      setSaving(false);
    }
  };

  const handleApplyToExisting = async () => {
    setApplying(true);
    setError(null);
    setFeedback(null);
    try {
      await PermissionsService.setDefaults(role, payloadForRole(role, grants));
      await PermissionsService.applyDefaults(role);
      setFeedback(
        role === "label"
          ? "Plantilla aplicada al nivel global de todos los sellos actuales."
          : "Plantilla aplicada al nivel global de todos los colaboradores actuales.",
      );
    } catch {
      setError("No se pudo aplicar la plantilla a los usuarios existentes.");
    } finally {
      setApplying(false);
    }
  };

  const busy = loading || saving || applying;

  return createPortal(
    <ModalShell
      title="Plantilla de permisos"
      subtitle="Define qué podrán ver y hacer por defecto los nuevos invitados"
      width="lg"
      locked={saving || applying}
      onClose={onClose}
      logo={
        <ModalMark tone="accent">
          <SlidersHorizontal className="h-[19px] w-[19px]" />
        </ModalMark>
      }
      footer={
        <>
          <FooterNote>Se aplica automáticamente al aceptar nuevas invitaciones.</FooterNote>
          <SecondaryButton onClick={onClose} disabled={saving || applying}>
            Cerrar
          </SecondaryButton>
          <PrimaryButton onClick={handleSave} disabled={busy}>
            {saving ? "Guardando…" : "Guardar plantilla"}
          </PrimaryButton>
        </>
      }
    >
      {/* Selector de rol */}
      <div className="grid grid-cols-2 gap-2.5" role="tablist" aria-label="Rol de la plantilla">
        <button
          type="button"
          role="tab"
          aria-selected={role === "collaborator"}
          disabled={saving || applying}
          onClick={() => setRole("collaborator")}
          className={`flex items-center gap-2.5 rounded-2xl px-4 py-3 text-left transition-colors ${
            role === "collaborator"
              ? "border-[1.5px] border-[#FF5C00] bg-[#FFEADD]"
              : "border border-[#E8E8EC] bg-white hover:border-[#D9DAE0]"
          }`}
        >
          <span
            className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-[9px] ${
              role === "collaborator" ? "bg-[#FF5C00] text-white" : "bg-[#F4F5F7] text-[#71757E]"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span
              className={`text-[12.5px] font-semibold ${
                role === "collaborator" ? "text-[#EA580C]" : "text-[#1C1D22]"
              }`}
            >
              Colaboradores
            </span>
            <span className="text-[10.5px] text-[#71757E]">Solo permisos de lectura</span>
          </span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={role === "label"}
          disabled={saving || applying}
          onClick={() => setRole("label")}
          className={`flex items-center gap-2.5 rounded-2xl px-4 py-3 text-left transition-colors ${
            role === "label"
              ? "border-[1.5px] border-[#FF5C00] bg-[#FFEADD]"
              : "border border-[#E8E8EC] bg-white hover:border-[#D9DAE0]"
          }`}
        >
          <span
            className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-[9px] ${
              role === "label" ? "bg-[#FF5C00] text-white" : "bg-[#F4F5F7] text-[#71757E]"
            }`}
          >
            <Tag className="h-3.5 w-3.5" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span
              className={`text-[12.5px] font-semibold ${
                role === "label" ? "text-[#EA580C]" : "text-[#1C1D22]"
              }`}
            >
              Sellos
            </span>
            <span className="text-[10.5px] text-[#71757E]">Lectura y gestión</span>
          </span>
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-center gap-2.5 rounded-[14px] border border-[#F5C2C4] bg-[#FDECEC] px-3.5 py-2.5 text-[12px] font-medium text-[#E5484D]"
        >
          <TriangleAlert className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {feedback && (
        <div className="flex items-center gap-2.5 rounded-[14px] bg-[#E4F5EC] px-3.5 py-2.5 text-[12px] font-medium text-[#1F7D58]">
          <Check className="h-4 w-4 flex-shrink-0 text-[#2FB37E]" />
          <span>{feedback}</span>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col gap-2">
          <div className="h-[112px] animate-pulse rounded-[20px] bg-[#F4F5F7]" />
        </div>
      ) : (
        <div className="flex flex-col gap-4 rounded-[20px] border border-[#E8E8EC] bg-[#F8F9FA] p-4">
          <div className="flex flex-col gap-2">
            <FieldLabel>PERMISOS DE LECTURA</FieldLabel>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {VIEW_OPTIONS.map(({ key, label }) => (
                <SwitchTile
                  key={key}
                  label={label}
                  checked={Boolean(grants[key])}
                  disabled={saving || applying}
                  onChange={() => toggle(key)}
                />
              ))}
            </div>
          </div>

          {role === "label" && (
            <div className="flex flex-col gap-2">
              <FieldLabel>GESTIÓN DEL SELLO</FieldLabel>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {LABEL_OPTIONS.map(({ key, label }) => (
                  <SwitchTile
                    key={key}
                    label={label}
                    checked={Boolean(grants[key])}
                    disabled={saving || applying}
                    onChange={() => toggle(key)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Propagar a existentes */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[18px] border border-[#E8E8EC] bg-white px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-[12.5px] font-semibold text-[#1C1D22]">Aplicar a existentes</p>
          <p className="text-[11px] text-[#71757E]">
            Actualiza el permiso global de todos los{" "}
            {role === "label" ? "sellos" : "colaboradores"} actuales con esta plantilla.
          </p>
        </div>
        <button
          type="button"
          onClick={handleApplyToExisting}
          disabled={busy}
          className="flex flex-shrink-0 items-center gap-1.5 rounded-full border border-[#E8E8EC] bg-[#F4F5F7] px-3.5 py-2 text-[11.5px] font-semibold text-[#1C1D22] transition-colors enabled:hover:bg-[#E8E8EC] disabled:opacity-50"
        >
          {applying ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5 text-[#71757E]" />
          )}
          {applying ? "Aplicando…" : "Aplicar a todos"}
        </button>
      </div>
    </ModalShell>,
    document.body,
  );
}