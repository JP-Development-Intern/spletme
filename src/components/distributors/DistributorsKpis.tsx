import { Handshake, Music, DollarSign, Play, CalendarOff, ArrowRight } from "lucide-react";
import { formatStreams, formatCurrency } from "@/utils/format.utils";

interface DistributorsKpisProps {
  distributorsCount: number;
  songsCount: number;
  totalNetIncome: number;
  totalGrossIncome: number;
  totalStreams: number;
  /** Meses del año sin reporte en ningún distribuidor. */
  missingMonths: number;
  /** Los huecos ya enumerados: "Abr–Jun · Oct". */
  gapsLabel: string;
  year: number;
  /** Filtra la lista a los distribuidores con huecos. */
  onShowGaps?: () => void;
}

/**
 * Consola de métricas de la lista, en una sola superficie de vidrio. El último
 * canal va teñido de brasa porque es el único dato accionable: no repite un
 * total, dice cuántos meses del año siguen sin cargar y cuáles.
 */
export function DistributorsKpis({
  distributorsCount,
  songsCount,
  totalNetIncome,
  totalGrossIncome,
  totalStreams,
  missingMonths,
  gapsLabel,
  year,
  onShowGaps,
}: DistributorsKpisProps) {
  const retained = totalGrossIncome > 0 ? Math.round((totalNetIncome / totalGrossIncome) * 100) : 0;

  return (
    <section className="glass flex flex-col rounded-[28px] p-1.5 lg:flex-row lg:items-stretch">
      <div className="flex min-w-0 flex-1 flex-col divide-y divide-white/[0.09] lg:flex-row lg:divide-x lg:divide-y-0">
        <Channel
          label="Distribuidores"
          icon={<Handshake className="h-[15px] w-[15px] text-white" />}
          value={distributorsCount.toLocaleString()}
        />
        <Channel
          label="Canciones"
          icon={<Music className="h-[15px] w-[15px] text-white" />}
          value={songsCount.toLocaleString()}
        />
        <Channel
          label="Ingresos netos"
          icon={<DollarSign className="h-[15px] w-[15px] text-white" />}
          value={formatCurrency(totalNetIncome)}
          valueClassName="text-[#45D39A] text-[26px] sm:text-[30px]"
          className="lg:w-[300px] lg:flex-shrink-0"
        >
          {totalGrossIncome > 0 && (
            <span className="truncate text-xs text-white/50">
              bruto {formatCurrency(totalGrossIncome)} · {retained}% retenido
            </span>
          )}
        </Channel>
        <Channel
          label="Streams"
          icon={<Play className="h-[15px] w-[15px] text-white" />}
          value={formatStreams(totalStreams)}
        />
      </div>
      <Channel
        label={`Sin cargar ${year}`}
        labelClassName="text-[#FFB48A]"
        iconClassName="bg-[#FF5C00]/[0.22]"
        icon={<CalendarOff className="h-[15px] w-[15px] text-[#FF8A3D]" />}
        value={missingMonths > 0 ? String(missingMonths) : "Al día"}
        valueClassName={`text-white ${missingMonths > 0 ? "text-[30px]" : "text-[24px]"}`}
        className="rounded-[22px] border border-[#FF8A3D]/30 bg-[#FF5C00]/[0.14] lg:w-[260px] lg:flex-shrink-0"
      >
        {missingMonths > 0 ? (
          <button
            onClick={onShowGaps}
            disabled={!onShowGaps}
            className="flex items-center gap-1.5 text-left text-xs font-semibold text-[#FF8A3D] transition-colors enabled:hover:text-[#FFB48A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70 disabled:cursor-default"
          >
            {gapsLabel}
            {onShowGaps && <ArrowRight className="h-3.5 w-3.5 flex-shrink-0" />}
          </button>
        ) : (
          <span className="text-xs font-semibold text-[#FF8A3D]">
            Todos los meses vencidos están cubiertos
          </span>
        )}
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
  children?: React.ReactNode;
}

/** Canal de la consola: etiqueta, cifra y, opcionalmente, una lectura de apoyo. */
function Channel({
  label,
  labelClassName = "text-white/70",
  iconClassName = "bg-white/[0.12]",
  icon,
  value,
  valueClassName = "text-white text-[30px]",
  className = "",
  children,
}: ChannelProps) {
  return (
    <div className={`flex min-w-0 flex-1 flex-col justify-center gap-3 px-[22px] py-[18px] ${className}`}>
      <div className="flex items-center gap-2.5">
        <span
          className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${iconClassName}`}
        >
          {icon}
        </span>
        <span className={`truncate text-[12.5px] font-medium ${labelClassName}`}>
          {label}
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <p className={`truncate font-mono font-light leading-[1.1] tracking-[-0.015em] ${valueClassName}`}>
          {value}
        </p>
        {children}
      </div>
    </div>
  );
}
