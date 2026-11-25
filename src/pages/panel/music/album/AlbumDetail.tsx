/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Disc3,
  Music,
  Play,
  DollarSign,
  Crown,
  CircleAlert,
  LayoutDashboard,
  ListMusic,
  Receipt,
  TriangleAlert,
  Funnel,
  ChevronRight,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { PermissionsModal } from "@/components/music/PermissionsModal";
import { RequestEditSplitButton } from "@/components/music/RequestEditSplitButton";
import { useAlbums } from "@/hooks/useAlbums";
import AlbumService from "@/services/albums";
import SongService from "@/services/songs";
import { accountingApi } from "@/services/accounting";
import { formatCurrency, formatStreams } from "@/utils/format.utils";
import { albumSplitCoverage, resolveIsOwner, getSongLabels, songLabelCount } from "@/utils/music.utils";
import { collaboratorColor } from "@/utils/collaborators.utils";
import LocalStorageService from "@/services/localstorage";
import {
  buildWaterfall,
  shareOwnerRate,
  distributable,
  type Share,
} from "@/utils/money.utils";
import { DetailHeader } from "@/components/music/DetailHeader";
import { DetailTabs, type DetailTab } from "@/components/music/DetailTabs";
import { MoneyWaterfall } from "@/components/music/MoneyWaterfall";
import { MyShareCard } from "@/components/music/MyShareCard";
import { SongLabelsBadge } from "@/components/music/SongLabelsBadge";
import { MetricConsole, type MetricChannel } from "@/components/ui/MetricConsole";
import { DetailSkeleton } from "@/components/music/DetailSkeleton";
import Platforms from "../song/components/platforms";
import Performance from "../song/components/performance";
import AlbumOwnerSplitModal from "./components/AlbumOwnerSplitModal";
import { InviteAlbumCollaboratorModal } from "./components/InviteAlbumCollaboratorModal";
import BulkCollaboratorSplitModal from "@/components/splits/BulkCollaboratorSplitModal";
import { viewerOwnsSong } from "@/utils/ownerVisibility";
import AlbumExtraordinaryCosts from "./components/AlbumExtraordinaryCosts";
import type { Album, AlbumTrack } from "@/models/album";
import type { AlbumItem } from "@/types/music.types";

interface ReproductionData {
  totalStreams: number;
  totalIncome: number;
  releasesCount: number;
  platform: string;
}

interface MonthlyMetric {
  month: string;
  streams: number;
  revenue: number;
}

type TabKey = "resumen" | "pistas" | "costos";

