import { Link } from "react-router-dom";
import { ArrowUpRight, DollarSign } from "lucide-react";
import { formatCurrency } from "@/utils/format.utils";
import type { PlatformShare } from "@/hooks/usePlatformBreakdown";

interface IncomeArcCardProps {
  totalNetIncome: number;
  /** Cómo se lee el periodo: «los últimos 90 días». */
  periodLabel: string;
  platforms: PlatformShare[];
  loading: boolean;
}

/** Geometría del arco: semicírculo de 340px de diámetro con trazo de 17px. */
const CX = 190;
const CY = 190;
const R = 161.5;
const STROKE = 17;
/** Separación entre segmentos, en radianes. */
const GAP = 0.035;

const point = (angle: number) => `${CX + R * Math.cos(angle)} ${CY + R * Math.sin(angle)}`;
const arc = (from: number, to: number) => `M ${point(from)} A ${R} ${R} 0 0 1 ${point(to)}`;

/**
 * Ingresos netos del periodo dentro de un arco que reparte el ingreso entre
 * plataformas, cada una con su color de marca. El arco toma el dial del
 * concepto del cliente y le da un dato: de dónde viene el dinero.
 */
export function IncomeArcCard({ totalNetIncome, periodLabel, platforms, loading }: IncomeArcCardProps) {
  const total = formatCurrency(totalNetIncome);
  const span = Math.PI - GAP * Math.max(platforms.length - 1, 0);
  let cursor = Math.PI;
  const segments = platforms.map((platform) => {
    const from = cursor;
    const to = from + span * platform.share;
    cursor = to + GAP;
    return { ...platform, d: arc(from, to) };
  });

  return (
    <section className="glass flex min-w-0 flex-1 flex-col gap-6 rounded-[32px] p-7 lg:flex-row lg:gap-7">
      <div className="flex min-w-0 flex-1 flex-col items-center justify-between gap-5">
        <div className="flex items-center gap-2.5 self-stretch">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.12]">
            <DollarSign className="h-[15px] w-[15px] text-white" />
          </span>
          <h2 className="text-sm font-medium text-white">Ingresos netos</h2>
        </div>

        <div className="relative aspect-[380/200] w-full max-w-[380px]">
          <svg viewBox="0 0 380 200" className="absolute inset-0 h-full w-full" aria-hidden="true">
            {segments.length === 0 ? (
              <path d={arc(Math.PI, 2 * Math.PI)} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={STROKE} />
            ) : (
              segments.map((segment) => (
                <path key={segment.name} d={segment.d} fill="none" stroke={segment.color} strokeWidth={STROKE} />
              ))
            )}
          </svg>
          <div className="absolute inset-x-0 bottom-[4%] flex flex-col items-center gap-1">
            <p
              className={`font-mono font-extralight leading-none tracking-[-0.02em] text-white ${
                total.length > 11 ? "text-[40px]" : "text-[44px] sm:text-[56px]"
              }`}
            >
              {total}
            </p>
            <span className="text-[12.5px] text-white/65">en {periodLabel}</span>
          </div>
        </div>

        <p className="text-center text-[12.5px] text-white/50">
          Según los reportes de tus distribuidores
        </p>
      </div>

      <div className="flex flex-col border-t border-white/[0.09] pt-5 lg:w-[280px] lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0 xl:w-[300px]">
        <span className="pb-2 text-[10.5px] font-medium tracking-[1.4px] text-white/50">
          POR PLATAFORMA · HISTÓRICO
        </span>

        {loading ? (
          <div className="flex flex-col gap-3 py-2">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="h-4 animate-pulse rounded-full bg-white/[0.08]" />
            ))}
          </div>
        ) : platforms.length === 0 ? (
          <p className="py-2 text-[13px] text-white/65">Sin datos de plataformas aún</p>
        ) : (
          <ul className="flex flex-col">
            {platforms.map((platform) => (
              <li key={platform.name} className="flex items-center gap-2.5 py-2">
                <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: platform.color }} />
                <span className="min-w-0 flex-1 truncate text-[13px] text-white/70">{platform.name}</span>
                <span className="font-mono text-[12.5px] text-white/50">{formatCurrency(platform.income)}</span>
                <span className="w-10 text-right font-mono text-sm font-medium text-white">
                  {Math.round(platform.share * 100)}%
                </span>
              </li>
            ))}
          </ul>
        )}

        <Link
          to="/panel/analytics"
          className="mt-auto flex items-center gap-1 pt-4 text-[12.5px] font-medium text-white transition-colors hover:text-[#FFB067]"
        >
          Ver en Analíticas
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  );
}
