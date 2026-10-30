import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowDown, ChevronDown, ChevronRight, Music, TriangleAlert } from "lucide-react";
import { avatarTextColor } from "@/utils/collaborators.utils";
import { formatCurrency, formatStreams } from "@/utils/format.utils";
import type { SharedSong } from "@/hooks/useCollaboratorSongs";
import type { Collaborator } from "@/types";
import type { MoneyView } from "./CollaboratorDial";

interface CollaboratorSongsPanelProps {
  collaborator: Collaborator;
  color: string;
  view: MoneyView;
  /** Ya ordenadas según la vista: mayor saldo en Pagos, mayor ingreso en Ingresos. */
  songs: SharedSong[];
  loading: boolean;
  failed: boolean;
  onRetry: () => void;
}

/** Las que se ven de entrada; el resto se despliega. */
const INITIAL_ROWS = 6;

/** Degradados de la app para las canciones sin portada de Spotify. */
const COVER_FALLBACKS = [
  "linear-gradient(135deg, #FFB067, #8A2A0E)",
  "linear-gradient(135deg, #E88FA5, #3A1420)",
  "linear-gradient(135deg, #FF5C00, #2A0E05)",
  "linear-gradient(135deg, #F7EDE6, #8A6A55)",
  "linear-gradient(135deg, #FA8CA6, #591A0A)",
];

/**
 * Canciones que compartes con la persona enfocada en el carrusel. Cambia con
 * ella, y sus columnas siguen al interruptor Ingresos / Pagos.
 */
