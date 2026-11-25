import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ChevronRight,
  CircleCheck,
  HandCoins,
  Loader,
  Minus,
  Music,
  Pencil,
  Plus,
  Trash2,
  TriangleAlert,
  Wallet,
  ShieldCheck,
} from "lucide-react";
import CollaboratorService from "@/services/collaborator";
import { songSplitsService } from "@/services/songSplits";
import { PermissionsService } from "@/services/permissions";
import { SwitchTile } from "@/components/music/PermissionsModal";
import type { PermissionGrantKey, PermissionGrantee } from "@/types/permissions.types";
import { formatCurrency, formatStreams } from "@/utils/format.utils";
import {
  STATE_META,
  describeRoles,
  initialsOf,
  resolveCollaboratorState,
  settledPercentage,
  type CollaboratorState,
} from "@/utils/collaborators.utils";
import { ModalShell, PrimaryButton, SecondaryButton } from "@/components/ui/ModalShell";
import type { Collaborator } from "@/types";

/* ── Contrato del API ──────────────────────────────────────────────────────── */

interface ApiSong {
  songId: string;
  trackTitle: string;
  artistName: string;
  isrc: string;
  upc: string;
  coverUrl?: string | null;
  roles?: string[];
  totalStreams: number;
  totalNetIncome: number;
  totalGrossIncome: number;
  split: {
    splitId: string;
    percentage: number;
    totalOwed: number;
    totalPaid: number;
    pendingAmount: number;
  } | null;
}

interface ApiCollaboratorDetail {
  userId: string;
  userExternalId: string;
  email: string;
  name: string;
  roles: string[];
  invitedBy: { _id: string; name: string; email: string } | null;
  createdAt: string;
  songs: ApiSong[];
  /** Sólo llega cuando quien consulta es el owner del catálogo. */
  participation?: {
    songCount: number;
    ownerTotalSongs: number;
    /** Qué parte del catálogo del owner comparte con esta persona. */
    presencePercentage: number;
    avgSplitPercentage: number | null;
  };
}

interface PlatformEntry {
  platform: string;
  streams: number;
  netIncome: number;
  grossIncome: number;
}

interface SongMetrics {
  songId: string;
  trackTitle: string;
  totalStreams: number;
  totalNetIncome: number;
  totalGrossIncome: number;
  byPlatform: PlatformEntry[];
  split: {
    splitId: string;
    percentage: number;
    totalOwed: number;
    totalPaid: number;
    pendingAmount: number;
  } | null;
}

interface CollaboratorMetrics {
  songs: SongMetrics[];
  totals: {
    totalStreams: number;
    totalNetIncome: number;
    totalOwed: number;
    totalPaid: number;
    pendingAmount: number;
    byPlatform: PlatformEntry[];
  };
}

interface SplitHistoryEntry {
  _id: string;
  action: "create" | "update" | "delete";
  percentage: number;
  version: number;
  createdAt: string;
  updatedBy?: { name?: string; username?: string; email?: string };
}

interface CollaboratorDetailModalProps {
  collaborator: Collaborator;
  onClose: () => void;
  /** Abre el pago desde el perfil. Ausente cuando el modal se abre solo a consultar. */
  onPay?: (collaborator: Collaborator) => void;
  isOwner?: boolean;
}

const PERM_VIEW_OPTIONS: { key: PermissionGrantKey; label: string }[] = [
  { key: "viewIncome", label: "Ver ingresos" },
  { key: "viewStreams", label: "Ver streams" },
  { key: "viewCollaborators", label: "Ver colaboradores" },
  { key: "viewDocuments", label: "Ver documentos" },
];

const PERM_LABEL_OPTIONS: { key: PermissionGrantKey; label: string }[] = [
  { key: "canEditSplits", label: "Editar splits" },
  { key: "canInviteCollaborators", label: "Invitar colaboradores" },
  { key: "canViewOwnerData", label: "Ver datos del owner" },
];

const PLATFORM_COLORS = ["#2FB37E", "#1C1D22", "#E5484D", "#0B7DDA", "#7C5CFF", "#A6AAB2"];

const STATE_ICON: Record<CollaboratorState, React.ReactNode> = {
  can_pay: <CircleCheck className="h-2.5 w-2.5" />,
  no_payout_data: <Wallet className="h-2.5 w-2.5" />,
  settled: <CircleCheck className="h-2.5 w-2.5" />,
  no_activity: <Minus className="h-2.5 w-2.5" />,
};

