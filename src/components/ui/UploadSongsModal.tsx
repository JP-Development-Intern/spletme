import { useId, useMemo, useRef, useState } from "react";
import {
  Upload,
  FileSpreadsheet,
  CircleAlert,
  CircleCheck,
  CalendarCheck,
  CalendarOff,
  Check,
  Cpu,
  Lock,
  Download,
  ArrowRight,
  TriangleAlert,
  ArrowLeftRight,
} from "lucide-react";
import type {
  Currency,
  UploadCurrencyPayload,
  UploadPeriodPayload,
} from "../../types/distributor.types";
import type { RejectedSong, UploadSongsResult, UploadStatus } from "../../services/distributorsService";
import {
  MONTH_NAMES,
  MONTH_SHORT_NAMES,
  buildPeriodLabel,
  findOverlappingUpload,
  formatUploadPeriod,
  monthsCovered,
  resolvePeriod,
  validatePeriodRange,
  type PeriodLike,
} from "../../utils/period.utils";
import { formatMonthRange } from "@/utils/coverage.utils";
import { formatCurrency, formatMoney } from "@/utils/format.utils";
import { CurrencyPicker } from "@/components/distributors/CurrencyPicker";
import {
  ModalShell,
  FieldLabel,
  PrimaryButton,
  SecondaryButton,
  DistributorMark,
} from "@/components/ui/ModalShell";

type UploadPhase = "idle" | "uploading" | "processing" | "done";

interface Props {
  distributorName: string;
  distributorLogo?: string | null;
  /** Moneda habitual del distribuidor: sólo preselecciona el campo del reporte. */
  distributorCurrency?: Currency;
  /** Cargas ya registradas, para impedir subir meses que se solapan. */
  existingUploads?: PeriodLike[];
  /** Periodo ya marcado al abrir; lo usa el aviso de hueco del detalle. */
  initialPeriod?: UploadPeriodPayload;
  onClose: () => void;
  onConfirm: (
    file: File,
    period: UploadPeriodPayload,
    currency: UploadCurrencyPayload,
    onProgress: (percent: number) => void,
    onProcessingProgress?: (status: UploadStatus) => void,
  ) => Promise<UploadSongsResult | void>;
}

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 4 }, (_, i) => CURRENT_YEAR - i).reverse();

const PRESETS = [
  { label: "Q1", startMonth: 1, endMonth: 3 },
  { label: "Q2", startMonth: 4, endMonth: 6 },
  { label: "Q3", startMonth: 7, endMonth: 9 },
  { label: "Q4", startMonth: 10, endMonth: 12 },
  { label: "Año completo", startMonth: 1, endMonth: 12 },
];

const ACCEPTED = /\.(csv|xlsx|xls)$/i;

/**
 * Límites del tipo de cambio admitido. El servidor valida el mismo rango: no
 * pretenden acertar la cotización, sino frenar el dedazo que multiplicaría el
 * catálogo entero por cien sin que nadie lo note hasta ver los pagos.
 */
const MIN_RATE = 0.1;
const MAX_RATE = 10;

/** Importe con el que se enseña el efecto del cambio antes de subir nada. */
const RATE_SAMPLE = 1000;

