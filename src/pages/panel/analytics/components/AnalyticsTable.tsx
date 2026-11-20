import { MusicPagination } from "@/components/music/MusicPagination";
import type { PaginatedResult } from "@/types/analytics.types";
import { PanelState } from "./AnalyticsPanel";

export interface Column<T> {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
  /** Clases de la celda (ancho, visibilidad). */
  className?: string;
  render: (row: T) => React.ReactNode;
}

interface AnalyticsTableProps<T> {
  title: string;
  /** Qué se está paginando, en plural. */
  noun: string;
  columns: Column<T>[];
  rowKey: (row: T, index: number) => string;
  result: PaginatedResult<T> | null;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  filtered: boolean;
  onClearFilters: () => void;
  /** Ancho mínimo de la tabla antes de que aparezca el desplazamiento lateral. */
  minWidth: string;
}

const ALIGN = { left: "text-left", right: "text-right", center: "text-center" };

/**
 * Tabla paginada de las pestañas de detalle. En móvil se desplaza en horizontal
 * dentro de su vidrio, sin empujar la página.
 */
export function AnalyticsTable<T>({
  title,
  noun,
  columns,
  rowKey,
  result,
  loading,
  error,
  onRetry,
  page,
  limit,
  onPageChange,
  onLimitChange,
  filtered,
  onClearFilters,
  minWidth,
}: AnalyticsTableProps<T>) {
  const rows = result?.data ?? [];
  const total = result?.total ?? 0;
  const pageStart = (page - 1) * limit;

  return (
    <section className="glass overflow-hidden rounded-[28px]">
      <div className="flex items-center gap-2.5 px-6 pb-3 pt-5">
        <h2 className="font-display text-[19px] font-medium tracking-[-0.005em] text-white">{title}</h2>
        {result && (
          <span className="rounded-full bg-white/[0.08] px-2.5 py-0.5 font-mono text-[11px] font-semibold text-white/70">
            {total.toLocaleString()}
          </span>
        )}
      </div>

      <PanelState
        loading={loading}
        error={error}
        empty={rows.length === 0}
        onRetry={onRetry}
        filtered={filtered}
        onClearFilters={onClearFilters}
        height="h-[320px] px-6"
      >
        <div className="overflow-x-auto">
          <table className="w-full" style={{ minWidth }}>
            <thead>
              <tr className="bg-black/[0.08]">
                {columns.map((column) => (
                  <th
                    key={column.key}
                    scope="col"
                    className={`whitespace-nowrap px-4 py-3 text-[10.5px] font-medium tracking-[1.4px] text-white/50 first:pl-6 last:pr-6 ${
                      ALIGN[column.align ?? "left"]
                    }`}
                  >
                    {column.label.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.07]">
              {rows.map((row, i) => (
                <tr key={rowKey(row, i)} className="transition-colors hover:bg-white/[0.04]">
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`px-4 py-3 align-middle first:pl-6 last:pr-6 ${ALIGN[column.align ?? "left"]} ${
                        column.className ?? ""
                      }`}
                    >
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PanelState>

      {total > 0 && (
        <div className="border-t border-white/[0.09] px-6 py-3.5">
          <MusicPagination
            pageStart={pageStart}
            pageEnd={pageStart + rows.length}
            total={total}
            page={page}
            limit={limit}
            onLimitChange={onLimitChange}
            canGoNext={page < (result?.pages ?? 1)}
            onPrev={() => onPageChange(Math.max(1, page - 1))}
            onNext={() => onPageChange(page + 1)}
            noun={noun}
          />
        </div>
      )}
    </section>
  );
}
