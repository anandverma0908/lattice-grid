import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import type { ResolvedColumn, VirtualRowWindow } from "../types";
import type { FocusedCell } from "./useGridKeyboard";
import {
  buildColumnOffsets,
  calcColWindow,
  computeVRows,
} from "./useVirtualizer";

function findFrozenColIndex(
  scrollableColumns: ResolvedColumn[],
  offsets: number[],
  freezeColId: string,
  bandScroll: number,
): number | null {
  if (bandScroll <= 0) return null;
  const idx = scrollableColumns.findIndex((c) => c.id === freezeColId);
  if (idx < 0) return null;
  return (offsets[idx] ?? 0) < bandScroll ? idx : null;
}

export interface UseGridScrollEngineOptions<TData> {
  rowHeight: number;
  totalHeaderHeight: number;
  visibleRowsLength: number;
  visibleColumns: ResolvedColumn<TData>[];
  scrollableColumns: ResolvedColumn<TData>[];
  pinnedLeftWidth: number;
  pinnedRightWidth: number;
  freezeColId?: string | undefined;
}

export function useGridScrollEngine<TData>({
  rowHeight,
  totalHeaderHeight,
  visibleRowsLength,
  visibleColumns,
  scrollableColumns,
  pinnedLeftWidth,
  pinnedRightWidth,
  freezeColId,
}: UseGridScrollEngineOptions<TData>) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const scrollLeftRef = useRef(0);
  const scrollTopRef = useRef(0);
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);
  const rafRef = useRef(0);

  const isScrollingRef = useRef(false);
  const scrollStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pinLeftBodyRef = useRef<HTMLDivElement | null>(null);
  const pinLeftWrapRef = useRef<HTMLDivElement>(null);
  const pinRightWrapRef = useRef<HTMLDivElement>(null);

  const offsets = useMemo(
    () => buildColumnOffsets(scrollableColumns),
    [scrollableColumns],
  );
  const colWidths = useMemo(
    () => scrollableColumns.map((c) => c.width),
    [scrollableColumns],
  );
  const totalScrollW = useMemo(
    () => colWidths.reduce((s, w) => s + w, 0),
    [colWidths],
  );

  const bodyWrapRef = useRef<HTMLDivElement>(null);
  const [bodyWrapH, setBodyWrapH] = useState(400);
  const [bodyWrapW, setBodyWrapW] = useState(800);
  useEffect(() => {
    const el = bodyWrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      if (!e) return;
      setBodyWrapH(e.contentRect.height);
      setBodyWrapW(e.contentRect.width);
    });
    ro.observe(el);
    if (el.clientHeight > 0) setBodyWrapH(el.clientHeight);
    if (el.clientWidth > 0) setBodyWrapW(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const scrollViewWidth = Math.max(
    0,
    bodyWrapW - pinnedLeftWidth - pinnedRightWidth,
  );

  const vRowsRef = useRef<VirtualRowWindow>({
    startIndex: 0,
    endIndex: -1,
    totalHeight: 0,
    offsetY: 0,
  });
  const recomputeVRows = useCallback(
    (st: number) => {
      vRowsRef.current = computeVRows(
        visibleRowsLength,
        rowHeight,
        st,
        Math.max(0, bodyWrapH - totalHeaderHeight),
      );
    },
    [visibleRowsLength, rowHeight, bodyWrapH, totalHeaderHeight],
  );

  const vColsRef = useRef({ startIndex: 0, endIndex: 0 });
  const recomputeVCols = useCallback(
    (rawScrollLeft: number) => {
      const bandScroll = Math.max(0, rawScrollLeft - pinnedLeftWidth);
      const vw = scrollViewWidth > 0 ? scrollViewWidth : 1400;
      vColsRef.current = calcColWindow(offsets, colWidths, bandScroll, vw);
    },
    [offsets, colWidths, scrollViewWidth, pinnedLeftWidth],
  );

  const frozenIdxRef = useRef<number | null>(null);
  const recomputeFrozen = useCallback(
    (rawScrollLeft: number) => {
      if (!freezeColId) {
        frozenIdxRef.current = null;
        return;
      }
      const bandScroll = Math.max(0, rawScrollLeft - pinnedLeftWidth);
      frozenIdxRef.current = findFrozenColIndex(
        scrollableColumns,
        offsets,
        freezeColId,
        bandScroll,
      );
    },
    [freezeColId, scrollableColumns, offsets, pinnedLeftWidth],
  );

  const frozenColDef = useMemo(
    () =>
      freezeColId
        ? (scrollableColumns.find((c) => c.id === freezeColId) ?? null)
        : null,
    [freezeColId, scrollableColumns],
  );

  const frozenColOffset = useMemo(() => {
    if (!frozenColDef) return 0;
    const idx = scrollableColumns.findIndex((c) => c.id === frozenColDef.id);
    return idx >= 0 ? (offsets[idx] ?? 0) : 0;
  }, [frozenColDef, scrollableColumns, offsets]);

  const handleScroll = useCallback(() => {
    const el = scrollAreaRef.current;
    if (!el) return;
    const st = el.scrollTop;
    const sl = el.scrollLeft;
    scrollTopRef.current = st;
    scrollLeftRef.current = sl;
    recomputeVRows(st);
    recomputeVCols(sl);
    recomputeFrozen(sl);
    const isFrozen = frozenIdxRef.current !== null;
    if (pinLeftBodyRef.current) {
      pinLeftBodyRef.current.style.visibility = isFrozen ? "visible" : "hidden";
      pinLeftBodyRef.current.style.pointerEvents = isFrozen ? "auto" : "none";
    }
    isScrollingRef.current = true;
    if (scrollStopTimerRef.current) clearTimeout(scrollStopTimerRef.current);
    scrollStopTimerRef.current = setTimeout(() => {
      isScrollingRef.current = false;
      forceUpdate();
    }, 150);
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(forceUpdate);
  }, [recomputeVRows, recomputeVCols, recomputeFrozen, forceUpdate]);

  useEffect(() => {
    recomputeVRows(scrollTopRef.current);
    recomputeVCols(scrollLeftRef.current);
    recomputeFrozen(scrollLeftRef.current);
    forceUpdate();
  }, [recomputeVRows, recomputeVCols, recomputeFrozen]);

  useEffect(() => {
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const el = scrollAreaRef.current;
      if (!el) return;
      el.scrollTop += e.deltaY;
      el.scrollLeft += e.deltaX;
    };
    const opts: AddEventListenerOptions = { passive: false };
    const left = pinLeftWrapRef.current;
    const right = pinRightWrapRef.current;
    left?.addEventListener("wheel", handler, opts);
    right?.addEventListener("wheel", handler, opts);
    return () => {
      left?.removeEventListener("wheel", handler, opts);
      right?.removeEventListener("wheel", handler, opts);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLayoutEffect(() => {
    if (!pinLeftBodyRef.current) return;
    const isFrozen = frozenIdxRef.current !== null;
    pinLeftBodyRef.current.style.visibility = isFrozen ? "visible" : "hidden";
    pinLeftBodyRef.current.style.pointerEvents = isFrozen ? "auto" : "none";
  });

  const vCols = vColsRef.current;
  const frozenIdx = frozenIdxRef.current;
  const frozenCol: ResolvedColumn<TData> | null =
    frozenIdx !== null ? (scrollableColumns[frozenIdx] ?? null) : null;
  const frozenWidth = frozenColDef?.width ?? 0;

  const vRows = vRowsRef.current;
  const isScrolling = isScrollingRef.current;

  const scrollToCell = useCallback(
    (cell: FocusedCell) => {
      const el = scrollAreaRef.current;
      if (!el) return;
      const nextTop = cell.rowIndex * rowHeight;
      const viewportH = Math.max(0, bodyWrapH - totalHeaderHeight);
      if (nextTop < el.scrollTop) {
        el.scrollTop = nextTop;
      } else if (nextTop + rowHeight > el.scrollTop + viewportH) {
        el.scrollTop = Math.max(0, nextTop + rowHeight - viewportH);
      }

      const col = visibleColumns[cell.colIndex];
      if (!col || col.pinned) return;
      const scIdx = scrollableColumns.findIndex((c) => c.id === col.id);
      if (scIdx < 0) return;
      const colLeft = pinnedLeftWidth + (offsets[scIdx] ?? 0);
      const colRight = colLeft + col.width;
      const viewportLeft = el.scrollLeft + pinnedLeftWidth;
      const viewportRight = el.scrollLeft + bodyWrapW - pinnedRightWidth;
      if (colLeft < viewportLeft) {
        el.scrollLeft = Math.max(0, colLeft - pinnedLeftWidth);
      } else if (colRight > viewportRight) {
        el.scrollLeft = Math.max(0, colRight - bodyWrapW + pinnedRightWidth);
      }
      handleScroll();
    },
    [
      bodyWrapH,
      bodyWrapW,
      handleScroll,
      offsets,
      pinnedLeftWidth,
      pinnedRightWidth,
      rowHeight,
      scrollableColumns,
      totalHeaderHeight,
      visibleColumns,
    ],
  );

  const scrollToColumn = useCallback(
    (colIndex: number) => {
      const el = scrollAreaRef.current;
      if (!el) return;
      const col = visibleColumns[colIndex];
      if (!col || col.pinned) return;
      const scIdx = scrollableColumns.findIndex((c) => c.id === col.id);
      if (scIdx < 0) return;
      const colLeft = pinnedLeftWidth + (offsets[scIdx] ?? 0);
      const colRight = colLeft + col.width;
      const viewportLeft = el.scrollLeft + pinnedLeftWidth;
      const viewportRight = el.scrollLeft + bodyWrapW - pinnedRightWidth;
      if (colLeft < viewportLeft) {
        el.scrollLeft = Math.max(0, colLeft - pinnedLeftWidth);
      } else if (colRight > viewportRight) {
        el.scrollLeft = Math.max(0, colRight - bodyWrapW + pinnedRightWidth);
      }
      handleScroll();
    },
    [
      bodyWrapW,
      handleScroll,
      offsets,
      pinnedLeftWidth,
      pinnedRightWidth,
      scrollableColumns,
      visibleColumns,
    ],
  );

  return {
    scrollAreaRef,
    bodyWrapRef,
    pinLeftBodyRef,
    pinLeftWrapRef,
    pinRightWrapRef,
    scrollLeftRef,
    offsets,
    colWidths,
    totalScrollW,
    bodyWrapH,
    bodyWrapW,
    vRows,
    vCols,
    isScrolling,
    frozenIdx,
    frozenCol,
    frozenColDef,
    frozenColOffset,
    frozenWidth,
    handleScroll,
    scrollToCell,
    scrollToColumn,
  };
}
