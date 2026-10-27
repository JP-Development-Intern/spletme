import { useEffect, useState } from "react";
import { Disc3, SearchX, Music } from "lucide-react";
import { useAlbumsLibrary } from "@/hooks/useAlbumsLibrary";
import { AlbumRow, viewerOwnsAlbum } from "@/components/music/AlbumRow";
import { PermissionsModal } from "@/components/music/PermissionsModal";
import { AlbumCard } from "@/components/music/AlbumCard";
import { MusicPagination } from "@/components/music/MusicPagination";
import { MusicFilterDrawer } from "@/components/music/MusicFilterDrawer";
import {
  ALBUM_COLUMNS,
  ALBUM_PERMISSIONS_COLUMN,
  ALBUMS_GRID,
  ALBUMS_GRID_WITH_PERMISSIONS,
} from "@/components/music/albumsColumns";
import AlbumOwnerSplitModal from "../album/components/AlbumOwnerSplitModal";
import type { AlbumItem, MusicLayout } from "@/types/music.types";

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

  // Álbum cuyos permisos está editando el dueño.
  const [permissionsAlbum, setPermissionsAlbum] = useState<AlbumItem | null>(null);

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

  // La columna de permisos solo existe para quien es dueño de algún álbum listado.
  const withPermissions = displayAlbums.some(viewerOwnsAlbum);
  const permissionsModal = permissionsAlbum && (
    <PermissionsModal
      resourceType="album"
      resourceId={permissionsAlbum.upc}
      title={permissionsAlbum.albumTitle}
      onClose={() => setPermissionsAlbum(null)}
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
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {displayAlbums.map((album) => (
            <AlbumCard key={album.upc || album._id} album={album} onOwnerSplit={openSplit} />
          ))}
        </div>
        <div className="px-1">{pagination}</div>
        {drawer}
        {modal}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[26px] border border-[#E8E8EC] bg-white shadow-[0_10px_28px_-12px_rgba(255,92,0,0.15)]">
      <div className={`${withPermissions ? ALBUMS_GRID_WITH_PERMISSIONS : ALBUMS_GRID} px-5 py-3`}>
        <ColumnLabel>ÁLBUM</ColumnLabel>
        {ALBUM_COLUMNS.map((column) => (
          <div key={column.key} className={column.visibility}>
            <ColumnLabel>{column.label}</ColumnLabel>
          </div>
        ))}
        {withPermissions && (
          <div className={ALBUM_PERMISSIONS_COLUMN.visibility}>
            <ColumnLabel>{ALBUM_PERMISSIONS_COLUMN.label}</ColumnLabel>
          </div>
        )}
        <div />
      </div>
      <div className="h-px bg-[#E8E8EC]" />
      <div className="flex flex-col divide-y divide-[#E8E8EC]">
        {displayAlbums.map((album) => (
          <AlbumRow
            key={album.upc || album._id}
            album={album}
            onOwnerSplit={openSplit}
            withPermissions={withPermissions}
            onPermissions={setPermissionsAlbum}
          />
        ))}
      </div>
      <div className="h-px bg-[#E8E8EC]" />
      <div className="px-5 py-3">{pagination}</div>

      {drawer}
      {modal}
      {permissionsModal}
    </div>
  );
}

function ColumnLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="truncate font-mono text-[9.5px] font-medium tracking-[1.2px] text-[#A6AAB2]">
      {children}
    </span>
  );
}

/** Tabla fantasma: conserva las columnas del modo álbum mientras llegan los datos. */
function AlbumsSkeleton() {
  const widths = ["w-[168px]", "w-[132px]", "w-[190px]", "w-[150px]"];
  return (
    <div className="overflow-hidden rounded-[26px] border border-[#E8E8EC] bg-white">
      <div className={`${ALBUMS_GRID} px-5 py-3`}>
        <ColumnLabel>ÁLBUM</ColumnLabel>
        {ALBUM_COLUMNS.map((column) => (
          <div key={column.key} className={column.visibility}>
            <ColumnLabel>{column.label}</ColumnLabel>
          </div>
        ))}
        <div />
      </div>
      <div className="h-px bg-[#E8E8EC]" />
      <div className="flex flex-col divide-y divide-[#E8E8EC]">
        {widths.map((width, index) => (
          <div key={width} className={`${ALBUMS_GRID} px-5 py-3.5`}>
            <div className="flex min-w-0 items-center gap-3">
              <div className="h-[22px] w-[22px] flex-shrink-0 animate-pulse rounded-full bg-[#F4F5F7]" />
              <div className="h-11 w-11 flex-shrink-0 animate-pulse rounded-xl bg-[#F4F5F7]" />
              <div className="flex flex-1 flex-col gap-2">
                <div className={`h-2.5 animate-pulse rounded-full bg-[#F4F5F7] ${width}`} />
                <div
                  className={`h-2 animate-pulse rounded-full bg-[#F4F5F7]/70 ${
                    index % 2 ? "w-[140px]" : "w-[180px]"
                  }`}
                />
              </div>
            </div>
            {ALBUM_COLUMNS.map((column) => (
              <div key={column.key} className={column.visibility}>
                <div className="h-2.5 w-[70%] animate-pulse rounded-full bg-[#F4F5F7]" />
              </div>
            ))}
            <div className="flex justify-end">
              <div className="h-7 w-[62px] animate-pulse rounded-[15px] bg-[#F4F5F7]" />
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
    <div className="flex flex-col items-center gap-3 rounded-[26px] border border-[#E8E8EC] bg-white px-6 py-[50px]">
      <span className="flex h-[52px] w-[52px] items-center justify-center rounded-[18px] bg-[#F4F5F7]">
        {searching ? (
          <SearchX className="h-[22px] w-[22px] text-[#71757E]" />
        ) : (
          <Disc3 className="h-[22px] w-[22px] text-[#71757E]" />
        )}
      </span>

      <h3 className="text-center font-display text-base font-semibold text-[#1C1D22]">
        {searching ? `Ningún álbum coincide con «${query}»` : "Todavía no hay álbumes"}
      </h3>
      <p className="text-center text-[12.5px] text-[#71757E]">
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
            className="rounded-2xl bg-[#FF5C00] px-4 py-2.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-[#EA580C]"
          >
            Limpiar filtros
          </button>
        )}
        {searching && (
          <>
            <button
              onClick={onSwitchToSongs}
              className="flex items-center gap-1.5 rounded-2xl bg-[#FF5C00] px-4 py-2.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-[#EA580C]"
            >
              <Music className="h-3.5 w-3.5" />
              Buscar en canciones
            </button>
            <button
              onClick={onClearSearch}
              className="rounded-2xl border border-[#E8E8EC] bg-white px-4 py-2.5 text-[12.5px] font-semibold text-[#1C1D22] transition-colors hover:bg-[#F4F5F7]"
            >
              Borrar búsqueda
            </button>
          </>
        )}
      </div>
    </div>
  );
}
