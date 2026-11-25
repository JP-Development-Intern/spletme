import {
  X,
  Globe,
  Radio,
  Users,
  ChevronDown,
  CalendarRange,
  Crown,
  Check,
  AlertCircle,
  CircleCheck,
  Rocket,
} from "lucide-react";
import Select from "react-select";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FilterSegment } from "@/components/ui/FilterSegment";
import { glassSelectStyles } from "@/components/ui/selectStyles";
import { useSplitsModal } from "@/hooks/useSplitsModal";
import { SplitPeriodsEditor } from "@/components/splits/SplitPeriodsEditor";
import { formatMonth } from "@/utils/splitPeriods.utils";
import type { SplitsModalProps } from "@/types";

function getInitials(name: string) {
  return (
    name
      .split(" ")
      .slice(0, 2)
      .map((n) => n[0] ?? "")
      .join("")
      .toUpperCase() || "?"
  );
}

/** Evita decimales de adorno: 100, 33.33. */
const fmtPct = (n: number) => {
  const rounded = Math.round(n * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
};

export default function SplitsModal({
  collaborators,
  isOpen,
  onClose,
  songId,
  showOwnerContext = false,
  releaseMonth = null,
}: SplitsModalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0B0604]/[0.62] p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="glass-menu flex max-h-[90vh] w-full max-w-[1040px] flex-col overflow-hidden rounded-[28px] motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Repartir los splits"
      >
        <header className="flex shrink-0 items-center gap-3.5 px-5 pb-4 pt-5">
          <span className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-[14px] bg-white/[0.08]">
            <Users className="h-[18px] w-[18px] text-white/60" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-[19px] font-medium tracking-[-0.005em] text-white">
              Repartir los splits
            </p>
            <p className="flex items-center gap-1.5 text-[11.5px] text-white/65">
              <span className="truncate">
                {collaborators.length} {collaborators.length === 1 ? "persona" : "personas"} pueden
                cobrar de esta canción
              </span>
              <span aria-hidden="true" className="text-white/40">
                ·
              </span>
              {/* La fecha de lanzamiento se enseña AQUÍ y una sola vez. Es de la
                  canción, no de cada colaborador, y es donde arranca la línea de
                  tiempo de todos los tramos: repetirla en cada fila la
                  convertiría en ruido y en cada tarjeta de colaborador, en una
                  fecha que parece editable. */}
              <span
                title={
                  releaseMonth
                    ? "Aquí arrancan los tramos de todos los splits de esta canción"
                    : "No sabemos cuándo salió: los tramos arrancan igual, cubriendo todo lo anterior"
                }
                className="flex shrink-0 items-center gap-1 font-medium text-white"
              >
                <Rocket className="h-3 w-3 shrink-0 text-[#FF8A3D]" aria-hidden="true" />
                {releaseMonth ? `Lanzada en ${formatMonth(releaseMonth)}` : "Sin fecha de lanzamiento"}
              </span>
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

        <SplitsEditor
          collaborators={collaborators}
          songId={songId}
          showOwnerContext={showOwnerContext}
          releaseMonth={releaseMonth}
          isOpen={isOpen}
          onCancel={onClose}
        />
      </div>
    </div>,
    document.body,
  );
}

interface SplitsEditorProps {
  collaborators: SplitsModalProps["collaborators"];
  songId: string;
  showOwnerContext?: boolean;
  releaseMonth?: string | null;
  /** Mientras está a la vista: el hook carga los splits y los filtros al abrirse. */
  isOpen: boolean;
  onCancel: () => void;
  onSaved?: () => void | Promise<void>;
}

/**
 * El reparto entre colaboradores, sin el marco del modal: el cuerpo con cada
 * persona y su pie con Cancelar y Guardar. Lo usan `SplitsModal` y el panel
 * de splits de la canción, así que los dos guardan exactamente igual.
 */
