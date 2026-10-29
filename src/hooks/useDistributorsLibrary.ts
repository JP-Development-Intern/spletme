import { useCallback, useEffect, useMemo, useState } from "react";
import { distributorsService } from "@/services/distributorsService";
import type {
  Distributor,
  DistributorKpi,
  DistributorUpload,
} from "@/types/distributor.types";
import {
  availableYears,
  countMissingMonths,
  coveredMonths,
  distributorColor,
  findCoverageGaps,
  lastRelevantMonth,
} from "@/utils/coverage.utils";
import type { DistributorListItem } from "@/components/distributors/types";
import type {
  CoverageFilter,
  CurrencyFilter,
} from "@/components/distributors/DistributorsFilterBar";
import type { DistributorSortBy } from "@/components/distributors/distributorsColumns";

/**
 * Estado de la lista de distribuidores: datos, filtros y la cobertura de meses,
 * que se deriva en el cliente a partir de las cargas de cada distribuidor.
 *
 * Las cargas se piden por distribuidor porque el endpoint de KPIs no devuelve el
 * rango de meses de cada una. A cambio quedan cacheadas aquí, así que el modal
 * de subida abre sin pedirlas otra vez —antes hacía esa llamada al pulsar el
 * botón—. Si el catálogo crece, lo que toca es que `/distributors/kpis`
 * devuelva los meses cubiertos y esta parte desaparezca.
 */
