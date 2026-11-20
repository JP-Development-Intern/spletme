import { useState } from "react";
import { Mail, Hash, UserCog, UserPlus, AlertCircle } from "lucide-react";
import SongService from "@/services/songs";

interface InviteCollaboratorSectionProps {
  songId: string;
  /** Tras añadirlo: el panel recarga la página para que aparezca en el reparto. */
  onAdded: () => void;
}

const ROLES: { value: string; label: string }[] = [
  { value: "singer", label: "Cantante" },
  { value: "composer", label: "Compositor" },
  { value: "musician", label: "Músico" },
  { value: "producer", label: "Productor" },
  { value: "arranger", label: "Arreglista" },
  { value: "lyricist", label: "Letrista" },
  { value: "mixer", label: "Mezclador" },
  { value: "mastering", label: "Mastering" },
];

const FIELD =
  "w-full rounded-[16px] border border-white/[0.14] bg-white/[0.06] py-3 pl-11 pr-4 text-[13px] text-white placeholder:text-white/40 outline-none transition-colors focus:border-[#FF8A3D] focus:ring-[3px] focus:ring-[#FF5C00]/25";

/**
 * Añadir un colaborador a la canción, por correo o por su código de usuario.
 *
 * Es el formulario del antiguo botón «Agregar colaborador» (`addCollaborator.tsx`),
 * con la misma llamada: `SongService.addCollaborator` con el correo o el código.
 * El rol se elige igual que allí; tampoco allí viajaba en la petición.
 */
export function InviteCollaboratorSection({ songId, onAdded }: InviteCollaboratorSectionProps) {
  const [method, setMethod] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [role, setRole] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const value = method === "email" ? email.trim() : code.trim();

  const addNewCollaborator = async () => {
    setError(null);
    setSending(true);
    const requestPayload = {
      songId: songId || "",
      ...(method === "email" ? { collaboratorEmail: email } : { collaboratorId: code }),
    };

    const response = await SongService.addCollaborator(requestPayload);
    setSending(false);

    if (response.success) {
      setEmail("");
      setCode("");
      setRole("");
      onAdded();
    } else {
      // Antes salía en un `alert`; aquí el mismo mensaje se queda junto al formulario.
      setError(response.message ?? "No se pudo añadir al colaborador.");
    }
  };

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-[22px] pb-5 pt-[18px]">
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[9.5px] font-medium tracking-[1.2px] text-white/65">
            CÓMO LO AÑADES
          </span>
          <div className="flex w-fit items-center gap-0.5 rounded-full bg-black/[0.22] p-1" role="group">
            {(
              [
                ["email", "Por correo", Mail],
                ["code", "Por código", Hash],
              ] as const
            ).map(([option, label, Icon]) => {
              const active = method === option;
              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setMethod(option)}
                  className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-[12.5px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70 ${
                    active
                      ? "bg-[#F7EDE6]/[0.92] font-semibold text-[#1C1D22]"
                      : "font-medium text-white/80 hover:text-white"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex max-w-[460px] flex-col gap-3">
          {method === "email" ? (
            <label className="relative flex items-center">
              <Mail className="pointer-events-none absolute left-4 h-4 w-4 text-white/40" />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="Correo electrónico"
                aria-label="Correo electrónico"
                className={FIELD}
              />
            </label>
          ) : (
            <label className="relative flex items-center">
              <Hash className="pointer-events-none absolute left-4 h-4 w-4 text-white/40" />
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Código de usuario"
                aria-label="Código de usuario"
                className={FIELD}
              />
            </label>
          )}

          <label className="relative flex items-center">
            <UserCog className="pointer-events-none absolute left-4 h-4 w-4 text-white/40" />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              aria-label="Rol"
              className={`${FIELD} appearance-none ${role ? "" : "text-white/40"}`}
            >
              <option value="" disabled className="bg-[#2B1E17] text-white/60">
                Seleccionar rol
              </option>
              {ROLES.map((option) => (
                <option key={option.value} value={option.value} className="bg-[#2B1E17] text-white">
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {error && (
          <div className="flex max-w-[460px] items-center gap-2.5 rounded-[14px] border border-[#E5484D]/30 bg-[#E5484D]/[0.14] px-3 py-2.5">
            <AlertCircle className="h-3.5 w-3.5 shrink-0 text-[#FF8F92]" />
            <span className="text-[11.5px] font-medium text-[#FF8F92]">{error}</span>
          </div>
        )}
      </div>

      <div className="h-px shrink-0 bg-white/[0.09]" />

      <footer className="flex shrink-0 items-center gap-2.5 px-[22px] pb-[18px] pt-[15px]">
        <p className="flex-1 text-[11px] leading-[1.35] text-white/50">
          Después podrás darle su parte en Reparto.
        </p>
        <button
          type="button"
          onClick={addNewCollaborator}
          disabled={sending || !value}
          className="inline-flex min-h-[44px] items-center gap-[7px] rounded-full bg-[#FF5C00] px-[18px] py-[11px] text-[12.5px] font-semibold text-white shadow-[0_8px_20px_-6px_rgba(255,92,0,0.35)] transition-colors enabled:hover:bg-[#EA580C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:cursor-not-allowed disabled:bg-white/[0.08] disabled:text-white/40 disabled:shadow-none"
        >
          {sending ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          ) : (
            <UserPlus className="h-3.5 w-3.5" />
          )}
          {sending ? "Añadiendo…" : "Añadir colaborador"}
        </button>
      </footer>
    </>
  );
}
