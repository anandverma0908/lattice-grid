// =============================================================================
//  VirtualGrid — Product Demo Application
//
//  Shows every customisation layer working together in a real app:
//  • Custom column manager panel — rendered in a sidebar, not a dropdown
//  • Theme token editor — live preview of every token change
//  • Feature flags — toggle capabilities from the toolbar
//  • Custom toolbar slot — your own buttons wired to the engine
//  • Custom footer slot — page info, export button
//  • Custom icons — swap sort/hide icons
//  • Per-column renderCell — status badges, progress bars, numeric cells
// =============================================================================

import React, {
  useState, useMemo, useCallback, useRef, useEffect, type CSSProperties,
} from 'react';
import {
  VirtualGrid,
  useGridEngine,
  useGridContext,
  GridContextProvider,
  GRID_THEMES,
  type ThemePreset,
  type GridTokens,
  type ColumnDef,
  type GridEngine,
  type ColumnManagerRenderProps,
} from '@virtual-grid/core';
import { generateInventoryData, type InventoryRow } from './data/inventory';
import { INVENTORY_COLUMNS } from './data/columns';

// ─────────────────────────────────────────────────────────────────────────────
//  DATA  (stable — generated once)
// ─────────────────────────────────────────────────────────────────────────────

const DEMO_DATA = generateInventoryData(5000);

// ─────────────────────────────────────────────────────────────────────────────
//  THEME PRESETS
// ─────────────────────────────────────────────────────────────────────────────

const PRESETS: Array<{ key: ThemePreset; label: string; dot: string }> = [
  { key: 'light',  label: 'Light',  dot: '#2563eb' },
  { key: 'dark',   label: 'Dark',   dot: '#3b82f6' },
  { key: 'ocean',  label: 'Ocean',  dot: '#0e9eff' },
  { key: 'forest', label: 'Forest', dot: '#4ade80' },
  { key: 'sunset', label: 'Sunset', dot: '#fb923c' },
];

// ─────────────────────────────────────────────────────────────────────────────
//  CUSTOM COLUMN MANAGER
//  Rendered in a sidebar panel — completely outside the grid.
//  Uses useGridContext() to read engine state and dispatch actions.
// ─────────────────────────────────────────────────────────────────────────────

