import { useEffect, useMemo, useState } from "react";
import { glassSelectStyles } from "@/components/ui/selectStyles";
import Select from "react-select";
import {
  Crown,
  Globe,
  Radio,
  Info,
  Check,
  TriangleAlert,
  Loader2,
  Tag,
  Layers,
} from "lucide-react";
import { useReleaseFiltersForSongs } from "@/hooks/useReleaseFiltersForSongs";
import labelsService from "@/services/labels";
import { ModalShell, FieldLabel, PrimaryButton, SecondaryButton } from "@/components/ui/ModalShell";
import { SegmentedControl } from "./SegmentedControl";
import type { FilterType, SelectOption } from "@/types";

export interface LabelSplitTarget {
  type: "artistic" | "custom";
  /**
   * Cómo lo identifica el servidor: el id del sello artístico, o el nombre del
   * personalizado (sus rutas de reparto siguen yendo por nombre).
   */
  ref: string;
  /** Nombre del sello, para mostrarlo. */
  name: string;
  songCount: number;
  /** Canciones que ya tenían split, para avisar de que se sobrescriben. */
  alreadyWithSplit?: number;
}

interface LabelSplitModalProps {
  isOpen: boolean;
  onClose: () => void;
  target: LabelSplitTarget;
  /**
   * Panel de vidrio, para cuando se abre desde una página ya migrada. Por
   * defecto sigue en claro: el detalle de sello aún no está en vidrio.
   */
  onGlass?: boolean;
}

interface SplitSummary {
  total?: number;
  created?: number;
  updated?: number;
  errors?: number;
}

interface SplitResult {
  summary?: SplitSummary;
  failed?: Array<{ trackTitle?: string; reason?: string }>;
}

/**
 * Reparto del porcentaje del owner en todas las canciones de un sello.
 *
 * Es la misma operación para un sello artístico y para uno personalizado —solo
 * cambia el extremo del servidor—, así que comparten formulario: tenerlo dos
 * veces garantizaba que uno se quedara atrás al tocar el otro.
 */
