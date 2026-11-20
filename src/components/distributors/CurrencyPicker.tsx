import { Check } from "lucide-react";
import type { Currency } from "@/types/distributor.types";
import { useModalGlass } from "@/components/ui/ModalShell";

const CURRENCIES: { value: Currency; label: string; symbol: string }[] = [
  { value: "USD", label: "Dólar (USD)", symbol: "$" },
  { value: "EUR", label: "Euro (EUR)", symbol: "€" },
];

interface CurrencyPickerProps {
  value: Currency;
  onChange: (value: Currency) => void;
}

/** Moneda en la que llegan los importes del reporte. */
export function CurrencyPicker({ value, onChange }: CurrencyPickerProps) {
  // Toma el tono del modal que lo contiene: claro o vidrio.
  const glass = useModalGlass();
  return (
    <div className="grid grid-cols-2 gap-2.5" role="radiogroup" aria-label="Moneda del reporte">
      {CURRENCIES.map((currency) => {
        const selected = value === currency.value;
        return (
          <button
            key={currency.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(currency.value)}
            className={`flex items-center gap-2.5 rounded-2xl px-4 py-3 transition-colors ${
              glass
                ? `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70 ${
                    selected
                      ? "border-[1.5px] border-[#FF8A3D] bg-[#FF5C00]/[0.16]"
                      : "border border-white/[0.12] bg-white/[0.06] hover:bg-white/[0.10]"
                  }`
                : selected
                  ? "border-[1.5px] border-[#FF5C00] bg-[#FFEADD]"
                  : "border border-[#E8E8EC] bg-white hover:border-[#D9DAE0]"
            }`}
          >
            <span
              className={`flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-[9px] font-mono text-[13px] font-semibold ${
                selected
                  ? "bg-[#FF5C00] text-white"
                  : glass
                    ? "bg-white/[0.10] text-white/70"
                    : "bg-[#F4F5F7] text-[#71757E]"
              }`}
            >
              {currency.symbol}
            </span>
            <span
              className={`flex-1 text-left text-[12.5px] font-semibold ${
                selected
                  ? glass
                    ? "text-[#FFB48A]"
                    : "text-[#EA580C]"
                  : glass
                    ? "text-white"
                    : "text-[#1C1D22]"
              }`}
            >
              {currency.label}
            </span>
            {selected && (
              <Check className={`h-[15px] w-[15px] flex-shrink-0 ${glass ? "text-[#FF8A3D]" : "text-[#FF5C00]"}`} />
            )}
          </button>
        );
      })}
    </div>
  );
}
