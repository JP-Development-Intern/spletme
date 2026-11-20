import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Check, ChevronDown, ArrowRight, Info, CirclePlus, TriangleAlert } from "lucide-react";
import type { CreateDistributorPayload, Currency } from "../../types/distributor.types";
import { SPOTIFY_DISTRIBUTORS, type SpotifyDistributor } from "../../const/distributors";
import {
  ModalShell,
  FieldLabel,
  PrimaryButton,
  SecondaryButton,
  DistributorMark,
} from "@/components/ui/ModalShell";
import { CurrencyPicker } from "@/components/distributors/CurrencyPicker";

interface Props {
  onClose: () => void;
  onConfirm: (payload: CreateDistributorPayload) => Promise<void>;
  /** Nombres ya usados, para avisar del duplicado antes de llamar al servidor. */
  existingNames?: string[];
}

/**
 * Los distribuidores que concentran casi todas las altas. Tenerlos a un clic
 * evita recorrer un desplegable de casi cien entradas en el caso habitual.
 */
const FEATURED_IDS = [
  "believe",
  "distrokid",
  "tunecore",
  "cd-baby",
  "amuse",
  "routenote",
  "too-lost",
  "landr",
];

const FEATURED = FEATURED_IDS.map((id) => SPOTIFY_DISTRIBUTORS.find((d) => d.id === id)).filter(
  (d): d is SpotifyDistributor => Boolean(d),
);

