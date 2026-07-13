import { useMemo } from 'react';
import type { ResolvedColumn, VirtualColWindow, VirtualRowWindow } from '../types';

const OVERSCAN_ROWS   = 16;

const OVERSCAN_COL_PX = 1000;

export interface UseVirtualRowsOptions {
  rowCount:       number;
  rowHeight:      number;
  scrollTop:      number;
  viewportHeight: number;
}

export function computeVRows(
  rowCount:       number,
  rowHeight:      number,
  scrollTop:      number,
  viewportHeight: number,
): VirtualRowWindow {
  if (rowCount === 0 || viewportHeight <= 0) {
    return { startIndex: 0, endIndex: -1, totalHeight: rowCount * rowHeight, offsetY: 0 };
  }
  const totalHeight  = rowCount * rowHeight;
  const firstVisible = Math.floor(scrollTop / rowHeight);
  const startIndex   = Math.max(0, firstVisible - OVERSCAN_ROWS);
  const visibleCount = Math.ceil(viewportHeight / rowHeight);
  const endIndex     = Math.min(rowCount - 1, firstVisible + visibleCount + OVERSCAN_ROWS);
  return { startIndex, endIndex, totalHeight, offsetY: startIndex * rowHeight };
}

export function useVirtualRows({
  rowCount,
  rowHeight,
  scrollTop,
  viewportHeight,
}: UseVirtualRowsOptions): VirtualRowWindow {
  return useMemo(
    () => computeVRows(rowCount, rowHeight, scrollTop, viewportHeight),
    [rowCount, rowHeight, scrollTop, viewportHeight],
  );
}

export function calcColWindow(
  offsets:       number[],
  widths:        number[],
  scrollLeft:    number,
  viewportWidth: number,
): { startIndex: number; endIndex: number } {
  const n = offsets.length;
  if (n === 0) return { startIndex: 0, endIndex: -1 };

  const sl = Math.max(0, scrollLeft - OVERSCAN_COL_PX);
  const sr = scrollLeft + viewportWidth + OVERSCAN_COL_PX;

  let lo = 0, hi = n - 1;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if ((offsets[mid] ?? 0) + (widths[mid] ?? 0) <= sl) lo = mid + 1;
    else hi = mid;
  }
  const startIndex = lo;

  let endIndex = startIndex;
  while (endIndex < n - 1 && (offsets[endIndex + 1] ?? 0) < sr) endIndex++;

  return { startIndex, endIndex: Math.min(n - 1, endIndex) };
}

export interface UseVirtualColsOptions {
  columns:       ResolvedColumn[];
  scrollLeft:    number;
  viewportWidth: number;
}

export function useVirtualCols({
  columns,
  scrollLeft,
  viewportWidth,
}: UseVirtualColsOptions): VirtualColWindow {
  return useMemo((): VirtualColWindow => {
    if (columns.length === 0) {
      return { startIndex: 0, endIndex: -1, totalWidth: 0, offsets: [] };
    }

    const offsets: number[] = new Array(columns.length);
    const widths:  number[] = new Array(columns.length);
    let acc = 0;
    for (let i = 0; i < columns.length; i++) {
      offsets[i] = acc;
      widths[i]  = columns[i]?.width ?? 0;
      acc += widths[i] ?? 0;
    }

    const { startIndex, endIndex } = calcColWindow(offsets, widths, scrollLeft, viewportWidth);
    return { startIndex, endIndex, totalWidth: acc, offsets };
  }, [columns, scrollLeft, viewportWidth]);
}

export function buildColumnOffsets(columns: ResolvedColumn[]): number[] {
  const offsets: number[] = new Array(columns.length);
  let acc = 0;
  for (let i = 0; i < columns.length; i++) {
    offsets[i] = acc;
    acc += columns[i]?.width ?? 0;
  }
  return offsets;
}
