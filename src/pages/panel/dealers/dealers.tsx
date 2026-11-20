import { useState } from "react";
import {
  Search,
  Plus,
  Handshake,
  SearchX,
  CirclePlus,
  FileUp,
  ChartPie,
  ArrowUp,
  ArrowDown,
  FunnelX,
  TriangleAlert,
} from "lucide-react";
import { distributorsService } from "@/services/distributorsService";
import { useDistributorsLibrary } from "@/hooks/useDistributorsLibrary";
import { DistributorsKpis } from "@/components/distributors/DistributorsKpis";
import { RevenueShareBar } from "@/components/distributors/RevenueShareBar";
import { YearCoverageCard } from "@/components/distributors/YearCoverageCard";
import { DistributorsFilterBar } from "@/components/distributors/DistributorsFilterBar";
import { DistributorRow } from "@/components/distributors/DistributorRow";
import { CoverageLegend } from "@/components/distributors/CoverageStrip";
import { DeleteDistributorDialog } from "@/components/distributors/DeleteDistributorDialog";
import {
  DISTRIBUTOR_COLUMNS,
  DISTRIBUTORS_GRID,
  NEXT_SORT,
  isDescending,
  type DistributorSortBy,
} from "@/components/distributors/distributorsColumns";
import type { DistributorListItem } from "@/components/distributors/types";
import CreateDistributorModal from "@/components/ui/CreateDistributorModal";
import EditDistributorModal from "@/components/ui/EditDistributorModal";
import UploadSongsModal from "@/components/ui/UploadSongsModal";
import { formatGaps } from "@/utils/coverage.utils";
import { PageHeader } from "@/components/layout/PageHeader";