export function SplitsEditor({
  collaborators,
  songId,
  showOwnerContext = false,
  releaseMonth = null,
  isOpen,
  onCancel,
  onSaved,
}: SplitsEditorProps) {
  const {
    isLoading,
    isLoadingFilters,
    countryOptions,
    platformOptions,
    errorMessage,
    successMessage,
    expandedCollaborators,
    configuredCount,
    totalAssignedPercentage,
    hasAnySavedSplit,
    hasAnyPeriod,
    getForm,
    toggleExpanded,
    updateForm,
    addPeriod,
    removePeriod,
    updatePeriod,
    saveSplit,
  } = useSplitsModal({ isOpen, collaborators, songId, releaseMonth, onSaved });

  // El 100% que se reparte aquí es el del pool: lo que queda una vez descontado
  // el split del owner, que se cobra antes y no ocupa sitio en este reparto.
  const remaining = 100 - totalAssignedPercentage;
  const overflow = remaining < 0;
  const balanced = Math.round(remaining * 100) / 100 === 0;

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-[22px] pb-5 pt-[18px]">
        {collaborators.length === 0 ? (
          <div className="flex flex-col items-center gap-2.5 py-12 text-center">
            <span className="grid h-[52px] w-[52px] place-items-center rounded-[18px] bg-[#FF5C00]/15">
              <Users className="h-[22px] w-[22px] text-[#FF8A3D]" />
            </span>
            <p className="text-[13px] font-semibold text-white">
              No hay colaboradores en esta canción
            </p>
            <p className="max-w-[320px] text-[12px] text-white/65">
              Añade a alguien primero y después decide qué parte le toca.
            </p>
          </div>
        ) : (
          <>
            {/* Cuánto queda por repartir, siempre a la vista */}
            <div
              className={`flex shrink-0 items-center gap-2.5 rounded-[14px] px-3 py-2.5 ${
                hasAnyPeriod
                  ? "bg-white/[0.06]"
                  : overflow
                    ? "bg-[#E5484D]/[0.14]"
                    : balanced
                      ? "bg-[#45D39A]/[0.12]"
                      : "bg-white/[0.06]"
              }`}
            >
              {hasAnyPeriod ? (
                <CalendarRange className="h-3.5 w-3.5 shrink-0 text-white/60" />
              ) : overflow ? (
                <AlertCircle className="h-3.5 w-3.5 shrink-0 text-[#FF8F92]" />
              ) : balanced ? (
                <CircleCheck className="h-3.5 w-3.5 shrink-0 text-[#45D39A]" />
              ) : (
                <Users className="h-3.5 w-3.5 shrink-0 text-white/60" />
              )}
              <span
                className={`text-[11.5px] font-semibold leading-[1.4] ${
                  hasAnyPeriod
                    ? "text-white/65"
                    : overflow
                      ? "text-[#FF8F92]"
                      : balanced
                        ? "text-[#45D39A]"
                        : "text-white/65"
                }`}
              >
                {hasAnyPeriod
                  ? "Con tramos por fechas el reparto cambia según el mes; se comprueba mes a mes al guardar"
                  : overflow
                    ? `Te has pasado ${fmtPct(Math.abs(remaining))} puntos del 100% disponible`
                    : balanced
                      ? "El 100% está repartido: no queda nada suelto"
                      : `Llevas ${fmtPct(totalAssignedPercentage)}% repartido · quedan ${fmtPct(remaining)}% sin asignar`}
              </span>
            </div>

            {showOwnerContext && (
              <p className="shrink-0 px-1 text-[11px] leading-relaxed text-white/50">
                Aquí repartes la canción entera. Tu retención no sale de este 100%: sale después,
                de la parte de cada uno, y puedes fijarla distinta para cada persona.
              </p>
            )}

            {collaborators.map((collaborator) => {
              const form = getForm(collaborator.id);
              const isExpanded = expandedCollaborators[collaborator.id] ?? false;
              const percentage = parseFloat(form.percentage) || 0;
              const hasPercentage = percentage > 0;
              const hasExistingSplit = Boolean(collaborator.split);

              return (
                <div
                  key={collaborator.id}
                  className="shrink-0 overflow-hidden rounded-[18px] border border-white/[0.12] bg-white/[0.03]"
                >
                  <button
                    type="button"
                    onClick={() => toggleExpanded(collaborator.id)}
                    aria-expanded={isExpanded}
                    className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-white/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#FF5C00]/70"
                  >
                    {/* La tinta se mantiene como color de persona; sobre la noche lleva aro */}
                    <span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-full border-2 border-white/25 bg-[#1C1D22] text-[11.5px] font-semibold text-white">
                      {getInitials(collaborator.name ?? "?")}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="truncate text-[13px] font-semibold text-white">
                        {collaborator.name}
                      </span>
                      <span className="truncate text-[11px] text-white/50">
                        {collaborator.email}
                      </span>
                    </span>
                    {hasExistingSplit && !hasPercentage && (
                      <span className="shrink-0 rounded-full bg-white/[0.08] px-[9px] py-1 text-[10px] font-semibold text-white/65">
                        Ya tiene split
                      </span>
                    )}
                    {form.periods.length > 0 ? (
                      <span className="flex shrink-0 items-center gap-1 rounded-full bg-[#FF5C00]/[0.16] px-[9px] py-1 text-[10px] font-semibold text-[#FF9A5C]">
                        <CalendarRange className="h-2.5 w-2.5" />
                        {form.periods.length}{" "}
                        {form.periods.length === 1 ? "tramo" : "tramos"}
                      </span>
                    ) : (
                      hasPercentage && (
                        <span className="shrink-0 rounded-full bg-[#FF5C00]/[0.16] px-[9px] py-1 font-mono text-[11px] font-semibold text-[#FF9A5C]">
                          {fmtPct(percentage)}%
                        </span>
                      )
                    )}
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-white/50 transition-transform ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isExpanded && (
                    <>
                      <div className="h-px bg-white/[0.09]" />
                      <div className="flex flex-col gap-4 bg-black/[0.12] px-4 py-4">
                        {/* Con tramos este campo se muda a la fila del tramo final,
                            dentro del editor: es el mismo dato y no puede haber dos
                            sitios que lo escriban. */}
                        {form.periods.length === 0 && (
                          <div className="flex flex-col gap-2">
                            <span className="font-mono text-[9.5px] font-medium tracking-[1.2px] text-white/65">
                              {showOwnerContext
                                ? "PORCENTAJE DE LA CANCIÓN *"
                                : "PORCENTAJE DEL REPARTO *"}
                            </span>
                            <div className="flex flex-wrap items-center gap-3">
                              <div className="relative w-[140px]">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.01"
                                  placeholder="0.00"
                                  value={form.percentage}
                                  onChange={(e) =>
                                    updateForm(collaborator.id, "percentage", e.target.value)
                                  }
                                  className="w-full rounded-[16px] border border-white/[0.14] bg-white/[0.06] py-3 pl-4 pr-9 font-mono text-[18px] font-light text-white placeholder:text-white/40 outline-none transition-colors focus:border-[#FF8A3D] focus:ring-2 focus:ring-[#FF5C00]/25"
                                />
                                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-mono text-[13px] text-white/50">
                                  %
                                </span>
                              </div>
                              {hasPercentage && (
                                <p className="flex-1 text-[11.5px] leading-[1.4] text-white/65">
                                  {overflow ? (
                                    <span className="font-semibold text-[#FF8F92]">
                                      Con esto el reparto suma {fmtPct(totalAssignedPercentage)}%:
                                      hay que bajar {fmtPct(Math.abs(remaining))} puntos.
                                    </span>
                                  ) : (
                                    <>
                                      {showOwnerContext
                                        ? "Es la parte de la canción que le asignas. De ahí sale tu retención, y él cobra el resto."
                                        : "Es la parte que le toca de lo que quede por repartir."}
                                    </>
                                    )}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          {showOwnerContext && (
                            <div className="flex flex-col gap-2">
                              <span className="flex items-center gap-1.5 font-mono text-[9.5px] font-medium tracking-[1.2px] text-white/65">
                                <Crown className="h-3 w-3" />
                                TU RETENCIÓN CON ESTA PERSONA
                              </span>
                              <div className="flex flex-wrap items-center gap-3">
                                <div className="relative w-[140px]">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    placeholder="La tuya"
                                    value={form.ownerRate}
                                    onChange={(e) =>
                                      updateForm(collaborator.id, "ownerRate", e.target.value)
                                    }
                                    className="w-full rounded-[16px] border border-white/[0.14] bg-white/[0.06] py-3 pl-4 pr-9 font-mono text-[18px] font-light text-white placeholder:text-white/40 outline-none transition-colors focus:border-[#FF8A3D] focus:ring-2 focus:ring-[#FF5C00]/25"
                                  />
                                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-mono text-[13px] text-white/50">
                                    %
                                  </span>
                                </div>
                                <p className="flex-1 text-[11.5px] leading-[1.4] text-white/65">
                                  {form.ownerRate.trim() === "" ? (
                                    <>
                                      Déjalo vacío y le aplicas tu porcentaje de owner, el mismo que
                                      a todos. Rellénalo solo si con esta persona pactaste otro.
                                    </>
                                  ) : hasPercentage ? (
                                    <>
                                      De cada dólar que le toque por su{" "}
                                      {fmtPct(percentage)}%, te quedas{" "}
                                      {fmtPct(parseFloat(form.ownerRate) || 0)}% y cobra el resto.
                                    </>
                                  ) : (
                                    <>Te quedas ese porcentaje de la parte que le toque.</>
                                  )}
                                </p>
                              </div>
                            </div>
                          )}

                          <div className="flex flex-col gap-2">
                            <span className="flex items-center gap-1.5 font-mono text-[9.5px] font-medium tracking-[1.2px] text-white/65">
                              <Globe className="h-3 w-3" />
                              EN QUÉ PAÍSES APLICA
                            </span>
                            <FilterSegment
                              value={form.countriesType}
                              onChange={(v) => updateForm(collaborator.id, "countriesType", v)}
                              labels={{ all: "Todos", except: "Excepto", only: "Solo" }}
                              name={`países-${collaborator.id}`}
                            />
                            {form.countriesType !== "all" && (
                              <Select
                                isMulti
                                isLoading={isLoadingFilters}
                                options={countryOptions}
                                value={form.selectedCountries}
                                onChange={(selected) =>
                                  updateForm(collaborator.id, "selectedCountries", selected ?? [])
                                }
                                styles={glassSelectStyles}
                                menuPortalTarget={document.body}
                                menuPosition="fixed"
                                placeholder="Elegir países…"
                                noOptionsMessage={() => "No hay países disponibles"}
                              />
                            )}
                          </div>

                          <div className="flex flex-col gap-2">
                            <span className="flex items-center gap-1.5 font-mono text-[9.5px] font-medium tracking-[1.2px] text-white/65">
                              <Radio className="h-3 w-3" />
                              EN QUÉ PLATAFORMAS APLICA
                            </span>
                            <FilterSegment
                              value={form.platformsType}
                              onChange={(v) => updateForm(collaborator.id, "platformsType", v)}
                              labels={{ all: "Todas", except: "Excepto", only: "Solo" }}
                              name={`plataformas-${collaborator.id}`}
                            />
                            {form.platformsType !== "all" && (
                              <Select
                                isMulti
                                isLoading={isLoadingFilters}
                                options={platformOptions}
                                value={form.selectedPlatforms}
                                onChange={(selected) =>
                                  updateForm(collaborator.id, "selectedPlatforms", selected ?? [])
                                }
                                styles={glassSelectStyles}
                                menuPortalTarget={document.body}
                                menuPosition="fixed"
                                placeholder="Elegir plataformas…"
                                noOptionsMessage={() => "No hay plataformas disponibles"}
                              />
                            )}
                          </div>

                          <SplitPeriodsEditor
                            ownerKey={collaborator.id}
                            periods={form.periods}
                            releaseMonth={releaseMonth}
                            fallbackPercentage={form.percentage}
                            fallbackWarning={
                              overflow
                                ? `Con esto el reparto suma ${fmtPct(totalAssignedPercentage)}%: hay que bajar ${fmtPct(Math.abs(remaining))} puntos.`
                                : null
                            }
                            onFallbackChange={(value) =>
                              updateForm(collaborator.id, "percentage", value)
                            }
                            countryOptions={countryOptions}
                            platformOptions={platformOptions}
                            isLoadingFilters={isLoadingFilters}
                            onAdd={() => addPeriod(collaborator.id)}
                            onRemove={(periodId) => removePeriod(collaborator.id, periodId)}
                            onChange={(periodId, field, value) =>
                              updatePeriod(collaborator.id, periodId, field, value)
                            }
                          />
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>

        <div className="h-px shrink-0 bg-white/[0.09]" />

        <footer className="flex shrink-0 flex-col gap-3 px-[22px] pb-[18px] pt-[15px]">
          {errorMessage && (
            <div className="flex items-center gap-2.5 rounded-[14px] border border-[#E5484D]/30 bg-[#E5484D]/[0.14] px-3 py-2.5">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 text-[#FF8F92]" />
              <span className="text-[11.5px] font-medium text-[#FF8F92]">{errorMessage}</span>
            </div>
          )}
          {successMessage && (
            <div className="flex items-center gap-2.5 rounded-[14px] border border-[#45D39A]/25 bg-[#45D39A]/[0.12] px-3 py-2.5">
              <CircleCheck className="h-3.5 w-3.5 shrink-0 text-[#45D39A]" />
              <span className="text-[11.5px] font-medium text-[#45D39A]">{successMessage}</span>
            </div>
          )}
          <div className="flex items-center gap-2.5">
            <p className="flex-1 text-[11px] leading-[1.35] text-white/50">
              {configuredCount > 0
                ? `${configuredCount} ${configuredCount === 1 ? "split listo" : "splits listos"} para guardar · cada cambio queda en el historial`
                : "Asigna un porcentaje a alguien para poder guardar."}
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
              onClick={saveSplit}
              disabled={isLoading || configuredCount === 0}
              className={`inline-flex min-h-[44px] items-center gap-[7px] rounded-full px-[18px] py-[11px] text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${
                isLoading || configuredCount === 0
                  ? "cursor-not-allowed bg-white/[0.08] text-white/40"
                  : "bg-[#FF5C00] text-white shadow-[0_8px_20px_-6px_rgba(255,92,0,0.35)] hover:bg-[#EA580C]"
              }`}
            >
              {isLoading ? (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              {isLoading ? "Guardando…" : hasAnySavedSplit ? "Actualizar splits" : "Guardar splits"}
            </button>
          </div>
        </footer>
    </>
  );
}
