import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";

interface MusicPaginationProps {
  pageStart: number;
  pageEnd: number;
  total: number;
  page: number;
  limit: number;
  onLimitChange: (value: number) => void;
  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  /** Nombre de lo que se está paginando, en plural. */
  noun: string;
}

const PAGE_SIZES = [10, 20, 50, 100];

/** Rango mostrado, tamaño de página y paso entre páginas. */
export function MusicPagination({
  pageStart,
  pageEnd,
  total,
  page,
  limit,
  onLimitChange,
  canGoNext,
  onPrev,
  onNext,
  noun,
}: MusicPaginationProps) {
  return (
    <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
      <span className="text-[12.5px] text-white/65">
        Mostrando {total === 0 ? 0 : pageStart + 1}–{Math.min(pageEnd, total)} de {total} {noun}
      </span>

      <div className="flex items-center gap-3.5">
        <div className="flex items-center gap-2">
          <span className="hidden text-[12.5px] text-white/50 sm:inline">Por página</span>
          <div className="relative">
            <select
              aria-label={`${noun} por página`}
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="glass-control appearance-none rounded-full py-1.5 pl-3 pr-7 text-[12.5px] font-semibold text-white focus:outline-none focus:ring-2 focus:ring-[#FF5C00]/70 [&>option]:text-[#1C1D22]"
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-white/65" />
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onPrev}
            disabled={page <= 1}
            aria-label="Página anterior"
            className="glass-control flex h-9 w-9 items-center justify-center rounded-full text-white transition-colors enabled:hover:bg-white/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70 disabled:opacity-35"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[28px] text-center text-[12.5px] font-semibold text-white">
            {page}
          </span>
          <button
            onClick={onNext}
            disabled={!canGoNext}
            aria-label="Página siguiente"
            className="glass-control flex h-9 w-9 items-center justify-center rounded-full text-white transition-colors enabled:hover:bg-white/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70 disabled:opacity-35"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