export default function Dealers() {
  const library = useDistributorsLibrary();
  const {
    loading,
    error,
    reload,
    items,
    allItems,
    totals,
    year,
    setYear,
    years,
    upToMonth,
    search,
    setSearch,
    sortBy,
    setSortBy,
    hasFilters,
    clearAllFilters,
    missingMonths,
    globalGaps,
  } = library;

  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<DistributorListItem | null>(null);
  const [deleting, setDeleting] = useState<DistributorListItem | null>(null);
  const [uploadTarget, setUploadTarget] = useState<DistributorListItem | null>(null);

  const isEmpty = allItems.length === 0;

  /** Deja a la vista solo los distribuidores a los que les falta algún mes. */
  const showOnlyGaps = () => {
    library.setCoverageFilter("with_gaps");
    library.setSortBy("coverage_asc");
  };

  return (
    <>
      <div className="flex flex-col gap-6 px-4 lg:pl-4 lg:pr-8">
        {/* Encabezado, en la barra superior como el resto del panel */}
        <PageHeader>
          <div className="flex flex-col gap-1">
            <h1 className="truncate font-display text-[32px] font-light leading-[38px] tracking-[-0.015em] text-white sm:text-[40px] sm:leading-[46px]">
              Distribuidores
            </h1>
            <p className="flex flex-wrap items-center gap-2 text-sm text-white/65">
              <span>
                {allItems.length} {allItems.length === 1 ? "distribuidor" : "distribuidores"}
              </span>
              <span className="text-white/50">·</span>
              <span>{totals.uploadCount} cargas</span>
              {missingMonths > 0 && (
                <>
                  <span className="text-white/50">·</span>
                  <button
                    onClick={showOnlyGaps}
                    className="font-semibold text-[#FF8A3D] underline-offset-2 transition-colors hover:text-[#FFB48A] hover:underline"
                  >
                    {missingMonths} {missingMonths === 1 ? "mes" : "meses"} sin cubrir
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
              placeholder="Buscar distribuidor o proveedor…"
              aria-label="Buscar distribuidor o proveedor"
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
            Nuevo distribuidor
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
          <TableSkeleton />
        ) : isEmpty ? (
          <FirstDistributorState onCreate={() => setShowCreate(true)} />
        ) : (
          <>
            <DistributorsKpis
              distributorsCount={allItems.length}
              songsCount={totals.songsCount}
              totalNetIncome={totals.totalNetIncome}
              totalGrossIncome={totals.totalGrossIncome}
              totalStreams={totals.totalStreams}
              missingMonths={missingMonths}
              gapsLabel={formatGaps(globalGaps)}
              year={year}
              onShowGaps={missingMonths > 0 ? showOnlyGaps : undefined}
            />

            <div className="flex flex-col gap-5 lg:flex-row">
              <RevenueShareBar
                className="min-w-0 flex-1"
                slices={allItems.map((item) => ({
                  id: item.distributor._id,
                  name: item.distributor.name,
                  amount: item.kpi?.totalNetIncome ?? 0,
                  color: item.color,
                }))}
              />
              <YearCoverageCard
                countByMonth={library.countByMonth}
                distributorsCount={allItems.length}
                gaps={globalGaps}
                year={year}
                years={years}
                onYearChange={setYear}
                upToMonth={upToMonth}
                onShowGaps={missingMonths > 0 ? showOnlyGaps : undefined}
              />
            </div>

            <DistributorsFilterBar
              currencyFilter={library.currencyFilter}
              onCurrencyFilterChange={library.setCurrencyFilter}
              providerFilter={library.providerFilter}
              onProviderFilterChange={library.setProviderFilter}
              providers={library.providers}
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
                <TableHeader sortBy={sortBy} onSortChange={setSortBy} />
                <div className="h-px bg-white/[0.09]" />
                <div className="flex flex-col divide-y divide-white/[0.09]">
                  {items.map((item) => (
                    <DistributorRow
                      key={item.distributor._id}
                      item={item}
                      year={year}
                      upToMonth={upToMonth}
                      onUpload={setUploadTarget}
                      onEdit={setEditing}
                      onDelete={setDeleting}
                    />
                  ))}
                </div>
                <div className="h-px bg-white/[0.09]" />
                <div className="flex flex-col items-start justify-between gap-3 px-5 py-3.5 sm:flex-row sm:items-center">
                  <span className="text-[12px] text-white/65">
                    {items.length}
                    {items.length === allItems.length ? "" : ` de ${allItems.length}`}{" "}
                    {items.length === 1 ? "distribuidor" : "distribuidores"} ·{" "}
                    {totals.uploadCount} cargas · {totals.songsCount.toLocaleString()} canciones
                  </span>
                  <div className="hidden xl:block">
                    <CoverageLegend />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showCreate && (
        <CreateDistributorModal
          existingNames={allItems.map((item) => item.distributor.name)}
          onClose={() => setShowCreate(false)}
          onConfirm={async (payload) => {
            const created = await distributorsService.create(payload);
            await reload();
            // Un distribuidor recién creado no sirve de nada vacío: se encadena
            // con la subida de su primer reporte.
            setUploadTarget({
              distributor: created,
              kpi: null,
              color: "#FF5C00",
              uploads: [],
              covered: new Set(),
              gaps: [],
              missingMonths: 0,
              shareOfTotal: 0,
              shareOfMax: 0,
            });
          }}
        />
      )}

      {editing && (
        <EditDistributorModal
          distributor={editing.distributor}
          onClose={() => setEditing(null)}
          onConfirm={async (payload) => {
            await distributorsService.update(editing.distributor._id, payload);
            await reload();
          }}
        />
      )}

      {deleting && (
        <DeleteDistributorDialog
          item={deleting}
          onClose={() => setDeleting(null)}
          onConfirm={async () => {
            await distributorsService.remove(deleting.distributor._id);
            await reload();
          }}
        />
      )}

      {uploadTarget && (
        <UploadSongsModal
          distributorName={uploadTarget.distributor.name}
          distributorLogo={uploadTarget.distributor.photoUrl}
          distributorCurrency={uploadTarget.distributor.currency}
          existingUploads={uploadTarget.uploads}
          onClose={() => setUploadTarget(null)}
          onConfirm={async (file, period, currency, onProgress, onProcessingProgress) => {
            const result = await distributorsService.uploadSongs(
              uploadTarget.distributor._id,
              file,
              period,
              currency,
              onProgress,
              onProcessingProgress,
            );
            await reload();
            return result;
          }}
        />
      )}
    </>
  );
}

/** Cabecera de la tabla: cada columna ordena y marca el criterio activo. */
function TableHeader({
  sortBy,
  onSortChange,
}: {
  sortBy: DistributorSortBy;
  onSortChange: (v: DistributorSortBy) => void;
}) {
  return (
    <div className={`${DISTRIBUTORS_GRID} px-5 py-3`}>
      <div className="flex min-w-0">
        <ColumnButton
          label="DISTRIBUIDOR"
          active={sortBy === "name_asc"}
          descending={false}
          onClick={() => onSortChange(NEXT_SORT.name(sortBy))}
        />
      </div>
      {DISTRIBUTOR_COLUMNS.map((column) => {
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
function TableSkeleton() {
  const widths = ["w-[148px]", "w-[112px]", "w-[168px]", "w-[130px]"];
  return (
    <div className="glass overflow-hidden rounded-[28px]" aria-busy="true" aria-label="Cargando distribuidores">
      <div className={`${DISTRIBUTORS_GRID} px-5 py-3`}>
        <div className="min-w-0">
          <ColumnLabel>DISTRIBUIDOR</ColumnLabel>
        </div>
        {DISTRIBUTOR_COLUMNS.map((column) => (
          <div key={column.key} className={column.visibility}>
            <ColumnLabel>{column.label}</ColumnLabel>
          </div>
        ))}
        <div />
      </div>
      <div className="h-px bg-white/[0.09]" />
      <div className="flex flex-col divide-y divide-white/[0.09]">
        {widths.map((width, index) => (
          <div key={width} className={`${DISTRIBUTORS_GRID} px-5 py-3.5`}>
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
            {DISTRIBUTOR_COLUMNS.map((column) => (
              <div key={column.key} className={column.visibility}>
                <div className="h-2.5 w-[70%] animate-pulse rounded-full bg-white/[0.08]" />
              </div>
            ))}
            <div className="flex justify-end gap-1.5">
              <div className="h-8 w-8 animate-pulse rounded-full bg-white/[0.08]" />
              <div className="h-8 w-8 animate-pulse rounded-full bg-white/[0.08]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const ONBOARDING_STEPS = [
  {
    icon: <CirclePlus className="h-3.5 w-3.5 text-[#FF8A3D]" />,
    title: "Conecta la cuenta",
    detail: "DistroKid, TuneCore, CD Baby…",
  },
  {
    icon: <FileUp className="h-3.5 w-3.5 text-[#FF8A3D]" />,
    title: "Sube el reporte",
    detail: "CSV o Excel, tal cual lo descargas",
  },
  {
    icon: <ChartPie className="h-3.5 w-3.5 text-[#FF8A3D]" />,
    title: "Ve el reparto",
    detail: "Ingresos por canción y colaborador",
  },
];

/** Pantalla vacía: explica el modelo completo, no solo ofrece un botón. */
function FirstDistributorState({ onCreate }: { onCreate: () => void }) {
  return (
    <section className="glass flex flex-col items-center gap-5 rounded-[32px] px-6 py-[46px] sm:px-10">
      <div className="flex h-[60px] w-[60px] items-center justify-center rounded-[22px] bg-[#FF5C00]/15">
        <Handshake className="h-[26px] w-[26px] text-[#FF8A3D]" />
      </div>
      <div className="flex flex-col items-center gap-1.5">
        <h2 className="font-display text-[19px] font-medium text-white">
          Conecta tu primer distribuidor
        </h2>
        <p className="max-w-[520px] text-center text-[12.5px] leading-relaxed text-white/65">
          Splitme lee los reportes de regalías que ya descargas y reparte los ingresos entre tus
          colaboradores.
        </p>
      </div>

      <ol className="grid w-full max-w-[740px] grid-cols-1 gap-3 pt-2 sm:grid-cols-3">
        {ONBOARDING_STEPS.map((step, index) => (
          <li key={step.title} className="flex flex-col gap-2 rounded-[18px] bg-white/[0.06] p-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-[#FF5C00]/[0.16]">
                {step.icon}
              </span>
              <span className="font-mono text-[10px] font-semibold tracking-[1px] text-white/50">
                0{index + 1}
              </span>
            </div>
            <span className="text-[12.5px] font-semibold text-white">{step.title}</span>
            <span className="text-[11px] leading-snug text-white/50">{step.detail}</span>
          </li>
        ))}
      </ol>

      <button
        onClick={onCreate}
        className="mt-2 flex items-center gap-2 px-5 py-3 rounded-full bg-[#FF5C00] text-[12.5px] font-semibold text-white shadow-[0_8px_20px_-6px_rgba(255,92,0,0.35)] transition-colors hover:bg-[#EA580C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
      >
        <Plus className="h-[15px] w-[15px]" />
        Conectar distribuidor
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
        {searching ? `Sin resultados para «${search}»` : "Ningún distribuidor coincide"}
      </h3>
      <p className="text-center text-[12.5px] text-white/65">
        {hasFilters
          ? "Hay filtros puestos que pueden estar dejando fuera lo que buscas."
          : "Prueba con otro nombre o proveedor."}
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
