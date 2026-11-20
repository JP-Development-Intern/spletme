import { ArrowDown, ChevronRight, Send } from "lucide-react";
import { type CollaboratorSortBy } from "@/components/collaborators/collaboratorsSort";
import {
  STATE_META_ON_GLASS,
  avatarTextColor,
  describeRoles,
  resolveCollaboratorState,
  settledPercentage,
} from "@/utils/collaborators.utils";
import { formatCurrency } from "@/utils/format.utils";
import type { Collaborator } from "@/types";

interface CollaboratorsListProps {
  /** Las mismas personas y en el mismo orden que recorre el carrusel. */
  collaborators: Collaborator[];
  /** La persona elegida: la misma que enfoca el carrusel, y la de las canciones de abajo. */
  focusedId: string | null;
  onFocus: (collaborator: Collaborator) => void;
  colorOf: (id: string) => string;
  sortBy: CollaboratorSortBy;
  onSortChange: (sort: CollaboratorSortBy) => void;
  onOpenProfile: (collaborator: Collaborator) => void;
  onPay: (collaborator: Collaborator) => void;
}

/**
 * Columnas por breakpoint. Las ocultas no ocupan celda, así que cada tamaño
 * declara solo las que se ven: móvil = persona + por pagar + acción; md suma
 * el estado; lg, todas.
 */
const GRID =
  "grid items-center gap-3.5 grid-cols-[minmax(0,1fr)_116px_40px] " +
  "md:grid-cols-[minmax(0,1fr)_150px_150px_132px] " +
  "lg:grid-cols-[minmax(0,1fr)_150px_112px_120px_168px_148px]";

const ONLY_LG = "hidden lg:flex";
const FROM_MD = "hidden md:flex";

const formatPresence = (presence: number): string => {
  if (presence <= 0) return "0 % del catálogo";
  if (presence < 1) return `${presence.toFixed(1)} % del catálogo`;
  return `${Math.round(presence)} % del catálogo`;
};

/**
 * Las mismas personas del carrusel, todas a la vez. El carrusel sirve para
 * recorrerlas de una en una; la lista, para compararlas y llegar directo a
 * cualquiera sin pasar por las demás.
 *
 * Elegir una fila hace lo mismo que enfocarla en el carrusel: cambia las
 * canciones de debajo. Por eso las dos vistas comparten persona y orden, y al
 * cambiar de una a otra no se pierde a quién se estaba mirando.
 *
 * Solo hay cifras de pagos: los streams y el ingreso de lo que compartís salen
 * del detalle de cada persona, y pedirlo para toda la lista sería una consulta
 * por fila.
 */
export function CollaboratorsList({
  collaborators,
  focusedId,
  onFocus,
  colorOf,
  sortBy,
  onSortChange,
  onOpenProfile,
  onPay,
}: CollaboratorsListProps) {
  return (
    <section className="glass overflow-hidden rounded-[28px]" aria-label="Lista de colaboradores">
      <div className={`${GRID} bg-black/[0.08] px-5 py-3`}>
        <SortHeader label="PERSONA" sort="name_asc" current={sortBy} onSort={onSortChange} />
        <HeaderLabel label="ESTADO" className={FROM_MD} />
        <SortHeader label="CANCIONES" sort="songs_desc" current={sortBy} onSort={onSortChange} className={ONLY_LG} />
        <SortHeader
          label="YA PAGADO"
          sort="paid_desc"
          current={sortBy}
          onSort={onSortChange}
          className={`${ONLY_LG} justify-end`}
        />
        <SortHeader
          label="POR PAGAR"
          sort="pending_desc"
          current={sortBy}
          onSort={onSortChange}
          className="flex justify-end"
        />
        <span aria-hidden="true" />
      </div>

      <ul className="flex flex-col divide-y divide-white/[0.07]">
        {collaborators.map((collaborator) => (
          <Row
            key={collaborator.id}
            collaborator={collaborator}
            color={colorOf(collaborator.id)}
            selected={collaborator.id === focusedId}
            onFocus={() => onFocus(collaborator)}
            onOpenProfile={() => onOpenProfile(collaborator)}
            onPay={() => onPay(collaborator)}
          />
        ))}
      </ul>
    </section>
  );
}

interface RowProps {
  collaborator: Collaborator;
  color: string;
  selected: boolean;
  onFocus: () => void;
  onOpenProfile: () => void;
  onPay: () => void;
}

/**
 * Fila de una persona. Toda la fila la elige; los botones que hacen otra cosa
 * (pagar, abrir el perfil) detienen el clic. El nombre es el botón real, para
 * que el teclado tenga dónde caer.
 */
