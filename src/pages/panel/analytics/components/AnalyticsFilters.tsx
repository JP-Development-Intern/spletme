import { useEffect, useState } from "react";
import { CalendarRange, CircleX, Globe2, Mic2, Radio, Tag } from "lucide-react";
import { FilterFacet } from "@/components/ui/FilterFacet";
import { MonthField } from "@/components/ui/MonthField";
import type { AnalyticsFilters, FilterOptions } from "@/types/analytics.types";
import { analyticsService } from "@/services/analyticsService";
import { countryLabel, formatMonth } from "../analytics.utils";

interface Props {
  filters: AnalyticsFilters;
  onChange: (filters: AnalyticsFilters) => void;
  /** Años con reportes: acotan los desplegables de fecha. */
  minYear: number;
  maxYear: number;
}

const ICON = "h-[14px] w-[14px]";

/**
 * Filtros de toda la página, siempre a la vista. Antes vivían plegados detrás
 * de un botón y era fácil olvidar que las cifras estaban recortadas: ahora cada
 * filtro enseña su valor en el sitio y se tiñe cuando está activo, que es lo
 * que hace de indicador de «filtros aplicados».
 */
export default function AnalyticsFiltersBar({ filters, onChange, minYear, maxYear }: Props) {
  const [options, setOptions] = useState<FilterOptions>({
    platforms: [],
    countries: [],
    artists: [],
    labels: [],
  });
  const [rangeOpen, setRangeOpen] = useState(Boolean(filters.startDate || filters.endDate));

  useEffect(() => {
    analyticsService
      .getFilterOptions()
      .then(setOptions)
      .catch(() => {});
  }, []);

  const update = (key: keyof AnalyticsFilters, value: string) => onChange({ ...filters, [key]: value || undefined });

  const activeCount = Object.values(filters).filter(Boolean).length;
  const hasRange = Boolean(filters.startDate || filters.endDate);
  const rangeInvalid = Boolean(filters.startDate && filters.endDate && filters.startDate > filters.endDate);

  const rangeSummary = hasRange
    ? `${filters.startDate ? formatMonth(filters.startDate) : "Inicio"} – ${
        filters.endDate ? formatMonth(filters.endDate) : "hoy"
      }`
    : "Todo el historial";

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setRangeOpen((open) => !open)}
          aria-expanded={rangeOpen}
          aria-controls="analytics-range"
          className={`flex min-h-[38px] items-center gap-2 rounded-full border px-3.5 text-[12.5px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70 ${
            hasRange
              ? "border-[#FF8A3D]/35 bg-[#FF5C00]/[0.16] text-[#FF9A5C]"
              : "glass-control border-white/[0.16] text-white hover:bg-white/[0.12]"
          }`}
        >
          <CalendarRange className={`${ICON} ${hasRange ? "" : "text-white/70"}`} />
          <span className={hasRange ? "text-[#FFB48A]" : "text-white/50"}>Periodo</span>
          <span className="font-semibold">{rangeSummary}</span>
        </button>

        <FilterFacet
          onGlass
          label="Plataforma"
          value={filters.platform ?? "Todas"}
          highlighted={Boolean(filters.platform)}
          icon={<Radio className={ICON} />}
        >
          <select
            aria-label="Plataforma"
            value={filters.platform ?? ""}
            onChange={(e) => update("platform", e.target.value)}
          >
            <option value="">Todas</option>
            {options.platforms.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </FilterFacet>

        <FilterFacet
          onGlass
          label="País"
          value={filters.country ? countryLabel(filters.country).name : "Todos"}
          highlighted={Boolean(filters.country)}
          icon={<Globe2 className={ICON} />}
        >
          <select aria-label="País" value={filters.country ?? ""} onChange={(e) => update("country", e.target.value)}>
            <option value="">Todos</option>
            {options.countries.map((c) => {
              const { code, name } = countryLabel(c);
              return (
                <option key={c} value={c}>
                  {code && code !== name ? `${name} (${code})` : name}
                </option>
              );
            })}
          </select>
        </FilterFacet>

        <FilterFacet
          onGlass
          label="Artista"
          value={filters.artistName ?? "Todos"}
          highlighted={Boolean(filters.artistName)}
          icon={<Mic2 className={ICON} />}
        >
          <select
            aria-label="Artista"
            value={filters.artistName ?? ""}
            onChange={(e) => update("artistName", e.target.value)}
          >
            <option value="">Todos</option>
            {options.artists.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </FilterFacet>

        <FilterFacet
          onGlass
          label="Sello"
          value={
            filters.labelId
              ? (options.labels.find((l) => l.id === filters.labelId)?.name ?? "Sello")
              : "Todos"
          }
          highlighted={Boolean(filters.labelId)}
          icon={<Tag className={ICON} />}
        >
          <select
            aria-label="Sello"
            value={filters.labelId ?? ""}
            onChange={(e) => update("labelId", e.target.value)}
          >
            <option value="">Todos</option>
            {options.labels.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </FilterFacet>

        {activeCount > 0 && (
          <button
            onClick={() => {
              onChange({});
              setRangeOpen(false);
            }}
            className="flex min-h-[38px] items-center gap-1.5 rounded-full px-3 text-[12.5px] font-semibold text-white/70 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70"
          >
            <CircleX className="h-3.5 w-3.5" />
            Limpiar {activeCount > 1 ? `${activeCount} filtros` : "filtro"}
          </button>
        )}
      </div>

      {rangeOpen && (
        <div
          id="analytics-range"
          className="glass-control flex w-fit flex-wrap items-center gap-x-4 gap-y-2.5 rounded-[20px] px-4 py-3"
        >
          <RangeField label="Desde">
            <MonthField
              label="Desde"
              value={filters.startDate ?? ""}
              onChange={(value) => update("startDate", value)}
              minYear={minYear}
              maxYear={maxYear}
              invalid={rangeInvalid}
            />
          </RangeField>
          <RangeField label="Hasta">
            <MonthField
              label="Hasta"
              value={filters.endDate ?? ""}
              onChange={(value) => update("endDate", value)}
              minYear={minYear}
              maxYear={maxYear}
              invalid={rangeInvalid}
            />
          </RangeField>
          {hasRange && (
            <button
              onClick={() => onChange({ ...filters, startDate: undefined, endDate: undefined })}
              className="text-[12px] font-semibold text-white/65 underline-offset-2 transition-colors hover:text-white hover:underline"
            >
              Todo el historial
            </button>
          )}
          <p className={`w-full text-[11.5px] ${rangeInvalid ? "text-[#FF8F92]" : "text-white/50"}`}>
            {rangeInvalid
              ? "«Desde» va después de «Hasta»: no hay meses en ese rango."
              : "Por mes de reporte del distribuidor. Los dos extremos se incluyen."}
          </p>
        </div>
      )}
    </div>
  );
}

function RangeField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[12px] text-white/50">{label}</span>
      {children}
    </div>
  );
}
