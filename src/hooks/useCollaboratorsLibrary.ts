import { useCallback, useEffect, useMemo, useState } from "react";
import CollaboratorService from "@/services/collaborator";
import {
  collaboratorColor,
  initialsOf,
  resolveCollaboratorState,
} from "@/utils/collaborators.utils";
import type { Collaborator } from "@/types";
import type { CollaboratorSortBy } from "@/components/collaborators/collaboratorsSort";

/* ── Contrato del API ──────────────────────────────────────────────────────── */

interface ApiCollaborator {
  userId: string;
  id: string;
  name: string;
  email: string;
  roles: string[];
  songCount: number;
  songPresencePercentage: number;
  activeSplits: number;
  amountOwed: number;
  totalPaid: number;
  amountPending: number;
  paymentStatus: string;
  isActive: boolean;
  hasWallet: boolean;
  hasActiveStripeAccount: boolean;
}

interface ApiSummary {
  totalCollaborators: number;
  totalLabels: number;
  byRole: { collaborator: number; label: number };
  /** Canciones del catálogo del owner: el denominador de la presencia. */
  ownerTotalSongs: number;
  activeSplits: number;
  /** Canciones distintas que tienen algún split activo. */
  songsWithActiveSplits: number;
  totalAmountSent: number;
  totalPending: number;
  totalAmountReceived: number;
}

const resolveStatus = (raw: ApiCollaborator): Collaborator["status"] => {
  if (!raw.hasWallet) return "no_wallet";
  if (raw.paymentStatus === "pending") return "pending";
  return "active";
};

const adapt = (raw: ApiCollaborator, index: number): Collaborator => ({
  id: raw.userId,
  externalId: raw.id,
  name: raw.name,
  email: raw.email,
  initials: initialsOf(raw.name),
  // El color de identidad se deriva del orden, y es el mismo en la tabla, el
  // perfil y la lista de pagos.
  avatarBg: collaboratorColor(index),
  avatarText: "#FFFFFF",
  songs: raw.songCount,
  songPresencePercentage: raw.songPresencePercentage ?? 0,
  paid: raw.totalPaid,
  amountOwed: raw.amountOwed ?? 0,
  amountPending: raw.amountPending ?? 0,
  status: resolveStatus(raw),
  roles: raw.roles ?? [],
});

/**
 * Estado de la página de colaboradores: datos, búsqueda y orden.
 *
 * Los colaboradores y el resumen salen de `/collaborators/metrics`.
 */
export function useCollaboratorsLibrary() {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [summary, setSummary] = useState<ApiSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<CollaboratorSortBy>("pending_desc");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await CollaboratorService.getMetrics();
      const payload = response?.data as
        | { summary: ApiSummary; collaborators: ApiCollaborator[] }
        | undefined;

      if (!payload) {
        setError("No se pudieron cargar los colaboradores. Vuelve a intentarlo.");
        setCollaborators([]);
        setSummary(null);
        return;
      }

      setSummary(payload.summary);
      setCollaborators(payload.collaborators.map(adapt));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = useCallback(async () => {
    // Un pago cambia los saldos de todo el mundo.
    await load();
  }, [load]);

  /** Quienes tienen saldo pendiente y pueden recibirlo ya. */
  const payable = useMemo(
    () => collaborators.filter((c) => resolveCollaboratorState(c) === "can_pay"),
    [collaborators],
  );

  /** Quienes tienen saldo pendiente pero no pueden cobrarlo todavía. */
  const blocked = useMemo(
    () =>
      collaborators.filter(
        (c) => resolveCollaboratorState(c) === "no_payout_data" && c.amountPending > 0,
      ),
    [collaborators],
  );

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = query
      ? collaborators.filter((c) => `${c.name} ${c.email}`.toLowerCase().includes(query))
      : collaborators;

    return [...filtered].sort(comparators[sortBy]);
  }, [collaborators, search, sortBy]);

  const totals = useMemo(() => {
    const totalPaid = collaborators.reduce((sum, c) => sum + c.paid, 0);
    const totalPending = collaborators.reduce((sum, c) => sum + c.amountPending, 0);
    return {
      totalPaid,
      totalPending,
      // El resumen del API es la fuente para lo que él calcula; el resto se
      // deriva de la lista para que cuadre siempre con lo que se ve en la tabla.
      activeSplits: summary?.activeSplits ?? 0,
      songsWithActiveSplits: summary?.songsWithActiveSplits ?? 0,
      people: summary?.byRole?.collaborator ?? collaborators.length,
      labels: summary?.byRole?.label ?? 0,
      totalCollaborators: summary?.totalCollaborators ?? collaborators.length,
    };
  }, [collaborators, summary]);

  /**
   * El catálogo del owner, que es contra lo que se lee la presencia de cada
   * colaborador.
   *
   * Lo dice el servidor. Antes se tomaba aquí el máximo de canciones entre los
   * colaboradores, así que quien encabezaba la lista salía siempre como «N de
   * N» —parecía estar en todo el catálogo— y la fracción no cuadraba con el
   * porcentaje de su lado, que sí se calcula sobre el catálogo real.
   *
   * Si el servidor no lo manda se cae al máximo anterior: enseñar una fracción
   * contra cero sería peor que enseñar una imprecisa.
   */
  const catalogSize = useMemo(
    () =>
      summary?.ownerTotalSongs ??
      collaborators.reduce((max, c) => Math.max(max, c.songs), 0),
    [summary, collaborators],
  );

  return {
    loading,
    error,
    refresh,
    reload: load,
    collaborators,
    visible,
    payable,
    blocked,
    totals,
    catalogSize,
    search,
    setSearch,
    sortBy,
    setSortBy,
  };
}

type Comparator = (a: Collaborator, b: Collaborator) => number;

const comparators: Record<CollaboratorSortBy, Comparator> = {
  pending_desc: (a, b) => b.amountPending - a.amountPending || b.paid - a.paid,
  paid_desc: (a, b) => b.paid - a.paid,
  songs_desc: (a, b) => b.songs - a.songs,
  name_asc: (a, b) => a.name.localeCompare(b.name, "es"),
};