function Row({ collaborator, color, selected, onFocus, onOpenProfile, onPay }: RowProps) {
  const state = resolveCollaboratorState(collaborator);
  const stateMeta = STATE_META_ON_GLASS[state];
  const roles = describeRoles(collaborator.roles);
  const roleLabel = roles.length ? [...new Set(roles.map((r) => r.long))].join(" · ") : "Colaborador";
  const pending = collaborator.amountPending;
  const total = collaborator.paid + pending;
  const settled = settledPercentage(collaborator.paid, pending);
  const canPay = state === "can_pay";

  return (
    <li
      onClick={onFocus}
      className={`${GRID} group relative cursor-pointer px-5 py-3 transition-colors ${
        selected ? "bg-white/[0.07]" : "hover:bg-white/[0.04]"
      }`}
    >
      {/* Marca de la persona elegida: la que ve sus canciones debajo */}
      {selected && (
        <span aria-hidden="true" className="absolute inset-y-2 left-0 w-[3px] rounded-r-full bg-[#F7EDE6]" />
      )}

      {/* Persona */}
      <div className="flex min-w-0 items-center gap-3">
        <span
          aria-hidden="true"
          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full font-display text-[14px] font-semibold ${
            color === "#1C1D22" ? "border-2 border-white/25" : ""
          }`}
          style={{ backgroundColor: color, color: avatarTextColor(color) }}
        >
          {collaborator.initials}
        </span>
        <div className="flex min-w-0 flex-col gap-0.5">
          <button
            type="button"
            aria-pressed={selected}
            aria-label={`${collaborator.name}: ver sus canciones`}
            onClick={(e) => {
              e.stopPropagation();
              onFocus();
            }}
            className="truncate text-left text-[13.5px] font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70 group-hover:text-[#FFB067]"
            title={collaborator.name}
          >
            {collaborator.name}
          </button>
          <span className="flex min-w-0 items-center gap-1.5 text-[11.5px] text-white/50">
            {/* En móvil el estado no tiene columna: viaja con el nombre */}
            <span
              className="h-1.5 w-1.5 flex-shrink-0 rounded-full md:hidden"
              style={{ backgroundColor: stateMeta.fg }}
              title={stateMeta.label}
            />
            <span className="flex-shrink-0">{roleLabel}</span>
            {collaborator.email && (
              <>
                <span className="text-white/40">·</span>
                <span className="truncate">{collaborator.email}</span>
              </>
            )}
          </span>
        </div>
      </div>

      {/* Estado */}
      <div className={FROM_MD}>
        <span
          className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11.5px] font-semibold"
          style={{ color: stateMeta.fg, backgroundColor: stateMeta.bg }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: stateMeta.fg }} />
          {stateMeta.label}
        </span>
      </div>

      {/* Canciones */}
      <div className={`${ONLY_LG} flex-col`}>
        <span className="font-mono text-[13px] text-white">{collaborator.songs.toLocaleString()}</span>
        <span className="text-[11px] text-white/50">{formatPresence(collaborator.songPresencePercentage)}</span>
      </div>

      {/* Ya pagado */}
      <div className={`${ONLY_LG} justify-end`}>
        <span className="font-mono text-[13px] text-white/70">{formatCurrency(collaborator.paid)}</span>
      </div>

      {/* Por pagar, con lo que ya está saldado de su parte */}
      <div className="flex flex-col items-end gap-1.5">
        <span className={`font-mono text-[13.5px] ${pending > 0 ? "font-medium text-[#FF8A3D]" : "text-white/50"}`}>
          {formatCurrency(pending)}
        </span>
        {total > 0 && (
          <span className="hidden w-full max-w-[150px] flex-col items-end gap-1 lg:flex">
            <span className="h-1 w-full overflow-hidden rounded-full bg-white/[0.08]">
              <span className="block h-full rounded-full bg-[#45D39A]" style={{ width: `${settled}%` }} />
            </span>
            <span className="text-[10.5px] text-white/50">
              {Math.round(settled)} % pagado de {formatCurrency(total)}
            </span>
          </span>
        )}
      </div>

      {/* Acciones */}
      <div className="flex items-center justify-end gap-1.5">
        {canPay && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPay();
            }}
            aria-label={`Pagar ${formatCurrency(pending)} a ${collaborator.name}`}
            className="hidden items-center gap-1.5 rounded-full bg-[#FF5C00] px-3.5 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-[#EA580C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 md:flex"
          >
            <Send className="h-3.5 w-3.5" />
            Pagar
          </button>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenProfile();
          }}
          aria-label={`Ver el perfil de ${collaborator.name}`}
          title="Ver perfil"
          className="glass-control flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors hover:bg-white/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
}

function SortHeader({
  label,
  sort,
  current,
  onSort,
  className = "flex",
}: {
  label: string;
  sort: CollaboratorSortBy;
  current: CollaboratorSortBy;
  onSort: (sort: CollaboratorSortBy) => void;
  className?: string;
}) {
  const active = current === sort;
  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => onSort(sort)}
        aria-pressed={active}
        className={`flex items-center gap-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70 ${
          active ? "text-white" : "text-white/50 hover:text-white/80"
        }`}
      >
        <span className="text-[10.5px] font-medium tracking-[1.4px]">{label}</span>
        {active && <ArrowDown className={`h-3 w-3 text-[#FF8A3D] ${sort === "name_asc" ? "rotate-180" : ""}`} />}
      </button>
    </div>
  );
}

function HeaderLabel({ label, className }: { label: string; className: string }) {
  return (
    <div className={className}>
      <span className="truncate text-[10.5px] font-medium tracking-[1.4px] text-white/50">{label}</span>
    </div>
  );
}
