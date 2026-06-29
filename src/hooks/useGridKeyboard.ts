// =============================================================================
//  @lattice-grid-lib/core — useGridKeyboard
//
//  AG Grid-style keyboard interaction model with roving-tabindex focus.
// =============================================================================

import { useCallback, useMemo, useReducer } from "react";
import { clamp, isInteractiveTarget, isSameFocusTarget } from "./keyboardUtils";
import type {
  FocusTarget,
  FocusedCell,
  KeyboardRowGroup,
} from "../types/keyboard";

export type { FocusTarget, FocusedCell } from "../types/keyboard";

export interface UseGridKeyboardOptions {
  rowCount: number;
  colCount: number;
  visibleRowCount?: number;
  headerTargets?: FocusTarget[];
  getRowGroup?: (rowIndex: number) => KeyboardRowGroup | null;
  onFocusCell?: (cell: FocusedCell) => void;
  onFocusHeader?: (colIndex: number) => void;
  onSelectRow?: (rowIndex: number, additive: boolean) => void;
  onToggleRow?: (rowIndex: number) => void;
  onSelectRange?: (fromRowIndex: number, toRowIndex: number) => void;
  onSelectAll?: () => void;
  onActivateCell?: (cell: FocusedCell) => void;
  onToggleGroup?: (groupId: string) => void;
  onToggleHeaderSort?: (colIndex: number, multi: boolean) => void;
  onDeleteRows?: () => void;
  onInsertRow?: () => void;
  onResizeColumn?: (colIndex: number, delta: number) => void;
  onReorderColumn?: (colIndex: number, direction: -1 | 1) => number | void;
}

export interface UseGridKeyboardReturn {
  focusedCell: FocusedCell | null;
  focusedTarget: FocusTarget | null;
  setFocusedCell: (cell: FocusedCell | null) => void;
  setFocusedTarget: (target: FocusTarget | null) => void;
  moveFocus: (cell: FocusedCell) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  isHeaderFocused: (colIndex: number) => boolean;
  isGroupHeaderFocused: (groupId: string) => boolean;
}

type KeyboardAction = { type: "SET"; target: FocusTarget | null };

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

function normalizeTarget(
  target: FocusTarget | null,
  rowCount: number,
  colCount: number,
): FocusTarget | null {
  if (!target || colCount <= 0) return null;
  if (target.kind === "cell") {
    const cell = normalizeCell(target, rowCount, colCount);
    return cell ? { kind: "cell", ...cell } : null;
  }
  if (target.kind === "header") {
    return { kind: "header", colIndex: clamp(target.colIndex, 0, colCount - 1) };
  }
  return {
    kind: "groupHeader",
    groupId: target.groupId,
    colStartIndex: clamp(target.colStartIndex, 0, colCount - 1),
    colEndIndex: clamp(target.colEndIndex, 0, colCount - 1),
  };
}

function keyboardReducer(
  _state: FocusTarget | null,
  action: KeyboardAction,
): FocusTarget | null {
  return action.target;
}

function targetKey(target: FocusTarget) {
  if (target.kind === "cell") return `cell:${target.rowIndex}:${target.colIndex}`;
  if (target.kind === "header") return `header:${target.colIndex}`;
  return `group:${target.groupId}`;
}

