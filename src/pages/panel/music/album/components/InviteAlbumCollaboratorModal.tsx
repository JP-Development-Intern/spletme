import { useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  CircleCheck,
  Disc3,
  Hash,
  Mail,
  Music,
  Send,
  TriangleAlert,
  UserPlus,
} from "lucide-react";
import AlbumService, { type AlbumInvitationResult } from "@/services/albums";
import { ModalShell, FieldLabel, PrimaryButton, SecondaryButton } from "@/components/ui/ModalShell";

type Method = "email" | "code";

/** Lo mínimo que el modal necesita saber de cada pista del álbum. */
export interface InviteTrack {
  _id: string;
  trackTitle?: string;
  isrc?: string;
  spotifyData?: {
    album?: {
      images?: Array<{ url: string; width?: number; height?: number }>;
    };
  };
  collaborators?: { _id?: string; name?: string }[];
}

interface Props {
  upc: string;
  albumTitle: string;
  artistName?: string;
  cover?: string;
  tracks: InviteTrack[];
  onClose: () => void;
  /** Se llama tras invitar, para refrescar el álbum. */
  onInvited?: () => void;
}

/**
 * Invitación a colaborar en un álbum completo.
 *
 * Es el mismo gesto que invitar a una canción, pero lo que está en juego es
 * mucho mayor: quien acepte entra en todas las pistas a la vez. Por eso el panel
 * no dice «todas las pistas» y ya —enseña cuáles son, contadas y con nombre—.
 * «Todo el álbum» es una abstracción; una lista de doce títulos no lo es, y es
 * lo que permite darse cuenta de que hay una pista que no querías incluir antes
 * de mandar el correo, no después.
 */
