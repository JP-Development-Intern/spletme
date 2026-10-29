import type { Label } from "@/services/labels";

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
  /** Nombre del sello; es también su identificador en la URL. */
  name: string;
  isCustom: boolean;
  /** Solo los personalizados tienen id propio: es lo que permite editarlos. */
  id?: string;
  /** Sellos artísticos que agrupa. Vacío en los artísticos. */
  artisticLabels: string[];
  songCount: number;
  totalStreams: number;
  totalNetIncome: number;
  ownerEarnings: number;
  /** Total a pagar a colaboradores: lo que no es del owner. Dato solo del owner. */
  totalToPay: number;
  coverage: SplitCoverage;
  /** Sello artístico original, cuando lo hay. */
  source?: Label;
}
