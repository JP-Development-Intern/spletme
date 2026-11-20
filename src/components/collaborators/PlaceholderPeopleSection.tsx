import { useEffect, useMemo, useState } from "react";
import { Loader, TriangleAlert, Check, Plus, ArrowUpRight, Search } from "lucide-react";
import { Link } from "react-router-dom";
import {
  placeholdersService,
  type PlaceholderProfile,
  type PlaceholderRole,
} from "@/services/placeholders";
import { PlaceholderAvatar } from "./PlaceholderAvatar";

interface PlaceholderPeopleSectionProps {
  /** Mientras está a la vista: al abrirse carga los perfiles del owner. */
  isOpen: boolean;
  songId: string;
  /** Se dispara cuando alguien queda vinculado a la canción. */
  onAttached: (profile: PlaceholderProfile) => void;
}

const ROLES: { value: PlaceholderRole; label: string; detail: string }[] = [
  { value: "collaborator", label: "Colaborador", detail: "Solo consulta su reparto" },
  { value: "label", label: "Sello", detail: "Además puede repartir splits" },
];

const normalize = (value: string) => value.trim().toLocaleLowerCase("es");

const messageFrom = (err: unknown, fallback: string): string => {
  const response = (err as { response?: { data?: { message?: string; error?: string } } })
    ?.response;
  return response?.data?.message ?? response?.data?.error ?? fallback;
};

/**
 * FUNCIONALIDAD TEMPORAL — perfiles sin cuenta, dentro del panel de splits.
 *
 * Junta las dos cosas que antes vivían separadas: añadir a la canción a alguien
 * que ya existe (lo que hacía `PlaceholderProfileModal`) y darlo de alta (lo que
 * hace la página «Personas sin cuenta», con la misma llamada).
 *
 * El alta se había sacado de la canción porque desde ahí no se veía la lista
 * completa y era fácil crear a la misma persona dos veces. Aquí el nombre que se
 * escribe para crear también filtra la lista de debajo: si ya existe se ve antes
 * de crearla, y el botón se apaga cuando el nombre coincide con uno guardado.
 */