export function InviteAlbumCollaboratorModal({
  upc,
  albumTitle,
  artistName,
  cover,
  tracks,
  onClose,
  onInvited,
}: Props) {
  const [method, setMethod] = useState<Method>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AlbumInvitationResult | null>(null);

  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(tracks.map((t) => t._id).filter(Boolean)),
  );

  const allIds = useMemo(() => tracks.map((t) => t._id).filter(Boolean), [tracks]);
  const allSelected = allIds.length > 0 && selected.size === allIds.length;

  const toggleTrack = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(allIds));

  const value = method === "email" ? email : code;
  const canSubmit = value.trim().length > 0 && selected.size > 0 && !sending;

  const titles = useMemo(
    () => tracks.map((track, index) => track.trackTitle || `Pista ${index + 1}`),
    [tracks],
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setSending(true);
    setError("");

    const response = await AlbumService.inviteCollaborator(upc, {
      ...(method === "email"
        ? { collaboratorEmail: email.trim() }
        : { collaboratorId: code.trim() }),
      songIds: allIds.filter((id) => selected.has(id)),
    });

    setSending(false);

    if (!response.success) {
      setError(response.message);
      return;
    }

    setResult(response.data);
    onInvited?.();
  }

  const logo = (
    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-[12px] bg-[#F4F5F7]">
      {cover ? (
        <img src={cover} alt="" className="h-full w-full object-cover" />
      ) : (
        <Disc3 className="h-[18px] w-[18px] text-[#A6AAB2]" />
      )}
    </span>
  );

  // ---- Invitación enviada -------------------------------------------------

  if (result) {
    return (
      <ModalShell
        title="Invitación enviada"
        subtitle={albumTitle}
        width="lg"
        onClose={onClose}
        logo={logo}
        footer={
          <>
            <span className="flex-1 text-[11px] text-[#A6AAB2]">
              Entrará en el álbum cuando acepte
            </span>
            <PrimaryButton onClick={onClose} icon={<ArrowRight className="h-[15px] w-[15px]" />}>
              Listo
            </PrimaryButton>
          </>
        }
      >
        <div className="flex items-center gap-3 rounded-[18px] bg-[#E4F5EC] p-4">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#2FB37E]">
            <Check className="h-5 w-5 text-white" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            {/* Quien todavía no tiene cuenta no tiene nombre: manda el correo. */}
            <span className="truncate text-[14px] font-semibold text-[#1F7D58]">
              {result.collaboratorName ?? result.collaboratorEmail}
            </span>
            <span className="truncate font-mono text-[11.5px] text-[#2FB37E]">
              {result.collaboratorName ? result.collaboratorEmail : "Todavía no tiene cuenta"}
            </span>
          </span>
        </div>

        <p className="text-[12.5px] leading-relaxed text-[#71757E]">
          {result.needsAccount
            ? "Le enviamos un correo con un enlace. Como aún no tiene cuenta, primero creará la suya y desde ahí volverá solo a aceptar; entrará como colaborador en "
            : "Le enviamos un correo con un enlace. Al aceptarlo entrará como colaborador en "}
          <span className="font-semibold text-[#1C1D22]">
            {result.totalSongs} {result.totalSongs === 1 ? "pista" : "pistas"}
          </span>{" "}
          de este álbum.
          {result.alreadyCollaborating > 0 && (
            <> Las otras {result.alreadyCollaborating} ya las compartíais.</>
          )}
        </p>

        <p className="flex items-start gap-2.5 rounded-[14px] bg-[#F4F5F7] px-3.5 py-3 text-[11px] leading-relaxed text-[#71757E]">
          <CircleCheck className="mt-px h-3.5 w-3.5 flex-shrink-0 text-[#A6AAB2]" />
          El enlace caduca en 7 días. Invitar no reparte nada todavía: los splits se asignan aparte,
          desde «Asignar split al álbum».
        </p>
      </ModalShell>
    );
  }

  // ---- Formulario ---------------------------------------------------------

  return (
    <form onSubmit={handleSubmit} className="contents">
      <ModalShell
        title="Invitar al álbum"
        subtitle={`${albumTitle}${artistName ? ` · ${artistName}` : ""}`}
        width="lg"
        locked={sending}
        onClose={onClose}
        logo={logo}
        footer={
          <>
            <span className="flex-1 text-[11px] text-[#A6AAB2]">
              Recibirá un solo correo
            </span>
            <SecondaryButton onClick={onClose} disabled={sending}>
              Cancelar
            </SecondaryButton>
            <PrimaryButton
              type="submit"
              disabled={!canSubmit}
              icon={<Send className="h-[15px] w-[15px]" />}
            >
              {sending
                ? "Enviando…"
                : `Invitar a ${selected.size} ${selected.size === 1 ? "pista" : "pistas"}`}
            </PrimaryButton>
          </>
        }
      >
        {/* A quién */}
        <div className="flex flex-col gap-2.5">
          <FieldLabel required>A QUIÉN INVITAS</FieldLabel>

          <div
            className="grid grid-cols-2 gap-2.5"
            role="radiogroup"
            aria-label="Cómo identificarlo"
          >
            <MethodOption
              selected={method === "email"}
              onSelect={() => {
                setMethod("email");
                setError("");
              }}
              icon={<Mail className="h-[15px] w-[15px]" />}
              label="Por correo"
            />
            <MethodOption
              selected={method === "code"}
              onSelect={() => {
                setMethod("code");
                setError("");
              }}
              icon={<Hash className="h-[15px] w-[15px]" />}
              label="Por código"
            />
          </div>

          {method === "email" ? (
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              placeholder="persona@correo.com"
              autoComplete="off"
              aria-label="Correo del colaborador"
              className="rounded-2xl border border-[#E8E8EC] px-4 py-3 text-[13px] font-medium text-[#1C1D22] transition-colors placeholder:font-normal placeholder:text-[#A6AAB2] focus:border-[#FF5C00] focus:outline-none focus:ring-[3px] focus:ring-[#FF5C00]/15"
            />
          ) : (
            <input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setError("");
              }}
              placeholder="Código de usuario"
              autoComplete="off"
              aria-label="Código del colaborador"
              className="rounded-2xl border border-[#E8E8EC] px-4 py-3 font-mono text-[13px] font-medium text-[#1C1D22] transition-colors placeholder:font-normal placeholder:text-[#A6AAB2] focus:border-[#FF5C00] focus:outline-none focus:ring-[3px] focus:ring-[#FF5C00]/15"
            />
          )}
        </div>

        {/* Qué le estás dando: el alcance, con nombre y apellidos */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-3">
            <FieldLabel>ENTRARÁ EN ESTAS PISTAS</FieldLabel>
            <span className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleAll}
                disabled={allIds.length === 0}
                className="rounded-full bg-[#FFEADD] px-2.5 py-1 text-[11px] font-semibold text-[#FF5C00] transition-colors hover:bg-[#FFD9C2] disabled:opacity-40"
              >
                {allSelected ? "Quitar todas" : "Seleccionar todas"}
              </button>
              <span className="rounded-full bg-[#F4F5F7] px-2 py-0.5 font-mono text-[10.5px] font-semibold text-[#71757E]">
                {selected.size}/{tracks.length}
              </span>
            </span>
          </div>

          {tracks.length === 0 ? (
            <p className="flex items-start gap-2.5 rounded-[14px] bg-[#FDECEC] px-3.5 py-3 text-[11px] leading-relaxed text-[#E5484D]">
              <TriangleAlert className="mt-px h-3.5 w-3.5 flex-shrink-0" />
              Este álbum todavía no tiene pistas. Sube un reporte del distribuidor y vuelve.
            </p>
          ) : (
            <div className="relative">
              <ol className="flex max-h-[224px] flex-col gap-1.5 overflow-y-auto rounded-[18px] border border-[#E8E8EC] bg-[#F8F9FA] p-2">
                {titles.map((title, index) => {
                  const track = tracks[index];
                  const isChecked = selected.has(track._id);
                  const thumb = track.spotifyData?.album?.images?.[0]?.url ?? cover;

                  return (
                    <li key={track._id ?? index}>
                      <label
                        className={`flex cursor-pointer items-center gap-3 rounded-[14px] border px-2.5 py-2 transition-all ${
                          isChecked
                            ? "border-[#FF5C00]/30 bg-white shadow-[0_2px_8px_-2px_rgba(16,17,20,0.06)]"
                            : "border-transparent bg-white/50 opacity-65 hover:bg-white/90 hover:opacity-100"
                        }`}
                      >
                        <span className="relative flex flex-shrink-0 items-center justify-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleTrack(track._id)}
                            aria-label={`Incluir ${title}`}
                            className="sr-only"
                          />
                          <span
                            aria-hidden="true"
                            className={`flex h-[18px] w-[18px] items-center justify-center rounded-[6px] transition-colors ${
                              isChecked
                                ? "bg-[#FF5C00] text-white shadow-[0_2px_6px_-1px_rgba(255,92,0,0.45)]"
                                : "border border-[#D9DAE0] bg-white"
                            }`}
                          >
                            {isChecked && <Check className="h-3 w-3 stroke-[2.75]" />}
                          </span>
                        </span>

                        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-[11px] bg-[#F4F5F7] ring-1 ring-black/5">
                          {thumb ? (
                            <img src={thumb} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <Music className="h-4 w-4 text-[#A6AAB2]" />
                          )}
                        </span>

                        <span className="flex min-w-0 flex-1 flex-col gap-1">
                          <span className="truncate text-[12.5px] font-semibold text-[#1C1D22]">
                            {title}
                          </span>
                          {(track.isrc || upc) && (
                            <span className="flex flex-wrap items-center gap-1.5">
                              {track.isrc && (
                                <span className="rounded-md bg-[#F4F5F7] px-1.5 py-0.5 font-mono text-[10px] text-[#71757E]">
                                  ISRC {track.isrc}
                                </span>
                              )}
                              {upc && (
                                <span className="rounded-md bg-[#F4F5F7] px-1.5 py-0.5 font-mono text-[10px] text-[#71757E]">
                                  UPC {upc}
                                </span>
                              )}
                            </span>
                          )}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ol>
              {/* Con más pistas de las que caben, la última fila se corta por la
                  mitad y parece un defecto. El degradado la convierte en lo que
                  es: la señal de que la lista sigue. */}
              {tracks.length > 4 && (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-1 bottom-0 h-8 rounded-b-[18px] bg-gradient-to-t from-[#F8F9FA] to-transparent"
                />
              )}
            </div>
          )}
        </div>

        <p className="flex items-start gap-2.5 rounded-[14px] bg-[#F4F5F7] px-3.5 py-3 text-[11px] leading-relaxed text-[#71757E]">
          <UserPlus className="mt-px h-3.5 w-3.5 flex-shrink-0 text-[#A6AAB2]" />
          Se le invita solo a las pistas marcadas. Las que lleguen en próximos reportes no
          se incluyen solas: habrá que invitarle otra vez.
        </p>

        {error && (
          <p className="flex items-center gap-1.5 text-[12px] font-medium text-[#E5484D]">
            <TriangleAlert className="h-3.5 w-3.5 flex-shrink-0" />
            {error}
          </p>
        )}
      </ModalShell>
    </form>
  );
}

/** Cómo se identifica a la persona: por su correo o por su código de Splitme. */
function MethodOption({
  selected,
  onSelect,
  icon,
  label,
}: {
  selected: boolean;
  onSelect: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`flex items-center gap-2.5 rounded-2xl px-4 py-3 transition-colors ${
        selected
          ? "border-[1.5px] border-[#FF5C00] bg-[#FFEADD]"
          : "border border-[#E8E8EC] bg-white hover:border-[#D9DAE0]"
      }`}
    >
      <span
        className={`flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-[9px] ${
          selected ? "bg-[#FF5C00] text-white" : "bg-[#F4F5F7] text-[#71757E]"
        }`}
      >
        {icon}
      </span>
      <span
        className={`flex-1 text-left text-[12.5px] font-semibold ${
          selected ? "text-[#EA580C]" : "text-[#1C1D22]"
        }`}
      >
        {label}
      </span>
      {selected && <Check className="h-[15px] w-[15px] flex-shrink-0 text-[#FF5C00]" />}
    </button>
  );
}
