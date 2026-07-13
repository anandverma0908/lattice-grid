import React, { memo } from 'react';
import type { UseGridPaginationReturn } from '../hooks/useGridPagination';

type GridPaginationProps = Pick<
  UseGridPaginationReturn,
  | 'currentPage'
  | 'pageCount'
  | 'totalRows'
  | 'startIndex'
  | 'endIndex'
  | 'pageSize'
  | 'pageSizeOptions'
  | 'canGoPrev'
  | 'canGoNext'
  | 'goToPage'
  | 'nextPage'
  | 'prevPage'
  | 'firstPage'
  | 'lastPage'
  | 'setPageSize'
>;

export const GridPagination = memo(function GridPagination({
  currentPage,
  pageCount,
  totalRows,
  startIndex,
  endIndex,
  pageSize,
  pageSizeOptions,
  canGoPrev,
  canGoNext,
  goToPage,
  nextPage,
  prevPage,
  firstPage,
  lastPage,
  setPageSize,
}: GridPaginationProps) {
  const pageNumbers = buildPageNumbers(currentPage, pageCount);

  return (
    <div
      style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        gap:            12,
        padding:        '8px 12px',
        background:     'var(--vg-bg-toolbar)',
        borderTop:      '1px solid var(--vg-border)',
        borderRadius:   '0 0 var(--vg-radius) var(--vg-radius)',
        fontFamily:     'var(--vg-font)',
        flexWrap:       'wrap',
      }}
    >
      <span
        style={{
          fontSize: 12,
          color:    'var(--vg-text-dim)',
          fontFamily: 'var(--vg-font-mono)',
          flexShrink: 0,
        }}
      >
        {(startIndex + 1).toLocaleString()}–{Math.min(endIndex + 1, totalRows).toLocaleString()} of{' '}
        {totalRows.toLocaleString()} rows
      </span>

      <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        <NavButton onClick={firstPage} disabled={!canGoPrev} title="First page">
          <ChevronDouble left />
        </NavButton>
        <NavButton onClick={prevPage} disabled={!canGoPrev} title="Previous page">
          <Chevron left />
        </NavButton>

        {pageNumbers.map((p, i) =>
          p === '…' ? (
            <span
              key={`ellipsis-${i}`}
              style={{ padding: '0 4px', fontSize: 12, color: 'var(--vg-text-dim)' }}
            >
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => goToPage(p as number)}
              aria-current={p === currentPage ? 'page' : undefined}
              style={{
                minWidth:     28,
                height:       28,
                padding:      '0 6px',
                borderRadius: 'var(--vg-radius-xs)',
                border:       `1px solid ${p === currentPage ? 'var(--vg-accent)' : 'var(--vg-border-strong)'}`,
                background:   p === currentPage ? 'var(--vg-accent-bg)' : 'var(--vg-bg-btn)',
                color:        p === currentPage ? 'var(--vg-accent-text)' : 'var(--vg-text)',
                fontWeight:   p === currentPage ? 700 : 500,
                fontSize:     12,
                cursor:       'pointer',
                fontFamily:   'var(--vg-font-mono)',
                lineHeight:   1,
                transition:   'all var(--vg-transition)',
              }}
            >
              {p}
            </button>
          ),
        )}

        <NavButton onClick={nextPage} disabled={!canGoNext} title="Next page">
          <Chevron />
        </NavButton>
        <NavButton onClick={lastPage} disabled={!canGoNext} title="Last page">
          <ChevronDouble />
        </NavButton>
      </div>

      {/* Right — page size selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
        <span style={{ fontSize: 12, color: 'var(--vg-text-dim)' }}>Rows per page</span>
        <select
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
          style={{
            padding:      '3px 6px',
            borderRadius: 'var(--vg-radius-xs)',
            border:       '1px solid var(--vg-border-strong)',
            background:   'var(--vg-bg-btn)',
            color:        'var(--vg-text)',
            fontSize:     12,
            cursor:       'pointer',
            fontFamily:   'var(--vg-font)',
            outline:      'none',
          }}
        >
          {pageSizeOptions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function NavButton({
  onClick,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        width:        28,
        height:       28,
        display:      'flex',
        alignItems:   'center',
        justifyContent: 'center',
        borderRadius: 'var(--vg-radius-xs)',
        border:       '1px solid var(--vg-border-strong)',
        background:   'var(--vg-bg-btn)',
        color:        disabled ? 'var(--vg-text-dim)' : 'var(--vg-text)',
        cursor:       disabled ? 'not-allowed' : 'pointer',
        opacity:      disabled ? 0.45 : 1,
        transition:   'all var(--vg-transition)',
        padding:      0,
      }}
    >
      {children}
    </button>
  );
}

function Chevron({ left = false }: { left?: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      style={{ transform: left ? 'rotate(180deg)' : undefined }}
    >
      <path
        d="M4.5 2.5L7.5 6l-3 3.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronDouble({ left = false }: { left?: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      style={{ transform: left ? 'rotate(180deg)' : undefined }}
    >
      <path
        d="M7 2.5L4 6l3 3.5M10 2.5L7 6l3 3.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Builds a compact page-number list with ellipsis.
 * Always shows first, last, and up to 3 pages around current.
 * Example: [1, '…', 4, 5, 6, '…', 20]
 */
function buildPageNumbers(current: number, total: number): Array<number | '…'> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: Array<number | '…'> = [];

  // Always include first
  pages.push(1);

  const lo = Math.max(2, current - 1);
  const hi = Math.min(total - 1, current + 1);

  if (lo > 2) pages.push('…');
  for (let p = lo; p <= hi; p++) pages.push(p);
  if (hi < total - 1) pages.push('…');

  // Always include last
  pages.push(total);

  return pages;
}
