import { useMemo, useState } from "react";
import ReactApexChart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { formatCurrency } from "@/utils/format.utils";
import type { RevenueByPlatformData } from "@/types/analytics.types";
import { AnalyticsPanel, PanelState, Segmented } from "./AnalyticsPanel";
import { formatMonth, platformColor } from "../analytics.utils";

type Granularity = "month" | "year";

interface Props {
  data: RevenueByPlatformData | null;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  filtered: boolean;
  onClearFilters: () => void;
}

/** Plataformas con serie propia; el resto se apila en «Otras». */
const MAX_SERIES = 6;
const AXIS_LABEL = { colors: "rgba(255,255,255,0.5)", fontSize: "11px" };

const GRANULARITY: { value: Granularity; label: string }[] = [
  { value: "month", label: "Por mes" },
  { value: "year", label: "Por año" },
];

/**
 * Ingresos de cada mes (o año) apilados por plataforma.
 *
 * La granularidad es local a este gráfico porque es lo único que cambia: antes
 * vivía entre los filtros globales y se mandaba al backend, que la ignoraba. Los
 * años se suman aquí a partir de los meses.
 *
 * Con más de seis plataformas las barras se volvían un arcoíris ilegible: se
 * quedan las seis que más ingresan en el rango y el resto se suma en «Otras».
 */
export default function RevenueByPlatformChart({ data, loading, error, onRetry, filtered, onClearFilters }: Props) {
  const [granularity, setGranularity] = useState<Granularity>("month");

  const { categories, series } = useMemo(() => {
    if (!data || data.series.length === 0) return { categories: [] as string[], series: [] };

    // Meses o años, y a qué índice del eje va cada mes.
    const buckets = granularity === "year" ? [...new Set(data.months.map((m) => m.slice(0, 4)))] : data.months;
    const bucketOf = (month: string) => buckets.indexOf(granularity === "year" ? month.slice(0, 4) : month);
    const regroup = (values: number[]) => {
      const out = new Array(buckets.length).fill(0);
      values.forEach((value, i) => {
        out[bucketOf(data.months[i])] += value;
      });
      return out.map((v) => Math.round(v * 100) / 100);
    };

    const ranked = [...data.series]
      .map((s) => ({ ...s, total: s.data.reduce((a, b) => a + b, 0) }))
      .sort((a, b) => b.total - a.total);
    const head = ranked.slice(0, MAX_SERIES);
    const tail = ranked.slice(MAX_SERIES);

    const out = head.map((s, i) => ({ name: s.name, data: regroup(s.data), color: platformColor(s.name, i) }));
    if (tail.length > 0) {
      const summed = data.months.map((_, i) => tail.reduce((acc, s) => acc + (s.data[i] ?? 0), 0));
      out.push({ name: `Otras (${tail.length})`, data: regroup(summed), color: "rgba(255,255,255,0.28)" });
    }

    const labels = granularity === "year" ? buckets : buckets.map((m) => formatMonth(m));
    return { categories: labels, series: out };
  }, [data, granularity]);

  const options: ApexOptions = useMemo(
    () => ({
      chart: {
        type: "bar",
        stacked: true,
        toolbar: { show: false },
        zoom: { enabled: false },
        background: "transparent",
        fontFamily: '"Bricolage Grotesque", Poppins, sans-serif',
        animations: { enabled: true, speed: 450, animateGradually: { enabled: false } },
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: categories.length > 18 ? "78%" : "56%",
          borderRadius: 4,
          borderRadiusApplication: "end",
          borderRadiusWhenStacked: "last",
        },
      },
      colors: series.map((s) => s.color),
      dataLabels: { enabled: false },
      stroke: { show: true, width: 1, colors: ["rgba(20,12,8,0.55)"] },
      xaxis: {
        categories,
        labels: { style: AXIS_LABEL, rotate: -45, hideOverlappingLabels: true },
        axisBorder: { show: false },
        axisTicks: { show: false },
        tooltip: { enabled: false },
      },
      yaxis: {
        min: 0,
        tickAmount: 4,
        labels: {
          style: AXIS_LABEL,
          formatter: (v: number) => (v >= 1000 ? `$${(v / 1000).toFixed(v >= 10_000 ? 0 : 1)}K` : `$${Math.round(v)}`),
        },
      },
      grid: {
        borderColor: "rgba(255,255,255,0.09)",
        xaxis: { lines: { show: false } },
        yaxis: { lines: { show: true } },
        padding: { left: 4, right: 8 },
      },
      legend: { show: false },
      states: { hover: { filter: { type: "lighten", value: 0.08 } } as never },
      tooltip: {
        shared: true,
        intersect: false,
        custom: ({ dataPointIndex }: { dataPointIndex: number }) => {
          const rows = series
            .map((s) => ({ name: s.name, color: s.color, value: s.data[dataPointIndex] ?? 0 }))
            .filter((r) => r.value > 0)
            .sort((a, b) => b.value - a.value);
          const total = rows.reduce((acc, r) => acc + r.value, 0);
          return `<div class="glass-menu min-w-[200px] rounded-xl px-3 pb-2.5 pt-2">
            <div class="flex items-baseline justify-between gap-4">
              <span class="text-[11px] text-white/65">${categories[dataPointIndex] ?? ""}</span>
              <span class="font-mono text-[14px] font-medium text-white">${formatCurrency(total)}</span>
            </div>
            <div class="mt-1.5 flex flex-col gap-1 border-t border-white/10 pt-1.5">
              ${rows
                .map(
                  (r) => `<div class="flex items-center gap-2 text-[11.5px]">
                    <span class="h-2 w-2 flex-shrink-0 rounded-full" style="background:${r.color}"></span>
                    <span class="flex-1 truncate text-white/70">${r.name}</span>
                    <span class="font-mono text-white">${formatCurrency(r.value)}</span>
                  </div>`,
                )
                .join("")}
            </div>
          </div>`;
        },
      },
    }),
    [categories, series],
  );

  return (
    <AnalyticsPanel
      title="Ingresos por plataforma"
      subtitle={granularity === "year" ? "Cada año, apilado por plataforma" : "Cada mes de reporte, apilado por plataforma"}
      actions={<Segmented label="Agrupar por" options={GRANULARITY} value={granularity} onChange={setGranularity} />}
    >
      <PanelState
        loading={loading}
        error={error}
        empty={series.length === 0}
        onRetry={onRetry}
        filtered={filtered}
        onClearFilters={onClearFilters}
        height="h-[300px]"
        skeleton="chart"
      >
        <div className="chart-glass h-[300px]">
          <ReactApexChart options={options} series={series} type="bar" height="100%" width="100%" />
        </div>
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5" aria-label="Plataformas del gráfico">
          {series.map((s) => (
            <li key={s.name} className="flex items-center gap-1.5 text-[12px] text-white/70">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
              {s.name}
            </li>
          ))}
        </ul>
      </PanelState>
    </AnalyticsPanel>
  );
}
