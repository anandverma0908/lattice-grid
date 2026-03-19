// =============================================================================
//  VirtualGrid — Full Documentation Page
// =============================================================================

import React, { useState } from 'react';
import { VirtualGrid, GRID_THEMES, type ThemePreset } from '@virtual-grid/core';
import { generateInventoryData, type InventoryRow } from '../data/inventory';
import { INVENTORY_COLUMNS } from '../data/columns';

const DOCS_DATA = generateInventoryData(500);

// ─── Shared helpers ────────────────────────────────────────────────────────────

function Code({ children }: { children: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', margin: '12px 0' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '7px 14px',
        background: '#161b22', borderBottom: '1px solid #21262d',
      }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: '#8b949e', letterSpacing: '.06em', textTransform: 'uppercase', fontFamily: 'monospace' }}>tsx</span>
        <button
          onClick={async () => { await navigator.clipboard.writeText(children.trim()); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          style={{ background: 'none', border: '1px solid #30363d', borderRadius: 4, padding: '2px 8px', fontSize: 11, color: copied ? '#3fb950' : '#8b949e', cursor: 'pointer', fontFamily: 'sans-serif' }}
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <pre style={{ margin: 0, padding: '14px 16px', background: '#0d1117', color: '#e6edf3', fontSize: 12.5, lineHeight: 1.75, overflow: 'auto', fontFamily: "'JetBrains Mono','Fira Code',monospace" }}>
        <code>{children.trim()}</code>
      </pre>
    </div>
  );
}

function Section({ id, title, subtitle, children }: { id: string; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section id={id} style={{ marginBottom: 56 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: subtitle ? 4 : 16, color: 'inherit' }}>{title}</h2>
      {subtitle && <p style={{ fontSize: 14, color: 'var(--doc-dim)', marginBottom: 16, lineHeight: 1.6 }}>{subtitle}</p>}
      {children}
    </section>
  );
}

function PropRow({ prop, type, def, desc }: { prop: string; type: string; def?: string; desc: string }) {
  return (
    <tr>
      <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontSize: 12, color: '#7c3aed', borderBottom: '1px solid var(--doc-bdr)', whiteSpace: 'nowrap' }}>{prop}</td>
      <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontSize: 11, color: 'var(--doc-dim)', borderBottom: '1px solid var(--doc-bdr)', whiteSpace: 'nowrap' }}>{type}</td>
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
            {['Prop', 'Type', 'Default', 'Description'].map(h => (
              <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--doc-dim)', borderBottom: '1px solid var(--doc-bdr)' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function Badge({ children, color = '#2563eb' }: { children: string; color?: string }) {
  return (
    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: color + '22', color, letterSpacing: '.03em', marginRight: 6 }}>
      {children}
    </span>
  );
}

function LiveGrid({ height = 280, theme = 'light' as ThemePreset, columns = INVENTORY_COLUMNS, data = DOCS_DATA, ...rest }: any) {
  return (
    <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid var(--doc-bdr)', margin: '12px 0' }}>
      <VirtualGrid<InventoryRow>
        columns={columns}
        data={data}
        theme={theme}
        height={height}
        rowHeight={34}
        headerHeight={36}
        groupHeaderHeight={26}
        getRowId={r => r.id}
        {...rest}
      />
    </div>
  );
}

// ─── Docs page ─────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: 'install',     label: 'Installation' },
  { id: 'quickstart',  label: 'Quick start' },
  { id: 'columns',     label: 'Column defs' },
  { id: 'grouping',    label: 'Column groups' },
  { id: 'pinning',     label: 'Pinning' },
  { id: 'theming',     label: 'Theming' },
  { id: 'features',    label: 'Feature flags' },
  { id: 'icons',       label: 'Icons' },
  { id: 'classnames',  label: 'Class names' },
  { id: 'styles',      label: 'Style overrides' },
  { id: 'slots',       label: 'Slots' },
  { id: 'columnmgr',  label: 'Column manager' },
  { id: 'freeze',      label: 'Auto-freeze' },
  { id: 'rowselect',   label: 'Row selection' },
  { id: 'headless',    label: 'Headless API' },
  { id: 'hooks',       label: 'Hooks' },
  { id: 'tokens',      label: 'Token reference' },
  { id: 'props',       label: 'Props reference' },
];

