import { Link, useNavigate } from "react-router-dom";
import { Music, Eye, Tag, ChevronRight, Crown, Check } from "lucide-react";
import { hasAnySplit, hasOwnerSplit } from "@/utils/music.utils";
import { viewerOwnsSong, viewerSplitPercentage, viewerAmount } from "@/utils/ownerVisibility";
import { formatStreams, formatCurrency } from "@/utils/format.utils";
import { CopyButton } from "@/components/ui/CopyButton";
import { CollaboratorAvatars } from "./CollaboratorAvatars";
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
      className="glass group flex cursor-pointer flex-col gap-3 rounded-[24px] p-3 transition-colors hover:bg-white/[0.1]"
    >
      <div
        className={`relative aspect-square w-full overflow-hidden rounded-2xl ${
          split ? "bg-white/[0.08]" : "bg-[#FF5C00]/[0.16]"
        }`}
      >
        {cover ? (
          <img src={cover} alt={song.trackTitle} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Music className={`h-8 w-8 ${split ? "text-white/40" : "text-[#FF8A3D]/70"}`} />
          </div>
        )}
        <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1.5 rounded-full bg-[#140C08]/70 px-2.5 py-1 backdrop-blur-md">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: split ? "#45D39A" : "#FF8A3D" }}
          />
          <span className="text-[11px] font-semibold" style={{ color: split ? "#45D39A" : "#FF8A3D" }}>
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
          className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-[#140C08]/70 text-white/90 backdrop-blur-md transition-colors hover:bg-[#140C08]/90 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70"
        >
          <Eye className="h-[15px] w-[15px]" />
        </button>
      </div>

      <div className="flex flex-col gap-0.5 px-1">
        <Link
          to={to}
          onClick={(e) => e.stopPropagation()}
          className="truncate text-sm font-semibold text-white transition-colors group-hover:text-[#FFB067]"
          title={song.trackTitle}
        >
          {song.trackTitle}
        </Link>
        <span className="truncate text-[11.5px] text-white/50">
          {song?.artistName ?? "Artista desconocido"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 px-1">
        <span className="flex flex-col gap-[3px]">
          <span className="text-[9.5px] font-medium tracking-[1.3px] text-white/50">STREAMS</span>
          <span className="font-mono text-[15px] text-white">{formatStreams(song?.totalStreams ?? 0)}</span>
        </span>
        <span className="flex flex-col gap-[3px]">
          <span className="text-[9.5px] font-medium tracking-[1.3px] text-white/50">
            {showsIncome ? "INGRESOS" : "TU PARTE"}
          </span>
          <span className="font-mono text-[15px] text-[#45D39A]">{formatCurrency(money)}</span>
        </span>
      </div>

      <div className="flex items-center justify-between gap-2 px-1">
        <span className="flex min-w-0 items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <span className="truncate text-[11px] text-white/50">{song?.isrc ?? "—"}</span>
          {song?.isrc && (
            <CopyButton
              value={song.isrc}
              title="Copiar ISRC"
              className="!text-white/45 hover:!bg-white/10 hover:!text-[#FFB067]"
            />
          )}
        </span>
        <span className="flex flex-shrink-0 items-center gap-1.5">
          <span className={`text-xs font-semibold ${myPercentage !== null ? "text-white" : "text-white/50"}`}>
            {percentage}
          </span>
          {(song?.labelCount ?? 0) > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#FF5C00]/[0.16] px-2 py-0.5 text-[10px] font-semibold text-[#FF9A5C]">
              <Tag className="h-2.5 w-2.5" />
              {song.labelCount}
            </span>
          )}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-white/[0.09] px-1 pt-2.5">
        <CollaboratorAvatars collaborators={song?.collaborators} />
        {isOwnerView && !ownerSplitDone ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOwnerSplit(song);
            }}
            title="Asignar tu parte de esta canción"
            aria-label={`Asignar split a ${song.trackTitle}`}
            className="flex flex-shrink-0 items-center gap-1.5 rounded-full border border-[#FF8A3D]/35 bg-[#FF5C00]/[0.16] px-2.5 py-1.5 text-[11.5px] font-semibold text-[#FF9A5C] transition-colors hover:bg-[#FF5C00]/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70"
          >
            <Crown className="h-3.5 w-3.5" />
            Split
          </button>
        ) : isOwnerView && ownerSplitDone ? (
          <span className="flex flex-shrink-0 items-center gap-1.5 rounded-full bg-[#45D39A]/10 px-2.5 py-1.5 text-[11.5px] font-semibold text-[#45D39A]">
            <Check className="h-3.5 w-3.5" />
            Listo
          </span>
        ) : (
          <ChevronRight className="h-4 w-4 flex-shrink-0 text-white/40" />
        )}
      </div>
    </div>
  );
}
