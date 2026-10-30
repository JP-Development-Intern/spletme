import { useRef } from "react";
import { Music, Disc3 } from "lucide-react";
import type { MusicMode } from "@/types/music.types";

interface MusicModeSwitchProps {
  mode: MusicMode;
  onChange: (mode: MusicMode) => void;
  songsCount?: number;
  albumsCount?: number;
}

const MODES = [
  { value: "songs", label: "Canciones", Icon: Music },
  { value: "albums", label: "Álbumes", Icon: Disc3 },
] as const;

/**
 * Conmutador de agrupación.
 *
 * No navega a otra página: reagrupa el mismo catálogo. Por eso lleva el recuento
 * a cada lado —dice cuánto hay en la otra forma de mirarlo— y por eso la
 * búsqueda y los filtros sobreviven al cambio.
 *
 * El carril es una pista oscura sobre el vidrio y la pastilla va en crema, el
 * tono que el panel reserva para lo elegido.
 *
 * La pastilla se desliza en lugar de saltar: el movimiento es lo que cuenta que
 * sigues en el mismo sitio mirándolo de otra forma, y no que has cambiado de
 * página. Las dos mitades miden lo mismo (grid de dos columnas), así que el
 * desplazamiento es un `translateX(100%)` fijo: no hay que medir el DOM y la
 * pastilla no se descoloca cuando entran los recuentos, que llegan más tarde.
 */
export function MusicModeSwitch({
  mode,
  onChange,
  songsCount,
  albumsCount,
}: MusicModeSwitchProps) {
  const counts: Record<MusicMode, number | undefined> = {
    songs: songsCount,
    albums: albumsCount,
  };
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);
  const activeIndex = MODES.findIndex((option) => option.value === mode);

  /** Patrón de tablist: las flechas mueven la selección, no solo el foco. */
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const step = event.key === "ArrowRight" ? 1 : MODES.length - 1;
    const next = (activeIndex + step) % MODES.length;
    onChange(MODES[next].value);
    buttons.current[next]?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label="Agrupación del catálogo"
      onKeyDown={handleKeyDown}
      className="relative grid w-full grid-cols-2 gap-1 rounded-full bg-black/[0.22] p-1 sm:w-auto sm:flex-shrink-0"
    >
      {/* La pastilla viaja por debajo de las etiquetas: mismo ancho que media
          columna, un salto de su propio ancho para pasar al otro lado. */}
      <span
        aria-hidden="true"
        style={{ transform: `translateX(${activeIndex * 100}%)` }}
        className="pointer-events-none absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full bg-[#F7EDE6]/[0.92] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none"
      />

      {MODES.map((option, index) => {
        const active = mode === option.value;
        const count = counts[option.value];
        return (
          <button
            key={option.value}
            ref={(node) => {
              buttons.current[index] = node;
            }}
            type="button"
            role="tab"
            id={`music-tab-${option.value}`}
            aria-selected={active}
            aria-controls="music-panel"
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(option.value)}
            className="relative z-10 flex min-h-[44px] items-center justify-center gap-2 rounded-full px-3.5 outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70 sm:min-h-[36px]"
          >
            <option.Icon
              className={`h-[15px] w-[15px] transition-colors duration-300 ${
                active ? "text-[#FF5C00]" : "text-white/60"
              }`}
            />
            <span
              className={`whitespace-nowrap text-[12.5px] transition-colors duration-300 ${
                active ? "font-semibold text-[#1C1D22]" : "font-medium text-white/80"
              }`}
            >
              {option.label}
            </span>
            {/* El hueco del recuento se reserva desde el primer pintado: los
                totales llegan de otra petición y sin esto la fila daba un salto. */}
            <span
              className={`min-w-[26px] rounded-full px-[7px] py-[2px] text-center text-[10.5px] font-semibold transition-colors duration-300 ${
                count === undefined
                  ? "invisible"
                  : active
                    ? "bg-[#FF5C00]/[0.16] text-[#C24400]"
                    : "bg-white/[0.08] text-white/70"
              }`}
            >
              {count?.toLocaleString() ?? "0"}
            </span>
          </button>
        );
      })}
    </div>
  );
}
