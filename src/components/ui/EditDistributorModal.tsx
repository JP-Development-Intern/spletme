import { useState } from "react";
import { CircleAlert, Info } from "lucide-react";
import type { Currency, Distributor } from "@/types/distributor.types";
import {
  ModalShell,
  FieldLabel,
  PrimaryButton,
  SecondaryButton,
  DistributorMark,
} from "@/components/ui/ModalShell";
import { CurrencyPicker } from "@/components/distributors/CurrencyPicker";

interface Props {
  distributor: Distributor;
  onClose: () => void;
  onConfirm: (payload: { name: string; currency: Currency }) => Promise<void>;
}

/**
 * Edición del nombre interno y la moneda. El proveedor no se cambia: es lo que
 * identifica de dónde salen los reportes ya cargados.
 */
export default function EditDistributorModal({ distributor, onClose, onConfirm }: Props) {
  const [name, setName] = useState(distributor.name);
  const [currency, setCurrency] = useState<Currency>(distributor.currency);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const trimmed = name.trim();
  const changed = trimmed !== distributor.name || currency !== distributor.currency;
  const currencyChanged = currency !== distributor.currency;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!trimmed) {
      setError("El nombre no puede quedar vacío.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onConfirm({ name: trimmed, currency });
      onClose();
    } catch {
      setError("No se pudieron guardar los cambios. Vuelve a intentarlo.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="contents">
      <ModalShell
        title="Editar distribuidor"
        subtitle={distributor.provider ?? "Sin proveedor asociado"}
        onGlass
        locked={saving}
        onClose={onClose}
        logo={<DistributorMark name={distributor.name} logo={distributor.photoUrl} />}
        footer={
          <>
            <span className="flex-1" />
            <SecondaryButton onClick={onClose} disabled={saving}>
              Cancelar
            </SecondaryButton>
            <PrimaryButton type="submit" disabled={saving || !changed || !trimmed}>
              {saving ? "Guardando…" : "Guardar cambios"}
            </PrimaryButton>
          </>
        }
      >
        <div className="flex flex-col gap-2">
          <FieldLabel required invalid={Boolean(error) && !trimmed}>
            NOMBRE INTERNO
          </FieldLabel>
          <input
            autoFocus
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`rounded-2xl border px-4 py-3 text-[13px] font-medium text-white transition-colors focus:outline-none focus:ring-[3px] focus:ring-[#FF5C00]/25 ${
              error && !trimmed
                ? "border-[1.5px] border-[#FF8F92] bg-[#E5484D]/[0.12]"
                : "border-white/[0.14] bg-white/[0.06] focus:border-[#FF8A3D]"
            }`}
          />
          <span className="text-[11px] leading-relaxed text-white/50">
            Así lo verás en tus listas. Útil si tienes varias cuentas del mismo distribuidor.
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <FieldLabel>MONEDA HABITUAL DE SUS REPORTES</FieldLabel>
          <CurrencyPicker value={currency} onChange={setCurrency} />
        </div>

        {currencyChanged && (
          <p className="flex items-start gap-2.5 rounded-[14px] border border-[#FF8A3D]/30 bg-[#FF5C00]/[0.14] px-3.5 py-3 text-[11px] leading-relaxed text-[#FFB48A]">
            <CircleAlert className="mt-px h-3.5 w-3.5 flex-shrink-0 text-[#FF8A3D]" />
            Solo cambia la moneda que se preselecciona al subir el próximo reporte. Los importes
            ya cargados están en dólares y no se tocan.
          </p>
        )}

        {!currencyChanged && (
          <p className="flex items-start gap-2.5 rounded-[14px] bg-white/[0.06] px-3.5 py-3 text-[11px] leading-relaxed text-white/65">
            <Info className="mt-px h-3.5 w-3.5 flex-shrink-0" />
            El proveedor y los reportes ya cargados no se modifican.
          </p>
        )}

        {error && <p className="text-[12px] font-medium text-[#FF8F92]">{error}</p>}
      </ModalShell>
    </form>
  );
}
