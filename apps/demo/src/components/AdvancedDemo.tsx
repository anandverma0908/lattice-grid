// =============================================================================
//  Demo — AdvancedDemo.tsx
//  Showcases: row selection, column filter, pagination, CSV/JSON export
// =============================================================================

import React, { useMemo, useState } from 'react';
import {
  LatticeGrid,
  GridPagination,
  useRowSelection,
  useColumnFilter,
  useGridPagination,
  useGridExport,
  GRID_THEMES,
  type ColumnDef,
  type LeafColumnDef,
  type ThemePreset,
} from '@lattice-grid-lib/core';
import { generateInventoryData, type InventoryRow } from '../data/inventory';

const ALL_DATA = generateInventoryData(2000);

// ─────────────────────────────────────────────────────────────────────────────
//  COLUMNS (flat — no groups — cleaner for this demo)
// ─────────────────────────────────────────────────────────────────────────────

const BASE_COLUMNS: ColumnDef<InventoryRow>[] = [
  {
    id: '__sel__',
    label: '',
    width: 38,
    pinned: 'left',
    sortable: false,
    resizable: false,
    draggable: false,
    renderCell: (_v, row) => (
      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
        <span
          style={{
            width: 14, height: 14, border: '1.5px solid var(--vg-border-strong)',
            borderRadius: 3, display: 'inline-flex', alignItems: 'center',
            justifyContent: 'center', background: 'var(--vg-bg-input)',
            cursor: 'pointer', flexShrink: 0,
          }}
        />
      </span>
    ),
  } as unknown as ColumnDef<InventoryRow>,
  { id: 'product', label: 'Product',  field: 'product', width: 220, pinned: 'left', sortable: true },
  { id: 'sku',     label: 'SKU',      field: 'sku',     width: 110, sortable: true },
  { id: 'dc',      label: 'DC / SCC', field: 'dc',      width: 120, sortable: true },
  { id: 'region',  label: 'Region',   field: 'region',  width: 90,  sortable: true },
  {
    id: 'channel',
    label: 'Ch.',
    field: 'channel',
    width: 58,
    sortable: true,
    align: 'center',
    renderCell: (v) => (
      <span style={{ fontWeight: 700, fontSize: 11, color: 'var(--vg-accent)' }}>CH{v as number}</span>
    ),
  },
  {
    id: 'status',
    label: 'Status',
    field: 'status',
    width: 90,
    sortable: true,
    renderCell: (v) => {
      const map: Record<string, [string, string]> = {
        active: ['var(--vg-accent-bg)', 'var(--vg-accent-text)'],
        low:    ['#fef3c7', '#92400e'],
        out:    ['#fee2e2', '#991b1b'],
      };
      const [bg, fg] = map[v as string] ?? map.active!;
      return (
        <span style={{ background: bg, color: fg, borderRadius: 3, padding: '2px 7px', fontWeight: 600, fontSize: 11 }}>
          {String(v).charAt(0).toUpperCase() + String(v).slice(1)}
        </span>
      );
    },
  },
  ...['d1','d2','d3','d4','d5','d6','d7'].map((d) => ({
    id: d, label: `${d.slice(1)} Apr`, field: d as keyof InventoryRow,
    width: 66, sortable: true, align: 'right' as const,
    renderCell: (v: unknown) => (
      <span style={{ fontFamily: 'var(--vg-font-mono)', fontSize: 12, color: (v as number) === 0 ? 'var(--vg-text-dim)' : 'var(--vg-text)' }}>
        {v as number}
      </span>
    ),
  } as LeafColumnDef<InventoryRow>)),
];

