import { useEffect, useState } from "react";
import {
  UserPlus,
  Mail,
  Music,
  Send,
  Check,
  Info,
  TriangleAlert,
  Loader2,
  Tag,
  Layers,
} from "lucide-react";
import LabelsService, { type LabelSong } from "@/services/labels";
import type { PermissionGrants } from "@/types/permissions.types";
import { ModalShell, FieldLabel, PrimaryButton, SecondaryButton } from "@/components/ui/ModalShell";

interface InviteCollaboratorToLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  labelType: "artistic" | "custom";
  /** Nombre del sello artístico, o el id del personalizado. */
  labelIdentifier: string;
  labelName: string;
  songCount: number;
  onSuccess?: () => void;
}

interface InvitationResult {
  /** Null cuando esa persona todavía no tiene cuenta en Splitme. */
  collaboratorName: string | null;
  collaboratorEmail: string;
  totalSongs: number;
  needsAccount: boolean;
}

const DEFAULT_LABEL_GRANTS: Partial<PermissionGrants> = {
  viewIncome: false,
  viewStreams: false,
  viewCollaborators: false,
  viewDocuments: false,
  canEditSplits: false,
  canInviteCollaborators: false,
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Invitación de un colaborador a todas las canciones de un sello.
 *
 * La nota del cuerpo separa las dos cosas que se confunden: entrar al sello da
 * acceso a las canciones, pero no reparte dinero. El porcentaje se define
 * después, y decirlo aquí evita que alguien dé por hecho que ya cobra.
 */
export default function InviteCollaboratorToLabelModal({
  isOpen,
  onClose,
  labelType,
  labelIdentifier,
  labelName,
  songCount,
  onSuccess,
}: InviteCollaboratorToLabelModalProps) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<InvitationResult | null>(null);
  const [songs, setSongs] = useState<LabelSong[]>([]);
  const [loadingSongs, setLoadingSongs] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isOpen) return;
    setEmail("");
    setError("");
    setResult(null);
    setSongs([]);
    setSelected(new Set());
    setLoadingSongs(true);
    let alive = true;
    const load = async () => {
      try {
        let list: LabelSong[] = [];
        if (labelType === "custom") {
          const res = await LabelsService.getSongsByCustomLabel(labelName);
          list = res.data?.songs ?? [];
        } else {
          const res = await LabelsService.getSongsByLabel(labelIdentifier);
          list = res.data ?? [];
        }
        if (alive) {
          setSongs(list);
          setSelected(new Set(list.map((x) => x._id)));
        }
      } catch {
        if (alive) setError("No se pudieron cargar las canciones del sello.");
      } finally {
        if (alive) setLoadingSongs(false);
      }
    };
    load();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const trimmed = email.trim();
  const isCustom = labelType === "custom";

  const allIds = songs.map((x) => x._id);
  const allSelected = allIds.length > 0 && selected.size === allIds.length;
  const toggleSong = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(allIds));

  const handleClose = () => {
    setEmail("");
    setError("");
    setResult(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (!trimmed) {
      setError("Escribe el correo del colaborador.");
      return;
    }
    if (!EMAIL_PATTERN.test(trimmed)) {
      setError("Ese correo no tiene un formato válido.");
      return;
    }

    if (selected.size === 0) {
      setError("Elige al menos una canción.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await LabelsService.inviteCollaboratorToLabel({
        labelType,
        labelIdentifier,
        collaboratorEmail: trimmed.toLowerCase(),
        songIds: allIds.filter((id) => selected.has(id)),
        grants: DEFAULT_LABEL_GRANTS,
      });

      if (response.error || !response.data) {
        setError(response.message ?? "La invitación no se pudo enviar.");
        return;
      }

      setResult({
        collaboratorName: response.data.collaboratorName ?? null,
        collaboratorEmail: response.data.collaboratorEmail,
        totalSongs: response.data.totalSongs,
        needsAccount: Boolean(response.data.needsAccount),
      });
      onSuccess?.();
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setSubmitting(false);
    }
  };

  const mark = (
    <span
      className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[14px] ${
        isCustom ? "bg-[#FF5C00]" : "bg-[#FFEADD]"
      }`}
    >
      {isCustom ? (
        <Layers className="h-[18px] w-[18px] text-white" />
      ) : (
        <Tag className="h-[18px] w-[18px] text-[#FF5C00]" />
      )}
    </span>
  );

  if (result) {
    return (
      <ModalShell
        title="Invitación enviada"
        width="lg"
        onClose={handleClose}
        footer={
          <>
            <span className="min-w-0 flex-1" />
            <PrimaryButton onClick={handleClose}>Cerrar</PrimaryButton>
          </>
        }
      >
        <div className="flex flex-col items-center gap-3 pb-1 pt-4 text-center">
          <span className="flex h-[52px] w-[52px] items-center justify-center rounded-[18px] bg-[#E4F5EC]">
            <Check className="h-[22px] w-[22px] text-[#2FB37E]" />
          </span>
          <h3 className="font-display text-[17px] font-semibold text-[#1C1D22]">
            {result.collaboratorName ?? result.collaboratorEmail} recibirá el acceso
          </h3>
          <p className="max-w-[380px] text-[12.5px] leading-relaxed text-[#71757E]">
            {result.needsAccount
              ? "Le llega un correo con el enlace. Como aún no tiene cuenta, primero creará la suya y desde ahí volverá solo a aceptar. La invitación caduca en 7 días."
              : "Le llega un correo con el enlace para aceptar. La invitación caduca en 7 días."}
          </p>
        </div>

        <dl className="flex flex-col divide-y divide-[#E8E8EC] overflow-hidden rounded-[18px] bg-[#F4F5F7]">
          <SummaryRow
            label="Colaborador"
            value={result.collaboratorName ?? "Sin cuenta todavía"}
          />
          <SummaryRow label="Correo" value={result.collaboratorEmail} />
          <SummaryRow
            label="Sello"
            value={`${labelName} · ${result.totalSongs} ${
              result.totalSongs === 1 ? "canción" : "canciones"
            }`}
          />
        </dl>

        <div className="flex items-start gap-2.5 rounded-2xl bg-[#FFEADD] px-4 py-3">
          <Info className="mt-px h-4 w-4 flex-shrink-0 text-[#FF5C00]" />
          <span className="text-[11.5px] leading-relaxed text-[#1C1D22]">
            Cuando acepte, define su porcentaje desde el sello o canción por canción.
          </span>
        </div>
      </ModalShell>
    );
  }

  return (
    <ModalShell
      title="Invitar colaborador"
      subtitle={`${labelName} · ${songCount} ${songCount === 1 ? "canción" : "canciones"}`}
      width="lg"
      locked={submitting}
      onClose={handleClose}
      logo={mark}
      footer={
        <>
          <span className="min-w-0 flex-1" />
          <SecondaryButton onClick={handleClose} disabled={submitting}>
            Cancelar
          </SecondaryButton>
          <PrimaryButton
            onClick={handleSubmit}
            disabled={submitting || loadingSongs || selected.size === 0}
            icon={
              submitting ? (
                <Loader2 className="h-[14px] w-[14px] animate-spin" />
              ) : (
                <Send className="h-[14px] w-[14px]" />
              )
            }
          >
            {submitting ? "Enviando…" : "Enviar invitación"}
          </PrimaryButton>
        </>
      }
    >
      <label className="flex flex-col gap-2">
        <FieldLabel required invalid={Boolean(error)}>
          CORREO DEL COLABORADOR
        </FieldLabel>
        <div className="relative">
          <Mail
            className={`absolute left-4 top-1/2 -translate-y-1/2 ${
              error ? "text-[#E5484D]" : "text-[#FF5C00]"
            }`}
            size={15}
          />
          <input
            type="email"
            value={email}
            autoFocus
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && !submitting && handleSubmit()}
            disabled={submitting}
            placeholder="colaborador@email.com"
            className={`w-full rounded-2xl border bg-white py-3 pl-11 pr-4 text-[13.5px] font-medium text-[#1C1D22] placeholder:font-normal placeholder:text-[#A6AAB2] focus:outline-none focus:ring-[3px] disabled:opacity-50 ${
              error
                ? "border-[#E5484D] focus:border-[#E5484D] focus:ring-[#E5484D]/15"
                : "border-[#E8E8EC] focus:border-[#FF5C00] focus:ring-[#FF5C00]/15"
            }`}
          />
        </div>
        <span className="text-[11px] text-[#A6AAB2]">
          Debe ser el correo de una cuenta ya registrada en Splitme.
        </span>
      </label>

      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-3">
          <FieldLabel required>CANCIONES</FieldLabel>
          <span className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleAll}
              disabled={submitting || allIds.length === 0}
              className="text-[11px] font-semibold text-[#FF5C00] hover:underline disabled:opacity-40"
            >
              {allSelected ? "Quitar todas" : "Seleccionar todas"}
            </button>
            <span className="font-mono text-[10.5px] font-semibold text-[#FF5C00]">
              {selected.size}/{songs.length}
            </span>
          </span>
        </div>
        {loadingSongs ? (
          <div className="h-[80px] animate-pulse rounded-[16px] bg-[#F4F5F7]" />
        ) : (
          <ul className="flex max-h-[210px] flex-col gap-1 overflow-y-auto rounded-[16px] bg-[#F4F5F7] p-1.5">
            {songs.map((song) => {
              const thumb = song.spotifyData?.album?.images?.[0]?.url;
              const meta = [
                song.isrc ? `ISRC ${song.isrc}` : null,
                song.upc ? `UPC ${song.upc}` : null,
              ]
                .filter(Boolean)
                .join(" · ");

              return (
                <li key={song._id}>
                  <label className="flex cursor-pointer items-center gap-2.5 rounded-[12px] px-2.5 py-1.5 transition-colors hover:bg-white/70">
                    <input
                      type="checkbox"
                      checked={selected.has(song._id)}
                      onChange={() => toggleSong(song._id)}
                      disabled={submitting}
                      className="h-3.5 w-3.5 flex-shrink-0 accent-[#FF5C00]"
                    />
                    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-white">
                      {thumb ? (
                        <img src={thumb} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Music className="h-4 w-4 text-[#A6AAB2]" />
                      )}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="truncate text-[12px] font-semibold text-[#1C1D22]">
                        {song.trackTitle}
                      </span>
                      {meta && (
                        <span className="truncate font-mono text-[10.5px] text-[#71757E]">
                          {meta}
                        </span>
                      )}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="flex items-start gap-2.5 rounded-2xl bg-[#F4F5F7] px-4 py-3">
        <UserPlus className="mt-px h-4 w-4 flex-shrink-0 text-[#71757E]" />
        <span className="text-[11.5px] leading-relaxed text-[#71757E]">
          Al aceptar, entra solo en las canciones marcadas ({selected.size} de {songCount || songs.length}). Los splits de pago se configuran aparte, después.
        </span>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-2xl border border-[#F5C2C4] bg-[#FDECEC] px-4 py-3"
        >
          <TriangleAlert className="mt-px h-4 w-4 flex-shrink-0 text-[#E5484D]" />
          <span className="text-[12.5px] text-[#E5484D]">{error}</span>
        </div>
      )}
    </ModalShell>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <dt className="w-[92px] flex-shrink-0 text-[11.5px] text-[#A6AAB2]">{label}</dt>
      <dd className="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-[#1C1D22]">
        {value}
      </dd>
    </div>
  );
}
