import { useEffect, useState } from "react";
import { ArrowUp, ArrowDown, SearchX, Music as MusicIcon, Disc3, CircleX } from "lucide-react";
import { SongRow } from "@/components/music/SongRow";
import { SongCard } from "@/components/music/SongCard";
import { SongDetailsModal } from "@/components/music/SongDetailsModal";
import OwnerSplitModal from "@/pages/panel/music/song/components/ownerfrom";
import { MusicPagination } from "@/components/music/MusicPagination";
import { MusicFilterDrawer } from "@/components/music/MusicFilterDrawer";
import { SONG_COLUMNS, SONGS_GRID, isDescending } from "@/components/music/songsColumns";
import { useSongsLibrary } from "@/hooks/useSongsLibrary";
import { viewerOwnsSong } from "@/utils/ownerVisibility";
import type { MusicLayout, SongItem, SortBy } from "@/types/music.types";

interface SongsViewProps {
  query: string;
  onQueryChange: (value: string) => void;
  layout: MusicLayout;
  /** Abre el otro modo cuando aquí no hay nada que enseñar. */
  onSwitchToAlbums: () => void;
  onCountChange?: (total: number) => void;
  filtersOpen: boolean;
  onFiltersOpenChange: (open: boolean) => void;
  onActiveFiltersChange?: (count: number) => void;
}

/** Criterio que aplica cada columna al pulsar su cabecera. */
const NEXT_SORT: Record<string, (current: SortBy) => SortBy> = {
  title: (current) => (current === "alpha" ? "title_desc" : "alpha"),
  streams: () => "streams",
  income: () => "revenue",
  collaborators: () => "collaborators_desc",
  percentage: (current) => (current === "percentage_desc" ? "percentage_asc" : "percentage_desc"),
};

