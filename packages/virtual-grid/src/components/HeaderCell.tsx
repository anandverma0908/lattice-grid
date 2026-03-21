// =============================================================================
//  @virtual-grid/core — HeaderCell
// =============================================================================

import React, { memo, useState, type CSSProperties } from "react";
import type { ResolvedColumn } from "../types";
import { useGridContext } from "../core/GridContext";

interface HeaderCellProps {
  column: ResolvedColumn;
  style: CSSProperties;
  showResizeHandle?: boolean;
  /**
   * Pass true on the first cell in a row/group so it gets borderLeft.
   * All cells always get borderRight.
   * Middle cells only have borderRight — the previous cell's borderRight
   * acts as their left border, so borders never stack and look thick.
   */
  isFirst?: boolean;
  /**
   * Pass true on the last cell in a row/group.
   * Currently reserved for future use (e.g. suppress borderRight on last).
   */
  isLast?: boolean;
}

// ── Default sort indicator ─────────────────────────────────────────────────────
function DefaultSortIcon({
  direction,
  active,
}: {
  direction: "asc" | "desc";
  active: boolean;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        flexDirection: "column",
        gap: 1,
        marginLeft: 3,
        opacity: active ? 1 : 0.3,
        flexShrink: 0,
        color: active ? "var(--vg-sort-active)" : "var(--vg-sort-icon)",
        transition: "opacity var(--vg-transition)",
      }}
    >
      <svg width="7" height="5" viewBox="0 0 7 5">
        <path
          d="M3.5 0L7 5H0z"
          fill="currentColor"
          opacity={active && direction === "asc" ? 1 : 0.35}
        />
      </svg>
      <svg width="7" height="5" viewBox="0 0 7 5">
        <path
          d="M3.5 5L0 0h7z"
          fill="currentColor"
          opacity={active && direction === "desc" ? 1 : 0.35}
        />
      </svg>
    </span>
  );
}

// ── Default hide icon ──────────────────────────────────────────────────────────
function DefaultHideIcon() {
  return (
    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
      <path
        d="M1 1l6 6M7 1L1 7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ── HeaderCell ─────────────────────────────────────────────────────────────────
export const HeaderCell = memo(function HeaderCell({
  column,
  style,
  showResizeHandle = true,
  isFirst = false,
  isLast = false,
}: HeaderCellProps) {
  const {
    engine,
    dragHandlers,
    startResize,
    features,
    icons,
    styles,
    classNames,
  } = useGridContext();
  const { sortState, toggleSort, toggleColumnVisibility } = engine;
  const { getDragHandlers, dragState } = dragHandlers;

  const [hovered, setHovered] = useState(false);

  const isSorted = sortState.columnId === column.id;
  const isDragging = dragState.draggingId === column.id;
  const isDropTarget = dragState.overTargetId === column.id;

  const canSort = column.sortable && features.sort;
  const canResize = column.resizable && features.resize;
  const canDrag = column.draggable && features.reorder;
  const canHide = column.hideable && features.columnHide;

  const dragProps = canDrag ? getDragHandlers(column.id) : {};

  const handleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("[data-vg-hide]")) return;
    if (canSort) toggleSort(column.id);
  };

  const handleHide = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleColumnVisibility(column.id);
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    startResize(e, column.id);
  };

  const bg = isDropTarget
    ? "var(--vg-accent-bg)"
    : hovered
      ? "var(--vg-bg-row-hover)"
      : "var(--vg-bg-header)";

  // ── Border logic ────────────────────────────────────────────────────────────
  // Rule: every cell has borderRight. Only the first cell in a group/row
  // also gets borderLeft. This way adjacent cells share one border line —
  // the right border of cell N acts as the left border of cell N+1.
  // Result: no doubled/thick borders anywhere.
  const borderLeft = isFirst ? "1px solid var(--vg-border)" : undefined;
  const borderRight = "1px solid var(--vg-border)";

  return (
    <div
      role="columnheader"
      aria-sort={
        isSorted
          ? sortState.direction === "asc"
            ? "ascending"
            : "descending"
          : "none"
      }
      className={classNames.headerCell || undefined}
      {...dragProps}
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...style,
        position: "absolute",
        display: "flex",
        alignItems: "center",
        padding: "0 8px",
        fontWeight: 600,
        fontSize: "var(--vg-font-size)",
        color: "var(--vg-text-header)",
        borderBottom: '1px solid var(--vg-border)',
        background: bg,
        borderLeft,
        borderRight,
        cursor: canSort ? "pointer" : canDrag ? "grab" : "default",
        userSelect: "none",
        opacity: isDragging ? 0.45 : 1,
        boxSizing: "border-box",
        overflow: "hidden",
        whiteSpace: "nowrap",
        transition: "background var(--vg-transition)",
        outline: "none",
        ...column.headerStyle,
        ...styles.headerCell,
        ...(column.groupId ? styles.groupHeaderCell : {}),
      }}
    >
      {/* Header Container */}
      <span
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent:
            column.align === "right"
              ? "flex-end"
              : column.align === "center"
                ? "center"
                : "flex-start",
          width: "100%",
          overflow: "hidden",
        }}
      >
        {/* Label */}
        <span
          style={{
            // flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {column.renderHeader ? column.renderHeader(column) : column.label}
        </span>

        {/* Actions (Sort + Hide) */}
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            marginLeft: 6,
            flexShrink: 0,
          }}
        >
          {/* Sort indicator */}
          {canSort &&
            (() => {
              if (isSorted) {
                const customIcon =
                  sortState.direction === "asc"
                    ? icons.sortAsc
                    : icons.sortDesc;

                if (customIcon) return <span>{customIcon}</span>;
              } else if (icons.sortNone) {
                return <span style={{ opacity: 0.3 }}>{icons.sortNone}</span>;
              }

              return (
                <DefaultSortIcon
                  direction={sortState.direction}
                  active={isSorted}
                />
              );
            })()}

          {/* Hide button */}
          {canHide && (
            <span
              data-vg-hide
              role="button"
              aria-label="Hide column"
              title="Hide column"
              onClick={handleHide}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 14,
                height: 14,
                borderRadius: 3,
                cursor: "pointer",
                opacity: hovered ? 0.7 : 0,
                pointerEvents: hovered ? "auto" : "none",
                background: "transparent",
                color: "var(--vg-text-dim)",
                transition: "opacity 0.12s, background 0.12s",
                userSelect: "none",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget;
                el.style.opacity = "1";
                el.style.background = "var(--vg-border-strong)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget;
                el.style.opacity = hovered ? "0.7" : "0";
                el.style.background = "transparent";
              }}
            >
              {icons.hideColumn ?? <DefaultHideIcon />}
            </span>
          )}
        </span>
      </span>

      {/* Resize handle */}
      {showResizeHandle && canResize && (
        <div
          aria-hidden="true"
          onMouseDown={handleResizeMouseDown}
          style={{
            position: "absolute",
            right: 0,
            top: "35%",
            bottom: "50%",
            width: 2,
            height: "30%",
            borderRadius: 2,
            cursor: "col-resize",
            background: "var(--vg-border)",
            zIndex: 2,
            transition: "background var(--vg-transition)",
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLElement).style.background =
              "var(--vg-resize-hover)")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLElement).style.background =
              "var(--vg-border)")
          }
        />
      )}
    </div>
  );
});
