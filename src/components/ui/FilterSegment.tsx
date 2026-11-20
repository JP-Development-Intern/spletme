import type { FilterType } from "@/types";

interface FilterSegmentProps {
  value: FilterType;
  onChange: (v: FilterType) => void;
  labels: { all: string; except: string; only: string };
  name: string;
}

/**
 * Selector de 3 opciones (Todos / Excepto / Solo) reutilizable para
 * filtros de países y plataformas en formularios de splits. Vive en los
 * modales de split, que van en vidrio: la opción elegida va en crema.
 */
export function FilterSegment({ value, onChange, labels, name }: FilterSegmentProps) {
  const options: { val: FilterType; label: string }[] = [
    { val: "all", label: labels.all },
    { val: "except", label: labels.except },
    { val: "only", label: labels.only },
  ];

  return (
    <div className="flex gap-0.5 rounded-full bg-black/[0.22] p-1">
      {options.map((opt) => (
        <button
          key={opt.val}
          type="button"
          onClick={() => onChange(opt.val)}
          aria-pressed={value === opt.val}
          className={`flex-1 rounded-full px-3 py-1.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70 ${
            value === opt.val
              ? "bg-[#F7EDE6]/[0.92] font-semibold text-[#1C1D22]"
              : "font-medium text-white/80 hover:text-white"
          }`}
          aria-label={`${name} ${opt.label}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
