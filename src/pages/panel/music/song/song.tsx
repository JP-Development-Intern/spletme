import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Music,
  Play,
  DollarSign,
  Crown,
  Users,
  HandCoins,
  LayoutDashboard,
  Receipt,
  GitBranch,
  FolderOpen,
  CircleAlert,
  Clock3,
  ArrowRight,
} from "lucide-react";
import PaymentsService, { type PaymentReadiness } from "@/services/payments";
import RoyaltiesService, { type RoyaltyRequest } from "@/services/royalties";
import LocalStorageService from "@/services/localstorage";
import {
  resolveIsOwner,
  describeSplitScope,
  getSongLabels,
  songLabelCount,
  getSongReleaseDate,
  formatReleaseDate,
} from "@/utils/music.utils";
import useSong from "@/hooks/useSong";
import useSongAlbums from "@/hooks/useSongAlbums";
import { useSongMoney } from "@/hooks/useSongMoney";
import useCurrentCollaborator from "@/hooks/useCurrentCollaborator";
import { formatCurrency, formatStreams } from "@/utils/format.utils";
import { DetailHeader } from "@/components/music/DetailHeader";
import { DetailTabs, type DetailTab } from "@/components/music/DetailTabs";
import { MoneyWaterfall } from "@/components/music/MoneyWaterfall";
import { MyShareCard } from "@/components/music/MyShareCard";
import { SongAlbumsChip } from "@/components/music/SongAlbumsChip";
import { SongLabelsBadge } from "@/components/music/SongLabelsBadge";
import { MetricConsole, type MetricChannel } from "@/components/ui/MetricConsole";
import { DetailSkeleton } from "@/components/music/DetailSkeleton";
import Table from "./components/table";
import Platforms from "./components/platforms";
import Performance from "./components/performance";
import Historyofsplits from "./components/historyofsplits";
import Extraordinarycosts from "./components/extraordinarycosts";
import DocumentManager from "./components/documentManager";
import SongPaymentsHistory from "@/components/PaymentHistory/SongPaymentsHistory";
import StripeConnectLoginModal from "@/components/modal/StripeConnectLoginModal";
import StripePaymentModal from "@/components/modal/StripePaymentModal";
import ValidationToastQueue, {
  type ValidationToastItem,
  type ValidationToastType,
} from "@/components/alert/ValidationToastQueue";

type TabKey = "resumen" | "colaboradores" | "pagos" | "splits" | "documentos";

