import { useEffect, useRef } from "react";
import type { ColumnState, ResolvedColumn } from "../types";

export function useColumnStateNotifier<TData>(
  orderedColumns: ResolvedColumn<TData>[],
  onColumnStateChange: ((state: ColumnState[]) => void) | undefined,
): void {
  const prevColStateKeyRef = useRef("");
  useEffect(() => {
    if (!onColumnStateChange) return;
    const snapshot = orderedColumns.map((col, i) => ({
      id: col.id,
      hidden: col.hidden,
      pinned: col.pinned,
      width: col.width,
      order: i,
    }));
    const key = JSON.stringify(snapshot);
    if (key === prevColStateKeyRef.current) return;
    prevColStateKeyRef.current = key;
    onColumnStateChange(snapshot);
  }, [orderedColumns, onColumnStateChange]);
}
