import { useState } from "react";
import {
  Search,
  Plus,
  Tag,
  SearchX,
  FunnelX,
  TriangleAlert,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { useLabelsLibrary } from "@/hooks/useLabelsLibrary";
import { viewerIsAccountOwner } from "@/utils/ownerVisibility";
import { LabelsKpis } from "@/components/labels/LabelsKpis";
import { LabelsFilterBar } from "@/components/labels/LabelsFilterBar";
import { LabelRow } from "@/components/labels/LabelRow";
import {
  labelColumns,
  labelsGrid,
  NEXT_SORT,
  isDescending,
  type LabelSortBy,
} from "@/components/labels/labelsColumns";
import type { LabelListItem } from "@/components/labels/types";
import CreateSplitsByLabelModal from "@/components/modal/CreateSplitsByLabelModal";
import CreateSplitsByCustomLabelModal from "@/components/modal/CreateSplitsByCustomLabelModal";
import CreateLabelModal from "@/components/labels/CreateLabelModal";
import EditLabelModal from "@/components/labels/EditLabelModal";
import InviteCollaboratorToLabelModal from "@/components/labels/InviteCollaboratorToLabelModal";
import { PageHeader } from "@/components/layout/PageHeader";

export default function LabelsTable() {
  const library = useLabelsLibrary();
  const {
    loading,
    error,
    reload,
    items,
    allItems,
    sourceLabels,
    totals,
    search,
    setSearch,
    sortBy,
    setSortBy,
    hasFilters,
    clearAllFilters,
    showOnlyIncomplete,
  } = library;

  const [showCreate, setShowCreate] = useState(false);
  const [splitTarget, setSplitTarget] = useState<LabelListItem | null>(null);
  const [editing, setEditing] = useState<LabelListItem | null>(null);
  const [deleting, setDeleting] = useState<LabelListItem | null>(null);
  const [inviting, setInviting] = useState<LabelListItem | null>(null);

  const isEmpty = allItems.length === 0;
  const showToPay = viewerIsAccountOwner();
  const pendingSongs = totals.coverage.total - totals.coverage.withSplits;

  return (
    <>
      <div className="flex flex-col gap-6 px-4 lg:pl-4 lg:pr-8">
        {/* Encabezado, en la barra superior como el resto del panel */}
        <PageHeader>
          <div className="flex flex-col gap-1">
            <h1 className="truncate font-display text-[32px] font-light leading-[38px] tracking-[-0.015em] text-white sm:text-[40px] sm:leading-[46px]">
              Sellos
            </h1>
            <p className="flex flex-wrap items-center gap-2 text-sm text-white/65">
              <span>
                {allItems.length} {allItems.length === 1 ? "sello" : "sellos"}
              </span>
              <span className="text-white/50">·</span>
              <span>{totals.songs.toLocaleString()} canciones agrupadas</span>
              {pendingSongs > 0 && (
                <>
                  <span className="text-white/50">·</span>
                  <button
                    onClick={showOnlyIncomplete}
                    className="font-semibold text-[#FF8A3D] underline-offset-2 transition-colors hover:text-[#FFB48A] hover:underline"
                  >
                    {pendingSongs.toLocaleString()} sin repartir
                  </button>
                </>
              )}
            </p>
          </div>
        </PageHeader>

        <div className="flex flex-wrap items-center gap-3">
          <label className="glass-control relative flex w-full items-center gap-2.5 rounded-full px-[18px] py-[11px] focus-within:ring-2 focus-within:ring-[#FF5C00]/70 sm:w-[320px]">
            <Search className="h-4 w-4 flex-shrink-0 text-white/50" />
            <input
              type="text"
              placeholder="Buscar sello…"
              aria-label="Buscar sello"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border-none bg-transparent p-0 text-[12.5px] text-white placeholder:text-white/50 focus:outline-none focus:ring-0"
            />
          </label>
          <button
            onClick={() => setShowCreate(true)}
            className="flex flex-shrink-0 items-center gap-2 px-[18px] py-[11px] rounded-full bg-[#FF5C00] text-[12.5px] font-semibold text-white shadow-[0_8px_20px_-6px_rgba(255,92,0,0.35)] transition-colors hover:bg-[#EA580C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            <Plus className="h-[15px] w-[15px]" />
            Nuevo sello
          </button>
        </div>

        {error && (
          <div className="glass flex items-center gap-2.5 rounded-2xl px-4 py-3">
            <TriangleAlert className="h-4 w-4 flex-shrink-0 text-[#FF8F92]" />
            <span className="flex-1 text-[12.5px] text-white/80">{error}</span>
            <button
              onClick={reload}
              className="glass-control rounded-full px-3.5 py-1.5 text-[11.5px] font-semibold text-white hover:bg-white/[0.12]"
            >
              Reintentar
            </button>
          </div>
        )}

        {loading ? (
          <TableSkeleton showToPay={showToPay} />
        ) : isEmpty ? (
          <FirstLabelState onCreate={() => setShowCreate(true)} />
        ) : (
          <>
            <LabelsKpis
              customCount={totals.customCount}
              artisticCount={totals.artisticCount}
              songsCount={totals.songs}
              totalStreams={totals.streams}
              totalNetIncome={totals.netIncome}
              ownerEarnings={totals.ownerEarnings}
              totalToPay={showToPay ? totals.totalToPay : undefined}
              coverage={totals.coverage}
              onShowIncomplete={pendingSongs > 0 ? showOnlyIncomplete : undefined}
            />

            <LabelsFilterBar
              typeFilter={library.typeFilter}
              onTypeFilterChange={library.setTypeFilter}
              customCount={totals.customCount}
              artisticCount={totals.artisticCount}
              coverageFilter={library.coverageFilter}
              onCoverageFilterChange={library.setCoverageFilter}
              sortBy={sortBy}
              onSortChange={setSortBy}
              hasFilters={hasFilters}
              onClearAll={clearAllFilters}
            />

            {items.length === 0 ? (
              <NoResultsState
                search={search}
                hasFilters={hasFilters}
                onClearFilters={clearAllFilters}
                onClearSearch={() => setSearch("")}
              />
            ) : (
              <div className="glass overflow-hidden rounded-[28px]">
                <TableHeader sortBy={sortBy} onSortChange={setSortBy} showToPay={showToPay} />
                <div className="h-px bg-white/[0.09]" />
                <LabelSections
                  items={items}
                  onCreateSplits={setSplitTarget}
                  onEdit={setEditing}
                  onInvite={setInviting}
                  onDelete={setDeleting}
                />
                <div className="h-px bg-white/[0.09]" />
                <div className="px-5 py-3.5">
                  <span className="text-[12px] text-white/65">
                    {items.length}
                    {items.length === allItems.length ? "" : ` de ${allItems.length}`}{" "}
                    {items.length === 1 ? "sello" : "sellos"} ·{" "}
                    {totals.coverage.withSplits.toLocaleString()} de{" "}
                    {totals.coverage.total.toLocaleString()} canciones con split
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modales */}
      <CreateLabelModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        availableLabels={sourceLabels}
        onSuccess={reload}
      />

      {splitTarget &&
        (splitTarget.isCustom ? (
          <CreateSplitsByCustomLabelModal
            isOpen
            onGlass
            onClose={() => {
              setSplitTarget(null);
              reload();
            }}
            labelName={splitTarget.name}
            artisticLabels={splitTarget.artisticLabels}
            songCount={splitTarget.songCount}
            alreadyWithSplit={splitTarget.coverage.withSplits}
          />
        ) : (
          <CreateSplitsByLabelModal
            isOpen
            onGlass
            onClose={() => {
              setSplitTarget(null);
              reload();
            }}
            labelId={splitTarget.id}
            label={splitTarget.name}
            songCount={splitTarget.songCount}
            alreadyWithSplit={splitTarget.coverage.withSplits}
          />
        ))}

      {(editing || deleting) && (
        <EditLabelModal
          isOpen
          initialMode={deleting ? "delete" : "edit"}
          onClose={() => {
            setEditing(null);
            setDeleting(null);
          }}
          labelId={(editing ?? deleting)!.id}
          currentName={(editing ?? deleting)!.name}
          currentArtisticLabelIds={(editing ?? deleting)!.artisticLabelIds}
          availableLabels={sourceLabels}
          onSuccess={() => {
            reload();
            setEditing(null);
            setDeleting(null);
          }}
          onDelete={() => {
            reload();
            setEditing(null);
            setDeleting(null);
          }}
        />
      )}

      {inviting && (
        <InviteCollaboratorToLabelModal
          isOpen
          onGlass
          onClose={() => setInviting(null)}
          labelType={inviting.isCustom ? "custom" : "artistic"}
          labelIdentifier={inviting.id}
          labelName={inviting.name}
          songCount={inviting.songCount}
          onSuccess={reload}
        />
      )}
    </>
  );
}

/**
 * Las filas, partidas en dos bloques con encabezado propio.
 *
 * La separación es el punto del rediseño: un sello personalizado agrupa sellos
 * artísticos, y esa relación antes solo se insinuaba con un fondo naranja. El
 * encabezado solo aparece cuando el bloque tiene contenido, así que al filtrar
 * por un tipo la tabla se queda limpia.
 */
function LabelSections({
  items,
  onCreateSplits,
  onEdit,
  onInvite,
  onDelete,
}: {
  items: LabelListItem[];
  onCreateSplits: (item: LabelListItem) => void;
  onEdit: (item: LabelListItem) => void;
  onInvite: (item: LabelListItem) => void;
  onDelete: (item: LabelListItem) => void;
}) {
  const custom = items.filter((item) => item.isCustom);
  const artistic = items.filter((item) => !item.isCustom);
  const bothVisible = custom.length > 0 && artistic.length > 0;

  const groups = [
    {
      key: "custom",
      items: custom,
      title: "PERSONALIZADOS",
      description: "Los que tú creaste agrupando varios sellos artísticos",
    },
    {
      key: "artistic",
      items: artistic,
      title: "ARTÍSTICOS",
      description: "Detectados en los reportes de tus distribuidoras",
    },
  ].filter((group) => group.items.length > 0);

  return (
    <>
      {groups.map((group) => (
        <div key={group.key}>
          {bothVisible && (
            <div className="flex flex-wrap items-center gap-2.5 border-y border-white/[0.06] bg-white/[0.04] px-5 py-2.5">
              <span className="font-mono text-[9.5px] font-semibold tracking-[1.2px] text-white/80">
                {group.title}
              </span>
              <span className="rounded-full bg-white/[0.10] px-1.5 py-px font-mono text-[10px] font-semibold text-white/70">
                {group.items.length}
              </span>
              <span className="hidden text-[11.5px] text-white/50 sm:inline">
                {group.description}
              </span>
            </div>
          )}
          <div className="flex flex-col divide-y divide-white/[0.09]">
            {group.items.map((item) => (
              <LabelRow
                key={`${item.isCustom ? "custom" : "artistic"}-${item.id}`}
                item={item}
                onCreateSplits={onCreateSplits}
                onEdit={onEdit}
                onInvite={onInvite}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

/** Cabecera de la tabla: cada columna ordena y marca el criterio activo. */
function TableHeader({
  sortBy,
  onSortChange,
  showToPay,
}: {
  sortBy: LabelSortBy;
  onSortChange: (value: LabelSortBy) => void;
  showToPay: boolean;
}) {
  return (
    <div className={`${labelsGrid(showToPay)} px-5 py-3`}>
      <div className="flex min-w-0">
        <ColumnButton
          label="SELLO"
          active={sortBy === "name_asc"}
          descending={false}
          onClick={() => onSortChange(NEXT_SORT.name(sortBy))}
        />
      </div>
      {labelColumns(showToPay).map((column) => {
        const active = Boolean(column.sortKeys?.includes(sortBy));
        return (
          <div key={column.key} className={column.visibility}>
            {column.sortKeys ? (
              <ColumnButton
                label={column.label}
                active={active}
                descending={isDescending(sortBy)}
                onClick={() => onSortChange(NEXT_SORT[column.key](sortBy))}
              />
            ) : (
              <ColumnLabel>{column.label}</ColumnLabel>
            )}
          </div>
        );
      })}
      <div />
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
        active ? "text-[#FF8A3D]" : "text-white/50 hover:text-white/80"
      }`}
    >
      <span className="font-mono text-[9.5px] font-medium tracking-[1.2px]">{label}</span>
      {active && (descending ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />)}
    </button>
  );
}

function ColumnLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[9.5px] font-medium tracking-[1.2px] text-white/50">
      {children}
    </span>
  );
}

/** Tabla fantasma: conserva las columnas mientras llegan los datos. */
function TableSkeleton({ showToPay }: { showToPay: boolean }) {
  const widths = ["w-[148px]", "w-[112px]", "w-[168px]", "w-[130px]"];
  return (
    <div className="glass overflow-hidden rounded-[28px]" aria-busy="true" aria-label="Cargando sellos">
      <div className={`${labelsGrid(showToPay)} px-5 py-3`}>
        <div className="min-w-0">
          <ColumnLabel>SELLO</ColumnLabel>
        </div>
        {labelColumns(showToPay).map((column) => (
          <div key={column.key} className={column.visibility}>
            <ColumnLabel>{column.label}</ColumnLabel>
          </div>
        ))}
        <div />
      </div>
      <div className="h-px bg-white/[0.09]" />
      <div className="flex flex-col divide-y divide-white/[0.09]">
        {widths.map((width, index) => (
          <div key={width} className={`${labelsGrid(showToPay)} px-5 py-3.5`}>
            <div className="flex min-w-0 items-center gap-3">
              <div className="h-[42px] w-[42px] flex-shrink-0 animate-pulse rounded-[14px] bg-white/[0.08]" />
              <div className="flex flex-1 flex-col gap-2">
                <div className={`h-2.5 animate-pulse rounded-full bg-white/[0.08] ${width}`} />
                <div
                  className={`h-2 animate-pulse rounded-full bg-white/[0.05] ${
                    index % 2 ? "w-[84px]" : "w-[108px]"
                  }`}
                />
              </div>
            </div>
            {labelColumns(showToPay).map((column) => (
              <div key={column.key} className={column.visibility}>
                <div className="h-2.5 w-[70%] animate-pulse rounded-full bg-white/[0.08]" />
              </div>
            ))}
            <div className="flex justify-end gap-1.5">
              <div className="h-8 w-[92px] animate-pulse rounded-full bg-white/[0.08]" />
              <div className="h-8 w-8 animate-pulse rounded-full bg-white/[0.08]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Pantalla vacía: explica de dónde salen los sellos, no solo ofrece un botón. */
function FirstLabelState({ onCreate }: { onCreate: () => void }) {
  return (
    <section className="glass flex flex-col items-center gap-5 rounded-[32px] px-6 py-[46px] sm:px-10">
      <div className="flex h-[60px] w-[60px] items-center justify-center rounded-[22px] bg-[#FF5C00]/15">
        <Tag className="h-[26px] w-[26px] text-[#FF8A3D]" />
      </div>
      <div className="flex flex-col items-center gap-1.5">
        <h2 className="font-display text-[19px] font-medium text-white">
          Todavía no hay sellos
        </h2>
        <p className="max-w-[520px] text-center text-[12.5px] leading-relaxed text-white/65">
          Los sellos artísticos aparecen solos en cuanto tus distribuidoras reporten canciones. Los
          personalizados los creas tú para agrupar varios sellos y repartir splits de una sola vez.
        </p>
      </div>
      <button
        onClick={onCreate}
        className="mt-1 flex items-center gap-2 px-5 py-3 rounded-full bg-[#FF5C00] text-[12.5px] font-semibold text-white shadow-[0_8px_20px_-6px_rgba(255,92,0,0.35)] transition-colors hover:bg-[#EA580C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
      >
        <Plus className="h-[15px] w-[15px]" />
        Nuevo sello
      </button>
    </section>
  );
}

/** Sin resultados: dice qué está limitando la vista y ofrece deshacerlo. */
function NoResultsState({
  search,
  hasFilters,
  onClearFilters,
  onClearSearch,
}: {
  search: string;
  hasFilters: boolean;
  onClearFilters: () => void;
  onClearSearch: () => void;
}) {
  const searching = search.trim() !== "";
  return (
    <section className="glass flex flex-col items-center gap-3 rounded-[32px] px-6 py-[50px]">
      <div className="flex h-[52px] w-[52px] items-center justify-center rounded-[18px] bg-white/[0.08]">
        <SearchX className="h-[22px] w-[22px] text-white/65" />
      </div>
      <h3 className="font-display text-base font-medium text-white">
        {searching ? `Ningún sello coincide con «${search}»` : "Ningún sello coincide"}
      </h3>
      <p className="text-center text-[12.5px] text-white/65">
        {hasFilters
          ? "Hay filtros puestos que pueden estar dejando fuera lo que buscas."
          : "Prueba con otro nombre."}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1.5">
        {hasFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#FF5C00] text-[12.5px] font-semibold text-white shadow-[0_8px_20px_-6px_rgba(255,92,0,0.35)] transition-colors hover:bg-[#EA580C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            <FunnelX className="h-3.5 w-3.5" />
            Limpiar filtros
          </button>
        )}
        {searching && (
          <button
            onClick={onClearSearch}
            className="px-4 py-2.5 glass-control rounded-full text-[12.5px] font-semibold text-white transition-colors hover:bg-white/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70"
          >
            Borrar búsqueda
          </button>
        )}
      </div>
    </section>
  );
}
