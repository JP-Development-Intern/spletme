import { Users, TriangleAlert, Crown, UserPlus, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { useBulkCollaboratorSplit, type BulkSplitTrack } from "@/hooks/useBulkCollaboratorSplit";
import { ModalShell, PrimaryButton, SecondaryButton } from "@/components/ui/ModalShell";
import { FieldLabel, Progress, Results, Scope } from "./bulkSplitPieces";
// FUNCIONALIDAD TEMPORAL — perfiles sin cuenta. Ver docs/PERFILES_TEMPORALES.md.
import {
  PlaceholderAvatar,
  PlaceholderChip,
} from "@/components/collaborators/PlaceholderAvatar";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Título del conjunto: el nombre del álbum o del sello. */
  name: string;
  /** Línea de contexto bajo el título. */
  context?: string;
  /** Marca del conjunto en la cabecera del modal. */
  logo: React.ReactNode;
  /** Canciones sobre las que se reparte. */
  tracks: BulkSplitTrack[];
  /** Cómo se llama una canción aquí: «pista» en un álbum, «canción» en un sello. */
  unit?: { one: string; many: string };
  /** Cómo se llama el conjunto: «álbum» o «sello». */
  scopeNoun?: string;
  onSplitsCreated?: () => void;
  /** Abre la asignación del split del owner, requisito para repartir. */
  onAssignOwnerSplit?: () => void;
  /**
   * Si quien reparte es el dueño de las canciones. Solo entonces se nombra su
   * split: es el único que puede asignarlo y el único que puede saber que
   * existe. Ver `utils/ownerVisibility.ts`.
   */
  showOwnerContext?: boolean;
  /** Abre la invitación, para sumar a alguien a las canciones que le faltan. */
  onInvite?: () => void;
  /**
   * Panel de vidrio cálido, para las páginas ya migradas. Por defecto sigue en
   * claro: así se ve igual desde las que aún no lo están.
   */
  onGlass?: boolean;
}

/** Los mismos papeles de color en la hoja clara y sobre el vidrio. */
const TONES = {
  light: {
    note: "text-[#A6AAB2]",
    column: "md:border-[#E8E8EC]",
    personActive: "border-[1.5px] border-[#FF5C00] bg-[#FFEADD]",
    personIdle: "border border-[#E8E8EC] bg-white hover:border-[#D9DAE0]",
    initialActive: "bg-[#FF5C00] text-white",
    initialIdle: "bg-[#F4F5F7] text-[#71757E]",
    name: "text-[#1C1D22]",
    countActive: "text-[#EA580C]",
    countIdle: "text-[#A6AAB2]",
    check: "text-[#FF5C00]",
    fieldOk: "border-[1.5px] border-[#FF5C00]",
    fieldIdle: "border border-[#E8E8EC]",
    fieldInput: "text-[#1C1D22]",
    unit: "text-[#A6AAB2]",
    hint: "text-[#A6AAB2]",
    error: "text-[#E5484D]",
    blockerDangerIcon: "text-[#E5484D]",
    blockerNeutralIcon: "text-[#71757E]",
    blockerDanger: "bg-[#FDECEC]",
    blockerNeutral: "bg-[#F4F5F7]",
    blockerMark: "bg-white",
    blockerDangerText: "text-[#E5484D]",
    blockerNeutralTitle: "text-[#1C1D22]",
    blockerNeutralText: "text-[#71757E]",
    blockerDangerButton: "rounded-[14px] bg-[#E5484D] text-white hover:bg-[#C93B40]",
    blockerNeutralButton: "rounded-[14px] border border-[#E8E8EC] bg-white text-[#1C1D22] hover:bg-[#F4F5F7]",
    pick: "border-[#E8E8EC]",
    pickMark: "bg-[#F4F5F7]",
    pickIcon: "text-[#A6AAB2]",
    pickTitle: "text-[#1C1D22]",
    pickText: "text-[#71757E]",
    empty: "bg-[#F4F5F7]",
    emptyMark: "bg-white",
    emptyIcon: "text-[#A6AAB2]",
    emptyTitle: "text-[#1C1D22]",
    emptyText: "text-[#71757E]",
    emptyButton: "rounded-[18px] bg-[#FF5C00] text-white hover:bg-[#EA580C]",
    emptyLink: "text-[#71757E] hover:text-[#1C1D22]",
  },
  glass: {
    note: "text-white/50",
    column: "md:border-white/[0.09]",
    personActive: "border-[1.5px] border-[#FF8A3D] bg-[#FF5C00]/[0.16]",
    personIdle: "border border-white/[0.12] bg-white/[0.06] hover:bg-white/[0.10]",
    initialActive: "bg-[#FF5C00] text-white",
    initialIdle: "bg-white/[0.10] text-white/70",
    name: "text-white",
    countActive: "text-[#FFB48A]",
    countIdle: "text-white/50",
    check: "text-[#FF8A3D]",
    fieldOk: "border-[1.5px] border-[#FF8A3D] bg-white/[0.06]",
    fieldIdle: "border border-white/[0.14] bg-white/[0.06]",
    fieldInput: "text-white placeholder:text-white/40",
    unit: "text-white/50",
    hint: "text-white/50",
    error: "text-[#FF8F92]",
    blockerDangerIcon: "text-[#FF8F92]",
    blockerNeutralIcon: "text-white/70",
    blockerDanger: "border border-[#E5484D]/30 bg-[#E5484D]/[0.12]",
    blockerNeutral: "bg-white/[0.06]",
    blockerMark: "bg-black/[0.18]",
    blockerDangerText: "text-[#FF8F92]",
    blockerNeutralTitle: "text-white",
    blockerNeutralText: "text-white/65",
    blockerDangerButton: `rounded-full bg-[#E5484D] text-white hover:bg-[#CF3F44] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70`,
    blockerNeutralButton: `rounded-full border border-white/[0.16] bg-white/[0.07] text-white hover:bg-white/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70`,
    pick: "border-white/[0.14]",
    pickMark: "bg-white/[0.08]",
    pickIcon: "text-white/50",
    pickTitle: "text-white",
    pickText: "text-white/65",
    empty: "bg-white/[0.06]",
    emptyMark: "bg-white/[0.08]",
    emptyIcon: "text-white/50",
    emptyTitle: "text-white",
    emptyText: "text-white/65",
    emptyButton: `rounded-full bg-[#FF5C00] text-white shadow-[0_8px_20px_-6px_rgba(255,92,0,0.35)] hover:bg-[#EA580C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70`,
    emptyLink: "text-white/65 hover:text-white",
  },
};

