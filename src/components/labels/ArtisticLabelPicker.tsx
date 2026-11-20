import { useMemo, useState } from "react";
import { Search, Check } from "lucide-react";
import { formatCurrency, formatStreams } from "@/utils/format.utils";
import { FieldLabel, useModalGlass } from "@/components/ui/ModalShell";
import type { Label } from "@/services/labels";

interface ArtisticLabelPickerProps {
  availableLabels: Label[];
  /** Ids de los sellos elegidos (`Label._id`); el nombre es solo para mostrarlo. */
  selected: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}

/** Los mismos papeles de color en el modal claro y en el de vidrio. */
const TONES = {
  light: {
    chosen: "bg-[#FFEADD] text-[#FF5C00]",
    toggleAll: "text-[#FF5C00] hover:text-[#EA580C]",
    searchIcon: "text-[#A6AAB2]",
    search:
      "border-[#E8E8EC] bg-white text-[#1C1D22] placeholder:text-[#A6AAB2] focus:border-[#FF5C00] focus:ring-[#FF5C00]/15",
    list: "border-[#E8E8EC]",
    empty: "text-[#A6AAB2]",
    divide: "divide-[#E8E8EC]",
    row: { on: "bg-[#FFEADD]", off: "bg-white hover:bg-[#F4F5F7]" },
    box: { on: "border-[#FF5C00] bg-[#FF5C00]", off: "border-[#E8E8EC] bg-white" },
    name: "text-[#1C1D22]",
    meta: "text-[#A6AAB2]",
    money: "text-[#71757E]",
    summary: "divide-[#E8E8EC] bg-[#F4F5F7]",
    summaryLabel: "text-[#A6AAB2]",
    summaryValue: "text-[#1C1D22]",
    income: "text-[#2FB37E]",
  },
  glass: {
    chosen: "bg-[#FF5C00]/[0.16] text-[#FF9A5C]",
    toggleAll: "rounded-full text-[#FF8A3D] hover:text-[#FFB48A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70",
    searchIcon: "text-white/50",
    search:
      "border-white/[0.14] bg-white/[0.06] text-white placeholder:text-white/40 focus:border-[#FF8A3D] focus:ring-[#FF5C00]/25",
    list: "border-white/[0.12] bg-black/[0.12]",
    empty: "text-white/50",
    divide: "divide-white/[0.08]",
    row: {
      on: "bg-[#FF5C00]/[0.14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#FF5C00]/70",
      off: "hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#FF5C00]/70",
    },
    box: { on: "border-[#FF5C00] bg-[#FF5C00]", off: "border-white/30 bg-transparent" },
    name: "text-white",
    meta: "text-white/50",
    money: "text-white/70",
    summary: "divide-white/[0.09] bg-white/[0.06]",
    summaryLabel: "text-white/50",
    summaryValue: "text-white",
    income: "text-[#45D39A]",
  },
};

/**
 * Selector de los sellos artísticos que agrupa un sello personalizado.
 *
 * Lo comparten crear y editar: son el mismo formulario, y tenerlo dos veces
 * garantizaba que uno se quedase atrás al tocar el otro.
 *
 * Cada opción muestra sus canciones e ingresos porque la pregunta al agrupar no
 * es «cómo se llama», sino «cuánto trae».
 */
