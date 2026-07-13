import { memo, type CSSProperties, type ReactNode } from "react";
import type { GroupColumnDef, ResolvedColumn } from "../types";
import { useGridContext } from "../core/GridContext";

function omitBackground(style?: CSSProperties): CSSProperties {
  if (!style) return {};
  const { background: _background, backgroundColor: _backgroundColor, ...rest } = style;
  return rest;
}

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

interface DataCellProps {
  column: ResolvedColumn;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  row: any;
  rowIndex: number;
  colIndex: number;
  style: CSSProperties;
  pinned?: boolean;
  isScrolling?: boolean;
  loadingCell?: ReactNode;
  active?: boolean;
  focusable?: boolean;
  selected?: boolean;
  valueOverride?: unknown;
  indent?: number;
  onFocusCell?: (rowIndex: number, colIndex: number) => void;
  onActivateCell?: (rowIndex: number, colIndex: number) => void;
  ariaHidden?: boolean;
}

function dataCellEqual(
  prev: Readonly<DataCellProps>,
  next: Readonly<DataCellProps>,
): boolean {
  return (
    prev.column === next.column &&
    prev.row === next.row &&
    prev.rowIndex === next.rowIndex &&
    prev.colIndex === next.colIndex &&
    prev.pinned === next.pinned &&
    prev.isScrolling === next.isScrolling &&
    prev.active === next.active &&
    prev.focusable === next.focusable &&
    prev.selected === next.selected &&
    prev.valueOverride === next.valueOverride &&
    prev.indent === next.indent &&
    prev.ariaHidden === next.ariaHidden &&
    prev.style.left === next.style.left &&
    prev.style.top === next.style.top &&
    prev.style.width === next.style.width &&
    prev.style.height === next.style.height &&
    prev.style.background === next.style.background &&
    prev.style.zIndex === next.style.zIndex
  );
}

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
  rowIndex,
  colIndex,
  style,
  pinned = false,
  isScrolling = false,
  loadingCell,
  active = false,
  focusable = active,
  selected = false,
  valueOverride,
  indent = 0,
  onFocusCell,
  onActivateCell,
  ariaHidden = false,
}: DataCellProps) {
  const { styles, classNames } = useGridContext();

  if (isScrolling && column.deferRender && column.renderCell) {
    return (
      <div
        role={ariaHidden ? undefined : "gridcell"}
        aria-hidden={ariaHidden || undefined}
        aria-colindex={colIndex + 1}
        aria-selected={selected}
        tabIndex={!ariaHidden && focusable ? 0 : -1}
        data-grid-cell={ariaHidden ? undefined : `${rowIndex}:${colIndex}`}
        onFocus={(e) => {
          if (e.target === e.currentTarget) onFocusCell?.(rowIndex, colIndex);
        }}
        style={{
          ...style,
          position: "absolute",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 10px",
          paddingLeft: 10 + indent,
          boxSizing: "border-box",
          overflow: "hidden",
          outline: active ? "2px solid var(--vg-accent)" : "none",
          outlineOffset: -2,
        }}
      >
        {loadingCell ?? <ShimmerPlaceholder />}
      </div>
    );
  }

  const rawValue =
    valueOverride ??
    (column.accessor ? column.accessor(row) : row[column.field ?? column.id]);

  const content = column.renderCell
    ? column.renderCell(rawValue, row)
    : ((rawValue as ReactNode) ?? "—");

  const justifyContent =
    column.align === "center"
      ? "center"
      : column.align === "right"
        ? "flex-end"
        : "flex-start";

  const cellOverrides = omitBackground(pinned ? styles.pinnedCell : styles.cell);
  const colCellStyle = omitBackground(column.cellStyle);

  return (
    <div
      role={ariaHidden ? undefined : "gridcell"}
      aria-hidden={ariaHidden || undefined}
      aria-colindex={colIndex + 1}
      aria-selected={selected}
      tabIndex={!ariaHidden && focusable ? 0 : -1}
      data-grid-cell={ariaHidden ? undefined : `${rowIndex}:${colIndex}`}
      className={
        [classNames.cell, pinned ? classNames.pinnedCell : undefined]
          .filter(Boolean)
          .join(" ") || undefined
      }
      onFocus={(e) => {
        if (e.target === e.currentTarget) onFocusCell?.(rowIndex, colIndex);
      }}
      onClick={(e) => {
        onFocusCell?.(rowIndex, colIndex);
        e.currentTarget.focus({ preventScroll: true });
      }}
      onDoubleClick={() => onActivateCell?.(rowIndex, colIndex)}
      style={{
        ...style,
        position: "absolute",
        display: "flex",
        alignItems: "center",
        justifyContent,
        padding: "0 10px",
        paddingLeft: 10 + indent,
        fontSize: "var(--vg-font-size)",
        color: "var(--vg-text)",
        borderRight: "1px solid var(--vg-border)",
        boxSizing: "border-box",
        overflow: "hidden",
        whiteSpace: "nowrap",
        textOverflow: "ellipsis",
        outline: active ? "2px solid var(--vg-accent)" : "none",
        outlineOffset: -2,
        zIndex: active
          ? pinned
            ? Math.max(Number(style.zIndex ?? 0), 6)
            : Math.min(Math.max(Number(style.zIndex ?? 0), 3), 4)
          : style.zIndex,
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
  colStartIndex: number;
  colEndIndex: number;
  left: number;
  width: number;
  height: number;
  active?: boolean;
  focusable?: boolean;
  onFocusGroupHeader?: (
    groupId: string,
    colStartIndex: number,
    colEndIndex: number,
  ) => void;
}

export const GroupHeaderCell = memo(function GroupHeaderCell({
  group,
  colStartIndex,
  colEndIndex,
  left,
  width,
  height,
  active = false,
  focusable = active,
  onFocusGroupHeader,
}: GroupHeaderCellProps) {
  const { classNames, styles } = useGridContext();

  return (
    <div
      role="columnheader"
      className={classNames.groupRow || undefined}
      data-grid-group-header={group.id}
      data-col-start-index={colStartIndex}
      data-col-end-index={colEndIndex}
      tabIndex={focusable ? 0 : -1}
      onFocus={(e) => {
        if (e.target === e.currentTarget) {
          onFocusGroupHeader?.(group.id, colStartIndex, colEndIndex);
        }
      }}
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
        outline: active ? "2px solid var(--vg-accent)" : "none",
        outlineOffset: -2,
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
