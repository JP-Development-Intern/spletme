import type { SplitCondition } from "./split.types";

export interface AlbumTrack {
  _id: string;
  isrc: string;
  trackTitle: string;
  totalStreams: number;
  totalGrossIncome: number;
  totalNetIncome: number;
  releases?: unknown[];
  split?: { conditions?: SplitCondition[] } | null;
  ownerId?: { split?: { conditions?: SplitCondition[] } | null } | null;
  spotifyData?: {
    album?: {
      images?: Array<{ url: string; width?: number; height?: number }>;
    };
  };
  /**
   * `id` es el identificador generado del usuario, no el `_id` de Mongo: es el
   * que espera el endpoint de splits para identificar al participante.
   */
  collaborators?: { _id?: string; id?: string; name?: string; image?: string }[];
  /** Sellos a los que pertenece la pista, tal como los envía el listado. */
  labels?: unknown[];
  customLabels?: unknown[];
  labelNames?: unknown[];
  otherLabels?: unknown[];
  labelCount?: number;
}

export interface Album {
  _id?: string;
  id?: string;
  upc: string;
  albumTitle: string;
  /** Primer artista del álbum. El listado completo está en `artists`. */
  artistName: string;
  /** Todos los artistas distintos de las pistas del álbum. */
  artists?: string[];
  artisticLabel?: string;
  totalTracks: number;
  totalStreams: number;
  totalGrossIncome: number;
  totalNetIncome: number;
  tracks: AlbumTrack[];
  releaseTitle: string;
  coverImage?: { url: string; height: number; width: number }[][];
  ownerEarnings: string;
}

export interface AlbumsPagination {
  /** Cuántos álbumes hay en el conjunto filtrado, no cuántos vinieron. */
  total: number;
  skip: number;
  limit: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

/** Lo que la tabla de música le pide al servidor para pintar una página. */
export interface AlbumsListParams {
  skip: number;
  limit: number;
  /** Texto libre: título, artistas, sello, UPC o ISRC de sus pistas. */
  search?: string;
  /** Clave de orden; la resuelve el servidor sobre todo el catálogo. */
  sortBy?: string;
  /** Junta los álbumes por número de pistas antes de ordenar. */
  groupByTrackCount?: boolean;
  artist?: string;
  upc?: string;
  country?: string;
  dateFrom?: string;
  dateTo?: string;
  hasSplits?: boolean;
}

export interface AlbumsResponse {
  success: boolean;
  data: Album[];
  pagination: AlbumsPagination;
}

export interface AlbumResponse {
  success: boolean;
  data: Album;
}

export interface AlbumsError {
  success: false;
  message: string;
  error?: string;
}
