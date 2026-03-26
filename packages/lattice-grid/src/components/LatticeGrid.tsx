// =============================================================================
//  @lattice-grid-lib/core — LatticeGrid  (v2.0)
//
//  New customisation surface (all optional, fully backwards-compatible):
//
//  features   — GridFeatures  — toggle sort/resize/reorder/hide/pin/toolbar/footer/rowSelection
//  icons      — GridIcons     — swap any icon (sortAsc, sortDesc, hideColumn, columnsPanel, …)
//  classNames — GridClassNames — CSS classes on every region
//  styles     — GridStyles    — inline CSSProperties on every region
//  slots      — GridSlots     — replace entire UI sections (toolbar, footer, columnManager, …)
//  theme      — unchanged token system
// =============================================================================

import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useGridEngine } from "../core/useGridEngine";
import {
  computeVRows,
  calcColWindow,
  buildColumnOffsets,
} from "../hooks/useVirtualizer";
import { useColumnResize } from "../hooks/useColumnResize";
import { useColumnDrag } from "../hooks/useColumnDrag";
import { GridContextProvider } from "../core/GridContext";
import { resolveTokens, tokensToStyle } from "../core/themes";
import { HeaderCell } from "./HeaderCell";
import { DataCell, GroupHeaderCell, EmptyState } from "./Cells";
import { ColumnManager } from "./ColumnManager";
import { Toolbar, ToolbarButton, Footer, ColsIcon } from "./Toolbar";
import type {
  LatticeGridProps,
  ResolvedColumn,
  GridFeatures,
  GridIcons,
  GridStyles,
  GridClassNames,
  VirtualRowWindow,
} from "../types";

// ─────────────────────────────────────────────────────────────────────────────
//  DEFAULTS
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_HEIGHT = 480;
const DEFAULT_ROW_HEIGHT = 36;
const DEFAULT_HDR_HEIGHT = 38;
const DEFAULT_GRP_HEIGHT = 28;

const DEFAULT_FEATURES: Required<GridFeatures> = {
  sort: true,
  resize: true,
  reorder: true,
  columnHide: true,
  columnPin: true,
  alternateRows: true,
  toolbar: true,
  footer: true,
  rowSelection: true,
};

const EMPTY_ICONS: GridIcons = {};
const EMPTY_STYLES: GridStyles = {};
const EMPTY_CLASSNAMES: GridClassNames = {};

// ─────────────────────────────────────────────────────────────────────────────
//  FROZEN COLUMN FINDER
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
//  COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

