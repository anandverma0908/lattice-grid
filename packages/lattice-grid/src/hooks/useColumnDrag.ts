// =============================================================================
//  @lattice-grid-lib/core — useColumnDrag  (pointer-event based reorder)
//
//  Performance design:
//    • Only `draggingId` and `overTargetId` live in React state.
//    • Ghost left / indicator left+display are applied via direct DOM style
//      mutations inside a requestAnimationFrame loop — zero React re-renders.
//    • `useLayoutEffect` sets the ghost's initial left position after the DOM
//      mounts but before the browser paints, so there's never a flash frame.
//    • `overTargetId` only triggers a React update when it actually changes
//      (cursor crosses a column midpoint), not on every pixel of movement.
//
//  Root-cause fix for the "ghost snaps back on column boundary":
//    The old code stored `ghostLeft` in React state. Every time `overTargetId`
//    changed, React re-rendered and reset el.style.left to the stale state
//    value. Fix: `left` / `display` are NEVER in the React-managed style of
//    ghost or indicator. The hook owns them entirely via DOM mutations.
//
//  Drop constraints:
//    • Non-draggable columns are hard barriers — you cannot reorder across them.
//    • Group membership is respected — grouped columns stay within their group.
//    • Pin-section respected — scrollable columns stay in scrollable, pinned in pinned.
//
//  No DOM registry:
//    • getColumnViewportBounds() is provided by the caller (LatticeGrid) and
//      computes positions mathematically from engine state, so ALL columns are
//      valid drop targets regardless of the virtual column window.
// =============================================================================

import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import type { PinSide } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────────────────────────────────────

export interface DragColumnMeta {
  id: string;
  groupId: string | null;
  draggable: boolean;
  pinned: PinSide | null;
}

export interface UseColumnDragOptions {
  onMoveColumnBefore: (sourceId: string, targetId: string) => void;
  onMoveColumnToEnd?: (sourceId: string) => void;
  /** Current visible columns in order — used for zone computation. */
  columns: DragColumnMeta[];
  /**
   * Returns viewport {left, right} of any column.
   * Computed mathematically in LatticeGrid so it works for ALL columns,
   * including those outside the current virtual render window.
   */
  getColumnViewportBounds: (columnId: string) => { left: number; right: number } | null;
}

export interface ColumnDragState {
  draggingId: string | null;
  overTargetId: string | null;
  // NOTE: ghostLeft is intentionally NOT here. It lives in a mutable ref so
  // React never touches el.style.left after the initial useLayoutEffect sets it.
}

