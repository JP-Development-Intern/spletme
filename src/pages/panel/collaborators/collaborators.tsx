import { useMemo, useState } from "react";
import { Search, UserPlus, TriangleAlert, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useCollaboratorsLibrary } from "@/hooks/useCollaboratorsLibrary";
import { useCollaboratorSongs } from "@/hooks/useCollaboratorSongs";
import { CollaboratorsSummaryStrip } from "@/components/collaborators/CollaboratorsSummaryStrip";
import { CollaboratorDial, type MoneyView } from "@/components/collaborators/CollaboratorDial";
import { CollaboratorSongsPanel } from "@/components/collaborators/CollaboratorSongsPanel";
import { CollaboratorDetailModal } from "@/components/collaborators/CollaboratorDetailModal";
import {
  CollaboratorPaymentModal,
  type PaymentTarget,
} from "@/components/modal/CollaboratorPaymentModal";
import { AddCollaboratorSidebar } from "./components/AddCollaboratorSidebar";
import { collaboratorColor } from "@/utils/collaborators.utils";
import { formatCurrency } from "@/utils/format.utils";
import LocalStorageService from "@/services/localstorage";
import type { Collaborator } from "@/types";

/**
 * Colaboradores: un resumen de lo que se reparte, un carrusel para recorrer a
 * las personas una a una y, debajo, las canciones que compartes con la que está
 * enfocada.
 */
export default function Collaborators() {
  const {
    loading,
    error,
    reload,
    refresh,
    collaborators,
    visible,
    payable,
    blocked,
    totals,
    search,
    setSearch,
    sortBy,
    setSortBy,
  } = useCollaboratorsLibrary();

  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [view, setView] = useState<MoneyView>("out");
  const [profileOf, setProfileOf] = useState<Collaborator | null>(null);
  const [payTargets, setPayTargets] = useState<PaymentTarget[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const currentUser = LocalStorageService.getItem("user");
  const userRole = String(currentUser?.role ?? "").toLowerCase();
  const canAddCollaborator = !currentUser?.parentUserId || userRole === "label";

  /** El color de cada persona es estable: se deriva de su sitio en el catálogo. */
  const colorOf = useMemo(() => {
    const map = new Map<string, string>();
    collaborators.forEach((c, index) => map.set(c.id, collaboratorColor(index)));
    return (id: string) => map.get(id) ?? "#FF5C00";
  }, [collaborators]);

  // Si la persona enfocada sale de la lista (por la búsqueda), el carrusel
  // vuelve al principio.
  const focusIndex = Math.max(
    0,
    visible.findIndex((c) => c.id === focusedId),
  );
  const focused = visible[focusIndex] ?? null;

  const sharedSongs = useCollaboratorSongs(focused?.id ?? null);

  const toTarget = (c: Collaborator): PaymentTarget => ({
    id: c.id,
    name: c.name,
    email: c.email,
    pending: c.amountPending,
  });

  return (
    <div className="flex flex-col gap-6 px-4 lg:pl-4 lg:pr-8">
      <PageHeader>
        <div className="flex flex-col gap-1">
          <h1 className="truncate font-display text-[32px] font-light leading-[38px] tracking-[-0.015em] text-white sm:text-[40px] sm:leading-[46px]">
            Colaboradores
          </h1>
          {!loading && collaborators.length > 0 && (
            <p className="flex flex-wrap items-center gap-2 text-sm text-white/65">
              <span>
                {collaborators.length} {collaborators.length === 1 ? "persona" : "personas"}
              </span>
              <span className="text-white/50">·</span>
              <span>{totals.activeSplits} splits activos</span>
              {totals.totalPending > 0 && (
                <>
                  <span className="text-white/50">·</span>
                  <span className="font-semibold text-[#FF8A3D]">
                    {formatCurrency(totals.totalPending)} por pagar
                  </span>
                </>
              )}
            </p>
          )}
        </div>
      </PageHeader>

      <div className="flex flex-wrap items-center gap-3">
        <label className="glass-control relative flex w-full items-center gap-2.5 rounded-full px-[18px] py-[11px] focus-within:ring-2 focus-within:ring-[#FF5C00]/70 sm:w-[280px]">
          <Search className="h-4 w-4 flex-shrink-0 text-white/50" />
          <input
            type="text"
            placeholder="Buscar por nombre o correo…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Buscar colaboradores"
            className="w-full border-none bg-transparent p-0 text-[12.5px] text-white placeholder:text-white/50 focus:outline-none focus:ring-0"
          />
        </label>
        {canAddCollaborator && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex flex-shrink-0 items-center gap-2 rounded-full bg-[#FF5C00] px-[18px] py-[11px] text-[12.5px] font-semibold text-white shadow-[0_8px_20px_-6px_rgba(255,92,0,0.35)] transition-colors hover:bg-[#EA580C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            <UserPlus className="h-[15px] w-[15px]" />
            Invitar a una canción
          </button>
        )}
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
        <PageSkeleton />
      ) : collaborators.length === 0 ? (
        !error && <FirstCollaborator onInvite={canAddCollaborator ? () => setSidebarOpen(true) : undefined} />
      ) : (
        <>
          <CollaboratorsSummaryStrip
            totalCollaborators={totals.totalCollaborators}
            people={totals.people}
            labels={totals.labels}
            activeSplits={totals.activeSplits}
            songsWithSplits={totals.songsWithActiveSplits}
            totalPaid={totals.totalPaid}
            totalPending={totals.totalPending}
            payable={payable}
            blocked={blocked}
            onPayAll={() => setPayTargets(payable.map(toTarget))}
          />

          {focused ? (
            <>
              <CollaboratorDial
                collaborators={visible}
                focusIndex={focusIndex}
                onFocusIndexChange={(index) => setFocusedId(visible[index]?.id ?? null)}
                colorOf={colorOf}
                sortBy={sortBy}
                onSortChange={setSortBy}
                view={view}
                onViewChange={setView}
                shared={
                  sharedSongs.totals
                    ? { streams: sharedSongs.totals.totalStreams, netIncome: sharedSongs.totals.totalNetIncome }
                    : null
                }
                sharedLoading={sharedSongs.loading}
                onOpenProfile={setProfileOf}
                onPay={(c) => setPayTargets([toTarget(c)])}
              />

              <CollaboratorSongsPanel
                collaborator={focused}
                color={colorOf(focused.id)}
                view={view}
                songs={view === "out" ? sharedSongs.byPending : sharedSongs.byIncome}
                loading={sharedSongs.loading}
                failed={sharedSongs.failed}
                onRetry={sharedSongs.retry}
              />
            </>
          ) : (
            <NoMatch search={search} onClear={() => setSearch("")} />
          )}
        </>
      )}

      {profileOf && (
        <CollaboratorDetailModal
          collaborator={profileOf}
          onClose={() => setProfileOf(null)}
          onPay={(c) => {
            setProfileOf(null);
            setPayTargets([toTarget(c)]);
          }}
          isOwner
        />
      )}

      <CollaboratorPaymentModal
        isOpen={payTargets.length > 0}
        targets={payTargets}
        onClose={() => setPayTargets([])}
        onPaymentSuccess={refresh}
      />

      <AddCollaboratorSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </div>
  );
}

