import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Upload,
  Music,
  Play,
  DollarSign,
  FileStack,
  CalendarOff,
  Building2,
  CircleDollarSign,
  History,
  TriangleAlert,
  Pencil,
  Trash2,
  Download,
} from "lucide-react";
import type {
  Currency,
  DistributorDashboard,
  UploadPeriodPayload,
} from "@/types/distributor.types";
import { distributorsService } from "@/services/distributorsService";
import { formatStreams, formatCurrency } from "@/utils/format.utils";
import {
  availableYears,
  countMissingMonths,
  coveredMonths,
  findCoverageGaps,
  formatMonthRange,
  formatRelativeDate,
  lastRelevantMonth,
  type MonthRange,
} from "@/utils/coverage.utils";
import { DistributorRevenueChart } from "@/components/distributors/DistributorRevenueChart";
import { UploadHistoryList } from "@/components/distributors/UploadHistoryList";
import { DistributorTopSongs } from "@/components/distributors/DistributorTopSongs";
import { DetailCoveragePanel } from "@/components/distributors/DetailCoveragePanel";
import { RowActionsMenu } from "@/components/distributors/RowActionsMenu";
import { DeleteDistributorDialog } from "@/components/distributors/DeleteDistributorDialog";
import { DistributorMark } from "@/components/ui/ModalShell";
import UploadSongsModal from "@/components/ui/UploadSongsModal";
import EditDistributorModal from "@/components/ui/EditDistributorModal";
import { DetailSkeleton } from "@/components/music/DetailSkeleton";

