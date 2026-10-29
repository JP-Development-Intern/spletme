import { useMemo, useState } from "react";
import { useLabels } from "./useLabels";
import type { Label } from "@/services/labels";
import type { LabelListItem, SplitCoverage } from "@/components/labels/types";
import type { LabelSortBy } from "@/components/labels/labelsColumns";

export type LabelTypeFilter = "all" | "custom" | "artistic";
export type CoverageFilter = "all" | "incomplete" | "complete";

/**
 * Estado de la lista de sellos: normaliza los dos orígenes (artísticos y
 * personalizados) en una sola forma, deriva la cobertura de splits y aplica
 * búsqueda, filtros y orden.
 *
 * La página solo pinta; todo lo que hay que decidir sobre los datos se decide
 * aquí, igual que en la lista de distribuidores.
 */
export function useLabelsLibrary() {
  const { labels, customLabels, loading, error, refreshLabels } = useLabels();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<LabelTypeFilter>("all");
  const [coverageFilter, setCoverageFilter] = useState<CoverageFilter>("all");
  const [sortBy, setSortBy] = useState<LabelSortBy>("songs_desc");

  /** Índice por nombre para deducir la cobertura de los personalizados. */
  const artisticByName = useMemo(() => {
    const map = new Map<string, Label>();
    for (const label of labels) if (label.label) map.set(label.label, label);
    return map;
  }, [labels]);

  const artisticItems = useMemo<LabelListItem[]>(
    () =>
      labels.map((label) => ({
        name: label.label,
        isCustom: false,
        artisticLabels: [],
        songCount: label.count ?? 0,
        totalStreams: label.totalStreams ?? 0,
        totalNetIncome: label.totalNetIncome ?? 0,
        ownerEarnings: label.ownerEarnings ?? 0,
        totalToPay: label.totalToPay ?? pendingToPay(label.totalNetIncome, label.ownerEarnings),
        coverage: toCoverage(
          label.splitProgress?.total ?? label.count ?? 0,
          label.splitProgress?.withSplits ?? 0,
          false,
        ),
        source: label,
      })),
    [labels],
  );

  const customItems = useMemo<LabelListItem[]>(
    () =>
      customLabels.map((custom) => {
        // El servidor no envía `splitProgress` de un sello personalizado, así que
        // su cobertura se suma a partir de los sellos artísticos que agrupa: es
        // el mismo dato, visto desde arriba.
        let total = 0;
        let withSplits = 0;
        for (const name of custom.artisticLabels ?? []) {
          const artistic = artisticByName.get(name);
          if (!artistic) continue;
          total += artistic.splitProgress?.total ?? artistic.count ?? 0;
          withSplits += artistic.splitProgress?.withSplits ?? 0;
        }

        return {
          name: custom.name,
          isCustom: true,
          id: custom._id,
          artisticLabels: custom.artisticLabels ?? [],
          songCount: custom.stats?.totalSongs ?? 0,
          totalStreams: custom.stats?.totalStreams ?? 0,
          totalNetIncome: custom.stats?.totalNetIncome ?? 0,
          ownerEarnings: custom.stats?.ownerEarnings ?? 0,
          totalToPay:
            custom.stats?.totalToPay ??
            pendingToPay(custom.stats?.totalNetIncome, custom.stats?.ownerEarnings),
          coverage: toCoverage(total, withSplits, true),
        };
      }),
    [customLabels, artisticByName],
  );

  /** Los personalizados van primero: son los que tú creaste. */
  const allItems = useMemo(() => [...customItems, ...artisticItems], [customItems, artisticItems]);

  /**
   * Totales de la consola. Se calculan solo sobre los sellos artísticos porque
   * un personalizado no aporta canciones nuevas: las toma prestadas de los
   * artísticos que agrupa, y sumar ambos las contaría dos veces.
   */
  const totals = useMemo(() => {
    let songs = 0;
    let streams = 0;
    let netIncome = 0;
    let ownerEarnings = 0;
    let totalToPay = 0;
    let coveredSongs = 0;
    let splitTotal = 0;

    for (const item of artisticItems) {
      songs += item.songCount;
      streams += item.totalStreams;
      netIncome += item.totalNetIncome;
      ownerEarnings += item.ownerEarnings;
      totalToPay += item.totalToPay;
      coveredSongs += item.coverage.withSplits;
      splitTotal += item.coverage.total;
    }

    return {
      songs,
      streams,
      netIncome,
      ownerEarnings,
      totalToPay,
      coverage: toCoverage(splitTotal, coveredSongs, false),
      customCount: customItems.length,
      artisticCount: artisticItems.length,
    };
  }, [artisticItems, customItems]);

  const hasFilters = typeFilter !== "all" || coverageFilter !== "all";

  const items = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = allItems.filter((item) => {
      if (typeFilter === "custom" && !item.isCustom) return false;
      if (typeFilter === "artistic" && item.isCustom) return false;

      if (coverageFilter === "complete" && !item.coverage.complete) return false;
      if (coverageFilter === "incomplete" && item.coverage.complete) return false;

      if (!query) return true;
      // Un personalizado también se encuentra por los sellos que agrupa: es como
      // se recuerda, aunque el nombre que tú le pusiste sea otro.
      return (
        item.name.toLowerCase().includes(query) ||
        item.artisticLabels.some((name) => name.toLowerCase().includes(query))
      );
    });

    return [...filtered].sort(compareBy(sortBy));
  }, [allItems, search, typeFilter, coverageFilter, sortBy]);

  /** Sellos a los que aún les falta repartir alguna canción. */
  const incompleteCount = useMemo(
    () => allItems.filter((item) => !item.coverage.complete).length,
    [allItems],
  );

  const clearAllFilters = () => {
    setTypeFilter("all");
    setCoverageFilter("all");
    setSearch("");
  };

  /** Deja a la vista solo los sellos que todavía tienen canciones sin repartir. */
  const showOnlyIncomplete = () => {
    setTypeFilter("all");
    setCoverageFilter("incomplete");
    setSortBy("coverage_asc");
  };

  return {
    loading,
    error,
    reload: refreshLabels,
    items,
    allItems,
    artisticItems,
    /** Sellos artísticos tal cual llegan del servidor, que es lo que esperan los modales. */
    sourceLabels: labels,
    totals,
    incompleteCount,
    search,
    setSearch,
    typeFilter,
    setTypeFilter,
    coverageFilter,
    setCoverageFilter,
    sortBy,
    setSortBy,
    hasFilters,
    clearAllFilters,
    showOnlyIncomplete,
  };
}

