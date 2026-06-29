import { describe, expect, it } from "vitest";
import {
  buildGroupedRows,
  collectGroupIds,
  deriveGroupByFromColumnDefs,
  flattenVisibleGroupedRows,
} from "../core/rowGrouping";
import type { ColumnDef, GroupRow, ResolvedColumn } from "../types";

interface Row {
  id: number;
  country?: string | null;
  city?: string | null;
  status?: string | null;
  value: number;
}

const rows: Row[] = [
  { id: 1, country: "US", city: "NYC", status: "Open", value: 3 },
  { id: 2, country: "US", city: "NYC", status: "Closed", value: 1 },
  { id: 3, country: "US", city: "SF", status: "Open", value: 2 },
  { id: 4, country: "IN", city: "Pune", status: null, value: 4 },
];

function column(id: keyof Row & string): ResolvedColumn<Row> {
  return {
    id,
    label: id,
    field: id,
    align: "left",
    sortable: true,
    resizable: true,
    draggable: true,
    hideable: true,
    rowGroup: false,
    rowGroupIndex: null,
    width: 100,
    minWidth: 40,
    maxWidth: Infinity,
    pinned: null,
    hidden: false,
    groupId: null,
    defIndex: 0,
  };
}

const columns = [
  column("country"),
  column("city"),
  column("status"),
  column("value"),
];

function groupsOnly(items: ReturnType<typeof buildGroupedRows<Row>>) {
  return items.filter((item): item is GroupRow<Row> => item.type === "group");
}

describe("row grouping model", () => {
  it("returns leaf rows unchanged when no grouping is active", () => {
    const grouped = buildGroupedRows(rows, [], columns, new Set());
    expect(grouped.map((row) => row.type)).toEqual(["leaf", "leaf", "leaf", "leaf"]);
    expect(flattenVisibleGroupedRows(grouped)).toHaveLength(4);
  });

  it("builds single-level groups with descendant counts", () => {
    const grouped = groupsOnly(
      buildGroupedRows(rows, ["country"], columns, new Set()),
    );
    expect(grouped.map((group) => [group.groupingValue, group.leafRowCount])).toEqual([
      ["US", 3],
      ["IN", 1],
    ]);
  });

  it("builds unlimited-depth groups recursively", () => {
    const grouped = groupsOnly(
      buildGroupedRows(rows, ["country", "city", "status"], columns, new Set()),
    );
    const us = grouped[0]!;
    const nyc = groupsOnly(us.children)[0]!;
    const open = groupsOnly(nyc.children)[0]!;

    expect(us.depth).toBe(0);
    expect(nyc.depth).toBe(1);
    expect(open.depth).toBe(2);
    expect(open.children[0]?.type).toBe("leaf");
    expect(open.children[0]?.depth).toBe(3);
  });

  it("flattens only expanded descendants", () => {
    const collapsed = buildGroupedRows(rows, ["country", "city"], columns, new Set());
    expect(flattenVisibleGroupedRows(collapsed).map((row) => row.type)).toEqual([
      "group",
      "group",
    ]);

    const firstGroupId = collectGroupIds(collapsed)[0]!;
    const expanded = buildGroupedRows(
      rows,
      ["country", "city"],
      columns,
      new Set([firstGroupId]),
    );
    expect(flattenVisibleGroupedRows(expanded).map((row) => row.type)).toEqual([
      "group",
      "group",
      "group",
      "group",
    ]);
  });

  it("groups empty values under a readable label", () => {
    const grouped = buildGroupedRows(rows, ["status"], columns, new Set());
    expect(groupsOnly(grouped).map((group) => group.groupingValue)).toContain("Empty");
  });

  it("does not crash when grouping by a missing column", () => {
    const grouped = buildGroupedRows(rows, ["missing"], columns, new Set());
    expect(groupsOnly(grouped)).toHaveLength(1);
    expect(groupsOnly(grouped)[0]?.groupingValue).toBe("Empty");
  });

  it("keeps sorted leaf order inside expanded groups", () => {
    const sorted = [...rows].sort((a, b) => a.value - b.value);
    const grouped = buildGroupedRows(
      sorted,
      ["country"],
      columns,
      new Set(["group:country=US"]),
    );
    const us = groupsOnly(grouped).find((group) => group.groupingValue === "US")!;
    expect(us.children.map((child) => child.type === "leaf" && child.row.id)).toEqual([
      2,
      3,
      1,
    ]);
  });

  it("groups filtered rows after filtering has already reduced the leaves", () => {
    const filtered = rows.filter((row) => row.status === "Open");
    const grouped = groupsOnly(
      buildGroupedRows(filtered, ["country"], columns, new Set()),
    );
    expect(grouped.map((group) => [group.groupingValue, group.leafRowCount])).toEqual([
      ["US", 2],
    ]);
  });

  it("derives groupBy from AG Grid-style column rowGroup config", () => {
    const defs: ColumnDef<Row>[] = [
      { id: "country", label: "Country", field: "country", rowGroup: true, rowGroupIndex: 1 },
      { id: "city", label: "City", field: "city", rowGroupIndex: 0 },
      { id: "status", label: "Status", field: "status", rowGroup: true },
      { id: "value", label: "Value", field: "value" },
    ];

    expect(deriveGroupByFromColumnDefs(defs)).toEqual(["city", "country", "status"]);
  });

  it("derives groupBy from row-grouped children inside column groups", () => {
    const defs: ColumnDef<Row>[] = [
      { id: "country", label: "Country", field: "country", rowGroup: true },
      {
        id: "location",
        label: "Location",
        children: [
          { id: "city", label: "City", field: "city", rowGroup: true, rowGroupIndex: 0 },
          { id: "status", label: "Status", field: "status", rowGroup: true },
        ],
      },
    ];

    expect(deriveGroupByFromColumnDefs(defs)).toEqual(["city", "country", "status"]);
  });

  it("uses rowGroupValueGetter only for grouping keys", () => {
    const normalizedColumns = [
      {
        ...column("city"),
        rowGroupValueGetter: (row: Row) => row.city?.toLowerCase(),
      },
    ];
    const grouped = buildGroupedRows(
      [{ ...rows[0]!, city: "NYC" }, { ...rows[1]!, city: "nyc" }],
      ["city"],
      normalizedColumns,
      new Set(),
    );

    expect(groupsOnly(grouped)).toHaveLength(1);
    expect(groupsOnly(grouped)[0]?.groupingValue).toBe("nyc");
  });
});
