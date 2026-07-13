import { useCallback, useMemo, useState } from 'react';

export interface UseGridPaginationOptions<TData = unknown> {
  data?: TData[];
  totalRows?: number;
  pageSize?: number;
  initialPage?: number;
}

export interface UseGridPaginationReturn<TData = unknown> {
  currentPage: number;
  pageSize: number;
  pageCount: number;
  totalRows: number;
  startIndex: number;
  endIndex: number;
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  firstPage: () => void;
  lastPage: () => void;
  setPageSize: (size: number) => void;
  canGoPrev: boolean;
  canGoNext: boolean;
  pageData: TData[];
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
