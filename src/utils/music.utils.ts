import type { SongItem, AlbumItem } from "@/types/music.types";
import type { AlbumTrack } from "@/types/album.types";

/** Detecta si el item tiene un split asignado al owner */
export const hasOwnerSplit = (item: SongItem | AlbumItem): boolean => Boolean(item?.ownerId?.split);

/** Detecta si el item (canción o álbum) tiene algún split configurado */
export const hasAnySplit = (item: SongItem | AlbumItem): boolean => {
  if (Boolean(item?.split) || hasOwnerSplit(item)) return true;
  if ("tracks" in item && Array.isArray(item.tracks)) {
    return item.tracks.some((track) => Boolean(track?.split) || Boolean(track?.ownerId?.split));
  }
  return false;
};

/** Determina si una query parece un código UPC (8-14 dígitos) */
export const looksLikeUPC = (q: string): boolean => /^[0-9]{8,14}$/.test(q.replace(/\s|-/g, ""));

/** Determina si una query parece un código ISRC */
export const looksLikeISRC = (q: string): boolean =>
  /^[A-Z]{2}[A-Z0-9]{3}[0-9]{7}$/i.test(q.replace(/\s|-/g, "").toUpperCase());

/** Formatea duración en ms o segundos como MM:SS */
export const formatDuration = (rawDuration: unknown): string => {
  if (rawDuration === undefined || rawDuration === null || rawDuration === "") return "N/A";
  const durationNumber = Number(rawDuration);
  if (Number.isNaN(durationNumber)) return String(rawDuration);
  const totalSeconds =
    durationNumber > 10000 ? Math.round(durationNumber / 1000) : Math.round(durationNumber);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
};

/** Normaliza una fecha de release a string legible */
export const formatReleaseDate = (rawDate: unknown): string => {
  if (!rawDate) return "N/A";
  const text = String(rawDate).trim();

  // Spotify entrega "2019", "2019-05" o "2019-05-17": se respeta la precisión que
  // trae y se evita `new Date("YYYY-MM-DD")`, que se interpreta en UTC y en
  // zonas con offset negativo muestra el día anterior.
  const partial = /^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?$/.exec(text);
  if (partial) {
    const [, year, month, day] = partial;
    if (!month) return year;
    const monthIndex = Number(month) - 1;
    if (monthIndex < 0 || monthIndex > 11) return text;
    if (!day) {
      return new Date(Number(year), monthIndex, 1).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
      });
    }
    return new Date(Number(year), monthIndex, Number(day)).toLocaleDateString();
  }

  const parsedDate = new Date(text);
  return Number.isNaN(parsedDate.getTime()) ? text : parsedDate.toLocaleDateString();
};

/**
 * Fecha de lanzamiento de una canción. Prioriza `spotifyData.album.release_date`
 * (la fecha real del lanzamiento) y cae a los campos antiguos si no hay metadata.
 */
export const getSongReleaseDate = (song: SongItem | null | undefined): string | undefined => {
  const candidate =
    song?.spotifyData?.album?.release_date ??
    song?.releaseDate ??
    song?.release_date ??
    song?.releasedAt ??
    song?.release ??
    song?.releases?.[0]?.releaseDate ??
    song?.releases?.[0]?.release_date;
  return candidate ? String(candidate) : undefined;
};

/** Cuenta colaboradores con un split de porcentaje válido asignado */
export const countAssignedSplits = (song: SongItem): number => {
  const collaborators = song?.collaborators;
  if (Array.isArray(collaborators) && collaborators.length > 0) {
    return collaborators.filter((c) => Number(c?.split?.percentage ?? 0) > 0).length;
  }
  return Number(song?.split?.percentage ?? 0) > 0 ? 1 : 0;
};

/** Cuenta total de splits (colaboradores con split asignado) */
export const countTotalSplits = (song: SongItem): number => song?.collaborators?.length ?? 0;

/** Indica si la canción tiene al menos un colaborador asociado. */
export const hasCollaborators = (song: SongItem): boolean =>
  Array.isArray(song?.collaborators) && song.collaborators.length > 0;

