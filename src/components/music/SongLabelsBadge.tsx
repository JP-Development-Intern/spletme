import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Tag } from "lucide-react";

interface SongLabelsBadgeProps {
  /** Nombres de los sellos; pueden venir vacíos si el listado solo trae el conteo. */
  labels: string[];
  /** Conteo del listado, para cuando no llegan los nombres. */
  count?: number;
  /** Subtítulo del panel: por defecto habla de "canción". */
  noun?: string;
}

const PANEL_WIDTH = 260;
const GAP = 8;

/**
 * Icono de sello de una canción o pista, desplegable con los sellos a los que
 * pertenece. No pinta nada si no está en ninguno.
 *
 * Mismo mecanismo que `SongAlbumsBadge`: el panel va en un portal con posición
 * fija porque la tabla vive dentro de un `overflow-hidden`, y el clic se detiene
 * porque la fila entera navega al detalle.
 */
export function SongLabelsBadge({ labels, count = 0, noun = "canción" }: SongLabelsBadgeProps) {
  const total = Math.max(labels.length, count);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const place = useCallback(() => {
    const trigger = buttonRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const panelHeight = panelRef.current?.offsetHeight ?? 160;
    const abajoCabe = rect.bottom + GAP + panelHeight <= window.innerHeight;

    setPosition({
      top: abajoCabe ? rect.bottom + GAP : Math.max(GAP, rect.top - GAP - panelHeight),
      left: Math.min(Math.max(GAP, rect.left), window.innerWidth - PANEL_WIDTH - GAP),
    });
  }, []);

  useLayoutEffect(() => {
    if (open) place();
  }, [open, place]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open, place]);

  if (total === 0) return null;

  return (
    <span onClick={(e) => e.stopPropagation()}>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={`Ver los ${total} sellos de esta ${noun}`}
        title={total === 1 ? `Esta ${noun} está en 1 sello` : `Esta ${noun} está en ${total} sellos`}
        onClick={() => setOpen((value) => !value)}
        className={`flex flex-shrink-0 items-center gap-1 rounded-xl px-[7px] py-[3px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00] ${
          open ? "bg-[#FFEADD]" : "bg-[#F4F5F7] hover:bg-[#E8E8EC]"
        }`}
      >
        <Tag className={`h-3 w-3 ${open ? "text-[#EA580C]" : "text-[#71757E]"}`} />
        <span className="font-mono text-[10.5px] font-semibold text-[#1C1D22]">{total}</span>
      </button>

      {open &&
        createPortal(
          <div
            ref={panelRef}
            role="dialog"
            aria-label={`Sellos de esta ${noun}`}
            style={{
              position: "fixed",
              top: position?.top ?? -9999,
              left: position?.left ?? -9999,
              width: PANEL_WIDTH,
              visibility: position ? "visible" : "hidden",
            }}
            className="z-[9998] overflow-hidden rounded-[20px] border border-[#E8E8EC] bg-white shadow-[0_12px_32px_-6px_rgba(28,29,34,0.14)]"
          >
            <p className="px-4 py-3.5 text-[13.5px] font-semibold text-[#1C1D22]">
              {total === 1 ? "Está en 1 sello" : `Está en ${total} sellos`}
            </p>
            <div className="h-px bg-[#E8E8EC]" />
            {labels.length > 0 ? (
              <ul className="flex max-h-[220px] flex-col gap-1 overflow-y-auto p-2">
                {labels.map((label) => (
                  <li
                    key={label}
                    className="flex items-center gap-2 rounded-[12px] px-2.5 py-2 hover:bg-[#F4F5F7]"
                  >
                    <Tag className="h-3 w-3 flex-shrink-0 text-[#FF5C00]" />
                    <span className="truncate text-[12.5px] text-[#1C1D22]" title={label}>
                      {label}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-4 py-3 text-[11.5px] text-[#71757E]">
                No se pudo obtener el nombre de los sellos.
              </p>
            )}
          </div>,
          document.body,
        )}
    </span>
  );
}