function LatticeGridInner<TData = unknown>({
  columns,
  data,
  getRowId,
  height,
  maxHeight = 600,
  rowHeight = DEFAULT_ROW_HEIGHT,
  headerHeight = DEFAULT_HDR_HEIGHT,
  groupHeaderHeight = DEFAULT_GRP_HEIGHT,
  theme = "light",
  features: featuresProp,
  icons: iconsProp,
  classNames: classNamesProp,
  styles: stylesProp,
  slots = {},
  freezeColId,
  loading = false,
  onRowClick,
  onSortChange,
  onColumnStateChange,
  onColumnResize,
  onColumnReorder,
  sortMode = "client",
  ariaLabel = "Data grid",
  className,
  style,
}: LatticeGridProps<TData> & { maxHeight?: number }) {
  // ── Resolved customisation objects ───────────────────────────────────────────
  const features: Required<GridFeatures> = useMemo(
    () => ({ ...DEFAULT_FEATURES, ...featuresProp }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(featuresProp)],
  );
  const icons = iconsProp ?? EMPTY_ICONS;
  const styles = stylesProp ?? EMPTY_STYLES;
  const classNames = classNamesProp ?? EMPTY_CLASSNAMES;

  // ── Engine ───────────────────────────────────────────────────────────────────
  const engine = useGridEngine<TData>(columns);
  const {
    pinnedLeftColumns,
    pinnedRightColumns,
    scrollableColumns,
    pinnedLeftWidth,
    pinnedRightWidth,
    sortState,
    groups,
    hasGroups,
    visibleColumns,
    orderedColumns,
    resizeColumn,
    moveColumnBefore,
    moveColumnToEnd,
  } = engine;

  // ── Sort notification ────────────────────────────────────────────────────────
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

  // ── Sorted data (fix: don't depend on orderedColumns reference) ──────────────
  const colForSortRef = useRef<ResolvedColumn<TData> | null>(null);
  useEffect(() => {
    colForSortRef.current = sortState.columnId
      ? (engine.orderedColumns.find((c) => c.id === sortState.columnId) ?? null)
      : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortState.columnId]);

  const sortedData = useMemo((): TData[] => {
    // FIX1: server mode — render data as-is, consumer handles sorting
    if (sortMode === "server") return data;
    const col = colForSortRef.current;
    if (!sortState.columnId || !col) return data;
    const get =
      col.accessor ??
      ((r: TData) => (r as Record<string, unknown>)[col.field ?? col.id]);
    return [...data].sort((a, b) => {
      const va = get(a),
        vb = get(b);
      if (va == null) return 1;
      if (vb == null) return -1;
      const cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return sortState.direction === "asc" ? cmp : -cmp;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, sortMode, sortState.columnId, sortState.direction]);

  // ── Column state change notification ────────────────────────────────────────
  // FIX1: Fires whenever columns are hidden/shown/pinned/resized/reordered.
  // Consumer saves this to their API; restore by passing initialColumnState.
  const prevColStateKeyRef = useRef("");
  useEffect(() => {
    if (!onColumnStateChange) return;
    const snapshot = engine.orderedColumns.map((col, i) => ({
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
  }, [engine.orderedColumns, onColumnStateChange]);

  // ── Row selection ────────────────────────────────────────────────────────────
  const [selectedRowKey, setSelectedRowKey] = useState<string | null>(null);

  const handleRowClick = useCallback(
    (row: TData, rowIndex: number) => {
      if (features.rowSelection) {
        const key = getRowId
          ? String(getRowId(row, rowIndex))
          : String(rowIndex);
        setSelectedRowKey((prev) => (prev === key ? null : key));
      }
      onRowClick?.(row, rowIndex);
    },
    [features.rowSelection, getRowId, onRowClick],
  );

  const isRowSelected = useCallback(
    (row: TData, rowIndex: number): boolean => {
      if (!selectedRowKey || !features.rowSelection) return false;
      const key = getRowId ? String(getRowId(row, rowIndex)) : String(rowIndex);
      return key === selectedRowKey;
    },
    [selectedRowKey, features.rowSelection, getRowId],
  );

  // ── Scroll ───────────────────────────────────────────────────────────────────
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const scrollLeftRef = useRef(0);
  const scrollTopRef  = useRef(0);
  // Single render-trigger — replaces the two setState calls (scrollTop/scrollLeft).
  // All scroll-driven geometry is computed synchronously into refs before this fires.
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);
  // RAF handle — ensures we trigger at most one React render per animation frame
  // even when the browser fires many scroll events per frame (high-refresh displays).
  const rafRef = useRef(0);
  // Direct DOM ref for the frozen-column body only — updated synchronously in
  // scroll handler. Regular pinned body rows live inside the scroll container
  // (sticky positioning) and require no JS sync at all.
  const pinLeftBodyRef = useRef<HTMLDivElement | null>(null);
  // Wrapper refs for non-passive wheel listener (header overlay only)
  const pinLeftWrapRef = useRef<HTMLDivElement>(null);
  const pinRightWrapRef = useRef<HTMLDivElement>(null);

  // ── Column geometry ───────────────────────────────────────────────────────────
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

  // ── Body-wrap size ────────────────────────────────────────────────────────────
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
    setBodyWrapH(el.clientHeight);
    setBodyWrapW(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  // ── Geometry ─────────────────────────────────────────────────────────────────
  const totalHeaderHeight = hasGroups
    ? groupHeaderHeight + headerHeight
    : headerHeight;

  // When height is not provided, compute content height and cap at maxHeight.
  // Content height = header + all rows + toolbar + footer (estimated).
  const toolbarH = features.toolbar ? 36 : 0;
  const footerH = features.footer ? 29 : 0;
  const contentH =
    totalHeaderHeight + sortedData.length * rowHeight + toolbarH + footerH;
  const effectiveHeight = height ?? Math.min(contentH, maxHeight);
  const scrollViewWidth = Math.max(
    0,
    bodyWrapW - pinnedLeftWidth - pinnedRightWidth,
  );
  const canvasW = pinnedLeftWidth + totalScrollW + pinnedRightWidth;

  // ── Row window (synchronous ref — same strategy as vColsRef) ────────────────
  // Computed synchronously in every scroll event so the render that follows
  // always uses the CURRENT scroll position, not a stale state value.
  const vRowsRef = useRef<VirtualRowWindow>({
    startIndex: 0,
    endIndex:   -1,
    totalHeight: 0,
    offsetY:    0,
  });
  const recomputeVRows = useCallback(
    (st: number) => {
      vRowsRef.current = computeVRows(
        sortedData.length,
        rowHeight,
        st,
        Math.max(0, bodyWrapH - totalHeaderHeight),
      );
    },
    [sortedData.length, rowHeight, bodyWrapH, totalHeaderHeight],
  );

  // ── Column window (synchronous ref) ──────────────────────────────────────────
  const vColsRef = useRef({ startIndex: 0, endIndex: 0 });
  const recomputeVCols = useCallback(
    (rawScrollLeft: number) => {
      // FIX4: bandScroll = how far scrolled INTO the scrollable band.
      // Clamp to 0 — can't be negative (pinned band doesn't scroll).
      const bandScroll = Math.max(0, rawScrollLeft - pinnedLeftWidth);
      // If bodyWrapW hasn't measured yet, use a large fallback so all columns
      // render on first paint (virtualisation corrects itself after measurement).
      const vw = scrollViewWidth > 0 ? scrollViewWidth : 1400;
      vColsRef.current = calcColWindow(offsets, colWidths, bandScroll, vw);
    },
    [offsets, colWidths, scrollViewWidth, pinnedLeftWidth],
  );

  // ── Frozen column ─────────────────────────────────────────────────────────────
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

  // Always resolve the frozen column definition regardless of scroll state.
  // The body is mounted permanently (visibility toggled by handleScroll) so the
  // DOM ref is valid before the first freeze transition.
  const frozenColDef = useMemo(
    () =>
      freezeColId
        ? (scrollableColumns.find((c) => c.id === freezeColId) ?? null)
        : null,
    [freezeColId, scrollableColumns],
  );

  // Natural horizontal offset of the frozen column inside the scrollable band.
  // Required so the sticky body starts at the column's real canvas position
  // (sticky only "locks" once the column would scroll past pinnedLeftWidth).
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
    scrollTopRef.current  = st;
    scrollLeftRef.current = sl;
    // All geometry computed synchronously — refs are up-to-date before React renders.
    recomputeVRows(st);
    recomputeVCols(sl);
    recomputeFrozen(sl);
    // Toggle frozen-column body visibility directly — same frame as scroll
    // event, zero React lag. The body lives inside the scroll container so
    // vertical scroll is handled natively; no translateY needed.
    const isFrozen = frozenIdxRef.current !== null;
    if (pinLeftBodyRef.current) {
      pinLeftBodyRef.current.style.visibility = isFrozen ? "visible" : "hidden";
      pinLeftBodyRef.current.style.pointerEvents = isFrozen ? "auto" : "none";
    }
    // One RAF-throttled render per animation frame — prevents scheduling N renders
    // when the browser fires N scroll events in a single 16ms frame.
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(forceUpdate);
  }, [recomputeVRows, recomputeVCols, recomputeFrozen, forceUpdate]);

  useEffect(() => {
    recomputeVRows(scrollTopRef.current);
    recomputeVCols(scrollLeftRef.current);
    recomputeFrozen(scrollLeftRef.current);
  }, [recomputeVRows, recomputeVCols, recomputeFrozen]);

  // Non-passive wheel listener on pinned layer wrappers.
  // React attaches all wheel listeners as passive — calling e.preventDefault()
  // in a React onWheel handler does nothing. Without preventDefault the browser
  // also scrolls the pinned layer's own stacking context, causing the visible
  // content to jump twice (double-scroll). A native non-passive listener fixes it.
  useEffect(() => {
    const handler = (e: WheelEvent) => {
      e.preventDefault(); // block native scroll on the pinned layer
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

  // Re-sync frozen body visibility after every React commit (e.g. if React
  // recreates the DOM node after a key change, sort, or data update).
  // useLayoutEffect fires before the browser paints so there is never a frame
  // where the frozen column is in the wrong visible/hidden state.
  React.useLayoutEffect(() => {
    if (!pinLeftBodyRef.current) return;
    const isFrozen = frozenIdxRef.current !== null;
    pinLeftBodyRef.current.style.visibility = isFrozen ? "visible" : "hidden";
    pinLeftBodyRef.current.style.pointerEvents = isFrozen ? "auto" : "none";
  });
  // No dependency array — runs after EVERY commit. This is intentional:
  // React may have re-created the DOM node (e.g. key change) so we always
  // need to re-apply.

  const vCols = vColsRef.current;
  const frozenIdx = frozenIdxRef.current;
  const frozenCol: ResolvedColumn<TData> | null =
    frozenIdx !== null ? (scrollableColumns[frozenIdx] ?? null) : null;
  // frozenWidth uses frozenColDef (always-set) so the sticky body is correctly
  // sized even when the column is not yet in frozen state.
  const frozenWidth = frozenColDef?.width ?? 0;

  // ── Row virtualisation ────────────────────────────────────────────────────────
  // vRowsRef is always current (updated synchronously in handleScroll and the
  // sync effect above). Reading the ref here is safe — it holds the latest window
  // for the scroll position that triggered this render.
  const vRows = vRowsRef.current;

  // ── Ungrouped scrollable → rowspan=2 ─────────────────────────────────────────
  const ungroupedIds = useMemo(() => {
    const inGroup = new Set(groups.flatMap((g) => g.children.map((c) => c.id)));
    return new Set(
      scrollableColumns.filter((c) => !inGroup.has(c.id)).map((c) => c.id),
    );
  }, [groups, scrollableColumns]);

  // ── Hooks ─────────────────────────────────────────────────────────────────────
  const { startResize } = useColumnResize({
    onResize: (id, delta) => resizeColumn(id, delta),
    onResizeEnd: (id, w) => onColumnResize?.(id, w),
    getCurrentWidth: (id) =>
      engine.orderedColumns.find((c) => c.id === id)?.width ?? 120,
  });

  // Mathematical viewport bounds — works for ALL columns including those outside
  // the virtual render window. Called inside pointer event handlers (not render).
  const getColumnViewportBounds = useCallback(
    (columnId: string): { left: number; right: number } | null => {
      const bodyRect = bodyWrapRef.current?.getBoundingClientRect();
      if (!bodyRect) return null;
      const sl = scrollLeftRef.current;

      // Pinned left
      let acc = 0;
      for (const col of pinnedLeftColumns) {
        if (col.id === columnId)
          return { left: bodyRect.left + acc, right: bodyRect.left + acc + col.width };
        acc += col.width;
      }

      // Scrollable
      const scIdx = scrollableColumns.findIndex((c) => c.id === columnId);
      if (scIdx !== -1) {
        const col = scrollableColumns[scIdx]!;
        const bandScroll = Math.max(0, sl - pinnedLeftWidth);
        const colLeft = pinnedLeftWidth + (offsets[scIdx] ?? 0) - bandScroll;
        return { left: bodyRect.left + colLeft, right: bodyRect.left + colLeft + col.width };
      }

      // Pinned right
      acc = 0;
      for (const col of pinnedRightColumns) {
        if (col.id === columnId) {
          const rightStart = bodyRect.right - pinnedRightWidth;
          return { left: rightStart + acc, right: rightStart + acc + col.width };
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
      onColumnReorder?.(engine.orderedColumns.map((c) => c.id));
    },
    onMoveColumnToEnd: (src) => {
      moveColumnToEnd(src);
      onColumnReorder?.(engine.orderedColumns.map((c) => c.id));
    },
    columns: visibleColumns.map((c) => ({
      id: c.id,
      groupId: c.groupId,
      draggable: c.draggable,
      pinned: c.pinned,
    })),
    getColumnViewportBounds,
  });

  const [showColMgr, setShowColMgr] = useState(false);

  // ── Theme ─────────────────────────────────────────────────────────────────────
  const tokens = useMemo(() => resolveTokens(theme), [theme]);
  const tokenStyle = useMemo(() => tokensToStyle(tokens), [tokens]);

  // ── Context ───────────────────────────────────────────────────────────────────
  const contextValue = useMemo(
    () => ({
      engine,
      dragHandlers,
      startResize,
      features,
      icons,
      styles,
      classNames,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [engine, dragHandlers, startResize, features, icons, styles, classNames],
  );

  // ═══════════════════════════════════════════════════════════════════════════
  //  ROW BACKGROUND HELPER
  // ═══════════════════════════════════════════════════════════════════════════

  const rowBg = useCallback(
    (row: TData, ri: number) => {
      if (isRowSelected(row, ri)) return "var(--vg-bg-row-selected)";
      return features.alternateRows && ri % 2 === 1
        ? "var(--vg-bg-row-alt)"
        : "var(--vg-bg)";
    },
    [isRowSelected, features.alternateRows],
  );

  const pinnedRowBg = useCallback(
    (row: TData, ri: number) => {
      if (isRowSelected(row, ri)) return "var(--vg-bg-row-selected)";
      if (features.alternateRows && ri % 2 === 1) return "var(--vg-bg-row-alt)";
      return "var(--vg-bg-pinned)";
    },
    [isRowSelected, features.alternateRows],
  );

  // ═══════════════════════════════════════════════════════════════════════════
  //  SCROLLABLE HEADER
  // ═══════════════════════════════════════════════════════════════════════════

  const renderScrollableGroupRow = (): React.ReactNode => {
    const cells: React.ReactNode[] = [];
    const rendered = new Set<string>();
    for (let ci = vCols.startIndex; ci <= vCols.endIndex; ci++) {
      const col = scrollableColumns[ci];
      if (!col) continue;
      const left = pinnedLeftWidth + (offsets[ci] ?? 0);
      if (ungroupedIds.has(col.id)) {
        cells.push(
          <HeaderCell
            key={`hspan-${col.id}`}
            column={col}
            style={{
              position: "absolute",
              left,
              top: 0,
              width: col.width,
              height: groupHeaderHeight + headerHeight,
              zIndex: 1,
              background: "var(--vg-bg-header)",
            }}
          />,
        );
        continue;
      }
      const grp = groups.find((g) => g.children.some((c) => c.id === col.id));
      if (!grp || rendered.has(grp.id)) continue;
      rendered.add(grp.id);
      const grpLeaves = scrollableColumns.filter((c) =>
        grp.children.some((gc) => gc.id === c.id),
      );
      const grpWidth = grpLeaves.reduce((s, c) => s + c.width, 0);
      const firstIdx = scrollableColumns.findIndex(
        (c) => c.id === grpLeaves[0]?.id,
      );
      cells.push(
        <GroupHeaderCell
          key={`grp-${grp.id}`}
          group={grp}
          left={pinnedLeftWidth + (offsets[firstIdx] ?? 0)}
          width={grpWidth}
          height={groupHeaderHeight}
        />,
      );
    }
    return cells;
  };

  const renderScrollableLeafRow = (): React.ReactNode => {
    const cells: React.ReactNode[] = [];
    // Track which group we last saw to detect the first leaf in each group
    let lastGroupId: string | null = undefined as unknown as string;
    const leafIndices: number[] = [];
    for (let ci = vCols.startIndex; ci <= vCols.endIndex; ci++) {
      const col = scrollableColumns[ci];
      if (!col || ungroupedIds.has(col.id)) continue;
      leafIndices.push(ci);
    }
    leafIndices.forEach((ci, pos) => {
      const col = scrollableColumns[ci];
      if (!col) return;
      // isFirst within its group = first rendered leaf of that groupId
      const isFirstInGroup = col.groupId !== lastGroupId;
      lastGroupId = col.groupId;
      const isLast = pos === leafIndices.length - 1;
      cells.push(
        <HeaderCell
          key={`lh-${col.id}`}
          column={col}
          isFirst={isFirstInGroup}
          isLast={isLast}
          style={{
            position: "absolute",
            left: pinnedLeftWidth + (offsets[ci] ?? 0),
            top: 0,
            width: col.width,
            height: headerHeight,
            zIndex: 1,
          }}
        />,
      );
    });
    return cells;
  };

  const renderScrollableFlatHeader = (): React.ReactNode => {
    const cells: React.ReactNode[] = [];
    const indices: number[] = [];
    for (let ci = vCols.startIndex; ci <= vCols.endIndex; ci++) {
      if (scrollableColumns[ci]) indices.push(ci);
    }
    indices.forEach((ci, pos) => {
      const col = scrollableColumns[ci];
      if (!col) return;
      cells.push(
        <HeaderCell
          key={`fh-${col.id}`}
          column={col}
          isFirst={pos === 0}
          isLast={pos === indices.length - 1}
          style={{
            position: "absolute",
            left: pinnedLeftWidth + (offsets[ci] ?? 0),
            top: 0,
            width: col.width,
            height: headerHeight,
            zIndex: 1,
          }}
        />,
      );
    });
    return cells;
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  SCROLLABLE DATA ROW
  // ═══════════════════════════════════════════════════════════════════════════

  const renderScrollableRow = (rowIndex: number): React.ReactNode => {
    const row = sortedData[rowIndex];
    if (!row) return null;
    const top = totalHeaderHeight + rowIndex * rowHeight;
    const bg = rowBg(row, rowIndex);
    const pinnedBg = pinnedRowBg(row, rowIndex);
    const isSel = isRowSelected(row, rowIndex);
    const rowKey = getRowId
      ? String(getRowId(row, rowIndex))
      : String(rowIndex);

    // ── Scrollable cells (absolutely positioned inside the row) ──────────────
    const cells: React.ReactNode[] = [];
    for (let ci = vCols.startIndex; ci <= vCols.endIndex; ci++) {
      const col = scrollableColumns[ci];
      if (!col) continue;
      cells.push(
        <DataCell
          key={`ds-${col.id}`}
          column={col}
          row={row}
          style={{
            position: "absolute",
            left: pinnedLeftWidth + (offsets[ci] ?? 0),
            top: 0,
            width: col.width,
            height: rowHeight,
            background: bg,
          }}
        />,
      );
    }

    // ── Left sticky pinned cells ─────────────────────────────────────────────
    // position:sticky on a child of an absolutely-positioned row finds the
    // nearest overflow ancestor (the scroll area) and sticks there — so these
    // cells stay at left:0 of the viewport while the canvas scrolls horizontally.
    // Vertical scroll is native (no JS transform needed), which eliminates the
    // 1-frame lag that JS-driven translateY causes on compositor-thread scrolls.
    let leftPinAcc = 0;
    const leftPinCells =
      pinnedLeftColumns.length > 0
        ? pinnedLeftColumns.map((col) => {
            const colLeft = leftPinAcc;
            leftPinAcc += col.width;
            return (
              <DataCell
                key={`ps-l-${col.id}`}
                column={col}
                row={row}
                pinned
                style={{
                  position: "absolute",
                  left: colLeft,
                  top: 0,
                  width: col.width,
                  height: rowHeight,
                  background: pinnedBg,
                }}
              />
            );
          })
        : null;

    // ── Right sticky pinned cells ────────────────────────────────────────────
    let rightPinAcc = 0;
    const rightPinCells =
      pinnedRightColumns.length > 0
        ? pinnedRightColumns.map((col) => {
            const colLeft = rightPinAcc;
            rightPinAcc += col.width;
            return (
              <DataCell
                key={`ps-r-${col.id}`}
                column={col}
                row={row}
                pinned
                style={{
                  position: "absolute",
                  left: colLeft,
                  top: 0,
                  width: col.width,
                  height: rowHeight,
                  background: pinnedBg,
                }}
              />
            );
          })
        : null;

    return (
      <div
        key={rowKey}
        role="row"
        aria-rowindex={rowIndex + 1}
        aria-selected={isSel}
        onClick={() => handleRowClick(row, rowIndex)}
        className={
          [classNames.row, isSel ? classNames.rowSelected : undefined]
            .filter(Boolean)
            .join(" ") || undefined
        }
        style={{
          position: "absolute",
          top,
          left: 0,
          width: canvasW,
          height: rowHeight,
          background: bg,
          cursor: "pointer",
          display: "flex",
          ...styles.row,
          ...(isSel ? styles.rowSelected : {}),
        }}
        onMouseEnter={(e) => {
          if (!isSel) {
            const el = e.currentTarget as HTMLElement;
            el.style.background = "var(--vg-bg-row-hover)";
            // Update sticky pinned wrappers too
            (
              el.querySelectorAll<HTMLElement>(
                "[data-pinned-sticky]",
              )
            ).forEach((w) => {
              w.style.background = "var(--vg-bg-row-hover)";
            });
          }
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.background = bg;
          (
            el.querySelectorAll<HTMLElement>("[data-pinned-sticky]")
          ).forEach((w) => {
            w.style.background = pinnedBg;
          });
        }}
      >
        {leftPinCells && (
          <div
            data-pinned-sticky="left"
            style={{
              position: "sticky",
              left: 0,
              width: pinnedLeftWidth,
              height: rowHeight,
              flexShrink: 0,
              zIndex: 5,
              background: pinnedBg,
              overflow: "hidden",
            }}
          >
            {leftPinCells}
          </div>
        )}
        {rightPinCells && <div style={{ flex: 1 }} />}
        {rightPinCells && (
          <div
            data-pinned-sticky="right"
            style={{
              position: "sticky",
              right: 0,
              width: pinnedRightWidth,
              height: rowHeight,
              flexShrink: 0,
              zIndex: 5,
              background: pinnedBg,
              overflow: "hidden",
            }}
          >
            {rightPinCells}
          </div>
        )}
        {cells}
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  FROZEN COLUMN BODY ROWS
  //  Rendered inside the scroll container (not the overlay) so vertical scroll
  //  is handled natively — identical to how pinned-sticky rows work.
  // ═══════════════════════════════════════════════════════════════════════════

  const renderFrozenBodyRows = (): React.ReactNode => {
    if (!frozenColDef) return null;
    const rows: React.ReactNode[] = [];
    for (let ri = vRows.startIndex; ri <= vRows.endIndex; ri++) {
      const row = sortedData[ri];
      if (!row) continue;
      const rowKey = getRowId ? String(getRowId(row, ri)) : String(ri);
      const isSel = isRowSelected(row, ri);
      const frozenBg = isSel
        ? "var(--vg-bg-row-selected)"
        : "var(--vg-bg-frozen, var(--vg-bg-row-alt))";
      rows.push(
        <div
          key={rowKey}
          onClick={() => handleRowClick(row, ri)}
          className={
            [classNames.row, isSel ? classNames.rowSelected : undefined]
              .filter(Boolean)
              .join(" ") || undefined
          }
          style={{
            position: "absolute",
            left: 0,
            top: ri * rowHeight,
            width: frozenWidth,
            height: rowHeight,
            background: frozenBg,
            cursor: "pointer",
            ...styles.row,
            ...(isSel ? styles.rowSelected : {}),
          }}
          onMouseEnter={(e) => {
            if (!isSel)
              (e.currentTarget as HTMLElement).style.background =
                "var(--vg-bg-row-hover)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = frozenBg;
          }}
        >
          <DataCell
            column={frozenColDef}
            row={row}
            pinned
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: frozenWidth,
              height: rowHeight,
              background: frozenBg,
              zIndex: 2,
            }}
          />
        </div>,
      );
    }
    return rows;
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  PINNED COLUMN OVERLAY
  // ═══════════════════════════════════════════════════════════════════════════

  const renderPinnedLayer = (side: "left" | "right"): React.ReactNode => {
    const isLeft = side === "left";
    const cols = isLeft ? pinnedLeftColumns : pinnedRightColumns;
    const baseWidth = isLeft ? pinnedLeftWidth : pinnedRightWidth;
    const hasFrozen = isLeft && frozenCol !== null;
    const layerWidth = hasFrozen ? baseWidth + frozenWidth : baseWidth;
    if (!cols.length && !hasFrozen) return null;

    const colLefts: number[] = [];
    let acc = 0;
    for (const col of cols) {
      colLefts.push(acc);
      acc += col.width;
    }
    const frozenSlotLeft = acc;

    // Header cells
    const headerCells: React.ReactNode[] = [];
    if (hasGroups) {
      const renderedGroupIds = new Set<string>();

      cols.forEach((col, i) => {
        if (!col.groupId) {
          // Ungrouped pinned column: span both header rows, use HeaderCell (supports renderHeader)
          headerCells.push(
            <HeaderCell
              key={`ph-span-${col.id}`}
              column={col}
              isFirst={i === 0}
              isLast={i === cols.length - 1}
              style={{
                position: "absolute",
                left: colLefts[i],
                top: 0,
                width: col.width,
                height: groupHeaderHeight + headerHeight,
                zIndex: 2,
                background: "var(--vg-bg-header)",
              }}
            />,
          );
        } else {
          // Group header cell (rendered once per group)
          if (!renderedGroupIds.has(col.groupId)) {
            renderedGroupIds.add(col.groupId);
            const grp = groups.find((g) => g.id === col.groupId);
            if (grp) {
              const grpCols = cols.filter((c) => c.groupId === col.groupId);
              const grpWidth = grpCols.reduce((s, c) => s + c.width, 0);
              headerCells.push(
                <GroupHeaderCell
                  key={`pgh-${grp.id}`}
                  group={grp}
                  left={colLefts[i] ?? 0}
                  width={grpWidth}
                  height={groupHeaderHeight}
                />,
              );
            }
          }
          // Leaf header cell (one per column) — uses HeaderCell so renderHeader is applied
          headerCells.push(
            <HeaderCell
              key={`ph-leaf-${col.id}`}
              column={col}
              isFirst={i === 0 || cols[i - 1]?.groupId !== col.groupId}
              isLast={i === cols.length - 1 || cols[i + 1]?.groupId !== col.groupId}
              style={{
                position: "absolute",
                left: colLefts[i],
                top: groupHeaderHeight,
                width: col.width,
                height: headerHeight,
                zIndex: 2,
                background: "var(--vg-bg-header)",
              }}
            />,
          );
        }
      });
      if (hasFrozen && frozenCol) {
        const fjc =
          frozenCol.align === "center"
            ? "center"
            : frozenCol.align === "right"
              ? "flex-end"
              : "flex-start";
        headerCells.push(
          <div
            key={`ph-frozen-${frozenCol.id}`}
            style={{
              position: "absolute",
              left: frozenSlotLeft,
              top: 0,
              width: frozenWidth,
              height: groupHeaderHeight + headerHeight,
              background: "var(--vg-bg-frozen, var(--vg-bg-group))",
              borderRight: "1px solid var(--vg-border-strong)",
              borderBottom: "1px solid var(--vg-border-strong)",
              zIndex: 2,
              boxSizing: "border-box",
              display: "flex",
              alignItems: "center",
              justifyContent: fjc,
              padding: "0 10px",
              fontWeight: 700,
              fontSize: "calc(var(--vg-font-size) - 0.5px)",
              color: "var(--vg-text-group)",
              overflow: "hidden",
              whiteSpace: "nowrap",
              ...styles.headerCell,
            }}
          >
            {frozenCol.label}
          </div>,
        );
      }
    } else {
      cols.forEach((col, i) => {
        headerCells.push(
          <HeaderCell
            key={`ph-${col.id}`}
            column={col}
            isFirst={i === 0}
            isLast={i === cols.length - 1}
            style={{
              position: "absolute",
              left: colLefts[i],
              top: 0,
              width: col.width,
              height: headerHeight,
              zIndex: 2,
              background: "var(--vg-bg-header)",
            }}
          />,
        );
      });
      if (hasFrozen && frozenCol) {
        headerCells.push(
          <HeaderCell
            key={`ph-frozen-${frozenCol.id}`}
            column={frozenCol}
            style={{
              position: "absolute",
              left: frozenSlotLeft,
              top: 0,
              width: frozenWidth,
              height: headerHeight,
              zIndex: 2,
              background: "var(--vg-bg-frozen, var(--vg-accent-bg))",
            }}
          />,
        );
      }
    }

    return (
      <div
        key={`layer-${side}`}
        style={{
          position: "absolute",
          [side]: 0,
          top: 0,
          width: layerWidth,
          height: "100%",
          zIndex: 20,
          pointerEvents: "none",
        }}
      >
        {/* Header wrapper — height-capped so wheel events on the body area
            reach the scroll container directly (no double-scroll). */}
        <div
          ref={isLeft ? pinLeftWrapRef : pinRightWrapRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: layerWidth,
            height: totalHeaderHeight,
            pointerEvents: "auto",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: layerWidth,
              height: totalHeaderHeight,
              background: "var(--vg-bg-header)",
              borderBottom: "1px solid var(--vg-border-strong)",
              zIndex: 10,
              overflow: "hidden",
            }}
          >
            {headerCells}
          </div>
        </div>

        {/* Scroll shadow */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            [isLeft ? "right" : "left"]: -8,
            top: 0,
            width: 8,
            height: "100%",
            pointerEvents: "none",
            zIndex: 15,
            background: isLeft
              ? "linear-gradient(to right, rgba(0,0,0,0.08), transparent)"
              : "linear-gradient(to left, rgba(0,0,0,0.08), transparent)",
          }}
        />
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  TOOLBAR CONTENT
  // ═══════════════════════════════════════════════════════════════════════════

  const defaultToolbarLeft = (
    <span
      style={{ fontSize: 12, color: "var(--vg-text-dim)", fontWeight: 500 }}
    >
      {sortedData.length.toLocaleString()} rows
      {selectedRowKey && (
        <span
          style={{ marginLeft: 8, color: "var(--vg-accent)", fontWeight: 600 }}
        >
          · 1 selected
        </span>
      )}
    </span>
  );

  // Column manager — use slot if provided, else built-in
  const colManagerNode = showColMgr ? (
    slots.columnManager ? (
      slots.columnManager({ engine, onClose: () => setShowColMgr(false) })
    ) : (
      <ColumnManager onClose={() => setShowColMgr(false)} />
    )
  ) : null;

  const colsButtonIcon = icons.columnsPanel ?? <ColsIcon />;

  // ═══════════════════════════════════════════════════════════════════════════
  //  FOOTER CONTENT
  // ═══════════════════════════════════════════════════════════════════════════

  const footerProps = {
    startRow: vRows.startIndex + 1,
    endRow: Math.min(vRows.endIndex + 1, sortedData.length),
    totalRows: sortedData.length,
    visibleCols: visibleColumns.length,
    totalCols: orderedColumns.length,
  };

  const spacerHeight = totalHeaderHeight + sortedData.length * rowHeight;

  // ═══════════════════════════════════════════════════════════════════════════
  //  JSX
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <GridContextProvider value={contextValue}>
      <div
        role="grid"
        aria-label={ariaLabel}
        aria-rowcount={sortedData.length}
        aria-colcount={visibleColumns.length}
        className={
          [classNames.root, className].filter(Boolean).join(" ") || undefined
        }
        style={{
          ...(tokenStyle as CSSProperties),
          fontFamily: "var(--vg-font)",
          fontSize: "var(--vg-font-size)",
          lineHeight: "var(--vg-line-height)",
          background: "var(--vg-bg)",
          border: "1px solid var(--vg-border-strong)",
          borderRadius: "var(--vg-radius)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          height: effectiveHeight,
          position: "relative",
          ...styles.root,
          ...style,
        }}
      >
        {/* TOOLBAR */}
        {features.toolbar &&
          (slots.toolbar ? (
            slots.toolbar(engine)
          ) : (
            <Toolbar
              left={slots.toolbarLeft ?? defaultToolbarLeft}
              right={slots.toolbarRight}
              colManagerSlot={
                <>
                  <ToolbarButton
                    onClick={() => setShowColMgr((v) => !v)}
                    active={showColMgr}
                    icon={colsButtonIcon}
                    aria-label="Manage columns"
                  >
                    Columns
                  </ToolbarButton>
                  {colManagerNode}
                </>
              }
            />
          ))}

        {/* BODY WRAP */}
        <div
          ref={bodyWrapRef}
          style={{ position: "relative", flex: 1, overflow: "hidden" }}
        >
          {sortedData.length === 0 ? (
            <EmptyState height={bodyWrapH} slot={slots.emptyState} />
          ) : (
            <>
              {/* SCROLL AREA */}
              <div
                ref={scrollAreaRef}
                onScroll={handleScroll}
                style={{
                  position: "absolute",
                  inset: 0,
                  overflow: "auto",
                  scrollbarWidth: "thin",
                  scrollbarColor:
                    "var(--vg-scrollbar-thumb) var(--vg-scrollbar-track)",
                  willChange: "scroll-position",
                }}
              >
                <div
                  style={{
                    width: canvasW,
                    height: spacerHeight,
                    position: "relative",
                  }}
                >
                  {/* Sticky header */}
                  <div
                    style={{
                      position: "sticky",
                      top: 0,
                      width: canvasW,
                      height: totalHeaderHeight,
                      zIndex: 8,
                      background: "var(--vg-bg-header)",
                      borderBottom: "1px solid var(--vg-border-strong)",
                      ...styles.headerRow,
                    }}
                  >
                    {hasGroups ? (
                      <>
                        <div
                          role="row"
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: canvasW,
                            height: groupHeaderHeight,
                            overflow: "visible",
                          }}
                        >
                          {renderScrollableGroupRow()}
                        </div>
                        <div
                          role="row"
                          style={{
                            position: "absolute",
                            top: groupHeaderHeight,
                            left: 0,
                            width: canvasW,
                            height: headerHeight,
                            overflow: "hidden",
                          }}
                        >
                          {renderScrollableLeafRow()}
                        </div>
                      </>
                    ) : (
                      <div
                        role="row"
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: canvasW,
                          height: headerHeight,
                          overflow: "hidden",
                        }}
                      >
                        {renderScrollableFlatHeader()}
                      </div>
                    )}
                  </div>
                  {/* Frozen column body — inside the scroll container so
                      vertical scroll is handled natively (same as pinned
                      sticky rows). position:sticky + marginLeft places it at
                      the column's natural canvas position; CSS sticky locks it
                      at pinnedLeftWidth once the column scrolls past.
                      Visibility is toggled directly in handleScroll. */}
                  {frozenColDef && (
                    <div
                      ref={pinLeftBodyRef}
                      style={{
                        position: "sticky",
                        left: pinnedLeftWidth,
                        marginLeft: pinnedLeftWidth + frozenColOffset,
                        width: frozenWidth,
                        height: sortedData.length * rowHeight,
                        zIndex: 6,
                        // Initial state — handleScroll + useLayoutEffect keep
                        // this in sync after every scroll / React commit.
                        visibility: frozenIdx !== null ? "visible" : "hidden",
                        pointerEvents:
                          frozenIdx !== null ? "auto" : "none",
                      }}
                    >
                      {renderFrozenBodyRows()}
                    </div>
                  )}

                  {/* Virtual rows */}
                  {Array.from(
                    {
                      length: Math.max(
                        0,
                        vRows.endIndex - vRows.startIndex + 1,
                      ),
                    },
                    (_, i) => renderScrollableRow(vRows.startIndex + i),
                  )}
                </div>
              </div>

              {/* PINNED OVERLAY LAYERS */}
              {renderPinnedLayer("left")}
              {renderPinnedLayer("right")}

              {/* LOADING OVERLAY */}
              {loading && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(255,255,255,0.6)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 50,
                    backdropFilter: "blur(1px)",
                  }}
                >
                  {slots.loadingOverlay ?? (
                    <div
                      style={{
                        padding: "10px 20px",
                        borderRadius: 6,
                        background: "var(--vg-bg)",
                        border: "1px solid var(--vg-border-strong)",
                        fontSize: 13,
                        color: "var(--vg-text-dim)",
                        fontFamily: "var(--vg-font)",
                      }}
                    >
                      Loading…
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* FOOTER */}
        {features.footer &&
          (slots.footer ? (
            slots.footer(footerProps)
          ) : (
            <Footer {...footerProps} />
          ))}

        {/* ── DRAG: GHOST COLUMN + DROP INDICATOR ────────────────────────────
            position:fixed escapes overflow:hidden; kept inside this div so
            CSS variables (tokenStyle) cascade. Positions are updated via
            direct DOM style in useColumnDrag — no React re-render per frame.
        ─────────────────────────────────────────────────────────────────── */}
        {dragHandlers.dragState.draggingId &&
          (() => {
            const { draggingId } = dragHandlers.dragState;
            const draggingCol = visibleColumns.find((c) => c.id === draggingId);
            if (!draggingCol) return null;
            const bodyRect = bodyWrapRef.current?.getBoundingClientRect();
            if (!bodyRect) return null;

            const jc =
              draggingCol.align === "center"
                ? "center"
                : draggingCol.align === "right"
                  ? "flex-end"
                  : "flex-start";

            return (
              <>
                {/* Ghost column.
                    IMPORTANT: `left` is intentionally absent from this style.
                    The hook sets it via DOM in useLayoutEffect (initial) and
                    requestAnimationFrame (subsequent moves).  If `left` were
                    in the React style, every overTargetId change would cause
                    a re-render that resets it to the stale initial value,
                    making the ghost snap back on every column boundary. */}
                <div
                  ref={dragHandlers.registerGhost}
                  style={{
                    position: "fixed",
                    top: bodyRect.top,
                    width: draggingCol.width,
                    height: bodyRect.height,
                    zIndex: 9999,
                    pointerEvents: "none",
                    boxShadow: "0 6px 24px rgba(0,0,0,0.20)",
                    borderRadius: 4,
                    overflow: "hidden",
                    background: "var(--vg-bg)",
                  }}
                >
                  {/* Ghost header — matches pinned overlay header exactly */}
                  <div
                    style={{
                      height: totalHeaderHeight,
                      background: "var(--vg-bg-header)",
                      borderBottom: "1px solid var(--vg-border-strong)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: jc,
                      padding: "0 8px",
                      fontWeight: 600,
                      fontSize: "var(--vg-font-size)",
                      color: "var(--vg-text-header)",
                      boxSizing: "border-box",
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {draggingCol.label}
                  </div>

                  {/* Ghost body cells */}
                  {Array.from(
                    { length: vRows.endIndex - vRows.startIndex + 1 },
                    (_, i) => {
                      const ri = vRows.startIndex + i;
                      const row = sortedData[ri];
                      if (!row) return null;
                      const raw = draggingCol.accessor
                        ? draggingCol.accessor(row)
                        : (row as Record<string, unknown>)[
                            draggingCol.field ?? draggingCol.id
                          ];
                      const content = draggingCol.renderCell
                        ? draggingCol.renderCell(raw, row)
                        : (raw as React.ReactNode) ?? "—";
                      return (
                        <div
                          key={ri}
                          style={{
                            height: rowHeight,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: jc,
                            padding: "0 10px",
                            fontSize: "var(--vg-font-size)",
                            color: "var(--vg-text)",
                            borderBottom: "1px solid var(--vg-border)",
                            boxSizing: "border-box",
                            overflow: "hidden",
                            whiteSpace: "nowrap",
                            background: rowBg(row, ri),
                          }}
                        >
                          {content}
                        </div>
                      );
                    },
                  )}
                </div>

                {/* Drop indicator line.
                    IMPORTANT: `left` and `display` are absent — the hook
                    writes them directly so React re-renders don't reset them.
                    registerIndicator initialises display:none on mount. */}
                <div
                  ref={dragHandlers.registerIndicator}
                  style={{
                    position: "fixed",
                    top: bodyRect.top,
                    width: 2,
                    height: bodyRect.height,
                    background: "var(--vg-accent)",
                    zIndex: 10000,
                    pointerEvents: "none",
                    borderRadius: 1,
                  }}
                />
              </>
            );
          })()}
      </div>
    </GridContextProvider>
  );
}

export const LatticeGrid = memo(LatticeGridInner) as typeof LatticeGridInner;
