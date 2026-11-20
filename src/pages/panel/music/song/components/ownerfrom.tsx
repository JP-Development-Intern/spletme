import { Crown, X, Globe, Radio, Check, AlertCircle } from "lucide-react";
import Select from "react-select";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { FilterSegment } from "@/components/ui/FilterSegment";
import { glassSelectStyles } from "@/components/ui/selectStyles";
import { useReleaseFilters } from "@/hooks/useReleaseFilters";
import { songSplitsService } from "@/services/songSplits";
import type { FilterType, SelectOption, SplitData } from "@/types";

interface OwnerSplitModalSong {
  trackTitle?: string;
  /**
   * Poblado cuando el backend adjunta el split del owner; string cuando solo
   * viene la referencia, y null en las canciones que aún no tienen dueño
   * resuelto. El modal solo lee el split, si lo hay.
   */
  ownerId?: { split?: SplitData | null } | string | null;
}

interface OwnerSplitModalProps {
  isOpen: boolean;
  onClose: () => void;
  songId: string;
  song: OwnerSplitModalSong;
  onSplitCreated?: () => void;
}

interface OwnerFormData {
  percentage: string;
  countriesType: FilterType;
  selectedCountries: SelectOption[];
  platformsType: FilterType;
  selectedPlatforms: SelectOption[];
}

const toSelectOptions = (values: string[]): SelectOption[] =>
  (values ?? []).map((value) => ({ value, label: value }));

const defaultForm = (): OwnerFormData => ({
  percentage: "",
  countriesType: "all",
  selectedCountries: [],
  platformsType: "all",
  selectedPlatforms: [],
});

export default function OwnerSplitModal({
  isOpen,
  onClose,
  songId,
  song,
  onSplitCreated,
}: OwnerSplitModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const hasExistingSplit = Boolean(
    song?.ownerId && typeof song.ownerId === "object" && song.ownerId.split,
  );

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0B0604]/[0.62] p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="glass-menu flex max-h-[90vh] w-full max-w-[520px] flex-col overflow-hidden rounded-[28px] motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Tu parte de la canción"
      >
        <header className="flex shrink-0 items-center gap-3.5 px-5 pb-4 pt-5">
          <span className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-[14px] bg-[#FF5C00]/[0.16]">
            <Crown className="h-[18px] w-[18px] text-[#FF8A3D]" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-[19px] font-medium tracking-[-0.005em] text-white">
              {hasExistingSplit ? "Cambiar tu parte" : "Fijar tu parte"}
            </p>
            <p className="truncate text-[12px] text-white/65">
              {song?.trackTitle || "Esta canción"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/[0.08] text-white/70 transition-colors hover:bg-white/[0.14] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70"
            aria-label="Cerrar"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </header>

        <div className="h-px shrink-0 bg-white/[0.09]" />

        <OwnerSplitEditor
          isOpen={isOpen}
          songId={songId}
          song={song}
          onSplitCreated={onSplitCreated}
          onCancel={onClose}
          onDone={onClose}
        />
      </div>
    </div>,
    document.body,
  );
}

interface OwnerSplitEditorProps {
  /** Mientras está a la vista: al abrirse carga el split guardado y los filtros. */
  isOpen: boolean;
  songId: string;
  song: OwnerSplitModalSong;
  onSplitCreated?: () => void;
  onCancel: () => void;
  /** Tras guardar: el modal se cierra; el panel de splits recarga la página. */
  onDone: () => void;
}

/**
 * Tu parte de la canción, sin el marco del modal: el cuerpo y su pie. La usan
 * `OwnerSplitModal` y el panel de splits de la canción, así que las dos
 * guardan exactamente igual.
 */
