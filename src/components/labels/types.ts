import type { Label, LabelCollaborator } from "@/services/labels";

/**
 * Cobertura de splits de un sello: cuántas de sus canciones ya tienen repartido
 * el porcentaje del owner.
 *
 * Es el dato que decide qué hacer con un sello, así que se calcula una sola vez
 * y viaja con él a la lista, a la consola de métricas y al detalle.
 */
export interface SplitCoverage {
  /** Canciones del sello consideradas para el reparto. */
  total: number;
  withSplits: number;
  /** 0-100. Un sello sin canciones cuenta como 0, no como completo. */
  percentage: number;
  complete: boolean;
  /**
   * `true` cuando el porcentaje se dedujo sumando los sellos artísticos que
   * agrupa, porque el servidor no envía `splitProgress` de los personalizados.
   */
  derived: boolean;
}

/** Un sello ya normalizado, sea artístico o personalizado. */
export interface LabelListItem {
  /** Nombre del sello, para mostrarlo. */
  name: string;
  isCustom: boolean;
  /**
   * Id del sello: el de `artistic_labels` en los artísticos y el propio en los
   * personalizados. Es lo que lo identifica en URLs y peticiones.
   */
  id: string;
  /** Nombres de los sellos artísticos que agrupa, para mostrarlos. Vacío en los artísticos. */
  artisticLabels: string[];
  /** Ids de esos mismos sellos: lo que se edita y lo que decide sus canciones. */
  artisticLabelIds: string[];
  songCount: number;
  totalStreams: number;
  totalNetIncome: number;
  ownerEarnings: number;
  /** Total a pagar a colaboradores: lo que no es del owner. Dato solo del owner. */
  totalToPay: number;
  /** % del neto que se queda el owner según los splits. Dato solo del owner. */
  ownerPercentage: number | null;
  /** Colaboradores del sello. Visible para todos los usuarios. */
  collaborators: LabelCollaborator[];
  /** `true` si al menos una canción del sello tiene split. */
  splitActive: boolean;
  coverage: SplitCoverage;
  /** Sello artístico original, cuando lo hay. */
  source?: Label;
}
