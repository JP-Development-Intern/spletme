import { useCallback, useEffect, useRef, useState } from "react";
import { analyticsService } from "@/services/analyticsService";
import type {
  AnalyticsFilters,
  AnalyticsKpis,
  HistoricalTotal,
  PaginatedResult,
  PieChartEntry,
  PlatformCountryRow,
  RevenueByPlatformData,
  SplitOwnerInfo,
  TopArtist,
  TopLabel,
  TopSong,
} from "@/types/analytics.types";

/** Un bloque de datos de la página: lo que llegó, si está en camino y si falló. */
export interface AsyncBlock<T> {
  data: T;
  loading: boolean;
  error: boolean;
  retry: () => void;
}

/**
 * Pide un bloque cada vez que cambian los filtros. Si el usuario cambia otra vez
 * antes de que responda, la respuesta vieja se descarta: sin esto, una consulta
 * lenta podía llegar la última y pintar cifras de un filtro que ya no está.
 */
function useBlock<T>(fetcher: () => Promise<T>, initial: T, deps: unknown[]): AsyncBlock<T> {
  const [data, setData] = useState<T>(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const latest = useRef(0);

  useEffect(() => {
    const request = ++latest.current;
    setLoading(true);
    setError(false);
    fetcher()
      .then((result) => {
        if (request === latest.current) setData(result);
      })
      .catch(() => {
        if (request === latest.current) setError(true);
      })
      .finally(() => {
        if (request === latest.current) setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { data, loading, error, retry };
}

interface ChartsData {
  revenueByPlatform: RevenueByPlatformData | null;
  stores: PieChartEntry[];
  countries: PieChartEntry[];
  platformCountry: PlatformCountryRow[];
}

export interface AnalyticsOverview {
  kpis: AsyncBlock<AnalyticsKpis | null>;
  charts: AsyncBlock<ChartsData>;
  tops: AsyncBlock<{ songs: TopSong[]; artists: TopArtist[]; labels: TopLabel[] }>;
  /** Totales de todo el catálogo: no dependen de los filtros, se piden una vez. */
  historical: AsyncBlock<HistoricalTotal | null>;
  catalog: AsyncBlock<SplitOwnerInfo | null>;
}

/** Todo lo que la página de Analíticas lee, agrupado por lo que se pinta junto. */
export function useAnalytics(filters: AnalyticsFilters): AnalyticsOverview {
  const key = JSON.stringify(filters);

  const kpis = useBlock<AnalyticsKpis | null>(() => analyticsService.getKpis(filters), null, [key]);

  const charts = useBlock<ChartsData>(
    async () => {
      const [revenueByPlatform, stores, countries, platformCountry] = await Promise.all([
        analyticsService.getRevenueByPlatform(filters),
        analyticsService.getRevenueByStore(filters),
        analyticsService.getRevenueByCountry(filters),
        analyticsService.getPlatformCountrySummary(filters),
      ]);
      return { revenueByPlatform, stores, countries, platformCountry };
    },
    { revenueByPlatform: null, stores: [], countries: [], platformCountry: [] },
    [key],
  );

  const tops = useBlock(
    async () => {
      const [songs, artists, labels] = await Promise.all([
        analyticsService.getTopSongs(filters),
        analyticsService.getTopArtists(filters),
        analyticsService.getTopLabels(filters),
      ]);
      return { songs, artists, labels };
    },
    { songs: [], artists: [], labels: [] },
    [key],
  );

  const historical = useBlock<HistoricalTotal | null>(() => analyticsService.getHistoricalTotal(), null, []);
  const catalog = useBlock<SplitOwnerInfo | null>(() => analyticsService.getSplitOwnerInfo(), null, []);

  return { kpis, charts, tops, historical, catalog };
}

/**
 * Listado paginado de una pestaña. Al cambiar los filtros vuelve a la primera
 * página: la página 7 de otro filtro no significa nada en este.
 */
export function useAnalyticsPage<T>(
  fetcher: (filters: AnalyticsFilters, page: number, limit: number) => Promise<PaginatedResult<T>>,
  filters: AnalyticsFilters,
  initialLimit: number,
) {
  const key = JSON.stringify(filters);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(initialLimit);

  useEffect(() => {
    setPage(1);
  }, [key]);

  const block = useBlock<PaginatedResult<T> | null>(() => fetcher(filters, page, limit), null, [key, page, limit]);

  const changeLimit = useCallback((next: number) => {
    setLimit(next);
    setPage(1);
  }, []);

  return { ...block, page, setPage, limit, setLimit: changeLimit };
}