/** Primera vez: todavía no hay nadie con quien repartir. */
function FirstCollaborator({ onInvite }: { onInvite?: () => void }) {
  return (
    <section className="glass flex flex-col items-center gap-4 rounded-[32px] px-6 py-14 text-center">
      <span className="flex h-[60px] w-[60px] items-center justify-center rounded-[22px] bg-[#FF5C00]/15">
        <Users className="h-[26px] w-[26px] text-[#FF8A3D]" />
      </span>
      <div className="flex flex-col gap-1.5">
        <h2 className="font-display text-[19px] font-medium text-white">
          Todavía no compartes regalías con nadie
        </h2>
        <p className="max-w-[540px] text-[12.5px] leading-relaxed text-white/65">
          Cuando invitas a alguien a una de tus canciones, aparece aquí con su parte del reparto y lo
          que le vas debiendo.
        </p>
      </div>
      {onInvite && (
        <button
          onClick={onInvite}
          className="flex items-center gap-2 rounded-full bg-[#FF5C00] px-[18px] py-[11px] text-[12.5px] font-semibold text-white transition-colors hover:bg-[#EA580C]"
        >
          <UserPlus className="h-[15px] w-[15px]" />
          Invitar a una canción
        </button>
      )}
    </section>
  );
}

/** La búsqueda no encuentra a nadie: el carrusel no tiene a quién enseñar. */
function NoMatch({ search, onClear }: { search: string; onClear: () => void }) {
  return (
    <section className="glass flex flex-col items-center gap-3 rounded-[32px] px-6 py-12 text-center">
      <Search className="h-6 w-6 text-white/50" />
      <p className="text-sm font-semibold text-white">Nadie coincide con «{search}»</p>
      <button
        onClick={onClear}
        className="glass-control rounded-full px-4 py-2 text-[12.5px] font-semibold text-white hover:bg-white/[0.12]"
      >
        Limpiar búsqueda
      </button>
    </section>
  );
}

/** Mientras llegan los datos: las tres superficies de la página, vacías. */
function PageSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Cargando colaboradores">
      <div className="glass h-[220px] animate-pulse rounded-[28px] xl:h-[208px]" />
      <div className="glass flex h-[480px] flex-col items-center justify-center gap-6 rounded-[32px]">
        <span className="h-[168px] w-[168px] animate-pulse rounded-full bg-white/[0.08]" />
        <span className="h-6 w-40 animate-pulse rounded-full bg-white/[0.08]" />
      </div>
      <div className="glass h-[320px] animate-pulse rounded-[32px]" />
    </div>
  );
}
