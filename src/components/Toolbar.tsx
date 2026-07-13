import React, { memo, type ReactNode } from 'react';
import { useGridContext } from '../core/GridContext';

interface ToolbarProps {
  left?:          ReactNode;
  right?:         ReactNode;
  colManagerSlot?: ReactNode;
}

export const Toolbar = memo(function Toolbar({ left, right, colManagerSlot }: ToolbarProps) {
  const { classNames, styles } = useGridContext();
  return (
    <div
      role="toolbar"
      className={classNames.toolbar || undefined}
      style={{
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'space-between',
        padding:         '7px 12px',
        background:      'var(--vg-bg-toolbar)',
        borderBottom:    '1px solid var(--vg-border)',
        gap:             8,
        flexShrink:      0,
        position:        'relative',
        ...styles.toolbar,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{left}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}>
        {right}
        {colManagerSlot}
      </div>
    </div>
  );
});

interface ToolbarButtonProps {
  onClick:       () => void;
  active?:       boolean;
  children:      ReactNode;
  icon?:         ReactNode;
  'aria-label'?: string;
}

export const ToolbarButton = memo(function ToolbarButton({
  onClick, active = false, children, icon, 'aria-label': ariaLabel,
}: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={active}
      style={{
        display:    'inline-flex', alignItems: 'center', gap: 5,
        padding:    '5px 10px',
        borderRadius: 'var(--vg-radius-sm)',
        border:     `1px solid ${active ? 'var(--vg-accent)' : 'var(--vg-border-strong)'}`,
        background: active ? 'var(--vg-accent-bg)' : 'var(--vg-bg-btn)',
        color:      active ? 'var(--vg-accent-text)' : 'var(--vg-text)',
        fontSize:   12, fontWeight: 600, cursor: 'pointer',
        fontFamily: 'var(--vg-font)',
        transition: 'all var(--vg-transition)',
        lineHeight: 1,
      }}
      onMouseEnter={e => {
        if (!active)
          (e.currentTarget as HTMLElement).style.background = 'var(--vg-bg-btn-hover)';
      }}
      onMouseLeave={e => {
        if (!active)
          (e.currentTarget as HTMLElement).style.background = 'var(--vg-bg-btn)';
      }}
    >
      {icon}
      {children}
    </button>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
//  FOOTER
// ─────────────────────────────────────────────────────────────────────────────

interface FooterProps {
  startRow:    number;
  endRow:      number;
  totalRows:   number;
  visibleCols: number;
  totalCols:   number;
}

export const Footer = memo(function Footer({
  startRow, endRow, totalRows, visibleCols, totalCols,
}: FooterProps) {
  const { classNames, styles, texts } = useGridContext();
  return (
    <div
      className={classNames.footer || undefined}
      style={{
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'flex-end',
        padding:         '5px 12px',
        background:      'var(--vg-bg-toolbar)',
        borderTop:       '1px solid var(--vg-border)',
        fontSize:        11,
        color:           'var(--vg-text-dim)',
        fontFamily:      'var(--vg-font-mono)',
        flexShrink:      0,
        gap:             12,
        ...styles.footer,
      }}
    >
      <span>
        {startRow.toLocaleString()}–{endRow.toLocaleString()} {texts.of}{" "}
        {totalRows.toLocaleString()} {texts.rows}
      </span>
      <span style={{ opacity: 0.5 }}>·</span>
      <span>{visibleCols}/{totalCols} {texts.columns}</span>
    </div>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
//  DEFAULT ICONS  (exported so they can be used in custom slots)
// ─────────────────────────────────────────────────────────────────────────────

export function ColsIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <rect x="0.5" y="1.5" width="3.5" height="9" rx="0.8"
        stroke="currentColor" strokeWidth="1.15" />
      <rect x="5"   y="1.5" width="3"   height="9" rx="0.8"
        stroke="currentColor" strokeWidth="1.15" />
      <rect x="9.5" y="1.5" width="3"   height="9" rx="0.8"
        stroke="currentColor" strokeWidth="1.15" />
    </svg>
  );
}