export function CollaboratorSongsPanel({
  collaborator,
  color,
  view,
  songs,
  loading,
  failed,
  onRetry,
}: CollaboratorSongsPanelProps) {
  const [expanded, setExpanded] = useState(false);

  // Al cambiar de persona se vuelve a la vista corta.
  useEffect(() => setExpanded(false), [collaborator.id]);

  const shown = expanded ? songs : songs.slice(0, INITIAL_ROWS);
  const hidden = songs.length - INITIAL_ROWS;
  const total = loading ? collaborator.songs : songs.length;

  return (
    <section className="glass overflow-hidden rounded-[32px]" aria-labelledby="shared-songs-title">
      <header className="flex items-center gap-3 px-6 pb-[18px] pt-[22px]">
        <span
          aria-hidden="true"
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full font-display text-[13px] font-semibold ring-2 ring-[#F7EDE6] ring-offset-0"
          style={{ backgroundColor: color, color: avatarTextColor(color) }}
        >
          {collaborator.initials}
        </span>
        <div className="flex min-w-0 flex-col gap-0.5">
          <h2
            id="shared-songs-title"
            className="truncate font-display text-[19px] font-medium tracking-[-0.005em] text-white"
          >
            Canciones con {collaborator.name}
          </h2>
          <p className="text-[12.5px] text-white/65">
            {total.toLocaleString()} {total === 1 ? "canción" : "canciones"} en tu catálogo ·{" "}
            {view === "out" ? "mayor saldo por pagar primero" : "más ingreso primero"}
          </p>
        </div>
      </header>

      {failed ? (
        <div className="flex flex-wrap items-center gap-3 border-t border-white/[0.09] px-6 py-5">
          <TriangleAlert className="h-4 w-4 flex-shrink-0 text-[#FF8F92]" />
          <span className="flex-1 text-[13px] text-white/80">
            No se pudieron cargar las canciones de {collaborator.name}.
          </span>
          <button
            type="button"
            onClick={onRetry}
            className="glass-control rounded-full px-4 py-2 text-[12.5px] font-semibold text-white hover:bg-white/[0.12]"
          >
            Reintentar
          </button>
        </div>
      ) : !loading && songs.length === 0 ? (
        <div className="flex flex-col items-center gap-2 border-t border-white/[0.09] px-6 py-10 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.08]">
            <Music className="h-5 w-5 text-white/50" />
          </span>
          <p className="text-sm font-semibold text-white">Todavía no compartes canciones con {collaborator.name}</p>
          <p className="max-w-sm text-[12.5px] text-white/65">
            Cuando le asignes un split en una canción, aparecerá aquí con lo que le corresponde.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 border-t border-white/[0.09] bg-black/[0.08] px-5 py-2.5 sm:gap-4 sm:px-6">
            <ColumnLabel className="flex-1">CANCIÓN</ColumnLabel>
            {view === "out" ? (
              <>
                <ColumnLabel className="hidden w-[90px] md:block">SU SPLIT</ColumnLabel>
                <ColumnLabel className="hidden w-[120px] md:block">SU PARTE</ColumnLabel>
                <ColumnLabel className="w-[112px] sm:w-[250px]" sorted>
                  SALDO
                </ColumnLabel>
              </>
            ) : (
              <>
                <ColumnLabel className="hidden w-[110px] sm:block">STREAMS</ColumnLabel>
                <ColumnLabel className="w-[96px] sm:w-[140px]" sorted>
                  INGRESO NETO
                </ColumnLabel>
                <ColumnLabel className="hidden w-[90px] md:block">SU SPLIT</ColumnLabel>
              </>
            )}
            <span className="hidden w-10 sm:block" />
          </div>

          <ul>
            {loading
              ? Array.from({ length: Math.min(INITIAL_ROWS, Math.max(collaborator.songs, 3)) }, (_, i) => (
                  <li key={i} className="flex items-center gap-3.5 border-t border-white/[0.09] px-6 py-3">
                    <span className="h-11 w-11 animate-pulse rounded-xl bg-white/[0.08]" />
                    <span className="flex flex-1 flex-col gap-2">
                      <span className="h-2.5 w-40 animate-pulse rounded-full bg-white/[0.08]" />
                      <span className="h-2 w-24 animate-pulse rounded-full bg-white/[0.06]" />
                    </span>
                  </li>
                ))
              : shown.map((song, index) => (
                  <li key={song.songId} className="border-t border-white/[0.09]">
                    <SongRow song={song} view={view} index={index} />
                  </li>
                ))}
          </ul>

          {!loading && hidden > 0 && (
            <div className="flex justify-center border-t border-white/[0.09] px-6 py-3.5">
              <button
                type="button"
                onClick={() => setExpanded((open) => !open)}
                aria-expanded={expanded}
                className="glass-control flex items-center gap-1.5 rounded-full px-4 py-[9px] text-[12.5px] font-semibold text-white transition-colors hover:bg-white/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70"
              >
                {expanded
                  ? "Mostrar menos"
                  : `Ver ${hidden === 1 ? "la canción restante" : `las ${hidden} canciones restantes`}`}
                <ChevronDown
                  className={`h-[15px] w-[15px] text-white/65 transition-transform ${expanded ? "rotate-180" : ""}`}
                />
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function ColumnLabel({
  children,
  className = "",
  sorted = false,
}: {
  children: React.ReactNode;
  className?: string;
  sorted?: boolean;
}) {
  return (
    <span
      className={`flex items-center gap-1 text-[10.5px] font-medium tracking-[1.4px] ${
        sorted ? "text-white" : "text-white/50"
      } ${className}`}
    >
      {children}
      {sorted && <ArrowDown className="h-3 w-3 text-[#FF8A3D]" aria-label="orden descendente" />}
    </span>
  );
}

function SongRow({ song, view, index }: { song: SharedSong; view: MoneyView; index: number }) {
  const split = song.splitPercentage != null ? `${song.splitPercentage} %` : "—";
  const paidShare = song.owed > 0 ? Math.min(100, (song.paid / song.owed) * 100) : 0;

  return (
    <Link
      to={`/panel/song/${song.songId}`}
      className="group flex items-center gap-3 px-5 py-3 sm:gap-4 sm:px-6 transition-colors hover:bg-white/[0.04] focus-visible:bg-white/[0.06] focus-visible:outline-none"
    >
      <span className="flex min-w-0 flex-1 items-center gap-3.5">
        <span
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl"
          style={song.coverUrl ? undefined : { background: COVER_FALLBACKS[index % COVER_FALLBACKS.length] }}
        >
          {song.coverUrl ? (
            <img src={song.coverUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <Music className="h-4 w-4 text-white/60" />
          )}
        </span>
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate text-[13.5px] font-semibold text-white">{song.title}</span>
          <span className="truncate text-[11.5px] text-white/50">{song.artist}</span>
        </span>
      </span>

      {view === "out" ? (
        <>
          <span className="hidden w-[90px] text-[13px] font-medium text-white md:block">{split}</span>
          <span className="hidden w-[120px] font-mono text-[15px] text-white md:block">
            {formatCurrency(song.owed)}
          </span>
          <span className="flex w-[112px] flex-col gap-[7px] sm:w-[250px]">
            <span className="flex items-end justify-between gap-2">
              <span
                className={`truncate text-[12.5px] ${
                  song.pending > 0 ? "font-semibold text-[#FF8A3D]" : "text-white/50"
                }`}
              >
                {song.pending > 0 ? `${formatCurrency(song.pending)} por pagar` : song.owed > 0 ? "Al día" : "Sin movimientos"}
              </span>
              {song.paid > 0 && (
                <span className="hidden flex-shrink-0 text-[10px] text-white/50 sm:block">
                  {formatCurrency(song.paid)} pagado
                </span>
              )}
            </span>
            <span
              className="flex h-1.5 overflow-hidden rounded-full bg-white/10"
              role="img"
              aria-label={
                song.owed > 0
                  ? `${formatCurrency(song.paid)} pagado y ${formatCurrency(song.pending)} pendiente`
                  : "Sin movimientos de dinero"
              }
            >
              {song.paid > 0 && <span className="h-full bg-[#2FB37E]" style={{ width: `${paidShare}%` }} />}
              {song.pending > 0 && <span className="h-full flex-1 bg-[#FF5C00]" />}
            </span>
          </span>
        </>
      ) : (
        <>
          <span className="hidden w-[110px] text-[13px] font-medium text-white sm:block">
            {formatStreams(song.streams)}
          </span>
          <span className="w-[96px] font-mono text-[15px] text-[#45D39A] sm:w-[140px]">
            {formatCurrency(song.netIncome)}
          </span>
          <span className="hidden w-[90px] text-[13px] font-medium text-white md:block">{split}</span>
        </>
      )}

      <span className="hidden h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white/[0.04] transition-colors group-hover:bg-white/[0.1] sm:flex">
        <ChevronRight className="h-4 w-4 text-white/65" />
      </span>
    </Link>
  );
}
