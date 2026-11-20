import { Link } from "react-router-dom";
import { formatCurrency, formatStreams } from "@/utils/format.utils";
import { CopyButton } from "@/components/ui/CopyButton";
import { analyticsService } from "@/services/analyticsService";
import { useAnalyticsPage } from "@/hooks/useAnalytics";
import type { AnalyticsFilters, AnalyticsSong } from "@/types/analytics.types";
import { AnalyticsTable, type Column } from "./AnalyticsTable";
import { formatPerThousand, perThousand } from "../analytics.utils";

interface Props {
  filters: AnalyticsFilters;
  filtered: boolean;
  onClearFilters: () => void;
}

const COLUMNS: Column<AnalyticsSong>[] = [
  {
    key: "song",
    label: "Canción",
    className: "max-w-[280px]",
    render: (song) => (
      <div className="flex min-w-0 flex-col">
        <Link
          to={`/panel/song/${song.songId}`}
          className="truncate text-[13px] font-semibold text-white transition-colors hover:text-[#FFB067]"
        >
          {song.trackTitle || "Sin título"}
        </Link>
        <span className="truncate text-[11.5px] text-white/50">{song.artistName || "—"}</span>
      </div>
    ),
  },
  {
    key: "label",
    label: "Sello",
    className: "max-w-[160px]",
    render: (song) => <span className="block truncate text-[12.5px] text-white/70">{song.artisticLabel || "—"}</span>,
  },
  {
    key: "isrc",
    label: "ISRC",
    render: (song) =>
      song.isrc ? (
        <span className="flex items-center gap-1 whitespace-nowrap font-mono text-[11.5px] text-white/50">
          {song.isrc}
          <CopyButton
            value={song.isrc}
            title="Copiar ISRC"
            className="!text-white/45 hover:!bg-white/10 hover:!text-[#FFB067]"
          />
        </span>
      ) : (
        <span className="text-white/40">—</span>
      ),
  },
  {
    key: "platforms",
    label: "Tiendas",
    align: "center",
    render: (song) => (
      <span className="rounded-full bg-white/[0.08] px-2 py-0.5 font-mono text-[11.5px] font-semibold text-white/80">
        {song.platformCount}
      </span>
    ),
  },
  {
    key: "streams",
    label: "Streams",
    align: "right",
    render: (song) => <span className="font-mono text-[12.5px] text-white/70">{formatStreams(song.streams ?? 0)}</span>,
  },
  {
    key: "rate",
    label: "Por 1.000",
    align: "right",
    render: (song) => (
      <span className="font-mono text-[12.5px] text-white/70">
        {formatPerThousand(perThousand(song.netIncome ?? 0, song.streams ?? 0))}
      </span>
    ),
  },
  {
    key: "income",
    label: "Ingresos",
    align: "right",
    render: (song) => (
      <span className="font-mono text-[13px] font-medium text-[#45D39A]">{formatCurrency(song.netIncome ?? 0)}</span>
    ),
  },
];

/** Canciones con ingresos en el filtro, de la que más ingresa a la que menos. */
export default function SongsAnalyticsView({ filters, filtered, onClearFilters }: Props) {
  const list = useAnalyticsPage(analyticsService.getSongs, filters, 10);

  return (
    <AnalyticsTable
      title="Canciones"
      noun="canciones"
      columns={COLUMNS}
      rowKey={(song, i) => song.songId ?? String(i)}
      result={list.data}
      loading={list.loading}
      error={list.error}
      onRetry={list.retry}
      page={list.page}
      limit={list.limit}
      onPageChange={list.setPage}
      onLimitChange={list.setLimit}
      filtered={filtered}
      onClearFilters={onClearFilters}
      minWidth="880px"
    />
  );
}