export default function CreateDistributorModal({ onClose, onConfirm, existingNames = [] }: Props) {
  const [provider, setProvider] = useState<SpotifyDistributor | null>(null);
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (selectRef.current && !selectRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const restCount = SPOTIFY_DISTRIBUTORS.length - FEATURED.length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const all = [...SPOTIFY_DISTRIBUTORS].sort(
      (a, b) => Number(b.id === "believe") - Number(a.id === "believe"),
    );
    if (!q) return all;
    return all.filter((d) => d.name.toLowerCase().includes(q));
  }, [query]);

  const trimmed = name.trim();
  const duplicated = existingNames.some((n) => n.toLowerCase() === trimmed.toLowerCase());
  const nameInvalid = Boolean(error) && (!trimmed || duplicated);

  /** Alternativas cuando el alias ya está cogido, para no dejar al usuario pensando. */
  const suggestions = useMemo(() => {
    if (!duplicated || !trimmed) return [];
    return [`${trimmed} 2`, `${trimmed} EU`, "Sello propio"].filter(
      (s) => !existingNames.some((n) => n.toLowerCase() === s.toLowerCase()),
    );
  }, [duplicated, trimmed, existingNames]);

  function selectProvider(d: SpotifyDistributor) {
    setProvider(d);
    setOpen(false);
    setQuery("");
    setError("");
    // El nombre oficial es el alias por defecto; casi siempre es el que se quiere.
    if (!trimmed) setName(d.name);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!provider) {
      setError("Selecciona el distribuidor del que vienen los reportes.");
      return;
    }
    if (!trimmed) {
      setError("Ponle un nombre para reconocerlo en tus listas.");
      return;
    }
    if (duplicated) {
      setError("Ya tienes un distribuidor llamado así. Usa otro nombre.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await onConfirm({
        name: trimmed,
        currency,
        provider: provider.name,
        photoUrl: provider.logo,
      });
      onClose();
    } catch {
      setError("No se pudo crear el distribuidor. Vuelve a intentarlo.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="contents">
      <ModalShell
        title="Nuevo distribuidor"
        subtitle={
          provider ? provider.name : "Conecta la cuenta de la que descargas tus reportes"
        }
        width="lg"
        onGlass
        locked={loading}
        onClose={onClose}
        logo={provider ? <DistributorMark name={provider.name} logo={provider.logo} /> : undefined}
        footer={
          <>
            <span className="flex-1 text-[11px] text-white/50">
              Después podrás subir su primer reporte
            </span>
            <SecondaryButton onClick={onClose} disabled={loading}>
              Cancelar
            </SecondaryButton>
            <PrimaryButton
              type="submit"
              disabled={loading || !provider || !trimmed || duplicated}
              icon={<ArrowRight className="h-[15px] w-[15px]" />}
            >
              {loading ? "Creando…" : "Crear y subir reporte"}
            </PrimaryButton>
          </>
        }
      >
        {/* Distribuidor */}
        <div className="flex flex-col gap-2.5">
          <FieldLabel required invalid={Boolean(error) && !provider}>
            DISTRIBUIDOR
          </FieldLabel>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {FEATURED.map((d) => {
              const selected = provider?.id === d.id;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => selectProvider(d)}
                  aria-pressed={selected}
                  className={`flex h-[78px] flex-col items-center justify-center gap-1.5 rounded-2xl px-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70 ${
                    selected
                      ? "border-[1.5px] border-[#FF8A3D] bg-[#FF5C00]/[0.16]"
                      : "border border-white/[0.12] bg-white/[0.06] hover:bg-white/[0.10]"
                  }`}
                >
                  {/* Los logos de Spotify están pensados para fondo claro: van en su placa blanca */}
                  <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-white p-1">
                    <img src={d.logo} alt="" loading="lazy" className="h-full w-full object-contain" />
                  </span>
                  <span
                    className={`w-full truncate text-center text-[10.5px] ${
                      selected ? "font-semibold text-[#FFB48A]" : "font-medium text-white/70"
                    }`}
                  >
                    {d.name}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="relative" ref={selectRef}>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              className="flex w-full items-center gap-2.5 rounded-2xl border border-white/[0.12] bg-white/[0.06] px-3.5 py-3 text-left transition-colors hover:bg-white/[0.10] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70"
            >
              <Search className="h-[15px] w-[15px] flex-shrink-0 text-white/50" />
              <span className="flex-1 truncate text-[12px] text-white/70">
                {provider && !FEATURED.some((f) => f.id === provider.id)
                  ? provider.name
                  : `Buscar entre ${restCount} distribuidores más…`}
              </span>
              <ChevronDown
                className={`h-[15px] w-[15px] flex-shrink-0 text-white/50 transition-transform ${open ? "rotate-180" : ""}`}
              />
            </button>

            {open && (
              // Opaco y no de vidrio: un desenfoque dentro del panel, que ya es
              // vidrio, solo vería el propio panel.
              <div className="absolute bottom-full left-0 z-10 mb-1.5 flex w-full flex-col overflow-hidden rounded-2xl border border-white/[0.14] bg-[#2B1E17] shadow-[0_20px_44px_-12px_rgba(0,0,0,0.6)]">
                <div className="flex items-center gap-2.5 border-b border-white/[0.09] px-3.5 py-2.5">
                  <Search className="h-4 w-4 flex-shrink-0 text-white/50" />
                  <input
                    autoFocus
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar distribuidor…"
                    className="w-full border-none bg-transparent p-0 text-[12.5px] text-white placeholder:text-white/40 focus:outline-none focus:ring-0"
                  />
                  <span className="flex-shrink-0 rounded-full bg-white/[0.08] px-2 py-0.5 font-mono text-[10px] font-semibold text-white/65">
                    {filtered.length}
                  </span>
                </div>
                <div className="max-h-[220px] overflow-y-auto p-1.5">
                  {filtered.length === 0 ? (
                    <p className="flex items-center gap-2 px-2.5 py-3 text-[12px] text-white/65">
                      <CirclePlus className="h-3.5 w-3.5 flex-shrink-0 text-white/50" />
                      No está en el catálogo de Spotify.
                    </p>
                  ) : (
                    filtered.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => selectProvider(d)}
                        className={`flex w-full items-center gap-2.5 rounded-[13px] px-2.5 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70 ${
                          provider?.id === d.id ? "bg-[#FF5C00]/[0.16]" : "hover:bg-white/[0.06]"
                        }`}
                      >
                        <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-white p-[3px]">
                          <img src={d.logo} alt="" loading="lazy" className="h-full w-full object-contain" />
                        </span>
                        <span className="flex-1 truncate text-[12.5px] text-white">
                          {d.name}
                        </span>
                        {provider?.id === d.id && (
                          <Check className="h-4 w-4 flex-shrink-0 text-[#FF8A3D]" />
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Nombre interno */}
        <div className="flex flex-col gap-2">
          <FieldLabel required invalid={nameInvalid}>
            NOMBRE INTERNO
          </FieldLabel>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError("");
            }}
            placeholder="Ej. Mi cuenta de DistroKid"
            className={`rounded-2xl border px-4 py-3 text-[13px] font-medium text-white placeholder:font-normal placeholder:text-white/40 transition-colors focus:outline-none focus:ring-[3px] focus:ring-[#FF5C00]/25 ${
              nameInvalid
                ? "border-[1.5px] border-[#FF8F92] bg-[#E5484D]/[0.12]"
                : "border-white/[0.14] bg-white/[0.06] focus:border-[#FF8A3D]"
            }`}
          />
          {duplicated ? (
            <div className="flex flex-col gap-2">
              <span className="flex items-center gap-1.5 text-[11.5px] font-medium text-[#FF8F92]">
                <TriangleAlert className="h-3 w-3 flex-shrink-0" />
                Ya tienes un distribuidor llamado así.
              </span>
              {suggestions.length > 0 && (
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] text-white/50">Sugerencias:</span>
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setName(s)}
                      className="rounded-full bg-white/[0.08] px-2.5 py-1 text-[11px] font-medium text-white transition-colors hover:bg-white/[0.14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70"
                    >
                      {s}
                    </button>
                  ))}
                </span>
              )}
            </div>
          ) : (
            <span className="text-[11px] leading-relaxed text-white/50">
              Así lo verás en tus listas. Útil si tienes varias cuentas del mismo distribuidor.
            </span>
          )}
        </div>

        {/* Moneda */}
        <div className="flex flex-col gap-2">
          <FieldLabel>MONEDA HABITUAL DE SUS REPORTES</FieldLabel>
          <CurrencyPicker value={currency} onChange={setCurrency} />
        </div>

        <p className="flex items-start gap-2.5 rounded-[14px] bg-white/[0.06] px-3.5 py-3 text-[11px] leading-relaxed text-white/65">
          <Info className="mt-px h-3.5 w-3.5 flex-shrink-0" />
          Todo el dinero se guarda en dólares. Si eliges euros, cada vez que subas un reporte te
          pediremos el cambio de su periodo para convertirlo.
        </p>

        {error && !duplicated && (
          <p className="text-[12px] font-medium text-[#FF8F92]">{error}</p>
        )}
      </ModalShell>
    </form>
  );
}
