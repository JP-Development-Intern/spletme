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
  LABEL_COLUMNS,
  LABELS_GRID,
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
  const pendingSongs = totals.coverage.total - totals.coverage.withSplits;

  return (
    <div className="min-h-full bg-[#F7F7F9]">
      <div className="flex flex-col gap-5 px-4 py-6 lg:px-8">
        {/* Encabezado */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-0.5">
            <h1 className="font-display text-2xl font-semibold text-[#1C1D22]">Sellos</h1>
            <p className="flex flex-wrap items-center gap-2 text-[13px] text-[#71757E]">
              <span>
                {allItems.length} {allItems.length === 1 ? "sello" : "sellos"}
              </span>
              <span className="text-[#A6AAB2]">·</span>
              <span>{totals.songs.toLocaleString()} canciones agrupadas</span>
              {pendingSongs > 0 && (
                <>
                  <span className="text-[#A6AAB2]">·</span>
                  <button
                    onClick={showOnlyIncomplete}
                    className="font-semibold text-[#FF5C00] transition-colors hover:text-[#EA580C]"
                  >
                    {pendingSongs.toLocaleString()} sin repartir
                  </button>
                </>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-[290px]">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A6AAB2]"
                size={16}
              />
              <input
                type="text"
                placeholder="Buscar sello…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-[22px] border border-[#E8E8EC] bg-white py-2.5 pl-11 pr-4 text-[12.5px] text-[#1C1D22] placeholder:text-[#A6AAB2] focus:border-[#FF5C00] focus:outline-none focus:ring-[3px] focus:ring-[#FF5C00]/15"
              />
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="flex flex-shrink-0 items-center gap-2 rounded-[22px] bg-[#FF5C00] px-[18px] py-2.5 text-[12.5px] font-semibold text-white shadow-[0_6px_16px_-4px_rgba(255,92,0,0.4)] transition-colors hover:bg-[#EA580C]"
            >
              <Plus className="h-[15px] w-[15px]" />
              Nuevo sello
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2.5 rounded-2xl border border-[#F5C2C4] bg-[#FDECEC] px-4 py-3">
            <TriangleAlert className="h-4 w-4 flex-shrink-0 text-[#E5484D]" />
            <span className="flex-1 text-[12.5px] text-[#E5484D]">{error}</span>
            <button
              onClick={reload}
              className="rounded-full bg-white px-3.5 py-1.5 text-[11.5px] font-semibold text-[#E5484D]"
            >
              Reintentar
            </button>
          </div>
        )}

        {loading ? (
          <TableSkeleton />
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
              totalToPay={viewerIsAccountOwner() ? totals.totalToPay : undefined}
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
              <div className="overflow-hidden rounded-[26px] border border-[#E8E8EC] bg-white shadow-[0_10px_28px_-12px_rgba(255,92,0,0.15)]">
                <TableHeader sortBy={sortBy} onSortChange={setSortBy} />
                <div className="h-px bg-[#E8E8EC]" />
                <LabelSections
                  items={items}
                  onCreateSplits={setSplitTarget}
                  onEdit={setEditing}
                  onInvite={setInviting}
                  onDelete={setDeleting}
                />
                <div className="h-px bg-[#E8E8EC]" />
                <div className="px-5 py-3.5">
                  <span className="text-[12px] text-[#71757E]">
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
            onClose={() => {
              setSplitTarget(null);
              reload();
            }}
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
          labelId={(editing ?? deleting)!.id ?? ""}
          currentName={(editing ?? deleting)!.name}
          currentArtisticLabels={(editing ?? deleting)!.artisticLabels}
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
          onClose={() => setInviting(null)}
          labelType={inviting.isCustom ? "custom" : "artistic"}
          labelIdentifier={inviting.isCustom ? (inviting.id ?? "") : inviting.name}
          labelName={inviting.name}
          songCount={inviting.songCount}
          onSuccess={reload}
        />
      )}
    </div>
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
            <div className="flex flex-wrap items-center gap-2.5 bg-[#F4F5F7] px-5 py-2.5">
              <span className="font-mono text-[9.5px] font-semibold tracking-[1.2px] text-[#1C1D22]">
                {group.title}
              </span>
              <span className="rounded-[10px] bg-white px-1.5 py-px font-mono text-[10px] font-semibold text-[#71757E]">
                {group.items.length}
              </span>
              <span className="hidden text-[11.5px] text-[#A6AAB2] sm:inline">
                {group.description}
              </span>
            </div>
          )}
          <div className="flex flex-col divide-y divide-[#E8E8EC]">
            {group.items.map((item) => (
              <LabelRow
                key={`${item.isCustom ? "custom" : "artistic"}-${item.id ?? item.name}`}
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
}: {
  sortBy: LabelSortBy;
  onSortChange: (value: LabelSortBy) => void;
}) {
  return (
    <div className={`${LABELS_GRID} px-5 py-3`}>
      <div className="flex min-w-0">
        <ColumnButton
          label="SELLO"
          active={sortBy === "name_asc"}
          descending={false}
          onClick={() => onSortChange(NEXT_SORT.name(sortBy))}
        />
      </div>
      {LABEL_COLUMNS.map((column) => {
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
        active ? "text-[#FF5C00]" : "text-[#A6AAB2] hover:text-[#71757E]"
      }`}
    >
      <span className="font-mono text-[9.5px] font-medium tracking-[1.2px]">{label}</span>
      {active && (descending ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />)}
    </button>
  );
}

function ColumnLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[9.5px] font-medium tracking-[1.2px] text-[#A6AAB2]">
      {children}
    </span>
  );
}

/** Tabla fantasma: conserva las columnas mientras llegan los datos. */
function TableSkeleton() {
  const widths = ["w-[148px]", "w-[112px]", "w-[168px]", "w-[130px]"];
  return (
    <div className="overflow-hidden rounded-[26px] border border-[#E8E8EC] bg-white">
      <div className={`${LABELS_GRID} px-5 py-3`}>
        <div className="min-w-0">
          <ColumnLabel>SELLO</ColumnLabel>
        </div>
        {LABEL_COLUMNS.map((column) => (
          <div key={column.key} className={column.visibility}>
            <ColumnLabel>{column.label}</ColumnLabel>
          </div>
        ))}
        <div />
      </div>
      <div className="h-px bg-[#E8E8EC]" />
      <div className="flex flex-col divide-y divide-[#E8E8EC]">
        {widths.map((width, index) => (
          <div key={width} className={`${LABELS_GRID} px-5 py-3.5`}>
            <div className="flex min-w-0 items-center gap-3">
              <div className="h-[42px] w-[42px] flex-shrink-0 animate-pulse rounded-[14px] bg-[#F4F5F7]" />
              <div className="flex flex-1 flex-col gap-2">
                <div className={`h-2.5 animate-pulse rounded-full bg-[#F4F5F7] ${width}`} />
                <div
                  className={`h-2 animate-pulse rounded-full bg-[#F4F5F7]/70 ${
                    index % 2 ? "w-[84px]" : "w-[108px]"
                  }`}
                />
              </div>
            </div>
            {LABEL_COLUMNS.map((column) => (
              <div key={column.key} className={column.visibility}>
                <div className="h-2.5 w-[70%] animate-pulse rounded-full bg-[#F4F5F7]" />
              </div>
            ))}
            <div className="flex justify-end gap-1.5">
              <div className="h-8 w-[92px] animate-pulse rounded-full bg-[#F4F5F7]" />
              <div className="h-8 w-8 animate-pulse rounded-full bg-[#F4F5F7]" />
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
    <div className="flex flex-col items-center gap-5 rounded-[26px] border border-[#E8E8EC] bg-white px-6 py-[46px] sm:px-10">
      <div className="flex h-[60px] w-[60px] items-center justify-center rounded-[22px] bg-[#FFEADD]">
        <Tag className="h-[26px] w-[26px] text-[#FF5C00]" />
      </div>
      <div className="flex flex-col items-center gap-1.5">
        <h2 className="font-display text-[19px] font-semibold text-[#1C1D22]">
          Todavía no hay sellos
        </h2>
        <p className="max-w-[520px] text-center text-[12.5px] leading-relaxed text-[#71757E]">
          Los sellos artísticos aparecen solos en cuanto tus distribuidoras reporten canciones. Los
          personalizados los creas tú para agrupar varios sellos y repartir splits de una sola vez.
        </p>
      </div>
      <button
        onClick={onCreate}
        className="mt-1 flex items-center gap-2 rounded-[20px] bg-[#FF5C00] px-5 py-3 text-[13px] font-semibold text-white shadow-[0_6px_16px_-4px_rgba(255,92,0,0.4)] transition-colors hover:bg-[#EA580C]"
      >
        <Plus className="h-[15px] w-[15px]" />
        Nuevo sello
      </button>
    </div>
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
    <div className="flex flex-col items-center gap-3 rounded-[26px] border border-[#E8E8EC] bg-white px-6 py-[50px]">
      <div className="flex h-[52px] w-[52px] items-center justify-center rounded-[18px] bg-[#F4F5F7]">
        <SearchX className="h-[22px] w-[22px] text-[#71757E]" />
      </div>
      <h3 className="font-display text-base font-semibold text-[#1C1D22]">
        {searching ? `Ningún sello coincide con «${search}»` : "Ningún sello coincide"}
      </h3>
      <p className="text-center text-[12.5px] text-[#71757E]">
        {hasFilters
          ? "Hay filtros puestos que pueden estar dejando fuera lo que buscas."
          : "Prueba con otro nombre."}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1.5">
        {hasFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-1.5 rounded-2xl bg-[#FF5C00] px-4 py-2.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-[#EA580C]"
          >
            <FunnelX className="h-3.5 w-3.5" />
            Limpiar filtros
          </button>
        )}
        {searching && (
          <button
            onClick={onClearSearch}
            className="rounded-2xl border border-[#E8E8EC] bg-white px-4 py-2.5 text-[12.5px] font-semibold text-[#1C1D22] transition-colors hover:bg-[#F4F5F7]"
          >
            Borrar búsqueda
          </button>
        )}
      </div>
    </div>
  );
}
