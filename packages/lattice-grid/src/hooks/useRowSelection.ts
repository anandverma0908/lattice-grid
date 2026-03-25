// =============================================================================
//  @lattice-grid/core — useRowSelection
//
//  Manages multi-row selection state.
//  Supports:
//    • Single click  → select one row
//    • Shift+click   → range select
//    • Ctrl/Cmd+click → toggle individual rows
//    • selectAll / clearSelection / toggleRow
//
//  Intentionally decoupled from LatticeGrid so consumers can wire it in
//  any way they like (checkbox column, row click, keyboard, etc.).
//
//  Usage:
//    const selection = useRowSelection({ data, getRowId });
//    <LatticeGrid onRowClick={(row, i, e) => selection.handleRowClick(row, i, e)} />
// =============================================================================

import { useCallback, useMemo, useReducer } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type RowId = string | number;

export interface UseRowSelectionOptions<TData> {
  data: TData[];
  getRowId: (row: TData, index: number) => RowId;
  /** 'single' = only one row can be selected at a time. Default: 'multi' */
  mode?: 'single' | 'multi';
  /** Initially selected row ids */
  defaultSelected?: RowId[];
  /** Controlled — called when selection changes */
  onSelectionChange?: (selectedIds: RowId[], selectedRows: TData[]) => void;
}

export interface UseRowSelectionReturn<TData> {
  /** Set of currently selected row ids */
  selectedIds: Set<RowId>;
  /** Whether all rows are selected */
  allSelected: boolean;
  /** Whether some (but not all) rows are selected */
  someSelected: boolean;
  /** Toggle a single row */
  toggleRow: (id: RowId) => void;
  /** Select all rows */
  selectAll: () => void;
  /** Clear all selections */
  clearSelection: () => void;
  /** Handle a row click with keyboard modifiers (shift, ctrl/cmd) */
  handleRowClick: (row: TData, index: number, event: React.MouseEvent) => void;
  /** The currently selected row objects */
  selectedRows: TData[];
  /** Whether a specific row id is selected */
  isSelected: (id: RowId) => boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
//  REDUCER
// ─────────────────────────────────────────────────────────────────────────────

type SelectionAction =
  | { type: 'TOGGLE'; id: RowId; mode: 'single' | 'multi' }
  | { type: 'RANGE'; fromIndex: number; toIndex: number; allIds: RowId[] }
  | { type: 'SELECT_ALL'; allIds: RowId[] }
  | { type: 'CLEAR' }
  | { type: 'SET'; ids: RowId[] };

function selectionReducer(state: Set<RowId>, action: SelectionAction): Set<RowId> {
  switch (action.type) {
    case 'TOGGLE': {
      const next = action.mode === 'single' ? new Set<RowId>() : new Set(state);
      if (next.has(action.id)) next.delete(action.id);
      else next.add(action.id);
      return next;
    }
    case 'RANGE': {
      const next = new Set(state);
      const lo = Math.min(action.fromIndex, action.toIndex);
      const hi = Math.max(action.fromIndex, action.toIndex);
      for (let i = lo; i <= hi; i++) {
        const id = action.allIds[i];
        if (id != null) next.add(id);
      }
      return next;
    }
    case 'SELECT_ALL':
      return new Set(action.allIds);
    case 'CLEAR':
      return new Set();
    case 'SET':
      return new Set(action.ids);
    default:
      return state;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  HOOK
// ─────────────────────────────────────────────────────────────────────────────

/**
 * useRowSelection
 *
 * @example
 * const sel = useRowSelection({ data, getRowId: (r) => r.id });
 *
 * // Add a checkbox column:
 * const columns = [
 *   {
 *     id: '__select__',
 *     label: '',
 *     width: 40,
 *     sortable: false,
 *     resizable: false,
 *     draggable: false,
 *     renderHeader: () => (
 *       <input
 *         type="checkbox"
 *         checked={sel.allSelected}
 *         ref={(el) => el && (el.indeterminate = sel.someSelected)}
 *         onChange={() => sel.allSelected ? sel.clearSelection() : sel.selectAll()}
 *       />
 *     ),
 *     renderCell: (_, row) => (
 *       <input
 *         type="checkbox"
 *         checked={sel.isSelected(row.id)}
 *         onChange={() => sel.toggleRow(row.id)}
 *         onClick={(e) => e.stopPropagation()}
 *       />
 *     ),
 *   },
 *   ...otherColumns,
 * ];
 */
export function useRowSelection<TData>({
  data,
  getRowId,
  mode = 'multi',
  defaultSelected = [],
  onSelectionChange,
}: UseRowSelectionOptions<TData>): UseRowSelectionReturn<TData> {
  const [selectedIds, dispatch] = useReducer(
    selectionReducer,
    new Set<RowId>(defaultSelected),
  );

  // Track last-clicked index for shift-range selection
  const lastClickedIndexRef = { current: -1 };

  // Stable row-id list for range selection
  const allIds = useMemo(() => data.map((row, i) => getRowId(row, i)), [data, getRowId]);

  const notify = useCallback(
    (nextIds: Set<RowId>) => {
      if (!onSelectionChange) return;
      const ids = [...nextIds];
      const rows = ids.flatMap((id) => {
        const idx = allIds.indexOf(id);
        const row = data[idx];
        return row ? [row] : [];
      });
      onSelectionChange(ids, rows);
    },
    [onSelectionChange, allIds, data],
  );

  const toggleRow = useCallback(
    (id: RowId) => {
      dispatch({ type: 'TOGGLE', id, mode });
    },
    [mode],
  );

  const selectAll = useCallback(() => {
    dispatch({ type: 'SELECT_ALL', allIds });
    notify(new Set(allIds));
  }, [allIds, notify]);

  const clearSelection = useCallback(() => {
    dispatch({ type: 'CLEAR' });
    notify(new Set());
  }, [notify]);

  const handleRowClick = useCallback(
    (row: TData, index: number, event: React.MouseEvent) => {
      const id = getRowId(row, index);

      if (mode === 'single') {
        dispatch({ type: 'TOGGLE', id, mode: 'single' });
        return;
      }

      if (event.shiftKey && lastClickedIndexRef.current >= 0) {
        dispatch({
          type: 'RANGE',
          fromIndex: lastClickedIndexRef.current,
          toIndex: index,
          allIds,
        });
      } else if (event.ctrlKey || event.metaKey) {
        dispatch({ type: 'TOGGLE', id, mode: 'multi' });
      } else {
        dispatch({ type: 'TOGGLE', id, mode: 'multi' });
      }

      lastClickedIndexRef.current = index;
    },
    [getRowId, mode, allIds, lastClickedIndexRef],
  );

  const selectedRows = useMemo(
    () =>
      [...selectedIds].flatMap((id) => {
        const idx = allIds.indexOf(id);
        const row = data[idx];
        return row ? [row] : [];
      }),
    [selectedIds, allIds, data],
  );

  const isSelected = useCallback((id: RowId) => selectedIds.has(id), [selectedIds]);

  return {
    selectedIds,
    allSelected: selectedIds.size === data.length && data.length > 0,
    someSelected: selectedIds.size > 0 && selectedIds.size < data.length,
    toggleRow,
    selectAll,
    clearSelection,
    handleRowClick,
    selectedRows,
    isSelected,
  };
}