export function ArtisticLabelPicker({
  availableLabels,
  selected,
  onChange,
  disabled = false,
}: ArtisticLabelPickerProps) {
  const [query, setQuery] = useState("");
  // Vive dentro de los modales de sello: toma su tono, claro o vidrio.
  const t = useModalGlass() ? TONES.glass : TONES.light;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return availableLabels;
    return availableLabels.filter((label) => (label.label ?? "").toLowerCase().includes(q));
  }, [availableLabels, query]);

  const visibleIds = filtered.map((label) => label._id).filter(Boolean);
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selected.includes(id));

  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter((n) => n !== id) : [...selected, id]);
  };

  const toggleAllVisible = () => {
    if (allVisibleSelected) {
      onChange(selected.filter((id) => !visibleIds.includes(id)));
      return;
    }
    onChange([...new Set([...selected, ...visibleIds])]);
  };

  const totals = useMemo(() => {
    const chosen = availableLabels.filter((label) => selected.includes(label._id));
    return chosen.reduce(
      (acc, label) => ({
        songs: acc.songs + (label.count ?? 0),
        streams: acc.streams + (label.totalStreams ?? 0),
        income: acc.income + (label.totalNetIncome ?? 0),
      }),
      { songs: 0, streams: 0, income: 0 },
    );
  }, [availableLabels, selected]);

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap items-center gap-2.5">
        <FieldLabel required>SELLOS ARTÍSTICOS</FieldLabel>
        {selected.length > 0 && (
          <span className={`rounded-[10px] px-[7px] py-px font-mono text-[10px] font-semibold ${t.chosen}`}>
            {selected.length} {selected.length === 1 ? "elegido" : "elegidos"}
          </span>
        )}
        {visibleIds.length > 0 && (
          <button
            type="button"
            onClick={toggleAllVisible}
            disabled={disabled}
            className={`ml-auto text-[11.5px] font-semibold transition-colors disabled:opacity-50 ${t.toggleAll}`}
          >
            {allVisibleSelected ? "Quitar todos" : "Seleccionar todos"}
          </button>
        )}
      </div>

      <div className="relative">
        <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${t.searchIcon}`} size={15} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={disabled}
          placeholder="Buscar sello artístico…"
          className={`w-full rounded-2xl border py-2.5 pl-11 pr-4 text-[12.5px] focus:outline-none focus:ring-[3px] disabled:opacity-50 ${t.search}`}
        />
      </div>

      <div className={`max-h-[240px] overflow-y-auto rounded-[18px] border ${t.list}`}>
        {filtered.length === 0 ? (
          <p className={`px-4 py-6 text-center text-[12px] ${t.empty}`}>
            {availableLabels.length === 0
              ? "Todavía no hay sellos artísticos que agrupar."
              : `Ningún sello coincide con «${query}»`}
          </p>
        ) : (
          <div className={`flex flex-col divide-y ${t.divide}`}>
            {filtered.map((label) => {
              const name = label.label;
              const isSelected = selected.includes(label._id);
              return (
                <button
                  key={label._id}
                  type="button"
                  onClick={() => toggle(label._id)}
                  disabled={disabled}
                  aria-pressed={isSelected}
                  className={`flex items-center gap-3 px-3.5 py-2.5 text-left transition-colors disabled:opacity-50 ${
                    isSelected ? t.row.on : t.row.off
                  }`}
                >
                  <span
                    className={`flex h-[19px] w-[19px] flex-shrink-0 items-center justify-center rounded-md border-[1.5px] transition-colors ${
                      isSelected ? t.box.on : t.box.off
                    }`}
                  >
                    {isSelected && <Check className="h-3 w-3 text-white" />}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className={`truncate text-[12.5px] font-semibold ${t.name}`}>
                      {name || "Sin sello"}
                    </span>
                    <span className={`truncate text-[11px] ${t.meta}`}>
                      {(label.count ?? 0).toLocaleString()}{" "}
                      {label.count === 1 ? "canción" : "canciones"} ·{" "}
                      {formatStreams(label.totalStreams ?? 0)} streams
                    </span>
                  </span>
                  <span className={`flex-shrink-0 font-mono text-[11.5px] font-medium ${t.money}`}>
                    {formatCurrency(label.totalNetIncome ?? 0)}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selected.length > 0 && (
        <div className={`flex items-center divide-x rounded-[18px] px-1 py-3 ${t.summary}`}>
          <SummaryCell
            label="CANCIONES"
            value={totals.songs.toLocaleString()}
            labelClassName={t.summaryLabel}
            valueClassName={t.summaryValue}
          />
          <SummaryCell
            label="STREAMS"
            value={formatStreams(totals.streams)}
            labelClassName={t.summaryLabel}
            valueClassName={t.summaryValue}
          />
          <SummaryCell
            label="INGRESOS"
            value={formatCurrency(totals.income)}
            labelClassName={t.summaryLabel}
            valueClassName={t.income}
          />
        </div>
      )}
    </div>
  );
}

function SummaryCell({
  label,
  value,
  labelClassName = "text-[#A6AAB2]",
  valueClassName = "text-[#1C1D22]",
}: {
  label: string;
  value: string;
  labelClassName?: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1 px-3.5">
      <span className={`font-mono text-[9px] font-medium tracking-[1.1px] ${labelClassName}`}>
        {label}
      </span>
      <span className={`truncate font-mono text-[15px] font-semibold ${valueClassName}`}>
        {value}
      </span>
    </div>
  );
}
