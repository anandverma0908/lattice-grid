// =============================================================================
//  @lattice-grid-lib/core — Public Type Definitions  (v2.1)
// =============================================================================

import type { CSSProperties, ReactNode } from "react";

export type PinSide = "left" | "right";
export type SortDirection = "asc" | "desc";

// ─────────────────────────────────────────────────────────────────────────────
//  COLUMN STATE  (serialisable — use with onColumnStateChange / initialColumnState)
// ─────────────────────────────────────────────────────────────────────────────

export interface ColumnState {
  id: string;
  hidden: boolean;
  pinned: PinSide | null;
  width: number;
  order: number;
}

// ─────────────────────────────────────────────────────────────────────────────
//  COLUMN DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

export interface LeafColumnDef<TData = unknown> {
  id: string;
  label: string;
  field?: keyof TData & string;
  accessor?: (row: TData) => unknown;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  pinned?: PinSide;
  hidden?: boolean;
  sortable?: boolean;
  resizable?: boolean;
  draggable?: boolean;
  hideable?: boolean;
  stock?:string;
  // FIX 3: renderHeader now receives (col, engine) as second arg so custom
  // headers can access sort state, fire actions, render filter inputs, etc.
  renderHeader?: (
    col: ResolvedColumn<TData>,
    engine?: GridEngine<TData>,
  ) => ReactNode;
  renderCell?: (value: unknown, row: TData) => ReactNode;
  /**
   * When true, cells with a custom renderCell will show a lightweight
   * placeholder while the grid is scrolling, then render the real content
   * once scrolling stops. Use this for expensive custom cell components.
   */
  deferRender?: boolean;
  align?: "left" | "center" | "right";
  cellStyle?: CSSProperties;
  headerStyle?: CSSProperties;
}

export interface GroupColumnDef<TData = any> {
  id: string;
  label: string;
  children: Array<LeafColumnDef<TData>>;
  headerStyle?: CSSProperties;
}

export type ColumnDef<TData = unknown> =
  | LeafColumnDef<TData>
  | GroupColumnDef<TData>;

