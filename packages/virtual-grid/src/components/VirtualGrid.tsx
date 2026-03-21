// =============================================================================
//  @virtual-grid/core — VirtualGrid  (v2.0)
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
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useGridEngine } from "../core/useGridEngine";
import {
  useVirtualRows,
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
  VirtualGridProps,
  ResolvedColumn,
  GridFeatures,
  GridIcons,
  GridStyles,
  GridClassNames,
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

function VirtualGridInner<TData = unknown>({
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
  onColumnResize,
  onColumnReorder,
  ariaLabel = "Data grid",
  className,
  style,
}: VirtualGridProps<TData> & { maxHeight?: number }) {
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
  }, [data, sortState.columnId, sortState.direction]);

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
  const scrollTopRef = useRef(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

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

  // ── Column window (synchronous ref) ──────────────────────────────────────────
  const vColsRef = useRef({ startIndex: 0, endIndex: 0 });
  const recomputeVCols = useCallback(
    (rawScrollLeft: number) => {
      const bandScroll = Math.max(0, rawScrollLeft - pinnedLeftWidth);
      vColsRef.current = calcColWindow(
        offsets,
        colWidths,
        bandScroll,
        scrollViewWidth,
      );
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

  const handleScroll = useCallback(() => {
    const el = scrollAreaRef.current;
    if (!el) return;
    const st = el.scrollTop,
      sl = el.scrollLeft;
    scrollTopRef.current = st;
    scrollLeftRef.current = sl;
    recomputeVCols(sl);
    recomputeFrozen(sl);
    setScrollTop(st);
    setScrollLeft(sl);
  }, [recomputeVCols, recomputeFrozen]);

  useEffect(() => {
    recomputeVCols(scrollLeftRef.current);
    recomputeFrozen(scrollLeftRef.current);
  }, [recomputeVCols, recomputeFrozen]);

  const vCols = vColsRef.current;
  const frozenIdx = frozenIdxRef.current;
  const frozenCol: ResolvedColumn<TData> | null =
    frozenIdx !== null ? (scrollableColumns[frozenIdx] ?? null) : null;
  const frozenWidth = frozenCol?.width ?? 0;

  // ── Row virtualisation ────────────────────────────────────────────────────────
  const vRows = useVirtualRows({
    rowCount: sortedData.length,
    rowHeight,
    scrollTop,
    viewportHeight: Math.max(0, bodyWrapH - totalHeaderHeight),
  });

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

  const dragHandlers = useColumnDrag({
    onMoveColumnBefore: (src, tgt) => {
      moveColumnBefore(src, tgt);
      onColumnReorder?.(engine.orderedColumns.map((c) => c.id));
    },
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
    for (let ci = vCols.startIndex; ci <= vCols.endIndex; ci++) {
      const col = scrollableColumns[ci];
      if (!col || ungroupedIds.has(col.id)) continue;
      cells.push(
        <HeaderCell
          key={`lh-${col.id}`}
          column={col}
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
    }
    return cells;
  };

  const renderScrollableFlatHeader = (): React.ReactNode => {
    const cells: React.ReactNode[] = [];
    for (let ci = vCols.startIndex; ci <= vCols.endIndex; ci++) {
      const col = scrollableColumns[ci];
      if (!col) continue;
      cells.push(
        <HeaderCell
          key={`fh-${col.id}`}
          column={col}
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
    }
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
    const isSel = isRowSelected(row, rowIndex);
    const rowKey = getRowId
      ? String(getRowId(row, rowIndex))
      : String(rowIndex);

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
          ...styles.row,
          ...(isSel ? styles.rowSelected : {}),
        }}
        onMouseEnter={(e) => {
          if (!isSel)
            (e.currentTarget as HTMLElement).style.background =
              "var(--vg-bg-row-hover)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = bg;
        }}
      >
        {cells}
      </div>
    );
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
      cols.forEach((col, i) => {
        headerCells.push(
          <div
            key={`ph-${col.id}`}
            style={{
              position: "absolute",
              left: colLefts[i],
              top: 0,
              width: col.width,
              height: groupHeaderHeight + headerHeight,
              background: "var(--vg-bg-header)",
              borderRight: isLeft
                ? "1px solid var(--vg-border-strong)"
                : undefined,
              borderLeft: !isLeft
                ? "1px solid var(--vg-border-strong)"
                : undefined,
              // borderBottom: '1px solid var(--vg-border-strong)',
              zIndex: 2,
              boxSizing: "border-box",
              display: "flex",
              alignItems: "center",
              padding: "0 10px",
              fontWeight: 700,
              fontSize: "calc(var(--vg-font-size) - 0.5px)",
              color: "var(--vg-text-group)",
              overflow: "hidden",
              whiteSpace: "nowrap",
              ...styles.pinnedHeaderCell,
            }}
          >
            {col.label}
          </div>,
        );
      });
      if (hasFrozen && frozenCol) {
        headerCells.push(
          <div
            key={`ph-frozen-${frozenCol.id}`}
            style={{
              position: "absolute",
              left: frozenSlotLeft,
              top: 0,
              width: frozenWidth,
              height: groupHeaderHeight + headerHeight,
              // background: 'var(--vg-bg-frozen, var(--vg-bg-group))',
              borderRight: "1px solid var(--vg-border-strong)",
              // borderBottom: '1px solid var(--vg-border-strong)',
              zIndex: 2,
              boxSizing: "border-box",
              display: "flex",
              alignItems: "center",
              padding: "0 10px",
              fontWeight: 700,
              fontSize: "calc(var(--vg-font-size) - 0.5px)",
              color: "var(--vg-text-group)",
              overflow: "hidden",
              whiteSpace: "nowrap",
              ...styles.pinnedHeaderCell,
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
              // background: 'var(--vg-bg-frozen, var(--vg-accent-bg))',
            }}
          />,
        );
      }
    }

    // Body — grouped by row for click handling
    const bodyCells: React.ReactNode[] = [];
    for (let ri = vRows.startIndex; ri <= vRows.endIndex; ri++) {
      const row = sortedData[ri];
      if (!row) continue;
      const rowKey = getRowId ? String(getRowId(row, ri)) : String(ri);
      const bg = pinnedRowBg(row, ri);
      const isSel = isRowSelected(row, ri);

      const rowCells: React.ReactNode[] = [];
      cols.forEach((col, i) => {
        rowCells.push(
          <DataCell
            key={`pb-${col.id}`}
            column={col}
            row={row}
            pinned
            style={{
              position: "absolute",
              left: colLefts[i],
              top: 0,
              width: col.width,
              height: rowHeight,
              background: bg,
              zIndex: 2,
            }}
          />,
        );
      });

      if (hasFrozen && frozenCol) {
        const frozenBg = isSel ? "var(--vg-bg-row-selected)" : "";
        rowCells.push(
          <DataCell
            key={`pb-frozen-${frozenCol.id}`}
            column={frozenCol}
            row={row}
            pinned
            style={{
              position: "absolute",
              left: frozenSlotLeft,
              top: 0,
              width: frozenWidth,
              height: rowHeight,
              background: frozenBg,
              zIndex: 2,
            }}
          />,
        );
      }

      bodyCells.push(
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
            width: layerWidth,
            height: rowHeight,
            background: bg,
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
            (e.currentTarget as HTMLElement).style.background = bg;
          }}
        >
          {rowCells}
        </div>,
      );
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
        <div
          style={{
            position: "relative",
            width: layerWidth,
            height: "100%",
            pointerEvents: "auto",
          }}
          onWheel={(e) => {
            // Forward wheel events to the scroll area so vertical scroll
            // works when the pointer is over a pinned column.
            const el = scrollAreaRef.current;
            if (!el) return;
            el.scrollTop += e.deltaY;
            el.scrollLeft += e.deltaX;
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
          <div
            style={{
              position: "absolute",
              top: totalHeaderHeight,
              left: 0,
              width: layerWidth,
              height: sortedData.length * rowHeight,
              transform: `translateY(-${scrollTop}px)`,
              willChange: "transform",
            }}
          >
            {bodyCells}
          </div>
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
      </div>
    </GridContextProvider>
  );
}

export const VirtualGrid = memo(VirtualGridInner) as typeof VirtualGridInner;
