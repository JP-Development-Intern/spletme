import { ArrowUpDown, CircleX } from "lucide-react";
import { FilterFacet } from "@/components/ui/FilterFacet";
import { SORT_LABELS, type DistributorSortBy } from "./distributorsColumns";

export type CurrencyFilter = "all" | "USD" | "EUR";
export type CoverageFilter = "all" | "with_gaps" | "complete";

interface DistributorsFilterBarProps {
  currencyFilter: CurrencyFilter;
  onCurrencyFilterChange: (value: CurrencyFilter) => void;
  providerFilter: string;
  onProviderFilterChange: (value: string) => void;
  providers: string[];
  coverageFilter: CoverageFilter;
  onCoverageFilterChange: (value: CoverageFilter) => void;
  sortBy: DistributorSortBy;
  onSortChange: (value: DistributorSortBy) => void;
  hasFilters: boolean;
  onClearAll: () => void;
}

const COVERAGE_LABELS: Record<CoverageFilter, string> = {
  all: "Todos",
  with_gaps: "Con huecos",
  complete: "Al día",
};

/**
 * Filtros de la lista. Antes solo se podía buscar por nombre; moneda, proveedor
 * y cobertura son las tres preguntas que de verdad se le hacen a esta pantalla
 * cuando hay más de un puñado de distribuidores.
 */
export function DistributorsFilterBar({
  currencyFilter,
  onCurrencyFilterChange,
  providerFilter,
  onProviderFilterChange,
  providers,
  coverageFilter,
  onCoverageFilterChange,
  sortBy,
  onSortChange,
  hasFilters,
  onClearAll,
}: DistributorsFilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {/* Filtra por la moneda en la que el distribuidor emite sus reportes: los
          importes que muestra la tabla están todos en dólares. */}
      <FilterFacet onGlass label="Reporta en" value={currencyFilter === "all" ? "Todas" : currencyFilter}>
        <select
          aria-label="Filtrar por la moneda en la que reporta el distribuidor"
          value={currencyFilter}
          onChange={(e) => onCurrencyFilterChange(e.target.value as CurrencyFilter)}
        >
          <option value="all">Todas</option>
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
        </select>
      </FilterFacet>

      <FilterFacet onGlass label="Proveedor" value={providerFilter === "all" ? "Todos" : providerFilter}>
        <select
          aria-label="Filtrar por proveedor"
          value={providerFilter}
          onChange={(e) => onProviderFilterChange(e.target.value)}
        >
          <option value="all">Todos</option>
          {providers.map((provider) => (
            <option key={provider} value={provider}>
              {provider}
            </option>
          ))}
        </select>
      </FilterFacet>

      <FilterFacet
        onGlass
        label="Cobertura"
        value={COVERAGE_LABELS[coverageFilter]}
        highlighted={coverageFilter !== "all"}
      >
        <select
          aria-label="Filtrar por cobertura"
          value={coverageFilter}
          onChange={(e) => onCoverageFilterChange(e.target.value as CoverageFilter)}
        >
          <option value="all">Todos</option>
          <option value="with_gaps">Con huecos</option>
          <option value="complete">Al día</option>
        </select>
      </FilterFacet>

      {hasFilters && (
        <button
          onClick={onClearAll}
          className="flex items-center gap-1.5 rounded-full px-2 py-1 text-[11.5px] font-semibold text-[#FF8A3D] transition-colors hover:text-[#FFB48A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70"
        >
          <CircleX className="h-3.5 w-3.5" />
          Limpiar filtros
        </button>
      )}

      <div className="ml-auto">
        <FilterFacet onGlass label="" value={SORT_LABELS[sortBy]} icon={<ArrowUpDown className="h-3.5 w-3.5" />}>
          <select
            aria-label="Ordenar distribuidores"
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as DistributorSortBy)}
          >
            {Object.entries(SORT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </FilterFacet>
      </div>
    </div>
  );
}
