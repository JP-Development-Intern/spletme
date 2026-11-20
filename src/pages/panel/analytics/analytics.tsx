import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { LayoutDashboard, ListOrdered, Music } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAnalytics } from "@/hooks/useAnalytics";
import type { AnalyticsFilters } from "@/types/analytics.types";
import AnalyticsFiltersBar from "./components/AnalyticsFilters";
import AnalyticsKpisSection from "./components/AnalyticsKpis";
import RevenueByPlatformChart from "./components/RevenueByPlatformChart";
import StoreShare from "./components/StoreShare";
import CountryRanking from "./components/CountryRanking";
import TopChartsSection from "./components/TopChartsSection";
import PlatformCountrySummary from "./components/PlatformCountrySummary";
import TransactionsTable from "./components/TransactionsTable";
import SongsAnalyticsView from "./components/SongsAnalyticsView";
import { formatMonth } from "./analytics.utils";

type Tab = "overview" | "transactions" | "songs";

const TABS: { id: Tab; label: string; icon: typeof Music }[] = [
  { id: "overview", label: "Resumen", icon: LayoutDashboard },
  { id: "songs", label: "Canciones", icon: Music },
  { id: "transactions", label: "Transacciones", icon: ListOrdered },
];

/** Cada filtro y su nombre en la URL. */
const FILTER_PARAMS: Record<keyof AnalyticsFilters, string> = {
  platform: "platform",
  country: "country",
  artistName: "artist",
  labelId: "label",
  startDate: "from",
  endDate: "to",
};

/**
 * Analíticas: de dónde sale el dinero del catálogo.
 *
 * Los filtros mandan sobre toda la página, así que van arriba y a la vista; las
 * cifras de la consola y las tres pestañas los obedecen. Filtros y pestaña
 * viven en la URL, como en Música: recargar o compartir el enlace conserva lo
 * que se estaba mirando.
 *
 * Todo sale de los reportes de los distribuidores sobre las canciones propias
 * (`ownerId`), así que aquí el ingreso neto se puede enseñar sin chocar con la
 * regla de `utils/ownerVisibility.ts`.
 */
export default function Analytics() {
  const [params, setParams] = useSearchParams();

  const tab: Tab = (["transactions", "songs"] as const).find((t) => t === params.get("tab")) ?? "overview";

  const filters = useMemo<AnalyticsFilters>(() => {
    const out: AnalyticsFilters = {};
    (Object.keys(FILTER_PARAMS) as (keyof AnalyticsFilters)[]).forEach((key) => {
      const value = params.get(FILTER_PARAMS[key]);
      if (value) out[key] = value;
    });
    return out;
  }, [params]);

  const filtered = Object.keys(filters).length > 0;

  const patchParams = useCallback(
    (patch: Record<string, string | null | undefined>) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(patch)) {
            if (!value) next.delete(key);
            else next.set(key, value);
          }
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  const setFilters = useCallback(
    (next: AnalyticsFilters) => {
      const patch: Record<string, string | undefined> = {};
      (Object.keys(FILTER_PARAMS) as (keyof AnalyticsFilters)[]).forEach((key) => {
        patch[FILTER_PARAMS[key]] = next[key];
      });
      patchParams(patch);
    },
    [patchParams],
  );

  const clearFilters = useCallback(() => setFilters({}), [setFilters]);
  const setTab = (next: Tab) => patchParams({ tab: next === "overview" ? null : next });

  const { kpis, charts, tops, historical, catalog } = useAnalytics(filters);

  const firstYear = historical.data?.firstDate ? Number(historical.data.firstDate.slice(0, 4)) : null;
  const currentYear = new Date().getFullYear();
  const emptyState = { filtered, onClearFilters: clearFilters };

  return (
    <div className="flex flex-col gap-6 px-4 lg:pl-4 lg:pr-8">
      <PageHeader>
        <div className="flex flex-col gap-1">
          <h1 className="truncate font-display text-[32px] font-light leading-[38px] tracking-[-0.015em] text-white sm:text-[40px] sm:leading-[46px]">
            Analíticas
          </h1>
          <p className="flex flex-wrap items-center gap-x-2 text-sm text-white/65">
            {catalog.data && <span>{catalog.data.songCount.toLocaleString()} canciones en tu catálogo</span>}
            {catalog.data && historical.data?.firstDate && <span className="text-white/50">·</span>}
            {historical.data?.firstDate ? (
              <span>
                reportes de {formatMonth(historical.data.firstDate)} a {formatMonth(historical.data.lastDate)}
              </span>
            ) : (
              !historical.loading && <span>Según los reportes de tus distribuidores</span>
            )}
          </p>
        </div>
      </PageHeader>

      <AnalyticsFiltersBar
        filters={filters}
        onChange={setFilters}
        minYear={firstYear ?? currentYear - 5}
        maxYear={currentYear}
      />

      <AnalyticsKpisSection
        kpis={kpis.data}
        historical={historical.data}
        catalog={catalog.data}
        loading={kpis.loading}
        filtered={filtered}
      />

      <div
        role="tablist"
        aria-label="Vista de Analíticas"
        className="flex w-fit max-w-full items-center gap-0.5 overflow-x-auto rounded-full bg-black/[0.22] p-1"
      >
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              id={`analytics-tab-${id}`}
              role="tab"
              aria-selected={active}
              aria-controls="analytics-panel"
              onClick={() => setTab(id)}
              className={`flex min-h-[40px] flex-shrink-0 items-center gap-2 rounded-full px-4 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70 ${
                active ? "bg-[#F7EDE6]/[0.92] font-semibold text-[#1C1D22]" : "font-medium text-white/80 hover:text-white"
              }`}
            >
              <Icon className="h-[15px] w-[15px]" />
              {label}
            </button>
          );
        })}
      </div>

      <div id="analytics-panel" role="tabpanel" aria-labelledby={`analytics-tab-${tab}`}>
        {tab === "overview" && (
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
            <RevenueByPlatformChart
              data={charts.data.revenueByPlatform}
              loading={charts.loading}
              error={charts.error}
              onRetry={charts.retry}
              {...emptyState}
            />
            <StoreShare
              data={charts.data.stores}
              loading={charts.loading}
              error={charts.error}
              onRetry={charts.retry}
              {...emptyState}
            />
            <TopChartsSection
              topSongs={tops.data.songs}
              topArtists={tops.data.artists}
              topLabels={tops.data.labels}
              loading={tops.loading}
              error={tops.error}
              onRetry={tops.retry}
              {...emptyState}
            />
            <CountryRanking
              data={charts.data.countries}
              loading={charts.loading}
              error={charts.error}
              onRetry={charts.retry}
              {...emptyState}
            />
            <div className="xl:col-span-2">
              <PlatformCountrySummary
                data={charts.data.platformCountry}
                loading={charts.loading}
                error={charts.error}
                onRetry={charts.retry}
                {...emptyState}
              />
            </div>
          </div>
        )}

        {tab === "songs" && <SongsAnalyticsView filters={filters} {...emptyState} />}
        {tab === "transactions" && <TransactionsTable filters={filters} {...emptyState} />}
      </div>
    </div>
  );
}
