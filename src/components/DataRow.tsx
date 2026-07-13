import type { ReactNode } from "react";
import type {
  GridClassNames,
  GridStyles,
  GroupedRow,
  ResolvedColumn,
} from "../types";
import type { FocusedCell, UseGridKeyboardReturn } from "../hooks/useGridKeyboard";
import { DataCell } from "./Cells";
import { GroupDataRow } from "./GroupDataRow";

export interface DataRowProps<TData> {
  visibleRows: GroupedRow<TData>[];
  rowIndex: number;
  totalHeaderHeight: number;
  rowHeight: number;
  canvasW: number;
  pinnedLeftWidth: number;
  pinnedRightWidth: number;
  vCols: { startIndex: number; endIndex: number };
  scrollableColumns: ResolvedColumn<TData>[];
  pinnedLeftColumns: ResolvedColumn<TData>[];
  pinnedRightColumns: ResolvedColumn<TData>[];
  offsets: number[];
  visibleColIndexById: Map<string, number>;
  keyboard: UseGridKeyboardReturn;
  getRawCellValue: (
    row: TData,
    rowIndex: number,
    column: ResolvedColumn<TData>,
  ) => unknown;
  isScrolling: boolean;
  loadingCell?: ReactNode | undefined;
  rowSelectionIndicator?: ((row: TData, index: number) => ReactNode) | undefined;
  classNames: GridClassNames;
  styles: GridStyles;
  getRowId?: ((row: TData, index: number) => string | number) | undefined;
  handleRowClick: (row: TData, rowIndex: number) => void;
  isRowSelected: (row: TData, rowIndex: number) => boolean;
  rowBg: (row: TData, rowIndex: number) => string;
  pinnedRowBg: (row: TData, rowIndex: number) => string;
  activateRenderedCell: (cell: FocusedCell) => void;
  orderedColumns: ResolvedColumn<TData>[];
  toggleGroup: (groupId: string) => void;
}

