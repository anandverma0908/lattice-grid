import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import type { PinSide } from '../types';

export interface DragColumnMeta {
  id: string;
  groupId: string | null;
  draggable: boolean;
  pinned: PinSide | null;
}

export interface UseColumnDragOptions {
  onMoveColumnBefore: (sourceId: string, targetId: string) => void;
  onMoveColumnToEnd?: (sourceId: string) => void;
  columns: DragColumnMeta[];
  getColumnViewportBounds: (columnId: string) => { left: number; right: number } | null;
}

export interface ColumnDragState {
  draggingId: string | null;
  overTargetId: string | null;
  insertBefore: boolean;
}

export interface ColumnDragHandlers {
  getDragHandlers: (columnId: string) => {
    onPointerDown: (e: React.PointerEvent) => void;
  };
  dragState: ColumnDragState;
  registerGhost: (el: HTMLDivElement | null) => void;
  consumeDragEnd: () => boolean;
}

const DRAG_THRESHOLD = 4;

const IDLE: ColumnDragState = { draggingId: null, overTargetId: null, insertBefore: true };

export function useColumnDrag({
  onMoveColumnBefore,
  onMoveColumnToEnd,
  columns,
  getColumnViewportBounds,
}: UseColumnDragOptions): ColumnDragHandlers {
  const [dragState, setDragState] = useState<ColumnDragState>(IDLE);

  const columnsRef = useRef<DragColumnMeta[]>(columns);
  columnsRef.current = columns;
  const getBoundsRef = useRef(getColumnViewportBounds);
  getBoundsRef.current = getColumnViewportBounds;

  const ghostElRef = useRef<HTMLDivElement | null>(null);

  const wasDraggingRef = useRef(false);

  const initialGhostLeftRef = useRef(0);

  const registerGhost = useCallback((el: HTMLDivElement | null) => {
    ghostElRef.current = el;
  }, []);

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
        // Hard barriers: different pin section, different group, or non-draggable column.
        if (c.pinned !== src.pinned) break;
        if (c.groupId !== src.groupId) break;
        if (!c.draggable) break;
        start = i;
      }
      for (let i = srcIdx + 1; i < cols.length; i++) {
        const c = cols[i]!;
        if (c.pinned !== src.pinned) break;
        if (c.groupId !== src.groupId) break;
        if (!c.draggable) break;
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
