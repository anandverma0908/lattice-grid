import { useCallback, useMemo, useState } from 'react';
import type { LeafColumnDef } from '../types';

export type FilterValues = Record<string, string>;

export type FilterMatcher<TData = unknown> = (
  cellValue: unknown,
  filterValue: string,
  row: TData,
) => boolean;

export interface UseColumnFilterOptions<TData> {
  data: TData[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: Array<LeafColumnDef<TData> & { id: string }>;
  matchers?: Record<string, FilterMatcher<TData>>;
  defaultFilters?: FilterValues;
}

export interface UseColumnFilterReturn<TData> {
  filteredData: TData[];
  filterValues: FilterValues;
  activeFilterCount: number;
  setFilter: (columnId: string, value: string) => void;
  clearFilter: (columnId: string) => void;
  clearAllFilters: () => void;
  isFiltered: boolean;
}

function defaultMatcher(cellValue: unknown, filterValue: string): boolean {
  if (cellValue == null) return false;
  return String(cellValue).toLowerCase().includes(filterValue.toLowerCase());
}

export function useColumnFilter<TData>({
  data,
  columns,
  matchers = {},
  defaultFilters = {},
}: UseColumnFilterOptions<TData>): UseColumnFilterReturn<TData> {
  const [filterValues, setFilterValues] = useState<FilterValues>(defaultFilters);

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
