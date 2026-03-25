# Changelog

All notable changes to `@lattice-grid-lib/core` will be documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-03-18

### Added
- `LatticeGrid` component with row & column virtualisation
- `useGridEngine` headless state machine
- `useVirtualRows` and `useVirtualCols` windowing hooks
- Column grouping (multi-level headers)
- Column pinning (left / right)
- Column resizing (drag handle)
- Column drag-and-drop reorder
- Show / hide columns via built-in `ColumnManager` panel
- Sortable columns (asc → desc → clear)
- Five built-in theme presets: `light`, `dark`, `ocean`, `forest`, `sunset`
- Full CSS-variable token override system (`GridTokens`)
- `renderCell` and `renderHeader` custom renderer props per column
- `toolbarLeft` / `toolbarRight` slot props
- `emptyState` slot prop
- `onRowClick`, `onSortChange`, `onColumnResize`, `onColumnReorder` callbacks
- `getRowId` for stable row keys
- Full TypeScript generics on row data shape
- ARIA roles: `grid`, `rowgroup`, `row`, `columnheader`
- Zero runtime dependencies
