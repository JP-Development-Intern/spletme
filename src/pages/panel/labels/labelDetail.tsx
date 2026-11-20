import { useEffect, useMemo, useState } from "react";
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
  ShieldCheck,
  Users,
  UserPlus,
} from "lucide-react";
import LocalStorageService from "@/services/localstorage";
import { PermissionsModal } from "@/components/music/PermissionsModal";
import { useLabelSongs } from "@/hooks/useLabels";
import { toCoverage, pendingToPay } from "@/hooks/useLabelsLibrary";
import { formatCurrency, formatStreams } from "@/utils/format.utils";
import { SplitCoverageMeter } from "@/components/labels/SplitCoverageMeter";
import { CopyButton } from "@/components/ui/CopyButton";
import { SongCollaboratorsCell } from "@/components/labels/SongCollaboratorsCell";
import { personName } from "@/utils/collaborators.utils";
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
 *
 * Colaboradores entra en cuanto hay sitio (md), justo después de la canción:
 * quién cobra de ella pesa más que su ISRC, que pasa a verse solo en xl. En
 * móvil el número de colaboradores viaja bajo el título.
 */
const SONGS_GRID =
  "grid items-center gap-3 grid-cols-[minmax(0,1fr)_124px_40px] " +
  "md:grid-cols-[minmax(0,1fr)_170px_104px_124px_40px] " +
  "lg:grid-cols-[minmax(0,1fr)_170px_104px_124px_124px_100px_40px] " +
  "xl:grid-cols-[minmax(0,1fr)_190px_150px_104px_124px_124px_100px_40px]";

const COLUMNS = [
  { key: "collaborators", label: "COLABORADORES", visibility: "hidden md:flex", sort: null },
  { key: "isrc", label: "ISRC", visibility: "hidden xl:flex", sort: null },
  { key: "streams", label: "STREAMS", visibility: "hidden md:flex", sort: "streams_desc" },
  { key: "income", label: "INGRESOS", visibility: "flex", sort: "income_desc" },
  { key: "owner", label: "TU GANANCIA", visibility: "hidden lg:flex", sort: "owner_desc" },
  { key: "split", label: "TU SPLIT", visibility: "hidden lg:flex", sort: null },
] as const;

const visibility = (key: string) => COLUMNS.find((column) => column.key === key)!.visibility;