export function useDistributorsLibrary() {
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [kpis, setKpis] = useState<DistributorKpi[]>([]);
  const [uploadsById, setUploadsById] = useState<Record<string, DistributorUpload[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [year, setYear] = useState(() => new Date().getFullYear());
  const [search, setSearch] = useState("");
  const [currencyFilter, setCurrencyFilter] = useState<CurrencyFilter>("all");
  const [providerFilter, setProviderFilter] = useState("all");
  const [coverageFilter, setCoverageFilter] = useState<CoverageFilter>("all");
  const [sortBy, setSortBy] = useState<DistributorSortBy>("income_desc");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, kpiList] = await Promise.all([
        distributorsService.getAll(),
        distributorsService.getKpis(),
      ]);
      setDistributors(list);
      setKpis(kpiList);

      const uploadLists = await Promise.all(
        list.map((d) =>
          distributorsService.getUploads(d._id).catch(() => [] as DistributorUpload[]),
        ),
      );
      setUploadsById(
        Object.fromEntries(list.map((d, index) => [d._id, uploadLists[index] ?? []])),
      );
    } catch {
      setDistributors([]);
      setKpis([]);
      setUploadsById({});
      setError("No se pudieron cargar los distribuidores. Vuelve a intentarlo.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const upToMonth = useMemo(() => lastRelevantMonth(year), [year]);

  const years = useMemo(
    () => availableYears(Object.values(uploadsById).flat()),
    [uploadsById],
  );

  /** Todos los distribuidores con sus KPIs y su cobertura, sin filtrar. */
  const allItems = useMemo<DistributorListItem[]>(() => {
    const incomes = distributors.map(
      (d) => kpis.find((k) => k.distributorId === d._id)?.totalNetIncome ?? 0,
    );
    const totalIncome = incomes.reduce((sum, v) => sum + v, 0);
    const maxIncome = Math.max(0, ...incomes);

    return distributors.map((distributor, index) => {
      const kpi = kpis.find((k) => k.distributorId === distributor._id) ?? null;
      // Solo las cargas terminadas cuentan como cobertura: una que falló no
      // cubre su periodo y ese mes sigue estando pendiente. Se ordenan de más
      // reciente a más antigua porque la fila muestra la última.
      const uploads = (uploadsById[distributor._id] ?? [])
        .filter((u) => u.status !== "error")
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const covered = coveredMonths(uploads, year);
      const gaps = findCoverageGaps(covered, upToMonth);
      const income = kpi?.totalNetIncome ?? 0;

      return {
        distributor,
        kpi,
        color: distributorColor(index),
        uploads,
        covered,
        gaps,
        missingMonths: countMissingMonths(gaps),
        shareOfTotal: totalIncome > 0 ? (income / totalIncome) * 100 : 0,
        shareOfMax: maxIncome > 0 ? (income / maxIncome) * 100 : 0,
      };
    });
  }, [distributors, kpis, uploadsById, year, upToMonth]);

  const providers = useMemo(() => {
    const names = new Set<string>();
    for (const { distributor } of allItems) {
      if (distributor.provider) names.add(distributor.provider);
    }
    return [...names].sort((a, b) => a.localeCompare(b, "es"));
  }, [allItems]);

  const items = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = allItems.filter(({ distributor, missingMonths }) => {
      if (query) {
        const haystack = `${distributor.name} ${distributor.provider ?? ""}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      if (currencyFilter !== "all" && distributor.currency !== currencyFilter) return false;
      if (providerFilter !== "all" && distributor.provider !== providerFilter) return false;
      if (coverageFilter === "with_gaps" && missingMonths === 0) return false;
      if (coverageFilter === "complete" && missingMonths > 0) return false;
      return true;
    });

    const compare = comparators[sortBy];
    return [...filtered].sort((a, b) => Number(isBelieve(b)) - Number(isBelieve(a)) || compare(a, b));
  }, [allItems, search, currencyFilter, providerFilter, coverageFilter, sortBy]);

  /** Totales de la consola: siempre sobre el catálogo completo, no sobre el filtro. */
  const totals = useMemo(() => {
    const sum = (pick: (k: DistributorKpi) => number) => kpis.reduce((t, k) => t + pick(k), 0);
    return {
      songsCount: sum((k) => k.songsCount),
      totalNetIncome: sum((k) => k.totalNetIncome),
      totalGrossIncome: sum((k) => k.totalGrossIncome),
      totalStreams: sum((k) => k.totalStreams),
      uploadCount: sum((k) => k.uploadCount),
    };
  }, [kpis]);

  /** Cuántos distribuidores cubren cada mes del año seleccionado. */
  const countByMonth = useMemo(() => {
    const counts = new Map<number, number>();
    for (const { covered } of allItems) {
      for (const month of covered) counts.set(month, (counts.get(month) ?? 0) + 1);
    }
    return counts;
  }, [allItems]);

  /** Meses que no cubre ningún distribuidor: el hueco real del año. */
  const globalGaps = useMemo(() => {
    const anyCovered = new Set<number>();
    for (const { covered } of allItems) for (const month of covered) anyCovered.add(month);
    return findCoverageGaps(anyCovered, upToMonth);
  }, [allItems, upToMonth]);

  const hasFilters =
    currencyFilter !== "all" || providerFilter !== "all" || coverageFilter !== "all";

  const clearAllFilters = useCallback(() => {
    setCurrencyFilter("all");
    setProviderFilter("all");
    setCoverageFilter("all");
  }, []);

  return {
    loading,
    error,
    reload: load,
    distributors,
    allItems,
    items,
    providers,
    totals,
    countByMonth,
    globalGaps,
    missingMonths: countMissingMonths(globalGaps),
    year,
    setYear,
    years,
    upToMonth,
    search,
    setSearch,
    currencyFilter,
    setCurrencyFilter,
    providerFilter,
    setProviderFilter,
    coverageFilter,
    setCoverageFilter,
    sortBy,
    setSortBy,
    hasFilters,
    clearAllFilters,
  };
}

type Comparator = (a: DistributorListItem, b: DistributorListItem) => number;

/** Believe siempre se muestra primero en el listado, sin importar el orden elegido. */
const isBelieve = ({ distributor }: DistributorListItem) =>
  `${distributor.name} ${distributor.provider ?? ""}`.toLowerCase().includes("believe");

const income = (item: DistributorListItem) => item.kpi?.totalNetIncome ?? 0;
const lastUploadTime = (item: DistributorListItem) =>
  item.kpi?.lastUpload ? new Date(item.kpi.lastUpload).getTime() : 0;

const comparators: Record<DistributorSortBy, Comparator> = {
  income_desc: (a, b) => income(b) - income(a),
  income_asc: (a, b) => income(a) - income(b),
  songs_desc: (a, b) => (b.kpi?.songsCount ?? 0) - (a.kpi?.songsCount ?? 0),
  streams_desc: (a, b) => (b.kpi?.totalStreams ?? 0) - (a.kpi?.totalStreams ?? 0),
  coverage_asc: (a, b) => b.missingMonths - a.missingMonths || income(b) - income(a),
  last_upload_desc: (a, b) => lastUploadTime(b) - lastUploadTime(a),
  name_asc: (a, b) => a.distributor.name.localeCompare(b.distributor.name, "es"),
};
