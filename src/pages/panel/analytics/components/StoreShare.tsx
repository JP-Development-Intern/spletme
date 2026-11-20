import { formatCurrency, formatStreams } from "@/utils/format.utils";
import type { PieChartEntry } from "@/types/analytics.types";
import { AnalyticsPanel, PanelState } from "./AnalyticsPanel";
import { displayName, formatPerThousand, perThousand, platformColor } from "../analytics.utils";

interface Props {
  data: PieChartEntry[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  filtered: boolean;
  onClearFilters: () => void;
}

/**
 * Reparto de los ingresos entre tiendas: las cinco primeras y el resto junto.
 *
 * Era una dona con colores genéricos y porcentajes encima de las porciones. Se
 * cambia por una barra al 100 % con el color de marca de cada tienda y la lista
 * debajo: las cifras exactas se leen en la lista, y la barra cuenta la
 * proporción sin depender de comparar ángulos.
 */
export default function StoreShare({ data, loading, error, onRetry, filtered, onClearFilters }: Props) {
  const colored = data.map((entry, i) => ({
    ...entry,
    label: displayName(entry.name),
    color: entry.name === "Others" ? "rgba(255,255,255,0.28)" : platformColor(entry.name, i),
  }));

  return (
    <AnalyticsPanel title="Tiendas" subtitle="Reparto de los ingresos netos">
      <PanelState
        loading={loading}
        error={error}
        empty={data.length === 0}
        onRetry={onRetry}
        filtered={filtered}
        onClearFilters={onClearFilters}
        height="h-[260px]"
      >
        <div
          className="flex h-3.5 w-full gap-[3px] overflow-hidden rounded-full"
          role="img"
          aria-label={colored.map((e) => `${e.label} ${e.percentage}%`).join(", ")}
        >
          {colored.map((entry) => (
            <span
              key={entry.name}
              className="h-full first:rounded-l-full last:rounded-r-full"
              style={{ width: `${Math.max(entry.percentage, 0.8)}%`, backgroundColor: entry.color }}
            />
          ))}
        </div>

        <ul className="mt-4 flex flex-col divide-y divide-white/[0.07]">
          {colored.map((entry) => (
            <li key={entry.name} className="flex items-center gap-3 py-2.5">
              <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: entry.color }} />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[13px] text-white">{entry.label}</span>
                <span className="truncate text-[11.5px] text-white/50">
                  {formatStreams(entry.streams)} streams · {formatPerThousand(perThousand(entry.value, entry.streams))} /1K
                </span>
              </div>
              <span className="font-mono text-[12.5px] text-white/65">{formatCurrency(entry.value)}</span>
              <span className="w-12 text-right font-mono text-sm font-medium text-white">{entry.percentage}%</span>
            </li>
          ))}
        </ul>
      </PanelState>
    </AnalyticsPanel>
  );
}
