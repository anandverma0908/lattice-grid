import type { MutableRefObject, ReactNode, RefObject } from "react";
import type {
  GridClassNames,
  GridSlots,
  GridStyles,
  GridTexts,
  GroupColumnDef,
  GroupedRow,
  ResolvedColumn,
} from "../types";
import type { FocusedCell, UseGridKeyboardReturn } from "../hooks/useGridKeyboard";
import { EmptyState } from "./Cells";
import { ScrollableHeader } from "./ScrollableHeader";
import { FrozenColumnBody } from "./FrozenColumnBody";
import { DataRow } from "./DataRow";
import { PinnedLayer } from "./PinnedLayer";

export interface GridBodyGeometry {
  totalHeaderHeight: number;
  canvasW: number;
  spacerHeight: number;
  rowHeight: number;
  groupHeaderHeight: number;
  headerHeight: number;
  bodyWrapH: number;
}

export interface GridBodyColumnLayout<TData> {
  hasGroups: boolean;
  groups: GroupColumnDef<TData>[];
  scrollableColumns: ResolvedColumn<TData>[];
  pinnedLeftColumns: ResolvedColumn<TData>[];
  pinnedRightColumns: ResolvedColumn<TData>[];
  offsets: number[];
  pinnedLeftWidth: number;
  pinnedRightWidth: number;
  ungroupedIds: Set<string>;
  visibleColIndexById: Map<string, number>;
  orderedColumns: ResolvedColumn<TData>[];
}

export interface GridBodyVirtualization<TData> {
  vRows: { startIndex: number; endIndex: number };
  vCols: { startIndex: number; endIndex: number };
  isScrolling: boolean;
  frozenIdx: number | null;
  frozenCol: ResolvedColumn<TData> | null;
  frozenColDef: ResolvedColumn<TData> | null;
  frozenColOffset: number;
  frozenWidth: number;
}

export interface GridBodyRefs {
  bodyWrapRef: RefObject<HTMLDivElement>;
  scrollAreaRef: RefObject<HTMLDivElement>;
  pinLeftBodyRef: MutableRefObject<HTMLDivElement | null>;
  pinLeftWrapRef: RefObject<HTMLDivElement>;
  pinRightWrapRef: RefObject<HTMLDivElement>;
}

export interface GridBodyRowHandlers<TData> {
  getRowId?: ((row: TData, index: number) => string | number) | undefined;
  handleRowClick: (row: TData, rowIndex: number) => void;
  isRowSelected: (row: TData, rowIndex: number) => boolean;
  rowBg: (row: TData, rowIndex: number) => string;
  pinnedRowBg: (row: TData, rowIndex: number) => string;
  getRawCellValue: (row: TData, rowIndex: number, column: ResolvedColumn<TData>) => unknown;
  activateRenderedCell: (cell: FocusedCell) => void;
  toggleGroup: (groupId: string) => void;
}

export interface GridBodyProps<TData> {
  visibleRows: GroupedRow<TData>[];
  loading: boolean;
  handleScroll: () => void;
  keyboard: UseGridKeyboardReturn;
  styles: GridStyles;
  classNames: GridClassNames;
  slots: GridSlots<TData>;
  texts: GridTexts;
  geometry: GridBodyGeometry;
  columnLayout: GridBodyColumnLayout<TData>;
  virtualization: GridBodyVirtualization<TData>;
  refs: GridBodyRefs;
  rowHandlers: GridBodyRowHandlers<TData>;
}

