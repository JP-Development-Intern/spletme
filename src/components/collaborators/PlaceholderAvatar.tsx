interface PlaceholderAvatarProps {
  name: string;
  /** Tamaño en píxeles del lado. Por defecto, el de una fila de lista. */
  size?: number;
  /** Sobre el vidrio oscuro del panel; los modales siguen en claro. */
  onGlass?: boolean;
}

const initialsOf = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0] ?? "")
    .join("")
    .toUpperCase() || "?";

/**
 * FUNCIONALIDAD TEMPORAL — perfiles sin cuenta.
 *
 * El contorno discontinuo es lo que dice que esa persona todavía no existe en
 * Splitme. Va en la forma y no solo en el color: se distingue de un colaborador
 * de verdad aunque el chip de al lado no se lea, y sobrevive a quien no
 * distingue bien los tonos.
 */
export function PlaceholderAvatar({ name, size = 38, onGlass = false }: PlaceholderAvatarProps) {
  return (
    <span
      style={{ height: size, width: size, fontSize: size * 0.3 }}
      className={`grid flex-shrink-0 place-items-center rounded-full border-[1.5px] border-dashed font-semibold ${
        onGlass
          ? "border-white/40 bg-white/[0.06] text-white/70"
          : "border-[#A6AAB2] bg-[#F4F5F7] text-[#71757E]"
      }`}
    >
      {initialsOf(name)}
    </span>
  );
}

/** El chip que acompaña al avatar allí donde hace falta nombrar el estado. */
export function PlaceholderChip({ onGlass = false }: { onGlass?: boolean }) {
  return (
    <span
      className={`inline-flex flex-shrink-0 items-center rounded-[11px] border border-dashed px-[7px] py-[2px] text-[10px] font-semibold ${
        onGlass ? "border-white/30 text-white/65" : "border-[#C9CCD2] text-[#71757E]"
      }`}
    >
      Sin cuenta
    </span>
  );
}