export default function LabelDetail() {
  const { label } = useParams<{ label: string }>();
  const navigate = useNavigate();
  // El parámetro es el id del sello. Los enlaces antiguos llevaban su nombre: el
  // servidor acepta los dos y aquí se pasa a la URL con id en cuanto se conoce.
  const decodedLabel = decodeURIComponent(label ?? "");
  const urlIsId = /^[a-f0-9]{24}$/i.test(decodedLabel);
  const { songs, artisticLabel, loading, error, loadSongs } = useLabelSongs(label ?? "");
  // Id, nombre y número de canciones del sello, de `artistic_labels`. Mientras
  // no llega, el nombre de la URL si era un enlace antiguo; si era un id, nada.
  const labelId = artisticLabel?._id ?? decodedLabel;
  const labelName = artisticLabel?.name ?? (urlIsId ? "" : decodedLabel);
  const songCount = artisticLabel?.totalTracks ?? songs.length;

  useEffect(() => {
    if (artisticLabel && artisticLabel._id !== decodedLabel) {
      navigate(`/panel/labels/${artisticLabel._id}`, { replace: true });
    }
  }, [artisticLabel, decodedLabel, navigate]);

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SongSortBy>("income_desc");
  const [ownerSplitOpen, setOwnerSplitOpen] = useState(false);
  const [collabSplitOpen, setCollabSplitOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [permissionsOpen, setPermissionsOpen] = useState(false);

  const currentUser = LocalStorageService.getItem("user");
  const userRole = String(currentUser?.role ?? "").toLowerCase();
  const isOwnerAccount =
    !currentUser?.parentUserId && userRole !== "label" && userRole !== "collaborator";

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
      // Streams e ingresos del sello salen de su documento en `artistic_labels`;
      // la ganancia, lo pendiente y la cobertura dependen de cada canción.
      streams: artisticLabel?.totalStreams ?? streams,
      netIncome: artisticLabel?.totalNetIncome ?? netIncome,
      ownerEarnings,
      totalToPay,
      coverage: toCoverage(songs.length, withSplits, false),
    };
  }, [songs, artisticLabel]);

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
            song.isrc?.toLowerCase().includes(query) ||
            // Buscar a una persona deja a la vista las canciones en las que está.
            (song.collaborators ?? []).some((c) => personName(c).toLowerCase().includes(query)),
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
    <>
      <div className="flex flex-col gap-5 px-4 lg:pl-4 lg:pr-8">
        {/* Migas */}
        <nav aria-label="Ruta" className="flex items-center gap-2.5">
          <button
            onClick={() => navigate("/panel/labels")}
            aria-label="Volver a Sellos"
            className="glass-control flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/[0.12] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70"
          >
            <ArrowLeft className="h-[15px] w-[15px]" />
          </button>
          <Link
            to="/panel/labels"
            className="text-[12.5px] font-medium text-white/50 transition-colors hover:text-white/80"
          >
            Sellos
          </Link>
          <ChevronRight className="h-[13px] w-[13px] text-white/40" />
          <span className="truncate text-[12.5px] font-semibold text-white">
            {labelName || (loading ? "" : "Sin sello")}
          </span>
        </nav>

        {/* Identidad */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="flex min-w-0 items-center gap-4">
            <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-[18px] bg-[#FF5C00]/[0.16] ring-1 ring-[#FF8A3D]/30">
              <Tag className="h-6 w-6 text-[#FF8A3D]" />
            </span>
            <div className="flex min-w-0 flex-col gap-1.5">
              <h1 className="truncate font-display text-[26px] font-light leading-[1.15] tracking-[-0.015em] text-white sm:text-[34px]">
                {labelName || (loading ? "" : "Sin sello")}
              </h1>
              <p className="flex flex-wrap items-center gap-2 text-[12.5px] text-white/65">
                <span className="flex items-center gap-1.5 rounded-full bg-white/[0.08] px-2.5 py-1 text-[11px] font-medium text-white/70">
                  <Tag className="h-[11px] w-[11px]" />
                  Sello artístico
                </span>
                {songs[0]?.artistName && (
                  <>
                    <span>{songs[0].artistName}</span>
                    <span className="text-white/40">·</span>
                  </>
                )}
                <span>
                  {songCount} {songCount === 1 ? "canción" : "canciones"}
                </span>
              </p>
            </div>
          </div>

          {/* Las tres acciones que tratan al sello como un todo. Invitar y
              repartir a un colaborador son secundarias; la parte del owner es
              lo que hay que hacer primero y lo que más se repite. */}
          <div className="flex flex-wrap items-center gap-2.5 lg:ml-auto">
            {isOwnerAccount && (
              <button
                onClick={() => setPermissionsOpen(true)}
                disabled={songs.length === 0}
                className="flex items-center gap-2 rounded-[22px] border border-[#E8E8EC] bg-white px-[18px] py-3 text-[12.5px] font-semibold text-[#1C1D22] transition-colors enabled:hover:bg-[#F4F5F7] disabled:cursor-not-allowed disabled:text-[#A6AAB2]"
              >
                <ShieldCheck className="h-[15px] w-[15px] text-[#71757E]" />
                Permisos
              </button>
            )}
            <button
              onClick={() => setCollabSplitOpen(true)}
              disabled={songs.length === 0}
              className="glass-control flex min-h-[44px] items-center gap-2 rounded-full px-[18px] py-[11px] text-[12.5px] font-semibold text-white transition-colors enabled:hover:bg-white/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70 disabled:cursor-not-allowed disabled:text-white/40"
            >
              <Users className="h-[15px] w-[15px] text-white/70" />
              Split de colaborador
            </button>
            <button
              onClick={() => setInviteOpen(true)}
              disabled={songs.length === 0}
              className="glass-control flex min-h-[44px] items-center gap-2 rounded-full px-[18px] py-[11px] text-[12.5px] font-semibold text-white transition-colors enabled:hover:bg-white/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70 disabled:cursor-not-allowed disabled:text-white/40"
            >
              <UserPlus className="h-[15px] w-[15px] text-white/70" />
              Invitar al sello
            </button>
            <button
              onClick={() => setOwnerSplitOpen(true)}
              disabled={songs.length === 0}
              className="flex min-h-[44px] items-center gap-2 px-[18px] py-[11px] rounded-full bg-[#FF5C00] text-[12.5px] font-semibold text-white shadow-[0_8px_20px_-6px_rgba(255,92,0,0.35)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 enabled:hover:bg-[#EA580C] disabled:cursor-not-allowed disabled:bg-white/[0.08] disabled:text-white/40 disabled:shadow-none"
            >
              <Crown className="h-[15px] w-[15px]" />
              Tu split del sello
            </button>
          </div>
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

        {/* Consola de métricas */}
        <div className="glass flex flex-col gap-1.5 rounded-[28px] p-1.5 lg:flex-row lg:items-stretch lg:gap-0">
          <Channel
            label="Canciones"
            icon={<Music className="h-[15px] w-[15px] text-white" />}
            value={loading ? "—" : songCount.toLocaleString()}
          >
            <span className="text-xs text-white/50">
              {totals.coverage.withSplits} con split
            </span>
          </Channel>
          {/* Lo único accionable de la consola: va teñido de brasa */}
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
              valueClassName="text-white text-[26px]"
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

        {/* Buscador y orden */}
        <div className="flex flex-wrap items-center gap-3">
          <label className="glass-control relative flex w-full items-center gap-2.5 rounded-full px-[18px] py-[11px] focus-within:ring-2 focus-within:ring-[#FF5C00]/70 sm:w-[320px]">
            <Search className="h-4 w-4 flex-shrink-0 text-white/50" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por título, artista, ISRC o colaborador…"
              aria-label="Buscar por título, artista, ISRC o colaborador"
              className="w-full border-none bg-transparent p-0 text-[12.5px] text-white placeholder:text-white/50 focus:outline-none focus:ring-0"
            />
          </label>
          <div className="glass-control ml-auto flex min-h-[44px] items-center gap-2 rounded-full px-[15px] focus-within:ring-2 focus-within:ring-[#FF5C00]/70">
            <span className="text-[12px] text-white/50">Orden</span>
            <select
              aria-label="Ordenar canciones"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SongSortBy)}
              className="cursor-pointer border-none bg-transparent py-0 pl-0 text-[12.5px] font-semibold text-white focus:outline-none focus:ring-0"
            >
              {Object.entries(SORT_LABELS).map(([value, optionLabel]) => (
                <option key={value} value={value} className="bg-[#2B1E17] text-white">
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
                className="glass-control rounded-full px-4 py-2.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-white/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70"
              >
                Borrar búsqueda
              </button>
            }
          />
        ) : (
          <div className="glass overflow-hidden rounded-[28px]">
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
            <div className="h-px bg-white/[0.09]" />
            <div className="flex flex-col divide-y divide-white/[0.09]">
              {visibleSongs.map((song) => (
                <SongRow key={song._id} song={song} />
              ))}
            </div>
            <div className="h-px bg-white/[0.09]" />
            <div className="flex flex-wrap items-center gap-3 px-5 py-3.5">
              <span className="text-[12px] text-white/65">
                {visibleSongs.length}
                {visibleSongs.length === songs.length ? "" : ` de ${songs.length}`}{" "}
                {visibleSongs.length === 1 ? "canción" : "canciones"}
              </span>
              <div className="ml-auto hidden sm:block">
                <SplitCoverageMeter coverage={totals.coverage} variant="inline" onGlass />
              </div>
            </div>
          </div>
        )}
      </div>

      {ownerSplitOpen && (
        <CreateSplitsByLabelModal
          onGlass
          isOpen={ownerSplitOpen}
          onClose={() => {
            setOwnerSplitOpen(false);
            loadSongs();
          }}
          labelId={labelId}
          label={labelName}
          songCount={songs.length}
          alreadyWithSplit={totals.coverage.withSplits}
        />
      )}

      {permissionsOpen && (
        <PermissionsModal
          resourceType="label"
          resourceId={decodedLabel}
          title={decodedLabel}
          onClose={() => setPermissionsOpen(false)}
        />
      )}

      {inviteOpen && (
        <InviteCollaboratorToLabelModal
          onGlass
          isOpen={inviteOpen}
          onClose={() => setInviteOpen(false)}
          labelType="artistic"
          labelIdentifier={labelId}
          labelName={labelName}
          songCount={songs.length}
          onSuccess={loadSongs}
        />
      )}

      {collabSplitOpen && (
        <BulkCollaboratorSplitModal
          onGlass
          isOpen={collabSplitOpen}
          showOwnerContext={splitTracks.some((track) => viewerOwnsSong(track))}
          onClose={() => setCollabSplitOpen(false)}
          name={labelName}
          context="Sello artístico"
          logo={
            <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[14px] bg-[#FF5C00]/[0.16]">
              <Tag className="h-[19px] w-[19px] text-[#FF8A3D]" />
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
    </>
  );
}

/** Fila de canción. Lleva a su ficha; el ISRC se copia sin salir de la tabla. */
function SongRow({ song }: { song: LabelSong }) {
  const navigate = useNavigate();
  const cover = song.spotifyData?.album?.images?.[0]?.url;
  const percentage = song.ownerSplit?.percentage ?? null;
  const collaborators = song.collaborators ?? [];

  return (
    <div
      onClick={() => navigate(`/panel/song/${song._id}`)}
      className={`${SONGS_GRID} group cursor-pointer px-5 py-3 transition-colors hover:bg-white/[0.04]`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center overflow-hidden rounded-[13px] bg-white/[0.08]">
          {cover ? (
            <img src={cover} alt="" className="h-full w-full object-cover" />
          ) : (
            <Music className="h-4 w-4 text-white/50" />
          )}
        </span>
        <div className="flex min-w-0 flex-col gap-0.5">
          <span
            title={song.trackTitle}
            className="truncate text-[13.5px] font-semibold text-white transition-colors group-hover:text-[#FFB067]"
          >
            {song.trackTitle}
          </span>
          <span className="truncate text-[11.5px] text-white/50">
            {song.artistName}
            {collaborators.length > 0 && (
              <span className="md:hidden">
                {" · "}
                {collaborators.length} {collaborators.length === 1 ? "colaborador" : "colaboradores"}
              </span>
            )}
          </span>
        </div>
      </div>

      <div className={`${visibility("collaborators")} min-w-0 items-center`}>
        <SongCollaboratorsCell collaborators={collaborators} songTitle={song.trackTitle} />
      </div>

      <div className={`${visibility("isrc")} min-w-0 items-center gap-1.5`}>
        <span className="truncate font-mono text-[10.5px] text-white/65">{song.isrc || "—"}</span>
        {song.isrc && (
          <span onClick={(e) => e.stopPropagation()}>
            <CopyButton
              value={song.isrc}
              title="Copiar ISRC"
              className="!text-white/45 hover:!bg-white/10 hover:!text-[#FFB067]"
            />
          </span>
        )}
      </div>

      <div className={`${visibility("streams")} items-center gap-1.5`}>
        <Play className="h-[11px] w-[11px] text-white/50" />
        <span className="font-mono text-[11.5px] text-white/70">
          {formatStreams(song.totalStreams ?? 0)}
        </span>
      </div>

      <div className={visibility("income")}>
        <span className="font-mono text-[14px] text-[#45D39A]">
          {formatCurrency(song.totalNetIncome ?? 0)}
        </span>
      </div>

      <div className={visibility("owner")}>
        <span className="font-mono text-[14px] text-[#FF8A3D]">
          {formatCurrency(song.ownerEarnings ?? 0)}
        </span>
      </div>

      <div className={visibility("split")}>
        {percentage !== null ? (
          <span className="rounded-full bg-[#FF5C00]/[0.16] px-2.5 py-1 font-mono text-[11.5px] font-semibold text-[#FF9A5C]">
            {percentage}%
          </span>
        ) : (
          <span className="rounded-full bg-white/[0.08] px-2.5 py-1 text-[11.5px] font-semibold text-white/50">
            Sin split
          </span>
        )}
      </div>

      <div className="flex justify-end">
        <ChevronRight className="h-4 w-4 text-white/40" />
      </div>
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

/** Canal de la consola, con la misma anatomía que la de Música y Distribuidores. */
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
        active ? "text-[#FF8A3D]" : "text-white/50 hover:text-white/80"
      }`}
    >
      <span className="font-mono text-[9.5px] font-medium tracking-[1.2px]">{label}</span>
      {active && (descending ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />)}
    </button>
  );
}

function ColumnLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[9.5px] font-medium tracking-[1.2px] text-white/50">
      {children}
    </span>
  );
}

function SongsSkeleton() {
  const widths = ["w-[168px]", "w-[128px]", "w-[184px]", "w-[146px]", "w-[112px]"];
  return (
    <div className="glass overflow-hidden rounded-[28px]" aria-busy="true" aria-label="Cargando canciones">
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
      <div className="h-px bg-white/[0.09]" />
      <div className="flex flex-col divide-y divide-white/[0.09]">
        {widths.map((width) => (
          <div key={width} className={`${SONGS_GRID} px-5 py-3.5`}>
            <div className="flex min-w-0 items-center gap-3">
              <div className="h-[42px] w-[42px] flex-shrink-0 animate-pulse rounded-[13px] bg-white/[0.08]" />
              <div className="flex flex-1 flex-col gap-2">
                <div className={`h-2.5 animate-pulse rounded-full bg-white/[0.08] ${width}`} />
                <div className="h-2 w-[92px] animate-pulse rounded-full bg-white/[0.05]" />
              </div>
            </div>
            {COLUMNS.map((column) => (
              <div key={column.key} className={column.visibility}>
                <div className="h-2.5 w-[70%] animate-pulse rounded-full bg-white/[0.08]" />
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
    <section className="glass flex flex-col items-center gap-3 rounded-[32px] px-6 py-[50px]">
      <div className="flex h-[52px] w-[52px] items-center justify-center rounded-[18px] bg-white/[0.08]">
        <SearchX className="h-[22px] w-[22px] text-white/65" />
      </div>
      <h3 className="text-center font-display text-base font-medium text-white">{title}</h3>
      <p className="max-w-[420px] text-center text-[12.5px] text-white/65">{text}</p>
      {action && <div className="pt-1.5">{action}</div>}
    </section>
  );
}
