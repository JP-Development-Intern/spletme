import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, ChevronDown, Disc3, Play, Crown, Eye, Music } from "lucide-react";
import { formatStreams, formatCurrency } from "@/utils/format.utils";
import { albumSplitCoverage, getAlbumLabels, getSongLabels, songLabelCount } from "@/utils/music.utils";
import { CopyButton } from "@/components/ui/CopyButton";
import { SplitCoverageBar } from "./SplitCoverageBar";
import { SongLabelsBadge } from "./SongLabelsBadge";
import { ALBUM_COLUMNS, ALBUMS_GRID } from "./albumsColumns";
import type { AlbumItem } from "@/types/music.types";
import type { AlbumTrack } from "@/types/album.types";

interface AlbumRowProps {
  album: AlbumItem;
  onOwnerSplit: (album: AlbumItem) => void;
  /** Máximo de pistas visibles al desplegar antes de ofrecer el detalle completo. */
  previewTracks?: number;
}

const visibility = (key: string) => ALBUM_COLUMNS.find((c) => c.key === key)!.visibility;

const coverOf = (album: AlbumItem): string | undefined =>
  album.image ?? album.coverImage?.[0]?.[0]?.url;

/**
 * Fila de álbum, desplegable a sus pistas.
 *
 * Desplegar es lo que permite que canciones y álbumes convivan: se baja al
 * detalle de una pista sin salir de la lista ni cambiar de agrupación. Las pistas
 * caen en la misma rejilla que la cabecera, así que las columnas siguen alineadas.
 */
