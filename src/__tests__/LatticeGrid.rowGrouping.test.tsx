import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { LatticeGrid } from "../components/LatticeGrid";
import type { ColumnDef } from "../types";

interface Row {
  id: number;
  country: string;
  city: string;
  status: string;
}

const rows: Row[] = [
  { id: 1, country: "US", city: "NYC", status: "Open" },
  { id: 2, country: "US", city: "SF", status: "Closed" },
  { id: 3, country: "IN", city: "Pune", status: "Open" },
];

const columns: ColumnDef<Row>[] = [
  { id: "country", label: "Country", field: "country", width: 120 },
  { id: "city", label: "City", field: "city", width: 120 },
  { id: "status", label: "Status", field: "status", width: 120 },
];

const rowGroupColumns: ColumnDef<Row>[] = [
  { id: "country", label: "Country", field: "country", width: 120, rowGroupIndex: 0 },
  { id: "city", label: "City", field: "city", width: 120, rowGroup: true, rowGroupIndex: 1 },
  { id: "status", label: "Status", field: "status", width: 120 },
];

function renderGroupedGrid(
  props: Partial<React.ComponentProps<typeof LatticeGrid<Row>>> = {},
) {
  return render(
    <LatticeGrid<Row>
      ariaLabel="Grouped grid"
      columns={columns}
      data={rows}
      getRowId={(row) => row.id}
      groupBy={["country", "city"]}
      features={{ toolbar: false, footer: false }}
      height={260}
      {...props}
    />,
  );
}

describe("LatticeGrid row grouping", () => {
  it("renders collapsed top-level group rows inline", async () => {
    renderGroupedGrid();

    expect(await screen.findByText("Country: US")).toBeInTheDocument();
    expect(screen.getByText("Country: IN")).toBeInTheDocument();
    expect(screen.queryByText("NYC")).not.toBeInTheDocument();
    expect(screen.getByRole("grid", { name: "Grouped grid" })).toHaveAttribute(
      "aria-rowcount",
      "2",
    );
  });

  it("expands and collapses groups recursively", async () => {
    renderGroupedGrid();

    fireEvent.click(screen.getByRole("button", { name: "Expand US" }));
    expect(await screen.findByText("City: NYC")).toBeInTheDocument();
    expect(screen.getByText("City: SF")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Expand NYC" }));
    expect(await screen.findByText("Open")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Collapse US" }));
    await waitFor(() => expect(screen.queryByText("City: NYC")).not.toBeInTheDocument());
    expect(screen.queryByText("Open")).not.toBeInTheDocument();
  });

  it("does not select or click group rows as data rows", async () => {
    const onRowClick = vi.fn();
    renderGroupedGrid({ onRowClick });

    fireEvent.click(await screen.findByText("Country: US"));
    expect(onRowClick).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Expand NYC" }));
    fireEvent.click(await screen.findByText("Open"));

    expect(onRowClick).toHaveBeenCalledWith(rows[0], 0);
  });

  it("derives grouping from rowGroup column definitions", async () => {
    renderGroupedGrid({ columns: rowGroupColumns, groupBy: undefined });

    expect(await screen.findByText("Country: US")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Expand US" }));
    expect(await screen.findByText("City: NYC")).toBeInTheDocument();
  });

  it("lets explicit groupBy override rowGroup column definitions", async () => {
    renderGroupedGrid({ columns: rowGroupColumns, groupBy: [] });

    expect(await screen.findByText("NYC")).toBeInTheDocument();
    expect(screen.queryByText("Country: US")).not.toBeInTheDocument();
  });
});
