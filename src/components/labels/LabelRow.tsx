import { Link, useNavigate } from "react-router-dom";
import {
  Tag,
  Layers,
  Plus,
  Check,
  ChevronRight,
  Eye,
  Pencil,
  UserPlus,
  Trash2,
  Users,
  ShieldCheck,
} from "lucide-react";
import { formatCurrency } from "@/utils/format.utils";
import { viewerIsAccountOwner } from "@/utils/ownerVisibility";
import { RowActionsMenu, type MenuAction } from "@/components/distributors/RowActionsMenu";
import { SplitCoverageMeter } from "./SplitCoverageMeter";
import { LABEL_COLUMNS, labelsGrid } from "./labelsColumns";
import type { LabelListItem } from "./types";

interface LabelRowProps {
  item: LabelListItem;
  onCreateSplits: (item: LabelListItem) => void;
  onEdit: (item: LabelListItem) => void;
  onInvite: (item: LabelListItem) => void;
  onDelete: (item: LabelListItem) => void;
  onPermissions?: (item: LabelListItem) => void;
}

/** Hasta un decimal, sin ceros sobrantes: 50 → «50», 33.333 → «33.3». */
const formatPercentage = (value: number): string => String(Math.round(value * 10) / 10);

const visibility = (key: string) => LABEL_COLUMNS.find((column) => column.key === key)!.visibility;

/**
 * Ruta del detalle. Los artísticos van por su id; los personalizados tienen su
 * propia ruta, por nombre, porque agrupan sellos.
 */
function labelPath(item: LabelListItem): string {
  return item.isCustom
    ? `/panel/labels/custom/${encodeURIComponent(item.name)}`
    : `/panel/labels/${encodeURIComponent(item.id)}`;
}

/**
 * Fila de la tabla de sellos. La fila entera lleva al detalle: los controles que
 * hacen otra cosa por sí mismos detienen el clic.
 *
 * Solo se ve una acción, la que toca ahora —repartir lo que falta—; el resto
 * viven en el menú. Antes competían cuatro botones del mismo peso en cada fila.
 */