export default function AlbumDetail() {
  const { upc = "" } = useParams<{ upc: string }>();
  const { getAlbumByUPC } = useAlbums(null);

  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("resumen");
  const [splitModalOpen, setSplitModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [collabSplitOpen, setCollabSplitOpen] = useState(false);
  const [permissionsOpen, setPermissionsOpen] = useState(false);

  const currentUser = LocalStorageService.getItem("user");
  /**
   * Sólo el dueño invita. El álbum guarda `ownerId` como id pelado, así que la
   * comprobación se hace sobre una pista, que sí trae el usuario completo: es
   * el mismo dato con el que la página de canción decide lo mismo.
   */
  const isOwnerUser = useMemo(
    () => resolveIsOwner(album?.tracks?.[0], currentUser),
    [album, currentUser],
  );
  const isLabelAccount = String(currentUser?.role ?? "").toLowerCase() === "label";
  const canLabelEditSplits = Boolean(
    (album as { canEditSplits?: boolean; permissions?: { canEditSplits?: boolean } } | null)
      ?.canEditSplits ??
      (album as { permissions?: { canEditSplits?: boolean } } | null)?.permissions?.canEditSplits,
  );
  const [onlyWithoutSplit, setOnlyWithoutSplit] = useState(false);
  const [monthly, setMonthly] = useState<MonthlyMetric[]>([]);
  const [reproductions, setReproductions] = useState<ReproductionData[]>([]);
  const [expenses, setExpenses] = useState(0);
  const [expenseCount, setExpenseCount] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadAlbum = useCallback(async () => {
    if (!upc) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getAlbumByUPC(upc);
      if (data) setAlbum(data);
      else setError("No encontramos este álbum.");
    } catch {
      setError("No se pudo cargar el álbum.");
    } finally {
      setLoading(false);
    }
  }, [upc, getAlbumByUPC]);

  useEffect(() => {
    loadAlbum();
  }, [loadAlbum, refreshKey]);

  useEffect(() => {
    if (!upc) return;
    AlbumService.getAlbumMonthlyMetrics(upc, 12).then(setMonthly).catch(() => setMonthly([]));
  }, [upc]);

  /** Los egresos del álbum alimentan el escalón de costos de la cascada. */
  useEffect(() => {
    if (!upc) return;
    accountingApi
      .getByAlbumUpc(upc)
      .then((entries) => {
        const outflows = entries.filter((entry) => isExpense(entry.concept));
        setExpenses(outflows.reduce((sum, entry) => sum + Math.abs(entry.amount ?? 0), 0));
        setExpenseCount(outflows.length);
      })
      .catch(() => {
        setExpenses(0);
        setExpenseCount(0);
      });
  }, [upc, refreshKey]);

  /** Las plataformas del álbum se agregan sumando las de cada pista. */
  useEffect(() => {
    if (!album?.tracks?.length) return;
    let alive = true;

    Promise.allSettled(album.tracks.map((track) => SongService.getSong(track._id))).then(
      (results) => {
        if (!alive) return;
        const map = new Map<string, ReproductionData>();
        for (const result of results) {
          if (result.status !== "fulfilled" || !result.value) continue;
          const song = (result.value as any)?.data ?? result.value;
          for (const repro of (song?.reproductions ?? []) as ReproductionData[]) {
            const previous = map.get(repro.platform);
            map.set(
              repro.platform,
              previous
                ? {
                    ...previous,
                    totalStreams: previous.totalStreams + (repro.totalStreams || 0),
                    totalIncome: previous.totalIncome + (repro.totalIncome || 0),
                    releasesCount: previous.releasesCount + (repro.releasesCount || 0),
                  }
                : { ...repro },
            );
          }
        }
        setReproductions([...map.values()]);
      },
    );

    return () => {
      alive = false;
    };
  }, [album]);

  /** La serie del álbum, en la forma que dibuja el gráfico de rendimiento. */
  const monthlyEntries = useMemo(
    () =>
      monthly.map((entry) => ({
        name: entry.month,
        totalNetIncome: entry.revenue,
        totalStreams: entry.streams,
      })),
    [monthly],
  );

  const coverage = useMemo(
    () => (album ? albumSplitCoverage(album as AlbumItem) : { withSplit: 0, total: 0 }),
    [album],
  );

  const netIncome = Number(album?.totalNetIncome ?? 0);
  const grossIncome = Number(album?.totalGrossIncome ?? 0);
  const repartible = distributable(netIncome, expenses);

  const steps = useMemo(
    () =>
      buildWaterfall({
        grossIncome,
        netIncome,
        expenses,
        expenseCount,
        trackCount: coverage.total,
      }),
    [grossIncome, netIncome, expenses, expenseCount, coverage.total],
  );

  /** Lo que aportan las pistas que todavía no reparten: va entero al owner. */
  const unassignedIncome = useMemo(() => {
    const tracks = album?.tracks ?? [];
    return tracks
      .filter((track) => !track?.split && !(track as any)?.ownerId?.split)
      .reduce((sum, track) => sum + Number(track.totalNetIncome ?? 0), 0);
  }, [album]);

  /** Reparto agregado del álbum, ponderado por lo que aporta cada pista. */
  const shares = useMemo<Share[]>(() => {
    const tracks = album?.tracks ?? [];
    const byPerson = new Map<string, { name: string; role?: string; amount: number }>();

    for (const track of tracks) {
      const income = Number(track.totalNetIncome ?? 0);
      // Cada colaborador tiene su parte de la pista y el owner le retiene un
      // porcentaje de ella, que puede haber pactado distinto con cada uno; sin
      // pacto propio se le aplica el del split del owner.
      const ownerPct = Number((track as any)?.ownerId?.split?.percentage ?? 0);
      for (const collaborator of ((track as any)?.collaborators ?? []) as any[]) {
        const percentage = Number(collaborator?.split?.percentage ?? 0);
        if (percentage <= 0) continue;
        const key = String(collaborator?._id ?? collaborator?.name ?? "?");
        const previous = byPerson.get(key);
        const rate = shareOwnerRate({ ownerRate: collaborator?.split?.ownerRate ?? null }, ownerPct);
        const amount = ((income * percentage) / 100) * (1 - rate / 100);
        byPerson.set(key, {
          name: collaborator?.name ?? "Colaborador",
          role: collaborator?.roles?.[0],
          amount: (previous?.amount ?? 0) + amount,
        });
      }
    }

    const total = repartible || 1;
    return [...byPerson.entries()].map(([id, person], index) => ({
      id,
      name: person.name,
      role: person.role,
      percentage: Number(((person.amount / total) * 100).toFixed(1)),
      amount: person.amount,
      color: collaboratorColor(index + 1),
    }));
  }, [album, repartible]);

  /** Lo agregado de quien mira, cuando no es el dueño: su parte del álbum. */
  const myIds = [currentUser?.id, currentUser?._id, currentUser?.userId]
    .filter(Boolean)
    .map(String);
  const mine = shares.find((share) => myIds.includes(String(share.id)));
  const myAlbumShare = { percentage: mine?.percentage ?? 0, amount: mine?.amount ?? 0 };

  if (loading) return <DetailSkeleton label="Cargando el álbum" />;

  if (error || !album) {
    return (
      <section className="glass mx-4 flex flex-col items-center gap-3 rounded-[32px] px-6 py-14 text-center lg:ml-4 lg:mr-8">
        <span className="flex h-[60px] w-[60px] items-center justify-center rounded-[22px] bg-[#E5484D]/[0.14]">
          <TriangleAlert className="h-[24px] w-[24px] text-[#FF8F92]" />
        </span>
        <h2 className="font-display text-[19px] font-medium text-white">
          {error ?? "No se pudo cargar el álbum"}
        </h2>
        <p className="text-[12.5px] text-white/65">
          Puede que ya no exista o que la conexión haya fallado.
        </p>
        <div className="flex items-center gap-2.5 pt-1.5">
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="rounded-full bg-[#FF5C00] px-[18px] py-[11px] text-[12.5px] font-semibold text-white shadow-[0_8px_20px_-6px_rgba(255,92,0,0.35)] transition-colors hover:bg-[#EA580C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            Reintentar
          </button>
          <Link
            to="/panel/music?view=albums"
            className="glass-control rounded-full px-[18px] py-[11px] text-[12.5px] font-semibold text-white transition-colors hover:bg-white/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70"
          >
            Volver a Música
          </Link>
        </div>
      </section>
    );
  }

  const pending = Math.max(0, coverage.total - coverage.withSplit);
  const cover = album.coverImage?.[0]?.[0]?.url;

  const TABS: DetailTab<TabKey>[] = [
    { key: "resumen", label: "Resumen", icon: <LayoutDashboard className="h-[15px] w-[15px]" /> },
    {
      key: "pistas",
      label: "Pistas",
      icon: <ListMusic className="h-[15px] w-[15px]" />,
      count: coverage.total,
    },
    {
      key: "costos",
      label: "Costos",
      icon: <Receipt className="h-[15px] w-[15px]" />,
      count: expenseCount,
    },
  ];

  const channels: MetricChannel[] = [
    {
      key: "tracks",
      label: "Pistas",
      icon: <Music className="h-[15px] w-[15px] text-white" />,
      value: String(coverage.total),
      caption: `${coverage.withSplit} con split`,
    },
    {
      key: "streams",
      label: "Streams",
      icon: <Play className="h-[15px] w-[15px] text-white" />,
      value: formatStreams(album.totalStreams ?? 0),
    },
    // El ingreso del álbum y lo que queda sin repartir son cuentas del dueño:
    // junto al porcentaje propio delatan lo que se descuenta antes del reparto.
    // Ver `utils/ownerVisibility.ts`.
    ...(isOwnerUser
      ? [
          {
            key: "net",
            label: "Ingreso neto",
            icon: <DollarSign className="h-[15px] w-[15px] text-white" />,
            value: formatCurrency(netIncome),
            valueColor: "#45D39A",
            width: 300,
            caption: grossIncome > 0 ? `bruto ${formatCurrency(grossIncome)}` : undefined,
          } as MetricChannel,
        ]
      : []),
    {
      key: "coverage",
      label: "Split asignado",
      icon: <Crown className="h-[15px] w-[15px] text-white" />,
      value: coverage.total > 0 ? `${Math.round((coverage.withSplit / coverage.total) * 100)}%` : "—",
      caption: `${coverage.withSplit} de ${coverage.total} pistas`,
    },
    ...(isOwnerUser
      ? [
          {
            key: "earnings",
            label: "Tu ganancia",
            icon: <Crown className="h-[15px] w-[15px] text-white" />,
            value: formatCurrency(Number(album.ownerEarnings ?? 0) || 0),
            valueColor: "#FF8A3D",
            caption: "según tus splits",
          } as MetricChannel,
        ]
      : []),
    ...(isOwnerUser
      ? [
          {
            key: "unassigned",
            label: "Sin repartir",
            icon: <CircleAlert className="h-[15px] w-[15px] text-[#FF8A3D]" />,
            value: pending > 0 ? formatCurrency(unassignedIncome) : "Al día",
            highlight: true,
            width: 270,
            caption:
              pending > 0
                ? `${pending} ${pending === 1 ? "pista va entera" : "pistas van enteras"} a ti`
                : "todas las pistas reparten",
          } as MetricChannel,
        ]
      : []),
  ];

  const visibleTracks = onlyWithoutSplit
    ? album.tracks.filter((track) => !track?.split && !(track as any)?.ownerId?.split)
    : album.tracks;

  return (
    <>
      <div className="flex flex-col gap-5 px-4 lg:pl-4 lg:pr-8">
        <DetailHeader
          backTo="/panel/music?view=albums"
          cover={cover}
          fallbackIcon={<Disc3 className="h-9 w-9 text-white/50" />}
          title={album.albumTitle}
          codeLabel="UPC"
          code={album.upc}
          meta={
            <>
              <span>{album.artistName}</span>
              <span className="text-white/40">·</span>
              <span>
                {coverage.total} {coverage.total === 1 ? "pista" : "pistas"}
              </span>
            </>
          }
          actions={
            <>
              {/* Invitar es reversible y previo al reparto, así que va en
                  secundario: la acción con peso de la página sigue siendo
                  asignar el split. */}
              {isOwnerUser && (
                <button
                  onClick={() => setCollabSplitOpen(true)}
                  disabled={coverage.total === 0}
                  className="glass-control flex min-h-[44px] items-center gap-2 rounded-full px-[18px] py-[11px] text-[12.5px] font-semibold text-white transition-colors enabled:hover:bg-white/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70 disabled:cursor-not-allowed disabled:text-white/40"
                >
                  <Users className="h-[15px] w-[15px] text-white/70" />
                  Split de colaborador
                </button>
              )}
              {isOwnerUser && (
                <button
                  onClick={() => setPermissionsOpen(true)}
                  className="glass-control flex min-h-[44px] items-center gap-2 rounded-full px-[18px] py-[11px] text-[12.5px] font-semibold text-white transition-colors hover:bg-white/[0.12]"
                >
                  <ShieldCheck className="h-[15px] w-[15px] text-[#FF8A3D]" />
                  Permisos
                </button>
              )}
              {isLabelAccount && !isOwnerUser && !canLabelEditSplits && upc && (
                <RequestEditSplitButton resourceType="album" resourceId={upc} />
              )}
              {isOwnerUser && (
                <button
                  onClick={() => setInviteModalOpen(true)}
                  disabled={coverage.total === 0}
                  className="glass-control flex min-h-[44px] items-center gap-2 rounded-full px-[18px] py-[11px] text-[12.5px] font-semibold text-white transition-colors enabled:hover:bg-white/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70 disabled:cursor-not-allowed disabled:text-white/40"
                >
                  <UserPlus className="h-[15px] w-[15px] text-white/70" />
                  Invitar al álbum
                </button>
              )}
              <button
                onClick={() => setSplitModalOpen(true)}
                disabled={coverage.total === 0}
                className="flex min-h-[44px] items-center gap-2 rounded-full bg-[#FF5C00] px-[18px] py-[11px] text-[12.5px] font-semibold text-white shadow-[0_8px_20px_-6px_rgba(255,92,0,0.35)] transition-colors enabled:hover:bg-[#EA580C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:cursor-not-allowed disabled:bg-white/[0.08] disabled:text-white/40 disabled:shadow-none"
              >
                <Crown className="h-[15px] w-[15px]" />
                Tu split del álbum
              </button>
            </>
          }
        />

        <MetricConsole channels={channels} />

        <DetailTabs tabs={TABS} active={activeTab} onChange={setActiveTab} />

        {activeTab === "resumen" && (
          // El mismo grid de doce columnas que el detalle de canción: el reparto
          // y las plataformas comparten fila, y el rendimiento va debajo de
          // ancho completo porque es una serie temporal y necesita el espacio.
          <div className="grid grid-cols-12 gap-5">
            {isOwnerUser ? (
            <MoneyWaterfall
              steps={steps}
              shares={shares}
              distributable={repartible}
              subtitle={`De lo que entra por las ${coverage.total} pistas hasta lo que le toca a cada uno`}
              onEditSplits={isOwnerUser ? () => setCollabSplitOpen(true) : undefined}
              footnote={
                shares.length > 0
                  ? "Los porcentajes son el promedio ponderado de las pistas que ya reparten; cada pista puede tener el suyo."
                  : undefined
              }
              notice={
                pending > 0 ? (
                  <div className="flex flex-wrap items-center gap-3 rounded-[16px] border border-[#FF8A3D]/30 bg-[#FF5C00]/[0.14] px-3.5 py-3">
                    <CircleAlert className="h-[15px] w-[15px] flex-shrink-0 text-[#FF8A3D]" />
                    <span className="flex min-w-[200px] flex-1 flex-col gap-0.5">
                      <span className="text-[12px] font-semibold text-[#FFB48A]">
                        {pending} {pending === 1 ? "pista todavía no reparte" : "pistas todavía no reparten"}
                      </span>
                      <span className="text-[11px] text-white/65">
                        Sus {formatCurrency(unassignedIncome)} van enteros a ti hasta que les
                        asignes un split.
                      </span>
                    </span>
                    <button
                      onClick={() => setSplitModalOpen(true)}
                      className="rounded-full bg-[#FF5C00] px-3.5 py-2 text-[11.5px] font-semibold text-white transition-colors hover:bg-[#EA580C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                    >
                      Asignar
                    </button>
                  </div>
                ) : undefined
              }
            />
            ) : (
              <MyShareCard percentage={myAlbumShare.percentage} amount={myAlbumShare.amount} />
            )}
            <Platforms reproductions={reproductions} />
            <Performance
              data={monthlyEntries}
              subtitle="Streams e ingresos del álbum, mes a mes"
            />
          </div>
        )}

        {activeTab === "pistas" && (
          <TracksTable
            tracks={visibleTracks}
            total={coverage.total}
            withSplit={coverage.withSplit}
            onlyWithoutSplit={onlyWithoutSplit}
            onToggleFilter={() => setOnlyWithoutSplit((v) => !v)}
            onAssignAll={() => setSplitModalOpen(true)}
          />
        )}

        {activeTab === "costos" && (
          <AlbumExtraordinaryCosts
            albumId={String(album._id ?? album.id ?? "")}
            albumUpc={album.upc}
            tracks={album.tracks.map((track) => ({ _id: track._id, trackTitle: track.trackTitle }))}
          />
        )}
      </div>

      {permissionsOpen && (
        <PermissionsModal
          resourceType="album"
          resourceId={album.upc}
          title={album.albumTitle}
          onClose={() => setPermissionsOpen(false)}
        />
      )}

      {inviteModalOpen && (
        <InviteAlbumCollaboratorModal
          upc={album.upc}
          albumTitle={album.albumTitle}
          artistName={album.artistName}
          cover={cover}
          tracks={album.tracks as never[]}
          onClose={() => setInviteModalOpen(false)}
          onInvited={() => setRefreshKey((k) => k + 1)}
        />
      )}

      {collabSplitOpen && (
        <BulkCollaboratorSplitModal
          isOpen={collabSplitOpen}
          onGlass
          showOwnerContext={(album?.tracks ?? []).some((track) => viewerOwnsSong(track))}
          onClose={() => setCollabSplitOpen(false)}
          name={album.albumTitle}
          context={album.artistName}
          logo={
            <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-[14px] bg-white/[0.08]">
              <Disc3 className="h-[19px] w-[19px] text-white/60" />
            </span>
          }
          tracks={(album.tracks ?? []).map((track) => ({
            _id: track._id,
            trackTitle: track.trackTitle,
            hasOwnerSplit: Boolean(track?.ownerId?.split),
            collaborators: track.collaborators ?? [],
          }))}
          scopeNoun="álbum"
          onSplitsCreated={() => setRefreshKey((k) => k + 1)}
          onAssignOwnerSplit={() => {
            setCollabSplitOpen(false);
            setSplitModalOpen(true);
          }}
          onInvite={() => {
            setCollabSplitOpen(false);
            setInviteModalOpen(true);
          }}
        />
      )}

      {splitModalOpen && (
        <AlbumOwnerSplitModal
          isOpen={splitModalOpen}
          onClose={() => setSplitModalOpen(false)}
          album={album}
          onSplitsCreated={() => setRefreshKey((k) => k + 1)}
        />
      )}
    </>
  );
}