export function GridBody<TData>({
  visibleRows,
  loading,
  handleScroll,
  keyboard,
  styles,
  classNames,
  slots,
  texts,
  geometry,
  columnLayout,
  virtualization,
  refs,
  rowHandlers,
}: GridBodyProps<TData>): ReactNode {
  const {
    totalHeaderHeight,
    canvasW,
    spacerHeight,
    rowHeight,
    groupHeaderHeight,
    headerHeight,
    bodyWrapH,
  } = geometry;
  const {
    hasGroups,
    groups,
    scrollableColumns,
    pinnedLeftColumns,
    pinnedRightColumns,
    offsets,
    pinnedLeftWidth,
    pinnedRightWidth,
    ungroupedIds,
    visibleColIndexById,
    orderedColumns,
  } = columnLayout;
  const { vRows, vCols, isScrolling, frozenIdx, frozenCol, frozenColDef, frozenColOffset, frozenWidth } =
    virtualization;
  const { bodyWrapRef, scrollAreaRef, pinLeftBodyRef, pinLeftWrapRef, pinRightWrapRef } = refs;
  const {
    getRowId,
    handleRowClick,
    isRowSelected,
    rowBg,
    pinnedRowBg,
    getRawCellValue,
    activateRenderedCell,
    toggleGroup,
  } = rowHandlers;

  return (
    <div ref={bodyWrapRef} style={{ position: "relative", flex: 1, overflow: "hidden" }}>
      {visibleRows.length === 0 ? (
        <EmptyState height={bodyWrapH} slot={slots.emptyState} />
      ) : (
        <>
          <div
            ref={scrollAreaRef}
            onScroll={handleScroll}
            style={{
              position: "absolute",
              inset: 0,
              overflowX: "auto",
              overflowY: spacerHeight > bodyWrapH ? "auto" : "hidden",
              scrollbarWidth: "thin",
              scrollbarColor: "var(--vg-scrollbar-thumb) var(--vg-scrollbar-track)",
              willChange: "scroll-position",
            }}
          >
            <div style={{ width: canvasW, height: spacerHeight, position: "relative" }}>
              <div
                style={{
                  position: "sticky",
                  top: 0,
                  width: canvasW,
                  height: totalHeaderHeight,
                  zIndex: 8,
                  background: "var(--vg-bg-header)",
                  borderBottom: "1px solid var(--vg-border-strong)",
                  ...styles.headerRow,
                }}
              >
                <ScrollableHeader
                  hasGroups={hasGroups}
                  vCols={vCols}
                  scrollableColumns={scrollableColumns}
                  offsets={offsets}
                  pinnedLeftWidth={pinnedLeftWidth}
                  canvasW={canvasW}
                  groupHeaderHeight={groupHeaderHeight}
                  headerHeight={headerHeight}
                  groups={groups}
                  ungroupedIds={ungroupedIds}
                  visibleColIndexById={visibleColIndexById}
                  keyboard={keyboard}
                />
              </div>
              {frozenColDef && (
                <div
                  ref={pinLeftBodyRef}
                  style={{
                    position: "sticky",
                    left: pinnedLeftWidth,
                    marginLeft: pinnedLeftWidth + frozenColOffset,
                    width: frozenWidth,
                    height: visibleRows.length * rowHeight,
                    zIndex: 6,
                    visibility: frozenIdx !== null ? "visible" : "hidden",
                    pointerEvents: frozenIdx !== null ? "auto" : "none",
                  }}
                >
                  <FrozenColumnBody
                    frozenColDef={frozenColDef}
                    vRows={vRows}
                    visibleRows={visibleRows}
                    rowHeight={rowHeight}
                    frozenWidth={frozenWidth}
                    getRowId={getRowId}
                    isRowSelected={isRowSelected}
                    styles={styles}
                    classNames={classNames}
                    handleRowClick={handleRowClick}
                    visibleColIndexById={visibleColIndexById}
                    getRawCellValue={getRawCellValue}
                    isScrolling={isScrolling}
                    loadingCell={slots.loadingCell}
                    rowSelectionIndicator={slots.rowSelectionIndicator}
                  />
                </div>
              )}

              {Array.from(
                { length: Math.max(0, vRows.endIndex - vRows.startIndex + 1) },
                (_, i) => (
                  <DataRow
                    key={vRows.startIndex + i}
                    visibleRows={visibleRows}
                    rowIndex={vRows.startIndex + i}
                    totalHeaderHeight={totalHeaderHeight}
                    rowHeight={rowHeight}
                    canvasW={canvasW}
                    pinnedLeftWidth={pinnedLeftWidth}
                    pinnedRightWidth={pinnedRightWidth}
                    vCols={vCols}
                    scrollableColumns={scrollableColumns}
                    pinnedLeftColumns={pinnedLeftColumns}
                    pinnedRightColumns={pinnedRightColumns}
                    offsets={offsets}
                    visibleColIndexById={visibleColIndexById}
                    keyboard={keyboard}
                    getRawCellValue={getRawCellValue}
                    isScrolling={isScrolling}
                    loadingCell={slots.loadingCell}
                    rowSelectionIndicator={slots.rowSelectionIndicator}
                    classNames={classNames}
                    styles={styles}
                    getRowId={getRowId}
                    handleRowClick={handleRowClick}
                    isRowSelected={isRowSelected}
                    rowBg={rowBg}
                    pinnedRowBg={pinnedRowBg}
                    activateRenderedCell={activateRenderedCell}
                    orderedColumns={orderedColumns}
                    toggleGroup={toggleGroup}
                  />
                ),
              )}
            </div>
          </div>

          <PinnedLayer
            side="left"
            pinnedLeftColumns={pinnedLeftColumns}
            pinnedRightColumns={pinnedRightColumns}
            pinnedLeftWidth={pinnedLeftWidth}
            pinnedRightWidth={pinnedRightWidth}
            frozenCol={frozenCol}
            frozenWidth={frozenWidth}
            hasGroups={hasGroups}
            groups={groups}
            groupHeaderHeight={groupHeaderHeight}
            headerHeight={headerHeight}
            totalHeaderHeight={totalHeaderHeight}
            visibleColIndexById={visibleColIndexById}
            keyboard={keyboard}
            styles={styles}
            pinLeftWrapRef={pinLeftWrapRef}
            pinRightWrapRef={pinRightWrapRef}
          />
          <PinnedLayer
            side="right"
            pinnedLeftColumns={pinnedLeftColumns}
            pinnedRightColumns={pinnedRightColumns}
            pinnedLeftWidth={pinnedLeftWidth}
            pinnedRightWidth={pinnedRightWidth}
            frozenCol={frozenCol}
            frozenWidth={frozenWidth}
            hasGroups={hasGroups}
            groups={groups}
            groupHeaderHeight={groupHeaderHeight}
            headerHeight={headerHeight}
            totalHeaderHeight={totalHeaderHeight}
            visibleColIndexById={visibleColIndexById}
            keyboard={keyboard}
            styles={styles}
            pinLeftWrapRef={pinLeftWrapRef}
            pinRightWrapRef={pinRightWrapRef}
          />

          {loading && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(255,255,255,0.6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 50,
                backdropFilter: "blur(1px)",
              }}
            >
              {slots.loadingOverlay ?? (
                <div
                  style={{
                    padding: "10px 20px",
                    borderRadius: 6,
                    background: "var(--vg-bg)",
                    border: "1px solid var(--vg-border-strong)",
                    fontSize: 13,
                    color: "var(--vg-text-dim)",
                    fontFamily: "var(--vg-font)",
                  }}
                >
                  {texts.loading}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
