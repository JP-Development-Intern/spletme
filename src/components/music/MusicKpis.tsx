import { Music, Disc3, DollarSign, Play, CircleAlert, ArrowRight, type LucideIcon } from "lucide-react";
import { formatStreams, formatCurrency } from "@/utils/format.utils";

interface MusicKpisProps {
  totalSongs: number;
  totalAlbums: number;
  totalIncome: number;
  totalStreams: number;
  withoutSplits: number;
  /** Deja a la vista solo lo que aún no reparte. */
  onShowWithoutSplits?: () => void;
}

/**
 * Consola del catálogo. Canciones y álbumes se leen juntos porque son el mismo
 * catálogo; el último canal va teñido de naranja porque es el único dato
 * accionable.
 */
export function MusicKpis({
  totalSongs,
  totalAlbums,
  totalIncome,
  totalStreams,
  withoutSplits,
  onShowWithoutSplits,
}: MusicKpisProps) {
  const withSplits = Math.max(0, totalSongs - withoutSplits);

  return (
    <section className="glass flex flex-col rounded-[28px] p-1.5 xl:flex-row xl:items-stretch">
      <div className="grid min-w-0 flex-1 grid-cols-1 divide-y divide-white/[0.09] sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
        <Channel
          icon={Music}
          label="Canciones"
          value={totalSongs.toLocaleString()}
          caption={`${withSplits.toLocaleString()} con split`}
        />
        <Channel icon={Disc3} label="Álbumes" value={totalAlbums.toLocaleString()} caption="agrupados por UPC" />
        <Channel
          icon={DollarSign}
          label="Ingresos totales"
          value={formatCurrency(totalIncome)}
          valueClassName="text-[#45D39A]"
          caption="neto acumulado"
        />
        <Channel icon={Play} label="Streams" value={formatStreams(totalStreams)} caption="en todo el catálogo" />
      </div>

      <div className="flex flex-col gap-3 rounded-[22px] border border-[#FF8A3D]/30 bg-[#FF5C00]/[0.14] px-[22px] py-[18px] xl:w-[250px] xl:flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#FF5C00]/[0.22]">
            <CircleAlert className="h-[15px] w-[15px] text-[#FF8A3D]" />
          </span>
          <h2 className="text-[12.5px] font-medium text-[#FFB48A]">Sin split</h2>
        </div>
        <div className="flex flex-col gap-1">
          <p
            className={`font-mono font-light leading-[1.1] tracking-[-0.015em] text-white ${
              withoutSplits > 0 ? "text-[30px]" : "text-[24px]"
            }`}
          >
            {withoutSplits > 0 ? withoutSplits.toLocaleString() : "Ninguna"}
          </p>
          {withoutSplits > 0 ? (
            <button
              onClick={onShowWithoutSplits}
              disabled={!onShowWithoutSplits}
              className="flex w-fit items-center gap-1 text-xs font-semibold text-[#FF8A3D] transition-colors enabled:hover:text-[#FFB48A] disabled:cursor-default"
            >
              Ver solo estas
              {onShowWithoutSplits && <ArrowRight className="h-3.5 w-3.5" />}
            </button>
          ) : (
            <span className="text-xs font-semibold text-[#FF8A3D]">Todo el catálogo reparte</span>
          )}
        </div>
      </div>
    </section>
  );
}

interface ChannelProps {
  icon: LucideIcon;
  label: string;
  value: string;
  caption?: string;
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
          {value}
        </p>
        {caption && <span className="truncate text-xs text-white/50">{caption}</span>}
      </div>
    </div>
  );
}
