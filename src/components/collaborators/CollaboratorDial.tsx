import { useEffect, useRef, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Send,
} from "lucide-react";
import { SORT_LABELS, type CollaboratorSortBy } from "@/components/collaborators/collaboratorsSort";
import {
  STATE_META_ON_GLASS,
  avatarTextColor,
  describeRoles,
  resolveCollaboratorState,
} from "@/utils/collaborators.utils";
import { formatCurrency, formatStreams } from "@/utils/format.utils";
import type { Collaborator } from "@/types";

export type MoneyView = "in" | "out";

interface CollaboratorDialProps {
  /** La lista en el orden de la página: el carrusel la recorre tal cual, sin dar la vuelta. */
  collaborators: Collaborator[];
  focusIndex: number;
  onFocusIndexChange: (index: number) => void;
  colorOf: (id: string) => string;
  sortBy: CollaboratorSortBy;
  onSortChange: (sort: CollaboratorSortBy) => void;
  view: MoneyView;
  onViewChange: (view: MoneyView) => void;
  /** Streams e ingreso neto de lo que se comparte con la persona enfocada. */
  shared: { streams: number; netIncome: number } | null;
  sharedLoading: boolean;
  onOpenProfile: (collaborator: Collaborator) => void;
  onPay: (collaborator: Collaborator) => void;
}

/* ── Geometría del dial (la del diseño, a 1120px de ancho) ─────────────────── */

const DESIGN_WIDTH = 1120;
const RADIUS = 640;
/** Centro del avatar enfocado, medido desde arriba del dial. */
const CENTER_Y = 128;
const BASE = 168;
/** Por cada distancia al centro: ángulo sobre el arco, diámetro y opacidad. */
const SLOTS = [
  { angle: 0, size: 168, opacity: 1 },
  { angle: 14.72, size: 104, opacity: 0.9 },
  { angle: 25.47, size: 76, opacity: 0.66 },
  { angle: 34.07, size: 56, opacity: 0.44 },
  // Fuera de vista: de aquí entran y aquí salen los avatares al avanzar.
  { angle: 42, size: 44, opacity: 0 },
];
const RING = 184;
const ARC_SPAN = 42;

const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Ancho del contenedor, para escalar el dial sin deformar el arco. */
function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(DESIGN_WIDTH);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

/**
 * Carrusel de colaboradores en forma de dial: la persona enfocada en la cima
 * del arco y sus vecinos bajando a los lados. El arco es el mismo dial del
 * concepto que usa el Inicio.
 *
 * No da la vuelta: el orden es el de la página (por defecto, mayor saldo por
 * pagar) y en los extremos la flecha se desactiva, para que se vea dónde
 * empieza y dónde acaba la lista.
 */
