import { Loader, Check, TriangleAlert, Globe, RotateCcw } from "lucide-react";
import type { SelectOption } from "@/types/select.types";
import { useModalGlass } from "@/components/ui/ModalShell";

/**
 * Las piezas viven siempre dentro de un `ModalShell` y toman su tono de él:
 * claro por defecto, vidrio cuando el modal lo pide.
 */
const TONES = {
  light: {
    label: "text-[#71757E]",
    segment: "rounded-2xl bg-[#F4F5F7] p-0.5",
    segmentOn: "rounded-[13px] bg-white font-semibold text-[#1C1D22] shadow-[0_2px_5px_rgba(16,17,20,0.08)]",
    segmentOff: "rounded-[13px] font-medium text-[#71757E]",
    box: "border border-[#E8E8EC]",
    chip: "bg-[#F4F5F7]",
    chipText: "text-[#1C1D22]",
    chipX: "text-[#A6AAB2] hover:text-[#1C1D22]",
    select: "bg-transparent text-[#71757E]",
    option: "",
    note: "bg-[#F4F5F7] text-[#71757E]",
    ink: "text-[#1C1D22]",
    accent: "text-[#FF5C00]",
    track: "bg-[#F4F5F7]",
    muted: "text-[#71757E]",
    ok: { color: "#2FB37E", background: "#E4F5EC" },
    bad: { color: "#E5484D", background: "#FDECEC" },
    okPanel: "bg-[#E4F5EC]",
    okText: "text-[#1F7D58]",
    errorItem: "bg-[#FDECEC]",
    errorText: "text-[#E5484D]",
  },
  glass: {
    label: "text-white/65",
    segment: "rounded-full bg-black/[0.22] p-1",
    segmentOn: "rounded-full bg-[#F7EDE6]/[0.92] font-semibold text-[#1C1D22]",
    segmentOff: "rounded-full font-medium text-white/80 hover:text-white",
    box: "border border-white/[0.12] bg-white/[0.04]",
    chip: "bg-white/[0.10]",
    chipText: "text-white",
    chipX: "text-white/50 hover:text-white",
    select: "bg-transparent text-white/70",
    option: "bg-[#2B1E17] text-white",
    note: "bg-white/[0.06] text-white/65",
    ink: "text-white",
    accent: "text-[#FF8A3D]",
    track: "bg-white/[0.10]",
    muted: "text-white/65",
    ok: { color: "#45D39A", background: "rgba(69, 211, 154, 0.12)" },
    bad: { color: "#FF8F92", background: "rgba(229, 72, 77, 0.14)" },
    okPanel: "bg-[#45D39A]/[0.12]",
    okText: "text-[#45D39A]",
    errorItem: "bg-[#E5484D]/[0.14]",
    errorText: "text-[#FF8F92]",
  },
};

const useTone = () => (useModalGlass() ? TONES.glass : TONES.light);

/**
 * Piezas comunes de los dos modales de split por álbum —el del owner y el de un
 * colaborador—. Ambos hacen lo mismo con distinto sujeto: un porcentaje, dos
 * filtros de alcance y una pasada pista a pista con su resultado. Vivían dentro
 * del modal del owner; se sacan aquí para que el segundo modal no las copie y
 * los dos no se separen visualmente con el tiempo.
 */

type ScopeType = "all" | "except" | "only";

const SCOPE_LABELS: { value: ScopeType; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "except", label: "Excepto" },
  { value: "only", label: "Solo" },
];

/** Avance de la pasada pista a pista, con el detalle de lo que falló. */
interface ProgressShape {
  total: number;
  completed: number;
  failed: number;
  current: string;
  errors: Array<{ songTitle: string; error: string }>;
}

export function FieldLabel({ children }: { children: React.ReactNode }) {
  const t = useTone();
  return (
    <span className={`font-mono text-[9.5px] font-medium tracking-[1.2px] ${t.label}`}>
      {children}
    </span>
  );
}

interface ScopeProps {
  label: string;
  type: ScopeType;
  onTypeChange: (value: ScopeType) => void;
  options: SelectOption[];
  selected: SelectOption[];
  onSelectedChange: (value: SelectOption[]) => void;
  loading: boolean;
  allLabel: string;
  placeholder: string;
}