export function AlbumRow({ album, onOwnerSplit, previewTracks = 4 }: AlbumRowProps) {
  const [open, setOpen] = useState(false);
  const { withSplit, total } = albumSplitCoverage(album);
  const complete = total > 0 && withSplit === total;
  const cover = coverOf(album);
  const to = `/panel/album/upc/${encodeURIComponent(album.upc)}`;
  const tracks = Array.isArray(album.tracks) ? album.tracks : [];

  return (
    <div className={open ? "bg-[#F4F5F7]" : ""}>
      <div className={`${ALBUMS_GRID} group px-5 py-3`}>
        {/* Álbum */}
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? `Ocultar pistas de ${album.albumTitle}` : `Ver pistas de ${album.albumTitle}`}
            className={`flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-full transition-colors ${
              open ? "bg-[#1C1D22] text-white" : "text-[#A6AAB2] hover:bg-white hover:text-[#1C1D22]"
            }`}
          >
            {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>

          <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#F4F5F7]">
            {cover ? (
              <img src={cover} alt="" loading="lazy" className="h-full w-full object-cover" />
            ) : (
              <Disc3 className="h-[18px] w-[18px] text-[#A6AAB2]" />
            )}
          </span>

          <span className="flex min-w-0 flex-col gap-0.5">
            <Link
              to={to}
              title={album.albumTitle}
              className="truncate text-[13.5px] font-semibold text-[#1C1D22] transition-colors group-hover:text-[#FF5C00]"
            >
              {album.albumTitle}
            </Link>
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="truncate text-[11px] text-[#A6AAB2]">{album.artistName}</span>
              {album.upc && (
                <>
                  <span className="text-[11px] text-[#A6AAB2]">·</span>
                  <span className="truncate font-mono text-[10px] text-[#A6AAB2]">{album.upc}</span>
                  <CopyButton value={album.upc} title="Copiar UPC" />
                </>
              )}
            </span>
          </span>
        </div>

        {/* Pistas */}
        <div className={visibility("tracks")}>
          <span className="font-mono text-[13px] font-semibold text-[#1C1D22]">
            {total || album.totalTracks || 0}
          </span>
        </div>

        {/* Split asignado */}
        <div className={`${visibility("coverage")} min-w-0`}>
          <SplitCoverageBar
            withSplit={withSplit}
            total={total}
            trackClassName={open ? "bg-white" : "bg-[#F4F5F7]"}
            className="w-full"
          />
        </div>

        {/* Streams */}
        <div className={`${visibility("streams")} items-center gap-1.5`}>
          <Play className="h-3 w-3 flex-shrink-0 text-[#A6AAB2]" />
          <span className="font-mono text-[11.5px] text-[#71757E]">
            {formatStreams(album.totalStreams ?? 0)}
          </span>
        </div>

        {/* Ingresos */}
        <div className={visibility("income")}>
          <span className="font-mono text-[13px] font-semibold text-[#2FB37E]">
            {formatCurrency(album.totalNetIncome ?? 0)}
          </span>
        </div>

        {/* Sellos */}
        <div className={visibility("labels")}>
          <SongLabelsBadge labels={getAlbumLabels(album)} noun="álbum" />
        </div>

        {/* Acciones */}
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => onOwnerSplit(album)}
            disabled={complete}
            title={complete ? "Todas las pistas ya reparten" : "Asignar split a las pistas que faltan"}
            className={`flex items-center gap-1.5 rounded-[15px] px-3 py-1.5 text-[11.5px] font-semibold transition-colors ${
              complete
                ? "cursor-not-allowed bg-[#F4F5F7] text-[#A6AAB2]"
                : "bg-[#FFEADD] text-[#FF5C00] hover:bg-[#FFDCC7]"
            }`}
          >
            <Crown className="h-3.5 w-3.5" />
            {complete ? "Listo" : "Split"}
          </button>
          <Link
            to={to}
            aria-label={`Abrir ${album.albumTitle}`}
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[#A6AAB2] transition-colors hover:text-[#1C1D22]"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {open && (
        <div className="px-5 pb-3.5">
          {tracks.length === 0 ? (
            <p className="rounded-[15px] bg-white px-4 py-5 text-center text-[12px] text-[#71757E]">
              Este álbum no tiene pistas cargadas todavía.
            </p>
          ) : (
            <>
              {tracks.slice(0, previewTracks).map((track, index) => (
                <TrackRow
                  key={track._id || track.isrc || index}
                  track={track}
                  index={index}
                  last={index === Math.min(previewTracks, tracks.length) - 1}
                />
              ))}
              {tracks.length > previewTracks && (
                <Link
                  to={to}
                  className="ml-[34px] mt-2 inline-block text-[11.5px] font-semibold text-[#FF5C00] transition-colors hover:text-[#EA580C]"
                >
                  Ver las {tracks.length} pistas del álbum
                </Link>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/** Una pista dentro del álbum desplegado, en la misma rejilla que la cabecera. */
function TrackRow({ track, index, last }: { track: AlbumTrack; index: number; last: boolean }) {
  const hasSplit = Boolean(track?.split || track?.ownerId?.split);

  return (
    <div className={`${ALBUMS_GRID} py-2`}>
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-7 w-[22px] flex-shrink-0 justify-center" aria-hidden="true">
          <span className={`w-px bg-[#E8E8EC] ${last ? "h-3.5" : "h-7"}`} />
        </span>
        <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-[9px] bg-white">
          <span className="font-mono text-[10.5px] font-semibold text-[#A6AAB2]">{index + 1}</span>
        </span>
        <span className="flex min-w-0 flex-1 items-center gap-2">
          <Music className="h-3 w-3 flex-shrink-0 text-[#A6AAB2]" />
          <span className="truncate text-[12.5px] text-[#1C1D22]" title={track.trackTitle}>
            {track.trackTitle}
          </span>
        </span>
      </div>

      <div className={visibility("tracks")}>
        <span
          className="inline-flex items-center gap-1.5 rounded-xl px-2 py-1"
          style={{ backgroundColor: hasSplit ? "#E4F5EC" : "#FFEADD" }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: hasSplit ? "#2FB37E" : "#FF5C00" }}
          />
          <span
            className="text-[10px] font-semibold"
            style={{ color: hasSplit ? "#2FB37E" : "#FF5C00" }}
          >
            {hasSplit ? "Split" : "Sin"}
          </span>
        </span>
      </div>

      <div className={visibility("coverage")}>
        <span
          className={`font-mono text-[11.5px] ${
            hasSplit ? "font-semibold text-[#1C1D22]" : "text-[#A6AAB2]"
          }`}
        >
          {hasSplit ? "Repartida" : "Sin asignar"}
        </span>
      </div>

      <div className={`${visibility("streams")} items-center gap-1.5`}>
        <Play className="h-[11px] w-[11px] flex-shrink-0 text-[#A6AAB2]" />
        <span className="font-mono text-[11px] text-[#71757E]">
          {formatStreams(track.totalStreams ?? 0)}
        </span>
      </div>

      <div className={visibility("income")}>
        <span className="font-mono text-[12px] font-semibold text-[#2FB37E]">
          {formatCurrency(track.totalNetIncome ?? 0)}
        </span>
      </div>

      <div className={visibility("labels")}>
        <SongLabelsBadge labels={getSongLabels(track)} count={songLabelCount(track)} />
      </div>

      <div className="flex items-center justify-end">
        <Link
          to={`/panel/song/${track._id}`}
          aria-label={`Abrir ${track.trackTitle}`}
          title="Abrir canción"
          className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-white text-[#71757E] transition-colors hover:text-[#1C1D22]"
        >
          <Eye className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
