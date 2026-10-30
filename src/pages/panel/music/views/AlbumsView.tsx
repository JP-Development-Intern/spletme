import { useEffect } from "react";
import { Disc3, SearchX, Music } from "lucide-react";
import { useAlbumsLibrary } from "@/hooks/useAlbumsLibrary";
import { AlbumRow } from "@/components/music/AlbumRow";
import { AlbumCard } from "@/components/music/AlbumCard";
import { MusicPagination } from "@/components/music/MusicPagination";
import { MusicFilterDrawer } from "@/components/music/MusicFilterDrawer";
import { ALBUM_COLUMNS, ALBUMS_GRID } from "@/components/music/albumsColumns";
import AlbumOwnerSplitModal from "../album/components/AlbumOwnerSplitModal";
import type { MusicLayout } from "@/types/music.types";

interface AlbumsViewProps {
  /** Búsqueda compartida por los dos modos, elevada a la página. */
  query: string;
  onQueryChange: (value: string) => void;
  layout: MusicLayout;
  /** Abre el otro modo cuando aquí no hay nada que enseñar. */
  onSwitchToSongs: () => void;
  /** Notifica cuántos hay, para el contador del conmutador. */
  onCountChange?: (total: number) => void;
  filtersOpen: boolean;
  onFiltersOpenChange: (open: boolean) => void;
  onActiveFiltersChange?: (count: number) => void;
}

