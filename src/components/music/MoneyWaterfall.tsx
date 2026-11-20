import { formatCurrency } from "@/utils/format.utils";
import {
  assignedPercentage,
  collaboratorPool,
  effectivePercentage,
  ownerEffectivePercentage,
  ownerPercentage,
  unassignedPercentage,
  type Share,
  type WaterfallStep,
} from "@/utils/money.utils";

interface MoneyWaterfallProps {
  steps: WaterfallStep[];
  shares: Share[];
  /** Cifra sobre la que se calcula el reparto. */
  distributable: number;
  title?: string;
  subtitle?: string;
  /** Aviso propio del contexto: en álbumes, las pistas que aún no reparten. */
  notice?: React.ReactNode;
  /** Nota al pie del reparto. En álbumes explica que el % es un promedio. */
  footnote?: string;
  onEditSplits?: () => void;
}

const TONE_COLOR: Record<WaterfallStep["tone"], string> = {
  neutral: "#FFFFFF",
  positive: "#45D39A",
  negative: "#FF8F92",
};

/** La tinta es un color de persona más; sobre la noche necesita un aro para verse. */
const INK = "#1C1D22";
const inkRing = (color: string): React.CSSProperties | undefined =>
  color === INK ? { boxShadow: "inset 0 0 0 1px rgba(255, 255, 255, 0.25)" } : undefined;

/**
 * A dónde va el dinero, en una sola lectura vertical.
 *
 * Cada escalón dice de dónde sale lo que se resta, no solo cuánto; y al final,
 * quién cobra de lo que queda. Es la cuenta completa que antes había que
 * reconstruir saltando entre pestañas.
 */
