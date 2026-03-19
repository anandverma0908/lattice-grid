// =============================================================================
//  @virtual-grid/core — Public API  (v2.0)
// =============================================================================

// Main component
export { VirtualGrid } from './components/VirtualGrid';

// Additional UI components (usable standalone)
export { GridPagination }  from './components/GridPagination';
export { ColumnManager }   from './components/ColumnManager';

// Headless engine
export { useGridEngine } from './core/useGridEngine';

// Feature hooks
export { useVirtualRows, useVirtualCols, buildColumnOffsets, calcColWindow } from './hooks/useVirtualizer';
export { useColumnResize }    from './hooks/useColumnResize';
export { useColumnDrag }      from './hooks/useColumnDrag';
export { useRowSelection }    from './hooks/useRowSelection';
export { useColumnFilter }    from './hooks/useColumnFilter';
export { useGridKeyboard }    from './hooks/useGridKeyboard';
export { useGridPagination }  from './hooks/useGridPagination';
export { useGridExport }      from './hooks/useGridExport';
export { useColumnManager }   from './hooks/useColumnManager';

// Context (for custom slot components that need engine access)
export { useGridContext }     from './core/GridContext';

// Theming
export { GRID_THEMES, resolveTokens, tokensToStyle } from './core/themes';

// Types — component props
export type { VirtualGridProps }  from './types';

// Types — customisation
export type {
  GridFeatures,
  GridIcons,
  GridClassNames,
  GridStyles,
  GridSlots,
  ColumnManagerRenderProps,
} from './types';

// Types — column definitions
export type {
  ColumnDef, LeafColumnDef, GroupColumnDef, ResolvedColumn,
  PinSide, SortDirection, SortState,
} from './types';

// Types — engine
export type { GridEngine, GridEngineState, GridEngineActions } from './types';

// Types — virtualisation
export type { VirtualRowWindow, VirtualColWindow } from './types';

// Types — theming
export type { GridTokens, ThemePreset } from './types';

// Types — hooks
export type { UseRowSelectionOptions, UseRowSelectionReturn, RowId }    from './hooks/useRowSelection';
export type { UseColumnFilterOptions, UseColumnFilterReturn,
              FilterValues, FilterMatcher }                              from './hooks/useColumnFilter';
export type { UseGridKeyboardOptions, UseGridKeyboardReturn,
              FocusedCell }                                              from './hooks/useGridKeyboard';
export type { UseGridPaginationOptions, UseGridPaginationReturn }        from './hooks/useGridPagination';
export type { UseGridExportOptions, UseGridExportReturn }                from './hooks/useGridExport';
export type { UseColumnManagerReturn, ColumnManagerPanelProps }           from './hooks/useColumnManager';

// Type guard
export { isGroupColumn } from './types';
