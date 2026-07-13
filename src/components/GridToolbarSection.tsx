import { useState, type ReactNode } from "react";
import type { GridEngine, GridIcons, GridSlots, GridTexts } from "../types";
import { ColumnManager } from "./ColumnManager";
import { Toolbar, ToolbarButton, ColsIcon } from "./Toolbar";

export interface GridToolbarSectionProps<TData> {
  enabled: boolean;
  slots: GridSlots<TData>;
  engine: GridEngine<TData>;
  texts: GridTexts;
  icons: GridIcons;
  visibleRowCount: number;
  selectedCount: number;
}

export function GridToolbarSection<TData>({
  enabled,
  slots,
  engine,
  texts,
  icons,
  visibleRowCount,
  selectedCount,
}: GridToolbarSectionProps<TData>): ReactNode {
  const [showColMgr, setShowColMgr] = useState(false);

  if (!enabled) return null;
  if (slots.toolbar) return slots.toolbar(engine);

  const defaultToolbarLeft = (
    <span style={{ fontSize: 12, color: "var(--vg-text-dim)", fontWeight: 500 }}>
      {visibleRowCount.toLocaleString()} {texts.rows}
      {selectedCount > 0 && (
        <span style={{ marginLeft: 8, color: "var(--vg-accent)", fontWeight: 600 }}>
          · {selectedCount.toLocaleString()} {texts.selected}
        </span>
      )}
    </span>
  );

  const colManagerNode = showColMgr ? (
    slots.columnManager ? (
      slots.columnManager({ engine, onClose: () => setShowColMgr(false) })
    ) : (
      <ColumnManager onClose={() => setShowColMgr(false)} />
    )
  ) : null;

  const colsButtonIcon = icons.columnsPanel ?? <ColsIcon />;

  return (
    <Toolbar
      left={slots.toolbarLeft ?? defaultToolbarLeft}
      right={slots.toolbarRight}
      colManagerSlot={
        <>
          <ToolbarButton
            onClick={() => setShowColMgr((v) => !v)}
            active={showColMgr}
            icon={colsButtonIcon}
            aria-label={texts.manageColumns}
          >
            {texts.columns}
          </ToolbarButton>
          {colManagerNode}
        </>
      }
    />
  );
}
