import type { LucideIcon } from "lucide-react";
import { CircleCheck, CircleX } from "lucide-react";

interface WalletAccountStatusRowProps {
  icon: LucideIcon;
  label: string;
  active: boolean;
}

/**
 * Fila de la billetera del dashboard que muestra una cuenta y si está activa o no.
 */
export function WalletAccountStatusRow({ icon: Icon, label, active }: WalletAccountStatusRowProps) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-white/[0.07] py-2 pl-3.5 pr-2.5">
      <div className="flex items-center gap-2.5">
        <Icon className="h-4 w-4 text-white/70" />
        <span className="text-[12.5px] font-medium text-white">{label}</span>
      </div>
      {active ? (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#45D39A]/[0.24] px-2.5 py-1 text-[11px] font-semibold text-[#5BE3AB]">
          <CircleCheck className="h-3 w-3" />
          Activa
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FF8A8A]/[0.22] px-2.5 py-1 text-[11px] font-semibold text-[#FF9C9C]">
          <CircleX className="h-3 w-3" />
          Inactiva
        </span>
      )}
    </div>
  );
}
