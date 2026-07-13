import type { GridClassNames, GridStyles, GroupRow, ResolvedColumn } from "../types";
import type { UseGridKeyboardReturn } from "../hooks/useGridKeyboard";

export interface GroupDataRowProps<TData> {
  group: GroupRow<TData>;
  rowIndex: number;
  totalHeaderHeight: number;
  rowHeight: number;
  canvasW: number;
  pinnedLeftWidth: number;
  pinnedRightWidth: number;
  orderedColumns: ResolvedColumn<TData>[];
  classNames: GridClassNames;
  styles: GridStyles;
  keyboard: UseGridKeyboardReturn;
  toggleGroup: (groupId: string) => void;
}

export function GroupDataRow<TData>({
  group,
  rowIndex,
  totalHeaderHeight,
  rowHeight,
  canvasW,
  pinnedLeftWidth,
  pinnedRightWidth,
  orderedColumns,
  classNames,
  styles,
  keyboard,
  toggleGroup,
}: GroupDataRowProps<TData>) {
  const top = totalHeaderHeight + rowIndex * rowHeight;
  const bg = "var(--vg-bg-row-alt)";
  const labelColumn =
    orderedColumns.find((column) => column.id === group.groupingColumnId)
      ?.label ?? group.groupingColumnId;
  const left = pinnedLeftWidth;
  const groupWidth = Math.max(0, canvasW - pinnedLeftWidth - pinnedRightWidth);
  const isActive =
    keyboard.focusedCell?.rowIndex === rowIndex &&
    keyboard.focusedCell.colIndex === 0;
  const isFocusable = isActive || (!keyboard.focusedTarget && rowIndex === 0);

  return (
    <div
      key={group.id}
      role="row"
      aria-rowindex={rowIndex + 1}
      aria-expanded={group.expanded}
      className={[classNames.row, classNames.groupRow].filter(Boolean).join(" ") || undefined}
      style={{
        position: "absolute",
        top,
        left: 0,
        width: canvasW,
        height: rowHeight,
        background: bg,
        display: "flex",
        borderBottom: "1px solid var(--vg-border)",
        boxSizing: "border-box",
        color: "var(--vg-text)",
        fontWeight: 700,
        ...styles.row,
        ...styles.groupRow,
      }}
    >
      <div
        role="gridcell"
        aria-colindex={1}
        data-grid-cell={`${rowIndex}:0`}
        tabIndex={isFocusable ? 0 : -1}
        onFocus={(e) => {
          if (e.target === e.currentTarget) {
            keyboard.setFocusedCell({ rowIndex, colIndex: 0 });
          }
        }}
        onClick={() => toggleGroup(group.id)}
        onDoubleClick={() => toggleGroup(group.id)}
        style={{
          position: "absolute",
          left,
          top: 0,
          width: groupWidth,
          height: rowHeight,
          display: "flex",
          alignItems: "center",
          gap: 8,
          paddingLeft: 10 + group.depth * 18,
          paddingRight: 10,
          boxSizing: "border-box",
          borderRight: "1px solid var(--vg-border)",
          overflow: "hidden",
          whiteSpace: "nowrap",
          textOverflow: "ellipsis",
          cursor: "pointer",
          outline: isActive ? "2px solid var(--vg-accent)" : "none",
          outlineOffset: -2,
        }}
      >
        <button
          type="button"
          aria-label={`${group.expanded ? "Collapse" : "Expand"} ${String(group.groupingValue)}`}
          aria-expanded={group.expanded}
          onClick={(event) => {
            event.stopPropagation();
            toggleGroup(group.id);
          }}
          style={{
            width: 22,
            height: 22,
            flex: "0 0 auto",
            border: "1px solid var(--vg-border)",
            borderRadius: 4,
            background: "var(--vg-bg)",
            color: "var(--vg-text)",
            cursor: "pointer",
            lineHeight: "18px",
            padding: 0,
          }}
        >
          {group.expanded ? "−" : "+"}
        </button>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
          {labelColumn}: {String(group.groupingValue)}
        </span>
        <span
          style={{
            color: "var(--vg-text-muted)",
            fontWeight: 600,
            flex: "0 0 auto",
          }}
        >
          ({group.leafRowCount})
        </span>
      </div>
    </div>
  );
}
