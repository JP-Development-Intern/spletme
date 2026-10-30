import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Disc3, ChevronDown } from "lucide-react";
import useSongAlbums from "@/hooks/useSongAlbums";
import { SongAlbumsBreakdown } from "./SongAlbumsBreakdown";

interface SongAlbumsBadgeProps {
  songId: string;
  /** Cuántos álbumes identificados trae el listado; evita pedir nada para pintarlo. */
  count: number;
}

const PANEL_WIDTH = 340;
const GAP = 8;

/**
 * Contador de álbumes de una fila de la tabla, desplegable.
 *
 * Enseña el mismo desglose que la cabecera del detalle —qué álbumes y cuánto
 * aporta cada uno— sin salir del listado.
 *
 * Dos decisiones que no se ven:
 *
 *   - Los álbumes se piden al abrir, no al pintar la fila. Con cien canciones en
 *     pantalla, cargarlos por adelantado son cien consultas para un dato que casi
 *     nadie despliega.
 *   - El panel va en un portal con posición fija. La tabla vive dentro de un
 *     `overflow-hidden`, así que un panel absoluto quedaría recortado justo en
 *     las últimas filas, que es donde más se nota.
 */
export function SongAlbumsBadge({ songId, count }: SongAlbumsBadgeProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Sin `songId` el hook no pide nada: así la carga ocurre en el primer clic.
  const { albums, loading } = useSongAlbums(open ? songId : undefined);

  const place = useCallback(() => {
    const trigger = buttonRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const panelHeight = panelRef.current?.offsetHeight ?? 260;
    const abajoCabe = rect.bottom + GAP + panelHeight <= window.innerHeight;

    setPosition({
      top: abajoCabe ? rect.bottom + GAP : Math.max(GAP, rect.top - GAP - panelHeight),
      left: Math.min(Math.max(GAP, rect.left), window.innerWidth - PANEL_WIDTH - GAP),
    });
  }, []);

  useLayoutEffect(() => {
    if (open) place();
  }, [open, albums.length, place]);

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
    // El panel sigue a su fila si la página se mueve, en vez de quedarse flotando.
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open, place]);

  return (
    // La fila entera navega al detalle: aquí el clic hace otra cosa y se queda.
    <span onClick={(e) => e.stopPropagation()}>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        title={`Esta canción salió en ${count} álbumes`}
        onClick={() => setOpen((value) => !value)}
        className={`flex flex-shrink-0 items-center gap-1 rounded-full px-[7px] py-[3px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70 ${
          open ? "bg-[#F7EDE6]/[0.92]" : "bg-white/[0.08] hover:bg-white/[0.14]"
        }`}
      >
        <Disc3 className={`h-2.5 w-2.5 ${open ? "text-[#1C1D22]" : "text-white/70"}`} />
        <span className={`text-[10.5px] font-semibold ${open ? "text-[#1C1D22]" : "text-white/70"}`}>
          En {count} álbumes
        </span>
        <ChevronDown
          className={`h-2.5 w-2.5 transition-transform ${
            open ? "rotate-180 text-[#1C1D22]" : "text-white/70"
          }`}
        />
      </button>

      {open &&
        createPortal(
          <div
            ref={panelRef}
            role="dialog"
            aria-label="Álbumes de esta canción"
            style={{
              position: "fixed",
              top: position?.top ?? -9999,
              left: position?.left ?? -9999,
              width: PANEL_WIDTH,
              visibility: position ? "visible" : "hidden",
            }}
            className="glass-menu z-[9998] overflow-hidden rounded-[20px]"
          >
            <div className="flex flex-col gap-[3px] px-4 py-3.5">
              <p className="text-[13.5px] font-semibold text-white">
                Esta canción está en {count} álbumes
              </p>
              <p className="text-[11px] text-white/50">Ordenados por lo que aportan al total</p>
            </div>
            <div className="h-px bg-white/[0.09]" />
            <SongAlbumsBreakdown albums={albums} loading={loading} onGlass />
          </div>,
          document.body,
        )}
    </span>
  );
}
