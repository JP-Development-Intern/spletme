import { createContext, useContext, useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

interface ModalShellProps {
  title: string;
  subtitle?: React.ReactNode;
  /** Marca de identidad del distribuidor a la izquierda del título. */
  logo?: React.ReactNode;
  /** Ancho máximo del panel. `xl` es para los modales de dos columnas. */
  width?: "md" | "lg" | "xl";
  /** Impide cerrar mientras hay una operación en curso. */
  locked?: boolean;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /**
   * Panel de vidrio cálido, para los modales que se abren desde páginas ya
   * migradas. Por defecto sigue en claro: el resto de modales no cambia.
   */
  onGlass?: boolean;
}

/**
 * Si el modal abierto va en vidrio. Las piezas del modal (etiquetas, botones,
 * marcas) lo leen de aquí, así que basta con decirlo una vez en el shell.
 */
const ModalGlassContext = createContext(false);

export function useModalGlass(): boolean {
  return useContext(ModalGlassContext);
}

/**
 * Envoltorio común de los modales de distribuidores: fondo, panel, cabecera y
 * pie. El cuerpo es lo único que hace scroll, de modo que el título y las
 * acciones siguen a la vista en pantallas bajas.
 */
export function ModalShell({
  title,
  subtitle,
  logo,
  width = "md",
  locked = false,
  onClose,
  children,
  footer,
  onGlass = false,
}: ModalShellProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  /**
   * Al abrir: el foco entra en el panel y la página de detrás deja de
   * desplazarse. Las dos cosas van SOLO al montar, con la lista de
   * dependencias vacía a propósito.
   *
   * Estaban junto al listener de Escape, en un efecto que depende de `locked`
   * y `onClose`. Como `onClose` suele llegar como función nueva en cada render
   * (`onClose={() => setOpen(false)}`, o un `closeWithReset` sin `useCallback`),
   * ese efecto se repetía en cada tecleo y `focus()` le robaba el foco al campo
   * que se estaba rellenando: había que volver a hacer clic para escribir cada
   * dígito. De paso, al repetirse, `previousOverflow` acababa capturando
   * "hidden" y el scroll del fondo se quedaba bloqueado al cerrar.
   */
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // El Escape sí necesita los valores frescos, y volver a registrar el listener
  // no tiene efectos visibles.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !locked) onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [locked, onClose]);

  return (
    <ModalGlassContext.Provider value={onGlass}>
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className={`absolute inset-0 backdrop-blur-sm ${onGlass ? "bg-[#0B0604]/[0.62]" : "bg-[#101114]/65"}`}
        onClick={() => !locked && onClose()}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-[28px] focus:outline-none ${
          onGlass ? "glass-menu" : "bg-white shadow-[0_24px_60px_-16px_rgba(16,17,20,0.35)]"
        } ${
          width === "xl" ? "max-w-[880px]" : width === "lg" ? "max-w-[560px]" : "max-w-[520px]"
        }`}
      >
        <div className="flex flex-shrink-0 items-center justify-between gap-4 px-6 pb-[18px] pt-[22px]">
          <div className="flex min-w-0 items-center gap-3">
            {logo}
            <div className="flex min-w-0 flex-col gap-0.5">
              <h2
                id={titleId}
                className={`font-display text-[19px] ${
                  onGlass ? "font-medium tracking-[-0.005em] text-white" : "font-semibold text-[#1C1D22]"
                }`}
              >
                {title}
              </h2>
              {subtitle && (
                <p className={`text-[12px] ${onGlass ? "text-white/65" : "text-[#71757E]"}`}>{subtitle}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={locked}
            aria-label="Cerrar"
            className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition-colors disabled:opacity-40 ${
              onGlass
                ? "bg-white/[0.08] text-white/70 enabled:hover:bg-white/[0.14] enabled:hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70"
                : "bg-[#F4F5F7] text-[#71757E] enabled:hover:bg-[#E8E8EC] enabled:hover:text-[#1C1D22]"
            }`}
          >
            <X className="h-[15px] w-[15px]" />
          </button>
        </div>

        <div className={`h-px flex-shrink-0 ${onGlass ? "bg-white/[0.09]" : "bg-[#E8E8EC]"}`} />

        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">
          {children}
        </div>

        {footer && (
          <>
            <div className={`h-px flex-shrink-0 ${onGlass ? "bg-white/[0.09]" : "bg-[#E8E8EC]"}`} />
            <div className="flex flex-shrink-0 flex-wrap items-center gap-3 px-6 pb-5 pt-4">
              {footer}
            </div>
          </>
        )}
      </div>
    </div>
    </ModalGlassContext.Provider>
  );
}

/** Etiqueta de campo, en la tipografía de datos del sistema. */
export function FieldLabel({
  children,
  required = false,
  invalid = false,
}: {
  children: React.ReactNode;
  required?: boolean;
  invalid?: boolean;
}) {
  const glass = useModalGlass();
  return (
    <span
      className={`font-mono text-[9.5px] font-medium tracking-[1.2px] ${
        invalid ? (glass ? "text-[#FF8F92]" : "text-[#E5484D]") : glass ? "text-white/65" : "text-[#71757E]"
      }`}
    >
      {children}
      {required && (
        <span className={invalid ? "" : glass ? "text-[#FF8A3D]" : "text-[#FF5C00]"}> *</span>
      )}
    </span>
  );
}

