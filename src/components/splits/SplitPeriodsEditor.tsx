import {
  ChevronLeft,
  ChevronRight,
  Globe,
  Radio,
  Plus,
  Trash2,
  SlidersHorizontal,
  Rocket,
  Infinity as InfinityIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Select from "react-select";
import { useReducedMotion } from "framer-motion";
import { FilterSegment } from "@/components/ui/FilterSegment";
import { MonthField } from "@/components/ui/MonthField";
import { glassSelectStyles } from "@/components/ui/selectStyles";
import { formatMonth, finalPeriodStart } from "@/utils/splitPeriods.utils";
import type { SelectOption, SplitPeriodFormData } from "@/types";

interface SplitPeriodsEditorProps {
  /** Identifica los inputs del colaborador dentro del modal. */
  ownerKey: string;
  periods: SplitPeriodFormData[];
  /** Porcentaje del tramo final, el que rige cuando se acaban los demás. */
  fallbackPercentage: string;
  /** Avisa del exceso sobre el 100% cuando lo hay; se pinta bajo su input. */
  fallbackWarning?: string | null;
  /** Mes de lanzamiento de la canción, o null si no se conoce. */
  releaseMonth?: string | null;
  countryOptions: SelectOption[];
  platformOptions: SelectOption[];
  isLoadingFilters: boolean;
  onAdd: () => void;
  onRemove: (periodId: string) => void;
  onChange: (
    periodId: string,
    field: keyof SplitPeriodFormData,
    value: string | readonly SelectOption[],
  ) => void;
  /** Edita el porcentaje del tramo final, que vive en el split, no en un tramo. */
  onFallbackChange: (value: string) => void;
}

/** `"2025-03"` → 24303, para poder medir distancias en meses. */
const monthIndex = (value: string | null | undefined): number | null => {
  const [year, month] = (value ?? "").split("-");
  const y = Number(year);
  const m = Number(month);
  if (!y || !m) return null;
  return y * 12 + (m - 1);
};

const fmtPct = (value: string) => {
  const n = parseFloat(value);
  if (Number.isNaN(n)) return "—";
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
};

const isZero = (value: string) => (parseFloat(value) || 0) === 0;

const isComplete = (period: SplitPeriodFormData) =>
  Boolean(period.from && period.to && period.from <= period.to);

/** Meses que dura un tramo, contando los dos extremos. */
const monthsOf = (period: { from: string; to: string }): number | null => {
  const from = monthIndex(period.from);
  const to = monthIndex(period.to);
  return from === null || to === null || to < from ? null : to - from + 1;
};

const monthsLabel = (n: number) => `${n} ${n === 1 ? "mes" : "meses"}`;

/** El mes en curso, `YYYY-MM`. */
const currentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

/**
 * Cómo se llama un tramo en pantalla: por sus fechas, no por su número. «Tramo 2»
 * obligaba a mirar dentro de la tarjeta para saber cuándo cae; el rango lo dice
 * en el título.
 */
const periodTitle = (period: SplitPeriodFormData): string => {
  if (period.openStart) return "Desde el lanzamiento";
  if (!isComplete(period)) return "Tramo sin fechas";
  return period.from === period.to
    ? formatMonth(period.from)
    : `${formatMonth(period.from)} – ${formatMonth(period.to)}`;
};

/**
 * Qué tramo rige este mes y por dónde va dentro de él (0 a 1), para el marcador
 * «Hoy». Repite las reglas del reparto: el primer tramo cubre también lo
 * anterior a su inicio, y el final, todo lo posterior al último. Antes del
 * lanzamiento no rige ninguno.
 */
function locateToday(
  periods: SplitPeriodFormData[],
  finalStart: string | null,
  releaseMonth: string | null,
  today: string,
): { id: string; fraction: number } | null {
  if (releaseMonth && today < releaseMonth) return null;

  const complete = periods.filter(isComplete);
  for (const period of complete) {
    if (today >= period.from && today <= period.to) {
      const months = monthsOf(period) ?? 1;
      const elapsed = (monthIndex(today) ?? 0) - (monthIndex(period.from) ?? 0);
      return { id: period.id, fraction: (elapsed + 0.5) / months };
    }
  }

  const [first] = complete;
  if (first?.openStart && today < first.from) return { id: first.id, fraction: 0.08 };

  // Sin tramos, el final es el único y rige desde el lanzamiento.
  if (!finalStart) return { id: "final", fraction: 0.18 };
  if (today >= finalStart) {
    const since = (monthIndex(today) ?? 0) - (monthIndex(finalStart) ?? 0);
    return { id: "final", fraction: Math.min(0.72, 0.12 + since / 40) };
  }
  return null;
}

/**
 * Tramos de vigencia de un split: la línea de tiempo completa de lo que cobra
 * un colaborador, desde que la canción sale hasta siempre.
 *
 * No es una lista de excepciones sobre un porcentaje de fondo: cada mes desde el
 * lanzamiento pertenece a un tramo, y siempre hay un último tramo que no acaba
 * nunca. Un colaborador nuevo empieza justo con ese: "desde su lanzamiento,
 * para siempre".
 *
 * Arriba corre un **raíl de tiempo**: arranca en el lanzamiento, cada
 * estación es el mes en que empieza un tramo, el color del trazo es lo que se
 * cobra en él y el último se desvanece en ∞. Cada tarjeta cuelga de su tramo del
 * raíl, así que el orden de lectura —izquierda a derecha— es el del calendario,
 * y el marcador «Hoy» dice cuál rige ahora mismo.
 */
export function SplitPeriodsEditor({
  ownerKey,
  periods,
  fallbackPercentage,
  fallbackWarning,
  releaseMonth = null,
  countryOptions,
  platformOptions,
  isLoadingFilters,
  onAdd,
  onRemove,
  onChange,
  onFallbackChange,
}: SplitPeriodsEditorProps) {
  const complete = periods.filter(isComplete);
  // Desde cuándo rige el tramo final. Sin tramos arranca en el lanzamiento:
  // es el único que hay, y cubre la canción entera.
  const finalStart = finalPeriodStart(complete);

  // Años elegibles: desde el lanzamiento (o el tramo más antiguo) y una década
  // por delante, que es todo lo que se puede pactar sin inventarse el futuro.
  const thisYear = new Date().getFullYear();
  const earliest = [releaseMonth, ...periods.map((p) => p.from)]
    .filter(Boolean)
    .map((m) => Number((m as string).slice(0, 4)))
    .filter((y) => y > 1900);
  const minYear = Math.min(thisYear - 1, ...(earliest.length ? earliest : [thisYear]));
  const maxYear = Math.max(thisYear + 10, ...(earliest.length ? earliest : [thisYear]));

  return (
    <div className="flex flex-col gap-3.5 rounded-[16px] bg-white/[0.04] p-3.5 ring-1 ring-white/[0.10]">
        <PeriodsFlow
          ownerKey={ownerKey}
          periods={periods}
          finalStart={finalStart}
          releaseMonth={releaseMonth}
          fallbackPercentage={fallbackPercentage}
          fallbackWarning={fallbackWarning}
          minYear={minYear}
          maxYear={maxYear}
          countryOptions={countryOptions}
          platformOptions={platformOptions}
          isLoadingFilters={isLoadingFilters}
          onAdd={onAdd}
          onRemove={onRemove}
          onChange={onChange}
          onFallbackChange={onFallbackChange}
        />

      <p className="text-[10.5px] leading-[1.5] text-white/55">
        {complete.length === 0
          ? "Si su parte cambia en unas fechas concretas, añade un tramo con el + de la tarjeta."
          : "Los meses que queden sueltos entre dos tramos se rellenan solos al 0%. Puedes cambiarlos."}
      </p>
    </div>
  );
}

/* ── El calendario: raíl y tarjetas ────────────────────────────────────────── */

/** Ancho de cada tarjeta: cabe la rejilla Desde / Hasta con dos selects. */
const NODE_W = 264;
/** Hueco entre columnas. Sin flechas entre tarjetas: el sentido lo da el raíl. */
const NODE_GAP = 28;
/**
 * Margen alrededor del calendario dentro de su zona de desplazamiento. Solo el
 * justo para que no se corte el contorno del tramo que rige hoy: el marco ya lo
 * pone la caja del editor.
 */
const PAD = 6;

/** Geometría del raíl: fechas arriba, trazo, y lo que se cobra debajo. */
const RAIL_H = 58;
const RAIL_LINE_Y = 27;
/** Alto del conector que baja del raíl a cada tarjeta. */
const CONNECTOR_H = 24;

const PAID = "#FF5C00";
const ZERO = "rgba(255, 255, 255, 0.24)";

const nodeX = (index: number) => index * (NODE_W + NODE_GAP);

type SegmentKind = "paid" | "zero" | "pending";

/** Un tramo tal como lo dibuja el raíl. */
type RailColumn = {
  id: string;
  /** Fecha de la estación con la que empieza; null en un tramo sin fechas. */
  station: string | null;
  kind: SegmentKind;
  percentage: string;
  months: number | null;
  final: boolean;
};

/**
 * El raíl y las tarjetas comparten un mismo contenedor con desplazamiento
 * horizontal: van en columnas del mismo ancho, así que cada tarjeta queda
 * siempre debajo de su tramo sin calcular posiciones.
 *
 * Antes era un lienzo de React Flow. Desde que el raíl da el orden, ya no había
 * nada que conectar ni que mover libremente, y el lienzo solo añadía trampas
 * (campos que no recibían clics, el alto calculado a mano, la rueda y el
 * arrastre compitiendo con el modal). El desplazamiento nativo ya funciona con
 * trackpad, rueda con mayúsculas, teclado y el dedo.
 */
function PeriodsFlow({
  ownerKey,
  periods,
  finalStart,
  releaseMonth,
  fallbackPercentage,
  fallbackWarning,
  minYear,
  maxYear,
  countryOptions,
  platformOptions,
  isLoadingFilters,
  onAdd,
  onRemove,
  onChange,
  onFallbackChange,
}: {
  ownerKey: string;
  periods: SplitPeriodFormData[];
  finalStart: string | null;
  releaseMonth: string | null;
  fallbackPercentage: string;
  fallbackWarning?: string | null;
  minYear: number;
  maxYear: number;
  countryOptions: SelectOption[];
  platformOptions: SelectOption[];
  isLoadingFilters: boolean;
  onAdd: () => void;
  onRemove: (periodId: string) => void;
  onChange: SplitPeriodsEditorProps["onChange"];
  onFallbackChange: (value: string) => void;
}) {
  const reduceMotion = useReducedMotion();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scroll, setScroll] = useState({ overflows: false, atStart: true, atEnd: true });

  const ids = useMemo(() => [...periods.map((period) => period.id), "final"], [periods]);
  const total = ids.length;
  const contentW = nodeX(total - 1) + NODE_W;

  const today = useMemo(
    () => locateToday(periods, finalStart, releaseMonth, currentMonth()),
    [periods, finalStart, releaseMonth],
  );

  /** Si hay más calendario del que cabe y hacia qué lado. */
  const measure = useCallback(() => {
    const element = scrollRef.current;
    if (!element) return;
    const max = element.scrollWidth - element.clientWidth;
    setScroll({
      overflows: max > 1,
      atStart: element.scrollLeft <= 1,
      atEnd: element.scrollLeft >= max - 1,
    });
  }, []);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [measure]);

  useEffect(measure, [measure, contentW]);

  const scrollTo = useCallback(
    (left: number) =>
      scrollRef.current?.scrollTo({ left, behavior: reduceMotion ? "auto" : "smooth" }),
    [reduceMotion],
  );

  /**
   * Lleva una columna entera a la vista. Se llama al enfocar cualquier campo de
   * dentro: el navegador ya acerca el campo, pero así se ve la tarjeta completa
   * y no solo el input.
   */
  const reveal = useCallback(
    (index: number) => {
      const element = scrollRef.current;
      if (!element || index < 0) return;
      const left = PAD + nodeX(index);
      const right = left + NODE_W;
      if (left < element.scrollLeft + PAD) scrollTo(left - PAD);
      else if (right > element.scrollLeft + element.clientWidth - PAD) {
        scrollTo(right - element.clientWidth + PAD);
      }
    },
    [scrollTo],
  );

  // Al añadir un tramo nuevo aparece al final de la cadena: se lleva a la vista
  // para que el clic en "+" tenga una respuesta que se vea.
  const previousCount = useRef(periods.length);
  useEffect(() => {
    if (periods.length > previousCount.current) reveal(periods.length - 1);
    previousCount.current = periods.length;
  }, [periods.length, reveal]);

  // Al abrir, si el tramo de hoy queda fuera, se lleva a la vista: es el que
  // más se consulta.
  const revealedToday = useRef(false);
  useEffect(() => {
    if (revealedToday.current || !scroll.overflows || !today) return;
    revealedToday.current = true;
    reveal(ids.indexOf(today.id));
  }, [scroll.overflows, today, ids, reveal]);

  const railColumns: RailColumn[] = [
    ...periods.map((period) => ({
      id: period.id,
      station: isComplete(period) ? period.from : null,
      kind: (!isComplete(period) ? "pending" : isZero(period.percentage) ? "zero" : "paid") as SegmentKind,
      percentage: period.percentage,
      months: isComplete(period) ? monthsOf(period) : null,
      final: false,
    })),
    {
      id: "final",
      station: finalStart,
      kind: (isZero(fallbackPercentage) ? "zero" : "paid") as SegmentKind,
      percentage: fallbackPercentage,
      months: null,
      final: true,
    },
  ];

  const step = NODE_W + NODE_GAP;

  return (
    <div className="flex flex-col gap-2">
      {scroll.overflows && (
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10.5px] text-white/50">Desliza o usa las flechas para recorrer el calendario</span>
          <span className="flex items-center gap-1">
            <FlowNavButton
              label="Ver los tramos anteriores"
              disabled={scroll.atStart}
              onClick={() => scrollTo((scrollRef.current?.scrollLeft ?? 0) - step)}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </FlowNavButton>
            <FlowNavButton
              label="Ver los tramos siguientes"
              disabled={scroll.atEnd}
              onClick={() => scrollTo((scrollRef.current?.scrollLeft ?? 0) + step)}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </FlowNavButton>
          </span>
        </div>
      )}

      <div
        ref={scrollRef}
        onScroll={measure}
        className="periods-scroll snap-x snap-proximity overflow-x-auto overflow-y-hidden"
        style={{ scrollPaddingInline: PAD }}
      >
        <div className="w-max" style={{ padding: PAD }}>
          <Rail columns={railColumns} releaseMonth={releaseMonth} today={today} width={contentW} />

          <ol className="flex items-start" style={{ gap: NODE_GAP, marginTop: CONNECTOR_H }}>
            {periods.map((period, index) => (
              <li key={period.id} className="snap-start">
                <PeriodNode
                  period={period}
                  index={index}
                  total={total}
                  isToday={today?.id === period.id}
                  ownerKey={ownerKey}
                  minYear={minYear}
                  maxYear={maxYear}
                  countryOptions={countryOptions}
                  platformOptions={platformOptions}
                  isLoadingFilters={isLoadingFilters}
                  onAdd={onAdd}
                  onRemove={() => onRemove(period.id)}
                  onChange={(field, value) => onChange(period.id, field, value)}
                  onReveal={() => reveal(index)}
                />
              </li>
            ))}
            <li className="snap-start">
              <FinalNode
                from={finalStart}
                total={total}
                isToday={today?.id === "final"}
                percentage={fallbackPercentage}
                warning={fallbackWarning}
                onAdd={onAdd}
                onChange={onFallbackChange}
                onReveal={() => reveal(periods.length)}
              />
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}

function FlowNavButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="grid h-[30px] w-[30px] place-items-center rounded-full bg-white/[0.08] text-white/80 transition-colors enabled:hover:bg-white/[0.14] enabled:hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70 disabled:opacity-35"
    >
      {children}
    </button>
  );
}

/* ── El raíl de tiempo ─────────────────────────────────────────────────────── */

/** Trazo de un tramo en el raíl: lleno si cobra, tenue al 0%, a trazos sin fechas. */
function segmentStyle(column: RailColumn): React.CSSProperties {
  if (column.final) {
    // El tramo final no se cierra: se desvanece hacia ∞.
    const color = column.kind === "zero" ? ZERO : PAID;
    return { backgroundImage: `linear-gradient(90deg, ${color} 0%, ${color} 55%, transparent 100%)` };
  }
  if (column.kind === "pending") {
    return { backgroundImage: `repeating-linear-gradient(90deg, ${ZERO} 0 5px, transparent 5px 9px)` };
  }
  return { backgroundColor: column.kind === "zero" ? ZERO : PAID };
}

/**
 * El raíl: la línea de tiempo de la que cuelgan las tarjetas. Es la respuesta a
 * «¿qué va antes y qué va después?» sin leer ninguna tarjeta: cada estación es
 * el mes en que empieza un tramo, la primera es el lanzamiento y la última se
 * abre a ∞. Las estaciones no están a escala —un tramo de un mes y otro de diez
 * años miden lo mismo—, así que la duración se escribe bajo cada tramo.
 *
 * Es decorativo para los lectores de pantalla: cada tarjeta ya se nombra con sus
 * fechas, su porcentaje y si rige hoy.
 */
