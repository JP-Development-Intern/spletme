import { useCallback, useMemo, useState } from "react";
import ReactApexChart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { BarChart2, PieChart, BarChartHorizontal, TrendingUp, ChevronRight } from "lucide-react";
import { formatCurrency, formatStreams, formatCompactCurrency } from "@/utils/format.utils";
import { PLATFORM_BRAND as platformConfig, luminance } from "@/const/platformBrand";

interface ReproductionData {
  totalStreams: number;
  totalIncome: number;
  releasesCount: number;
  platform: string;
}

interface PlatformsProps {
  reproductions?: ReproductionData[];
  /** Variación del ingreso respecto al periodo anterior, si se conoce. */
  trend?: number;
  onViewBreakdown?: () => void;
}

interface PlatformDataItem {
  name: string;
  percentage: number;
  incomePercentage: number;
  color: string;
  letter: string;
  logo?: string;
  streams: number;
  income: number;
  releases: number;
}

type ChartView = "bar" | "donut" | "horizontal";
type Metric = "income" | "streams";


/** Sobre un chip claro (Yandex, Audiomack) el logo y la inicial van en tinta. */
const isLight = (hex: string): boolean => luminance(hex) > 0.6;

const chartButtons: { view: ChartView; icon: JSX.Element; label: string }[] = [
  { view: "donut", icon: <PieChart className="h-[14px] w-[14px]" />, label: "Dona" },
  { view: "bar", icon: <BarChart2 className="h-[14px] w-[14px]" />, label: "Barras" },
  {
    view: "horizontal",
    icon: <BarChartHorizontal className="h-[14px] w-[14px]" />,
    label: "Horizontal",
  },
];

const CHART_FONT = "Poppins, sans-serif";