/** El catálogo agrupado por álbum: cada fila se despliega a sus pistas. */
export function AlbumsView({
  query,
  onQueryChange,
  layout,
  onSwitchToSongs,
  onCountChange,
  filtersOpen,
  onFiltersOpenChange,
  onActiveFiltersChange,
}: AlbumsViewProps) {
  const library = useAlbumsLibrary();
  const {
    searchQuery,
    setSearchQuery,
    displayAlbums,
    loading,
    initialLoading,
    totalItemsForDisplay,
    activeFilterCount,
    handleOpenOwnerSplitModal,
    isOwnerSplitModalOpen,
    setIsOwnerSplitModalOpen,
    selectedAlbum,
    setSelectedAlbum,
    refreshAlbums,
  } = library;

  // La búsqueda vive en la página para que sobreviva al cambio de agrupación.
  useEffect(() => {
    if (query !== searchQuery) setSearchQuery(query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  useEffect(() => {
    if (searchQuery !== query) onQueryChange(searchQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  useEffect(() => {
    onCountChange?.(totalItemsForDisplay);
  }, [totalItemsForDisplay, onCountChange]);

  useEffect(() => {
    onActiveFiltersChange?.(activeFilterCount);
  }, [activeFilterCount, onActiveFiltersChange]);

  const openSplit = (album: Parameters<typeof handleOpenOwnerSplitModal>[0]) =>
    handleOpenOwnerSplitModal(album);

  const drawer = (
    <MusicFilterDrawer
      isOpen={filtersOpen}
      mode="albums"
      sortBy={library.sortBy}
      splitFilter={library.splitFilter}
      artistFilter={library.artistFilter}
      isrcFilter=""
      upcFilter={library.upcFilter}
      countryFilter={library.countryFilter}
      dateFrom={library.dateFrom}
      dateTo={library.dateTo}
      groupAlbumsByTrackCount={library.groupAlbumsByTrackCount}
      activeFilterCount={activeFilterCount}
      resultCount={totalItemsForDisplay}
      onClose={() => onFiltersOpenChange(false)}
      onSortChange={library.setSortBy}
      onSplitFilterChange={library.setSplitFilter}
      onArtistFilterChange={library.setArtistFilter}
      onIsrcFilterChange={() => {}}
      onUpcFilterChange={library.setUpcFilter}
      onCountryFilterChange={library.setCountryFilter}
      onDateFromChange={library.setDateFrom}
      onDateToChange={library.setDateTo}
      percentageMin=""
      percentageMax=""
      onPercentageMinChange={() => {}}
      onPercentageMaxChange={() => {}}
      onGroupByTrackCountChange={library.setGroupAlbumsByTrackCount}
      onClearAll={library.clearAllFilters}
    />
  );

  const modal = selectedAlbum && (
    <AlbumOwnerSplitModal
      isOpen={isOwnerSplitModalOpen}
      onClose={() => {
        setIsOwnerSplitModalOpen(false);
        setSelectedAlbum(null);
      }}
      album={selectedAlbum}
      onSplitsCreated={refreshAlbums}
    />
  );

  const pagination = (
    <MusicPagination
      pageStart={library.pageStart}
      pageEnd={library.pageEnd}
      total={totalItemsForDisplay}
      page={library.safePage}
      limit={library.limit}
      onLimitChange={library.setLimit}
      canGoNext={library.canGoNext}
      onPrev={() => library.setPage((p) => Math.max(1, p - 1))}
      onNext={() =>
        library.setPage((p) =>
          library.knownTotalPages ? Math.min(library.knownTotalPages, p + 1) : p + 1,
        )
      }
      noun="álbumes"
    />
  );

  if (initialLoading || (loading && displayAlbums.length === 0)) {
    return (
      <>
        <AlbumsSkeleton />
        {drawer}
      </>
    );
  }

  if (displayAlbums.length === 0) {
    return (
      <>
        <EmptyAlbums
          query={query}
          hasFilters={activeFilterCount > 0}
          onClearFilters={library.clearAllFilters}
          onClearSearch={() => onQueryChange("")}
          onSwitchToSongs={onSwitchToSongs}
        />
        {drawer}
      </>
    );
  }

  if (layout === "grid") {
    return (
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {displayAlbums.map((album) => (
            <AlbumCard key={album.upc || album._id} album={album} onOwnerSplit={openSplit} />
          ))}
        </div>
        <div className="glass rounded-[22px] px-5 py-3.5">{pagination}</div>
        {drawer}
        {modal}
      </div>
    );
  }

  return (
    <div className="glass overflow-hidden rounded-[28px]">
      <div className={`${ALBUMS_GRID} bg-black/[0.08] px-5 py-3`}>
        <ColumnLabel>ÁLBUM</ColumnLabel>
        {ALBUM_COLUMNS.map((column) => (
          <div key={column.key} className={column.visibility}>
            <ColumnLabel>{column.label}</ColumnLabel>
          </div>
        ))}
        <div />
      </div>
      <div className="h-px bg-white/[0.09]" />
      <div className="flex flex-col divide-y divide-white/[0.09]">
        {displayAlbums.map((album) => (
          <AlbumRow key={album.upc || album._id} album={album} onOwnerSplit={openSplit} />
        ))}
      </div>
      <div className="h-px bg-white/[0.09]" />
      <div className="px-5 py-3.5">{pagination}</div>

      {drawer}
      {modal}
    </div>
  );
}

function ColumnLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="truncate text-[10.5px] font-medium tracking-[1.4px] text-white/50">
      {children}
    </span>
  );
}

/** Tabla fantasma: conserva las columnas del modo álbum mientras llegan los datos. */
function AlbumsSkeleton() {
  const widths = ["w-[168px]", "w-[132px]", "w-[190px]", "w-[150px]"];
  return (
    <div className="glass overflow-hidden rounded-[28px]" aria-busy="true">
      <div className={`${ALBUMS_GRID} bg-black/[0.08] px-5 py-3`}>
        <ColumnLabel>ÁLBUM</ColumnLabel>
        {ALBUM_COLUMNS.map((column) => (
          <div key={column.key} className={column.visibility}>
            <ColumnLabel>{column.label}</ColumnLabel>
          </div>
        ))}
        <div />
      </div>
      <div className="h-px bg-white/[0.09]" />
      <div className="flex flex-col divide-y divide-white/[0.09]">
        {widths.map((width, index) => (
          <div key={width} className={`${ALBUMS_GRID} px-5 py-3.5`}>
            <div className="flex min-w-0 items-center gap-3">
              <div className="h-7 w-7 flex-shrink-0 animate-pulse rounded-full bg-white/[0.08]" />
              <div className="h-12 w-12 flex-shrink-0 animate-pulse rounded-xl bg-white/[0.08]" />
              <div className="flex flex-1 flex-col gap-2">
                <div className={`h-2.5 animate-pulse rounded-full bg-white/[0.08] ${width}`} />
                <div
                  className={`h-2 animate-pulse rounded-full bg-white/[0.06] ${
                    index % 2 ? "w-[140px]" : "w-[180px]"
                  }`}
                />
              </div>
            </div>
            {ALBUM_COLUMNS.map((column) => (
              <div key={column.key} className={column.visibility}>
                <div className="h-2.5 w-[70%] animate-pulse rounded-full bg-white/[0.08]" />
              </div>
            ))}
            <div className="flex justify-end">
              <div className="h-8 w-[66px] animate-pulse rounded-full bg-white/[0.08]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Sin álbumes: apunta al otro modo, que es donde suele estar lo que no aparece. */
function EmptyAlbums({
  query,
  hasFilters,
  onClearFilters,
  onClearSearch,
  onSwitchToSongs,
}: {
  query: string;
  hasFilters: boolean;
  onClearFilters: () => void;
  onClearSearch: () => void;
  onSwitchToSongs: () => void;
}) {
  const searching = query.trim() !== "";

  return (
    <div className="glass flex flex-col items-center gap-3 rounded-[28px] px-6 py-[50px]">
      <span className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-white/[0.08]">
        {searching ? (
          <SearchX className="h-6 w-6 text-white/70" />
        ) : (
          <Disc3 className="h-6 w-6 text-white/70" />
        )}
      </span>

      <h3 className="text-center font-display text-lg font-medium text-white">
        {searching ? `Ningún álbum coincide con «${query}»` : "Todavía no hay álbumes"}
      </h3>
      <p className="max-w-[520px] text-center text-[12.5px] leading-relaxed text-white/65">
        {hasFilters
          ? "Hay filtros puestos que pueden estar dejando fuera lo que buscas."
          : searching
            ? "Puede que lo que buscas sea una canción suelta."
            : "Los álbumes se arman solos agrupando las pistas por UPC."}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1.5">
        {hasFilters && (
          <button
            onClick={onClearFilters}
            className="rounded-full bg-[#FF5C00] px-4 py-2.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-[#EA580C]"
          >
            Limpiar filtros
          </button>
        )}
        {searching && (
          <>
            <button
              onClick={onSwitchToSongs}
              className="glass-control flex items-center gap-1.5 rounded-full px-4 py-2.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-white/[0.12]"
            >
              <Music className="h-3.5 w-3.5" />
              Buscar en canciones
            </button>
            <button
              onClick={onClearSearch}
              className="glass-control rounded-full px-4 py-2.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-white/[0.12]"
            >
              Borrar búsqueda
            </button>
          </>
        )}
      </div>
    </div>
  );
}
