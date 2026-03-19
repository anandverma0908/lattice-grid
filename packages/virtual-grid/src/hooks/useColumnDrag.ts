// =============================================================================
//  @virtual-grid/core — useColumnDrag
//
//  HTML5 drag-and-drop based column reordering.
//  Returns drag handlers to spread onto header cells.
// =============================================================================

import { useCallback, useRef, useState } from 'react';

export interface UseColumnDragOptions {
  onMoveColumnBefore: (sourceId: string, targetId: string) => void;
}

export interface ColumnDragState {
  draggingId: string | null;
  overTargetId: string | null;
}

export interface ColumnDragHandlers {
  getDragHandlers: (columnId: string) => {
    draggable: boolean;
    onDragStart: (e: React.DragEvent) => void;
    onDragEnd: () => void;
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: () => void;
    onDrop: (e: React.DragEvent) => void;
  };
  dragState: ColumnDragState;
}

export function useColumnDrag({
  onMoveColumnBefore,
}: UseColumnDragOptions): ColumnDragHandlers {
  const [dragState, setDragState] = useState<ColumnDragState>({
    draggingId: null,
    overTargetId: null,
  });

  const draggingIdRef = useRef<string | null>(null);

  const getDragHandlers = useCallback(
    (columnId: string) => ({
      draggable: true,

      onDragStart: (e: React.DragEvent) => {
        draggingIdRef.current = columnId;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', columnId);
        // Defer so the browser snapshot doesn't show the drag-active style
        setTimeout(() => setDragState({ draggingId: columnId, overTargetId: null }), 0);
      },

      onDragEnd: () => {
        draggingIdRef.current = null;
        setDragState({ draggingId: null, overTargetId: null });
      },

      onDragOver: (e: React.DragEvent) => {
        if (!draggingIdRef.current || draggingIdRef.current === columnId) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragState((prev) =>
          prev.overTargetId === columnId ? prev : { ...prev, overTargetId: columnId },
        );
      },

      onDragLeave: () => {
        setDragState((prev) =>
          prev.overTargetId === columnId
            ? { ...prev, overTargetId: null }
            : prev,
        );
      },

      onDrop: (e: React.DragEvent) => {
        e.preventDefault();
        const sourceId = e.dataTransfer.getData('text/plain') || draggingIdRef.current;
        if (sourceId && sourceId !== columnId) {
          onMoveColumnBefore(sourceId, columnId);
        }
        draggingIdRef.current = null;
        setDragState({ draggingId: null, overTargetId: null });
      },
    }),
    [onMoveColumnBefore],
  );

  return { getDragHandlers, dragState };
}
