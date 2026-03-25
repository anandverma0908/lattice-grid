// =============================================================================
//  @lattice-grid/core — useVirtualRows / useVirtualCols
//
//  Pure window-computation hooks.
//
//  OVERSCAN strategy
//  ─────────────────
//  Rows: 8 rows above/below visible area.  Rows are tall (36px default) so
//        even rapid scrolling rarely outpaces 8 rows.
//
//  Cols: overscan is expressed as a pixel budget, not a column count.
//        With 66px-wide columns, a count of 2 = only 132px of buffer which
//        disappears in a single fast-scroll frame.
//        Instead we use OVERSCAN_COL_PX = 500px → ~7–8 columns of buffer
//        at 66px, still just 4–5 at 120px wide.  Completely eliminates
//        blank-column flicker during fast horizontal scroll.
//
//  Sync strategy (used by LatticeGrid, not here)
//  ──────────────────────────────────────────────
//  The component reads scrollLeft from a DOM ref (synchronous) on every scroll
//  event and calls calcColWindow() directly — bypassing React state latency.
//  The result is stored in a ref too so the render can use it immediately
//  without waiting for a state flush.
// =============================================================================

import { useMemo } from 'react';
import type { ResolvedColumn, VirtualColWindow, VirtualRowWindow } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
//  CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const OVERSCAN_ROWS   = 16;

/**
 * Pixel buffer rendered beyond each edge of the visible column window.
 * 1000px = ~15 columns at 66px wide, ~8 columns at 120px wide.
 * Large enough that even aggressive fast-scroll lands inside the buffer.
 */
const OVERSCAN_COL_PX = 1000;

// ─────────────────────────────────────────────────────────────────────────────
//  ROW VIRTUALISER
// ─────────────────────────────────────────────────────────────────────────────

export interface UseVirtualRowsOptions {
  rowCount:       number;
  rowHeight:      number;
  scrollTop:      number;
  viewportHeight: number;
}

export function useVirtualRows({
  rowCount,
  rowHeight,
  scrollTop,
  viewportHeight,
}: UseVirtualRowsOptions): VirtualRowWindow {
  return useMemo((): VirtualRowWindow => {
    if (rowCount === 0 || viewportHeight <= 0) {
      return { startIndex: 0, endIndex: -1, totalHeight: 0, offsetY: 0 };
    }
    const totalHeight   = rowCount * rowHeight;
    const firstVisible  = Math.floor(scrollTop / rowHeight);
    const startIndex    = Math.max(0, firstVisible - OVERSCAN_ROWS);
    const visibleCount  = Math.ceil(viewportHeight / rowHeight);
    const endIndex      = Math.min(rowCount - 1, firstVisible + visibleCount + OVERSCAN_ROWS);
    const offsetY       = startIndex * rowHeight;
    return { startIndex, endIndex, totalHeight, offsetY };
  }, [rowCount, rowHeight, scrollTop, viewportHeight]);
}

// ─────────────────────────────────────────────────────────────────────────────
//  COLUMN WINDOW CALCULATOR  (pure function — call from ref or hook)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * calcColWindow
 *
 * Pure function. Call this directly from a scroll event handler using the
 * live DOM scrollLeft value to avoid React state latency.
 *
 * @param offsets      Cumulative left offsets for every scrollable column
 * @param widths       Width of every scrollable column (parallel to offsets)
 * @param scrollLeft   How far the SCROLLABLE BAND has been scrolled
 *                     (= container.scrollLeft - pinnedLeftWidth)
 * @param viewportWidth Width of the scrollable viewport
 */
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

  // Binary search for first column whose right edge > sl
  let lo = 0, hi = n - 1;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if ((offsets[mid] ?? 0) + (widths[mid] ?? 0) <= sl) lo = mid + 1;
    else hi = mid;
  }
  const startIndex = lo;

  // Linear scan forward for last column whose left edge < sr
  let endIndex = startIndex;
  while (endIndex < n - 1 && (offsets[endIndex + 1] ?? 0) < sr) endIndex++;

  return { startIndex, endIndex: Math.min(n - 1, endIndex) };
}

// ─────────────────────────────────────────────────────────────────────────────
//  COLUMN VIRTUALISER HOOK  (React wrapper around calcColWindow)
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
//  UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

export function buildColumnOffsets(columns: ResolvedColumn[]): number[] {
  const offsets: number[] = new Array(columns.length);
  let acc = 0;
  for (let i = 0; i < columns.length; i++) {
    offsets[i] = acc;
    acc += columns[i]?.width ?? 0;
  }
  return offsets;
}
