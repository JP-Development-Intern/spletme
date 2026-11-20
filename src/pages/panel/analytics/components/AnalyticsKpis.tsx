import { DollarSign, Gauge, Play, Receipt, Trophy, type LucideIcon } from "lucide-react";
import { formatCurrency, formatStreams } from "@/utils/format.utils";
import type { AnalyticsKpis, HistoricalTotal, SplitOwnerInfo } from "@/types/analytics.types";
import { formatMonth, formatPerThousand, perThousand } from "../analytics.utils";

interface Props {
  kpis: AnalyticsKpis | null;
  historical: HistoricalTotal | null;
  catalog: SplitOwnerInfo | null;
  loading: boolean;
  /** Hay filtros: los canales hablan de una parte del catálogo, no de todo. */
  filtered: boolean;
}

/**
 * Consola de cifras. Los cuatro canales responden a los filtros; el bloque en
 * crema es el histórico sin filtrar, que hace de ancla: dice cuánto pesa lo que
 * se está mirando frente al total. La mejor canción de siempre vive ahí y no en
 * un panel aparte, porque es un dato del catálogo entero, no del filtro.
 */
export default function AnalyticsKpisSection({ kpis, historical, catalog, loading, filtered }: Props) {
  const income = kpis?.totalIncome ?? 0;
  const streams = kpis?.totalStreams ?? 0;
  const gross = kpis?.totalGrossIncome ?? 0;
  const pending = loading && !kpis;
  const scope = filtered ? "con los filtros" : "en todo el historial";
  const share =
    filtered && historical && historical.totalNetIncome > 0
      ? Math.round((income / historical.totalNetIncome) * 100)
      : null;

  return (
    <section className="glass flex flex-col rounded-[28px] p-1.5 xl:flex-row xl:items-stretch" aria-busy={loading}>
      <div className="grid min-w-0 flex-1 grid-cols-1 divide-y divide-white/[0.09] sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
        <Channel
          icon={DollarSign}
          label="Ingresos netos"
          value={pending ? null : formatCurrency(income)}
          valueClassName="text-[#45D39A]"
          caption={share !== null ? `${share}% del histórico` : scope}
        />
        <Channel icon={Play} label="Streams" value={pending ? null : formatStreams(streams)} caption={scope} />
        <Channel
          icon={Gauge}
          label="Por cada 1.000 streams"
          value={pending ? null : formatPerThousand(perThousand(income, streams))}
          caption="ingreso neto medio"
        />
        <Channel
          icon={Receipt}
          label="Comisiones y retenciones"
          value={pending ? null : formatCurrency(kpis?.totalExpenses ?? 0)}
          valueClassName="text-[#FF8F92]"
          caption={`sobre ${formatCurrency(gross)} brutos`}
        />
      </div>

      <div className="glass-cream flex flex-col justify-center gap-2 rounded-[22px] px-[22px] py-[18px] xl:w-[330px] xl:flex-shrink-0">
        <span className="text-[12.5px] font-medium text-[#5E524B]">Histórico total</span>
        <p className="font-mono text-[30px] font-light leading-[1.1] tracking-[-0.015em] text-[#1C1D22]">
          {historical ? formatCurrency(historical.totalNetIncome) : <Placeholder dark />}
        </p>
        <span className="text-xs text-[#5E524B]">
          {historical?.firstDate
            ? `${formatMonth(historical.firstDate)} – ${formatMonth(historical.lastDate)} · sin filtros`
            : "sin filtros"}
        </span>
        {catalog?.topSong && (
          <span className="mt-1 flex min-w-0 items-center gap-1.5 border-t border-[#1C1D22]/10 pt-2.5 text-xs text-[#5E524B]">
            <Trophy className="h-3.5 w-3.5 flex-shrink-0 text-[#B4570F]" />
            <span className="truncate">
              Mejor canción: <span className="font-semibold text-[#1C1D22]">{catalog.topSong.trackTitle}</span>
            </span>
            <span className="flex-shrink-0 font-mono font-semibold text-[#16865A]">
              {formatCurrency(catalog.topSong.netIncome)}
            </span>
          </span>
        )}
      </div>
    </section>
  );
}

interface ChannelProps {
  icon: LucideIcon;
  label: string;
  value: string | null;
  caption: string;
  valueClassName?: string;
}

function Channel({ icon: Icon, label, value, caption, valueClassName = "text-white" }: ChannelProps) {
  return (
    <div className="flex min-w-0 flex-col justify-center gap-3 px-[22px] py-[18px]">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/[0.12]">
          <Icon className="h-[15px] w-[15px] text-white" />
        </span>
        <h2 className="truncate text-[12.5px] font-medium text-white/70">{label}</h2>
      </div>
      <div className="flex flex-col gap-1">
        <p className={`truncate font-mono text-[30px] font-light leading-[1.1] tracking-[-0.015em] ${valueClassName}`}>
          {value ?? <Placeholder />}
        </p>
        <span className="truncate text-xs text-white/50">{caption}</span>
      </div>
    </div>
  );
}

function Placeholder({ dark = false }: { dark?: boolean }) {
  return (
    <span
      className={`inline-block h-[26px] w-28 animate-pulse rounded-full align-middle ${
        dark ? "bg-[#1C1D22]/10" : "bg-white/[0.1]"
      }`}
    />
  );
}
