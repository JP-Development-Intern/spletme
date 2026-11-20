import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { COLLABORATOR_COLORS, avatarTextColor, initialsOf, personName } from "@/utils/collaborators.utils";
import type { LabelSong } from "@/services/labels";

type SongCollaborator = LabelSong["collaborators"][number];

interface SongCollaboratorsCellProps {
  collaborators: SongCollaborator[];
  songTitle: string;
}

const collaboratorName = personName;

/**
 * Color estable por persona: sale de su id, así que la misma persona lleva el
 * mismo color en todas las filas y se reconoce de un vistazo bajando la tabla.
 */
const colorOf = (c: SongCollaborator): string => {
  const key = c._id ?? c.id ?? collaboratorName(c);
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) hash = (hash * 31 + key.charCodeAt(i)) | 0;
  return COLLABORATOR_COLORS[Math.abs(hash) % COLLABORATOR_COLORS.length];
};

/** «Ana Ruiz», «Ana Ruiz +2». */
const summary = (list: SongCollaborator[]) =>
  list.length === 1 ? collaboratorName(list[0]) : `${collaboratorName(list[0])} +${list.length - 1}`;

function Avatar({ collaborator, size }: { collaborator: SongCollaborator; size: number }) {
  const color = colorOf(collaborator);
  return (
    <span
      aria-hidden="true"
      className={`flex flex-shrink-0 items-center justify-center rounded-full border-2 border-[#2A1A12] font-semibold ${
        color === "#1C1D22" ? "ring-1 ring-white/25" : ""
      }`}
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        color: avatarTextColor(color),
        fontSize: size * 0.38,
      }}
    >
      {initialsOf(collaboratorName(collaborator))}
    </span>
  );
}

/**
 * Quiénes cobran de una canción del sello, dentro de su fila.
 *
 * Se ven las caras y el primer nombre sin hacer nada; el botón abre la lista
 * completa con nombre y correo. Va por clic y no por hover, porque en móvil no
 * hay hover y un `title` no se puede leer con el dedo. El clic no llega a la
 * fila, que lleva a la ficha de la canción.
 *
 * La lista se monta en el `body`: la tabla recorta lo que se sale de su vidrio.
 */
export function SongCollaboratorsCell({ collaborators, songTitle }: SongCollaboratorsCellProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const width = 260;
    setPosition({
      top: rect.bottom + 6,
      left: Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)),
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = (event: Event) => {
      const target = event.target as Node;
      if (menuRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    // Al desplazar la página la lista quedaría flotando lejos de su fila.
    const onScroll = () => setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open]);

  if (collaborators.length === 0) {
    return <span className="text-[12px] text-white/50">Sin colaboradores</span>;
  }

  const shown = collaborators.slice(0, 3);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={`${collaborators.length} ${
          collaborators.length === 1 ? "colaborador" : "colaboradores"
        } en ${songTitle}: ${collaborators.map(collaboratorName).join(", ")}`}
        className={`-ml-1.5 flex min-h-[36px] min-w-0 max-w-full items-center gap-2 rounded-full py-1 pl-1.5 pr-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70 ${
          open ? "bg-white/[0.1]" : "hover:bg-white/[0.07]"
        }`}
      >
        <span className="flex flex-shrink-0 -space-x-2">
          {shown.map((collaborator, index) => (
            <Avatar key={collaborator._id ?? collaborator.id ?? index} collaborator={collaborator} size={26} />
          ))}
        </span>
        <span className="truncate text-[12px] font-medium text-white/80">{summary(collaborators)}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 flex-shrink-0 text-white/50 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open &&
        position &&
        createPortal(
          <div
            ref={menuRef}
            role="dialog"
            aria-label={`Colaboradores de ${songTitle}`}
            onClick={(event) => event.stopPropagation()}
            className="glass-menu fixed z-[9999] flex w-[260px] flex-col rounded-2xl p-1.5"
            style={{ top: position.top, left: position.left }}
          >
            <span className="px-2.5 pb-1.5 pt-1 text-[10.5px] font-medium tracking-[1.2px] text-white/50">
              {collaborators.length} {collaborators.length === 1 ? "COLABORADOR" : "COLABORADORES"}
            </span>
            <ul className="flex max-h-[280px] flex-col overflow-y-auto">
              {collaborators.map((collaborator, index) => (
                <li
                  key={collaborator._id ?? collaborator.id ?? index}
                  className="flex items-center gap-2.5 rounded-xl px-2.5 py-2"
                >
                  <Avatar collaborator={collaborator} size={30} />
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-[13px] font-semibold text-white">
                      {collaboratorName(collaborator)}
                    </span>
                    {collaborator.email && collaborator.email !== collaboratorName(collaborator) && (
                      <span className="truncate text-[11.5px] text-white/55">{collaborator.email}</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>,
          document.body,
        )}
    </>
  );
}
