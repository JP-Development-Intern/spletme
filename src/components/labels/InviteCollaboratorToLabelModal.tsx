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
  /**
   * Vidrio cálido, desde la lista de Sellos ya migrada. Por defecto en claro:
   * el detalle de sello todavía no se ha migrado.
   */
  onGlass?: boolean;
}

/** Los mismos papeles de color en claro y en vidrio. */
const TONES = {
  light: {
    markCustom: "bg-[#FF5C00]",
    markArtistic: "bg-[#FFEADD]",
    markArtisticIcon: "text-[#FF5C00]",
    successMark: "bg-[#E4F5EC]",
    successIcon: "text-[#2FB37E]",
    title: "font-semibold text-[#1C1D22]",
    body: "text-[#71757E]",
    summary: "divide-[#E8E8EC] bg-[#F4F5F7]",
    summaryLabel: "text-[#A6AAB2]",
    summaryValue: "text-[#1C1D22]",
    nextStep: "bg-[#FFEADD]",
    nextStepIcon: "text-[#FF5C00]",
    nextStepText: "text-[#1C1D22]",
    mailIcon: "text-[#FF5C00]",
    mailIconError: "text-[#E5484D]",
    input: "bg-white text-[#1C1D22] placeholder:text-[#A6AAB2]",
    inputOk: "border-[#E8E8EC] focus:border-[#FF5C00] focus:ring-[#FF5C00]/15",
    inputBad: "border-[#E5484D] focus:border-[#E5484D] focus:ring-[#E5484D]/15",
    hint: "text-[#A6AAB2]",
    note: "bg-[#F4F5F7]",
    noteText: "text-[#71757E]",
    error: "border-[#F5C2C4] bg-[#FDECEC]",
    errorText: "text-[#E5484D]",
  },
  glass: {
    markCustom: "bg-[#FF5C00]",
    markArtistic: "bg-[#FF5C00]/[0.16]",
    markArtisticIcon: "text-[#FF8A3D]",
    successMark: "bg-[#45D39A]/[0.14]",
    successIcon: "text-[#45D39A]",
    title: "font-medium text-white",
    body: "text-white/65",
    summary: "divide-white/[0.09] bg-white/[0.06]",
    summaryLabel: "text-white/50",
    summaryValue: "text-white",
    nextStep: "border border-[#FF8A3D]/30 bg-[#FF5C00]/[0.14]",
    nextStepIcon: "text-[#FF8A3D]",
    nextStepText: "text-white/80",
    mailIcon: "text-[#FF8A3D]",
    mailIconError: "text-[#FF8F92]",
    input: "text-white placeholder:text-white/40 transition-colors",
    inputOk: "border-white/[0.14] bg-white/[0.06] focus:border-[#FF8A3D] focus:ring-[#FF5C00]/25",
    inputBad: "border-[1.5px] border-[#FF8F92] bg-[#E5484D]/[0.12] focus:border-[#FF8F92] focus:ring-[#E5484D]/25",
    hint: "text-white/50",
    note: "bg-white/[0.06]",
    noteText: "text-white/65",
    error: "border-[#E5484D]/30 bg-[#E5484D]/[0.12]",
    errorText: "text-[#FF8F92]",
  },
};

