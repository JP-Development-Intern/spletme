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
        locked={loading}
        onClose={onClose}
        logo={provider ? <DistributorMark name={provider.name} logo={provider.logo} /> : undefined}
        footer={
          <>
            <span className="flex-1 text-[11px] text-[#A6AAB2]">
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
                  className={`flex h-[74px] flex-col items-center justify-center gap-1.5 rounded-2xl px-2 transition-colors ${
                    selected
                      ? "border-[1.5px] border-[#FF5C00] bg-[#FFEADD]"
                      : "border border-[#E8E8EC] bg-white hover:border-[#D9DAE0]"
                  }`}
                >
                  <img src={d.logo} alt="" loading="lazy" className="h-7 w-7 object-contain" />
                  <span
                    className={`w-full truncate text-center text-[10.5px] ${
                      selected ? "font-semibold text-[#EA580C]" : "font-medium text-[#71757E]"
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
              className="flex w-full items-center gap-2.5 rounded-2xl bg-[#F4F5F7] px-3.5 py-3 text-left transition-colors hover:bg-[#E8E8EC]"
            >
              <Search className="h-[15px] w-[15px] flex-shrink-0 text-[#71757E]" />
              <span className="flex-1 truncate text-[12px] text-[#71757E]">
                {provider && !FEATURED.some((f) => f.id === provider.id)
                  ? provider.name
                  : `Buscar entre ${restCount} distribuidores más…`}
              </span>
              <ChevronDown className="h-[15px] w-[15px] flex-shrink-0 text-[#A6AAB2]" />
            </button>

            {open && (
              <div className="absolute bottom-full left-0 z-10 mb-1.5 flex w-full flex-col overflow-hidden rounded-2xl border border-[#E8E8EC] bg-white shadow-[0_14px_36px_-8px_rgba(16,17,20,0.16)]">
                <div className="flex items-center gap-2.5 border-b border-[#E8E8EC] px-3.5 py-2.5">
                  <Search className="h-4 w-4 flex-shrink-0 text-[#A6AAB2]" />
                  <input
                    autoFocus
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar distribuidor…"
                    className="w-full text-[12.5px] text-[#1C1D22] placeholder:text-[#A6AAB2] focus:outline-none"
                  />
                  <span className="flex-shrink-0 rounded-lg bg-[#F4F5F7] px-2 py-0.5 font-mono text-[10px] font-semibold text-[#71757E]">
                    {filtered.length}
                  </span>
                </div>
                <div className="max-h-[220px] overflow-y-auto p-1.5">
                  {filtered.length === 0 ? (
                    <p className="flex items-center gap-2 px-2.5 py-3 text-[12px] text-[#71757E]">
                      <CirclePlus className="h-3.5 w-3.5 flex-shrink-0 text-[#A6AAB2]" />
                      No está en el catálogo de Spotify.
                    </p>
                  ) : (
                    filtered.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => selectProvider(d)}
                        className={`flex w-full items-center gap-2.5 rounded-[13px] px-2.5 py-2 text-left transition-colors ${
                          provider?.id === d.id ? "bg-[#FFEADD]" : "hover:bg-[#F4F5F7]"
                        }`}
                      >
                        <img
                          src={d.logo}
                          alt=""
                          loading="lazy"
                          className="h-6 w-6 flex-shrink-0 rounded object-contain"
                        />
                        <span className="flex-1 truncate text-[12.5px] text-[#1C1D22]">
                          {d.name}
                        </span>
                        {provider?.id === d.id && (
                          <Check className="h-4 w-4 flex-shrink-0 text-[#FF5C00]" />
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
            className={`rounded-2xl border px-4 py-3 text-[13px] font-medium text-[#1C1D22] placeholder:font-normal placeholder:text-[#A6AAB2] transition-colors focus:outline-none focus:ring-[3px] focus:ring-[#FF5C00]/15 ${
              nameInvalid
                ? "border-[1.5px] border-[#E5484D] bg-[#FDECEC]"
                : "border-[#E8E8EC] focus:border-[#FF5C00]"
            }`}
          />
          {duplicated ? (
            <div className="flex flex-col gap-2">
              <span className="flex items-center gap-1.5 text-[11.5px] font-medium text-[#E5484D]">
                <TriangleAlert className="h-3 w-3 flex-shrink-0" />
                Ya tienes un distribuidor llamado así.
              </span>
              {suggestions.length > 0 && (
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] text-[#A6AAB2]">Sugerencias:</span>
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setName(s)}
                      className="rounded-[13px] bg-[#F4F5F7] px-2.5 py-1 text-[11px] font-medium text-[#1C1D22] transition-colors hover:bg-[#E8E8EC]"
                    >
                      {s}
                    </button>
                  ))}
                </span>
              )}
            </div>
          ) : (
            <span className="text-[11px] leading-relaxed text-[#A6AAB2]">
              Así lo verás en tus listas. Útil si tienes varias cuentas del mismo distribuidor.
            </span>
          )}
        </div>

        {/* Moneda */}
        <div className="flex flex-col gap-2">
          <FieldLabel>MONEDA HABITUAL DE SUS REPORTES</FieldLabel>
          <CurrencyPicker value={currency} onChange={setCurrency} />
        </div>

        <p className="flex items-start gap-2.5 rounded-[14px] bg-[#F4F5F7] px-3.5 py-3 text-[11px] leading-relaxed text-[#71757E]">
          <Info className="mt-px h-3.5 w-3.5 flex-shrink-0" />
          Todo el dinero se guarda en dólares. Si eliges euros, cada vez que subas un reporte te
          pediremos el cambio de su periodo para convertirlo.
        </p>

        {error && !duplicated && (
          <p className="text-[12px] font-medium text-[#E5484D]">{error}</p>
        )}
      </ModalShell>
    </form>
  );
}
