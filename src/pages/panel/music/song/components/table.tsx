import { useEffect, useMemo, useState, type ReactNode } from "react";
import SplitsModal from "../../../../../components/modal/SplitsModal";
import OwnerSplitModal from "./ownerfrom";
import PaymentConfirmationModal from "../../../../../components/modal/PaymentConfirmationModal";
import CollaboratorPaymentHistoryModal from "../../../../../components/modal/CollaboratorPaymentHistoryModal";
import { CollaboratorDetailModal } from "../../../../../components/collaborators/CollaboratorDetailModal";
import {
  RemoveSplitModal,
  type RemoveSplitTarget,
} from "../../../../../components/modal/RemoveSplitModal";
import {
  RemoveCollaboratorModal,
  type RemoveCollaboratorTarget,
} from "../../../../../components/modal/RemoveCollaboratorModal";
import {
  DollarSign,
  Plus,
  History,
  Users,
  Music,
  Globe,
  Radio,
  CalendarRange,
  Pencil,
  Trash2,
  UserMinus,
  CircleCheck,
  Clock3,
  AlertCircle,
  UserPlus,
} from "lucide-react";
import { User as UserType } from "../../../../../models/user";
import PaymentsService from "@/services/payments";
import SongService from "@/services/songs";
import { songSplitsService } from "@/services/songSplits";
import type {
  SongSplitDistribution,
  SplitDistributionEntry,
  SplitPeriod,
} from "@/types/song-split.types";
import { formatPeriodRange, formatMonth, finalPeriodStart } from "@/utils/splitPeriods.utils";
import LocalStorageService from "@/services/localstorage";
import ValidationToastQueue, {
  ValidationToastItem,
  ValidationToastType,
} from "../../../../../components/alert/ValidationToastQueue";
import type { Collaborator } from "@/types";
import { describeSplitScope } from "@/utils/music.utils";
// FUNCIONALIDAD TEMPORAL — perfiles sin cuenta. Ver docs/PERFILES_TEMPORALES.md.
import { PlaceholderProfileModal } from "@/components/collaborators/PlaceholderProfileModal";
import { PlaceholderAvatar, PlaceholderChip } from "@/components/collaborators/PlaceholderAvatar";
import { isPlaceholderUser } from "@/services/placeholders";

