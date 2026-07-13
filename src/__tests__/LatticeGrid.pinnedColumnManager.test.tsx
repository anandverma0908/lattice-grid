import React from "react";
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { LatticeGrid } from "../components/LatticeGrid";
import type { ColumnDef } from "../types";

interface Row {
  id: number;
  a: string;
  b: string;
  c: string;
  d: string;
}

const rows: Row[] = [
  { id: 1, a: "a1", b: "b1", c: "c1", d: "d1" },
  { id: 2, a: "a2", b: "b2", c: "c2", d: "d2" },
];

function renderPinnedGrid(props: Partial<React.ComponentProps<typeof LatticeGrid<Row>>> = {}) {
  const columns: ColumnDef<Row>[] = [
    { id: "a", label: "A", field: "a", width: 100, pinned: "left" },
    { id: "b", label: "B", field: "b", width: 100 },
    { id: "c", label: "C", field: "c", width: 100 },
    { id: "d", label: "D", field: "d", width: 100, pinned: "right" },
  ];
  return render(
    <LatticeGrid<Row>
      ariaLabel="Pinned grid"
      columns={columns}
      data={rows}
      getRowId={(row) => row.id}
      features={{ toolbar: false, footer: false }}
      height={260}
      {...props}
    />,
  );
}

describe("LatticeGrid pinned columns", () => {
  it("renders pinned-left and pinned-right cells alongside scrollable cells", async () => {
    renderPinnedGrid();

    expect((await screen.findAllByText("a1")).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("d1").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("b1").length).toBeGreaterThanOrEqual(1);
  });

  it("renders the frozen column body and survives a scroll event without crashing", async () => {
    const { container } = renderPinnedGrid({ freezeColId: "c" });

    await screen.findByText("a1");

    const scrollEl = Array.from(container.querySelectorAll("div")).find(
      (el) => (el as HTMLElement).style.overflowX === "auto",
    ) as HTMLElement | undefined;
    expect(scrollEl).toBeTruthy();

    Object.defineProperty(scrollEl, "scrollLeft", { value: 500, writable: true });
    Object.defineProperty(scrollEl, "scrollTop", { value: 0, writable: true });
    fireEvent.scroll(scrollEl!);

    expect(screen.getAllByText("c1").length).toBeGreaterThanOrEqual(1);
  });
});

describe("LatticeGrid ColumnManager", () => {
  it("opens the column manager and toggles column visibility via the shared ColumnListPanel", async () => {
    renderPinnedGrid({ features: { toolbar: true, footer: false } });

    fireEvent.click(await screen.findByRole("button", { name: /columns/i }));

    const dialog = await screen.findByRole("dialog");
    const checkboxB = within(dialog).getByLabelText("B") as HTMLInputElement;
    expect(checkboxB.checked).toBe(true);

    fireEvent.click(checkboxB);
    expect(checkboxB.checked).toBe(false);

    expect(screen.queryByText("b1")).not.toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("button", { name: /done/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
