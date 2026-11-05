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
 * El canal de cobertura va en naranja porque es el único accionable: los demás
 * son totales, y este dice cuántas canciones siguen sin repartir.
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
    <div className="flex flex-col divide-y divide-[#E8E8EC] overflow-hidden rounded-[26px] border border-[#E8E8EC] bg-white shadow-[0_10px_28px_-12px_rgba(255,92,0,0.15)] lg:flex-row lg:divide-x lg:divide-y-0">
      <Channel
        label="SELLOS"
        icon={<Tag className="h-[13px] w-[13px] text-[#FF5C00]" />}
        value={(customCount + artisticCount).toLocaleString()}
      >
        <span className="text-[10.5px] text-[#A6AAB2]">
          {customCount} {customCount === 1 ? "personalizado" : "personalizados"} · {artisticCount}{" "}
          {artisticCount === 1 ? "artístico" : "artísticos"}
        </span>
      </Channel>

      <Channel
        label="CANCIONES"
        icon={<Music className="h-[13px] w-[13px] text-[#71757E]" />}
        value={songsCount.toLocaleString()}
      >
        <span className="text-[10.5px] text-[#A6AAB2]">{formatStreams(totalStreams)} streams</span>
      </Channel>

      <Channel
        label="COBERTURA DE SPLITS"
        labelClassName="text-[#FF5C00]"
        icon={<ChartPie className="h-[13px] w-[13px] text-[#FF5C00]" />}
        value={coverage.total > 0 ? `${coverage.percentage}%` : "—"}
        valueClassName="text-[#1C1D22] text-[26px]"
        className="bg-[#FFEADD] lg:w-[288px] lg:flex-shrink-0"
      >
        <span className="flex h-1.5 w-full overflow-hidden rounded-full bg-white/70">
          <span
            className="block h-full rounded-full bg-[#FF5C00]"
            style={{ width: `${coverage.percentage}%` }}
          />
        </span>
        {pending > 0 ? (
          <button
            onClick={onShowIncomplete}
            disabled={!onShowIncomplete}
            className="flex items-center gap-1.5 text-left text-[11.5px] font-semibold text-[#EA580C] transition-colors enabled:hover:text-[#FF5C00] disabled:cursor-default"
          >
            {pending.toLocaleString()} {pending === 1 ? "canción" : "canciones"} sin repartir
            {onShowIncomplete && <ArrowRight className="h-3 w-3 flex-shrink-0" />}
          </button>
        ) : (
          <span className="text-[11.5px] font-semibold text-[#EA580C]">
            {coverage.total > 0
              ? "Todas las canciones están repartidas"
              : "Todavía no hay canciones que repartir"}
          </span>
        )}
      </Channel>

      <Channel
        label="INGRESOS"
        icon={<DollarSign className="h-[13px] w-[13px] text-[#2FB37E]" />}
        value={formatCurrency(totalNetIncome)}
        valueClassName="text-[#2FB37E] text-[24px]"
        className="lg:w-[240px] lg:flex-shrink-0"
      >
        <span className="text-[10.5px] text-[#A6AAB2]">neto acumulado</span>
      </Channel>

      {totalToPay !== undefined && (
        <Channel
          label="TOTAL A PAGAR"
          icon={<Wallet className="h-[13px] w-[13px] text-[#FF5C00]" />}
          value={formatCurrency(totalToPay)}
          valueClassName="text-[#1C1D22] text-[24px]"
          className="lg:w-[230px] lg:flex-shrink-0"
        >
          <span className="text-[10.5px] text-[#A6AAB2]">a colaboradores · todos los sellos</span>
        </Channel>
      )}
      <Channel
        label="TU GANANCIA"
        icon={<Crown className="h-[13px] w-[13px] text-[#FF5C00]" />}
        value={formatCurrency(ownerEarnings)}
        valueClassName="text-[#FF5C00] text-[24px]"
        className="lg:w-[230px] lg:flex-shrink-0"
      >
        <span className="text-[10.5px] text-[#A6AAB2]">según tus splits</span>
      </Channel>
    </div>
  );
}

interface ChannelProps {
  label: string;
  labelClassName?: string;
  icon: React.ReactNode;
  value: string;
  valueClassName?: string;
  className?: string;
  children?: React.ReactNode;
}

/** Canal de la consola: etiqueta, cifra y una lectura de apoyo. */
function Channel({
  label,
  labelClassName = "text-[#71757E]",
  icon,
  value,
  valueClassName = "text-[#1C1D22] text-[26px]",
  className = "",
  children,
}: ChannelProps) {
  return (
    <div
      className={`flex min-w-0 flex-1 flex-col justify-center gap-2 px-6 py-[22px] ${className}`}
    >
      <div className="flex items-center gap-1.5">
        {icon}
        <span className={`font-mono text-[9.5px] font-medium tracking-[1.3px] ${labelClassName}`}>
          {label}
        </span>
      </div>
      <p className={`font-mono font-semibold leading-none tracking-tight ${valueClassName}`}>
        {value}
      </p>
      {children}
    </div>
  );
}