export function Docs({ isDark }: { isDark: boolean }) {
  const [activeTheme, setActiveTheme] = useState<ThemePreset>('light');

  const bg   = isDark ? '#070c14' : '#f8f9fb';
  const surf = isDark ? '#0d1117' : '#ffffff';
  const bdr  = isDark ? '#1e2840' : '#e5e7eb';
  const txt  = isDark ? '#e4e8f0' : '#111827';
  const dim  = isDark ? '#6b7a96' : '#6b7280';
  const acc  = '#2563eb';

  const cssVars = {
    '--doc-bg':   bg,
    '--doc-surf': surf,
    '--doc-bdr':  bdr,
    '--doc-txt':  txt,
    '--doc-dim':  dim,
    '--doc-acc':  acc,
  } as React.CSSProperties;

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', background: bg, color: txt, ...cssVars }}>

      {/* Left nav */}
      <div style={{
        width: 220, flexShrink: 0, overflow: 'auto',
        background: surf, borderRight: `1px solid ${bdr}`,
        padding: '20px 0',
      }}>
        <div style={{ padding: '0 16px 16px', borderBottom: `1px solid ${bdr}`, marginBottom: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: dim }}>
            Documentation
          </div>
        </div>
        {NAV_ITEMS.map(item => (
          <a
            key={item.id}
            href={`#${item.id}`}
            style={{
              display: 'block', padding: '5px 16px',
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

      {/* Main content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '36px 48px 80px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>

          {/* Hero */}
          <div style={{ marginBottom: 48 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#2563eb,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="15" height="15" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="5" height="5" rx="1.2" fill="white" opacity=".9"/><rect x="8" y="1" width="5" height="5" rx="1.2" fill="white" opacity=".55"/><rect x="1" y="8" width="5" height="5" rx="1.2" fill="white" opacity=".55"/><rect x="8" y="8" width="5" height="5" rx="1.2" fill="white" opacity=".9"/></svg>
              </div>
              <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-.03em', margin: 0 }}>VirtualGrid</h1>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', background: isDark ? '#1e3558' : '#dbeafe', color: isDark ? '#93c5fd' : '#1d4ed8', borderRadius: 20 }}>v2.0</span>
            </div>
            <p style={{ fontSize: 15, color: dim, lineHeight: 1.65, maxWidth: 560 }}>
              A high-performance React data grid with row &amp; column virtualisation, full TypeScript support, a headless engine, and a 6-layer customisation API.
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
              {['Row virtualisation','Column virtualisation','Column grouping','Pinning','Resize','Drag reorder','Show/Hide','Auto-freeze','Row selection','Custom renderers','Headless engine','Zero dependencies'].map(f => (
                <Badge key={f}>{f}</Badge>
              ))}
            </div>
          </div>

          {/* ── INSTALLATION ─────────────────────────────────────────────── */}
          <Section id="install" title="Installation">
            <Code>{`npm install @virtual-grid/core
# or
yarn add @virtual-grid/core
# or
pnpm add @virtual-grid/core`}</Code>
            <p style={{ fontSize: 13, color: dim }}>Requires React 18+. No other runtime dependencies.</p>
          </Section>

          {/* ── QUICK START ───────────────────────────────────────────────── */}
          <Section id="quickstart" title="Quick start" subtitle="The minimum working example.">
            <Code>{`import { VirtualGrid } from '@virtual-grid/core';

const columns = [
  { id: 'name',  label: 'Name',  field: 'name',  width: 200, pinned: 'left' },
  { id: 'city',  label: 'City',  field: 'city',  width: 120 },
  { id: 'value', label: 'Value', field: 'value', width: 90, align: 'right' },
];

const data = [
  { name: 'Mumbai DC',     city: 'Mumbai',    value: 42 },
  { name: 'Bangalore Hub', city: 'Bangalore', value: 18 },
];

export function MyPage() {
  return (
    <VirtualGrid
      columns={columns}
      data={data}
      height={400}
      theme="light"
    />
  );
}`}</Code>
            <LiveGrid height={200} theme={isDark ? 'dark' : 'light'} />
          </Section>

          {/* ── COLUMN DEFINITIONS ───────────────────────────────────────── */}
          <Section id="columns" title="Column definitions" subtitle="Every property a leaf column supports.">
            <Code>{`const columns: ColumnDef<MyRow>[] = [
  {
    id:       'product',          // required — unique key
    label:    'Product / SKU',    // required — header text
    field:    'product',          // row field key (falls back to id)
    accessor: (row) => row.price, // custom accessor — overrides field

    width:    200,                // initial width in px (default 120)
    minWidth: 60,                 // minimum resize width (default 40)
    maxWidth: 400,                // maximum resize width (default ∞)

    pinned:   'left',             // 'left' | 'right' | undefined
    hidden:   false,              // hide on mount

    sortable:  true,              // header click to sort
    resizable: true,              // drag resize handle
    draggable: true,              // drag-to-reorder
    hideable:  true,              // show × hide button on hover

    align: 'right',               // 'left' | 'center' | 'right'

    renderCell: (value, row) => ( // custom cell renderer
      <strong>{value}</strong>
    ),
    renderHeader: (col) => (      // custom header renderer
      <span>📦 {col.label}</span>
    ),

    cellStyle:   { fontWeight: 600 },         // inline style on data cells
    headerStyle: { fontStyle: 'italic' },     // inline style on header
  },
];`}</Code>

            <PropsTable>
              <PropRow prop="id"           type="string"                  def="—"       desc="Required. Unique column identifier." />
              <PropRow prop="label"        type="string"                  def="—"       desc="Required. Header display text." />
              <PropRow prop="field"        type="keyof TData"             def="id"      desc="Row object field key. Falls back to id." />
              <PropRow prop="accessor"     type="(row) => unknown"        def="—"       desc="Custom value getter. Overrides field." />
              <PropRow prop="width"        type="number"                  def="120"     desc="Initial column width in px." />
              <PropRow prop="minWidth"     type="number"                  def="40"      desc="Minimum width when resizing." />
              <PropRow prop="maxWidth"     type="number"                  def="∞"       desc="Maximum width when resizing." />
              <PropRow prop="pinned"       type="'left' | 'right'"        def="—"       desc="Pin column on mount." />
              <PropRow prop="hidden"       type="boolean"                 def="false"   desc="Hide column on mount." />
              <PropRow prop="sortable"     type="boolean"                 def="true"    desc="Allow sorting." />
              <PropRow prop="resizable"    type="boolean"                 def="true"    desc="Show resize drag handle." />
              <PropRow prop="draggable"    type="boolean"                 def="true"    desc="Allow drag-to-reorder." />
              <PropRow prop="hideable"     type="boolean"                 def="true"    desc="Show × hide button on header hover." />
              <PropRow prop="align"        type="'left'|'center'|'right'" def="'left'"  desc="Cell content alignment." />
              <PropRow prop="renderCell"   type="(value,row)=>ReactNode"  def="—"       desc="Custom cell renderer." />
              <PropRow prop="renderHeader" type="(col)=>ReactNode"        def="—"       desc="Custom header renderer." />
              <PropRow prop="cellStyle"    type="CSSProperties"           def="—"       desc="Inline style on every data cell." />
              <PropRow prop="headerStyle"  type="CSSProperties"           def="—"       desc="Inline style on header cell." />
            </PropsTable>
          </Section>

          {/* ── COLUMN GROUPS ────────────────────────────────────────────── */}
          <Section id="grouping" title="Column groups" subtitle="Nest columns under a group header. Groups can only be one level deep.">
            <Code>{`const columns = [
  { id: 'name', label: 'Name', field: 'name', width: 180, pinned: 'left' },
  {
    id:    'week1',
    label: 'Week 1 — April 2026',   // group header label
    children: [
      { id: 'd1', label: '1 Apr', field: 'd1', width: 70 },
      { id: 'd2', label: '2 Apr', field: 'd2', width: 70 },
      { id: 'd3', label: '3 Apr', field: 'd3', width: 70 },
    ],
  },
  // Columns NOT in any group get rowspan=2 — they span the group row
  // and the leaf row automatically.
  { id: 'total', label: 'Total', field: 'total', width: 90 },
];`}</Code>
            <LiveGrid height={200} theme={isDark ? 'dark' : 'light'} groupHeaderHeight={26} />
          </Section>

          {/* ── PINNING ──────────────────────────────────────────────────── */}
          <Section id="pinning" title="Column pinning" subtitle="Freeze columns to the left or right edge. Pinned columns are always visible and rendered in a separate overlay layer — they never scroll out of view.">
            <Code>{`// Pin on column definition (initial mount)
{ id: 'name', label: 'Name', pinned: 'left', width: 200 }
{ id: 'actions', label: 'Actions', pinned: 'right', width: 80 }

// Pin programmatically via the engine
const engine = useGridEngine(columns);
engine.pinColumn('name', 'left');   // pin left
engine.pinColumn('name', null);     // unpin

// Via column manager panel (built-in)
// Users can pin/unpin from the Columns panel in the toolbar.`}</Code>
            <LiveGrid height={200} theme={isDark ? 'dark' : 'light'} />
          </Section>

          {/* ── THEMING ──────────────────────────────────────────────────── */}
          <Section id="theming" title="Theming" subtitle="5 built-in presets or full CSS-variable token control. Every visual detail is a token.">

            <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
              {(['light','dark','ocean','forest','sunset'] as ThemePreset[]).map(t => (
                <button key={t} onClick={() => setActiveTheme(t)} style={{
                  padding: '5px 12px', borderRadius: 5,
                  border: `1.5px solid ${activeTheme === t ? '#2563eb' : bdr}`,
                  background: activeTheme === t ? (isDark ? '#1e3558' : '#dbeafe') : surf,
                  color: activeTheme === t ? '#2563eb' : dim,
                  fontWeight: 600, fontSize: 12, cursor: 'pointer',
                  fontFamily: 'inherit',
                }}>
                  {t}
                </button>
              ))}
            </div>

            <LiveGrid height={220} theme={activeTheme} />

            <Code>{`// Option 1 — built-in preset
<VirtualGrid theme="dark" ... />

// Option 2 — partial token override (merged on top of 'light')
<VirtualGrid
  theme={{
    '--vg-accent':          '#7c3aed',
    '--vg-accent-bg':       '#ede9fe',
    '--vg-bg-row-selected': '#ede9fe',
    '--vg-radius':          '2px',
    '--vg-font-size':       '13px',
  }}
/>

// Option 3 — start from a preset and override
import { GRID_THEMES } from '@virtual-grid/core';

<VirtualGrid
  theme={{ ...GRID_THEMES.dark, '--vg-accent': '#a855f7' }}
/>`}</Code>
          </Section>

          {/* ── FEATURE FLAGS ────────────────────────────────────────────── */}
          <Section id="features" title="Feature flags" subtitle="Turn individual capabilities on or off. All default to true. Per-column sortable/resizable/draggable/hideable override the grid-level flag.">
            <Code>{`<VirtualGrid
  features={{
    sort:          true,    // header click to sort (asc → desc → clear)
    resize:        true,    // drag resize handle on column headers
    reorder:       true,    // drag-and-drop column reorder
    columnHide:    true,    // × button on header hover
    columnPin:     true,    // pin option shown in column manager
    alternateRows: true,    // zebra striping
    toolbar:       true,    // show built-in toolbar
    footer:        true,    // show built-in footer
    rowSelection:  true,    // click row to highlight/select
  }}
/>

// Disable a feature for one column:
{ id: 'id', label: 'ID', sortable: false, hideable: false }`}</Code>

            <PropsTable>
              <PropRow prop="sort"          type="boolean" def="true" desc="Column sort on header click. Cycles asc → desc → none." />
              <PropRow prop="resize"        type="boolean" def="true" desc="Drag handle on right edge of every header cell." />
              <PropRow prop="reorder"       type="boolean" def="true" desc="Drag column header to reorder." />
              <PropRow prop="columnHide"    type="boolean" def="true" desc="Hover header to reveal × hide button." />
              <PropRow prop="columnPin"     type="boolean" def="true" desc="Pin option shown in column manager panel." />
              <PropRow prop="alternateRows" type="boolean" def="true" desc="Zebra-stripe alternating row backgrounds." />
              <PropRow prop="toolbar"       type="boolean" def="true" desc="Show built-in toolbar. Set false if using slots.toolbar." />
              <PropRow prop="footer"        type="boolean" def="true" desc="Show built-in footer. Set false if using slots.footer." />
              <PropRow prop="rowSelection"  type="boolean" def="true" desc="Click a row to highlight it. Click again to deselect." />
            </PropsTable>
          </Section>

          {/* ── ICONS ────────────────────────────────────────────────────── */}
          <Section id="icons" title="Icons" subtitle="Replace any built-in icon with your own ReactNode — any icon library, SVG, emoji, or image.">
            <Code>{`import { ArrowUp, ArrowDown, EyeOff, Columns } from 'lucide-react';

<VirtualGrid
  icons={{
    sortAsc:      <ArrowUp size={10} />,
    sortDesc:     <ArrowDown size={10} />,
    sortNone:     <span style={{ opacity: .3 }}>⇅</span>,
    hideColumn:   <EyeOff size={10} />,
    columnsPanel: <Columns size={13} />,
  }}
/>`}</Code>

            <PropsTable>
              <PropRow prop="sortAsc"      type="ReactNode" def="SVG triangle" desc="Icon shown on active ascending sort." />
              <PropRow prop="sortDesc"     type="ReactNode" def="SVG triangle" desc="Icon shown on active descending sort." />
              <PropRow prop="sortNone"     type="ReactNode" def="double arrow" desc="Icon on sortable but unsorted headers." />
              <PropRow prop="hideColumn"   type="ReactNode" def="SVG ×"        desc="Icon for the hide-column button." />
              <PropRow prop="columnsPanel" type="ReactNode" def="SVG columns"  desc="Icon on the toolbar Columns button." />
            </PropsTable>
          </Section>

          {/* ── CLASSNAMES ───────────────────────────────────────────────── */}
          <Section id="classnames" title="CSS class names" subtitle="Inject your own class names onto any grid region. Style them from your own stylesheet — no specificity wars.">
            <Code>{`/* your-styles.css */
.my-grid         { box-shadow: 0 4px 24px rgba(0,0,0,.1); }
.my-header       { text-transform: uppercase; letter-spacing: .06em; }
.my-row          { transition: background .08s; }
.my-row-selected { background: #fef9c3 !important; font-weight: 600; }
.my-cell         { font-variant-numeric: tabular-nums; }
.my-footer       { font-style: italic; }

<VirtualGrid
  classNames={{
    root:        'my-grid',
    headerCell:  'my-header',
    groupRow:    'my-group',
    row:         'my-row',
    rowSelected: 'my-row-selected',
    cell:        'my-cell',
    pinnedCell:  'my-pinned-cell',
    footer:      'my-footer',
    columnPanel: 'my-column-panel',
  }}
/>`}</Code>

            <PropsTable>
              <PropRow prop="root"        type="string" def="—" desc="Applied to the outermost grid div." />
              <PropRow prop="toolbar"     type="string" def="—" desc="Applied to the toolbar bar." />
              <PropRow prop="headerRow"   type="string" def="—" desc="Applied to the sticky header container." />
              <PropRow prop="groupRow"    type="string" def="—" desc="Applied to group header cells." />
              <PropRow prop="headerCell"  type="string" def="—" desc="Applied to every leaf header cell." />
              <PropRow prop="row"         type="string" def="—" desc="Applied to every data row." />
              <PropRow prop="rowSelected" type="string" def="—" desc="Applied to the selected row (in addition to row)." />
              <PropRow prop="cell"        type="string" def="—" desc="Applied to every scrollable data cell." />
              <PropRow prop="pinnedCell"  type="string" def="—" desc="Applied to every pinned column data cell." />
              <PropRow prop="footer"      type="string" def="—" desc="Applied to the footer bar." />
              <PropRow prop="columnPanel" type="string" def="—" desc="Applied to the built-in column manager panel." />
            </PropsTable>
          </Section>

          {/* ── STYLE OVERRIDES ──────────────────────────────────────────── */}
          <Section id="styles" title="Inline style overrides" subtitle="Apply CSSProperties directly to any region — on top of the token layer. Use when you need structural changes beyond what tokens offer.">
            <Code>{`<VirtualGrid
  styles={{
    root:        { borderRadius: 0, border: 'none' },
    toolbar:     { padding: '10px 16px' },
    headerRow:   { fontFamily: 'monospace', letterSpacing: '.04em' },
    groupRow:    { background: '#1e3a8a', color: '#fff' },
    headerCell:  { textTransform: 'uppercase', fontSize: 11 },
    row:         { borderBottom: '1px solid #f0f0f0' },
    rowSelected: { background: '#fef9c3', fontWeight: 600 },
    cell:        { borderRight: 'none' },
    pinnedCell:  { background: '#f8fafc' },
    footer:      { justifyContent: 'flex-start', fontStyle: 'italic' },
  }}
/>`}</Code>
          </Section>

          {/* ── SLOTS ────────────────────────────────────────────────────── */}
          <Section id="slots" title="Slots" subtitle="Replace entire UI sections with your own components. Every slot receives the grid engine so your component can interact with column state, sort, etc.">
            <Code>{`<VirtualGrid
  slots={{
    // Completely replace the toolbar
    // engine gives you full read/write access to grid state
    toolbar: (engine) => (
      <div className="my-toolbar">
        <span>{engine.visibleColumns.length} of {engine.orderedColumns.length} columns</span>
        <button onClick={engine.resetColumns}>Reset</button>
        <button onClick={engine.showAllColumns}>Show all</button>
      </div>
    ),

    // Replace the column manager panel
    // Render it ANYWHERE — in a sidebar, a modal, a drawer
    columnManager: ({ engine, onClose }) => (
      <MyColumnPanel engine={engine} onClose={onClose} />
    ),

    // Just replace left/right toolbar sections (simpler)
    toolbarLeft:  <span>Inventory · April 2026</span>,
    toolbarRight: <button onClick={exportCSV}>Export CSV</button>,

    // Replace the footer
    footer: ({ startRow, endRow, totalRows, visibleCols, totalCols }) => (
      <div>
        Showing {startRow}–{endRow} of {totalRows} ·
        {visibleCols}/{totalCols} columns
      </div>
    ),

    // Custom empty state
    emptyState: (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <img src="/empty.svg" alt="" />
        <p>No results. Try adjusting your filters.</p>
      </div>
    ),

    // Custom loading overlay — shown when loading={true}
    loadingOverlay: <MySpinner />,
  }}
  loading={isFetching}
/>`}</Code>

            <PropsTable>
              <PropRow prop="toolbar"       type="(engine) => ReactNode"          def="—" desc="Completely replaces the toolbar. Receives full engine." />
              <PropRow prop="toolbarLeft"   type="ReactNode"                      def="—" desc="Replaces left section of built-in toolbar." />
              <PropRow prop="toolbarRight"  type="ReactNode"                      def="—" desc="Replaces right section of built-in toolbar." />
              <PropRow prop="columnManager" type="({engine,onClose})=>ReactNode"  def="—" desc="Replaces column manager panel. Can be placed anywhere." />
              <PropRow prop="footer"        type="(props) => ReactNode"           def="—" desc="Replaces footer. Receives row range + col count." />
              <PropRow prop="emptyState"    type="ReactNode"                      def="—" desc="Shown when data is empty." />
              <PropRow prop="loadingOverlay"type="ReactNode"                      def="—" desc="Shown when loading prop is true." />
            </PropsTable>
          </Section>

          {/* ── COLUMN MANAGER ───────────────────────────────────────────── */}
          <Section id="columnmgr" title="Column manager" subtitle="The column manager panel can be rendered anywhere in your app — not just as a dropdown in the toolbar.">
            <Code>{`// The slot receives the engine. Build any UI on top of it.
slots={{
  columnManager: ({ engine, onClose }) => {
    const { orderedColumns, toggleColumnVisibility, pinColumn } = engine;
    return (
      // Render in a sidebar, a drawer, a floating panel — anywhere
      <aside className="my-sidebar">
        <input placeholder="Search..." onChange={...} />
        {orderedColumns.map(col => (
          <label key={col.id}>
            <input
              type="checkbox"
              checked={!col.hidden}
              onChange={() => toggleColumnVisibility(col.id)}
            />
            {col.label}
            <select
              value={col.pinned ?? ''}
              onChange={e => pinColumn(col.id, e.target.value || null)}
            >
              <option value="">Scroll</option>
              <option value="left">Pin left</option>
              <option value="right">Pin right</option>
            </select>
          </label>
        ))}
        <button onClick={engine.resetColumns}>Reset</button>
        <button onClick={engine.showAllColumns}>Show all</button>
        <button onClick={onClose}>Close</button>
      </aside>
    );
  },
}}`}</Code>

            <p style={{ fontSize: 13, color: dim, margin: '8px 0' }}>
              The built-in "Columns" toolbar button opens/closes the panel and passes the engine to your slot. If you want to trigger the panel from somewhere else entirely, use <code style={{ fontSize: 12, background: isDark ? '#1c2438' : '#f3f4f6', padding: '1px 5px', borderRadius: 3 }}>slots.toolbar</code> to build your own trigger button, or manage the open state externally and conditionally render your panel.
            </p>
          </Section>

          {/* ── AUTO-FREEZE ──────────────────────────────────────────────── */}
          <Section id="freeze" title="Auto-freeze column" subtitle="Specify a column that should visually freeze when it scrolls behind the pinned-left band. Engine state is never mutated — virtualisation is unaffected.">
            <Code>{`// The 'dc' column will auto-freeze as you scroll right
<VirtualGrid
  columns={columns}
  data={data}
  freezeColId="dc"
/>

// How it works:
// • When scrollLeft causes column 'dc' offset < pinnedLeftWidth,
//   a visual copy is rendered in the pin-left overlay layer
// • The original column remains in the virtual scroll area
// • No engine state changes — virtualisation window is unchanged
// • The frozen slot uses --vg-bg-frozen token for visual distinction`}</Code>

            <PropsTable>
              <PropRow prop="freezeColId" type="string | undefined" def="—" desc="ID of the column to auto-freeze on horizontal scroll. Must be a scrollable (non-pinned) column." />
            </PropsTable>
          </Section>

          {/* ── ROW SELECTION ────────────────────────────────────────────── */}
          <Section id="rowselect" title="Row selection" subtitle="Single row selection built-in. Click a row to select it, click again to deselect. Both pinned and scrollable columns respond to the click.">
            <Code>{`// Built-in single selection — just enable the feature (it's on by default)
<VirtualGrid
  features={{ rowSelection: true }}
  onRowClick={(row, index) => {
    console.log('clicked:', row, 'at index', index);
  }}
/>

// Customise selected row appearance via token or style
<VirtualGrid
  theme={{ '--vg-bg-row-selected': '#fef9c3' }}
  styles={{ rowSelected: { fontWeight: 600 } }}
  classNames={{ rowSelected: 'my-selected-row' }}
/>

// For multi-select, use the useRowSelection hook:
import { useRowSelection } from '@virtual-grid/core';

const selection = useRowSelection({
  data,
  getRowId: (r) => r.id,
  mode: 'multi',           // 'single' | 'multi'
});

// Add a checkbox column:
{
  id: '__check__',
  label: '',
  width: 38,
  pinned: 'left',
  sortable: false, hideable: false, resizable: false,
  renderHeader: () => (
    <input
      type="checkbox"
      checked={selection.allSelected}
      ref={el => el && (el.indeterminate = selection.someSelected)}
      onChange={() => selection.allSelected
        ? selection.clearSelection()
        : selection.selectAll()
      }
    />
  ),
  renderCell: (_, row) => (
    <input
      type="checkbox"
      checked={selection.isSelected(row.id)}
      onChange={() => selection.toggleRow(row.id)}
      onClick={e => e.stopPropagation()}
    />
  ),
}`}</Code>
          </Section>

          {/* ── HEADLESS API ─────────────────────────────────────────────── */}
          <Section id="headless" title="Headless API" subtitle="Use just the engine to build a completely custom grid UI. Zero default rendering.">
            <Code>{`import { useGridEngine, useVirtualRows, useVirtualCols, buildColumnOffsets } from '@virtual-grid/core';

function MyCustomGrid({ columns, data }) {
  const engine = useGridEngine(columns);
  const {
    pinnedLeftColumns,
    pinnedRightColumns,
    scrollableColumns,
    pinnedLeftWidth,
    pinnedRightWidth,
    sortState,
    toggleSort,
    resizeColumn,
    pinColumn,
    toggleColumnVisibility,
    moveColumnBefore,
    resetColumns,
    showAllColumns,
    orderedColumns,
    visibleColumns,
  } = engine;

  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const offsets = buildColumnOffsets(scrollableColumns);
  const totalScrollW = scrollableColumns.reduce((s, c) => s + c.width, 0);

  const vRows = useVirtualRows({
    rowCount: data.length,
    rowHeight: 36,
    scrollTop,
    viewportHeight: 400,
  });

  const vCols = useVirtualCols({
    columns: scrollableColumns,
    scrollLeft: Math.max(0, scrollLeft - pinnedLeftWidth),
    viewportWidth: 800,
  });

  // Render your own header, body, toolbar — complete freedom
  return (
    <div onScroll={e => { setScrollTop(e.target.scrollTop); setScrollLeft(e.target.scrollLeft); }}>
      {/* Your completely custom UI */}
    </div>
  );
}`}</Code>
          </Section>

          {/* ── HOOKS ────────────────────────────────────────────────────── */}
          <Section id="hooks" title="Hooks reference" subtitle="All hooks are exported individually so you compose only what you need.">

            <h3 style={{ fontSize: 15, fontWeight: 600, margin: '20px 0 8px' }}>useGridEngine</h3>
            <p style={{ fontSize: 13, color: dim, marginBottom: 8 }}>The core state machine. Returns all column state + every action.</p>
            <Code>{`const engine = useGridEngine(columns);
// engine.orderedColumns        — all leaf columns in display order
// engine.visibleColumns        — only non-hidden columns
// engine.pinnedLeftColumns     — pinned-left columns
// engine.pinnedRightColumns    — pinned-right columns
// engine.scrollableColumns     — non-pinned columns
// engine.pinnedLeftWidth       — total width of pinned-left band
// engine.sortState             — { columnId, direction }
// engine.hasGroups             — true if any group columns defined
// engine.toggleSort(id)        — sort a column (asc → desc → none)
// engine.resizeColumn(id, d)   — resize by delta px
// engine.setColumnWidth(id, w) — set exact width
// engine.pinColumn(id, side)   — 'left' | 'right' | null
// engine.toggleColumnVisibility(id)
// engine.showAllColumns()
// engine.moveColumnBefore(src, tgt)
// engine.resetColumns()`}</Code>

            <h3 style={{ fontSize: 15, fontWeight: 600, margin: '20px 0 8px' }}>useRowSelection</h3>
            <Code>{`const sel = useRowSelection({
  data,
  getRowId: (r) => r.id,
  mode: 'multi',             // 'single' | 'multi'
  defaultSelected: [1, 2],   // initially selected ids
  onSelectionChange: (ids, rows) => console.log(ids),
});

sel.selectedIds     // Set<RowId>
sel.selectedRows    // TData[]
sel.allSelected     // boolean
sel.someSelected    // boolean (for indeterminate checkbox)
sel.isSelected(id)  // boolean
sel.toggleRow(id)
sel.selectAll()
sel.clearSelection()
sel.handleRowClick(row, index, event) // handles shift+click range`}</Code>

            <h3 style={{ fontSize: 15, fontWeight: 600, margin: '20px 0 8px' }}>useColumnFilter</h3>
            <Code>{`const filter = useColumnFilter({ data, columns: leafColumns });

filter.filteredData       // TData[] — filtered subset
filter.filterValues       // Record<colId, string>
filter.activeFilterCount  // number
filter.isFiltered         // boolean
filter.setFilter(colId, value)
filter.clearFilter(colId)
filter.clearAllFilters()

// With custom matcher (e.g. numeric >=)
useColumnFilter({
  data,
  columns,
  matchers: {
    value: (cellValue, filterValue) => Number(cellValue) >= Number(filterValue),
  },
})`}</Code>

            <h3 style={{ fontSize: 15, fontWeight: 600, margin: '20px 0 8px' }}>useGridPagination</h3>
            <Code>{`// Client-side
const page = useGridPagination({ data: allRows, pageSize: 100 });
<VirtualGrid data={page.pageData} />
<GridPagination {...page} />   // built-in pagination bar component

// Server-side
const page = useGridPagination({ totalRows: 50000, pageSize: 100 });
useEffect(() => fetchPage(page.currentPage, page.pageSize), [page.currentPage]);

page.currentPage   page.pageCount   page.totalRows
page.canGoPrev     page.canGoNext
page.nextPage()    page.prevPage()
page.goToPage(n)   page.firstPage()  page.lastPage()
page.setPageSize(n)`}</Code>

            <h3 style={{ fontSize: 15, fontWeight: 600, margin: '20px 0 8px' }}>useGridExport</h3>
            <Code>{`const exporter = useGridExport({
  data:    sortedFilteredData,
  columns: visibleResolvedColumns,
});

exporter.exportCSV('inventory.csv');   // triggers download
exporter.exportJSON('inventory.json');
exporter.getCSVString();               // returns string without downloading
exporter.getJSONString();`}</Code>

            <h3 style={{ fontSize: 15, fontWeight: 600, margin: '20px 0 8px' }}>useGridKeyboard</h3>
            <Code>{`const kb = useGridKeyboard({
  rowCount: data.length,
  colCount: visibleColumns.length,
  onActivate: (cell) => handleCellActivate(cell),
  onFocusRow: (idx) => scrollBodyRef.current?.scrollTo({ top: idx * rowHeight }),
});

<div
  role="grid"
  tabIndex={kb.gridTabIndex}
  onKeyDown={kb.handleKeyDown}
>
  {/* ArrowUp/Down = move row, ArrowLeft/Right = move col */}
  {/* Home/End = first/last col, Ctrl+Home/End = first/last row */}
  {/* PageUp/PageDown = jump by viewport, Enter/Space = activate */}
</div>`}</Code>
          </Section>

          {/* ── TOKEN REFERENCE ──────────────────────────────────────────── */}
          <Section id="tokens" title="Token reference" subtitle="Every CSS variable the grid uses. Override any of them via the theme prop.">
            <PropsTable>
              <PropRow prop="--vg-font"           type="font-family" def="'DM Sans', sans-serif"         desc="Primary typeface." />
              <PropRow prop="--vg-font-mono"       type="font-family" def="'JetBrains Mono', monospace"   desc="Monospace typeface (footer, numeric cells)." />
              <PropRow prop="--vg-font-size"       type="length"      def="12.5px"                        desc="Base font size." />
              <PropRow prop="--vg-line-height"     type="number"      def="1.45"                          desc="Base line height." />
              <PropRow prop="--vg-radius"          type="length"      def="7px"                           desc="Grid root border-radius." />
              <PropRow prop="--vg-radius-sm"       type="length"      def="4px"                           desc="Smaller radius (buttons, badges)." />
              <PropRow prop="--vg-bg"              type="color"       def="#ffffff"                        desc="Main grid background." />
              <PropRow prop="--vg-bg-header"       type="color"       def="#f7f8fa"                        desc="Header row background." />
              <PropRow prop="--vg-bg-group"        type="color"       def="#f0f2f6"                        desc="Group header background." />
              <PropRow prop="--vg-bg-row-alt"      type="color"       def="#fafbfc"                        desc="Alternating row background." />
              <PropRow prop="--vg-bg-row-hover"    type="color"       def="#f0f5ff"                        desc="Row hover background." />
              <PropRow prop="--vg-bg-row-selected" type="color"       def="#dbeafe"                        desc="Selected row background." />
              <PropRow prop="--vg-bg-pinned"       type="color"       def="#ffffff"                        desc="Pinned column cell background." />
              <PropRow prop="--vg-bg-frozen"       type="color"       def="#eff6ff"                        desc="Auto-frozen column background." />
              <PropRow prop="--vg-bg-toolbar"      type="color"       def="#ffffff"                        desc="Toolbar and footer background." />
              <PropRow prop="--vg-bg-panel"        type="color"       def="#ffffff"                        desc="Column manager panel background." />
              <PropRow prop="--vg-bg-btn"          type="color"       def="#f3f4f6"                        desc="Button background." />
              <PropRow prop="--vg-bg-btn-hover"    type="color"       def="#e9eaec"                        desc="Button hover background." />
              <PropRow prop="--vg-text"            type="color"       def="#111827"                        desc="Body text colour." />
              <PropRow prop="--vg-text-dim"        type="color"       def="#6b7280"                        desc="Muted/secondary text." />
              <PropRow prop="--vg-text-header"     type="color"       def="#374151"                        desc="Header cell text." />
              <PropRow prop="--vg-text-group"      type="color"       def="#1e2939"                        desc="Group header text." />
              <PropRow prop="--vg-border"          type="color"       def="#e5e7eb"                        desc="Default border." />
              <PropRow prop="--vg-border-strong"   type="color"       def="#d1d5db"                        desc="Emphasis border (header bottom, pinned seam)." />
              <PropRow prop="--vg-accent"          type="color"       def="#2563eb"                        desc="Primary accent — sort active, drag indicator, button." />
              <PropRow prop="--vg-accent-bg"       type="color"       def="#dbeafe"                        desc="Accent background tint." />
              <PropRow prop="--vg-accent-text"     type="color"       def="#1d4ed8"                        desc="Text on accent-bg surfaces." />
              <PropRow prop="--vg-accent-fg"       type="color"       def="#ffffff"                        desc="Text on solid accent (button label)." />
              <PropRow prop="--vg-sort-active"     type="color"       def="#2563eb"                        desc="Active sort indicator colour." />
              <PropRow prop="--vg-sort-icon"       type="color"       def="#9ca3af"                        desc="Inactive sort indicator colour." />
              <PropRow prop="--vg-resize-hover"    type="color"       def="#2563eb"                        desc="Resize handle hover colour." />
              <PropRow prop="--vg-shadow-panel"    type="shadow"      def="0 8px 24px …"                  desc="Column manager panel shadow." />
              <PropRow prop="--vg-scrollbar-thumb" type="color"       def="#d1d5db"                        desc="Scrollbar thumb colour." />
              <PropRow prop="--vg-scrollbar-track" type="color"       def="#f1f3f5"                        desc="Scrollbar track colour." />
              <PropRow prop="--vg-transition"      type="duration"    def="0.12s ease"                     desc="Default CSS transition for hover states." />
            </PropsTable>
          </Section>

          {/* ── PROPS REFERENCE ──────────────────────────────────────────── */}
          <Section id="props" title="VirtualGrid props reference" subtitle="Every prop the VirtualGrid component accepts.">
            <PropsTable>
              <PropRow prop="columns"           type="ColumnDef<TData>[]"        def="—"       desc="Required. Column definitions. Supports flat and grouped arrays." />
              <PropRow prop="data"              type="TData[]"                   def="—"       desc="Required. Row data array." />
              <PropRow prop="getRowId"          type="(row,i)=>string|number"    def="index"   desc="Stable row key getter. Improves reconciliation." />
              <PropRow prop="height"            type="number"                    def="480"     desc="Viewport height in px." />
              <PropRow prop="rowHeight"         type="number"                    def="36"      desc="Fixed row height in px." />
              <PropRow prop="headerHeight"      type="number"                    def="38"      desc="Leaf header row height in px." />
              <PropRow prop="groupHeaderHeight" type="number"                    def="28"      desc="Group header row height in px." />
              <PropRow prop="theme"             type="ThemePreset | GridTokens"  def="'light'" desc="Preset name or partial/full token map." />
              <PropRow prop="features"          type="GridFeatures"              def="all true" desc="Feature flags object. See Features section." />
              <PropRow prop="icons"             type="GridIcons"                 def="—"       desc="Custom icon overrides. See Icons section." />
              <PropRow prop="classNames"        type="GridClassNames"            def="—"       desc="CSS class names per region. See Class names section." />
              <PropRow prop="styles"            type="GridStyles"                def="—"       desc="Inline CSSProperties per region. See Style overrides." />
              <PropRow prop="slots"             type="GridSlots<TData>"          def="—"       desc="Render-prop replacements for UI sections. See Slots." />
              <PropRow prop="freezeColId"       type="string"                    def="—"       desc="Column id to auto-freeze on horizontal scroll." />
              <PropRow prop="loading"           type="boolean"                   def="false"   desc="Show loading overlay (customise via slots.loadingOverlay)." />
              <PropRow prop="onRowClick"        type="(row,index)=>void"         def="—"       desc="Called when a row is clicked." />
              <PropRow prop="onSortChange"      type="(sort)=>void"              def="—"       desc="Called when sort state changes." />
              <PropRow prop="onColumnResize"    type="(id,width)=>void"          def="—"       desc="Called when a column finishes resizing." />
              <PropRow prop="onColumnReorder"   type="(order)=>void"             def="—"       desc="Called when columns are drag-reordered." />
              <PropRow prop="ariaLabel"         type="string"                    def="'Data grid'" desc="aria-label for the grid root element." />
              <PropRow prop="className"         type="string"                    def="—"       desc="CSS class on the grid root element." />
              <PropRow prop="style"             type="CSSProperties"             def="—"       desc="Inline style on the grid root element." />
            </PropsTable>
          </Section>

        </div>
      </div>
    </div>
  );
}
