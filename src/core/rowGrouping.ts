import { isGroupColumn } from "../types";
import type { ColumnDef, LeafColumnDef, ResolvedColumn } from "../types";
import type {
  GroupedRow,
  GroupRow,
  LeafRow,
  RowGroupingState,
} from "../types";

const EMPTY_GROUP_LABEL = "Empty";

function getColumnValue<TData>(
  row: TData,
  columnId: string,
  columnsById: Map<string, ResolvedColumn<TData>>,
): unknown {
  const column = columnsById.get(columnId);
  if (column?.rowGroupValueGetter) return column.rowGroupValueGetter(row);
  if (column?.accessor) return column.accessor(row);
  return (row as Record<string, unknown>)[column?.field ?? columnId];
}

function normalizeGroupValue(value: unknown): unknown {
  return value === null || value === undefined || value === ""
    ? EMPTY_GROUP_LABEL
    : value;
}

function groupKeyPart(columnId: string, value: unknown): string {
  return `${encodeURIComponent(columnId)}=${encodeURIComponent(String(value))}`;
}

function makeLeafRows<TData>(rows: TData[]): LeafRow<TData>[] {
  return rows.map((row, index) => ({
    type: "leaf",
    id: `leaf:${index}`,
    row,
    rowIndex: index,
    depth: 0,
  }));
}

function countLeaves<TData>(rows: GroupedRow<TData>[]): number {
  return rows.reduce(
    (sum, row) =>
      sum + (row.type === "group" ? row.leafRowCount : 1),
    0,
  );
}

function buildLevel<TData>(
  rows: LeafRow<TData>[],
  groupBy: string[],
  depth: number,
  columnsById: Map<string, ResolvedColumn<TData>>,
  expandedGroupIds: Set<string>,
  path: string[],
): GroupedRow<TData>[] {
  const columnId = groupBy[depth];
  if (!columnId) {
    return rows.map((row) => ({ ...row, depth }));
  }

  const grouped = new Map<string, { value: unknown; rows: LeafRow<TData>[] }>();
  for (const row of rows) {
    const value = normalizeGroupValue(
      getColumnValue(row.row, columnId, columnsById),
    );
    const key = String(value);
    const bucket = grouped.get(key);
    if (bucket) bucket.rows.push(row);
    else grouped.set(key, { value, rows: [row] });
  }

  const result: GroupedRow<TData>[] = [];
  for (const bucket of grouped.values()) {
    const nextPath = [...path, groupKeyPart(columnId, bucket.value)];
    const id = `group:${nextPath.join("/")}`;
    const children = buildLevel(
      bucket.rows,
      groupBy,
      depth + 1,
      columnsById,
      expandedGroupIds,
      nextPath,
    );
    result.push({
      type: "group",
      id,
      path: nextPath,
      groupingColumnId: columnId,
      groupingValue: bucket.value,
      depth,
      children,
      leafRowCount: countLeaves(children),
      expanded: expandedGroupIds.has(id),
    });
  }
  return result;
}

export function buildGroupedRows<TData>(
  rows: TData[],
  groupBy: string[],
  columns: ResolvedColumn<TData>[],
  expandedGroupIds: Set<string>,
): GroupedRow<TData>[] {
  const normalizedGroupBy = groupBy.filter(Boolean);
  const leafRows = makeLeafRows(rows);
  if (normalizedGroupBy.length === 0) return leafRows;
  const columnsById = new Map(columns.map((column) => [column.id, column]));
  return buildLevel(
    leafRows,
    normalizedGroupBy,
    0,
    columnsById,
    expandedGroupIds,
    [],
  );
}

interface RowGroupCandidate {
  id: string;
  order: number;
  defOrder: number;
}

function addRowGroupCandidate<TData>(
  candidates: RowGroupCandidate[],
  column: LeafColumnDef<TData>,
  defOrder: number,
) {
  const rowGroupIndex = column.rowGroupIndex;
  const hasIndex =
    typeof rowGroupIndex === "number" && Number.isFinite(rowGroupIndex);
  if (!column.rowGroup && !hasIndex) return;
  candidates.push({
    id: column.id,
    order: hasIndex ? rowGroupIndex : Number.MAX_SAFE_INTEGER,
    defOrder,
  });
}

export function deriveGroupByFromColumnDefs<TData>(
  columns: ColumnDef<TData>[],
): string[] {
  const candidates: RowGroupCandidate[] = [];
  let defOrder = 0;

  for (const column of columns) {
    if (isGroupColumn(column)) {
      for (const child of column.children) {
        addRowGroupCandidate(candidates, child, defOrder);
        defOrder += 1;
      }
    } else {
      addRowGroupCandidate(candidates, column, defOrder);
      defOrder += 1;
    }
  }

  const seen = new Set<string>();
  return candidates
    .sort((a, b) => a.order - b.order || a.defOrder - b.defOrder)
    .flatMap((candidate) => {
      if (seen.has(candidate.id)) return [];
      seen.add(candidate.id);
      return [candidate.id];
    });
}

export function flattenVisibleGroupedRows<TData>(
  rows: GroupedRow<TData>[],
): GroupedRow<TData>[] {
  const result: GroupedRow<TData>[] = [];
  const visit = (items: GroupedRow<TData>[]) => {
    for (const item of items) {
      result.push(item);
      if (item.type === "group" && item.expanded) visit(item.children);
    }
  };
  visit(rows);
  return result;
}

export function collectGroupIds<TData>(rows: GroupedRow<TData>[]): string[] {
  const ids: string[] = [];
  const visit = (items: GroupedRow<TData>[]) => {
    for (const item of items) {
      if (item.type === "group") {
        ids.push(item.id);
        visit(item.children);
      }
    }
  };
  visit(rows);
  return ids;
}

export function createInitialRowGroupingState(
  groupBy: string[] = [],
): RowGroupingState {
  return {
    groupBy,
    expandedGroupIds: new Set(),
  };
}

export function isGroupRow<TData>(
  row: GroupedRow<TData>,
): row is GroupRow<TData> {
  return row.type === "group";
}