interface Song {
  id?: string;
  _id?: string;
  trackTitle: string;
  artistName?: string;
  isrc?: string;
  ownerId?: string;
  owner?: { id: string; name: string; email: string };
  collaborators?: Array<{
    id: string;
    _id?: string;
    name: string;
    email: string;
    hasActiveSplit?: boolean;
  }>;
  totalNetIncome?: number;
  releases?: Array<{
    id: string;
    platform: string;
    country: string;
    reportMonth: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
  requesterRole?: "owner" | "collaborator" | "label";
  ownerEarnings?: number;
  collaboratorsEarnings?: number;
}

interface TableProps {
  collaborators: UserType[];
  songId?: string;
  song?: Song;
  isOwner?: boolean;
  /** Se pinta en la cabecera de la tarjeta, junto a las acciones de split. */
  headerAction?: ReactNode;
}

/** Campos que el backend añade al colaborador y que `User` todavía no declara. */
type CollaboratorExtras = UserType & {
  _id?: string;
  amountPaid?: number | string;
  roles?: string[];
};

/** Lo que la canción trae sobre el split del owner, según de dónde venga poblado. */
type SongWithOwnerSplit = Omit<Song, "ownerId" | "owner"> & {
  ownerId?: string | { split?: unknown };
  owner?: { id: string; name: string; email: string; split?: unknown };
  ownerSplit?: unknown;
};

const extras = (collaborator: UserType): CollaboratorExtras => collaborator as CollaboratorExtras;

const collaboratorId = (collaborator: UserType): string =>
  String(extras(collaborator)._id || collaborator.id || "");

/** Fila ya resuelta: mezcla el colaborador con el alcance y el monto que da el backend. */
interface Row {
  key: string;
  userId: string;
  /** Split activo de esta fila; null cuando la persona aún no tiene ninguno. */
  splitId: string | null;
  name: string;
  email: string;
  isOwnerRow: boolean;
  percentage: number | null;
  amount: number | null;
  paid: number;
  pending: number;
  scope: { label: string; worldwide: boolean } | null;
  /** Tramos de vigencia del split, vacío cuando aplica siempre. */
  periods: SplitPeriod[];
  /**
   * Retención que el owner le cobra a esta persona, cuando pactó una distinta
   * de la suya general. `null` = paga la de siempre. Dato del owner: la fila
   * solo lo pinta cuando quien mira es el dueño.
   */
  ownerRate: number | null;
  /** FUNCIONALIDAD TEMPORAL — perfiles sin cuenta. */
  isPlaceholder: boolean;
  raw?: UserType;
  index: number;
}

/** Desglose de los tramos, incluido el final, para el tooltip. */
const periodsTitle = (periods: SplitPeriod[], fallback: number | null) => {
  const lines = periods.map((period) => `${formatPeriodRange(period)}: ${period.percentage}%`);
  const finalStart = finalPeriodStart(periods);
  if (fallback != null && finalStart) {
    lines.push(`${formatMonth(finalStart)} → siempre: ${fallback}%`);
  }
  lines.push("Los meses sin tramo no pagan nada.");
  return lines.join("\n");
};

const formatMoney = (value: number) =>
  value.toLocaleString("es-CO", { style: "currency", currency: "USD", minimumFractionDigits: 2 });

function getInitials(name: string) {
  return (
    name
      .split(" ")
      .slice(0, 2)
      .map((n) => n[0] ?? "")
      .join("")
      .toUpperCase() || "?"
  );
}

const idOf = (ref: SplitDistributionEntry["userId"]): string =>
  typeof ref === "string" ? ref : String(ref?._id ?? ref?.id ?? "");

/** Traduce el alcance del split a una frase corta. */
const scopeOf = (entry?: SplitDistributionEntry | null) => describeSplitScope(entry);

export default function Table({
  collaborators,
  songId,
  song,
  isOwner = false,
  headerAction,
}: TableProps) {
  const [isSplitsModalOpen, setIsSplitsModalOpen] = useState(false);
  // FUNCIONALIDAD TEMPORAL — perfiles sin cuenta.
  const [isPlaceholderModalOpen, setIsPlaceholderModalOpen] = useState(false);
  const [isOwnerSplitModalOpen, setIsOwnerSplitModalOpen] = useState(false);
  const [isPaymentConfirmationOpen, setIsPaymentConfirmationOpen] = useState(false);
  const [distribution, setDistribution] = useState<SongSplitDistribution | null>(null);
  const [historyModal, setHistoryModal] = useState<{
    open: boolean;
    id: string;
    name: string;
    pending: number;
  }>({ open: false, id: "", name: "", pending: 0 });
  const [paymentData, setPaymentData] = useState<{
    collaboratorId: string;
    collaboratorName: string;
    collaboratorEmail: string;
    amount: number;
    songId: string;
  } | null>(null);
  const [toasts, setToasts] = useState<ValidationToastItem[]>([]);
  const [detailCollaborator, setDetailCollaborator] = useState<Collaborator | null>(null);
  const [removeTarget, setRemoveTarget] = useState<RemoveSplitTarget | null>(null);
  const [unlinkTarget, setUnlinkTarget] = useState<RemoveCollaboratorTarget | null>(null);

  const currentUser = LocalStorageService.getItem("user");
  const rawUserType = String(
    currentUser?.role ||
      currentUser?.type ||
      currentUser?.userType ||
      currentUser?.accountType ||
      "",
  ).toLowerCase();
  const isLabelUser = rawUserType.includes("label");
  const songWithSplit = song as SongWithOwnerSplit | undefined;
  const ownerIdRef = songWithSplit?.ownerId;
  const hasOwnerSplit = Boolean(
    (typeof ownerIdRef === "object" ? ownerIdRef?.split : undefined) ||
      songWithSplit?.owner?.split ||
      songWithSplit?.ownerSplit,
  );

  // El alcance de cada split y el monto que le toca solo vienen en la distribución.
  useEffect(() => {
    if (!songId) return;
    let active = true;
    songSplitsService
      .getSongSplits(songId)
      .then((data) => {
        if (active) setDistribution(data);
      })
      .catch(() => {
        if (active) setDistribution(null);
      });
    return () => {
      active = false;
    };
  }, [songId]);

  const addToast = (type: ValidationToastType, message: string) => {
    setToasts((prev) => [
      ...prev,
      { id: Date.now() + Math.floor(Math.random() * 1000), type, message },
    ]);
  };

  const dequeueToast = (id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const handleOpenSplitsModal = () => {
    if (isLabelUser && !hasOwnerSplit) {
      addToast("error", "Todavía no se pueden repartir splits en esta canción.");
      return;
    }
    setIsSplitsModalOpen(true);
  };

  const handleSplitSaved = () => {
    // El backend recalcula la distribución al guardar; la página se relee entera.
    setTimeout(() => window.location.reload(), 500);
  };

  /**
   * Suelta el split de la fila. El backend hace soft delete y deja el rastro en
   * el historial; la página se relee entera porque los montos de arriba salen
   * del mismo reparto que acaba de cambiar.
   */
  const handleRemoveSplit = async (splitId: string) => {
    await songSplitsService.deleteSplit(splitId);
    addToast("success", "Split retirado. Queda registrado en el historial.");
    setTimeout(() => window.location.reload(), 600);
  };

  /**
   * Desvincula a un colaborador de la canción. El backend deshace de una vez el
   * vínculo, su acceso y el split; aquí solo hay que releer la página, porque
   * cambian tanto la tabla como los montos de arriba.
   */
  const handleRemoveCollaborator = async (collaboratorId: string) => {
    await SongService.removeCollaborator(songId || "", collaboratorId);
    addToast("success", "Colaborador quitado de la canción.");
    setTimeout(() => window.location.reload(), 600);
  };

  const openRemoveCollaborator = (row: Row) => {
    setUnlinkTarget({
      collaboratorId: row.userId,
      name: row.name,
      email: row.email,
      percentage: row.percentage,
      pending: row.pending,
    });
  };

  const openRemoveSplit = (row: Row) => {
    if (!row.splitId) return;
    setRemoveTarget({
      splitId: row.splitId,
      name: row.isOwnerRow ? "El owner" : row.name,
      isOwnerSplit: row.isOwnerRow,
      percentage: row.percentage,
      scope: row.scope,
      pending: row.pending,
    });
  };

  const handleOwnerSplitCreated = () => {
    setIsOwnerSplitModalOpen(false);
    window.location.reload();
  };

  const openPaymentConfirmation = (
    collaboratorId: string,
    collaboratorName: string,
    collaboratorEmail: string,
    amount: number,
    targetSongId: string,
  ) => {
    setPaymentData({
      collaboratorId,
      collaboratorName,
      collaboratorEmail,
      amount,
      songId: targetSongId,
    });
    setIsPaymentConfirmationOpen(true);
  };

  const AVATAR_DETAIL_PALETTE = [
    { bg: "#FED7AA", text: "#9A3412" },
    { bg: "#DBEAFE", text: "#1E40AF" },
    { bg: "#FCE7F3", text: "#9D174D" },
    { bg: "#D1FAE5", text: "#065F46" },
    { bg: "#EDE9FE", text: "#5B21B6" },
    { bg: "#FEF3C7", text: "#92400E" },
  ];

  const openCollaboratorDetail = (collaborator: UserType, idx: number) => {
    const palette = AVATAR_DETAIL_PALETTE[idx % AVATAR_DETAIL_PALETTE.length];
    const adapted: Collaborator = {
      id: collaboratorId(collaborator),
      name: collaborator.name || "",
      email: collaborator.email || "",
      initials: getInitials(collaborator.name || "?"),
      avatarBg: palette.bg,
      avatarText: palette.text,
      songs: 1,
      songPresencePercentage: 0,
      paid: parseFloat(String(extras(collaborator).amountPaid || 0)),
      amountOwed: parseFloat(String(collaborator.amountToPay || 0)),
      amountPending: parseFloat(String(collaborator.amountToPay || 0)),
      status: "active",
      roles: extras(collaborator).roles ?? [],
    };
    setDetailCollaborator(adapted);
  };

  const paymentToCollaborator = async () => {
    if (!paymentData) return;
    // Cobro ACH dirigido a un solo colaborador (su pendiente) y payout vía Wise.
    const response = await PaymentsService.payRoyalties(
      paymentData.songId,
      paymentData.collaboratorId,
    );
    if (response.error) {
      throw new Error(response.message || "Error al procesar el pago");
    }
  };

  /** Owner primero y luego los colaboradores, cada uno con su alcance resuelto. */
  const rows = useMemo<Row[]>(() => {
    const byUser = new Map<string, SplitDistributionEntry>();
    for (const entry of distribution?.collaborators ?? []) {
      const id = idOf(entry.userId);
      if (id) byUser.set(id, entry);
    }

    // Para quien no es el dueño, el owner no existe en esta tabla: ni su fila,
    // ni su porcentaje, ni su monto. Ver `utils/ownerVisibility.ts`.
    const ownerEntry = isOwner ? (distribution?.owner ?? null) : null;
    const ownerRow: Row[] = ownerEntry
      ? [
          {
            key: "owner",
            userId: idOf(ownerEntry.userId),
            splitId: ownerEntry.splitId ? String(ownerEntry.splitId) : null,
            name: isOwner ? "Tú (owner)" : song?.owner?.name || "El owner",
            email: song?.owner?.email || "",
            isOwnerRow: true,
            percentage: ownerEntry.percentage ?? null,
            amount: ownerEntry.amount ?? null,
            paid: 0,
            pending: 0,
            scope: scopeOf(ownerEntry),
            periods: ownerEntry.periods ?? [],
            ownerRate: null,
            isPlaceholder: false,
            index: -1,
          },
        ]
      : [];

    const collaboratorRows: Row[] = (collaborators ?? []).map((collaborator, index) => {
      const id = collaboratorId(collaborator);
      const entry = byUser.get(id);
      const pending = Number(collaborator.amountToPay ?? 0) || 0;
      return {
        key: id || `collaborator-${index}`,
        userId: id,
        splitId: entry?.splitId ? String(entry.splitId) : null,
        name: collaborator.name || "—",
        email: collaborator.email || "",
        isOwnerRow: false,
        percentage:
          entry?.percentage ??
          (collaborator.percentage != null ? Number(collaborator.percentage) : null),
        amount: entry?.amount ?? null,
        paid: Number(extras(collaborator).amountPaid ?? 0) || 0,
        pending,
        scope: scopeOf(entry),
        periods: entry?.periods ?? [],
        // Solo el dueño ve lo que retiene: para el resto ni llega a la fila,
        // así el render no puede enseñarlo por descuido.
        ownerRate: isOwner ? (entry?.ownerRate ?? null) : null,
        isPlaceholder: isPlaceholderUser(collaborator),
        raw: collaborator,
        index,
      };
    });

    return [...ownerRow, ...collaboratorRows];
  }, [collaborators, distribution, isOwner, song]);

  // El split del owner no compite con el de los colaboradores: sale antes. De
  // $1.000 con un owner al 20%, el owner cobra $200 y los colaboradores se
  // reparten los $800 restantes, que son su 100%. Por eso `assigned` mide solo
  // el pool: sumar ambas bases daba lecturas imposibles como "120% asignado".
  const ownerPct = rows.find((row) => row.isOwnerRow)?.percentage ?? 0;
  const assigned = rows
    .filter((row) => !row.isOwnerRow)
    .reduce((sum, row) => sum + (row.percentage ?? 0), 0);
  const hasCollaboratorRows = rows.some((row) => !row.isOwnerRow);
  // Mientras alguien del pool conserve su split, quitar el del owner les subiría
  // lo devengado: el backend lo rechaza y aquí el botón sale apagado.
  const poolSplitsActive = rows.filter((row) => !row.isOwnerRow && row.splitId).length;
  const distributable = distribution?.collaboratorsPool ?? 0;
  // Con tramos de vigencia en juego, sumar los porcentajes deja de describir el
  // reparto: dos personas al 80% no se pisan si cobran en meses distintos. El
  // encabezado y el pie dejan entonces de anunciar un total que no se cumple.
  const hasPeriods = rows.some((row) => row.periods.length > 0);
  const balanced = Math.round(assigned) === 100;
  const overflow = Math.round(assigned) > 100;

  const canManageSplits = song?.requesterRole === "owner" || song?.requesterRole === "label";

  return (
    <>
      <ValidationToastQueue toasts={toasts} onDequeue={dequeueToast} />
      {detailCollaborator && (
        <CollaboratorDetailModal
          collaborator={detailCollaborator}
          onClose={() => setDetailCollaborator(null)}
          isOwner={isOwner}
        />
      )}

      {unlinkTarget && (
        <RemoveCollaboratorModal
          target={unlinkTarget}
          songTitle={song?.trackTitle}
          onClose={() => setUnlinkTarget(null)}
          onConfirm={handleRemoveCollaborator}
        />
      )}

      {removeTarget && (
        <RemoveSplitModal
          target={removeTarget}
          songTitle={song?.trackTitle}
          onClose={() => setRemoveTarget(null)}
          onConfirm={handleRemoveSplit}
        />
      )}

      <PlaceholderProfileModal
        isOpen={isPlaceholderModalOpen}
        songId={songId || ""}
        songTitle={song?.trackTitle}
        onClose={() => setIsPlaceholderModalOpen(false)}
        onAttached={() => {
          setIsPlaceholderModalOpen(false);
          window.location.reload();
        }}
      />

      <SplitsModal
        collaborators={collaborators}
        isOpen={isSplitsModalOpen}
        onClose={() => setIsSplitsModalOpen(false)}
        songId={songId || ""}
        showOwnerContext={isOwner}
        releaseMonth={distribution?.releaseAnchorMonth ?? null}
        onSplitSaved={handleSplitSaved}
      />
      <OwnerSplitModal
        isOpen={isOwnerSplitModalOpen}
        onClose={() => setIsOwnerSplitModalOpen(false)}
        songId={songId || ""}
        song={song || { id: songId || "", trackTitle: "" }}
        onSplitCreated={handleOwnerSplitCreated}
      />
      <CollaboratorPaymentHistoryModal
        isOpen={historyModal.open}
        onClose={() => setHistoryModal({ open: false, id: "", name: "", pending: 0 })}
        songId={songId || ""}
        collaboratorId={historyModal.id}
        collaboratorName={historyModal.name}
        songTitle={song?.trackTitle}
        pendingAmount={historyModal.pending}
      />
      <PaymentConfirmationModal
        isOpen={isPaymentConfirmationOpen}
        onClose={() => {
          setIsPaymentConfirmationOpen(false);
          setPaymentData(null);
        }}
        onConfirm={paymentToCollaborator}
        collaboratorName={paymentData?.collaboratorName || ""}
        collaboratorEmail={paymentData?.collaboratorEmail || ""}
        amount={paymentData?.amount || 0}
        currency="USD"
        songTitle={song?.trackTitle}
      />

      <section className="overflow-hidden rounded-[26px] border border-[#E8E8EC] bg-white shadow-[0_10px_28px_-12px_rgba(255,92,0,0.15)]">
        <header className="flex flex-wrap items-center justify-between gap-3.5 px-5 py-[18px]">
          <div className="flex flex-col gap-0.5">
            <h3 className="font-display text-[18px] font-semibold text-[#1C1D22]">
              Quién cobra de esta canción
            </h3>
            <p
              className={`text-[12.5px] font-medium ${
                hasPeriods ? "text-[#71757E]" : balanced ? "text-[#2FB37E]" : "text-[#EA580C]"
              }`}
            >
              {rows.length === 0
                ? "Todavía no hay nadie asignado"
                : !hasCollaboratorRows
                  ? "Solo cobras tú · aún no reparte con nadie"
                  : hasPeriods
                    ? "El reparto cambia según el mes · hay splits con tramos por fechas"
                    : overflow
                      ? `Los colaboradores suman ${Math.round(assigned)}%: se pasan del 100%`
                      : balanced
                        ? "El 100% está repartido · no sobra nada"
                        : `Falta repartir ${Math.max(0, 100 - Math.round(assigned))}%`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {isOwner && song?.requesterRole === "owner" && (
              <button
                type="button"
                onClick={() => setIsOwnerSplitModalOpen(true)}
                className="inline-flex items-center gap-[7px] rounded-[20px] border border-[#E8E8EC] bg-white px-4 py-2.5 text-[12px] font-semibold text-[#71757E] transition-colors hover:text-[#1C1D22]"
              >
                <Plus className="h-3.5 w-3.5" />
                Mi split
              </button>
            )}
            {isOwner && song?.requesterRole === "owner" && (
              <button
                type="button"
                onClick={() => setIsPlaceholderModalOpen(true)}
                className="inline-flex items-center gap-[7px] rounded-[20px] border border-dashed border-[#C9CCD2] bg-white px-4 py-2.5 text-[12px] font-semibold text-[#71757E] transition-colors hover:text-[#1C1D22]"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Sin cuenta
              </button>
            )}
            {canManageSplits && (
              <button
                type="button"
                onClick={handleOpenSplitsModal}
                className="inline-flex items-center gap-[7px] rounded-[20px] border border-[#E8E8EC] bg-white px-4 py-2.5 text-[12px] font-semibold text-[#71757E] transition-colors hover:text-[#1C1D22]"
              >
                <Music className="h-3.5 w-3.5" />
                Repartir splits
              </button>
            )}
            {headerAction}
          </div>
        </header>

        <div className="h-px bg-[#E8E8EC]" />

        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2.5 py-16 text-center">
            <span className="grid h-[58px] w-[58px] place-items-center rounded-[20px] bg-[#FFEADD]">
              <Users className="h-6 w-6 text-[#FF5C00]" />
            </span>
            <p className="text-[15px] font-semibold text-[#1C1D22]">Nadie cobra de esta canción</p>
            <p className="max-w-[400px] text-[13px] text-[#71757E]">
              Reparte los splits para decidir quién cobra y cuánto le toca de lo que entra.
            </p>
            {canManageSplits && (
              <button
                type="button"
                onClick={handleOpenSplitsModal}
                className="mt-1 inline-flex items-center gap-[7px] rounded-[20px] bg-[#FF5C00] px-4 py-2.5 text-[12px] font-semibold text-white transition-colors hover:bg-[#EA580C]"
              >
                <Plus className="h-3.5 w-3.5" />
                Repartir splits
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="hidden items-center gap-3.5 px-5 py-[13px] lg:flex">
              <span className="flex-1 font-mono text-[9.5px] font-medium tracking-[1.2px] text-[#A6AAB2]">
                COLABORADOR
              </span>
              <span className="w-[152px] font-mono text-[9.5px] font-medium tracking-[1.2px] text-[#A6AAB2]">
                ALCANCE
              </span>
              <span className="w-[70px] font-mono text-[9.5px] font-medium tracking-[1.2px] text-[#A6AAB2]">
                {ownerPct > 0 ? "% SOBRE" : "%"}
              </span>
              <span className="w-[130px] font-mono text-[9.5px] font-medium tracking-[1.2px] text-[#A6AAB2]">
                LE CORRESPONDE
              </span>
              <span className="w-[148px] font-mono text-[9.5px] font-medium tracking-[1.2px] text-[#A6AAB2]">
                ESTADO
              </span>
              <span className="w-[186px]" />
            </div>

            <div className="h-px bg-[#E8E8EC]" />

            <ul>
              {rows.map((row, index) => (
                <li key={row.key}>
                  {index > 0 && <div className="h-px bg-[#E8E8EC]" />}
                  <div
                    className={`flex flex-wrap items-center gap-3.5 px-5 py-3 ${
                      row.isOwnerRow ? "bg-[#FF5C00]/[0.04]" : ""
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        !row.isOwnerRow && row.raw && openCollaboratorDetail(row.raw, row.index)
                      }
                      disabled={row.isOwnerRow}
                      className="flex min-w-[200px] flex-1 items-center gap-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00] disabled:cursor-default"
                    >
                      {row.isPlaceholder ? (
                        <PlaceholderAvatar name={row.name} />
                      ) : (
                        <span
                          className={`grid h-[38px] w-[38px] shrink-0 place-items-center rounded-full text-[11.5px] font-semibold text-white ${
                            row.isOwnerRow ? "bg-[#FF5C00]" : "bg-[#1C1D22]"
                          }`}
                        >
                          {getInitials(row.name)}
                        </span>
                      )}
                      <span className="flex min-w-0 flex-col gap-0.5">
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="truncate text-[13px] font-semibold text-[#1C1D22]">
                            {row.name}
                          </span>
                          {row.isPlaceholder && <PlaceholderChip />}
                        </span>
                        <span className="truncate text-[11px] text-[#A6AAB2]">
                          {row.isPlaceholder ? "Todavía no se ha registrado" : row.email || "—"}
                        </span>
                      </span>
                    </button>

                    <span className="flex w-[152px] flex-col gap-0.5">
                      <span className="flex items-center gap-1.5">
                        {row.scope ? (
                          <>
                            {row.scope.worldwide ? (
                              <Globe className="h-3 w-3 shrink-0 text-[#A6AAB2]" />
                            ) : (
                              <Radio className="h-3 w-3 shrink-0 text-[#A6AAB2]" />
                            )}
                            <span className="truncate text-[11px] text-[#71757E]">
                              {row.scope.label}
                            </span>
                          </>
                        ) : (
                          <span className="text-[11px] text-[#A6AAB2]">Sin split</span>
                        )}
                      </span>
                      {row.periods.length > 0 && (
                        <span
                          title={periodsTitle(row.periods, row.percentage)}
                          className="flex cursor-help items-center gap-1.5"
                        >
                          <CalendarRange className="h-3 w-3 shrink-0 text-[#FF5C00]" />
                          <span className="truncate text-[10.5px] text-[#FF5C00]">
                            {row.periods.length === 1
                              ? formatPeriodRange(row.periods[0])
                              : `${row.periods.length} tramos por fechas`}
                          </span>
                        </span>
                      )}
                    </span>

                    <span className="flex w-[70px] flex-col">
                      <span
                        className="font-mono text-[14px] font-semibold text-[#1C1D22]"
                        title={
                          row.periods.length > 0
                            ? periodsTitle(row.periods, row.percentage)
                            : undefined
                        }
                      >
                        {row.periods.length > 0 ? (
                          <span className="cursor-help text-[12px] text-[#FF5C00]">varía</span>
                        ) : row.percentage != null ? (
                          `${row.percentage}%`
                        ) : (
                          "—"
                        )}
                      </span>
                      {row.percentage != null && (row.periods.length > 0 || ownerPct > 0) && (
                        <span className="font-mono text-[9.5px] leading-tight text-[#A6AAB2]">
                          {row.periods.length > 0
                            ? "según el mes"
                            : row.isOwnerRow
                              ? "del total"
                              : row.ownerRate != null
                                ? `del reparto · te queda el ${row.ownerRate}%`
                                : "del reparto"}
                        </span>
                      )}
                    </span>

                    <span className="w-[130px] font-mono text-[13px] font-semibold text-[#2FB37E]">
                      {row.amount != null ? formatMoney(row.amount) : "—"}
                    </span>

                    <span className="w-[148px]">
                      <StatusChip row={row} />
                    </span>

                    <span className="flex w-[186px] items-center justify-end gap-1.5">
                      {!row.isOwnerRow && (
                        <>
                          <IconButton
                            label="Editar el split"
                            onClick={handleOpenSplitsModal}
                            disabled={!canManageSplits}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </IconButton>
                          <IconButton
                            label="Ver sus pagos"
                            onClick={() =>
                              setHistoryModal({
                                open: true,
                                id: row.userId,
                                name: row.name,
                                pending: row.pending,
                              })
                            }
                          >
                            <History className="h-3.5 w-3.5" />
                          </IconButton>
                          {row.pending > 0 && isOwner && (
                            <IconButton
                              label={`Pagarle ${formatMoney(row.pending)}`}
                              accent
                              onClick={() =>
                                openPaymentConfirmation(
                                  row.userId,
                                  row.name,
                                  row.email,
                                  row.pending,
                                  songId || "",
                                )
                              }
                            >
                              <DollarSign className="h-3.5 w-3.5" />
                            </IconButton>
                          )}
                          {row.splitId && canManageSplits && (
                            <IconButton
                              label="Quitar su split de esta canción"
                              danger
                              onClick={() => openRemoveSplit(row)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </IconButton>
                          )}
                          {canManageSplits && (
                            <IconButton
                              label="Quitar de la canción"
                              danger
                              onClick={() => openRemoveCollaborator(row)}
                            >
                              <UserMinus className="h-3.5 w-3.5" />
                            </IconButton>
                          )}
                        </>
                      )}
                      {row.isOwnerRow && isOwner && song?.requesterRole === "owner" && (
                        <>
                          <IconButton
                            label="Editar mi split"
                            onClick={() => setIsOwnerSplitModalOpen(true)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </IconButton>
                          {row.splitId && (
                            <IconButton
                              label={
                                poolSplitsActive > 0
                                  ? "Quita antes los splits de los colaboradores"
                                  : "Quitar mi split de esta canción"
                              }
                              danger
                              disabled={poolSplitsActive > 0}
                              onClick={() => openRemoveSplit(row)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </IconButton>
                          )}
                        </>
                      )}
                    </span>
                  </div>
                </li>
              ))}
            </ul>

            <div className="h-px bg-[#E8E8EC]" />

            <footer className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
              <span className="flex items-center gap-2.5">
                {hasPeriods ? (
                  <CalendarRange className="h-3.5 w-3.5 text-[#FF5C00]" />
                ) : balanced ? (
                  <CircleCheck className="h-3.5 w-3.5 text-[#2FB37E]" />
                ) : (
                  <AlertCircle className="h-3.5 w-3.5 text-[#EA580C]" />
                )}
                <span
                  className={`text-[12px] font-semibold ${
                    hasPeriods ? "text-[#71757E]" : balanced ? "text-[#2FB37E]" : "text-[#EA580C]"
                  }`}
                >
                  {hasPeriods
                    ? "El reparto varía por mes"
                    : `${Math.round(assigned)}% repartido entre colaboradores`}
                </span>
                <span className="text-[12px] text-[#A6AAB2]">·</span>
                <span className="text-[12px] text-[#71757E]">
                  {rows.length} {rows.length === 1 ? "participante" : "participantes"}
                  {isOwner && distributable > 0
                    ? ` sobre ${formatMoney(distributable)} repartibles`
                    : ""}
                </span>
              </span>
              <span className="text-[11px] text-[#A6AAB2]">
                El alcance limita en qué países o plataformas aplica cada split
              </span>
            </footer>

            {ownerPct > 0 && (
              <p className="px-5 pb-3.5 text-[11px] leading-relaxed text-[#A6AAB2]">
                Tu {ownerPct}% de owner se retiene de la parte de cada uno y no ocupa sitio en el
                reparto: el 100% que se mide arriba es el de la canción entera
                {distributable > 0 ? `, y a repartir quedan ${formatMoney(distributable)}` : ""}.
                {rows.some((row) => row.ownerRate != null)
                  ? " Con quien pactaste otra retención se le aplica la suya, marcada en su fila."
                  : ""}
              </p>
            )}
          </>
        )}
      </section>

    </>
  );
}

const StatusChip = ({ row }: { row: Row }) => {
  if (row.percentage == null) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-[14px] bg-[#F4F5F7] px-2.5 py-[5px] text-[10.5px] font-semibold text-[#71757E]">
        Sin split
      </span>
    );
  }
  if (row.isOwnerRow) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-[14px] bg-[#FFEADD] px-2.5 py-[5px] text-[10.5px] font-semibold text-[#FF5C00]">
        Es tu parte
      </span>
    );
  }
  if (row.pending > 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-[14px] bg-[#FFEADD] px-2.5 py-[5px] text-[10.5px] font-semibold text-[#EA580C]">
        <Clock3 className="h-[11px] w-[11px]" />
        Por pagar
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-[14px] bg-[#E4F5EC] px-2.5 py-[5px] text-[10.5px] font-semibold text-[#2FB37E]">
      <CircleCheck className="h-[11px] w-[11px]" />
      Al día
    </span>
  );
};

const IconButton = ({
  children,
  label,
  accent,
  danger,
  disabled,
  onClick,
}: {
  children: ReactNode;
  label: string;
  accent?: boolean;
  /** Acción que retira algo: se tiñe de rojo solo al pasar por encima. */
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={label}
    aria-label={label}
    className={`grid h-[30px] w-[30px] place-items-center rounded-full border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00] disabled:opacity-40 ${
      accent
        ? "border-[#2FB37E] bg-[#2FB37E] text-white hover:brightness-95"
        : danger
          ? "border-[#E8E8EC] bg-white text-[#71757E] enabled:hover:border-[#E5484D] enabled:hover:bg-[#FDECEC] enabled:hover:text-[#E5484D]"
          : "border-[#E8E8EC] bg-white text-[#71757E] hover:bg-[#F4F5F7]"
    }`}
  >
    {children}
  </button>
);

export type { Song };
