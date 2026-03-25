// =============================================================================
//  LatticeGrid — Documentation  (publish-ready)
// =============================================================================

import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import {
  LatticeGrid,
  GRID_THEMES,
  type ThemePreset,
  type GridEngine,
  type ColumnDef,
  type SortState,
  type ColumnState,
  type ColumnManagerRenderProps,
} from '@lattice-grid-lib/core';
import { generateInventoryData, type InventoryRow } from '../data/inventory';
import { INVENTORY_COLUMNS } from '../data/columns';

// ─────────────────────────────────────────────────────────────────────────────
//  STABLE DATA
// ─────────────────────────────────────────────────────────────────────────────

const DATA200  = generateInventoryData(200);
const DATA5000 = generateInventoryData(5000);

// ─────────────────────────────────────────────────────────────────────────────
//  SHARED UI PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────

function Code({ children, lang = 'tsx' }: { children: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div style={{ borderRadius: 8, overflow: 'hidden', margin: '12px 0', border: '1px solid #21262d' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '6px 14px', background: '#161b22', borderBottom: '1px solid #21262d',
      }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: '#8b949e', letterSpacing: '.06em', textTransform: 'uppercase', fontFamily: 'monospace' }}>
          {lang}
        </span>
        <button
          onClick={async () => {
            await navigator.clipboard.writeText(children.trim());
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          style={{
            background: 'none', border: '1px solid #30363d', borderRadius: 4,
            padding: '2px 8px', fontSize: 11, cursor: 'pointer', fontFamily: 'sans-serif',
            color: copied ? '#3fb950' : '#8b949e',
          }}
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <pre style={{
        margin: 0, padding: '14px 16px',
        background: '#0d1117', color: '#e6edf3',
        fontSize: 12.5, lineHeight: 1.75, overflow: 'auto',
        fontFamily: "'JetBrains Mono','Fira Code',monospace",
      }}>
        <code>{children.trim()}</code>
      </pre>
    </div>
  );
}

function Section({ id, title, subtitle, badge, children }: {
  id: string; title: string; subtitle?: string;
  badge?: { text: string; color: string };
  children: React.ReactNode;
}) {
  return (
    <section id={id} style={{ marginBottom: 64, scrollMarginTop: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: subtitle ? 6 : 16 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em', margin: 0, color: 'var(--doc-txt)' }}>
          {title}
        </h2>
        {badge && (
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
            background: badge.color + '22', color: badge.color, letterSpacing: '.04em',
          }}>
            {badge.text}
          </span>
        )}
      </div>
      {subtitle && (
        <p style={{ fontSize: 14, color: 'var(--doc-dim)', marginBottom: 16, lineHeight: 1.65, maxWidth: 640 }}>
          {subtitle}
        </p>
      )}
      <div style={{ borderLeft: '3px solid var(--doc-bdr)', paddingLeft: 0 }}>
        {children}
      </div>
    </section>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h3 style={{ fontSize: 15, fontWeight: 600, margin: '20px 0 8px', color: 'var(--doc-txt)' }}>{title}</h3>
      {children}
    </div>
  );
}

function Callout({ type = 'info', children }: { type?: 'info' | 'tip' | 'warn'; children: React.ReactNode }) {
  const colors = {
    info: { bg: '#1e3a5f', bdr: '#2563eb', txt: '#93c5fd', icon: 'ℹ' },
    tip:  { bg: '#14532d', bdr: '#16a34a', txt: '#86efac', icon: '✦' },
    warn: { bg: '#451a03', bdr: '#d97706', txt: '#fcd34d', icon: '⚠' },
  };
  const c = colors[type];
  return (
    <div style={{
      display: 'flex', gap: 10, padding: '10px 14px', borderRadius: 6, margin: '12px 0',
      background: c.bg + '44', border: `1px solid ${c.bdr}44`,
    }}>
      <span style={{ fontSize: 13, color: c.txt, flexShrink: 0 }}>{c.icon}</span>
      <span style={{ fontSize: 13, color: c.txt, lineHeight: 1.6 }}>{children}</span>
    </div>
  );
}

function PropRow({ prop, type, def, desc }: { prop: string; type: string; def?: string; desc: string }) {
  return (
    <tr>
      <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontSize: 12, color: '#a78bfa', borderBottom: '1px solid var(--doc-bdr)', whiteSpace: 'nowrap' }}>{prop}</td>
      <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontSize: 11, color: '#34d399', borderBottom: '1px solid var(--doc-bdr)', whiteSpace: 'nowrap' }}>{type}</td>
      <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontSize: 11, color: 'var(--doc-dim)', borderBottom: '1px solid var(--doc-bdr)' }}>{def ?? '—'}</td>
      <td style={{ padding: '8px 12px', fontSize: 12, color: 'var(--doc-txt)', borderBottom: '1px solid var(--doc-bdr)', lineHeight: 1.5 }}>{desc}</td>
    </tr>
  );
}

