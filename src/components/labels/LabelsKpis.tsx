import { Tag, Music, ChartPie, DollarSign, Crown, ArrowRight, Wallet } from "lucide-react";
import { formatCurrency, formatStreams } from "@/utils/format.utils";
import type { SplitCoverage } from "./types";

interface LabelsKpisProps {
  customCount: number;
  artisticCount: number;
  songsCount: number;
  totalStreams: number;
  totalNetIncome: number;
  ownerEarnings: number;
  /** Acumulado a pagar de todos los sellos. Solo se pasa al owner; sin él, no hay KPI. */
  totalToPay?: number;
  coverage: SplitCoverage;
  /** Filtra la lista a los sellos que aún tienen canciones sin repartir. */
  onShowIncomplete?: () => void;
}

/**
 * Consola de métricas de la lista de sellos.
 *
 * El canal de cobertura va teñido de brasa porque es el único accionable: los
 * demás son totales, y este dice cuántas canciones siguen sin repartir.
 *
 * Los totales cuentan solo los sellos artísticos. Un sello personalizado no
 * aporta canciones nuevas —agrupa las de otros—, así que sumarlo aquí las
 * contaría dos veces.
 */
export function LabelsKpis({
  customCount,
  artisticCount,
  songsCount,
  totalStreams,
  totalNetIncome,
  ownerEarnings,
  totalToPay,
  coverage,
  onShowIncomplete,
}: LabelsKpisProps) {
  const pending = coverage.total - coverage.withSplits;

  return (
    <section className="glass flex flex-col gap-1.5 rounded-[28px] p-1.5 lg:flex-row lg:items-stretch lg:gap-0">
      <Channel
        label="Sellos"
        icon={<Tag className="h-[15px] w-[15px] text-white" />}
        value={(customCount + artisticCount).toLocaleString()}
      >
        <span className="truncate text-xs text-white/50">
          {customCount} {customCount === 1 ? "personalizado" : "personalizados"} · {artisticCount}{" "}
          {artisticCount === 1 ? "artístico" : "artísticos"}
        </span>
      </Channel>

      <Channel
        label="Canciones"
        icon={<Music className="h-[15px] w-[15px] text-white" />}
        value={songsCount.toLocaleString()}
        divided
      >
        <span className="truncate text-xs text-white/50">{formatStreams(totalStreams)} streams</span>
      </Channel>

      {/* Lo único accionable de la consola: va teñido de brasa */}
      <Channel
        label="Cobertura de splits"
        labelClassName="text-[#FFB48A]"
        iconClassName="bg-[#FF5C00]/[0.22]"
        icon={<ChartPie className="h-[15px] w-[15px] text-[#FF8A3D]" />}
        value={coverage.total > 0 ? `${coverage.percentage}%` : "—"}
        className="rounded-[22px] border border-[#FF8A3D]/30 bg-[#FF5C00]/[0.14] lg:w-[288px] lg:flex-shrink-0"
      >
        <span className="flex h-1.5 w-full overflow-hidden rounded-full bg-white/[0.12]">
          <span
            className="block h-full rounded-full bg-[#FF5C00]"
            style={{ width: `${coverage.percentage}%` }}
          />
        </span>
        {pending > 0 ? (
          <button
            onClick={onShowIncomplete}
            disabled={!onShowIncomplete}
            className="flex items-center gap-1.5 text-left text-xs font-semibold text-[#FF8A3D] transition-colors enabled:hover:text-[#FFB48A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70 disabled:cursor-default"
          >
            {pending.toLocaleString()} {pending === 1 ? "canción" : "canciones"} sin repartir
            {onShowIncomplete && <ArrowRight className="h-3.5 w-3.5 flex-shrink-0" />}
          </button>
        ) : (
          <span className="text-xs font-semibold text-[#FF8A3D]">
            {coverage.total > 0
              ? "Todas las canciones están repartidas"
              : "Todavía no hay canciones que repartir"}
          </span>
        )}
      </Channel>

      <Channel
        label="Ingresos"
        icon={<DollarSign className="h-[15px] w-[15px] text-white" />}
        value={formatCurrency(totalNetIncome)}
        valueClassName="text-[#45D39A] text-[26px]"
        className="lg:w-[240px] lg:flex-shrink-0"
      >
        <span className="truncate text-xs text-white/50">neto acumulado</span>
      </Channel>

      {totalToPay !== undefined && (
        <Channel
          label="Total a pagar"
          icon={<Wallet className="h-[15px] w-[15px] text-white" />}
          value={formatCurrency(totalToPay)}
          valueClassName="text-white text-[26px]"
          className="lg:w-[230px] lg:flex-shrink-0"
          divided
        >
          <span className="truncate text-xs text-white/50">a colaboradores · todos los sellos</span>
        </Channel>
      )}
      <Channel
        label="Tu ganancia"
        icon={<Crown className="h-[15px] w-[15px] text-white" />}
        value={formatCurrency(ownerEarnings)}
        valueClassName="text-[#FF8A3D] text-[26px]"
        className="lg:w-[230px] lg:flex-shrink-0"
        divided
      >
        <span className="truncate text-xs text-white/50">según tus splits</span>
      </Channel>
    </section>
  );
}

interface ChannelProps {
  label: string;
  labelClassName?: string;
  /** Fondo del círculo del ícono. */
  iconClassName?: string;
  icon: React.ReactNode;
  value: string;
  valueClassName?: string;
  className?: string;
  /** Lleva el hairline que lo separa del canal anterior. Junto al canal teñido sobra: su borde ya marca el corte. */
  divided?: boolean;
  children?: React.ReactNode;
}

/** Canal de la consola: etiqueta, cifra y una lectura de apoyo. */
function Channel({
  label,
  labelClassName = "text-white/70",
  iconClassName = "bg-white/[0.12]",
  icon,
  value,
  valueClassName = "text-white text-[30px]",
  className = "",
  divided = false,
  children,
}: ChannelProps) {
  return (
    <div
      className={`flex min-w-0 flex-1 flex-col justify-center gap-3 px-[22px] py-[18px] ${
        divided ? "border-t border-white/[0.09] lg:border-l lg:border-t-0" : ""
      } ${className}`}
    >
      <div className="flex items-center gap-2.5">
        <span
          className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${iconClassName}`}
        >
          {icon}
        </span>
        <span className={`truncate text-[12.5px] font-medium ${labelClassName}`}>{label}</span>
      </div>
      <div className="flex flex-col gap-1.5">
        <p className={`truncate font-mono font-light leading-[1.1] tracking-[-0.015em] ${valueClassName}`}>
          {value}
        </p>
        {children}
      </div>
    </div>
  );
}
