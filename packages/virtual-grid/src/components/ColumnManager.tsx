// =============================================================================
//  @virtual-grid/core — ColumnManager
//
//  Can be replaced entirely via slots.columnManager.
//  Can be used standalone anywhere via useColumnManager hook (see index.ts).
// =============================================================================

import React, { memo, useEffect, useRef } from 'react';
import { useGridContext } from '../core/GridContext';

interface ColumnManagerProps {
  onClose: () => void;
}

export const ColumnManager = memo(function ColumnManager({ onClose }: ColumnManagerProps) {
  const { engine, features, classNames } = useGridContext();
  const { orderedColumns, toggleColumnVisibility, pinColumn, showAllColumns } = engine;
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const id = setTimeout(() => document.addEventListener('mousedown', handler), 50);
    return () => {
      clearTimeout(id);
      document.removeEventListener('mousedown', handler);
    };
  }, [onClose]);

  const hiddenCount = orderedColumns.filter(c => c.hidden).length;

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Column manager"
      className={classNames.columnPanel || undefined}
      style={{
        position:       'absolute',
        top:            'calc(100% + 4px)',
        right:          0,
        zIndex:         'var(--vg-z-panel)' as unknown as number,
        background:     'var(--vg-bg-panel)',
        border:         '1px solid var(--vg-border-strong)',
        borderRadius:   'var(--vg-radius)',
        boxShadow:      'var(--vg-shadow-panel)',
        minWidth:       260,
        maxHeight:      420,
        display:        'flex',
        flexDirection:  'column',
        overflow:       'hidden',
        fontFamily:     'var(--vg-font)',
      }}
    >
      {/* Panel header */}
      <div style={{
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'space-between',
        padding:         '10px 14px 8px',
        borderBottom:    '1px solid var(--vg-border)',
        flexShrink:      0,
      }}>
        <span style={{
          fontWeight:    700, fontSize: 11,
          textTransform: 'uppercase', letterSpacing: '0.08em',
          color:         'var(--vg-text-dim)',
        }}>
          Columns
          {hiddenCount > 0 && (
            <span style={{
              marginLeft: 6,
              background: 'var(--vg-accent-bg)', color: 'var(--vg-accent-text)',
              borderRadius: 10, padding: '1px 6px', fontSize: 10,
            }}>
              {hiddenCount} hidden
            </span>
          )}
        </span>
        {hiddenCount > 0 && (
          <button
            onClick={showAllColumns}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 11, color: 'var(--vg-accent)',
              fontWeight: 600, fontFamily: 'var(--vg-font)', padding: '2px 4px',
            }}
          >
            Show all
          </button>
        )}
      </div>

      {/* Column list */}
      <div style={{ overflow: 'auto', flex: 1 }}>
        {orderedColumns.map(col => (
          <div
            key={col.id}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '6px 14px',
              fontSize: 'var(--vg-font-size)',
              color: col.hidden ? 'var(--vg-text-dim)' : 'var(--vg-text)',
              transition: 'background var(--vg-transition)',
            }}
            onMouseEnter={e =>
              ((e.currentTarget as HTMLElement).style.background = 'var(--vg-bg-row-hover)')
            }
            onMouseLeave={e =>
              ((e.currentTarget as HTMLElement).style.background = 'transparent')
            }
          >
            <input
              type="checkbox"
              id={`vg-col-${col.id}`}
              checked={!col.hidden}
              onChange={() => toggleColumnVisibility(col.id)}
              style={{
                accentColor: 'var(--vg-accent)', cursor: 'pointer',
                width: 13, height: 13, flexShrink: 0,
              }}
            />
            <label
              htmlFor={`vg-col-${col.id}`}
              style={{
                flex: 1, cursor: 'pointer',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}
            >
              {col.label}
            </label>
            {features.columnPin && (
              <select
                value={col.pinned ?? ''}
                onChange={e =>
                  pinColumn(col.id, (e.target.value as 'left' | 'right') || null)
                }
                style={{
                  fontSize: 11, padding: '2px 5px',
                  background: 'var(--vg-bg-btn)', color: 'var(--vg-text)',
                  border: '1px solid var(--vg-border-strong)',
                  borderRadius: 'var(--vg-radius-xs)',
                  cursor: 'pointer', fontFamily: 'var(--vg-font)', outline: 'none',
                }}
              >
                <option value="">No pin</option>
                <option value="left">Pin left</option>
                <option value="right">Pin right</option>
              </select>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        padding: '10px 14px', borderTop: '1px solid var(--vg-border)', flexShrink: 0,
      }}>
        <button
          onClick={onClose}
          style={{
            width: '100%', padding: '7px 12px',
            background: 'var(--vg-accent)', color: 'var(--vg-accent-fg)',
            border: 'none', borderRadius: 'var(--vg-radius-sm)',
            cursor: 'pointer', fontWeight: 600,
            fontSize: 'var(--vg-font-size)', fontFamily: 'var(--vg-font)',
            transition: 'background var(--vg-transition)',
          }}
          onMouseEnter={e =>
            ((e.currentTarget as HTMLElement).style.background = 'var(--vg-accent-hover)')
          }
          onMouseLeave={e =>
            ((e.currentTarget as HTMLElement).style.background = 'var(--vg-accent)')
          }
        >
          Done
        </button>
      </div>
    </div>
  );
});
