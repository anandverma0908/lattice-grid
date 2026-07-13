import { useCallback, useLayoutEffect, useMemo, useRef } from "react";
import type { RefObject } from "react";
import {
  useGridKeyboard,
  type FocusedCell,
  type FocusTarget,
  type UseGridKeyboardReturn,
} from "./useGridKeyboard";
import { findFocusableInGrid } from "./keyboardUtils";
import type { GridFeatures, GroupColumnDef, GroupedRow, ResolvedColumn } from "../types";

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export interface UseGridKeyboardIntegrationOptions<TData> {
  visibleRows: GroupedRow<TData>[];
  visibleColumns: ResolvedColumn<TData>[];
  scrollableColumns: ResolvedColumn<TData>[];
  orderedColumns: ResolvedColumn<TData>[];
  groups: GroupColumnDef<TData>[];
  hasGroups: boolean;
  visibleRowCount: number;
  features: Required<GridFeatures>;
  gridRootRef: RefObject<HTMLDivElement>;
  scrollAreaRef: RefObject<HTMLDivElement>;
  scrollToCell: (cell: FocusedCell) => void;
  scrollToColumn: (colIndex: number) => void;
  selectRowByIndex: (rowIndex: number, additive: boolean) => void;
  selectRangeByIndex: (fromRowIndex: number, toRowIndex: number) => void;
  selectAllRows: () => void;
  deleteSelectedRows: () => void;
  toggleGroup: (groupId: string) => void;
  toggleSort: (columnId: string) => void;
  resizeColumn: (columnId: string, delta: number) => void;
  moveColumnBefore: (sourceId: string, targetId: string) => void;
  moveColumnToEnd: (sourceId: string) => void;
  onColumnResize?: ((columnId: string, width: number) => void) | undefined;
  onColumnReorder?: ((newOrder: string[]) => void) | undefined;
  onRowInsert?: (() => void) | undefined;
  announce: (message: string) => void;
}

export interface UseGridKeyboardIntegrationReturn<TData> {
  keyboard: UseGridKeyboardReturn;
  visibleColIndexById: Map<string, number>;
  ungroupedIds: Set<string>;
  getRawCellValue: (row: TData, rowIndex: number, column: ResolvedColumn<TData>) => unknown;
  activateRenderedCell: (cell: FocusedCell) => void;
}

