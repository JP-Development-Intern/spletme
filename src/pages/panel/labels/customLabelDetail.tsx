import { useMemo, useState } from "react";
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
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import LocalStorageService from "@/services/localstorage";
import { PermissionsModal } from "@/components/music/PermissionsModal";
import { RequestEditSplitButton } from "@/components/music/RequestEditSplitButton";
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
  const [permissionsOpen, setPermissionsOpen] = useState(false);

  const currentUser = LocalStorageService.getItem("user");
  const userRole = String(currentUser?.role ?? "").toLowerCase();
  const isOwnerAccount =
    !currentUser?.parentUserId && userRole !== "label" && userRole !== "collaborator";
  const isLabelAccount = userRole === "label";
  const canLabelEditSplits = Boolean(
    (customLabel as { canEditSplits?: boolean } | null)?.canEditSplits,
  );

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

  // Cada sello artístico del personalizado, cruzado por id con la lista.
  const grouped = useMemo(
    () =>
      artisticLabels.map((sello) => ({
        id: sello._id,
        name: sello.name,
        item: artisticItems.find((candidate) => candidate.id === sello._id) ?? null,
      })),
    [artisticLabels, artisticItems],
  );

  return (
    <div className="flex flex-col gap-5 px-4 lg:pl-4 lg:pr-8">
      {/* Migas */}
      <nav aria-label="Ruta" className="flex items-center gap-2.5">
        <button
          onClick={() => navigate("/panel/labels")}
          aria-label="Volver a Sellos"
          className="glass-control flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/[0.12] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <Link
          to="/panel/labels"
          className="text-[12.5px] font-medium text-white/50 transition-colors hover:text-white/80"
        >
          Sellos
        </Link>
        <ChevronRight className="h-[13px] w-[13px] text-white/40" />
        <span className="truncate text-[12.5px] font-semibold text-white">
          {decodedLabel || "Sin sello"}
        </span>
      </nav>

      {/* Identidad */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-[18px] bg-[#FF5C00] shadow-[0_12px_28px_-10px_rgba(255,92,0,0.6)]">
            <Layers className="h-6 w-6 text-white" />
          </span>
          <div className="flex min-w-0 flex-col gap-1.5">
            <h1 className="truncate font-display text-[26px] font-light leading-[1.15] tracking-[-0.015em] text-white sm:text-[34px]">
              {decodedLabel || "Sin sello"}
            </h1>
            <p className="flex flex-wrap items-center gap-2 text-[12.5px] text-white/65">
              <span className="flex items-center gap-1.5 rounded-full bg-[#FF5C00]/[0.16] px-2.5 py-0.5 text-[11px] font-semibold text-[#FF9A5C]">
                <Layers className="h-[11px] w-[11px]" />
                Personalizado
              </span>
              <span>
                Agrupa {artisticLabels.length}{" "}
                {artisticLabels.length === 1 ? "sello artístico" : "sellos artísticos"}
              </span>
              <span className="text-white/40">·</span>
              <span>
                {songs.length} {songs.length === 1 ? "canción" : "canciones"}
              </span>
            </p>
          </div>
        </div>
        {isOwnerAccount && customLabel?._id && (
          <button
            onClick={() => setPermissionsOpen(true)}
            className="glass-control flex items-center gap-2 rounded-full px-[18px] py-2.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-white/[0.14]"
          >
            <ShieldCheck className="h-[15px] w-[15px] text-[#FF8A3D]" />
            Permisos
          </button>
        )}
        {isLabelAccount && !canLabelEditSplits && customLabel?._id && (
          <RequestEditSplitButton
            resourceType="customLabel"
            resourceId={customLabel._id}
          />
        )}
      </div>

      {error && (
        <div className="glass flex items-center gap-2.5 rounded-2xl px-4 py-3">
          <TriangleAlert className="h-4 w-4 flex-shrink-0 text-[#FF8F92]" />
          <span className="flex-1 text-[12.5px] text-white/80">{error}</span>
          <button
            onClick={loadSongs}
            className="glass-control rounded-full px-3.5 py-1.5 text-[11.5px] font-semibold text-white hover:bg-white/[0.12]"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Consola de métricas: la cobertura es lo accionable y va teñida de brasa */}
      <div className="glass flex flex-col gap-1.5 rounded-[28px] p-1.5 lg:flex-row lg:items-stretch lg:gap-0">
        <Channel
          label="Canciones"
          icon={<Music className="h-[15px] w-[15px] text-white" />}
          value={loading ? "—" : songs.length.toLocaleString()}
        >
          <span className="text-xs text-white/50">{totals.coverage.withSplits} con split</span>
        </Channel>
        <Channel
          label="Cobertura de splits"
          labelClassName="text-[#FFB48A]"
          iconClassName="bg-[#FF5C00]/[0.22]"
          icon={<ChartPie className="h-[15px] w-[15px] text-[#FF8A3D]" />}
          value={loading || songs.length === 0 ? "—" : `${totals.coverage.percentage}%`}
          className="rounded-[22px] border border-[#FF8A3D]/30 bg-[#FF5C00]/[0.14] lg:w-[250px] lg:flex-shrink-0"
        >
          <span className="mt-1 flex h-1.5 w-full overflow-hidden rounded-full bg-white/[0.12]">
            <span
              className="block h-full rounded-full bg-[#FF5C00]"
              style={{ width: `${totals.coverage.percentage}%` }}
            />
          </span>
        </Channel>
        <Channel
          label="Ingresos"
          icon={<DollarSign className="h-[15px] w-[15px] text-white" />}
          value={loading ? "—" : formatCurrency(totals.netIncome)}
          valueClassName="text-[#45D39A] text-[26px]"
          className="lg:w-[248px] lg:flex-shrink-0"
        >
          <span className="text-xs text-white/50">neto acumulado</span>
        </Channel>
        <Channel
          label="Streams"
          icon={<Play className="h-[15px] w-[15px] text-white" />}
          value={loading ? "—" : formatStreams(totals.streams)}
          divided
        />
        {showToPay && (
          <Channel
            label="Total a pagar"
            icon={<Wallet className="h-[15px] w-[15px] text-white" />}
            value={loading ? "—" : formatCurrency(totals.totalToPay)}
            className="lg:w-[236px] lg:flex-shrink-0"
            divided
          >
            <span className="text-xs text-white/50">a colaboradores</span>
          </Channel>
        )}

        <Channel
          label="Tu ganancia"
          icon={<Crown className="h-[15px] w-[15px] text-white" />}
          value={loading ? "—" : formatCurrency(totals.ownerEarnings)}
          valueClassName="text-[#FF8A3D] text-[26px]"
          className="lg:w-[236px] lg:flex-shrink-0"
          divided
        >
          <span className="text-xs text-white/50">según tus splits</span>
        </Channel>
      </div>

      {/* Sellos que agrupa */}
      <div className="glass overflow-hidden rounded-[28px]">
        <div className="flex flex-wrap items-center gap-2.5 px-5 py-3.5">
          <Tag className="h-[13px] w-[13px] text-white/60" />
          <span className="font-mono text-[9.5px] font-semibold tracking-[1.2px] text-white/80">
            SELLOS QUE AGRUPA
          </span>
          <span className="rounded-full bg-white/[0.10] px-1.5 py-px font-mono text-[10px] font-semibold text-white/70">
            {artisticLabels.length}
          </span>
          <span className="hidden text-[11.5px] text-white/50 sm:inline">
            Las métricas de arriba suman las canciones de estos sellos
          </span>
        </div>
        <div className="h-px bg-white/[0.09]" />

        {loading ? (
          <GroupedSkeleton />
        ) : artisticLabels.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-[50px]">
            <span className="flex h-[52px] w-[52px] items-center justify-center rounded-[18px] bg-white/[0.08]">
              <Tag className="h-[22px] w-[22px] text-white/65" />
            </span>
            <h3 className="font-display text-base font-medium text-white">
              Este sello no agrupa nada todavía
            </h3>
            <p className="max-w-[400px] text-center text-[12.5px] text-white/65">
              Edítalo desde la lista de sellos para elegir qué sellos artísticos reúne.
            </p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-white/[0.09]">
            {grouped.map(({ id, name, item }) => (
              <button
                key={id}
                onClick={() => navigate(`/panel/labels/${encodeURIComponent(id)}`)}
                className="group flex items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#FF5C00]/70"
              >
                <span className="flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-xl bg-[#FF5C00]/[0.16]">
                  <Tag className="h-[15px] w-[15px] text-[#FF8A3D]" />
                </span>

                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-[13.5px] font-semibold text-white transition-colors group-hover:text-[#FFB067]">
                    {name}
                  </span>
                  <span className="truncate text-[11.5px] text-white/50">
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
                    <SplitCoverageMeter coverage={item.coverage} onGlass />
                  </span>
                )}

                <ChevronRight className="h-4 w-4 flex-shrink-0 text-white/40" />
              </button>
            ))}
          </div>
        )}
      </div>

      {permissionsOpen && customLabel?._id && (
        <PermissionsModal
          resourceType="customLabel"
          resourceId={customLabel._id}
          title={customLabel.name || decodedLabel}
          onClose={() => setPermissionsOpen(false)}
        />
      )}
    </div>
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

/** Canal de la consola, con la misma anatomía que la de Música y los demás detalles. */
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
        <p className={`truncate font-mono font-light leading-[1.1] tracking-[-0.015em] ${valueClassName}`}>
          {value}
        </p>
        {children}
      </div>
    </div>
  );
}

function GroupedSkeleton() {
  const widths = ["w-[148px]", "w-[112px]", "w-[168px]"];
  return (
    <div className="flex flex-col divide-y divide-white/[0.09]" aria-busy="true" aria-label="Cargando sellos agrupados">
      {widths.map((width) => (
        <div key={width} className="flex items-center gap-3 px-5 py-3.5">
          <div className="h-[38px] w-[38px] flex-shrink-0 animate-pulse rounded-xl bg-white/[0.08]" />
          <div className="flex flex-1 flex-col gap-2">
            <div className={`h-2.5 animate-pulse rounded-full bg-white/[0.08] ${width}`} />
            <div className="h-2 w-[104px] animate-pulse rounded-full bg-white/[0.05]" />
          </div>
          <div className="hidden h-2.5 w-[160px] animate-pulse rounded-full bg-white/[0.08] sm:block" />
        </div>
      ))}
    </div>
  );
}
