import { LabelSplitModal } from "@/components/labels/LabelSplitModal";

interface CreateSplitsByLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Id del sello artístico. */
  labelId: string;
  /** Nombre del sello, para mostrarlo. */
  label: string;
  songCount: number;
  /** Canciones que ya tienen split, para avisar de que se sobrescriben. */
  alreadyWithSplit?: number;
  /** Panel de vidrio, cuando se abre desde una página ya migrada. */
  onGlass?: boolean;
}

/**
 * Reparto del porcentaje del owner en un sello artístico.
 *
 * El formulario es el mismo que el del sello personalizado, así que vive en
 * `LabelSplitModal`; aquí solo se fija el tipo de destino.
 */
export default function CreateSplitsByLabelModal({
  isOpen,
  onClose,
  labelId,
  label,
  songCount,
  alreadyWithSplit,
  onGlass = false,
}: CreateSplitsByLabelModalProps) {
  return (
    <LabelSplitModal
      isOpen={isOpen}
      onClose={onClose}
      onGlass={onGlass}
      target={{ type: "artistic", ref: labelId, name: label, songCount, alreadyWithSplit }}
    />
  );
}
