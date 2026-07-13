import type { ReactNode } from "react";
import type { GridSlots } from "../types";
import { Footer } from "./Toolbar";

export interface GridFooterSectionProps<TData> {
  enabled: boolean;
  slots: GridSlots<TData>;
  startRow: number;
  endRow: number;
  totalRows: number;
  visibleCols: number;
  totalCols: number;
}

export function GridFooterSection<TData>({
  enabled,
  slots,
  startRow,
  endRow,
  totalRows,
  visibleCols,
  totalCols,
}: GridFooterSectionProps<TData>): ReactNode {
  if (!enabled) return null;

  const footerProps = { startRow, endRow, totalRows, visibleCols, totalCols };

  return slots.footer ? slots.footer(footerProps) : <Footer {...footerProps} />;
}
