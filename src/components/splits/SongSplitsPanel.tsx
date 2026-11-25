import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Crown, Users, UserPlus, UserRoundPlus, X, Rocket, Lock } from "lucide-react";
import { SplitsEditor } from "@/components/modal/SplitsModal";
import { OwnerSplitEditor } from "@/pages/panel/music/song/components/ownerfrom";
import { PlaceholderPeopleSection } from "@/components/collaborators/PlaceholderPeopleSection";
import { InviteCollaboratorSection } from "./InviteCollaboratorSection";
import { formatMonth } from "@/utils/splitPeriods.utils";
import type { SplitData, SplitsModalProps } from "@/types";

export type SplitsPanelSection = "owner" | "split" | "invite" | "placeholders";

interface SongSplitsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  /** La sección con la que se abre; si no está permitida, la primera que lo esté. */
  initialSection?: SplitsPanelSection;
  songId: string;
  song: {
    trackTitle?: string;
    ownerId?: { split?: SplitData | null } | string | null;
  };
  collaborators: SplitsModalProps["collaborators"];
  /** Mes en que sale la canción, donde arrancan los tramos. */
  releaseMonth?: string | null;
  /** Quien mira es el dueño: ve la explicación de su retención en el reparto. */
  showOwnerContext: boolean;
  canEditOwnerSplit: boolean;
  canManageSplits: boolean;
  /** Si el reparto está bloqueado, por qué (un sello sin split del owner). */
  splitsBlockedReason?: string | null;
  canInvite: boolean;
  canAddPlaceholders: boolean;
  onOwnerSplitCreated: () => void;
  onSplitsSaved?: () => void | Promise<void>;
  onPlaceholderAttached: () => void;
  onCollaboratorAdded: () => void;
}

interface SectionMeta {
  key: SplitsPanelSection;
  group: "SPLITS" | "PERSONAS";
  label: string;
  hint: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}

/**
 * Todo lo que se decide sobre quién cobra de una canción, en un solo sitio.
 *
 * Reúne cuatro modales que antes se abrían por separado desde la pestaña
 * Colaboradores —tu parte, el reparto, invitar a un colaborador y las personas
 * sin cuenta— sin cambiar cómo funciona ninguno: cada sección monta el mismo
 * editor que su modal (`OwnerSplitEditor`, `SplitsEditor`) o la misma llamada
 * (`InviteCollaboratorSection`, `PlaceholderPeopleSection`), con su propio pie
 * de guardar.
 *
 * La navegación va a la izquierda, en dos grupos: el dinero (tu parte sale
 * primero; el reparto es lo que queda) y las personas (hay que añadirlas antes
 * de poder darles una parte). Las secciones siguen montadas al cambiar de una a
 * otra, así que nada de lo escrito se pierde por mirar la de al lado.
 */
