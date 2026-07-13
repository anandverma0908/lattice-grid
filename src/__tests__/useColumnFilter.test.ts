import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useColumnFilter } from '../hooks/useColumnFilter';
import type { LeafColumnDef } from '../types';

interface Row { id: number; name: string; city: string; value: number }

const data: Row[] = [
  { id: 1, name: 'Ahmedabad Store',  city: 'Ahmedabad', value: 10 },
  { id: 2, name: 'Bangalore Hub',    city: 'Bangalore', value: 25 },
  { id: 3, name: 'Mumbai Warehouse', city: 'Mumbai',    value: 0  },
  { id: 4, name: 'Bangalore DC',     city: 'Bangalore', value: 42 },
];

const columns: Array<LeafColumnDef<Row> & { id: string }> = [
  { id: 'name',  label: 'Name',  field: 'name'  },
  { id: 'city',  label: 'City',  field: 'city'  },
  { id: 'value', label: 'Value', field: 'value' },
];

describe('useColumnFilter', () => {
  it('returns all data when no filters active', () => {
    const { result } = renderHook(() => useColumnFilter({ data, columns }));
    expect(result.current.filteredData).toHaveLength(4);
    expect(result.current.isFiltered).toBe(false);
    expect(result.current.activeFilterCount).toBe(0);
  });

  it('filters by a single column case-insensitively', () => {
    const { result } = renderHook(() => useColumnFilter({ data, columns }));
    act(() => result.current.setFilter('city', 'bangalore'));
    expect(result.current.filteredData).toHaveLength(2);
    expect(result.current.filteredData.map((r) => r.id)).toEqual([2, 4]);
  });

  it('AND-combines multiple active filters', () => {
    const { result } = renderHook(() => useColumnFilter({ data, columns }));
    act(() => result.current.setFilter('city', 'bangalore'));
    act(() => result.current.setFilter('name', 'DC'));
    expect(result.current.filteredData).toHaveLength(1);
    expect(result.current.filteredData[0]?.id).toBe(4);
  });

  it('clearFilter removes a single filter', () => {
    const { result } = renderHook(() => useColumnFilter({ data, columns }));
    act(() => result.current.setFilter('city', 'bangalore'));
    act(() => result.current.clearFilter('city'));
    expect(result.current.filteredData).toHaveLength(4);
    expect(result.current.isFiltered).toBe(false);
  });

  it('clearAllFilters removes all filters', () => {
    const { result } = renderHook(() => useColumnFilter({ data, columns }));
    act(() => result.current.setFilter('city', 'bangalore'));
    act(() => result.current.setFilter('name', 'hub'));
    act(() => result.current.clearAllFilters());
    expect(result.current.filteredData).toHaveLength(4);
    expect(result.current.activeFilterCount).toBe(0);
  });

  it('returns empty array when nothing matches', () => {
    const { result } = renderHook(() => useColumnFilter({ data, columns }));
    act(() => result.current.setFilter('city', 'xxxxxxxxxx'));
    expect(result.current.filteredData).toHaveLength(0);
  });

  it('custom matcher is applied', () => {
    const matchers = {
      value: (cell: unknown, filter: string) => Number(cell) >= Number(filter),
    };
    const { result } = renderHook(() =>
      useColumnFilter({ data, columns, matchers }),
    );
    act(() => result.current.setFilter('value', '25'));
    expect(result.current.filteredData.map((r) => r.id)).toEqual([2, 4]);
  });

  it('activeFilterCount tracks correctly', () => {
    const { result } = renderHook(() => useColumnFilter({ data, columns }));
    act(() => result.current.setFilter('city', 'bangalore'));
    expect(result.current.activeFilterCount).toBe(1);
    act(() => result.current.setFilter('name', 'hub'));
    expect(result.current.activeFilterCount).toBe(2);
    act(() => result.current.clearFilter('city'));
    expect(result.current.activeFilterCount).toBe(1);
  });
});