export function DataRow<TData>({
  visibleRows,
  rowIndex,
  totalHeaderHeight,
  rowHeight,
  canvasW,
  pinnedLeftWidth,
  pinnedRightWidth,
  vCols,
  scrollableColumns,
  pinnedLeftColumns,
  pinnedRightColumns,
  offsets,
  visibleColIndexById,
  keyboard,
  getRawCellValue,
  isScrolling,
  loadingCell,
  rowSelectionIndicator,
  classNames,
  styles,
  getRowId,
  handleRowClick,
  isRowSelected,
  rowBg,
  pinnedRowBg,
  activateRenderedCell,
  orderedColumns,
  toggleGroup,
}: DataRowProps<TData>): ReactNode {
  const item = visibleRows[rowIndex];
  if (!item) return null;

  if (item.type === "group") {
    return (
      <GroupDataRow
        group={item}
        rowIndex={rowIndex}
        totalHeaderHeight={totalHeaderHeight}
        rowHeight={rowHeight}
        canvasW={canvasW}
        pinnedLeftWidth={pinnedLeftWidth}
        pinnedRightWidth={pinnedRightWidth}
        orderedColumns={orderedColumns}
        classNames={classNames}
        styles={styles}
        keyboard={keyboard}
        toggleGroup={toggleGroup}
      />
    );
  }

  const row = item.row;
  const top = totalHeaderHeight + rowIndex * rowHeight;
  const bg = rowBg(row, item.rowIndex);
  const pinnedBg = pinnedRowBg(row, item.rowIndex);
  const isSel = isRowSelected(row, item.rowIndex);
  const rowKey = getRowId ? String(getRowId(row, item.rowIndex)) : String(item.rowIndex);

  const cells: ReactNode[] = [];
  for (let ci = vCols.startIndex; ci <= vCols.endIndex; ci++) {
    const col = scrollableColumns[ci];
    if (!col) continue;
    const colIndex = visibleColIndexById.get(col.id) ?? ci;
    const isActive =
      keyboard.focusedCell?.rowIndex === rowIndex &&
      keyboard.focusedCell.colIndex === colIndex;
    const isFocusable =
      isActive || (!keyboard.focusedTarget && rowIndex === 0 && colIndex === 0);
    cells.push(
      <DataCell
        key={`ds-${col.id}`}
        column={col}
        row={row}
        rowIndex={rowIndex}
        colIndex={colIndex}
        valueOverride={getRawCellValue(row, item.rowIndex, col)}
        active={isActive}
        focusable={isFocusable}
        selected={isSel}
        indent={colIndex === 0 ? item.depth * 18 : 0}
        onFocusCell={(ri, ci) => keyboard.setFocusedCell({ rowIndex: ri, colIndex: ci })}
        onActivateCell={(ri, ci) => activateRenderedCell({ rowIndex: ri, colIndex: ci })}
        isScrolling={isScrolling}
        loadingCell={loadingCell}
        style={{
          position: "absolute",
          left: pinnedLeftWidth + (offsets[ci] ?? 0),
          top: 0,
          width: col.width,
          height: rowHeight,
          background: bg,
        }}
      />,
    );
  }

  // ── Left sticky pinned cells ─────────────────────────────────────────────
  // position:sticky on a child of an absolutely-positioned row finds the
  // nearest overflow ancestor (the scroll area) and sticks there — so these
  // cells stay at left:0 of the viewport while the canvas scrolls horizontally.
  // Vertical scroll is native (no JS transform needed), which eliminates the
  // 1-frame lag that JS-driven translateY causes on compositor-thread scrolls.
  let leftPinAcc = 0;
  const leftPinCells =
    pinnedLeftColumns.length > 0
      ? pinnedLeftColumns.map((col) => {
          const colLeft = leftPinAcc;
          leftPinAcc += col.width;
          const colIndex = visibleColIndexById.get(col.id) ?? 0;
          const isActive =
            keyboard.focusedCell?.rowIndex === rowIndex &&
            keyboard.focusedCell.colIndex === colIndex;
          const isFocusable =
            isActive || (!keyboard.focusedTarget && rowIndex === 0 && colIndex === 0);
          return (
            <DataCell
              key={`ps-l-${col.id}`}
              column={col}
              row={row}
              rowIndex={rowIndex}
              colIndex={colIndex}
              valueOverride={getRawCellValue(row, item.rowIndex, col)}
              active={isActive}
              focusable={isFocusable}
              selected={isSel}
              indent={colIndex === 0 ? item.depth * 18 : 0}
              onFocusCell={(ri, ci) => keyboard.setFocusedCell({ rowIndex: ri, colIndex: ci })}
              onActivateCell={(ri, ci) => activateRenderedCell({ rowIndex: ri, colIndex: ci })}
              pinned
              isScrolling={isScrolling}
              loadingCell={loadingCell}
              style={{
                position: "absolute",
                left: colLeft,
                top: 0,
                width: col.width,
                height: rowHeight,
                background: pinnedBg,
              }}
            />
          );
        })
      : null;

  // ── Right sticky pinned cells ────────────────────────────────────────────
  let rightPinAcc = 0;
  const rightPinCells =
    pinnedRightColumns.length > 0
      ? pinnedRightColumns.map((col) => {
          const colLeft = rightPinAcc;
          rightPinAcc += col.width;
          const colIndex = visibleColIndexById.get(col.id) ?? 0;
          const isActive =
            keyboard.focusedCell?.rowIndex === rowIndex &&
            keyboard.focusedCell.colIndex === colIndex;
          const isFocusable =
            isActive || (!keyboard.focusedTarget && rowIndex === 0 && colIndex === 0);
          return (
            <DataCell
              key={`ps-r-${col.id}`}
              column={col}
              row={row}
              rowIndex={rowIndex}
              colIndex={colIndex}
              valueOverride={getRawCellValue(row, item.rowIndex, col)}
              active={isActive}
              focusable={isFocusable}
              selected={isSel}
              indent={colIndex === 0 ? item.depth * 18 : 0}
              onFocusCell={(ri, ci) => keyboard.setFocusedCell({ rowIndex: ri, colIndex: ci })}
              onActivateCell={(ri, ci) => activateRenderedCell({ rowIndex: ri, colIndex: ci })}
              pinned
              isScrolling={isScrolling}
              loadingCell={loadingCell}
              style={{
                position: "absolute",
                left: colLeft,
                top: 0,
                width: col.width,
                height: rowHeight,
                background: pinnedBg,
              }}
            />
          );
        })
      : null;

  return (
    <div
      key={rowKey}
      role="row"
      aria-rowindex={rowIndex + 1}
      aria-selected={isSel}
      onClick={() => handleRowClick(row, item.rowIndex)}
      className={
        [classNames.row, isSel ? classNames.rowSelected : undefined].filter(Boolean).join(" ") ||
        undefined
      }
      style={{
        position: "absolute",
        top,
        left: 0,
        width: canvasW,
        height: rowHeight,
        background: bg,
        cursor: "pointer",
        display: "flex",
        ...styles.row,
        ...(isSel ? styles.rowSelected : {}),
      }}
      onMouseEnter={(e) => {
        if (!isSel) {
          const el = e.currentTarget as HTMLElement;
          el.style.background = "var(--vg-bg-row-hover)";
          // Update sticky pinned wrappers too
          el.querySelectorAll<HTMLElement>("[data-pinned-sticky]").forEach((w) => {
            w.style.background = "var(--vg-bg-row-hover)";
          });
        }
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.background = bg;
        el.querySelectorAll<HTMLElement>("[data-pinned-sticky]").forEach((w) => {
          w.style.background = pinnedBg;
        });
      }}
    >
      {leftPinCells && (
        <div
          data-pinned-sticky="left"
          style={{
            position: "sticky",
            left: 0,
            width: pinnedLeftWidth,
            height: rowHeight,
            flexShrink: 0,
            zIndex: 5,
            background: pinnedBg,
            overflow: "hidden",
          }}
        >
          {leftPinCells}
        </div>
      )}
      {rightPinCells && <div style={{ flex: 1 }} />}
      {rightPinCells && (
        <div
          data-pinned-sticky="right"
          style={{
            position: "sticky",
            right: 0,
            width: pinnedRightWidth,
            height: rowHeight,
            flexShrink: 0,
            zIndex: 5,
            background: pinnedBg,
            overflow: "hidden",
          }}
        >
          {rightPinCells}
        </div>
      )}
      {cells}
      {isSel && rowSelectionIndicator?.(row, item.rowIndex)}
    </div>
  );
}
