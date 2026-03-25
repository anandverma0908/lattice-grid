// =============================================================================
//  @lattice-grid-lib/core — useColumnFilter
//
//  Per-column filtering. Returns a filtered slice of the data array and
//  methods to set/clear per-column filter values.
//
//  Design:
//    • Filters are a Record<columnId, string> map.
//    • Each filter value is matched with a configurable matcher function.
//    • Default matcher: case-insensitive string-includes.
//    • Multiple active filters are AND-combined.
//    • Returns a stable `filteredData` array (memoised).
//
//  Usage:
//    const { filteredData, setFilter, clearFilter, filterValues } =
//      useColumnFilter({ data, columns });
//
//    <LatticeGrid data={filteredData} columns={columns} />
// =============================================================================

import { useCallback, useMemo, useState } from 'react';
import type { LeafColumnDef } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type FilterValues = Record<string, string>;

/**
 * A custom matcher for a single column.
 * Return `true` to keep the row, `false` to exclude it.
 */
export type FilterMatcher<TData = unknown> = (
  cellValue: unknown,
  filterValue: string,
  row: TData,
) => boolean;

export interface UseColumnFilterOptions<TData> {
  data: TData[];
  /** All leaf columns — used to look up accessors/fields */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: Array<LeafColumnDef<TData> & { id: string }>;
  /**
   * Per-column custom matchers.
   * Falls back to case-insensitive string-includes.
   */
  matchers?: Record<string, FilterMatcher<TData>>;
  /** Initial filter values */
  defaultFilters?: FilterValues;
}

export interface UseColumnFilterReturn<TData> {
  /** The filtered subset of data */
  filteredData: TData[];
  /** Current filter values map */
  filterValues: FilterValues;
  /** Number of active filters */
  activeFilterCount: number;
  /** Set a filter for a column id */
  setFilter: (columnId: string, value: string) => void;
  /** Clear a specific column filter */
  clearFilter: (columnId: string) => void;
  /** Clear all filters */
  clearAllFilters: () => void;
  /** Whether any filter is active */
  isFiltered: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
//  DEFAULT MATCHER
// ─────────────────────────────────────────────────────────────────────────────

function defaultMatcher(cellValue: unknown, filterValue: string): boolean {
  if (cellValue == null) return false;
  return String(cellValue).toLowerCase().includes(filterValue.toLowerCase());
}

// ─────────────────────────────────────────────────────────────────────────────
//  HOOK
// ─────────────────────────────────────────────────────────────────────────────

/**
 * useColumnFilter
 *
 * @example
 * const filter = useColumnFilter({ data: rows, columns: leafColumns });
 *
 * // Render filter inputs above/in the grid header:
 * <input
 *   value={filter.filterValues['name'] ?? ''}
 *   onChange={(e) => filter.setFilter('name', e.target.value)}
 *   placeholder="Filter name..."
 * />
 *
 * <LatticeGrid data={filter.filteredData} columns={columns} />
 */
export function useColumnFilter<TData>({
  data,
  columns,
  matchers = {},
  defaultFilters = {},
}: UseColumnFilterOptions<TData>): UseColumnFilterReturn<TData> {
  const [filterValues, setFilterValues] = useState<FilterValues>(defaultFilters);

  // Build a quick lookup: columnId → value getter
  const getters = useMemo(() => {
    const map = new Map<string, (row: TData) => unknown>();
    for (const col of columns) {
      if (col.accessor) {
        map.set(col.id, col.accessor as (row: TData) => unknown);
      } else {
        const field = col.field ?? col.id;
        map.set(col.id, (row: TData) => (row as Record<string, unknown>)[field]);
      }
    }
    return map;
  }, [columns]);

  const filteredData = useMemo(() => {
    const activeFilters = Object.entries(filterValues).filter(([, v]) => v.trim() !== '');
    if (activeFilters.length === 0) return data;

    return data.filter((row) =>
      activeFilters.every(([colId, filterValue]) => {
        const getter = getters.get(colId);
        const cellValue = getter ? getter(row) : undefined;
        const matcher = matchers[colId] ?? defaultMatcher;
        return matcher(cellValue, filterValue, row);
      }),
    );
  }, [data, filterValues, getters, matchers]);

  const setFilter = useCallback((columnId: string, value: string) => {
    setFilterValues((prev) => ({ ...prev, [columnId]: value }));
  }, []);

  const clearFilter = useCallback((columnId: string) => {
    setFilterValues((prev) => {
      const next = { ...prev };
      delete next[columnId];
      return next;
    });
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilterValues({});
  }, []);

  const activeFilterCount = useMemo(
    () => Object.values(filterValues).filter((v) => v.trim() !== '').length,
    [filterValues],
  );

  return {
    filteredData,
    filterValues,
    activeFilterCount,
    setFilter,
    clearFilter,
    clearAllFilters,
    isFiltered: activeFilterCount > 0,
  };
}
