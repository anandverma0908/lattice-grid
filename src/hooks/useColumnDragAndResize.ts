import { useCallback, useRef } from "react";
import type { MouseEvent as ReactMouseEvent, MutableRefObject, RefObject } from "react";
import { useColumnResize } from "./useColumnResize";
import { useColumnDrag, type ColumnDragHandlers } from "./useColumnDrag";
import type { ResolvedColumn } from "../types";

export interface UseColumnDragAndResizeOptions<TData> {
  orderedColumns: ResolvedColumn<TData>[];
  visibleColumns: ResolvedColumn<TData>[];
  pinnedLeftColumns: ResolvedColumn<TData>[];
  pinnedRightColumns: ResolvedColumn<TData>[];
  scrollableColumns: ResolvedColumn<TData>[];
  pinnedLeftWidth: number;
  pinnedRightWidth: number;
  offsets: number[];
  bodyWrapRef: RefObject<HTMLDivElement>;
  scrollLeftRef: MutableRefObject<number>;
  resizeColumn: (columnId: string, delta: number) => void;
  moveColumnBefore: (sourceId: string, targetId: string) => void;
  moveColumnToEnd: (sourceId: string) => void;
  onColumnResize?: ((columnId: string, width: number) => void) | undefined;
  onColumnReorder?: ((newOrder: string[]) => void) | undefined;
}

export interface UseColumnDragAndResizeReturn {
  startResize: (e: ReactMouseEvent, columnId: string) => void;
  dragHandlers: ColumnDragHandlers;
}

export function useColumnDragAndResize<TData>({
  orderedColumns,
  visibleColumns,
  pinnedLeftColumns,
  pinnedRightColumns,
  scrollableColumns,
  pinnedLeftWidth,
  pinnedRightWidth,
  offsets,
  bodyWrapRef,
  scrollLeftRef,
  resizeColumn,
  moveColumnBefore,
  moveColumnToEnd,
  onColumnResize,
  onColumnReorder,
}: UseColumnDragAndResizeOptions<TData>): UseColumnDragAndResizeReturn {
  const orderedColumnsRef = useRef(orderedColumns);
  orderedColumnsRef.current = orderedColumns;
  const onColumnReorderRef = useRef(onColumnReorder);
  onColumnReorderRef.current = onColumnReorder;

  const getWidthRef = useRef<(id: string) => number>((id) => 120);
  getWidthRef.current = (id) => orderedColumns.find((c) => c.id === id)?.width ?? 120;

  const { startResize } = useColumnResize({
    onResize: (id, delta) => resizeColumn(id, delta),
    onResizeEnd: (id, w) => onColumnResize?.(id, w),
    getCurrentWidth: useCallback((id: string) => getWidthRef.current(id), []),
  });

  const getColumnViewportBounds = useCallback(
    (columnId: string): { left: number; right: number } | null => {
      const bodyRect = bodyWrapRef.current?.getBoundingClientRect();
      if (!bodyRect) return null;
      const sl = scrollLeftRef.current;

      let acc = 0;
      for (const col of pinnedLeftColumns) {
        if (col.id === columnId)
          return {
            left: bodyRect.left + acc,
            right: bodyRect.left + acc + col.width,
          };
        acc += col.width;
      }

      const scIdx = scrollableColumns.findIndex((c) => c.id === columnId);
      if (scIdx !== -1) {
        const col = scrollableColumns[scIdx]!;
        const colLeft = pinnedLeftWidth + (offsets[scIdx] ?? 0) - sl;
        return {
          left: bodyRect.left + colLeft,
          right: bodyRect.left + colLeft + col.width,
        };
      }

      acc = 0;
      for (const col of pinnedRightColumns) {
        if (col.id === columnId) {
          const rightStart = bodyRect.right - pinnedRightWidth;
          return {
            left: rightStart + acc,
            right: rightStart + acc + col.width,
          };
        }
        acc += col.width;
      }

      return null;
    },
    [pinnedLeftColumns, scrollableColumns, pinnedRightColumns, pinnedLeftWidth, pinnedRightWidth, offsets],
  );

  const dragHandlers = useColumnDrag({
    onMoveColumnBefore: (src, tgt) => {
      moveColumnBefore(src, tgt);
      if (onColumnReorderRef.current) {
        const ids = orderedColumnsRef.current.map((c) => c.id);
        const newIds = ids.filter((id) => id !== src);
        newIds.splice(newIds.indexOf(tgt), 0, src);
        onColumnReorderRef.current(newIds);
      }
    },
    onMoveColumnToEnd: (src) => {
      moveColumnToEnd(src);
      if (onColumnReorderRef.current) {
        const ids = orderedColumnsRef.current.map((c) => c.id);
        const newIds = [...ids.filter((id) => id !== src), src];
        onColumnReorderRef.current(newIds);
      }
    },
    columns: visibleColumns.map((c) => ({
      id: c.id,
      groupId: c.groupId,
      draggable: c.draggable,
      pinned: c.pinned,
    })),
    getColumnViewportBounds,
  });

  return { startResize, dragHandlers };
}
