import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useVirtualRows, useVirtualCols, buildColumnOffsets } from '../hooks/useVirtualizer';
import type { ResolvedColumn } from '../types';

function makeCol(id: string, width: number): ResolvedColumn {
  return {
    id, label: id, width, minWidth: 40, maxWidth: Infinity,
    pinned: null, hidden: false, groupId: null, defIndex: 0,
    sortable: true, resizable: true, draggable: true, hideable: true,
    rowGroup: false, rowGroupIndex: null, align: 'left',
  };
}

describe('useVirtualRows', () => {
  it('renders nothing when rowCount is 0', () => {
    const { result } = renderHook(() =>
      useVirtualRows({ rowCount: 0, rowHeight: 36, scrollTop: 0, viewportHeight: 400 }),
    );
    expect(result.current.endIndex).toBe(-1);
    expect(result.current.totalHeight).toBe(0);
  });

  it('computes correct totalHeight', () => {
    const { result } = renderHook(() =>
      useVirtualRows({ rowCount: 1000, rowHeight: 36, scrollTop: 0, viewportHeight: 400 }),
    );
    expect(result.current.totalHeight).toBe(36_000);
  });

  it('starts at row 0 when scrollTop is 0', () => {
    const { result } = renderHook(() =>
      useVirtualRows({ rowCount: 500, rowHeight: 36, scrollTop: 0, viewportHeight: 400 }),
    );
    expect(result.current.startIndex).toBe(0);
  });

  it('advances startIndex when scrolled past overscan region', () => {
    const { result } = renderHook(() =>
      useVirtualRows({ rowCount: 500, rowHeight: 36, scrollTop: 360, viewportHeight: 400 }),
    );
    expect(result.current.startIndex).toBe(0);
  });

  it('does not exceed rowCount - 1 for endIndex', () => {
    const { result } = renderHook(() =>
      useVirtualRows({ rowCount: 5, rowHeight: 36, scrollTop: 0, viewportHeight: 400 }),
    );
    expect(result.current.endIndex).toBe(4);
  });

  it('offsetY equals startIndex × rowHeight', () => {
    const { result } = renderHook(() =>
      useVirtualRows({ rowCount: 500, rowHeight: 36, scrollTop: 720, viewportHeight: 400 }),
    );
    expect(result.current.offsetY).toBe(result.current.startIndex * 36);
  });
});

describe('useVirtualCols', () => {
  const columns = [
    makeCol('a', 100),
    makeCol('b', 120),
    makeCol('c', 80),
    makeCol('d', 150),
    makeCol('e', 100),
    makeCol('f', 90),
  ];

  it('returns endIndex -1 for empty columns', () => {
    const { result } = renderHook(() =>
      useVirtualCols({ columns: [], scrollLeft: 0, viewportWidth: 400 }),
    );
    expect(result.current.endIndex).toBe(-1);
  });

  it('computes correct totalWidth', () => {
    const { result } = renderHook(() =>
      useVirtualCols({ columns, scrollLeft: 0, viewportWidth: 400 }),
    );
    expect(result.current.totalWidth).toBe(640);
  });

  it('builds correct offsets array', () => {
    const { result } = renderHook(() =>
      useVirtualCols({ columns, scrollLeft: 0, viewportWidth: 400 }),
    );
    expect(result.current.offsets).toEqual([0, 100, 220, 300, 450, 550]);
  });

  it('startIndex is 0 at scrollLeft 0', () => {
    const { result } = renderHook(() =>
      useVirtualCols({ columns, scrollLeft: 0, viewportWidth: 400 }),
    );
    expect(result.current.startIndex).toBe(0);
  });

  it('advances startIndex when scrolled past first columns', () => {
    const { result } = renderHook(() =>
      useVirtualCols({ columns, scrollLeft: 210, viewportWidth: 100 }),
    );
    expect(result.current.startIndex).toBe(0);
  });
});

describe('buildColumnOffsets', () => {
  it('returns correct cumulative offsets', () => {
    const cols = [makeCol('a', 100), makeCol('b', 80), makeCol('c', 120)];
    expect(buildColumnOffsets(cols)).toEqual([0, 100, 180]);
  });

  it('returns empty array for empty input', () => {
    expect(buildColumnOffsets([])).toEqual([]);
  });
});