/** Las pistas del álbum, con las que no reparten marcadas. */
function TracksTable({
  tracks,
  total,
  withSplit,
  onlyWithoutSplit,
  onToggleFilter,
  onAssignAll,
}: {
  tracks: AlbumTrack[];
  total: number;
  withSplit: number;
  onlyWithoutSplit: boolean;
  onToggleFilter: () => void;
  onAssignAll: () => void;
}) {
  const pending = Math.max(0, total - withSplit);

  return (
    <div className="glass overflow-hidden rounded-[28px]">
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-5">
        <div className="flex flex-col gap-0.5">
          <h2 className="font-display text-[19px] font-medium tracking-[-0.005em] text-white">
            Las {total} {total === 1 ? "pista" : "pistas"}
          </h2>
          <p className="text-[12.5px] text-white/65">
            {withSplit} reparten · {pending} van enteras a ti
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onToggleFilter}
            aria-pressed={onlyWithoutSplit}
            className={`flex items-center gap-2 rounded-full px-3.5 py-2 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70 ${
              onlyWithoutSplit
                ? "glass-cream text-[#1C1D22]"
                : "glass-control text-white hover:bg-white/[0.12]"
            }`}
          >
            <Funnel className="h-3.5 w-3.5" />
            Solo sin split
          </button>
          {pending > 0 && (
            <button
              onClick={onAssignAll}
              className="flex items-center gap-2 rounded-full bg-[#FF5C00] px-4 py-2.5 text-[12px] font-semibold text-white shadow-[0_8px_20px_-6px_rgba(255,92,0,0.35)] transition-colors hover:bg-[#EA580C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              <Crown className="h-3.5 w-3.5" />
              Asignar a las {pending}
            </button>
          )}
        </div>
      </div>

      <div className="h-px bg-white/[0.09]" />

      {tracks.length === 0 ? (
        <p className="px-6 py-12 text-center text-[12.5px] text-white/65">
          {onlyWithoutSplit
            ? "Todas las pistas reparten ya."
            : "Este álbum no tiene pistas cargadas."}
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-white/[0.09]">
          {tracks.map((track, index) => {
            const hasSplit = Boolean(track?.split || (track as any)?.ownerId?.split);
            const collaborators = ((track as any)?.collaborators ?? []) as any[];
            return (
              <li
                key={track._id || track.isrc || index}
                className={`flex flex-wrap items-center gap-3.5 px-6 py-3 transition-colors ${
                  hasSplit ? "hover:bg-white/[0.04]" : "bg-[#FF5C00]/[0.08]"
                }`}
              >
                <span className="w-[26px] flex-shrink-0 font-mono text-[12px] font-semibold text-white/50">
                  {index + 1}
                </span>

                <span className="flex min-w-[180px] flex-1 items-center gap-3">
                  <span
                    className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[11px] ${
                      hasSplit ? "bg-white/[0.08]" : "bg-[#FF5C00]/[0.16]"
                    }`}
                  >
                    <Music className={`h-[15px] w-[15px] ${hasSplit ? "text-white/50" : "text-[#FF8A3D]"}`} />
                  </span>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <Link
                      to={`/panel/song/${track._id}`}
                      title={track.trackTitle}
                      className="truncate text-[13px] font-semibold text-white transition-colors hover:text-[#FFB067]"
                    >
                      {track.trackTitle}
                    </Link>
                    {track.isrc && (
                      <span className="truncate font-mono text-[10px] text-white/50">
                        {track.isrc}
                      </span>
                    )}
                  </span>
                </span>

                <span className="w-[130px] flex-shrink-0">
                  {hasSplit ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#45D39A]/[0.12] px-2.5 py-1">
                      <Crown className="h-3 w-3 text-[#45D39A]" />
                      <span className="text-[11px] font-semibold text-[#45D39A]">Reparte</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FF5C00]/[0.16] px-2.5 py-1">
                      <CircleAlert className="h-3 w-3 text-[#FF8A3D]" />
                      <span className="text-[11px] font-semibold text-[#FF8A3D]">
                        Sin asignar
                      </span>
                    </span>
                  )}
                </span>

                <span className="w-[56px] flex-shrink-0">
                  <SongLabelsBadge labels={getSongLabels(track)} count={songLabelCount(track)} />
                </span>

                <span className="hidden w-[100px] flex-shrink-0 items-center gap-1.5 md:flex">
                  <Play className="h-3 w-3 text-white/50" />
                  <span className="font-mono text-[11.5px] text-white/65">
                    {formatStreams(track.totalStreams ?? 0)}
                  </span>
                </span>

                <span className="w-[110px] flex-shrink-0 font-mono text-[14px] text-[#45D39A]">
                  {formatCurrency(track.totalNetIncome ?? 0)}
                </span>

                <span className="hidden w-[130px] flex-shrink-0 items-center gap-1 lg:flex">
                  {collaborators.length === 0 ? (
                    <span className="text-[11.5px] text-white/50">Solo tú</span>
                  ) : (
                    collaborators.slice(0, 4).map((collaborator, position) => (
                      <span
                        key={collaborator?._id ?? position}
                        title={collaborator?.name}
                        className="h-6 w-6 rounded-full ring-1 ring-white/25"
                        style={{ backgroundColor: collaboratorColor(position + 1) }}
                      />
                    ))
                  )}
                </span>

                <Link
                  to={`/panel/song/${track._id}`}
                  aria-label={`Abrir ${track.trackTitle}`}
                  className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-white/70 transition-colors hover:bg-white/[0.12] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/** El modelo guarda el tipo en `concept`: INCOME o EXPENSE. */
function isExpense(concept: string): boolean {
  const value = String(concept ?? "").toUpperCase();
  return value === "EXPENSE" || value === "EGRESO";
}
