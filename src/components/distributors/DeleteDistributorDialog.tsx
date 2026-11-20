import { useState } from "react";
import { TriangleAlert, Trash2 } from "lucide-react";
import { formatCurrency } from "@/utils/format.utils";
import {
  ModalShell,
  SecondaryButton,
  DangerButton,
  DistributorMark,
} from "@/components/ui/ModalShell";
import type { DistributorListItem } from "./types";

interface DeleteDistributorDialogProps {
  item: DistributorListItem;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

/**
 * Confirmación de borrado. Enseña lo que se pierde antes de preguntar, porque
 * eliminar un distribuidor arrastra todas sus cargas y los ingresos que
 * aportaron.
 */
export function DeleteDistributorDialog({
  item,
  onClose,
  onConfirm,
}: DeleteDistributorDialogProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const { distributor, kpi } = item;

  async function handleDelete() {
    setDeleting(true);
    setError("");
    try {
      await onConfirm();
      onClose();
    } catch {
      setError("No se pudo eliminar el distribuidor. Vuelve a intentarlo.");
      setDeleting(false);
    }
  }

  return (
    <ModalShell
      title="Eliminar distribuidor"
      subtitle="Esta acción no se puede deshacer"
      onGlass
      locked={deleting}
      onClose={onClose}
      logo={
        <DistributorMark
          name={distributor.name}
          logo={distributor.photoUrl}
          color={item.color}
        />
      }
      footer={
        <>
          <span className="flex-1" />
          <SecondaryButton onClick={onClose} disabled={deleting}>
            Cancelar
          </SecondaryButton>
          <DangerButton
            onClick={handleDelete}
            disabled={deleting}
            icon={<Trash2 className="h-[15px] w-[15px]" />}
          >
            {deleting ? "Eliminando…" : "Eliminar"}
          </DangerButton>
        </>
      }
    >
      <p className="text-[13px] leading-relaxed text-white/80">
        Vas a eliminar <strong className="font-semibold text-white">{distributor.name}</strong> y todo su
        historial de cargas.
      </p>

      <ul className="flex flex-col gap-2 rounded-[18px] border border-[#E5484D]/30 bg-[#E5484D]/[0.12] p-4">
        <Impact label="Cargas registradas" value={(kpi?.uploadCount ?? 0).toLocaleString()} />
        <Impact label="Canciones asociadas" value={(kpi?.songsCount ?? 0).toLocaleString()} />
        <Impact
          label="Ingresos netos acumulados"
          value={formatCurrency(kpi?.totalNetIncome ?? 0)}
        />
      </ul>

      <p className="flex items-start gap-2.5 text-[11.5px] leading-relaxed text-white/65">
        <TriangleAlert className="mt-px h-3.5 w-3.5 flex-shrink-0 text-[#FF8F92]" />
        Las canciones seguirán en tu catálogo, pero perderán los ingresos que aportaba este
        distribuidor.
      </p>

      {error && <p className="text-[12px] font-medium text-[#FF8F92]">{error}</p>}
    </ModalShell>
  );
}

function Impact({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex items-center justify-between gap-4">
      <span className="text-[12px] text-white/65">{label}</span>
      <span className="font-mono text-[13px] text-white">{value}</span>
    </li>
  );
}
