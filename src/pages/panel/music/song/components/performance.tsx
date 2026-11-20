import { useMemo, useState } from "react";
import useMetricPayments from "@/hooks/useMetricPayments";
import { formatCurrency, formatStreams, formatCompactCurrency } from "@/utils/format.utils";

/** Un mes de la serie: el nombre puede ser "enero" o "2025-01". */
export interface PerformanceEntry {
  name: string;
  totalNetIncome: number;
  totalStreams?: number;
}

interface PerformanceProps {
  songId?: string;
  /** Serie ya cargada (p. ej. un álbum). Sin ella se pide la de la canción. */
  data?: PerformanceEntry[];
  subtitle?: string;
}

type Range = "6m" | "12m" | "all";

const RANGE_OPTIONS: { value: Range; label: string; months: number }[] = [
  { value: "6m", label: "6M", months: 6 },
  { value: "12m", label: "12M", months: 12 },
  { value: "all", label: "Todo", months: 0 },
];

/** Los streams van en crema, como en el gráfico del inicio; el dinero en brasa. */
const CREAM = "#F7EDE6";
const ORANGE = "#FF5C00";
/** Sobre la noche un naranja más claro destacaría más que el sólido: se apaga en opacidad. */
const ORANGE_DIM = "rgba(255, 92, 0, 0.45)";

/** Redondea hacia arriba a 1, 1.5, 2, 3, 5, 7.5 o 10 por su magnitud. */
const niceCeil = (value: number): number => {
  if (value <= 0) return 1;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const normalized = value / magnitude;
  const step = [1, 1.5, 2, 3, 5, 7.5, 10].find((candidate) => normalized <= candidate) ?? 10;
  return step * magnitude;
};

/**
 * Techo del eje construido desde el paso, no desde el máximo: así las cuatro
 * divisiones caen en cifras redondas ($150, $300…) en vez de $188 o $563.
 */
const axisMax = (peak: number): number => niceCeil(peak / 4) * 4;

/** El backend devuelve el mes en palabra ("enero"); el eje solo tiene sitio para tres letras. */
const monthLabel = (name: string): string => {
  const raw = /^\d{4}-\d{2}/.test(name)
    ? new Date(Number(name.slice(0, 4)), Number(name.slice(5, 7)) - 1)
        .toLocaleString("es-ES", { month: "short" })
        .replace(".", "")
    : name.slice(0, 3);
  return raw.charAt(0).toUpperCase() + raw.slice(1);
};

/**
 * Streams e ingresos de la canción, mes a mes.
 *
 * Las dos series comparten el tiempo pero no la magnitud, así que cada una
 * lleva su propio eje —streams a la izquierda, dinero a la derecha, igual que
 * en el panel de inicio— y su propia forma: el ingreso son las columnas, los
 * streams la línea que las cruza. Al posarse sobre un mes se lee la cifra
 * exacta de ambas, que es lo que casi siempre se viene a mirar.
 */
