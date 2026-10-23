import type { SortBy } from "@/types/music.types";

/**
 * Columnas de la tabla de canciones. Las comparten la cabecera, `SongRow` y el
 * esqueleto de carga, para que los anchos no se desincronicen.
 *
 * La rejilla es fluida: la columna de la canción absorbe el ancho sobrante y las
 * de datos mantienen su tamaño. Las columnas ocultas (`display: none`) no ocupan
 * celda, así que cada breakpoint declara solo las que se ven:
 * móvil = canción + ingresos + acciones; md suma streams; lg, todas.
 *
 * La columna de acciones es más ancha en `lg` porque ahí el botón de split
 * enseña su texto; por debajo se queda en el icono y ocupa menos.
 */
export const SONGS_GRID =
  "grid items-center gap-3.5 grid-cols-[minmax(0,1fr)_120px_108px] " +
  "md:grid-cols-[minmax(0,1fr)_104px_120px_108px] " +
  "lg:grid-cols-[minmax(0,1fr)_112px_104px_120px_124px_120px_72px_148px]";

export interface SongColumn {
  key: string;
  label: string;
  /** Clases de visibilidad por breakpoint; deben coincidir con `SONGS_GRID`. */
  visibility: string;
  sortKeys?: SortBy[];
}

export const SONG_COLUMNS: SongColumn[] = [
  { key: "status", label: "ESTADO", visibility: "hidden lg:flex" },
  { key: "streams", label: "STREAMS", visibility: "hidden md:flex", sortKeys: ["streams"] },
  { key: "income", label: "INGRESOS", visibility: "flex", sortKeys: ["revenue"] },
  {
    key: "collaborators",
    label: "COLABS",
    visibility: "hidden lg:flex",
    sortKeys: ["collaborators_desc"],
  },
  {
    key: "percentage",
    label: "% · SELLO",
    visibility: "hidden lg:flex",
    sortKeys: ["percentage_desc", "percentage_asc"],
  },
  { key: "labels", label: "SELLOS", visibility: "hidden lg:flex" },
];

/** Criterios que ordenan de mayor a menor; el resto se dibujan ascendentes. */
const DESCENDING: SortBy[] = [
  "revenue",
  "streams",
  "percentage_desc",
  "collaborators_desc",
  "date_desc",
  "title_desc",
];

export function isDescending(sortBy: SortBy): boolean {
  return DESCENDING.includes(sortBy);
}
