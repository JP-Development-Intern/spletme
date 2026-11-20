import { useState } from "react";
import { FileText, Check, Loader, TriangleAlert, FileStack, Upload } from "lucide-react";
import type { DistributorUpload, UploadStatus } from "@/types/distributor.types";
import { currencySymbol, formatCurrency, formatMoney } from "@/utils/format.utils";
import { formatUploadPeriod, MONTH_SHORT_NAMES, resolvePeriod } from "@/utils/period.utils";
import { quarterColor } from "@/utils/coverage.utils";

type StatusFilter = "all" | UploadStatus;

interface UploadHistoryListProps {
  uploads: DistributorUpload[];
  onUpload: () => void;
}

/** El estado del backend, dicho en español y con su color. */
const STATUS_META: Record<UploadStatus, { label: string; fg: string; bg: string }> = {
  done: { label: "Completada", fg: "#45D39A", bg: "rgba(69, 211, 154, 0.12)" },
  processing: { label: "Procesando", fg: "#FF9A5C", bg: "rgba(255, 92, 0, 0.16)" },
  error: { label: "Con errores", fg: "#FF8F92", bg: "rgba(229, 72, 77, 0.14)" },
};

/** El primer trimestre va en tinta: sobre la noche necesita un aro para verse. */
const INK = "#1C1D22";

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "done", label: "Completadas" },
  { value: "processing", label: "Procesando" },
  { value: "error", label: "Con errores" },
];

/**
 * Historial de cargas. Muestra quién subió cada archivo —dato que ya viajaba en
 * `uploadedBy` y que la pantalla anterior descartaba— y traduce el estado, que
 * antes se imprimía crudo como «done».
 */
export function UploadHistoryList({ uploads, onUpload }: UploadHistoryListProps) {
  const [filter, setFilter] = useState<StatusFilter>("all");

  const visible = filter === "all" ? uploads : uploads.filter((u) => u.status === filter);
  const totalSongs = uploads.reduce((sum, u) => sum + (u.songsCount ?? 0), 0);

  return (
    <div className="glass flex flex-col gap-3.5 rounded-[28px] px-6 py-5">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-col gap-0.5">
          <h2 className="font-display text-[19px] font-medium tracking-[-0.005em] text-white">
            Historial de cargas
          </h2>
          <p className="text-[12.5px] text-white/65">
            {uploads.length} {uploads.length === 1 ? "reporte procesado" : "reportes procesados"} ·{" "}
            {totalSongs.toLocaleString()} canciones en total
          </p>
        </div>
        {uploads.length > 0 && (
          <div className="relative">
            <select
              aria-label="Filtrar cargas por estado"
              value={filter}
              onChange={(e) => setFilter(e.target.value as StatusFilter)}
              className="glass-control min-h-[36px] appearance-none rounded-full py-2 pl-3.5 pr-8 text-[11.5px] font-semibold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70"
            >
              {FILTERS.map((option) => (
                <option key={option.value} value={option.value} className="bg-[#2B1E17] text-white">
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {uploads.length === 0 ? (
        <EmptyHistory onUpload={onUpload} />
      ) : visible.length === 0 ? (
        <p className="py-8 text-center text-[12.5px] text-white/50">
          Ninguna carga en ese estado.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {visible.map((upload) => (
            <UploadRow key={upload._id} upload={upload} />
          ))}
        </ul>
      )}
    </div>
  );
}

function UploadRow({ upload }: { upload: DistributorUpload }) {
  const status = STATUS_META[upload.status] ?? STATUS_META.done;
  const period = resolvePeriod(upload);
  const badge = period ? MONTH_SHORT_NAMES[period.startMonth - 1] : "—";
  const uploader = upload.uploadedBy?.name ?? upload.uploadedBy?.username ?? "—";
  const badgeColor = quarterColor(period?.startMonth);
  const date = new Date(upload.createdAt).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
  });

  return (
    <li className="flex flex-wrap items-center gap-3 rounded-2xl bg-white/[0.06] px-3.5 py-3 transition-colors hover:bg-white/[0.10]">
      <span
        className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[14px] ${
          badgeColor === INK ? "border-2 border-white/25" : ""
        }`}
        style={{ backgroundColor: badgeColor }}
      >
        <span className="font-mono text-[11px] font-semibold text-white">{badge}</span>
      </span>

      <div className="flex min-w-[150px] flex-1 flex-col gap-0.5">
        <span className="truncate text-[13.5px] font-semibold text-white">
          {formatUploadPeriod(upload)}
        </span>
        <span className="flex min-w-0 items-center gap-1.5">
          <FileText className="h-3 w-3 flex-shrink-0 text-white/50" />
          <span
            className="truncate font-mono text-[10.5px] text-white/65"
            title={upload.fileName ?? undefined}
          >
            {upload.fileName ?? "Sin nombre de archivo"}
          </span>
        </span>
      </div>

      <div className="flex w-[130px] flex-col gap-0.5">
        <span className="text-[11.5px] font-medium text-white">
          {(upload.songsCount ?? 0).toLocaleString()} canciones
        </span>
        <span className="truncate text-[10.5px] text-white/50" title={uploader}>
          {uploader} · {date}
        </span>
      </div>

      {/* Siempre en dólares. Si el archivo llegó en otra moneda, debajo queda de
          dónde salió la cifra: sin la tasa, un importe convertido es un número
          del que nadie puede rendir cuentas. */}
      <span className="flex w-[110px] flex-col items-end gap-0.5">
        <span className="font-mono text-[14px] text-[#45D39A]">
          {formatCurrency(upload.totalNetIncome ?? 0)}
        </span>
        {upload.exchangeRate !== null && upload.totalNetIncomeSource !== null && (
          <span
            className="font-mono text-[10px] text-white/50"
            title={`Convertido a 1 ${currencySymbol(upload.sourceCurrency)} = $${upload.exchangeRate}`}
          >
            {formatMoney(upload.totalNetIncomeSource, upload.sourceCurrency)} ×{" "}
            {upload.exchangeRate}
          </span>
        )}
      </span>

      <span
        className="flex flex-shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1"
        style={{ backgroundColor: status.bg }}
      >
        {upload.status === "done" ? (
          <Check className="h-3 w-3" style={{ color: status.fg }} />
        ) : upload.status === "processing" ? (
          <Loader className="h-3 w-3 animate-spin" style={{ color: status.fg }} />
        ) : (
          <TriangleAlert className="h-3 w-3" style={{ color: status.fg }} />
        )}
        <span className="text-[11px] font-semibold" style={{ color: status.fg }}>
          {status.label}
        </span>
      </span>
    </li>
  );
}

function EmptyHistory({ onUpload }: { onUpload: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2.5 py-10">
      <span className="flex h-[52px] w-[52px] items-center justify-center rounded-[18px] bg-[#FF5C00]/15">
        <FileStack className="h-[22px] w-[22px] text-[#FF8A3D]" />
      </span>
      <span className="text-[13px] font-semibold text-white">Aún no hay cargas</span>
      <button
        onClick={onUpload}
        className="flex items-center gap-1.5 rounded-full text-[12px] font-semibold text-[#FF8A3D] transition-colors hover:text-[#FFB48A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70"
      >
        <Upload className="h-3.5 w-3.5" />
        Subir el primer reporte
      </button>
    </div>
  );
}
