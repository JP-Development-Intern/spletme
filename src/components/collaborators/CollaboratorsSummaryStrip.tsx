import { CircleCheck, GitBranch, HandCoins, Send, Users, type LucideIcon } from "lucide-react";
import { formatCurrency } from "@/utils/format.utils";
import type { Collaborator } from "@/types";

interface CollaboratorsSummaryStripProps {
  totalCollaborators: number;
  people: number;
  labels: number;
  activeSplits: number;
  songsWithSplits: number;
  totalPaid: number;
  totalPending: number;
  /** Con datos de cobro y saldo pendiente: se les puede pagar ya. */
  payable: Collaborator[];
  /** Con saldo pendiente pero sin datos de cobro todavía. */
  blocked: Collaborator[];
  onPayAll: () => void;
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/**
 * Resumen de la página. Une las métricas y la bandeja de atención: el total por
 * pagar salía en las dos, y desglosado aquí dice de dónde sale y qué se puede
 * hacer ya con él.
 */
export function CollaboratorsSummaryStrip({
  totalCollaborators,
  people,
  labels,
  activeSplits,
  songsWithSplits,
  totalPaid,
  totalPending,
  payable,
  blocked,
  onPayAll,
}: CollaboratorsSummaryStripProps) {
  const payableTotal = payable.reduce((sum, c) => sum + c.amountPending, 0);
  const blockedTotal = blocked.reduce((sum, c) => sum + c.amountPending, 0);

  return (
    <section className="glass flex flex-col rounded-[28px] p-1.5 xl:flex-row xl:items-stretch">
      <div className="flex min-w-0 flex-1 flex-col divide-y divide-white/[0.09] sm:flex-row sm:divide-x sm:divide-y-0">
        <Channel
          icon={Users}
          label="Colaboradores"
          value={totalCollaborators.toLocaleString()}
          caption={`${plural(people, "persona", "personas")} · ${plural(labels, "sello", "sellos")}`}
        />
        <Channel
          icon={GitBranch}
          label="Splits activos"
          value={activeSplits.toLocaleString()}
          caption={`en ${plural(songsWithSplits, "canción", "canciones")}`}
        />
        <Channel
          icon={CircleCheck}
          label="Ya pagado"
          value={formatCurrency(totalPaid)}
          valueClassName="text-[#45D39A]"
          caption="desde que empezaste"
        />
      </div>

      <div className="glass-cream flex flex-col gap-3 rounded-[22px] px-[22px] py-[18px] xl:w-[420px] xl:flex-shrink-0">
        <span className="flex items-center gap-2 text-[12.5px] font-medium text-[#5E524B]">
          <HandCoins className="h-[15px] w-[15px]" />
          Por pagar
        </span>
        <p className="font-mono text-[34px] font-light leading-[38px] tracking-[-0.015em] text-[#1C1D22]">
          {totalPending > 0 ? formatCurrency(totalPending) : "Al día"}
        </p>

        {totalPending <= 0 ? (
          <Breakdown
            color="#16865A"
            title="No le debes nada a nadie"
            detail="Volverá a aparecer trabajo aquí en cuanto cargues un reporte nuevo."
          />
        ) : (
          <>
            {payable.length > 0 && (
              <div className="flex items-center gap-3">
                <Breakdown
                  color="#16865A"
                  title={`${formatCurrency(payableTotal)} listos para enviar`}
                  detail={`${plural(payable.length, "persona puede", "personas pueden")} cobrar ya`}
                />
                <button
                  onClick={onPayAll}
                  className="flex flex-shrink-0 items-center gap-[7px] rounded-full bg-[#FF5C00] px-[15px] py-2.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-[#EA580C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F7EDE6]"
                >
                  <Send className="h-3.5 w-3.5" />
                  {payable.length === 1 ? "Pagar" : `Pagar a ${payable.length}`}
                </button>
              </div>
            )}
            {blocked.length > 0 && (
              <div className={payable.length > 0 ? "border-t border-[#1C1D22]/[0.08] pt-2.5" : ""}>
                <Breakdown
                  color="#C9353B"
                  title={`${formatCurrency(blockedTotal)} esperan datos de cobro`}
                  detail={`${plural(blocked.length, "persona todavía no puede", "personas todavía no pueden")} recibir pagos`}
                />
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

interface ChannelProps {
  icon: LucideIcon;
  label: string;
  value: string;
  caption: string;
  valueClassName?: string;
}

function Channel({ icon: Icon, label, value, caption, valueClassName = "text-white" }: ChannelProps) {
  return (
    <div className="flex min-w-0 flex-1 flex-col justify-center gap-3 px-[22px] py-[18px]">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/[0.12]">
          <Icon className="h-[15px] w-[15px] text-white" />
        </span>
        <h2 className="truncate text-[12.5px] font-medium text-white/70">{label}</h2>
      </div>
      <div className="flex flex-col gap-1">
        <p className={`truncate font-mono text-[34px] font-light leading-[38px] tracking-[-0.015em] ${valueClassName}`}>
          {value}
        </p>
        <span className="truncate text-xs text-white/50">{caption}</span>
      </div>
    </div>
  );
}

/** Una parte del total por pagar: cuánto es y por qué está en ese grupo. */
function Breakdown({ color, title, detail }: { color: string; title: string; detail: string }) {
  return (
    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
      <span className="flex items-center gap-1.5 text-[12.5px] font-semibold" style={{ color }}>
        <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ backgroundColor: color }} />
        {title}
      </span>
      <span className="text-[11.5px] text-[#5E524B]">{detail}</span>
    </span>
  );
}
