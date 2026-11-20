import { ArrowUpDown, CircleX, LayoutGrid, Layers, Tag } from "lucide-react";
import { FilterFacet } from "@/components/ui/FilterFacet";
import { SORT_LABELS, type LabelSortBy } from "./labelsColumns";
import { viewerIsAccountOwner } from "@/utils/ownerVisibility";
import type { CoverageFilter, LabelTypeFilter } from "@/hooks/useLabelsLibrary";

interface LabelsFilterBarProps {
  typeFilter: LabelTypeFilter;
  onTypeFilterChange: (value: LabelTypeFilter) => void;
  customCount: number;
  artisticCount: number;
  coverageFilter: CoverageFilter;
  onCoverageFilterChange: (value: CoverageFilter) => void;
  sortBy: LabelSortBy;
  onSortChange: (value: LabelSortBy) => void;
  hasFilters: boolean;
  onClearAll: () => void;
}

const COVERAGE_LABELS: Record<CoverageFilter, string> = {
  all: "Todas",
  incomplete: "Sin terminar",
  complete: "Completos",
};

/**
 * Filtros de la lista de sellos.
 *
 * El tipo va en un segmentado y no en un desplegable porque es la división
 * principal de la pantalla —lo que tú creaste frente a lo que reportan las
 * distribuidoras— y sus contadores se leen de un vistazo.
 */
export function LabelsFilterBar({
  typeFilter,
  onTypeFilterChange,
  customCount,
  artisticCount,
  coverageFilter,
  onCoverageFilterChange,
  sortBy,
  onSortChange,
  hasFilters,
  onClearAll,
}: LabelsFilterBarProps) {
  const segments: Array<{
    value: LabelTypeFilter;
    label: string;
    icon: React.ReactNode;
    count: number;
  }> = [
    {
      value: "all",
      label: "Todos",
      icon: <LayoutGrid className="h-[13px] w-[13px]" />,
      count: customCount + artisticCount,
    },
    {
      value: "custom",
      label: "Personalizados",
      icon: <Layers className="h-[13px] w-[13px]" />,
      count: customCount,
    },
    {
      value: "artistic",
      label: "Artísticos",
      icon: <Tag className="h-[13px] w-[13px]" />,
      count: artisticCount,
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <div
        role="tablist"
        aria-label="Filtrar por tipo de sello"
        className="flex items-center gap-0.5 rounded-full bg-black/[0.22] p-1"
      >
        {segments.map((segment) => {
          const active = typeFilter === segment.value;
          return (
            <button
              key={segment.value}
              role="tab"
              aria-selected={active}
              onClick={() => onTypeFilterChange(segment.value)}
              className={`flex min-h-[36px] items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70 ${
                active
                  ? "bg-[#F7EDE6]/[0.92] font-semibold text-[#1C1D22]"
                  : "font-medium text-white/80 hover:text-white"
              }`}
            >
              <span className={active ? "text-[#1C1D22]" : "text-white/60"}>{segment.icon}</span>
              {segment.label}
              <span
                className={`rounded-full px-1.5 py-px font-mono text-[10px] font-semibold ${
                  active ? "bg-[#1C1D22]/10 text-[#1C1D22]/70" : "bg-white/[0.10] text-white/65"
                }`}
              >
                {segment.count}
              </span>
            </button>
          );
        })}
      </div>

      <FilterFacet
        onGlass
        label="Cobertura"
        value={COVERAGE_LABELS[coverageFilter]}
        highlighted={coverageFilter !== "all"}
      >
        <select
          aria-label="Filtrar por cobertura de splits"
          value={coverageFilter}
          onChange={(e) => onCoverageFilterChange(e.target.value as CoverageFilter)}
        >
          <option value="all">Todas</option>
          <option value="incomplete">Sin terminar</option>
          <option value="complete">Completos</option>
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
        <FilterFacet
          onGlass
          label=""
          value={SORT_LABELS[sortBy]}
          icon={<ArrowUpDown className="h-3.5 w-3.5" />}
        >
          <select
            aria-label="Ordenar sellos"
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as LabelSortBy)}
          >
            {Object.entries(SORT_LABELS)
              .filter(
                ([value]) =>
                  (value !== "topay_desc" && value !== "pct_desc") || viewerIsAccountOwner(),
              )
              .map(([value, label]) => (
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
