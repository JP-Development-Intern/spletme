
import { useState, useEffect } from "react";
import { SlidersHorizontal, X, ChevronDown } from "lucide-react";
import type { AnalyticsFilters, FilterOptions } from "../../../../types/analytics.types";
import { analyticsService } from "../../../../services/analyticsService";

interface Props {
  filters: AnalyticsFilters;
  onChange: (filters: AnalyticsFilters) => void;
}

export default function AnalyticsFiltersBar({ filters, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<FilterOptions>({
    platforms: [],
    countries: [],
    artists: [],
    labels: [],
  });

  useEffect(() => {
    analyticsService
      .getFilterOptions()
      .then(setOptions)
      .catch(() => {});
  }, []);

  function update(key: keyof AnalyticsFilters, value: string) {
    onChange({ ...filters, [key]: value || undefined });
  }

  function clearAll() {
    onChange({});
  }

  const activeCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      {/* Toggle bar */}
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex w-full items-center justify-between px-5 py-3.5 text-sm font-medium text-[#111827]"
      >
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-[#F97316]" />
          <span>Filtros</span>
          {activeCount > 0 && (
            <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-bold text-[#F97316]">
              {activeCount}
            </span>
          )}
        </div>
        <ChevronDown
          className={`h-4 w-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="border-t border-gray-100 px-5 pb-5">
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            {/* Platform */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">
                Plataforma
              </label>
              <select
                value={filters.platform ?? ""}
                onChange={(e) => update("platform", e.target.value)}
                className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-[13px] text-[#111827] focus:border-[#F97316] focus:outline-none"
              >
                <option value="">Todas</option>
                {options.platforms.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {/* Country */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">
                País
              </label>
              <select
                value={filters.country ?? ""}
                onChange={(e) => update("country", e.target.value)}
                className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-[13px] text-[#111827] focus:border-[#F97316] focus:outline-none"
              >
                <option value="">Todos</option>
                {options.countries.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Start date */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">
                Fecha inicio
              </label>
              <input
                type="month"
                value={filters.startDate ?? ""}
                onChange={(e) => update("startDate", e.target.value)}
                className="h-9 rounded-lg border border-gray-200 px-3 text-[13px] text-[#111827] focus:border-[#F97316] focus:outline-none"
              />
            </div>

            {/* End date */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">
                Fecha fin
              </label>
              <input
                type="month"
                value={filters.endDate ?? ""}
                onChange={(e) => update("endDate", e.target.value)}
                className="h-9 rounded-lg border border-gray-200 px-3 text-[13px] text-[#111827] focus:border-[#F97316] focus:outline-none"
              />
            </div>

            {/* Artist */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">
                Artista
              </label>
              <select
                value={filters.artistName ?? ""}
                onChange={(e) => update("artistName", e.target.value)}
                className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-[13px] text-[#111827] focus:border-[#F97316] focus:outline-none"
              >
                <option value="">Todos</option>
                {options.artists.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            {/* Label */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">
                Sello
              </label>
              <select
                value={filters.labelName ?? ""}
                onChange={(e) => update("labelName", e.target.value)}
                className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-[13px] text-[#111827] focus:border-[#F97316] focus:outline-none"
              >
                <option value="">Todos</option>
                {options.labels.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Period toggle + Clear */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1">
              <button
                onClick={() => update("period", "month")}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  (filters.period ?? "month") === "month"
                    ? "bg-white text-[#111827] shadow-sm"
                    : "text-[#6B7280] hover:text-[#111827]"
                }`}
              >
                Por Mes
              </button>
              <button
                onClick={() => update("period", "year")}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  filters.period === "year"
                    ? "bg-white text-[#111827] shadow-sm"
                    : "text-[#6B7280] hover:text-[#111827]"
                }`}
              >
                Por Año
              </button>
            </div>

            {activeCount > 0 && (
              <button
                onClick={clearAll}
                className="flex items-center gap-1.5 text-xs text-[#6B7280] transition-colors hover:text-red-500"
              >
                <X className="h-3.5 w-3.5" />
                Limpiar filtros
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
