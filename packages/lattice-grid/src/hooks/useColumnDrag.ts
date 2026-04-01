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
  /**
   * The column whose header is highlighted as the drop destination.
   * - non-null + insertBefore=true  → cursor is in the left half of this column  (will insert before it)
   * - non-null + insertBefore=false → cursor is past all zone columns (will insert after this one)
   * - null → no valid drop target in zone
   *
   * NOTE: ghostLeft is intentionally NOT here. It lives in a mutable ref so
   * React never touches el.style.left after the initial useLayoutEffect sets it.
   */
  overTargetId: string | null;
  /** Which side of the highlighted header to accent. true = left edge, false = right edge. */
  insertBefore: boolean;
}

export interface ColumnDragHandlers {
  getDragHandlers: (columnId: string) => {
    onPointerDown: (e: React.PointerEvent) => void;
  };
  dragState: ColumnDragState;
  /** Attach to ghost div — hook will write left directly, bypassing React. */
  registerGhost: (el: HTMLDivElement | null) => void;
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

const IDLE: ColumnDragState = { draggingId: null, overTargetId: null, insertBefore: true };

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

  // DOM ref for the ghost element — left position written directly (no React re-render).
  const ghostElRef = useRef<HTMLDivElement | null>(null);

  // Set to true when a real drag (threshold crossed) completes. Cleared by
  // consumeDragEnd() so the post-drag click does not trigger sort/click handlers.
  const wasDraggingRef = useRef(false);

  // Initial ghost left set when drag activates — read by useLayoutEffect.
  const initialGhostLeftRef = useRef(0);

  // Register callbacks — called by React when elements mount/unmount.
  const registerGhost = useCallback((el: HTMLDivElement | null) => {
    ghostElRef.current = el;
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
  // The only hard stop for zone expansion is a pin-section change
  // (left-pinned / scrollable / right-pinned).  Group boundaries and
  // non-draggable columns are transparent — draggable columns anywhere in
  // the same pin section can be freely reordered with each other.
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
        // Only hard barrier: different pin section (left-pinned / scrollable / right-pinned).
        if (c.pinned !== src.pinned) break;
        start = i;
      }
      for (let i = srcIdx + 1; i < cols.length; i++) {
        const c = cols[i]!;
        if (c.pinned !== src.pinned) break;
        end = i;
      }

      const ids = new Set(cols.slice(start, end + 1).map((c) => c.id));
      const afterId = cols[end + 1]?.id ?? null;
      return { ids, afterId };
    },
    [],
  );

  // ── Position resolver ───────────────────────────────────────────────────────
  // Returns:
  //   id           — drop-logic: column to insert BEFORE (can be non-draggable; null = append)
  //   afterId      — drop-logic: barrier column after the zone (or null)
  //   highlightId  — visual: draggable column whose header to accent (null = no target)
  //   insertBefore — visual: true = left-edge accent (before), false = right-edge (after)
  //
  // Non-draggable columns inside the zone are included in position detection so the
  // cursor position resolves accurately across the full width.  For the visual
  // indicator we always map to the nearest draggable column:
  //   • cursor in left half of draggable col  → highlight that col, left accent
  //   • cursor in left half of non-draggable  → highlight last draggable seen, right accent
  //   • cursor past all candidates             → highlight last draggable, right accent
  const resolve = useCallback(
    (
      cursorX: number,
      draggingId: string,
    ): { id: string | null; afterId: string | null; highlightId: string | null; insertBefore: boolean } => {
      const { ids: zoneIds, afterId } = getEffectiveZone(draggingId);
      const getBounds = getBoundsRef.current;
      const cols = columnsRef.current;

      // ALL zone columns (draggable + non-draggable) contribute to position detection.
      const candidates: { id: string; left: number; right: number; mid: number; draggable: boolean }[] = [];
      for (const id of zoneIds) {
        if (id === draggingId) continue;
        const b = getBounds(id);
        if (!b) continue;
        const meta = cols.find((c) => c.id === id);
        candidates.push({
          id,
          left: b.left,
          right: b.right,
          mid: (b.left + b.right) / 2,
          draggable: meta?.draggable ?? false,
        });
      }
      candidates.sort((a, b) => a.left - b.left);

      // Walk left-to-right, tracking the last draggable column we passed.
      let lastDraggableSeen: (typeof candidates)[0] | null = null;

      for (const col of candidates) {
        if (cursorX <= col.mid) {
          if (col.draggable) {
            // Cursor in the left half of a draggable column → insert before it.
            return { id: col.id, afterId, highlightId: col.id, insertBefore: true };
          } else {
            // Cursor in the left half of a non-draggable column.
            // Drop: insert before this non-draggable (puts dragged col just before the block).
            // Visual: accent the previous draggable with a right-edge indicator ("after me").
            return {
              id: col.id,
              afterId,
              highlightId: lastDraggableSeen?.id ?? null,
              insertBefore: false,
            };
          }
        }
        if (col.draggable) lastDraggableSeen = col;
      }

      // Cursor is past all candidates → append to zone end.
      // Find the last draggable column for the visual indicator.
      let lastDraggable: (typeof candidates)[0] | null = null;
      for (let i = candidates.length - 1; i >= 0; i--) {
        if (candidates[i]!.draggable) { lastDraggable = candidates[i]!; break; }
      }
      const last = candidates[candidates.length - 1];
      if (last) return { id: null, afterId, highlightId: lastDraggable?.id ?? null, insertBefore: false };
      return { id: null, afterId, highlightId: null, insertBefore: true };
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
        let lastHighlightId: string | null = null;
        let lastInsertBefore: boolean = true;

        const flush = () => {
          if (!pendingEv) return;
          const ev = pendingEv;
          pendingEv = null;

          const { highlightId, insertBefore } = resolve(ev.clientX, columnId);

          // ── Ghost position — direct DOM update, zero React renders ──
          if (ghostElRef.current) {
            ghostElRef.current.style.left = `${ev.clientX - offsetX}px`;
          }

          // ── React update only when the highlighted column or side changes ──
          if (highlightId !== lastHighlightId || insertBefore !== lastInsertBefore) {
            lastHighlightId = highlightId;
            lastInsertBefore = insertBefore;
            setDragState((prev) =>
              prev.overTargetId === highlightId && prev.insertBefore === insertBefore
                ? prev
                : { ...prev, overTargetId: highlightId, insertBefore },
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

            const { highlightId, insertBefore } = resolve(startX, columnId);
            lastHighlightId = highlightId;
            lastInsertBefore = insertBefore;

            // Minimal React update — mounts the ghost and sets initial highlight.
            setDragState({ draggingId: columnId, overTargetId: highlightId, insertBefore });

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

  return { getDragHandlers, dragState, registerGhost, consumeDragEnd };
}