function PropsTable({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid var(--doc-bdr)', margin: '12px 0' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: 'var(--doc-surf)' }}>
            {['Prop / Key', 'Type', 'Default', 'Description'].map(h => (
              <th key={h} style={{
                padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '.06em',
                color: 'var(--doc-dim)', borderBottom: '1px solid var(--doc-bdr)',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function LiveGrid(props: {
  height?: number;
  theme?: ThemePreset;
  columns?: ColumnDef<InventoryRow>[];
  data?: InventoryRow[];
  [key: string]: unknown;
}) {
  const { height = 240, theme = 'light', columns = INVENTORY_COLUMNS, data = DATA200, ...rest } = props;
  return (
    <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid var(--doc-bdr)', margin: '12px 0' }}>
      <LatticeGrid<InventoryRow>
        columns={columns as ColumnDef<InventoryRow>[]}
        data={data}
        theme={theme}
        height={height}
        rowHeight={34}
        headerHeight={36}
        groupHeaderHeight={26}
        getRowId={(r) => r.id}
        {...(rest as Record<string, unknown>)}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  NAV ITEMS
// ─────────────────────────────────────────────────────────────────────────────

const NAV = [
  { group: 'Getting started', items: [
    { id: 'overview',     label: 'Overview' },
    { id: 'install',      label: 'Installation' },
    { id: 'quickstart',   label: 'Quick start' },
  ]},
  { group: 'Columns', items: [
    { id: 'col-defs',     label: 'Column definitions' },
    { id: 'col-groups',   label: 'Column groups' },
    { id: 'col-pinning',  label: 'Pinning' },
    { id: 'col-resize',   label: 'Resize' },
    { id: 'col-reorder',  label: 'Drag reorder' },
    { id: 'col-hide',     label: 'Show / hide' },
    { id: 'col-freeze',   label: 'Auto-freeze' },
    { id: 'col-manager',  label: 'Column manager' },
  ]},
  { group: 'Data', items: [
    { id: 'sorting',      label: 'Sorting' },
    { id: 'server-sort',  label: 'Server-side sort' },
    { id: 'row-select',   label: 'Row selection' },
    { id: 'cell-render',  label: 'Cell renderers' },
    { id: 'header-render',label: 'Header renderers' },
  ]},
  { group: 'Customisation', items: [
    { id: 'theming',      label: 'Theming & tokens' },
    { id: 'features',     label: 'Feature flags' },
    { id: 'icons',        label: 'Icons' },
    { id: 'classnames',   label: 'CSS class names' },
    { id: 'styles',       label: 'Style overrides' },
    { id: 'slots',        label: 'Slots' },
    { id: 'persistence',  label: 'Persistence' },
  ]},
  { group: 'Advanced', items: [
    { id: 'headless',     label: 'Headless API' },
    { id: 'hooks',        label: 'Hooks reference' },
    { id: 'virtualisation', label: 'Virtualisation' },
  ]},
  { group: 'Reference', items: [
    { id: 'ref-props',    label: 'Props reference' },
    { id: 'ref-tokens',   label: 'Token reference' },
    { id: 'ref-types',    label: 'Type reference' },
  ]},
];

// ─────────────────────────────────────────────────────────────────────────────
//  DOCS COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export function Docs({ isDark }: { isDark: boolean }) {
  const [activeTheme, setActiveTheme] = useState<ThemePreset>('light');
  const [sortLog, setSortLog] = useState('Click any header to sort…');
  const [serverSort, setServerSort] = useState<SortState>({ columnId: null, direction: 'asc' });
  const [serverLoading, setServerLoading] = useState(false);
  const [serverData, setServerData] = useState<InventoryRow[]>(() => DATA200.slice(0, 50));
  const [persistLog, setPersistLog] = useState('');
  const engineRef = useRef<GridEngine<InventoryRow> | null>(null);

  const bg   = isDark ? '#070c14' : '#f8f9fb';
  const surf = isDark ? '#0d1117' : '#ffffff';
  const bdr  = isDark ? '#1e2840' : '#e5e7eb';
  const txt  = isDark ? '#e4e8f0' : '#111827';
  const dim  = isDark ? '#6b7a96' : '#6b7280';

  const cssVars = {
    '--doc-bg': bg, '--doc-surf': surf, '--doc-bdr': bdr,
    '--doc-txt': txt, '--doc-dim': dim,
  } as React.CSSProperties;

  // Server sort simulation
  const handleServerSort = useCallback((sort: SortState) => {
    setServerLoading(true);
    setSortLog(`→ API: GET /rows?sort=${sort.columnId ?? 'none'}&dir=${sort.direction} …`);
    setTimeout(() => {
      let rows = [...DATA200.slice(0, 50)];
      if (sort.columnId) {
        const key = sort.columnId as keyof InventoryRow;
        rows.sort((a, b) => {
          const va = a[key], vb = b[key];
          if (va == null) return 1; if (vb == null) return -1;
          const cmp = (va as string) < (vb as string) ? -1 : (va as string) > (vb as string) ? 1 : 0;
          return sort.direction === 'asc' ? cmp : -cmp;
        });
      }
      setServerData(rows);
      setServerSort(sort);
      setServerLoading(false);
      setSortLog(`✓ Received ${rows.length} rows sorted by "${sort.columnId ?? 'default'}"`);
    }, 500);
  }, []);

  // Persistence simulation
  const handlePersist = useCallback((state: ColumnState[]) => {
    const hidden = state.filter(c => c.hidden).length;
    const pinned = state.filter(c => c.pinned).length;
    setPersistLog(`Saved: ${hidden} hidden, ${pinned} pinned, ${state.length} total`);
  }, []);

  const simpleColumns: ColumnDef<InventoryRow>[] = [
    { id: 'product', label: 'Product',  field: 'product', width: 200, pinned: 'left', sortable: true },
    { id: 'dc',      label: 'DC',       field: 'dc',      width: 110, sortable: true },
    { id: 'channel', label: 'Ch.',      field: 'channel', width: 55,  sortable: true, align: 'center' },
    { id: 'status',  label: 'Status',   field: 'status',  width: 90,  sortable: true },
    { id: 'stock',   label: 'Stock',    field: 'stock',   width: 80,  sortable: true, align: 'right' },
    { id: 'sold',    label: 'Sold',     field: 'sold',    width: 80,  sortable: true, align: 'right' },
    { id: 'q1',      label: 'Q1',       field: 'q1',      width: 70,  sortable: true, align: 'right' },
    { id: 'q2',      label: 'Q2',       field: 'q2',      width: 70,  sortable: true, align: 'right' },
    { id: 'q3',      label: 'Q3',       field: 'q3',      width: 70,  sortable: true, align: 'right' },
  ];

  const groupedColumns: ColumnDef<InventoryRow>[] = [
    { id: 'product', label: 'Product', field: 'product', width: 200, pinned: 'left' },
    { id: 'dc',      label: 'DC',      field: 'dc',      width: 110, pinned: 'left' },
    {
      id: 'week1', label: 'Week 1',
      children: [
        { id: 'd1', label: '1 Apr', field: 'd1', width: 70, align: 'right' as const },
        { id: 'd2', label: '2 Apr', field: 'd2', width: 70, align: 'right' as const },
        { id: 'd3', label: '3 Apr', field: 'd3', width: 70, align: 'right' as const },
        { id: 'd4', label: '4 Apr', field: 'd4', width: 70, align: 'right' as const },
        { id: 'd5', label: '5 Apr', field: 'd5', width: 70, align: 'right' as const },
      ],
    },
    {
      id: 'week2', label: 'Week 2',
      children: [
        { id: 'd8',  label: '8 Apr',  field: 'd8',  width: 70, align: 'right' as const },
        { id: 'd9',  label: '9 Apr',  field: 'd9',  width: 70, align: 'right' as const },
        { id: 'd10', label: '10 Apr', field: 'd10', width: 70, align: 'right' as const },
      ],
    },
    // Standalone column — spans both header rows (rowspan=2)
    { id: 'stock', label: 'Total', field: 'stock', width: 90, align: 'right' as const },
  ];

  const renderHeaderEngineColumns: ColumnDef<InventoryRow>[] = [
    {
      id: 'product', label: 'Product', field: 'product', width: 200, pinned: 'left', sortable: true,
      renderHeader: (col, engine) => {
        const sorted = engine?.sortState.columnId === col.id;
        return (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {col.label}
            {sorted && (
              <span style={{
                fontSize: 9, padding: '1px 5px', borderRadius: 3,
                background: '#dbeafe', color: '#1d4ed8', fontWeight: 700,
              }}>
                {engine?.sortState.direction?.toUpperCase()}
              </span>
            )}
          </span>
        );
      },
    },
    {
      id: 'stock', label: 'Stock', field: 'stock', width: 100, align: 'right' as const, sortable: true,
      renderHeader: (col, engine) => (
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, width: '100%' }}>
          <span style={{
            fontSize: 9, padding: '1px 4px', borderRadius: 3,
            background: isDark ? '#1e2840' : '#f0f4f8',
            color: dim,
          }}>qty</span>
          <span>{col.label}</span>
        </span>
      ),
    },
    {
      id: 'status', label: 'Status', field: 'status', width: 100, sortable: false,
      renderHeader: () => (
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
          Status
        </span>
      ),
    },
    { id: 'dc',      label: 'DC',   field: 'dc',   width: 110, sortable: true },
    { id: 'sold',    label: 'Sold', field: 'sold', width: 80, align: 'right' as const, sortable: true },
  ];

  const customCellColumns: ColumnDef<InventoryRow>[] = [
    { id: 'product', label: 'Product', field: 'product', width: 200, pinned: 'left' },
    {
      id: 'status', label: 'Status', field: 'status', width: 110,
      renderCell: (value) => {
        const v = value as string;
        const map: Record<string, [string, string, string]> = {
          active: ['#dcfce7', '#166534', '#22c55e'],
          low:    ['#fef3c7', '#92400e', '#f59e0b'],
          out:    ['#fee2e2', '#991b1b', '#ef4444'],
        };
        const [bg, fg, dot] = map[v] ?? map['active']!;
        return (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: bg, color: fg, borderRadius: 4,
            padding: '2px 8px', fontSize: 11, fontWeight: 600,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: dot }} />
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </span>
        );
      },
    },
    {
      id: 'channel', label: 'Channel', field: 'channel', width: 90, align: 'center' as const,
      renderCell: (value) => {
        const colors = ['', '#dbeafe:#1d4ed8', '#fef3c7:#92400e', '#dcfce7:#166534'];
        const [bg, fg] = (colors[value as number] ?? colors[1]!).split(':') as [string, string];
        return (
          <span style={{ background: bg, color: fg, borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
            CH{value as number}
          </span>
        );
      },
    },
    {
      id: 'stock', label: 'Stock', field: 'stock', width: 120, align: 'right' as const,
      renderCell: (value) => {
        const v = value as number;
        const pct = Math.min(100, (v / 200) * 100);
        return (
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', justifyContent: 'flex-end' }}>
            <span style={{
              width: 48, height: 5, background: isDark ? '#1e2840' : '#e5e7eb',
              borderRadius: 3, overflow: 'hidden', flexShrink: 0,
            }}>
              <span style={{ display: 'block', width: `${pct}%`, height: '100%', background: '#2563eb', borderRadius: 3 }} />
            </span>
            <span style={{ fontSize: 11, fontFamily: 'monospace', minWidth: 28, textAlign: 'right' }}>{v}</span>
          </span>
        );
      },
    },
    { id: 'sold', label: 'Sold', field: 'sold', width: 80, align: 'right' as const },
  ];

  const colMgrSlot = useCallback(
    ({ engine }: ColumnManagerRenderProps<InventoryRow>) => {
      engineRef.current = engine;
      return null;
    },
    [],
  );

  const colMgrToolbar = useCallback((engine: GridEngine<InventoryRow>) => {
    engineRef.current = engine;
    return (
      <div style={{
        display: 'flex', alignItems: 'center', padding: '6px 12px',
        borderBottom: `1px solid ${bdr}`,
        background: 'var(--vg-bg-toolbar)',
        fontFamily: "'DM Sans', sans-serif", fontSize: 12,
      }}>
        <span style={{ color: 'var(--vg-text-dim)' }}>{engine.visibleColumns.length}/{engine.orderedColumns.length} columns visible</span>
        <div style={{ flex: 1 }} />
        <button onClick={engine.resetColumns} style={{
          background: 'none', border: `1px solid ${bdr}`, borderRadius: 4,
          padding: '2px 8px', fontSize: 11, cursor: 'pointer',
          color: 'var(--vg-text-dim)',
        }}>Reset</button>
      </div>
    );
  }, [bdr]);

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', background: bg, color: txt, ...cssVars }}>

      {/* ── LEFT NAV ────────────────────────────────────────────────────────── */}
      <div style={{
        width: 220, flexShrink: 0, overflow: 'auto',
        background: surf, borderRight: `1px solid ${bdr}`,
        padding: '16px 0',
      }}>
        {NAV.map(group => (
          <div key={group.group} style={{ marginBottom: 12 }}>
            <div style={{
              padding: '6px 16px 4px', fontSize: 10, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '.08em', color: dim,
            }}>
              {group.group}
            </div>
            {group.items.map(item => (
              <a key={item.id} href={`#${item.id}`} style={{
                display: 'block', padding: '4px 16px',
                fontSize: 13, color: dim, textDecoration: 'none',
                transition: 'color .1s',
              }}
                onMouseEnter={e => (e.currentTarget.style.color = txt)}
                onMouseLeave={e => (e.currentTarget.style.color = dim)}
              >
                {item.label}
              </a>
            ))}
          </div>
        ))}
      </div>

      {/* ── MAIN CONTENT ────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflow: 'auto', padding: '36px 48px 100px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>

          {/* ── OVERVIEW ───────────────────────────────────────────────────── */}
          <div id="overview" style={{ marginBottom: 56, scrollMarginTop: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10,
                background: 'linear-gradient(135deg,#2563eb,#7c3aed)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="18" height="18" viewBox="0 0 14 14" fill="none">
                  <rect x="1" y="1" width="5" height="5" rx="1.2" fill="white" opacity=".9"/>
                  <rect x="8" y="1" width="5" height="5" rx="1.2" fill="white" opacity=".55"/>
                  <rect x="1" y="8" width="5" height="5" rx="1.2" fill="white" opacity=".55"/>
                  <rect x="8" y="8" width="5" height="5" rx="1.2" fill="white" opacity=".9"/>
                </svg>
              </div>
              <div>
                <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-.04em', margin: 0, color: txt }}>
                  LatticeGrid
                </h1>
                <span style={{ fontSize: 12, color: dim }}>v2.1 — React data grid</span>
              </div>
            </div>
            <p style={{ fontSize: 15, lineHeight: 1.7, color: dim, maxWidth: 600, marginBottom: 16 }}>
              A high-performance React data grid with row and column virtualisation,
              full TypeScript support, a headless engine, and a deep 6-layer
              customisation API. Handles millions of cells without breaking a sweat.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {[
                'Row virtualisation', 'Column virtualisation', 'Column groups',
                'Column pinning', 'Column resize', 'Drag reorder', 'Show / hide',
                'Auto-freeze', 'Row selection', 'Client & server sort',
                'Custom cell renderers', 'Custom header renderers',
                'Theme tokens', 'Feature flags', 'Custom icons',
                'CSS class names', 'Style overrides', 'Slots',
                'Persistence API', 'Headless engine', 'Zero dependencies',
              ].map(f => (
                <span key={f} style={{
                  padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 500,
                  background: isDark ? '#1e2840' : '#f0f4f8',
                  color: isDark ? '#93c5fd' : '#374151',
                  border: `1px solid ${bdr}`,
                }}>
                  {f}
                </span>
              ))}
            </div>
          </div>

          {/* ── INSTALLATION ───────────────────────────────────────────────── */}
          <Section id="install" title="Installation">
            <Code lang="bash">{`npm install @lattice-grid-lib/core
# yarn
yarn add @lattice-grid-lib/core
# pnpm
pnpm add @lattice-grid-lib/core`}</Code>
            <Callout type="info">Requires React 18 or later. No other runtime dependencies.</Callout>
          </Section>

          {/* ── QUICK START ────────────────────────────────────────────────── */}
          <Section id="quickstart" title="Quick start"
            subtitle="The minimum working setup. Import LatticeGrid, define columns, pass data.">
            <Code>{`import { LatticeGrid } from '@lattice-grid-lib/core';

// 1. Define your row type
interface Product {
  id: number;
  name: string;
  city: string;
  stock: number;
}

// 2. Define columns
const columns = [
  { id: 'name',  label: 'Name',  field: 'name',  width: 200, pinned: 'left' },
  { id: 'city',  label: 'City',  field: 'city',  width: 120 },
  { id: 'stock', label: 'Stock', field: 'stock', width: 90, align: 'right' },
];

// 3. Render
export function MyPage() {
  return (
    <LatticeGrid<Product>
      columns={columns}
      data={rows}
      height={500}
      theme="light"
      getRowId={(row) => row.id}
    />
  );
}`}</Code>
            <LiveGrid height={220} columns={simpleColumns} data={DATA200.slice(0, 40)}
              features={{ toolbar: false, footer: false }} />
          </Section>

          {/* ── COLUMN DEFINITIONS ─────────────────────────────────────────── */}
          <Section id="col-defs" title="Column definitions"
            subtitle="Every property a leaf column supports. All properties except id and label are optional.">
            <Code>{`import type { ColumnDef } from '@lattice-grid-lib/core';

const columns: ColumnDef<MyRow>[] = [
  {
    // ── Identity ──────────────────────────────────────────
    id:    'product',           // required — unique key
    label: 'Product / SKU',     // required — header display text

    // ── Data access ───────────────────────────────────────
    field:    'product',        // key on the row object (defaults to id)
    accessor: (row) => row.price * 1.2,   // custom getter — overrides field

    // ── Layout ────────────────────────────────────────────
    width:    200,              // initial width in px (default 120)
    minWidth: 80,               // minimum resize width (default 40)
    maxWidth: 400,              // maximum resize width (default ∞)
    align:    'right',          // 'left' | 'center' | 'right'

    // ── Pinning / visibility ───────────────────────────────
    pinned: 'left',             // pin on mount: 'left' | 'right'
    hidden: false,              // hide on mount

    // ── Feature overrides (per-column) ────────────────────
    sortable:   true,           // override grid-level features.sort
    resizable:  true,
    draggable:  true,
    hideable:   true,           // show × button on header hover

    // ── Renderers ─────────────────────────────────────────
    renderCell: (value, row) => <strong>{value}</strong>,
    renderHeader: (col, engine) => <span>{col.label} ✦</span>,

    // ── Styles ────────────────────────────────────────────
    cellStyle:   { fontWeight: 600 },
    headerStyle: { fontStyle: 'italic' },
  },
];`}</Code>
            <PropsTable>
              <PropRow prop="id"           type="string"                  def="required" desc="Unique column identifier. Used as React key everywhere." />
              <PropRow prop="label"        type="string"                  def="required" desc="Header display text." />
              <PropRow prop="field"        type="keyof TData"             def="= id"     desc="Row object field key. Falls back to id if omitted." />
              <PropRow prop="accessor"     type="(row: TData) => unknown" def="—"        desc="Custom value getter. Takes precedence over field." />
              <PropRow prop="width"        type="number"                  def="120"      desc="Initial column width in px." />
              <PropRow prop="minWidth"     type="number"                  def="40"       desc="Minimum width when resizing." />
              <PropRow prop="maxWidth"     type="number"                  def="Infinity" desc="Maximum width when resizing." />
              <PropRow prop="align"        type="'left'|'center'|'right'" def="'left'"   desc="Cell content alignment." />
              <PropRow prop="pinned"       type="'left'|'right'"          def="—"        desc="Pin column to left or right on mount." />
              <PropRow prop="hidden"       type="boolean"                 def="false"    desc="Hide column on mount." />
              <PropRow prop="sortable"     type="boolean"                 def="true"     desc="Allow sorting. Overrides grid-level features.sort." />
              <PropRow prop="resizable"    type="boolean"                 def="true"     desc="Show resize handle." />
              <PropRow prop="draggable"    type="boolean"                 def="true"     desc="Allow drag-to-reorder." />
              <PropRow prop="hideable"     type="boolean"                 def="true"     desc="Show × hide button on header hover." />
              <PropRow prop="renderCell"   type="(value, row) => ReactNode" def="—"      desc="Custom cell renderer. See Cell renderers section." />
              <PropRow prop="renderHeader" type="(col, engine) => ReactNode" def="—"     desc="Custom header renderer. See Header renderers section." />
              <PropRow prop="cellStyle"    type="CSSProperties"           def="—"        desc="Inline style applied to every data cell in this column." />
              <PropRow prop="headerStyle"  type="CSSProperties"           def="—"        desc="Inline style applied to this column's header cell." />
            </PropsTable>
          </Section>

          {/* ── COLUMN GROUPS ──────────────────────────────────────────────── */}
          <Section id="col-groups" title="Column groups"
            subtitle="Nest leaf columns under a group header. Groups span the top header row; their children appear in the second row. Columns not in any group span both rows automatically.">
            <Code>{`const columns = [
  // Pinned columns — span both header rows
  { id: 'product', label: 'Product', field: 'product', width: 200, pinned: 'left' },

  // Group column — only renders in the top header row
  {
    id: 'week1',
    label: 'Week 1 — 1–7 Apr 2026',
    children: [
      { id: 'd1', label: '1 Apr', field: 'd1', width: 70, align: 'right' },
      { id: 'd2', label: '2 Apr', field: 'd2', width: 70, align: 'right' },
      { id: 'd3', label: '3 Apr', field: 'd3', width: 70, align: 'right' },
    ],
  },

  // Standalone column — NOT in any group → gets rowspan=2 automatically
  { id: 'total', label: 'Total', field: 'stock', width: 90, align: 'right' },
];`}</Code>
            <LiveGrid height={220} columns={groupedColumns} data={DATA200.slice(0, 30)}
              features={{ toolbar: false, footer: false }} />
            <Callout type="tip">
              Groups are one level deep only. Columns outside any group automatically receive
              rowspan=2 — they span both the group row and the leaf row.
            </Callout>
          </Section>

          {/* ── PINNING ────────────────────────────────────────────────────── */}
          <Section id="col-pinning" title="Column pinning"
            subtitle="Freeze columns to the left or right edge. Pinned columns are rendered in separate overlay layers — they never scroll out of view regardless of horizontal scroll position.">
            <Code>{`// Pin at definition time
{ id: 'name',    label: 'Name',    pinned: 'left'  }
{ id: 'actions', label: 'Actions', pinned: 'right' }

// Pin programmatically via the engine
const engine = useGridEngine(columns);
engine.pinColumn('name', 'left');   // pin to left
engine.pinColumn('name', 'right');  // move to right
engine.pinColumn('name', null);     // unpin

// Users can also pin via the built-in column manager panel.`}</Code>
            <LiveGrid height={220} columns={simpleColumns} data={DATA200.slice(0, 40)}
              features={{ toolbar: false, footer: false }} />
            <Callout type="info">
              Multiple pinned columns stack in order. Their combined width is subtracted from the
              scrollable viewport — virtualisation only applies to the scrollable columns.
            </Callout>
          </Section>

          {/* ── RESIZE ─────────────────────────────────────────────────────── */}
          <Section id="col-resize" title="Column resize"
            subtitle="Drag the handle on the right edge of any header cell to resize. Respects minWidth and maxWidth per column.">
            <Code>{`// Resize is enabled by default. Disable globally:
<LatticeGrid features={{ resize: false }} />

// Disable for a specific column:
{ id: 'id', label: 'ID', resizable: false }

// Constraints per column:
{ id: 'name', label: 'Name', width: 200, minWidth: 80, maxWidth: 500 }

// Callback when user finishes resizing:
<LatticeGrid
  onColumnResize={(columnId, newWidth) => {
    saveUserPreference(columnId, newWidth);
  }}
/>`}</Code>
            <Callout type="tip">
              Use <code>onColumnStateChange</code> to persist all column widths (and visibility, pin, order)
              together in a single call. See the Persistence section.
            </Callout>
          </Section>

          {/* ── DRAG REORDER ───────────────────────────────────────────────── */}
          <Section id="col-reorder" title="Drag reorder"
            subtitle="Drag any column header left or right to change its position. Works across pinned and scrollable columns.">
            <Code>{`// Enabled by default. Disable globally:
<LatticeGrid features={{ reorder: false }} />

// Disable for a specific column:
{ id: 'id', label: 'ID', draggable: false }

// Callback with new order:
<LatticeGrid
  onColumnReorder={(newOrder) => {
    // newOrder = ['product', 'dc', 'channel', ...]  (array of column ids)
    saveColumnOrder(newOrder);
  }}
/>`}</Code>
          </Section>

          {/* ── SHOW / HIDE ────────────────────────────────────────────────── */}
          <Section id="col-hide" title="Show / hide columns"
            subtitle="Hover any column header to reveal the × hide button. Show hidden columns via the column manager panel or programmatically.">
            <Code>{`// Hide button on hover is enabled by default. Disable:
<LatticeGrid features={{ columnHide: false }} />

// Disable for a specific column (can't be hidden):
{ id: 'id', label: 'ID', hideable: false }

// Programmatic toggle:
engine.toggleColumnVisibility('product');
engine.showAllColumns();

// Hide on initial mount:
{ id: 'internal', label: 'Internal', hidden: true }`}</Code>
            <LiveGrid height={220} columns={simpleColumns} data={DATA200.slice(0, 40)}
              features={{ footer: false }} />
          </Section>

          {/* ── AUTO-FREEZE ────────────────────────────────────────────────── */}
          <Section id="col-freeze" title="Auto-freeze column"
            subtitle="Specify a column that visually freezes when it scrolls behind the pinned-left band. The engine state is never mutated — virtualisation is completely unaffected.">
            <Code>{`// Pass the id of the column you want to auto-freeze
<LatticeGrid
  freezeColId="dc"   // 'dc' column freezes as you scroll right
/>

// How it works:
// When scrollLeft > offset[freezeColId], the column is rendered
// in a visual overlay slot at the right edge of the pinned band.
// The original column still exists in the scrollable area.
// When you scroll back left, it disappears from the slot seamlessly.`}</Code>
            <LiveGrid height={220} columns={simpleColumns} data={DATA200.slice(0, 40)}
              freezeColId="dc" features={{ footer: false }} />
            <Callout type="info">
              Only scrollable (non-pinned) columns can be auto-frozen.
              The frozen slot uses the <code>--vg-bg-frozen</code> token for background colour.
            </Callout>
          </Section>

          {/* ── COLUMN MANAGER ─────────────────────────────────────────────── */}
          <Section id="col-manager" title="Column manager"
            subtitle="The column manager panel lets users show/hide and pin columns. It can be placed anywhere — built-in toolbar dropdown, sidebar, drawer, modal, or any custom location.">

            <SubSection title="Built-in (default)">
              <p style={{ fontSize: 13, color: dim, marginBottom: 8, lineHeight: 1.6 }}>
                By default the Columns button in the toolbar opens a dropdown panel.
                No configuration needed.
              </p>
              <LiveGrid height={220} columns={simpleColumns} data={DATA200.slice(0, 40)} />
            </SubSection>

            <SubSection title="Custom placement with slots.columnManager">
              <p style={{ fontSize: 13, color: dim, marginBottom: 8, lineHeight: 1.6 }}>
                Use <code>slots.columnManager</code> to render the panel wherever you want.
                The slot receives <code>engine</code> and <code>onClose</code>.
              </p>
              <Code>{`// PATTERN: capture engine and render panel outside the grid
const engineRef = useRef(null);

// 1. Capture engine via slots.toolbar OR slots.columnManager
slots={{
  // columnManager slot fires when the built-in button is clicked
  columnManager: ({ engine, onClose }) => {
    engineRef.current = engine;
    return null; // return null — we render the panel ourselves
  },
  toolbar: (engine) => {
    engineRef.current = engine; // or capture from toolbar slot
    return <MyToolbar engine={engine} />;
  },
}}

// 2. Render the panel ANYWHERE in your app
<aside className="sidebar">
  {engineRef.current && (
    <MyColumnPanel
      engine={engineRef.current}
      onClose={() => setOpen(false)}
    />
  )}
</aside>

// 3. Build the panel using engine actions
function MyColumnPanel({ engine, onClose }) {
  const { orderedColumns, toggleColumnVisibility, pinColumn } = engine;
  return (
    <div>
      {orderedColumns.map(col => (
        <label key={col.id}>
          <input
            type="checkbox"
            checked={!col.hidden}
            onChange={() => toggleColumnVisibility(col.id)}
          />
          {col.label}
        </label>
      ))}
    </div>
  );
}`}</Code>

              {/* Live demo: column manager in a sidebar */}
              <div style={{ display: 'flex', gap: 10, height: 260, margin: '12px 0' }}>
                <div style={{ flex: 1, overflow: 'hidden', borderRadius: 8, border: `1px solid ${bdr}` }}>
                  <LatticeGrid<InventoryRow>
                    columns={simpleColumns}
                    data={DATA200.slice(0, 40)}
                    height={260}
                    theme={isDark ? 'dark' : 'light'}
                    rowHeight={34}
                    headerHeight={36}
                    getRowId={r => r.id}
                    slots={{ toolbar: colMgrToolbar, columnManager: colMgrSlot }}
                    features={{ toolbar: true, footer: false }}
                  />
                </div>
                <div style={{
                  width: 180, flexShrink: 0,
                  border: `1px solid ${bdr}`, borderRadius: 8,
                  overflow: 'auto', background: surf,
                  fontSize: 12,
                }}>
                  <div style={{ padding: '8px 12px', borderBottom: `1px solid ${bdr}`, fontWeight: 700, color: txt, fontSize: 11 }}>
                    Column panel (sidebar)
                  </div>
                  <ExternalColPanel engineRef={engineRef} isDark={isDark} />
                </div>
              </div>
            </SubSection>
          </Section>

          {/* ── SORTING ────────────────────────────────────────────────────── */}
          <Section id="sorting" title="Client-side sorting"
            subtitle="Click any sortable column header to sort. Cycles through: ascending → descending → unsorted.">
            <Code>{`// Sorting is enabled by default on all columns.
// Disable globally:
<LatticeGrid features={{ sort: false }} />

// Disable on a specific column:
{ id: 'actions', label: 'Actions', sortable: false }

// Callback when sort changes:
<LatticeGrid
  onSortChange={({ columnId, direction }) => {
    console.log(columnId, direction); // 'stock', 'desc'
  }}
/>`}</Code>
            <LiveGrid height={220} columns={simpleColumns} data={DATA200.slice(0, 40)}
              onSortChange={(s: SortState) => setSortLog(`Sorted: ${s.columnId ?? 'none'} ${s.direction}`)}
              features={{ footer: false }} />
            <div style={{
              padding: '6px 12px', borderRadius: 6, fontSize: 11,
              background: isDark ? '#0a1420' : '#f0f4f8',
              fontFamily: 'monospace', color: isDark ? '#4ade80' : '#16a34a',
              marginTop: 8,
            }}>
              {sortLog}
            </div>
          </Section>

          {/* ── SERVER-SIDE SORT ───────────────────────────────────────────── */}
          <Section id="server-sort" title="Server-side sort & pagination"
            badge={{ text: 'sortMode="server"', color: '#2563eb' }}
            subtitle="When sortMode is 'server', the grid skips all internal sorting and renders data exactly as received. Your onSortChange handler fetches the sorted page from your API.">
            <Code>{`function ServerGrid() {
  const [data, setData]       = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage]       = useState(1);

  const fetchPage = async (sort: SortState, page: number) => {
    setLoading(true);
    const result = await api.get('/rows', {
      params: {
        sortBy:    sort.columnId,
        sortDir:   sort.direction,
        page,
        pageSize:  100,
      },
    });
    setData(result.rows);
    setLoading(false);
  };

  return (
    <LatticeGrid
      sortMode="server"        // ← disable internal sort
      data={data}              // ← your pre-sorted server data
      loading={loading}        // ← show spinner while fetching
      onSortChange={(sort) => {
        setPage(1);
        fetchPage(sort, 1);    // ← your API call
      }}
      slots={{
        footer: ({ startRow, endRow, totalRows }) => (
          <div>
            {startRow}–{endRow} of {totalRows}
            <button onClick={() => setPage(p => p - 1)}>Prev</button>
            <button onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        ),
      }}
    />
  );
}`}</Code>

            {/* Live demo */}
            <div style={{
              padding: '8px 12px', borderRadius: 6, fontSize: 11,
              background: isDark ? '#0a1420' : '#f0f4f8',
              fontFamily: 'monospace', color: isDark ? '#4ade80' : '#16a34a',
              margin: '8px 0',
            }}>
              {sortLog}
            </div>
            <div style={{ borderRadius: 8, overflow: 'hidden', border: `1px solid ${bdr}` }}>
              <LatticeGrid<InventoryRow>
                columns={simpleColumns}
                data={serverData}
                height={220}
                theme={isDark ? 'dark' : 'light'}
                rowHeight={34}
                headerHeight={36}
                getRowId={r => r.id}
                sortMode="server"
                loading={serverLoading}
                onSortChange={handleServerSort}
                features={{ toolbar: false, footer: false }}
              />
            </div>
            <Callout type="tip">
              With server-side sort you typically also do server-side pagination.
              Pass each page of results as <code>data</code> — the grid renders it as-is.
              The footer's <code>startRow</code>/<code>endRow</code> will reflect the current page slice.
            </Callout>
          </Section>

          {/* ── ROW SELECTION ──────────────────────────────────────────────── */}
          <Section id="row-select" title="Row selection"
            subtitle="Click any row — pinned or scrollable — to select it. The same highlight is applied across the entire row. Click again to deselect.">
            <Code>{`// Row selection is enabled by default.
<LatticeGrid
  features={{ rowSelection: true }}
  onRowClick={(row, index) => {
    console.log('selected:', row, 'at index', index);
  }}
/>

// Customise selected row appearance:
<LatticeGrid
  theme={{ '--vg-bg-row-selected': '#fef9c3' }}
  styles={{ rowSelected: { fontWeight: 600 } }}
  classNames={{ rowSelected: 'my-selected-row' }}
/>

// Disable if you only want onClick without highlight:
<LatticeGrid features={{ rowSelection: false }} onRowClick={handler} />`}</Code>
            <LiveGrid height={220} columns={simpleColumns} data={DATA200.slice(0, 40)}
              features={{ footer: false }}
              onRowClick={() => {}} />
          </Section>

          {/* ── CELL RENDERERS ─────────────────────────────────────────────── */}
          <Section id="cell-render" title="Cell renderers"
            subtitle="Replace the default cell content with any React element. The renderer receives the cell value and the full row object.">
            <Code>{`const columns = [
  {
    id: 'status',
    renderCell: (value, row) => {
      const colors = { active: '#22c55e', low: '#f59e0b', out: '#ef4444' };
      return (
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          background: colors[value] + '22', color: colors[value],
          borderRadius: 4, padding: '2px 8px', fontWeight: 600,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: colors[value] }} />
          {value}
        </span>
      );
    },
  },
  {
    id: 'stock',
    accessor: (row) => row.stock,     // can use accessor too
    renderCell: (value) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 40, height: 4, background: '#e5e7eb', borderRadius: 2 }}>
          <div style={{ width: value / 2 + '%', height: '100%', background: '#2563eb' }} />
        </div>
        <span>{value}</span>
      </div>
    ),
  },
];`}</Code>
            <LiveGrid height={220} columns={customCellColumns} data={DATA200.slice(0, 40)}
              features={{ toolbar: false, footer: false }} />
          </Section>

          {/* ── HEADER RENDERERS ───────────────────────────────────────────── */}
          <Section id="header-render" title="Header renderers"
            subtitle="Replace the default header label with any React element. The renderer receives the resolved column and the full grid engine — so you can show sort state, render filter inputs, or fire any engine action.">
            <Code>{`const columns = [
  {
    id: 'product',
    label: 'Product',
    sortable: true,
    // col  = ResolvedColumn (id, label, width, sortable, …)
    // engine = GridEngine  (sortState, toggleSort, pinColumn, …)
    renderHeader: (col, engine) => {
      const sorted = engine?.sortState.columnId === col.id;
      const dir    = engine?.sortState.direction;
      return (
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {col.label}
          {sorted && (
            <span style={{ fontSize: 9, background: '#dbeafe', color: '#1d4ed8',
                           borderRadius: 3, padding: '1px 5px', fontWeight: 700 }}>
              {dir === 'asc' ? '↑ ASC' : '↓ DESC'}
            </span>
          )}
        </span>
      );
    },
  },

  // Filter input in header
  {
    id: 'status',
    renderHeader: (col, engine) => (
      <div onClick={(e) => e.stopPropagation()}>
        <input
          placeholder="Filter…"
          style={{ width: '100%', border: 'none', background: 'transparent' }}
          onChange={(e) => applyFilter(col.id, e.target.value)}
        />
      </div>
    ),
  },
];`}</Code>
            <LiveGrid height={220} columns={renderHeaderEngineColumns} data={DATA200.slice(0, 40)}
              features={{ toolbar: false, footer: false }} />
          </Section>

          {/* ── THEMING ────────────────────────────────────────────────────── */}
          <Section id="theming" title="Theming & tokens"
            subtitle="Every visual detail is a CSS variable. Choose a preset or override any token. All tokens are prefixed --vg-.">

            <SubSection title="Presets">
              <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                {(['light', 'dark', 'ocean', 'forest', 'sunset'] as ThemePreset[]).map(t => (
                  <button key={t} onClick={() => setActiveTheme(t)} style={{
                    padding: '5px 12px', borderRadius: 5, fontWeight: 600, fontSize: 12,
                    border: `1.5px solid ${activeTheme === t ? '#2563eb' : bdr}`,
                    background: activeTheme === t ? (isDark ? '#1e3558' : '#dbeafe') : surf,
                    color: activeTheme === t ? '#2563eb' : dim,
                    cursor: 'pointer',
                  }}>{t}</button>
                ))}
              </div>
              <LiveGrid height={200} theme={activeTheme} columns={simpleColumns}
                data={DATA200.slice(0, 25)} features={{ footer: false }} />
            </SubSection>

            <SubSection title="Token overrides">
              <Code>{`// Option 1 — named preset
<LatticeGrid theme="dark" />

// Option 2 — partial override (merges on top of 'light')
<LatticeGrid
  theme={{
    '--vg-accent':          '#7c3aed',
    '--vg-accent-bg':       '#ede9fe',
    '--vg-bg-row-selected': '#ede9fe',
    '--vg-radius':          '2px',
    '--vg-font-size':       '13px',
    '--vg-font':            "'Inter', sans-serif",
  }}
/>

// Option 3 — start from a preset and override
import { GRID_THEMES } from '@lattice-grid-lib/core';

<LatticeGrid
  theme={{ ...GRID_THEMES.dark, '--vg-accent': '#a855f7' }}
/>`}</Code>
            </SubSection>
          </Section>

          {/* ── FEATURE FLAGS ──────────────────────────────────────────────── */}
          <Section id="features" title="Feature flags"
            subtitle="Turn individual capabilities on or off. All default to true. Per-column sortable/resizable/draggable/hideable override the grid-level flags.">
            <Code>{`<LatticeGrid
  features={{
    sort:          true,    // header click to sort (asc → desc → clear)
    resize:        true,    // drag resize handle on column headers
    reorder:       true,    // drag-and-drop column reorder
    columnHide:    true,    // × button on header hover
    columnPin:     true,    // pin option shown in column manager panel
    alternateRows: true,    // zebra-stripe alternating rows
    toolbar:       true,    // show built-in toolbar
    footer:        true,    // show built-in footer
    rowSelection:  true,    // click row to highlight it
  }}
/>`}</Code>
            <PropsTable>
              <PropRow prop="sort"          type="boolean" def="true" desc="Column sort on header click. Cycles asc → desc → none." />
              <PropRow prop="resize"        type="boolean" def="true" desc="Drag handle on right edge of header cell." />
              <PropRow prop="reorder"       type="boolean" def="true" desc="Drag column header to reorder." />
              <PropRow prop="columnHide"    type="boolean" def="true" desc="Hover header to reveal × hide button." />
              <PropRow prop="columnPin"     type="boolean" def="true" desc="Pin option shown in column manager." />
              <PropRow prop="alternateRows" type="boolean" def="true" desc="Zebra-stripe alternating row backgrounds." />
              <PropRow prop="toolbar"       type="boolean" def="true" desc="Show built-in toolbar. Set false when using slots.toolbar." />
              <PropRow prop="footer"        type="boolean" def="true" desc="Show built-in footer. Set false when using slots.footer." />
              <PropRow prop="rowSelection"  type="boolean" def="true" desc="Click a row to highlight it. Click again to deselect." />
            </PropsTable>
          </Section>

          {/* ── ICONS ──────────────────────────────────────────────────────── */}
          <Section id="icons" title="Icons"
            subtitle="Replace any built-in SVG icon with your own ReactNode. Works with any icon library, inline SVG, or emoji.">
            <Code>{`import { ChevronUp, ChevronDown, EyeOff, Columns } from 'lucide-react';

<LatticeGrid
  icons={{
    sortAsc:      <ChevronUp size={10} />,
    sortDesc:     <ChevronDown size={10} />,
    sortNone:     <span style={{ opacity: 0.3 }}>⇅</span>,
    hideColumn:   <EyeOff size={10} />,
    columnsPanel: <Columns size={13} />,
  }}
/>`}</Code>
            <PropsTable>
              <PropRow prop="sortAsc"       type="ReactNode" def="SVG ▲" desc="Icon on active ascending sort column." />
              <PropRow prop="sortDesc"      type="ReactNode" def="SVG ▼" desc="Icon on active descending sort column." />
              <PropRow prop="sortNone"      type="ReactNode" def="⇅"     desc="Icon on sortable but unsorted columns." />
              <PropRow prop="hideColumn"    type="ReactNode" def="SVG ×" desc="Icon for the hide-column button in header." />
              <PropRow prop="columnsPanel"  type="ReactNode" def="SVG"   desc="Icon for the Columns toolbar button." />
            </PropsTable>
          </Section>

          {/* ── CLASS NAMES ────────────────────────────────────────────────── */}
          <Section id="classnames" title="CSS class names"
            subtitle="Inject your own CSS classes on any grid region. Target them from your own stylesheet.">
            <Code lang="css">{`/* your-grid.css */
.my-grid           { box-shadow: 0 4px 24px rgba(0,0,0,.08); }
.my-header         { text-transform: uppercase; letter-spacing: .06em; }
.my-row            { transition: background .08s; }
.my-row-selected   { background: #fef9c3 !important; font-weight: 600; }
.my-cell           { font-variant-numeric: tabular-nums; }
.my-footer         { font-style: italic; }`}</Code>
            <Code>{`<LatticeGrid
  classNames={{
    root:         'my-grid',
    toolbar:      'my-toolbar',
    headerRow:    'my-header-row',
    groupRow:     'my-group-row',
    headerCell:   'my-header',
    groupHeaderCell: 'my-group-header',
    row:          'my-row',
    rowSelected:  'my-row-selected',
    cell:         'my-cell',
    pinnedCell:   'my-pinned-cell',
    footer:       'my-footer',
    columnPanel:  'my-col-panel',
  }}
/>`}</Code>
          </Section>

          {/* ── STYLE OVERRIDES ────────────────────────────────────────────── */}
          <Section id="styles" title="Style overrides"
            subtitle="Apply CSSProperties directly to any grid region. Applied on top of token styles. Use when you need structural changes beyond what tokens offer.">
            <Code>{`<LatticeGrid
  styles={{
    root:           { borderRadius: 0, border: 'none' },
    toolbar:        { padding: '10px 16px' },
    headerRow:      { fontFamily: 'monospace', letterSpacing: '.04em' },
    groupRow:       { background: '#1e3a8a', color: '#fff' },
    headerCell:     { textTransform: 'uppercase', fontSize: 11 },
    groupHeaderCell:{ fontStyle: 'italic' },   // only grouped leaf headers
    row:            { borderBottom: '1px solid #f0f0f0' },
    rowSelected:    { background: '#fef9c3', fontWeight: 600 },
    cell:           { borderRight: 'none' },
    pinnedCell:     { background: '#f8fafc' },
    footer:         { justifyContent: 'flex-start' },
  }}
/>`}</Code>
          </Section>

          {/* ── SLOTS ──────────────────────────────────────────────────────── */}
          <Section id="slots" title="Slots"
            subtitle="Replace entire UI sections with your own components. Every slot receives the grid engine so your component is fully interactive.">
            <Code>{`<LatticeGrid
  slots={{
    // Replace entire toolbar — engine gives full control
    toolbar: (engine) => (
      <div className="my-toolbar">
        <span>{engine.visibleColumns.length}/{engine.orderedColumns.length} cols</span>
        <button onClick={engine.resetColumns}>Reset</button>
        <button onClick={engine.showAllColumns}>Show all</button>
      </div>
    ),

    // Or just replace left / right sections
    toolbarLeft:  <span>Inventory · April 2026</span>,
    toolbarRight: <button onClick={exportCSV}>Export CSV</button>,

    // Replace column manager — render it anywhere (sidebar, drawer, modal)
    columnManager: ({ engine, onClose }) => (
      <MySidebar engine={engine} onClose={onClose} />
    ),

    // Replace footer
    footer: ({ startRow, endRow, totalRows, visibleCols, totalCols }) => (
      <MyFooter start={startRow} end={endRow} total={totalRows} />
    ),

    // Custom empty state
    emptyState: (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <p>No results. Try adjusting your filters.</p>
      </div>
    ),

    // Custom loading overlay — shown when loading={true}
    loadingOverlay: <MySpinner />,
  }}
  loading={isFetching}
/>`}</Code>
            <PropsTable>
              <PropRow prop="toolbar"        type="(engine) => ReactNode"         def="—" desc="Completely replaces the toolbar. Receives full engine." />
              <PropRow prop="toolbarLeft"    type="ReactNode"                     def="—" desc="Replaces left section of built-in toolbar." />
              <PropRow prop="toolbarRight"   type="ReactNode"                     def="—" desc="Replaces right section of built-in toolbar." />
              <PropRow prop="columnManager"  type="({engine,onClose})=>ReactNode" def="—" desc="Replaces column manager panel. Return null to suppress popup." />
              <PropRow prop="footer"         type="(props) => ReactNode"          def="—" desc="Replaces footer. Receives row range + col count." />
              <PropRow prop="emptyState"     type="ReactNode"                     def="—" desc="Shown when data array is empty." />
              <PropRow prop="loadingOverlay" type="ReactNode"                     def="—" desc="Shown when loading prop is true." />
            </PropsTable>
          </Section>

          {/* ── PERSISTENCE ────────────────────────────────────────────────── */}
          <Section id="persistence" title="Persistence"
            badge={{ text: 'onColumnStateChange', color: '#16a34a' }}
            subtitle="Save column layout to your API whenever the user changes it. Restore on next visit by applying the saved state on mount.">
            <Code>{`import { type ColumnState } from '@lattice-grid-lib/core';

// ColumnState shape:
// { id: string, hidden: boolean, pinned: PinSide|null, width: number, order: number }

function MyGrid() {
  // Restore saved state on mount
  const initialState = useMemo(() => {
    const raw = localStorage.getItem('grid-prefs');
    return raw ? JSON.parse(raw) as ColumnState[] : undefined;
  }, []);

  // Save on every change (debounce in production)
  const handleStateChange = useCallback((state: ColumnState[]) => {
    localStorage.setItem('grid-prefs', JSON.stringify(state));
    // Or call your API:
    // await api.post('/user/grid-prefs', { columns: state });
  }, []);

  return (
    <LatticeGrid
      columns={columns}
      data={data}
      onColumnStateChange={handleStateChange}
    />
  );
}`}</Code>
            <Callout type="tip">
              <code>onColumnStateChange</code> fires after every hide, pin, resize, or reorder.
              Debounce the API call (e.g. 800ms) to avoid hammering your server during resize drags.
            </Callout>

            {/* Live demo */}
            <LiveGrid height={220} columns={simpleColumns} data={DATA200.slice(0, 40)}
              onColumnStateChange={handlePersist}
              features={{ footer: false }} />
            {persistLog && (
              <div style={{
                padding: '6px 12px', borderRadius: 6, fontSize: 11, marginTop: 6,
                background: isDark ? '#052e16' : '#f0fdf4',
                color: isDark ? '#4ade80' : '#16a34a',
                fontFamily: 'monospace',
              }}>
                ✓ {persistLog}
              </div>
            )}

            <SubSection title="Restoring state">
              <p style={{ fontSize: 13, color: dim, lineHeight: 1.6, marginBottom: 8 }}>
                The grid engine currently applies initial column state from the column definitions.
                To restore saved state, apply it in a <code>useEffect</code> after mount using the engine:
              </p>
              <Code>{`function MyGrid({ columns, data }) {
  const engine = useGridEngine(columns);

  // Restore saved column state on mount
  useEffect(() => {
    const raw = localStorage.getItem('grid-prefs');
    if (!raw) return;
    const saved: ColumnState[] = JSON.parse(raw);

    // Apply saved state to each column
    saved.forEach(({ id, hidden, pinned, width }) => {
      const col = engine.orderedColumns.find(c => c.id === id);
      if (!col) return;
      if (col.hidden !== hidden) engine.toggleColumnVisibility(id);
      if (col.pinned !== pinned) engine.pinColumn(id, pinned);
      if (col.width  !== width)  engine.setColumnWidth(id, width);
    });

    // Restore column order
    const ordered = [...saved].sort((a, b) => a.order - b.order);
    ordered.forEach((s, i) => {
      if (engine.orderedColumns[i]?.id !== s.id) {
        engine.moveColumnBefore(s.id, engine.orderedColumns[i]?.id ?? '');
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Render your grid using the engine
  // ...
}`}</Code>
            </SubSection>
          </Section>

          {/* ── HEADLESS API ───────────────────────────────────────────────── */}
          <Section id="headless" title="Headless API"
            subtitle="Use just the engine to build a completely custom grid UI. Zero default rendering — you own every pixel.">
            <Code>{`import {
  useGridEngine,
  useVirtualRows,
  useVirtualCols,
  buildColumnOffsets,
  calcColWindow,
} from '@lattice-grid-lib/core';

function MyCustomGrid({ columns, data }) {
  const engine = useGridEngine(columns);
  const {
    pinnedLeftColumns,
    scrollableColumns,
    pinnedLeftWidth,
    sortState, toggleSort,
    resizeColumn, pinColumn,
    toggleColumnVisibility,
    moveColumnBefore,
    resetColumns,
  } = engine;

  const [scrollTop,  setScrollTop]  = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Column geometry
  const offsets      = buildColumnOffsets(scrollableColumns);
  const colWidths    = scrollableColumns.map(c => c.width);
  const totalScrollW = colWidths.reduce((s, w) => s + w, 0);

  // Row virtualisation
  const vRows = useVirtualRows({
    rowCount:       data.length,
    rowHeight:      36,
    scrollTop,
    viewportHeight: 400,
  });

  // Column virtualisation
  const bandScroll   = Math.max(0, scrollLeft - pinnedLeftWidth);
  const vCols        = calcColWindow(offsets, colWidths, bandScroll, 800);

  return (
    <div
      onScroll={e => {
        setScrollTop(e.currentTarget.scrollTop);
        setScrollLeft(e.currentTarget.scrollLeft);
      }}
      style={{ height: 400, overflow: 'auto' }}
    >
      {/* Your completely custom header and rows */}
    </div>
  );
}`}</Code>
          </Section>

          {/* ── HOOKS ──────────────────────────────────────────────────────── */}
          <Section id="hooks" title="Hooks reference"
            subtitle="All hooks are exported individually so you can compose only what you need.">

            <SubSection title="useGridEngine">
              <Code>{`const engine = useGridEngine(columns);
// State
engine.orderedColumns      // all leaf columns in display order
engine.visibleColumns      // non-hidden columns only
engine.pinnedLeftColumns   // pinned-left columns
engine.pinnedRightColumns  // pinned-right columns
engine.scrollableColumns   // non-pinned columns
engine.pinnedLeftWidth     // total pinned-left width in px
engine.sortState           // { columnId: string|null, direction: 'asc'|'desc' }
engine.hasGroups           // true if any group columns defined
// Actions
engine.toggleSort(id)
engine.resizeColumn(id, deltaPx)
engine.setColumnWidth(id, px)
engine.pinColumn(id, 'left'|'right'|null)
engine.toggleColumnVisibility(id)
engine.showAllColumns()
engine.moveColumnBefore(sourceId, targetId)
engine.resetColumns()`}</Code>
            </SubSection>

            <SubSection title="useVirtualRows">
              <Code>{`const vRows = useVirtualRows({
  rowCount:       data.length,  // total number of rows
  rowHeight:      36,           // fixed height per row (px)
  scrollTop:      scrollTop,    // current scroll position
  viewportHeight: 400,          // visible area height (px)
});

vRows.startIndex  // first row index to render
vRows.endIndex    // last row index to render
vRows.totalHeight // total canvas height (rowCount × rowHeight)`}</Code>
            </SubSection>

            <SubSection title="calcColWindow / useVirtualCols">
              <Code>{`import { calcColWindow, buildColumnOffsets } from '@lattice-grid-lib/core';

const offsets = buildColumnOffsets(scrollableColumns);
const widths  = scrollableColumns.map(c => c.width);

// Call synchronously in a scroll handler — no React state lag
const { startIndex, endIndex } = calcColWindow(
  offsets,
  widths,
  bandScroll,    // scrollLeft - pinnedLeftWidth
  viewportWidth, // visible area width (px)
);`}</Code>
            </SubSection>

            <SubSection title="useRowSelection">
              <Code>{`import { useRowSelection } from '@lattice-grid-lib/core';

const sel = useRowSelection({
  data,
  getRowId: (r) => r.id,
  mode: 'multi',           // 'single' | 'multi'
  onSelectionChange: (ids, rows) => console.log(ids),
});

sel.selectedIds      // Set<RowId>
sel.selectedRows     // TData[]
sel.allSelected      // boolean
sel.someSelected     // boolean (for indeterminate checkbox state)
sel.isSelected(id)   // boolean
sel.toggleRow(id)
sel.selectAll()
sel.clearSelection()
// shift+click range selection:
sel.handleRowClick(row, index, event)`}</Code>
            </SubSection>

            <SubSection title="useColumnFilter">
              <Code>{`import { useColumnFilter } from '@lattice-grid-lib/core';

const filter = useColumnFilter({ data, columns: leafColumns });

filter.filteredData       // TData[] — filtered subset to pass as data
filter.filterValues       // Record<colId, string>
filter.activeFilterCount
filter.isFiltered
filter.setFilter(colId, value)
filter.clearFilter(colId)
filter.clearAllFilters()

// Custom matcher (e.g. numeric >=)
useColumnFilter({
  data, columns,
  matchers: {
    stock: (cellValue, filterValue) =>
      Number(cellValue) >= Number(filterValue),
  },
})`}</Code>
            </SubSection>

            <SubSection title="useGridPagination">
              <Code>{`import { useGridPagination, GridPagination } from '@lattice-grid-lib/core';

// Client-side
const page = useGridPagination({ data: allRows, pageSize: 100 });

<LatticeGrid data={page.pageData} />
<GridPagination {...page} />

// Server-side
const page = useGridPagination({ totalRows: 50_000, pageSize: 100 });
useEffect(() => fetchPage(page.currentPage, page.pageSize), [page.currentPage]);

page.currentPage   page.pageCount   page.totalRows
page.canGoPrev     page.canGoNext
page.nextPage()    page.prevPage()
page.goToPage(n)   page.firstPage()  page.lastPage()
page.setPageSize(n)`}</Code>
            </SubSection>

            <SubSection title="useGridExport">
              <Code>{`import { useGridExport } from '@lattice-grid-lib/core';

const exporter = useGridExport({
  data:    sortedFilteredData,
  columns: visibleResolvedColumns,
});

exporter.exportCSV('inventory.csv');    // triggers browser download
exporter.exportJSON('inventory.json');
exporter.getCSVString();                // returns string (no download)
exporter.getJSONString();`}</Code>
            </SubSection>
          </Section>

          {/* ── VIRTUALISATION ─────────────────────────────────────────────── */}
          <Section id="virtualisation" title="How virtualisation works"
            subtitle="Understanding the rendering architecture helps when building custom grids or debugging performance.">
            <p style={{ fontSize: 13, lineHeight: 1.8, color: dim, marginBottom: 12 }}>
              LatticeGrid uses a <strong style={{ color: txt }}>two-layer rendering model</strong>:
            </p>
            <Code lang="text">{`grid-root  (overflow: hidden, flex column)
  toolbar
  body-wrap  (position: relative, overflow: hidden)
    │
    ├── scroll-area  (position: absolute, overflow: auto)
    │     Contains the full virtual canvas (width × height).
    │     Header is position:sticky top:0 inside it — scrolls
    │     horizontally with content, pins vertically.
    │     Only SCROLLABLE columns are rendered here.
    │
    ├── pin-left-layer  (position: absolute, left: 0)
    │     Header: position:absolute top:0 — always visible, no sticky needed.
    │     Body:   transform:translateY(-scrollTop) — synced to scroll area.
    │             Updated via direct DOM ref (same frame as scroll event).
    │
    └── pin-right-layer  (position: absolute, right: 0)
          Same structure as pin-left-layer.
  footer`}</Code>
            <p style={{ fontSize: 13, lineHeight: 1.8, color: dim, margin: '12px 0' }}>
              <strong style={{ color: txt }}>Row virtualisation</strong> — only the rows in the visible
              vertical window (plus overscan) are rendered. Each row is{' '}
              <code>position: absolute</code> at <code>top = index × rowHeight</code>.
            </p>
            <p style={{ fontSize: 13, lineHeight: 1.8, color: dim, marginBottom: 12 }}>
              <strong style={{ color: txt }}>Column virtualisation</strong> — only the scrollable columns
              in the visible horizontal window are rendered. The window is computed synchronously
              from a DOM ref (not React state) so there is no 1-frame lag during fast horizontal scroll.
              Pinned columns are always rendered — they are typically 2–5 columns.
            </p>
            <Callout type="info">
              Overscan is 8 rows vertically and 500px horizontally. This means columns up to 500px
              outside the visible area are pre-rendered, preventing blank flicker during fast scroll.
            </Callout>
          </Section>

          {/* ── PROPS REFERENCE ────────────────────────────────────────────── */}
          <Section id="ref-props" title="Props reference"
            subtitle="Every prop the LatticeGrid component accepts.">
            <PropsTable>
              <PropRow prop="columns"              type="ColumnDef<TData>[]"        def="required"   desc="Column definitions array. Supports flat and grouped arrays." />
              <PropRow prop="data"                 type="TData[]"                   def="required"   desc="Row data array." />
              <PropRow prop="getRowId"             type="(row,i)=>string|number"    def="row index"  desc="Stable row key getter. Highly recommended — improves reconciliation." />
              <PropRow prop="height"               type="number"                    def="—"          desc="Fixed grid height in px. If omitted, sizes to content up to maxHeight." />
              <PropRow prop="maxHeight"            type="number"                    def="600"        desc="Maximum height when no fixed height is set." />
              <PropRow prop="rowHeight"            type="number"                    def="36"         desc="Fixed row height in px. All rows are the same height." />
              <PropRow prop="headerHeight"         type="number"                    def="38"         desc="Leaf header row height in px." />
              <PropRow prop="groupHeaderHeight"    type="number"                    def="28"         desc="Group header row height in px." />
              <PropRow prop="theme"                type="ThemePreset | GridTokens"  def="'light'"    desc="Preset name or partial/full CSS variable map." />
              <PropRow prop="features"             type="GridFeatures"              def="all true"   desc="Feature flags object." />
              <PropRow prop="icons"                type="GridIcons"                 def="—"          desc="Custom icon overrides." />
              <PropRow prop="classNames"           type="GridClassNames"            def="—"          desc="CSS class names per grid region." />
              <PropRow prop="styles"               type="GridStyles"                def="—"          desc="Inline CSSProperties per grid region." />
              <PropRow prop="slots"                type="GridSlots<TData>"          def="—"          desc="Render-prop replacements for UI sections." />
              <PropRow prop="freezeColId"          type="string"                    def="—"          desc="Column id to auto-freeze when it scrolls behind the pinned-left band." />
              <PropRow prop="loading"              type="boolean"                   def="false"      desc="Show loading overlay. Customise via slots.loadingOverlay." />
              <PropRow prop="sortMode"             type="'client'|'server'"         def="'client'"   desc="'server' disables internal sort. Data is rendered as-is." />
              <PropRow prop="onRowClick"           type="(row,index)=>void"         def="—"          desc="Called when a row is clicked." />
              <PropRow prop="onSortChange"         type="(sort)=>void"              def="—"          desc="Called when sort state changes." />
              <PropRow prop="onColumnResize"       type="(id,width)=>void"          def="—"          desc="Called when a column finishes resizing." />
              <PropRow prop="onColumnReorder"      type="(order)=>void"             def="—"          desc="Called when columns are drag-reordered." />
              <PropRow prop="onColumnStateChange"  type="(state)=>void"             def="—"          desc="Called on any column layout change. Use for persistence." />
              <PropRow prop="ariaLabel"            type="string"                    def="'Data grid'" desc="aria-label for the grid root element." />
              <PropRow prop="className"            type="string"                    def="—"          desc="CSS class on the grid root element." />
              <PropRow prop="style"                type="CSSProperties"             def="—"          desc="Inline style on the grid root element." />
            </PropsTable>
          </Section>

          {/* ── TOKEN REFERENCE ────────────────────────────────────────────── */}
          <Section id="ref-tokens" title="Token reference"
            subtitle="Every CSS variable the grid uses. Override any via the theme prop.">
            <PropsTable>
              <PropRow prop="--vg-font"            type="font-family" def="'DM Sans', sans-serif"       desc="Primary typeface." />
              <PropRow prop="--vg-font-mono"        type="font-family" def="'JetBrains Mono', monospace" desc="Monospace typeface (footer, numeric cells)." />
              <PropRow prop="--vg-font-size"        type="length"      def="12.5px"                      desc="Base font size." />
              <PropRow prop="--vg-line-height"      type="number"      def="1.45"                        desc="Base line height." />
              <PropRow prop="--vg-radius"           type="length"      def="7px"                         desc="Grid root border-radius." />
              <PropRow prop="--vg-radius-sm"        type="length"      def="4px"                         desc="Smaller radius (buttons, badges)." />
              <PropRow prop="--vg-bg"               type="color"       def="#ffffff"                      desc="Main grid background." />
              <PropRow prop="--vg-bg-header"        type="color"       def="#f7f8fa"                      desc="Header row background." />
              <PropRow prop="--vg-bg-group"         type="color"       def="#f0f2f6"                      desc="Group header background." />
              <PropRow prop="--vg-bg-row-alt"       type="color"       def="#fafbfc"                      desc="Alternating row background." />
              <PropRow prop="--vg-bg-row-hover"     type="color"       def="#f0f5ff"                      desc="Row hover background." />
              <PropRow prop="--vg-bg-row-selected"  type="color"       def="#dbeafe"                      desc="Selected row background." />
              <PropRow prop="--vg-bg-pinned"        type="color"       def="#ffffff"                      desc="Pinned column cell background." />
              <PropRow prop="--vg-bg-frozen"        type="color"       def="#eff6ff"                      desc="Auto-frozen column background." />
              <PropRow prop="--vg-bg-toolbar"       type="color"       def="#ffffff"                      desc="Toolbar and footer background." />
              <PropRow prop="--vg-bg-panel"         type="color"       def="#ffffff"                      desc="Column manager panel background." />
              <PropRow prop="--vg-bg-btn"           type="color"       def="#f3f4f6"                      desc="Button background." />
              <PropRow prop="--vg-bg-btn-hover"     type="color"       def="#e9eaec"                      desc="Button hover background." />
              <PropRow prop="--vg-text"             type="color"       def="#111827"                      desc="Body text colour." />
              <PropRow prop="--vg-text-dim"         type="color"       def="#6b7280"                      desc="Muted/secondary text." />
              <PropRow prop="--vg-text-header"      type="color"       def="#374151"                      desc="Header cell text." />
              <PropRow prop="--vg-text-group"       type="color"       def="#1e2939"                      desc="Group header text." />
              <PropRow prop="--vg-border"           type="color"       def="#e5e7eb"                      desc="Default border." />
              <PropRow prop="--vg-border-strong"    type="color"       def="#d1d5db"                      desc="Emphasis border (header bottom, pinned seam)." />
              <PropRow prop="--vg-accent"           type="color"       def="#2563eb"                      desc="Primary accent colour." />
              <PropRow prop="--vg-accent-bg"        type="color"       def="#dbeafe"                      desc="Accent background tint." />
              <PropRow prop="--vg-accent-text"      type="color"       def="#1d4ed8"                      desc="Text on accent-bg surfaces." />
              <PropRow prop="--vg-accent-fg"        type="color"       def="#ffffff"                      desc="Text on solid accent button." />
              <PropRow prop="--vg-sort-active"      type="color"       def="#2563eb"                      desc="Active sort indicator colour." />
              <PropRow prop="--vg-sort-icon"        type="color"       def="#9ca3af"                      desc="Inactive sort indicator colour." />
              <PropRow prop="--vg-resize-hover"     type="color"       def="#2563eb"                      desc="Resize handle hover colour." />
              <PropRow prop="--vg-shadow-panel"     type="shadow"      def="0 8px 24px rgba(0,0,0,.12)"   desc="Column manager panel drop shadow." />
              <PropRow prop="--vg-scrollbar-thumb"  type="color"       def="#d1d5db"                      desc="Scrollbar thumb colour." />
              <PropRow prop="--vg-scrollbar-track"  type="color"       def="#f1f3f5"                      desc="Scrollbar track colour." />
              <PropRow prop="--vg-transition"       type="duration"    def="0.12s ease"                   desc="Default CSS transition for hover states." />
            </PropsTable>
          </Section>

          {/* ── TYPE REFERENCE ─────────────────────────────────────────────── */}
          <Section id="ref-types" title="Type reference"
            subtitle="All exported TypeScript types.">
            <Code>{`// Core types
import type {
  LatticeGridProps,         // main component props
  ColumnDef,                // LeafColumnDef | GroupColumnDef
  LeafColumnDef,
  GroupColumnDef,
  ResolvedColumn,           // engine output — passed to renderers
  GridEngine,               // engine state + all actions
  SortState,                // { columnId: string|null, direction: 'asc'|'desc' }
  ColumnState,              // { id, hidden, pinned, width, order }
  PinSide,                  // 'left' | 'right'
  SortDirection,            // 'asc' | 'desc'
  ThemePreset,              // 'light'|'dark'|'ocean'|'forest'|'sunset'
  GridTokens,               // Partial<Record<\`--vg-\${string}\`, string>>

  // Customisation
  GridFeatures,
  GridIcons,
  GridClassNames,
  GridStyles,
  GridSlots,
  ColumnManagerRenderProps, // { engine, onClose }

  // Virtualisation
  VirtualRowWindow,
  VirtualColWindow,
} from '@lattice-grid-lib/core';`}</Code>
          </Section>

        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  EXTERNAL COLUMN PANEL (used in column manager demo)
// ─────────────────────────────────────────────────────────────────────────────

function ExternalColPanel({
  engineRef, isDark,
}: {
  engineRef: React.MutableRefObject<GridEngine<InventoryRow> | null>;
  isDark: boolean;
}) {
  const [tick, setTick] = useState(0);
  const dim = isDark ? '#6b7a96' : '#6b7280';
  const txt = isDark ? '#e4e8f0' : '#111827';
  const bdr = isDark ? '#1e2840' : '#e5e7eb';

  // Re-render when engine changes
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 200);
    return () => clearInterval(id);
  }, []);

  const engine = engineRef.current;
  if (!engine) return <div style={{ padding: 12, fontSize: 11, color: dim }}>—</div>;

  const { orderedColumns, toggleColumnVisibility } = engine;

  return (
    <div>
      {orderedColumns.slice(0, 9).map(col => (
        <div key={col.id} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '4px 12px', borderBottom: `1px solid ${bdr}`,
          fontSize: 11,
        }}>
          <input
            type="checkbox" checked={!col.hidden}
            onChange={() => { toggleColumnVisibility(col.id); setTick(t => t + 1); }}
            style={{ accentColor: '#2563eb', cursor: 'pointer', flexShrink: 0 }}
          />
          <span style={{ color: col.hidden ? dim : txt, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {col.label}
          </span>
        </div>
      ))}
    </div>
  );
}