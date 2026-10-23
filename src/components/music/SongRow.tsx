import { Link, useNavigate } from "react-router-dom";
import { Music, Play, ChevronRight, Eye, Crown } from "lucide-react";
import { hasAnySplit, hasOwnerSplit, getSongLabels, songLabelCount } from "@/utils/music.utils";
import { viewerOwnsSong, viewerSplitPercentage, viewerAmount } from "@/utils/ownerVisibility";
import { formatStreams, formatCurrency } from "@/utils/format.utils";
import { CopyButton } from "@/components/ui/CopyButton";
import { CollaboratorAvatars } from "./CollaboratorAvatars";
import { SongAlbumsBadge } from "./SongAlbumsBadge";
import { SongLabelsBadge } from "./SongLabelsBadge";
import { SONG_COLUMNS, SONGS_GRID } from "./songsColumns";
import type { SongItem } from "@/types/music.types";

interface SongRowProps {
  song: SongItem;
  onQuickView: (song: SongItem) => void;
  /** Abre el reparto de esta canción sin salir del listado. */
  onOwnerSplit: (song: SongItem) => void;
  /**
   * Si la columna de dinero puede enseñar el ingreso de la canción. Solo cuando
   * quien mira es dueño de todo lo que hay en pantalla: para un colaborador, el
   * neto junto a su porcentaje delata el descuento del owner. Ver
   * `utils/ownerVisibility.ts`.
   */
  showsIncome?: boolean;
}

const visibility = (key: string) => SONG_COLUMNS.find((c) => c.key === key)!.visibility;

/**
 * Fila de la tabla de canciones. La fila entera lleva al detalle: los controles
 * que hacen de por sí otra cosa (copiar ISRC, vista rápida) detienen el clic.
 */
export function SongRow({ song, onQuickView, onOwnerSplit, showsIncome = false }: SongRowProps) {
  const navigate = useNavigate();
  const cover = song?.spotifyData?.album?.images?.[0]?.url;
  const split = hasAnySplit(song);
  const to = `/panel/song/${song._id}`;
  const myPercentage = viewerSplitPercentage(song);
  // El split del owner solo lo fija su dueño; a un colaborador el botón le
  // daría un 401 y nada que hacer con él.
  const isOwnerView = viewerOwnsSong(song);
  const ownerSplitDone = hasOwnerSplit(song);
  const money =
    showsIncome && viewerOwnsSong(song)
      ? Number(song?.totalNetIncome ?? song?.netIncome ?? 0)
      : viewerAmount(song);

  return (
    <div
      onClick={() => navigate(to)}
      className={`${SONGS_GRID} group cursor-pointer px-5 py-2.5 transition-colors hover:bg-[#F4F5F7]`}
    >
      {/* Canción */}
      <div className="flex min-w-0 items-center gap-3">
        <div className="h-11 w-11 flex-shrink-0 overflow-hidden rounded-[13px]">
          {cover ? (
            <img src={cover} alt={song.trackTitle} className="h-full w-full object-cover" />
          ) : (
            <div
              className={`flex h-full w-full items-center justify-center ${split ? "bg-[#F4F5F7]" : "bg-[#FFEADD]"}`}
            >
              <Music className={`h-4 w-4 ${split ? "text-[#A6AAB2]" : "text-[#FF5C00]"}`} />
            </div>
          )}
        </div>
        <div className="flex min-w-0 flex-col gap-0.5">
          <Link
            to={to}
            onClick={(e) => e.stopPropagation()}
            className="truncate text-[13.5px] font-semibold text-[#1C1D22] transition-colors group-hover:text-[#FF5C00]"
            title={song.trackTitle}
          >
            {song.trackTitle}
          </Link>
          <span className="flex min-w-0 items-center gap-1.5">
            <span className="truncate text-[11.5px] text-[#A6AAB2]">{song?.artistName ?? "—"}</span>
            {song?.isrc && (
              <>
                <span className="text-[11px] text-[#A6AAB2]">·</span>
                <span className="truncate font-mono text-[10.5px] text-[#A6AAB2]">{song.isrc}</span>
                <span onClick={(e) => e.stopPropagation()}>
                  <CopyButton value={song.isrc} title="Copiar ISRC" />
                </span>
              </>
            )}
            {(song?.albumCount ?? 0) > 1 && (
              <SongAlbumsBadge songId={song._id} count={song.albumCount ?? 0} />
            )}
          </span>
        </div>
      </div>

      {/* Estado */}
      <div className={visibility("status")}>
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1"
          style={{ backgroundColor: split ? "#E4F5EC" : "#FFEADD" }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: split ? "#2FB37E" : "#FF5C00" }}
          />
          <span
            className="text-[10.5px] font-semibold"
            style={{ color: split ? "#2FB37E" : "#FF5C00" }}
          >
            {split ? "Con split" : "Sin split"}
          </span>
        </span>
      </div>

      {/* Streams */}
      <div className={`${visibility("streams")} items-center gap-1.5`}>
        <Play className="h-3 w-3 flex-shrink-0 text-[#A6AAB2]" />
        <span className="font-mono text-[11.5px] text-[#71757E]">
          {formatStreams(song?.totalStreams ?? 0)}
        </span>
      </div>

      {/* Ingresos */}
      <div className={visibility("income")}>
        <span className="font-mono text-[13px] font-semibold text-[#2FB37E]">
          {formatCurrency(money)}
        </span>
      </div>

      {/* Colaboradores */}
      <div className={visibility("collaborators")}>
        <CollaboratorAvatars collaborators={song?.collaborators} />
      </div>

      {/* % · Sello */}
      <div className={`${visibility("percentage")} items-center gap-2`}>
        <span
          className={`font-mono text-[12.5px] font-semibold ${myPercentage !== null ? "text-[#1C1D22]" : "text-[#A6AAB2]"}`}
        >
          {myPercentage !== null ? `${myPercentage}%` : "—"}
        </span>
      </div>

      {/* Sellos */}
      <div className={visibility("labels")}>
        <SongLabelsBadge labels={getSongLabels(song)} count={songLabelCount(song)} />
      </div>

      {/* Acciones */}
      <div className="flex items-center justify-end gap-1">
        {isOwnerView && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOwnerSplit(song);
            }}
            disabled={ownerSplitDone}
            title={
              ownerSplitDone
                ? "Esta canción ya tiene tu parte asignada"
                : "Asignar tu parte de esta canción"
            }
            aria-label={
              ownerSplitDone
                ? `${song.trackTitle} ya tiene split`
                : `Asignar split a ${song.trackTitle}`
            }
            className={`flex flex-shrink-0 items-center gap-1.5 rounded-[15px] px-2 py-1.5 text-[11.5px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5C00] lg:px-3 ${
              ownerSplitDone
                ? "cursor-not-allowed bg-[#F4F5F7] text-[#A6AAB2]"
                : "bg-[#FFEADD] text-[#FF5C00] hover:bg-[#FFDCC7]"
            }`}
          >
            <Crown className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="hidden lg:inline">{ownerSplitDone ? "Listo" : "Split"}</span>
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onQuickView(song);
          }}
          title="Vista rápida"
          aria-label={`Vista rápida de ${song.trackTitle}`}
          className="flex h-8 w-8 items-center justify-center rounded-full text-[#A6AAB2] transition-colors hover:bg-white hover:text-[#1C1D22] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5C00]"
        >
          <Eye className="h-4 w-4" />
        </button>
        <ChevronRight className="h-4 w-4 flex-shrink-0 text-[#A6AAB2]" />
      </div>
    </div>
  );
}
