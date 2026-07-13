import { useCallback, useEffect, useRef, useState } from "react";
import type { GroupedRow, LeafRow } from "../types";

export interface UseInternalRowSelectionOptions<TData> {
  rowSelectionEnabled: boolean;
  visibleRows: GroupedRow<TData>[];
  getRowId?: ((row: TData, index: number) => string | number) | undefined;
  selectedRowId?: string | number | null | undefined;
  onRowClick?: ((row: TData, index: number) => void) | undefined;
  onRowsDelete?: ((rows: TData[], rowIndexes: number[]) => void) | undefined;
  announce: (message: string) => void;
}

export interface UseInternalRowSelectionReturn<TData> {
  selectedRowKeys: Set<string>;
  getRowKey: (row: TData, rowIndex: number) => string;
  isRowSelected: (row: TData, rowIndex: number) => boolean;
  handleRowClick: (row: TData, rowIndex: number) => void;
  selectRowByIndex: (rowIndex: number, additive: boolean) => void;
  selectRangeByIndex: (fromRowIndex: number, toRowIndex: number) => void;
  selectAllRows: () => void;
  deleteSelectedRows: () => void;
}

export function useInternalRowSelection<TData>({
  rowSelectionEnabled,
  visibleRows,
  getRowId,
  selectedRowId,
  onRowClick,
  onRowsDelete,
  announce,
}: UseInternalRowSelectionOptions<TData>): UseInternalRowSelectionReturn<TData> {
  const [selectedRowKeys, setSelectedRowKeys] = useState<Set<string>>(
    () => new Set(),
  );
  const selectionAnchorRef = useRef<number | null>(null);

  useEffect(() => {
    if (!rowSelectionEnabled) return;
    setSelectedRowKeys(
      selectedRowId != null ? new Set([String(selectedRowId)]) : new Set(),
    );
  }, [selectedRowId, rowSelectionEnabled]);

  const getRowKey = useCallback(
    (row: TData, rowIndex: number) =>
      getRowId ? String(getRowId(row, rowIndex)) : String(rowIndex),
    [getRowId],
  );

  const getLeafAtVisibleIndex = useCallback(
    (rowIndex: number): LeafRow<TData> | null => {
      const item = visibleRows[rowIndex];
      return item?.type === "leaf" ? item : null;
    },
    [visibleRows],
  );

  const handleRowClick = useCallback(
    (row: TData, rowIndex: number) => {
      if (rowSelectionEnabled) {
        const key = getRowKey(row, rowIndex);
        setSelectedRowKeys(new Set([key]));
        selectionAnchorRef.current = rowIndex;
      }
      onRowClick?.(row, rowIndex);
    },
    [rowSelectionEnabled, getRowKey, onRowClick],
  );

  const isRowSelected = useCallback(
    (row: TData, rowIndex: number): boolean => {
      if (!rowSelectionEnabled) return false;
      return selectedRowKeys.has(getRowKey(row, rowIndex));
    },
    [selectedRowKeys, rowSelectionEnabled, getRowKey],
  );

  const selectRowByIndex = useCallback(
    (rowIndex: number, additive: boolean) => {
      const leaf = getLeafAtVisibleIndex(rowIndex);
      if (!leaf || !rowSelectionEnabled) return;
      const key = getRowKey(leaf.row, leaf.rowIndex);
      setSelectedRowKeys((prev) => {
        const next = additive ? new Set(prev) : new Set<string>();
        if (next.has(key) && additive) {
          next.delete(key);
          announce(`Row ${rowIndex + 1} deselected`);
        } else {
          next.add(key);
          announce(`Row ${rowIndex + 1} selected`);
        }
        return next;
      });
      selectionAnchorRef.current = rowIndex;
    },
    [rowSelectionEnabled, getLeafAtVisibleIndex, getRowKey, announce],
  );

  const selectRangeByIndex = useCallback(
    (fromRowIndex: number, toRowIndex: number) => {
      if (!rowSelectionEnabled) return;
      const anchor = selectionAnchorRef.current ?? fromRowIndex;
      const lo = Math.max(0, Math.min(anchor, toRowIndex));
      const hi = Math.min(visibleRows.length - 1, Math.max(anchor, toRowIndex));
      setSelectedRowKeys((prev) => {
        const next = new Set(prev);
        for (let ri = lo; ri <= hi; ri++) {
          const leaf = getLeafAtVisibleIndex(ri);
          if (leaf) next.add(getRowKey(leaf.row, leaf.rowIndex));
        }
        return next;
      });
      announce(`Rows ${lo + 1} through ${hi + 1} selected`);
    },
    [rowSelectionEnabled, getLeafAtVisibleIndex, getRowKey, visibleRows.length, announce],
  );

  const selectAllRows = useCallback(() => {
    if (!rowSelectionEnabled) return;
    setSelectedRowKeys(
      new Set(
        visibleRows.flatMap((item) =>
          item.type === "leaf" ? [getRowKey(item.row, item.rowIndex)] : [],
        ),
      ),
    );
    const leafCount = visibleRows.filter((item) => item.type === "leaf").length;
    announce(`All ${leafCount} rows selected`);
  }, [rowSelectionEnabled, getRowKey, visibleRows, announce]);

  const deleteSelectedRows = useCallback(() => {
    if (selectedRowKeys.size === 0) return;
    const rows: TData[] = [];
    const rowIndexes: number[] = [];
    visibleRows.forEach((item) => {
      if (item.type === "leaf" && selectedRowKeys.has(getRowKey(item.row, item.rowIndex))) {
        rows.push(item.row);
        rowIndexes.push(item.rowIndex);
      }
    });
    if (rows.length === 0) return;
    if (typeof window !== "undefined") {
      const ok = window.confirm(`Delete ${rows.length} selected row(s)?`);
      if (!ok) return;
    }
    onRowsDelete?.(rows, rowIndexes);
    setSelectedRowKeys(new Set());
    announce(`${rows.length} selected row(s) deleted`);
  }, [getRowKey, onRowsDelete, selectedRowKeys, visibleRows, announce]);

  return {
    selectedRowKeys,
    getRowKey,
    isRowSelected,
    handleRowClick,
    selectRowByIndex,
    selectRangeByIndex,
    selectAllRows,
    deleteSelectedRows,
  };
}
