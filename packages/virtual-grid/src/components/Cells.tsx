// =============================================================================
//  @virtual-grid/core — DataCell / GroupHeaderCell / EmptyState
// =============================================================================

import React, { memo, type CSSProperties, type ReactNode } from 'react';
import type { GroupColumnDef, ResolvedColumn } from '../types';
import { useGridContext } from '../core/GridContext';

// ─────────────────────────────────────────────────────────────────────────────
//  DATA CELL
// ─────────────────────────────────────────────────────────────────────────────

interface DataCellProps {
  column: ResolvedColumn;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  row:    any;
  style:  CSSProperties;
  /** Pass true for cells in the pinned overlay layer. */
  pinned?: boolean;
}

export const DataCell = memo(function DataCell({
  column,
  row,
  style,
  pinned = false,
}: DataCellProps) {
  const { styles, classNames } = useGridContext();

  const rawValue = column.accessor
    ? column.accessor(row)
    : row[column.field ?? column.id];

  const content = column.renderCell
    ? column.renderCell(rawValue, row)
    : (rawValue as ReactNode) ?? '—';

  const justifyContent =
    column.align === 'center' ? 'center'
    : column.align === 'right' ? 'flex-end'
    : 'flex-start';

  return (
    <div
      className={[
        classNames.cell,
        pinned ? classNames.pinnedCell : undefined,
      ].filter(Boolean).join(' ') || undefined}
      style={{
        ...style,
        position:   'absolute',
        display:    'flex',
        alignItems: 'center',
        justifyContent,
        padding:    '0 10px',
        fontSize:   'var(--vg-font-size)',
        color:      'var(--vg-text)',
        borderRight: '1px solid var(--vg-border)',
        boxSizing:  'border-box',
        overflow:   'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
        ...column.cellStyle,
        // User style overrides come last
        ...(pinned ? styles.pinnedCell : styles.cell),
      }}
    >
      {content}
    </div>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
//  GROUP HEADER CELL
// ─────────────────────────────────────────────────────────────────────────────

interface GroupHeaderCellProps {
  group:  GroupColumnDef;
  left:   number;
  width:  number;
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
        position:       'absolute',
        left,
        top:            0,
        width,
        height,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        background:     'var(--vg-bg-header)',
        borderRight:    '1px solid var(--vg-border)',
        borderBottom:   '1px solid var(--vg-border)',
        fontWeight:     700,
        fontSize:       'calc(var(--vg-font-size) - 0.5px)',
        letterSpacing:  '0.025em',
        color:          'var(--vg-text-group)',
        overflow:       'hidden',
        whiteSpace:     'nowrap',
        textOverflow:   'ellipsis',
        boxSizing:      'border-box',
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
  slot?:  ReactNode;
}

export const EmptyState = memo(function EmptyState({ height, slot }: EmptyStateProps) {
  return (
    <div style={{
      height,
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      gap:            10,
      color:          'var(--vg-text-dim)',
      fontSize:       'var(--vg-font-size)',
      fontFamily:     'var(--vg-font)',
    }}>
      {slot ?? (
        <>
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <rect x="4" y="4" width="28" height="28" rx="4"
              stroke="currentColor" strokeWidth="1.5" opacity="0.4"/>
            <line x1="4" y1="13" x2="32" y2="13"
              stroke="currentColor" strokeWidth="1.2" opacity="0.3"/>
            <line x1="4" y1="22" x2="32" y2="22"
              stroke="currentColor" strokeWidth="1.2" opacity="0.2"/>
            <line x1="14" y1="4" x2="14" y2="32"
              stroke="currentColor" strokeWidth="1.2" opacity="0.2"/>
          </svg>
          <span style={{ opacity: 0.5 }}>No data to display</span>
        </>
      )}
    </div>
  );
});
