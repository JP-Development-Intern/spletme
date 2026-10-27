import { Send, Banknote, ChevronRight } from "lucide-react";
import { WalletAccountStatusRow } from "./WalletAccountStatusRow";

interface WalletSectionProps {
  loading: boolean;
  sendActive: boolean;
  receiveActive: boolean;
  onGoToBank: () => void;
}

/**
 * Panel de billetera del dashboard.
 * Muestra si la cuenta para enviar y la cuenta para recibir dinero están activas.
 * Si falta alguna (o ambas), invita a configurarlas en la sección Banco.
 */
export function WalletSection({
  loading,
  sendActive,
  receiveActive,
  onGoToBank,
}: WalletSectionProps) {
  const bothActive = sendActive && receiveActive;

  return (
    <div
      className="glass flex flex-col gap-3.5 rounded-[28px] px-6 py-5"
      data-tour="balance-section"
    >
      <h2 className="font-display text-[19px] font-medium tracking-[-0.005em] text-white">Billetera</h2>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#FF5C00]" />
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            <WalletAccountStatusRow icon={Send} label="Enviar dinero" active={sendActive} />
            <WalletAccountStatusRow icon={Banknote} label="Recibir dinero" active={receiveActive} />
          </div>

          {bothActive ? (
            <button
              onClick={onGoToBank}
              className="glass-control flex w-full items-center justify-between rounded-full py-[11px] pl-[18px] pr-3.5 transition-colors hover:bg-white/[0.12]"
            >
              <span className="text-[13px] font-semibold text-white">Gestionar en Banco</span>
              <ChevronRight className="h-[15px] w-[15px] text-white/70" />
            </button>
          ) : (
            <button
              onClick={onGoToBank}
              className="mt-1 flex w-full items-center justify-between rounded-full bg-[#FF5C00] py-[11px] pl-[18px] pr-3.5 text-white shadow-[0_8px_20px_-6px_rgba(255,92,0,0.35)] transition-colors hover:bg-[#EA580C]"
            >
              <span className="text-[13px] font-semibold">Configurar en Banco</span>
              <ChevronRight className="h-[15px] w-[15px]" />
            </button>
          )}
        </>
      )}
    </div>
  );
}
