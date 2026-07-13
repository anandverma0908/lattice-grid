import React, {
  memo,
  useCallback,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useGridEngine } from "../../core/useGridEngine";
import { deriveGroupByFromColumnDefs } from "../../core/rowGrouping";
import { GridContextProvider } from "../../core/GridContext";
import { resolveTokens, tokensToStyle } from "../../core/themes";
import { DragGhost } from "../DragGhost";
import { GridToolbarSection } from "../GridToolbarSection";
import { GridFooterSection } from "../GridFooterSection";
import { GridBody } from "../GridBody";
import type { LatticeGridProps, ResolvedColumn } from "../../types";
import { useResolvedGridConfig } from "../../hooks/useResolvedGridConfig";
import { useGroupingSync } from "../../hooks/useGroupingSync";
import { useInternalRowSelection } from "../../hooks/useInternalRowSelection";
import { useGridScrollEngine } from "../../hooks/useGridScrollEngine";
import { useSortedGroupedRows } from "../../hooks/useSortedGroupedRows";
import { useColumnStateNotifier } from "../../hooks/useColumnStateNotifier";
import { useGridLayout } from "../../hooks/useGridLayout";
import { useRowBackgroundColors } from "../../hooks/useRowBackgroundColors";
import { useColumnDragAndResize } from "../../hooks/useColumnDragAndResize";
import { useGridKeyboardIntegration } from "../../hooks/useGridKeyboardIntegration";

const DEFAULT_ROW_HEIGHT = 36;
const DEFAULT_HDR_HEIGHT = 38;
const DEFAULT_GRP_HEIGHT = 28;

