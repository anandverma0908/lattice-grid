import type { ReactNode } from "react";
import type { GroupColumnDef, ResolvedColumn } from "../types";
import type { UseGridKeyboardReturn } from "../hooks/useGridKeyboard";
import { HeaderCell } from "./HeaderCell";
import { GroupHeaderCell } from "./Cells";
import { getGroupHeaderKeyboardProps, getHeaderKeyboardProps } from "./headerFocusHelpers";

export interface ScrollableHeaderProps<TData> {
  hasGroups: boolean;
  vCols: { startIndex: number; endIndex: number };
  scrollableColumns: ResolvedColumn<TData>[];
  offsets: number[];
  pinnedLeftWidth: number;
  canvasW: number;
  groupHeaderHeight: number;
  headerHeight: number;
  groups: GroupColumnDef<TData>[];
  ungroupedIds: Set<string>;
  visibleColIndexById: Map<string, number>;
  keyboard: UseGridKeyboardReturn;
}

export function ScrollableHeader<TData>({
  hasGroups,
  vCols,
  scrollableColumns,
  offsets,
  pinnedLeftWidth,
  canvasW,
  groupHeaderHeight,
  headerHeight,
  groups,
  ungroupedIds,
  visibleColIndexById,
  keyboard,
}: ScrollableHeaderProps<TData>) {
  const headerKeyboardProps = (column: ResolvedColumn<TData>) =>
    getHeaderKeyboardProps(column, visibleColIndexById, keyboard);

  const renderGroupRowCells = (): ReactNode => {
    const cells: ReactNode[] = [];
    const rendered = new Set<string>();
    for (let ci = vCols.startIndex; ci <= vCols.endIndex; ci++) {
      const col = scrollableColumns[ci];
      if (!col) continue;
      const left = pinnedLeftWidth + (offsets[ci] ?? 0);
      if (ungroupedIds.has(col.id)) {
        cells.push(
          <HeaderCell
            key={`hspan-${col.id}`}
            column={col}
            {...headerKeyboardProps(col)}
            style={{
              position: "absolute",
              left,
              top: 0,
              width: col.width,
              height: groupHeaderHeight + headerHeight,
              zIndex: 1,
              background: "var(--vg-bg-header)",
            }}
          />,
        );
        continue;
      }
      const grp = groups.find((g) => g.children.some((c) => c.id === col.id));
      if (!grp || rendered.has(grp.id)) continue;
      rendered.add(grp.id);
      const grpLeaves = scrollableColumns.filter((c) =>
        grp.children.some((gc) => gc.id === c.id),
      );
      const grpWidth = grpLeaves.reduce((s, c) => s + c.width, 0);
      const firstIdx = scrollableColumns.findIndex(
        (c) => c.id === grpLeaves[0]?.id,
      );
      const groupLeafIndexes = grpLeaves
        .map((leaf) => visibleColIndexById.get(leaf.id))
        .filter((index): index is number => typeof index === "number")
        .sort((a, b) => a - b);
      cells.push(
        <GroupHeaderCell
          key={`grp-${grp.id}`}
          group={grp}
          {...getGroupHeaderKeyboardProps(
            grp.id,
            groupLeafIndexes[0] ?? 0,
            groupLeafIndexes[groupLeafIndexes.length - 1] ?? 0,
            keyboard,
          )}
          left={pinnedLeftWidth + (offsets[firstIdx] ?? 0)}
          width={grpWidth}
          height={groupHeaderHeight}
        />,
      );
    }
    return cells;
  };

  const renderLeafRowCells = (): ReactNode => {
    const cells: ReactNode[] = [];
    // Track which group we last saw to detect the first leaf in each group
    let lastGroupId: string | null = undefined as unknown as string;
    const leafIndices: number[] = [];
    for (let ci = vCols.startIndex; ci <= vCols.endIndex; ci++) {
      const col = scrollableColumns[ci];
      if (!col || ungroupedIds.has(col.id)) continue;
      leafIndices.push(ci);
    }
    leafIndices.forEach((ci, pos) => {
      const col = scrollableColumns[ci];
      if (!col) return;
      // isFirst within its group = first rendered leaf of that groupId
      const isFirstInGroup = col.groupId !== lastGroupId;
      lastGroupId = col.groupId;
      const isLast = pos === leafIndices.length - 1;
      cells.push(
        <HeaderCell
          key={`lh-${col.id}`}
          column={col}
          {...headerKeyboardProps(col)}
          isFirst={isFirstInGroup}
          isLast={isLast}
          style={{
            position: "absolute",
            left: pinnedLeftWidth + (offsets[ci] ?? 0),
            top: 0,
            width: col.width,
            height: headerHeight,
            zIndex: 1,
          }}
        />,
      );
    });
    return cells;
  };

  const renderFlatHeaderCells = (): ReactNode => {
    const cells: ReactNode[] = [];
    const indices: number[] = [];
    for (let ci = vCols.startIndex; ci <= vCols.endIndex; ci++) {
      if (scrollableColumns[ci]) indices.push(ci);
    }
    indices.forEach((ci, pos) => {
      const col = scrollableColumns[ci];
      if (!col) return;
      cells.push(
        <HeaderCell
          key={`fh-${col.id}`}
          column={col}
          {...headerKeyboardProps(col)}
          isFirst={pos === 0}
          isLast={pos === indices.length - 1}
          style={{
            position: "absolute",
            left: pinnedLeftWidth + (offsets[ci] ?? 0),
            top: 0,
            width: col.width,
            height: headerHeight,
            zIndex: 1,
          }}
        />,
      );
    });
    return cells;
  };

  if (hasGroups) {
    return (
      <>
        <div
          role="row"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: canvasW,
            height: groupHeaderHeight,
            overflow: "visible",
          }}
        >
          {renderGroupRowCells()}
        </div>
        <div
          role="row"
          style={{
            position: "absolute",
            top: groupHeaderHeight,
            left: 0,
            width: canvasW,
            height: headerHeight,
            overflow: "visible",
          }}
        >
          {renderLeafRowCells()}
        </div>
      </>
    );
  }

  return (
    <div
      role="row"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: canvasW,
        height: headerHeight,
        overflow: "visible",
      }}
    >
      {renderFlatHeaderCells()}
    </div>
  );
}
