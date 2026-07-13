import type { UseGridKeyboardReturn } from "../hooks/useGridKeyboard";
import type { ResolvedColumn } from "../types";

export function getHeaderKeyboardProps<TData>(
  column: ResolvedColumn<TData>,
  visibleColIndexById: Map<string, number>,
  keyboard: UseGridKeyboardReturn,
) {
  const colIndex = visibleColIndexById.get(column.id) ?? 0;
  return {
    colIndex,
    active: keyboard.isHeaderFocused(colIndex),
    focusable: keyboard.isHeaderFocused(colIndex),
    onFocusHeader: (nextColIndex: number) =>
      keyboard.setFocusedTarget({ kind: "header", colIndex: nextColIndex }),
  };
}

export function getGroupHeaderKeyboardProps(
  groupId: string,
  colStartIndex: number,
  colEndIndex: number,
  keyboard: UseGridKeyboardReturn,
) {
  return {
    colStartIndex,
    colEndIndex,
    active: keyboard.isGroupHeaderFocused(groupId),
    focusable: keyboard.isGroupHeaderFocused(groupId),
    onFocusGroupHeader: (
      nextGroupId: string,
      nextColStartIndex: number,
      nextColEndIndex: number,
    ) =>
      keyboard.setFocusedTarget({
        kind: "groupHeader",
        groupId: nextGroupId,
        colStartIndex: nextColStartIndex,
        colEndIndex: nextColEndIndex,
      }),
  };
}