export function CollaboratorDial({
  collaborators,
  focusIndex,
  onFocusIndexChange,
  colorOf,
  sortBy,
  onSortChange,
  view,
  onViewChange,
  shared,
  sharedLoading,
  onOpenProfile,
  onPay,
}: CollaboratorDialProps) {
  const [stageRef, width] = useWidth<HTMLDivElement>();
  const scale = Math.min(1, Math.max(0.5, width / DESIGN_WIDTH));
  const cx = width / 2;
  const radius = RADIUS * scale;
  const centerY = CENTER_Y * scale;

  const total = collaborators.length;
  const focused = collaborators[focusIndex];
  const canGoBack = focusIndex > 0;
  const canGoForward = focusIndex < total - 1;

  const go = (delta: number) => {
    const next = focusIndex + delta;
    if (next >= 0 && next < total) onFocusIndexChange(next);
  };

  const pointOnArc = (angle: number) => ({
    x: cx + radius * Math.sin(toRad(angle)),
    y: centerY + radius - radius * Math.cos(toRad(angle)),
  });

  const arcFrom = pointOnArc(-ARC_SPAN);
  const arcTo = pointOnArc(ARC_SPAN);

  if (!focused) return null;

  const state = resolveCollaboratorState(focused);
  const stateMeta = STATE_META_ON_GLASS[state];
  const roles = describeRoles(focused.roles);
  const roleLabel = roles.length ? [...new Set(roles.map((r) => r.long))].join(" · ") : "Colaborador";

  return (
    <section
      className="glass overflow-hidden rounded-[32px]"
      role="region"
      aria-roledescription="carrusel"
      aria-label="Colaboradores"
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          go(-1);
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          go(1);
        }
      }}
    >
      <div className="flex flex-col gap-2 px-5 pb-6 pt-6 sm:px-7">
        <SortSelect value={sortBy} onChange={onSortChange} />

        {/* Escenario del dial */}
        <div ref={stageRef} className="relative" style={{ height: 232 * scale }}>
          <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
            <path
              d={`M ${arcFrom.x} ${arcFrom.y} A ${radius} ${radius} 0 0 1 ${arcTo.x} ${arcTo.y}`}
              fill="none"
              stroke="rgba(255,255,255,0.18)"
              strokeWidth={1}
            />
          </svg>

          <span
            aria-hidden="true"
            className="absolute rounded-full border-[3px] border-[#F7EDE6]"
            style={{
              width: RING * scale,
              height: RING * scale,
              left: cx - (RING * scale) / 2,
              top: centerY - (RING * scale) / 2,
            }}
          />

          {collaborators.map((collaborator, index) => {
            const slot = index - focusIndex;
            const distance = Math.abs(slot);
            if (distance >= SLOTS.length) return null;

            const { angle, size, opacity } = SLOTS[distance];
            const { x, y } = pointOnArc(angle * Math.sign(slot));
            const color = colorOf(collaborator.id);
            const isFocused = slot === 0;
            const offstage = distance === SLOTS.length - 1;

            return (
              <button
                key={collaborator.id}
                type="button"
                tabIndex={isFocused || offstage ? -1 : 0}
                aria-hidden={offstage || undefined}
                aria-label={isFocused ? undefined : `Ver a ${collaborator.name}`}
                disabled={isFocused || offstage}
                onClick={() => onFocusIndexChange(index)}
                className={`absolute left-0 top-0 flex items-center justify-center rounded-full font-display transition-[transform,opacity] duration-300 ease-out focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FF5C00]/70 motion-reduce:transition-none ${
                  color === "#1C1D22" ? "border-2 border-white/25" : ""
                } ${isFocused ? "cursor-default" : "cursor-pointer hover:brightness-110"}`}
                style={{
                  width: BASE,
                  height: BASE,
                  backgroundColor: color,
                  color: avatarTextColor(color),
                  opacity,
                  transform: `translate(${x - BASE / 2}px, ${y - BASE / 2}px) scale(${(size * scale) / BASE})`,
                  fontSize: BASE * 0.34,
                  fontWeight: isFocused ? 500 : 600,
                  letterSpacing: "-0.01em",
                }}
              >
                <span aria-hidden="true">{collaborator.initials}</span>
              </button>
            );
          })}

          {/* Nombres de los vecinos inmediatos: dicen a quién lleva cada flecha */}
          {[-1, 1].map((side) => {
            const neighbor = collaborators[focusIndex + side];
            if (!neighbor) return null;
            const { x, y } = pointOnArc(SLOTS[1].angle * side);
            return (
              <span
                key={`${side}-${neighbor.id}`}
                aria-hidden="true"
                className="pointer-events-none absolute w-40 -translate-x-1/2 truncate text-center text-xs font-medium text-white/65"
                style={{ left: x, top: y + (SLOTS[1].size * scale) / 2 + 10, opacity: SLOTS[1].opacity }}
              >
                {neighbor.name}
              </span>
            );
          })}
        </div>

        {/* Persona enfocada */}
        <div className="flex flex-col items-center gap-2 pt-2 text-center">
          <h2 className="max-w-full truncate font-display text-[34px] font-light leading-[1.1] tracking-[-0.015em] text-white">
            {focused.name}
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <span className="text-[13px] text-white/65">{roleLabel}</span>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold"
              style={{ color: stateMeta.fg, backgroundColor: stateMeta.bg }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: stateMeta.fg }} />
              {stateMeta.label}
            </span>
          </div>
        </div>

        {/* Controles: las flechas van juntas, alrededor de la posición */}
        <div className="flex items-center justify-center gap-[18px] pt-5">
          <ArrowButton direction="prev" disabled={!canGoBack} onClick={() => go(-1)} />
          <span className="w-16 text-center font-display text-base tabular-nums">
            <span className="font-medium text-white">{focusIndex + 1}</span>
            <span className="text-white/50"> / {total}</span>
          </span>
          <ArrowButton direction="next" disabled={!canGoForward} onClick={() => go(1)} />
        </div>

        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {focused.name}, {focusIndex + 1} de {total}
        </p>
      </div>

      <FocusedDetails
        collaborator={focused}
        view={view}
        onViewChange={onViewChange}
        shared={shared}
        sharedLoading={sharedLoading}
        canPay={state === "can_pay"}
        onOpenProfile={() => onOpenProfile(focused)}
        onPay={() => onPay(focused)}
      />
    </section>
  );
}

