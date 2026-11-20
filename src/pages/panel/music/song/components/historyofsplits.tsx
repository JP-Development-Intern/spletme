import { useEffect, useMemo, useState } from "react";
import {
  GitBranch,
  Globe,
  Radio,
  Hash,
  User,
  Calendar,
  CalendarRange,
  CheckCircle2,
  ArrowRight,
  Clock3,
  AlertCircle,
} from "lucide-react";
import {
  ModalShell,
  ModalMark,
  FooterNote,
  SecondaryButton,
} from "@/components/ui/ModalShell";
import { songSplitsService } from "../../../../../services/songSplits";
import type { SplitHistoryItem } from "../../../../../types/song-split.types";
import { formatMonth, formatPeriodRange } from "@/utils/splitPeriods.utils";
import type { SongCollaborator } from "../../../../../types/music.types";

interface HistoryOfSplitsProps {
  songId?: string;
  isOwner?: boolean;
  /** Sirve para poner nombre al `userId` de cada versión. */
  collaborators?: SongCollaborator[];
}

/** Una versión del historial con el porcentaje que tenía esa misma persona antes. */
interface SplitChange {
  key: string;
  item: SplitHistoryItem;
  subject: string;
  previousPercentage: number | null;
}

const formatDate = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
};

const formatDateTime = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return `${formatDate(value)} · ${date.toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
};

const ACTION_LABEL: Record<string, string> = {
  create: "creado",
  update: "modificado",
  delete: "eliminado",
};

const splitDate = (split: SplitHistoryItem) => split.updatedAt || split.createdAt;

const scopeOf = (split: SplitHistoryItem) => {
  const paises = split.countriesType === "all" ? "Todos los países" : split.selectedCountries?.join(", ");
  const plataformas = split.platformsType === "all" ? "todas las plataformas" : split.selectedPlatforms?.join(", ");
  if (split.countriesType === "all" && split.platformsType === "all") {
    return { text: "Todos los países y plataformas", worldwide: true };
  }
  return { text: [paises, plataformas].filter(Boolean).join(" · ") || "—", worldwide: false };
};

const Historyofsplits = ({
  songId,
  isOwner = false,
  collaborators = [],
}: HistoryOfSplitsProps) => {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [historySplits, setHistorySplits] = useState<SplitHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!songId) {
      setHistorySplits([]);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);
    songSplitsService
      .getSplitHistoryBySong(songId)
      .then((history) => {
        if (active) setHistorySplits(history);
      })
      .catch(() => {
        if (active) setError("No pudimos traer el historial de splits.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [songId]);

  /** Nombre de la persona dueña del split, no de quien hizo el cambio. */
  const nameOf = useMemo(() => {
    const byId = new Map<string, string>();
    for (const c of collaborators) {
      if (c._id && c.name) byId.set(String(c._id), c.name);
    }
    return (split: SplitHistoryItem) => {
      if (split.role === "owner") return "el owner";
      const found = split.userId ? byId.get(String(split.userId)) : undefined;
      return found || split.updatedBy?.name || "un colaborador";
    };
  }, [collaborators]);

  /** Versiones ordenadas de la más nueva a la más vieja, cada una con su porcentaje anterior. */
  const changes = useMemo<SplitChange[]>(() => {
    const safe = Array.isArray(historySplits) ? historySplits : [];
    const visible = isOwner ? safe : safe.filter((s) => s.role !== "owner");

    // Ascendente para poder mirar hacia atrás dentro de cada persona.
    const ascending = [...visible].sort((a, b) => {
      const at = new Date(splitDate(a) || 0).getTime();
      const bt = new Date(splitDate(b) || 0).getTime();
      if (at !== bt) return at - bt;
      return (a.version ?? 0) - (b.version ?? 0);
    });

    const lastByPerson = new Map<string, number>();
    const withDelta = ascending.map((item, index) => {
      const person = String(item.userId ?? item.role ?? index);
      const previous = lastByPerson.has(person) ? (lastByPerson.get(person) as number) : null;
      lastByPerson.set(person, item.percentage ?? 0);
      return {
        key: item._id || `split-history-${index}`,
        item,
        subject: nameOf(item),
        previousPercentage: previous,
      };
    });

    return withDelta.reverse();
  }, [historySplits, isOwner, nameOf]);

  const latestVersion = useMemo(
    () => changes.reduce((max, c) => Math.max(max, c.item.version ?? 0), 0),
    [changes],
  );

  const selected = changes.find((c) => c.key === selectedKey) || null;
  const oldestDate = changes.length ? formatDate(splitDate(changes[changes.length - 1].item)) : "—";

  if (loading) {
    return (
      <Card>
        <div className="flex flex-col items-center gap-2.5 py-14 text-center">
          <Clock3 className="h-6 w-6 animate-pulse text-white/50" />
          <p className="text-sm text-white/65">Trayendo el historial de splits…</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="flex flex-col items-center gap-2.5 py-14 text-center">
          <span className="grid h-[52px] w-[52px] place-items-center rounded-[18px] bg-[#E5484D]/[0.14]">
            <AlertCircle className="h-6 w-6 text-[#FF8F92]" />
          </span>
          <p className="text-[15px] font-semibold text-white">{error}</p>
          <p className="max-w-[340px] text-[13px] text-white/65">
            Vuelve a entrar en un momento. El reparto vigente no se ha tocado.
          </p>
        </div>
      </Card>
    );
  }

  if (!changes.length) {
    return (
      <Card>
        <div className="flex flex-col items-center gap-2.5 py-14 text-center">
          <span className="grid h-[58px] w-[58px] place-items-center rounded-[20px] bg-[#FF5C00]/15">
            <GitBranch className="h-6 w-6 text-[#FF8A3D]" />
          </span>
          <p className="text-[15px] font-semibold text-white">Todavía no hay cambios de reparto</p>
          <p className="max-w-[380px] text-[13px] text-white/65">
            En cuanto asignes el primer split, aquí queda el registro de quién lo cambió y cuándo.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-5 lg:flex-row">
        {/* ── Historial de versiones ── */}
        <section className="glass flex-1 overflow-hidden rounded-[28px]">
          <header className="flex flex-wrap items-center justify-between gap-3.5 px-5 py-[18px]">
            <div className="flex flex-col gap-0.5">
              <h3 className="font-display text-[19px] font-medium tracking-[-0.005em] text-white">
                Cómo ha cambiado el reparto
              </h3>
              <p className="text-[12.5px] text-white/65">
                Cada cambio guarda su versión · la v{latestVersion} es la que se aplica hoy
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-[14px] bg-[#45D39A]/[0.12] px-2.5 py-[5px] text-[10.5px] font-semibold text-[#45D39A]">
              <CheckCircle2 className="h-[11px] w-[11px]" />v{latestVersion} vigente
            </span>
          </header>

          <div className="h-px bg-white/[0.09]" />

          <div className="hidden items-center gap-3.5 px-5 py-[13px] lg:flex">
            <span className="w-[38px]" />
            <span className="flex-1 font-mono text-[9.5px] font-medium tracking-[1.2px] text-white/50">
              CAMBIO
            </span>
            <span className="w-[150px] font-mono text-[9.5px] font-medium tracking-[1.2px] text-white/50">
              ALCANCE
            </span>
            <span className="w-[120px] font-mono text-[9.5px] font-medium tracking-[1.2px] text-white/50">
              DEL % AL %
            </span>
            <span className="w-[96px]" />
          </div>

          <div className="h-px bg-white/[0.09]" />

          <ul>
            {changes.map((change, index) => {
              const { item } = change;
              const isCurrent = (item.version ?? 0) === latestVersion && index === 0;
              const scope = scopeOf(item);
              const verb = ACTION_LABEL[item.action] ?? "actualizado";
              const title =
                item.role === "owner"
                  ? `Split del owner ${verb}`
                  : `Split de ${change.subject} ${verb}`;

              return (
                <li key={change.key}>
                  {index > 0 && <div className="h-px bg-white/[0.09]" />}
                  <button
                    type="button"
                    onClick={() => setSelectedKey(change.key)}
                    className={`flex w-full flex-wrap items-center gap-3.5 px-5 py-3 text-left transition-colors hover:bg-white/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#FF5C00]/70 ${
                      isCurrent ? "bg-[#FF5C00]/[0.08]" : ""
                    }`}
                  >
                    <span
                      className={`grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[12px] font-mono text-[12px] font-semibold ${
                        isCurrent ? "bg-[#FF5C00] text-white" : "bg-white/[0.06] text-white/65"
                      }`}
                    >
                      v{item.version ?? "—"}
                    </span>

                    <span className="flex min-w-[180px] flex-1 flex-col gap-0.5">
                      <span className="truncate text-[13px] font-semibold text-white">{title}</span>
                      <span className="truncate text-[11px] text-white/50">
                        por {item.updatedBy?.name || "—"} · {formatDate(splitDate(item))}
                      </span>
                    </span>

                    <span className="flex w-[150px] items-center gap-1.5">
                      {scope.worldwide ? (
                        <Globe className="h-3 w-3 shrink-0 text-white/50" />
                      ) : (
                        <Radio className="h-3 w-3 shrink-0 text-white/50" />
                      )}
                      <span className="truncate text-[11px] text-white/65">{scope.text}</span>
                    </span>

                    <span className="flex w-[120px] flex-col gap-0.5">
                      <span className="flex items-center gap-2">
                        <span className="font-mono text-[12.5px] font-medium text-white/50">
                          {change.previousPercentage === null
                            ? "—"
                            : `${change.previousPercentage}%`}
                        </span>
                        <ArrowRight className="h-3 w-3 text-white/50" />
                        <span className="font-mono text-[14px] font-semibold text-white">
                          {item.percentage ?? 0}%
                        </span>
                      </span>
                      {(item.periods?.length ?? 0) > 0 && (
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-[#FF8A3D]">
                          <CalendarRange className="h-2.5 w-2.5 shrink-0" />
                          {item.periods?.length}{" "}
                          {item.periods?.length === 1 ? "tramo" : "tramos"} · y después
                        </span>
                      )}
                    </span>

                    <span className="flex w-[96px] items-center justify-end gap-1.5 text-[11.5px] font-semibold text-[#FF8A3D]">
                      Ver detalle
                      <ArrowRight className="h-3 w-3" />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="h-px bg-white/[0.09]" />

          <footer className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
            <span className="flex items-center gap-2.5 text-[12px] text-white/65">
              <GitBranch className="h-3.5 w-3.5" />
              {changes.length} {changes.length === 1 ? "versión" : "versiones"} desde el {oldestDate}
            </span>
            <span className="text-[11px] text-white/50">
              Las versiones anteriores no se borran: quedan como registro de lo acordado
            </span>
          </footer>
        </section>

      </div>

      {selected && (
        <VersionDetailModal
          change={selected}
          isCurrent={(selected.item.version ?? 0) === latestVersion}
          latestVersion={latestVersion}
          onClose={() => setSelectedKey(null)}
        />
      )}
    </>
  );
};

/** Envoltura de tarjeta para los estados de carga, error y vacío. */
const Card = ({ children }: { children: React.ReactNode }) => (
  <div className="glass overflow-hidden rounded-[28px]">
    {children}
  </div>
);

/** Ficha de una versión: enseña qué cambió respecto a la anterior, no solo cómo quedó. */
const VersionDetailModal = ({
  change,
  isCurrent,
  latestVersion,
  onClose,
}: {
  change: SplitChange;
  isCurrent: boolean;
  latestVersion: number;
  onClose: () => void;
}) => {
  const { item } = change;
  const scope = scopeOf(item);
  const before = change.previousPercentage;
  const after = item.percentage ?? 0;
  const delta = before === null ? null : after - before;

  const rows = [
    {
      icon: Globe,
      label: "Países",
      value: item.countriesType === "all" ? "Todos" : item.selectedCountries?.join(", ") || "—",
    },
    {
      icon: Radio,
      label: "Plataformas",
      value: item.platformsType === "all" ? "Todas" : item.selectedPlatforms?.join(", ") || "—",
    },
    {
      icon: Hash,
      label: "Versión",
      value: isCurrent
        ? `v${item.version} · vigente`
        : `v${item.version} · sustituida por la v${latestVersion}`,
    },
    { icon: User, label: "Modificado por", value: item.updatedBy?.name || "—" },
    { icon: Calendar, label: "Fecha", value: formatDateTime(splitDate(item)) },
  ];

  const who = item.role === "owner" ? "Split del owner" : `Split de ${change.subject}`;

  return (
    <ModalShell
      title={`${who} · v${item.version}`}
      subtitle={`${ACTION_LABEL[item.action] === "creado" ? "Creado" : "Modificado"} el ${formatDate(splitDate(item))}`}
      logo={
        <ModalMark>
          <GitBranch className="h-[18px] w-[18px]" />
        </ModalMark>
      }
      onClose={onClose}
      footer={
        <>
          <FooterNote>
            {isCurrent
              ? "Esta es la versión que se aplica al reparto de hoy."
              : `Esta versión ya no está vigente: la sustituyó la v${latestVersion}.`}
          </FooterNote>
          <SecondaryButton onClick={onClose}>Cerrar</SecondaryButton>
        </>
      }
    >
      <div className="flex flex-col gap-2.5 rounded-[18px] bg-[#F4F5F7] px-5 py-[18px]">
        <span className="font-mono text-[9.5px] font-medium tracking-[1.2px] text-[#A6AAB2]">
          QUÉ CAMBIÓ
        </span>
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-[26px] font-medium text-[#A6AAB2]">
            {before === null ? "—" : `${before}%`}
          </span>
          <ArrowRight className="h-[18px] w-[18px] text-[#A6AAB2]" />
          <span className="font-mono text-[26px] font-semibold text-[#1C1D22]">{after}%</span>
          {delta !== null && delta !== 0 && (
            <span
              className={`rounded-[12px] px-2.5 py-1 text-[10.5px] font-semibold ${
                delta > 0 ? "bg-[#E4F5EC] text-[#2FB37E]" : "bg-[#FDECEC] text-[#E5484D]"
              }`}
            >
              {delta > 0 ? "+" : ""}
              {delta} puntos
            </span>
          )}
        </div>
        <p className="text-[11.5px] text-[#71757E]">
          {before === null
            ? `Es el primer split de ${item.role === "owner" ? "el owner" : change.subject} en esta canción.`
            : `El alcance aplicado fue: ${scope.text.toLowerCase()}.`}
        </p>
      </div>

      {(item.periods?.length ?? 0) > 0 && (
        <div className="flex flex-col gap-2 rounded-[18px] border border-[#E8E8EC] p-4">
          <span className="flex items-center gap-1.5 font-mono text-[9.5px] font-medium tracking-[1.2px] text-[#A6AAB2]">
            <CalendarRange className="h-3 w-3" />
            TRAMOS DE ESTA VERSIÓN
          </span>
          <ul className="flex flex-col gap-1.5">
            {item.periods?.map((period) => (
              <li
                key={`${period.from}-${period.to}`}
                className="flex items-center justify-between gap-3 rounded-[12px] bg-[#F4F5F7] px-3 py-2"
              >
                <span className="truncate font-mono text-[11.5px] text-[#71757E]">
                  {period.openStart
                    ? `desde su lanzamiento → ${formatMonth(period.to)}`
                    : formatPeriodRange(period)}
                </span>
                <span className="shrink-0 font-mono text-[12.5px] font-semibold text-[#1C1D22]">
                  {period.percentage}%
                </span>
              </li>
            ))}
          </ul>
          <p className="text-[11px] leading-[1.45] text-[#A6AAB2]">
            Al acabar el último tramo se aplicaba el {after}%, ya sin fecha de fin.
          </p>
        </div>
      )}

      <div className="overflow-hidden rounded-[18px] border border-[#E8E8EC]">
        {rows.map((row, i) => (
          <div key={row.label}>
            {i > 0 && <div className="h-px bg-[#E8E8EC]" />}
            <div className="flex items-center gap-2.5 px-4 py-3">
              <row.icon className="h-3.5 w-3.5 shrink-0 text-[#A6AAB2]" />
              <span className="flex-1 text-[12.5px] text-[#71757E]">{row.label}</span>
              <span className="max-w-[55%] truncate text-right text-[12.5px] font-semibold text-[#1C1D22]">
                {row.value}
              </span>
            </div>
          </div>
        ))}
      </div>
    </ModalShell>
  );
};

export default Historyofsplits;