/** Botón primario del pie de los modales. */
export function PrimaryButton({
  children,
  disabled,
  onClick,
  type = "button",
  icon,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
  icon?: React.ReactNode;
}) {
  const glass = useModalGlass();
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={
        glass
          ? "flex min-h-[44px] items-center gap-2 rounded-full bg-[#FF5C00] px-[18px] py-[11px] text-[12.5px] font-semibold text-white shadow-[0_8px_20px_-6px_rgba(255,92,0,0.35)] transition-colors enabled:hover:bg-[#EA580C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:cursor-not-allowed disabled:bg-white/[0.08] disabled:text-white/40 disabled:shadow-none"
          : "flex items-center gap-2 rounded-[22px] bg-[#FF5C00] px-[18px] py-2.5 text-[12.5px] font-semibold text-white shadow-[0_6px_16px_-4px_rgba(255,92,0,0.4)] transition-colors enabled:hover:bg-[#EA580C] disabled:cursor-not-allowed disabled:bg-[#F4F5F7] disabled:text-[#A6AAB2] disabled:shadow-none"
      }
    >
      {icon}
      {children}
    </button>
  );
}

/** Botón secundario del pie de los modales. */
export function SecondaryButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const glass = useModalGlass();
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={
        glass
          ? "min-h-[44px] rounded-full border border-white/[0.16] bg-white/[0.07] px-[18px] py-[11px] text-[12.5px] font-semibold text-white/80 transition-colors enabled:hover:bg-white/[0.12] enabled:hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70 disabled:opacity-50"
          : "rounded-[22px] border border-[#E8E8EC] bg-white px-[18px] py-2.5 text-[12.5px] font-semibold text-[#71757E] transition-colors enabled:hover:bg-[#F4F5F7] enabled:hover:text-[#1C1D22] disabled:opacity-50"
      }
    >
      {children}
    </button>
  );
}

/** Botón de acción destructiva: borrar algo que no se puede recuperar. */
export function DangerButton({
  children,
  onClick,
  disabled,
  icon,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  icon?: React.ReactNode;
}) {
  const glass = useModalGlass();
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={
        glass
          ? "flex min-h-[44px] items-center gap-2 rounded-full bg-[#E5484D] px-[18px] py-[11px] text-[12.5px] font-semibold text-white shadow-[0_8px_20px_-6px_rgba(229,72,77,0.4)] transition-colors enabled:hover:bg-[#CF3F44] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:cursor-not-allowed disabled:bg-white/[0.08] disabled:text-white/40 disabled:shadow-none"
          : "flex items-center gap-2 rounded-[22px] bg-[#E5484D] px-[18px] py-2.5 text-[12.5px] font-semibold text-white transition-colors enabled:hover:bg-[#CF3F44] disabled:cursor-not-allowed disabled:bg-[#F4F5F7] disabled:text-[#A6AAB2]"
      }
    >
      {icon}
      {children}
    </button>
  );
}

/** Marca redonda de la cabecera de un modal: un icono sobre fondo suave. */
export function ModalMark({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "accent" | "danger" | "success";
}) {
  const glass = useModalGlass();
  const tones = glass
    ? {
        neutral: "bg-white/[0.08] text-white/60",
        accent: "bg-[#FF5C00]/[0.16] text-[#FF8A3D]",
        danger: "bg-[#E5484D]/[0.16] text-[#FF8F92]",
        success: "bg-[#45D39A]/[0.14] text-[#45D39A]",
      }
    : {
        neutral: "bg-[#F4F5F7] text-[#A6AAB2]",
        accent: "bg-[#FFEADD] text-[#FF5C00]",
        danger: "bg-[#FDECEC] text-[#E5484D]",
        success: "bg-[#E4F5EC] text-[#2FB37E]",
      };
  return (
    <span
      className={`grid h-[42px] w-[42px] flex-shrink-0 place-items-center rounded-[14px] ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

/** Nota discreta que ocupa el hueco libre del pie, a la izquierda de los botones. */
export function FooterNote({ children }: { children: React.ReactNode }) {
  const glass = useModalGlass();
  return (
    <p className={`flex-1 text-[11px] leading-[1.35] ${glass ? "text-white/50" : "text-[#A6AAB2]"}`}>
      {children}
    </p>
  );
}

/** Marca cuadrada con el logo del distribuidor, o su inicial si no lo tiene. */
export function DistributorMark({
  name,
  logo,
  size = 40,
  color = "#FF5C00",
}: {
  name: string;
  logo?: string | null;
  size?: number;
  color?: string;
}) {
  return (
    <span
      style={{
        width: size,
        height: size,
        backgroundColor: logo ? "#FFFFFF" : color,
        borderRadius: size / 2.9,
      }}
      className="flex flex-shrink-0 items-center justify-center overflow-hidden"
    >
      {logo ? (
        <img src={logo} alt="" className="h-full w-full object-contain" />
      ) : (
        <span
          className="font-display font-semibold text-white"
          style={{ fontSize: size * 0.42 }}
        >
          {name.slice(0, 1).toUpperCase() || "?"}
        </span>
      )}
    </span>
  );
}
