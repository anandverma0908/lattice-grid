import { useEffect, useMemo, useRef } from "react";
import {
  buildGroupedRows,
  flattenVisibleGroupedRows,
} from "../core/rowGrouping";
import type {
  GroupedRow,
  ResolvedColumn,
  RowGroupingState,
  SortState,
} from "../types";

export interface UseSortedGroupedRowsOptions<TData> {
  data: TData[];
  sortMode: "client" | "server";
  sortState: SortState;
  orderedColumns: ResolvedColumn<TData>[];
  rowGroupingState: RowGroupingState;
}

export function useSortedGroupedRows<TData>({
  data,
  sortMode,
  sortState,
  orderedColumns,
  rowGroupingState,
}: UseSortedGroupedRowsOptions<TData>): GroupedRow<TData>[] {
  const colForSortRef = useRef<ResolvedColumn<TData> | null>(null);
  useEffect(() => {
    colForSortRef.current = sortState.columnId
      ? (orderedColumns.find((c) => c.id === sortState.columnId) ?? null)
      : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortState.columnId]);

  const sortedData = useMemo((): TData[] => {
    if (sortMode === "server") return data;
    const col = colForSortRef.current;
    if (!sortState.columnId || !col) return data;
    const get =
      col.accessor ??
      ((r: TData) => (r as Record<string, unknown>)[col.field ?? col.id]);
    return [...data].sort((a, b) => {
      const va = get(a),
        vb = get(b);
      if (va == null) return 1;
      if (vb == null) return -1;
      const cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return sortState.direction === "asc" ? cmp : -cmp;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, sortMode, sortState.columnId, sortState.direction]);

  const groupedRows = useMemo(
    () =>
      buildGroupedRows(
        sortedData,
        rowGroupingState.groupBy,
        orderedColumns,
        rowGroupingState.expandedGroupIds,
      ),
    [sortedData, rowGroupingState.groupBy, rowGroupingState.expandedGroupIds, orderedColumns],
  );

  return useMemo(() => flattenVisibleGroupedRows(groupedRows), [groupedRows]);
}
