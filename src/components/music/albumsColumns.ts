/**
 * Columnas del modo álbum. Comparten rejilla la cabecera, `AlbumRow`, sus pistas
 * desplegadas y el esqueleto de carga, para que al expandir un álbum las pistas
 * caigan en las mismas columnas que su cabecera.
 *
 * Es la misma idea que en el modo canción: la primera columna absorbe el ancho
 * sobrante y las de datos mantienen su tamaño. Móvil = álbum + ingresos +
 * acciones; md suma el split asignado; lg, todas.
 */
export const ALBUMS_GRID =
  "grid items-center gap-3.5 grid-cols-[minmax(0,1fr)_130px_120px] " +
  "md:grid-cols-[minmax(0,1fr)_190px_130px_120px] " +
  "lg:grid-cols-[minmax(0,1fr)_84px_190px_104px_130px_72px_120px]";

/** Igual que `ALBUMS_GRID` con la columna de permisos, que solo ve el dueño (solo en `lg`). */
export const ALBUMS_GRID_WITH_PERMISSIONS =
  "grid items-center gap-3.5 grid-cols-[minmax(0,1fr)_130px_120px] " +
  "md:grid-cols-[minmax(0,1fr)_190px_130px_120px] " +
  "lg:grid-cols-[minmax(0,1fr)_84px_190px_104px_130px_72px_112px_120px]";

export const ALBUM_PERMISSIONS_COLUMN = {
  key: "permissions",
  label: "PERMISOS",
  visibility: "hidden lg:flex",
} as const;

export interface AlbumColumn {
  key: string;
  label: string;
  /** Clases de visibilidad por breakpoint; deben coincidir con `ALBUMS_GRID`. */
  visibility: string;
}

export const ALBUM_COLUMNS: AlbumColumn[] = [
  { key: "tracks", label: "PISTAS", visibility: "hidden lg:flex" },
  { key: "coverage", label: "SPLIT ASIGNADO", visibility: "hidden md:flex" },
  { key: "streams", label: "STREAMS", visibility: "hidden lg:flex" },
  { key: "income", label: "INGRESOS", visibility: "flex" },
  { key: "labels", label: "SELLOS", visibility: "hidden lg:flex" },
];