const Performance = ({ songId, data: external, subtitle }: PerformanceProps) => {
  const { metricsData: fetched, loading } = useMetricPayments(
    external ? undefined : songId,
    "month",
  );
  const metricsData = external ?? fetched;
  const [range, setRange] = useState<Range>("12m");
  const [hovered, setHovered] = useState<number | null>(null);

  const data = useMemo(() => {
    const months = RANGE_OPTIONS.find((option) => option.value === range)?.months ?? 0;
    return months > 0 ? metricsData.slice(-months) : metricsData;
  }, [metricsData, range]);

  const totals = useMemo(
    () =>
      data.reduce(
        (acc, entry) => ({
          income: acc.income + (entry.totalNetIncome ?? 0),
          streams: acc.streams + (entry.totalStreams ?? 0),
        }),
        { income: 0, streams: 0 },
      ),
    [data],
  );

  const incomeMax = axisMax(Math.max(...data.map((entry) => entry.totalNetIncome ?? 0), 0));
  const streamsMax = axisMax(Math.max(...data.map((entry) => entry.totalStreams ?? 0), 0));
  const hasStreams = totals.streams > 0;
  const fractions = [1, 0.75, 0.5, 0.25, 0];

  const count = data.length;
  /** Centro de la columna i, en porcentaje del área: los slots no llevan gap. */
  const center = (index: number) => ((index + 0.5) / count) * 100;
  const streamY = (entry: { totalStreams?: number }) =>
    100 - ((entry.totalStreams ?? 0) / streamsMax) * 100;
  /** Con muchos meses las etiquetas se pisan: se rotula uno de cada n. */
  const labelEvery = count > 18 ? 3 : count > 12 ? 2 : 1;

  const active = hovered !== null ? data[hovered] : null;

  return (
    <section className="glass col-span-12 flex flex-col gap-[18px] rounded-[32px] px-7 py-6">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-col gap-0.5">
          <h2 className="font-display text-[19px] font-medium tracking-[-0.005em] text-white">Rendimiento</h2>
          <p className="text-[12.5px] text-white/65">{subtitle ?? "Streams e ingresos mes a mes"}</p>
        </div>

        <div
          role="tablist"
          aria-label="Periodo"
          className="flex items-center gap-0.5 rounded-full bg-black/[0.22] p-1"
        >
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option.value}
              role="tab"
              aria-selected={range === option.value}
              onClick={() => setRange(option.value)}
              className={`rounded-full px-[13px] py-1.5 font-mono text-[11.5px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70 ${
                range === option.value
                  ? "bg-[#F7EDE6]/[0.92] font-semibold text-[#1C1D22]"
                  : "font-medium text-white/80 hover:text-white"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {loading && count === 0 ? (
        <div className="flex h-[248px] items-center justify-center">
          <p className="text-[12.5px] text-white/50">Cargando el histórico…</p>
        </div>
      ) : count === 0 ? (
        <div className="flex h-[248px] flex-col items-center justify-center gap-1 text-center">
          <p className="text-[12.5px] font-medium text-white">Todavía no hay meses cerrados</p>
          <p className="text-[11px] text-white/50">
            El histórico se dibuja en cuanto llegue el primer reporte del distribuidor.
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-[18px]">
            {hasStreams && (
              <LegendItem shape="line" color={CREAM} label="Streams" total={formatStreams(totals.streams)} />
            )}
            <LegendItem shape="bar" color={ORANGE} label="Ingresos" total={formatCurrency(totals.income)} />
          </div>

          <div className="flex flex-col gap-2.5">
            <div className="flex gap-3">
              {/* Eje de streams */}
              {hasStreams && (
                <div className="relative h-[200px] w-10 flex-shrink-0">
                  {fractions.map((fraction, index) => (
                    <span
                      key={fraction}
                      className="absolute right-0 -translate-y-1/2 font-mono text-[9.5px] text-white/50"
                      style={{ top: `${index * 25}%` }}
                    >
                      {fraction === 0 ? "0" : formatStreams(streamsMax * fraction)}
                    </span>
                  ))}
                </div>
              )}

              <div
                className="relative h-[200px] flex-1"
                onMouseLeave={() => setHovered(null)}
              >
                {fractions.map((_, index) => (
                  <span
                    key={index}
                    aria-hidden="true"
                    className="absolute left-0 right-0 h-px bg-white/[0.07]"
                    style={{ top: `${index * 25}%` }}
                  />
                ))}

                {/* Columnas: ingreso del mes */}
                <div className="absolute inset-0 flex items-end">
                  {data.map((entry, index) => {
                    const income = entry.totalNetIncome ?? 0;
                    const isLast = index === count - 1;
                    const isActive = hovered === index;
                    return (
                      <span
                        key={`${entry.name}-${index}`}
                        onMouseEnter={() => setHovered(index)}
                        onTouchStart={() => setHovered(index)}
                        className="flex h-full flex-1 items-end justify-center px-[3px]"
                      >
                        <span
                          className="w-full max-w-[36px] rounded-t-lg transition-colors"
                          style={{
                            height: Math.max(income > 0 ? 3 : 0, (income / incomeMax) * 200),
                            backgroundColor: isActive || isLast ? ORANGE : ORANGE_DIM,
                          }}
                        />
                      </span>
                    );
                  })}
                </div>

                {/* Línea: streams del mes */}
                {hasStreams && (
                  <>
                    <svg
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
                      viewBox="0 0 100 100"
                      preserveAspectRatio="none"
                    >
                      <polyline
                        points={data.map((entry, index) => `${center(index)},${streamY(entry)}`).join(" ")}
                        fill="none"
                        stroke={CREAM}
                        strokeWidth={1.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        vectorEffect="non-scaling-stroke"
                      />
                    </svg>
                    {count <= 18 &&
                      data.map((entry, index) => (
                        <span
                          key={`dot-${index}`}
                          aria-hidden="true"
                          className="pointer-events-none absolute h-[9px] w-[9px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] border-[#2B1E17]"
                          style={{
                            left: `${center(index)}%`,
                            top: `${streamY(entry)}%`,
                            backgroundColor: CREAM,
                          }}
                        />
                      ))}
                  </>
                )}

                {/* Detalle del mes señalado */}
                {active && (
                  <div
                    className="glass-menu pointer-events-none absolute top-1 z-10 flex -translate-x-1/2 flex-col gap-1 rounded-xl px-3 py-2"
                    style={{ left: `${Math.min(85, Math.max(15, center(hovered!)))}%` }}
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-[0.6px] text-white/65">
                      {monthLabel(active.name)}
                    </span>
                    <span className="font-mono text-[13px] font-medium text-white">
                      {formatCurrency(active.totalNetIncome ?? 0)}
                    </span>
                    {hasStreams && (
                      <span className="font-mono text-[11px] text-white/65">
                        {formatStreams(active.totalStreams ?? 0)} streams
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Eje de ingresos */}
              <div className="relative h-[200px] w-10 flex-shrink-0">
                {fractions.map((fraction, index) => (
                  <span
                    key={fraction}
                    className="absolute left-0 -translate-y-1/2 font-mono text-[9.5px] text-[#FF8A3D]"
                    style={{ top: `${index * 25}%` }}
                  >
                    {fraction === 0 ? "0" : formatCompactCurrency(incomeMax * fraction)}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              {hasStreams && <span className="w-10 flex-shrink-0" aria-hidden="true" />}
              <div className="flex flex-1">
                {data.map((entry, index) => (
                  <span
                    key={`${entry.name}-label-${index}`}
                    className={`flex-1 text-center font-mono text-[10px] transition-colors ${
                      hovered === index ? "text-white" : "text-white/50"
                    }`}
                  >
                    {(count - 1 - index) % labelEvery === 0 ? monthLabel(entry.name) : ""}
                  </span>
                ))}
              </div>
              <span className="w-10 flex-shrink-0" aria-hidden="true" />
            </div>
          </div>
        </>
      )}
    </section>
  );
};

/** Serie del gráfico: la forma de la muestra dice si es la línea o las columnas. */
function LegendItem({
  shape,
  color,
  label,
  total,
}: {
  shape: "line" | "bar";
  color: string;
  label: string;
  total: string;
}) {
  return (
    <div className="flex items-center gap-[7px]">
      <span
        className={shape === "line" ? "h-[3px] w-[14px] rounded-full" : "h-[9px] w-[9px] rounded-[3px]"}
        style={{ backgroundColor: color }}
      />
      <span className="text-[11.5px] text-white/65">{label}</span>
      <span className="font-mono text-[11.5px] font-semibold" style={{ color }}>
        {total}
      </span>
    </div>
  );
}

export default Performance;