export default function UploadSongsModal({
  distributorName,
  distributorLogo,
  distributorCurrency = "USD",
  existingUploads = [],
  initialPeriod,
  onClose,
  onConfirm,
}: Props) {
  const [year, setYear] = useState(initialPeriod?.year ?? CURRENT_YEAR);
  const [startMonth, setStartMonth] = useState(initialPeriod?.startMonth ?? 1);
  const [endMonth, setEndMonth] = useState(initialPeriod?.endMonth ?? 3);
  /** Mes desde el que se está extendiendo la selección con el segundo clic. */
  const [anchor, setAnchor] = useState<number | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  /**
   * Moneda del archivo. Arranca en la del distribuidor pero se decide aquí: la
   * cotización con la que se liquidó cada reporte es la de SU periodo, y un
   * mismo distribuidor puede cambiar de moneda entre trimestres.
   */
  const [sourceCurrency, setSourceCurrency] = useState<Currency>(distributorCurrency);
  const [rateInput, setRateInput] = useState("");
  /** El error del cambio no se enseña hasta que el campo se ha dejado atrás. */
  const [rateTouched, setRateTouched] = useState(false);

  const [phase, setPhase] = useState<UploadPhase>("idle");
  const [progress, setProgress] = useState(0);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processedRows, setProcessedRows] = useState(0);
  const [liveProcessed, setLiveProcessed] = useState(0);
  const [liveRejected, setLiveRejected] = useState(0);
  const [result, setResult] = useState<UploadSongsResult | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const busy = phase === "uploading" || phase === "processing";

  /** Meses del año ya cubiertos por otras cargas: no se pueden volver a subir. */
  const takenMonths = useMemo(() => {
    const taken = new Set<number>();
    for (const upload of existingUploads) {
      if (upload.year !== year) continue;
      const period = resolvePeriod(upload);
      if (!period) continue;
      for (let m = period.startMonth; m <= period.endMonth; m += 1) taken.add(m);
    }
    return taken;
  }, [existingUploads, year]);

  const converts = sourceCurrency !== "USD";
  const rate = parseRate(rateInput);
  const rateError = converts ? describeRateError(rateInput, rate) : null;

  const rangeError = validatePeriodRange(startMonth, endMonth);
  const periodLabel = buildPeriodLabel(startMonth, endMonth, year);
  const months = monthsCovered(startMonth, endMonth);

  const overlapping = rangeError
    ? null
    : findOverlappingUpload(existingUploads, { startMonth, endMonth }, year);

  /** Meses de la selección que chocan con una carga previa. */
  const conflictingMonths = useMemo(() => {
    const conflicts: number[] = [];
    for (let m = startMonth; m <= endMonth; m += 1) if (takenMonths.has(m)) conflicts.push(m);
    return conflicts;
  }, [startMonth, endMonth, takenMonths]);

  /** El tramo libre contiguo más largo dentro de la selección, para ofrecer el arreglo. */
  const suggestedRange = useMemo(() => {
    if (conflictingMonths.length === 0) return null;
    let best: { startMonth: number; endMonth: number } | null = null;
    let current: number | null = null;

    for (let m = startMonth; m <= endMonth + 1; m += 1) {
      const free = m <= endMonth && !takenMonths.has(m);
      if (free && current === null) current = m;
      if (!free && current !== null) {
        const candidate = { startMonth: current, endMonth: m - 1 };
        const size = candidate.endMonth - candidate.startMonth + 1;
        if (!best || size > best.endMonth - best.startMonth + 1) best = candidate;
        current = null;
      }
    }
    return best;
  }, [conflictingMonths, startMonth, endMonth, takenMonths]);

  function selectMonth(month: number) {
    if (takenMonths.has(month)) return;
    if (anchor === null) {
      setStartMonth(month);
      setEndMonth(month);
      setAnchor(month);
    } else {
      setStartMonth(Math.min(anchor, month));
      setEndMonth(Math.max(anchor, month));
      setAnchor(null);
    }
    setError("");
  }

  function applyPreset(preset: { startMonth: number; endMonth: number }) {
    setStartMonth(preset.startMonth);
    setEndMonth(preset.endMonth);
    setAnchor(null);
    setError("");
  }

  function acceptFile(candidate: File | null) {
    if (!candidate) return;
    if (!ACCEPTED.test(candidate.name)) {
      setError("Solo se aceptan archivos CSV o Excel (.csv, .xlsx, .xls).");
      return;
    }
    setError("");
    setFile(candidate);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rangeError) return setError(rangeError);
    if (overlapping) {
      return setError(`El periodo se solapa con la carga de ${formatUploadPeriod(overlapping)}.`);
    }
    if (!file) return setError("Selecciona el archivo del reporte antes de continuar.");
    if (rateError) {
      setRateTouched(true);
      return setError(rateError);
    }

    setError("");
    setProgress(0);
    setProcessingProgress(0);
    setProcessedRows(0);
    setLiveProcessed(0);
    setLiveRejected(0);
    setPhase("uploading");

    try {
      const res = await onConfirm(
        file,
        { startMonth, endMonth, year },
        { sourceCurrency, exchangeRate: converts ? rate : null },
        (percent) => {
          setProgress(percent);
          if (percent >= 100) setPhase("processing");
        },
        (status) => {
          setPhase("processing");
          setProcessingProgress(status.progress);
          setProcessedRows(status.processedRows);
          setLiveProcessed(status.songsProcessed);
          setLiveRejected(status.rejectedCount);
        },
      );
      setResult(res ?? null);
      setPhase("done");
    } catch (err) {
      const apiMessage = (err as { response?: { data?: { message?: string } } }).response?.data
        ?.message;
      const fallback = (err as Error)?.message;
      setError(apiMessage || fallback || "Error al subir el archivo. Revisa el formato.");
      setPhase("idle");
      setProgress(0);
    }
  }

  // ---- Fases de subida, procesado y resultado -----------------------------

  if (phase !== "idle") {
    const done = phase === "done";
    return (
      <ModalShell
        title={done ? "Reporte procesado" : phase === "uploading" ? "Subiendo reporte" : "Procesando reporte"}
        subtitle={`${periodLabel} · ${distributorName}${
          converts && rate !== null ? ` · 1 € = $${formatRate(rate)}` : ""
        }`}
        width="lg"
        onGlass
        locked={busy}
        onClose={onClose}
        logo={<DistributorMark name={distributorName} logo={distributorLogo} size={36} />}
        footer={
          done ? (
            <>
              <span className="flex-1 text-[11px] text-white/50">
                Los datos del distribuidor ya están actualizados
              </span>
              <PrimaryButton
                onClick={onClose}
                icon={<ArrowRight className="h-[15px] w-[15px]" />}
              >
                Listo
              </PrimaryButton>
            </>
          ) : (
            <>
              <span className="flex-1 text-[11px] text-white/50">
                Puedes cerrar esta ventana: el proceso sigue en el servidor.
              </span>
              <SecondaryButton onClick={onClose}>Seguir en segundo plano</SecondaryButton>
            </>
          )
        }
      >
        <Steps phase={phase} />

        {phase === "uploading" && (
          <>
            <Phase title="Subiendo archivo" value={`${progress}%`} percent={progress} />
            <div className="flex items-center gap-2.5 rounded-[14px] bg-white/[0.06] px-3.5 py-3">
              <FileSpreadsheet className="h-[15px] w-[15px] flex-shrink-0 text-white/65" />
              <span className="flex-1 truncate font-mono text-[11px] text-white/80">
                {file?.name}
              </span>
              <span className="flex-shrink-0 font-mono text-[10.5px] text-white/50">
                {formatSize(file?.size ?? 0)}
              </span>
            </div>
          </>
        )}

        {phase === "processing" && (
          <>
            <Phase
              title="Procesando filas"
              value={processedRows > 0 ? `${processedRows.toLocaleString()} filas` : "Leyendo…"}
              percent={processingProgress}
            />
            <div className="grid grid-cols-2 gap-2.5">
              <LiveMetric label="PROCESADAS" value={liveProcessed} color="#45D39A" />
              <LiveMetric label="OMITIDAS" value={liveRejected} color="#FF8F92" />
            </div>
            <p className="flex items-start gap-2.5 rounded-[14px] border border-[#FF8A3D]/30 bg-[#FF5C00]/[0.14] px-3.5 py-3 text-[11px] leading-relaxed text-[#FFB48A]">
              <CircleAlert className="mt-px h-3.5 w-3.5 flex-shrink-0 text-[#FF8A3D]" />
              Puedes cerrar esta ventana: el reporte se sigue procesando en el servidor.
            </p>
          </>
        )}

        {done && (
          <UploadResult
            result={result}
            periodLabel={periodLabel}
            exchangeRate={converts ? rate : null}
          />
        )}
      </ModalShell>
    );
  }

  // ---- Formulario ---------------------------------------------------------

  const canSubmit = Boolean(file) && !rangeError && !overlapping && !rateError;

  return (
    <form onSubmit={handleSubmit} className="contents">
      <ModalShell
        title="Subir reporte"
        subtitle={`${distributorName} · ${existingUploads.length} ${
          existingUploads.length === 1 ? "reporte cargado" : "reportes cargados"
        }`}
        width="lg"
        onGlass
        onClose={onClose}
        logo={<DistributorMark name={distributorName} logo={distributorLogo} />}
        footer={
          <>
            <span className="flex-1 text-[11px] text-white/50">
              Los ISRC ya registrados por otro usuario se omiten
            </span>
            <SecondaryButton onClick={onClose}>Cancelar</SecondaryButton>
            <PrimaryButton
              type="submit"
              disabled={!canSubmit}
              icon={<Upload className="h-[15px] w-[15px]" />}
            >
              {overlapping ? "Periodo ya cargado" : `Subir ${formatMonthRange({ startMonth, endMonth })}`}
            </PrimaryButton>
          </>
        }
      >
        {/* Periodo */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <FieldLabel required invalid={Boolean(overlapping)}>
              PERIODO DEL REPORTE
            </FieldLabel>
            <div className="flex items-center gap-0.5 rounded-full bg-black/[0.22] p-1">
              {YEARS.map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => {
                    setYear(y);
                    setAnchor(null);
                  }}
                  className={`rounded-full px-2.5 py-1.5 font-mono text-[10.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70 ${
                    y === year ? "bg-[#F7EDE6]/[0.92] text-[#1C1D22]" : "text-white/70 hover:text-white"
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>

          {/* La regleta es el control: se elige el mes inicial y luego el final. */}
          <div className="flex gap-1">
            {MONTH_SHORT_NAMES.map((short, index) => {
              const month = index + 1;
              const taken = takenMonths.has(month);
              const selected = month >= startMonth && month <= endMonth;
              const conflict = taken && selected;
              const isAnchor = anchor === month;

              return (
                <button
                  key={short}
                  type="button"
                  disabled={taken}
                  onClick={() => selectMonth(month)}
                  aria-pressed={selected}
                  title={
                    taken
                      ? `${MONTH_NAMES[index]}: ya cubierto por otra carga`
                      : `${MONTH_NAMES[index]} ${year}`
                  }
                  className={[
                    "flex h-14 flex-1 flex-col items-center justify-center gap-1 rounded-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70",
                    conflict
                      ? "border-[1.5px] border-[#FF8F92] bg-[#E5484D]/[0.14]"
                      : selected
                        ? "bg-[#FF5C00]"
                        : taken
                          ? "cursor-not-allowed border border-white/[0.06] bg-black/[0.18]"
                          : "border border-white/[0.12] bg-white/[0.06] hover:border-[#FF8A3D]/60 hover:bg-white/[0.10]",
                    isAnchor && !conflict ? "ring-[3px] ring-[#FF8A3D]/40" : "",
                  ].join(" ")}
                >
                  <span
                    className={`font-mono text-[10.5px] font-semibold ${
                      conflict
                        ? "text-[#FF8F92]"
                        : selected
                          ? "text-white"
                          : taken
                            ? "text-white/35"
                            : "text-white"
                    }`}
                  >
                    {short}
                  </span>
                  {conflict ? (
                    <CircleAlert className="h-3 w-3 text-[#FF8F92]" />
                  ) : taken ? (
                    <Lock className="h-3 w-3 text-white/35" />
                  ) : (
                    <span
                      className={`h-[5px] w-[5px] rounded-full ${
                        selected ? "bg-white/40" : "bg-white/20"
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {PRESETS.map((preset) => {
              const active = startMonth === preset.startMonth && endMonth === preset.endMonth;
              const blocked = rangeIsTaken(preset, takenMonths);
              return (
                <button
                  key={preset.label}
                  type="button"
                  disabled={blocked}
                  onClick={() => applyPreset(preset)}
                  className={`rounded-full border px-2.5 py-1.5 text-[11px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70 ${
                    active
                      ? "border-[#FF8A3D] bg-[#FF5C00]/[0.16] font-semibold text-[#FFB48A]"
                      : "border-white/[0.12] bg-white/[0.06] font-medium text-white/70 enabled:hover:bg-white/[0.10] enabled:hover:text-white"
                  } disabled:cursor-not-allowed disabled:opacity-45`}
                  title={blocked ? "Todos sus meses ya están cargados" : undefined}
                >
                  {preset.label}
                </button>
              );
            })}
            <span className="ml-auto text-[10.5px] text-white/50">
              {anchor === null
                ? "Pulsa un mes y luego otro para marcar el rango"
                : `Desde ${MONTH_NAMES[anchor - 1]}… elige el mes final`}
            </span>
          </div>
        </div>

        {/* Archivo */}
        <div className="flex flex-col gap-2">
          <FieldLabel required>ARCHIVO DEL REPORTE</FieldLabel>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              acceptFile(e.dataTransfer.files?.[0] ?? null);
            }}
            className={`flex w-full items-center gap-3 rounded-[18px] px-4 py-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70 ${
              file
                ? "border-[1.5px] border-[#45D39A]/60 bg-[#45D39A]/[0.10]"
                : dragging
                  ? "border-[1.5px] border-dashed border-[#FF8A3D] bg-[#FF5C00]/[0.14]"
                  : "border-[1.5px] border-dashed border-white/25 bg-white/[0.04] hover:border-[#FF8A3D] hover:bg-[#FF5C00]/[0.08]"
            }`}
          >
            <span
              className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[13px] ${
                file ? "bg-[#45D39A]/[0.16]" : "bg-white/[0.08]"
              }`}
            >
              {file ? (
                <FileSpreadsheet className="h-[19px] w-[19px] text-[#45D39A]" />
              ) : (
                <Upload className="h-[19px] w-[19px] text-white/60" />
              )}
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5 text-left">
              <span
                className={`truncate text-[12.5px] font-semibold ${
                  file ? "font-mono text-white" : "text-white/80"
                }`}
              >
                {file ? file.name : "Arrastra el archivo o pulsa para elegirlo"}
              </span>
              <span className={`text-[11px] ${file ? "text-[#45D39A]" : "text-white/50"}`}>
                {file ? formatSize(file.size) : "CSV, XLSX o XLS"}
              </span>
            </span>
            {file && (
              <span className="flex-shrink-0 rounded-full bg-white/[0.10] px-3 py-1.5 text-[11.5px] font-semibold text-white/80">
                Cambiar
              </span>
            )}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={(e) => acceptFile(e.target.files?.[0] ?? null)}
            className="hidden"
          />
        </div>

        {/* Moneda del archivo */}
        <div className="flex flex-col gap-2.5">
          <FieldLabel required>MONEDA DE LOS IMPORTES DEL ARCHIVO</FieldLabel>
          <CurrencyPicker
            value={sourceCurrency}
            onChange={(next) => {
              setSourceCurrency(next);
              setError("");
            }}
          />
          {converts ? (
            <ExchangeRateField
              value={rateInput}
              onChange={(next) => {
                setRateInput(next);
                setError("");
              }}
              onBlur={() => setRateTouched(true)}
              rate={rate}
              error={rateError}
              showError={rateTouched}
            />
          ) : (
            <p className="flex items-start gap-2.5 rounded-[14px] bg-white/[0.06] px-3.5 py-3 text-[11px] leading-relaxed text-white/65">
              <CircleCheck className="mt-px h-3.5 w-3.5 flex-shrink-0 text-white/50" />
              El archivo ya viene en dólares: sus importes se guardan tal cual.
            </p>
          )}
        </div>

        {/* Resumen o conflicto */}
        {overlapping ? (
          <div className="flex flex-col gap-3 rounded-[18px] border border-[#E5484D]/30 bg-[#E5484D]/[0.14] p-4">
            <span className="flex items-center gap-2.5">
              <CircleAlert className="h-[15px] w-[15px] flex-shrink-0 text-[#FF8F92]" />
              <span className="text-[12.5px] font-semibold text-[#FF8F92]">
                {conflictingMonths.map((m) => MONTH_SHORT_NAMES[m - 1]).join(", ")} ya{" "}
                {conflictingMonths.length === 1 ? "está cubierto" : "están cubiertos"}
              </span>
            </span>
            <span className="text-[11px] leading-relaxed text-white/75">
              El reporte «{formatUploadPeriod(overlapping)}» ya incluye esos meses. Cada mes solo
              puede pertenecer a una carga.
            </span>
            {suggestedRange && (
              <button
                type="button"
                onClick={() => applyPreset(suggestedRange)}
                className="self-start rounded-full bg-[#E5484D] px-3.5 py-2 text-[11.5px] font-semibold text-white transition-colors hover:bg-[#C93B40] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              >
                Ajustar a {formatMonthRange(suggestedRange)}
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-[18px] border border-[#FF8A3D]/30 bg-[#FF5C00]/[0.14] p-4">
            <CalendarCheck className="h-[17px] w-[17px] flex-shrink-0 text-[#FF8A3D]" />
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-[12.5px] font-semibold text-[#FFB48A]">
                {periodLabel} · {months} {months === 1 ? "mes" : "meses"}
              </span>
              <span className="text-[11px] text-white/65">
                No se solapa con ninguna carga anterior de {distributorName}.
              </span>
              {converts && rate !== null && !rateError && (
                <span className="text-[11px] text-white/65">
                  Importes convertidos a dólares · 1 € = ${formatRate(rate)}
                </span>
              )}
            </span>
            <CircleCheck className="h-[17px] w-[17px] flex-shrink-0 text-[#FF8A3D]" />
          </div>
        )}

        {error && (
          <p className="flex items-center gap-1.5 text-[12px] font-medium text-[#FF8F92]">
            <TriangleAlert className="h-3.5 w-3.5 flex-shrink-0" />
            {error}
          </p>
        )}
      </ModalShell>
    </form>
  );
}

/**
 * El tipo de cambio, escrito como la ecuación que es: «1 € = N USD».
 *
 * La forma importa más de lo que parece. Un campo llamado «tipo de cambio» a
 * secas se rellena la mitad de las veces con la tasa invertida (0,92 en vez de
 * 1,08), y el error no se ve: el archivo se procesa igual y el catálogo entero
 * queda valorado a menos de la mitad. Aquí los dos lados de la igualdad están
 * escritos, y debajo se enseña el resultado sobre un importe conocido, así que
 * una tasa dada la vuelta se nota antes de subir nada.
 */
function ExchangeRateField({
  value,
  onChange,
  onBlur,
  rate,
  error,
  showError,
}: {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  rate: number | null;
  error: string | null;
  /** Si el error ya puede pintarse en rojo: no se regaña a media escritura. */
  showError: boolean;
}) {
  const inputId = useId();
  const helperId = `${inputId}-helper`;
  const valid = !error && rate !== null;
  // Callar el error a media escritura es cortesía; dar por bueno lo que se va a
  // rechazar, no. Mientras el valor no sirva, el campo se queda en el mensaje
  // neutro en vez de confirmar una conversión que no va a ocurrir.
  const alerting = Boolean(error) && showError;

  return (
    <div
      className={`flex flex-col gap-3 rounded-[18px] border p-4 transition-colors ${
        alerting
          ? "border-[1.5px] border-[#FF8F92] bg-[#E5484D]/[0.12]"
          : "border-white/[0.12] bg-white/[0.04]"
      }`}
    >
      <label htmlFor={inputId} className="flex items-center gap-2">
        <ArrowLeftRight
          className={`h-3.5 w-3.5 flex-shrink-0 ${alerting ? "text-[#FF8F92]" : "text-[#FF8A3D]"}`}
        />
        <FieldLabel required invalid={alerting}>
          TIPO DE CAMBIO DEL REPORTE
        </FieldLabel>
      </label>

      {/* La igualdad completa: lo que se teclea es sólo su lado derecho. */}
      <div className="flex items-center gap-2.5">
        <span className="flex h-11 flex-shrink-0 items-center gap-1.5 rounded-[14px] bg-white/[0.08] px-3.5 font-mono text-[13px] font-semibold text-white">
          1 €
        </span>
        <span className="flex-shrink-0 font-mono text-[15px] text-white/50">=</span>
        <span
          className={`flex h-11 min-w-0 flex-1 items-center rounded-[14px] border bg-white/[0.06] px-3.5 transition-colors focus-within:ring-[3px] ${
            alerting
              ? "border-[1.5px] border-[#FF8F92] focus-within:ring-[#E5484D]/25"
              : "border-white/[0.14] focus-within:border-[#FF8A3D] focus-within:ring-[#FF5C00]/25"
          }`}
        >
          <input
            id={inputId}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            inputMode="decimal"
            autoComplete="off"
            placeholder="1,0842"
            aria-describedby={helperId}
            aria-invalid={Boolean(error)}
            className="min-w-0 flex-1 border-none bg-transparent p-0 font-mono text-[13px] font-semibold text-white placeholder:font-normal placeholder:text-white/40 focus:outline-none focus:ring-0"
          />
          <span className="flex-shrink-0 pl-2 font-mono text-[11.5px] font-semibold text-white/50">
            USD
          </span>
        </span>
      </div>

      <p
        id={helperId}
        className={`flex items-start gap-2 text-[11px] leading-relaxed ${
          alerting ? "font-medium text-[#FF8F92]" : "text-white/65"
        }`}
      >
        {alerting ? (
          <>
            <TriangleAlert className="mt-px h-3.5 w-3.5 flex-shrink-0" />
            {error}
          </>
        ) : valid ? (
          <>
            <CircleCheck className="mt-px h-3.5 w-3.5 flex-shrink-0 text-[#45D39A]" />
            <span>
              Un ingreso de{" "}
              <span className="font-mono font-semibold text-white">
                {formatMoney(RATE_SAMPLE, "EUR")}
              </span>{" "}
              del reporte se guardará como{" "}
              <span className="font-mono font-semibold text-[#45D39A]">
                {formatCurrency(RATE_SAMPLE * (rate as number))}
              </span>
              .
            </span>
          </>
        ) : (
          <span>
            Cuántos dólares valía un euro en el periodo del reporte. Úsalo tal como te lo liquidó
            el distribuidor.
          </span>
        )}
      </p>
    </div>
  );
}

/** El cambio, sin ceros de relleno: 1.08 y no 1.0800. */
function formatRate(rate: number): string {
  return rate.toLocaleString("en-US", { maximumFractionDigits: 6 });
}

/**
 * Lee el cambio tecleado. Acepta la coma decimal porque es como se escribe en
 * español y el campo es de texto libre, no un `type="number"` que la rechazaría
 * en silencio según el idioma del navegador.
 */
function parseRate(value: string): number | null {
  const normalized = value.trim().replace(",", ".");
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Qué le falta al cambio tecleado, dicho donde se puede arreglar. */
function describeRateError(raw: string, rate: number | null): string | null {
  if (!raw.trim()) return "Indica cuántos dólares vale un euro para poder convertir el reporte.";
  if (rate === null) return "Escribe solo el número del cambio, por ejemplo 1,0842.";
  if (rate < MIN_RATE || rate > MAX_RATE) {
    return `Un euro no puede valer ${rate} dólares. Revisa el cambio: se espera algo entre ${MIN_RATE} y ${MAX_RATE}.`;
  }
  return null;
}

/** Los tres pasos reales del proceso: subida, procesado en servidor y fin. */
function Steps({ phase }: { phase: UploadPhase }) {
  const active = phase === "uploading" ? 0 : phase === "processing" ? 1 : 2;
  const steps = [
    { label: "Subida", icon: <Upload className="h-3.5 w-3.5" /> },
    { label: "Procesado", icon: <Cpu className="h-3.5 w-3.5" /> },
    { label: "Listo", icon: <Check className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="flex items-center">
      {steps.map((step, index) => {
        const done = index < active;
        const current = index === active;
        return (
          <div key={step.label} className="flex flex-1 items-center last:flex-none">
            {index > 0 && (
              <span
                className={`mx-1 h-0.5 flex-1 ${index <= active ? "bg-[#FF5C00]" : "bg-white/[0.12]"}`}
              />
            )}
            <span className="flex flex-shrink-0 items-center gap-2">
              <span
                className={`flex h-[26px] w-[26px] items-center justify-center rounded-full ${
                  done
                    ? "bg-[#FF5C00] text-white"
                    : current
                      ? "border-[1.5px] border-[#FF8A3D] bg-[#FF5C00]/[0.16] text-[#FF8A3D]"
                      : "bg-white/[0.08] text-white/50"
                }`}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : step.icon}
              </span>
              <span
                className={`text-[11.5px] ${
                  done || current ? "font-semibold text-white" : "text-white/50"
                }`}
              >
                {step.label}
              </span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

function Phase({ title, value, percent }: { title: string; value: string; percent: number }) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[12.5px] font-semibold text-white">{title}</span>
        <span className="font-mono text-[12px] font-semibold text-[#FF8A3D]">{value}</span>
      </div>
      <span className="h-2 w-full overflow-hidden rounded-full bg-white/[0.10]">
        <span
          className="block h-full rounded-full bg-[#FF5C00] transition-all duration-300"
          style={{ width: `${Math.min(100, Math.max(2, percent))}%` }}
        />
      </span>
    </div>
  );
}

function LiveMetric({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-[14px] bg-white/[0.06] px-3.5 py-3">
      <span className="font-mono text-[9.5px] font-medium tracking-[1.1px] text-white/50">
        {label}
      </span>
      <span className="font-mono text-[20px] font-light tracking-[-0.015em]" style={{ color }}>
        {value.toLocaleString()}
      </span>
    </div>
  );
}

/**
 * Resultado de la carga. Antes salía como banner amarillo en la página de
 * detalle; aquí se resuelve donde ocurrió, con los rechazos agrupados por motivo
 * y exportables para poder reclamarlos.
 */
function UploadResult({
  result,
  periodLabel,
  exchangeRate,
}: {
  result: UploadSongsResult | null;
  periodLabel: string;
  /** Cambio aplicado, si el reporte llegó en otra moneda. */
  exchangeRate: number | null;
}) {
  const groups = useMemo(() => groupRejections(result?.rejected ?? []), [result]);
  const rejected = result?.rejected ?? [];

  return (
    <>
      <div className="flex items-center gap-3 rounded-[18px] border border-[#45D39A]/30 bg-[#45D39A]/[0.12] p-4">
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#45D39A]">
          <Check className="h-5 w-5 text-[#0E2A1F]" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-[14px] font-semibold text-[#5BE3AB]">
            {(result?.songsProcessed ?? 0).toLocaleString()}{" "}
            {result?.songsProcessed === 1 ? "canción procesada" : "canciones procesadas"}
          </span>
          <span className="text-[11.5px] text-white/65">
            {periodLabel}
            {exchangeRate !== null && ` · convertidas a dólares a 1 € = $${formatRate(exchangeRate)}`}
          </span>
        </span>
      </div>

      {rejected.length > 0 && (
        <div className="flex flex-col gap-3 rounded-[18px] border border-white/[0.12] bg-white/[0.04] p-4">
          <div className="flex items-center gap-2.5">
            <CalendarOff className="h-3.5 w-3.5 flex-shrink-0 text-[#FF8A3D]" />
            <span className="flex-1 text-[12.5px] font-semibold text-white">
              {rejected.length} {rejected.length === 1 ? "canción omitida" : "canciones omitidas"}
            </span>
            <button
              type="button"
              onClick={() => downloadRejections(rejected, periodLabel)}
              className="flex flex-shrink-0 items-center gap-1.5 rounded-full bg-white/[0.08] px-2.5 py-1.5 text-[10.5px] font-semibold text-white/75 transition-colors hover:bg-white/[0.14] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70"
            >
              <Download className="h-3 w-3" />
              CSV
            </button>
          </div>

          {groups.map((group) => (
            <div key={group.reason} className="flex flex-col gap-2">
              <span className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#FF8A3D]" />
                <span className="flex-1 text-[11.5px] text-white/65">{group.reason}</span>
                <span className="font-mono text-[11.5px] font-semibold text-white">
                  {group.items.length}
                </span>
              </span>
              <span className="flex flex-wrap items-center gap-1.5">
                {group.items.slice(0, 6).map((song, index) => (
                  <span
                    key={`${song.isrc || song.trackTitle}-${index}`}
                    title={`${song.trackTitle} — ${song.artistName}`}
                    className="rounded-full bg-[#FF5C00]/[0.16] px-2 py-1 font-mono text-[10px] text-[#FF9A5C]"
                  >
                    {song.isrc || song.trackTitle || "—"}
                  </span>
                ))}
                {group.items.length > 6 && (
                  <span className="text-[10.5px] text-white/50">
                    y {group.items.length - 6} más
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

interface RejectionGroup {
  reason: string;
  items: RejectedSong[];
}

/**
 * El servidor no envía el motivo del rechazo, pero sí distingue: una canción sin
 * ISRC no se pudo identificar, y una con ISRC se omitió porque ya pertenece a
 * otro usuario. Agruparlas así evita una lista plana de códigos sin explicación.
 */
function groupRejections(rejected: RejectedSong[]): RejectionGroup[] {
  const withIsrc = rejected.filter((song) => Boolean(song.isrc));
  const withoutIsrc = rejected.filter((song) => !song.isrc);

  return [
    { reason: "ISRC ya registrado por otro usuario", items: withIsrc },
    { reason: "Sin ISRC en el archivo", items: withoutIsrc },
  ].filter((group) => group.items.length > 0);
}

/** Descarga los rechazos para poder reclamarlos al distribuidor. */
function downloadRejections(rejected: RejectedSong[], periodLabel: string) {
  const escape = (value: string) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const rows = [
    ["ISRC", "UPC", "Titulo", "Artista"],
    ...rejected.map((song) => [song.isrc, song.upc, song.trackTitle, song.artistName]),
  ];
  const csv = rows.map((row) => row.map(escape).join(",")).join("\n");

  // El BOM hace que Excel abra el CSV como UTF-8 y no rompa los acentos.
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `omitidas-${periodLabel.replace(/[^\w]+/g, "-").toLowerCase()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function rangeIsTaken(
  range: { startMonth: number; endMonth: number },
  taken: Set<number>,
): boolean {
  for (let m = range.startMonth; m <= range.endMonth; m += 1) if (!taken.has(m)) return false;
  return true;
}

function formatSize(bytes: number): string {
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}
