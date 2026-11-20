import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import ReactApexChart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import es from "apexcharts/dist/locales/es.json";
import { formatStreams, formatCurrency } from "@/utils/format.utils";
import type { DataPoint } from "@/hooks/useHomeDashboard";
import { EASE_OUT, remainingDelay, useDashboardIntro, useReveal } from "./dashboardIntro";

type Metric = "income" | "streams";

interface PerformanceChartProps {
  points: DataPoint[];
  /** Periodo elegido en la página: 7d y 30d llegan por día, el resto por mes. */
  timeframe: string;
  /** La serie del periodo todavía no ha llegado. */
  loading?: boolean;
  /** Segundos desde el montaje en los que entra el panel. */
  at?: number;
}

const METRICS: { value: Metric; label: string }[] = [
  { value: "income", label: "Ingresos" },
  { value: "streams", label: "Streams" },
];

const AXIS_LABEL = { colors: "rgba(255,255,255,0.5)", fontSize: "11px" };

/**
 * Evolución de los ingresos o de los streams en el periodo. Una serie a la vez:
 * con las dos juntas había dos ejes con escalas distintas y la lectura dependía
 * de adivinar cuál era cuál.
 */
export function PerformanceChart({ points, timeframe, loading = false, at = 0 }: PerformanceChartProps) {
  const [metric, setMetric] = useState<Metric>("income");
  const reveal = useReveal(at);
  const intro = useDashboardIntro();
  const isIncome = metric === "income";
  const daily = timeframe === "7d" || timeframe === "30d";

  const series = useMemo(
    () => [
      {
        name: isIncome ? "Ingresos" : "Streams",
        data: points.map((p) => (isIncome ? Number(p.income.toFixed(2)) : p.streams)),
      },
    ],
    [points, isIncome],
  );

  const options: ApexOptions = useMemo(() => {
    const formatValue = (val: number) => (isIncome ? formatCurrency(val) : `${formatStreams(val)} streams`);
    const formatDate = (iso: string) =>
      new Date(iso).toLocaleDateString("es", {
        timeZone: "UTC",
        ...(daily ? { day: "numeric", month: "short" } : { month: "short", year: "numeric" }),
      });

    return {
      chart: {
        type: "area",
        toolbar: { show: false },
        zoom: { enabled: false },
        background: "transparent",
        fontFamily: '"Bricolage Grotesque", Poppins, sans-serif',
        locales: [es],
        defaultLocale: "es",
        // En la entrada, la subida del área de ApexCharts acompaña al barrido de
        // abajo. Después, sus transiciones son las que cuentan qué cambió al
        // pasar a otro periodo o a otra serie.
        animations: {
          enabled: !intro.reduced,
          easing: "easeout",
          speed: 700,
          animateGradually: { enabled: false },
          dynamicAnimation: { enabled: true, speed: 450 },
        },
      },
      colors: [isIncome ? "#FF5C00" : "#F7EDE6"],
      stroke: { width: 2.5, curve: "smooth" },
      fill: {
        type: "gradient",
        gradient: { shadeIntensity: 0, opacityFrom: 0.42, opacityTo: 0, stops: [0, 100] },
      },
      markers: { size: 0, strokeColors: "#FFFFFF", strokeWidth: 2.5, hover: { size: 6 } },
      dataLabels: { enabled: false },
      grid: {
        borderColor: "rgba(255,255,255,0.09)",
        strokeDashArray: 0,
        xaxis: { lines: { show: false } },
        yaxis: { lines: { show: true } },
        padding: { left: 4, right: 8 },
      },
      xaxis: {
        type: "datetime",
        categories: points.map((p) => p.date),
        labels: {
          style: AXIS_LABEL,
          datetimeUTC: true,
          format: daily ? "d MMM" : "MMM yyyy",
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
        crosshairs: { show: true, stroke: { color: "rgba(255,255,255,0.5)", width: 1, dashArray: 0 } },
        tooltip: { enabled: false },
      },
      yaxis: {
        min: 0,
        tickAmount: 3,
        labels: {
          style: AXIS_LABEL,
          formatter: (val: number) => (isIncome ? `$${Math.round(val)}` : formatStreams(val)),
        },
      },
      tooltip: {
        custom: ({ dataPointIndex }: { dataPointIndex: number }) => {
          const point = points[dataPointIndex];
          if (!point) return "";
          const value = isIncome ? point.income : point.streams;
          return `<div class="glass-menu rounded-xl px-3 pb-2 pt-1.5">
            <div class="text-[11px] text-white/65">${formatDate(point.date)}</div>
            <div class="font-mono text-[15px] font-medium text-white">${formatValue(value)}</div>
          </div>`;
        },
      },
      legend: { show: false },
    };
  }, [points, isIncome, daily, intro.reduced]);

  /**
   * El área se descubre de izquierda a derecha, en el sentido del tiempo: se lee
   * como la serie dibujándose. Al terminar se quita el recorte, que si no
   * cortaría el tooltip en los bordes.
   */
  const sweep =
    intro.reduced
      ? {}
      : {
          initial: { clipPath: "inset(0 100% 0 0)" },
          animate: { clipPath: "inset(0 0% 0 0)", transitionEnd: { clipPath: "none" } },
          transition: {
            duration: intro.full ? 1.1 : 0.5,
            delay: intro.full ? remainingDelay(intro.startedAt, at + 0.2) : 0,
            ease: EASE_OUT,
          },
        };

  return (
    <motion.section
      {...reveal}
      className="glass flex min-w-0 flex-1 flex-col gap-[18px] rounded-[32px] px-7 py-6"
      data-tour="analytics-chart"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="font-display text-[19px] font-medium tracking-[-0.005em] text-white">Rendimiento</h2>
          <p className="text-[12.5px] text-white/65">
            {isIncome ? "Ingresos" : "Streams"} por {daily ? "día" : "mes"}
          </p>
        </div>
        <div className="flex items-center gap-0.5 rounded-full bg-black/[0.22] p-1">
          {METRICS.map((option) => (
            <button
              key={option.value}
              aria-pressed={metric === option.value}
              onClick={() => setMetric(option.value)}
              className={`rounded-full px-4 py-[7px] text-[12.5px] transition-colors ${
                metric === option.value
                  ? "bg-[#F7EDE6]/[0.92] font-semibold text-[#1C1D22]"
                  : "font-medium text-white/80 hover:text-white"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="chart-glass h-[240px]">
        {points.length === 0 && loading ? (
          <ChartSkeleton />
        ) : points.length === 0 ? (
          <div className="flex h-full items-center justify-center text-[13px] text-white/50">
            Sin datos en este periodo
          </div>
        ) : (
          <motion.div {...sweep} className="h-full">
            <ReactApexChart options={options} series={series} type="area" height="100%" width="100%" />
          </motion.div>
        )}
      </div>
    </motion.section>
  );
}

/** Las líneas guía del gráfico, latiendo, mientras llega la serie. */
function ChartSkeleton() {
  return (
    <div className="flex h-full flex-col justify-between py-2" aria-busy="true" aria-label="Cargando el rendimiento">
      {[0, 1, 2, 3].map((i) => (
        <span key={i} className="h-px w-full animate-pulse bg-white/[0.12]" />
      ))}
    </div>
  );
}
