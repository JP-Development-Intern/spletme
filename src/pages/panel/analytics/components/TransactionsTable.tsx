import { Link } from "react-router-dom";
import { formatCurrency } from "@/utils/format.utils";
import { analyticsService } from "@/services/analyticsService";
import { useAnalyticsPage } from "@/hooks/useAnalytics";
import type { AnalyticsFilters, Transaction } from "@/types/analytics.types";
import { AnalyticsTable, type Column } from "./AnalyticsTable";
import { CountryCode } from "./AnalyticsPanel";
import { countryLabel, displayName, formatMonth, platformColor } from "../analytics.utils";

interface Props {
  filters: AnalyticsFilters;
  filtered: boolean;
  onClearFilters: () => void;
}

const COLUMNS: Column<Transaction>[] = [
  {
    key: "song",
    label: "Canción",
    className: "max-w-[260px]",
    render: (tx) => (
      <div className="flex min-w-0 flex-col">
        {tx.songId ? (
          <Link
            to={`/panel/song/${tx.songId}`}
            className="truncate text-[13px] font-semibold text-white transition-colors hover:text-[#FFB067]"
          >
            {tx.trackTitle || "Sin título"}
          </Link>
        ) : (
          <span className="truncate text-[13px] font-semibold text-white">{tx.trackTitle || "Sin título"}</span>
        )}
        <span className="truncate text-[11.5px] text-white/50">{tx.artistName || "—"}</span>
      </div>
    ),
  },
  {
    key: "platform",
    label: "Plataforma",
    render: (tx) => (
      <span className="flex items-center gap-2 whitespace-nowrap text-[12.5px] text-white/80">
        <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: platformColor(tx.platform) }} />
        {displayName(tx.platform)}
      </span>
    ),
  },
  {
    key: "country",
    label: "País",
    render: (tx) => {
      const { code, name } = countryLabel(tx.country);
      return (
        <span className="flex items-center gap-1.5 whitespace-nowrap text-[12.5px] text-white/70">
          {name}
          {code !== name && <CountryCode code={code} />}
        </span>
      );
    },
  },
  {
    key: "period",
    label: "Reporte",
    render: (tx) => <span className="whitespace-nowrap text-[12.5px] text-white/70">{formatMonth(tx.reportMonth)}</span>,
  },
  {
    key: "streams",
    label: "Streams",
    align: "right",
    render: (tx) => <span className="font-mono text-[12.5px] text-white/70">{(tx.quantity ?? 0).toLocaleString()}</span>,
  },
  {
    key: "gross",
    label: "Bruto",
    align: "right",
    render: (tx) => <span className="font-mono text-[12.5px] text-white/50">{formatCurrency(tx.grossIncome ?? 0)}</span>,
  },
  {
    key: "net",
    label: "Neto",
    align: "right",
    render: (tx) => (
      <span className="font-mono text-[13px] font-medium text-[#45D39A]">{formatCurrency(tx.netIncome ?? 0)}</span>
    ),
  },
];

/** Cada línea de los reportes de los distribuidores, la más reciente primero. */
export default function TransactionsTable({ filters, filtered, onClearFilters }: Props) {
  const list = useAnalyticsPage(analyticsService.getTransactions, filters, 20);

  return (
    <AnalyticsTable
      title="Transacciones"
      noun="transacciones"
      columns={COLUMNS}
      rowKey={(tx, i) => `${tx.songId}-${tx.platform}-${tx.country}-${tx.reportMonth}-${i}`}
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
      minWidth="860px"
    />
  );
}
