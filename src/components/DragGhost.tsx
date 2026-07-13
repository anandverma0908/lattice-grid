import type { ReactNode, RefObject } from "react";
import type { GroupedRow, ResolvedColumn } from "../types";
import type { ColumnDragState } from "../hooks/useColumnDrag";

export interface DragGhostProps<TData> {
  dragState: ColumnDragState;
  registerGhost: (el: HTMLDivElement | null) => void;
  visibleColumns: ResolvedColumn<TData>[];
  bodyWrapRef: RefObject<HTMLDivElement>;
  totalHeaderHeight: number;
  vRows: { startIndex: number; endIndex: number };
  visibleRows: GroupedRow<TData>[];
  rowHeight: number;
  rowBg: (row: TData, rowIndex: number) => string;
}

export function DragGhost<TData>({
  dragState,
  registerGhost,
  visibleColumns,
  bodyWrapRef,
  totalHeaderHeight,
  vRows,
  visibleRows,
  rowHeight,
  rowBg,
}: DragGhostProps<TData>): ReactNode {
  if (!dragState.draggingId) return null;
  const { draggingId } = dragState;
  const draggingCol = visibleColumns.find((c) => c.id === draggingId);
  if (!draggingCol) return null;
  const bodyRect = bodyWrapRef.current?.getBoundingClientRect();
  if (!bodyRect) return null;

  const jc =
    draggingCol.align === "center" ? "center" : draggingCol.align === "right" ? "flex-end" : "flex-start";

  return (
    <>
      <div
        ref={registerGhost}
        style={{
          position: "fixed",
          top: bodyRect.top,
          width: draggingCol.width,
          height: bodyRect.height,
          zIndex: 9999,
          pointerEvents: "none",
          boxShadow: "0 6px 24px rgba(0,0,0,0.20)",
          borderRadius: 4,
          overflow: "hidden",
          background: "var(--vg-bg)",
        }}
      >
        <div
          style={{
            height: totalHeaderHeight,
            background: "var(--vg-bg-header)",
            borderBottom: "1px solid var(--vg-border-strong)",
            display: "flex",
            alignItems: "center",
            justifyContent: jc,
            padding: "0 8px",
            fontWeight: 600,
            fontSize: "var(--vg-font-size)",
            color: "var(--vg-text-header)",
            boxSizing: "border-box",
            overflow: "hidden",
            whiteSpace: "nowrap",
          }}
        >
          {draggingCol.label}
        </div>

        {Array.from({ length: vRows.endIndex - vRows.startIndex + 1 }, (_, i) => {
          const ri = vRows.startIndex + i;
          const item = visibleRows[ri];
          if (!item) return null;
          if (item.type === "group") {
            return (
              <div
                key={item.id}
                style={{
                  height: rowHeight,
                  display: "flex",
                  alignItems: "center",
                  padding: `0 10px 0 ${10 + item.depth * 18}px`,
                  fontSize: "var(--vg-font-size)",
                  fontWeight: 700,
                  color: "var(--vg-text)",
                  borderBottom: "1px solid var(--vg-border)",
                  boxSizing: "border-box",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  background: "var(--vg-bg-row-alt)",
                }}
              >
                {String(item.groupingValue)} ({item.leafRowCount})
              </div>
            );
          }
          const row = item.row;
          const raw = draggingCol.accessor
            ? draggingCol.accessor(row)
            : (row as Record<string, unknown>)[draggingCol.field ?? draggingCol.id];
          const content = draggingCol.renderCell
            ? draggingCol.renderCell(raw, row)
            : ((raw as ReactNode) ?? "—");
          return (
            <div
              key={ri}
              style={{
                height: rowHeight,
                display: "flex",
                alignItems: "center",
                justifyContent: jc,
                padding: "0 10px",
                fontSize: "var(--vg-font-size)",
                color: "var(--vg-text)",
                borderBottom: "1px solid var(--vg-border)",
                boxSizing: "border-box",
                overflow: "hidden",
                whiteSpace: "nowrap",
                background: rowBg(row, item.rowIndex),
              }}
            >
              {content}
            </div>
          );
        })}
      </div>
    </>
  );
}
