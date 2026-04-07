// =============================================================================
//  @lattice-grid-lib/core — useGridEngine
//
//  Pure state machine. Zero rendering dependencies.
//  Manages: column order, widths, pinning, visibility, sorting.
//
//  Design decisions:
//    • Column state is normalised into a flat map keyed by id.
//      The display order is a separate array of ids.
//      This makes O(1) updates for resize/pin/hide without
//      scanning the full column tree.
//
//    • Column defs are never mutated — initial values are derived
//      once in a lazy initialiser and remain stable.
//
//    • All actions return new state via functional setState to be
//      safe under React 18 concurrent mode.
// =============================================================================

import { useCallback, useMemo, useReducer } from 'react';
import type {
  ColumnDef,
  GridEngine,
  GridEngineActions,
  GridEngineState,
  GroupColumnDef,
  LeafColumnDef,
  PinSide,
  ResolvedColumn,
  SortDirection,
  SortState,
} from '../types';
import { isGroupColumn } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
//  CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_COL_WIDTH = 120;
const MIN_COL_WIDTH = 40;
const MAX_COL_WIDTH = Infinity;

// ─────────────────────────────────────────────────────────────────────────────
//  INTERNAL STATE SHAPE
// ─────────────────────────────────────────────────────────────────────────────

interface ColRecord {
  width: number;
  minWidth: number;
  maxWidth: number;
  pinned: PinSide | null;
  hidden: boolean;
}

interface EngineInternalState {
  /** Flat map of id → mutable runtime state */
  colMap: Record<string, ColRecord>;
  /** Current display order — array of leaf column ids */
  colOrder: string[];
  /** Sort state */
  sort: SortState;
}

// ─────────────────────────────────────────────────────────────────────────────
//  REDUCER ACTIONS
// ─────────────────────────────────────────────────────────────────────────────

