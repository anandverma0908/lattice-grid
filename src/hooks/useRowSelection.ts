import { useCallback, useMemo, useReducer } from 'react';

export type RowId = string | number;

export interface UseRowSelectionOptions<TData> {
  data: TData[];
  getRowId: (row: TData, index: number) => RowId;
  mode?: 'single' | 'multi';
  defaultSelected?: RowId[];
  onSelectionChange?: (selectedIds: RowId[], selectedRows: TData[]) => void;
}

export interface UseRowSelectionReturn<TData> {
  selectedIds: Set<RowId>;
  allSelected: boolean;
  someSelected: boolean;
  toggleRow: (id: RowId) => void;
  selectAll: () => void;
  clearSelection: () => void;
  handleRowClick: (row: TData, index: number, event: React.MouseEvent) => void;
  selectedRows: TData[];
  isSelected: (id: RowId) => boolean;
}

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

  const lastClickedIndexRef = { current: -1 };

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
        dispatch({ type: 'SET', ids: [id] });
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
        dispatch({ type: 'SET', ids: [id] });
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