export default function DistributorDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState<DistributorDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [showUpload, setShowUpload] = useState(false);
  const [presetPeriod, setPresetPeriod] = useState<UploadPeriodPayload | undefined>();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      setDashboard(await distributorsService.getDashboard(id));
    } catch {
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  /** Cargas de más reciente a más antigua; el orden de la API no está garantizado. */
  const sortedUploads = useMemo(
    () =>
      [...(dashboard?.uploads ?? [])].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [dashboard],
  );
  /** Las cargas con error no cubren su periodo: ese mes sigue pendiente. */
  const uploads = useMemo(
    () => sortedUploads.filter((u) => u.status !== "error"),
    [sortedUploads],
  );
  const upToMonth = useMemo(() => lastRelevantMonth(year), [year]);
  const covered = useMemo(() => coveredMonths(uploads, year), [uploads, year]);
  const gaps = useMemo(() => findCoverageGaps(covered, upToMonth), [covered, upToMonth]);
  const years = useMemo(() => availableYears(uploads), [uploads]);
  const missingMonths = countMissingMonths(gaps);

  if (loading) return <DetailSkeleton label="Cargando el distribuidor" />;

  if (!dashboard) {
    return (
      <section className="glass mx-4 flex flex-col items-center gap-3 rounded-[32px] px-6 py-14 text-center lg:ml-4 lg:mr-8">
        <span className="flex h-[60px] w-[60px] items-center justify-center rounded-[22px] bg-[#E5484D]/[0.14]">
          <TriangleAlert className="h-[24px] w-[24px] text-[#FF8F92]" />
        </span>
        <h2 className="font-display text-[19px] font-medium text-white">
          No se pudo cargar el distribuidor
        </h2>
        <p className="text-[12.5px] text-white/65">
          Puede que ya no exista o que la conexión haya fallado.
        </p>
        <div className="flex items-center gap-2.5 pt-1.5">
          <button
            onClick={load}
            className="px-[18px] py-[11px] rounded-full bg-[#FF5C00] text-[12.5px] font-semibold text-white shadow-[0_8px_20px_-6px_rgba(255,92,0,0.35)] transition-colors hover:bg-[#EA580C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            Reintentar
          </button>
          <button
            onClick={() => navigate("/panel/dealers")}
            className="glass-control rounded-full px-[18px] py-[11px] text-[12.5px] font-semibold text-white transition-colors hover:bg-white/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70"
          >
            Volver a distribuidores
          </button>
        </div>
      </section>
    );
  }

  const { distributor, totals, revenueByPeriod, topSongs } = dashboard;
  const retained =
    totals.totalGrossIncome > 0
      ? Math.round((totals.totalNetIncome / totals.totalGrossIncome) * 100)
      : 0;
  const lastUpload = sortedUploads[0]?.createdAt ?? null;

  const openUpload = (period?: MonthRange) => {
    setPresetPeriod(
      period ? { startMonth: period.startMonth, endMonth: period.endMonth, year } : undefined,
    );
    setShowUpload(true);
  };

  return (
    <>
      <div className="flex flex-col gap-5 px-4 lg:pl-4 lg:pr-8">
        {/* Encabezado */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3.5">
            <button
              onClick={() => navigate("/panel/dealers")}
              aria-label="Volver a distribuidores"
              className="glass-control flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/[0.12] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <DistributorMark name={distributor.name} logo={distributor.photoUrl} size={54} />
            <div className="flex min-w-0 flex-col gap-1.5">
              <h1 className="truncate font-display text-[26px] font-light leading-[1.15] tracking-[-0.015em] text-white sm:text-[34px]">
                {distributor.name}
              </h1>
              <div className="flex flex-wrap items-center gap-1.5">
                {distributor.provider && (
                  <Chip icon={<Building2 className="h-3 w-3" />}>{distributor.provider}</Chip>
                )}
                <Chip
                  icon={<CircleDollarSign className="h-3 w-3" />}
                  tone={{ bg: "rgba(69, 211, 154, 0.12)", fg: "#45D39A" }}
                  title={
                    distributor.currency === "USD"
                      ? "Sus reportes llegan en dólares"
                      : "Sus reportes llegan en euros y se convierten a dólares al subirlos"
                  }
                >
                  {distributor.currency === "USD" ? "Reporta en USD" : "Reporta en EUR"}
                </Chip>
                <Chip icon={<FileStack className="h-3 w-3" />}>
                  {totals.uploadCount} {totals.uploadCount === 1 ? "carga" : "cargas"}
                </Chip>
                <Chip icon={<History className="h-3 w-3" />}>
                  Última {formatRelativeDate(lastUpload)}
                </Chip>
              </div>
            </div>
          </div>

          <div className="flex flex-shrink-0 items-center gap-2.5">
            <button
              onClick={() => openUpload()}
              className="flex min-h-[44px] items-center gap-2 px-[18px] py-[11px] rounded-full bg-[#FF5C00] text-[12.5px] font-semibold text-white shadow-[0_8px_20px_-6px_rgba(255,92,0,0.35)] transition-colors hover:bg-[#EA580C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              <Upload className="h-[15px] w-[15px]" />
              Subir reporte
            </button>
            <RowActionsMenu
              onGlass
              label={`Acciones de ${distributor.name}`}
              actions={[
                {
                  key: "edit",
                  label: "Editar nombre y moneda",
                  icon: <Pencil className="h-4 w-4" />,
                  onSelect: () => setEditing(true),
                },
                {
                  key: "export",
                  label: "Exportar cargas (CSV)",
                  icon: <Download className="h-4 w-4" />,
                  onSelect: () => exportUploads(dashboard),
                  disabled: sortedUploads.length === 0,
                },
                {
                  key: "delete",
                  label: "Eliminar distribuidor",
                  icon: <Trash2 className="h-4 w-4" />,
                  danger: true,
                  onSelect: () => setDeleting(true),
                },
              ]}
            />
          </div>
        </div>

        {/* Consola de métricas */}
        <div className="glass flex flex-col gap-1.5 rounded-[28px] p-1.5 lg:flex-row lg:items-stretch lg:gap-0">
          <Channel
            label="Ingresos netos"
            icon={<DollarSign className="h-[15px] w-[15px] text-white" />}
            value={formatCurrency(totals.totalNetIncome)}
            valueClassName="text-[#45D39A] text-[26px] sm:text-[30px]"
            className="lg:w-[300px] lg:flex-shrink-0"
          >
            {totals.totalGrossIncome > 0 && (
              <span className="text-xs text-white/50">
                bruto {formatCurrency(totals.totalGrossIncome)} · {retained}% retenido
              </span>
            )}
          </Channel>
          <Channel
            label="Streams"
            icon={<Play className="h-[15px] w-[15px] text-white" />}
            value={formatStreams(totals.totalStreams)}
            divided
          />
          <Channel
            label="Canciones"
            icon={<Music className="h-[15px] w-[15px] text-white" />}
            value={totals.songsCount.toLocaleString()}
            divided
          />
          <Channel
            label="Cargas"
            icon={<FileStack className="h-[15px] w-[15px] text-white" />}
            value={String(totals.uploadCount)}
            divided
          />
          {/* Lo único accionable de la consola: va teñido de brasa */}
          <Channel
            label={`Sin cargar ${year}`}
            labelClassName="text-[#FFB48A]"
            iconClassName="bg-[#FF5C00]/[0.22]"
            icon={<CalendarOff className="h-[15px] w-[15px] text-[#FF8A3D]" />}
            value={missingMonths > 0 ? gaps.map(formatMonthRange).join(" · ") : "Al día"}
            valueClassName="text-white text-[22px]"
            className="rounded-[22px] border border-[#FF8A3D]/30 bg-[#FF5C00]/[0.14] lg:w-[240px] lg:flex-shrink-0"
          >
            <span className="text-xs font-semibold text-[#FF8A3D]">
              {missingMonths > 0
                ? `${missingMonths} ${missingMonths === 1 ? "mes" : "meses"} de ${year}`
                : `Todo ${year} cubierto`}
            </span>
          </Channel>
        </div>

        {/* Cuerpo */}
        <div className="flex flex-col gap-5 xl:flex-row">
          <div className="flex min-w-0 flex-1 flex-col gap-5">
            <DistributorRevenueChart
              periods={revenueByPeriod}
            />
            <UploadHistoryList
              uploads={sortedUploads}
              onUpload={() => openUpload()}
            />
          </div>

          <div className="flex flex-col gap-5 xl:w-[352px] xl:flex-shrink-0">
            <DetailCoveragePanel
              covered={covered}
              gaps={gaps}
              year={year}
              years={years}
              onYearChange={setYear}
              upToMonth={upToMonth}
              onFillGap={openUpload}
            />
            <DistributorTopSongs songs={topSongs} />
          </div>
        </div>
      </div>

      {showUpload && (
        <UploadSongsModal
          distributorName={distributor.name}
          distributorLogo={distributor.photoUrl}
          distributorCurrency={distributor.currency}
          existingUploads={uploads}
          initialPeriod={presetPeriod}
          onClose={() => {
            setShowUpload(false);
            setPresetPeriod(undefined);
          }}
          onConfirm={async (file, period, currency, onProgress, onProcessingProgress) => {
            if (!id) return;
            const result = await distributorsService.uploadSongs(
              id,
              file,
              period,
              currency,
              onProgress,
              onProcessingProgress,
            );
            await load();
            return result;
          }}
        />
      )}

      {editing && (
        <EditDistributorModal
          distributor={distributor}
          onClose={() => setEditing(false)}
          onConfirm={async (payload: { name: string; currency: Currency }) => {
            if (!id) return;
            await distributorsService.update(id, payload);
            await load();
          }}
        />
      )}

      {deleting && (
        <DeleteDistributorDialog
          item={{
            distributor,
            kpi: {
              distributorId: distributor._id,
              name: distributor.name,
              currency: distributor.currency,
              photoUrl: distributor.photoUrl,
              totalStreams: totals.totalStreams,
              totalNetIncome: totals.totalNetIncome,
              totalGrossIncome: totals.totalGrossIncome,
              uploadCount: totals.uploadCount,
              songsCount: totals.songsCount,
              lastUpload,
            },
            color: "#FF5C00",
            uploads: sortedUploads,
            covered,
            gaps,
            missingMonths,
            shareOfTotal: 100,
            shareOfMax: 100,
          }}
          onClose={() => setDeleting(false)}
          onConfirm={async () => {
            if (!id) return;
            await distributorsService.remove(id);
            navigate("/panel/dealers");
          }}
        />
      )}
    </>
  );
}

function Chip({
  icon,
  children,
  tone = { bg: "rgba(255, 255, 255, 0.08)", fg: "rgba(255, 255, 255, 0.7)" },
  title,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  tone?: { bg: string; fg: string };
  /** Aclaración al pasar el cursor, para lo que la etiqueta no cabe a decir. */
  title?: string;
}) {
  return (
    <span
      title={title}
      className="flex items-center gap-1.5 rounded-full px-2.5 py-1"
      style={{ backgroundColor: tone.bg, color: tone.fg }}
    >
      {icon}
      <span className="text-[11.5px] font-medium">{children}</span>
    </span>
  );
}

interface ChannelProps {
  label: string;
  labelClassName?: string;
  /** Fondo del círculo del ícono. */
  iconClassName?: string;
  icon: React.ReactNode;
  value: string;
  valueClassName?: string;
  className?: string;
  /** Lleva el hairline que lo separa del canal anterior. */
  divided?: boolean;
  children?: React.ReactNode;
}

/** Canal de la consola, con la misma anatomía que la de Música y el detalle de canción. */
function Channel({
  label,
  labelClassName = "text-white/70",
  iconClassName = "bg-white/[0.12]",
  icon,
  value,
  valueClassName = "text-white text-[30px]",
  className = "",
  divided = false,
  children,
}: ChannelProps) {
  return (
    <div
      className={`flex min-w-0 flex-1 flex-col justify-center gap-3 px-[22px] py-[18px] ${
        divided ? "border-t border-white/[0.09] lg:border-l lg:border-t-0" : ""
      } ${className}`}
    >
      <div className="flex items-center gap-2.5">
        <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${iconClassName}`}>
          {icon}
        </span>
        <span className={`truncate text-[12.5px] font-medium ${labelClassName}`}>{label}</span>
      </div>
      <div className="flex flex-col gap-1">
        <p className={`font-mono font-light leading-[1.1] tracking-[-0.015em] ${valueClassName}`}>
          {value}
        </p>
        {children}
      </div>
    </div>
  );
}

/** Vuelca el historial para conciliarlo fuera de la aplicación. */
function exportUploads(dashboard: DistributorDashboard) {
  const { distributor, uploads } = dashboard;
  const escape = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;

  const rows = [
    ["Periodo", "Año", "Archivo", "Canciones", "Streams", "Bruto", "Neto", "Estado", "Subido por", "Fecha"],
    ...uploads.map((upload) => [
      upload.periodLabel,
      upload.year,
      upload.fileName,
      upload.songsCount,
      upload.totalStreams,
      upload.totalGrossIncome,
      upload.totalNetIncome,
      upload.status,
      upload.uploadedBy?.name ?? "",
      new Date(upload.createdAt).toISOString().slice(0, 10),
    ]),
  ];

  const csv = rows.map((row) => row.map(escape).join(",")).join("\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `cargas-${distributor.name.replace(/[^\w]+/g, "-").toLowerCase()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
