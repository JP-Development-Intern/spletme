import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { formatCurrency } from "@/utils/format.utils";
import type { PlatformShare } from "@/hooks/usePlatformBreakdown";

interface PlatformsCardProps {
  platforms: PlatformShare[];
  /** Ingreso histórico total, el que reparte el arco. */
  totalIncome: number;
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
 * Reparto histórico de los ingresos entre plataformas, cada una con su color
 * de marca, en el arco que viene del dial del concepto del cliente. Es
 * histórico porque el endpoint no admite periodo, así que la cifra central es
 * el total histórico y no la del selector.
 */
export function PlatformsCard({ platforms, totalIncome, loading }: PlatformsCardProps) {
  const total = formatCurrency(totalIncome);
  const span = Math.PI - GAP * Math.max(platforms.length - 1, 0);
  let cursor = Math.PI;
  const segments = platforms.map((platform) => {
    const from = cursor;
    const to = from + span * platform.share;
    cursor = to + GAP;
    return { ...platform, d: arc(from, to) };
  });

  return (
    <section className="glass flex flex-col gap-5 rounded-[28px] px-6 py-5" data-tour="platforms-section">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-[19px] font-medium tracking-[-0.005em] text-white">Plataformas</h2>
        <span className="rounded-full bg-white/[0.07] px-2.5 py-1 text-[11px] font-medium text-white/70">
          Histórico
        </span>
      </div>

      <div className="relative mx-auto aspect-[380/200] w-full max-w-[300px]">
        <svg viewBox="0 0 380 200" className="absolute inset-0 h-full w-full" aria-hidden="true">
          {segments.length === 0 ? (
            <path d={arc(Math.PI, 2 * Math.PI)} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={STROKE} />
          ) : (
            segments.map((segment) => (
              <path key={segment.name} d={segment.d} fill="none" stroke={segment.color} strokeWidth={STROKE} />
            ))
          )}
        </svg>
        <div className="absolute inset-x-0 bottom-[2%] flex flex-col items-center gap-1">
          <p
            className={`font-mono font-extralight leading-none tracking-[-0.02em] text-white ${
              total.length > 11 ? "text-[28px]" : "text-[36px]"
            }`}
          >
            {total}
          </p>
          <span className="text-[12px] text-white/65">ingresos netos</span>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3 py-2">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="h-4 animate-pulse rounded-full bg-white/[0.08]" />
          ))}
        </div>
      ) : platforms.length === 0 ? (
        <p className="py-2 text-center text-[13px] text-white/65">Sin datos de plataformas aún</p>
      ) : (
        <ul className="flex flex-col border-t border-white/[0.09] pt-2">
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
        className="flex items-center gap-1 text-[12.5px] font-medium text-white transition-colors hover:text-[#FFB067]"
      >
        Ver en Analíticas
        <ArrowUpRight className="h-3.5 w-3.5" />
      </Link>
    </section>
  );
}
