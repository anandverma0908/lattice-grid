// =============================================================================
//  @lattice-grid/core — useGridPagination
//
//  Thin pagination state manager. Supports both:
//    • Client-side  — pass `data` and get back a `pageData` slice
//    • Server-side  — pass `totalRows` and get back page/size to fetch with
//
//  Usage (client-side):
//    const page = useGridPagination({ data: allRows, pageSize: 100 });
//    <LatticeGrid data={page.pageData} ... />
//    <Pagination {...page} />
//
//  Usage (server-side):
//    const page = useGridPagination({ totalRows: 50000, pageSize: 100 });
//    // fetch data whenever page.currentPage changes
//    useEffect(() => fetchPage(page.currentPage, page.pageSize), [page.currentPage]);
//    <LatticeGrid data={serverData} ... />
// =============================================================================

import { useCallback, useMemo, useState } from 'react';

export interface UseGridPaginationOptions<TData = unknown> {
  /** Full data array (client-side mode). Omit for server-side. */
  data?: TData[];
  /** Total row count. Required for server-side mode; derived from data if omitted. */
  totalRows?: number;
  /** Rows per page. Default: 100 */
  pageSize?: number;
  /** Initial page (1-indexed). Default: 1 */
  initialPage?: number;
}

export interface UseGridPaginationReturn<TData = unknown> {
  /** 1-indexed current page number */
  currentPage: number;
  /** Rows per page */
  pageSize: number;
  /** Total number of pages */
  pageCount: number;
  /** Total row count */
  totalRows: number;
  /** Index of the first row on this page (0-indexed) */
  startIndex: number;
  /** Index of the last row on this page (0-indexed, inclusive) */
  endIndex: number;
  /** Go to a specific page (1-indexed, clamped) */
  goToPage: (page: number) => void;
  /** Go to the next page */
  nextPage: () => void;
  /** Go to the previous page */
  prevPage: () => void;
  /** Go to the first page */
  firstPage: () => void;
  /** Go to the last page */
  lastPage: () => void;
  /** Change the page size (resets to page 1) */
  setPageSize: (size: number) => void;
  /** Whether a previous page exists */
  canGoPrev: boolean;
  /** Whether a next page exists */
  canGoNext: boolean;
  /** Client-side only: the current page's data slice */
  pageData: TData[];
  /** Page size options for a selector UI */
  pageSizeOptions: number[];
}

const DEFAULT_PAGE_SIZE_OPTIONS = [25, 50, 100, 200, 500];

export function useGridPagination<TData = unknown>({
  data,
  totalRows: totalRowsProp,
  pageSize: pageSizeProp = 100,
  initialPage = 1,
}: UseGridPaginationOptions<TData> = {}): UseGridPaginationReturn<TData> {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSizeState] = useState(pageSizeProp);

  const totalRows = totalRowsProp ?? data?.length ?? 0;
  const pageCount = Math.max(1, Math.ceil(totalRows / pageSize));

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize - 1, totalRows - 1);

  const goToPage = useCallback(
    (page: number) => {
      setCurrentPage(Math.max(1, Math.min(page, pageCount)));
    },
    [pageCount],
  );

  const nextPage  = useCallback(() => goToPage(currentPage + 1), [goToPage, currentPage]);
  const prevPage  = useCallback(() => goToPage(currentPage - 1), [goToPage, currentPage]);
  const firstPage = useCallback(() => goToPage(1), [goToPage]);
  const lastPage  = useCallback(() => goToPage(pageCount), [goToPage, pageCount]);

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size);
    setCurrentPage(1);
  }, []);

  const pageData = useMemo((): TData[] => {
    if (!data) return [];
    return data.slice(startIndex, endIndex + 1);
  }, [data, startIndex, endIndex]);

  return {
    currentPage,
    pageSize,
    pageCount,
    totalRows,
    startIndex,
    endIndex,
    goToPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    setPageSize,
    canGoPrev: currentPage > 1,
    canGoNext: currentPage < pageCount,
    pageData,
    pageSizeOptions: DEFAULT_PAGE_SIZE_OPTIONS,
  };
}