interface InvitationResult {
  /** Null cuando esa persona todavía no tiene cuenta en Splitme. */
  collaboratorName: string | null;
  collaboratorEmail: string;
  totalSongs: number;
  needsAccount: boolean;
}

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
  onGlass = false,
}: InviteCollaboratorToLabelModalProps) {
  const t = onGlass ? TONES.glass : TONES.light;
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
        isCustom ? t.markCustom : t.markArtistic
      }`}
    >
      {isCustom ? (
        <Layers className="h-[18px] w-[18px] text-white" />
      ) : (
        <Tag className={`h-[18px] w-[18px] ${t.markArtisticIcon}`} />
      )}
    </span>
  );

  if (result) {
    return (
      <ModalShell
        title="Invitación enviada"
        width="lg"
        onGlass={onGlass}
        onClose={handleClose}
        footer={
          <>
            <span className="min-w-0 flex-1" />
            <PrimaryButton onClick={handleClose}>Cerrar</PrimaryButton>
          </>
        }
      >
        <div className="flex flex-col items-center gap-3 pb-1 pt-4 text-center">
          <span className={`flex h-[52px] w-[52px] items-center justify-center rounded-[18px] ${t.successMark}`}>
            <Check className={`h-[22px] w-[22px] ${t.successIcon}`} />
          </span>
          <h3 className={`font-display text-[17px] ${t.title}`}>
            {result.collaboratorName ?? result.collaboratorEmail} recibirá el acceso
          </h3>
          <p className={`max-w-[380px] text-[12.5px] leading-relaxed ${t.body}`}>
            {result.needsAccount
              ? "Le llega un correo con el enlace. Como aún no tiene cuenta, primero creará la suya y desde ahí volverá solo a aceptar. La invitación caduca en 7 días."
              : "Le llega un correo con el enlace para aceptar. La invitación caduca en 7 días."}
          </p>
        </div>

        <dl className={`flex flex-col divide-y overflow-hidden rounded-[18px] ${t.summary}`}>
          <SummaryRow
            label="Colaborador"
            value={result.collaboratorName ?? "Sin cuenta todavía"}
            labelClassName={t.summaryLabel}
            valueClassName={t.summaryValue}
          />
          <SummaryRow
            label="Correo"
            value={result.collaboratorEmail}
            labelClassName={t.summaryLabel}
            valueClassName={t.summaryValue}
          />
          <SummaryRow
            labelClassName={t.summaryLabel}
            valueClassName={t.summaryValue}
            label="Sello"
            value={`${labelName} · ${result.totalSongs} ${
              result.totalSongs === 1 ? "canción" : "canciones"
            }`}
          />
        </dl>

        <div className={`flex items-start gap-2.5 rounded-2xl px-4 py-3 ${t.nextStep}`}>
          <Info className={`mt-px h-4 w-4 flex-shrink-0 ${t.nextStepIcon}`} />
          <span className={`text-[11.5px] leading-relaxed ${t.nextStepText}`}>
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
      onGlass={onGlass}
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
              error ? t.mailIconError : t.mailIcon
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
            className={`w-full rounded-2xl border py-3 pl-11 pr-4 text-[13.5px] font-medium placeholder:font-normal focus:outline-none focus:ring-[3px] disabled:opacity-50 ${t.input} ${
              error ? t.inputBad : t.inputOk
            }`}
          />
        </div>
        <span className={`text-[11px] ${t.hint}`}>
          Debe ser el correo de una cuenta ya registrada en Splitme.
        </span>
      </label>

      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-3">
          <FieldLabel required>CANCIONES</FieldLabel>
          <span className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleAll}
              disabled={submitting || allIds.length === 0}
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors disabled:opacity-40 ${
                onGlass
                  ? "bg-[#FF5C00]/[0.18] text-[#FF9A5C] hover:bg-[#FF5C00]/30"
                  : "bg-[#FFEADD] text-[#FF5C00] hover:bg-[#FFD9C2]"
              }`}
            >
              {allSelected ? "Quitar todas" : "Seleccionar todas"}
            </button>
            <span
              className={`rounded-full px-2 py-0.5 font-mono text-[10.5px] font-semibold ${
                onGlass ? "bg-white/[0.08] text-white/70" : "bg-[#F4F5F7] text-[#71757E]"
              }`}
            >
              {selected.size}/{songs.length}
            </span>
          </span>
        </div>
        {loadingSongs ? (
          <div
            className={`flex flex-col gap-2 rounded-[18px] border p-2 ${
              onGlass ? "border-white/[0.09] bg-white/[0.04]" : "border-[#E8E8EC] bg-[#F8F9FA]"
            }`}
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`h-[54px] animate-pulse rounded-[14px] ${
                  onGlass ? "bg-white/[0.08]" : "bg-white"
                }`}
              />
            ))}
          </div>
        ) : (
          <ul
            className={`flex max-h-[224px] flex-col gap-1.5 overflow-y-auto rounded-[18px] border p-2 ${
              onGlass ? "border-white/[0.09] bg-white/[0.04]" : "border-[#E8E8EC] bg-[#F8F9FA]"
            }`}
          >
            {songs.map((song) => {
              const isChecked = selected.has(song._id);
              const thumb = song.spotifyData?.album?.images?.[0]?.url;

              return (
                <li key={song._id}>
                  <label
                    className={`flex cursor-pointer items-center gap-3 rounded-[14px] border px-2.5 py-2 transition-all ${
                      isChecked
                        ? onGlass
                          ? "border-[#FF8A3D]/40 bg-white/[0.10]"
                          : "border-[#FF5C00]/30 bg-white shadow-[0_2px_8px_-2px_rgba(16,17,20,0.06)]"
                        : onGlass
                          ? "border-transparent bg-white/[0.04] opacity-65 hover:bg-white/[0.08] hover:opacity-100"
                          : "border-transparent bg-white/50 opacity-65 hover:bg-white/90 hover:opacity-100"
                    }`}
                  >
                    <span className="relative flex flex-shrink-0 items-center justify-center">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSong(song._id)}
                        disabled={submitting}
                        className="sr-only"
                      />
                      <span
                        aria-hidden="true"
                        className={`flex h-[18px] w-[18px] items-center justify-center rounded-[6px] transition-colors ${
                          isChecked
                            ? "bg-[#FF5C00] text-white shadow-[0_2px_6px_-1px_rgba(255,92,0,0.45)]"
                            : onGlass
                              ? "border border-white/25 bg-white/[0.06]"
                              : "border border-[#D9DAE0] bg-white"
                        }`}
                      >
                        {isChecked && <Check className="h-3 w-3 stroke-[2.75]" />}
                      </span>
                    </span>

                    <span
                      className={`flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-[11px] ring-1 ${
                        onGlass ? "bg-white/[0.08] ring-white/10" : "bg-[#F4F5F7] ring-black/5"
                      }`}
                    >
                      {thumb ? (
                        <img src={thumb} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Music className={`h-4 w-4 ${onGlass ? "text-white/40" : "text-[#A6AAB2]"}`} />
                      )}
                    </span>

                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span
                        className={`truncate text-[12.5px] font-semibold ${
                          onGlass ? "text-white" : "text-[#1C1D22]"
                        }`}
                      >
                        {song.trackTitle}
                      </span>
                      {(song.isrc || song.upc) && (
                        <span className="flex flex-wrap items-center gap-1.5">
                          {song.isrc && (
                            <span
                              className={`rounded-md px-1.5 py-0.5 font-mono text-[10px] ${
                                onGlass ? "bg-white/[0.08] text-white/65" : "bg-[#F4F5F7] text-[#71757E]"
                              }`}
                            >
                              ISRC {song.isrc}
                            </span>
                          )}
                          {song.upc && (
                            <span
                              className={`rounded-md px-1.5 py-0.5 font-mono text-[10px] ${
                                onGlass ? "bg-white/[0.08] text-white/65" : "bg-[#F4F5F7] text-[#71757E]"
                              }`}
                            >
                              UPC {song.upc}
                            </span>
                          )}
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

      <div className={`flex items-start gap-2.5 rounded-2xl px-4 py-3 ${t.note}`}>
        <UserPlus className={`mt-px h-4 w-4 flex-shrink-0 ${t.noteText}`} />
        <span className={`text-[11.5px] leading-relaxed ${t.noteText}`}>
          Al aceptar, entra solo en las canciones marcadas ({selected.size} de{" "}
          {songCount || songs.length}). Los splits de pago se configuran aparte, después.
        </span>
      </div>

      {error && (
        <div
          role="alert"
          className={`flex items-start gap-2.5 rounded-2xl border px-4 py-3 ${t.error}`}
        >
          <TriangleAlert className={`mt-px h-4 w-4 flex-shrink-0 ${t.errorText}`} />
          <span className={`text-[12.5px] ${t.errorText}`}>{error}</span>
        </div>
      )}
    </ModalShell>
  );
}

function SummaryRow({
  label,
  value,
  labelClassName,
  valueClassName,
}: {
  label: string;
  value: string;
  labelClassName: string;
  valueClassName: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <dt className={`w-[92px] flex-shrink-0 text-[11.5px] ${labelClassName}`}>{label}</dt>
      <dd className={`min-w-0 flex-1 truncate text-[12.5px] font-semibold ${valueClassName}`}>
        {value}
      </dd>
    </div>
  );
}
