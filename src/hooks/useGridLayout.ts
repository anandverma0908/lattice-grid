export interface UseGridLayoutOptions {
  pinnedLeftWidth: number;
  pinnedRightWidth: number;
  totalScrollW: number;
  bodyWrapW: number;
  bodyWrapH: number;
  totalHeaderHeight: number;
  rowHeight: number;
  visibleRowsLength: number;
  toolbarEnabled: boolean;
  toolbarSlotProvided: boolean;
  footerEnabled: boolean;
  footerSlotProvided: boolean;
  height?: number | undefined;
  maxHeight: number;
}

export interface GridLayout {
  canvasW: number;
  effectiveHeight: number;
  visibleRowCount: number;
  spacerHeight: number;
}

export function useGridLayout({
  pinnedLeftWidth,
  pinnedRightWidth,
  totalScrollW,
  bodyWrapW,
  bodyWrapH,
  totalHeaderHeight,
  rowHeight,
  visibleRowsLength,
  toolbarEnabled,
  toolbarSlotProvided,
  footerEnabled,
  footerSlotProvided,
  height,
  maxHeight,
}: UseGridLayoutOptions): GridLayout {
  const canvasW = pinnedLeftWidth + totalScrollW + pinnedRightWidth;
  const needsHorizontalScrollbar = canvasW > bodyWrapW + 1;

  const toolbarH = toolbarEnabled && !toolbarSlotProvided ? 36 : 0;
  const footerH = footerEnabled && !footerSlotProvided ? 29 : 0;
  const SCROLLBAR_GUTTER = 17;
  const horizontalScrollbarGutter = needsHorizontalScrollbar ? SCROLLBAR_GUTTER : 0;
  const contentH =
    totalHeaderHeight + visibleRowsLength * rowHeight + toolbarH + footerH + horizontalScrollbarGutter;
  const heightCap = height ?? maxHeight;
  const effectiveHeight = Math.min(contentH, heightCap);

  const visibleRowCount = Math.max(
    1,
    Math.floor(Math.max(0, bodyWrapH - totalHeaderHeight) / rowHeight),
  );

  const spacerHeight = totalHeaderHeight + visibleRowsLength * rowHeight;

  return { canvasW, effectiveHeight, visibleRowCount, spacerHeight };
}
