import { Link, useNavigate } from "react-router-dom";
import { Music, Play, Eye, ChevronRight, Crown } from "lucide-react";
import { hasAnySplit, hasOwnerSplit, getSongLabels, songLabelCount } from "@/utils/music.utils";
import { viewerOwnsSong, viewerSplitPercentage, viewerAmount } from "@/utils/ownerVisibility";
import { formatStreams, formatCurrency } from "@/utils/format.utils";
import { CopyButton } from "@/components/ui/CopyButton";
import { CollaboratorAvatars } from "./CollaboratorAvatars";
import { SongLabelsBadge } from "./SongLabelsBadge";
import type { SongItem } from "@/types/music.types";

interface SongCardProps {
  song: SongItem;
  onQuickView: (song: SongItem) => void;
  /** Abre el reparto de esta canción sin salir del listado. */
  onOwnerSplit: (song: SongItem) => void;
  /** Igual que en `SongRow`: el neto solo se enseña al dueño. */
  showsIncome?: boolean;
}

/**
 * Tarjeta de canción para la vista de cuadrícula. Lleva los mismos datos que la
 * fila de la tabla; la portada tiñe de naranja cuando la canción no tiene split.
 */
export function SongCard({
  song,
  onQuickView,
  onOwnerSplit,
  showsIncome = false,
}: SongCardProps) {
  const navigate = useNavigate();
  const cover = song?.spotifyData?.album?.images?.[0]?.url;
  const split = hasAnySplit(song);
  const to = `/panel/song/${song._id}`;
  const myPercentage = viewerSplitPercentage(song);
  const percentage = myPercentage !== null ? `${myPercentage}%` : "—";
  // Igual que en la fila: el split del owner solo lo fija su dueño.
  const isOwnerView = viewerOwnsSong(song);
  const ownerSplitDone = hasOwnerSplit(song);
  const money =
    showsIncome && viewerOwnsSong(song)
      ? Number(song?.totalNetIncome ?? song?.netIncome ?? 0)
      : viewerAmount(song);

  return (
    <div
      onClick={() => navigate(to)}
      className="flex cursor-pointer flex-col overflow-hidden rounded-[22px] border border-[#E8E8EC] bg-white transition-shadow hover:shadow-[0_10px_28px_-12px_rgba(255,92,0,0.25)]"
    >
      <div className={`relative aspect-square w-full ${split ? "bg-[#F4F5F7]" : "bg-[#FFEADD]"}`}>
        {cover ? (
          <img src={cover} alt={song.trackTitle} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Music className={`h-8 w-8 ${split ? "text-[#A6AAB2]/60" : "text-[#FF5C00]/40"}`} />
          </div>
        )}
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-[5px]">
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
        <button
          onClick={(e) => {
            e.stopPropagation();
            onQuickView(song);
          }}
          title="Vista rápida"
          aria-label={`Vista rápida de ${song.trackTitle}`}
          className="absolute right-3 top-3 flex h-[30px] w-[30px] items-center justify-center rounded-full bg-white text-[#71757E] transition-colors hover:text-[#1C1D22] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5C00]"
        >
          <Eye className="h-[14px] w-[14px]" />
        </button>
      </div>

      <div className="flex flex-col gap-[11px] p-4">
        <div className="flex flex-col">
          <Link
            to={to}
            onClick={(e) => e.stopPropagation()}
            className="truncate text-[14.5px] font-semibold text-[#1C1D22] transition-colors hover:text-[#FF5C00]"
            title={song.trackTitle}
          >
            {song.trackTitle}
          </Link>
          <span className="truncate text-[11.5px] text-[#A6AAB2]">
            {song?.artistName ?? "Artista desconocido"}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-mono text-[11.5px] text-[#71757E]">
            <Play className="h-3 w-3 text-[#A6AAB2]" />
            {formatStreams(song?.totalStreams ?? 0)}
          </span>
          <span className="font-mono text-[14px] font-semibold text-[#2FB37E]">
            {formatCurrency(money)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <span className="truncate font-mono text-[10.5px] text-[#A6AAB2]">
              {song?.isrc ?? "—"}
            </span>
            {song?.isrc && <CopyButton value={song.isrc} title="Copiar ISRC" />}
          </span>
          <span className="flex flex-shrink-0 items-center gap-2">
            <span
              className={`font-mono text-[11.5px] font-semibold ${myPercentage !== null ? "text-[#1C1D22]" : "text-[#A6AAB2]"}`}
            >
              {percentage}
            </span>
            <SongLabelsBadge labels={getSongLabels(song)} count={songLabelCount(song)} />
          </span>
        </div>

        <div className="h-px bg-[#E8E8EC]" />

        <div className="flex items-center justify-between gap-2">
          <CollaboratorAvatars collaborators={song?.collaborators} emptyLabel="Sin colaboradores" />
          {isOwnerView && !ownerSplitDone ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOwnerSplit(song);
              }}
              title="Asignar tu parte de esta canción"
              aria-label={`Asignar split a ${song.trackTitle}`}
              className="flex flex-shrink-0 items-center gap-1.5 rounded-[14px] bg-[#FFEADD] px-2.5 py-1.5 text-[11px] font-semibold text-[#FF5C00] transition-colors hover:bg-[#FFDCC7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5C00]"
            >
              <Crown className="h-3.5 w-3.5" />
              Split
            </button>
          ) : (
            <ChevronRight className="h-4 w-4 flex-shrink-0 text-[#A6AAB2]" />
          )}
        </div>
      </div>
    </div>
  );
}