/** El catálogo canción a canción: la lectura densa, para comparar cifras. */
export function SongsView({
  query,
  onQueryChange,
  layout,
  onSwitchToAlbums,
  onCountChange,
  filtersOpen,
  onFiltersOpenChange,
  onActiveFiltersChange,
}: SongsViewProps) {
  const library = useSongsLibrary();
  const {
    searchQuery,
    setSearchQuery,
    songs,
    loading,
    initialLoading,
    totalItemsForDisplay,
    activeFilterCount,
    sortBy,
    setSortBy,
  } = library;

  // Canción cuyo split se está fijando desde el listado, sin abrir el detalle.
  const [splitSong, setSplitSong] = useState<SongItem | null>(null);

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

  /**
   * La columna de dinero solo puede decir «ingresos» si todo lo que se lista es
   * del propio dueño. En cuanto aparece una canción ajena pasa a decir «tu
   * parte» en todas: enseñarle a un colaborador el neto junto a su porcentaje
   * contaría lo que hay descontado antes. Ver `utils/ownerVisibility.ts`.
   */
  const showsIncome = songs.length > 0 && songs.every((song) => viewerOwnsSong(song));

  const drawer = (
    <MusicFilterDrawer
      isOpen={filtersOpen}
      mode="songs"
      sortBy={sortBy}
      splitFilter={library.splitFilter}
      artistFilter={library.artistFilter}
      isrcFilter={library.isrcFilter}
      upcFilter=""
      countryFilter={library.countryFilter}
      dateFrom={library.dateFrom}
      dateTo={library.dateTo}
      groupAlbumsByTrackCount={false}
      activeFilterCount={activeFilterCount}
      resultCount={totalItemsForDisplay}
      onClose={() => onFiltersOpenChange(false)}
      onSortChange={setSortBy}
      onSplitFilterChange={library.setSplitFilter}
      onArtistFilterChange={library.setArtistFilter}
      onIsrcFilterChange={library.setIsrcFilter}
      onUpcFilterChange={() => {}}
      onCountryFilterChange={library.setCountryFilter}
      onDateFromChange={library.setDateFrom}
      onDateToChange={library.setDateTo}
      percentageMin={library.percentageMin}
      percentageMax={library.percentageMax}
      onPercentageMinChange={library.setPercentageMin}
      onPercentageMaxChange={library.setPercentageMax}
      onGroupByTrackCountChange={() => {}}
      onClearAll={library.clearAllFilters}
    />
  );

  const detailsModal = library.isSongDetailsOpen && library.selectedSong && (
    <SongDetailsModal
      song={library.selectedSong}
      songDetails={library.selectedSongDetails}
      isLoading={library.isSongDetailsLoading}
      error={library.songDetailsError}
      onClose={library.handleCloseSongDetails}
      onNavigate={library.handleNavigateToSong}
    />
  );

  const splitModal = splitSong && (
    <OwnerSplitModal
      isOpen
      onClose={() => setSplitSong(null)}
      songId={splitSong._id}
      song={splitSong}
      onSplitCreated={() => {
        setSplitSong(null);
        // El listado enseña el estado del split y el porcentaje: sin releer, la
        // fila seguiría diciendo "sin asignar" después de asignarlo.
        library.refresh();
      }}
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
      noun="canciones"
    />
  );

  if (initialLoading || (loading && songs.length === 0)) {
    return (
      <>
        <SongsSkeleton />
        {drawer}
      </>
    );
  }

  if (songs.length === 0) {
    return (
      <>
        <EmptySongs
          query={query}
          hasFilters={activeFilterCount > 0}
          onClearFilters={library.clearAllFilters}
          onClearSearch={() => onQueryChange("")}
          onSwitchToAlbums={onSwitchToAlbums}
        />
        {drawer}
      </>
    );
  }

  if (layout === "grid") {
    return (
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {songs.map((song) => (
            <SongCard
              key={song._id}
              song={song}
              onQuickView={library.handleOpenSongDetails}
              onOwnerSplit={setSplitSong}
              showsIncome={showsIncome}
            />
          ))}
        </div>
        <div className="glass rounded-[22px] px-5 py-3.5">{pagination}</div>
        {drawer}
        {detailsModal}
        {splitModal}
      </div>
    );
  }

  const titleActive = sortBy === "alpha" || sortBy === "title_desc";

  return (
    <div className="glass overflow-hidden rounded-[28px]">
      <div className={`${SONGS_GRID} bg-black/[0.08] px-5 py-3`}>
        <div className="flex min-w-0">
          <ColumnButton
            label="CANCIÓN"
            active={titleActive}
            descending={isDescending(sortBy)}
            onClick={() => setSortBy(NEXT_SORT.title(sortBy))}
          />
        </div>
        {SONG_COLUMNS.map((column) => {
          const active = Boolean(column.sortKeys?.includes(sortBy));
          const label =
            column.key === "income" && !showsIncome ? "TU PARTE" : column.label;
          return (
            <div key={column.key} className={column.visibility}>
              {column.sortKeys ? (
                <ColumnButton
                  label={label}
                  active={active}
                  descending={isDescending(sortBy)}
                  onClick={() => setSortBy(NEXT_SORT[column.key](sortBy))}
                />
              ) : (
                <ColumnLabel>{label}</ColumnLabel>
              )}
            </div>
          );
        })}
        <div />
      </div>
      <div className="h-px bg-white/[0.09]" />
      <div className="flex flex-col divide-y divide-white/[0.09]">
        {songs.map((song) => (
          <SongRow
            key={song._id}
            song={song}
            onQuickView={library.handleOpenSongDetails}
            onOwnerSplit={setSplitSong}
            showsIncome={showsIncome}
          />
        ))}
      </div>
      <div className="h-px bg-white/[0.09]" />
      <div className="px-5 py-3.5">{pagination}</div>

      {drawer}
      {detailsModal}
      {splitModal}
    </div>
  );
}