/** Cuenta releases de la canción */
export const countReleases = (song: SongItem): number => {
  if (Array.isArray(song?.releases)) return song.releases.length;
  const count = Number(song?.releasesCount ?? song?.totalReleases);
  return Number.isFinite(count) ? count : 0;
};

/**
 * Cuántas pistas de un álbum ya tienen reparto asignado.
 *
 * Es la lectura que dice si un álbum está terminado: se deriva de `tracks[].split`,
 * que ya viene en la respuesta, sin pedir nada nuevo al servidor.
 */
export const albumSplitCoverage = (album: AlbumItem): { withSplit: number; total: number } => {
  const tracks = Array.isArray(album?.tracks) ? album.tracks : [];
  const withSplit = tracks.filter(
    (track) => Boolean(track?.split) || Boolean(track?.ownerId?.split),
  ).length;
  return { withSplit, total: tracks.length || album?.totalTracks || 0 };
};

/** Pistas del álbum que todavía no reparten nada. */
export const albumTracksWithoutSplit = (album: AlbumItem): AlbumTrack[] => {
  const tracks = Array.isArray(album?.tracks) ? album.tracks : [];
  return tracks.filter((track) => !track?.split && !track?.ownerId?.split);
};

/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Si la sesión actual es la dueña de la canción (o de la pista de un álbum,
 * que trae el mismo `ownerId` enriquecido).
 *
 * Se compara por correo y usuario antes que por id porque las subcuentas heredan
 * identificadores del padre y darían un falso positivo.
 */
export function resolveIsOwner(song: any, currentUser: any): boolean {
  if (!song || !currentUser) return false;

  const normalize = (value: unknown) => String(value ?? "").trim().toLowerCase();

  const ownerEmails = [song?.ownerId?.email, song?.owner?.email].filter(Boolean).map(normalize);
  const ownerUsernames = [song?.ownerId?.username, song?.owner?.username]
    .filter(Boolean)
    .map(normalize);
  const ownerIds = [
    typeof song?.ownerId === "string" ? song.ownerId : undefined,
    song?.ownerId?._id,
    song?.ownerId?.id,
    song?.owner?._id,
    song?.owner?.id,
  ]
    .filter(Boolean)
    .map(String);

  const email = normalize(currentUser?.email);
  const username = normalize(currentUser?.username);
  const ids = [currentUser?.id, currentUser?._id, currentUser?.userId].filter(Boolean).map(String);

  if (email && ownerEmails.includes(email)) return true;
  if (username && ownerUsernames.includes(username)) return true;

  const hasIdentity = ownerEmails.length > 0 || ownerUsernames.length > 0;
  const isSubuser = Boolean(currentUser?.parentUserId);
  return !isSubuser && !hasIdentity && ids.some((value) => ownerIds.includes(value));
}

/**
 * El alcance de un split en una frase corta. Vive aquí porque lo leen tanto la
 * tabla de reparto como la tarjeta de «tu parte», y son la misma frase.
 */
export function describeSplitScope(
  split?: {
    countriesType?: string;
    selectedCountries?: string[];
    platformsType?: string;
    selectedPlatforms?: string[];
  } | null,
): { label: string; worldwide: boolean } | null {
  if (!split) return null;
  const everywhere = split.countriesType === "all" && split.platformsType === "all";
  if (everywhere) return { label: "Todos los países y plataformas", worldwide: true };
  const countries =
    split.countriesType === "all" ? "Todos los países" : split.selectedCountries?.join(", ");
  const platforms =
    split.platformsType === "all" ? "todas las plataformas" : split.selectedPlatforms?.join(", ");
  return { label: [countries, platforms].filter(Boolean).join(" · ") || "—", worldwide: false };
}

/** Enlace al detalle de un álbum por su UPC. */
export const albumHref = (upc?: string): string =>
  `/panel/album/upc/${encodeURIComponent(upc ?? "")}`;
