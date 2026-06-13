// =============================================================================
//  @lattice-grid-lib/core — useGridKeyboard
//
//  ARIA grid keyboard interaction model with roving-tabindex focus.
// =============================================================================

import { useCallback, useReducer } from "react";

export interface FocusedCell {
  rowIndex: number;
  colIndex: number;
}

export interface EditingCell extends FocusedCell {
  initialValue: string;
  value: string;
}

export interface UseGridKeyboardOptions {
  rowCount: number;
  colCount: number;
  visibleRowCount?: number;
  isEditing?: boolean;
  isEditableCell?: (cell: FocusedCell) => boolean;
  onFocusCell?: (cell: FocusedCell) => void;
  onSelectRow?: (rowIndex: number, additive: boolean) => void;
  onToggleRow?: (rowIndex: number) => void;
  onSelectRange?: (fromRowIndex: number, toRowIndex: number) => void;
  onSelectAll?: () => void;
  onStartEditing?: (cell: FocusedCell) => void;
  onCommitEditing?: (move?: "next" | "previous") => void;
  onCancelEditing?: () => void;
  onDeleteRows?: () => void;
  onInsertRow?: () => void;
  onResizeColumn?: (colIndex: number, delta: number) => void;
  onReorderColumn?: (colIndex: number, direction: -1 | 1) => number | void;
}

export interface UseGridKeyboardReturn {
  focusedCell: FocusedCell | null;
  setFocusedCell: (cell: FocusedCell | null) => void;
  moveFocus: (cell: FocusedCell) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
}

type KeyboardAction = { type: "SET"; cell: FocusedCell | null };

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function normalizeCell(
  cell: FocusedCell | null,
  rowCount: number,
  colCount: number,
): FocusedCell | null {
  if (!cell || rowCount <= 0 || colCount <= 0) return null;
  return {
    rowIndex: clamp(cell.rowIndex, 0, rowCount - 1),
    colIndex: clamp(cell.colIndex, 0, colCount - 1),
  };
}

function keyboardReducer(
  _state: FocusedCell | null,
  action: KeyboardAction,
): FocusedCell | null {
  return action.cell;
}

