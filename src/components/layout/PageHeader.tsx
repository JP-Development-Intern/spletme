import { createContext, useContext } from "react";
import { createPortal } from "react-dom";

/** Nodo de la barra superior donde cada página coloca su encabezado. */
const PageHeaderSlotContext = createContext<HTMLElement | null>(null);

export const PageHeaderSlotProvider = PageHeaderSlotContext.Provider;

/**
 * Encabezado de la página, en la misma fila que el buscador y el menú de
 * usuario. Las páginas que no lo usan dejan ese hueco vacío.
 */
export function PageHeader({ children }: { children: React.ReactNode }) {
  const slot = useContext(PageHeaderSlotContext);
  return slot ? createPortal(children, slot) : null;
}
