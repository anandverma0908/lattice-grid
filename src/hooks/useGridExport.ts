// =============================================================================
//  @lattice-grid-lib/core — useGridExport
//
//  Export visible grid data to CSV or JSON.
//  Respects the current visible column set and sort order.
//
//  Usage:
//    const exporter = useGridExport({ data: sortedData, columns: visibleLeaves });
//    <button onClick={() => exporter.exportCSV('inventory.csv')}>Export CSV</button>
// =============================================================================

import { useCallback } from 'react';
import type { ResolvedColumn } from '../types';

export interface UseGridExportOptions<TData> {
  /** The data to export (should already be sorted/filtered as displayed) */
  data: TData[];
  /** The visible resolved columns to include */
  columns: ResolvedColumn<TData>[];
}

export interface UseGridExportReturn {
  /** Download a CSV file */
  exportCSV: (filename?: string) => void;
  /** Download a JSON file */
  exportJSON: (filename?: string) => void;
  /** Get the raw CSV string without downloading */
  getCSVString: () => string;
  /** Get the raw JSON string without downloading */
  getJSONString: () => string;
}

function escapeCsvCell(value: unknown): string {
  if (value == null) return '';
  const str = String(value);
  // Wrap in quotes if it contains comma, newline, or double-quote
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function triggerDownload(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function useGridExport<TData>({
  data,
  columns,
}: UseGridExportOptions<TData>): UseGridExportReturn {

  const getCSVString = useCallback((): string => {
    const header = columns.map((c) => escapeCsvCell(c.label)).join(',');
    const rows = data.map((row) =>
      columns
        .map((col) => {
          const value = col.accessor
            ? col.accessor(row)
            : (row as Record<string, unknown>)[col.field ?? col.id];
          return escapeCsvCell(value);
        })
        .join(','),
    );
    return [header, ...rows].join('\n');
  }, [data, columns]);

  const getJSONString = useCallback((): string => {
    const records = data.map((row) => {
      const obj: Record<string, unknown> = {};
      for (const col of columns) {
        const value = col.accessor
          ? col.accessor(row)
          : (row as Record<string, unknown>)[col.field ?? col.id];
        obj[col.id] = value ?? null;
      }
      return obj;
    });
    return JSON.stringify(records, null, 2);
  }, [data, columns]);

  const exportCSV = useCallback(
    (filename = 'export.csv') => {
      triggerDownload(getCSVString(), filename, 'text/csv;charset=utf-8;');
    },
    [getCSVString],
  );

  const exportJSON = useCallback(
    (filename = 'export.json') => {
      triggerDownload(getJSONString(), filename, 'application/json');
    },
    [getJSONString],
  );

  return { exportCSV, exportJSON, getCSVString, getJSONString };
}
