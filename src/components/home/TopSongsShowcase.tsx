import { Link } from "react-router-dom";
import { ChevronRight, Music, Play } from "lucide-react";
import { formatStreams, formatCurrency } from "@/utils/format.utils";
import type { TopSong } from "@/types";

interface TopSongsShowcaseProps {
  songs: TopSong[];
  /** Ingreso histórico total, para decir qué parte aporta la #1. */
  historicalIncome: number;
}

/** Degradados cálidos para las canciones sin portada de Spotify. */
const COVER_FALLBACKS = [
  "linear-gradient(135deg, #FFB067, #8A2A0E)",
  "linear-gradient(135deg, #E88FA5, #3A1420)",
  "linear-gradient(135deg, #FF5C00, #2A0E05)",
  "linear-gradient(135deg, #F7EDE6, #8A6A55)",
  "linear-gradient(135deg, #FA8CA6, #FF5C00 55%, #591A0A)",
];

/** Devuelve la URL de portada de Spotify o `undefined` si no existe. */
function coverUrl(song: TopSong): string | undefined {
  return song.spotifyData?.album?.images?.[0]?.url;
}

function Cover({ song, size, index }: { song: TopSong; size: string; index: number }) {
  const cover = coverUrl(song);
  return (
    <div
      className={`${size} flex flex-shrink-0 items-center justify-center overflow-hidden`}
      style={cover ? undefined : { background: COVER_FALLBACKS[index % COVER_FALLBACKS.length] }}
    >
      {cover ? (
        <img src={cover} alt={song.trackTitle} className="h-full w-full object-cover" />
      ) : (
        <Music className="h-1/3 w-1/3 text-white/60" />
      )}
    </div>
  );
}

/**
 * Canciones principales como tracklist: la #1 destacada y el resto en filas
 * numeradas con sus streams e ingresos. El orden lo marca el ingreso histórico.
 */
export function TopSongsShowcase({ songs, historicalIncome }: TopSongsShowcaseProps) {
  const [featured, ...rest] = songs;

  return (
    <section className="glass flex flex-col gap-[18px] rounded-[32px] px-7 py-6" data-tour="top-songs">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="font-display text-[19px] font-medium tracking-[-0.005em] text-white">
            Canciones principales
          </h2>
          <span className="text-[12.5px] text-white/65">Por ingresos generados · histórico</span>
        </div>
        <Link
          to="/panel/music?view=songs"
          className="flex items-center gap-1 text-[12.5px] font-medium text-white transition-colors hover:text-[#FFB067]"
        >
          Ver todas
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {songs.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-3xl bg-black/[0.22] py-12">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.08]">
            <Music className="h-7 w-7 text-white/50" />
          </div>
          <h3 className="text-sm font-semibold text-white">Sin canciones aún</h3>
          <p className="max-w-xs text-center text-xs text-white/65">
            Sube tu primera canción para comenzar a ver el rendimiento de tu música
          </p>
          <Link
            to="/panel/music?view=songs"
            className="flex items-center gap-2 rounded-full bg-[#FF5C00] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#EA580C]"
          >
            <Music className="h-4 w-4" />
            Subir canción
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-6 min-[1360px]:flex-row">
          <FeaturedSong song={featured} historicalIncome={historicalIncome} />
          {rest.length > 0 && (
            <div className="flex min-w-0 flex-1 flex-col divide-y divide-white/[0.09]">
              {rest.slice(0, 4).map((song, i) => (
                <SongRow key={song._id} song={song} rank={i + 2} />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

/** La canción #1: portada grande, lo que aporta al total y acceso a su detalle. */
function FeaturedSong({ song, historicalIncome }: { song: TopSong; historicalIncome: number }) {
  const income = song.totalNetIncome ?? 0;
  const share = historicalIncome > 0 ? income / historicalIncome : 0;
  // Una canción en la que se colabora puede no sumar en el total propio: si el
  // porcentaje no tiene sentido, no se muestra.
  const showShare = share > 0 && share <= 1;

  return (
    <Link
      to={`/panel/song/${song._id}`}
      className="group flex flex-col gap-4 rounded-3xl border border-white/[0.16] bg-black/[0.22] p-[18px] transition-colors hover:bg-black/30 min-[1360px]:w-[300px] min-[1360px]:flex-shrink-0"
    >
      <span className="w-fit rounded-full bg-[#FF5C00] px-2.5 py-1 text-[11px] font-semibold text-white">
        #1 en ingresos
      </span>

      <div className="flex items-center gap-3.5">
        <Cover song={song} size="h-[72px] w-[72px] rounded-[18px]" index={4} />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <h3 className="truncate font-display text-[19px] font-medium text-white">{song.trackTitle || "Canción"}</h3>
          <p className="truncate text-[12.5px] text-white/65">{song.artistName ?? ""}</p>
        </div>
        <span className="flex h-[46px] w-[46px] flex-shrink-0 items-center justify-center rounded-full bg-[#FF5C00] shadow-[0_6px_16px_-2px_rgba(255,92,0,0.4)] transition-transform group-hover:scale-105">
          <Play className="h-[18px] w-[18px] fill-white text-white" />
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[15px] font-medium text-[#45D39A]">{formatCurrency(income)}</span>
          {showShare && (
            <span className="text-[12.5px] text-white/65">· {Math.round(share * 100)}% de tus ingresos</span>
          )}
        </div>
        {showShare && (
          <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.12]">
            <div className="h-full rounded-full bg-[#FF5C00]" style={{ width: `${share * 100}%` }} />
          </div>
        )}
      </div>

      <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/[0.07] px-3 py-1.5 text-[11.5px] font-medium text-white">
        <Play className="h-[11px] w-[11px] fill-white/70 text-white/70" />
        {formatStreams(song.totalStreams ?? 0)} streams
      </span>
    </Link>
  );
}

/** Fila de la tracklist con posición, identidad y cifras de la canción. */
function SongRow({ song, rank }: { song: TopSong; rank: number }) {
  return (
    <Link
      to={`/panel/song/${song._id}`}
      className="flex items-center gap-3.5 rounded-2xl px-2.5 py-2.5 transition-colors hover:bg-white/[0.05]"
    >
      <span className="w-5 font-mono text-xs font-medium text-white/50">{String(rank).padStart(2, "0")}</span>
      <Cover song={song} size="h-10 w-10 rounded-xl" index={rank - 2} />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[13.5px] font-semibold text-white">{song.trackTitle || "Canción"}</span>
        <span className="truncate text-[11.5px] text-white/50">{song.artistName ?? ""}</span>
      </div>
      <span className="hidden flex-shrink-0 items-center gap-1.5 font-mono text-sm font-medium text-white/70 sm:flex">
        <Play className="h-2.5 w-2.5 fill-white/50 text-white/50" />
        {formatStreams(song.totalStreams ?? 0)}
      </span>
      <span className="w-[88px] flex-shrink-0 text-right font-mono text-sm font-medium text-[#45D39A]">
        {formatCurrency(song.totalNetIncome ?? 0)}
      </span>
      <ChevronRight className="h-4 w-4 flex-shrink-0 text-white/50" />
    </Link>
  );
}
