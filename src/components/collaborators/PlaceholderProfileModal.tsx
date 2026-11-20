import { useEffect, useState } from "react";
import { UserPlus, Loader, TriangleAlert, Check, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { ModalShell, FieldLabel, SecondaryButton } from "@/components/ui/ModalShell";
import {
  placeholdersService,
  type PlaceholderProfile,
  type PlaceholderRole,
} from "@/services/placeholders";
import { PlaceholderAvatar } from "./PlaceholderAvatar";

interface PlaceholderProfileModalProps {
  isOpen: boolean;
  songId: string;
  songTitle?: string;
  onClose: () => void;
  /** Se dispara cuando alguien queda vinculado a la canción. */
  onAttached: (profile: PlaceholderProfile) => void;
}

const ROLES: { value: PlaceholderRole; label: string; detail: string }[] = [
  { value: "collaborator", label: "Colaborador", detail: "Solo consulta su reparto" },
  { value: "label", label: "Sello", detail: "Además puede repartir splits" },
];

/**
 * FUNCIONALIDAD TEMPORAL — perfiles sin cuenta.
 *
 * Añade a esta canción a alguien que todavía no se ha registrado, eligiéndolo
 * entre los perfiles que el owner ya tiene creados.
 *
 * Aquí NO se crea a nadie: dar de alta un perfil ocurre en un solo sitio,
 * «Personas sin cuenta» (el desplegable del usuario). Tenerlo también aquí
 * repartía la misma alta entre dos pantallas y hacía fácil crear duplicados de
 * la misma persona sin verlos, porque desde la canción no se ve la lista
 * completa. Cuando no hay ninguno, este modal lleva allí.
 */
export function PlaceholderProfileModal({
  isOpen,
  songId,
  songTitle,
  onClose,
  onAttached,
}: PlaceholderProfileModalProps) {
  const [role, setRole] = useState<PlaceholderRole>("collaborator");
  const [profiles, setProfiles] = useState<PlaceholderProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    let alive = true;
    setLoading(true);
    placeholdersService
      .list()
      .then((data) => alive && setProfiles(data))
      .catch(() => alive && setProfiles([]))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [isOpen]);

  const messageFrom = (err: unknown, fallback: string): string => {
    const response = (err as { response?: { data?: { message?: string; error?: string } } })
      ?.response;
    return response?.data?.message ?? response?.data?.error ?? fallback;
  };

  const attachExisting = async (profile: PlaceholderProfile) => {
    setBusyId(profile._id);
    setError("");
    try {
      await placeholdersService.attachToSong(profile._id, songId, role);
      onAttached(profile);
    } catch (err) {
      setError(messageFrom(err, "No se pudo añadir a esta canción."));
    } finally {
      setBusyId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalShell
      title="Añadir a alguien sin cuenta"
      subtitle={songTitle ?? "Esta canción"}
      onGlass
      locked={busyId !== null}
      onClose={onClose}
      logo={
        <span className="flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center rounded-[14px] border-[1.5px] border-dashed border-white/40 bg-white/[0.06]">
          <UserPlus className="h-[18px] w-[18px] text-white/70" />
        </span>
      }
      footer={
        <>
          <span className="flex-1 text-[11px] leading-relaxed text-white/50">
            No recibe correos ni puede entrar en Splitme. Su parte se acumula a su nombre.
          </span>
          <SecondaryButton onClick={onClose}>Cerrar</SecondaryButton>
        </>
      }
    >
      {error && (
        <p className="flex items-start gap-2.5 rounded-[14px] border border-[#E5484D]/30 bg-[#E5484D]/[0.14] px-3.5 py-3 text-[12px] text-[#FF8F92]">
          <TriangleAlert className="mt-px h-4 w-4 flex-shrink-0" />
          {error}
        </p>
      )}

      {/* El papel solo se elige si hay a quién asignárselo. */}
      {!loading && profiles.length > 0 && (
      <div className="flex flex-col gap-2.5">
        <FieldLabel>QUÉ PAPEL TIENE</FieldLabel>
        <div className="grid grid-cols-2 gap-2.5">
          {ROLES.map((option) => {
            const active = role === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setRole(option.value)}
                aria-pressed={active}
                className={`flex flex-col items-start gap-0.5 rounded-[16px] border px-3.5 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70 ${
                  active
                    ? "border-[1.5px] border-[#FF8A3D] bg-[#FF5C00]/[0.16]"
                    : "border-white/[0.12] bg-white/[0.06] hover:bg-white/[0.10]"
                }`}
              >
                <span
                  className={`text-[12.5px] font-semibold ${active ? "text-[#FFB48A]" : "text-white"}`}
                >
                  {option.label}
                </span>
                <span className="text-[11px] text-white/65">{option.detail}</span>
              </button>
            );
          })}
        </div>
      </div>
      )}

      {/* A quién añades: solo perfiles que ya existen. */}
      <div className="flex flex-col gap-2.5">
        {(loading || profiles.length > 0) && <FieldLabel>A QUIÉN AÑADES</FieldLabel>}

        {loading ? (
          <p className="flex items-center gap-2.5 px-1 text-[12px] text-white/50">
            <Loader className="h-3.5 w-3.5 animate-spin" />
            Buscando…
          </p>
        ) : profiles.length === 0 ? (
          <div className="flex flex-col items-start gap-3 rounded-[16px] border border-dashed border-white/25 bg-white/[0.04] px-4 py-5">
            <span className="text-[12.5px] font-semibold text-white">
              Todavía no has creado a nadie sin cuenta
            </span>
            <span className="text-[11.5px] leading-relaxed text-white/65">
              Las personas sin cuenta se dan de alta en su propia pantalla, y desde aquí las
              añades a la canción.
            </span>
            <Link
              to="/panel/placeholder-profiles"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#FF5C00] px-3.5 py-2.5 text-[12px] font-semibold text-white shadow-[0_8px_20px_-6px_rgba(255,92,0,0.35)] transition-colors hover:bg-[#EA580C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              Ir a Personas sin cuenta
              <ArrowRight className="h-[15px] w-[15px]" />
            </Link>
          </div>
        ) : (
          <ul className="flex max-h-[260px] flex-col gap-1.5 overflow-y-auto">
            {profiles.map((profile) => (
              <li
                key={profile._id}
                className="flex items-center gap-3 rounded-[16px] border border-white/[0.12] bg-white/[0.04] px-3.5 py-2.5"
              >
                <PlaceholderAvatar name={profile.name} onGlass />
                <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-white">
                  {profile.name}
                </span>
                <button
                  type="button"
                  onClick={() => attachExisting(profile)}
                  disabled={busyId !== null}
                  className="flex flex-shrink-0 items-center gap-1.5 rounded-full border border-[#FF8A3D]/35 bg-[#FF5C00]/[0.16] px-3 py-2 text-[11.5px] font-semibold text-[#FF9A5C] transition-colors enabled:hover:bg-[#FF5C00]/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70 disabled:cursor-not-allowed disabled:border-transparent disabled:bg-white/[0.06] disabled:text-white/40"
                >
                  {busyId === profile._id ? (
                    <Loader className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  Añadir
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </ModalShell>
  );
}
