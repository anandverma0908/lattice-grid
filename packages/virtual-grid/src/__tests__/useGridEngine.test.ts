// =============================================================================
//  @virtual-grid/core — useGridEngine unit tests
// =============================================================================

import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGridEngine } from '../src/core/useGridEngine';
import type { ColumnDef } from '../src/types';

interface Row {
  id: number;
  name: string;
  value: number;
}

const columns: ColumnDef<Row>[] = [
  { id: 'id',    label: 'ID',    field: 'id',    width: 60  },
  { id: 'name',  label: 'Name',  field: 'name',  width: 150 },
  { id: 'value', label: 'Value', field: 'value', width: 100 },
];

const groupedColumns: ColumnDef<Row>[] = [
  { id: 'id', label: 'ID', field: 'id', width: 60 },
  {
    id: 'details',
    label: 'Details',
    children: [
      { id: 'name',  label: 'Name',  field: 'name',  width: 150 },
      { id: 'value', label: 'Value', field: 'value', width: 100 },
    ],
  },
];

describe('useGridEngine — column order', () => {
  it('initialises columns in definition order', () => {
    const { result } = renderHook(() => useGridEngine(columns));
    expect(result.current.orderedColumns.map((c) => c.id)).toEqual(['id', 'name', 'value']);
  });

  it('moves a column before another', () => {
    const { result } = renderHook(() => useGridEngine(columns));
    act(() => result.current.moveColumnBefore('value', 'name'));
    expect(result.current.orderedColumns.map((c) => c.id)).toEqual(['id', 'value', 'name']);
  });

  it('is a no-op when source === target', () => {
    const { result } = renderHook(() => useGridEngine(columns));
    act(() => result.current.moveColumnBefore('name', 'name'));
    expect(result.current.orderedColumns.map((c) => c.id)).toEqual(['id', 'name', 'value']);
  });
});

describe('useGridEngine — resizing', () => {
  it('resizes a column by delta', () => {
    const { result } = renderHook(() => useGridEngine(columns));
    act(() => result.current.resizeColumn('name', 50));
    expect(result.current.orderedColumns.find((c) => c.id === 'name')?.width).toBe(200);
  });

  it('clamps resize to minWidth', () => {
    const { result } = renderHook(() => useGridEngine(columns));
    act(() => result.current.resizeColumn('name', -9999));
    expect(result.current.orderedColumns.find((c) => c.id === 'name')?.width).toBe(40);
  });

  it('sets an exact width', () => {
    const { result } = renderHook(() => useGridEngine(columns));
    act(() => result.current.setColumnWidth('id', 120));
    expect(result.current.orderedColumns.find((c) => c.id === 'id')?.width).toBe(120);
  });
});

describe('useGridEngine — pinning', () => {
  it('pins a column left', () => {
    const { result } = renderHook(() => useGridEngine(columns));
    act(() => result.current.pinColumn('name', 'left'));
    expect(result.current.pinnedLeftColumns.map((c) => c.id)).toContain('name');
  });

  it('pins a column right', () => {
    const { result } = renderHook(() => useGridEngine(columns));
    act(() => result.current.pinColumn('value', 'right'));
    expect(result.current.pinnedRightColumns.map((c) => c.id)).toContain('value');
  });

  it('unpins a column', () => {
    const { result } = renderHook(() => useGridEngine(columns));
    act(() => result.current.pinColumn('name', 'left'));
    act(() => result.current.pinColumn('name', null));
    expect(result.current.pinnedLeftColumns).toHaveLength(0);
    expect(result.current.scrollableColumns.map((c) => c.id)).toContain('name');
  });

  it('computes pinnedLeftWidth correctly', () => {
    const { result } = renderHook(() => useGridEngine(columns));
    act(() => result.current.pinColumn('id', 'left'));
    act(() => result.current.pinColumn('name', 'left'));
    // 60 + 150
    expect(result.current.pinnedLeftWidth).toBe(210);
  });
});

