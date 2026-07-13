import { useCallback, useRef } from 'react';

export interface UseColumnResizeOptions {
  onResize: (columnId: string, delta: number) => void;
  onResizeEnd?: (columnId: string, finalWidth: number) => void;
  getCurrentWidth: (columnId: string) => number;
}

export function useColumnResize({
  onResize,
  onResizeEnd,
  getCurrentWidth,
}: UseColumnResizeOptions) {
  const startXRef   = useRef<number>(0);
  const columnIdRef = useRef<string>('');

  const startResize = useCallback(
    (e: React.MouseEvent, columnId: string) => {
      e.preventDefault();
      e.stopPropagation();

      startXRef.current   = e.clientX;
      columnIdRef.current = columnId;

      const onMouseMove = (ev: MouseEvent) => {
        const delta = ev.clientX - startXRef.current;
        startXRef.current = ev.clientX;
        onResize(columnIdRef.current, delta);
      };

      const onMouseUp = () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        onResizeEnd?.(columnIdRef.current, getCurrentWidth(columnIdRef.current));
      };

      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    },
    [onResize, onResizeEnd, getCurrentWidth],
  );

  return { startResize };
}
