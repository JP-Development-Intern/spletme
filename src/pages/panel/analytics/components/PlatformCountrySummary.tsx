import { formatCurrency, formatStreams } from "@/utils/format.utils";
import type { PlatformCountryRow } from "@/types/analytics.types";
import { AnalyticsPanel, CountryCode, PanelState } from "./AnalyticsPanel";
import { countryLabel, displayName, formatPerThousand, perThousand, platformColor } from "../analytics.utils";

interface Props {
  data: PlatformCountryRow[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  filtered: boolean;
  onClearFilters: () => void;
}

/**
 * Las diez combinaciones de plataforma y país que más ingresan. Responde a
 * «dónde y en qué tienda» a la vez; el valor por 1.000 streams deja ver qué
 * mercado paga mejor aunque tenga menos volumen.
 */
export default function PlatformCountrySummary({ data, loading, error, onRetry, filtered, onClearFilters }: Props) {
  const max = data.length > 0 ? Math.max(...data.map((r) => r.netIncome)) : 1;

  return (
    <AnalyticsPanel title="Plataforma × país" subtitle="Las 10 combinaciones que más ingresan">
      <PanelState
        loading={loading}
        error={error}
        empty={data.length === 0}
        onRetry={onRetry}
        filtered={filtered}
        onClearFilters={onClearFilters}
        height="h-[260px]"
      >
        {/* A lo ancho de la página, en dos columnas que se leen de arriba abajo: 1–5 y 6–10. */}
        <ol className="gap-x-10 lg:columns-2 [&>li]:mb-3 [&>li]:break-inside-avoid">
          {data.map((row, i) => {
            const { code, name } = countryLabel(row.country);
            const color = platformColor(row.platform, i);
            return (
              <li key={`${row.platform}-${row.country}`} className="flex items-center gap-3">
                <span className="w-5 flex-shrink-0 text-right font-mono text-[12px] text-white/55">{i + 1}</span>
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: color }} />
                    <span className="truncate text-[13px] text-white">{displayName(row.platform)}</span>
                    <span className="text-white/30">·</span>
                    <span className="truncate text-[12.5px] text-white/65">{name}</span>
                    {code !== name && <CountryCode code={code} />}
                    <span className="ml-auto flex-shrink-0 font-mono text-[12.5px] text-white">
                      {formatCurrency(row.netIncome)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.08]">
                      <div
                        className="h-full rounded-full transition-[width] duration-500"
                        style={{ width: `${(row.netIncome / max) * 100}%`, backgroundColor: color }}
                      />
                    </div>
                    <span className="w-[120px] flex-shrink-0 text-right text-[11px] text-white/50">
                      {formatStreams(row.streams)} · {formatPerThousand(perThousand(row.netIncome, row.streams))}/1K
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </PanelState>
    </AnalyticsPanel>
  );
}
