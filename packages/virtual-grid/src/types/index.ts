// =============================================================================
//  @virtual-grid/core — Public Type Definitions  (v2.0)
// =============================================================================

import type { CSSProperties, ReactNode } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
//  PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────

export type PinSide      = 'left' | 'right';
export type SortDirection = 'asc' | 'desc';

// ─────────────────────────────────────────────────────────────────────────────
//  COLUMN DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

export interface LeafColumnDef<TData = unknown> {
  id:        string;
  label:     string;
  field?:    keyof TData & string;
  accessor?: (row: TData) => unknown;
  width?:    number;
  minWidth?: number;
  maxWidth?: number;
  pinned?:   PinSide;
  hidden?:   boolean;

  // Feature toggles — override grid-level GridFeatures per column
  sortable?:   boolean;
  resizable?:  boolean;
  draggable?:  boolean;
  /** Set false to hide the hide-button on this column's header. */
  hideable?:   boolean;

  renderCell?:   (value: unknown, row: TData) => ReactNode;
  renderHeader?: (col: ResolvedColumn<TData>) => ReactNode;

  align?:       'left' | 'center' | 'right';
  cellStyle?:   CSSProperties;
  headerStyle?: CSSProperties;
}

export interface GroupColumnDef<TData = unknown> {
  id:           string;
  label:        string;
  children:     Array<LeafColumnDef<TData>>;
  headerStyle?: CSSProperties;
}

export type ColumnDef<TData = unknown> =
  | LeafColumnDef<TData>
  | GroupColumnDef<TData>;

export function isGroupColumn<TData>(
  col: ColumnDef<TData>,
): col is GroupColumnDef<TData> {
  return 'children' in col && Array.isArray(col.children);
}

// ─────────────────────────────────────────────────────────────────────────────
//  RESOLVED COLUMN  (engine output — passed to renderers)
// ─────────────────────────────────────────────────────────────────────────────

export interface ResolvedColumn<TData = unknown> {
  id:       string;
  label:    string;
  field?:   keyof TData & string;
  accessor?: (row: TData) => unknown;
  renderCell?:   LeafColumnDef<TData>['renderCell'];
  renderHeader?: LeafColumnDef<TData>['renderHeader'];
  cellStyle?:    CSSProperties;
  headerStyle?:  CSSProperties;
  align:    'left' | 'center' | 'right';
  sortable:   boolean;
  resizable:  boolean;
  draggable:  boolean;
  hideable:   boolean;
  width:    number;
  minWidth: number;
  maxWidth: number;
  pinned:   PinSide | null;
  hidden:   boolean;
  groupId:  string | null;
  defIndex: number;
}

// ─────────────────────────────────────────────────────────────────────────────
//  SORT STATE
// ─────────────────────────────────────────────────────────────────────────────

export interface SortState {
  columnId:  string | null;
  direction: SortDirection;
}

// ─────────────────────────────────────────────────────────────────────────────
//  ENGINE
// ─────────────────────────────────────────────────────────────────────────────

export interface GridEngineState<TData = unknown> {
  orderedColumns:     ResolvedColumn<TData>[];
  visibleColumns:     ResolvedColumn<TData>[];
  pinnedLeftColumns:  ResolvedColumn<TData>[];
  pinnedRightColumns: ResolvedColumn<TData>[];
  scrollableColumns:  ResolvedColumn<TData>[];
  pinnedLeftWidth:    number;
  pinnedRightWidth:   number;
  scrollableWidth:    number;
  sortState:          SortState;
  groups:             GroupColumnDef<TData>[];
  hasGroups:          boolean;
}

export interface GridEngineActions {
  resizeColumn:           (columnId: string, delta: number) => void;
  setColumnWidth:         (columnId: string, width: number) => void;
  pinColumn:              (columnId: string, side: PinSide | null) => void;
  toggleColumnVisibility: (columnId: string) => void;
  showAllColumns:         () => void;
  moveColumnBefore:       (sourceId: string, targetId: string) => void;
  toggleSort:             (columnId: string) => void;
  resetColumns:           () => void;
}

export type GridEngine<TData = unknown> =
  GridEngineState<TData> & GridEngineActions;

// ─────────────────────────────────────────────────────────────────────────────
//  VIRTUALISER OUTPUTS
// ─────────────────────────────────────────────────────────────────────────────

export interface VirtualRowWindow {
  startIndex:  number;
  endIndex:    number;
  totalHeight: number;
  offsetY:     number;
}

export interface VirtualColWindow {
  startIndex: number;
  endIndex:   number;
  totalWidth: number;
  offsets:    number[];
}

// ─────────────────────────────────────────────────────────────────────────────
//  THEMING
// ─────────────────────────────────────────────────────────────────────────────

export type GridTokens   = Partial<Record<`--vg-${string}`, string>>;
export type ThemePreset  = 'light' | 'dark' | 'ocean' | 'forest' | 'sunset';

// ─────────────────────────────────────────────────────────────────────────────
//  FEATURE FLAGS
//  Turn individual features on/off. All default to true unless noted.
// ─────────────────────────────────────────────────────────────────────────────

