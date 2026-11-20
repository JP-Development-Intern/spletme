import { Link, useNavigate } from "react-router-dom";
import {
  Play,
  Upload,
  ChevronRight,
  Pencil,
  FileStack,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { formatStreams, formatCurrency } from "@/utils/format.utils";
import { luminance } from "@/const/platformBrand";
import { formatGaps, formatRelativeDate, isStale } from "@/utils/coverage.utils";
import { formatUploadPeriod } from "@/utils/period.utils";
import { CoverageStrip } from "./CoverageStrip";
import { RowActionsMenu } from "./RowActionsMenu";
import { DISTRIBUTOR_COLUMNS, DISTRIBUTORS_GRID } from "./distributorsColumns";
import type { DistributorListItem } from "./types";

interface DistributorRowProps {
  item: DistributorListItem;
  year: number;
  upToMonth: number;
  onUpload: (item: DistributorListItem) => void;
  onEdit: (item: DistributorListItem) => void;
  onDelete: (item: DistributorListItem) => void;
}

const visibility = (key: string) =>
  DISTRIBUTOR_COLUMNS.find((c) => c.key === key)!.visibility;

/**
 * Fila de la tabla de distribuidores. La fila entera lleva al detalle: los
 * controles que hacen otra cosa por sí mismos detienen el clic.
 */
export function DistributorRow({
  item,
  year,
  upToMonth,
  onUpload,
  onEdit,
  onDelete,
}: DistributorRowProps) {
  const navigate = useNavigate();
  const { distributor, kpi, color, covered, gaps, missingMonths } = item;
  const to = `/panel/dealers/${distributor._id}`;
  const lastUpload = kpi?.lastUpload ?? null;
  const stale = isStale(lastUpload);
  const lastPeriod = item.uploads[0] ? formatUploadPeriod(item.uploads[0]) : null;

  return (
    <div
      onClick={() => navigate(to)}
      className={`${DISTRIBUTORS_GRID} group cursor-pointer px-5 py-3 transition-colors hover:bg-white/[0.04]`}
    >
      {/* Distribuidor */}
      <div className="flex min-w-0 items-center gap-3">
        <div
          className="flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center overflow-hidden rounded-[14px]"
          // Los logos se diseñan para fondo claro: conservan su placa blanca. Un
          // color de marca casi negro lleva aro para no hundirse en la noche.
          style={{
            backgroundColor: distributor.photoUrl ? "#FFFFFF" : color,
            ...(!distributor.photoUrl && /^#[0-9a-f]{6}$/i.test(color) && luminance(color) < 0.05
              ? { boxShadow: "inset 0 0 0 1px rgba(255, 255, 255, 0.3)" }
              : undefined),
          }}
        >
          {distributor.photoUrl ? (
            <img
              src={distributor.photoUrl}
              alt=""
              className="h-full w-full object-contain ring-1 ring-inset ring-white/[0.14]"
            />
          ) : (
            <span className="font-display text-base font-semibold text-white">
              {distributor.name.slice(0, 1).toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex min-w-0 flex-col gap-0.5">
          <Link
            to={to}
            onClick={(e) => e.stopPropagation()}
            title={distributor.name}
            className="truncate text-[13.5px] font-semibold text-white transition-colors group-hover:text-[#FFB067]"
          >
            {distributor.name}
          </Link>
          <span className="truncate text-[11px] text-white/50">
            {distributor.provider && distributor.provider !== distributor.name
              ? distributor.provider
              : `${kpi?.uploadCount ?? 0} cargas`}
          </span>
        </div>
      </div>

      {/* Moneda en la que reporta: los importes de la fila van siempre en USD. */}
      <div className={visibility("currency")}>
        <span
          title={
            distributor.currency === "USD"
              ? "Reporta en dólares"
              : "Reporta en euros; sus importes se convierten a dólares al subir cada archivo"
          }
          className={`rounded-full px-2.5 py-1 font-mono text-[10.5px] font-semibold ${
            distributor.currency === "USD"
              ? "bg-[#45D39A]/[0.12] text-[#45D39A]"
              : "bg-white/[0.08] text-white/65"
          }`}
        >
          {distributor.currency}
        </span>
      </div>

      {/* Canciones */}
      <div className={visibility("songs")}>
        <span className="font-mono text-[13px] font-medium text-white">
          {(kpi?.songsCount ?? 0).toLocaleString()}
        </span>
      </div>

      {/* Streams */}
      <div className={`${visibility("streams")} items-center gap-1.5`}>
        <Play className="h-3 w-3 flex-shrink-0 text-white/50" />
        <span className="font-mono text-[11.5px] text-white/65">
          {formatStreams(kpi?.totalStreams ?? 0)}
        </span>
      </div>

      {/* Ingresos netos */}
      <div className={`${visibility("income")} min-w-0 flex-col gap-1.5`}>
        <span className="flex items-baseline gap-1.5">
          <span className="font-mono text-[14px] text-[#45D39A]">
            {formatCurrency(kpi?.totalNetIncome ?? 0)}
          </span>
          <span className="font-mono text-[10px] text-white/50">
            {item.shareOfTotal.toFixed(0)}%
          </span>
        </span>
        <span className="h-1 w-full overflow-hidden rounded-full bg-white/[0.10]">
          <span
            className="block h-full rounded-full"
            style={{ width: `${Math.max(3, item.shareOfMax)}%`, backgroundColor: color }}
          />
        </span>
      </div>

      {/* Cobertura */}
      <div
        className={`${visibility("coverage")} min-w-0`}
        title={
          missingMonths > 0
            ? `Faltan ${formatGaps(gaps)} de ${year}`
            : `${year} cubierto por completo`
        }
      >
        <CoverageStrip
          covered={covered}
          year={year}
          color={color}
          upToMonth={upToMonth}
          size="mini"
        />
      </div>

      {/* Última carga */}
      <div className={`${visibility("lastUpload")} min-w-0 flex-col gap-0.5`}>
        <span
          className={`flex items-center gap-1 truncate text-[11.5px] ${
            stale ? "font-semibold text-[#FF8F92]" : "font-medium text-white"
          }`}
        >
          {stale && <TriangleAlert className="h-3 w-3 flex-shrink-0" />}
          {formatRelativeDate(lastUpload)}
        </span>
        {lastPeriod && (
          <span className="truncate font-mono text-[10px] text-white/50">{lastPeriod}</span>
        )}
      </div>

      {/* Acciones */}
      <div className="flex items-center justify-end gap-1.5">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onUpload(item);
          }}
          title={`Subir reporte a ${distributor.name}`}
          aria-label={`Subir reporte a ${distributor.name}`}
          className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-full border border-[#FF8A3D]/35 bg-[#FF5C00]/[0.16] text-[#FF9A5C] transition-colors hover:bg-[#FF5C00]/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70"
        >
          <Upload className="h-4 w-4" />
        </button>

        <RowActionsMenu
          onGlass
          label={`Acciones de ${distributor.name}`}
          actions={[
            {
              key: "upload",
              label: "Subir reporte",
              icon: <Upload className="h-4 w-4" />,
              onSelect: () => onUpload(item),
            },
            {
              key: "history",
              label: "Ver historial de cargas",
              icon: <FileStack className="h-4 w-4" />,
              onSelect: () => navigate(to),
            },
            {
              key: "edit",
              label: "Editar nombre y moneda",
              icon: <Pencil className="h-4 w-4" />,
              onSelect: () => onEdit(item),
            },
            {
              key: "delete",
              label: "Eliminar distribuidor",
              icon: <Trash2 className="h-4 w-4" />,
              danger: true,
              onSelect: () => onDelete(item),
            },
          ]}
        />

        <ChevronRight className="hidden h-4 w-4 flex-shrink-0 text-white/40 lg:block" />
      </div>
    </div>
  );
}
