import { CalendarOff, CircleCheck, Upload } from "lucide-react";
import { CoverageStrip, CoverageLegend } from "./CoverageStrip";
import { formatMonthRange, type MonthRange } from "@/utils/coverage.utils";

interface DetailCoveragePanelProps {
  covered: Set<number>;
  gaps: MonthRange[];
  year: number;
  years: number[];
  onYearChange: (year: number) => void;
  upToMonth: number;
  /** Abre la subida con ese rango ya marcado. */
  onFillGap: (gap: MonthRange) => void;
}

/**
 * Cobertura del distribuidor en un año. No se queda en enseñar el hueco: propone
 * la carga que lo tapa, con el periodo ya elegido.
 */
export function DetailCoveragePanel({
  covered,
  gaps,
  year,
  years,
  onYearChange,
  upToMonth,
  onFillGap,
}: DetailCoveragePanelProps) {
  const [firstGap] = gaps;

  return (
    <div className="glass flex flex-col gap-4 rounded-[28px] px-6 py-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="font-display text-[19px] font-medium tracking-[-0.005em] text-white">
            Cobertura {year}
          </h2>
          <p className="text-[11.5px] text-white/65">Meses ya cubiertos por un reporte</p>
        </div>
        <select
          aria-label="Año de cobertura"
          value={year}
          onChange={(e) => onYearChange(Number(e.target.value))}
          className="glass-control flex-shrink-0 appearance-none rounded-full px-3 py-1.5 font-mono text-[11.5px] font-semibold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70"
        >
          {years.map((y) => (
            <option key={y} value={y} className="bg-[#2B1E17] text-white">
              {y}
            </option>
          ))}
        </select>
      </div>

      <CoverageStrip covered={covered} year={year} upToMonth={upToMonth} showInitials />

      <CoverageLegend />

      <div className="h-px bg-white/[0.09]" />

      {gaps.length === 0 ? (
        <div className="flex items-center gap-2.5 rounded-2xl bg-[#45D39A]/[0.12] px-3.5 py-3">
          <CircleCheck className="h-3.5 w-3.5 flex-shrink-0 text-[#45D39A]" />
          <span className="text-[11.5px] font-semibold text-[#45D39A]">
            Sin huecos: {year} está al día
          </span>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5 rounded-2xl border border-[#FF8A3D]/30 bg-[#FF5C00]/[0.14] p-3.5">
          <span className="flex items-center gap-2">
            <CalendarOff className="h-3.5 w-3.5 flex-shrink-0 text-[#FF8A3D]" />
            <span className="text-[12px] font-semibold text-[#FFB48A]">
              {gaps.map(formatMonthRange).join(" · ")} sin reporte
            </span>
          </span>
          <span className="text-[11px] leading-relaxed text-white/65">
            {gaps.length === 1
              ? "Ese tramo del año no tiene ingresos registrados para este distribuidor."
              : "Esos tramos del año no tienen ingresos registrados para este distribuidor."}
          </span>
          <button
            onClick={() => onFillGap(firstGap)}
            className="flex min-h-[40px] items-center justify-center gap-2 rounded-full bg-[#FF5C00] px-3.5 py-2.5 text-[12px] font-semibold text-white shadow-[0_8px_20px_-6px_rgba(255,92,0,0.35)] transition-colors hover:bg-[#EA580C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            <Upload className="h-3.5 w-3.5" />
            Cargar {formatMonthRange(firstGap)} {year}
          </button>
        </div>
      )}
    </div>
  );
}