/** Alcance del split: todos, todos menos unos cuantos, o solo unos cuantos. */
export function Scope({
  label,
  type,
  onTypeChange,
  options,
  selected,
  onSelectedChange,
  loading,
  allLabel,
  placeholder,
}: ScopeProps) {
  const restricted = type !== "all";
  const t = useTone();

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-3">
        <FieldLabel>{label}</FieldLabel>
        <div className={`flex items-center gap-0.5 ${t.segment}`}>
          {SCOPE_LABELS.map((option) => {
            const active = type === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onTypeChange(option.value)}
                aria-pressed={active}
                className={`px-3 py-1.5 text-[11.5px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70 ${
                  active ? t.segmentOn : t.segmentOff
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {restricted ? (
        <div className={`flex flex-col gap-2 rounded-2xl p-3 ${t.box}`}>
          {selected.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selected.map((option) => (
                <span
                  key={option.value}
                  className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1 ${t.chip}`}
                >
                  <span className={`text-[11px] font-medium ${t.chipText}`}>{option.label}</span>
                  <button
                    type="button"
                    onClick={() =>
                      onSelectedChange(selected.filter((item) => item.value !== option.value))
                    }
                    aria-label={`Quitar ${option.label}`}
                    className={`transition-colors ${t.chipX}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          <select
            value=""
            disabled={loading}
            onChange={(e) => {
              const option = options.find((item) => item.value === e.target.value);
              if (option && !selected.some((item) => item.value === option.value)) {
                onSelectedChange([...selected, option]);
              }
            }}
            className={`w-full rounded-xl text-[12px] focus:outline-none ${t.select}`}
          >
            <option value="" className={t.option}>
              {loading ? "Cargando opciones…" : placeholder}
            </option>
            {options
              .filter((option) => !selected.some((item) => item.value === option.value))
              .map((option) => (
                <option key={option.value} value={option.value} className={t.option}>
                  {option.label}
                </option>
              ))}
          </select>
        </div>
      ) : (
        <p className={`flex items-center gap-2.5 rounded-[14px] px-3.5 py-2.5 text-[11.5px] ${t.note}`}>
          <Globe className="h-3.5 w-3.5 flex-shrink-0" />
          {allLabel}
        </p>
      )}
    </div>
  );
}

export function Progress({
  progress,
  percentage,
}: {
  progress: ProgressShape;
  percentage: number;
}) {
  const done = progress.completed + progress.failed;
  const percent = progress.total > 0 ? (done / progress.total) * 100 : 0;
  const t = useTone();

  return (
    <>
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <span className={`text-[12.5px] font-semibold ${t.ink}`}>Creando splits</span>
          <span className={`font-mono text-[12px] font-semibold ${t.accent}`}>
            {done} de {progress.total}
          </span>
        </div>
        <span className={`block h-2 w-full overflow-hidden rounded-full ${t.track}`}>
          <span
            className="block h-full rounded-full bg-[#FF5C00] transition-all duration-300"
            style={{ width: `${Math.max(2, percent)}%` }}
          />
        </span>
        {progress.current && (
          <span className={`flex items-center gap-2 text-[11.5px] ${t.muted}`}>
            <Loader className={`h-3.5 w-3.5 animate-spin ${t.accent}`} />
            Aplicando el {percentage}% a «{progress.current}»…
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <Tile label="CREADOS" value={progress.completed} {...t.ok} />
        <Tile label="CON ERROR" value={progress.failed} {...t.bad} />
      </div>
    </>
  );
}

export function Results({ progress }: { progress: ProgressShape }) {
  const t = useTone();
  return (
    <>
      <div className="grid grid-cols-2 gap-2.5">
        <Tile label="CREADOS" value={progress.completed} {...t.ok} />
        <Tile label="CON ERROR" value={progress.failed} {...t.bad} />
      </div>

      {progress.failed === 0 ? (
        <div className={`flex flex-col items-center gap-2.5 rounded-[18px] p-5 ${t.okPanel}`}>
          <span className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#2FB37E]">
            <Check className="h-6 w-6 text-white" />
          </span>
          <span className={`text-[13px] font-semibold ${t.okText}`}>
            Todas las pistas reparten ya
          </span>
        </div>
      ) : (
        <div className={`flex flex-col gap-2.5 rounded-[18px] p-4 ${t.box}`}>
          <span className={`flex items-center gap-2 text-[12.5px] font-semibold ${t.ink}`}>
            <TriangleAlert className={`h-3.5 w-3.5 flex-shrink-0 ${t.errorText}`} />
            {progress.failed}{" "}
            {progress.failed === 1
              ? "pista no se pudo actualizar"
              : "pistas no se pudieron actualizar"}
          </span>
          <ul className="flex max-h-[220px] flex-col gap-1.5 overflow-y-auto">
            {progress.errors.map((item, index) => (
              <li
                key={`${item.songTitle}-${index}`}
                className={`flex flex-col gap-1 rounded-[13px] px-3 py-2.5 ${t.errorItem}`}
              >
                <span className={`text-[12px] font-semibold ${t.errorText}`}>{item.songTitle}</span>
                <span className={`text-[11px] leading-relaxed ${t.errorText}`}>{item.error}</span>
              </li>
            ))}
          </ul>
          <p className={`flex items-center gap-2 text-[11px] ${t.muted}`}>
            <RotateCcw className="h-3 w-3 flex-shrink-0" />
            Reintentar vuelve a aplicar el porcentaje a todas las pistas del álbum.
          </p>
        </div>
      )}
    </>
  );
}

export function Tile({
  label,
  value,
  color,
  background,
}: {
  label: string;
  value: number;
  color: string;
  background: string;
}) {
  return (
    <div
      className="flex flex-col gap-1.5 rounded-[16px] px-3.5 py-3"
      style={{ backgroundColor: background }}
    >
      <span className="font-mono text-[9.5px] font-medium tracking-[1px]" style={{ color }}>
        {label}
      </span>
      <span className="font-mono text-[22px] font-semibold" style={{ color }}>
        {value}
      </span>
    </div>
  );
}
