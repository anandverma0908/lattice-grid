// =============================================================================
//  @lattice-grid-lib/core — DataCell / GroupHeaderCell / EmptyState
// =============================================================================

import { memo, type CSSProperties, type ReactNode } from "react";
import type { GroupColumnDef, ResolvedColumn } from "../types";
import { useGridContext } from "../core/GridContext";

// Inject shimmer keyframes once at module load — no runtime overhead per cell.
if (typeof document !== "undefined") {
  const id = "vg-shimmer-keyframes";
  if (!document.getElementById(id)) {
    const s = document.createElement("style");
    s.id = id;
    s.textContent =
      "@keyframes vg-shimmer{from{background-position:200% 0}to{background-position:-200% 0}}";
    document.head.appendChild(s);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  DATA CELL
// ─────────────────────────────────────────────────────────────────────────────

interface DataCellProps {
  column: ResolvedColumn;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  row: any;
  style: CSSProperties;
  /** Pass true for cells in the pinned overlay layer. */
  pinned?: boolean;
  /** True while the grid is scrolling — deferred cells show loadingCell instead. */
  isScrolling?: boolean;
  /** Custom placeholder rendered in deferred cells during scroll. */
  loadingCell?: ReactNode;
}

function dataCellEqual(
  prev: Readonly<DataCellProps>,
  next: Readonly<DataCellProps>,
): boolean {
  return (
    prev.column === next.column &&
    prev.row === next.row &&
    prev.pinned === next.pinned &&
    prev.isScrolling === next.isScrolling &&
    prev.style.left === next.style.left &&
    prev.style.top === next.style.top &&
    prev.style.width === next.style.width &&
    prev.style.height === next.style.height &&
    prev.style.background === next.style.background &&
    prev.style.zIndex === next.style.zIndex
  );
}

// Default shimmer shown in deferred cells while scrolling.
function ShimmerPlaceholder() {
  return (
    <div
      style={{
        width: "60%",
        height: 10,
        borderRadius: 4,
        background:
          "linear-gradient(90deg, var(--vg-border) 25%, var(--vg-bg-row-hover) 50%, var(--vg-border) 75%)",
        backgroundSize: "200% 100%",
        animation: "vg-shimmer 1.2s infinite linear",
      }}
    />
  );
}

export const DataCell = memo(function DataCell({
  column,
  row,
  style,
  pinned = false,
  isScrolling = false,
  loadingCell,
}: DataCellProps) {
  const { styles, classNames } = useGridContext();

  // Deferred rendering: while scrolling, replace slow custom cells with a
  // lightweight placeholder so the main thread stays unblocked.
  if (isScrolling && column.deferRender && column.renderCell) {
    return (
      <div
        style={{
          ...style,
          position: "absolute",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 10px",
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        {loadingCell ?? <ShimmerPlaceholder />}
      </div>
    );
  }

  const rawValue = column.accessor
    ? column.accessor(row)
    : row[column.field ?? column.id];

  const content = column.renderCell
    ? column.renderCell(rawValue, row)
    : ((rawValue as ReactNode) ?? "—");

  const justifyContent =
    column.align === "center"
      ? "center"
      : column.align === "right"
        ? "flex-end"
        : "flex-start";

  // Strip background from cell/column styles so the row-level background
  // (which is selection-aware via rowBg in LatticeGrid) is not overridden.
  const rawCellStyle = pinned ? styles.pinnedCell : styles.cell;
  const {
    background: _cbg,
    backgroundColor: _cbgc,
    ...cellOverrides
  } = rawCellStyle ?? {};
  const {
    background: _bg,
    backgroundColor: _bgc,
    ...colCellStyle
  } = column.cellStyle ?? {};

  return (
    <div
      className={
        [classNames.cell, pinned ? classNames.pinnedCell : undefined]
          .filter(Boolean)
          .join(" ") || undefined
      }
      // Stop clicks from bubbling to the row's onClick when the cell has a
      // custom renderer. Prevents row selection from firing (and re-rendering
      // with old data) when the user interacts with interactive cell content
      // like checkboxes, buttons, or inputs.
      onClick={column.renderCell ? (e) => e.stopPropagation() : undefined}
      style={{
        ...style,
        position: "absolute",
        display: "flex",
        alignItems: "center",
        justifyContent,
        padding: "0 10px",
        fontSize: "var(--vg-font-size)",
        color: "var(--vg-text)",
        borderRight: "1px solid var(--vg-border)",
        boxSizing: "border-box",
        overflow: "hidden",
        whiteSpace: "nowrap",
        textOverflow: "ellipsis",
        ...colCellStyle,
        ...cellOverrides,
      }}
    >
      {content}
    </div>
  );
}, dataCellEqual);

// ─────────────────────────────────────────────────────────────────────────────
//  GROUP HEADER CELL
// ─────────────────────────────────────────────────────────────────────────────

interface GroupHeaderCellProps {
  group: GroupColumnDef;
  left: number;
  width: number;
  height: number;
}

export const GroupHeaderCell = memo(function GroupHeaderCell({
  group,
  left,
  width,
  height,
}: GroupHeaderCellProps) {
  const { classNames, styles } = useGridContext();

  return (
    <div
      className={classNames.groupRow || undefined}
      style={{
        position: "absolute",
        left,
        top: 0,
        width,
        height,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--vg-bg-header)",
        borderRight: "1px solid var(--vg-border)",
        borderBottom: "1px solid var(--vg-border)",
        fontWeight: 700,
        fontSize: "calc(var(--vg-font-size) - 0.5px)",
        letterSpacing: "0.025em",
        color: "var(--vg-text-group)",
        overflow: "hidden",
        whiteSpace: "nowrap",
        textOverflow: "ellipsis",
        boxSizing: "border-box",
        ...group.headerStyle,
        ...styles.groupRow,
      }}
    >
      {group.label}
    </div>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
//  EMPTY STATE
// ─────────────────────────────────────────────────────────────────────────────

interface EmptyStateProps {
  height: number;
  slot?: ReactNode;
}

export const EmptyState = memo(function EmptyState({
  height,
  slot,
}: EmptyStateProps) {
  return (
    <div
      style={{
        height,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        color: "var(--vg-text-dim)",
        fontSize: "var(--vg-font-size)",
        fontFamily: "var(--vg-font)",
      }}
    >
      {slot ?? (
        <>
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <rect
              x="4"
              y="4"
              width="28"
              height="28"
              rx="4"
              stroke="currentColor"
              strokeWidth="1.5"
              opacity="0.4"
            />
            <line
              x1="4"
              y1="13"
              x2="32"
              y2="13"
              stroke="currentColor"
              strokeWidth="1.2"
              opacity="0.3"
            />
            <line
              x1="4"
              y1="22"
              x2="32"
              y2="22"
              stroke="currentColor"
              strokeWidth="1.2"
              opacity="0.2"
            />
            <line
              x1="14"
              y1="4"
              x2="14"
              y2="32"
              stroke="currentColor"
              strokeWidth="1.2"
              opacity="0.2"
            />
          </svg>
          <span style={{ opacity: 0.5 }}>No data to display</span>
        </>
      )}
    </div>
  );
});