export function LabelSplitModal({ isOpen, onClose, target, onGlass = false }: LabelSplitModalProps) {
  const g = onGlass;
  const [percentage, setPercentage] = useState("");
  const [countriesType, setCountriesType] = useState<FilterType>("all");
  const [selectedCountries, setSelectedCountries] = useState<readonly SelectOption[]>([]);
  const [platformsType, setPlatformsType] = useState<FilterType>("all");
  const [selectedPlatforms, setSelectedPlatforms] = useState<readonly SelectOption[]>([]);

  const [songIds, setSongIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SplitResult | null>(null);

  const { countryOptions, platformOptions, isLoadingFilters } = useReleaseFiltersForSongs(
    songIds,
    isOpen,
  );

  // Los países y plataformas que se pueden filtrar salen de las canciones del
  // sello, así que primero hay que saber cuáles son.
  useEffect(() => {
    if (!isOpen) return;

    setPercentage("");
    setCountriesType("all");
    setSelectedCountries([]);
    setPlatformsType("all");
    setSelectedPlatforms([]);
    setError(null);
    setResult(null);

    let active = true;
    const request =
      target.type === "custom"
        ? labelsService.getSongsByCustomLabel(target.ref).then((res) => res.data?.songs ?? [])
        : labelsService.getSongsByLabel(target.ref).then((res) => res.data ?? []);

    request.then((songs) => {
      if (active) setSongIds(songs.map((song) => song._id));
    });

    return () => {
      active = false;
    };
  }, [isOpen, target.ref, target.type]);

  const willOverwrite = target.alreadyWithSplit ?? 0;

  const notice = useMemo(() => {
    const songs = `${target.songCount} ${target.songCount === 1 ? "canción" : "canciones"}`;
    if (willOverwrite > 0) {
      return `Se aplica a las ${songs} del sello. Las ${willOverwrite} que ya tienen split se actualizan con el nuevo porcentaje.`;
    }
    return `Se aplica a las ${songs} del sello.`;
  }, [target.songCount, willOverwrite]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    const value = parseFloat(percentage);
    if (!value || value < 1 || value > 100) {
      setError("El porcentaje tiene que estar entre 1 y 100.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        percentage: value,
        countriesType,
        selectedCountries: selectedCountries.map((option) => option.value),
        platformsType,
        selectedPlatforms: selectedPlatforms.map((option) => option.value),
      };

      const response =
        target.type === "custom"
          ? await labelsService.createSplitByCustomLabel({ ...payload, labelName: target.ref })
          : await labelsService.createSplitByLabel({ ...payload, labelId: target.ref });

      if (response.error) {
        setError(response.message ?? "Los splits no se pudieron crear.");
        return;
      }

      setResult((response.data ?? {}) as SplitResult);
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setSubmitting(false);
    }
  };

  const mark = (
    <span
      className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[14px] ${
        target.type === "custom" ? "bg-[#FF5C00]" : g ? "bg-[#FF5C00]/[0.16]" : "bg-[#FFEADD]"
      }`}
    >
      {target.type === "custom" ? (
        <Layers className="h-[18px] w-[18px] text-white" />
      ) : (
        <Crown className={`h-[18px] w-[18px] ${g ? "text-[#FF8A3D]" : "text-[#FF5C00]"}`} />
      )}
    </span>
  );

  if (result) {
    const summary = result.summary ?? {};
    const failed = result.failed ?? [];

    return (
      <ModalShell
        title="Splits guardados"
        width="lg"
        onGlass={g}
        onClose={onClose}
        footer={
          <>
            <span className="min-w-0 flex-1" />
            <PrimaryButton onClick={onClose}>Cerrar</PrimaryButton>
          </>
        }
      >
        <div className="flex flex-col items-center gap-3 pb-1 pt-3 text-center">
          <span
            className={`flex h-[52px] w-[52px] items-center justify-center rounded-[18px] ${
              g ? "bg-[#45D39A]/[0.14]" : "bg-[#E4F5EC]"
            }`}
          >
            <Check className={`h-[22px] w-[22px] ${g ? "text-[#45D39A]" : "text-[#2FB37E]"}`} />
          </span>
          <h3
            className={`font-display text-[17px] ${
              g ? "font-medium text-white" : "font-semibold text-[#1C1D22]"
            }`}
          >
            Tu {percentage}% quedó aplicado
          </h3>
          <p className={`text-[12.5px] ${g ? "text-white/65" : "text-[#71757E]"}`}>
            en las canciones de {target.name}
          </p>
        </div>

        <div
          className={`flex items-center divide-x rounded-[18px] px-1 py-3 ${
            g ? "divide-white/[0.09] bg-white/[0.06]" : "divide-[#E8E8EC] bg-[#F4F5F7]"
          }`}
        >
          <ResultCell glass={g} label="TOTAL" value={summary.total ?? 0} />
          <ResultCell
            glass={g}
            label="CREADOS"
            value={summary.created ?? 0}
            valueClassName={g ? "text-[#45D39A]" : "text-[#2FB37E]"}
          />
          <ResultCell glass={g} label="ACTUALIZADOS" value={summary.updated ?? 0} />
          <ResultCell
            glass={g}
            label="ERRORES"
            value={summary.errors ?? 0}
            valueClassName={
              summary.errors
                ? g
                  ? "text-[#FF8F92]"
                  : "text-[#E5484D]"
                : g
                  ? "text-white/50"
                  : "text-[#A6AAB2]"
            }
          />
        </div>

        {failed.length > 0 && (
          <div className="flex flex-col gap-2">
            <FieldLabel>CON ERROR · {failed.length}</FieldLabel>
            <div className="flex max-h-[180px] flex-col gap-1.5 overflow-y-auto">
              {failed.map((item, index) => (
                <div
                  key={`${item.trackTitle}-${index}`}
                  className={`flex flex-col gap-0.5 rounded-[14px] px-3.5 py-2.5 ${
                    g ? "border border-[#E5484D]/30 bg-[#E5484D]/[0.12]" : "bg-[#FDECEC]"
                  }`}
                >
                  <span className={`text-[12px] font-semibold ${g ? "text-white" : "text-[#1C1D22]"}`}>
                    {item.trackTitle ?? "Canción sin título"}
                  </span>
                  <span className={`text-[11px] ${g ? "text-[#FF8F92]" : "text-[#E5484D]"}`}>
                    {item.reason}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </ModalShell>
    );
  }

  return (
    <ModalShell
      title={`Tu split en ${target.name}`}
      subtitle={
        <span className="flex items-center gap-1.5">
          <Tag className="h-3 w-3" />
          {target.songCount} {target.songCount === 1 ? "canción" : "canciones"}
          {willOverwrite > 0 && ` · ${willOverwrite} ya tienen split`}
        </span>
      }
      width="lg"
      onGlass={g}
      locked={submitting}
      onClose={onClose}
      logo={mark}
      footer={
        <>
          <span className={`min-w-0 flex-1 text-[11px] ${g ? "text-white/50" : "text-[#A6AAB2]"}`}>
            Se aplicará a {target.songCount} {target.songCount === 1 ? "canción" : "canciones"}
          </span>
          <SecondaryButton onClick={onClose} disabled={submitting}>
            Cancelar
          </SecondaryButton>
          <PrimaryButton
            onClick={handleSubmit}
            disabled={submitting}
            icon={
              submitting ? (
                <Loader2 className="h-[14px] w-[14px] animate-spin" />
              ) : (
                <Check className="h-[14px] w-[14px]" />
              )
            }
          >
            {submitting ? "Aplicando…" : "Crear splits"}
          </PrimaryButton>
        </>
      }
    >
      <div
        className={`flex items-start gap-2.5 rounded-2xl px-4 py-3 ${
          g ? "border border-[#FF8A3D]/30 bg-[#FF5C00]/[0.14]" : "bg-[#FFEADD]"
        }`}
      >
        <Info className={`mt-px h-4 w-4 flex-shrink-0 ${g ? "text-[#FF8A3D]" : "text-[#FF5C00]"}`} />
        <span className={`text-[11.5px] leading-relaxed ${g ? "text-white/80" : "text-[#1C1D22]"}`}>
          {notice}
        </span>
      </div>

      <label className="flex flex-col gap-2">
        <FieldLabel required invalid={Boolean(error)}>
          TU PORCENTAJE
        </FieldLabel>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-[150px] flex-shrink-0">
            <input
              type="number"
              min="1"
              max="100"
              step="0.01"
              value={percentage}
              autoFocus
              onChange={(e) => {
                setPercentage(e.target.value);
                if (error) setError(null);
              }}
              disabled={submitting}
              placeholder="0"
              className={`w-full rounded-2xl border py-3 pl-4 pr-9 font-mono text-base font-semibold focus:outline-none focus:ring-[3px] disabled:opacity-50 ${
                g
                  ? `text-white placeholder:text-white/40 ${
                      error
                        ? "border-[#FF8F92] bg-[#E5484D]/[0.12] focus:border-[#FF8F92] focus:ring-[#E5484D]/25"
                        : "border-white/[0.14] bg-white/[0.06] focus:border-[#FF8A3D] focus:ring-[#FF5C00]/25"
                    }`
                  : `bg-white text-[#1C1D22] placeholder:text-[#A6AAB2] ${
                      error
                        ? "border-[#E5484D] focus:border-[#E5484D] focus:ring-[#E5484D]/15"
                        : "border-[#E8E8EC] focus:border-[#FF5C00] focus:ring-[#FF5C00]/15"
                    }`
              }`}
            />
            <span
              className={`absolute right-4 top-1/2 -translate-y-1/2 font-mono text-sm ${
                g ? "text-white/50" : "text-[#A6AAB2]"
              }`}
            >
              %
            </span>
          </div>
          <span
            className={`min-w-0 flex-1 text-[11.5px] leading-relaxed ${
              g ? "text-white/50" : "text-[#A6AAB2]"
            }`}
          >
            El resto queda disponible para tus colaboradores en cada canción.
          </span>
        </div>
      </label>

      <div className="flex flex-col gap-2.5">
        <div className="flex flex-wrap items-center gap-2.5">
          <Globe className={`h-[13px] w-[13px] ${g ? "text-white/50" : "text-[#A6AAB2]"}`} />
          <FieldLabel>PAÍSES</FieldLabel>
          <div className="ml-auto">
            <SegmentedControl
              ariaLabel="Filtrar el split por países"
              value={countriesType}
              onChange={setCountriesType}
              options={[
                { value: "all", label: "Todos" },
                { value: "except", label: "Excepto" },
                { value: "only", label: "Solo" },
              ]}
            />
          </div>
        </div>
        {countriesType === "all" ? (
          <p
            className={`rounded-2xl border px-4 py-3 text-[12.5px] ${
              g ? "border-white/[0.12] bg-white/[0.04] text-white/65" : "border-[#E8E8EC] text-[#71757E]"
            }`}
          >
            Todos los países donde se reportaron ingresos.
          </p>
        ) : (
          <Select
            isMulti
            isLoading={isLoadingFilters}
            options={countryOptions}
            value={selectedCountries}
            onChange={(selection) => setSelectedCountries(selection ?? [])}
            styles={g ? glassSelectStyles : labelSelectStyles}
            menuPortalTarget={document.body}
            placeholder="Seleccionar países…"
            noOptionsMessage={() => "No hay países disponibles"}
          />
        )}
      </div>

      <div className="flex flex-col gap-2.5">
        <div className="flex flex-wrap items-center gap-2.5">
          <Radio className={`h-[13px] w-[13px] ${g ? "text-white/50" : "text-[#A6AAB2]"}`} />
          <FieldLabel>PLATAFORMAS</FieldLabel>
          <div className="ml-auto">
            <SegmentedControl
              ariaLabel="Filtrar el split por plataformas"
              value={platformsType}
              onChange={setPlatformsType}
              options={[
                { value: "all", label: "Todas" },
                { value: "except", label: "Excepto" },
                { value: "only", label: "Solo" },
              ]}
            />
          </div>
        </div>
        {platformsType === "all" ? (
          <p
            className={`rounded-2xl border px-4 py-3 text-[12.5px] ${
              g ? "border-white/[0.12] bg-white/[0.04] text-white/65" : "border-[#E8E8EC] text-[#71757E]"
            }`}
          >
            Todas las plataformas que reportan este sello.
          </p>
        ) : (
          <Select
            isMulti
            isLoading={isLoadingFilters}
            options={platformOptions}
            value={selectedPlatforms}
            onChange={(selection) => setSelectedPlatforms(selection ?? [])}
            styles={g ? glassSelectStyles : labelSelectStyles}
            menuPortalTarget={document.body}
            placeholder="Seleccionar plataformas…"
            noOptionsMessage={() => "No hay plataformas disponibles"}
          />
        )}
      </div>

      {error && (
        <div
          role="alert"
          className={`flex items-start gap-2.5 rounded-2xl border px-4 py-3 ${
            g ? "border-[#E5484D]/30 bg-[#E5484D]/[0.12]" : "border-[#F5C2C4] bg-[#FDECEC]"
          }`}
        >
          <TriangleAlert
            className={`mt-px h-4 w-4 flex-shrink-0 ${g ? "text-[#FF8F92]" : "text-[#E5484D]"}`}
          />
          <span className={`text-[12.5px] ${g ? "text-[#FF8F92]" : "text-[#E5484D]"}`}>{error}</span>
        </div>
      )}
    </ModalShell>
  );
}

function ResultCell({
  label,
  value,
  valueClassName,
  glass = false,
}: {
  label: string;
  value: number;
  valueClassName?: string;
  glass?: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-1 px-2">
      <span
        className={`font-mono text-[9px] font-medium tracking-[1.1px] ${
          glass ? "text-white/50" : "text-[#A6AAB2]"
        }`}
      >
        {label}
      </span>
      <span
        className={`font-mono text-[17px] ${glass ? "font-light" : "font-semibold"} ${
          valueClassName ?? (glass ? "text-white" : "text-[#1C1D22]")
        }`}
      >
        {value}
      </span>
    </div>
  );
}

/** react-select en la paleta del sistema, no en el naranja antiguo. */
const labelSelectStyles = {
  menuPortal: (base: Record<string, unknown>) => ({ ...base, zIndex: 10000 }),
  control: (base: Record<string, unknown>) => ({
    ...base,
    "border": "1px solid #E8E8EC",
    "borderRadius": "16px",
    "padding": "4px 6px",
    "boxShadow": "none",
    "fontSize": "12.5px",
    "&:hover": { border: "1px solid #D9DAE0" },
    "&:focus-within": { border: "1px solid #FF5C00" },
  }),
  option: (
    base: Record<string, unknown>,
    { isSelected, isFocused }: { isSelected: boolean; isFocused: boolean },
  ) => ({
    ...base,
    backgroundColor: isSelected ? "#FF5C00" : isFocused ? "#FFEADD" : "white",
    color: isSelected ? "white" : "#1C1D22",
    fontSize: "12.5px",
  }),
  multiValue: (base: Record<string, unknown>) => ({
    ...base,
    backgroundColor: "#FFEADD",
    borderRadius: "12px",
    padding: "1px 3px",
  }),
  multiValueLabel: (base: Record<string, unknown>) => ({
    ...base,
    color: "#EA580C",
    fontSize: "11.5px",
    fontWeight: 600,
  }),
  multiValueRemove: (base: Record<string, unknown>) => ({
    ...base,
    "color": "#EA580C",
    "borderRadius": "12px",
    "&:hover": { backgroundColor: "#FF5C00", color: "white" },
  }),
  placeholder: (base: Record<string, unknown>) => ({
    ...base,
    color: "#A6AAB2",
    fontSize: "12.5px",
  }),
  menu: (base: Record<string, unknown>) => ({
    ...base,
    borderRadius: "16px",
    overflow: "hidden",
    border: "1px solid #E8E8EC",
    boxShadow: "0 14px 36px -8px rgba(16,17,20,0.16)",
  }),
};
