import { useEffect, useState } from "react";
import { Pencil, Check, Trash2, TriangleAlert, Loader2 } from "lucide-react";
import LabelsService, { type Label } from "@/services/labels";
import {
  ModalShell,
  FieldLabel,
  PrimaryButton,
  SecondaryButton,
  DangerButton,
} from "@/components/ui/ModalShell";
import { ArtisticLabelPicker } from "./ArtisticLabelPicker";

interface EditLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  labelId: string;
  currentName: string;
  /** Ids de los sellos artísticos que agrupa ahora. */
  currentArtisticLabelIds: string[];
  availableLabels: Label[];
  onSuccess: () => void;
  onDelete?: () => void;
  /** Abre directamente en la confirmación de borrado, desde el menú de la fila. */
  initialMode?: "edit" | "delete";
}

/**
 * Edición de un sello personalizado: el mismo formulario del alta, más el borrado.
 *
 * Eliminar vive en el pie, separado de las acciones que guardan, y su
 * confirmación aclara qué no se borra: el miedo real no es perder la agrupación,
 * es perder las canciones.
 */
export default function EditLabelModal({
  isOpen,
  onClose,
  labelId,
  currentName,
  currentArtisticLabelIds,
  availableLabels,
  onSuccess,
  onDelete,
  initialMode = "edit",
}: EditLabelModalProps) {
  const [name, setName] = useState(currentName);
  const [selected, setSelected] = useState<string[]>(currentArtisticLabelIds);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(initialMode === "delete");

  useEffect(() => {
    if (!isOpen) return;
    setName(currentName);
    setSelected(currentArtisticLabelIds);
    setError("");
    setSaved(false);
    setConfirmingDelete(initialMode === "delete");
  }, [isOpen, currentName, currentArtisticLabelIds, initialMode]);

  if (!isOpen) return null;

  const trimmed = name.trim();
  const nameInvalid = Boolean(error) && !trimmed;
  const busy = submitting || deleting;

  const nameChanged = trimmed !== currentName;
  const labelsChanged =
    [...selected].sort().join(" ") !== [...currentArtisticLabelIds].sort().join(" ");
  const hasChanges = nameChanged || labelsChanged;

  const closeDeleteView = () => {
    // Si el modal se abrió ya en la confirmación, cancelar significa cerrarlo:
    // no hay formulario detrás al que volver.
    if (initialMode === "delete") onClose();
    else setConfirmingDelete(false);
  };

  const handleSubmit = async () => {
    if (!trimmed) {
      setError("El sello necesita un nombre.");
      return;
    }
    if (selected.length === 0) {
      setError("Elige al menos un sello artístico para agrupar.");
      return;
    }
    if (!hasChanges) {
      setError("No hay cambios que guardar.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const payload: { name?: string; artisticLabelIds?: string[] } = {};
      if (nameChanged) payload.name = trimmed;
      if (labelsChanged) payload.artisticLabelIds = selected;

      const response = await LabelsService.updateLabel(labelId, payload);

      if (response.error) {
        setError(response.message ?? "Los cambios no se pudieron guardar.");
        return;
      }

      setSaved(true);
      setTimeout(onSuccess, 1000);
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError("");

    try {
      const response = await LabelsService.deleteLabel(labelId);

      if (response.error) {
        setError(response.message ?? "El sello no se pudo eliminar.");
        setConfirmingDelete(false);
        return;
      }

      onDelete?.();
      onClose();
    } catch {
      setError("No se pudo conectar con el servidor.");
      setConfirmingDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  if (saved) {
    return (
      <ModalShell title="Cambios guardados" width="lg" onGlass locked onClose={onClose}>
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <span className="flex h-[52px] w-[52px] items-center justify-center rounded-[18px] bg-[#45D39A]/[0.14]">
            <Check className="h-[22px] w-[22px] text-[#45D39A]" />
          </span>
          <h3 className="font-display text-[17px] font-medium text-white">{trimmed}</h3>
          <p className="text-[12.5px] text-white/65">
            Agrupa {selected.length} {selected.length === 1 ? "sello" : "sellos"}.
          </p>
        </div>
      </ModalShell>
    );
  }

  if (confirmingDelete) {
    return (
      <ModalShell
        title="Eliminar sello"
        width="lg"
        onGlass
        locked={deleting}
        onClose={closeDeleteView}
        footer={
          <>
            <span className="min-w-0 flex-1" />
            <SecondaryButton onClick={closeDeleteView} disabled={deleting}>
              Conservar sello
            </SecondaryButton>
            <DangerButton
              onClick={handleDelete}
              disabled={deleting}
              icon={
                deleting ? (
                  <Loader2 className="h-[14px] w-[14px] animate-spin" />
                ) : (
                  <Trash2 className="h-[14px] w-[14px]" />
                )
              }
            >
              {deleting ? "Eliminando…" : "Eliminar sello"}
            </DangerButton>
          </>
        }
      >
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <span className="flex h-[52px] w-[52px] items-center justify-center rounded-[18px] bg-[#E5484D]/[0.16]">
            <Trash2 className="h-[22px] w-[22px] text-[#FF8F92]" />
          </span>
          <h3 className="font-display text-[17px] font-medium text-white">
            ¿Eliminar «{currentName}»?
          </h3>
          <p className="max-w-[380px] text-[12.5px] leading-relaxed text-white/65">
            Se deshace la agrupación. Los {currentArtisticLabelIds.length}{" "}
            {currentArtisticLabelIds.length === 1 ? "sello artístico" : "sellos artísticos"} que
            reúne, sus canciones y sus splits siguen intactos.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-2xl border border-[#E5484D]/30 bg-[#E5484D]/[0.12] px-4 py-3"
          >
            <TriangleAlert className="mt-px h-4 w-4 flex-shrink-0 text-[#FF8F92]" />
            <span className="text-[12.5px] text-[#FF8F92]">{error}</span>
          </div>
        )}
      </ModalShell>
    );
  }

  return (
    <ModalShell
      title="Editar sello"
      subtitle={`${currentArtisticLabelIds.length} ${
        currentArtisticLabelIds.length === 1 ? "sello agrupado" : "sellos agrupados"
      }`}
      width="lg"
      onGlass
      locked={busy}
      onClose={onClose}
      logo={
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[14px] bg-[#FF5C00]/[0.16]">
          <Pencil className="h-[18px] w-[18px] text-[#FF8A3D]" />
        </span>
      }
      footer={
        <>
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            disabled={busy}
            className="flex min-w-0 flex-1 items-center gap-1.5 rounded-full text-left text-[12.5px] font-semibold text-[#FF8F92] transition-colors enabled:hover:text-[#FFB3B5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8F92]/70 disabled:opacity-50"
          >
            <Trash2 className="h-[14px] w-[14px] flex-shrink-0" />
            Eliminar sello
          </button>
          <SecondaryButton onClick={onClose} disabled={busy}>
            Cancelar
          </SecondaryButton>
          <PrimaryButton
            onClick={handleSubmit}
            disabled={busy || !hasChanges}
            icon={
              submitting ? (
                <Loader2 className="h-[14px] w-[14px] animate-spin" />
              ) : (
                <Check className="h-[14px] w-[14px]" />
              )
            }
          >
            {submitting ? "Guardando…" : "Guardar cambios"}
          </PrimaryButton>
        </>
      }
    >
      <label className="flex flex-col gap-2">
        <FieldLabel required invalid={nameInvalid}>
          NOMBRE DEL SELLO
        </FieldLabel>
        <input
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError("");
          }}
          disabled={busy}
          placeholder="Mis Éxitos 2024"
          className={`w-full rounded-2xl border px-4 py-3 text-[13.5px] font-medium text-white placeholder:font-normal placeholder:text-white/40 transition-colors focus:outline-none focus:ring-[3px] disabled:opacity-50 ${
            nameInvalid
              ? "border-[1.5px] border-[#FF8F92] bg-[#E5484D]/[0.12] focus:border-[#FF8F92] focus:ring-[#E5484D]/25"
              : "border-white/[0.14] bg-white/[0.06] focus:border-[#FF8A3D] focus:ring-[#FF5C00]/25"
          }`}
        />
      </label>

      <ArtisticLabelPicker
        availableLabels={availableLabels}
        selected={selected}
        disabled={busy}
        onChange={(next) => {
          setSelected(next);
          if (error) setError("");
        }}
      />

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-2xl border border-[#E5484D]/30 bg-[#E5484D]/[0.12] px-4 py-3"
        >
          <TriangleAlert className="mt-px h-4 w-4 flex-shrink-0 text-[#FF8F92]" />
          <span className="text-[12.5px] text-[#FF8F92]">{error}</span>
        </div>
      )}
    </ModalShell>
  );
}