export default function Song() {
  const { id = "" } = useParams();
  const { song, loading, getOwnerPercentage, getOwnerTotalOwed } = useSong({ id });
  const songAlbums = useSongAlbums(id);
  const rawReleaseDate = getSongReleaseDate(song);
  const releaseDate = rawReleaseDate ? formatReleaseDate(rawReleaseDate) : null;
  const { getCurrentUserPercentage, getCurrentUserAmount, currentCollaborator } =
    useCurrentCollaborator({ collaborators: song?.collaborators || [] });

  const [activeTab, setActiveTab] = useState<TabKey>("resumen");
  const [showStripeLoginModal, setShowStripeLoginModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [toasts, setToasts] = useState<ValidationToastItem[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [readiness, setReadiness] = useState<PaymentReadiness | null>(null);
  const [myRoyaltyRequest, setMyRoyaltyRequest] = useState<RoyaltyRequest | null>(null);
  const [royaltyLoading, setRoyaltyLoading] = useState(false);

  const money = useSongMoney({ songId: id, song, refreshKey });

  useEffect(() => {
    if (!id) return;
    PaymentsService.getPaymentReadiness(id).then((res) => {
      if (!res.error && res.data) setReadiness(res.data);
    });
  }, [id, refreshKey]);

  useEffect(() => {
    if (!id) return;
    RoyaltiesService.getMyRequests().then((res) => {
      if (res.error || !res.data) return;
      const match = res.data.find((request) => {
        const songId = typeof request.songId === "string" ? request.songId : request.songId._id;
        return songId === id;
      });
      setMyRoyaltyRequest(match ?? null);
    });
  }, [id, refreshKey]);

  const addToast = (type: ValidationToastType, message: string) =>
    setToasts((prev) => [...prev, { id: Date.now() + Math.random(), type, message }]);

  const currentUser = LocalStorageService.getItem("user");
  const isOwnerUser = useMemo(() => resolveIsOwner(song, currentUser), [song, currentUser]);

  if (loading || !song) return <DetailSkeleton label="Cargando la canción" />;

  const ownerAmount = getOwnerTotalOwed();
  const totalToPay =
    song?.collaboratorsPending ??
    song?.collaboratorsEarnings ??
    Math.max(0, (song?.totalNetIncome ?? 0) - ownerAmount);

  const myPercentage = myRoyaltyRequest
    ? myRoyaltyRequest.splitPercentage
    : getCurrentUserPercentage() || getOwnerPercentage();
  const myAmount = myRoyaltyRequest
    ? myRoyaltyRequest.calculatedAmount
    : Number(getCurrentUserAmount() || 0);

  // Lo suyo y solo lo suyo: alcance del split propio y lo ya cobrado.
  const myPaid = Number(currentCollaborator?.amountPaid ?? 0) || 0;
  const myScope = describeSplitScope(currentCollaborator?.split);

  const collaboratorCount = (song?.collaborators ?? []).length;
  const blocked = readiness !== null && !readiness.canPay;

  const hasIncomeAccess =
    isOwnerUser || song?.totalNetIncome !== undefined || song?.paymentInfo !== undefined;
  const hasStreamsAccess = isOwnerUser || song?.reproductions !== undefined;
  const hasCollaboratorsAccess = isOwnerUser || song?.collaborators !== undefined;

  async function handleRequestRoyalties() {
    if (!id) return;
    setRoyaltyLoading(true);
    const res = await RoyaltiesService.requestRoyalties(id);
    setRoyaltyLoading(false);
    if (res.error) {
      addToast("error", res.message || "No se pudo enviar la solicitud.");
      return;
    }
    addToast("success", "Solicitud enviada. El owner recibirá un correo para aprobarla.");
    setRefreshKey((k) => k + 1);
  }

  const TABS: DetailTab<TabKey>[] = [
    { key: "resumen", label: "Resumen", icon: <LayoutDashboard className="h-[15px] w-[15px]" /> },
    ...(hasCollaboratorsAccess
      ? [
          {
            key: "colaboradores" as const,
            label: "Colaboradores",
            icon: <Users className="h-[15px] w-[15px]" />,
            count: collaboratorCount,
          },
        ]
      : []),
    { key: "pagos", label: "Pagos", icon: <Receipt className="h-[15px] w-[15px]" /> },
    ...(hasCollaboratorsAccess
      ? [
          {
            key: "splits" as const,
            label: "Splits",
            icon: <GitBranch className="h-[15px] w-[15px]" />,
          },
        ]
      : []),
    { key: "documentos", label: "Documentos", icon: <FolderOpen className="h-[15px] w-[15px]" /> },
  ];

  // El ingreso de la canción solo lo ve su dueño: junto al split propio, la
  // resta delataría que hay un descuento antes del reparto. Ver
  // `utils/ownerVisibility.ts`.
  const channels: MetricChannel[] = [
    ...(hasStreamsAccess
      ? [
          {
            key: "streams",
            label: "Streams",
            icon: <Play className="h-[15px] w-[15px] text-white" />,
            value: formatStreams(song?.totalStreams ?? 0),
          } as MetricChannel,
        ]
      : []),
    ...(isOwnerUser
      ? [
          {
            key: "net",
            label: "Ingreso neto",
            icon: <DollarSign className="h-[15px] w-[15px] text-white" />,
            value: formatCurrency(money.netIncome),
            valueColor: "#45D39A",
            width: 300,
            caption:
              money.grossIncome > 0 ? `bruto ${formatCurrency(money.grossIncome)}` : undefined,
          } as MetricChannel,
        ]
      : []),
    ...(hasCollaboratorsAccess
      ? [
          {
            key: "share",
            label: isOwnerUser ? "Tu parte" : "Tu split",
            icon: <Crown className="h-[15px] w-[15px] text-white" />,
            value: `${myPercentage || 0}%`,
            caption: hasIncomeAccess ? formatCurrency(myAmount) : undefined,
          } as MetricChannel,
          {
            key: "collabs",
            label: "Colaboradores",
            icon: <Users className="h-[15px] w-[15px] text-white" />,
            value: String(collaboratorCount),
          } as MetricChannel,
        ]
      : []),
    ...(isOwnerUser
      ? [
          {
            key: "earnings",
            label: "Tu ganancia",
            icon: <Crown className="h-[15px] w-[15px] text-white" />,
            value: formatCurrency(ownerAmount),
            valueColor: "#FF8A3D",
            caption: "según tus splits",
          } as MetricChannel,
          {
            key: "topay",
            label: "Por pagar",
            icon: <HandCoins className="h-[15px] w-[15px] text-[#FF8A3D]" />,
            value: formatCurrency(totalToPay),
            highlight: true,
            width: 260,
            caption:
              collaboratorCount > 0
                ? `${collaboratorCount} ${collaboratorCount === 1 ? "persona" : "personas"}`
                : "sin colaboradores",
          } as MetricChannel,
        ]
      : hasIncomeAccess
        ? [
            {
              key: "mine",
              label: "Tu saldo",
              icon: <HandCoins className="h-[15px] w-[15px] text-[#FF8A3D]" />,
              value: formatCurrency(myAmount),
              highlight: true,
              width: 260,
              caption: myRoyaltyRequest?.status === "pending" ? "solicitud enviada" : "por solicitar",
            } as MetricChannel,
          ]
        : []),
  ];

  return (
    <>
      <div className="flex flex-col gap-5 px-4 lg:pl-4 lg:pr-8">
        <DetailHeader
          cover={song?.spotifyData?.album?.images?.[0]?.url}
          fallbackIcon={<Music className="h-9 w-9 text-white/50" />}
          title={song?.trackTitle ?? "—"}
          codeLabel="ISRC"
          code={song?.isrc}
          meta={
            <>
              <span>{song?.artistName ?? "—"}</span>
              <span className="text-white/40">·</span>
              <SongAlbumsChip
                albums={songAlbums.albums}
                loading={songAlbums.loading}
                fallbackUpc={song?.upc}
              />
              <SongLabelsBadge labels={getSongLabels(song)} count={songLabelCount(song)} />
              {releaseDate && (
                <>
                  <span className="text-white/40">·</span>
                  <span title="Fecha de lanzamiento">Lanzada {releaseDate}</span>
                </>
              )}
            </>
          }
          highlightLabel={isOwnerUser ? "TOTAL A PAGAR" : hasIncomeAccess ? "TU PARTE" : undefined}
          highlightValue={
            isOwnerUser
              ? formatCurrency(totalToPay)
              : hasIncomeAccess
                ? formatCurrency(myAmount)
                : undefined
          }
          highlightColor={isOwnerUser ? "#FFFFFF" : "#45D39A"}
          actions={
            isOwnerUser ? (
              <button
                onClick={() => setShowPaymentModal(true)}
                disabled={blocked || totalToPay <= 0}
                className={PRIMARY_BUTTON}
              >
                <HandCoins className="h-[15px] w-[15px]" />
                Pagar a todos
              </button>
            ) : (
              <RoyaltyAction
                request={myRoyaltyRequest}
                loading={royaltyLoading}
                onRequest={handleRequestRoyalties}
              />
            )
          }
        />

        <MetricConsole channels={channels} />

        {isOwnerUser && blocked && readiness && (
          <BlockedNotice issues={readiness.issues} />
        )}

        {!isOwnerUser && myRoyaltyRequest?.status === "pending" && (
          <PendingRequestNotice />
        )}

        <DetailTabs tabs={TABS} active={activeTab} onChange={setActiveTab} />

        {activeTab === "resumen" && (
          <div className="grid grid-cols-12 gap-5">
            {isOwnerUser ? (
              <MoneyWaterfall
                steps={money.steps}
                shares={money.shares}
                distributable={money.repartible}
                subtitle="De lo que entra por esta canción hasta lo que le toca a cada uno"
                onEditSplits={() => setActiveTab("colaboradores")}
              />
            ) : hasIncomeAccess && hasCollaboratorsAccess ? (
              <MyShareCard
                percentage={myPercentage || 0}
                amount={myAmount}
                paid={myPaid}
                scope={myScope}
                requestPending={myRoyaltyRequest?.status === "pending"}
                onRequest={handleRequestRoyalties}
              />
            ) : null}
            {hasStreamsAccess && (
              <>
                <Platforms reproductions={song?.reproductions ?? []} />
                <Performance songId={id} />
              </>
            )}
          </div>
        )}

        {activeTab === "colaboradores" && hasCollaboratorsAccess && (
          <Table
            collaborators={song?.collaborators ?? []}
            songId={id}
            song={song}
            isOwner={isOwnerUser}
          />
        )}

        {activeTab === "pagos" && (
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start">
            <div className="min-w-0 flex-1">
              {/* El repartible es el neto menos costos: enseñárselo a quien cobra
                  del pool equivale a enseñarle el ingreso. Los costos sí los ve:
                  le afectan y no delatan nada. Ver `utils/ownerVisibility.ts`. */}
              <Extraordinarycosts
                songId={id}
                distributable={isOwnerUser ? money.repartible : undefined}
                songTitle={song?.trackTitle}
              />
            </div>
            <div className="xl:w-[400px] xl:flex-shrink-0">
              <SongPaymentsHistory
                songId={id}
                refreshTrigger={refreshKey}
                pendingAmount={isOwnerUser ? totalToPay : Math.max(0, myAmount - myPaid)}
              />
            </div>
          </div>
        )}

        {activeTab === "splits" && hasCollaboratorsAccess && (
          <Historyofsplits
            songId={id}
            isOwner={isOwnerUser}
            collaborators={song?.collaborators ?? []}
          />
        )}

        {activeTab === "documentos" && <DocumentManager songId={id} />}
      </div>

      <ValidationToastQueue
        toasts={toasts}
        onDequeue={(toastId: number) =>
          setToasts((prev) => prev.filter((toast) => toast.id !== toastId))
        }
      />

      <StripeConnectLoginModal
        isOpen={showStripeLoginModal}
        onClose={() => setShowStripeLoginModal(false)}
        onLoginSuccess={() => addToast("success", "Te has conectado con Stripe Connect.")}
      />

      <StripePaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        songId={id}
        songTitle={song?.trackTitle}
        totalAmount={totalToPay}
        collaborators={song?.collaborators ?? []}
        onPaymentSuccess={() => {
          setRefreshKey((k) => k + 1);
          addToast("success", "Pago procesado. Los colaboradores recibirán su parte.");
        }}
      />
    </>
  );
}

/** Acción principal de la cabecera, en brasa sólida; deshabilitada se apaga en el vidrio. */
const PRIMARY_BUTTON =
  "flex min-h-[44px] items-center gap-2 rounded-full bg-[#FF5C00] px-[18px] py-[11px] text-[12.5px] font-semibold text-white shadow-[0_8px_20px_-6px_rgba(255,92,0,0.35)] transition-colors enabled:hover:bg-[#EA580C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:cursor-not-allowed disabled:bg-white/[0.08] disabled:text-white/40 disabled:shadow-none";

/** Los motivos que impiden pagar, con la acción que resuelve cada uno. */
function BlockedNotice({ issues }: { issues: { code: string; message: string }[] }) {
  return (
    <div className="flex flex-col gap-2.5 rounded-[22px] border border-[#E5484D]/30 bg-[#E5484D]/[0.14] p-4">
      <p className="flex items-center gap-2.5 text-[13px] font-semibold text-[#FF8F92]">
        <CircleAlert className="h-4 w-4 flex-shrink-0" />
        Falta esto para poder pagar
      </p>
      <ul className="flex flex-col gap-1.5">
        {issues.map((issue) => (
          <li
            key={issue.code}
            className="flex items-center gap-2.5 rounded-[13px] bg-black/[0.18] px-3 py-2.5"
          >
            <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#FF8F92]" />
            <span className="text-[11.5px] leading-snug text-white/80">{issue.message}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PendingRequestNotice() {
  return (
    <div className="glass flex flex-wrap items-center gap-3 rounded-[22px] p-4">
      <span className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-full bg-white/[0.12]">
        <Clock3 className="h-4 w-4 text-white" />
      </span>
      <span className="flex min-w-[200px] flex-1 flex-col gap-0.5">
        <span className="text-[12.5px] font-semibold text-white">
          Solicitud enviada, pendiente de aprobación
        </span>
        <span className="text-[11.5px] text-white/65">
          El owner recibirá un correo para aceptarla o rechazarla. Te avisamos en cuanto responda.
        </span>
      </span>
      <span className="rounded-full bg-[#FF5C00]/[0.16] px-3 py-1.5 text-[11px] font-semibold text-[#FF9A5C]">
        Pendiente
      </span>
    </div>
  );
}

/** Botón de regalías del colaborador, según el estado de su solicitud. */
function RoyaltyAction({
  request,
  loading,
  onRequest,
}: {
  request: RoyaltyRequest | null;
  loading: boolean;
  onRequest: () => void;
}) {
  if (request?.status === "pending") {
    return (
      <span className="glass-control rounded-full px-[18px] py-[11px] text-[12.5px] font-semibold text-white/65">
        Solicitud pendiente
      </span>
    );
  }

  if (request?.status === "accepted") {
    return (
      <span className="flex items-center gap-2 rounded-full bg-[#45D39A]/[0.12] px-[18px] py-[11px] text-[12.5px] font-semibold text-[#45D39A]">
        <Crown className="h-[15px] w-[15px]" />
        Aceptada
      </span>
    );
  }

  return (
    <button
      onClick={onRequest}
      disabled={loading || request?.status === "rejected"}
      className={PRIMARY_BUTTON}
    >
      <HandCoins className="h-[15px] w-[15px]" />
      {loading
        ? "Enviando…"
        : request?.status === "rejected"
          ? "Solicitud rechazada"
          : "Solicitar mis regalías"}
      {!loading && !request && <ArrowRight className="h-[14px] w-[14px]" />}
    </button>
  );
}