export function OwnerSplitEditor({
  isOpen,
  songId,
  song,
  onSplitCreated,
  onCancel,
  onDone,
}: OwnerSplitEditorProps) {
  const [form, setForm] = useState<OwnerFormData>(defaultForm());
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { countryOptions, platformOptions, isLoadingFilters } = useReleaseFilters(songId, isOpen);

  useEffect(() => {
    if (!isOpen) return;
    setErrorMessage(null);

    const ownerId = song?.ownerId;
    const split = ownerId && typeof ownerId === "object" ? (ownerId.split ?? null) : null;

    if (!split) {
      setForm(defaultForm());
      return;
    }

    setForm({
      percentage: String(split.percentage ?? ""),
      countriesType: split.countriesType ?? "all",
      selectedCountries: toSelectOptions(split.selectedCountries ?? []),
      platformsType: split.platformsType ?? "all",
      selectedPlatforms: toSelectOptions(split.selectedPlatforms ?? []),
    });
  }, [isOpen, song]);

  const updateForm = (field: keyof OwnerFormData, value: string | readonly SelectOption[]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const hasExistingSplit = Boolean(
    song?.ownerId && typeof song.ownerId === "object" && song.ownerId.split,
  );

  const saveOwnerSplit = async () => {
    setErrorMessage(null);
    setIsLoading(true);

    try {
      if (!songId) {
        setErrorMessage("La canción no es válida.");
        return;
      }

      const pct = parseFloat(form.percentage);
      if (!pct || pct < 1 || pct > 100) {
        setErrorMessage("El porcentaje tiene que estar entre 1 y 100.");
        return;
      }

      await songSplitsService.createOwnerSplit({
        songId,
        percentage: pct,
        countriesType: form.countriesType,
        selectedCountries: form.selectedCountries.map((c) => c.value),
        platformsType: form.platformsType,
        selectedPlatforms: form.selectedPlatforms.map((p) => p.value),
      });

      if (onSplitCreated) onSplitCreated();
      onDone();
    } catch (error: unknown) {
      const err = error as {
        response?: {
          status: number;
          data?: { message?: string; error?: string };
        };
        message?: string;
      };
      if (err.response?.data) {
        const msg = err.response.data.message ?? err.response.data.error ?? "Error del servidor.";
        setErrorMessage(`Error ${err.response.status}: ${msg}`);
      } else {
        setErrorMessage(err.message ?? "No se pudo guardar tu split.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const percentage = parseFloat(form.percentage) || 0;
  // Tu parte sale primero; lo que queda es el 100% que se reparten los demás.
  const restForOthers = Math.max(0, 100 - percentage);

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-[22px] pb-5 pt-[18px]">
        <div className="flex shrink-0 flex-col gap-2">
          <span className="font-mono text-[9.5px] font-medium tracking-[1.2px] text-white/65">
            TU PORCENTAJE <span className="text-[#FF8A3D]">*</span>
          </span>
          <div className="flex flex-wrap items-center gap-3.5">
            <div className="relative w-[140px]">
              <input
                type="number"
                min="1"
                max="100"
                step="0.01"
                placeholder="0.00"
                value={form.percentage}
                onChange={(e) => updateForm("percentage", e.target.value)}
                className="w-full rounded-[16px] border border-white/[0.14] bg-white/[0.06] py-3 pl-4 pr-9 font-mono text-[22px] font-light text-white outline-none transition-colors placeholder:text-white/30 focus:border-[#FF8A3D] focus:ring-[3px] focus:ring-[#FF5C00]/25"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-mono text-[14px] text-white/50">
                %
              </span>
            </div>
            {percentage > 0 && (
              <div className="flex min-w-[180px] flex-1 flex-col gap-1">
                <span className="font-mono text-[15px] font-medium text-white">
                  {restForOthers}% queda para repartir
                </span>
                <span className="text-[11px] leading-[1.4] text-white/50">
                  Tu parte se descuenta primero. Ese resto es el 100% que se reparten los
                  colaboradores: sus porcentajes no compiten con el tuyo.
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2">
          <span className="flex items-center gap-1.5 font-mono text-[9.5px] font-medium tracking-[1.2px] text-white/65">
            <Globe className="h-3 w-3" />
            EN QUÉ PAÍSES APLICA
          </span>
          <FilterSegment
            value={form.countriesType}
            onChange={(v) => updateForm("countriesType", v)}
            labels={{ all: "Todos", except: "Excepto", only: "Solo" }}
            name="owner-países"
          />
          {form.countriesType !== "all" && (
            <Select
              isMulti
              isLoading={isLoadingFilters}
              options={countryOptions}
              value={form.selectedCountries}
              onChange={(selected) => updateForm("selectedCountries", selected ?? [])}
              styles={glassSelectStyles}
              menuPortalTarget={document.body}
              menuPosition="fixed"
              placeholder="Elegir países…"
              noOptionsMessage={() => "No hay países disponibles"}
            />
          )}
        </div>

        <div className="flex shrink-0 flex-col gap-2">
          <span className="flex items-center gap-1.5 font-mono text-[9.5px] font-medium tracking-[1.2px] text-white/65">
            <Radio className="h-3 w-3" />
            EN QUÉ PLATAFORMAS APLICA
          </span>
          <FilterSegment
            value={form.platformsType}
            onChange={(v) => updateForm("platformsType", v)}
            labels={{ all: "Todas", except: "Excepto", only: "Solo" }}
            name="owner-plataformas"
          />
          {form.platformsType !== "all" && (
            <Select
              isMulti
              isLoading={isLoadingFilters}
              options={platformOptions}
              value={form.selectedPlatforms}
              onChange={(selected) => updateForm("selectedPlatforms", selected ?? [])}
              styles={glassSelectStyles}
              menuPortalTarget={document.body}
              menuPosition="fixed"
              placeholder="Elegir plataformas…"
              noOptionsMessage={() => "No hay plataformas disponibles"}
            />
          )}
        </div>

        {errorMessage && (
          <div className="flex items-center gap-2.5 rounded-[14px] border border-[#E5484D]/30 bg-[#E5484D]/[0.14] px-3 py-2.5">
            <AlertCircle className="h-3.5 w-3.5 shrink-0 text-[#FF8F92]" />
            <span className="text-[11.5px] font-medium text-[#FF8F92]">{errorMessage}</span>
          </div>
        )}
      </div>

      <div className="h-px shrink-0 bg-white/[0.09]" />

      <footer className="flex shrink-0 items-center gap-2.5 px-[22px] pb-[18px] pt-[15px]">
        <p className="flex-1 text-[11px] leading-[1.35] text-white/50">
          Tu parte se descuenta antes de repartir al resto. El cambio queda en el historial.
        </p>
        <button
          type="button"
          onClick={onCancel}
          className="min-h-[44px] rounded-full border border-white/[0.16] bg-white/[0.07] px-[18px] py-[11px] text-[12.5px] font-semibold text-white/80 transition-colors hover:bg-white/[0.12] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={saveOwnerSplit}
          disabled={isLoading}
          className="inline-flex min-h-[44px] items-center gap-[7px] rounded-full bg-[#FF5C00] px-[18px] py-[11px] text-[12.5px] font-semibold text-white shadow-[0_8px_20px_-6px_rgba(255,92,0,0.35)] transition-colors enabled:hover:bg-[#EA580C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:cursor-not-allowed disabled:bg-white/[0.08] disabled:text-white/40 disabled:shadow-none"
        >
          {isLoading ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          ) : (
            <Check className="h-3.5 w-3.5" />
          )}
          {isLoading ? "Guardando…" : hasExistingSplit ? "Actualizar mi parte" : "Guardar mi parte"}
        </button>
      </footer>
    </>
  );
}
