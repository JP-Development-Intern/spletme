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

const INK = "#1C1D22";
const ORANGE = "#FF5C00";
const ORANGE_MID = "#FF9257";

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
    <section className="col-span-12 flex flex-col gap-[18px] rounded-[26px] border border-[#E8E8EC] bg-white p-[26px] shadow-[0_10px_28px_-12px_rgba(255,92,0,0.15)]">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-col gap-0.5">
          <h2 className="font-display text-lg font-semibold text-[#1C1D22]">Rendimiento</h2>
          <p className="text-[12.5px] text-[#71757E]">{subtitle ?? "Streams e ingresos mes a mes"}</p>
        </div>

        <div
          role="tablist"
          aria-label="Periodo"
          className="flex items-center gap-0.5 rounded-[20px] bg-[#F4F5F7] p-[3px]"
        >
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option.value}
              role="tab"
              aria-selected={range === option.value}
              onClick={() => setRange(option.value)}
              className={`rounded-[16px] px-[13px] py-1.5 font-mono text-[11px] font-semibold transition-colors ${
                range === option.value
                  ? "bg-[#FF5C00] text-white"
                  : "text-[#71757E] hover:text-[#1C1D22]"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {loading && count === 0 ? (
        <div className="flex h-[248px] items-center justify-center">
          <p className="text-[12.5px] text-[#A6AAB2]">Cargando el histórico…</p>
        </div>
      ) : count === 0 ? (
        <div className="flex h-[248px] flex-col items-center justify-center gap-1 text-center">
          <p className="text-[12.5px] font-medium text-[#1C1D22]">Todavía no hay meses cerrados</p>
          <p className="text-[11px] text-[#A6AAB2]">
            El histórico se dibuja en cuanto llegue el primer reporte del distribuidor.
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-[18px]">
            {hasStreams && (
              <LegendItem shape="line" color={INK} label="Streams" total={formatStreams(totals.streams)} />
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
                      className="absolute right-0 -translate-y-1/2 font-mono text-[9.5px] text-[#71757E]"
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
                    className="absolute left-0 right-0 h-px bg-[#F4F5F7]"
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
                            backgroundColor: isActive || isLast ? ORANGE : ORANGE_MID,
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
                        stroke={INK}
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
                          className="pointer-events-none absolute h-[9px] w-[9px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] border-white"
                          style={{
                            left: `${center(index)}%`,
                            top: `${streamY(entry)}%`,
                            backgroundColor: INK,
                          }}
                        />
                      ))}
                  </>
                )}

                {/* Detalle del mes señalado */}
                {active && (
                  <div
                    className="pointer-events-none absolute top-1 z-10 flex -translate-x-1/2 flex-col gap-1 rounded-[14px] bg-[#1C1D22] px-3 py-2 shadow-[0_8px_20px_-6px_rgba(16,17,20,0.4)]"
                    style={{ left: `${Math.min(85, Math.max(15, center(hovered!)))}%` }}
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-[0.6px] text-[#A6AAB2]">
                      {monthLabel(active.name)}
                    </span>
                    <span className="font-mono text-[12px] font-semibold text-white">
                      {formatCurrency(active.totalNetIncome ?? 0)}
                    </span>
                    {hasStreams && (
                      <span className="font-mono text-[11px] text-[#A6AAB2]">
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
                    className="absolute left-0 -translate-y-1/2 font-mono text-[9.5px] text-[#EA580C]"
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
                      hovered === index ? "text-[#1C1D22]" : "text-[#A6AAB2]"
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
      <span className="text-[11.5px] text-[#71757E]">{label}</span>
      <span className="font-mono text-[11.5px] font-semibold" style={{ color }}>
        {total}
      </span>
    </div>
  );
}

export default Performance;
