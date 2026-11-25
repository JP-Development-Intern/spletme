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
  viewIncome: true,
  viewStreams: true,
  viewCollaborators: true,
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
      onGlass
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
              ? "border-[1.5px] border-[#FF8A3D]/50 bg-[#FF5C00]/[0.14]"
              : "border border-white/[0.10] bg-white/[0.04] hover:border-white/[0.18]"
          }`}
        >
          <span
            className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-[9px] ${
              role === "collaborator" ? "bg-[#FF5C00] text-white" : "bg-white/[0.08] text-white/65"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span
              className={`text-[12.5px] font-semibold ${
                role === "collaborator" ? "text-[#FFB48A]" : "text-white"
              }`}
            >
              Colaboradores
            </span>
            <span className="text-[10.5px] text-white/55">Solo permisos de lectura</span>
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
              ? "border-[1.5px] border-[#FF8A3D]/50 bg-[#FF5C00]/[0.14]"
              : "border border-white/[0.10] bg-white/[0.04] hover:border-white/[0.18]"
          }`}
        >
          <span
            className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-[9px] ${
              role === "label" ? "bg-[#FF5C00] text-white" : "bg-white/[0.08] text-white/65"
            }`}
          >
            <Tag className="h-3.5 w-3.5" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span
              className={`text-[12.5px] font-semibold ${
                role === "label" ? "text-[#FFB48A]" : "text-white"
              }`}
            >
              Sellos
            </span>
            <span className="text-[10.5px] text-white/55">Lectura y gestión</span>
          </span>
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-center gap-2.5 rounded-[14px] border border-[#E5484D]/30 bg-[#E5484D]/[0.14] px-3.5 py-2.5 text-[12px] font-medium text-[#FF8F92]"
        >
          <TriangleAlert className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {feedback && (
        <div className="flex items-center gap-2.5 rounded-[14px] border border-[#45D39A]/25 bg-[#45D39A]/[0.12] px-3.5 py-2.5 text-[12px] font-medium text-[#45D39A]">
          <Check className="h-4 w-4 flex-shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col gap-2">
          <div className="h-[112px] animate-pulse rounded-[20px] bg-white/[0.06]" />
        </div>
      ) : (
        <div className="flex flex-col gap-4 rounded-[20px] border border-white/[0.09] bg-white/[0.04] p-4">
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
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[18px] border border-white/[0.09] bg-white/[0.04] px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-[12.5px] font-semibold text-white">Aplicar a existentes</p>
          <p className="text-[11px] text-white/60">
            Actualiza el permiso global de todos los{" "}
            {role === "label" ? "sellos" : "colaboradores"} actuales con esta plantilla.
          </p>
        </div>
        <button
          type="button"
          onClick={handleApplyToExisting}
          disabled={busy}
          className="glass-control flex flex-shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[11.5px] font-semibold text-white transition-colors enabled:hover:bg-white/[0.12] disabled:opacity-50"
        >
          {applying ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-[#FF8A3D]" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5 text-white/70" />
          )}
          {applying ? "Aplicando…" : "Aplicar a todos"}
        </button>
      </div>
    </ModalShell>,
    document.body,
  );
}