export interface GridFeatures {
  /** Column sorting on header click. Default: true */
  sort?: boolean;
  /** Column resize via drag handle. Default: true */
  resize?: boolean;
  /** Column drag-to-reorder. Default: true */
  reorder?: boolean;
  /** Hide-column button on header hover. Default: true */
  columnHide?: boolean;
  /** Pin column via column manager. Default: true */
  columnPin?: boolean;
  /** Zebra-stripe alternating rows. Default: true */
  alternateRows?: boolean;
  /** Show the built-in toolbar. Default: true */
  toolbar?: boolean;
  /** Show the built-in footer. Default: true */
  footer?: boolean;
  /** Row highlight on click. Default: true */
  rowSelection?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
//  ICONS
//  Swap any built-in SVG icon with your own ReactNode.
// ─────────────────────────────────────────────────────────────────────────────

export interface GridIcons {
  /** Icon shown on sortable column headers (replaces both asc+desc indicators). */
  sortAsc?:       ReactNode;
  sortDesc?:      ReactNode;
  /** Icon shown in the header when no sort is active. */
  sortNone?:      ReactNode;
  /** Icon for the hide-column button in the header. */
  hideColumn?:    ReactNode;
  /** Icon for the "Columns" toolbar button. */
  columnsPanel?:  ReactNode;
  /** Icon shown on draggable column headers (drag handle). */
  dragHandle?:    ReactNode;
}

// ─────────────────────────────────────────────────────────────────────────────
//  CLASSNAMES
//  Apply your own CSS classes to grid regions.
// ─────────────────────────────────────────────────────────────────────────────

export interface GridClassNames {
  root?:         string;
  toolbar?:      string;
  headerRow?:    string;
  groupRow?:     string;
  headerCell?:   string;
  row?:          string;
  rowSelected?:  string;
  rowHovered?:   string;
  cell?:         string;
  pinnedCell?:   string;
  footer?:       string;
  columnPanel?:  string;
}

// ─────────────────────────────────────────────────────────────────────────────
//  STYLE OVERRIDES
//  Inline CSSProperties applied to grid regions on top of token styles.
//  For structural overrides beyond what tokens offer.
// ─────────────────────────────────────────────────────────────────────────────

export interface GridStyles {
  root?:        CSSProperties;
  toolbar?:     CSSProperties;
  headerRow?:   CSSProperties;
  groupRow?:    CSSProperties;
  headerCell?:  CSSProperties;
  row?:         CSSProperties;
  rowSelected?: CSSProperties;
  cell?:        CSSProperties;
  pinnedCell?:  CSSProperties;
  footer?:      CSSProperties;
}

// ─────────────────────────────────────────────────────────────────────────────
//  SLOTS
//  Render-prop replacements for entire UI regions.
//  Return null to suppress a region entirely.
//  Receive the grid engine so slots can be interactive.
// ─────────────────────────────────────────────────────────────────────────────

export interface ColumnManagerRenderProps<TData = unknown> {
  engine: GridEngine<TData>;
  onClose: () => void;
}

export interface GridSlots<TData = unknown> {
  /**
   * Completely replace the toolbar.
   * Receives the engine so you can wire your own buttons.
   * Return null to hide the toolbar.
   */
  toolbar?: (engine: GridEngine<TData>) => ReactNode;

  /**
   * Replace the left section of the built-in toolbar.
   * (toolbarLeft / toolbarRight from v1 — kept for convenience)
   */
  toolbarLeft?:  ReactNode;
  toolbarRight?: ReactNode;

  /**
   * Completely replace the column manager panel.
   * The panel is opened/closed by the built-in toolbar button.
   * Receives engine + onClose callback.
   */
  columnManager?: (props: ColumnManagerRenderProps<TData>) => ReactNode;

  /**
   * Replace the built-in footer.
   * Receives virtualisation state for custom range display.
   */
  footer?: (props: {
    startRow:    number;
    endRow:      number;
    totalRows:   number;
    visibleCols: number;
    totalCols:   number;
  }) => ReactNode;

  /**
   * Custom empty state rendered when data is empty.
   */
  emptyState?: ReactNode;

  /**
   * Render a custom loading overlay. Shown when `loading={true}`.
   */
  loadingOverlay?: ReactNode;
}

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN COMPONENT PROPS
// ─────────────────────────────────────────────────────────────────────────────

export interface VirtualGridProps<TData = unknown> {
  // ── Data ──────────────────────────────────────────────────────────────────
  columns:   ColumnDef<TData>[];
  data:      TData[];
  getRowId?: (row: TData, index: number) => string | number;

  // ── Layout ────────────────────────────────────────────────────────────────
  height?:            number;
  rowHeight?:         number;
  headerHeight?:      number;
  groupHeaderHeight?: number;

  // ── Theme & tokens ────────────────────────────────────────────────────────
  /**
   * Preset name or partial/full token map.
   * Partial maps merge on top of the 'light' preset.
   */
  theme?: ThemePreset | GridTokens;

  // ── Customisation objects ─────────────────────────────────────────────────
  /** Feature flags — turn features on/off. All default true. */
  features?: GridFeatures;

  /** Swap built-in icons. */
  icons?: GridIcons;

  /** Apply CSS class names to grid regions. */
  classNames?: GridClassNames;

  /** Apply inline style overrides to grid regions. */
  styles?: GridStyles;

  /** Render-prop slots — replace entire UI sections. */
  slots?: GridSlots<TData>;

  // ── Behaviour ─────────────────────────────────────────────────────────────
  /**
   * Column id to auto-freeze when it scrolls behind the pinned-left band.
   * Engine state is never mutated.
   */
  freezeColId?: string;

  /** Show loading overlay (use slots.loadingOverlay to customise). */
  loading?: boolean;

  // ── Events ────────────────────────────────────────────────────────────────
  onRowClick?:      (row: TData, index: number) => void;
  onSortChange?:    (sort: SortState) => void;
  onColumnResize?:  (columnId: string, width: number) => void;
  onColumnReorder?: (newOrder: string[]) => void;

  // ── Accessibility ─────────────────────────────────────────────────────────
  ariaLabel?: string;

  // ── DOM ───────────────────────────────────────────────────────────────────
  className?: string;
  style?:     CSSProperties;
}
