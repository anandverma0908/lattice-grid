// =============================================================================
//  @virtual-grid/core — HeaderCell
// =============================================================================

import React, { memo, useState, type CSSProperties } from 'react';
import type { ResolvedColumn } from '../types';
import { useGridContext } from '../core/GridContext';

interface HeaderCellProps {
  column:           ResolvedColumn;
  style:            CSSProperties;
  showResizeHandle?: boolean;
}

// ── Default sort indicator ─────────────────────────────────────────────────────
function DefaultSortIcon({
  direction, active,
}: { direction: 'asc' | 'desc'; active: boolean }) {
  return (
    <span style={{
      display: 'inline-flex', flexDirection: 'column', gap: 1,
      marginLeft: 3, opacity: active ? 1 : 0.3, flexShrink: 0,
      color: active ? 'var(--vg-sort-active)' : 'var(--vg-sort-icon)',
      transition: 'opacity var(--vg-transition)',
    }}>
      <svg width="7" height="5" viewBox="0 0 7 5">
        <path d="M3.5 0L7 5H0z" fill="currentColor"
          opacity={active && direction === 'asc' ? 1 : 0.35} />
      </svg>
      <svg width="7" height="5" viewBox="0 0 7 5">
        <path d="M3.5 5L0 0h7z" fill="currentColor"
          opacity={active && direction === 'desc' ? 1 : 0.35} />
      </svg>
    </span>
  );
}

// ── Default hide icon ──────────────────────────────────────────────────────────
function DefaultHideIcon() {
  return (
    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
      <path d="M1 1l6 6M7 1L1 7" stroke="currentColor"
        strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

// ── HeaderCell ─────────────────────────────────────────────────────────────────
export const HeaderCell = memo(function HeaderCell({
  column,
  style,
  showResizeHandle = true,
}: HeaderCellProps) {
  const { engine, dragHandlers, startResize, features, icons, styles, classNames } =
    useGridContext();
  const { sortState, toggleSort, toggleColumnVisibility } = engine;
  const { getDragHandlers, dragState } = dragHandlers;

  const [hovered, setHovered] = useState(false);

  const isSorted     = sortState.columnId === column.id;
  const isDragging   = dragState.draggingId   === column.id;
  const isDropTarget = dragState.overTargetId === column.id;

  // Per-column feature overrides fall back to grid-level features
  const canSort    = column.sortable   && features.sort;
  const canResize  = column.resizable  && features.resize;
  const canDrag    = column.draggable  && features.reorder;
  const canHide    = column.hideable   && features.columnHide;

  const dragProps = canDrag ? getDragHandlers(column.id) : {};

  const handleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-vg-hide]')) return;
    if (canSort) toggleSort(column.id);
  };

  const handleHide = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleColumnVisibility(column.id);
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    startResize(e, column.id);
  };

  const bg = isDropTarget
    ? 'var(--vg-accent-bg)'
    : hovered
    ? 'var(--vg-bg-row-hover)'
    : 'var(--vg-bg-header)';

  return (
    <div
      role="columnheader"
      aria-sort={
        isSorted
          ? sortState.direction === 'asc' ? 'ascending' : 'descending'
          : 'none'
      }
      className={classNames.headerCell || undefined}
      {...dragProps}
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...style,
        position:   'absolute',
        display:    'flex',
        alignItems: 'center',
        padding:    '0 8px',
        fontWeight: 600,
        fontSize:   'var(--vg-font-size)',
        color:      'var(--vg-text-header)',
        background: bg,
        borderRight:  '1px solid var(--vg-border)',
        borderBottom: '2px solid var(--vg-border-strong)',
        cursor:     canSort ? 'pointer' : canDrag ? 'grab' : 'default',
        userSelect: 'none',
        opacity:    isDragging ? 0.45 : 1,
        boxSizing:  'border-box',
        overflow:   'hidden',
        whiteSpace: 'nowrap',
        transition: 'background var(--vg-transition)',
        outline:    'none',
        ...column.headerStyle,
        // User style override
        ...styles.headerCell,
      }}
    >
      {/* Label */}
      <span style={{
        flex: 1, overflow: 'hidden',
        textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        textAlign: column.align,
      }}>
        {column.renderHeader ? column.renderHeader(column) : column.label}
      </span>

      {/* Sort indicator — use custom icon if provided */}
      {canSort && (() => {
        if (isSorted) {
          const customIcon = sortState.direction === 'asc'
            ? icons.sortAsc
            : icons.sortDesc;
          if (customIcon) return <span style={{ marginLeft: 3, flexShrink: 0 }}>{customIcon}</span>;
        } else if (icons.sortNone) {
          return <span style={{ marginLeft: 3, flexShrink: 0, opacity: 0.3 }}>{icons.sortNone}</span>;
        }
        return <DefaultSortIcon direction={sortState.direction} active={isSorted} />;
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
            display:        'inline-flex',
            alignItems:     'center',
            justifyContent: 'center',
            width:          14,
            height:         14,
            borderRadius:   3,
            marginLeft:     3,
            flexShrink:     0,
            cursor:         'pointer',
            opacity:        hovered ? 0.7 : 0,
            pointerEvents:  hovered ? 'auto' : 'none',
            background:     'transparent',
            color:          'var(--vg-text-dim)',
            transition:     'opacity 0.12s',
            userSelect:     'none',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.opacity = '1';
            (e.currentTarget as HTMLElement).style.background = 'var(--vg-border-strong)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.opacity = hovered ? '0.7' : '0';
            (e.currentTarget as HTMLElement).style.background = 'transparent';
          }}
        >
          {icons.hideColumn ?? <DefaultHideIcon />}
        </span>
      )}

      {/* Resize handle */}
      {showResizeHandle && canResize && (
        <div
          aria-hidden="true"
          onMouseDown={handleResizeMouseDown}
          style={{
            position:   'absolute',
            right:      0, top: '20%',
            width:      4, height: '60%',
            borderRadius: 2,
            cursor:     'col-resize',
            background: 'transparent',
            zIndex:     2,
            transition: 'background var(--vg-transition)',
          }}
          onMouseEnter={e =>
            (e.currentTarget as HTMLElement).style.background = 'var(--vg-resize-hover)'
          }
          onMouseLeave={e =>
            (e.currentTarget as HTMLElement).style.background = 'transparent'
          }
        />
      )}
    </div>
  );
});
