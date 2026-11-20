import { TriangleAlert, CircleCheck, ChevronDown } from "lucide-react";
import { MONTH_NAMES, MONTH_SHORT_NAMES } from "@/utils/period.utils";
import { formatGaps, type MonthRange } from "@/utils/coverage.utils";

interface YearCoverageCardProps {
  /** Cuántos distribuidores cubren cada mes, indexado de 1 a 12. */
  countByMonth: Map<number, number>;
  /** Total de distribuidores, para saber cuándo un mes está cubierto del todo. */
  distributorsCount: number;
  gaps: MonthRange[];
  year: number;
  years: number[];
  onYearChange: (year: number) => void;
  /** Último mes vencido: los posteriores se dibujan como pendientes, no como hueco. */
  upToMonth: number;
  onShowGaps?: () => void;
}

/**
 * Cobertura del año agregada: cuántos distribuidores han reportado cada mes.
 *
 * Un mes en el que solo han reportado dos de seis distribuidores no es un hueco,
 * pero tampoco está cerrado; por eso la celda gradúa en vez de encenderse o
 * apagarse.
 */
export function YearCoverageCard({
  countByMonth,
  distributorsCount,
  gaps,
  year,
  years,
  onYearChange,
  upToMonth,
  onShowGaps,
}: YearCoverageCardProps) {
  return (
    <div className="glass flex flex-col gap-4 rounded-[28px] px-6 py-5 lg:w-[400px] lg:flex-shrink-0">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="font-display text-[19px] font-medium tracking-[-0.005em] text-white">
            Cobertura {year}
          </h2>
          <p className="text-[12.5px] text-white/65">
            Meses con reporte cargado por algún distribuidor
          </p>
        </div>
        <div className="relative flex-shrink-0">
          <select
            aria-label="Año de cobertura"
            value={year}
            onChange={(e) => onYearChange(Number(e.target.value))}
            className="glass-control appearance-none rounded-full py-1.5 pl-3 pr-7 font-mono text-[11.5px] font-semibold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70"
          >
            {years.map((y) => (
              <option key={y} value={y} className="bg-[#2B1E17] text-white">
                {y}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-white/60" />
        </div>
      </div>

      <div className="flex items-end gap-1">
        {MONTH_SHORT_NAMES.map((short, index) => {
          const month = index + 1;
          const count = countByMonth.get(month) ?? 0;
          const pending = month > upToMonth;
          const full = distributorsCount > 0 && count >= distributorsCount;
          const partial = count > 0 && !full;

          return (
            <div key={short} className="flex flex-1 flex-col items-center gap-1.5">
              <span
                title={`${MONTH_NAMES[index]} ${year}: ${count} de ${distributorsCount} distribuidores`}
                className={[
                  "flex h-[34px] w-full items-center justify-center rounded-[9px]",
                  full
                    ? "bg-[#FF5C00]"
                    : partial
                      ? "bg-[#FF5C00]/[0.22]"
                      : pending
                        ? "border border-dashed border-white/[0.18]"
                        : "border border-white/[0.12] bg-white/[0.06]",
                ].join(" ")}
              >
                <span
                  className={`font-mono text-[11px] font-semibold ${
                    full ? "text-white" : partial ? "text-[#FFB48A]" : "text-white/50"
                  }`}
                >
                  {count > 0 ? count : "—"}
                </span>
              </span>
              <span className="font-mono text-[9.5px] font-medium text-white/50">
                {short.charAt(0)}
              </span>
            </div>
          );
        })}
      </div>

      {gaps.length > 0 ? (
        <button
          onClick={onShowGaps}
          disabled={!onShowGaps}
          className="flex items-center gap-2.5 rounded-2xl border border-[#FF8A3D]/30 bg-[#FF5C00]/[0.14] px-3.5 py-3 text-left transition-colors enabled:hover:bg-[#FF5C00]/[0.22] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70 disabled:cursor-default"
        >
          <TriangleAlert className="h-3.5 w-3.5 flex-shrink-0 text-[#FF8A3D]" />
          <span className="flex-1 text-[11.5px] font-semibold text-[#FFB48A]">
            {formatGaps(gaps)} sin cargar en ningún distribuidor
          </span>
        </button>
      ) : (
        <div className="flex items-center gap-2.5 rounded-2xl bg-[#45D39A]/[0.12] px-3.5 py-3">
          <CircleCheck className="h-3.5 w-3.5 flex-shrink-0 text-[#45D39A]" />
          <span className="flex-1 text-[11.5px] font-semibold text-[#45D39A]">
            Todos los meses vencidos de {year} tienen reporte
          </span>
        </div>
      )}
    </div>
  );
}
