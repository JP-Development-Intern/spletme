export interface SpotifyImage {
  url: string;
  height: number | null;
  width: number | null;
}

/** Metadata de Spotify de la canción (la arma `buildSpotifySummary` en el backend). */
export interface SpotifyData {
  duration_ms?: number | null;
  preview_url?: string | null;
  popularity?: number | null;
  album?: {
    name?: string | null;
    /** "2019" | "2019-05" | "2019-05-17" */
    release_date?: string | null;
    /** [0] = la más grande (~640px) */
    images?: Array<{ url: string; height?: number | null; width?: number | null }>;
  } | null;
}

export interface TopSong {
  _id: string;
  trackTitle: string;
  artistName: string;
  totalStreams: number;
  totalNetIncome: number;
  spotifyData?: {
    album?: {
      images?: { url: string; width: number; height: number }[];
    };
  };
}
