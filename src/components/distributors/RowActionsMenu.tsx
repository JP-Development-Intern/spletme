import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Ellipsis } from "lucide-react";

export interface MenuAction {
  key: string;
  label: string;
  icon: React.ReactNode;
  onSelect: () => void;
  /** Se separa del resto y se pinta en rojo. */
  danger?: boolean;
  disabled?: boolean;
}

interface RowActionsMenuProps {
  actions: MenuAction[];
  label: string;
  /** Sobre el vidrio oscuro del panel. Sin ella, el aspecto claro de las páginas que aún no migran. */
  onGlass?: boolean;
}

const MENU_WIDTH = 236;
const VIEWPORT_MARGIN = 12;

/**
 * Menú de las acciones que no caben en la fila.
 *
 * Se dibuja en un portal porque la tabla recorta su contenido para conservar las
 * esquinas redondeadas, y un desplegable posicionado dentro quedaría cortado.
 */
export function RowActionsMenu({ actions, label, onGlass = false }: RowActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const left = Math.min(
      Math.max(VIEWPORT_MARGIN, rect.right - MENU_WIDTH),
      window.innerWidth - MENU_WIDTH - VIEWPORT_MARGIN,
    );
    setPosition({ top: rect.bottom + 6, left });
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const close = () => setOpen(false);
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (menuRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", close);
    // El menú va posicionado en coordenadas de viewport: si la página se
    // desplaza, dejaría de apuntar a su fila.
    window.addEventListener("scroll", close, true);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        title={label}
        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5C00] ${
          onGlass
            ? open
              ? "border-transparent bg-[#F7EDE6]/[0.92] text-[#1C1D22]"
              : "border-transparent bg-white/[0.06] text-white/70 hover:bg-white/[0.12] hover:text-white"
            : open
              ? "border-[#1C1D22] bg-[#1C1D22] text-white"
              : "border-[#E8E8EC] bg-white text-[#71757E] hover:text-[#1C1D22]"
        }`}
      >
        <Ellipsis className="h-4 w-4" />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            onClick={(e) => e.stopPropagation()}
            style={{ top: position.top, left: position.left, width: MENU_WIDTH }}
            className={`fixed z-50 flex flex-col gap-0.5 rounded-[20px] p-2 ${
              onGlass
                ? "glass-menu"
                : "border border-[#E8E8EC] bg-white shadow-[0_14px_36px_-8px_rgba(16,17,20,0.16)]"
            }`}
          >
            {actions.map((action, index) => {
              const previous = actions[index - 1];
              return (
                <div key={action.key} className="contents">
                  {action.danger && previous && !previous.danger && (
                    <span className={`my-1 h-px ${onGlass ? "bg-white/[0.09]" : "bg-[#E8E8EC]"}`} />
                  )}
                  <button
                    role="menuitem"
                    disabled={action.disabled}
                    onClick={() => {
                      setOpen(false);
                      action.onSelect();
                    }}
                    className={`flex items-center gap-2.5 rounded-[13px] px-3 py-2.5 text-left text-[12.5px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
                      onGlass
                        ? action.danger
                          ? "text-[#FF8F92] enabled:hover:bg-[#E5484D]/[0.14]"
                          : "text-white enabled:hover:bg-white/[0.08]"
                        : action.danger
                          ? "text-[#E5484D] enabled:hover:bg-[#FDECEC]"
                          : "text-[#1C1D22] enabled:hover:bg-[#F4F5F7]"
                    }`}
                  >
                    <span
                      className={`flex-shrink-0 ${
                        onGlass
                          ? action.danger
                            ? "text-[#FF8F92]"
                            : "text-white/65"
                          : action.danger
                            ? "text-[#E5484D]"
                            : "text-[#71757E]"
                      }`}
                    >
                      {action.icon}
                    </span>
                    {action.label}
                  </button>
                </div>
              );
            })}
          </div>,
          document.body,
        )}
    </>
  );
}
