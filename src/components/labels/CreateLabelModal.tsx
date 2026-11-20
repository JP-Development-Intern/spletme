import { useEffect, useState } from "react";
import { Layers, Check, TriangleAlert, Loader2 } from "lucide-react";
import LabelsService, { type Label } from "@/services/labels";
import { ModalShell, FieldLabel, PrimaryButton, SecondaryButton } from "@/components/ui/ModalShell";
import { ArtisticLabelPicker } from "./ArtisticLabelPicker";

interface CreateLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableLabels: Label[];
  onSuccess: () => void;
}

/**
 * Alta de un sello personalizado: un nombre y los sellos artísticos que agrupa.
 *
 * Agrupar no mueve ni duplica canciones, solo crea un atajo para repartirlas de
 * una vez; el pie lo dice porque es la duda que frena a quien lo usa por primera
 * vez.
 */
export default function CreateLabelModal({
  isOpen,
  onClose,
  availableLabels,
  onSuccess,
}: CreateLabelModalProps) {
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setName("");
    setSelected([]);
    setError("");
    setCreated(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const trimmed = name.trim();
  const nameInvalid = Boolean(error) && !trimmed;

  const handleSubmit = async () => {
    if (!trimmed) {
      setError("Ponle un nombre al sello para poder crearlo.");
      return;
    }
    if (selected.length === 0) {
      setError("Elige al menos un sello artístico para agrupar.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await LabelsService.createLabel({
        name: trimmed,
        artisticLabelIds: selected,
      });

      if (response.error) {
        setError(response.message ?? "El sello no se pudo crear.");
        return;
      }

      setCreated(true);
      onSuccess();
      // Deja ver la confirmación antes de devolver el control a la lista.
      setTimeout(onClose, 1200);
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setSubmitting(false);
    }
  };

  if (created) {
    return (
      <ModalShell title="Sello creado" width="lg" onGlass locked onClose={onClose}>
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <span className="flex h-[52px] w-[52px] items-center justify-center rounded-[18px] bg-[#45D39A]/[0.14]">
            <Check className="h-[22px] w-[22px] text-[#45D39A]" />
          </span>
          <h3 className="font-display text-[17px] font-medium text-white">«{trimmed}»</h3>
          <p className="max-w-[360px] text-[12.5px] leading-relaxed text-white/65">
            Agrupa {selected.length} {selected.length === 1 ? "sello" : "sellos"}. Ya puedes
            repartir sus canciones de una sola vez.
          </p>
        </div>
      </ModalShell>
    );
  }

  return (
    <ModalShell
      title="Nuevo sello personalizado"
      subtitle="Agrupa varios sellos artísticos para repartir splits de una sola vez"
      width="lg"
      onGlass
      locked={submitting}
      onClose={onClose}
      logo={
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[14px] bg-[#FF5C00]">
          <Layers className="h-[18px] w-[18px] text-white" />
        </span>
      }
      footer={
        <>
          <span className="min-w-0 flex-1 text-[11px] text-white/50">
            El sello agrupa canciones; no las mueve ni las duplica.
          </span>
          <SecondaryButton onClick={onClose} disabled={submitting}>
            Cancelar
          </SecondaryButton>
          <PrimaryButton
            onClick={handleSubmit}
            disabled={submitting}
            icon={
              submitting ? (
                <Loader2 className="h-[14px] w-[14px] animate-spin" />
              ) : (
                <Check className="h-[14px] w-[14px]" />
              )
            }
          >
            {submitting ? "Creando…" : "Crear sello"}
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
          autoFocus
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError("");
          }}
          disabled={submitting}
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
        disabled={submitting}
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