function ColumnButton({
  label,
  active,
  descending,
  onClick,
}: {
  label: string;
  active: boolean;
  descending: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 transition-colors ${
        active ? "text-white" : "text-white/50 hover:text-white/80"
      }`}
    >
      <span className="text-[10.5px] font-medium tracking-[1.4px]">{label}</span>
      {active &&
        (descending ? (
          <ArrowDown className="h-3 w-3 text-[#FF8A3D]" />
        ) : (
          <ArrowUp className="h-3 w-3 text-[#FF8A3D]" />
        ))}
    </button>
  );
}

function ColumnLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="truncate text-[10.5px] font-medium tracking-[1.4px] text-white/50">
      {children}
    </span>
  );
}

function SongsSkeleton() {
  const widths = ["w-[168px]", "w-[132px]", "w-[190px]", "w-[150px]"];
  return (
    <div className="glass overflow-hidden rounded-[28px]" aria-busy="true">
      <div className={`${SONGS_GRID} bg-black/[0.08] px-5 py-3`}>
        <ColumnLabel>CANCIÓN</ColumnLabel>
        {SONG_COLUMNS.map((column) => (
          <div key={column.key} className={column.visibility}>
            <ColumnLabel>{column.label}</ColumnLabel>
          </div>
        ))}
        <div />
      </div>
      <div className="h-px bg-white/[0.09]" />
      <div className="flex flex-col divide-y divide-white/[0.09]">
        {widths.map((width, index) => (
          <div key={width} className={`${SONGS_GRID} px-5 py-3.5`}>
            <div className="flex min-w-0 items-center gap-3">
              <div className="h-11 w-11 flex-shrink-0 animate-pulse rounded-xl bg-white/[0.08]" />
              <div className="flex flex-1 flex-col gap-2">
                <div className={`h-2.5 animate-pulse rounded-full bg-white/[0.08] ${width}`} />
                <div
                  className={`h-2 animate-pulse rounded-full bg-white/[0.06] ${
                    index % 2 ? "w-[96px]" : "w-[120px]"
                  }`}
                />
              </div>
            </div>
            {SONG_COLUMNS.map((column) => (
              <div key={column.key} className={column.visibility}>
                <div className="h-2.5 w-[70%] animate-pulse rounded-full bg-white/[0.08]" />
              </div>
            ))}
            <div className="flex justify-end">
              <div className="h-8 w-8 animate-pulse rounded-full bg-white/[0.08]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptySongs({
  query,
  hasFilters,
  onClearFilters,
  onClearSearch,
  onSwitchToAlbums,
}: {
  query: string;
  hasFilters: boolean;
  onClearFilters: () => void;
  onClearSearch: () => void;
  onSwitchToAlbums: () => void;
}) {
  const searching = query.trim() !== "";

  return (
    <div className="glass flex flex-col items-center gap-3 rounded-[28px] px-6 py-[50px]">
      <span
        className={`flex h-14 w-14 items-center justify-center rounded-[20px] ${
          searching ? "bg-white/[0.08]" : "bg-[#FF5C00]/[0.16]"
        }`}
      >
        {searching ? (
          <SearchX className="h-6 w-6 text-white/70" />
        ) : (
          <MusicIcon className="h-6 w-6 text-[#FF8A3D]" />
        )}
      </span>

      <h3 className="text-center font-display text-lg font-medium text-white">
        {searching ? `Ninguna canción coincide con «${query}»` : "Tu catálogo todavía está vacío"}
      </h3>
      <p className="max-w-[520px] text-center text-[12.5px] leading-relaxed text-white/65">
        {hasFilters
          ? "Hay filtros puestos que pueden estar dejando fuera lo que buscas."
          : searching
            ? "Puede que lo que buscas sea el título de un álbum."
            : "Las canciones aparecen solas cuando subes el reporte de un distribuidor. No hace falta darlas de alta una a una."}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1.5">
        {hasFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-1.5 rounded-full bg-[#FF5C00] px-4 py-2.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-[#EA580C]"
          >
            <CircleX className="h-3.5 w-3.5" />
            Limpiar filtros
          </button>
        )}
        {searching && (
          <>
            <button
              onClick={onSwitchToAlbums}
              className="glass-control flex items-center gap-1.5 rounded-full px-4 py-2.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-white/[0.12]"
            >
              <Disc3 className="h-3.5 w-3.5" />
              Buscar en álbumes
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