/**
 * Perfil de un colaborador: qué le corresponde, en qué canciones y qué se le ha
 * pagado ya. Al abrir una canción se entra a su detalle, con el reparto por
 * plataforma y el historial de cambios de su split.
 */
export function CollaboratorDetailModal({
  collaborator,
  onClose,
  onPay,
  isOwner = true,
}: CollaboratorDetailModalProps) {
  const [detail, setDetail] = useState<ApiCollaboratorDetail | null>(null);
  const [metrics, setMetrics] = useState<CollaboratorMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const [selectedSong, setSelectedSong] = useState<ApiSong | null>(null);
  const [history, setHistory] = useState<SplitHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [globalGrantee, setGlobalGrantee] = useState<PermissionGrantee | null>(null);
  const [globalPermLoading, setGlobalPermLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setFailed(false);

    Promise.all([
      CollaboratorService.getById(collaborator.id),
      CollaboratorService.getSongMetrics(collaborator.id),
    ])
      .then(([detailRes, metricsRes]) => {
        if (!alive) return;
        const payload: ApiCollaboratorDetail | null = detailRes?.data ?? null;
        if (payload) setDetail(payload);
        else setFailed(true);
        setMetrics(metricsRes?.data ?? null);
      })
      .catch(() => alive && setFailed(true))
      .finally(() => alive && setLoading(false));

    return () => {
      alive = false;
    };
  }, [collaborator.id]);

  useEffect(() => {
    if (!isOwner) return;
    let alive = true;
    setGlobalPermLoading(true);
    PermissionsService.list("all", "*")
      .then((list) => {
        if (!alive) return;
        const emailLower = (collaborator.email ?? "").toLowerCase();
        const match =
          list.find(
            (g) =>
              g.userId === collaborator.id ||
              (emailLower !== "" && g.email?.toLowerCase() === emailLower),
          ) ?? null;
        setGlobalGrantee(match);
      })
      .catch(() => {
        if (alive) setGlobalGrantee(null);
      })
      .finally(() => {
        if (alive) setGlobalPermLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [collaborator.id, collaborator.email, isOwner]);

  const toggleGlobalPermission = async (key: PermissionGrantKey) => {
    if (!globalGrantee) return;
    const next = !globalGrantee.grants[key];
    const prev = globalGrantee;
    setGlobalGrantee({
      ...globalGrantee,
      grants: { ...globalGrantee.grants, [key]: next },
    });
    try {
      await PermissionsService.set("all", "*", globalGrantee.userId, {
        ...globalGrantee.grants,
        [key]: next,
      });
    } catch {
      setGlobalGrantee(prev);
    }
  };

  useEffect(() => {
    if (!selectedSong) return;
    let alive = true;
    setHistory([]);
    setHistoryLoading(true);

    songSplitsService
      .getSplitHistoryBySong(selectedSong.songId)
      .then((rows) => alive && setHistory((rows ?? []) as unknown as SplitHistoryEntry[]))
      .catch(() => alive && setHistory([]))
      .finally(() => alive && setHistoryLoading(false));

    return () => {
      alive = false;
    };
  }, [selectedSong]);

  /** Los importes salen de métricas, que ya vienen ajustados al split. */
  const paid = metrics?.totals.totalPaid ?? collaborator.paid;
  const pending = metrics?.totals.pendingAmount ?? collaborator.amountPending;
  const songs = useMemo(() => detail?.songs ?? [], [detail]);
  const state = resolveCollaboratorState(collaborator);
  const meta = STATE_META[state];

  /**
   * Qué parte del catálogo se comparte con esta persona: 200 de 1.000 canciones
   * son un 20%. No es el % de split —ese varía canción a canción y se ve en cada
   * una—, sino el alcance del colaborador dentro del repertorio propio.
   * El backend sólo lo calcula para el owner; a un participante no le consta el
   * tamaño del catálogo ajeno.
   */
  const participation = detail?.participation ?? null;

  /** Primero las canciones que deben dinero: son las que se vienen a mirar. */
  const sortedSongs = useMemo(
    () =>
      [...songs].sort(
        (a, b) => (b.split?.pendingAmount ?? 0) - (a.split?.pendingAmount ?? 0),
      ),
    [songs],
  );

  const metricsBySong = useMemo(
    () => new Map((metrics?.songs ?? []).map((s) => [s.songId, s])),
    [metrics],
  );

  if (selectedSong) {
    return (
      <SongView
        song={selectedSong}
        metrics={metricsBySong.get(selectedSong.songId) ?? null}
        collaboratorId={collaborator.id}
        collaboratorEmail={collaborator.email}
        collaboratorName={collaborator.name}
        isOwner={isOwner}
        history={history}
        historyLoading={historyLoading}
        onBack={() => setSelectedSong(null)}
        onClose={onClose}
      />
    );
  }

  return (
    <ModalShell
      title={collaborator.name}
      subtitle={
        <span className="flex flex-wrap items-center gap-2">
          <span>{collaborator.email}</span>
          {describeRoles(collaborator.roles).map((badge) => (
            <span
              key={badge.role}
              className={`rounded-xl px-2 py-0.5 text-[10.5px] font-semibold ${
                badge.isLabel ? "bg-[#F4F5F7] text-[#71757E]" : "bg-[#FFEADD] text-[#FF5C00]"
              }`}
            >
              {badge.long}
            </span>
          ))}
          <span
            className="inline-flex items-center gap-1 rounded-xl px-2 py-0.5 text-[10.5px] font-semibold"
            style={{ backgroundColor: meta.bg, color: meta.fg }}
          >
            {STATE_ICON[state]}
            {meta.label}
          </span>
        </span>
      }
      width="lg"
      onClose={onClose}
      logo={
        <span
          className="flex h-[52px] w-[52px] flex-shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: collaborator.avatarBg || "#FF5C00" }}
        >
          <span className="text-[17px] font-semibold text-white">
            {collaborator.initials || initialsOf(collaborator.name)}
          </span>
        </span>
      }
      footer={
        <>
          <span className="flex-1 text-[11px] text-[#A6AAB2]">
            {songs.length} {songs.length === 1 ? "canción compartida" : "canciones compartidas"}
          </span>
          <SecondaryButton onClick={onClose}>Cerrar</SecondaryButton>
          {isOwner && onPay && (
            <PrimaryButton
              onClick={() => onPay(collaborator)}
              disabled={state !== "can_pay"}
              icon={<HandCoins className="h-[15px] w-[15px]" />}
            >
              {pending > 0 ? `Pagar ${formatCurrency(pending)}` : "Sin saldo pendiente"}
            </PrimaryButton>
          )}
        </>
      }
    >
      {failed ? (
        <p className="flex items-center gap-2.5 rounded-[14px] bg-[#FDECEC] px-3.5 py-3 text-[12px] text-[#E5484D]">
          <TriangleAlert className="h-4 w-4 flex-shrink-0" />
          No se pudo cargar el perfil. Cierra y vuelve a intentarlo.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <Metric label="CANCIONES" value={loading ? "—" : String(songs.length)} />
            <Metric
              label="PARTICIPACIÓN"
              value={
                loading || !participation ? "—" : `${Math.round(participation.presencePercentage)}%`
              }
              hint={
                participation
                  ? `${participation.songCount} de ${participation.ownerTotalSongs} canciones`
                  : undefined
              }
            />
            <Metric
              label="YA PAGADO"
              value={loading ? "—" : formatCurrency(paid)}
              color="#2FB37E"
            />
            <Metric
              label="POR PAGAR"
              value={loading ? "—" : formatCurrency(pending)}
              color="#FF5C00"
            />
          </div>

          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[12.5px] font-semibold text-[#1C1D22]">Estado de cuenta</span>
              <span className="font-mono text-[11.5px] font-semibold text-[#71757E]">
                {Math.round(settledPercentage(paid, pending))}% saldado
              </span>
            </div>
            <span className="flex h-2.5 w-full overflow-hidden rounded-full bg-[#F4F5F7]">
              {paid > 0 && (
                <span
                  className="h-full bg-[#2FB37E]"
                  style={{ width: `${settledPercentage(paid, pending)}%` }}
                />
              )}
              {pending > 0 && <span className="h-full flex-1 bg-[#FF5C00]" />}
            </span>
            <div className="flex flex-wrap items-center gap-4">
              <Legend color="#2FB37E" label="Pagado" value={formatCurrency(paid)} />
              <Legend color="#FF5C00" label="Por pagar" value={formatCurrency(pending)} />
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[12.5px] font-semibold text-[#1C1D22]">
                Canciones donde participa
                <span className="rounded-[10px] bg-[#F4F5F7] px-2 py-0.5 font-mono text-[10px] font-semibold text-[#71757E]">
                  {songs.length}
                </span>
              </span>
              <span className="text-[11px] text-[#A6AAB2]">Mayor pendiente primero</span>
            </div>

            {loading ? (
              <div className="flex flex-col gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-[58px] animate-pulse rounded-[15px] bg-[#F4F5F7]" />
                ))}
              </div>
            ) : songs.length === 0 ? (
              <p className="rounded-[15px] bg-[#F4F5F7] px-4 py-6 text-center text-[12px] text-[#71757E]">
                Todavía no participa en ninguna canción.
              </p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {sortedSongs.map((song) => (
                  <li key={song.songId}>
                    <button
                      onClick={() => setSelectedSong(song)}
                      className="flex w-full items-center gap-3 rounded-[15px] bg-[#F4F5F7] px-3.5 py-2.5 text-left transition-colors hover:bg-[#E8E8EC]"
                    >
                      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-[11px] bg-white">
                        {song.coverUrl ? (
                          <img src={song.coverUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <Music className="h-[15px] w-[15px] text-[#A6AAB2]" />
                        )}
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="truncate text-[12.5px] font-semibold text-[#1C1D22]">
                          {song.trackTitle}
                        </span>
                        <span className="truncate text-[10.5px] text-[#A6AAB2]">
                          {song.artistName}
                        </span>
                      </span>
                      <span className="flex-shrink-0 rounded-xl bg-[#FFEADD] px-2.5 py-1 font-mono text-[11px] font-semibold text-[#FF5C00]">
                        {song.split ? `${song.split.percentage}%` : "—"}
                      </span>
                      <span className="w-[86px] flex-shrink-0 text-right font-mono text-[12.5px] font-semibold text-[#1C1D22]">
                        {formatCurrency(song.split?.pendingAmount ?? 0)}
                      </span>
                      <ChevronRight className="h-4 w-4 flex-shrink-0 text-[#A6AAB2]" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {isOwner && (
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-[12.5px] font-semibold text-[#1C1D22]">
                  <ShieldCheck className="h-4 w-4 text-[#FF5C00]" />
                  Permisos globales del usuario
                </span>
                <span className="text-[11px] text-[#A6AAB2]">Todo tu catálogo</span>
              </div>
              {globalPermLoading ? (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="h-[46px] animate-pulse rounded-[14px] bg-[#F4F5F7]" />
                  ))}
                </div>
              ) : !globalGrantee ? (
                <p className="rounded-[15px] bg-[#F4F5F7] px-4 py-4 text-[12px] text-[#71757E]">
                  No hay permisos configurados para este usuario todavía.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {PERM_VIEW_OPTIONS.map(({ key, label }) => (
                    <SwitchTile
                      key={key}
                      onGlass={false}
                      label={label}
                      checked={Boolean(globalGrantee.grants[key])}
                      onChange={() => toggleGlobalPermission(key)}
                    />
                  ))}
                  {globalGrantee.role === "label" &&
                    PERM_LABEL_OPTIONS.map(({ key, label }) => (
                      <SwitchTile
                        key={key}
                        onGlass={false}
                        label={label}
                        checked={Boolean(globalGrantee.grants[key])}
                        onChange={() => toggleGlobalPermission(key)}
                      />
                    ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </ModalShell>
  );
}

/* ── Vista de una canción ──────────────────────────────────────────────────── */

function SongView({
  song,
  metrics,
  collaboratorId,
  collaboratorEmail,
  collaboratorName,
  isOwner,
  history,
  historyLoading,
  onBack,
  onClose,
}: {
  song: ApiSong;
  metrics: SongMetrics | null;
  collaboratorId: string;
  collaboratorEmail: string;
  collaboratorName: string;
  isOwner: boolean;
  history: SplitHistoryEntry[];
  historyLoading: boolean;
  onBack: () => void;
  onClose: () => void;
}) {
  const [songGrantee, setSongGrantee] = useState<PermissionGrantee | null>(null);
  const [songPermLoading, setSongPermLoading] = useState(false);

  useEffect(() => {
    if (!isOwner || !song.songId) return;
    let alive = true;
    setSongPermLoading(true);
    PermissionsService.list("song", song.songId)
      .then((list) => {
        if (!alive) return;
        const emailLower = (collaboratorEmail ?? "").toLowerCase();
        const match =
          list.find(
            (g) =>
              g.userId === collaboratorId ||
              (emailLower !== "" && g.email?.toLowerCase() === emailLower),
          ) ?? null;
        setSongGrantee(match);
      })
      .catch(() => {
        if (alive) setSongGrantee(null);
      })
      .finally(() => {
        if (alive) setSongPermLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [isOwner, song.songId, collaboratorId, collaboratorEmail]);

  const toggleSongPermission = async (key: PermissionGrantKey) => {
    if (!songGrantee) return;
    const next = !songGrantee.grants[key];
    const prev = songGrantee;
    setSongGrantee({
      ...songGrantee,
      grants: { ...songGrantee.grants, [key]: next },
      explicit: { ...(songGrantee.explicit ?? {}), [key]: next },
    });
    try {
      await PermissionsService.set("song", song.songId, songGrantee.userId, {
        ...songGrantee.grants,
        [key]: next,
      });
    } catch {
      setSongGrantee(prev);
    }
  };
  const streams = metrics?.totalStreams ?? song.totalStreams;
  const net = metrics?.totalNetIncome ?? song.totalNetIncome;
  const split = metrics?.split ?? song.split;
  // La plataforma que más paga va primero: la lista se lee como un ranking,
  // no como el orden en que el backend haya agrupado los hechos.
  const platforms = useMemo(
    () => [...(metrics?.byPlatform ?? [])].sort((a, b) => b.netIncome - a.netIncome),
    [metrics],
  );
  const maxNet = Math.max(1, ...platforms.map((p) => p.netIncome));

  return (
    <ModalShell
      title={song.trackTitle}
      subtitle={`${song.artistName}${song.isrc ? ` · ${song.isrc}` : ""}`}
      width="lg"
      onClose={onClose}
      logo={
        <span className="flex items-center gap-2.5">
          <button
            onClick={onBack}
            aria-label="Volver al perfil"
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#F4F5F7] text-[#71757E] transition-colors hover:text-[#1C1D22]"
          >
            <ArrowLeft className="h-[15px] w-[15px]" />
          </button>
          <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-[14px] bg-[#F4F5F7]">
            {song.coverUrl ? (
              <img src={song.coverUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <Music className="h-[18px] w-[18px] text-[#A6AAB2]" />
            )}
          </span>
        </span>
      }
      footer={
        <>
          <span className="flex-1 text-[11px] text-[#A6AAB2]">
            El pago se hace por colaborador, no por canción
          </span>
          <SecondaryButton onClick={onBack}>Volver al perfil</SecondaryButton>
        </>
      }
    >
      <div className="flex flex-wrap items-center gap-3 rounded-[16px] bg-[#FFEADD] px-3.5 py-3">
        <span className="flex-1 text-[12px] font-semibold text-[#EA580C]">
          {collaboratorName} participa con un {split?.percentage ?? 0}% de esta canción
        </span>
        <span className="font-mono text-[12.5px] font-semibold text-[#FF5C00]">
          {formatCurrency(split?.pendingAmount ?? 0)} pendiente
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <Metric label="STREAMS" value={formatStreams(streams)} />
        <Metric label="INGRESO NETO" value={formatCurrency(net)} color="#2FB37E" />
        <Metric label="SU PARTE" value={formatCurrency(split?.totalOwed ?? 0)} />
        <Metric label="YA PAGADO" value={formatCurrency(split?.totalPaid ?? 0)} color="#71757E" />
      </div>

      {isOwner && (
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-[12.5px] font-semibold text-[#1C1D22]">
              <ShieldCheck className="h-4 w-4 text-[#FF5C00]" />
              Permisos personalizados en esta canción
            </span>
          </div>
          {songPermLoading ? (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-[46px] animate-pulse rounded-[14px] bg-[#F4F5F7]" />
              ))}
            </div>
          ) : !songGrantee ? (
            <p className="rounded-[15px] bg-[#F4F5F7] px-4 py-4 text-[12px] text-[#71757E]">
              Sin permisos configurables para este usuario en esta canción.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {PERM_VIEW_OPTIONS.map(({ key, label }) => (
                <SwitchTile
                  key={key}
                  onGlass={false}
                  label={label}
                  checked={Boolean(songGrantee.grants[key])}
                  inherited={
                    songGrantee.explicit ? songGrantee.explicit[key] === undefined : true
                  }
                  onChange={() => toggleSongPermission(key)}
                />
              ))}
              {songGrantee.role === "label" &&
                PERM_LABEL_OPTIONS.map(({ key, label }) => (
                  <SwitchTile
                    key={key}
                    onGlass={false}
                    label={label}
                    checked={Boolean(songGrantee.grants[key])}
                    inherited={
                      songGrantee.explicit ? songGrantee.explicit[key] === undefined : true
                    }
                    onChange={() => toggleSongPermission(key)}
                  />
                ))}
            </div>
          )}
        </div>
      )}

      {platforms.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[12.5px] font-semibold text-[#1C1D22]">
              De dónde vienen los ingresos
            </span>
            <span className="text-[11px] text-[#A6AAB2]">Ingreso neto de la canción</span>
          </div>
          <ul className="flex flex-col gap-2">
            {platforms.map((platform, index) => (
              <li key={platform.platform} className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2.5">
                  <span
                    className="h-2 w-2 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: PLATFORM_COLORS[index % PLATFORM_COLORS.length] }}
                  />
                  <span className="flex-1 truncate text-[12px] font-medium capitalize text-[#1C1D22]">
                    {platform.platform}
                  </span>
                  <span className="font-mono text-[10.5px] text-[#A6AAB2]">
                    {formatStreams(platform.streams)}
                  </span>
                  <span className="font-mono text-[12px] font-semibold text-[#1C1D22]">
                    {formatCurrency(platform.netIncome)}
                  </span>
                </div>
                <span className="h-1 w-full overflow-hidden rounded-full bg-[#F4F5F7]">
                  <span
                    className="block h-full rounded-full"
                    style={{
                      width: `${Math.max(2, (platform.netIncome / maxNet) * 100)}%`,
                      backgroundColor: PLATFORM_COLORS[index % PLATFORM_COLORS.length],
                    }}
                  />
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        <span className="text-[12.5px] font-semibold text-[#1C1D22]">Historial del split</span>
        {historyLoading ? (
          <p className="flex items-center gap-2 py-3 text-[11.5px] text-[#71757E]">
            <Loader className="h-3.5 w-3.5 animate-spin text-[#FF5C00]" />
            Cargando cambios…
          </p>
        ) : history.length === 0 ? (
          <p className="rounded-[15px] bg-[#F4F5F7] px-4 py-5 text-center text-[12px] text-[#71757E]">
            Sin cambios registrados en este split.
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {history.map((entry) => {
              const action = ACTION_META[entry.action] ?? ACTION_META.update;
              return (
                <li
                  key={entry._id}
                  className="flex items-start gap-3 rounded-[15px] bg-[#F4F5F7] px-3.5 py-3"
                >
                  <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-white">
                    <span style={{ color: action.color }}>{action.icon}</span>
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-[12px] font-semibold text-[#1C1D22]">
                        {action.label}
                      </span>
                      <span className="text-[11px] text-[#A6AAB2]">·</span>
                      <span className="font-mono text-[10.5px] text-[#A6AAB2]">
                        {formatDate(entry.createdAt)}
                      </span>
                    </span>
                    <span className="text-[11.5px] text-[#71757E]">
                      Porcentaje del {entry.percentage}%
                    </span>
                    {entry.updatedBy?.name && (
                      <span className="text-[10.5px] text-[#A6AAB2]">
                        por {entry.updatedBy.name}
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </ModalShell>
  );
}

const ACTION_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  create: { label: "Creado", color: "#2FB37E", icon: <Plus className="h-3.5 w-3.5" /> },
  update: { label: "Actualizado", color: "#FF5C00", icon: <Pencil className="h-3.5 w-3.5" /> },
  delete: { label: "Eliminado", color: "#E5484D", icon: <Trash2 className="h-3.5 w-3.5" /> },
};

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}

function Metric({
  label,
  value,
  color,
  hint,
}: {
  label: string;
  value: string;
  color?: string;
  /** Cómo se llega a la cifra, cuando el número solo no se explica. */
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-[16px] bg-[#F4F5F7] px-3.5 py-3">
      <span className="font-mono text-[9.5px] font-medium tracking-[1px] text-[#A6AAB2]">
        {label}
      </span>
      <span
        className="truncate font-mono text-[16px] font-semibold"
        style={{ color: color ?? "#1C1D22" }}
      >
        {value}
      </span>
      {hint && <span className="truncate text-[10.5px] text-[#A6AAB2]">{hint}</span>}
    </div>
  );
}

function Legend({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-[11px] text-[#71757E]">{label}</span>
      <span className="font-mono text-[11px] font-semibold" style={{ color }}>
        {value}
      </span>
    </span>
  );
}