export function useGridKeyboard({
  rowCount,
  colCount,
  visibleRowCount = 20,
  isEditing = false,
  isEditableCell = () => true,
  onFocusCell,
  onSelectRow,
  onToggleRow,
  onSelectRange,
  onSelectAll,
  onStartEditing,
  onCommitEditing,
  onCancelEditing,
  onDeleteRows,
  onInsertRow,
  onResizeColumn,
  onReorderColumn,
}: UseGridKeyboardOptions): UseGridKeyboardReturn {
  const [focusedCell, dispatch] = useReducer(
    keyboardReducer,
    rowCount > 0 && colCount > 0 ? { rowIndex: 0, colIndex: 0 } : null,
  );

  const moveFocus = useCallback(
    (cell: FocusedCell) => {
      const next = normalizeCell(cell, rowCount, colCount);
      dispatch({ type: "SET", cell: next });
      if (next) onFocusCell?.(next);
    },
    [rowCount, colCount, onFocusCell],
  );

  const setFocusedCell = useCallback(
    (cell: FocusedCell | null) => {
      const next = normalizeCell(cell, rowCount, colCount);
      dispatch({ type: "SET", cell: next });
      if (next) onFocusCell?.(next);
    },
    [rowCount, colCount, onFocusCell],
  );

  const moveBy = useCallback(
    (
      deltaRow: number,
      deltaCol: number,
      extendSelection: boolean,
      anchor: FocusedCell,
    ) => {
      const next = normalizeCell(
        {
          rowIndex: anchor.rowIndex + deltaRow,
          colIndex: anchor.colIndex + deltaCol,
        },
        rowCount,
        colCount,
      );
      if (!next) return;
      moveFocus(next);
      if (extendSelection) onSelectRange?.(anchor.rowIndex, next.rowIndex);
    },
    [rowCount, colCount, moveFocus, onSelectRange],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (rowCount === 0 || colCount === 0) return;

      const active = focusedCell ?? { rowIndex: 0, colIndex: 0 };
      const mod = e.ctrlKey || e.metaKey;

      if (isEditing) {
        if (e.key === "Escape") {
          e.preventDefault();
          onCancelEditing?.();
        } else if (e.key === "Enter") {
          e.preventDefault();
          onCommitEditing?.();
        } else if (e.key === "F2") {
          e.preventDefault();
          onCommitEditing?.();
        } else if (e.key === "Tab") {
          e.preventDefault();
          onCommitEditing?.(e.shiftKey ? "previous" : "next");
        }
        return;
      }

      if (mod && e.key.toLowerCase() === "a") {
        e.preventDefault();
        onSelectAll?.();
        return;
      }

      if (e.altKey && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
        e.preventDefault();
        onResizeColumn?.(active.colIndex, e.key === "ArrowRight" ? 10 : -10);
        return;
      }

      if (
        mod &&
        e.shiftKey &&
        (e.key === "ArrowLeft" || e.key === "ArrowRight")
      ) {
        e.preventDefault();
        const direction = e.key === "ArrowRight" ? 1 : -1;
        const nextCol = onReorderColumn?.(active.colIndex, direction);
        moveFocus({
          rowIndex: active.rowIndex,
          colIndex:
            typeof nextCol === "number"
              ? nextCol
              : clamp(active.colIndex + direction, 0, colCount - 1),
        });
        return;
      }

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          moveBy(1, 0, e.shiftKey, active);
          break;
        case "ArrowUp":
          e.preventDefault();
          moveBy(-1, 0, e.shiftKey, active);
          break;
        case "ArrowRight":
          e.preventDefault();
          moveBy(0, 1, e.shiftKey, active);
          break;
        case "ArrowLeft":
          e.preventDefault();
          moveBy(0, -1, e.shiftKey, active);
          break;
        case "Home":
          e.preventDefault();
          moveFocus({
            rowIndex: mod ? 0 : active.rowIndex,
            colIndex: 0,
          });
          break;
        case "End":
          e.preventDefault();
          moveFocus({
            rowIndex: mod ? rowCount - 1 : active.rowIndex,
            colIndex: colCount - 1,
          });
          break;
        case "PageDown":
          e.preventDefault();
          moveFocus({
            rowIndex: active.rowIndex + visibleRowCount,
            colIndex: active.colIndex,
          });
          break;
        case "PageUp":
          e.preventDefault();
          moveFocus({
            rowIndex: active.rowIndex - visibleRowCount,
            colIndex: active.colIndex,
          });
          break;
        case " ":
          e.preventDefault();
          if (mod) onToggleRow?.(active.rowIndex);
          else onSelectRow?.(active.rowIndex, false);
          break;
        case "Enter":
          e.preventDefault();
          if (isEditableCell(active)) onStartEditing?.(active);
          break;
        case "F2":
          e.preventDefault();
          if (isEditableCell(active)) onStartEditing?.(active);
          break;
        case "Delete":
          e.preventDefault();
          onDeleteRows?.();
          break;
        case "Insert":
          e.preventDefault();
          onInsertRow?.();
          break;
        default:
          break;
      }
    },
    [
      rowCount,
      colCount,
      visibleRowCount,
      focusedCell,
      isEditing,
      isEditableCell,
      moveBy,
      moveFocus,
      onCancelEditing,
      onCommitEditing,
      onDeleteRows,
      onInsertRow,
      onReorderColumn,
      onResizeColumn,
      onSelectAll,
      onSelectRange,
      onSelectRow,
      onStartEditing,
      onToggleRow,
    ],
  );

  return {
    focusedCell: normalizeCell(focusedCell, rowCount, colCount),
    setFocusedCell,
    moveFocus,
    handleKeyDown,
  };
}
