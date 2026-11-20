import { Link } from "react-router-dom";
import { ChevronRight, DollarSign, Music, Play, Scale, type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { formatCurrency, formatStreams } from "@/utils/format.utils";
import { CountUp, useReveal } from "./dashboardIntro";

interface DashboardStatsStripProps {
  totalNetIncome: number;
  totalStreams: number;
  songsCount: number;
  netBalance: number;
  totalAmount: number;
  /** Segundos desde el montaje en los que entra la franja. */
  at?: number;
}

/** Las cifras empiezan a contar cuando el panel ya está casi asentado. */
const COUNT_LAG = 0.15;
const formatCount = (value: number) => value.toLocaleString();

/**
 * Franja de métricas del Inicio: ingresos, streams y canciones del periodo en
 * una sola superficie de vidrio separada por hairlines, y el balance neto al
 * final en crema, que es el tono que el panel reserva para lo destacado.
 */
export function DashboardStatsStrip({
  totalNetIncome,
  totalStreams,
  songsCount,
  netBalance,
  totalAmount,
  at = 0,
}: DashboardStatsStripProps) {
  const reveal = useReveal(at);
  const countAt = at + COUNT_LAG;

  return (
    <motion.section
      {...reveal}
      className="glass flex flex-col rounded-[28px] p-1.5 xl:flex-row xl:items-stretch"
      data-tour="stats-cards"
    >
      <div className="flex min-w-0 flex-1 flex-col divide-y divide-white/[0.09] sm:flex-row sm:divide-x sm:divide-y-0">
        <Channel
          icon={DollarSign}
          label="Ingresos netos"
          value={<CountUp value={totalNetIncome} format={formatCurrency} at={countAt} />}
          valueClassName="text-[#45D39A]"
        />
        <Channel
          icon={Play}
          label="Streams"
          value={<CountUp value={totalStreams} format={formatStreams} integer at={countAt} />}
        />
        <Channel
          icon={Music}
          label="Canciones con ingresos"
          value={<CountUp value={songsCount ?? 0} format={formatCount} integer at={countAt} />}
        />
      </div>

      <div className="glass-cream flex flex-col justify-center gap-2 rounded-[22px] px-[22px] py-[18px] xl:w-[354px] xl:flex-shrink-0">
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-[12.5px] font-medium text-[#5E524B]">
            <Scale className="h-[15px] w-[15px]" />
            Balance neto
          </span>
          <Link
            to="/panel/wallet"
            className="flex items-center gap-1 text-[12.5px] font-medium text-[#1C1D22] hover:underline"
          >
            Ir a Banco
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <p className="font-mono text-[34px] font-light leading-[38px] tracking-[-0.015em] text-[#1C1D22]">
          <CountUp value={netBalance} format={formatCurrency} at={countAt} />
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <Flow color="#16865A" amount={`+${formatCurrency(totalNetIncome)}`} label="ingresos" />
          <Flow color="#C9353B" amount={`−${formatCurrency(totalAmount)}`} label="pagos" />
        </div>
      </div>
    </motion.section>
  );
}

interface ChannelProps {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
}

/** Canal de la franja: etiqueta con su ícono y la cifra del periodo. */
function Channel({ icon: Icon, label, value, valueClassName = "text-white" }: ChannelProps) {
  return (
    <div className="flex min-w-0 flex-1 flex-col justify-center gap-3 px-[22px] py-[18px]">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/[0.12]">
          <Icon className="h-[15px] w-[15px] text-white" />
        </span>
        <h2 className="truncate text-[12.5px] font-medium text-white/70">{label}</h2>
      </div>
      <p className={`truncate font-mono text-[34px] font-light leading-[38px] tracking-[-0.015em] ${valueClassName}`}>
        {value}
      </p>
    </div>
  );
}

/** Entrada o salida de dinero que explica el balance. */
function Flow({ color, amount, label }: { color: string; amount: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      {amount} {label}
    </span>
  );
}
