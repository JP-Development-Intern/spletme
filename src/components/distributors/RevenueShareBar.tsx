import { formatCurrency } from "@/utils/format.utils";
import { luminance } from "@/const/platformBrand";

/**
 * Un distribuidor negro o casi negro desaparecería sobre la noche: conserva su
 * color, pero con un aro claro que lo recorta.
 */
const inkRing = (color: string): React.CSSProperties | undefined =>
  color.startsWith("#") && color.length === 7 && luminance(color) < 0.05
    ? { boxShadow: "inset 0 0 0 1px rgba(255, 255, 255, 0.3)" }
    : undefined;

export interface ShareSlice {
  id: string;
  name: string;
  amount: number;
  color: string;
}

interface RevenueShareBarProps {
  slices: ShareSlice[];
  className?: string;
}

/**
 * Reparto de ingresos entre distribuidores en una sola barra apilada.
 *
 * Sustituye al gráfico de barras horizontales, que crecía en alto con cada
 * distribuidor y respondía peor a la única pregunta que importa aquí: quién pesa
 * cuánto sobre el total.
 */
export function RevenueShareBar({ slices, className = "" }: RevenueShareBarProps) {
  const total = slices.reduce((sum, slice) => sum + slice.amount, 0);

  if (total <= 0) {
    return (
      <div
        className={`glass flex flex-col gap-[18px] rounded-[28px] px-6 py-5 ${className}`}
      >
        <Header />
        <p className="text-[12.5px] text-white/65">
          Todavía no hay ingresos registrados en ningún distribuidor.
        </p>
      </div>
    );
  }

  const withShare = slices
    .map((slice) => ({ ...slice, share: (slice.amount / total) * 100 }))
    .sort((a, b) => b.share - a.share);

  return (
    <div
      className={`glass flex flex-col gap-[18px] rounded-[28px] px-6 py-5 ${className}`}
    >
      <Header />

      <div className="flex h-4 gap-[2px] overflow-hidden rounded-lg">
        {withShare.map((slice) => (
          <span
            key={slice.id}
            title={`${slice.name}: ${formatCurrency(slice.amount)} (${slice.share.toFixed(1)}%)`}
            style={{ backgroundColor: slice.color, width: `${slice.share}%`, ...inkRing(slice.color) }}
            className="h-full min-w-[3px]"
          />
        ))}
      </div>

      <ul className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
        {withShare.map((slice) => (
          <li key={slice.id} className="flex min-w-0 items-center gap-2.5">
            <span
              className="h-[9px] w-[9px] flex-shrink-0 rounded-full"
              style={{ backgroundColor: slice.color, ...inkRing(slice.color) }}
            />
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate text-[12px] font-semibold text-white">
                {slice.name}
              </span>
              <span className="font-mono text-[10.5px] text-white/50">
                {formatCurrency(slice.amount)} · {slice.share.toFixed(1)}%
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Header() {
  return (
    <div className="flex flex-col gap-0.5">
      <h2 className="font-display text-[19px] font-medium tracking-[-0.005em] text-white">
        Reparto de ingresos
      </h2>
      <p className="text-[12.5px] text-white/65">
        Participación de cada distribuidor en el neto acumulado
      </p>
    </div>
  );
}
