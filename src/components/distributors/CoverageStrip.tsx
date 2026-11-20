import { MONTH_NAMES, MONTH_SHORT_NAMES } from "@/utils/period.utils";
import { luminance } from "@/const/platformBrand";

type StripSize = "mini" | "md";

interface CoverageStripProps {
  /** Meses (1-12) que ya tienen reporte cargado. */
  covered: Set<number>;
  year: number;
  /** Color de los meses cubiertos. Si se omite, cada uno toma el de su trimestre. */
  color?: string;
  /** Meses que aún no han vencido: se dibujan apagados, no como hueco. */
  upToMonth?: number;
  size?: StripSize;
  /** Inicial del mes dentro de la celda. Solo tiene sitio en `md`. */
  showInitials?: boolean;
  className?: string;
}

/**
 * Regleta de los doce meses del año: de un vistazo se ve qué está cargado y
 * dónde queda el hueco. Es la lectura que antes solo existía dentro del modal de
 * subida y ahora acompaña a cada distribuidor en la lista y en su detalle.
 *
 * Los meses que todavía no han vencido se dibujan apagados en vez de vacíos,
 * porque no son un descuido: aún no existe el reporte.
 */
export function CoverageStrip({
  covered,
  year,
  color,
  upToMonth = 12,
  size = "md",
  showInitials = false,
  className = "",
}: CoverageStripProps) {
  const mini = size === "mini";

  return (
    <div
      className={`flex items-center ${mini ? "gap-[3px]" : "gap-1"} ${className}`}
      role="img"
      aria-label={buildLabel(covered, year, upToMonth)}
    >
      {MONTH_SHORT_NAMES.map((short, index) => {
        const month = index + 1;
        const isCovered = covered.has(month);
        const pending = month > upToMonth;
        const fill = isCovered ? (color ?? quarterFill(month)) : undefined;

        return (
          <span
            key={short}
            title={`${MONTH_NAMES[index]} ${year}: ${
              isCovered ? "cargado" : pending ? "aún no vencido" : "sin cargar"
            }`}
            style={fill ? { backgroundColor: fill, ...darkRing(fill) } : undefined}
            className={[
              "flex flex-shrink-0 items-center justify-center",
              mini ? "h-[18px] w-[9px] rounded-[3px]" : "h-[42px] flex-1 rounded-[9px]",
              isCovered
                ? ""
                : pending
                  ? "border border-dashed border-white/[0.18]"
                  : "border border-white/[0.12] bg-white/[0.06]",
            ].join(" ")}
          >
            {showInitials && !mini && (
              <span
                className={`font-mono text-[11px] font-semibold ${
                  isCovered ? "text-white" : "text-white/50"
                }`}
              >
                {short.charAt(0)}
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}

/** Leyenda compartida por la lista y el detalle, para no explicar la regleta dos veces. */
export function CoverageLegend({ color = "#FF5C00" }: { color?: string }) {
  return (
    <div className="flex flex-wrap items-center gap-3.5">
      <LegendItem label="Cargado" swatchClassName="" style={{ backgroundColor: color, ...darkRing(color) }} />
      <LegendItem label="Sin cargar" swatchClassName="border border-white/[0.12] bg-white/[0.06]" />
      <LegendItem label="Aún no vencido" swatchClassName="border border-dashed border-white/[0.18]" />
    </div>
  );
}

function LegendItem({
  label,
  swatchClassName,
  style,
}: {
  label: string;
  swatchClassName: string;
  style?: React.CSSProperties;
}) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-[9px] w-[9px] rounded-[3px] ${swatchClassName}`} style={style} />
      <span className="text-[10.5px] text-white/65">{label}</span>
    </span>
  );
}

const QUARTER_FILLS = ["#1C1D22", "#2FB37E", "#FF5C00", "#7C5CFF"];

/**
 * Sobre la noche, un mes cargado en tinta (o un distribuidor de color negro) se
 * confundiría con un hueco: conserva su color con un aro claro que lo recorta.
 */
function darkRing(fill: string): React.CSSProperties | undefined {
  return /^#[0-9a-f]{6}$/i.test(fill) && luminance(fill) < 0.05
    ? { boxShadow: "inset 0 0 0 1px rgba(255, 255, 255, 0.3)" }
    : undefined;
}

function quarterFill(month: number): string {
  return QUARTER_FILLS[Math.floor((month - 1) / 3) % QUARTER_FILLS.length];
}

/** Descripción para lectores de pantalla: la regleta es visual, el texto no. */
function buildLabel(covered: Set<number>, year: number, upToMonth: number): string {
  const done = MONTH_NAMES.filter((_, i) => covered.has(i + 1));
  const missing = MONTH_NAMES.filter((_, i) => !covered.has(i + 1) && i + 1 <= upToMonth);

  if (done.length === 0) return `${year}: sin ningún mes cargado`;
  if (missing.length === 0) return `${year}: todos los meses vencidos están cargados`;
  return `${year}: cargados ${done.join(", ")}. Faltan ${missing.join(", ")}`;
}
