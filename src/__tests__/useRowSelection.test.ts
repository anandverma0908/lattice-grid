// =============================================================================
//  useRowSelection unit tests
// =============================================================================

import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRowSelection } from '../hooks/useRowSelection';

interface Row { id: number; name: string }
const data: Row[] = [
  { id: 1, name: 'Alpha' },
  { id: 2, name: 'Beta' },
  { id: 3, name: 'Gamma' },
  { id: 4, name: 'Delta' },
];
const getRowId = (r: Row) => r.id;

describe('useRowSelection — basics', () => {
  it('starts with empty selection', () => {
    const { result } = renderHook(() => useRowSelection({ data, getRowId }));
    expect(result.current.selectedIds.size).toBe(0);
    expect(result.current.allSelected).toBe(false);
    expect(result.current.someSelected).toBe(false);
  });

  it('toggleRow selects a row', () => {
    const { result } = renderHook(() => useRowSelection({ data, getRowId }));
    act(() => result.current.toggleRow(1));
    expect(result.current.isSelected(1)).toBe(true);
    expect(result.current.someSelected).toBe(true);
  });

  it('toggleRow deselects an already-selected row', () => {
    const { result } = renderHook(() => useRowSelection({ data, getRowId }));
    act(() => result.current.toggleRow(1));
    act(() => result.current.toggleRow(1));
    expect(result.current.isSelected(1)).toBe(false);
  });

  it('selectAll selects every row', () => {
    const { result } = renderHook(() => useRowSelection({ data, getRowId }));
    act(() => result.current.selectAll());
    expect(result.current.allSelected).toBe(true);
    expect(result.current.selectedIds.size).toBe(4);
  });

  it('clearSelection removes all', () => {
    const { result } = renderHook(() => useRowSelection({ data, getRowId }));
    act(() => result.current.selectAll());
    act(() => result.current.clearSelection());
    expect(result.current.selectedIds.size).toBe(0);
  });

  it('selectedRows returns row objects', () => {
    const { result } = renderHook(() => useRowSelection({ data, getRowId }));
    act(() => result.current.toggleRow(2));
    act(() => result.current.toggleRow(3));
    expect(result.current.selectedRows.map((r) => r.id).sort()).toEqual([2, 3]);
  });
});

describe('useRowSelection — single mode', () => {
  it('only one row can be selected at a time', () => {
    const { result } = renderHook(() =>
      useRowSelection({ data, getRowId, mode: 'single' }),
    );
    act(() => result.current.toggleRow(1));
    act(() => result.current.toggleRow(2));
    expect(result.current.selectedIds.size).toBe(1);
    expect(result.current.isSelected(2)).toBe(true);
    expect(result.current.isSelected(1)).toBe(false);
  });
});

describe('useRowSelection — defaultSelected', () => {
  it('respects initial selection', () => {
    const { result } = renderHook(() =>
      useRowSelection({ data, getRowId, defaultSelected: [1, 3] }),
    );
    expect(result.current.isSelected(1)).toBe(true);
    expect(result.current.isSelected(3)).toBe(true);
    expect(result.current.isSelected(2)).toBe(false);
  });
});

describe('useRowSelection — someSelected', () => {
  it('is true when partial selection', () => {
    const { result } = renderHook(() => useRowSelection({ data, getRowId }));
    act(() => result.current.toggleRow(1));
    expect(result.current.someSelected).toBe(true);
    expect(result.current.allSelected).toBe(false);
  });

  it('is false when all selected', () => {
    const { result } = renderHook(() => useRowSelection({ data, getRowId }));
    act(() => result.current.selectAll());
    expect(result.current.someSelected).toBe(false);
    expect(result.current.allSelected).toBe(true);
  });
});
