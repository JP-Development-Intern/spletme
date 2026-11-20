import { useEffect, useMemo, useState } from "react";
import { Receipt, CheckCircle2, Clock3, AlertCircle, Send } from "lucide-react";
import PaymentsService from "@/services/payments";
import type { RoyaltyPayment, RoyaltyBreakdownItem } from "@/services/payments";

interface Props {
  songId?: string;
  refreshTrigger?: number;
  pendingAmount?: number;
}

const STATUS: Record<
  RoyaltyPayment["status"],
  { label: string; color: string; bg: string; icon: typeof CheckCircle2 }
> = {
  succeeded: { label: "Recibido", color: "#45D39A", bg: "rgba(69, 211, 154, 0.12)", icon: CheckCircle2 },
  processing: { label: "En camino", color: "#FF9A5C", bg: "rgba(255, 92, 0, 0.16)", icon: Send },
  pending: { label: "En camino", color: "#FF9A5C", bg: "rgba(255, 92, 0, 0.16)", icon: Clock3 },
  failed: { label: "Falló", color: "#FF8F92", bg: "rgba(229, 72, 77, 0.14)", icon: AlertCircle },
};

const money = (n: number) =>
  n.toLocaleString("es-CO", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });

function recipientName(id: RoyaltyBreakdownItem["collaboratorId"]): string {
  if (id && typeof id === "object") return id.name || id.username || id.email || "Colaborador";
  return "Colaborador";
}

function getInitials(name: string): string {
  return (
    name
      .split(" ")
      .slice(0, 2)
      .map((n) => n[0] ?? "")
      .join("")
      .toUpperCase() || "?"
  );
}

interface PaymentRow {
  key: string;
  date: string;
  name: string;
  amount: number;
  method: string;
  status: RoyaltyPayment["status"];
}

/**
 * Lo que ya salió de la cuenta por esta canción: un apunte por persona y pago,
 * del más reciente al más antiguo.
 */
export default function SongPaymentsHistory({ songId, refreshTrigger, pendingAmount }: Props) {
  const [payments, setPayments] = useState<RoyaltyPayment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!songId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    PaymentsService.getSongHistory(songId).then((res) => {
      if (!res.error && res.data) setPayments(res.data);
      setLoading(false);
    });
  }, [songId, refreshTrigger]);

  const totalPaid = payments
    .filter((p) => p.status === "succeeded")
    .reduce((sum, p) => sum + p.amount, 0);

  // Un pago puede repartirse entre varias personas: cada una es una línea.
  const rows = useMemo<PaymentRow[]>(() => {
    return payments.flatMap((p) => {
      const method = p.stripePaymentIntentId ? "Stripe" : (p.currency?.toUpperCase() ?? "—");
      const recipients = p.breakdown ?? [];
      if (recipients.length === 0) {
        return [
          {
            key: p._id,
            date: p.createdAt,
            name: "Pago de la canción",
            amount: p.amount,
            method,
            status: p.status,
          },
        ];
      }
      return recipients.map((b, i) => ({
        key: `${p._id}-${i}`,
        date: p.createdAt,
        name: recipientName(b.collaboratorId),
        amount: b.amount,
        method,
        status: p.status,
      }));
    });
  }, [payments]);

  const pending = pendingAmount ?? 0;

  return (
    <section className="glass flex flex-col overflow-hidden rounded-[28px]">
      <header className="flex flex-col gap-0.5 px-5 py-[18px]">
        <h3 className="font-display text-[19px] font-medium tracking-[-0.005em] text-white">
          Lo que ya se ha pagado
        </h3>
        <p className="text-[12.5px] text-white/65">
          {loading
            ? "Trayendo el historial…"
            : rows.length === 0
              ? "Todavía no ha salido dinero por esta canción"
              : `${payments.length} ${payments.length === 1 ? "cobro" : "cobros"} · ${money(totalPaid)} entregados`}
        </p>
      </header>

      <div className="h-px bg-white/[0.09]" />

      {loading ? (
        <div className="flex flex-col items-center gap-2.5 py-14 text-center">
          <Clock3 className="h-6 w-6 animate-pulse text-white/50" />
          <p className="text-sm text-white/65">Trayendo el historial…</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center gap-2.5 px-6 py-14 text-center">
          <span className="grid h-[58px] w-[58px] place-items-center rounded-[20px] bg-[#FF5C00]/15">
            <Receipt className="h-6 w-6 text-[#FF8A3D]" />
          </span>
          <p className="text-[15px] font-semibold text-white">Aún no se ha pagado nada</p>
          <p className="max-w-[300px] text-[13px] text-white/65">
            Cuando pagues a los colaboradores, cada envío quedará apuntado aquí con su fecha.
          </p>
        </div>
      ) : (
        <ul className="max-h-[420px] flex-1 overflow-y-auto">
          {rows.map((row, index) => {
            const cfg = STATUS[row.status] ?? STATUS.pending;
            const Icon = cfg.icon;
            return (
              <li key={row.key}>
                {index > 0 && <div className="h-px bg-white/[0.09]" />}
                <div className="flex items-center gap-[11px] px-5 py-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 border-white/25 bg-[#1C1D22] text-[10px] font-semibold text-white">
                    {getInitials(row.name)}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate text-[12.5px] font-semibold text-white">
                      {row.name}
                    </span>
                    <span className="truncate text-[11px] text-white/50">
                      {formatDate(row.date)} · {row.method}
                    </span>
                  </div>
                  <span className="shrink-0 font-mono text-[13.5px] text-white">
                    {money(row.amount)}
                  </span>
                  <span
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-[12px] px-[9px] py-1 text-[10px] font-semibold"
                    style={{ backgroundColor: cfg.bg, color: cfg.color }}
                  >
                    <Icon className="h-2.5 w-2.5" />
                    {cfg.label}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="h-px bg-white/[0.09]" />

      <footer className="flex items-center gap-2 px-5 py-3.5">
        {pending > 0 ? (
          <>
            <Clock3 className="h-3.5 w-3.5 shrink-0 text-[#FF8A3D]" />
            <span className="text-[11.5px] font-semibold text-[#FF8A3D]">
              Quedan {money(pending)} por pagar
            </span>
          </>
        ) : (
          <>
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#45D39A]" />
            <span className="text-[11.5px] font-semibold text-[#45D39A]">
              No queda nada pendiente
            </span>
          </>
        )}
      </footer>
    </section>
  );
}