// ─────────────────────────────────────────────────────────────────────────────
//  COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export function AdvancedDemo({ theme }: { theme: ThemePreset }) {
  const isDark = theme !== 'light';
  const cardBg  = isDark ? '#0f1520' : '#ffffff';
  const cardBdr = isDark ? '#1e2840' : '#e5e7eb';
  const textDim = isDark ? '#6b7a96' : '#6b7280';
  const text    = isDark ? '#e4e8f0' : '#111827';

  // Leaf columns (no selection pseudo-col) for filter + export
  const leafColumns = useMemo(
    () => BASE_COLUMNS.filter((c) => c.id !== '__sel__') as Array<LeafColumnDef<InventoryRow> & { id: string }>,
    [],
  );

  // ── Column filter ──────────────────────────────────────────────────────────
  const filter = useColumnFilter<InventoryRow>({
    data: ALL_DATA,
    columns: leafColumns,
  });

  // ── Pagination (client-side) ───────────────────────────────────────────────
  const pagination = useGridPagination<InventoryRow>({
    data: filter.filteredData,
    pageSize: 100,
  });

  // ── Row selection ─────────────────────────────────────────────────────────
  const selection = useRowSelection<InventoryRow>({
    data: pagination.pageData,
    getRowId: (r) => r.id,
  });

  // ── Export (only visible page, only non-selection columns) ────────────────
  const exporter = useGridExport<InventoryRow>({
    data: selection.selectedIds.size > 0 ? selection.selectedRows : pagination.pageData,
    columns: useMemo(() => {
      // Re-use resolved structure via a simple projection
      return leafColumns.map((col) => ({
        id: col.id,
        label: col.label,
        field: col.field,
        width: 120,
        minWidth: 40,
        maxWidth: Infinity,
        pinned: null,
        hidden: false,
        groupId: null,
        defIndex: 0,
        sortable: true,
        resizable: true,
        draggable: true,
        align: 'left' as const,
      }));
    }, [leafColumns]),
  });

  // Columns with checkbox wired to selection
  const columns = useMemo((): ColumnDef<InventoryRow>[] => {
    return BASE_COLUMNS.map((col) => {
      if (col.id === '__sel__') {
        return {
          ...col,
          renderHeader: () => (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
              <input
                type="checkbox"
                checked={selection.allSelected}
                ref={(el) => { if (el) el.indeterminate = selection.someSelected; }}
                onChange={() => selection.allSelected ? selection.clearSelection() : selection.selectAll()}
                style={{ accentColor: 'var(--vg-accent)', cursor: 'pointer', width: 13, height: 13 }}
              />
            </span>
          ),
          renderCell: (_v: unknown, row: InventoryRow) => (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
              <input
                type="checkbox"
                checked={selection.isSelected(row.id)}
                onChange={() => selection.toggleRow(row.id)}
                onClick={(e) => e.stopPropagation()}
                style={{ accentColor: 'var(--vg-accent)', cursor: 'pointer', width: 13, height: 13 }}
              />
            </span>
          ),
        } as unknown as ColumnDef<InventoryRow>;
      }
      return col;
    });
  }, [selection]);

  const [activeFilter, setActiveFilter] = useState<'product' | 'dc' | null>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* ── Toolbar ───────────────────────────────────────────────────────── */}
      <div
        style={{
          display:        'flex',
          alignItems:     'center',
          gap:            8,
          padding:        '10px 16px',
          background:     cardBg,
          border:         `1px solid ${cardBdr}`,
          borderBottom:   'none',
          borderRadius:   '8px 8px 0 0',
          flexWrap:       'wrap',
        }}
      >
        {/* Filter inputs */}
        <input
          value={filter.filterValues['product'] ?? ''}
          onChange={(e) => filter.setFilter('product', e.target.value)}
          placeholder="Filter product…"
          style={{
            padding:      '5px 10px',
            borderRadius: 5,
            border:       `1px solid ${filter.filterValues['product'] ? 'var(--vg-accent, #2563eb)' : cardBdr}`,
            background:   isDark ? '#1c2438' : '#f9fafb',
            color:        text,
            fontSize:     12.5,
            width:        180,
            outline:      'none',
            fontFamily:   'inherit',
          }}
        />
        <input
          value={filter.filterValues['dc'] ?? ''}
          onChange={(e) => filter.setFilter('dc', e.target.value)}
          placeholder="Filter DC…"
          style={{
            padding:      '5px 10px',
            borderRadius: 5,
            border:       `1px solid ${filter.filterValues['dc'] ? 'var(--vg-accent, #2563eb)' : cardBdr}`,
            background:   isDark ? '#1c2438' : '#f9fafb',
            color:        text,
            fontSize:     12.5,
            width:        140,
            outline:      'none',
            fontFamily:   'inherit',
          }}
        />
        {filter.isFiltered && (
          <button
            onClick={filter.clearAllFilters}
            style={{
              padding:      '5px 10px',
              borderRadius: 5,
              border:       '1px solid var(--vg-accent, #2563eb)',
              background:   isDark ? '#1e3558' : '#dbeafe',
              color:        isDark ? '#93c5fd' : '#1d4ed8',
              fontSize:     12,
              fontWeight:   600,
              cursor:       'pointer',
              fontFamily:   'inherit',
            }}
          >
            ✕ Clear filters ({filter.filteredData.length.toLocaleString()} rows)
          </button>
        )}

        <div style={{ flex: 1 }} />

        {/* Selection info */}
        {selection.selectedIds.size > 0 && (
          <span style={{ fontSize: 12, fontWeight: 600, color: isDark ? '#93c5fd' : '#1d4ed8' }}>
            {selection.selectedIds.size} selected
          </span>
        )}

        {/* Export buttons */}
        <button
          onClick={() => exporter.exportCSV('inventory-export.csv')}
          style={{
            padding:      '5px 10px',
            borderRadius: 5,
            border:       `1px solid ${cardBdr}`,
            background:   isDark ? '#1c2438' : '#f3f4f6',
            color:        text,
            fontSize:     12,
            fontWeight:   600,
            cursor:       'pointer',
            fontFamily:   'inherit',
            display:      'inline-flex',
            alignItems:   'center',
            gap:          5,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1v7M3.5 5.5L6 8l2.5-2.5M1.5 9.5v1h9v-1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          CSV {selection.selectedIds.size > 0 ? `(${selection.selectedIds.size})` : ''}
        </button>
        <button
          onClick={() => exporter.exportJSON('inventory-export.json')}
          style={{
            padding:      '5px 10px',
            borderRadius: 5,
            border:       `1px solid ${cardBdr}`,
            background:   isDark ? '#1c2438' : '#f3f4f6',
            color:        text,
            fontSize:     12,
            fontWeight:   600,
            cursor:       'pointer',
            fontFamily:   'inherit',
            display:      'inline-flex',
            alignItems:   'center',
            gap:          5,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1v7M3.5 5.5L6 8l2.5-2.5M1.5 9.5v1h9v-1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          JSON
        </button>
      </div>

      {/* ── Grid ──────────────────────────────────────────────────────────── */}
      <LatticeGrid<InventoryRow>
        columns={columns}
        data={pagination.pageData}
        getRowId={(r) => r.id}
        theme={theme}
        height={440}
        rowHeight={36}
        headerHeight={38}
        showToolbar={false}
        showFooter={false}
        alternateRows
        style={{ borderRadius: 0, borderTop: 'none', borderBottom: 'none' }}
        onRowClick={(row) => selection.toggleRow(row.id)}
      />

      {/* ── Pagination ────────────────────────────────────────────────────── */}
      <div
        style={{
          border:         `1px solid ${cardBdr}`,
          borderTop:      'none',
          borderRadius:   '0 0 8px 8px',
          overflow:       'hidden',
          ...Object.fromEntries(Object.entries(GRID_THEMES[theme]).filter(([k]) => k.startsWith('--vg'))),
          fontFamily:     'var(--vg-font)',
        }}
      >
        <GridPagination {...pagination} />
      </div>
    </div>
  );
}
