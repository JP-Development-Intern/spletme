export type LabelSortBy =
  | "songs_desc"
  | "name_asc"
  | "streams_desc"
  | "income_desc"
  | "income_asc"
  | "owner_desc"
  | "pct_desc"
  | "topay_desc"
  | "coverage_asc";

/**
 * Columnas de la tabla de sellos. Las comparten la cabecera, `LabelRow` y el
 * esqueleto de carga, para que los anchos no se desincronicen.
 *
 * La rejilla es fluida: el sello absorbe el ancho sobrante y las columnas de
 * datos mantienen su tamaño. Las ocultas (`display: none`) no ocupan celda, así
 * que cada breakpoint declara solo las que se ven: móvil = sello + ingresos +
 * acciones; md suma canciones; lg suma cobertura, colaboradores, estado del split y ganancia del owner.
 *
 * «Mi porcentaje» y «A pagar» son datos del owner: solo existen en lg y solo si `showToPay`, así que
 * la rejilla tiene dos variantes y quien no es owner no deja una celda vacía.
 */
const GRID_BASE =
  "grid items-center gap-3 grid-cols-[minmax(0,1fr)_120px_104px] " +
  "md:grid-cols-[minmax(0,1fr)_86px_120px_104px] ";

export const labelsGrid = (showToPay: boolean): string =>
  GRID_BASE +
  (showToPay
    ? "lg:grid-cols-[minmax(0,1fr)_86px_172px_110px_96px_120px_120px_120px_104px_104px]"
    : "lg:grid-cols-[minmax(0,1fr)_86px_172px_110px_96px_120px_120px_104px]");

export interface LabelColumn {
  key: string;
  label: string;
  /** Clases de visibilidad por breakpoint; deben coincidir con `LABELS_GRID`. */
  visibility: string;
  sortKeys?: LabelSortBy[];
  /** Dato del owner: no se enseña a colaboradores ni a subcuentas. */
  ownerOnly?: boolean;
}

export const LABEL_COLUMNS: LabelColumn[] = [
  { key: "songs", label: "CANCIONES", visibility: "hidden md:flex", sortKeys: ["songs_desc"] },
  {
    key: "coverage",
    label: "COBERTURA DE SPLITS",
    visibility: "hidden lg:flex",
    sortKeys: ["coverage_asc"],
  },
  { key: "collaborators", label: "COLABORADORES", visibility: "hidden lg:flex" },
  { key: "splitStatus", label: "SPLIT", visibility: "hidden lg:flex" },
  {
    key: "income",
    label: "INGRESOS",
    visibility: "flex",
    sortKeys: ["income_desc", "income_asc"],
  },
  {
    key: "owner",
    label: "TU GANANCIA",
    visibility: "hidden lg:flex",
    sortKeys: ["owner_desc"],
  },
  {
    key: "ownerPct",
    label: "MI PORCENTAJE",
    visibility: "hidden lg:flex",
    sortKeys: ["pct_desc"],
    ownerOnly: true,
  },
  {
    key: "toPay",
    label: "A PAGAR",
    visibility: "hidden lg:flex",
    sortKeys: ["topay_desc"],
    ownerOnly: true,
  },
];

/** Columnas que ve quien mira: «mi porcentaje» y «a pagar» solo se enseñan al owner. */
export const labelColumns = (showToPay: boolean): LabelColumn[] =>
  LABEL_COLUMNS.filter((column) => showToPay || !column.ownerOnly);

/** Criterio que aplica cada columna al pulsar su cabecera. */
export const NEXT_SORT: Record<string, (current: LabelSortBy) => LabelSortBy> = {
  name: () => "name_asc",
  songs: () => "songs_desc",
  coverage: () => "coverage_asc",
  income: (current) => (current === "income_desc" ? "income_asc" : "income_desc"),
  owner: () => "owner_desc",
  ownerPct: () => "pct_desc",
  toPay: () => "topay_desc",
};

/** Criterios que ordenan de mayor a menor; el resto se dibujan ascendentes. */
const DESCENDING: LabelSortBy[] = ["songs_desc", "streams_desc", "income_desc", "owner_desc", "pct_desc", "topay_desc"];

export function isDescending(sortBy: LabelSortBy): boolean {
  return DESCENDING.includes(sortBy);
}

export const SORT_LABELS: Record<LabelSortBy, string> = {
  songs_desc: "Más canciones",
  name_asc: "Nombre (A–Z)",
  streams_desc: "Más streams",
  income_desc: "Mayores ingresos",
  income_asc: "Menores ingresos",
  owner_desc: "Mayor ganancia",
  pct_desc: "Mayor porcentaje",
  topay_desc: "Mayor monto a pagar",
  coverage_asc: "Menos cobertura",
};
