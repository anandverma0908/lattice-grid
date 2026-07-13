import type { ReactNode } from "react";
import type { GridClassNames, GridStyles, GroupedRow, ResolvedColumn } from "../types";
import { DataCell } from "./Cells";

export interface FrozenColumnBodyProps<TData> {
  frozenColDef: ResolvedColumn<TData> | null;
  vRows: { startIndex: number; endIndex: number };
  visibleRows: GroupedRow<TData>[];
  rowHeight: number;
  frozenWidth: number;
  getRowId?: ((row: TData, index: number) => string | number) | undefined;
  isRowSelected: (row: TData, rowIndex: number) => boolean;
  styles: GridStyles;
  classNames: GridClassNames;
  handleRowClick: (row: TData, rowIndex: number) => void;
  visibleColIndexById: Map<string, number>;
  getRawCellValue: (
    row: TData,
    rowIndex: number,
    column: ResolvedColumn<TData>,
  ) => unknown;
  isScrolling: boolean;
  loadingCell?: ReactNode | undefined;
  rowSelectionIndicator?: ((row: TData, index: number) => ReactNode) | undefined;
}

export function FrozenColumnBody<TData>({
  frozenColDef,
  vRows,
  visibleRows,
  rowHeight,
  frozenWidth,
  getRowId,
  isRowSelected,
  styles,
  classNames,
  handleRowClick,
  visibleColIndexById,
  getRawCellValue,
  isScrolling,
  loadingCell,
  rowSelectionIndicator,
}: FrozenColumnBodyProps<TData>): ReactNode {
  if (!frozenColDef) return null;
  const rows: ReactNode[] = [];
  for (let ri = vRows.startIndex; ri <= vRows.endIndex; ri++) {
    const item = visibleRows[ri];
    if (!item || item.type === "group") continue;
    const row = item.row;
    const rowKey = getRowId ? String(getRowId(row, item.rowIndex)) : String(item.rowIndex);
    const isSel = isRowSelected(row, item.rowIndex);
    const frozenBg = isSel
      ? ((styles.rowSelected?.background as string | undefined) ??
        (styles.rowSelected?.backgroundColor as string | undefined) ??
        "var(--vg-bg-row-selected)")
      : "var(--vg-bg-frozen, var(--vg-bg-row-alt))";
    rows.push(
      <div
        key={rowKey}
        onClick={() => handleRowClick(row, item.rowIndex)}
        className={
          [classNames.row, isSel ? classNames.rowSelected : undefined].filter(Boolean).join(" ") ||
          undefined
        }
        style={{
          position: "absolute",
          left: 0,
          top: ri * rowHeight,
          width: frozenWidth,
          height: rowHeight,
          background: frozenBg,
          cursor: "pointer",
          overflow: "hidden",
          ...styles.row,
          ...(isSel ? styles.rowSelected : {}),
        }}
        onMouseEnter={(e) => {
          if (!isSel) (e.currentTarget as HTMLElement).style.background = "var(--vg-bg-row-hover)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = frozenBg;
        }}
      >
        <DataCell
          column={frozenColDef}
          row={row}
          rowIndex={ri}
          colIndex={visibleColIndexById.get(frozenColDef.id) ?? 0}
          valueOverride={getRawCellValue(row, item.rowIndex, frozenColDef)}
          selected={isSel}
          indent={(visibleColIndexById.get(frozenColDef.id) ?? 0) === 0 ? item.depth * 18 : 0}
          ariaHidden
          pinned
          isScrolling={isScrolling}
          loadingCell={loadingCell}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: frozenWidth,
            height: rowHeight,
            background: frozenBg,
            zIndex: 2,
          }}
        />
        {isSel && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 3,
              pointerEvents: "none",
            }}
          >
            {rowSelectionIndicator?.(row, item.rowIndex)}
          </div>
        )}
      </div>,
    );
  }
  return rows;
}
