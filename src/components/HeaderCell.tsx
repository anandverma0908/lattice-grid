// =============================================================================
//  @lattice-grid-lib/core — HeaderCell  v2.1
//
//  FIX 3: renderHeader now receives (column, engine) as second argument.
//  Custom headers can show sort state, fire actions, render filter inputs, etc.
// =============================================================================

import React, { memo, useState, type CSSProperties } from "react";
import type { ResolvedColumn } from "../types";
import { useGridContext } from "../core/GridContext";

interface HeaderCellProps {
  column: ResolvedColumn;
  style: CSSProperties;
  showResizeHandle?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
}

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
    texts,
    styles,
    classNames,
  } = useGridContext();
  const { sortState, toggleSort, toggleColumnVisibility } = engine;
  const { getDragHandlers, dragState, consumeDragEnd } = dragHandlers;

  const [hovered, setHovered] = useState(false);

  const isSorted = sortState.columnId === column.id;
  const isDragging = dragState.draggingId === column.id;
  const isDropTarget = dragState.overTargetId === column.id;
  const dropInsertBefore = dragState.insertBefore;

  const canSort = column.sortable && features.sort;
  const canResize = column.resizable && features.resize;
  const canDrag = column.draggable && features.reorder;
  const canHide = column.hideable && features.columnHide;

  const dragProps = canDrag ? getDragHandlers(column.id) : {};

  const handleClick = (e: React.MouseEvent) => {
    if (consumeDragEnd()) return;
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

  const borderLeft = isFirst ? "1px solid var(--vg-border)" : undefined;
  const borderRight = "1px solid var(--vg-border)";

  // Use inset box-shadow for the drop indicator so it doesn't affect layout size.
  // Left accent = will insert before this column; right accent = will insert after (end of zone).
  const dropShadow = isDropTarget
    ? dropInsertBefore
      ? "inset 3px 0 0 var(--vg-accent)"
      : "inset -3px 0 0 var(--vg-accent)"
    : undefined;

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
      className={classNames.headerCell ?? undefined}
      {...dragProps}
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...style,
        position: "absolute",
        display: "flex",
        alignItems: "center",
        justifyContent:
          column.align === "center"
            ? "center"
            : column.align === "right"
              ? "flex-end"
              : "flex-start",
        padding: "0 8px",
        fontWeight: 600,
        fontSize: "var(--vg-font-size)",
        color: "var(--vg-text-header)",
        background: bg,
        borderLeft,
        borderRight,
        borderBottom: "1px solid var(--vg-border)",
        boxShadow: dropShadow,
        cursor: canSort ? "pointer" : canDrag ? "grab" : "default",
        userSelect: "none",
        opacity: isDragging ? 0.45 : 1,
        boxSizing: "border-box",
        overflow: "visible",
        whiteSpace: "nowrap",
        transition: "background var(--vg-transition)",
        outline: "none",
        ...column.headerStyle,
        ...styles.headerCell,
        ...(column.groupId ? styles.groupHeaderCell : {}),
      }}
    >
      {/* Label — FIX 3: renderHeader receives (column, engine) */}
      <span
        style={{
          flex: 1,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          textAlign: column.align,
        }}
      >
        {column.renderHeader
          ? column.renderHeader(column, engine)
          : column.label}
      </span>

      {/* Sort indicator */}
      {canSort &&
        (() => {
          if (isSorted) {
            const icon =
              sortState.direction === "asc" ? icons.sortAsc : icons.sortDesc;
            if (icon)
              return (
                <span style={{ marginLeft: 3, flexShrink: 0 }}>{icon}</span>
              );
          } else if (icons.sortNone) {
            return (
              <span style={{ marginLeft: 3, flexShrink: 0, opacity: 0.3 }}>
                {icons.sortNone}
              </span>
            );
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
          data-vg-hide=""
          role="button"
          aria-label={texts.hideColumn}
          title={texts.hideColumn}
          onClick={handleHide}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 14,
            height: 14,
            borderRadius: 3,
            marginLeft: 3,
            flexShrink: 0,
            cursor: "pointer",
            opacity: hovered ? 0.7 : 0,
            pointerEvents: hovered ? "auto" : "none",
            background: "transparent",
            color: "var(--vg-text-dim)",
            transition: "opacity 0.12s",
            userSelect: "none",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.opacity = "1";
            (e.currentTarget as HTMLElement).style.background =
              "var(--vg-border-strong)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.opacity = hovered
              ? "0.7"
              : "0";
            (e.currentTarget as HTMLElement).style.background = "transparent";
          }}
        >
          {icons.hideColumn ?? <DefaultHideIcon />}
        </span>
      )}

      {/* Resize handle */}
      {showResizeHandle && canResize && (
        <div
          aria-hidden="true"
          data-resize-handle=""
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={handleResizeMouseDown}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "absolute",
            right: -4,
            top: 0,
            width: 8,
            height: "100%",
            borderRadius: 2,
            cursor: "col-resize",
            background: "transparent",
            zIndex: 3,
            transition: "background var(--vg-transition)",
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLElement).style.background =
              "var(--vg-resize-hover)")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLElement).style.background = "transparent")
          }
        />
      )}
    </div>
  );
});