function LatticeGridInner<TData = unknown>({
  columns,
  data,
  getRowId,
  height,
  maxHeight = 600,
  rowHeight = DEFAULT_ROW_HEIGHT,
  headerHeight = DEFAULT_HDR_HEIGHT,
  groupHeaderHeight = DEFAULT_GRP_HEIGHT,
  theme = "light",
  features: featuresProp,
  icons: iconsProp,
  texts: textsProp,
  classNames: classNamesProp,
  styles: stylesProp,
  slots = {},
  freezeColId,
  loading = false,
  selectedRowId,
  onRowClick,
  onSortChange,
  onColumnStateChange,
  onColumnResize,
  onColumnReorder,
  onRowsDelete,
  onRowInsert,
  sortMode = "client",
  groupBy,
  onGroupingChange,
  ariaLabel = "Data grid",
  className,
  style,
}: LatticeGridProps<TData> & { maxHeight?: number }) {
  const { features, icons, texts, styles, classNames } = useResolvedGridConfig({
    features: featuresProp,
    icons: iconsProp,
    texts: textsProp,
    classNames: classNamesProp,
    styles: stylesProp,
  });

  const derivedGroupBy = useMemo(
    () => deriveGroupByFromColumnDefs(columns),
    [columns],
  );
  const effectiveGroupBy = groupBy ?? derivedGroupBy;

  const engine = useGridEngine<TData>(columns, effectiveGroupBy);
  const {
    pinnedLeftColumns,
    pinnedRightColumns,
    scrollableColumns,
    pinnedLeftWidth,
    pinnedRightWidth,
    sortState,
    rowGroupingState,
    groups,
    hasGroups,
    visibleColumns,
    orderedColumns,
    resizeColumn,
    moveColumnBefore,
    moveColumnToEnd,
    toggleGroup,
  } = engine;

  useGroupingSync({
    engine,
    derivedGroupBy,
    groupByProp: groupBy,
    onGroupingChange,
    onSortChange,
  });

  const visibleRows = useSortedGroupedRows({
    data,
    sortMode,
    sortState,
    orderedColumns,
    rowGroupingState,
  });

  useColumnStateNotifier(engine.orderedColumns, onColumnStateChange);

  const [announcement, setAnnouncement] = useState("");
  const announce = useCallback((message: string) => setAnnouncement(message), []);

  const {
    selectedRowKeys,
    isRowSelected,
    handleRowClick,
    selectRowByIndex,
    selectRangeByIndex,
    selectAllRows,
    deleteSelectedRows,
  } = useInternalRowSelection({
    rowSelectionEnabled: features.rowSelection,
    visibleRows,
    getRowId,
    selectedRowId,
    onRowClick,
    onRowsDelete,
    announce,
  });

  const gridRootRef = useRef<HTMLDivElement>(null);

  const totalHeaderHeight = hasGroups
    ? groupHeaderHeight + headerHeight
    : headerHeight;

  const {
    scrollAreaRef,
    bodyWrapRef,
    pinLeftBodyRef,
    pinLeftWrapRef,
    pinRightWrapRef,
    scrollLeftRef,
    offsets,
    totalScrollW,
    bodyWrapH,
    bodyWrapW,
    vRows,
    vCols,
    isScrolling,
    frozenIdx,
    frozenCol,
    frozenColDef,
    frozenColOffset,
    frozenWidth,
    handleScroll,
    scrollToCell,
    scrollToColumn,
  } = useGridScrollEngine<TData>({
    rowHeight,
    totalHeaderHeight,
    visibleRowsLength: visibleRows.length,
    visibleColumns,
    scrollableColumns,
    pinnedLeftWidth,
    pinnedRightWidth,
    freezeColId,
  });

  const { canvasW, effectiveHeight, visibleRowCount, spacerHeight } = useGridLayout({
    pinnedLeftWidth,
    pinnedRightWidth,
    totalScrollW,
    bodyWrapW,
    bodyWrapH,
    totalHeaderHeight,
    rowHeight,
    visibleRowsLength: visibleRows.length,
    toolbarEnabled: features.toolbar,
    toolbarSlotProvided: !!slots.toolbar,
    footerEnabled: features.footer,
    footerSlotProvided: !!slots.footer,
    height,
    maxHeight,
  });

  const {
    keyboard,
    visibleColIndexById,
    ungroupedIds,
    getRawCellValue,
    activateRenderedCell,
  } = useGridKeyboardIntegration({
    visibleRows,
    visibleColumns,
    scrollableColumns,
    orderedColumns: engine.orderedColumns,
    groups,
    hasGroups,
    visibleRowCount,
    features,
    gridRootRef,
    scrollAreaRef,
    scrollToCell,
    scrollToColumn,
    selectRowByIndex,
    selectRangeByIndex,
    selectAllRows,
    deleteSelectedRows,
    toggleGroup,
    toggleSort: engine.toggleSort,
    resizeColumn,
    moveColumnBefore,
    moveColumnToEnd,
    onColumnResize,
    onColumnReorder,
    onRowInsert,
    announce,
  });

  const { startResize, dragHandlers } = useColumnDragAndResize({
    orderedColumns: engine.orderedColumns,
    visibleColumns,
    pinnedLeftColumns,
    pinnedRightColumns,
    scrollableColumns,
    pinnedLeftWidth,
    pinnedRightWidth,
    offsets,
    bodyWrapRef,
    scrollLeftRef,
    resizeColumn,
    moveColumnBefore,
    moveColumnToEnd,
    onColumnResize,
    onColumnReorder,
  });

  const tokens = useMemo(() => resolveTokens(theme), [theme]);
  const tokenStyle = useMemo(() => tokensToStyle(tokens), [tokens]);

  const contextValue = useMemo(
    () => ({
      engine,
      dragHandlers,
      startResize,
      features,
      icons,
      texts,
      styles,
      classNames,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [engine, dragHandlers, startResize, features, icons, texts, styles, classNames],
  );

  const { rowBg, pinnedRowBg } = useRowBackgroundColors({
    isRowSelected,
    alternateRows: features.alternateRows,
    styles,
  });

  return (
    <GridContextProvider value={contextValue}>
      <div
        ref={gridRootRef}
        role="grid"
        aria-label={ariaLabel}
        aria-rowcount={visibleRows.length}
        aria-colcount={visibleColumns.length}
        onKeyDown={keyboard.handleKeyDown}
        className={
          [classNames.root, className].filter(Boolean).join(" ") || undefined
        }
        style={{
          ...(tokenStyle as CSSProperties),
          fontFamily: "var(--vg-font)",
          fontSize: "var(--vg-font-size)",
          lineHeight: "var(--vg-line-height)",
          background: "var(--vg-bg)",
          border: "1px solid var(--vg-border-strong)",
          borderRadius: "var(--vg-radius)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          height: effectiveHeight,
          position: "relative",
          ...styles.root,
          ...style,
        }}
      >
        <div
          aria-live="polite"
          aria-atomic="true"
          style={{
            position: "absolute",
            width: 1,
            height: 1,
            padding: 0,
            margin: -1,
            overflow: "hidden",
            clip: "rect(0, 0, 0, 0)",
            whiteSpace: "nowrap",
            border: 0,
          }}
        >
          {announcement}
        </div>
        <GridToolbarSection
          enabled={features.toolbar}
          slots={slots}
          engine={engine}
          texts={texts}
          icons={icons}
          visibleRowCount={visibleRows.length}
          selectedCount={selectedRowKeys.size}
        />

        <GridBody
          visibleRows={visibleRows}
          loading={loading}
          handleScroll={handleScroll}
          keyboard={keyboard}
          styles={styles}
          classNames={classNames}
          slots={slots}
          texts={texts}
          geometry={{
            totalHeaderHeight,
            canvasW,
            spacerHeight,
            rowHeight,
            groupHeaderHeight,
            headerHeight,
            bodyWrapH,
          }}
          columnLayout={{
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
          }}
          virtualization={{
            vRows,
            vCols,
            isScrolling,
            frozenIdx,
            frozenCol,
            frozenColDef,
            frozenColOffset,
            frozenWidth,
          }}
          refs={{ bodyWrapRef, scrollAreaRef, pinLeftBodyRef, pinLeftWrapRef, pinRightWrapRef }}
          rowHandlers={{
            getRowId,
            handleRowClick,
            isRowSelected,
            rowBg,
            pinnedRowBg,
            getRawCellValue,
            activateRenderedCell,
            toggleGroup,
          }}
        />

        <GridFooterSection
          enabled={features.footer}
          slots={slots}
          startRow={vRows.startIndex + 1}
          endRow={Math.min(vRows.endIndex + 1, visibleRows.length)}
          totalRows={visibleRows.length}
          visibleCols={visibleColumns.length}
          totalCols={orderedColumns.length}
        />

        <DragGhost
          dragState={dragHandlers.dragState}
          registerGhost={dragHandlers.registerGhost}
          visibleColumns={visibleColumns}
          bodyWrapRef={bodyWrapRef}
          totalHeaderHeight={totalHeaderHeight}
          vRows={vRows}
          visibleRows={visibleRows}
          rowHeight={rowHeight}
          rowBg={rowBg}
        />
      </div>
    </GridContextProvider>
  );
}

export const LatticeGrid = memo(LatticeGridInner) as typeof LatticeGridInner;
