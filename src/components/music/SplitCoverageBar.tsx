interface SplitCoverageBarProps {
  withSplit: number;
  total: number;
  /** Fondo de la pista; se aclara cuando la fila ya va sobre un tono. */
  trackClassName?: string;
  className?: string;
  /** Sobre el vidrio oscuro del listado; el detalle de canción sigue en claro. */
  onGlass?: boolean;
}

/**
 * Cuántas pistas de un álbum ya reparten.
 *
 * Es lo que dice si un álbum está terminado. Un álbum a medias no es un error,
 * pero sí trabajo pendiente, y por eso se distingue del que no reparte nada.
 */
export function SplitCoverageBar({
  withSplit,
  total,
  trackClassName,
  className = "",
  onGlass = false,
}: SplitCoverageBarProps) {
  const complete = total > 0 && withSplit === total;
  const none = withSplit === 0;
  const percent = total > 0 ? (withSplit / total) * 100 : 0;

  const label = total === 0 ? "Sin pistas" : complete ? "Completo" : `${withSplit} de ${total} pistas`;
  const color = onGlass
    ? complete
      ? "#45D39A"
      : none
        ? "#FF8F92"
        : "#FF8A3D"
    : complete
      ? "#2FB37E"
      : none
        ? "#E5484D"
        : "#EA580C";
  const track = trackClassName ?? (onGlass ? "bg-white/10" : "bg-[#F4F5F7]");

  return (
    <div className={`flex min-w-0 flex-col gap-1.5 ${className}`}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="truncate text-xs font-semibold" style={{ color }}>
          {label}
        </span>
        {total > 0 && (
          <span className={`flex-shrink-0 font-mono text-[10px] ${onGlass ? "text-white/50" : "text-[#A6AAB2]"}`}>
            {Math.round(percent)}%
          </span>
        )}
      </div>
      <span
        className={`block h-1.5 w-full overflow-hidden rounded-full ${track}`}
        role="img"
        aria-label={
          total === 0
            ? "El álbum no tiene pistas"
            : `${withSplit} de ${total} pistas con split asignado`
        }
      >
        {withSplit > 0 && (
          <span
            className="block h-full rounded-full"
            style={{
              width: `${Math.max(3, percent)}%`,
              backgroundColor: complete ? "#2FB37E" : "#FF5C00",
            }}
          />
        )}
      </span>
    </div>
  );
}