export function useGridKeyboardIntegration<TData>({
  visibleRows,
  visibleColumns,
  scrollableColumns,
  orderedColumns,
  groups,
  hasGroups,
  visibleRowCount,
  features,
  gridRootRef,
  scrollAreaRef,
  scrollToCell,
  scrollToColumn,
  selectRowByIndex,
  selectRangeByIndex,
  selectAllRows,
  deleteSelectedRows,
  toggleGroup,
  toggleSort,
  resizeColumn,
  moveColumnBefore,
  moveColumnToEnd,
  onColumnResize,
  onColumnReorder,
  onRowInsert,
  announce,
}: UseGridKeyboardIntegrationOptions<TData>): UseGridKeyboardIntegrationReturn<TData> {
  const orderedColumnsRef = useRef(orderedColumns);
  orderedColumnsRef.current = orderedColumns;
  const onColumnReorderRef = useRef(onColumnReorder);
  onColumnReorderRef.current = onColumnReorder;

  const visibleColIndexById = useMemo(() => {
    const map = new Map<string, number>();
    visibleColumns.forEach((col, index) => map.set(col.id, index));
    return map;
  }, [visibleColumns]);

  const getRawCellValue = useCallback(
    (row: TData, rowIndex: number, column: ResolvedColumn<TData>) => {
      return column.accessor
        ? column.accessor(row)
        : (row as Record<string, unknown>)[column.field ?? column.id];
    },
    [],
  );

  const headerTargets = useMemo<FocusTarget[]>(() => {
    const targets: FocusTarget[] = [];
    if (hasGroups) {
      for (const group of groups) {
        const childIndexes = group.children
          .map((child) => visibleColIndexById.get(child.id))
          .filter((index): index is number => typeof index === "number")
          .sort((a, b) => a - b);
        if (childIndexes.length > 0) {
          targets.push({
            kind: "groupHeader",
            groupId: group.id,
            colStartIndex: childIndexes[0]!,
            colEndIndex: childIndexes[childIndexes.length - 1]!,
          });
        }
      }
    }
    for (let colIndex = 0; colIndex < visibleColumns.length; colIndex++) {
      targets.push({ kind: "header", colIndex });
    }
    return targets;
  }, [groups, hasGroups, visibleColIndexById, visibleColumns.length]);

  const activateRenderedCell = useCallback(
    (cell: FocusedCell) => {
      const cellEl = scrollAreaRef.current?.querySelector<HTMLElement>(
        `[data-grid-cell="${cell.rowIndex}:${cell.colIndex}"]`,
      );
      const target = cellEl?.querySelector<HTMLElement>(
        'input:not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled]), a[href], [contenteditable="true"], [tabindex]:not([tabindex="-1"]), [role="button"], [role="textbox"], [role="checkbox"], [role="combobox"], [role="switch"], [role="spinbutton"]',
      );
      if (!target) return;
      try {
        target.focus({ preventScroll: true });
      } catch {
        target.focus();
      }
      if (
        target.matches(
          'button:not([disabled]), a[href], [role="button"], [role="checkbox"], [role="switch"]',
        )
      ) {
        target.click();
      }
    },
    [scrollAreaRef],
  );

  const reorderColumnByKeyboard = useCallback(
    (colIndex: number, direction: -1 | 1): number => {
      if (!features.reorder) return colIndex;
      const source = visibleColumns[colIndex];
      const target = visibleColumns[colIndex + direction];
      if (!source || !target || !source.draggable || !target.draggable) {
        return colIndex;
      }
      if (direction < 0) {
        moveColumnBefore(source.id, target.id);
      } else {
        const after = visibleColumns[colIndex + 2];
        if (after) moveColumnBefore(source.id, after.id);
        else moveColumnToEnd(source.id);
      }
      const ids = orderedColumnsRef.current.map((c) => c.id);
      const nextIds = ids.filter((id) => id !== source.id);
      const targetIdx = nextIds.indexOf(target.id);
      if (direction < 0) nextIds.splice(targetIdx, 0, source.id);
      else if (colIndex + 2 < visibleColumns.length) {
        const after = visibleColumns[colIndex + 2];
        const afterIdx = after ? nextIds.indexOf(after.id) : -1;
        if (afterIdx >= 0) nextIds.splice(afterIdx, 0, source.id);
      } else nextIds.push(source.id);
      onColumnReorderRef.current?.(nextIds);
      announce(`Column ${source.label} moved`);
      return clamp(colIndex + direction, 0, visibleColumns.length - 1);
    },
    [features.reorder, moveColumnBefore, moveColumnToEnd, visibleColumns, announce],
  );

  const keyboard = useGridKeyboard({
    rowCount: visibleRows.length,
    colCount: visibleColumns.length,
    visibleRowCount,
    headerTargets,
    getRowGroup: (rowIndex) => {
      const item = visibleRows[rowIndex];
      return item?.type === "group" ? { id: item.id, expanded: item.expanded } : null;
    },
    onFocusCell: scrollToCell,
    onFocusHeader: scrollToColumn,
    onSelectRow: selectRowByIndex,
    onToggleRow: (rowIndex) => selectRowByIndex(rowIndex, true),
    onSelectRange: selectRangeByIndex,
    onSelectAll: selectAllRows,
    onActivateCell: activateRenderedCell,
    onToggleGroup: toggleGroup,
    onToggleHeaderSort: (colIndex) => {
      const col = visibleColumns[colIndex];
      if (!col || !features.sort || !col.sortable) return;
      toggleSort(col.id);
    },
    onDeleteRows: deleteSelectedRows,
    onInsertRow: () => {
      onRowInsert?.();
      announce("Row inserted");
    },
    onResizeColumn: (colIndex, delta) => {
      const col = visibleColumns[colIndex];
      if (!col || !features.resize || !col.resizable) return;
      resizeColumn(col.id, delta);
      onColumnResize?.(col.id, col.width + delta);
      announce(`Column ${col.label} resized`);
    },
    onReorderColumn: reorderColumnByKeyboard,
  });

  useLayoutEffect(() => {
    const target = keyboard.focusedTarget;
    if (!target) return;
    const activeElement = document.activeElement;
    if (!activeElement || !gridRootRef.current?.contains(activeElement)) {
      return;
    }
    if (
      activeElement instanceof HTMLElement &&
      activeElement !== gridRootRef.current &&
      activeElement.getAttribute("role") !== "gridcell" &&
      activeElement.getAttribute("role") !== "columnheader"
    ) {
      return;
    }
    const root = gridRootRef.current;
    const el =
      target.kind === "groupHeader"
        ? Array.from(root.querySelectorAll<HTMLElement>("[data-grid-group-header]")).find(
            (candidate) =>
              candidate.dataset.gridGroupHeader === target.groupId &&
              candidate.getAttribute("aria-hidden") !== "true",
          )
        : findFocusableInGrid(
            root,
            target.kind === "cell"
              ? `[data-grid-cell="${target.rowIndex}:${target.colIndex}"]`
              : `[data-grid-header-cell="${target.colIndex}"]`,
          );
    try {
      el?.focus({ preventScroll: true });
    } catch {
      el?.focus();
    }
  });

  // ── Ungrouped scrollable → rowspan=2 ─────────────────────────────────────────
  const ungroupedIds = useMemo(() => {
    const inGroup = new Set(groups.flatMap((g) => g.children.map((c) => c.id)));
    return new Set(scrollableColumns.filter((c) => !inGroup.has(c.id)).map((c) => c.id));
  }, [groups, scrollableColumns]);

  return { keyboard, visibleColIndexById, ungroupedIds, getRawCellValue, activateRenderedCell };
}
