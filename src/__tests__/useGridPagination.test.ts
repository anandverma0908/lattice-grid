// =============================================================================
//  useGridPagination unit tests
// =============================================================================

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGridPagination } from '../src/hooks/useGridPagination';

const data = Array.from({ length: 250 }, (_, i) => ({ id: i }));

describe('useGridPagination — client-side', () => {
  it('starts on page 1', () => {
    const { result } = renderHook(() => useGridPagination({ data, pageSize: 50 }));
    expect(result.current.currentPage).toBe(1);
  });

  it('computes correct pageCount', () => {
    const { result } = renderHook(() => useGridPagination({ data, pageSize: 50 }));
    expect(result.current.pageCount).toBe(5);
  });

  it('pageData slices correctly', () => {
    const { result } = renderHook(() => useGridPagination({ data, pageSize: 50 }));
    expect(result.current.pageData).toHaveLength(50);
    expect(result.current.pageData[0]).toEqual({ id: 0 });
  });

  it('nextPage advances page', () => {
    const { result } = renderHook(() => useGridPagination({ data, pageSize: 50 }));
    act(() => result.current.nextPage());
    expect(result.current.currentPage).toBe(2);
    expect(result.current.pageData[0]).toEqual({ id: 50 });
  });

  it('prevPage decrements page', () => {
    const { result } = renderHook(() => useGridPagination({ data, pageSize: 50 }));
    act(() => result.current.nextPage());
    act(() => result.current.prevPage());
    expect(result.current.currentPage).toBe(1);
  });

  it('canGoPrev is false on first page', () => {
    const { result } = renderHook(() => useGridPagination({ data, pageSize: 50 }));
    expect(result.current.canGoPrev).toBe(false);
  });

  it('canGoNext is false on last page', () => {
    const { result } = renderHook(() => useGridPagination({ data, pageSize: 50 }));
    act(() => result.current.lastPage());
    expect(result.current.canGoNext).toBe(false);
  });

  it('goToPage clamps to valid range', () => {
    const { result } = renderHook(() => useGridPagination({ data, pageSize: 50 }));
    act(() => result.current.goToPage(999));
    expect(result.current.currentPage).toBe(5);
    act(() => result.current.goToPage(-1));
    expect(result.current.currentPage).toBe(1);
  });

  it('setPageSize resets to page 1', () => {
    const { result } = renderHook(() => useGridPagination({ data, pageSize: 50 }));
    act(() => result.current.nextPage());
    act(() => result.current.nextPage());
    act(() => result.current.setPageSize(100));
    expect(result.current.currentPage).toBe(1);
    expect(result.current.pageCount).toBe(3);
  });

  it('handles last page with partial data correctly', () => {
    // 250 rows / 100 per page = 3 pages, last has 50
    const { result } = renderHook(() => useGridPagination({ data, pageSize: 100 }));
    act(() => result.current.lastPage());
    expect(result.current.pageData).toHaveLength(50);
  });
});

describe('useGridPagination — server-side', () => {
  it('uses totalRows prop for pageCount', () => {
    const { result } = renderHook(() =>
      useGridPagination({ totalRows: 10000, pageSize: 100 }),
    );
    expect(result.current.pageCount).toBe(100);
    expect(result.current.totalRows).toBe(10000);
  });

  it('pageData is empty (no data provided)', () => {
    const { result } = renderHook(() =>
      useGridPagination({ totalRows: 10000, pageSize: 100 }),
    );
    expect(result.current.pageData).toEqual([]);
  });

  it('startIndex and endIndex are correct on page 3', () => {
    const { result } = renderHook(() =>
      useGridPagination({ totalRows: 10000, pageSize: 100 }),
    );
    act(() => result.current.goToPage(3));
    expect(result.current.startIndex).toBe(200);
    expect(result.current.endIndex).toBe(299);
  });
});
