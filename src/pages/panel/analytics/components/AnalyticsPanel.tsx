import { CircleX, RotateCw, SearchX } from "lucide-react";

interface AnalyticsPanelProps {
  title: string;
  /** Qué mide el panel, en una línea. */
  subtitle?: string;
  /** Controles propios del panel (granularidad, métrica): van junto al título. */
  actions?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

/** Superficie de vidrio de cada bloque de Analíticas, con su título. */
export function AnalyticsPanel({ title, subtitle, actions, className = "", children }: AnalyticsPanelProps) {
  return (
    <section className={`glass flex min-w-0 flex-col gap-[18px] rounded-[28px] px-6 py-5 sm:px-7 sm:py-6 ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h2 className="font-display text-[19px] font-medium tracking-[-0.005em] text-white">{title}</h2>
          {subtitle && <p className="text-[12.5px] text-white/65">{subtitle}</p>}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

interface PanelStateProps {
  loading: boolean;
  error: boolean;
  empty: boolean;
  onRetry: () => void;
  /** Hay filtros activos: el vacío puede deberse a ellos. */
  filtered?: boolean;
  onClearFilters?: () => void;
  /** Alto que reserva el estado, para que el panel no salte al llegar los datos. */
  height?: string;
  /** Forma del esqueleto: líneas de lista o guías de gráfico. */
  skeleton?: "rows" | "chart";
  children: React.ReactNode;
}

/**
 * Cargando, error, vacío o el contenido. Un error no se disfraza de «sin
 * datos»: son dos cosas distintas y solo una se arregla reintentando.
 */
export function PanelState({
  loading,
  error,
  empty,
  onRetry,
  filtered = false,
  onClearFilters,
  height = "h-[220px]",
  skeleton = "rows",
  children,
}: PanelStateProps) {
  if (loading && empty) {
    return skeleton === "chart" ? (
      <div className={`flex flex-col justify-between py-2 ${height}`} aria-busy="true" aria-label="Cargando">
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i} className="h-px w-full animate-pulse bg-white/[0.12]" />
        ))}
      </div>
    ) : (
      <div className={`flex flex-col gap-4 py-1 ${height}`} aria-busy="true" aria-label="Cargando">
        {["w-[85%]", "w-[70%]", "w-[60%]", "w-[48%]", "w-[36%]"].map((width) => (
          <span key={width} className={`h-3 animate-pulse rounded-full bg-white/[0.08] ${width}`} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center gap-3 text-center ${height}`} role="alert">
        <CircleX className="h-6 w-6 text-[#FF8F92]" />
        <p className="text-[13px] text-white/70">No se pudo cargar este bloque.</p>
        <button
          onClick={onRetry}
          className="glass-control flex min-h-[40px] items-center gap-1.5 rounded-full px-4 text-[12.5px] font-semibold text-white transition-colors hover:bg-white/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70"
        >
          <RotateCw className="h-3.5 w-3.5" />
          Reintentar
        </button>
      </div>
    );
  }

  if (empty) {
    return (
      <div className={`flex flex-col items-center justify-center gap-3 text-center ${height}`}>
        <SearchX className="h-6 w-6 text-white/50" />
        <p className="max-w-[300px] text-[13px] text-white/65">
          {filtered ? "Nada coincide con estos filtros." : "Aún no hay reportes con datos para mostrar aquí."}
        </p>
        {filtered && onClearFilters && (
          <button
            onClick={onClearFilters}
            className="glass-control min-h-[40px] rounded-full px-4 text-[12.5px] font-semibold text-white transition-colors hover:bg-white/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70"
          >
            Limpiar filtros
          </button>
        )}
      </div>
    );
  }

  // Al refiltrar con datos ya en pantalla, se atenúan en vez de vaciarse.
  return <div className={`transition-opacity ${loading ? "opacity-50" : ""}`}>{children}</div>;
}

/** Segmentado del panel: la opción elegida en crema, como en el resto del vidrio. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="flex items-center gap-0.5 rounded-full bg-black/[0.22] p-1">
      {options.map((option) => (
        <button
          key={option.value}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={`rounded-full px-3.5 py-[7px] text-[12.5px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70 ${
            value === option.value
              ? "bg-[#F7EDE6]/[0.92] font-semibold text-[#1C1D22]"
              : "font-medium text-white/80 hover:text-white"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/** Código de país en pastilla, para que el nombre no tenga que cargar con él. */
export function CountryCode({ code }: { code: string | null }) {
  if (!code) return null;
  return (
    <span className="flex-shrink-0 rounded-md bg-white/[0.08] px-1.5 py-0.5 font-mono text-[10.5px] font-semibold text-white/70">
      {code}
    </span>
  );
}
