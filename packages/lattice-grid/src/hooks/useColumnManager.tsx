// =============================================================================
//  @lattice-grid/core — useColumnManager
//
//  A standalone hook that gives you everything needed to render a column
//  manager panel ANYWHERE in your app — completely independent of the grid's
//  internal toolbar.
//
//  Usage
//  ─────
//  Step 1: Create a shared engine ref in your page component.
//
//    const colMgr = useColumnManager();
//
//  Step 2: Pass colMgr.captureEngine to the grid via slots.toolbar
//  so it can capture the engine on first render.
//
//    <LatticeGrid
//      slots={{
//        toolbar: (engine) => {
//          colMgr.captureEngine(engine);   // ← captures once
//          return <MyCustomToolbar />;      // return whatever toolbar you want
//        },
//      }}
//    />
//
//  Step 3: Render colMgr.ColumnManagerPanel anywhere — sidebar, modal, drawer.
//
//    // In a sidebar:
//    <colMgr.ColumnManagerPanel />
//
//    // Or with the built-in toggle button:
//    <button onClick={colMgr.toggle}>Manage columns</button>
//    {colMgr.isOpen && <colMgr.ColumnManagerPanel />}
//
//  Step 4 (optional): Pass a custom render function for full control.
//
//    <colMgr.ColumnManagerPanel
//      render={({ engine, close }) => (
//        <MySidebarPanel engine={engine} onClose={close} />
//      )}
//    />
//
//  Notes
//  ─────
//  • useColumnManager is completely independent of GridContext.
//    It works by receiving the engine from the slots.toolbar callback.
//  • The engine ref stays stable — no re-render loops.
//  • ColumnManagerPanel renders nothing until the engine is captured
//    (i.e. until the grid has mounted and called slots.toolbar at least once).
// =============================================================================

import React, {
  useState,
  useRef,
  useCallback,
  useMemo,
  memo,
  type ReactNode,
} from 'react';
import type { GridEngine } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
//  BUILT-IN PANEL UI
//  Re-uses the same styles as the internal ColumnManager but is completely
//  self-contained — no dependency on GridContext.
// ─────────────────────────────────────────────────────────────────────────────

interface BuiltInPanelProps<TData> {
  engine: GridEngine<TData>;
  onClose?: (() => void) | undefined;
}

