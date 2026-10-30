import { Link } from "react-router-dom";
import { Disc3, Music, CircleAlert, Crown } from "lucide-react";
import { formatStreams, formatCurrency } from "@/utils/format.utils";
import { albumSplitCoverage } from "@/utils/music.utils";
import { SplitCoverageBar } from "./SplitCoverageBar";
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
    <div className="glass group flex flex-col gap-3 rounded-[24px] p-3">
      <Link to={to} className="relative block aspect-square w-full overflow-hidden rounded-2xl bg-white/[0.08]">
        {cover ? (
          <img
            src={cover}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center">
            <Disc3 className="h-10 w-10 text-white/30" />
          </span>
        )}

        <span className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 rounded-full bg-[#140C08]/70 px-2.5 py-1 backdrop-blur-md">
          <Music className="h-[11px] w-[11px] text-white/80" />
          <span className="text-[10.5px] font-semibold text-white/80">
            {total || album.totalTracks || 0}
          </span>
        </span>

        {!complete && (
          <span className="absolute left-2.5 top-2.5 flex items-center gap-1.5 rounded-full bg-[#140C08]/70 px-2.5 py-1 backdrop-blur-md">
            <CircleAlert className={`h-[11px] w-[11px] ${none ? "text-[#FF8F92]" : "text-[#FF8A3D]"}`} />
            <span className={`text-[10.5px] font-semibold ${none ? "text-[#FF8F92]" : "text-[#FF8A3D]"}`}>
              {none ? "Sin split" : `${missing} sin split`}
            </span>
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-3 px-1">
        <div className="flex min-w-0 flex-col gap-0.5">
          <Link
            to={to}
            title={album.albumTitle}
            className="truncate text-sm font-semibold text-white transition-colors hover:text-[#FFB067]"
          >
            {album.albumTitle}
          </Link>
          <span className="truncate text-[11.5px] text-white/50">{album.artistName}</span>
        </div>

        <SplitCoverageBar withSplit={withSplit} total={total} onGlass />

        <div className="grid grid-cols-2 gap-2 border-t border-white/[0.09] pt-2.5">
          <span className="flex flex-col gap-[3px]">
            <span className="text-[9.5px] font-medium tracking-[1.3px] text-white/50">STREAMS</span>
            <span className="font-mono text-[15px] text-white">{formatStreams(album.totalStreams ?? 0)}</span>
          </span>
          <span className="flex flex-col gap-[3px]">
            <span className="text-[9.5px] font-medium tracking-[1.3px] text-white/50">INGRESOS</span>
            <span className="font-mono text-[15px] text-[#45D39A]">
              {formatCurrency(album.totalNetIncome ?? 0)}
            </span>
          </span>
        </div>

        {!complete && (
          <button
            onClick={() => onOwnerSplit(album)}
            className="mt-auto flex items-center justify-center gap-1.5 rounded-full border border-[#FF8A3D]/35 bg-[#FF5C00]/[0.16] py-2 text-xs font-semibold text-[#FF9A5C] transition-colors hover:bg-[#FF5C00]/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70"
          >
            <Crown className="h-3.5 w-3.5" />
            Asignar split
          </button>
        )}
      </div>
    </div>
  );
}