/**
 * Lo que queda por pagar a colaboradores: el neto menos la parte del owner.
 * Es la misma cuenta de respaldo que usa la vista de una canción.
 */
export function pendingToPay(netIncome = 0, ownerEarnings = 0): number {
  return Math.max(0, (netIncome ?? 0) - (ownerEarnings ?? 0));
}

/** Normaliza un progreso de splits a la forma que usa toda la sección. */
export function toCoverage(total: number, withSplits: number, derived: boolean): SplitCoverage {
  const safeTotal = Math.max(0, total);
  const safeWith = Math.min(Math.max(0, withSplits), safeTotal);
  return {
    total: safeTotal,
    withSplits: safeWith,
    percentage: safeTotal > 0 ? Math.round((safeWith / safeTotal) * 100) : 0,
    // Un sello sin canciones no está «completo»: no hay nada que repartir todavía.
    complete: safeTotal > 0 && safeWith >= safeTotal,
    derived,
  };
}

/**
 * Comparador de la tabla. Los personalizados quedan siempre arriba, sea cual sea
 * el criterio: son los que tú creaste y los que puedes editar.
 */
function compareBy(sortBy: LabelSortBy) {
  return (a: LabelListItem, b: LabelListItem): number => {
    if (a.isCustom !== b.isCustom) return a.isCustom ? -1 : 1;

    switch (sortBy) {
      case "name_asc":
        return a.name.localeCompare(b.name, "es");
      case "streams_desc":
        return b.totalStreams - a.totalStreams;
      case "income_desc":
        return b.totalNetIncome - a.totalNetIncome;
      case "income_asc":
        return a.totalNetIncome - b.totalNetIncome;
      case "owner_desc":
        return b.ownerEarnings - a.ownerEarnings;
      case "coverage_asc":
        // Entre dos sellos igual de cubiertos, primero el que tiene más
        // canciones pendientes: es donde queda más trabajo por hacer.
        return (
          a.coverage.percentage - b.coverage.percentage ||
          b.coverage.total - b.coverage.withSplits - (a.coverage.total - a.coverage.withSplits)
        );
      case "songs_desc":
      default:
        return b.songCount - a.songCount;
    }
  };
}