export function isGroupColumn<TData>(
  col: ColumnDef<TData>,
): col is GroupColumnDef<TData> {
  return (
    "children" in col && Array.isArray((col as GroupColumnDef<TData>).children)
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  RESOLVED COLUMN
// ─────────────────────────────────────────────────────────────────────────────

export interface ResolvedColumn<TData = any> {
  id: string;
  label: string;
  field?: keyof TData & string;
  accessor?: (row: TData) => unknown;
  renderCell?: LeafColumnDef<TData>["renderCell"];
  deferRender?: boolean;
  renderHeader?: LeafColumnDef<TData>["renderHeader"];
  cellStyle?: CSSProperties;
  headerStyle?: CSSProperties;
  align: "left" | "center" | "right";
  sortable: boolean;
  resizable: boolean;
  draggable: boolean;
  hideable: boolean;
  width: number;
  minWidth: number;
  maxWidth: number;
  pinned: PinSide | null;
  hidden: boolean;
  groupId: string | null;
  defIndex: number;
}

// ─────────────────────────────────────────────────────────────────────────────
//  SORT STATE
// ─────────────────────────────────────────────────────────────────────────────

export interface SortState {
  columnId: string | null;
  direction: SortDirection;
}

// ─────────────────────────────────────────────────────────────────────────────
//  ENGINE
// ─────────────────────────────────────────────────────────────────────────────

export interface GridEngineState<TData = unknown> {
  orderedColumns: ResolvedColumn<TData>[];
  visibleColumns: ResolvedColumn<TData>[];
  pinnedLeftColumns: ResolvedColumn<TData>[];
  pinnedRightColumns: ResolvedColumn<TData>[];
  scrollableColumns: ResolvedColumn<TData>[];
  pinnedLeftWidth: number;
  pinnedRightWidth: number;
  scrollableWidth: number;
  sortState: SortState;
  groups: GroupColumnDef<TData>[];
  hasGroups: boolean;
}

export interface GridEngineActions {
  resizeColumn: (columnId: string, delta: number) => void;
  setColumnWidth: (columnId: string, width: number) => void;
  pinColumn: (columnId: string, side: PinSide | null) => void;
  toggleColumnVisibility: (columnId: string) => void;
  showAllColumns: () => void;
  moveColumnBefore: (sourceId: string, targetId: string) => void;
  moveColumnToEnd: (sourceId: string) => void;
  toggleSort: (columnId: string) => void;
  resetColumns: () => void;
}

export type GridEngine<TData = unknown> = GridEngineState<TData> &
  GridEngineActions;

// ─────────────────────────────────────────────────────────────────────────────
//  VIRTUALISER
// ─────────────────────────────────────────────────────────────────────────────

export interface VirtualRowWindow {
  startIndex: number;
  endIndex: number;
  totalHeight: number;
  offsetY: number;
}

export interface VirtualColWindow {
  startIndex: number;
  endIndex: number;
  totalWidth: number;
  offsets: number[];
}

// ─────────────────────────────────────────────────────────────────────────────
//  THEMING
// ─────────────────────────────────────────────────────────────────────────────

export type GridTokens = Partial<Record<`--vg-${string}`, string>>;
export type ThemePreset = "light" | "dark" | "ocean" | "forest" | "sunset";

// ─────────────────────────────────────────────────────────────────────────────
//  FEATURE FLAGS
// ─────────────────────────────────────────────────────────────────────────────

export interface GridFeatures {
  sort?: boolean;
  resize?: boolean;
  reorder?: boolean;
  columnHide?: boolean;
  columnPin?: boolean;
  alternateRows?: boolean;
  toolbar?: boolean;
  footer?: boolean;
  rowSelection?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
//  ICONS
// ─────────────────────────────────────────────────────────────────────────────

export interface GridIcons {
  sortAsc?: ReactNode;
  sortDesc?: ReactNode;
  sortNone?: ReactNode;
  hideColumn?: ReactNode;
  columnsPanel?: ReactNode;
  dragHandle?: ReactNode;
}

// ─────────────────────────────────────────────────────────────────────────────
//  CLASSNAMES
// ─────────────────────────────────────────────────────────────────────────────

export interface GridClassNames {
  root?: string;
  toolbar?: string;
  headerRow?: string;
  groupRow?: string;
  headerCell?: string;
  groupHeaderCell?: string;
  row?: string;
  rowSelected?: string;
  rowHovered?: string;
  cell?: string;
  pinnedCell?: string;
  footer?: string;
  columnPanel?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
//  STYLE OVERRIDES
// ─────────────────────────────────────────────────────────────────────────────

export interface GridStyles {
  root?: CSSProperties;
  toolbar?: CSSProperties;
  headerRow?: CSSProperties;
  groupRow?: CSSProperties;
  headerCell?: CSSProperties;
  groupHeaderCell?: CSSProperties;
  row?: CSSProperties;
  rowSelected?: CSSProperties;
  cell?: CSSProperties;
  pinnedCell?: CSSProperties;
  footer?: CSSProperties;
}

// ─────────────────────────────────────────────────────────────────────────────
//  SLOTS
// ─────────────────────────────────────────────────────────────────────────────

export interface ColumnManagerRenderProps<TData = unknown> {
  engine: GridEngine<TData>;
  onClose: () => void;
}

export interface GridSlots<TData = unknown> {
  toolbar?: (engine: GridEngine<TData>) => ReactNode;
  toolbarLeft?: ReactNode;
  toolbarRight?: ReactNode;
  columnManager?: (props: ColumnManagerRenderProps<TData>) => ReactNode;
  footer?: (props: {
    startRow: number;
    endRow: number;
    totalRows: number;
    visibleCols: number;
    totalCols: number;
  }) => ReactNode;
  emptyState?: ReactNode;
  loadingOverlay?: ReactNode;
  /**
   * Rendered in place of a deferred cell while the grid is scrolling.
   * Defaults to an animated shimmer bar.
   */
  loadingCell?: ReactNode;
  /**
   * Render an overlay element inside a selected row.
   * Receives the clicked row data and its index.
   * Position it however you like — the row has `position: relative`.
   *
   * @example
   * slots={{
   *   rowSelectionIndicator: (row, index) => (
   *     <div style={{
   *       position: "absolute", bottom: 0, left: 0,
   *       width: "100%", height: "0.08rem",
   *       background: "linear-gradient(to right, #F9B16E, #F68080)",
   *       pointerEvents: "none", zIndex: 1,
   *     }} />
   *   )
   * }}
   */
  rowSelectionIndicator?: (row: TData, index: number) => ReactNode;
}

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN PROPS
// ─────────────────────────────────────────────────────────────────────────────

export interface LatticeGridProps<TData = unknown> {
  // Data
  columns: ColumnDef<TData>[];
  data: TData[];
  getRowId?: (row: TData, index: number) => string | number;

  // Layout
  height?: number;
  maxHeight?: number;
  rowHeight?: number;
  headerHeight?: number;
  groupHeaderHeight?: number;

  // Theme
  theme?: ThemePreset | GridTokens;

  // Customisation
  features?: GridFeatures;
  icons?: GridIcons;
  classNames?: GridClassNames;
  styles?: GridStyles;
  slots?: GridSlots<TData>;

  // Behaviour
  freezeColId?: string;
  loading?: boolean;

  /**
   * 'client' (default) — grid sorts data internally.
   * 'server'           — grid skips internal sort; data rendered as-is.
   *                      onSortChange fires so you can fetch the sorted page.
   */
  sortMode?: "client" | "server";

  /**
   * Fired whenever column visibility / pin / width / order changes.
   * Persist this to your API and restore via initialColumnState.
   */
  onColumnStateChange?: (state: ColumnState[]) => void;

  // Events
  onRowClick?: (row: TData, index: number) => void;
  onSortChange?: (sort: SortState) => void;
  onColumnResize?: (columnId: string, width: number) => void;
  onColumnReorder?: (newOrder: string[]) => void;

  // Accessibility
  ariaLabel?: string;

  // DOM
  className?: string;
  style?: CSSProperties;
}
