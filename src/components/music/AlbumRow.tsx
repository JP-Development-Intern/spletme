import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, ChevronDown, Disc3, Crown, Eye, Music, Check } from "lucide-react";
import { formatStreams, formatCurrency } from "@/utils/format.utils";
import { albumSplitCoverage } from "@/utils/music.utils";
import { CopyButton } from "@/components/ui/CopyButton";
import { SplitCoverageBar } from "./SplitCoverageBar";
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
    <div className={open ? "bg-white/[0.04]" : ""}>
      <div className={`${ALBUMS_GRID} group px-5 py-3 transition-colors hover:bg-white/[0.03]`}>
        {/* Álbum */}
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? `Ocultar pistas de ${album.albumTitle}` : `Ver pistas de ${album.albumTitle}`}
            className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70 ${
              open ? "bg-[#F7EDE6]/[0.92] text-[#1C1D22]" : "bg-white/[0.06] text-white/70 hover:bg-white/[0.12] hover:text-white"
            }`}
          >
            {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>

          <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/[0.08]">
            {cover ? (
              <img src={cover} alt="" loading="lazy" className="h-full w-full object-cover" />
            ) : (
              <Disc3 className="h-[18px] w-[18px] text-white/40" />
            )}
          </span>

          <span className="flex min-w-0 flex-col gap-0.5">
            <Link
              to={to}
              title={album.albumTitle}
              className="truncate text-[13.5px] font-semibold text-white transition-colors group-hover:text-[#FFB067]"
            >
              {album.albumTitle}
            </Link>
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="truncate text-[11.5px] text-white/50">{album.artistName}</span>
              {album.upc && (
                <>
                  <span className="text-[11px] text-white/40">·</span>
                  <span className="truncate text-[11px] text-white/50">UPC {album.upc}</span>
                  <CopyButton
                    value={album.upc}
                    title="Copiar UPC"
                    className="!text-white/45 hover:!bg-white/10 hover:!text-[#FFB067]"
                  />
                </>
              )}
            </span>
          </span>
        </div>

        {/* Pistas */}
        <div className={visibility("tracks")}>
          <span className="text-[13px] font-medium text-white">
            {total || album.totalTracks || 0}
          </span>
        </div>

        {/* Split asignado */}
        <div className={`${visibility("coverage")} min-w-0`}>
          <SplitCoverageBar
            withSplit={withSplit}
            total={total}
            className="w-full"
            onGlass
          />
        </div>

        {/* Streams */}
        <div className={`${visibility("streams")} items-center`}>
          <span className="text-[13px] font-medium text-white">
            {formatStreams(album.totalStreams ?? 0)}
          </span>
        </div>

        {/* Ingresos */}
        <div className={visibility("income")}>
          <span className="font-mono text-[15px] text-[#45D39A]">
            {formatCurrency(album.totalNetIncome ?? 0)}
          </span>
        </div>

        {/* Acciones */}
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => onOwnerSplit(album)}
            disabled={complete}
            title={complete ? "Todas las pistas ya reparten" : "Asignar split a las pistas que faltan"}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-[7px] text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70 ${
              complete
                ? "cursor-not-allowed border-transparent bg-[#45D39A]/10 text-[#45D39A]"
                : "border-[#FF8A3D]/35 bg-[#FF5C00]/[0.16] text-[#FF9A5C] hover:bg-[#FF5C00]/25"
            }`}
          >
            {complete ? <Check className="h-3.5 w-3.5" /> : <Crown className="h-3.5 w-3.5" />}
            {complete ? "Listo" : "Split"}
          </button>
          <Link
            to={to}
            aria-label={`Abrir ${album.albumTitle}`}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-white/40 transition-colors hover:bg-white/[0.08] hover:text-white"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {open && (
        <div className="bg-black/[0.14] px-5 pb-3.5 pt-1">
          {tracks.length === 0 ? (
            <p className="rounded-[15px] bg-white/[0.04] px-4 py-5 text-center text-[12.5px] text-white/65">
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
                  className="ml-[40px] mt-2.5 inline-block text-[12.5px] font-semibold text-[#FF8A3D] transition-colors hover:text-[#FFB48A]"
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
        <span className="flex h-7 w-7 flex-shrink-0 justify-center" aria-hidden="true">
          <span className={`w-px bg-white/15 ${last ? "h-3.5" : "h-7"}`} />
        </span>
        <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-[9px] bg-white/[0.06]">
          <span className="text-[11px] font-semibold text-white/50">{String(index + 1).padStart(2, "0")}</span>
        </span>
        <span className="flex min-w-0 flex-1 items-center gap-2">
          <Music className="h-3 w-3 flex-shrink-0 text-white/40" />
          <span className="truncate text-[13px] font-medium text-white" title={track.trackTitle}>
            {track.trackTitle}
          </span>
        </span>
      </div>

      <div className={visibility("tracks")}>
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-2 py-1"
          style={{ backgroundColor: hasSplit ? "rgba(69, 211, 154, 0.12)" : "rgba(255, 92, 0, 0.16)" }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: hasSplit ? "#45D39A" : "#FF8A3D" }}
          />
          <span
            className="text-[10.5px] font-semibold"
            style={{ color: hasSplit ? "#45D39A" : "#FF8A3D" }}
          >
            {hasSplit ? "Split" : "Sin"}
          </span>
        </span>
      </div>

      <div className={visibility("coverage")}>
        <span
          className={`text-[12px] ${hasSplit ? "font-semibold text-white" : "text-white/50"}`}
        >
          {hasSplit ? "Repartida" : "Sin asignar"}
        </span>
      </div>

      <div className={`${visibility("streams")} items-center`}>
        <span className="text-[12.5px] font-medium text-white">
          {formatStreams(track.totalStreams ?? 0)}
        </span>
      </div>

      <div className={visibility("income")}>
        <span className="font-mono text-sm text-[#45D39A]">
          {formatCurrency(track.totalNetIncome ?? 0)}
        </span>
      </div>

      <div className="flex items-center justify-end">
        <Link
          to={`/panel/song/${track._id}`}
          aria-label={`Abrir ${track.trackTitle}`}
          title="Abrir canción"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-white/70 transition-colors hover:bg-white/[0.12] hover:text-white"
        >
          <Eye className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
