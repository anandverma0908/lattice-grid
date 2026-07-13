import { useCallback } from "react";
import type { GridStyles } from "../types";

export interface UseRowBackgroundColorsOptions<TData> {
  isRowSelected: (row: TData, rowIndex: number) => boolean;
  alternateRows: boolean;
  styles: GridStyles;
}

export interface RowBackgroundColors<TData> {
  rowBg: (row: TData, rowIndex: number) => string;
  pinnedRowBg: (row: TData, rowIndex: number) => string;
}

export function useRowBackgroundColors<TData>({
  isRowSelected,
  alternateRows,
  styles,
}: UseRowBackgroundColorsOptions<TData>): RowBackgroundColors<TData> {
  const rowBg = useCallback(
    (row: TData, ri: number) => {
      if (isRowSelected(row, ri))
        return (
          (styles.rowSelected?.background as string | undefined) ??
          (styles.rowSelected?.backgroundColor as string | undefined) ??
          "var(--vg-bg-row-selected)"
        );
      if (alternateRows && ri % 2 === 1) return "var(--vg-bg-row-alt)";
      return (
        (styles.row?.background as string | undefined) ??
        (styles.row?.backgroundColor as string | undefined) ??
        "var(--vg-bg)"
      );
    },
    [isRowSelected, alternateRows, styles.rowSelected, styles.row],
  );

  const pinnedRowBg = useCallback(
    (row: TData, ri: number) => {
      if (isRowSelected(row, ri))
        return (
          (styles.rowSelected?.background as string | undefined) ??
          (styles.rowSelected?.backgroundColor as string | undefined) ??
          "var(--vg-bg-row-selected)"
        );
      if (alternateRows && ri % 2 === 1) return "var(--vg-bg-row-alt)";
      return (
        (styles.pinnedCell?.background as string | undefined) ??
        (styles.pinnedCell?.backgroundColor as string | undefined) ??
        (styles.row?.background as string | undefined) ??
        "var(--vg-bg-pinned)"
      );
    },
    [isRowSelected, alternateRows, styles.rowSelected, styles.row, styles.pinnedCell],
  );

  return { rowBg, pinnedRowBg };
}
