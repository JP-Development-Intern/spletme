import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ChevronRight,
  Search,
  SearchX,
  Music,
  Play,
  DollarSign,
  Crown,
  Wallet,
  ChartPie,
  Tag,
  TriangleAlert,
  ArrowUp,
  ArrowDown,
  Users,
  UserPlus,
} from "lucide-react";
import { useLabelSongs } from "@/hooks/useLabels";
import { toCoverage, pendingToPay } from "@/hooks/useLabelsLibrary";
import { formatCurrency, formatStreams } from "@/utils/format.utils";
import { SplitCoverageMeter } from "@/components/labels/SplitCoverageMeter";
import { CopyButton } from "@/components/ui/CopyButton";
import type { LabelSong } from "@/services/labels";
import CreateSplitsByLabelModal from "@/components/modal/CreateSplitsByLabelModal";
import InviteCollaboratorToLabelModal from "@/components/labels/InviteCollaboratorToLabelModal";
import BulkCollaboratorSplitModal from "@/components/splits/BulkCollaboratorSplitModal";
import { viewerOwnsSong, viewerOwnsAllSongs } from "@/utils/ownerVisibility";

type SongSortBy = "income_desc" | "income_asc" | "title_asc" | "streams_desc" | "owner_desc";

const SORT_LABELS: Record<SongSortBy, string> = {
  income_desc: "Mayores ingresos",
  income_asc: "Menores ingresos",
  title_asc: "Título (A–Z)",
  streams_desc: "Más streams",
  owner_desc: "Mayor ganancia",
};

/**
 * Rejilla de la tabla de canciones del sello. La canción absorbe el ancho
 * sobrante; el resto de columnas van apareciendo conforme cabe la pantalla.
 */
const SONGS_GRID =
  "grid items-center gap-3 grid-cols-[minmax(0,1fr)_124px_40px] " +
  "md:grid-cols-[minmax(0,1fr)_104px_124px_40px] " +
  "lg:grid-cols-[minmax(0,1fr)_150px_104px_124px_124px_100px_40px]";

const COLUMNS = [
  { key: "isrc", label: "ISRC", visibility: "hidden lg:flex", sort: null },
  { key: "streams", label: "STREAMS", visibility: "hidden md:flex", sort: "streams_desc" },
  { key: "income", label: "INGRESOS", visibility: "flex", sort: "income_desc" },
  { key: "owner", label: "TU GANANCIA", visibility: "hidden lg:flex", sort: "owner_desc" },
  { key: "split", label: "TU SPLIT", visibility: "hidden lg:flex", sort: null },
] as const;

const visibility = (key: string) => COLUMNS.find((column) => column.key === key)!.visibility;