const Platforms = ({ reproductions = [], trend, onViewBreakdown }: PlatformsProps) => {
  const [chartView, setChartView] = useState<ChartView>("donut");
  const [metric, setMetric] = useState<Metric>("income");
  const isIncome = metric === "income";

  const platformData = useMemo<PlatformDataItem[]>(() => {
    const totalStreams = reproductions.reduce((sum, item) => sum + (item.totalStreams || 0), 0);
    const totalIncome = reproductions.reduce((sum, item) => sum + (item.totalIncome || 0), 0);

    const mapped = reproductions
      .map((item) => {
        const name = item.platform || "Otros";
        const config = platformConfig[name] || platformConfig.Otros;
        return {
          name,
          percentage: totalStreams > 0 ? Math.round((item.totalStreams / totalStreams) * 100) : 0,
          incomePercentage:
            totalIncome > 0 ? Math.round((item.totalIncome / totalIncome) * 100) : 0,
          color: config.color,
          letter: config.letter,
          logo: config.logo,
          streams: item.totalStreams,
          income: item.totalIncome,
          releases: item.releasesCount,
        };
      })
      .sort((a, b) => b.streams - a.streams);

    const platformsWithData = mapped.filter((p) => p.percentage > 0);
    const platformsWithZero = mapped.filter((p) => p.percentage === 0);
    const groupedData: PlatformDataItem[] = [...platformsWithData];

    if (platformsWithZero.length > 0) {
      const othersConfig = platformConfig.Otros;
      const othersStreams = platformsWithZero.reduce((sum, p) => sum + p.streams, 0);
      const othersIncome = platformsWithZero.reduce((sum, p) => sum + p.income, 0);
      groupedData.push({
        name: "Otros",
        percentage: totalStreams > 0 ? Math.round((othersStreams / totalStreams) * 100) : 0,
        incomePercentage: totalIncome > 0 ? Math.round((othersIncome / totalIncome) * 100) : 0,
        color: othersConfig.color,
        letter: othersConfig.letter,
        logo: othersConfig.logo,
        streams: othersStreams,
        income: othersIncome,
        releases: platformsWithZero.reduce((sum, p) => sum + p.releases, 0),
      });
    }

    return groupedData;
  }, [reproductions]);

  /** Top 5 de la métrica activa. */
  const data = useMemo(
    () =>
      [...platformData]
        .sort((a, b) => (isIncome ? b.income - a.income : b.streams - a.streams))
        .slice(0, 5),
    [platformData, isIncome],
  );

  const totalIncome = platformData.reduce((sum, p) => sum + p.income, 0);
  const totalStreams = platformData.reduce((sum, p) => sum + p.streams, 0);
  const leader = data[0];
  const leaderPct = leader ? (isIncome ? leader.incomePercentage : leader.percentage) : 0;
  const colors = useMemo(() => data.map((platform) => platform.color), [data]);

  const values = data.map((p) => (isIncome ? p.income : p.streams));
  const formatValue = useCallback(
    (val: number) => (isIncome ? formatCurrency(val) : `${formatStreams(val)} streams`),
    [isIncome],
  );
  const formatAxis = useCallback(
    (val: number) => (isIncome ? formatCompactCurrency(val) : formatStreams(Math.round(val))),
    [isIncome],
  );

  const baseOptions: ApexOptions = useMemo(
    () => ({
      chart: { toolbar: { show: false }, background: "transparent", fontFamily: CHART_FONT },
      colors,
      dataLabels: { enabled: false },
      legend: { show: false },
      grid: { borderColor: "#E8E8EC", strokeDashArray: 4 },
      states: { active: { filter: { type: "none" } } },
      tooltip: {
        theme: "light",
        style: { fontSize: "11px", fontFamily: CHART_FONT },
        y: { formatter: (val: number) => formatValue(val) },
      },
    }),
    [colors, formatValue],
  );

  const donutOptions: ApexOptions = useMemo(
    () => ({
      ...baseOptions,
      labels: data.map((p) => p.name),
      // Apple Music y YouTube son casi el mismo rojo: sin una separación clara
      // sus porciones se leen como una sola.
      stroke: { width: 3, colors: ["#FFFFFF"] },
      plotOptions: { pie: { donut: { size: "72%", labels: { show: false } }, expandOnClick: false } },
    }),
    [baseOptions, data],
  );

  const barOptions: ApexOptions = useMemo(
    () => ({
      ...baseOptions,
      plotOptions: {
        bar: {
          borderRadius: 6,
          columnWidth: "52%",
          borderRadiusApplication: "end",
          distributed: true,
        },
      },
      xaxis: {
        categories: data.map((p) => p.name.split(" ")[0]),
        labels: { style: { fontSize: "10px", colors: "#A6AAB2", fontFamily: CHART_FONT } },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        labels: {
          style: { colors: "#A6AAB2", fontSize: "10px", fontFamily: CHART_FONT },
          formatter: formatAxis,
        },
      },
      grid: { ...baseOptions.grid, yaxis: { lines: { show: true } }, xaxis: { lines: { show: false } } },
    }),
    [baseOptions, data, formatAxis],
  );

  const horizontalOptions: ApexOptions = useMemo(
    () => ({
      ...baseOptions,
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: 5,
          barHeight: "52%",
          borderRadiusApplication: "end",
          distributed: true,
        },
      },
      xaxis: {
        labels: {
          style: { fontSize: "10px", colors: "#A6AAB2", fontFamily: CHART_FONT },
          formatter: (val: string) => formatAxis(Number(val)),
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: { labels: { style: { colors: "#71757E", fontSize: "10px", fontFamily: CHART_FONT } } },
      grid: { ...baseOptions.grid, xaxis: { lines: { show: true } }, yaxis: { lines: { show: false } } },
    }),
    [baseOptions, formatAxis],
  );

  const seriesName = isIncome ? "Ingresos" : "Streams";

  const trendChip = trend !== undefined && (
    <span
      className={`flex items-center gap-1.5 text-[11px] font-medium ${
        trend >= 0 ? "text-[#2FB37E]" : "text-[#E5484D]"
      }`}
    >
      <TrendingUp className={`h-[13px] w-[13px] ${trend < 0 ? "rotate-180" : ""}`} />
      {trend >= 0 ? "+" : "−"}
      {Math.abs(trend).toLocaleString("es-ES", { maximumFractionDigits: 1 })}% vs. mes anterior
    </span>
  );

  const metricLabel = isIncome ? "INGRESO NETO" : "STREAMS";
  const metricTotal = isIncome ? formatCurrency(totalIncome) : formatStreams(totalStreams);
  const metricSub = isIncome
    ? `${formatStreams(totalStreams)} streams en total`
    : `${formatCurrency(totalIncome)} de ingreso neto`;

  /** Junto a la dona el resumen cabe en columna; sobre las barras, en una lu00ednea. */
  const renderSummary = (layout: "column" | "inline") =>
    layout === "column" ? (
      <div className="flex min-w-0 flex-1 flex-col gap-2.5">
        <span className="text-[9.5px] font-semibold tracking-[0.9px] text-[#A6AAB2]">
          {metricLabel}
        </span>
        <span className="flex flex-col gap-[3px]">
          <span className="font-display text-2xl font-semibold text-[#1C1D22]">{metricTotal}</span>
          <span className="text-[11px] text-[#71757E]">{metricSub}</span>
        </span>
        {trendChip && (
          <>
            <span className="h-px w-full bg-[#E8E8EC]" />
            {trendChip}
          </>
        )}
      </div>
    ) : (
      <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        <span className="font-display text-2xl font-semibold text-[#1C1D22]">{metricTotal}</span>
        <span className="text-[11px] text-[#71757E]">{metricSub}</span>
        {trendChip}
      </div>
    );

  return (
    <section className="col-span-12 flex h-full min-w-0 flex-col gap-4 rounded-[26px] border border-[#E8E8EC] bg-white p-[26px] shadow-[0_10px_28px_-12px_rgba(255,92,0,0.15)] xl:col-span-4">
      <div className="flex flex-col gap-0.5">
        <h2 className="font-display text-lg font-semibold text-[#1C1D22]">De dónde vienen</h2>
        <p className="text-[12.5px] text-[#71757E]">
          {isIncome ? "Reparto del ingreso neto por plataforma" : "Reparto de los streams por plataforma"}
        </p>
      </div>

      {/* Controles: qué se mide y cómo se dibuja */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div
          role="tablist"
          aria-label="Métrica"
          className="flex items-center gap-0.5 rounded-[20px] bg-[#F4F5F7] p-[3px]"
        >
          {([
            ["income", "Ingresos"],
            ["streams", "Streams"],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              role="tab"
              aria-selected={metric === value}
              onClick={() => setMetric(value)}
              className={`rounded-[16px] px-[13px] py-1.5 font-mono text-[11px] font-semibold transition-colors ${
                metric === value
                  ? "bg-[#FF5C00] text-white"
                  : "text-[#71757E] hover:text-[#1C1D22]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div
          role="tablist"
          aria-label="Tipo de gráfico"
          className="flex items-center gap-0.5 rounded-[20px] bg-[#F4F5F7] p-[3px]"
        >
          {chartButtons.map(({ view, icon, label }) => (
            <button
              key={view}
              role="tab"
              title={label}
              aria-label={label}
              aria-selected={chartView === view}
              onClick={() => setChartView(view)}
              className={`flex h-[26px] w-8 items-center justify-center rounded-[14px] transition-colors ${
                chartView === view
                  ? "bg-white text-[#1C1D22] shadow-[0_1px_3px_rgba(28,29,34,0.08)]"
                  : "text-[#A6AAB2] hover:text-[#71757E]"
              }`}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      {data.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-1 py-10 text-center">
          <p className="text-[12.5px] font-medium text-[#1C1D22]">
            Todavía no hay datos por plataforma
          </p>
          <p className="text-[11px] text-[#A6AAB2]">
            Aparecerán en cuanto llegue el primer reporte del distribuidor.
          </p>
        </div>
      ) : (
        <>
          {chartView === "donut" ? (
            <div className="flex items-center gap-[18px]">
              <div className="relative h-[148px] w-[148px] flex-shrink-0">
                <ReactApexChart
                  options={donutOptions}
                  series={values}
                  type="donut"
                  height="100%"
                  width="100%"
                />
                {leader && (
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-display text-[22px] font-semibold leading-none text-[#1C1D22]">
                      {leaderPct}%
                    </span>
                    <span className="mt-1 max-w-[92px] truncate text-[10.5px] font-medium text-[#71757E]">
                      {leader.name}
                    </span>
                  </div>
                )}
              </div>
              {renderSummary("column")}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {renderSummary("inline")}
              <div className="h-[190px]">
                <ReactApexChart
                  options={chartView === "bar" ? barOptions : horizontalOptions}
                  series={
                    chartView === "bar"
                      ? [{ name: seriesName, data: values }]
                      : [
                          {
                            name: seriesName,
                            data: data.map((p) => ({ x: p.name.split(" ")[0], y: isIncome ? p.income : p.streams })),
                          },
                        ]
                  }
                  type="bar"
                  height="100%"
                  width="100%"
                />
              </div>
            </div>
          )}

          {/* La lista es la leyenda: el chip lleva el color de su porción */}
          <ul className="flex flex-col gap-2.5">
            {data.map((platform) => {
              const color = platform.color;
              const onLight = isLight(color);
              return (
                <li key={platform.name} className="flex items-center gap-2.5">
                  <span
                    className="flex h-7 w-7 flex-shrink-0 items-center justify-center overflow-hidden rounded-[9px]"
                    style={{ backgroundColor: color }}
                  >
                    {platform.logo ? (
                      <img
                        src={platform.logo}
                        alt=""
                        aria-hidden="true"
                        className="h-[17px] w-[17px] object-contain"
                        style={{
                          filter: onLight ? "brightness(0)" : "brightness(0) invert(1)",
                        }}
                      />
                    ) : (
                      <span
                        className={`font-mono text-[12px] font-semibold ${
                          onLight ? "text-[#1C1D22]" : "text-white"
                        }`}
                      >
                        {platform.letter}
                      </span>
                    )}
                  </span>

                  <span className="flex min-w-0 flex-1 flex-col gap-px">
                    <span className="truncate text-[12px] font-medium text-[#1C1D22]">
                      {platform.name}
                    </span>
                    <span className="text-[10px] text-[#A6AAB2]">
                      {isIncome
                        ? `${formatStreams(platform.streams)} streams`
                        : formatCurrency(platform.income)}
                    </span>
                  </span>

                  <span className="flex-shrink-0 font-mono text-[12px] font-semibold text-[#1C1D22]">
                    {isIncome ? formatCurrency(platform.income) : formatStreams(platform.streams)}
                  </span>

                  <span className="flex w-11 flex-shrink-0 justify-end">
                    <span className="rounded-[9px] bg-[#F4F5F7] px-[7px] py-[3px] font-mono text-[11px] font-semibold text-[#1C1D22]">
                      {isIncome ? platform.incomePercentage : platform.percentage}%
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>

          <div className="mt-auto flex flex-col gap-4">
            <div className="h-px bg-[#E8E8EC]" />
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11.5px] text-[#71757E]">
                {platformData.length === 1
                  ? "1 plataforma con datos"
                  : `${platformData.length} plataformas con datos`}
              </span>
              {onViewBreakdown && (
                <button
                  onClick={onViewBreakdown}
                  className="flex items-center gap-0.5 text-[11.5px] font-semibold text-[#FF5C00] transition-colors hover:text-[#EA580C]"
                >
                  Ver desglose
                  <ChevronRight className="h-[13px] w-[13px]" />
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
};

export default Platforms;
