import { LabelSplitModal } from "@/components/labels/LabelSplitModal";

interface CreateSplitsByCustomLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  labelName: string;
  /** Sellos artísticos que agrupa. El servidor los resuelve por el nombre del sello. */
  artisticLabels?: string[];
  songCount: number;
  /** Canciones que ya tienen split, para avisar de que se sobrescriben. */
  alreadyWithSplit?: number;
  /** Panel de vidrio, cuando se abre desde una página ya migrada. */
  onGlass?: boolean;
}

/**
 * Reparto del porcentaje del owner en un sello personalizado: alcanza a las
 * canciones de todos los sellos artísticos que agrupa.
 *
 * Comparte formulario con el sello artístico; aquí solo se fija el destino.
 */
export default function CreateSplitsByCustomLabelModal({
  isOpen,
  onClose,
  labelName,
  songCount,
  alreadyWithSplit,
  onGlass = false,
}: CreateSplitsByCustomLabelModalProps) {
  return (
    <LabelSplitModal
      isOpen={isOpen}
      onClose={onClose}
      onGlass={onGlass}
      target={{ type: "custom", ref: labelName, name: labelName, songCount, alreadyWithSplit }}
    />
  );
}