export interface ColumnDragHandlers {
  getDragHandlers: (columnId: string) => {
    onPointerDown: (e: React.PointerEvent) => void;
  };
  dragState: ColumnDragState;
  /** Attach to ghost div — hook will write left directly, bypassing React. */
  registerGhost: (el: HTMLDivElement | null) => void;
  /** Attach to indicator div — hook initialises it hidden and writes left/display directly. */
  registerIndicator: (el: HTMLDivElement | null) => void;
  /**
   * Returns true (and clears the flag) if a real drag just ended.
   * Call in click/sort handlers to swallow the post-drag synthetic click.
   */
  consumeDragEnd: () => boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Constants
// ─────────────────────────────────────────────────────────────────────────────

const DRAG_THRESHOLD = 4; // px before drag activates

const IDLE: ColumnDragState = { draggingId: null, overTargetId: null };

// ─────────────────────────────────────────────────────────────────────────────
//  Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useColumnDrag({
  onMoveColumnBefore,
  onMoveColumnToEnd,
  columns,
  getColumnViewportBounds,
}: UseColumnDragOptions): ColumnDragHandlers {
  const [dragState, setDragState] = useState<ColumnDragState>(IDLE);

  // Always-current refs — avoids stale closures inside pointer handlers.
  const columnsRef = useRef<DragColumnMeta[]>(columns);
  columnsRef.current = columns;
  const getBoundsRef = useRef(getColumnViewportBounds);
  getBoundsRef.current = getColumnViewportBounds;

  // DOM refs for ghost and indicator elements.
  const ghostElRef = useRef<HTMLDivElement | null>(null);
  const indicatorElRef = useRef<HTMLDivElement | null>(null);

  // Set to true when a real drag (threshold crossed) completes. Cleared by
  // consumeDragEnd() so the post-drag click does not trigger sort/click handlers.
  const wasDraggingRef = useRef(false);

  // Initial ghost left set when drag activates — read by useLayoutEffect.
  const initialGhostLeftRef = useRef(0);

  // Register callbacks — called by React when elements mount/unmount.
  const registerGhost = useCallback((el: HTMLDivElement | null) => {
    ghostElRef.current = el;
  }, []);

  const registerIndicator = useCallback((el: HTMLDivElement | null) => {
    indicatorElRef.current = el;
    // Ensure indicator starts hidden so it's never visible at left:0 before
    // the hook positions it. React never writes display/left on this element.
    if (el) el.style.display = 'none';
  }, []);

  // ── Initial ghost position via layout effect ────────────────────────────────
  // Fires after React mounts the ghost div (refs are set) but before browser
  // paints. This is the ONE place we set ghost left from state → DOM. All
  // subsequent moves are handled by the pointer handler via direct DOM writes,
  // so React re-renders caused by overTargetId changes never reset the position.
  useLayoutEffect(() => {
    if (dragState.draggingId && ghostElRef.current) {
      ghostElRef.current.style.left = `${initialGhostLeftRef.current}px`;
    }
  }, [dragState.draggingId]);

  // ── Zone computation ────────────────────────────────────────────────────────
  const getEffectiveZone = useCallback(
    (draggingId: string): { ids: Set<string>; afterId: string | null } => {
      const cols = columnsRef.current;
      const srcIdx = cols.findIndex((c) => c.id === draggingId);
      if (srcIdx === -1) return { ids: new Set([draggingId]), afterId: null };

      const src = cols[srcIdx]!;
      let start = srcIdx;
      let end = srcIdx;

      for (let i = srcIdx - 1; i >= 0; i--) {
        const c = cols[i]!;
        if (!c.draggable || c.groupId !== src.groupId || c.pinned !== src.pinned) break;
        start = i;
      }
      for (let i = srcIdx + 1; i < cols.length; i++) {
        const c = cols[i]!;
        if (!c.draggable || c.groupId !== src.groupId || c.pinned !== src.pinned) break;
        end = i;
      }

      const ids = new Set(cols.slice(start, end + 1).map((c) => c.id));
      const afterId = cols[end + 1]?.id ?? null;
      return { ids, afterId };
    },
    [],
  );

  // ── Position resolver ───────────────────────────────────────────────────────
  const resolve = useCallback(
    (
      cursorX: number,
      draggingId: string,
    ): { id: string | null; lineX: number | null; afterId: string | null } => {
      const { ids: zoneIds, afterId } = getEffectiveZone(draggingId);
      const getBounds = getBoundsRef.current;

      const candidates: { id: string; left: number; right: number; mid: number }[] = [];
      for (const id of zoneIds) {
        if (id === draggingId) continue;
        const b = getBounds(id);
        if (!b) continue;
        candidates.push({ id, left: b.left, right: b.right, mid: (b.left + b.right) / 2 });
      }
      candidates.sort((a, b) => a.left - b.left);

      for (const col of candidates) {
        if (cursorX <= col.mid) {
          return { id: col.id, lineX: col.left, afterId };
        }
      }

      const last = candidates[candidates.length - 1];
      if (last) return { id: null, lineX: last.right, afterId };
      return { id: null, lineX: null, afterId };
    },
    [getEffectiveZone],
  );

  // ── Drag handlers ───────────────────────────────────────────────────────────
  const getDragHandlers = useCallback(
    (columnId: string) => ({
      onPointerDown: (e: React.PointerEvent) => {
        if (e.button !== 0) return;
        e.preventDefault();

        const startX = e.clientX;
        const startY = e.clientY;
        let active = false;
        let offsetX = 0;
        let rafId = 0;
        let pendingEv: PointerEvent | null = null;
        let lastOverTargetId: string | null = null;

        const flush = () => {
          if (!pendingEv) return;
          const ev = pendingEv;
          pendingEv = null;

          const { id, lineX } = resolve(ev.clientX, columnId);

          // ── Direct DOM updates — zero React renders ──
          if (ghostElRef.current) {
            ghostElRef.current.style.left = `${ev.clientX - offsetX}px`;
          }
          if (indicatorElRef.current) {
            if (lineX !== null) {
              indicatorElRef.current.style.left = `${lineX - 1}px`;
              indicatorElRef.current.style.display = 'block';
            } else {
              indicatorElRef.current.style.display = 'none';
            }
          }

          // React update only when the drop-target column changes (column midpoint crossed).
          if (id !== lastOverTargetId) {
            lastOverTargetId = id;
            setDragState((prev) =>
              prev.overTargetId === id ? prev : { ...prev, overTargetId: id },
            );
          }
        };

        const onPointerMove = (ev: PointerEvent) => {
          if (!active) {
            if (
              Math.abs(ev.clientX - startX) < DRAG_THRESHOLD &&
              Math.abs(ev.clientY - startY) < DRAG_THRESHOLD
            )
              return;

            active = true;
            const bounds = getBoundsRef.current(columnId);
            if (bounds) offsetX = startX - bounds.left;

            // Store initial left in ref so useLayoutEffect can apply it after
            // the ghost div mounts (before paint). Never stored in React state.
            initialGhostLeftRef.current = startX - offsetX;

            const { id } = resolve(startX, columnId);
            lastOverTargetId = id;

            // Minimal React update — just mounts the ghost/indicator elements.
            setDragState({ draggingId: columnId, overTargetId: id });

            document.body.style.cursor = 'grabbing';
            (
              document.body.style as CSSStyleDeclaration & { userSelect: string }
            ).userSelect = 'none';
            return;
          }

          pendingEv = ev;
          if (!rafId) {
            rafId = requestAnimationFrame(() => {
              rafId = 0;
              flush();
            });
          }
        };

        const onPointerUp = (ev: PointerEvent) => {
          document.removeEventListener('pointermove', onPointerMove);
          document.removeEventListener('pointerup', onPointerUp);
          if (rafId) cancelAnimationFrame(rafId);
          document.body.style.cursor = '';
          (document.body.style as CSSStyleDeclaration & { userSelect: string }).userSelect = '';

          if (active) {
            const { id: insertId, afterId } = resolve(ev.clientX, columnId);
            if (insertId !== null && insertId !== columnId) {
              onMoveColumnBefore(columnId, insertId);
            } else if (insertId === null) {
              if (afterId !== null) {
                onMoveColumnBefore(columnId, afterId);
              } else {
                onMoveColumnToEnd?.(columnId);
              }
            }

            // Mark that a real drag ended so consumeDragEnd() can swallow
            // the click event that the browser fires after pointerup.
            wasDraggingRef.current = true;
            // Reset after the current event loop flushes (click fires in the
            // same task as pointerup, so setTimeout(0) resets after it).
            setTimeout(() => { wasDraggingRef.current = false; }, 0);
          }

          setDragState(IDLE);
        };

        document.addEventListener('pointermove', onPointerMove);
        document.addEventListener('pointerup', onPointerUp);
      },
    }),
    [onMoveColumnBefore, onMoveColumnToEnd, resolve],
  );

  const consumeDragEnd = useCallback(() => {
    if (wasDraggingRef.current) {
      wasDraggingRef.current = false;
      return true;
    }
    return false;
  }, []);

  return { getDragHandlers, dragState, registerGhost, registerIndicator, consumeDragEnd };
}
