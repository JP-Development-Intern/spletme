import { Link, useNavigate } from "react-router-dom";
import { Music, Tag, ChevronRight, Eye, Crown, Check } from "lucide-react";
import { hasAnySplit, hasOwnerSplit } from "@/utils/music.utils";
import { viewerOwnsSong, viewerSplitPercentage, viewerAmount } from "@/utils/ownerVisibility";
import { formatStreams, formatCurrency } from "@/utils/format.utils";
import { CopyButton } from "@/components/ui/CopyButton";
import { CollaboratorAvatars } from "./CollaboratorAvatars";
import { SongAlbumsBadge } from "./SongAlbumsBadge";
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
      className={`${SONGS_GRID} group cursor-pointer px-5 py-3 transition-colors hover:bg-white/[0.04]`}
    >
      {/* Canción */}
      <div className="flex min-w-0 items-center gap-3">
        <div className="h-11 w-11 flex-shrink-0 overflow-hidden rounded-xl">
          {cover ? (
            <img src={cover} alt={song.trackTitle} className="h-full w-full object-cover" />
          ) : (
            <div
              className={`flex h-full w-full items-center justify-center ${split ? "bg-white/[0.08]" : "bg-[#FF5C00]/[0.16]"}`}
            >
              <Music className={`h-4 w-4 ${split ? "text-white/50" : "text-[#FF8A3D]"}`} />
            </div>
          )}
        </div>
        <div className="flex min-w-0 flex-col gap-0.5">
          <Link
            to={to}
            onClick={(e) => e.stopPropagation()}
            className="truncate text-[13.5px] font-semibold text-white transition-colors group-hover:text-[#FFB067]"
            title={song.trackTitle}
          >
            {song.trackTitle}
          </Link>
          <span className="flex min-w-0 items-center gap-1.5">
            <span className="truncate text-[11.5px] text-white/50">{song?.artistName ?? "—"}</span>
            {song?.isrc && (
              <>
                <span className="text-[11px] text-white/40">·</span>
                <span className="truncate text-[11px] text-white/50">{song.isrc}</span>
                <span onClick={(e) => e.stopPropagation()}>
                  <CopyButton
                    value={song.isrc}
                    title="Copiar ISRC"
                    className="!text-white/45 hover:!bg-white/10 hover:!text-[#FFB067]"
                  />
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
          style={{ backgroundColor: split ? "rgba(69, 211, 154, 0.12)" : "rgba(255, 92, 0, 0.16)" }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: split ? "#45D39A" : "#FF8A3D" }}
          />
          <span
            className="text-[11.5px] font-semibold"
            style={{ color: split ? "#45D39A" : "#FF8A3D" }}
          >
            {split ? "Con split" : "Sin split"}
          </span>
        </span>
      </div>

      {/* Streams */}
      <div className={`${visibility("streams")} items-center`}>
        <span className="text-[13px] font-medium text-white">
          {formatStreams(song?.totalStreams ?? 0)}
        </span>
      </div>

      {/* Ingresos */}
      <div className={visibility("income")}>
        <span className="font-mono text-[15px] text-[#45D39A]">
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
          className={`text-[13px] font-semibold ${myPercentage !== null ? "text-white" : "text-white/50"}`}
        >
          {myPercentage !== null ? `${myPercentage}%` : "—"}
        </span>
        {(song?.labelCount ?? 0) > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#FF5C00]/[0.16] px-2 py-0.5 text-[10.5px] font-semibold text-[#FF9A5C]">
            <Tag className="h-2.5 w-2.5" />
            {song.labelCount}
          </span>
        )}
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
            className={`flex flex-shrink-0 items-center gap-1.5 rounded-full border px-2 py-[7px] text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70 lg:px-3 ${
              ownerSplitDone
                ? "cursor-not-allowed border-transparent bg-[#45D39A]/10 text-[#45D39A]"
                : "border-[#FF8A3D]/35 bg-[#FF5C00]/[0.16] text-[#FF9A5C] hover:bg-[#FF5C00]/25"
            }`}
          >
            {ownerSplitDone ? (
              <Check className="h-3.5 w-3.5 flex-shrink-0" />
            ) : (
              <Crown className="h-3.5 w-3.5 flex-shrink-0" />
            )}
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
          className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-white/[0.06] text-white/70 transition-colors hover:bg-white/[0.12] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70"
        >
          <Eye className="h-4 w-4" />
        </button>
        <ChevronRight className="h-4 w-4 flex-shrink-0 text-white/40" />
      </div>
    </div>
  );
}