export function PlaceholderPeopleSection({
  isOpen,
  songId,
  onAttached,
}: PlaceholderPeopleSectionProps) {
  const [role, setRole] = useState<PlaceholderRole>("collaborator");
  const [profiles, setProfiles] = useState<PlaceholderProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);

  const load = async () => {
    setProfiles(await placeholdersService.list());
  };

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

  const trimmed = name.trim();
  const duplicate = useMemo(
    () => profiles.find((profile) => normalize(profile.name) === normalize(trimmed)) ?? null,
    [profiles, trimmed],
  );
  const visible = useMemo(() => {
    if (!trimmed) return profiles;
    const query = normalize(trimmed);
    return profiles.filter((profile) => normalize(profile.name).includes(query));
  }, [profiles, trimmed]);

  // Igual que en «Personas sin cuenta»: se crea, se limpia el campo y se relee la lista.
  const create = async () => {
    if (!trimmed || creating || duplicate) return;
    setCreating(true);
    setError("");
    try {
      const created = await placeholdersService.create(trimmed);
      setName("");
      setCreatedId(created?._id ?? null);
      await load();
    } catch (err) {
      setError(messageFrom(err, "No se pudo crear el perfil."));
    } finally {
      setCreating(false);
    }
  };

  // Igual que en `PlaceholderProfileModal`.
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

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-[22px] pb-5 pt-[18px]">
        {error && (
          <p className="flex items-start gap-2.5 rounded-[14px] border border-[#E5484D]/30 bg-[#E5484D]/[0.14] px-3.5 py-3 text-[12px] text-[#FF8F92]">
            <TriangleAlert className="mt-px h-4 w-4 flex-shrink-0" />
            {error}
          </p>
        )}

        {/* Crear, o encontrar a quien ya existe: el mismo campo hace las dos cosas */}
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[9.5px] font-medium tracking-[1.2px] text-white/65">
            NOMBRE DE LA PERSONA
          </span>
          <div className="flex flex-wrap items-center gap-2.5">
            <label className="relative flex min-w-[220px] flex-1 items-center">
              <Search className="pointer-events-none absolute left-4 h-4 w-4 text-white/40" />
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && create()}
                placeholder="Como quieras verla en el reparto"
                maxLength={80}
                aria-label="Nombre de la persona"
                className="w-full rounded-[16px] border border-white/[0.14] bg-white/[0.06] py-3 pl-11 pr-4 text-[13px] text-white placeholder:text-white/40 outline-none transition-colors focus:border-[#FF8A3D] focus:ring-[3px] focus:ring-[#FF5C00]/25"
              />
            </label>
            <button
              type="button"
              onClick={create}
              disabled={!trimmed || creating || Boolean(duplicate)}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[#FF5C00] px-[18px] py-[11px] text-[12.5px] font-semibold text-white shadow-[0_8px_20px_-6px_rgba(255,92,0,0.35)] transition-colors enabled:hover:bg-[#EA580C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:cursor-not-allowed disabled:bg-white/[0.08] disabled:text-white/40 disabled:shadow-none"
            >
              {creating ? (
                <Loader className="h-[15px] w-[15px] animate-spin" />
              ) : (
                <Plus className="h-[15px] w-[15px]" />
              )}
              {creating ? "Creando…" : "Crear"}
            </button>
          </div>
          <span className={`text-[11px] leading-relaxed ${duplicate ? "text-[#FF8A3D]" : "text-white/50"}`}>
            {duplicate
              ? `«${duplicate.name}» ya existe: añádela desde la lista de abajo.`
              : "Escribe para buscar entre las que ya tienes; si no está, créala."}
          </span>
        </div>

        {/* El papel solo se elige si hay a quién asignárselo. */}
        {!loading && profiles.length > 0 && (
          <div className="flex flex-col gap-2.5">
            <span className="font-mono text-[9.5px] font-medium tracking-[1.2px] text-white/65">
              QUÉ PAPEL TIENE
            </span>
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

        {/* A quién añades */}
        <div className="flex flex-col gap-2.5">
          {(loading || profiles.length > 0) && (
            <span className="font-mono text-[9.5px] font-medium tracking-[1.2px] text-white/65">
              A QUIÉN AÑADES
            </span>
          )}

          {loading ? (
            <p className="flex items-center gap-2.5 px-1 text-[12px] text-white/50">
              <Loader className="h-3.5 w-3.5 animate-spin" />
              Buscando…
            </p>
          ) : profiles.length === 0 ? (
            <p className="rounded-[16px] border border-dashed border-white/25 bg-white/[0.04] px-4 py-5 text-[12px] leading-relaxed text-white/65">
              Todavía no has creado a nadie sin cuenta. Escribe su nombre arriba y créala; después
              aparecerá aquí para añadirla a la canción.
            </p>
          ) : visible.length === 0 ? (
            <p className="px-1 text-[12px] text-white/50">
              Nadie se llama así todavía. Puedes crearla con el botón de arriba.
            </p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {visible.map((profile) => (
                <li
                  key={profile._id}
                  className={`flex items-center gap-3 rounded-[16px] border px-3.5 py-2.5 ${
                    profile._id === createdId
                      ? "border-[#FF8A3D]/40 bg-[#FF5C00]/[0.08]"
                      : "border-white/[0.12] bg-white/[0.04]"
                  }`}
                >
                  <PlaceholderAvatar name={profile.name} onGlass />
                  <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-white">
                    {profile.name}
                  </span>
                  {profile._id === createdId && (
                    <span className="shrink-0 text-[10.5px] font-semibold text-[#FF8A3D]">
                      Recién creada
                    </span>
                  )}
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
      </div>

      <div className="h-px shrink-0 bg-white/[0.09]" />

      <footer className="flex shrink-0 flex-wrap items-center gap-2.5 px-[22px] pb-[18px] pt-[15px]">
        <p className="flex-1 text-[11px] leading-[1.35] text-white/50">
          No recibe correos ni puede entrar en Splitme. Su parte se acumula a su nombre.
        </p>
        <Link
          to="/panel/placeholder-profiles"
          className="inline-flex items-center gap-1 text-[12px] font-semibold text-white/80 transition-colors hover:text-[#FFB067]"
        >
          Ver todas en Personas sin cuenta
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </footer>
    </>
  );
}
