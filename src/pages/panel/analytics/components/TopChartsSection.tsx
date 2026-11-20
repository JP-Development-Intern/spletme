import { useState } from "react";
import { Link } from "react-router-dom";
import { formatCurrency, formatStreams } from "@/utils/format.utils";
import type { TopArtist, TopLabel, TopSong } from "@/types/analytics.types";
import { AnalyticsPanel, PanelState, Segmented } from "./AnalyticsPanel";
import { formatPerThousand, perThousand } from "../analytics.utils";

type Dimension = "songs" | "artists" | "labels";

interface Props {
  topSongs: TopSong[];
  topArtists: TopArtist[];
  topLabels: TopLabel[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  filtered: boolean;
  onClearFilters: () => void;
}

interface RankRow {
  key: string;
  label: string;
  sub: string;
  income: number;
  streams: number;
  to?: string;
}

const DIMENSIONS: { value: Dimension; label: string }[] = [
  { value: "songs", label: "Canciones" },
  { value: "artists", label: "Artistas" },
  { value: "labels", label: "Sellos" },
];

const songsCount = (n: number) => `${n} ${n === 1 ? "canción" : "canciones"}`;

/**
 * Los cinco primeros por ingreso neto, de canciones, artistas o sellos.
 *
 * Eran tres tarjetas en paralelo y un gráfico de dispersión aparte para cruzar
 * streams con ingresos. Ahora es un solo ranking con conmutador, y el cruce se
 * lee en la columna «por 1.000 streams»: con cinco puntos, la dispersión no
 * enseñaba más que esa cifra, y obligaba a pasar el ratón por cada uno para
 * saber de qué canción era. El mejor valor se marca, que era lo que el gráfico
 * dejaba ver de un vistazo.
 */
export default function TopChartsSection({
  topSongs,
  topArtists,
  topLabels,
  loading,
  error,
  onRetry,
  filtered,
  onClearFilters,
}: Props) {
  const [dimension, setDimension] = useState<Dimension>("songs");

  const rows: RankRow[] =
    dimension === "songs"
      ? topSongs.map((s) => ({
          key: s.songId,
          label: s.trackTitle || "Sin título",
          sub: s.artistName || "—",
          income: s.netIncome,
          streams: s.streams,
          to: s.songId ? `/panel/song/${s.songId}` : undefined,
        }))
      : dimension === "artists"
        ? topArtists.map((a) => ({
            key: a.artistName ?? "—",
            label: a.artistName || "Sin artista",
            sub: songsCount(a.songCount),
            income: a.netIncome,
            streams: a.streams,
          }))
        : topLabels.map((l) => ({
            key: l.labelId,
            label: l.labelName || "Sin sello",
            sub: songsCount(l.songCount),
            income: l.netIncome,
            streams: l.streams,
            to: `/panel/labels/${l.labelId}`,
          }));

  const max = rows.length > 0 ? Math.max(...rows.map((r) => r.income)) : 1;
  const rates = rows.map((r) => perThousand(r.income, r.streams));
  const bestRate = rows.length > 1 ? Math.max(...rates.map((r) => r ?? -1)) : null;

  return (
    <AnalyticsPanel
      title="Los que más ingresan"
      subtitle="Top 5 por ingreso neto"
      actions={<Segmented label="Ranking de" options={DIMENSIONS} value={dimension} onChange={setDimension} />}
    >
      <PanelState
        loading={loading}
        error={error}
        empty={rows.length === 0}
        onRetry={onRetry}
        filtered={filtered}
        onClearFilters={onClearFilters}
        height="h-[280px]"
      >
        <div className="hidden grid-cols-[28px_minmax(0,1fr)_110px_84px_104px] gap-3 px-1 pb-2 text-[10.5px] font-medium tracking-[1.4px] text-white/50 sm:grid">
          <span />
          <span>{DIMENSIONS.find((d) => d.value === dimension)!.label.toUpperCase()}</span>
          <span className="text-right">INGRESOS</span>
          <span className="text-right">STREAMS</span>
          <span className="text-right">POR 1.000</span>
        </div>
        <ol className="flex flex-col divide-y divide-white/[0.07] border-t border-white/[0.09]">
          {rows.map((row, i) => {
            const rate = rates[i];
            const isBest = bestRate !== null && rate !== null && rate === bestRate;
            const title = row.to ? (
              <Link
                to={row.to}
                className="truncate text-[13.5px] font-semibold text-white transition-colors hover:text-[#FFB067] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70"
              >
                {row.label}
              </Link>
            ) : (
              <span className="truncate text-[13.5px] font-semibold text-white">{row.label}</span>
            );
            return (
              <li
                key={`${dimension}-${row.key}-${i}`}
                className="grid grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-3 px-1 py-3 sm:grid-cols-[28px_minmax(0,1fr)_110px_84px_104px]"
              >
                <span
                  className={`font-mono text-[15px] font-light ${i === 0 ? "text-[#FF8A3D]" : "text-white/55"}`}
                >
                  {i + 1}
                </span>
                <div className="flex min-w-0 flex-col gap-1.5">
                  <div className="flex min-w-0 flex-col">
                    {title}
                    <span className="truncate text-[11.5px] text-white/50">{row.sub}</span>
                  </div>
                  <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.07]">
                    <div
                      className={`h-full rounded-full transition-[width] duration-500 ${i === 0 ? "bg-[#FF8A3D]" : "bg-white/40"}`}
                      style={{ width: `${(row.income / max) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-right font-mono text-[13px] text-[#45D39A]">
                  {formatCurrency(row.income)}
                  <span className="block text-[11px] text-white/50 sm:hidden">
                    {formatStreams(row.streams)} · {formatPerThousand(rate)}/1K
                  </span>
                </span>
                <span className="hidden text-right font-mono text-[12.5px] text-white/70 sm:block">
                  {formatStreams(row.streams)}
                </span>
                <span className="hidden items-center justify-end gap-1.5 sm:flex">
                  {isBest && (
                    <span className="rounded-full bg-[#FF5C00]/[0.18] px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide text-[#FFB48A]">
                      Mejor
                    </span>
                  )}
                  <span className={`font-mono text-[12.5px] ${isBest ? "text-[#FFB48A]" : "text-white/70"}`}>
                    {formatPerThousand(rate)}
                  </span>
                </span>
              </li>
            );
          })}
        </ol>
      </PanelState>
    </AnalyticsPanel>
  );
}
