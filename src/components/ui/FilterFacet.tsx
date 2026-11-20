import { ChevronDown } from "lucide-react";

interface FilterFacetProps {
  /** Nombre del filtro. Se omite cuando el valor ya se explica solo. */
  label?: string;
  value: string;
  highlighted?: boolean;
  icon?: React.ReactNode;
  /** Sobre el vidrio oscuro del panel; sin ella, el aspecto claro de siempre. */
  onGlass?: boolean;
  /** El `<select>` nativo, que se superpone invisible. */
  children: React.ReactElement;
}

/** Los mismos papeles de color en la hoja clara y sobre el vidrio. */
const LIGHT = {
  containerOn: "border-transparent bg-[#FFEADD]",
  containerOff: "border-[#E8E8EC] bg-white hover:border-[#D9DAE0]",
  accent: "text-[#FF5C00]",
  icon: "text-[#71757E]",
  labelOn: "text-[#EA580C]",
  label: "text-[#A6AAB2]",
  value: "text-[#1C1D22]",
  chevron: "text-[#A6AAB2]",
  options: "",
};

const GLASS = {
  containerOn:
    "border-[#FF8A3D]/35 bg-[#FF5C00]/[0.16] focus-within:ring-2 focus-within:ring-[#FF5C00]/70",
  containerOff:
    "glass-control border-white/[0.16] hover:bg-white/[0.12] focus-within:ring-2 focus-within:ring-[#FF5C00]/70",
  accent: "text-[#FF9A5C]",
  icon: "text-white/70",
  labelOn: "text-[#FFB48A]",
  label: "text-white/50",
  value: "text-white",
  chevron: "text-white/50",
  // El menú nativo hereda los colores del `<select>`: en oscuro, para que no
  // se abra una lista blanca sobre la noche.
  options: "[&_option]:bg-[#2B1E17] [&_option]:text-white",
};

/**
 * Selector con la etiqueta y su valor actual a la vista.
 *
 * El `<select>` nativo va encima transparente: conserva el teclado y el menú del
 * sistema, que en móvil es mejor que cualquier desplegable propio.
 */
export function FilterFacet({
  label,
  value,
  highlighted = false,
  icon,
  onGlass = false,
  children,
}: FilterFacetProps) {
  const tone = onGlass ? GLASS : LIGHT;
  return (
    <div
      className={`relative flex items-center gap-2 rounded-full border px-3.5 py-2 transition-colors ${
        highlighted ? tone.containerOn : tone.containerOff
      }`}
    >
      {icon && <span className={highlighted ? tone.accent : tone.icon}>{icon}</span>}
      {label && (
        <span className={`text-[12px] ${highlighted ? tone.labelOn : tone.label}`}>
          {label}
        </span>
      )}
      <span className={`text-[12.5px] font-semibold ${highlighted ? tone.accent : tone.value}`}>
        {value}
      </span>
      <ChevronDown className={`h-3.5 w-3.5 ${highlighted ? tone.accent : tone.chevron}`} />
      <span
        className={`absolute inset-0 [&>select]:h-full [&>select]:w-full [&>select]:cursor-pointer [&>select]:opacity-0 ${
          onGlass ? tone.options : ""
        }`}
      >
        {children}
      </span>
    </div>
  );
}
