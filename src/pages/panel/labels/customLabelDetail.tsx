import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ChevronRight,
  Layers,
  Tag,
  Music,
  Play,
  DollarSign,
  Crown,
  Wallet,
  ChartPie,
  TriangleAlert,
} from "lucide-react";
import { useCustomLabelSongs } from "@/hooks/useLabels";
import { useLabelsLibrary, toCoverage, pendingToPay } from "@/hooks/useLabelsLibrary";
import { viewerOwnsAllSongs } from "@/utils/ownerVisibility";
import { formatCurrency, formatStreams } from "@/utils/format.utils";
import { SplitCoverageMeter } from "@/components/labels/SplitCoverageMeter";

/**
 * Detalle de un sello personalizado: lo que agrupa y lo que suma.
 *
 * No lista canciones —para eso está cada sello artístico— sino los sellos que
 * reúne, cada uno con su cobertura. Así se ve de dónde viene el porcentaje de
 * arriba y en cuál queda trabajo pendiente.
 */
export default function CustomLabelDetail() {
  const { label } = useParams<{ label: string }>();
  const navigate = useNavigate();
  const decodedLabel = decodeURIComponent(label ?? "");
  const { songs, customLabel, loading, error, loadSongs } = useCustomLabelSongs(label ?? "");

  // La lista completa da las métricas de cada sello agrupado: son las mismas que
  // ya se ven en la tabla de Sellos, aquí puestas donde se decide.
  const { artisticItems, loading: libraryLoading } = useLabelsLibrary();

  const artisticLabels = useMemo(() => customLabel?.artisticLabels ?? [], [customLabel]);

  const totals = useMemo(() => {
    let streams = 0;
    let netIncome = 0;
    let ownerEarnings = 0;
    let totalToPay = 0;
    let withSplits = 0;

    for (const song of songs) {
      streams += song.totalStreams ?? 0;
      netIncome += song.totalNetIncome ?? 0;
      ownerEarnings += song.ownerEarnings ?? 0;
      totalToPay +=
        song.collaboratorsPending ??
        song.collaboratorsEarnings ??
        pendingToPay(song.totalNetIncome, song.ownerEarnings);
      if (song.ownerSplit) withSplits += 1;
    }

    return {
      streams,
      netIncome,
      ownerEarnings,
      totalToPay,
      coverage: toCoverage(songs.length, withSplits, false),
    };
  }, [songs]);

  const showToPay = useMemo(() => viewerOwnsAllSongs(songs), [songs]);

  const grouped = useMemo(
    () =>
      artisticLabels.map((name) => ({
        name,
        item: artisticItems.find((candidate) => candidate.name === name) ?? null,
      })),
    [artisticLabels, artisticItems],
  );

  return (
    <div className="min-h-full bg-[#F7F7F9]">
      <div className="flex flex-col gap-5 px-4 py-6 lg:px-8">
        {/* Migas */}
        <nav aria-label="Ruta" className="flex items-center gap-2.5">
          <button
            onClick={() => navigate("/panel/labels")}
            aria-label="Volver a Sellos"
            className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-full border border-[#E8E8EC] bg-white text-[#71757E] transition-colors hover:text-[#1C1D22]"
          >
            <ArrowLeft className="h-[15px] w-[15px]" />
          </button>
          <Link
            to="/panel/labels"
            className="text-[12.5px] font-medium text-[#A6AAB2] transition-colors hover:text-[#71757E]"
          >
            Sellos
          </Link>
          <ChevronRight className="h-[13px] w-[13px] text-[#A6AAB2]" />
          <span className="truncate text-[12.5px] font-semibold text-[#1C1D22]">
            {decodedLabel || "Sin sello"}
          </span>
        </nav>

        {/* Identidad */}
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-[18px] bg-[#FF5C00]">
            <Layers className="h-6 w-6 text-white" />
          </span>
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="truncate font-display text-2xl font-semibold text-[#1C1D22]">
              {decodedLabel || "Sin sello"}
            </h1>
            <p className="flex flex-wrap items-center gap-2 text-[12.5px] text-[#71757E]">
              <span className="flex items-center gap-1.5 rounded-[10px] bg-[#FFEADD] px-2 py-0.5 text-[11px] font-semibold text-[#FF5C00]">
                <Layers className="h-[11px] w-[11px]" />
                Personalizado
              </span>
              <span>
                Agrupa {artisticLabels.length}{" "}
                {artisticLabels.length === 1 ? "sello artístico" : "sellos artísticos"}
              </span>
              <span className="text-[#A6AAB2]">·</span>
              <span>
                {songs.length} {songs.length === 1 ? "canción" : "canciones"}
              </span>
            </p>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2.5 rounded-2xl border border-[#F5C2C4] bg-[#FDECEC] px-4 py-3">
            <TriangleAlert className="h-4 w-4 flex-shrink-0 text-[#E5484D]" />
            <span className="flex-1 text-[12.5px] text-[#E5484D]">{error}</span>
            <button
              onClick={loadSongs}
              className="rounded-full bg-white px-3.5 py-1.5 text-[11.5px] font-semibold text-[#E5484D]"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Consola de métricas */}
        <div className="flex flex-col divide-y divide-[#E8E8EC] overflow-hidden rounded-[26px] border border-[#E8E8EC] bg-white shadow-[0_10px_28px_-12px_rgba(255,92,0,0.15)] lg:flex-row lg:divide-x lg:divide-y-0">
          <Channel
            label="CANCIONES"
            icon={<Music className="h-[13px] w-[13px] text-[#71757E]" />}
            value={loading ? "—" : songs.length.toLocaleString()}
          >
            <span className="text-[10.5px] text-[#A6AAB2]">
              {totals.coverage.withSplits} con split
            </span>
          </Channel>
          <Channel
            label="COBERTURA DE SPLITS"
            labelClassName="text-[#FF5C00]"
            icon={<ChartPie className="h-[13px] w-[13px] text-[#FF5C00]" />}
            value={loading || songs.length === 0 ? "—" : `${totals.coverage.percentage}%`}
            className="bg-[#FFEADD] lg:w-[250px] lg:flex-shrink-0"
          >
            <span className="flex h-1.5 w-full overflow-hidden rounded-full bg-white/70">
              <span
                className="block h-full rounded-full bg-[#FF5C00]"
                style={{ width: `${totals.coverage.percentage}%` }}
              />
            </span>
          </Channel>
          <Channel
            label="INGRESOS"
            icon={<DollarSign className="h-[13px] w-[13px] text-[#2FB37E]" />}
            value={loading ? "—" : formatCurrency(totals.netIncome)}
            valueClassName="text-[#2FB37E] text-[24px]"
            className="lg:w-[248px] lg:flex-shrink-0"
          >
            <span className="text-[10.5px] text-[#A6AAB2]">neto acumulado</span>
          </Channel>
          <Channel
            label="STREAMS"
            icon={<Play className="h-[13px] w-[13px] text-[#71757E]" />}
            value={loading ? "—" : formatStreams(totals.streams)}
          />
          {showToPay && (
            <Channel
              label="TOTAL A PAGAR"
              icon={<Wallet className="h-[13px] w-[13px] text-[#FF5C00]" />}
              value={loading ? "—" : formatCurrency(totals.totalToPay)}
              className="lg:w-[236px] lg:flex-shrink-0"
            >
              <span className="text-[10.5px] text-[#A6AAB2]">a colaboradores</span>
            </Channel>
          )}

          <Channel
            label="TU GANANCIA"
            icon={<Crown className="h-[13px] w-[13px] text-[#FF5C00]" />}
            value={loading ? "—" : formatCurrency(totals.ownerEarnings)}
            valueClassName="text-[#FF5C00] text-[24px]"
            className="lg:w-[236px] lg:flex-shrink-0"
          >
            <span className="text-[10.5px] text-[#A6AAB2]">según tus splits</span>
          </Channel>
        </div>

        {/* Sellos que agrupa */}
        <div className="overflow-hidden rounded-[26px] border border-[#E8E8EC] bg-white shadow-[0_10px_28px_-12px_rgba(255,92,0,0.15)]">
          <div className="flex flex-wrap items-center gap-2.5 px-5 py-3.5">
            <Tag className="h-[13px] w-[13px] text-[#71757E]" />
            <span className="font-mono text-[9.5px] font-semibold tracking-[1.2px] text-[#1C1D22]">
              SELLOS QUE AGRUPA
            </span>
            <span className="rounded-[10px] bg-[#F4F5F7] px-1.5 py-px font-mono text-[10px] font-semibold text-[#71757E]">
              {artisticLabels.length}
            </span>
            <span className="hidden text-[11.5px] text-[#A6AAB2] sm:inline">
              Las métricas de arriba suman las canciones de estos sellos
            </span>
          </div>
          <div className="h-px bg-[#E8E8EC]" />

          {loading ? (
            <GroupedSkeleton />
          ) : artisticLabels.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-6 py-[50px]">
              <span className="flex h-[52px] w-[52px] items-center justify-center rounded-[18px] bg-[#F4F5F7]">
                <Tag className="h-[22px] w-[22px] text-[#71757E]" />
              </span>
              <h3 className="font-display text-base font-semibold text-[#1C1D22]">
                Este sello no agrupa nada todavía
              </h3>
              <p className="max-w-[400px] text-center text-[12.5px] text-[#71757E]">
                Edítalo desde la lista de sellos para elegir qué sellos artísticos reúne.
              </p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-[#E8E8EC]">
              {grouped.map(({ name, item }) => (
                <button
                  key={name}
                  onClick={() => navigate(`/panel/labels/${encodeURIComponent(name)}`)}
                  className="group flex items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-[#F4F5F7]"
                >
                  <span className="flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-xl bg-[#FFEADD]">
                    <Tag className="h-[15px] w-[15px] text-[#FF5C00]" />
                  </span>

                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate text-[13.5px] font-semibold text-[#1C1D22] transition-colors group-hover:text-[#FF5C00]">
                      {name}
                    </span>
                    <span className="truncate text-[11.5px] text-[#A6AAB2]">
                      {item
                        ? `${item.songCount.toLocaleString()} ${
                            item.songCount === 1 ? "canción" : "canciones"
                          } · ${formatCurrency(item.totalNetIncome)}`
                        : libraryLoading
                          ? "Cargando…"
                          : "Sin datos reportados"}
                    </span>
                  </span>

                  {item && (
                    <span className="hidden w-[180px] flex-shrink-0 sm:block">
                      <SplitCoverageMeter coverage={item.coverage} />
                    </span>
                  )}

                  <ChevronRight className="h-4 w-4 flex-shrink-0 text-[#A6AAB2]" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ChannelProps {
  label: string;
  labelClassName?: string;
  icon: React.ReactNode;
  value: string;
  valueClassName?: string;
  className?: string;
  children?: React.ReactNode;
}

function Channel({
  label,
  labelClassName = "text-[#71757E]",
  icon,
  value,
  valueClassName = "text-[#1C1D22] text-[26px]",
  className = "",
  children,
}: ChannelProps) {
  return (
    <div
      className={`flex min-w-0 flex-1 flex-col justify-center gap-2 px-6 py-[22px] ${className}`}
    >
      <div className="flex items-center gap-1.5">
        {icon}
        <span className={`font-mono text-[9.5px] font-medium tracking-[1.3px] ${labelClassName}`}>
          {label}
        </span>
      </div>
      <p className={`font-mono font-semibold leading-none tracking-tight ${valueClassName}`}>
        {value}
      </p>
      {children}
    </div>
  );
}

function GroupedSkeleton() {
  const widths = ["w-[148px]", "w-[112px]", "w-[168px]"];
  return (
    <div className="flex flex-col divide-y divide-[#E8E8EC]">
      {widths.map((width) => (
        <div key={width} className="flex items-center gap-3 px-5 py-3.5">
          <div className="h-[38px] w-[38px] flex-shrink-0 animate-pulse rounded-xl bg-[#F4F5F7]" />
          <div className="flex flex-1 flex-col gap-2">
            <div className={`h-2.5 animate-pulse rounded-full bg-[#F4F5F7] ${width}`} />
            <div className="h-2 w-[104px] animate-pulse rounded-full bg-[#F4F5F7]/70" />
          </div>
          <div className="hidden h-2.5 w-[160px] animate-pulse rounded-full bg-[#F4F5F7] sm:block" />
        </div>
      ))}
    </div>
  );
}