function BuiltInPanel<TData>({ engine, onClose }: BuiltInPanelProps<TData>) {
  const {
    orderedColumns,
    toggleColumnVisibility,
    pinColumn,
    showAllColumns,
    resetColumns,
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
      display: 'flex', flexDirection: 'column',
      fontFamily: 'var(--vg-font, "DM Sans", sans-serif)',
      fontSize: 'var(--vg-font-size, 12.5px)',
      background: 'var(--vg-bg-panel, #fff)',
      border: '1px solid var(--vg-border-strong, #d1d5db)',
      borderRadius: 'var(--vg-radius, 7px)',
      boxShadow: 'var(--vg-shadow-panel, 0 8px 24px rgba(0,0,0,0.1))',
      overflow: 'hidden',
      minWidth: 240,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 14px 8px',
        borderBottom: '1px solid var(--vg-border, #e5e7eb)',
        gap: 8, flexShrink: 0,
      }}>
        <span style={{
          fontWeight: 700, fontSize: 11,
          textTransform: 'uppercase', letterSpacing: '0.08em',
          color: 'var(--vg-text-dim, #6b7280)',
        }}>
          Columns
          {hiddenCount > 0 && (
            <span style={{
              marginLeft: 6,
              background: 'var(--vg-accent-bg, #dbeafe)',
              color: 'var(--vg-accent-text, #1d4ed8)',
              borderRadius: 10, padding: '1px 6px', fontSize: 10,
            }}>
              {hiddenCount} hidden
            </span>
          )}
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          {hiddenCount > 0 && (
            <button
              onClick={showAllColumns}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 11, color: 'var(--vg-accent, #2563eb)',
                fontWeight: 600,
                fontFamily: 'var(--vg-font, sans-serif)',
                padding: '2px 4px',
              }}
            >
              Show all
            </button>
          )}
          <button
            onClick={resetColumns}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 11, color: 'var(--vg-text-dim, #6b7280)',
              fontFamily: 'var(--vg-font, sans-serif)',
              padding: '2px 4px',
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--vg-border, #e5e7eb)', flexShrink: 0 }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search columns…"
          style={{
            width: '100%', padding: '5px 9px',
            border: '1px solid var(--vg-border-strong, #d1d5db)',
            borderRadius: 'var(--vg-radius-sm, 4px)',
            background: 'var(--vg-bg, #fff)',
            color: 'var(--vg-text, #111827)',
            fontSize: 12, outline: 'none',
            fontFamily: 'var(--vg-font, sans-serif)',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Column list */}
      <div style={{ overflow: 'auto', flex: 1, maxHeight: 320 }}>
        {filtered.map(col => (
          <div
            key={col.id}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '6px 14px',
              borderBottom: '1px solid var(--vg-border, #e5e7eb)',
              transition: 'background 0.1s',
            }}
            onMouseEnter={e =>
              (e.currentTarget as HTMLElement).style.background = 'var(--vg-bg-row-hover, #f0f5ff)'
            }
            onMouseLeave={e =>
              (e.currentTarget as HTMLElement).style.background = 'transparent'
            }
          >
            <input
              type="checkbox"
              id={`vcm-${col.id}`}
              checked={!col.hidden}
              onChange={() => toggleColumnVisibility(col.id)}
              style={{
                accentColor: 'var(--vg-accent, #2563eb)',
                cursor: 'pointer', width: 13, height: 13, flexShrink: 0,
              }}
            />
            <label
              htmlFor={`vcm-${col.id}`}
              style={{
                flex: 1, cursor: 'pointer',
                color: col.hidden
                  ? 'var(--vg-text-dim, #6b7280)'
                  : 'var(--vg-text, #111827)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}
            >
              {col.label}
            </label>
            <select
              value={col.pinned ?? ''}
              onChange={e =>
                pinColumn(col.id, (e.target.value as 'left' | 'right') || null)
              }
              style={{
                fontSize: 11, padding: '2px 5px',
                background: 'var(--vg-bg-btn, #f3f4f6)',
                color: 'var(--vg-text, #111827)',
                border: '1px solid var(--vg-border-strong, #d1d5db)',
                borderRadius: 'var(--vg-radius-xs, 3px)',
                cursor: 'pointer',
                fontFamily: 'var(--vg-font, sans-serif)',
                outline: 'none',
              }}
            >
              <option value="">No pin</option>
              <option value="left">Pin left</option>
              <option value="right">Pin right</option>
            </select>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{
            padding: '20px 14px', textAlign: 'center',
            fontSize: 12, color: 'var(--vg-text-dim, #6b7280)',
          }}>
            No columns match "{search}"
          </div>
        )}
      </div>

      {/* Footer */}
      {onClose && (
        <div style={{
          padding: '10px 14px',
          borderTop: '1px solid var(--vg-border, #e5e7eb)',
          flexShrink: 0,
        }}>
          <button
            onClick={onClose}
            style={{
              width: '100%', padding: '7px 12px',
              background: 'var(--vg-accent, #2563eb)',
              color: 'var(--vg-accent-fg, #fff)',
              border: 'none',
              borderRadius: 'var(--vg-radius-sm, 4px)',
              cursor: 'pointer', fontWeight: 600,
              fontSize: 'var(--vg-font-size, 12.5px)',
              fontFamily: 'var(--vg-font, sans-serif)',
            }}
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  PANEL COMPONENT PROPS
// ─────────────────────────────────────────────────────────────────────────────

export interface ColumnManagerPanelProps<TData = unknown> {
  /**
   * Custom render function. If provided, renders instead of the built-in panel.
   * Receives the engine and a close callback.
   */
  render?: (props: {
    engine: GridEngine<TData>;
    close: () => void;
  }) => ReactNode;

  /** Called when the built-in "Done" button is clicked. */
  onClose?: () => void;

  /** Additional CSS applied to the panel wrapper. */
  style?: React.CSSProperties;

  /** Additional className on the panel wrapper. */
  className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
//  HOOK RETURN TYPE
// ─────────────────────────────────────────────────────────────────────────────

export interface UseColumnManagerReturn<TData = unknown> {
  /** Whether the panel is currently open (for toggle-based usage). */
  isOpen: boolean;
  /** Open the panel. */
  open:   () => void;
  /** Close the panel. */
  close:  () => void;
  /** Toggle open/closed. */
  toggle: () => void;

  /**
   * Call this inside slots.toolbar (or anywhere else the grid engine is
   * available) to capture the engine reference.
   *
   * @example
   * <LatticeGrid
   *   slots={{
   *     toolbar: (engine) => {
   *       colMgr.captureEngine(engine);
   *       return <MyToolbar />;
   *     }
   *   }}
   * />
   */
  captureEngine: (engine: GridEngine<TData>) => void;

  /**
   * The engine reference (null until first captureEngine call).
   * Use this if you want to wire your own panel UI directly to the engine
   * without using ColumnManagerPanel.
   */
  engine: GridEngine<TData> | null;

  /**
   * Ready-made panel component. Place it anywhere in your JSX.
   * Renders nothing if the engine hasn't been captured yet.
   *
   * @example
   * // In a sidebar:
   * <colMgr.ColumnManagerPanel />
   *
   * // With a custom renderer:
   * <colMgr.ColumnManagerPanel
   *   render={({ engine, close }) => <MySidebar engine={engine} onClose={close} />}
   * />
   */
  ColumnManagerPanel: (props: ColumnManagerPanelProps<TData>) => ReactNode;
}

// ─────────────────────────────────────────────────────────────────────────────
//  HOOK
// ─────────────────────────────────────────────────────────────────────────────

/**
 * useColumnManager
 *
 * Returns a standalone column manager that can be rendered anywhere in your
 * app — completely independent of the grid's internal toolbar.
 *
 * @example
 * // 1. Create the manager in your page component
 * const colMgr = useColumnManager<MyRow>();
 *
 * // 2. Capture the engine via the toolbar slot
 * <LatticeGrid
 *   slots={{
 *     toolbar: (engine) => {
 *       colMgr.captureEngine(engine);
 *       return (
 *         <div>
 *           <span>My toolbar</span>
 *           <button onClick={colMgr.toggle}>Columns</button>
 *         </div>
 *       );
 *     }
 *   }}
 * />
 *
 * // 3. Render the panel wherever you want
 * <aside>
 *   <colMgr.ColumnManagerPanel />
 * </aside>
 *
 * // Or conditionally (toggle mode)
 * {colMgr.isOpen && (
 *   <div className="floating-panel">
 *     <colMgr.ColumnManagerPanel onClose={colMgr.close} />
 *   </div>
 * )}
 */
export function useColumnManager<TData = unknown>(): UseColumnManagerReturn<TData> {
  const [isOpen, setIsOpen] = useState(false);
  const engineRef = useRef<GridEngine<TData> | null>(null);
  // Trigger re-render when engine is first captured
  const [captured, setCaptured] = useState(false);

  const open   = useCallback(() => setIsOpen(true),  []);
  const close  = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(v => !v), []);

  const captureEngine = useCallback((eng: GridEngine<TData>) => {
    engineRef.current = eng;
    if (!captured) setCaptured(true);
  }, [captured]);

  const ColumnManagerPanel = useCallback(
    ({ render, onClose, style, className }: ColumnManagerPanelProps<TData>) => {
      const eng = engineRef.current;
      if (!eng) return null;

      if (render) {
        return (
          <div style={style} className={className}>
            {render({ engine: eng, close })}
          </div>
        );
      }

      return (
        <div style={style} className={className}>
          <BuiltInPanel<TData> engine={eng} onClose={onClose} />
        </div>
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [captured, close],
  );

  return {
    isOpen,
    open,
    close,
    toggle,
    captureEngine,
    engine: engineRef.current,
    ColumnManagerPanel,
  };
}