function SidebarColumnManager({ engine }: { engine: GridEngine<InventoryRow> }) {
  const {
    orderedColumns, toggleColumnVisibility, pinColumn,
    showAllColumns, resetColumns,
  } = engine;

  const [search, setSearch] = useState('');
  const filtered = useMemo(
    () => orderedColumns.filter(c =>
      c.label.toLowerCase().includes(search.toLowerCase()),
    ),
    [orderedColumns, search],
  );
  const hiddenCount = orderedColumns.filter(c => c.hidden).length;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px 10px',
        borderBottom: '1px solid var(--vg-border)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', marginBottom: 10,
        }}>
          <span style={{
            fontWeight: 700, fontSize: 13,
            color: 'var(--vg-text)', letterSpacing: '-0.01em',
          }}>
            Columns
            {hiddenCount > 0 && (
              <span style={{
                marginLeft: 6, fontSize: 10, fontWeight: 600,
                background: 'var(--vg-accent-bg)', color: 'var(--vg-accent-text)',
                borderRadius: 10, padding: '1px 7px',
              }}>
                {hiddenCount} hidden
              </span>
            )}
          </span>
          <button
            onClick={resetColumns}
            style={{
              background: 'none', border: 'none',
              fontSize: 11, color: 'var(--vg-accent)',
              fontWeight: 600, cursor: 'pointer',
              fontFamily: 'inherit', padding: '2px 4px',
            }}
          >
            Reset
          </button>
        </div>

        {/* Search */}
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search columns…"
          style={{
            width: '100%', padding: '6px 10px',
            borderRadius: 5,
            border: '1px solid var(--vg-border-strong)',
            background: 'var(--vg-bg)',
            color: 'var(--vg-text)', fontSize: 12,
            fontFamily: 'inherit', outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* "Show all" banner */}
      {hiddenCount > 0 && (
        <div style={{
          padding: '6px 16px',
          background: 'var(--vg-accent-bg)',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--vg-border)',
        }}>
          <span style={{ fontSize: 11, color: 'var(--vg-accent-text)', fontWeight: 500 }}>
            {hiddenCount} column{hiddenCount > 1 ? 's' : ''} hidden
          </span>
          <button
            onClick={showAllColumns}
            style={{
              background: 'none', border: 'none',
              fontSize: 11, color: 'var(--vg-accent)',
              fontWeight: 700, cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Show all
          </button>
        </div>
      )}

      {/* Column list */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {filtered.map(col => (
          <div
            key={col.id}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '7px 16px',
              borderBottom: '1px solid var(--vg-border)',
              transition: 'background 0.1s',
            }}
            onMouseEnter={e =>
              (e.currentTarget.style.background = 'var(--vg-bg-row-hover)')
            }
            onMouseLeave={e =>
              (e.currentTarget.style.background = 'transparent')
            }
          >
            {/* Visibility toggle */}
            <input
              type="checkbox"
              id={`cm-${col.id}`}
              checked={!col.hidden}
              onChange={() => toggleColumnVisibility(col.id)}
              style={{
                accentColor: 'var(--vg-accent)',
                cursor: 'pointer', width: 13, height: 13, flexShrink: 0,
              }}
            />

            {/* Label */}
            <label
              htmlFor={`cm-${col.id}`}
              style={{
                flex: 1, cursor: 'pointer', fontSize: 12,
                color: col.hidden ? 'var(--vg-text-dim)' : 'var(--vg-text)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}
            >
              {col.label}
            </label>

            {/* Pin badge */}
            {col.pinned && (
              <span style={{
                fontSize: 9, fontWeight: 700, padding: '1px 5px',
                borderRadius: 3,
                background: 'var(--vg-accent-bg)',
                color: 'var(--vg-accent-text)',
                textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>
                {col.pinned}
              </span>
            )}

            {/* Pin select */}
            <select
              value={col.pinned ?? ''}
              onChange={e =>
                pinColumn(col.id, (e.target.value as 'left' | 'right') || null)
              }
              style={{
                fontSize: 10, padding: '2px 4px',
                background: 'var(--vg-bg-btn)',
                color: 'var(--vg-text)',
                border: '1px solid var(--vg-border-strong)',
                borderRadius: 3, cursor: 'pointer',
                fontFamily: 'inherit', outline: 'none',
              }}
            >
              <option value="">Scroll</option>
              <option value="left">Pin ←</option>
              <option value="right">Pin →</option>
            </select>
          </div>
        ))}

        {filtered.length === 0 && (
          <div style={{
            padding: '24px 16px', textAlign: 'center',
            fontSize: 12, color: 'var(--vg-text-dim)',
          }}>
            No columns match "{search}"
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: '10px 16px',
        borderTop: '1px solid var(--vg-border)',
        fontSize: 11, color: 'var(--vg-text-dim)',
        fontFamily: "'JetBrains Mono', monospace",
      }}>
        {orderedColumns.filter(c => !c.hidden).length}/{orderedColumns.length} visible
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  CUSTOM ICONS
// ─────────────────────────────────────────────────────────────────────────────

function IconSortAsc() {
  return (
    <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
      <path d="M4.5 1L8 7.5H1L4.5 1z" fill="currentColor"/>
    </svg>
  );
}
function IconSortDesc() {
  return (
    <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
      <path d="M4.5 8L1 1.5H8L4.5 8z" fill="currentColor"/>
    </svg>
  );
}
function IconHide() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
      <circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" strokeWidth="1.2"/>
      <line x1="3" y1="5.5" x2="8" y2="5.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}
function IconColumns() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <rect x="1" y="2" width="3" height="9" rx="1" stroke="currentColor" strokeWidth="1.2"/>
      <rect x="5" y="2" width="3" height="9" rx="1" stroke="currentColor" strokeWidth="1.2"/>
      <rect x="9" y="2" width="3" height="9" rx="1" stroke="currentColor" strokeWidth="1.2"/>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  FEATURE TOGGLE BUTTON
// ─────────────────────────────────────────────────────────────────────────────

function FeatToggle({
  label, value, onChange, isDark,
}: {
  label: string; value: boolean;
  onChange: (v: boolean) => void; isDark: boolean;
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '5px 10px', borderRadius: 6,
        border: `1px solid ${value ? 'transparent' : isDark ? '#2e3648' : '#d1d5db'}`,
        background: value
          ? isDark ? '#1e3558' : '#dbeafe'
          : isDark ? '#1c2438' : '#f3f4f6',
        color: value
          ? isDark ? '#93c5fd' : '#1d4ed8'
          : isDark ? '#8892a4' : '#374151',
        fontSize: 12, fontWeight: 500, cursor: 'pointer',
        fontFamily: "'DM Sans', sans-serif",
        transition: 'all 0.12s',
      }}
    >
      <span style={{
        width: 6, height: 6, borderRadius: '50%',
        background: value ? 'currentColor' : isDark ? '#4b5670' : '#9ca3af',
        flexShrink: 0,
      }} />
      {label}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  TOKEN ROW
// ─────────────────────────────────────────────────────────────────────────────

function TokenRow({
  label, tokenKey, value, onChange, type = 'color', isDark,
}: {
  label: string;
  tokenKey: string;
  value: string;
  onChange: (k: string, v: string) => void;
  type?: 'color' | 'text';
  isDark: boolean;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '5px 0', borderBottom: `1px solid ${isDark ? '#1e2840' : '#f3f4f6'}`,
    }}>
      <span style={{
        flex: 1, fontSize: 11, color: isDark ? '#8892a4' : '#6b7280',
        fontFamily: "'JetBrains Mono', monospace",
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {label}
      </span>
      {type === 'color' ? (
        <input
          type="color"
          value={value}
          onChange={e => onChange(tokenKey, e.target.value)}
          style={{ width: 28, height: 22, border: 'none', borderRadius: 4, cursor: 'pointer', padding: 1 }}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={e => onChange(tokenKey, e.target.value)}
          style={{
            width: 80, fontSize: 11, padding: '3px 6px',
            borderRadius: 4,
            border: `1px solid ${isDark ? '#2e3648' : '#d1d5db'}`,
            background: isDark ? '#1c2438' : '#f9fafb',
            color: isDark ? '#e4e8f0' : '#111827',
            fontFamily: "'JetBrains Mono', monospace",
            outline: 'none',
          }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN APP
// ─────────────────────────────────────────────────────────────────────────────

type Panel = 'columns' | 'theme' | 'features' | null;

export default function App() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [activePreset, setActivePreset] = useState<ThemePreset>('light');
  const [tokenOverrides, setTokenOverrides] = useState<GridTokens>({});
  const [activePanel, setActivePanel] = useState<Panel>('columns');
  const [colPanelPosition, setColPanelPosition] = useState<'sidebar' | 'floating' | 'bottom'>('sidebar');
  const [useCustomIcons, setUseCustomIcons] = useState(false);
  const [selectedRow, setSelectedRow] = useState<InventoryRow | null>(null);

  const [features, setFeatures] = useState({
    sort: true, resize: true, reorder: true,
    columnHide: true, columnPin: true,
    alternateRows: true, toolbar: false,   // we use a custom toolbar via slot
    footer: false,                          // we use a custom footer via slot
    rowSelection: true,
  });

  // Engine ref — so sidebar column manager can access it
  const [engine, setEngine] = useState<GridEngine<InventoryRow> | null>(null);
  const engineRef = useRef<GridEngine<InventoryRow> | null>(null);

  // ── Computed ───────────────────────────────────────────────────────────────
  const isDark = ['dark', 'ocean', 'forest', 'sunset'].includes(activePreset);

  const theme = useMemo((): ThemePreset | GridTokens => {
    if (Object.keys(tokenOverrides).length === 0) return activePreset;
    return { ...GRID_THEMES[activePreset], ...tokenOverrides };
  }, [activePreset, tokenOverrides]);

  const tokens = useMemo(
    () => GRID_THEMES[activePreset] ?? GRID_THEMES.light,
    [activePreset],
  );

  // ── Colors ─────────────────────────────────────────────────────────────────
  const pageBg    = isDark ? '#070c14' : '#f0f2f7';
  const sidebarBg = isDark ? '#0d1117' : '#ffffff';
  const borderClr = isDark ? '#1e2840' : '#e5e7eb';
  const textClr   = isDark ? '#e4e8f0' : '#111827';
  const dimClr    = isDark ? '#6b7a96' : '#6b7280';
  const btnBg     = isDark ? '#1c2438' : '#f3f4f6';
  const btnBdr    = isDark ? '#2e3648' : '#d1d5db';

  // ── Token editor helpers ───────────────────────────────────────────────────
  const setToken = useCallback((k: string, v: string) => {
    setTokenOverrides(prev => ({ ...prev, [k]: v }));
  }, []);

  const resetTokens = useCallback(() => {
    setTokenOverrides({});
  }, []);

  const getToken = (key: string) =>
    (tokenOverrides as Record<string, string>)[key] ??
    (tokens as Record<string, string>)[key] ??
    '';

  // ── Custom toolbar slot ────────────────────────────────────────────────────
  const toolbarSlot = useCallback((eng: GridEngine<InventoryRow>) => {
    engineRef.current = eng;
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 14px',
        background: 'var(--vg-bg-toolbar)',
        borderBottom: '1px solid var(--vg-border)',
        fontFamily: "'DM Sans', sans-serif",
      }}>
        {/* Left — dataset info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 12, fontWeight: 600, color: 'var(--vg-text)',
          }}>
            Inventory
          </span>
          <span style={{
            fontSize: 11, color: 'var(--vg-text-dim)',
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            {DEMO_DATA.length.toLocaleString()} rows ·{' '}
            {eng.visibleColumns.length}/{eng.orderedColumns.length} cols
          </span>
        </div>

        <div style={{ flex: 1 }} />

        {/* Right — actions */}
        <button
          onClick={eng.resetColumns}
          style={{
            padding: '4px 10px', borderRadius: 5,
            border: `1px solid ${btnBdr}`,
            background: btnBg, color: 'var(--vg-text)',
            fontSize: 11, fontWeight: 500, cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Reset columns
        </button>
        {eng.orderedColumns.filter(c => c.hidden).length > 0 && (
          <button
            onClick={eng.showAllColumns}
            style={{
              padding: '4px 10px', borderRadius: 5,
              border: '1px solid var(--vg-accent)',
              background: 'var(--vg-accent-bg)',
              color: 'var(--vg-accent-text)',
              fontSize: 11, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Show all columns
          </button>
        )}
      </div>
    );
  }, [btnBg, btnBdr]);

  // ── Custom footer slot ─────────────────────────────────────────────────────
  const footerSlot = useCallback(({
    startRow, endRow, totalRows, visibleCols, totalCols,
  }: {
    startRow: number; endRow: number; totalRows: number;
    visibleCols: number; totalCols: number;
  }) => (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16,
      padding: '5px 14px',
      background: 'var(--vg-bg-toolbar)',
      borderTop: '1px solid var(--vg-border)',
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 11, color: 'var(--vg-text-dim)',
    }}>
      <span>
        Rows {startRow.toLocaleString()}–{endRow.toLocaleString()} of {totalRows.toLocaleString()}
      </span>
      <span style={{ opacity: 0.4 }}>·</span>
      <span>{visibleCols}/{totalCols} columns</span>
      {selectedRow && (
        <>
          <span style={{ opacity: 0.4 }}>·</span>
          <span style={{ color: 'var(--vg-accent-text)', fontWeight: 600 }}>
            Selected: {(selectedRow as InventoryRow).product?.slice(0, 24)}…
          </span>
        </>
      )}
      <div style={{ flex: 1 }} />
      <button
        onClick={() => {
          // Placeholder export action
          alert(`Exporting ${totalRows.toLocaleString()} rows as CSV…`);
        }}
        style={{
          padding: '3px 9px', borderRadius: 4,
          border: `1px solid ${btnBdr}`,
          background: btnBg,
          color: 'var(--vg-text)', fontSize: 11,
          fontWeight: 500, cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        Export CSV
      </button>
    </div>
  ), [selectedRow, btnBg, btnBdr]);

  // ── Column manager slot — the key feature ─────────────────────────────────
  // When position is 'sidebar' or 'bottom', we render it there (not in a popup).
  // We return null here so no popup appears — the panel is shown elsewhere.
  const columnManagerSlot = useCallback(
    ({ engine: eng, onClose }: ColumnManagerRenderProps<InventoryRow>) => {
      engineRef.current = eng;

      if (colPanelPosition === 'sidebar' || colPanelPosition === 'bottom') {
        // Don't render anything in the popup — the sidebar renders it
        return null;
      }

      // Floating: render a full custom panel
      return (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', right: 0,
          width: 280, maxHeight: 460,
          background: sidebarBg, border: `1px solid ${borderClr}`,
          borderRadius: 8,
          boxShadow: isDark
            ? '0 8px 32px rgba(0,0,0,0.5)'
            : '0 8px 24px rgba(0,0,0,0.12)',
          zIndex: 100, overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
        }}>
          <SidebarColumnManager engine={eng} />
        </div>
      );
    },
    [colPanelPosition, sidebarBg, borderClr, isDark],
  );

  // ── Row click ──────────────────────────────────────────────────────────────
  const handleRowClick = useCallback((row: InventoryRow) => {
    setSelectedRow(prev => prev === row ? null : row);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────────────────────────────────────

  const SIDEBAR_W = 260;
  const PANEL_W   = activePanel ? SIDEBAR_W : 0;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100vh',
      background: pageBg, fontFamily: "'DM Sans', sans-serif",
      color: textClr, overflow: 'hidden',
    }}>

      {/* ── TOP NAV ─────────────────────────────────────────────────────── */}
      <header style={{
        display: 'flex', alignItems: 'center', height: 48,
        padding: '0 16px', gap: 12,
        background: sidebarBg,
        borderBottom: `1px solid ${borderClr}`,
        flexShrink: 0, zIndex: 10,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 26, height: 26, borderRadius: 6,
            background: 'linear-gradient(135deg,#2563eb,#7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="5" height="5" rx="1.2" fill="white" opacity=".9"/>
              <rect x="8" y="1" width="5" height="5" rx="1.2" fill="white" opacity=".55"/>
              <rect x="1" y="8" width="5" height="5" rx="1.2" fill="white" opacity=".55"/>
              <rect x="8" y="8" width="5" height="5" rx="1.2" fill="white" opacity=".9"/>
            </svg>
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em' }}>
            VirtualGrid
          </span>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '2px 6px',
            background: isDark ? '#1e3558' : '#dbeafe',
            color: isDark ? '#93c5fd' : '#1d4ed8',
            borderRadius: 20,
          }}>
            v2.0
          </span>
        </div>

        <div style={{ flex: 1 }} />

        {/* Theme preset switcher */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {PRESETS.map(p => (
            <button
              key={p.key}
              onClick={() => { setActivePreset(p.key); setTokenOverrides({}); }}
              title={p.label}
              style={{
                width: 20, height: 20, borderRadius: '50%',
                background: p.dot, border: 'none', cursor: 'pointer', padding: 0,
                outline: activePreset === p.key ? `2.5px solid ${textClr}` : 'none',
                outlineOffset: 2,
              }}
            />
          ))}
        </div>

        <div style={{ width: 1, height: 20, background: borderClr }} />

        {/* Panel toggles */}
        {(
          [
            { id: 'columns', label: 'Columns' },
            { id: 'theme',   label: 'Theme' },
            { id: 'features',label: 'Features' },
          ] as Array<{ id: Panel; label: string }>
        ).map(p => (
          <button
            key={p.id}
            onClick={() => setActivePanel(prev => prev === p.id ? null : p.id)}
            style={{
              padding: '4px 10px', borderRadius: 5, fontSize: 12, fontWeight: 500,
              border: `1px solid ${activePanel === p.id ? 'transparent' : btnBdr}`,
              background: activePanel === p.id
                ? isDark ? '#1e3558' : '#dbeafe'
                : btnBg,
              color: activePanel === p.id
                ? isDark ? '#93c5fd' : '#1d4ed8'
                : dimClr,
              cursor: 'pointer', fontFamily: 'inherit',
              transition: 'all 0.12s',
            }}
          >
            {p.label}
          </button>
        ))}
      </header>

      {/* ── BODY ────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── MAIN CONTENT ────────────────────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 16, gap: 12 }}>

          {/* Column panel position selector (shown when column panel is active) */}
          {activePanel === 'columns' && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 12px',
              background: sidebarBg,
              border: `1px solid ${borderClr}`,
              borderRadius: 8, fontSize: 12,
            }}>
              <span style={{ color: dimClr, fontWeight: 500 }}>Column panel position:</span>
              {(['sidebar', 'floating', 'bottom'] as const).map(pos => (
                <button
                  key={pos}
                  onClick={() => setColPanelPosition(pos)}
                  style={{
                    padding: '4px 10px', borderRadius: 5,
                    border: `1px solid ${colPanelPosition === pos ? 'transparent' : btnBdr}`,
                    background: colPanelPosition === pos
                      ? isDark ? '#1e3558' : '#dbeafe'
                      : btnBg,
                    color: colPanelPosition === pos
                      ? isDark ? '#93c5fd' : '#1d4ed8'
                      : textClr,
                    fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    fontFamily: 'inherit', textTransform: 'capitalize',
                  }}
                >
                  {pos === 'sidebar'   ? '← Sidebar'   :
                   pos === 'floating'  ? '↗ Floating'  :
                                         '↓ Bottom bar'}
                </button>
              ))}
              <div style={{ flex: 1 }} />
              <FeatToggle
                label="Custom icons"
                value={useCustomIcons}
                onChange={setUseCustomIcons}
                isDark={isDark}
              />
            </div>
          )}

          {/* Grid */}
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            overflow: 'hidden', borderRadius: 8,
          }}>
            <VirtualGrid<InventoryRow>
              columns={INVENTORY_COLUMNS}
              data={DEMO_DATA}
              theme={theme}
              height={
                colPanelPosition === 'bottom' && activePanel === 'columns'
                  ? undefined   // height is managed by flex
                  : undefined
              }
              style={{ flex: 1, height: '100%', borderRadius: 8 }}
              rowHeight={36}
              headerHeight={38}
              groupHeaderHeight={28}
              freezeColId="dc"
              features={features}
              icons={useCustomIcons ? {
                sortAsc:      <IconSortAsc />,
                sortDesc:     <IconSortDesc />,
                hideColumn:   <IconHide />,
                columnsPanel: <IconColumns />,
              } : undefined}
              slots={{
                toolbar:       toolbarSlot,
                footer:        footerSlot,
                columnManager: columnManagerSlot,
              }}
              onRowClick={handleRowClick}
              getRowId={r => r.id}
              ariaLabel="Inventory data grid"
            />
          </div>

          {/* Bottom column panel */}
          {activePanel === 'columns' && colPanelPosition === 'bottom' && (
            <div style={{
              height: 220, flexShrink: 0,
              background: sidebarBg,
              border: `1px solid ${borderClr}`,
              borderRadius: 8, overflow: 'hidden',
            }}>
              {engineRef.current
                ? <SidebarColumnManager engine={engineRef.current} />
                : <div style={{ padding: 16, color: dimClr, fontSize: 12 }}>
                    Click any column header to initialise…
                  </div>
              }
            </div>
          )}
        </div>

        {/* ── RIGHT SIDEBAR PANEL ──────────────────────────────────────── */}
        {activePanel && (
          <div style={{
            width: SIDEBAR_W, flexShrink: 0,
            background: sidebarBg,
            borderLeft: `1px solid ${borderClr}`,
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
          }}>

            {/* ── COLUMNS PANEL ─────────────────────────────────────── */}
            {activePanel === 'columns' && colPanelPosition === 'sidebar' && (
              <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {/* We need the engine from the grid — it's captured in engineRef via the slot */}
                <EngineColumnPanel isDark={isDark} engineRef={engineRef} />
              </div>
            )}

            {activePanel === 'columns' && colPanelPosition !== 'sidebar' && (
              <div style={{ padding: 20, color: dimClr, fontSize: 12, textAlign: 'center', paddingTop: 40 }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>
                  {colPanelPosition === 'floating' ? '↗' : '↓'}
                </div>
                Column panel is set to <strong style={{ color: textClr }}>{colPanelPosition}</strong> mode.
                <br /><br />
                {colPanelPosition === 'floating'
                  ? 'Click the "Columns" button in the grid toolbar to open it.'
                  : 'It appears below the grid.'}
              </div>
            )}

            {/* ── THEME PANEL ───────────────────────────────────────── */}
            {activePanel === 'theme' && (
              <div style={{ flex: 1, overflow: 'auto' }}>
                <div style={{
                  padding: '12px 16px 8px',
                  borderBottom: `1px solid ${borderClr}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <span style={{ fontWeight: 700, fontSize: 13 }}>Theme tokens</span>
                  <button
                    onClick={resetTokens}
                    style={{
                      background: 'none', border: 'none', fontSize: 11,
                      color: dimClr, cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    Reset
                  </button>
                </div>
                <div style={{ padding: '8px 16px' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: dimClr, marginBottom: 6 }}>Colour</div>
                  <TokenRow label="--vg-accent"       tokenKey="--vg-accent"       value={getToken('--vg-accent')}       onChange={setToken} isDark={isDark} />
                  <TokenRow label="--vg-accent-bg"    tokenKey="--vg-accent-bg"    value={getToken('--vg-accent-bg')}    onChange={setToken} isDark={isDark} />
                  <TokenRow label="--vg-bg"           tokenKey="--vg-bg"           value={getToken('--vg-bg')}           onChange={setToken} isDark={isDark} />
                  <TokenRow label="--vg-bg-header"    tokenKey="--vg-bg-header"    value={getToken('--vg-bg-header')}    onChange={setToken} isDark={isDark} />
                  <TokenRow label="--vg-bg-row-hover" tokenKey="--vg-bg-row-hover" value={getToken('--vg-bg-row-hover')} onChange={setToken} isDark={isDark} />
                  <TokenRow label="--vg-bg-row-selected" tokenKey="--vg-bg-row-selected" value={getToken('--vg-bg-row-selected')} onChange={setToken} isDark={isDark} />
                  <TokenRow label="--vg-border"       tokenKey="--vg-border"       value={getToken('--vg-border')}       onChange={setToken} isDark={isDark} />
                  <TokenRow label="--vg-text"         tokenKey="--vg-text"         value={getToken('--vg-text')}         onChange={setToken} isDark={isDark} />

                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: dimClr, marginBottom: 6, marginTop: 14 }}>Shape</div>
                  <TokenRow label="--vg-radius"    tokenKey="--vg-radius"    value={getToken('--vg-radius')}    onChange={setToken} type="text" isDark={isDark} />
                  <TokenRow label="--vg-font-size" tokenKey="--vg-font-size" value={getToken('--vg-font-size')} onChange={setToken} type="text" isDark={isDark} />
                  <TokenRow label="--vg-font"      tokenKey="--vg-font"      value={getToken('--vg-font')}      onChange={setToken} type="text" isDark={isDark} />
                </div>
              </div>
            )}

            {/* ── FEATURES PANEL ────────────────────────────────────── */}
            {activePanel === 'features' && (
              <div style={{ flex: 1, overflow: 'auto' }}>
                <div style={{
                  padding: '12px 16px 8px',
                  borderBottom: `1px solid ${borderClr}`,
                }}>
                  <span style={{ fontWeight: 700, fontSize: 13 }}>Feature flags</span>
                </div>
                <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {(Object.keys(features) as Array<keyof typeof features>).map(key => (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, color: dimClr, fontFamily: "'JetBrains Mono', monospace" }}>
                        {key}
                      </span>
                      <FeatToggle
                        label={features[key] ? 'ON' : 'OFF'}
                        value={features[key]}
                        onChange={v => setFeatures(prev => ({ ...prev, [key]: v }))}
                        isDark={isDark}
                      />
                    </div>
                  ))}

                  <div style={{
                    marginTop: 12, padding: 10,
                    background: isDark ? '#1c2438' : '#f8fafc',
                    borderRadius: 6, fontSize: 11,
                    color: dimClr, lineHeight: 1.6,
                  }}>
                    Note: toolbar and footer are managed by custom slots in this demo.
                    Toggle them here to see the slot vs built-in difference.
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  ENGINE COLUMN PANEL WRAPPER
//  The grid engine is captured via the toolbar slot ref.
//  This component re-renders when the parent state changes.
// ─────────────────────────────────────────────────────────────────────────────

function EngineColumnPanel({
  isDark, engineRef,
}: {
  isDark: boolean;
  engineRef: React.MutableRefObject<GridEngine<InventoryRow> | null>;
}) {
  const [tick, setTick] = useState(0);

  // Poll for engine availability (it becomes available after first toolbar render)
  useEffect(() => {
    if (engineRef.current) return;
    const id = setInterval(() => {
      if (engineRef.current) {
        setTick(t => t + 1);
        clearInterval(id);
      }
    }, 100);
    return () => clearInterval(id);
  }, [engineRef]);

  if (!engineRef.current) {
    return (
      <div style={{
        padding: 20, textAlign: 'center',
        fontSize: 12, color: isDark ? '#4b5670' : '#9ca3af',
        paddingTop: 40,
      }}>
        Grid initialising…
      </div>
    );
  }

  return <SidebarColumnManager engine={engineRef.current} />;
}