function ArrowButton({
  direction,
  disabled,
  onClick,
}: {
  direction: "prev" | "next";
  disabled: boolean;
  onClick: () => void;
}) {
  const Icon = direction === "prev" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === "prev" ? "Colaborador anterior" : "Colaborador siguiente"}
      className="glass-control flex h-12 w-12 items-center justify-center rounded-full text-white transition-colors hover:bg-white/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-white/[0.07]"
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}

/** El orden de la lista: el carrusel la recorre en este orden. */
function SortSelect({
  value,
  onChange,
}: {
  value: CollaboratorSortBy;
  onChange: (sort: CollaboratorSortBy) => void;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-[12.5px] text-white/50">Ordenados por</span>
      <label className="glass-control relative flex items-center gap-1.5 rounded-full py-[7px] pl-3.5 pr-3 focus-within:ring-2 focus-within:ring-[#FF5C00]/70">
        <span className="text-[12.5px] font-medium text-white">{SORT_LABELS[value]}</span>
        <ChevronDown className="h-3.5 w-3.5 text-white/65" />
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as CollaboratorSortBy)}
          aria-label="Ordenar colaboradores"
          className="absolute inset-0 cursor-pointer opacity-0"
        >
          {Object.entries(SORT_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

const formatPresence = (presence: number): string => {
  if (presence <= 0) return "0 %";
  if (presence < 1) return `${presence.toFixed(1)} %`;
  return `${Math.round(presence)} %`;
};

interface FocusedDetailsProps {
  collaborator: Collaborator;
  view: MoneyView;
  onViewChange: (view: MoneyView) => void;
  shared: { streams: number; netIncome: number } | null;
  sharedLoading: boolean;
  canPay: boolean;
  onOpenProfile: () => void;
  onPay: () => void;
}

/**
 * Cifras de la persona enfocada. El interruptor cambia entre lo que generan las
 * canciones que compartís (Ingresos) y lo que le debes (Pagos); también cambia
 * las columnas de sus canciones, debajo.
 */
function FocusedDetails({
  collaborator,
  view,
  onViewChange,
  shared,
  sharedLoading,
  canPay,
  onOpenProfile,
  onPay,
}: FocusedDetailsProps) {
  const pending = collaborator.amountPending;
  const pendingOr = (value: string) => (sharedLoading ? "—" : value);

  return (
    <div className="flex flex-col gap-5 border-t border-white/[0.09] px-5 py-[22px] sm:px-7 lg:flex-row lg:items-center lg:gap-0">
      <MoneyViewToggle value={view} onChange={onViewChange} />

      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:flex sm:gap-0 lg:pl-7">
        {view === "out" ? (
          <>
            <Stat label="SU PARTE" value={formatCurrency(collaborator.paid + pending)} first />
            <Stat label="YA PAGADO" value={formatCurrency(collaborator.paid)} />
            <Stat label="POR PAGAR" value={formatCurrency(pending)} />
          </>
        ) : (
          <>
            <Stat
              label="CANCIONES"
              value={collaborator.songs.toLocaleString()}
              note={`${formatPresence(collaborator.songPresencePercentage)} del catálogo`}
              first
            />
            <Stat label="STREAMS" value={pendingOr(formatStreams(shared?.streams ?? 0))} />
            <Stat
              label="INGRESO NETO"
              value={pendingOr(formatCurrency(shared?.netIncome ?? 0))}
              valueClassName="text-[#45D39A]"
            />
          </>
        )}
      </dl>

      <div className="flex flex-wrap items-center gap-2.5 lg:ml-auto">
        <button
          type="button"
          onClick={onOpenProfile}
          className="glass-control flex items-center gap-1.5 rounded-full px-[18px] py-[11px] text-[12.5px] font-semibold text-white transition-colors hover:bg-white/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70"
        >
          Ver perfil
          <ChevronRight className="h-[15px] w-[15px] text-white/65" />
        </button>
        {view === "out" && canPay && (
          <button
            type="button"
            onClick={onPay}
            className="flex items-center gap-2 rounded-full bg-[#FF5C00] px-[18px] py-[11px] text-[12.5px] font-semibold text-white shadow-[0_8px_20px_-6px_rgba(255,92,0,0.35)] transition-colors hover:bg-[#EA580C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            <Send className="h-[15px] w-[15px]" />
            Pagar {formatCurrency(pending)}
          </button>
        )}
      </div>
    </div>
  );
}

/** Interruptor deslizante entre Ingresos (money in) y Pagos (money out). */
function MoneyViewToggle({ value, onChange }: { value: MoneyView; onChange: (view: MoneyView) => void }) {
  const options: { value: MoneyView; label: string; icon: typeof ArrowDownLeft }[] = [
    { value: "in", label: "Ingresos", icon: ArrowDownLeft },
    { value: "out", label: "Pagos", icon: ArrowUpRight },
  ];

  return (
    <div
      role="group"
      aria-label="Ver ingresos o pagos"
      className="relative grid w-fit flex-shrink-0 grid-cols-2 rounded-full bg-black/[0.22] p-1"
    >
      <span
        aria-hidden="true"
        className={`absolute bottom-1 left-1 top-1 w-[calc(50%-4px)] rounded-full bg-[#F7EDE6]/[0.92] transition-transform duration-300 ease-out motion-reduce:transition-none ${
          value === "out" ? "translate-x-full" : "translate-x-0"
        }`}
      />
      {options.map(({ value: option, label, icon: Icon }) => {
        const selected = value === option;
        return (
          <button
            key={option}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option)}
            className={`relative z-10 flex items-center justify-center gap-1.5 rounded-full px-3.5 py-2 text-[12.5px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70 ${
              selected ? "font-semibold text-[#1C1D22]" : "font-medium text-white/80 hover:text-white"
            }`}
          >
            <Icon className={`h-3.5 w-3.5 ${selected ? "text-[#1C1D22]" : "text-white/70"}`} />
            {label}
          </button>
        );
      })}
    </div>
  );
}

function Stat({
  label,
  value,
  note,
  first = false,
  valueClassName = "text-white",
}: {
  label: string;
  value: string;
  note?: string;
  first?: boolean;
  valueClassName?: string;
}) {
  return (
    <div
      className={`flex min-w-0 flex-col gap-1.5 sm:px-7 ${
        first ? "sm:pl-0 lg:border-l lg:border-white/[0.09] lg:pl-7" : "sm:border-l sm:border-white/[0.09]"
      }`}
    >
      <dt className="text-[10.5px] font-medium tracking-[1.4px] text-white/50">{label}</dt>
      <dd className="flex flex-wrap items-end gap-x-2">
        <span className={`font-mono text-2xl font-light leading-[1.1] tracking-[-0.01em] ${valueClassName}`}>
          {value}
        </span>
        {note && <span className="pb-0.5 text-xs text-white/65">{note}</span>}
      </dd>
    </div>
  );
}
