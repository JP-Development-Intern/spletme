import { useModalGlass } from "@/components/ui/ModalShell";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

interface SegmentedControlProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: SegmentedOption<T>[];
  /** Describe el grupo para lectores de pantalla. */
  ariaLabel: string;
  /** Reparte las opciones a lo ancho, para formularios. */
  block?: boolean;
}

/**
 * Grupo de opciones excluyentes en el estilo del sistema.
 *
 * Se usa donde la elección es la división principal de lo que hay debajo y
 * conviene ver todas las alternativas a la vez, en vez de esconderlas en un
 * desplegable.
 */
export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  block = false,
}: SegmentedControlProps<T>) {
  // Solo vive dentro de modales: toma el tono del que lo contiene.
  const glass = useModalGlass();
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`flex items-center gap-0.5 rounded-[22px] p-[3px] ${
        glass ? "bg-black/[0.22]" : "bg-[#F4F5F7]"
      } ${block ? "w-full" : ""}`}
    >
      {options.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={`flex items-center justify-center gap-1.5 rounded-[19px] px-3 py-1.5 text-[12.5px] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5C00] ${
              block ? "flex-1" : ""
            } ${
              active
                ? glass
                  ? "bg-[#F7EDE6]/[0.92] font-semibold text-[#1C1D22]"
                  : "bg-white font-semibold text-[#1C1D22] shadow-[0_1px_3px_rgba(28,29,34,0.08)]"
                : glass
                  ? "font-medium text-white/80 hover:text-white"
                  : "font-medium text-[#71757E] hover:text-[#1C1D22]"
            }`}
          >
            {option.icon && (
              <span
                className={
                  active ? "text-[#1C1D22]" : glass ? "text-white/50" : "text-[#A6AAB2]"
                }
              >
                {option.icon}
              </span>
            )}
            {option.label}
            {option.count !== undefined && (
              <span
                className={`rounded-[10px] px-1.5 py-px font-mono text-[10px] font-semibold ${
                  glass
                    ? active
                      ? "bg-[#1C1D22]/10 text-[#1C1D22]"
                      : "bg-white/[0.10] text-white/70"
                    : `text-[#A6AAB2] ${active ? "bg-[#F4F5F7]" : "bg-white"}`
                }`}
              >
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