export function MoneyWaterfall({
  steps,
  shares,
  distributable,
  title = "A dónde va el dinero",
  subtitle,
  notice,
  footnote,
  onEditSplits,
}: MoneyWaterfallProps) {
  // El owner retiene un porcentaje de la parte de cada uno, y puede haberlo
  // pactado distinto con cada persona: el 100% que se mide aquí es el del
  // reparto entre colaboradores, del que el owner no ocupa sitio.
  const ownerPct = ownerPercentage(shares);
  const unassigned = unassignedPercentage(shares);
  const assigned = assignedPercentage(shares);
  const pool = collaboratorPool(distributable, ownerPct);
  // Ancho del bloque del owner en la barra: la suma de todo lo que retiene, no
  // su porcentaje suelto. Con una retención única para todos, coincide con él.
  const ownerWidth = ownerEffectivePercentage(shares, ownerPct);

  return (
    <section className="glass col-span-12 flex min-w-0 flex-col gap-4 rounded-[28px] px-6 py-5 xl:col-span-8">
      <div className="flex flex-col gap-0.5">
        <h2 className="font-display text-[19px] font-medium tracking-[-0.005em] text-white">{title}</h2>
        {subtitle && <p className="text-[12.5px] text-white/65">{subtitle}</p>}
      </div>

      {/* Escalones */}
      <ol className="flex flex-col">
        {steps.map((step, index) => {
          const last = index === steps.length - 1;
          const isTotal = step.kind === "total";
          return (
            <li key={`${step.label}-${index}`} className="flex items-start gap-3.5">
              {/* Raíl con el nodo y la línea que conecta */}
              <span className="flex w-[22px] flex-shrink-0 flex-col items-center" aria-hidden="true">
                <span
                  className={`flex h-3.5 w-3.5 items-center justify-center rounded-full ${
                    isTotal ? "" : "bg-transparent"
                  }`}
                  style={isTotal ? { backgroundColor: TONE_COLOR[step.tone] } : undefined}
                >
                  <span
                    className={`rounded-full ${
                      isTotal ? "h-[5px] w-[5px] bg-[#2B1E17]" : "h-[7px] w-[7px] bg-white/25"
                    }`}
                  />
                </span>
                {!last && <span className={`w-0.5 flex-1 bg-white/[0.12] ${isTotal ? "min-h-[30px]" : "min-h-[26px]"}`} />}
              </span>

              <span
                className={`flex flex-1 items-start justify-between gap-3.5 ${
                  last ? "" : isTotal ? "pb-4" : "pb-3.5"
                }`}
              >
                <span className="flex min-w-0 flex-col gap-0.5">
                  {isTotal ? (
                    <span className="font-mono text-[9.5px] font-medium tracking-[1.3px] text-white/50">
                      {step.label}
                    </span>
                  ) : (
                    <span className="text-[12.5px] text-white/65">{step.label}</span>
                  )}
                  {step.detail && (
                    <span className="text-[11px] text-white/50">{step.detail}</span>
                  )}
                </span>

                <span
                  className={`flex-shrink-0 font-mono ${
                    isTotal ? "text-[24px] font-light tracking-[-0.015em]" : "text-[13px] font-medium"
                  }`}
                  style={{ color: step.amount < 0 ? TONE_COLOR[step.tone] : TONE_COLOR[step.tone] }}
                >
                  {step.amount < 0 ? `−${formatCurrency(Math.abs(step.amount))}` : formatCurrency(step.amount)}
                </span>
              </span>
            </li>
          );
        })}
      </ol>

      <div className="h-px bg-white/[0.09]" />

      {/* Reparto */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[12.5px] font-semibold text-white">
            {shares.length === 0
              ? "Todavía no se reparte"
              : `Se reparte entre ${shares.length}`}
          </span>
          {onEditSplits && (
            <button
              onClick={onEditSplits}
              className="text-[11.5px] font-semibold text-[#FF8A3D] transition-colors hover:text-[#FFB48A]"
            >
              Editar splits
            </button>
          )}
        </div>

        {shares.length > 0 && (
          <>
            {/* Anchos en base común (% de lo repartible): el del colaborador se
                encoge por lo que ya se llevó el owner, para que la barra sume 100. */}
            <span className="flex h-4 w-full gap-[2px] overflow-hidden rounded-lg">
              {shares.map((share) => (
                <span
                  key={share.id}
                  title={
                    share.isOwner
                      ? `${share.name}: lo que retienes del reparto`
                      : `${share.name}: ${share.percentage}% del reparto` +
                        (share.ownerRate === null || share.ownerRate === undefined
                          ? ""
                          : `, con una retención del ${share.ownerRate}%`)
                  }
                  className="h-full min-w-[3px]"
                  style={{
                    width: `${
                      share.isOwner ? ownerWidth : effectivePercentage(share, ownerPct)
                    }%`,
                    backgroundColor: share.color,
                    ...inkRing(share.color),
                  }}
                />
              ))}
              {unassigned > 0 && (
                <span
                  title={`Sin repartir: ${unassigned.toFixed(0)}% del reparto`}
                  className="h-full bg-white/[0.12]"
                  style={{ width: `${(unassigned * (100 - ownerPct)) / 100}%` }}
                />
              )}
            </span>

            <ul className="flex flex-col gap-2.5">
              {shares.map((share) => (
                <li key={share.id} className="flex items-center gap-3">
                  <span
                    className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: share.color, ...inkRing(share.color) }}
                  >
                    <span className="text-[9.5px] font-semibold text-white">
                      {initials(share.name, share.isOwner)}
                    </span>
                  </span>

                  <span className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                    <span className="truncate text-[12.5px] font-medium text-white">
                      {share.name}
                    </span>
                    {share.role && (
                      <span className="rounded-full bg-white/[0.08] px-[7px] py-[3px] text-[10px] text-white/65">
                        {share.role}
                      </span>
                    )}
                    {(share.pending ?? 0) > 0 && (
                      <span className="rounded-full bg-[#FF5C00]/[0.16] px-[7px] py-[3px] text-[10px] font-semibold text-[#FF9A5C]">
                        Por pagar
                      </span>
                    )}
                  </span>

                  <span className="flex flex-shrink-0 flex-col items-end">
                    <span className="font-mono text-[11.5px] font-semibold text-white/65">
                      {share.percentage}%
                    </span>
                    {!share.isOwner && ownerPct > 0 && (
                      <span className="font-mono text-[9.5px] text-white/50">
                        de lo que queda
                      </span>
                    )}
                  </span>
                  <span className="w-[96px] flex-shrink-0 text-right font-mono text-[13.5px] text-white">
                    {formatCurrency(share.amount)}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}

        {notice}

        {ownerPct > 0 && (
          <p className="text-[11px] leading-relaxed text-white/50">
            Tu {ownerPct}% de owner sale primero de {formatCurrency(distributable)} repartibles. Los
            colaboradores se reparten los {formatCurrency(pool)} restantes, y ese es el 100% que se
            mide aquí.
          </p>
        )}

        {unassigned > 0 && shares.length > 0 && (
          <p className="text-[11px] leading-relaxed text-white/50">
            Queda un {unassigned.toFixed(unassigned % 1 === 0 ? 0 : 1)}% sin repartir de{" "}
            {formatCurrency(ownerPct > 0 ? pool : distributable)}: ese resto se queda contigo.
          </p>
        )}

        {assigned > 100 && (
          <p className="rounded-[14px] border border-[#E5484D]/30 bg-[#E5484D]/[0.14] px-3.5 py-3 text-[11.5px] font-medium text-[#FF8F92]">
            Los colaboradores suman {assigned.toFixed(1)}% de lo que queda tras tu parte de owner,
            más del 100%. Hay que corregirlo antes de poder pagar.
          </p>
        )}

        {footnote && <p className="text-[11px] leading-relaxed text-white/50">{footnote}</p>}
      </div>
    </section>
  );
}

function initials(name: string, isOwner?: boolean): string {
  if (isOwner) return "TÚ";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}
