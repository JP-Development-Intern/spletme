export interface MetricChannel {
  key: string;
  label: string;
  icon: React.ReactNode;
  value: string;
  /** Lectura de apoyo bajo la cifra. */
  caption?: React.ReactNode;
  /** Color de la cifra. Por defecto, blanco. */
  valueColor?: string;
  /** Destaca el canal teñido de brasa: reservado para lo accionable. */
  highlight?: boolean;
  /** Ancho fijo en escritorio, para las cifras largas. */
  width?: number;
}

interface MetricConsoleProps {
  channels: MetricChannel[];
}

/**
 * Consola de métricas: una sola superficie de vidrio dividida por hairlines, en
 * vez de una fila de tarjetas sueltas. Como mucho un canal va destacado, teñido
 * de brasa, y siempre es el que se puede accionar. Misma anatomía que la consola
 * del catálogo en Música.
 */
export function MetricConsole({ channels }: MetricConsoleProps) {
  return (
    <div className="glass flex flex-col gap-1.5 rounded-[28px] p-1.5 lg:flex-row lg:items-stretch lg:gap-0">
      {channels.map((channel, index) => {
        const previous = channels[index - 1];
        // El hairline separa canales planos; junto al destacado sobra, porque
        // su propio borde ya marca el corte.
        const divider = index > 0 && !channel.highlight && !previous?.highlight;
        return (
          <div
            key={channel.key}
            style={channel.width ? { flexBasis: channel.width } : undefined}
            className={`flex min-w-0 flex-1 flex-col justify-center gap-3 px-[22px] py-[18px] ${
              channel.highlight
                ? "rounded-[22px] border border-[#FF8A3D]/30 bg-[#FF5C00]/[0.14]"
                : ""
            } ${divider ? "border-t border-white/[0.09] lg:border-l lg:border-t-0" : ""} ${
              channel.width ? "lg:flex-grow-0 lg:flex-shrink-0" : ""
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span
                className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                  channel.highlight ? "bg-[#FF5C00]/[0.22]" : "bg-white/[0.12]"
                }`}
              >
                {channel.icon}
              </span>
              <span
                className={`truncate text-[12.5px] font-medium ${
                  channel.highlight ? "text-[#FFB48A]" : "text-white/70"
                }`}
              >
                {channel.label}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <p
                className="truncate font-mono text-[30px] font-light leading-[1.1] tracking-[-0.015em]"
                style={{ color: channel.valueColor ?? "#FFFFFF" }}
              >
                {channel.value}
              </p>

              {channel.caption && (
                <div
                  className={`truncate text-xs ${
                    channel.highlight ? "font-semibold text-[#FF8A3D]" : "text-white/50"
                  }`}
                >
                  {channel.caption}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
