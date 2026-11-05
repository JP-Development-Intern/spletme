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
}

/** Hasta un decimal, sin ceros sobrantes: 50 → «50», 33.333 → «33.3». */
const formatPercentage = (value: number): string => String(Math.round(value * 10) / 10);

const visibility = (key: string) => LABEL_COLUMNS.find((column) => column.key === key)!.visibility;

/** Ruta del detalle: los personalizados tienen la suya porque agrupan sellos. */
function labelPath(item: LabelListItem): string {
  const encoded = encodeURIComponent(item.name);
  return item.isCustom ? `/panel/labels/custom/${encoded}` : `/panel/labels/${encoded}`;
}

/**
 * Fila de la tabla de sellos. La fila entera lleva al detalle: los controles que
 * hacen otra cosa por sí mismos detienen el clic.
 *
 * Solo se ve una acción, la que toca ahora —repartir lo que falta—; el resto
 * viven en el menú. Antes competían cuatro botones del mismo peso en cada fila.
 */
export function LabelRow({ item, onCreateSplits, onEdit, onInvite, onDelete }: LabelRowProps) {
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
      className={`${labelsGrid(showToPay)} group cursor-pointer px-5 py-3 transition-colors hover:bg-[#F4F5F7]`}
    >
      {/* Sello */}
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={`flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center rounded-[14px] ${
            item.isCustom ? "bg-[#FF5C00]" : "bg-[#FFEADD]"
          }`}
        >
          {item.isCustom ? (
            <Layers className="h-[17px] w-[17px] text-white" />
          ) : (
            <Tag className="h-[17px] w-[17px] text-[#FF5C00]" />
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="flex min-w-0 items-center gap-2">
            <Link
              to={to}
              onClick={(e) => e.stopPropagation()}
              title={item.name}
              className="truncate text-[13.5px] font-semibold text-[#1C1D22] transition-colors group-hover:text-[#FF5C00]"
            >
              {item.name || "Sin sello"}
            </Link>
            {item.isCustom && (
              <span className="flex-shrink-0 rounded-[10px] bg-[#FFEADD] px-[7px] py-px text-[10px] font-semibold text-[#FF5C00]">
                Personalizado
              </span>
            )}
          </div>
          <GroupedLabels item={item} />
        </div>
      </div>

      {/* Canciones */}
      <div className={visibility("songs")}>
        <span className="font-mono text-[13px] font-semibold text-[#1C1D22]">
          {item.songCount.toLocaleString()}
        </span>
      </div>

      {/* Cobertura de splits */}
      <div className={`${visibility("coverage")} min-w-0`}>
        <SplitCoverageMeter coverage={coverage} className="w-full" />
      </div>

      {/* Colaboradores: visible para todos */}
      <div className={visibility("collaborators")}>
        <span
          title={item.collaborators.map((person) => person.name ?? person.email).filter(Boolean).join(", ")}
          className="flex items-center gap-1.5 font-mono text-[13px] font-semibold text-[#1C1D22]"
        >
          <Users className="h-3.5 w-3.5 text-[#A6AAB2]" />
          {item.collaborators.length}
        </span>
      </div>

      {/* Estado del split */}
      <div className={visibility("splitStatus")}>
        <span
          className={`rounded-[10px] px-2 py-0.5 text-[11px] font-semibold ${
            item.splitActive ? "bg-[#E4F5EC] text-[#2FB37E]" : "bg-[#F4F5F7] text-[#71757E]"
          }`}
        >
          {item.splitActive ? "Activo" : "Inactivo"}
        </span>
      </div>

      {/* Ingresos */}
      <div className={visibility("income")}>
        <span className="font-mono text-[13px] font-semibold text-[#2FB37E]">
          {formatCurrency(item.totalNetIncome)}
        </span>
      </div>

      {/* Ganancia del owner */}
      <div className={visibility("owner")}>
        <span className="font-mono text-[13px] font-semibold text-[#FF5C00]">
          {formatCurrency(item.ownerEarnings)}
        </span>
      </div>

      {/* Porcentaje del owner en el sello */}
      {showToPay && (
        <div className={visibility("ownerPct")}>
          <span className="font-mono text-[13px] font-semibold text-[#1C1D22]">
            {item.ownerPercentage === null ? "—" : `${formatPercentage(item.ownerPercentage)}%`}
          </span>
        </div>
      )}

      {/* A pagar: solo el owner */}
      {showToPay && (
        <div className={visibility("toPay")}>
          <span className="font-mono text-[13px] font-semibold text-[#1C1D22]">
            {formatCurrency(item.totalToPay)}
          </span>
        </div>
      )}

      {/* Acciones */}
      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
        {coverage.complete ? (
          <span
            title="Todas las canciones de este sello tienen split"
            className="hidden items-center gap-1.5 rounded-2xl bg-[#E4F5EC] px-2.5 py-1.5 text-[11.5px] font-semibold text-[#2FB37E] sm:flex"
          >
            <Check className="h-3 w-3" />
            Completo
          </span>
        ) : (
          <button
            onClick={() => onCreateSplits(item)}
            title={`Repartir las canciones de ${item.name}`}
            className="hidden items-center gap-1.5 rounded-2xl bg-[#FFEADD] px-2.5 py-1.5 text-[11.5px] font-semibold text-[#FF5C00] transition-colors hover:bg-[#FF5C00] hover:text-white sm:flex"
          >
            <Plus className="h-3 w-3" />
            Crear splits
          </button>
        )}

        <RowActionsMenu actions={actions} label={`Acciones de ${item.name}`} />
        <ChevronRight className="hidden h-4 w-4 flex-shrink-0 text-[#A6AAB2] lg:block" />
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
      <span className="truncate text-[11px] text-[#A6AAB2]">
        {artist ?? `${item.songCount} ${item.songCount === 1 ? "canción" : "canciones"}`}
      </span>
    );
  }

  if (item.artisticLabels.length === 0) {
    return <span className="truncate text-[11px] text-[#A6AAB2]">Sin sellos agrupados</span>;
  }

  const shown = item.artisticLabels.slice(0, 2);
  const rest = item.artisticLabels.length - shown.length;

  return (
    <span className="flex min-w-0 items-center gap-1.5">
      <span className="flex-shrink-0 text-[11px] text-[#A6AAB2]">Agrupa</span>
      {shown.map((name) => (
        <span
          key={name}
          title={name}
          className="max-w-[110px] truncate rounded-[9px] bg-[#F4F5F7] px-[7px] py-px text-[10.5px] font-medium text-[#71757E]"
        >
          {name}
        </span>
      ))}
      {rest > 0 && (
        <span
          title={item.artisticLabels.slice(2).join(", ")}
          className="flex-shrink-0 font-mono text-[10.5px] font-medium text-[#A6AAB2]"
        >
          +{rest}
        </span>
      )}
    </span>
  );
}
