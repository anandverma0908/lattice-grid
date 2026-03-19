// =============================================================================
//  @virtual-grid/core — useGridKeyboard
//
//  ARIA-compliant keyboard navigation for the grid.
//
//  Supported keys:
//    ArrowUp / ArrowDown   → move focused row
//    ArrowLeft / ArrowRight → move focused column
//    Home / End            → jump to first/last column in row
//    PageUp / PageDown     → jump rows by viewport page
//    Enter / Space         → activate (calls onActivate)
//    Escape                → clear focus
//
//  This hook manages ONLY focus state (focused row/col index).
//  Scrolling the body into view is the consumer's responsibility via
//  the returned `focusedCell` and the `scrollToRow` callback.
// =============================================================================

import { useCallback, useReducer } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface FocusedCell {
  rowIndex: number;
  colIndex: number;
}

export interface UseGridKeyboardOptions {
  rowCount: number;
  colCount: number;
  /** Number of rows visible in the viewport (used for PageUp/PageDown) */
  visibleRowCount?: number;
  /** Called when Enter or Space is pressed on a cell */
  onActivate?: (cell: FocusedCell) => void;
  /** Called when focus moves to a new row (for programmatic scroll) */
  onFocusRow?: (rowIndex: number) => void;
}

export interface UseGridKeyboardReturn {
  focusedCell: FocusedCell | null;
  setFocusedCell: (cell: FocusedCell | null) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  /** tabIndex for the grid container */
  gridTabIndex: 0 | -1;
}

// ─────────────────────────────────────────────────────────────────────────────
//  REDUCER
// ─────────────────────────────────────────────────────────────────────────────

type KeyboardAction =
  | { type: 'MOVE_ROW'; delta: number; rowCount: number }
  | { type: 'MOVE_COL'; delta: number; colCount: number }
  | { type: 'SET_ROW'; rowIndex: number; rowCount: number }
  | { type: 'HOME' }
  | { type: 'END'; colCount: number }
  | { type: 'SET'; cell: FocusedCell | null }
  | { type: 'CLEAR' };

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function keyboardReducer(
  state: FocusedCell | null,
  action: KeyboardAction,
): FocusedCell | null {
  switch (action.type) {
    case 'MOVE_ROW':
      if (!state) return { rowIndex: 0, colIndex: 0 };
      return {
        ...state,
        rowIndex: clamp(state.rowIndex + action.delta, 0, action.rowCount - 1),
      };
    case 'MOVE_COL':
      if (!state) return { rowIndex: 0, colIndex: 0 };
      return {
        ...state,
        colIndex: clamp(state.colIndex + action.delta, 0, action.colCount - 1),
      };
    case 'SET_ROW':
      if (!state) return { rowIndex: action.rowIndex, colIndex: 0 };
      return { ...state, rowIndex: clamp(action.rowIndex, 0, action.rowCount - 1) };
    case 'HOME':
      if (!state) return null;
      return { ...state, colIndex: 0 };
    case 'END':
      if (!state) return null;
      return { ...state, colIndex: action.colCount - 1 };
    case 'SET':
      return action.cell;
    case 'CLEAR':
      return null;
    default:
      return state;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  HOOK
// ─────────────────────────────────────────────────────────────────────────────

/**
 * useGridKeyboard
 *
 * Attach the returned `handleKeyDown` to the grid container's onKeyDown
 * and use `focusedCell` to highlight the active cell.
 *
 * @example
 * const keyboard = useGridKeyboard({
 *   rowCount: data.length,
 *   colCount: visibleColumns.length,
 *   onActivate: (cell) => setSelected(data[cell.rowIndex]),
 *   onFocusRow: (idx) => scrollBodyRef.current?.scrollTo({ top: idx * rowHeight }),
 * });
 *
 * <div
 *   role="grid"
 *   tabIndex={keyboard.gridTabIndex}
 *   onKeyDown={keyboard.handleKeyDown}
 * >
 *   ...
 * </div>
 */
export function useGridKeyboard({
  rowCount,
  colCount,
  visibleRowCount = 20,
  onActivate,
  onFocusRow,
}: UseGridKeyboardOptions): UseGridKeyboardReturn {
  const [focusedCell, dispatch] = useReducer(keyboardReducer, null);

  const setFocusedCell = useCallback((cell: FocusedCell | null) => {
    dispatch({ type: 'SET', cell });
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (rowCount === 0 || colCount === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          dispatch({ type: 'MOVE_ROW', delta: 1, rowCount });
          if (focusedCell) onFocusRow?.(Math.min(focusedCell.rowIndex + 1, rowCount - 1));
          break;

        case 'ArrowUp':
          e.preventDefault();
          dispatch({ type: 'MOVE_ROW', delta: -1, rowCount });
          if (focusedCell) onFocusRow?.(Math.max(focusedCell.rowIndex - 1, 0));
          break;

        case 'ArrowRight':
          e.preventDefault();
          dispatch({ type: 'MOVE_COL', delta: 1, colCount });
          break;

        case 'ArrowLeft':
          e.preventDefault();
          dispatch({ type: 'MOVE_COL', delta: -1, colCount });
          break;

        case 'Home':
          e.preventDefault();
          if (e.ctrlKey || e.metaKey) {
            dispatch({ type: 'SET_ROW', rowIndex: 0, rowCount });
            onFocusRow?.(0);
          } else {
            dispatch({ type: 'HOME' });
          }
          break;

        case 'End':
          e.preventDefault();
          if (e.ctrlKey || e.metaKey) {
            dispatch({ type: 'SET_ROW', rowIndex: rowCount - 1, rowCount });
            onFocusRow?.(rowCount - 1);
          } else {
            dispatch({ type: 'END', colCount });
          }
          break;

        case 'PageDown': {
          e.preventDefault();
          const nextRow = Math.min((focusedCell?.rowIndex ?? -1) + visibleRowCount, rowCount - 1);
          dispatch({ type: 'SET_ROW', rowIndex: nextRow, rowCount });
          onFocusRow?.(nextRow);
          break;
        }

        case 'PageUp': {
          e.preventDefault();
          const prevRow = Math.max((focusedCell?.rowIndex ?? 0) - visibleRowCount, 0);
          dispatch({ type: 'SET_ROW', rowIndex: prevRow, rowCount });
          onFocusRow?.(prevRow);
          break;
        }

        case 'Enter':
        case ' ': {
          if (!focusedCell) {
            // Focus first cell on Enter/Space with no selection
            dispatch({ type: 'SET', cell: { rowIndex: 0, colIndex: 0 } });
            break;
          }
          e.preventDefault();
          onActivate?.(focusedCell);
          break;
        }

        case 'Escape':
          dispatch({ type: 'CLEAR' });
          break;

        default:
          break;
      }
    },
    [focusedCell, rowCount, colCount, visibleRowCount, onActivate, onFocusRow],
  );

  return {
    focusedCell,
    setFocusedCell,
    handleKeyDown,
    gridTabIndex: 0,
  };
}
