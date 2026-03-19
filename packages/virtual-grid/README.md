# @virtual-grid/core

A high-performance, fully-customisable React data grid with row & column virtualisation.

[![npm version](https://img.shields.io/npm/v/@virtual-grid/core.svg)](https://www.npmjs.com/package/@virtual-grid/core)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg)](https://reactjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

| Feature | Details |
|---|---|
| **Row virtualisation** | Renders only visible rows — handles 100k+ rows at 60fps |
| **Column virtualisation** | Renders only visible columns — handles wide tables with ease |
| **Column grouping** | Multi-level headers with group spans |
| **Column pinning** | Freeze columns to left or right |
| **Column resizing** | Drag the resize handle; respects min/max width |
| **Drag reorder** | HTML5 drag-and-drop column reordering |
| **Show / hide columns** | Built-in column manager panel |
| **Sorting** | Click header to cycle asc → desc → none |
| **Custom renderers** | `renderCell` and `renderHeader` per column |
| **Theming** | 5 built-in presets; full CSS-variable token override |
| **Headless engine** | `useGridEngine` for custom UI builds |
| **Zero dependencies** | Only React as a peer dep |
| **TypeScript** | Full generics on row data shape |

---

## Installation

```bash
npm install @virtual-grid/core
# or
yarn add @virtual-grid/core
# or
pnpm add @virtual-grid/core
```

---

## Quick start

```tsx
import { VirtualGrid } from '@virtual-grid/core';

interface Row {
  id: number;
  name: string;
  value: number;
}

const columns = [
  { id: 'name',  label: 'Name',  field: 'name',  width: 200, pinned: 'left' as const },
  { id: 'value', label: 'Value', field: 'value', width: 120 },
];

export function MyGrid({ rows }: { rows: Row[] }) {
  return (
    <VirtualGrid<Row>
      columns={columns}
      data={rows}
      height={500}
    />
  );
}
```

---

## Column groups

```tsx
const columns = [
  { id: 'name', label: 'Name', field: 'name', width: 200 },
  {
    id: 'week1',
    label: 'Week 1',
    children: [
      { id: 'd1', label: 'Mon', field: 'd1', width: 80 },
      { id: 'd2', label: 'Tue', field: 'd2', width: 80 },
    ],
  },
];
```

---

## Custom renderers

```tsx
const columns = [
  {
    id: 'status',
    label: 'Status',
    field: 'status',
    renderCell: (value, row) => (
      <span style={{ color: value === 'active' ? 'green' : 'red' }}>
        {String(value)}
      </span>
    ),
  },
];
```

---

## Theming

```tsx
import { VirtualGrid, GRID_THEMES } from '@virtual-grid/core';

// Built-in preset
<VirtualGrid theme="dark" ... />

// Partial token override (merged on top of light)
<VirtualGrid theme={{ '--vg-accent': '#e11d48' }} ... />

// Full custom theme
const myTheme = { ...GRID_THEMES.dark, '--vg-accent': '#a855f7' };
<VirtualGrid theme={myTheme} ... />
```

### Available presets

`"light"` · `"dark"` · `"ocean"` · `"forest"` · `"sunset"`

---

## Headless API

The engine is fully decoupled from the renderer. Use it to build a completely custom grid UI:

```tsx
import { useGridEngine } from '@virtual-grid/core';

function MyCustomGrid({ columns, data }) {
  const engine = useGridEngine(columns);
  const { visibleColumns, sortState, toggleSort, resizeColumn } = engine;
  // render your own header / body
}
```

---

## VirtualGrid props

| Prop | Type | Default | Description |
|---|---|---|---|
| `columns` | `ColumnDef<TData>[]` | — | Column tree |
| `data` | `TData[]` | — | Row data |
| `getRowId` | `(row, i) => string` | index | Stable row key |
| `height` | `number` | `480` | Viewport height in px |
| `rowHeight` | `number` | `36` | Row height in px |
| `headerHeight` | `number` | `38` | Leaf header row height |
| `groupHeaderHeight` | `number` | `28` | Group header row height |
| `theme` | `ThemePreset \| GridTokens` | `"light"` | Theme preset or token map |
| `alternateRows` | `boolean` | `true` | Zebra-stripe rows |
| `showToolbar` | `boolean` | `true` | Show built-in toolbar |
| `showFooter` | `boolean` | `true` | Show row/col count footer |
| `toolbarLeft` | `ReactNode` | — | Left toolbar slot |
| `toolbarRight` | `ReactNode` | — | Right toolbar slot |
| `emptyState` | `ReactNode` | — | Rendered when data is empty |
| `onRowClick` | `(row, i) => void` | — | Row click callback |
| `onSortChange` | `(sort) => void` | — | Sort state change |
| `onColumnResize` | `(id, width) => void` | — | Resize end callback |
| `onColumnReorder` | `(order) => void` | — | Reorder callback |
| `ariaLabel` | `string` | `"Data grid"` | Grid aria-label |

---

## Repository structure

```
virtual-grid/
├── packages/
│   └── virtual-grid/           @virtual-grid/core (the library)
│       ├── src/
│       │   ├── core/
│       │   │   ├── useGridEngine.ts     Pure state machine
│       │   │   ├── GridContext.ts       React context
│       │   │   └── themes.ts           Token system
│       │   ├── hooks/
│       │   │   ├── useVirtualizer.ts   Row + column windowing
│       │   │   ├── useColumnResize.ts  Drag-resize hook
│       │   │   └── useColumnDrag.ts    Drag-reorder hook
│       │   ├── components/
│       │   │   ├── VirtualGrid.tsx     Main component
│       │   │   ├── HeaderCell.tsx
│       │   │   ├── Cells.tsx
│       │   │   ├── ColumnManager.tsx
│       │   │   └── Toolbar.tsx
│       │   ├── types/
│       │   │   └── index.ts            All public types
│       │   └── index.ts                Public API barrel
│       ├── package.json
│       ├── vite.config.ts
│       └── tsconfig.json
└── apps/
    └── demo/                   Documentation + live demo site
        ├── src/
        │   ├── App.tsx
        │   ├── data/
        │   │   ├── inventory.ts        Demo data factory
        │   │   └── columns.tsx         Demo column defs
        │   └── components/
        │       └── CodeBlock.tsx
        └── index.html
```

---

## Development

```bash
# Install dependencies
npm install

# Run demo app (hot-reloads library source)
npm run dev

# Build the library
npm run build

# Run tests
npm run test

# Type-check
npm run typecheck
```

---

## Licence

MIT © Your Name
