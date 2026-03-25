// =============================================================================
//  Demo — 300 column definitions
//  4 pinned-left fixed columns + 296 date columns in groups of 7 (42 weeks)
//  + 2 standalone ungrouped columns (rowspan=2 test)
// =============================================================================

import React from 'react';
import type { ColumnDef } from '@lattice-grid-lib/core';
import type { InventoryRow } from './inventory';

// ─── Cell renderers ───────────────────────────────────────────────────────────

const NumCell = ({ v }: { v: number }) => (
  <span style={{
    fontFamily: 'var(--vg-font-mono)', fontSize: 12, display: 'block',
    width: '100%', textAlign: 'right',
    color: v === 0 ? 'var(--vg-text-dim)' : 'var(--vg-text)',
  }}>
    {v}
  </span>
);

const ChannelBadge = ({ v }: { v: number }) => {
  const colors: Record<number, [string, string]> = {
    1: ['var(--vg-accent-bg)', 'var(--vg-accent-text)'],
    2: ['#fef3c7', '#92400e'],
    3: ['#dcfce7', '#166534'],
  };
  const [bg, fg] = colors[v] ?? colors[1]!;
  return (
    <span style={{
      background: bg, color: fg, borderRadius: 3,
      padding: '1px 7px', fontWeight: 700, fontSize: 11,
    }}>
      CH{v}
    </span>
  );
};

const StatusBadge = ({ v }: { v: string }) => {
  const m: Record<string, [string, string, string]> = {
    active: ['var(--vg-accent-bg)', 'var(--vg-accent-text)', 'var(--vg-accent)'],
    low:    ['#fef3c7', '#92400e', '#f59e0b'],
    out:    ['#fee2e2', '#991b1b', '#ef4444'],
  };
  const [bg, fg, dot] = m[v] ?? m.active!;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: bg, color: fg, borderRadius: 3,
      padding: '1px 7px', fontWeight: 600, fontSize: 11,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: dot, flexShrink: 0 }} />
      {v.charAt(0).toUpperCase() + v.slice(1)}
    </span>
  );
};

// ─── Build 300 columns ───────────────────────────────────────────────────────

function buildColumns(): ColumnDef<InventoryRow>[] {
  const cols: ColumnDef<InventoryRow>[] = [];

  // 4 pinned-left fixed columns
  cols.push(
    {
      id: 'product', label: 'Product / SKU', field: 'product',
      width: 210, pinned: 'left', sortable: true,
    },
    {
      id: 'dc', label: 'DC / SCC', field: 'dc',
      width: 120, pinned: 'left', sortable: true,
    },
    {
      id: 'channel', label: 'Ch.', field: 'channel',
      width: 56, pinned: 'left', sortable: true, align: 'center',
      renderCell: v => <ChannelBadge v={v as number} />,
    },
    {
      id: 'status', label: 'Status', field: 'status',
      width: 86, pinned: 'left', sortable: true,
      renderCell: v => <StatusBadge v={v as string} />,
    },
  );

  // 42 groups × 7 days = 294 date columns
  const startDate = new Date(2026, 3, 1); // 1 Apr 2026
  let dayIdx = 1;

  for (let w = 0; w < 42; w++) {
    const wStart = new Date(startDate);
    wStart.setDate(startDate.getDate() + w * 7);
    const wEnd = new Date(wStart);
    wEnd.setDate(wStart.getDate() + 6);

    const fmt = (d: Date) => {
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return `${d.getDate()} ${months[d.getMonth()]}`;
    };

    const children: ColumnDef<InventoryRow>[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(wStart);
      date.setDate(wStart.getDate() + d);
      const id = `d${dayIdx}`;
      children.push({
        id,
        label:    fmt(date),
        field:    id as keyof InventoryRow,
        width:    66,
        sortable: true,
        align:    'right',
        renderCell: v => <NumCell v={v as number} />,
      });
      dayIdx++;
    }

    cols.push({
      id:    `week${w + 1}`,
      label: `Wk ${w + 1}: ${fmt(wStart)}–${fmt(wEnd)} 2026`,
      children,
    });
  }

  // 2 standalone ungrouped columns (tests rowspan=2 rendering)
  for (let s = 0; s < 2; s++) {
    const id = `d${dayIdx}`;
    cols.push({
      id,
      label:    `Extra ${s + 1}`,
      field:    id as keyof InventoryRow,
      width:    80,
      sortable: true,
      align:    'right',
      renderCell: v => <NumCell v={v as number} />,
    });
    dayIdx++;
  }

  return cols;
}

export const INVENTORY_COLUMNS = buildColumns();
