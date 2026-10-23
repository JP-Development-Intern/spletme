import { Link } from "react-router-dom";
import { Disc3, Music, Play, CircleAlert, Crown } from "lucide-react";
import { formatStreams, formatCurrency } from "@/utils/format.utils";
import { albumSplitCoverage, getAlbumLabels } from "@/utils/music.utils";
import { SplitCoverageBar } from "./SplitCoverageBar";
import { SongLabelsBadge } from "./SongLabelsBadge";
import type { AlbumItem } from "@/types/music.types";

interface AlbumCardProps {
  album: AlbumItem;
  onOwnerSplit: (album: AlbumItem) => void;
}

/**
 * Tarjeta de álbum para la cuadrícula.
 *
 * La cuadrícula existe aquí y no en canciones porque un álbum se reconoce por su
 * portada; una canción se compara por sus cifras, y para eso la lista es mejor.
 */
export function AlbumCard({ album, onOwnerSplit }: AlbumCardProps) {
  const { withSplit, total } = albumSplitCoverage(album);
  const complete = total > 0 && withSplit === total;
  const none = withSplit === 0;
  const missing = Math.max(0, total - withSplit);
  const cover = album.image ?? album.coverImage?.[0]?.[0]?.url;
  const to = `/panel/album/upc/${encodeURIComponent(album.upc)}`;

  return (
    <div className="flex flex-col overflow-hidden rounded-[22px] border border-[#E8E8EC] bg-white shadow-[0_10px_28px_-12px_rgba(255,92,0,0.15)]">
      <Link to={to} className="relative block h-[150px] w-full overflow-hidden bg-[#F4F5F7]">
        {cover ? (
          <img
            src={cover}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.03]"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center">
            <Disc3 className="h-10 w-10 text-[#D9DAE0]" />
          </span>
        )}

        <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-xl bg-[#101114]/50 px-2.5 py-1 backdrop-blur-sm">
          <Music className="h-[11px] w-[11px] text-white" />
          <span className="font-mono text-[10.5px] font-semibold text-white">
            {total || album.totalTracks || 0}
          </span>
        </span>

        {!complete && (
          <span
            className={`absolute right-3 top-3 flex items-center gap-1.5 rounded-xl px-2.5 py-1 ${
              none ? "bg-[#E5484D]" : "bg-white"
            }`}
          >
            <CircleAlert className={`h-[11px] w-[11px] ${none ? "text-white" : "text-[#FF5C00]"}`} />
            <span
              className={`text-[10px] font-semibold ${none ? "text-white" : "text-[#EA580C]"}`}
            >
              {none ? "Sin split" : `${missing} sin split`}
            </span>
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-3.5">
        <div className="flex min-w-0 flex-col gap-0.5">
          <Link
            to={to}
            title={album.albumTitle}
            className="truncate text-[13px] font-semibold text-[#1C1D22] transition-colors hover:text-[#FF5C00]"
          >
            {album.albumTitle}
          </Link>
          <span className="truncate text-[11px] text-[#A6AAB2]">{album.artistName}</span>
        </div>

        <SplitCoverageBar withSplit={withSplit} total={total} />

        <div className="h-px bg-[#E8E8EC]" />

        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5">
            <Play className="h-[11px] w-[11px] text-[#A6AAB2]" />
            <span className="font-mono text-[11px] text-[#71757E]">
              {formatStreams(album.totalStreams ?? 0)}
            </span>
          </span>
          <SongLabelsBadge labels={getAlbumLabels(album)} noun="álbum" />
          <span className="font-mono text-[12px] font-semibold text-[#2FB37E]">
            {formatCurrency(album.totalNetIncome ?? 0)}
          </span>
        </div>

        {!complete && (
          <button
            onClick={() => onOwnerSplit(album)}
            className="flex items-center justify-center gap-1.5 rounded-[14px] bg-[#FFEADD] py-2 text-[11.5px] font-semibold text-[#FF5C00] transition-colors hover:bg-[#FFDCC7]"
          >
            <Crown className="h-3.5 w-3.5" />
            Asignar split
          </button>
        )}
      </div>
    </div>
  );
}