function Rail({
  columns,
  releaseMonth,
  today,
  width,
}: {
  columns: RailColumn[];
  releaseMonth: string | null;
  today: { id: string; fraction: number } | null;
  width: number;
}) {
  return (
    <div aria-hidden="true" className="relative" style={{ width, height: RAIL_H }}>
      {columns.map((column, index) => {
        const left = nodeX(index);
        const segmentW = column.final ? NODE_W : NODE_W + NODE_GAP;
        // El lanzamiento es la primera estación, salvo que solo haya tramos a medio
        // escribir: entonces es el final, sin fecha propia, el que arranca en él.
        const launch = column.final ? column.station === null : index === 0 && column.kind !== "pending";
        const isToday = today?.id === column.id;

        return (
          <div key={column.id}>
            {/* Trazo del tramo */}
            <span
              className="absolute h-[3px] rounded-full"
              style={{ left, width: segmentW, top: RAIL_LINE_Y - 1, ...segmentStyle(column) }}
            />

            {/* Estación: el mes en que empieza */}
            <span
              className={`absolute grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full ${
                launch ? "h-[18px] w-[18px] bg-[#4A2310] text-[#FF8A3D] ring-1 ring-[#FF8A3D]/50" : "h-[9px] w-[9px] bg-[#F7EDE6]"
              }`}
              style={{ left: left + (launch ? 9 : 0), top: RAIL_LINE_Y + 0.5 }}
            >
              {launch && <Rocket className="h-2.5 w-2.5" />}
            </span>

            <span
              className="absolute top-0 flex items-baseline gap-1.5 whitespace-nowrap"
              style={{ left: left + (launch ? 0 : -4) }}
            >
              {launch ? (
                <>
                  <span className="text-[10.5px] font-semibold text-[#FFB48A]">Lanzamiento</span>
                  <span className="font-mono text-[10.5px] text-white/60">
                    {releaseMonth ? formatMonth(releaseMonth) : "sin fecha"}
                  </span>
                </>
              ) : (
                <span className="font-mono text-[10.5px] font-semibold text-white/80">
                  {column.station ? formatMonth(column.station) : "sin fechas"}
                </span>
              )}
            </span>

            {/* Lo que se cobra en el tramo y cuánto dura */}
            <span
              className="absolute flex items-baseline justify-center gap-1.5 whitespace-nowrap"
              style={{ left, width: column.final ? NODE_W * 0.7 : NODE_W, top: RAIL_LINE_Y + 10 }}
            >
              <span
                className={`font-mono text-[11px] font-semibold ${
                  column.kind === "paid" ? "text-[#FF8A3D]" : "text-white/55"
                }`}
              >
                {fmtPct(column.percentage)}%
              </span>
              <span className="text-[10.5px] text-white/50">
                {column.final ? "para siempre" : column.months ? `· ${monthsLabel(column.months)}` : ""}
              </span>
            </span>

            {column.final && (
              <InfinityIcon
                className="absolute h-4 w-4 -translate-y-1/2 text-[#FF8A3D]/70"
                style={{ left: left + NODE_W - 16, top: RAIL_LINE_Y + 0.5 }}
              />
            )}

            {/* Hoy: en qué punto del tramo cae el mes en curso */}
            {isToday && today && (
              <span
                className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#F7EDE6] px-1.5 py-[1px] text-[9.5px] font-bold uppercase tracking-wide text-[#1C1D22] shadow-[0_0_0_3px_rgba(20,12,8,0.85)]"
                style={{
                  left: left + segmentW * Math.min(Math.max(today.fraction, 0.12), 0.88),
                  top: RAIL_LINE_Y + 0.5,
                }}
              >
                Hoy
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Las tarjetas ──────────────────────────────────────────────────────────── */

/**
 * La marca de la cabecera de cada tarjeta. Su forma dice qué clase de tramo es
 * sin gastar una palabra: relleno cuando se cobra, hueco cuando es un 0%, el
 * cohete en el que arranca con el lanzamiento y el anillo abierto en el que no
 * termina. Es la misma forma que su trazo en el raíl.
 */
function NodeMark({ variant, icon }: { variant: "paid" | "zero" | "final"; icon?: React.ReactNode }) {
  if (icon) {
    return (
      <span className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full bg-[#4A2310] text-[#FF8A3D]">
        {icon}
      </span>
    );
  }

  return (
    <span
      className={`grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full bg-[#241914] ${
        variant === "final" ? "ring-[1.5px] ring-dashed ring-[#FF8A3D]/60" : ""
      }`}
    >
      <span
        className={`h-[9px] w-[9px] rounded-full ${
          variant === "paid"
            ? "bg-[#FF5C00]"
            : variant === "final"
              ? "bg-[#FF8A3D]/70"
              : "border-[1.5px] border-white/40 bg-transparent"
        }`}
      />
    </span>
  );
}

/**
 * Lo que cobra el tramo, en grande: es la respuesta que se busca en cada
 * tarjeta, así que va por encima de las fechas.
 */
function PercentInput({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-[12px] bg-black/[0.22] py-1.5 pl-3 pr-1.5">
      <span className="text-[11px] font-medium text-white/60">Cobra</span>
      <span className="relative w-[104px] shrink-0">
        <input
          type="number"
          min="0"
          max="100"
          step="0.01"
          placeholder="0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={label}
          className="w-full rounded-[10px] border border-white/[0.14] bg-white/[0.06] py-1.5 pl-2.5 pr-7 text-right font-mono text-[20px] font-light leading-[1.1] text-white placeholder:text-white/40 outline-none transition-colors focus:border-[#FF8A3D] focus:ring-2 focus:ring-[#FF5C00]/30"
        />
        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-[12px] text-white/50">
          %
        </span>
      </span>
    </label>
  );
}

/** La rejilla Desde / Hasta del tramo que se escribe. */
function PeriodGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-[46px_minmax(0,1fr)] items-center gap-x-2 gap-y-1.5">{children}</div>;
}

/** Etiqueta de la columna izquierda de la rejilla. */
function GridLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-[11px] font-medium text-white/60">{children}</span>;
}

/**
 * Cuerpo común de una tarjeta. Del borde de arriba sube el conector hasta su
 * tramo del raíl: siempre recto, porque la tarjeta está en la columna de su
 * tramo.
 *
 * El tramo que rige hoy lleva el contorno crema, el mismo tono del marcador del
 * raíl, y su conector también.
 */
function NodeCard({
  tone,
  label,
  isToday,
  onReveal,
  children,
}: {
  tone: "written" | "generated" | "final";
  label: string;
  isToday: boolean;
  onReveal: () => void;
  children: React.ReactNode;
}) {
  const tones = {
    written: "bg-[#2B1E17] ring-1 ring-white/[0.14]",
    // Un hueco generado no lo escribió nadie: borde a trazos, como su tramo sin dueño.
    generated: "bg-[#231812] border border-dashed border-white/[0.22]",
    final: "bg-[#33190C] ring-1 ring-[#FF8A3D]/35",
  };
  return (
    <div
      role="group"
      aria-label={label}
      onFocusCapture={onReveal}
      style={{ width: NODE_W }}
      className={`relative rounded-[14px] p-2.5 shadow-[0_12px_28px_-14px_rgba(0,0,0,0.7)] ${tones[tone]} ${
        isToday ? "outline outline-2 outline-offset-2 outline-[#F7EDE6]/80" : ""
      }`}
    >
      <span
        aria-hidden="true"
        className={`absolute left-1/2 border-l border-dashed ${
          isToday ? "border-[#F7EDE6]/70" : "border-white/[0.22]"
        }`}
        style={{ top: -CONNECTOR_H, height: CONNECTOR_H - 3 }}
      />
      {children}
    </div>
  );
}

/** Botón pequeño de la cabecera de una tarjeta. */
function HeaderButton({
  label,
  ariaLabel,
  onClick,
  tone = "neutral",
  pressed,
  children,
}: {
  label: string;
  /** Nombre para lectores de pantalla, cuando el tooltip no basta para nombrarlo. */
  ariaLabel?: string;
  onClick: () => void;
  tone?: "neutral" | "active" | "danger" | "add";
  pressed?: boolean;
  children: React.ReactNode;
}) {
  const tones = {
    neutral: "text-white/50 hover:bg-white/[0.08] hover:text-white/80",
    active: "bg-[#FF5C00]/[0.16] text-[#FF8A3D]",
    danger: "text-white/50 hover:bg-[#E5484D]/[0.16] hover:text-[#FF8F92]",
    add: "bg-[#FF5C00]/[0.16] text-[#FF8A3D] hover:bg-[#FF5C00]/[0.26] hover:text-[#FFB48A]",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={ariaLabel ?? label}
      aria-expanded={pressed}
      className={`grid h-[26px] w-[26px] place-items-center rounded-[9px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70 ${tones[tone]}`}
    >
      {children}
    </button>
  );
}

/**
 * Cabecera de una tarjeta: el título son sus fechas y debajo su sitio en la
 * cadena y lo que dura. A la derecha van sus acciones. El "+" añade un tramo nuevo al final de la cadena, antes del final.
 */
function NodeHeader({
  mark,
  title,
  meta,
  isToday,
  onAdd,
  children,
}: {
  mark: React.ReactNode;
  title: string;
  meta: string;
  isToday: boolean;
  onAdd: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-2.5 flex items-start justify-between gap-2">
      <span className="flex min-w-0 flex-1 items-start gap-1.5">
        <span className="mt-px">{mark}</span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-[12.5px] font-semibold leading-[1.35] text-white">{title}</span>
          <span className="flex items-center gap-1.5 truncate text-[10.5px] text-white/55">
            {isToday && (
              <span className="rounded-full bg-[#F7EDE6] px-1.5 text-[9px] font-bold uppercase tracking-wide text-[#1C1D22]">
                Rige hoy
              </span>
            )}
            <span className="truncate">{meta}</span>
          </span>
        </span>
      </span>

      <span className="flex shrink-0 items-center gap-0.5">
        {children}
        <HeaderButton label="Añadir tramo" tone="add" onClick={onAdd}>
          <Plus className="h-3.5 w-3.5" />
        </HeaderButton>
      </span>
    </div>
  );
}

/** «Solo Spotify, Deezer +2» o «Excepto US»; null si el tramo no se acota. */
const scopeSummary = (type: string, selected: readonly SelectOption[], noun: string): string | null => {
  if (type === "all") return null;
  const verb = type === "only" ? "Solo" : "Excepto";
  if (selected.length === 0) return `${verb} · elige ${noun}`;
  const names = selected.slice(0, 2).map((option) => option.label).join(", ");
  return `${verb} ${names}${selected.length > 2 ? ` +${selected.length - 2}` : ""}`;
};

/**
 * El tramo final: el que empieza cuando acaba el último y ya no termina.
 *
 * Está siempre, incluso sin ningún otro tramo: entonces es el único que hay y
 * arranca en el lanzamiento de la canción. Por eso es lo primero que ve quien
 * reparte un split nuevo —"desde su lanzamiento, para siempre"— y no una regla
 * escondida que solo aparece cuando ya hay fechas de por medio.
 *
 * Sus fechas no se editan: el inicio lo marca el tramo anterior y el fin no
 * existe, así que van en el título y no en campos. Su porcentaje sí, y es el
 * mismo dato que el split guarda como `percentage`.
 */
function FinalNode({
  from,
  total,
  isToday,
  percentage,
  warning,
  onAdd,
  onChange,
  onReveal,
}: {
  from: string | null;
  total: number;
  isToday: boolean;
  percentage: string;
  warning?: string | null;
  onAdd: () => void;
  onChange: (value: string) => void;
  onReveal: () => void;
}) {
  const since = from ? formatMonth(from) : "el lanzamiento";
  return (
    <NodeCard
      tone="final"
      label={`Tramo final, desde ${since}, sin fecha de fin, cobra ${fmtPct(percentage)}%${isToday ? ". Rige hoy" : ""}`}
      isToday={isToday}
      onReveal={onReveal}
    >
      <NodeHeader
        mark={<NodeMark variant="final" />}
        title={`Desde ${since}`}
        meta={total > 1 ? `Tramo final · ${total} de ${total} · no termina` : "Único tramo · no termina"}
        isToday={isToday}
        onAdd={onAdd}
      />

      <PercentInput
        value={percentage}
        onChange={onChange}
        label={from ? `Porcentaje desde ${formatMonth(from)}, sin fecha de fin` : "Porcentaje desde el lanzamiento, sin fecha de fin"}
      />

      <p className="mt-2 flex items-center gap-1.5 text-[10.5px] leading-[1.4] text-white/55">
        <InfinityIcon className="h-3.5 w-3.5 shrink-0 text-[#FF8A3D]" aria-hidden="true" />
        Rige todo lo que venga después, sin fecha de fin
      </p>

      {warning && <p className="mt-2 text-[10.5px] font-semibold leading-[1.4] text-[#FF8F92]">{warning}</p>}
    </NodeCard>
  );
}

function PeriodNode({
  period,
  index,
  total,
  isToday,
  ownerKey,
  minYear,
  maxYear,
  countryOptions,
  platformOptions,
  isLoadingFilters,
  onAdd,
  onRemove,
  onChange,
  onReveal,
}: {
  period: SplitPeriodFormData;
  index: number;
  total: number;
  isToday: boolean;
  ownerKey: string;
  minYear: number;
  maxYear: number;
  countryOptions: SelectOption[];
  platformOptions: SelectOption[];
  isLoadingFilters: boolean;
  onAdd: () => void;
  onRemove: () => void;
  onChange: (field: keyof SplitPeriodFormData, value: string | readonly SelectOption[]) => void;
  onReveal: () => void;
}) {
  const narrowed = period.countriesType !== "all" || period.platformsType !== "all";
  const [showFilters, setShowFilters] = useState(false);
  const inverted = Boolean(period.from && period.to && period.from > period.to);
  // Las fechas de un tramo generado las fijan sus vecinos: editarlas aquí sería
  // moverlo a un sitio donde ya hay otro tramo, o abrir el hueco otra vez.
  const generated = Boolean(period.autoFilled);
  const zero = isZero(period.percentage);
  const months = isComplete(period) ? monthsOf(period) : null;
  const title = periodTitle(period);

  const metaParts = [`Tramo ${index + 1} de ${total}`];
  if (period.openStart && isComplete(period)) metaParts.push(`hasta ${formatMonth(period.to)}`);
  else if (months) metaParts.push(monthsLabel(months));
  const scopes = [
    scopeSummary(period.countriesType, period.selectedCountries, "países"),
    scopeSummary(period.platformsType, period.selectedPlatforms, "plataformas"),
  ].filter(Boolean) as string[];

  return (
    <NodeCard
      tone={generated ? "generated" : "written"}
      label={`Tramo ${index + 1} de ${total}: ${title}${
        period.openStart && isComplete(period) ? ` hasta ${formatMonth(period.to)}` : ""
      }, cobra ${fmtPct(period.percentage)}%${isToday ? ". Rige hoy" : ""}`}
      isToday={isToday}
      onReveal={onReveal}
    >
      <NodeHeader
        mark={
          period.openStart ? (
            <NodeMark variant="paid" icon={<Rocket className="h-2.5 w-2.5" />} />
          ) : (
            <NodeMark variant={zero ? "zero" : "paid"} />
          )
        }
        title={title}
        meta={metaParts.join(" · ")}
        isToday={isToday}
        onAdd={onAdd}
      >
        <HeaderButton
          label={narrowed ? "Acotado a países o plataformas" : "Acotar a países o plataformas"}
          tone={narrowed ? "active" : "neutral"}
          pressed={showFilters}
          onClick={() => setShowFilters((v) => !v)}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
        </HeaderButton>
        <HeaderButton
          label={generated ? "Quitar: sus meses se los queda el tramo de al lado" : "Quitar: sus meses pasan a no pagar nada"}
          ariaLabel={generated ? `Quitar el hueco ${index + 1}` : `Quitar el tramo ${index + 1}`}
          tone="danger"
          onClick={onRemove}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </HeaderButton>
      </NodeHeader>

      <PercentInput
        value={period.percentage}
        onChange={(value) => onChange("percentage", value)}
        label={`Porcentaje del tramo ${index + 1}`}
      />

      {generated ? (
        <p className="mt-2 text-[10.5px] leading-[1.35] text-white/55">
          {period.openStart
            ? "Cubre desde que salió la canción hasta el primer tramo que escribiste. Se creó solo."
            : "Se creó solo para que no queden meses sin regla entre dos tramos."}
        </p>
      ) : (
        <div className="mt-2.5">
          <PeriodGrid>
            <GridLabel>Desde</GridLabel>
            <MonthField
              value={period.from}
              onChange={(value) => onChange("from", value)}
              minYear={minYear}
              maxYear={maxYear}
              label={`inicio del tramo ${index + 1}`}
              invalid={inverted}
            />

            <GridLabel>Hasta</GridLabel>
            <MonthField
              value={period.to}
              onChange={(value) => onChange("to", value)}
              minYear={minYear}
              maxYear={maxYear}
              label={`fin del tramo ${index + 1}`}
              invalid={inverted}
            />
          </PeriodGrid>
        </div>
      )}

      {inverted && (
        <p className="mt-2 text-[10.5px] font-semibold text-[#FF8F92]">Este tramo termina antes de empezar.</p>
      )}

      {/* Lo acotado se lee sin abrir el panel de filtros */}
      {scopes.length > 0 && !showFilters && (
        <div className="mt-2 flex flex-wrap gap-1">
          {scopes.map((scope) => (
            <span
              key={scope}
              className="max-w-full truncate rounded-full bg-[#FF5C00]/[0.14] px-2 py-0.5 text-[10.5px] font-medium text-[#FFB48A]"
            >
              {scope}
            </span>
          ))}
        </div>
      )}

      {showFilters && (
        <div className="mt-2 flex flex-col gap-2.5 border-t border-white/[0.09] pt-2.5">
          <div className="flex flex-col gap-1.5">
            <span className="flex items-center gap-1.5 font-mono text-[9px] tracking-[1px] text-white/50">
              <Globe className="h-2.5 w-2.5" />
              PAÍSES DE ESTE TRAMO
            </span>
            <FilterSegment
              value={period.countriesType}
              onChange={(v) => onChange("countriesType", v)}
              labels={{ all: "Todos", except: "Excepto", only: "Solo" }}
              name={`tramo-países-${ownerKey}-${period.id}`}
            />
            {period.countriesType !== "all" && (
              <Select
                isMulti
                isLoading={isLoadingFilters}
                options={countryOptions}
                value={period.selectedCountries}
                onChange={(selected) => onChange("selectedCountries", selected ?? [])}
                styles={glassSelectStyles}
                menuPortalTarget={document.body}
                menuPosition="fixed"
                placeholder="Elegir países…"
                noOptionsMessage={() => "No hay países disponibles"}
              />
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="flex items-center gap-1.5 font-mono text-[9px] tracking-[1px] text-white/50">
              <Radio className="h-2.5 w-2.5" />
              PLATAFORMAS DE ESTE TRAMO
            </span>
            <FilterSegment
              value={period.platformsType}
              onChange={(v) => onChange("platformsType", v)}
              labels={{ all: "Todas", except: "Excepto", only: "Solo" }}
              name={`tramo-plataformas-${ownerKey}-${period.id}`}
            />
            {period.platformsType !== "all" && (
              <Select
                isMulti
                isLoading={isLoadingFilters}
                options={platformOptions}
                value={period.selectedPlatforms}
                onChange={(selected) => onChange("selectedPlatforms", selected ?? [])}
                styles={glassSelectStyles}
                menuPortalTarget={document.body}
                menuPosition="fixed"
                placeholder="Elegir plataformas…"
                noOptionsMessage={() => "No hay plataformas disponibles"}
              />
            )}
          </div>
        </div>
      )}
    </NodeCard>
  );
}

export default SplitPeriodsEditor;