export function SongSplitsPanel({
  isOpen,
  onClose,
  initialSection = "split",
  songId,
  song,
  collaborators,
  releaseMonth = null,
  showOwnerContext,
  canEditOwnerSplit,
  canManageSplits,
  splitsBlockedReason = null,
  canInvite,
  canAddPlaceholders,
  onOwnerSplitCreated,
  onSplitsSaved,
  onPlaceholderAttached,
  onCollaboratorAdded,
}: SongSplitsPanelProps) {
  const baseId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  const ownerSplit =
    song?.ownerId && typeof song.ownerId === "object" ? (song.ownerId.split ?? null) : null;

  const sections = useMemo<SectionMeta[]>(() => {
    const all: (SectionMeta & { allowed: boolean })[] = [
      {
        key: "owner",
        group: "SPLITS",
        label: "Tu parte",
        hint: ownerSplit ? `${ownerSplit.percentage}% · sale primero` : "Sin fijar",
        icon: <Crown className="h-4 w-4" />,
        title: ownerSplit ? "Cambiar tu parte" : "Fijar tu parte",
        description:
          "Tu parte se descuenta antes de repartir al resto. El cambio queda en el historial.",
        allowed: canEditOwnerSplit,
      },
      {
        key: "split",
        group: "SPLITS",
        label: "Reparto",
        hint: `${collaborators.length} ${collaborators.length === 1 ? "persona" : "personas"}`,
        icon: <Users className="h-4 w-4" />,
        title: "Repartir los splits",
        description: `${collaborators.length} ${
          collaborators.length === 1 ? "persona puede" : "personas pueden"
        } cobrar de esta canción`,
        allowed: canManageSplits,
      },
      {
        key: "invite",
        group: "PERSONAS",
        label: "Invitar",
        hint: "Por correo o código",
        icon: <UserPlus className="h-4 w-4" />,
        title: "Añadir colaborador",
        description: "Elige cómo quieres agregar al colaborador al proyecto.",
        allowed: canInvite,
      },
      {
        key: "placeholders",
        group: "PERSONAS",
        label: "Sin cuenta",
        hint: "Crear o añadir",
        icon: <UserRoundPlus className="h-4 w-4" />,
        title: "Añadir a alguien sin cuenta",
        description: "Créala aquí o elígela entre las que ya tienes, y añádela a esta canción.",
        allowed: canAddPlaceholders,
      },
    ];
    return all.filter((section) => section.allowed);
  }, [ownerSplit, collaborators.length, canEditOwnerSplit, canManageSplits, canInvite, canAddPlaceholders]);

  const [active, setActive] = useState<SplitsPanelSection>(initialSection);

  // Cada vez que se abre, por la sección que se pidió (la del botón que lo abrió).
  useEffect(() => {
    if (!isOpen) return;
    const allowed = sections.some((section) => section.key === initialSection);
    setActive(allowed ? initialSection : (sections[0]?.key ?? "split"));
    // Solo al abrir: después la sección la elige quien lo usa.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialSection]);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Al abrir: foco en el panel y la página de detrás quieta (mismo trato que ModalShell).
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!mounted || !isOpen) return null;

  const current = sections.find((section) => section.key === active) ?? sections[0];
  const groups = (["SPLITS", "PERSONAS"] as const)
    .map((group) => ({ group, items: sections.filter((section) => section.group === group) }))
    .filter((entry) => entry.items.length > 0);

  /**
   * Con las flechas se recorre la navegación, como en cualquier lista de
   * pestañas: arriba y abajo en escritorio, izquierda y derecha cuando la
   * navegación se pone en fila en pantallas estrechas.
   */
  const onTabKeyDown = (event: React.KeyboardEvent, index: number) => {
    const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[event.key];
    if (!step) return;
    event.preventDefault();
    const next = sections[(index + step + sections.length) % sections.length];
    setActive(next.key);
    document.getElementById(`${baseId}-tab-${next.key}`)?.focus();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0B0604]/[0.62] p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${baseId}-title`}
        onClick={(event) => event.stopPropagation()}
        className="glass-menu flex h-[90vh] supports-[height:100dvh]:h-[90dvh] w-[90vw] flex-col overflow-hidden rounded-[28px] focus:outline-none motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95"
      >
        {/* Cabecera: de qué canción se habla y desde cuándo cuenta */}
        <header className="flex shrink-0 items-center gap-3.5 px-6 pb-4 pt-5">
          <span className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-[14px] bg-[#FF5C00]/[0.16]">
            <Users className="h-[18px] w-[18px] text-[#FF8A3D]" />
          </span>
          <div className="min-w-0 flex-1">
            <h2
              id={`${baseId}-title`}
              className="truncate font-display text-[19px] font-medium tracking-[-0.005em] text-white"
            >
              Splits y personas
            </h2>
            <p className="flex min-w-0 items-center gap-1.5 text-[11.5px] text-white/65">
              <span className="truncate">{song?.trackTitle || "Esta canción"}</span>
              <span aria-hidden="true" className="text-white/40">
                ·
              </span>
              {/* La fecha de lanzamiento se enseña una sola vez: es de la canción y
                  es donde arranca la línea de tiempo de todos los tramos. */}
              <span
                title={
                  releaseMonth
                    ? "Aquí arrancan los tramos de todos los splits de esta canción"
                    : "No sabemos cuándo salió: los tramos arrancan igual, cubriendo todo lo anterior"
                }
                className="flex shrink-0 items-center gap-1 font-medium text-white"
              >
                <Rocket className="h-3 w-3 shrink-0 text-[#FF8A3D]" aria-hidden="true" />
                {releaseMonth ? `Lanzada en ${formatMonth(releaseMonth)}` : "Sin fecha de lanzamiento"}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/[0.08] text-white/70 transition-colors hover:bg-white/[0.14] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="h-px shrink-0 bg-white/[0.09]" />

        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          {/* Navegación: arriba en pantallas estrechas, a la izquierda en escritorio */}
          <nav
            aria-label="Secciones"
            className="shrink-0 border-b border-white/[0.09] px-3 py-3 lg:w-[248px] lg:border-b-0 lg:border-r lg:px-3 lg:py-4"
          >
            <div
              role="tablist"
              aria-orientation="vertical"
              className="flex gap-1.5 overflow-x-auto lg:flex-col lg:gap-4 lg:overflow-visible"
            >
              {groups.map(({ group, items }) => (
                <div key={group} className="flex shrink-0 gap-1.5 lg:flex-col lg:gap-1">
                  <span className="hidden px-3 pb-1 font-mono text-[9.5px] font-medium tracking-[1.2px] text-white/45 lg:block">
                    {group}
                  </span>
                  {items.map((section) => {
                    const selected = section.key === current?.key;
                    const index = sections.indexOf(section);
                    return (
                      <button
                        key={section.key}
                        id={`${baseId}-tab-${section.key}`}
                        type="button"
                        role="tab"
                        aria-selected={selected}
                        aria-controls={`${baseId}-panel-${section.key}`}
                        tabIndex={selected ? 0 : -1}
                        onClick={() => setActive(section.key)}
                        onKeyDown={(event) => onTabKeyDown(event, index)}
                        className={`flex min-h-[44px] shrink-0 items-center gap-3 rounded-[14px] px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70 ${
                          selected ? "bg-[#F7EDE6]/[0.92]" : "hover:bg-white/[0.06]"
                        }`}
                      >
                        <span
                          className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${
                            selected
                              ? "bg-[#1C1D22]/10 text-[#1C1D22]"
                              : section.key === "placeholders"
                                ? "border border-dashed border-white/35 text-white/70"
                                : "bg-white/[0.08] text-white/70"
                          }`}
                        >
                          {section.icon}
                        </span>
                        <span className="flex min-w-0 flex-col">
                          <span
                            className={`truncate text-[13px] ${
                              selected ? "font-semibold text-[#1C1D22]" : "font-medium text-white"
                            }`}
                          >
                            {section.label}
                          </span>
                          <span
                            className={`hidden truncate text-[11px] lg:block ${
                              selected ? "text-[#5E524B]" : "text-white/50"
                            }`}
                          >
                            {section.hint}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </nav>

          {/* Las secciones. Todas montadas, una a la vista: lo escrito no se pierde al cambiar. */}
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            {sections.map((section) => {
              const visible = section.key === current?.key;
              return (
                <section
                  key={section.key}
                  id={`${baseId}-panel-${section.key}`}
                  role="tabpanel"
                  aria-labelledby={`${baseId}-tab-${section.key}`}
                  hidden={!visible}
                  className={visible ? "flex min-h-0 flex-1 flex-col" : undefined}
                >
                  <div className="shrink-0 px-[22px] pt-5">
                    <h3 className="font-display text-[17px] font-medium tracking-[-0.005em] text-white">
                      {section.title}
                    </h3>
                    <p className="mt-0.5 text-[12px] text-white/60">{section.description}</p>
                  </div>

                  {section.key === "owner" && (
                    <OwnerSplitEditor
                      isOpen={isOpen}
                      songId={songId}
                      song={song}
                      onSplitCreated={onOwnerSplitCreated}
                      onCancel={onClose}
                    />
                  )}

                  {section.key === "split" &&
                    (splitsBlockedReason ? (
                      <div className="flex flex-1 flex-col items-center justify-center gap-2.5 px-6 text-center">
                        <span className="grid h-[52px] w-[52px] place-items-center rounded-[18px] bg-white/[0.08]">
                          <Lock className="h-[22px] w-[22px] text-white/60" />
                        </span>
                        <p className="max-w-[360px] text-[13px] font-semibold text-white">
                          {splitsBlockedReason}
                        </p>
                      </div>
                    ) : (
                      <SplitsEditor
                        collaborators={collaborators}
                        songId={songId}
                        showOwnerContext={showOwnerContext}
                        releaseMonth={releaseMonth}
                        isOpen={isOpen}
                        onCancel={onClose}
                        onSaved={onSplitsSaved}
                      />
                    ))}

                  {section.key === "invite" && (
                    <InviteCollaboratorSection songId={songId} onAdded={onCollaboratorAdded} />
                  )}

                  {section.key === "placeholders" && (
                    <PlaceholderPeopleSection
                      isOpen={isOpen}
                      songId={songId}
                      onAttached={onPlaceholderAttached}
                    />
                  )}
                </section>
              );
            })}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
