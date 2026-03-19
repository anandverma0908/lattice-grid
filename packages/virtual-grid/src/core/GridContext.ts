// =============================================================================
//  @virtual-grid/core — GridContext
// =============================================================================

import { createContext, useContext } from 'react';
import type { GridEngine, GridFeatures, GridIcons, GridStyles, GridClassNames } from '../types';
import type { ColumnDragHandlers } from '../hooks/useColumnDrag';

export interface GridContextValue<TData = unknown> {
  engine:       GridEngine<TData>;
  dragHandlers: ColumnDragHandlers;
  startResize:  (e: React.MouseEvent, columnId: string) => void;
  features:     Required<GridFeatures>;
  icons:        GridIcons;
  styles:       GridStyles;
  classNames:   GridClassNames;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const GridContext = createContext<GridContextValue<any> | null>(null);

export const GridContextProvider = GridContext.Provider;

export function useGridContext<TData = unknown>(): GridContextValue<TData> {
  const ctx = useContext(GridContext);
  if (!ctx) {
    throw new Error('[VirtualGrid] useGridContext must be inside a <VirtualGrid>.');
  }
  return ctx as GridContextValue<TData>;
}