export function LabelRow({
  item,
  onCreateSplits,
  onEdit,
  onInvite,
  onDelete,
  onPermissions,
}: LabelRowProps) {
  const navigate = useNavigate();
  const to = labelPath(item);
  const { coverage } = item;
  const showToPay = viewerIsAccountOwner();

  const actions: MenuAction[] = [
    {
      key: "view",
      label: item.isCustom ? "Ver sellos que agrupa" : "Ver canciones",
      icon: <Eye className="h-4 w-4" />,
      onSelect: () => navigate(to),
    },
    {
      key: "invite",
      label: "Invitar colaborador",
      icon: <UserPlus className="h-4 w-4" />,
      onSelect: () => onInvite(item),
    },
  ];

  // Editar y eliminar solo tienen sentido en lo que tú creaste: un sello
  // artístico lo reporta la distribuidora y no se puede cambiar desde aquí.
  if (item.isCustom) {
    actions.splice(1, 0, {
      key: "edit",
      label: "Editar sello",
      icon: <Pencil className="h-4 w-4" />,
      onSelect: () => onEdit(item),
    });
    actions.push({
      key: "delete",
      label: "Eliminar sello",
      icon: <Trash2 className="h-4 w-4" />,
      onSelect: () => onDelete(item),
      danger: true,
    });
  }

  return (
    <div
      onClick={() => navigate(to)}
      className={`${labelsGrid(showToPay)} group cursor-pointer px-5 py-3 transition-colors hover:bg-white/[0.04]`}
    >
      {/* Sello */}
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={`flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center rounded-[14px] ${
            item.isCustom ? "bg-[#FF5C00]" : "bg-[#FF5C00]/[0.16]"
          }`}
        >
          {item.isCustom ? (
            <Layers className="h-[17px] w-[17px] text-white" />
          ) : (
            <Tag className="h-[17px] w-[17px] text-[#FF8A3D]" />
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="flex min-w-0 items-center gap-2">
            <Link
              to={to}
              onClick={(e) => e.stopPropagation()}
              title={item.name}
              className="truncate text-[13.5px] font-semibold text-white transition-colors group-hover:text-[#FFB067]"
            >
              {item.name || "Sin sello"}
            </Link>
            {item.isCustom && (
              <span className="flex-shrink-0 rounded-full bg-[#FF5C00]/[0.16] px-[7px] py-px text-[10px] font-semibold text-[#FF9A5C]">
                Personalizado
              </span>
            )}
          </div>
          <GroupedLabels item={item} />
        </div>
      </div>

      {/* Canciones */}
      <div className={visibility("songs")}>
        <span className="font-mono text-[13px] font-medium text-white">
          {item.songCount.toLocaleString()}
        </span>
      </div>

      {/* Cobertura de splits */}
      <div className={`${visibility("coverage")} min-w-0`}>
        <SplitCoverageMeter coverage={coverage} className="w-full" onGlass />
      </div>

      {/* Colaboradores: visible para todos */}
      <div className={visibility("collaborators")}>
        <span
          title={item.collaborators.map((person) => person.name ?? person.email).filter(Boolean).join(", ")}
          className="flex items-center gap-1.5 font-mono text-[13px] font-medium text-white"
        >
          <Users className="h-3.5 w-3.5 text-white/50" />
          {item.collaborators.length}
        </span>
      </div>

      {/* Estado del split */}
      <div className={visibility("splitStatus")}>
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
            item.splitActive ? "bg-[#45D39A]/[0.12] text-[#45D39A]" : "bg-white/[0.08] text-white/65"
          }`}
        >
          {item.splitActive ? "Activo" : "Inactivo"}
        </span>
      </div>

      {/* Ingresos */}
      <div className={visibility("income")}>
        <span className="font-mono text-[14px] text-[#45D39A]">
          {formatCurrency(item.totalNetIncome)}
        </span>
      </div>

      {/* Ganancia del owner */}
      <div className={visibility("owner")}>
        <span className="font-mono text-[14px] text-[#FF8A3D]">
          {formatCurrency(item.ownerEarnings)}
        </span>
      </div>

      {/* Porcentaje del owner en el sello */}
      {showToPay && (
        <div className={visibility("ownerPct")}>
          <span className="font-mono text-[13px] font-medium text-white">
            {item.ownerPercentage === null ? "—" : `${formatPercentage(item.ownerPercentage)}%`}
          </span>
        </div>
      )}

      {/* A pagar: solo el owner */}
      {showToPay && (
        <div className={visibility("toPay")}>
          <span className="font-mono text-[14px] text-white">
            {formatCurrency(item.totalToPay)}
          </span>
        </div>
      )}

      {/* Permisos: solo el owner */}
      {showToPay && (
        <div className={visibility("permissions")} onClick={(e) => e.stopPropagation()}>
          {onPermissions && (
            <button
              onClick={() => onPermissions(item)}
              title="Elegir qué ve cada colaborador y sello"
              aria-label={`Permisos de ${item.name}`}
              className="flex items-center gap-1.5 rounded-[15px] bg-white/[0.06] px-3 py-1.5 text-[11.5px] font-semibold text-white/70 transition-colors hover:bg-white/[0.12] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70"
            >
              <ShieldCheck className="h-3.5 w-3.5 flex-shrink-0" />
              Permisos
            </button>
          )}
        </div>
      )}

      {/* Acciones */}
      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
        {coverage.complete ? (
          <span
            title="Todas las canciones de este sello tienen split"
            className="hidden items-center gap-1.5 rounded-full bg-[#45D39A]/[0.12] px-2.5 py-1.5 text-[11.5px] font-semibold text-[#45D39A] sm:flex"
          >
            <Check className="h-3 w-3" />
            Completo
          </span>
        ) : (
          <button
            onClick={() => onCreateSplits(item)}
            title={`Repartir las canciones de ${item.name}`}
            className="hidden items-center gap-1.5 rounded-full border border-[#FF8A3D]/35 bg-[#FF5C00]/[0.16] px-2.5 py-1.5 text-[11.5px] font-semibold text-[#FF9A5C] transition-colors hover:bg-[#FF5C00]/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70 sm:flex"
          >
            <Plus className="h-3 w-3" />
            Crear splits
          </button>
        )}

        <RowActionsMenu onGlass actions={actions} label={`Acciones de ${item.name}`} />
        <ChevronRight className="hidden h-4 w-4 flex-shrink-0 text-white/40 lg:block" />
      </div>
    </div>
  );
}

/**
 * Segunda línea del sello. En un personalizado enumera lo que agrupa —la
 * relación que antes no se veía en ninguna parte—; en uno artístico, su artista.
 */
function GroupedLabels({ item }: { item: LabelListItem }) {
  if (!item.isCustom) {
    const artist = item.source?.topSongs?.[0]?.artistName;
    return (
      <span className="truncate text-[11px] text-white/50">
        {artist ?? `${item.songCount} ${item.songCount === 1 ? "canción" : "canciones"}`}
      </span>
    );
  }

  if (item.artisticLabels.length === 0) {
    return <span className="truncate text-[11px] text-white/50">Sin sellos agrupados</span>;
  }

  const shown = item.artisticLabels.slice(0, 2);
  const rest = item.artisticLabels.length - shown.length;

  return (
    <span className="flex min-w-0 items-center gap-1.5">
      <span className="flex-shrink-0 text-[11px] text-white/50">Agrupa</span>
      {shown.map((name) => (
        <span
          key={name}
          title={name}
          className="max-w-[110px] truncate rounded-full bg-white/[0.08] px-[7px] py-px text-[10.5px] font-medium text-white/70"
        >
          {name}
        </span>
      ))}
      {rest > 0 && (
        <span
          title={item.artisticLabels.slice(2).join(", ")}
          className="flex-shrink-0 font-mono text-[10.5px] font-medium text-white/50"
        >
          +{rest}
        </span>
      )}
    </span>
  );
}
