import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { formatCurrency } from "@/utils/format.utils";

interface BalanceCardProps {
  netBalance: number;
  totalNetIncome: number;
  totalAmount: number;
}

/**
 * Balance neto en crema: es la cifra que el artista viene a mirar, así que va
 * en el tono que el panel reserva para lo destacado.
 */
export function BalanceCard({ netBalance, totalNetIncome, totalAmount }: BalanceCardProps) {
  return (
    <section className="glass-cream flex flex-1 flex-col justify-between gap-2 rounded-[28px] px-6 py-[22px]">
      <div className="flex items-center justify-between">
        <h2 className="text-[12.5px] font-medium text-[#5E524B]">Balance neto</h2>
        <Link
          to="/panel/wallet"
          className="flex items-center gap-1 text-[12.5px] font-medium text-[#1C1D22] hover:underline"
        >
          Ir a Banco
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <p className="font-mono text-[38px] font-light leading-[42px] tracking-[-0.015em] text-[#1C1D22]">
        {formatCurrency(netBalance)}
      </p>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <Flow color="#16865A" amount={`+${formatCurrency(totalNetIncome)}`} label="ingresos" />
        <Flow color="#C9353B" amount={`−${formatCurrency(totalAmount)}`} label="pagos" />
      </div>
    </section>
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