export function useGridKeyboard({
  rowCount,
  colCount,
  visibleRowCount = 20,
  headerTargets = [],
  getRowGroup,
  onFocusCell,
  onFocusHeader,
  onSelectRow,
  onToggleRow,
  onSelectRange,
  onSelectAll,
  onActivateCell,
  onToggleGroup,
  onToggleHeaderSort,
  onDeleteRows,
  onInsertRow,
  onResizeColumn,
  onReorderColumn,
}: UseGridKeyboardOptions): UseGridKeyboardReturn {
  const [focusedTarget, dispatch] = useReducer(keyboardReducer, null);

  const normalizedTarget = normalizeTarget(focusedTarget, rowCount, colCount);
  const focusedCell =
    normalizedTarget?.kind === "cell"
      ? {
          rowIndex: normalizedTarget.rowIndex,
          colIndex: normalizedTarget.colIndex,
        }
      : null;

  const normalizedHeaderTargets = useMemo(() => {
    const seen = new Set<string>();
    const targets: FocusTarget[] = [];
    for (const rawTarget of headerTargets) {
      const target = normalizeTarget(rawTarget, rowCount, colCount);
      if (!target || target.kind === "cell") continue;
      const key = targetKey(target);
      if (seen.has(key)) continue;
      seen.add(key);
      targets.push(target);
    }
    if (targets.length === 0) {
      for (let colIndex = 0; colIndex < colCount; colIndex++) {
        targets.push({ kind: "header", colIndex });
      }
    }
    return targets;
  }, [colCount, headerTargets, rowCount]);

  const leafHeaderTargets = useMemo(
    () =>
      normalizedHeaderTargets.filter(
        (target): target is Extract<FocusTarget, { kind: "header" }> =>
          target.kind === "header",
      ),
    [normalizedHeaderTargets],
  );

  const setFocusedTarget = useCallback(
    (target: FocusTarget | null) => {
      const next = normalizeTarget(target, rowCount, colCount);
      dispatch({ type: "SET", target: next });
      if (next?.kind === "cell") onFocusCell?.(next);
      else if (next?.kind === "header") onFocusHeader?.(next.colIndex);
      else if (next?.kind === "groupHeader") onFocusHeader?.(next.colStartIndex);
    },
    [rowCount, colCount, onFocusCell, onFocusHeader],
  );

  const moveFocus = useCallback(
    (cell: FocusedCell) => {
      setFocusedTarget({ kind: "cell", ...cell });
    },
    [setFocusedTarget],
  );

  const setFocusedCell = useCallback(
    (cell: FocusedCell | null) => {
      setFocusedTarget(cell ? { kind: "cell", ...cell } : null);
    },
    [setFocusedTarget],
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
      if (extendSelection && deltaRow !== 0) {
        onSelectRange?.(anchor.rowIndex, next.rowIndex);
      }
    },
    [rowCount, colCount, moveFocus, onSelectRange],
  );

  const moveToHeader = useCallback(
    (colIndex: number) => {
      setFocusedTarget({ kind: "header", colIndex });
    },
    [setFocusedTarget],
  );

  const moveHeaderBy = useCallback(
    (colIndex: number, delta: number) => {
      const currentIndex = leafHeaderTargets.findIndex(
        (target) => target.colIndex === colIndex,
      );
      const fallback = clamp(colIndex + delta, 0, colCount - 1);
      const next =
        leafHeaderTargets[
          clamp(
            currentIndex < 0 ? fallback : currentIndex + delta,
            0,
            leafHeaderTargets.length - 1,
          )
        ];
      setFocusedTarget(next ?? { kind: "header", colIndex: fallback });
    },
    [colCount, leafHeaderTargets, setFocusedTarget],
  );

  const moveGroupHeaderBy = useCallback(
    (target: Extract<FocusTarget, { kind: "groupHeader" }>, delta: -1 | 1) => {
      const currentIndex = normalizedHeaderTargets.findIndex((item) =>
        isSameFocusTarget(item, target),
      );
      const next =
        normalizedHeaderTargets[
          clamp(currentIndex + delta, 0, normalizedHeaderTargets.length - 1)
        ];
      setFocusedTarget(next ?? target);
    },
    [normalizedHeaderTargets, setFocusedTarget],
  );

  const handleCellKeyDown = useCallback(
    (e: React.KeyboardEvent, active: FocusedCell) => {
      const mod = e.ctrlKey || e.metaKey;
      const rowGroup = getRowGroup?.(active.rowIndex) ?? null;

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
          if (active.rowIndex === 0) moveToHeader(active.colIndex);
          else moveBy(-1, 0, e.shiftKey, active);
          break;
        case "ArrowRight":
          e.preventDefault();
          if (rowGroup && !rowGroup.expanded) onToggleGroup?.(rowGroup.id);
          else if (!rowGroup) {
            moveFocus({ rowIndex: active.rowIndex, colIndex: mod ? colCount - 1 : active.colIndex + 1 });
          }
          break;
        case "ArrowLeft":
          e.preventDefault();
          if (rowGroup && rowGroup.expanded) onToggleGroup?.(rowGroup.id);
          else if (!rowGroup) {
            moveFocus({ rowIndex: active.rowIndex, colIndex: mod ? 0 : active.colIndex - 1 });
          }
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
          if (rowGroup) onToggleGroup?.(rowGroup.id);
          else onActivateCell?.(active);
          break;
        case "F2":
          e.preventDefault();
          onActivateCell?.(active);
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
      colCount,
      getRowGroup,
      moveBy,
      moveFocus,
      moveToHeader,
      onActivateCell,
      onDeleteRows,
      onInsertRow,
      onReorderColumn,
      onResizeColumn,
      onSelectAll,
      onSelectRow,
      onToggleGroup,
      onToggleRow,
      rowCount,
      visibleRowCount,
    ],
  );

  const handleHeaderKeyDown = useCallback(
    (
      e: React.KeyboardEvent,
      target: Extract<FocusTarget, { kind: "header" }>,
    ) => {
      const mod = e.ctrlKey || e.metaKey;

      if (e.altKey && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
        e.preventDefault();
        onResizeColumn?.(target.colIndex, e.key === "ArrowRight" ? 10 : -10);
        return;
      }

      if (
        mod &&
        e.shiftKey &&
        (e.key === "ArrowLeft" || e.key === "ArrowRight")
      ) {
        e.preventDefault();
        const direction = e.key === "ArrowRight" ? 1 : -1;
        const nextCol = onReorderColumn?.(target.colIndex, direction);
        moveToHeader(
          typeof nextCol === "number"
            ? nextCol
            : clamp(target.colIndex + direction, 0, colCount - 1),
        );
        return;
      }

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          break;
        case "ArrowLeft":
          e.preventDefault();
          moveHeaderBy(target.colIndex, -1);
          break;
        case "ArrowRight":
          e.preventDefault();
          moveHeaderBy(target.colIndex, 1);
          break;
        case "ArrowDown":
          e.preventDefault();
          moveFocus({ rowIndex: 0, colIndex: target.colIndex });
          break;
        case "Home":
          e.preventDefault();
          moveToHeader(0);
          break;
        case "End":
          e.preventDefault();
          moveToHeader(colCount - 1);
          break;
        case "Enter":
          e.preventDefault();
          onToggleHeaderSort?.(target.colIndex, e.shiftKey);
          break;
        default:
          break;
      }
    },
    [
      colCount,
      moveFocus,
      moveHeaderBy,
      moveToHeader,
      onReorderColumn,
      onResizeColumn,
      onToggleHeaderSort,
    ],
  );

  const handleGroupHeaderKeyDown = useCallback(
    (
      e: React.KeyboardEvent,
      target: Extract<FocusTarget, { kind: "groupHeader" }>,
    ) => {
      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          moveGroupHeaderBy(target, -1);
          break;
        case "ArrowRight":
          e.preventDefault();
          moveGroupHeaderBy(target, 1);
          break;
        case "ArrowDown":
          e.preventDefault();
          moveToHeader(target.colStartIndex);
          break;
        case "Home":
          e.preventDefault();
          setFocusedTarget(normalizedHeaderTargets[0] ?? target);
          break;
        case "End":
          e.preventDefault();
          setFocusedTarget(
            normalizedHeaderTargets[normalizedHeaderTargets.length - 1] ??
              target,
          );
          break;
        case "Enter":
          e.preventDefault();
          break;
        default:
          break;
      }
    },
    [
      moveGroupHeaderBy,
      moveToHeader,
      normalizedHeaderTargets,
      setFocusedTarget,
    ],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (rowCount === 0 || colCount === 0) return;

      const headerEl =
        e.target instanceof HTMLElement
          ? e.target.closest<HTMLElement>("[data-grid-header-cell]")
          : null;
      const headerColIndex = headerEl?.dataset.gridHeaderCell
        ? Number(headerEl.dataset.gridHeaderCell)
        : null;
      if (e.key === "Escape" && headerColIndex != null) {
        e.preventDefault();
        moveToHeader(headerColIndex);
        return;
      }

      const groupHeaderEl =
        e.target instanceof HTMLElement
          ? e.target.closest<HTMLElement>("[data-grid-group-header]")
          : null;
      if (e.key === "Escape" && groupHeaderEl?.dataset.gridGroupHeader) {
        e.preventDefault();
        setFocusedTarget({
          kind: "groupHeader",
          groupId: groupHeaderEl.dataset.gridGroupHeader,
          colStartIndex: Number(groupHeaderEl.dataset.colStartIndex ?? 0),
          colEndIndex: Number(groupHeaderEl.dataset.colEndIndex ?? 0),
        });
        return;
      }

      if (isInteractiveTarget(e.target)) return;

      const active = normalizedTarget ?? { kind: "cell" as const, rowIndex: 0, colIndex: 0 };
      if (active.kind === "cell") handleCellKeyDown(e, active);
      else if (active.kind === "header") handleHeaderKeyDown(e, active);
      else handleGroupHeaderKeyDown(e, active);
    },
    [
      colCount,
      handleCellKeyDown,
      handleGroupHeaderKeyDown,
      handleHeaderKeyDown,
      moveToHeader,
      normalizedTarget,
      rowCount,
      setFocusedTarget,
    ],
  );

  return {
    focusedCell,
    focusedTarget: normalizedTarget,
    setFocusedCell,
    setFocusedTarget,
    moveFocus,
    handleKeyDown,
    isHeaderFocused: (colIndex: number) =>
      normalizedTarget?.kind === "header" && normalizedTarget.colIndex === colIndex,
    isGroupHeaderFocused: (groupId: string) =>
      normalizedTarget?.kind === "groupHeader" &&
      normalizedTarget.groupId === groupId,
  };
}
