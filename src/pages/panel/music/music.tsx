import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Rows3, LayoutGrid, SlidersHorizontal, Info } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { MusicKpis } from "@/components/music/MusicKpis";
import { MusicModeSwitch } from "@/components/music/MusicModeSwitch";
import { useMusicSummary } from "@/hooks/useMusicSummary";
import { SongsView } from "./views/SongsView";
import { AlbumsView } from "./views/AlbumsView";
import type { MusicLayout, MusicMode } from "@/types/music.types";

/**
 * Música: un catálogo, dos formas de mirarlo.
 *
 * Canciones y álbumes no son dos catálogos distintos —un álbum es un grupo de
 * canciones con el mismo UPC—, así que dejan de ser dos páginas y pasan a ser dos
 * agrupaciones del mismo listado. El modo, la búsqueda y la disposición viven en
 * la URL para que compartir un enlace conserve lo que estabas viendo.
 *
 * Cada modo se monta por separado y con su propio hook: son dos endpoints con
 * paginación propia, y montar solo el activo evita pedir el catálogo entero dos
 * veces.
 */
export default function Music() {
  const [params, setParams] = useSearchParams();

  const mode: MusicMode = params.get("view") === "albums" ? "albums" : "songs";
  const layout: MusicLayout = params.get("layout") === "grid" ? "grid" : "list";
  const query = params.get("q") ?? "";

  const [songsCount, setSongsCount] = useState<number>();
  const [albumsCount, setAlbumsCount] = useState<number>();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState(0);

  const summary = useMusicSummary();

  /** Escribe en la URL sin apilar una entrada nueva en el historial por tecla. */
  const patchParams = useCallback(
    (patch: Record<string, string | null>) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(patch)) {
            if (value === null || value === "") next.delete(key);
            else next.set(key, value);
          }
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  const setMode = useCallback((next: MusicMode) => patchParams({ view: next }), [patchParams]);
  const setLayout = useCallback((next: MusicLayout) => patchParams({ layout: next }), [patchParams]);
  const setQuery = useCallback((next: string) => patchParams({ q: next }), [patchParams]);

  const counts = useMemo(
    () => ({
      songs: songsCount ?? (summary.loading ? undefined : summary.totalSongs),
      albums: albumsCount ?? (summary.loading ? undefined : summary.totalAlbums),
    }),
    [songsCount, albumsCount, summary],
  );

  const viewProps = {
    query,
    onQueryChange: setQuery,
    layout,
    filtersOpen,
    onFiltersOpenChange: setFiltersOpen,
    onActiveFiltersChange: setActiveFilters,
  };

  return (
    <div className="flex flex-col gap-6 px-4 lg:pl-4 lg:pr-8">
      <PageHeader>
        <div className="flex flex-col gap-1">
          <h1 className="truncate font-display text-[32px] font-light leading-[38px] tracking-[-0.015em] text-white sm:text-[40px] sm:leading-[46px]">
            Música
          </h1>
          <p className="flex flex-wrap items-center gap-2 text-sm text-white/65">
            <span>
              {summary.totalSongs.toLocaleString()} canciones en {summary.totalAlbums.toLocaleString()} álbumes
            </span>
            {summary.withoutSplits > 0 && (
              <>
                <span className="text-white/50">·</span>
                <button
                  onClick={() => setFiltersOpen(true)}
                  className="font-semibold text-[#FF8A3D] underline-offset-2 transition-colors hover:text-[#FFB48A] hover:underline"
                >
                  {summary.withoutSplits.toLocaleString()} sin split
                </button>
              </>
            )}
          </p>
        </div>
      </PageHeader>

      <MusicKpis
        totalSongs={summary.totalSongs}
        totalAlbums={summary.totalAlbums}
        totalIncome={summary.totalIncome}
        totalStreams={summary.totalStreams}
        withoutSplits={summary.withoutSplits}
        onShowWithoutSplits={summary.withoutSplits > 0 ? () => setFiltersOpen(true) : undefined}
      />

      {/* Agrupación, búsqueda, filtros y disposición */}
      <div className="flex flex-wrap items-center gap-2.5">
        <MusicModeSwitch
          mode={mode}
          onChange={setMode}
          songsCount={counts.songs}
          albumsCount={counts.albums}
        />

        <label className="glass-control relative flex w-full items-center gap-2.5 rounded-full px-[18px] py-[11px] focus-within:ring-2 focus-within:ring-[#FF5C00]/70 sm:w-[340px]">
          <Search className="h-4 w-4 flex-shrink-0 text-white/50" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Buscar en el catálogo"
            placeholder={
              mode === "albums"
                ? "Buscar por título de álbum, artista o UPC…"
                : "Buscar por título, artista o ISRC…"
            }
            className="w-full border-none bg-transparent p-0 text-[12.5px] text-white placeholder:text-white/50 focus:outline-none focus:ring-0"
          />
        </label>

        <button
          onClick={() => setFiltersOpen(true)}
          className="glass-control flex min-h-[44px] flex-shrink-0 items-center gap-2 rounded-full px-[15px] text-[12.5px] font-semibold text-white transition-colors hover:bg-white/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70"
        >
          <SlidersHorizontal className="h-[15px] w-[15px] text-white/80" />
          Filtros
          {activeFilters > 0 && (
            <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#FF5C00] text-[10.5px] font-bold text-white">
              {activeFilters}
            </span>
          )}
        </button>

        <span className="ml-auto hidden items-center gap-1.5 text-xs text-white/50 xl:flex">
          <Info className="h-[13px] w-[13px]" />
          {mode === "albums"
            ? "Despliega un álbum para ver sus pistas"
            : "Cambia a álbumes para verlas agrupadas"}
        </span>

        <div className="flex flex-shrink-0 items-center gap-0.5 rounded-full bg-black/[0.22] p-1 xl:ml-0 ml-auto">
          <LayoutButton active={layout === "list"} onClick={() => setLayout("list")} title="Lista">
            <Rows3 className="h-4 w-4" />
          </LayoutButton>
          <LayoutButton active={layout === "grid"} onClick={() => setLayout("grid")} title="Cuadrícula">
            <LayoutGrid className="h-4 w-4" />
          </LayoutButton>
        </div>
      </div>

      {/* El panel que anuncia el conmutador: sin este id, su `aria-controls`
          apuntaría al vacío y un lector de pantalla no sabría qué cambió. */}
      <div id="music-panel" role="tabpanel" aria-labelledby={`music-tab-${mode}`}>
        {mode === "songs" ? (
          <SongsView
            {...viewProps}
            onCountChange={setSongsCount}
            onSwitchToAlbums={() => setMode("albums")}
          />
        ) : (
          <AlbumsView
            {...viewProps}
            onCountChange={setAlbumsCount}
            onSwitchToSongs={() => setMode("songs")}
          />
        )}
      </div>
    </div>
  );
}

function LayoutButton({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-pressed={active}
      className={`flex h-9 w-10 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70 ${
        active ? "bg-[#F7EDE6]/[0.92] text-[#1C1D22]" : "text-white/70 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}