type Tones = (typeof TONES)["light"];

/**
 * Reparte a UN colaborador su porcentaje en todas las canciones de un conjunto
 * —un álbum o un sello— donde esa persona figura.
 *
 * El gemelo del modal del owner, con la diferencia que impone el reparto: el
 * porcentaje de un colaborador sale de lo que el owner deja, así que una canción
 * sin split del owner lo rechaza. Eso se comprueba al elegir a la persona y se
 * dice antes de empezar —con el botón que lo arregla al lado— en vez de dejar
 * que la pasada termine con doce errores idénticos.
 */
export default function BulkCollaboratorSplitModal({
  isOpen,
  onClose,
  name,
  context,
  logo,
  tracks,
  unit = { one: "pista", many: "pistas" },
  scopeNoun = "álbum",
  onSplitsCreated,
  onAssignOwnerSplit,
  onInvite,
  showOwnerContext = false,
  onGlass = false,
}: Props) {
  const t = onGlass ? TONES.glass : TONES.light;
  const {
    mounted,
    collaborators,
    collaboratorId,
    selected,
    targetTracks,
    form,
    ownerRate,
    setOwnerRate,
    isLoading,
    isLoadingFilters,
    countryOptions,
    platformOptions,
    progress,
    showResults,
    autoCloseCountdown,
    error,
    selectCollaborator,
    updateForm,
    createBulkCollaboratorSplits,
    closeWithReset,
  } = useBulkCollaboratorSplit(isOpen, tracks, onClose, onSplitsCreated);

  if (!mounted || !isOpen) return null;

  const totalTracks = tracks.length;
  const percentage = Number(form.percentage || 0);
  const validPercentage = percentage > 0 && percentage <= 100;
  const running = Boolean(progress) && !showResults;

  /** Pistas suyas que hoy no admiten reparto por faltarles el split del owner. */
  const blocked = selected?.blockedTracks.length ?? 0;
  /** Canciones del conjunto en las que esa persona no colabora. */
  const missing = selected ? totalTracks - selected.tracks.length : 0;

  const title = showResults
    ? "Reparto aplicado"
    : running
      ? "Repartiendo"
      : "Split de un colaborador";

  return (
    <ModalShell
      title={title}
      subtitle={`${name}${context ? ` · ${context}` : ""}`}
      width="xl"
      onGlass={onGlass}
      locked={running}
      onClose={closeWithReset}
      logo={logo}
      footer={
        showResults ? (
          <>
            <span className={`flex-1 text-[11px] ${t.note}`}>
              {autoCloseCountdown !== null
                ? `Se cierra solo en ${autoCloseCountdown}s`
                : "El reparto ya está actualizado"}
            </span>
            {progress && progress.failed > 0 && (
              <SecondaryButton onClick={createBulkCollaboratorSplits}>Reintentar</SecondaryButton>
            )}
            <PrimaryButton onClick={closeWithReset}>Hecho</PrimaryButton>
          </>
        ) : running ? (
          <span className={`flex-1 text-[11px] ${t.note}`}>
            No cierres la ventana hasta que termine.
          </span>
        ) : (
          <>
            <span className="flex-1" />
            <SecondaryButton onClick={closeWithReset}>Cancelar</SecondaryButton>
            <PrimaryButton
              onClick={createBulkCollaboratorSplits}
              disabled={!selected || !validPercentage || isLoading || targetTracks.length === 0}
              icon={<Users className="h-[15px] w-[15px]" />}
            >
              {!selected
                ? "Elige a alguien"
                : targetTracks.length === 0
                  ? `Sin ${unit.many} que repartir`
                  : `Repartir en ${targetTracks.length} ${
                      targetTracks.length === 1 ? unit.one : unit.many
                    }`}
            </PrimaryButton>
          </>
        )
      }
    >
      {showResults && progress ? (
        <Results progress={progress} />
      ) : running && progress ? (
        <Progress progress={progress} percentage={percentage} />
      ) : collaborators.length === 0 ? (
        <EmptyState onInvite={onInvite} scopeNoun={scopeNoun} t={t} />
      ) : (
        /* Dos columnas: a la izquierda a quién se reparte, a la derecha cuánto y
           dónde. La lista se queda fija mientras se configura, así que se puede
           comparar en cuántas canciones está cada uno sin perder el formulario de
           vista. En pantallas estrechas vuelven a apilarse. */
        <div className="grid gap-5 md:grid-cols-[minmax(0,260px)_minmax(0,1fr)] md:gap-6">
          {/* A quién */}
          <div className={`flex min-w-0 flex-col gap-2.5 md:border-r md:pr-6 ${t.column}`}>
            <FieldLabel>COLABORADOR *</FieldLabel>
            <div className="flex max-h-[360px] flex-col gap-1.5 overflow-y-auto">
              {collaborators.map((person) => {
                const active = person.id === collaboratorId;
                return (
                  <button
                    key={person.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => selectCollaborator(person.id)}
                    className={`flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-left transition-colors ${
                      onGlass ? "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70" : ""
                    } ${active ? t.personActive : t.personIdle}`}
                  >
                    {person.placeholderId ? (
                      <PlaceholderAvatar name={person.name} size={32} onGlass={onGlass} />
                    ) : (
                      <span
                        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[12px] font-semibold ${
                          active ? t.initialActive : t.initialIdle
                        }`}
                      >
                        {person.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="flex min-w-0 items-center gap-1.5">
                        <span className={`truncate text-[12.5px] font-semibold ${t.name}`}>
                          {person.name}
                        </span>
                        {person.placeholderId && <PlaceholderChip onGlass={onGlass} />}
                      </span>
                      {/* En cuántas está: es el alcance real de su reparto. */}
                      <span
                        className={`font-mono text-[10.5px] ${
                          active ? t.countActive : t.countIdle
                        }`}
                      >
                        {person.tracks.length} de {totalTracks} {unit.many}
                      </span>
                    </span>
                    {active && <Check className={`h-[15px] w-[15px] flex-shrink-0 ${t.check}`} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cuánto y dónde */}
          <div className="flex min-w-0 flex-col gap-5">
            {!selected ? (
              <PickSomeone t={t} />
            ) : (
              <>
                {/* Lo que el reparto no puede cubrir, dicho antes de empezar. */}
                {showOwnerContext && blocked > 0 && (
                  <Blocker
                    t={t}
                    tone="danger"
                    icon={<Crown className={`h-[17px] w-[17px] ${t.blockerDangerIcon}`} />}
                    title={`${blocked} ${
                      blocked === 1
                        ? `${unit.one} suya no reparte`
                        : `${unit.many} suyas no reparten`
                    } todavía`}
                    detail={`Su porcentaje sale de lo que deja el owner, así que primero hay que asignar el split del owner en esas ${unit.many}.`}
                    actionLabel="Asignar split del owner"
                    onAction={onAssignOwnerSplit}
                  />
                )}

                {missing > 0 && (
                  <Blocker
                    t={t}
                    tone="neutral"
                    icon={<UserPlus className={`h-[17px] w-[17px] ${t.blockerNeutralIcon}`} />}
                    title={`No colabora en ${missing} ${
                      missing === 1 ? unit.one : unit.many
                    } del ${scopeNoun}`}
                    detail={`El reparto solo llega a las ${unit.many} donde figura. Si quieres que entre en todas, invítala al ${scopeNoun} completo.`}
                    actionLabel={`Invitar al ${scopeNoun}`}
                    onAction={onInvite}
                  />
                )}

                {/* Porcentaje */}
                <div className="flex flex-col gap-2.5">
                  <FieldLabel>SU PORCENTAJE *</FieldLabel>
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex w-[136px] flex-shrink-0 items-center gap-1.5 rounded-2xl px-4 py-2.5 ${
                        validPercentage ? t.fieldOk : t.fieldIdle
                      } ${onGlass ? "focus-within:ring-2 focus-within:ring-[#FF5C00]/70" : ""}`}
                    >
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step="0.01"
                        value={form.percentage}
                        onChange={(e) => updateForm("percentage", e.target.value)}
                        placeholder="0.00"
                        aria-label="Porcentaje del colaborador"
                        className={`w-full border-none bg-transparent p-0 font-mono text-[20px] font-semibold focus:outline-none focus:ring-0 ${t.fieldInput}`}
                      />
                      <span className={`font-mono text-[15px] font-semibold ${t.unit}`}>%</span>
                    </span>

                    <span className="flex min-w-0 flex-1 flex-col gap-2">
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={1}
                        value={Number.isFinite(percentage) ? percentage : 0}
                        onChange={(e) => updateForm("percentage", e.target.value)}
                        aria-label="Ajustar porcentaje"
                        className="w-full accent-[#FF5C00]"
                      />
                      <span className={`flex justify-between font-mono text-[9.5px] ${t.hint}`}>
                        {["0%", "25%", "50%", "75%", "100%"].map((mark) => (
                          <span key={mark}>{mark}</span>
                        ))}
                      </span>
                    </span>
                  </div>
                  <p className={`text-[11px] leading-relaxed ${t.hint}`}>
                    {showOwnerContext
                      ? "Es la parte de cada "
                      : "Es el mismo en cada "}
                    {unit.one}
                    {showOwnerContext ? " que le asignas, y es la misma en todas" : ""}. Entre todos
                    los colaboradores no puede pasar del 100%.
                  </p>
                </div>

                {/* Retención del owner con esta persona. Solo la ve el dueño. */}
                {showOwnerContext && (
                  <div className="flex flex-col gap-2.5">
                    <FieldLabel>TU RETENCIÓN CON ESTA PERSONA</FieldLabel>
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex w-[136px] flex-shrink-0 items-center gap-1.5 rounded-2xl px-4 py-2.5 ${
                          ownerRate.trim() === "" ? t.fieldIdle : t.fieldOk
                        } ${onGlass ? "focus-within:ring-2 focus-within:ring-[#FF5C00]/70" : ""}`}
                      >
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step="0.01"
                          value={ownerRate}
                          onChange={(e) => setOwnerRate(e.target.value)}
                          placeholder="La tuya"
                          aria-label="Retención del owner para este colaborador"
                          className={`w-full border-none bg-transparent p-0 font-mono text-[20px] font-semibold focus:outline-none focus:ring-0 ${t.fieldInput}`}
                        />
                        <span className={`font-mono text-[15px] font-semibold ${t.unit}`}>
                          %
                        </span>
                      </span>
                      <p className={`min-w-0 flex-1 text-[11px] leading-relaxed ${t.hint}`}>
                        {ownerRate.trim() === ""
                          ? "Vacío = le aplicas tu porcentaje de owner, el mismo que a todos. Rellénalo solo si con esta persona pactaste otro."
                          : "De la parte que le toque en cada " +
                            unit.one +
                            ", te quedas ese porcentaje y ella cobra el resto."}
                      </p>
                    </div>
                  </div>
                )}

                <Scope
                  label="PAÍSES"
                  type={form.countriesType}
                  onTypeChange={(value) => updateForm("countriesType", value)}
                  options={countryOptions}
                  selected={form.selectedCountries}
                  onSelectedChange={(value) => updateForm("selectedCountries", value)}
                  loading={isLoadingFilters}
                  allLabel="Cobra en todos los países"
                  placeholder="Añadir país…"
                />

                <Scope
                  label="PLATAFORMAS"
                  type={form.platformsType}
                  onTypeChange={(value) => updateForm("platformsType", value)}
                  options={platformOptions}
                  selected={form.selectedPlatforms}
                  onSelectedChange={(value) => updateForm("selectedPlatforms", value)}
                  loading={isLoadingFilters}
                  allLabel="Cobra en todas las plataformas"
                  placeholder="Añadir plataforma…"
                />

                {error && (
                  <p className={`flex items-center gap-1.5 text-[12px] font-medium ${t.error}`}>
                    <TriangleAlert className="h-3.5 w-3.5 flex-shrink-0" />
                    {error}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </ModalShell>
  );
}

/**
 * Un obstáculo del reparto con la acción que lo quita al lado. Decir «faltan
 * cosas» sin ofrecer el camino obliga a cerrar el modal y buscarlo.
 */
function Blocker({
  t,
  tone,
  icon,
  title,
  detail,
  actionLabel,
  onAction,
}: {
  t: Tones;
  tone: "danger" | "neutral";
  icon: React.ReactNode;
  title: string;
  detail: string;
  actionLabel: string;
  onAction?: () => void;
}) {
  const danger = tone === "danger";
  return (
    <div
      className={`flex flex-wrap items-center gap-3 rounded-[18px] p-4 ${
        danger ? t.blockerDanger : t.blockerNeutral
      }`}
    >
      <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${t.blockerMark}`}>
        {icon}
      </span>
      <span className="flex min-w-[180px] flex-1 flex-col gap-0.5">
        <span
          className={`text-[12.5px] font-semibold ${danger ? t.blockerDangerText : t.blockerNeutralTitle}`}
        >
          {title}
        </span>
        <span
          className={`text-[11px] leading-relaxed ${danger ? t.blockerDangerText : t.blockerNeutralText}`}
        >
          {detail}
        </span>
      </span>
      {onAction && (
        <button
          type="button"
          onClick={onAction}
          className={`flex-shrink-0 px-3.5 py-2 text-[11.5px] font-semibold transition-colors ${
            danger ? t.blockerDangerButton : t.blockerNeutralButton
          }`}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

/**
 * La columna de configuración antes de elegir a nadie. Deja el hueco ocupado y
 * dice de dónde sale lo que va a aparecer, en vez de mostrar un formulario
 * apagado que no se sabe a quién aplicaría.
 */
function PickSomeone({ t }: { t: Tones }) {
  return (
    <div className={`flex h-full min-h-[220px] flex-col items-center justify-center gap-2.5 rounded-[18px] border border-dashed px-5 py-8 text-center ${t.pick}`}>
      <span className={`flex h-11 w-11 items-center justify-center rounded-full ${t.pickMark}`}>
        <Users className={`h-5 w-5 ${t.pickIcon}`} />
      </span>
      <span className={`text-[12.5px] font-semibold ${t.pickTitle}`}>
        Elige a alguien de la lista
      </span>
      <span className={`max-w-[280px] text-[11.5px] leading-relaxed ${t.pickText}`}>
        Aquí aparecerá su porcentaje y en qué países y plataformas lo cobra.
      </span>
    </div>
  );
}

/** Sin colaboradores no hay nada que repartir: el camino es invitar a alguien. */
function EmptyState({
  onInvite,
  scopeNoun,
  t,
}: {
  onInvite?: () => void;
  scopeNoun: string;
  t: Tones;
}) {
  return (
    <div className={`flex flex-col items-center gap-3 rounded-[18px] px-5 py-8 text-center ${t.empty}`}>
      <span className={`flex h-12 w-12 items-center justify-center rounded-full ${t.emptyMark}`}>
        <Users className={`h-[22px] w-[22px] ${t.emptyIcon}`} />
      </span>
      <span className="flex flex-col gap-1">
        <span className={`text-[13px] font-semibold ${t.emptyTitle}`}>
          Nadie colabora todavía en este {scopeNoun}
        </span>
        <span className={`text-[11.5px] leading-relaxed ${t.emptyText}`}>
          Invita a alguien y podrás repartirle su porcentaje desde esta ventana.
        </span>
      </span>
      {onInvite && (
        <button
          type="button"
          onClick={onInvite}
          className={`flex items-center gap-2 px-4 py-2.5 text-[12px] font-semibold transition-colors ${t.emptyButton}`}
        >
          <UserPlus className="h-[15px] w-[15px]" />
          Invitar al {scopeNoun}
        </button>
      )}
      {/* FUNCIONALIDAD TEMPORAL — perfiles sin cuenta: la salida cuando la
          persona todavía no está en Splitme y no se la puede invitar. */}
      <Link
        to="/panel/placeholder-profiles"
        className={`text-[11.5px] font-semibold underline decoration-dashed underline-offset-4 transition-colors ${t.emptyLink}`}
      >
        O crea a alguien sin cuenta
      </Link>
    </div>
  );
}
