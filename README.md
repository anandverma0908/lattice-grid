# @lattice-grid-lib/core

A high-performance, fully-customisable React data grid with row & column virtualisation.

[![npm version](https://img.shields.io/npm/v/@lattice-grid-lib/core.svg)](https://www.npmjs.com/package/@lattice-grid-lib/core)
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
npm install @lattice-grid-lib/core
# or
yarn add @lattice-grid-lib/core
# or
pnpm add @lattice-grid-lib/core
```

---

## Quick start

```tsx
import { LatticeGrid } from '@lattice-grid-lib/core';

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
    <LatticeGrid<Row>
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
import { LatticeGrid, GRID_THEMES } from '@lattice-grid-lib/core';

// Built-in preset
<LatticeGrid theme="dark" ... />

// Partial token override (merged on top of light)
<LatticeGrid theme={{ '--vg-accent': '#e11d48' }} ... />

// Full custom theme
const myTheme = { ...GRID_THEMES.dark, '--vg-accent': '#a855f7' };
<LatticeGrid theme={myTheme} ... />
```

### Available presets

`"light"` · `"dark"` · `"ocean"` · `"forest"` · `"sunset"`

---

## Localised UI text

Pass `texts` to translate built-in labels, buttons, tooltips, and accessibility
text such as the hide-column action.

```tsx
<LatticeGrid
  columns={columns}
  data={rows}
  texts={{
    hideColumn: t('grid.hideColumn'),
    manageColumns: t('grid.manageColumns'),
    columns: t('grid.columns'),
    rows: t('grid.rows'),
  }}
/>
```

---

## Headless API

The engine is fully decoupled from the renderer. Use it to build a completely custom grid UI:

```tsx
import { useGridEngine } from '@lattice-grid-lib/core';

function MyCustomGrid({ columns, data }) {
  const engine = useGridEngine(columns);
  const { visibleColumns, sortState, toggleSort, resizeColumn } = engine;
  // render your own header / body
}
```

---

## LatticeGrid props

| Prop | Type | Default | Description |
|---|---|---|---|
| `columns` | `ColumnDef<TData>[]` | — | Column tree |
| `data` | `TData[]` | — | Row data |
| `getRowId` | `(row, i) => string` | index | Stable row key |
| `height` | `number` | — | Max grid height in px; short data shrinks to content |
| `rowHeight` | `number` | `36` | Row height in px |
| `headerHeight` | `number` | `38` | Leaf header row height |
| `groupHeaderHeight` | `number` | `28` | Group header row height |
| `theme` | `ThemePreset \| GridTokens` | `"light"` | Theme preset or token map |
| `texts` | `Partial<GridTexts>` | English labels | Built-in UI text overrides |
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
