import { HandCoins, Globe, Radio, Clock3, CircleCheck } from "lucide-react";
import { formatCurrency } from "@/utils/format.utils";

interface MyShareCardProps {
  /** El porcentaje del split propio, tal cual está firmado. */
  percentage: number;
  /** Lo devengado hasta hoy con ese split. */
  amount: number;
  /** Lo ya cobrado, si consta. */
  paid?: number;
  /** El alcance del split, cuando está limitado a países o plataformas. */
  scope?: { label: string; worldwide: boolean } | null;
  /** Estado de la solicitud de regalías, para no repetir el aviso de arriba. */
  requestPending?: boolean;
  onRequest?: () => void;
}

/**
 * Lo que cobra quien no es el dueño de la canción.
 *
 * Sustituye a la cascada del dinero, que es una vista de owner: cuenta el
 * ingreso de la canción y quién se lo lleva, incluido el propio owner. Aquí solo
 * está lo que le toca a quien mira —su porcentaje, su dinero, su alcance—, que
 * es cierto y es lo único que le concierne. Ver `utils/ownerVisibility.ts`.
 */
export function MyShareCard({
  percentage,
  amount,
  paid = 0,
  scope,
  requestPending = false,
  onRequest,
}: MyShareCardProps) {
  const pending = Math.max(0, amount - paid);

  return (
    <section className="glass col-span-12 flex min-w-0 flex-col gap-4 rounded-[28px] px-6 py-5 xl:col-span-8">
      <div className="flex flex-col gap-0.5">
        <h2 className="font-display text-[19px] font-medium tracking-[-0.005em] text-white">Tu parte</h2>
        <p className="text-[12.5px] text-white/65">Lo que te corresponde de esta canción</p>
      </div>

      <div className="flex flex-wrap items-end gap-x-10 gap-y-5">
        <span className="flex flex-col gap-1">
          <span className="font-mono text-[9.5px] font-medium tracking-[1.3px] text-white/50">
            TU SPLIT
          </span>
          <span className="font-mono text-[34px] font-light leading-none tracking-[-0.015em] text-white">
            {percentage}%
          </span>
        </span>

        <span className="flex flex-col gap-1">
          <span className="font-mono text-[9.5px] font-medium tracking-[1.3px] text-white/50">
            DEVENGADO
          </span>
          <span className="font-mono text-[34px] font-light leading-none tracking-[-0.015em] text-[#45D39A]">
            {formatCurrency(amount)}
          </span>
        </span>

        {paid > 0 && (
          <span className="flex flex-col gap-1">
            <span className="font-mono text-[9.5px] font-medium tracking-[1.3px] text-white/50">
              YA COBRADO
            </span>
            <span className="font-mono text-[22px] font-light leading-none tracking-[-0.015em] text-white/65">
              {formatCurrency(paid)}
            </span>
          </span>
        )}
      </div>

      {scope && (
        <p className="flex items-center gap-2 rounded-[16px] bg-white/[0.06] px-3.5 py-3 text-[11.5px] text-white/65">
          {scope.worldwide ? (
            <Globe className="h-3.5 w-3.5 flex-shrink-0 text-white/50" />
          ) : (
            <Radio className="h-3.5 w-3.5 flex-shrink-0 text-white/50" />
          )}
          {scope.worldwide
            ? "Tu split aplica en todos los países y plataformas"
            : `Tu split aplica en ${scope.label}`}
        </p>
      )}

      <div className="h-px bg-white/[0.09]" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="flex items-center gap-2.5">
          {pending > 0 ? (
            <Clock3 className="h-3.5 w-3.5 text-[#FF8A3D]" />
          ) : (
            <CircleCheck className="h-3.5 w-3.5 text-[#45D39A]" />
          )}
          <span
            className={`text-[12.5px] font-semibold ${pending > 0 ? "text-[#FF8A3D]" : "text-[#45D39A]"}`}
          >
            {pending > 0 ? `${formatCurrency(pending)} por cobrar` : "Estás al día"}
          </span>
        </span>

        {pending > 0 && onRequest && !requestPending && (
          <button
            onClick={onRequest}
            className="flex items-center gap-2 rounded-full bg-[#FF5C00] px-4 py-2.5 text-[12px] font-semibold text-white shadow-[0_8px_20px_-6px_rgba(255,92,0,0.35)] transition-colors hover:bg-[#EA580C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            <HandCoins className="h-3.5 w-3.5" />
            Solicitar mis regalías
          </button>
        )}
      </div>
    </section>
  );
}
