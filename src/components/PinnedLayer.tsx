import type { ReactNode, RefObject } from "react";
import type { GridStyles, GroupColumnDef, ResolvedColumn } from "../types";
import type { UseGridKeyboardReturn } from "../hooks/useGridKeyboard";
import { HeaderCell } from "./HeaderCell";
import { GroupHeaderCell } from "./Cells";
import { getGroupHeaderKeyboardProps, getHeaderKeyboardProps } from "./headerFocusHelpers";

export interface PinnedLayerProps<TData> {
  side: "left" | "right";
  pinnedLeftColumns: ResolvedColumn<TData>[];
  pinnedRightColumns: ResolvedColumn<TData>[];
  pinnedLeftWidth: number;
  pinnedRightWidth: number;
  frozenCol: ResolvedColumn<TData> | null;
  frozenWidth: number;
  hasGroups: boolean;
  groups: GroupColumnDef<TData>[];
  groupHeaderHeight: number;
  headerHeight: number;
  totalHeaderHeight: number;
  visibleColIndexById: Map<string, number>;
  keyboard: UseGridKeyboardReturn;
  styles: GridStyles;
  pinLeftWrapRef: RefObject<HTMLDivElement>;
  pinRightWrapRef: RefObject<HTMLDivElement>;
}

export function PinnedLayer<TData>({
  side,
  pinnedLeftColumns,
  pinnedRightColumns,
  pinnedLeftWidth,
  pinnedRightWidth,
  frozenCol,
  frozenWidth,
  hasGroups,
  groups,
  groupHeaderHeight,
  headerHeight,
  totalHeaderHeight,
  visibleColIndexById,
  keyboard,
  styles,
  pinLeftWrapRef,
  pinRightWrapRef,
}: PinnedLayerProps<TData>): ReactNode {
  const isLeft = side === "left";
  const cols = isLeft ? pinnedLeftColumns : pinnedRightColumns;
  const baseWidth = isLeft ? pinnedLeftWidth : pinnedRightWidth;
  const hasFrozen = isLeft && frozenCol !== null;
  const layerWidth = hasFrozen ? baseWidth + frozenWidth : baseWidth;
  if (!cols.length && !hasFrozen) return null;

  const headerKeyboardProps = (column: ResolvedColumn<TData>) =>
    getHeaderKeyboardProps(column, visibleColIndexById, keyboard);

  const colLefts: number[] = [];
  let acc = 0;
  for (const col of cols) {
    colLefts.push(acc);
    acc += col.width;
  }
  const frozenSlotLeft = acc;

  const headerCells: ReactNode[] = [];
  if (hasGroups) {
    const renderedGroupIds = new Set<string>();

    cols.forEach((col, i) => {
      if (!col.groupId) {
        headerCells.push(
          <HeaderCell
            key={`ph-span-${col.id}`}
            column={col}
            {...headerKeyboardProps(col)}
            isFirst={i === 0}
            isLast={i === cols.length - 1}
            style={{
              position: "absolute",
              left: colLefts[i],
              top: 0,
              width: col.width,
              height: groupHeaderHeight + headerHeight,
              zIndex: 2,
              background: "var(--vg-bg-header)",
            }}
          />,
        );
      } else {
        // Group header cell (rendered once per group)
        if (!renderedGroupIds.has(col.groupId)) {
          renderedGroupIds.add(col.groupId);
          const grp = groups.find((g) => g.id === col.groupId);
          if (grp) {
            const grpCols = cols.filter((c) => c.groupId === col.groupId);
            const grpWidth = grpCols.reduce((s, c) => s + c.width, 0);
            const groupLeafIndexes = grpCols
              .map((leaf) => visibleColIndexById.get(leaf.id))
              .filter((index): index is number => typeof index === "number")
              .sort((a, b) => a - b);
            headerCells.push(
              <GroupHeaderCell
                key={`pgh-${grp.id}`}
                group={grp}
                {...getGroupHeaderKeyboardProps(
                  grp.id,
                  groupLeafIndexes[0] ?? 0,
                  groupLeafIndexes[groupLeafIndexes.length - 1] ?? 0,
                  keyboard,
                )}
                left={colLefts[i] ?? 0}
                width={grpWidth}
                height={groupHeaderHeight}
              />,
            );
          }
        }
        // Leaf header cell (one per column) — uses HeaderCell so renderHeader is applied
        headerCells.push(
          <HeaderCell
            key={`ph-leaf-${col.id}`}
            column={col}
            {...headerKeyboardProps(col)}
            isFirst={i === 0 || cols[i - 1]?.groupId !== col.groupId}
            isLast={i === cols.length - 1 || cols[i + 1]?.groupId !== col.groupId}
            style={{
              position: "absolute",
              left: colLefts[i],
              top: groupHeaderHeight,
              width: col.width,
              height: headerHeight,
              zIndex: 2,
              background: "var(--vg-bg-header)",
            }}
          />,
        );
      }
    });
    if (hasFrozen && frozenCol) {
      const fjc =
        frozenCol.align === "center" ? "center" : frozenCol.align === "right" ? "flex-end" : "flex-start";
      headerCells.push(
        <div
          key={`ph-frozen-${frozenCol.id}`}
          style={{
            position: "absolute",
            left: frozenSlotLeft,
            top: 0,
            width: frozenWidth,
            height: groupHeaderHeight + headerHeight,
            background: "var(--vg-bg-frozen, var(--vg-bg-group))",
            borderRight: "1px solid var(--vg-border-strong)",
            borderBottom: "1px solid var(--vg-border-strong)",
            zIndex: 2,
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            justifyContent: fjc,
            padding: "0 10px",
            fontWeight: 700,
            fontSize: "calc(var(--vg-font-size) - 0.5px)",
            color: "var(--vg-text-group)",
            overflow: "hidden",
            whiteSpace: "nowrap",
            ...styles.headerCell,
          }}
        >
          {frozenCol.label}
        </div>,
      );
    }
  } else {
    cols.forEach((col, i) => {
      headerCells.push(
        <HeaderCell
          key={`ph-${col.id}`}
          column={col}
          {...headerKeyboardProps(col)}
          isFirst={i === 0}
          isLast={i === cols.length - 1}
          style={{
            position: "absolute",
            left: colLefts[i],
            top: 0,
            width: col.width,
            height: headerHeight,
            zIndex: 2,
            background: "var(--vg-bg-header)",
          }}
        />,
      );
    });
    if (hasFrozen && frozenCol) {
      headerCells.push(
        <HeaderCell
          key={`ph-frozen-${frozenCol.id}`}
          column={frozenCol}
          {...headerKeyboardProps(frozenCol)}
          style={{
            position: "absolute",
            left: frozenSlotLeft,
            top: 0,
            width: frozenWidth,
            height: headerHeight,
            zIndex: 2,
            background: "var(--vg-bg-frozen, var(--vg-accent-bg))",
          }}
        />,
      );
    }
  }

  return (
    <div
      key={`layer-${side}`}
      style={{
        position: "absolute",
        [side]: 0,
        top: 0,
        width: layerWidth,
        height: "100%",
        zIndex: 20,
        pointerEvents: "none",
      }}
    >
      {/* Header wrapper — height-capped so wheel events on the body area
          reach the scroll container directly (no double-scroll). */}
      <div
        ref={isLeft ? pinLeftWrapRef : pinRightWrapRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: layerWidth,
          height: totalHeaderHeight,
          pointerEvents: "auto",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: layerWidth,
            height: totalHeaderHeight,
            background: "var(--vg-bg-header)",
            borderBottom: "1px solid var(--vg-border-strong)",
            zIndex: 10,
            overflow: "visible",
          }}
        >
          {headerCells}
        </div>
      </div>

      {/* Scroll shadow */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          [isLeft ? "right" : "left"]: -8,
          top: 0,
          width: 8,
          height: "100%",
          pointerEvents: "none",
          zIndex: 15,
          background: isLeft
            ? "linear-gradient(to right, rgba(0,0,0,0.08), transparent)"
            : "linear-gradient(to left, rgba(0,0,0,0.08), transparent)",
        }}
      />
    </div>
  );
}
