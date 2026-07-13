import { useEffect, useRef } from "react";
import type { GridEngine, SortState } from "../types";

export interface UseGroupingSyncOptions<TData> {
  engine: GridEngine<TData>;
  derivedGroupBy: string[];
  groupByProp?: string[] | undefined;
  onGroupingChange?: ((groupBy: string[]) => void) | undefined;
  onSortChange?: ((sort: SortState) => void) | undefined;
}

export function useGroupingSync<TData>({
  engine,
  derivedGroupBy,
  groupByProp,
  onGroupingChange,
  onSortChange,
}: UseGroupingSyncOptions<TData>): void {
  const { rowGroupingState, sortState, setGroupingColumns } = engine;
  const derivedGroupByKey = JSON.stringify(derivedGroupBy);

  const prevDerivedGroupByKeyRef = useRef(derivedGroupByKey);
  useEffect(() => {
    if (groupByProp) return;
    if (derivedGroupByKey === prevDerivedGroupByKeyRef.current) return;
    prevDerivedGroupByKeyRef.current = derivedGroupByKey;
    setGroupingColumns(derivedGroupBy);
  }, [derivedGroupBy, derivedGroupByKey, groupByProp, setGroupingColumns]);

  useEffect(() => {
    if (!groupByProp) return;
    if (JSON.stringify(groupByProp) === JSON.stringify(rowGroupingState.groupBy)) {
      return;
    }
    setGroupingColumns(groupByProp);
  }, [groupByProp, rowGroupingState.groupBy, setGroupingColumns]);

  const prevGroupByKeyRef = useRef(JSON.stringify(rowGroupingState.groupBy));
  useEffect(() => {
    const key = JSON.stringify(rowGroupingState.groupBy);
    if (key === prevGroupByKeyRef.current) return;
    prevGroupByKeyRef.current = key;
    onGroupingChange?.(rowGroupingState.groupBy);
  }, [onGroupingChange, rowGroupingState.groupBy]);

  const prevSortRef = useRef(sortState);
  useEffect(() => {
    if (
      prevSortRef.current.columnId !== sortState.columnId ||
      prevSortRef.current.direction !== sortState.direction
    ) {
      prevSortRef.current = sortState;
      onSortChange?.(sortState);
    }
  }, [sortState, onSortChange]);
}
