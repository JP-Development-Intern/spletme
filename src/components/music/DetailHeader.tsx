import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { CopyButton } from "@/components/ui/CopyButton";

interface DetailHeaderProps {
  /** Portada; si no hay, se dibuja el icono de reserva. */
  cover?: string | null;
  fallbackIcon: React.ReactNode;
  title: string;
  /** Etiqueta del código: ISRC en canciones, UPC en álbumes. */
  codeLabel?: string;
  code?: string | null;
  /** Línea de contexto: artista, álbum, fecha… */
  meta?: React.ReactNode;
  /** Cifra destacada a la derecha, con su rótulo. */
  highlightLabel?: string;
  highlightValue?: string;
  highlightColor?: string;
  actions?: React.ReactNode;
  /** Destino de reserva cuando no hay página anterior dentro de la app. */
  backTo?: string;
}

/**
 * Cabecera de identidad, común a canción y álbum.
 *
 * Las dos páginas describen el mismo tipo de objeto —una obra con dinero
 * repartido—, así que comparten anatomía: quién es, cómo se identifica y qué
 * puedes hacer con ella.
 */
export function DetailHeader({
  cover,
  fallbackIcon,
  title,
  codeLabel,
  code,
  meta,
  highlightLabel,
  highlightValue,
  highlightColor = "#FFFFFF",
  actions,
  backTo = "/panel/music",
}: DetailHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();

  /**
   * "Atrás" debe deshacer el último paso, no saltar a un sitio fijo: se puede
   * llegar aquí desde el listado, desde una canción o desde una búsqueda.
   * React Router marca con key "default" la primera entrada del historial, así
   * que sólo ahí (enlace directo o recarga) hace falta el destino de reserva.
   */
  const goBack = () => {
    if (location.key !== "default") navigate(-1);
    else navigate(backTo);
  };

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <button
          onClick={goBack}
          aria-label="Volver"
          className="glass-control flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/[0.12] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <span className="flex h-[72px] w-[72px] flex-shrink-0 items-center justify-center overflow-hidden rounded-[20px] bg-white/[0.08] shadow-[0_16px_32px_-12px_rgba(10,4,0,0.6)] ring-1 ring-white/[0.14] sm:h-[88px] sm:w-[88px] sm:rounded-[22px]">
          {cover ? (
            <img src={cover} alt="" className="h-full w-full object-cover" />
          ) : (
            fallbackIcon
          )}
        </span>

        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex min-w-0 flex-wrap items-center gap-2.5">
            {/* Sin recortes manuales: el título se trunca por CSS y queda entero en el title */}
            <h1
              title={title}
              className="min-w-0 truncate font-display text-[26px] font-light leading-[1.15] tracking-[-0.015em] text-white sm:text-[34px]"
            >
              {title}
            </h1>
            {code && (
              <span className="flex flex-shrink-0 items-center gap-1.5 rounded-full bg-white/[0.08] px-2.5 py-[5px]">
                {codeLabel && (
                  <span className="font-mono text-[9.5px] font-medium tracking-[1px] text-white/50">
                    {codeLabel}
                  </span>
                )}
                <span className="font-mono text-[11px] font-semibold text-white">{code}</span>
                <CopyButton
                  value={code}
                  title={`Copiar ${codeLabel ?? "código"}`}
                  className="!text-white/45 hover:!bg-white/10 hover:!text-[#FFB067]"
                />
              </span>
            )}
          </div>
          {meta && (
            <div className="flex min-w-0 flex-wrap items-center gap-2 text-[13px] text-white/65">
              {meta}
            </div>
          )}
        </div>
      </div>

      {(highlightValue || actions) && (
        <div className="flex flex-shrink-0 flex-wrap items-center gap-3">
          {highlightValue && (
            <div className="flex flex-col items-end">
              {highlightLabel && (
                <span className="font-mono text-[9.5px] font-medium tracking-[1.2px] text-white/50">
                  {highlightLabel}
                </span>
              )}
              <span
                className="font-mono text-[26px] font-light leading-[1.1] tracking-[-0.015em]"
                style={{ color: highlightColor }}
              >
                {highlightValue}
              </span>
            </div>
          )}
          {actions}
        </div>
      )}
    </div>
  );
}
