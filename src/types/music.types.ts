export type MusicMode = "songs" | "albums";
/** Cómo se dibuja el catálogo: lista densa o cuadrícula de portadas. */
export type MusicLayout = "list" | "grid";
export type SortBy =
  | "alpha"
  | "revenue"
  | "streams"
  | "title_desc"
  | "artist_asc"
  | "artist_desc"
  | "label_asc"
  | "label_desc"
  | "date_asc"
  | "date_desc"
  | "percentage_asc"
  | "percentage_desc"
  | "collaborators_asc"
  | "collaborators_desc"
  | "split_asc"
  | "split_desc";
export type SplitFilter = "all" | "with_split" | "without_split";
export type CollaboratorsFilter = "all" | "with_collaborators" | "without_collaborators";
export type OwnerSplitFilter = "all" | "with_owner_split" | "without_owner_split";

export interface SplitData {
  _id?: string;
  percentage?: number;
  countriesType?: "all" | "except" | "only";
  selectedCountries?: string[];
  platformsType?: "all" | "except" | "only";
  selectedPlatforms?: string[];
}

export interface SongCollaborator {
  _id?: string;
  name?: string;
  image?: string;
  split?: SplitData | null;
  amountOwed?: number;
}

export interface SongItem {
  _id: string;
  trackTitle: string;
  artistName?: string;
  isrc?: string;
  country?: string;
  upc?: string;
  ean?: string;
  streams?: number;
  netIncome?: number;
  earning?: number;
  earnings?: number;
  totalStreams?: number;
  totalNetIncome?: number;
  totalGrossIncome?: number;
  percetaje?: number;
  artisticLabel?: string;
  label?: string;
  labels?: unknown[];
  customLabels?: unknown[];
  labelNames?: unknown[];
  otherLabels?: unknown[];
  labelCount?: number;
  /** En cuántos álbumes distintos aparece la canción, según la tabla de hechos. */
  albumCount?: number;
  releaseDate?: string;
  release_date?: string;
  releasedAt?: string;
  release?: string;
  duration?: number;
  durationMs?: number;
  duration_ms?: number;
  releasesCount?: number;
  totalReleases?: number;
  releases?: Array<{
    upc?: string;
    releaseDate?: string;
    release_date?: string;
  }>;
  collaborators?: SongCollaborator[];
  split?: SplitData | null;
  ownerId?: { split?: SplitData | null } | null;
  spotifyData?: SpotifyData | null;
}

import type { Album, AlbumTrack } from "./album.types";
import type { SpotifyData } from "./song.types";

/** Álbum enriquecido con campos opcionales de split y datos de UI */
export interface AlbumItem extends Album {
  releaseDate?: string;
  image?: string;
  tracks: AlbumTrack[];
  split?: SplitData | null;
  ownerId?: { split?: SplitData | null } | null;
}

/**
 * Un álbum en el que vive una canción, con lo que aporta.
 *
 * `albumId: null` es la parte del histórico que no sabe de qué lanzamiento
 * viene: se muestra aparte, nunca repartida entre los álbumes conocidos.
 */
export interface SongAlbum {
  albumId: string | null;
  upc?: string;
  albumTitle?: string;
  totalTracks?: number;
  streams: number;
  netIncome: number;
}