export default function LabelDetail() {
  const { label } = useParams<{ label: string }>();
  const navigate = useNavigate();
  const decodedLabel = decodeURIComponent(label ?? "");
  const { songs, loading, error, loadSongs } = useLabelSongs(label ?? "");

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SongSortBy>("income_desc");
  const [ownerSplitOpen, setOwnerSplitOpen] = useState(false);
  const [collabSplitOpen, setCollabSplitOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

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

  /** Las canciones del sello, en la forma común de los repartos en bloque. */
  const splitTracks = useMemo(
    () =>
      songs.map((song) => ({
        _id: song._id,
        trackTitle: song.trackTitle,
        hasOwnerSplit: Boolean(song.ownerSplit),
        collaborators: song.collaborators ?? [],
      })),
    [songs],
  );

  const visibleSongs = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = query
      ? songs.filter(
          (song) =>
            song.trackTitle?.toLowerCase().includes(query) ||
            song.artistName?.toLowerCase().includes(query) ||
            song.isrc?.toLowerCase().includes(query),
        )
      : [...songs];

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "title_asc":
          return (a.trackTitle ?? "").localeCompare(b.trackTitle ?? "", "es");
        case "streams_desc":
          return (b.totalStreams ?? 0) - (a.totalStreams ?? 0);
        case "income_asc":
          return (a.totalNetIncome ?? 0) - (b.totalNetIncome ?? 0);
        case "owner_desc":
          return (b.ownerEarnings ?? 0) - (a.ownerEarnings ?? 0);
        case "income_desc":
        default:
          return (b.totalNetIncome ?? 0) - (a.totalNetIncome ?? 0);
      }
    });
  }, [songs, search, sortBy]);

  const toggleSort = (next: SongSortBy) => {
    // Solo ingresos alterna sentido: en el resto una segunda pulsación no
    // aporta una lectura distinta.
    if (next === "income_desc" && sortBy === "income_desc") setSortBy("income_asc");
    else setSortBy(next);
  };

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
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="flex min-w-0 items-center gap-4">
            <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-[18px] bg-[#FFEADD]">
              <Tag className="h-6 w-6 text-[#FF5C00]" />
            </span>
            <div className="flex min-w-0 flex-col gap-1">
              <h1 className="truncate font-display text-2xl font-semibold text-[#1C1D22]">
                {decodedLabel || "Sin sello"}
              </h1>
              <p className="flex flex-wrap items-center gap-2 text-[12.5px] text-[#71757E]">
                <span className="flex items-center gap-1.5 rounded-[10px] bg-[#F4F5F7] px-2 py-0.5 text-[11px] font-medium">
                  <Tag className="h-[11px] w-[11px]" />
                  Sello artístico
                </span>
                {songs[0]?.artistName && (
                  <>
                    <span>{songs[0].artistName}</span>
                    <span className="text-[#A6AAB2]">·</span>
                  </>
                )}
                <span>
                  {songs.length} {songs.length === 1 ? "canción" : "canciones"}
                </span>
              </p>
            </div>
          </div>

          {/* Las tres acciones que tratan al sello como un todo. Invitar y
              repartir a un colaborador son secundarias; la parte del owner es
              lo que hay que hacer primero y lo que más se repite. */}
          <div className="flex flex-wrap items-center gap-2.5 lg:ml-auto">
            <button
              onClick={() => setCollabSplitOpen(true)}
              disabled={songs.length === 0}
              className="flex items-center gap-2 rounded-[22px] border border-[#E8E8EC] bg-white px-[18px] py-3 text-[12.5px] font-semibold text-[#1C1D22] transition-colors enabled:hover:bg-[#F4F5F7] disabled:cursor-not-allowed disabled:text-[#A6AAB2]"
            >
              <Users className="h-[15px] w-[15px] text-[#71757E]" />
              Split de colaborador
            </button>
            <button
              onClick={() => setInviteOpen(true)}
              disabled={songs.length === 0}
              className="flex items-center gap-2 rounded-[22px] border border-[#E8E8EC] bg-white px-[18px] py-3 text-[12.5px] font-semibold text-[#1C1D22] transition-colors enabled:hover:bg-[#F4F5F7] disabled:cursor-not-allowed disabled:text-[#A6AAB2]"
            >
              <UserPlus className="h-[15px] w-[15px] text-[#71757E]" />
              Invitar al sello
            </button>
            <button
              onClick={() => setOwnerSplitOpen(true)}
              disabled={songs.length === 0}
              className="flex items-center gap-2 rounded-[22px] bg-[#FF5C00] px-[18px] py-3 text-[12.5px] font-semibold text-white shadow-[0_6px_16px_-4px_rgba(255,92,0,0.4)] transition-colors enabled:hover:bg-[#EA580C] disabled:cursor-not-allowed disabled:bg-[#F4F5F7] disabled:text-[#A6AAB2] disabled:shadow-none"
            >
              <Crown className="h-[15px] w-[15px]" />
              Tu split del sello
            </button>
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

        {/* Buscador y orden */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-[320px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A6AAB2]" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por título, artista o ISRC…"
              className="w-full rounded-[22px] border border-[#E8E8EC] bg-white py-2.5 pl-11 pr-4 text-[12.5px] text-[#1C1D22] placeholder:text-[#A6AAB2] focus:border-[#FF5C00] focus:outline-none focus:ring-[3px] focus:ring-[#FF5C00]/15"
            />
          </div>
          <div className="ml-auto flex items-center gap-2 rounded-full border border-[#E8E8EC] bg-white px-3.5 py-2">
            <span className="text-[12px] text-[#A6AAB2]">Orden</span>
            <select
              aria-label="Ordenar canciones"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SongSortBy)}
              className="cursor-pointer bg-transparent text-[12.5px] font-semibold text-[#1C1D22] focus:outline-none"
            >
              {Object.entries(SORT_LABELS).map(([value, optionLabel]) => (
                <option key={value} value={value}>
                  {optionLabel}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabla */}
        {loading ? (
          <SongsSkeleton />
        ) : songs.length === 0 ? (
          <EmptyState
            title="Este sello no tiene canciones"
            text="Aparecerán aquí en cuanto tus distribuidoras reporten canciones con este sello."
          />
        ) : visibleSongs.length === 0 ? (
          <EmptyState
            title={`Ninguna canción coincide con «${search}»`}
            text="Prueba con otro título, artista o ISRC."
            action={
              <button
                onClick={() => setSearch("")}
                className="rounded-2xl border border-[#E8E8EC] bg-white px-4 py-2.5 text-[12.5px] font-semibold text-[#1C1D22] transition-colors hover:bg-[#F4F5F7]"
              >
                Borrar búsqueda
              </button>
            }
          />
        ) : (
          <div className="overflow-hidden rounded-[26px] border border-[#E8E8EC] bg-white shadow-[0_10px_28px_-12px_rgba(255,92,0,0.15)]">
            <div className={`${SONGS_GRID} px-5 py-3`}>
              <div className="flex min-w-0">
                <ColumnButton
                  label="CANCIÓN"
                  active={sortBy === "title_asc"}
                  descending={false}
                  onClick={() => setSortBy("title_asc")}
                />
              </div>
              {COLUMNS.map((column) => (
                <div key={column.key} className={column.visibility}>
                  {column.sort ? (
                    <ColumnButton
                      label={column.label}
                      active={
                        sortBy === column.sort ||
                        (column.sort === "income_desc" && sortBy === "income_asc")
                      }
                      descending={sortBy !== "income_asc"}
                      onClick={() => toggleSort(column.sort as SongSortBy)}
                    />
                  ) : (
                    <ColumnLabel>{column.label}</ColumnLabel>
                  )}
                </div>
              ))}
              <div />
            </div>
            <div className="h-px bg-[#E8E8EC]" />
            <div className="flex flex-col divide-y divide-[#E8E8EC]">
              {visibleSongs.map((song) => (
                <SongRow key={song._id} song={song} />
              ))}
            </div>
            <div className="h-px bg-[#E8E8EC]" />
            <div className="flex flex-wrap items-center gap-3 px-5 py-3.5">
              <span className="text-[12px] text-[#71757E]">
                {visibleSongs.length}
                {visibleSongs.length === songs.length ? "" : ` de ${songs.length}`}{" "}
                {visibleSongs.length === 1 ? "canción" : "canciones"}
              </span>
              <div className="ml-auto hidden sm:block">
                <SplitCoverageMeter coverage={totals.coverage} variant="inline" />
              </div>
            </div>
          </div>
        )}
      </div>

      {ownerSplitOpen && (
        <CreateSplitsByLabelModal
          isOpen={ownerSplitOpen}
          onClose={() => {
            setOwnerSplitOpen(false);
            loadSongs();
          }}
          label={decodedLabel}
          songCount={songs.length}
          alreadyWithSplit={totals.coverage.withSplits}
        />
      )}

      {inviteOpen && (
        <InviteCollaboratorToLabelModal
          isOpen={inviteOpen}
          onClose={() => setInviteOpen(false)}
          labelType="artistic"
          labelIdentifier={decodedLabel}
          labelName={decodedLabel}
          songCount={songs.length}
          onSuccess={loadSongs}
        />
      )}

      {collabSplitOpen && (
        <BulkCollaboratorSplitModal
          isOpen={collabSplitOpen}
          showOwnerContext={splitTracks.some((track) => viewerOwnsSong(track))}
          onClose={() => setCollabSplitOpen(false)}
          name={decodedLabel}
          context="Sello artístico"
          logo={
            <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[14px] bg-[#FFEADD]">
              <Tag className="h-[19px] w-[19px] text-[#FF5C00]" />
            </span>
          }
          tracks={splitTracks}
          unit={{ one: "canción", many: "canciones" }}
          scopeNoun="sello"
          onSplitsCreated={loadSongs}
          onAssignOwnerSplit={() => {
            setCollabSplitOpen(false);
            setOwnerSplitOpen(true);
          }}
          onInvite={() => {
            setCollabSplitOpen(false);
            setInviteOpen(true);
          }}
        />
      )}
    </div>
  );
}

/** Fila de canción. Lleva a su ficha; el ISRC se copia sin salir de la tabla. */
function SongRow({ song }: { song: LabelSong }) {
  const navigate = useNavigate();
  const cover = song.spotifyData?.album?.images?.[0]?.url;
  const percentage = song.ownerSplit?.percentage ?? null;

  return (
    <div
      onClick={() => navigate(`/panel/song/${song._id}`)}
      className={`${SONGS_GRID} group cursor-pointer px-5 py-3 transition-colors hover:bg-[#F4F5F7]`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center overflow-hidden rounded-[13px] bg-[#F4F5F7]">
          {cover ? (
            <img src={cover} alt="" className="h-full w-full object-cover" />
          ) : (
            <Music className="h-4 w-4 text-[#A6AAB2]" />
          )}
        </span>
        <div className="flex min-w-0 flex-col gap-0.5">
          <span
            title={song.trackTitle}
            className="truncate text-[13.5px] font-semibold text-[#1C1D22] transition-colors group-hover:text-[#FF5C00]"
          >
            {song.trackTitle}
          </span>
          <span className="truncate text-[11.5px] text-[#A6AAB2]">{song.artistName}</span>
        </div>
      </div>

      <div className={`${visibility("isrc")} min-w-0 items-center gap-1.5`}>
        <span className="truncate font-mono text-[10.5px] text-[#71757E]">{song.isrc || "—"}</span>
        {song.isrc && (
          <span onClick={(e) => e.stopPropagation()}>
            <CopyButton value={song.isrc} title="Copiar ISRC" />
          </span>
        )}
      </div>

      <div className={`${visibility("streams")} items-center gap-1.5`}>
        <Play className="h-[11px] w-[11px] text-[#A6AAB2]" />
        <span className="font-mono text-[11.5px] text-[#71757E]">
          {formatStreams(song.totalStreams ?? 0)}
        </span>
      </div>

      <div className={visibility("income")}>
        <span className="font-mono text-[13px] font-semibold text-[#2FB37E]">
          {formatCurrency(song.totalNetIncome ?? 0)}
        </span>
      </div>

      <div className={visibility("owner")}>
        <span className="font-mono text-[13px] font-semibold text-[#FF5C00]">
          {formatCurrency(song.ownerEarnings ?? 0)}
        </span>
      </div>

      <div className={visibility("split")}>
        {percentage !== null ? (
          <span className="rounded-[14px] bg-[#FFEADD] px-2.5 py-1 font-mono text-[11.5px] font-semibold text-[#FF5C00]">
            {percentage}%
          </span>
        ) : (
          <span className="rounded-[14px] bg-[#F4F5F7] px-2.5 py-1 text-[11.5px] font-semibold text-[#A6AAB2]">
            Sin split
          </span>
        )}
      </div>

      <div className="flex justify-end">
        <ChevronRight className="h-4 w-4 text-[#A6AAB2]" />
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

function ColumnButton({
  label,
  active,
  descending,
  onClick,
}: {
  label: string;
  active: boolean;
  descending: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 transition-colors ${
        active ? "text-[#FF5C00]" : "text-[#A6AAB2] hover:text-[#71757E]"
      }`}
    >
      <span className="font-mono text-[9.5px] font-medium tracking-[1.2px]">{label}</span>
      {active && (descending ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />)}
    </button>
  );
}

function ColumnLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[9.5px] font-medium tracking-[1.2px] text-[#A6AAB2]">
      {children}
    </span>
  );
}

function SongsSkeleton() {
  const widths = ["w-[168px]", "w-[128px]", "w-[184px]", "w-[146px]", "w-[112px]"];
  return (
    <div className="overflow-hidden rounded-[26px] border border-[#E8E8EC] bg-white">
      <div className={`${SONGS_GRID} px-5 py-3`}>
        <div className="min-w-0">
          <ColumnLabel>CANCIÓN</ColumnLabel>
        </div>
        {COLUMNS.map((column) => (
          <div key={column.key} className={column.visibility}>
            <ColumnLabel>{column.label}</ColumnLabel>
          </div>
        ))}
        <div />
      </div>
      <div className="h-px bg-[#E8E8EC]" />
      <div className="flex flex-col divide-y divide-[#E8E8EC]">
        {widths.map((width) => (
          <div key={width} className={`${SONGS_GRID} px-5 py-3.5`}>
            <div className="flex min-w-0 items-center gap-3">
              <div className="h-[42px] w-[42px] flex-shrink-0 animate-pulse rounded-[13px] bg-[#F4F5F7]" />
              <div className="flex flex-1 flex-col gap-2">
                <div className={`h-2.5 animate-pulse rounded-full bg-[#F4F5F7] ${width}`} />
                <div className="h-2 w-[92px] animate-pulse rounded-full bg-[#F4F5F7]/70" />
              </div>
            </div>
            {COLUMNS.map((column) => (
              <div key={column.key} className={column.visibility}>
                <div className="h-2.5 w-[70%] animate-pulse rounded-full bg-[#F4F5F7]" />
              </div>
            ))}
            <div />
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[26px] border border-[#E8E8EC] bg-white px-6 py-[50px]">
      <div className="flex h-[52px] w-[52px] items-center justify-center rounded-[18px] bg-[#F4F5F7]">
        <SearchX className="h-[22px] w-[22px] text-[#71757E]" />
      </div>
      <h3 className="text-center font-display text-base font-semibold text-[#1C1D22]">{title}</h3>
      <p className="max-w-[420px] text-center text-[12.5px] text-[#71757E]">{text}</p>
      {action && <div className="pt-1.5">{action}</div>}
    </div>
  );
}
