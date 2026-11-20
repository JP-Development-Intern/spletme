import { formatCurrency, formatStreams } from "@/utils/format.utils";
import type { PieChartEntry } from "@/types/analytics.types";
import { AnalyticsPanel, CountryCode, PanelState } from "./AnalyticsPanel";
import { countryLabel } from "../analytics.utils";

interface Props {
  data: PieChartEntry[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  filtered: boolean;
  onClearFilters: () => void;
}

/**
 * Los diez países que más ingresan. Antes era una dona de diez porciones; con
 * tantas categorías los ángulos ya no se comparan, y un ranking de barras sí.
 * El porcentaje es sobre esos diez, que es lo que devuelve el endpoint.
 */
export default function CountryRanking({ data, loading, error, onRetry, filtered, onClearFilters }: Props) {
  const max = data.length > 0 ? Math.max(...data.map((d) => d.value)) : 1;

  return (
    <AnalyticsPanel title="Países" subtitle="Top 10 por ingreso neto">
      <PanelState
        loading={loading}
        error={error}
        empty={data.length === 0}
        onRetry={onRetry}
        filtered={filtered}
        onClearFilters={onClearFilters}
        height="h-[260px]"
      >
        <ol className="flex flex-col gap-3">
          {data.map((entry, i) => {
            const { code, name } = countryLabel(entry.name);
            return (
              <li key={entry.name} className="flex items-center gap-3">
                <span className="w-5 flex-shrink-0 text-right font-mono text-[12px] text-white/55">{i + 1}</span>
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="truncate text-[13px] text-white">{name}</span>
                    {code !== name && <CountryCode code={code} />}
                    <span className="ml-auto flex-shrink-0 font-mono text-[12.5px] text-white">
                      {formatCurrency(entry.value)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.08]">
                      <div
                        className="h-full rounded-full bg-[#FF8A3D] transition-[width] duration-500"
                        style={{ width: `${(entry.value / max) * 100}%` }}
                      />
                    </div>
                    <span className="w-[92px] flex-shrink-0 text-right text-[11px] text-white/50">
                      {entry.percentage}% · {formatStreams(entry.streams)}
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