describe('useGridEngine — visibility', () => {
  it('hides a column', () => {
    const { result } = renderHook(() => useGridEngine(columns));
    act(() => result.current.toggleColumnVisibility('name'));
    expect(result.current.visibleColumns.map((c) => c.id)).not.toContain('name');
    expect(result.current.orderedColumns.find((c) => c.id === 'name')?.hidden).toBe(true);
  });

  it('unhides a column on second toggle', () => {
    const { result } = renderHook(() => useGridEngine(columns));
    act(() => result.current.toggleColumnVisibility('name'));
    act(() => result.current.toggleColumnVisibility('name'));
    expect(result.current.visibleColumns.map((c) => c.id)).toContain('name');
  });

  it('showAllColumns restores all hidden', () => {
    const { result } = renderHook(() => useGridEngine(columns));
    act(() => result.current.toggleColumnVisibility('name'));
    act(() => result.current.toggleColumnVisibility('value'));
    act(() => result.current.showAllColumns());
    expect(result.current.visibleColumns).toHaveLength(3);
  });
});

describe('useGridEngine — sorting', () => {
  it('toggles sort asc on first click', () => {
    const { result } = renderHook(() => useGridEngine(columns));
    act(() => result.current.toggleSort('name'));
    expect(result.current.sortState).toEqual({ columnId: 'name', direction: 'asc' });
  });

  it('toggles sort desc on second click of same column', () => {
    const { result } = renderHook(() => useGridEngine(columns));
    act(() => result.current.toggleSort('name'));
    act(() => result.current.toggleSort('name'));
    expect(result.current.sortState).toEqual({ columnId: 'name', direction: 'desc' });
  });

  it('clears sort on third click of same column', () => {
    const { result } = renderHook(() => useGridEngine(columns));
    act(() => result.current.toggleSort('name'));
    act(() => result.current.toggleSort('name'));
    act(() => result.current.toggleSort('name'));
    expect(result.current.sortState.columnId).toBeNull();
  });

  it('switches to asc when a new column is clicked', () => {
    const { result } = renderHook(() => useGridEngine(columns));
    act(() => result.current.toggleSort('name'));
    act(() => result.current.toggleSort('value'));
    expect(result.current.sortState).toEqual({ columnId: 'value', direction: 'asc' });
  });
});

describe('useGridEngine — reset', () => {
  it('resets all state back to initial defs', () => {
    const { result } = renderHook(() => useGridEngine(columns));
    act(() => {
      result.current.resizeColumn('name', 200);
      result.current.pinColumn('id', 'left');
      result.current.toggleColumnVisibility('value');
      result.current.toggleSort('name');
      result.current.moveColumnBefore('value', 'id');
    });
    act(() => result.current.resetColumns());
    expect(result.current.orderedColumns.map((c) => c.id)).toEqual(['id', 'name', 'value']);
    expect(result.current.orderedColumns.find((c) => c.id === 'name')?.width).toBe(150);
    expect(result.current.pinnedLeftColumns).toHaveLength(0);
    expect(result.current.visibleColumns).toHaveLength(3);
    expect(result.current.sortState.columnId).toBeNull();
  });
});

describe('useGridEngine — grouped columns', () => {
  it('flattens group children into orderedColumns', () => {
    const { result } = renderHook(() => useGridEngine(groupedColumns));
    expect(result.current.orderedColumns.map((c) => c.id)).toEqual(['id', 'name', 'value']);
  });

  it('exposes groups array with one entry', () => {
    const { result } = renderHook(() => useGridEngine(groupedColumns));
    expect(result.current.groups).toHaveLength(1);
    expect(result.current.groups[0]?.id).toBe('details');
  });

  it('sets hasGroups true', () => {
    const { result } = renderHook(() => useGridEngine(groupedColumns));
    expect(result.current.hasGroups).toBe(true);
  });
});
