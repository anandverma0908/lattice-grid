import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { LatticeGrid } from "../components/LatticeGrid";
import type { ColumnDef } from "../types";

interface Row {
  id: number;
  name: string;
  status: string;
}

const rows: Row[] = [
  { id: 1, name: "Alpha", status: "Open" },
  { id: 2, name: "Beta", status: "Closed" },
  { id: 3, name: "Gamma", status: "Open" },
];

const columns: ColumnDef<Row>[] = [
  { id: "id", label: "ID", field: "id", width: 80 },
  { id: "name", label: "Name", field: "name", width: 140 },
  { id: "status", label: "Status", field: "status", width: 120 },
];

function renderGrid(props: Partial<React.ComponentProps<typeof LatticeGrid<Row>>> = {}) {
  return render(
    <>
      <button>Before</button>
      <LatticeGrid<Row>
        ariaLabel="Keyboard grid"
        columns={columns}
        data={rows}
        getRowId={(row) => row.id}
        features={{ toolbar: false, footer: false }}
        height={220}
        {...props}
      />
      <button>After</button>
    </>,
  );
}

async function cells() {
  return screen.findAllByRole("gridcell");
}

async function focusElement(element: HTMLElement) {
  await act(async () => {
    element.focus();
  });
}

describe("LatticeGrid keyboard accessibility", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders ARIA grid semantics and roving tabindex cells", async () => {
    renderGrid();
    const grid = screen.getByRole("grid", { name: "Keyboard grid" });
    expect(grid).toHaveAttribute("aria-rowcount", "3");
    expect(grid).toHaveAttribute("aria-colcount", "3");

    const renderedCells = await cells();
    const firstCell = renderedCells[0]!;
    expect(firstCell).toHaveAttribute("aria-colindex", "1");
    expect(firstCell).toHaveAttribute("tabindex", "0");
    expect(firstCell).not.toHaveStyle({ outline: "2px solid var(--vg-accent)" });
    expect(renderedCells[1]).toHaveAttribute("tabindex", "-1");
  });

  it("activates the grid only after focus enters through a cell", async () => {
    renderGrid();
    const firstCell = (await cells())[0]!;
    expect(firstCell).toHaveAttribute("tabindex", "0");
    expect(firstCell).not.toHaveStyle({ outline: "2px solid var(--vg-accent)" });

    await focusElement(firstCell);

    await waitFor(() =>
      expect(firstCell).toHaveStyle({ outline: "2px solid var(--vg-accent)" }),
    );
  });

  it("moves focus with arrows, Home/End, and preserves grid boundaries", async () => {
    renderGrid();
    const firstCell = (await cells())[0]!;
    await focusElement(firstCell);

    fireEvent.keyDown(firstCell, { key: "ArrowRight" });
    await waitFor(() => expect(document.activeElement).toHaveTextContent("Alpha"));
    expect(document.activeElement).toHaveAttribute("aria-colindex", "2");

    fireEvent.keyDown(document.activeElement!, { key: "End" });
    await waitFor(() => expect(document.activeElement).toHaveTextContent("Open"));
    expect(document.activeElement).toHaveAttribute("aria-colindex", "3");

    fireEvent.keyDown(document.activeElement!, { key: "ArrowRight" });
    await waitFor(() => expect(document.activeElement).toHaveTextContent("Open"));
    expect(document.activeElement).toHaveAttribute("aria-colindex", "3");

    fireEvent.keyDown(document.activeElement!, { key: "Home" });
    await waitFor(() => expect(document.activeElement).toHaveTextContent("1"));
    expect(document.activeElement).toHaveAttribute("aria-colindex", "1");
  });

  it("does not trap Tab focus outside the grid", async () => {
    renderGrid();
    const before = screen.getByRole("button", { name: "Before" });
    await focusElement(before);
    fireEvent.keyDown(before, { key: "Tab" });
    await focusElement((await cells())[0]!);
    fireEvent.keyDown(document.activeElement!, { key: "Tab" });
    screen.getByRole("button", { name: "After" }).focus();
    expect(document.activeElement).toHaveTextContent("After");
  });

  it("selects, toggles, range-selects, and announces rows from the keyboard", async () => {
    renderGrid();
    const firstCell = (await cells())[0]!;
    await focusElement(firstCell);

    fireEvent.keyDown(firstCell, { key: " " });
    await waitFor(() =>
      expect(screen.getAllByRole("row")[1]).toHaveAttribute("aria-selected", "true"),
    );
    expect(screen.getByText("Row 1 selected")).toBeInTheDocument();

    fireEvent.keyDown(document.activeElement!, { key: "ArrowDown", shiftKey: true });
    await waitFor(() =>
      expect(screen.getAllByRole("row")[2]).toHaveAttribute("aria-selected", "true"),
    );
    expect(screen.getByText("Rows 1 through 2 selected")).toBeInTheDocument();
  });

  it("activates interactive elements supplied by renderCell", async () => {
    renderGrid({
      columns: [
        columns[0]!,
        {
          id: "name",
          label: "Name",
          field: "name",
          width: 140,
          renderCell: (value) => (
            <input aria-label="Custom name editor" defaultValue={String(value)} />
          ),
        },
        columns[2]!,
      ],
    });
    const firstCell = (await cells())[0]!;
    await focusElement(firstCell);
    fireEvent.keyDown(firstCell, { key: "ArrowRight" });
    await waitFor(() =>
      expect(document.activeElement).toHaveAttribute("aria-colindex", "2"),
    );

    fireEvent.keyDown(document.activeElement!, { key: "Enter" });
    const input = screen.getAllByRole("textbox", {
      name: "Custom name editor",
    })[0]!;
    await waitFor(() => expect(document.activeElement).toBe(input));

    fireEvent.keyDown(input, { key: "ArrowRight" });
    expect(document.activeElement).toBe(input);
  });

  it("does not create editors for plain cells", async () => {
    renderGrid();
    const firstCell = (await cells())[0]!;
    await focusElement(firstCell);

    fireEvent.keyDown(firstCell, { key: "End" });
    await waitFor(() => expect(document.activeElement).toHaveTextContent("Open"));
    fireEvent.keyDown(document.activeElement!, { key: "Enter" });

    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("preserves mouse click row behavior", async () => {
    const onRowClick = vi.fn();
    renderGrid({ onRowClick });
    const firstCell = (await cells())[0]!;

    fireEvent.click(firstCell);

    expect(onRowClick).toHaveBeenCalledWith(rows[0], 0);
  });

  it("handles Delete and Insert row operations through callbacks", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    const onRowsDelete = vi.fn();
    const onRowInsert = vi.fn();
    renderGrid({ onRowsDelete, onRowInsert });
    const firstCell = (await cells())[0]!;
    await focusElement(firstCell);

    fireEvent.keyDown(firstCell, { key: " " });
    fireEvent.keyDown(document.activeElement!, { key: "Delete" });
    expect(confirm).toHaveBeenCalled();
    expect(onRowsDelete).toHaveBeenCalledWith([rows[0]], [0]);

    fireEvent.keyDown(document.activeElement!, { key: "Insert" });
    expect(onRowInsert).toHaveBeenCalled();
    expect(screen.getByText("Row inserted")).toBeInTheDocument();
  });
});