type Action =
  | { type: 'RESIZE'; id: string; delta: number }
  | { type: 'SET_WIDTH'; id: string; width: number }
  | { type: 'PIN'; id: string; side: PinSide | null }
  | { type: 'TOGGLE_HIDDEN'; id: string }
  | { type: 'SHOW_ALL' }
  | { type: 'MOVE_BEFORE'; sourceId: string; targetId: string }
  | { type: 'MOVE_LAST'; sourceId: string }
  | { type: 'TOGGLE_SORT'; id: string }
  | { type: 'RESET'; initial: EngineInternalState };

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function reducer(state: EngineInternalState, action: Action): EngineInternalState {
  switch (action.type) {
    case 'RESIZE': {
      const col = state.colMap[action.id];
      if (!col) return state;
      const newWidth = clamp(col.width + action.delta, col.minWidth, col.maxWidth);
      if (newWidth === col.width) return state;
      return {
        ...state,
        colMap: { ...state.colMap, [action.id]: { ...col, width: newWidth } },
      };
    }

    case 'SET_WIDTH': {
      const col = state.colMap[action.id];
      if (!col) return state;
      const newWidth = clamp(action.width, col.minWidth, col.maxWidth);
      return {
        ...state,
        colMap: { ...state.colMap, [action.id]: { ...col, width: newWidth } },
      };
    }

    case 'PIN': {
      const col = state.colMap[action.id];
      if (!col || col.pinned === action.side) return state;
      return {
        ...state,
        colMap: { ...state.colMap, [action.id]: { ...col, pinned: action.side } },
      };
    }

    case 'TOGGLE_HIDDEN': {
      const col = state.colMap[action.id];
      if (!col) return state;
      return {
        ...state,
        colMap: { ...state.colMap, [action.id]: { ...col, hidden: !col.hidden } },
      };
    }

    case 'SHOW_ALL': {
      const newMap = { ...state.colMap };
      for (const id of Object.keys(newMap)) {
        const col = newMap[id];
        if (col?.hidden) newMap[id] = { ...col, hidden: false };
      }
      return { ...state, colMap: newMap };
    }

    case 'MOVE_BEFORE': {
      const { sourceId, targetId } = action;
      const arr = [...state.colOrder];
      const fromIdx = arr.indexOf(sourceId);
      const toIdx = arr.indexOf(targetId);
      if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return state;
      arr.splice(fromIdx, 1);
      // Re-calculate target index after removal
      const newToIdx = arr.indexOf(targetId);
      arr.splice(newToIdx, 0, sourceId);
      return { ...state, colOrder: arr };
    }

    case 'MOVE_LAST': {
      const arr = [...state.colOrder];
      const idx = arr.indexOf(action.sourceId);
      if (idx === -1 || idx === arr.length - 1) return state;
      arr.splice(idx, 1);
      arr.push(action.sourceId);
      return { ...state, colOrder: arr };
    }

    case 'TOGGLE_SORT': {
      const { sort } = state;
      let direction: SortDirection = 'asc';
      if (sort.columnId === action.id) {
        if (sort.direction === 'asc') direction = 'desc';
        else {
          // third click → clear sort
          return { ...state, sort: { columnId: null, direction: 'asc' } };
        }
      }
      return { ...state, sort: { columnId: action.id, direction } };
    }

    case 'RESET':
      return action.initial;

    default:
      return state;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  COLUMN TREE FLATTENING
// ─────────────────────────────────────────────────────────────────────────────

interface FlattenResult<TData> {
  leaves: Array<LeafColumnDef<TData> & { groupId: string | null; defIndex: number }>;
  groups: GroupColumnDef<TData>[];
}

function flattenColumnDefs<TData>(defs: ColumnDef<TData>[]): FlattenResult<TData> {
  const leaves: FlattenResult<TData>['leaves'] = [];
  const groups: GroupColumnDef<TData>[] = [];

  defs.forEach((def, defIndex) => {
    if (isGroupColumn(def)) {
      groups.push(def);
      def.children.forEach((child) => {
        leaves.push({ ...child, groupId: def.id, defIndex });
      });
    } else {
      leaves.push({ ...(def as LeafColumnDef<TData>), groupId: null, defIndex });
    }
  });

  return { leaves, groups };
}

// ─────────────────────────────────────────────────────────────────────────────
//  INITIAL STATE BUILDER
// ─────────────────────────────────────────────────────────────────────────────

function buildInitialState<TData>(
  defs: ColumnDef<TData>[],
): { internal: EngineInternalState; leaves: FlattenResult<TData>['leaves']; groups: GroupColumnDef<TData>[] } {
  const { leaves, groups } = flattenColumnDefs(defs);

  const colMap: Record<string, ColRecord> = {};
  const colOrder: string[] = [];

  for (const leaf of leaves) {
    colOrder.push(leaf.id);
    colMap[leaf.id] = {
      width: leaf.width ?? DEFAULT_COL_WIDTH,
      minWidth: leaf.minWidth ?? MIN_COL_WIDTH,
      maxWidth: leaf.maxWidth ?? MAX_COL_WIDTH,
      pinned: leaf.pinned ?? null,
      hidden: leaf.hidden ?? false,
    };
  }

  return {
    internal: { colMap, colOrder, sort: { columnId: null, direction: 'asc' } },
    leaves,
    groups,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  PUBLIC HOOK
// ─────────────────────────────────────────────────────────────────────────────

/**
 * useGridEngine
 *
 * The headless core of LatticeGrid. Can be used independently to build
 * custom grid UIs.
 *
 * @example
 * const engine = useGridEngine(columns);
 * // engine.visibleColumns, engine.sortState, engine.toggleSort(id), ...
 */
export function useGridEngine<TData>(
  columnDefs: ColumnDef<TData>[],
): GridEngine<TData> {
  // Compute reducer initial state only once at mount.
  // colMap / colOrder are mutable runtime state managed by the reducer.
  const { initial } = useMemo(() => {
    const result = buildInitialState(columnDefs);
    return { initial: result.internal };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally only on mount — preserves user's resize/reorder/hide state

  // Keep leaves and groups always in sync with the latest columnDefs.
  // This ensures renderCell, renderHeader, label etc. are never stale
  // even when the caller passes updated column definitions.
  const { leaves, groups } = useMemo(
    () => flattenColumnDefs(columnDefs),
    [columnDefs],
  );

  const [state, dispatch] = useReducer(reducer, initial);

  // ── Resolved columns ──
  // Merge static leaf def with runtime col state, in current order.
  const orderedColumns = useMemo((): ResolvedColumn<TData>[] => {
    return state.colOrder.flatMap((id) => {
      const leaf = leaves.find((l) => l.id === id);
      const record = state.colMap[id];
      if (!leaf || !record) return [];

      const resolved = {
        id: leaf.id,
        label: leaf.label,
        field: leaf.field,
        accessor: leaf.accessor,
        renderCell: leaf.renderCell,
        deferRender: leaf.deferRender,
        renderHeader: leaf.renderHeader,
        cellStyle: leaf.cellStyle,
        headerStyle: leaf.headerStyle,
        align: leaf.align ?? 'left',
        sortable: leaf.sortable ?? true,
        resizable: leaf.resizable ?? true,
        draggable: leaf.draggable ?? true,
        hideable: leaf.hideable ?? true,
        groupId: leaf.groupId,
        defIndex: leaf.defIndex,
        width: record.width,
        minWidth: record.minWidth,
        maxWidth: record.maxWidth,
        pinned: record.pinned,
        hidden: record.hidden,
      } as ResolvedColumn<TData>;
      return [resolved];
    });
  }, [state.colOrder, state.colMap, leaves]);

  const visibleColumns = useMemo(
    () => orderedColumns.filter((c) => !c.hidden),
    [orderedColumns],
  );

  const pinnedLeftColumns = useMemo(
    () => visibleColumns.filter((c) => c.pinned === 'left'),
    [visibleColumns],
  );

  const pinnedRightColumns = useMemo(
    () => visibleColumns.filter((c) => c.pinned === 'right'),
    [visibleColumns],
  );

  const scrollableColumns = useMemo(
    () => visibleColumns.filter((c) => !c.pinned),
    [visibleColumns],
  );

  const pinnedLeftWidth = useMemo(
    () => pinnedLeftColumns.reduce((sum, c) => sum + c.width, 0),
    [pinnedLeftColumns],
  );

  const pinnedRightWidth = useMemo(
    () => pinnedRightColumns.reduce((sum, c) => sum + c.width, 0),
    [pinnedRightColumns],
  );

  const scrollableWidth = useMemo(
    () => scrollableColumns.reduce((sum, c) => sum + c.width, 0),
    [scrollableColumns],
  );

  // ── Actions ──
  const resizeColumn: GridEngineActions['resizeColumn'] = useCallback(
    (id, delta) => dispatch({ type: 'RESIZE', id, delta }),
    [],
  );

  const setColumnWidth: GridEngineActions['setColumnWidth'] = useCallback(
    (id, width) => dispatch({ type: 'SET_WIDTH', id, width }),
    [],
  );

  const pinColumn: GridEngineActions['pinColumn'] = useCallback(
    (id, side) => dispatch({ type: 'PIN', id, side }),
    [],
  );

  const toggleColumnVisibility: GridEngineActions['toggleColumnVisibility'] = useCallback(
    (id) => dispatch({ type: 'TOGGLE_HIDDEN', id }),
    [],
  );

  const showAllColumns: GridEngineActions['showAllColumns'] = useCallback(
    () => dispatch({ type: 'SHOW_ALL' }),
    [],
  );

  const moveColumnBefore: GridEngineActions['moveColumnBefore'] = useCallback(
    (sourceId, targetId) => dispatch({ type: 'MOVE_BEFORE', sourceId, targetId }),
    [],
  );

  const moveColumnToEnd: GridEngineActions['moveColumnToEnd'] = useCallback(
    (sourceId) => dispatch({ type: 'MOVE_LAST', sourceId }),
    [],
  );

  const toggleSort: GridEngineActions['toggleSort'] = useCallback(
    (id) => dispatch({ type: 'TOGGLE_SORT', id }),
    [],
  );

  const resetColumns: GridEngineActions['resetColumns'] = useCallback(
    () => dispatch({ type: 'RESET', initial }),
    [initial],
  );

  // ── Composed state ──
  const engineState: GridEngineState<TData> = {
    orderedColumns,
    visibleColumns,
    pinnedLeftColumns,
    pinnedRightColumns,
    scrollableColumns,
    pinnedLeftWidth,
    pinnedRightWidth,
    scrollableWidth,
    sortState: state.sort,
    groups,
    hasGroups: groups.length > 0,
  };

  const engineActions: GridEngineActions = {
    resizeColumn,
    setColumnWidth,
    pinColumn,
    toggleColumnVisibility,
    showAllColumns,
    moveColumnBefore,
    moveColumnToEnd,
    toggleSort,
    resetColumns,
  };

  return { ...engineState, ...engineActions };
}
