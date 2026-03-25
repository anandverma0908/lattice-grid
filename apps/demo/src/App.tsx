// =============================================================================
//  LatticeGrid Demo App  v2.1
//
//  Five working demos — one section per fix:
//  1. Server-side sort & pagination
//  2. Smooth pinned column scroll (visual confirmation)
//  3. Custom header renderer (renderHeader with engine access)
//  4. Column manager rendered outside the grid (sidebar + persistence)
//  5. All together — full inventory grid with all features
// =============================================================================

import React, {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
} from "react";
import {
  LatticeGrid,
  GRID_THEMES,
  type ThemePreset,
  type GridTokens,
  type GridEngine,
  type ColumnDef,
  type ColumnState,
  type SortState,
  type ResolvedColumn,
  type ColumnManagerRenderProps,
} from "@lattice-grid-lib/core";
import { generateInventoryData, type InventoryRow } from "./data/inventory";
import { INVENTORY_COLUMNS } from "./data/columns";
import { Docs } from "./components/Docs";

// ─────────────────────────────────────────────────────────────────────────────
//  STABLE DATA
// ─────────────────────────────────────────────────────────────────────────────

const ALL_DATA = generateInventoryData(5000);

// ─────────────────────────────────────────────────────────────────────────────
//  SHARED STYLES
// ─────────────────────────────────────────────────────────────────────────────

const card = (isDark: boolean): React.CSSProperties => ({
  background: isDark ? "#0d1117" : "#fff",
  border: `1px solid ${isDark ? "#1e2840" : "#e5e7eb"}`,
  borderRadius: 10,
  padding: "16px 20px",
  marginBottom: 24,
});

const sectionTitle = (isDark: boolean): React.CSSProperties => ({
  fontSize: 15,
  fontWeight: 700,
  marginBottom: 6,
  color: isDark ? "#e4e8f0" : "#111827",
  letterSpacing: "-0.02em",
  display: "flex",
  alignItems: "center",
  gap: 8,
});

const badge = (color: string): React.CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  padding: "2px 8px",
  borderRadius: 20,
  fontSize: 10,
  fontWeight: 700,
  background: color + "22",
  color,
  letterSpacing: ".04em",
});

const desc = (isDark: boolean): React.CSSProperties => ({
  fontSize: 12,
  color: isDark ? "#6b7a96" : "#6b7280",
  lineHeight: 1.6,
  marginBottom: 12,
});

const codeBlock = (isDark: boolean): React.CSSProperties => ({
  background: isDark ? "#0a0f1a" : "#f8fafc",
  border: `1px solid ${isDark ? "#1e2840" : "#e5e7eb"}`,
  borderRadius: 6,
  padding: "10px 14px",
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 11.5,
  lineHeight: 1.7,
  color: isDark ? "#7dd3fc" : "#1e40af",
  whiteSpace: "pre",
  overflowX: "auto",
  margin: "8px 0 12px",
});

// ─────────────────────────────────────────────────────────────────────────────
//  DEMO 1 — SERVER-SIDE SORT & PAGINATION
// ─────────────────────────────────────────────────────────────────────────────

function Demo1ServerSort({ isDark }: { isDark: boolean }) {
  const PAGE_SIZE = 50;

  // Simulate server state
  const [serverSort, setServerSort] = useState<SortState>({
    columnId: null,
    direction: "asc",
  });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  // Simulate server-sorted + paginated data
  const serverData = useMemo(() => {
    let rows = [...ALL_DATA];
    if (serverSort.columnId) {
      const key = serverSort.columnId as keyof InventoryRow;
      rows.sort((a, b) => {
        const va = a[key] as string | number;
        const vb = b[key] as string | number;
        if (va == null) return 1;
        if (vb == null) return -1;
        const cmp = va < vb ? -1 : va > vb ? 1 : 0;
        return serverSort.direction === "asc" ? cmp : -cmp;
      });
    }
    const start = (page - 1) * PAGE_SIZE;
    return rows.slice(start, start + PAGE_SIZE);
  }, [serverSort, page]);

  const handleSortChange = useCallback((sort: SortState) => {
    setLoading(true);
    setLog((prev) => [
      `→ API called: sort by "${sort.columnId ?? "none"}" ${sort.direction}`,
      ...prev.slice(0, 4),
    ]);
    // Simulate network delay
    setTimeout(() => {
      setServerSort(sort);
      setPage(1);
      setLoading(false);
    }, 400);
  }, []);

  const simpleColumns: ColumnDef<InventoryRow>[] = [
    {
      id: "product",
      label: "Product",
      field: "product",
      width: 220,
      pinned: "left",
      sortable: true,
    },
    { id: "dc", label: "DC", field: "dc", width: 120, sortable: true },
    {
      id: "channel",
      label: "Channel",
      field: "channel",
      width: 80,
      sortable: true,
      align: "center",
    },
    {
      id: "status",
      label: "Status",
      field: "status",
      width: 90,
      sortable: true,
    },
    {
      id: "stock",
      label: "Stock",
      field: "stock",
      width: 80,
      sortable: true,
      align: "right",
    },
    {
      id: "sold",
      label: "Sold",
      field: "sold",
      width: 80,
      sortable: true,
      align: "right",
    },
  ];

  return (
    <div style={card(isDark)}>
      <div style={sectionTitle(isDark)}>
        <span style={badge("#2563eb")}>Fix 1</span>
        Server-side sort & pagination
      </div>
      <p style={desc(isDark)}>
        Set <code>sortMode="server"</code>. The grid renders <code>data</code>{" "}
        as-is and fires <code>onSortChange</code> when a header is clicked. Your
        server fetches the sorted page and you pass it back. Click any header
        below.
      </p>
      <div style={codeBlock(isDark)}>{`<LatticeGrid
  sortMode="server"          // disable internal sort
  data={serverData}          // your pre-sorted server chunk
  loading={loading}          // show spinner while fetching
  onSortChange={(sort) => {
    // sort = { columnId: 'stock', direction: 'desc' }
    fetchPage({ ...sort, page: 1 }).then(setServerData);
  }}
/>`}</div>

      {/* API call log */}
      <div
        style={{
          background: isDark ? "#060a10" : "#f0f4f8",
          borderRadius: 6,
          padding: "8px 12px",
          marginBottom: 10,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
          color: isDark ? "#4ade80" : "#16a34a",
          minHeight: 28,
        }}
      >
        {log[0] ?? "Click a column header to trigger a server request…"}
      </div>

      <LatticeGrid<InventoryRow>
        columns={simpleColumns}
        data={serverData}
        height={240}
        theme={isDark ? "dark" : "light"}
        sortMode="server"
        loading={loading}
        onSortChange={handleSortChange}
        getRowId={(r) => r.id}
        features={{ toolbar: false, footer: true, rowSelection: false }}
        slots={{
          footer: ({ startRow, endRow, totalRows }) => (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "5px 12px",
                borderTop: `1px solid ${isDark ? "#1e2840" : "#e5e7eb"}`,
                fontSize: 11,
                color: isDark ? "#6b7a96" : "#6b7280",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              <span>
                Page {page} · rows {startRow}–{endRow} of 5,000 total
              </span>
              <div style={{ flex: 1 }} />
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  padding: "2px 8px",
                  borderRadius: 4,
                  border: `1px solid ${isDark ? "#2e3648" : "#d1d5db"}`,
                  background: "transparent",
                  color: isDark ? "#e4e8f0" : "#374151",
                  cursor: page === 1 ? "not-allowed" : "pointer",
                  opacity: page === 1 ? 0.4 : 1,
                  fontSize: 11,
                }}
              >
                ← Prev
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page * PAGE_SIZE >= ALL_DATA.length}
                style={{
                  padding: "2px 8px",
                  borderRadius: 4,
                  border: `1px solid ${isDark ? "#2e3648" : "#d1d5db"}`,
                  background: "transparent",
                  color: isDark ? "#e4e8f0" : "#374151",
                  cursor:
                    page * PAGE_SIZE >= ALL_DATA.length
                      ? "not-allowed"
                      : "pointer",
                  opacity: page * PAGE_SIZE >= ALL_DATA.length ? 0.4 : 1,
                  fontSize: 11,
                }}
              >
                Next →
              </button>
            </div>
          ),
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  DEMO 2 — SMOOTH PINNED SCROLL
// ─────────────────────────────────────────────────────────────────────────────

function Demo2SmoothScroll({ isDark }: { isDark: boolean }) {
  const cols: ColumnDef<InventoryRow>[] = [
    {
      id: "product",
      label: "Product (pinned)",
      field: "product",
      width: 200,
      pinned: "left",
    },
    { id: "dc", label: "DC (pinned)", field: "dc", width: 120, pinned: "left" },
    {
      id: "channel",
      label: "Ch (pinned)",
      field: "channel",
      width: 60,
      pinned: "left",
      align: "center",
    },
    ...Array.from({ length: 40 }, (_, i) => ({
      id: `d${i + 1}`,
      label: `Day ${i + 1}`,
      field: `d${i + 1}` as keyof InventoryRow,
      width: 70,
      align: "right" as const,
    })),
  ];

  return (
    <div style={card(isDark)}>
      <div style={sectionTitle(isDark)}>
        <span style={badge("#7c3aed")}>Fix 2</span>
        Smooth pinned column scroll
      </div>
      <p style={desc(isDark)}>
        Pinned columns now update their position in the{" "}
        <strong>same frame</strong> as the scroll event via direct DOM
        manipulation — no React state cycle involved. Scroll this grid
        horizontally and notice pinned columns move in perfect sync.
      </p>
      <div style={codeBlock(isDark)}>{`// How it works internally:
const handleScroll = () => {
  const tx = \`translateY(-\${el.scrollTop}px)\`;
  pinLeftBodyRef.current.style.transform = tx; // ← same frame, no React
  setScrollTop(el.scrollTop); // ← triggers re-render for virtualisation only
};`}</div>
      <LatticeGrid<InventoryRow>
        columns={cols}
        data={ALL_DATA.slice(0, 200)}
        height={240}
        theme={isDark ? "dark" : "light"}
        features={{ toolbar: false, footer: false }}
        getRowId={(r) => r.id}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  DEMO 3 — CUSTOM HEADER RENDERER
// ─────────────────────────────────────────────────────────────────────────────

function Demo3CustomHeader({ isDark }: { isDark: boolean }) {
  const acc = isDark ? "#93c5fd" : "#1d4ed8";

  const cols: ColumnDef<InventoryRow>[] = [
    {
      id: "product",
      label: "Product",
      field: "product",
      width: 200,
      pinned: "left",
      sortable: true,
      // renderHeader now receives (column, engine) — use engine for sort state
      renderHeader: (col, engine) => {
        const sorted = engine?.sortState.columnId === col.id;
        const dir = engine?.sortState.direction;
        return (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              width: "100%",
            }}
          >
            <span
              style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}
            >
              {col.label}
            </span>
            {sorted && (
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  padding: "1px 5px",
                  borderRadius: 3,
                  background: acc + "33",
                  color: acc,
                }}
              >
                {dir === "asc" ? "↑ ASC" : "↓ DESC"}
              </span>
            )}
          </div>
        );
      },
    },
    {
      id: "stock",
      label: "Stock",
      field: "stock",
      width: 120,
      sortable: true,
      align: "right",
      renderHeader: (col, engine) => {
        const sorted = engine?.sortState.columnId === col.id;
        return (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              width: "100%",
              justifyContent: "flex-end",
            }}
          >
            <span
              style={{
                fontSize: 9,
                padding: "1px 4px",
                borderRadius: 3,
                background: isDark ? "#1e2840" : "#f0f4f8",
                color: isDark ? "#8892a4" : "#6b7280",
              }}
            >
              num
            </span>
            <span style={{ fontWeight: sorted ? 700 : 600 }}>{col.label}</span>
          </div>
        );
      },
    },
    {
      id: "sold",
      label: "Sold",
      field: "sold",
      width: 120,
      sortable: true,
      align: "right",
      renderHeader: (col) => (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            width: "100%",
            justifyContent: "flex-end",
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: 2,
              background: "#22c55e",
            }}
          />
          <span>{col.label}</span>
        </div>
      ),
    },
    { id: "dc", label: "DC", field: "dc", width: 120 },
    { id: "status", label: "Status", field: "status", width: 100 },
  ];

  return (
    <div style={card(isDark)}>
      <div style={sectionTitle(isDark)}>
        <span style={badge("#059669")}>Fix 3</span>
        Custom header renderer with engine access
      </div>
      <p style={desc(isDark)}>
        <code>renderHeader(col, engine)</code> — the second arg gives you the
        full grid engine. Show sort badges, filter inputs, custom icons —
        anything React can render. Click "Product" or "Stock" headers to see the
        sort badge appear.
      </p>
      <div style={codeBlock(isDark)}>{`{
  id: 'product',
  renderHeader: (col, engine) => {
    const sorted = engine?.sortState.columnId === col.id;
    return (
      <span>
        {col.label}
        {sorted && <badge>{engine?.sortState.direction}</badge>}
      </span>
    );
  },
}`}</div>
      <LatticeGrid<InventoryRow>
        columns={cols}
        data={ALL_DATA.slice(0, 100)}
        height={220}
        theme={isDark ? "dark" : "light"}
        features={{ toolbar: false, footer: false }}
        getRowId={(r) => r.id}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  DEMO 4 — EXTERNAL COLUMN MANAGER + PERSISTENCE
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = "vg_demo_col_state";

function ExternalColumnPanel({
  engine,
  isDark,
}: {
  engine: GridEngine<InventoryRow>;
  isDark: boolean;
}) {
  const {
    orderedColumns,
    toggleColumnVisibility,
    pinColumn,
    resetColumns,
    showAllColumns,
  } = engine;
  const [search, setSearch] = useState("");
  const dim = isDark ? "#6b7a96" : "#6b7280";
  const txt = isDark ? "#e4e8f0" : "#111827";
  const bdr = isDark ? "#1e2840" : "#e5e7eb";
  const bg = isDark ? "#0d1117" : "#fff";
  const bgH = isDark ? "#131c2e" : "#f8fafc";

  const filtered = useMemo(
    () =>
      orderedColumns.filter((c) =>
        c.label.toLowerCase().includes(search.toLowerCase()),
      ),
    [orderedColumns, search],
  );
  const hiddenCount = orderedColumns.filter((c) => c.hidden).length;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: bg,
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Header */}
      <div style={{ padding: "10px 14px", borderBottom: `1px solid ${bdr}` }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <span style={{ fontWeight: 700, fontSize: 12, color: txt }}>
            Columns
            {hiddenCount > 0 && (
              <span
                style={{
                  marginLeft: 6,
                  fontSize: 10,
                  fontWeight: 600,
                  background: "#dbeafe",
                  color: "#1d4ed8",
                  borderRadius: 10,
                  padding: "1px 6px",
                }}
              >
                {hiddenCount} hidden
              </span>
            )}
          </span>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={showAllColumns}
              style={{
                background: "none",
                border: "none",
                fontSize: 10,
                color: "#2563eb",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Show all
            </button>
            <button
              onClick={resetColumns}
              style={{
                background: "none",
                border: "none",
                fontSize: 10,
                color: dim,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Reset
            </button>
          </div>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search columns…"
          style={{
            width: "100%",
            padding: "5px 8px",
            borderRadius: 5,
            border: `1px solid ${bdr}`,
            background: bgH,
            color: txt,
            fontSize: 11.5,
            fontFamily: "inherit",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* List */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {filtered.map((col) => (
          <div
            key={col.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "5px 14px",
              borderBottom: `1px solid ${bdr}`,
              cursor: "pointer",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = bgH)}
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <input
              type="checkbox"
              checked={!col.hidden}
              onChange={() => toggleColumnVisibility(col.id)}
              style={{
                accentColor: "#2563eb",
                cursor: "pointer",
                width: 12,
                height: 12,
                flexShrink: 0,
              }}
            />
            <label
              style={{
                flex: 1,
                fontSize: 11.5,
                cursor: "pointer",
                color: col.hidden ? dim : txt,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {col.label}
            </label>
            {col.pinned && (
              <span
                style={{
                  fontSize: 9,
                  padding: "1px 4px",
                  borderRadius: 3,
                  background: "#dbeafe",
                  color: "#1d4ed8",
                  fontWeight: 700,
                }}
              >
                {col.pinned}
              </span>
            )}
            <select
              value={col.pinned ?? ""}
              onChange={(e) =>
                pinColumn(col.id, (e.target.value as "left" | "right") || null)
              }
              style={{
                fontSize: 10,
                padding: "1px 3px",
                borderRadius: 3,
                border: `1px solid ${bdr}`,
                background: bgH,
                color: txt,
                cursor: "pointer",
                outline: "none",
              }}
            >
              <option value="">—</option>
              <option value="left">← Left</option>
              <option value="right">Right →</option>
            </select>
          </div>
        ))}
      </div>

      <div
        style={{
          padding: "8px 14px",
          borderTop: `1px solid ${bdr}`,
          fontSize: 10,
          color: dim,
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        {orderedColumns.filter((c) => !c.hidden).length}/{orderedColumns.length}{" "}
        visible
      </div>
    </div>
  );
}

function Demo4ColumnManager({ isDark }: { isDark: boolean }) {
  const engineRef = useRef<GridEngine<InventoryRow> | null>(null);
  const [tick, setTick] = useState(0);
  const [saveLog, setSaveLog] = useState<string[]>([]);

  const dim = isDark ? "#6b7a96" : "#6b7280";
  const bdr = isDark ? "#1e2840" : "#e5e7eb";
  const bg = isDark ? "#0d1117" : "#fff";

  // Load saved state on mount
  const savedState = useMemo((): ColumnState[] | undefined => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as ColumnState[]) : undefined;
    } catch {
      return undefined;
    }
  }, []);

  const handleColumnStateChange = useCallback((state: ColumnState[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      const ts = new Date().toLocaleTimeString();
      setSaveLog((prev) => [
        `Saved at ${ts} — ${state.filter((c) => c.hidden).length} hidden`,
        ...prev.slice(0, 3),
      ]);
    } catch {
      /* localStorage unavailable */
    }
  }, []);

  // The column manager panel is placed in a sidebar OUTSIDE the grid.
  // slots.columnManager returns null — the built-in button opens nothing.
  // The panel reads from engineRef which is populated via the toolbar slot.
  const columnManagerSlot = useCallback(
    ({ engine }: ColumnManagerRenderProps<InventoryRow>) => {
      // Capture engine reference so the sidebar panel can access it
      engineRef.current = engine;
      setTick((t) => t + 1);
      return null; // Don't render the built-in popup
    },
    [],
  );

  const toolbarSlot = useCallback(
    (engine: GridEngine<InventoryRow>) => {
      engineRef.current = engine;
      return (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "6px 12px",
            borderBottom: `1px solid ${bdr}`,
            background: isDark ? "#0d1117" : "#fff",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          <span style={{ fontSize: 12, color: dim, fontWeight: 500 }}>
            {ALL_DATA.slice(0, 100).length} rows
            <span
              style={{
                marginLeft: 8,
                fontSize: 10,
                color: isDark ? "#4ade80" : "#16a34a",
              }}
            >
              ← Column panel is in the sidebar →
            </span>
          </span>
          <div style={{ flex: 1 }} />
          <button
            onClick={engine.resetColumns}
            style={{
              padding: "3px 8px",
              borderRadius: 4,
              fontSize: 11,
              border: `1px solid ${bdr}`,
              background: "transparent",
              color: isDark ? "#e4e8f0" : "#374151",
              cursor: "pointer",
            }}
          >
            Reset columns
          </button>
        </div>
      );
    },
    [isDark, bdr, dim],
  );

  const simpleColumns: ColumnDef<InventoryRow>[] = [
    {
      id: "product",
      label: "Product",
      field: "product",
      width: 200,
      pinned: "left",
    },
    { id: "dc", label: "DC", field: "dc", width: 120 },
    {
      id: "channel",
      label: "Channel",
      field: "channel",
      width: 80,
      align: "center",
    },
    { id: "status", label: "Status", field: "status", width: 100 },
    { id: "stock", label: "Stock", field: "stock", width: 90, align: "right" },
    { id: "sold", label: "Sold", field: "sold", width: 90, align: "right" },
    { id: "q1", label: "Q1", field: "q1", width: 80, align: "right" },
    { id: "q2", label: "Q2", field: "q2", width: 80, align: "right" },
    { id: "q3", label: "Q3", field: "q3", width: 80, align: "right" },
  ];

  return (
    <div style={card(isDark)}>
      <div style={sectionTitle(isDark)}>
        <span style={badge("#d97706")}>Fix 4 + 5</span>
        Column manager outside the grid — with persistence
      </div>
      <p style={desc(isDark)}>
        The column panel is rendered in a sidebar completely outside the
        LatticeGrid.
        <code>slots.columnManager</code> returns <code>null</code> (no popup),
        and the engine is captured via <code>slots.toolbar</code>.{" "}
        <code>onColumnStateChange</code> auto-saves to localStorage — reload the
        page and your layout is restored.
      </p>
      <div style={codeBlock(isDark)}>{`// 1. Capture engine via toolbar slot
slots={{
  toolbar: (engine) => { engineRef.current = engine; return <MyToolbar />; },
  columnManager: ({ engine }) => { engineRef.current = engine; return null; },
}}

// 2. Persist column state
onColumnStateChange={(state) => api.post('/prefs', { columns: state })}

// 3. Render panel ANYWHERE — sidebar, drawer, modal
<aside>
  <MyColumnPanel engine={engineRef.current} />
</aside>`}</div>

      {/* Two-column layout: grid + sidebar panel */}
      <div style={{ display: "flex", gap: 12, height: 280 }}>
        {/* Grid */}
        <div style={{ flex: 1, overflow: "hidden", borderRadius: 8 }}>
          <LatticeGrid<InventoryRow>
            columns={simpleColumns}
            data={ALL_DATA.slice(0, 100)}
            height={280}
            theme={isDark ? "dark" : "light"}
            onColumnStateChange={handleColumnStateChange}
            slots={{ toolbar: toolbarSlot, columnManager: columnManagerSlot }}
            features={{ toolbar: true, footer: false }}
            getRowId={(r) => r.id}
          />
        </div>

        {/* External column manager panel */}
        <div
          style={{
            width: 200,
            flexShrink: 0,
            border: `1px solid ${bdr}`,
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          {engineRef.current ? (
            <ExternalColumnPanel engine={engineRef.current} isDark={isDark} />
          ) : (
            <div style={{ padding: 16, fontSize: 11, color: dim }}>
              Loading…
            </div>
          )}
        </div>
      </div>

      {/* Persistence log */}
      {saveLog.length > 0 && (
        <div
          style={{
            marginTop: 10,
            padding: "6px 10px",
            background: isDark ? "#061a10" : "#f0fdf4",
            borderRadius: 6,
            fontSize: 10,
            color: isDark ? "#4ade80" : "#16a34a",
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {saveLog.map((l, i) => (
            <div key={i}>✓ {l}</div>
          ))}
        </div>
      )}
      {savedState && (
        <div
          style={{
            marginTop: 6,
            fontSize: 11,
            color: dim,
          }}
        >
          ↑ Layout restored from previous session (
          {savedState.filter((c) => c.hidden).length} hidden,{" "}
          {savedState.filter((c) => c.pinned).length} pinned)
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  DEMO 5 — FULL GRID (300 cols, all features)
// ─────────────────────────────────────────────────────────────────────────────

function Demo5FullGrid({
  isDark,
  theme,
}: {
  isDark: boolean;
  theme: ThemePreset | GridTokens;
}) {
  const engineRef = useRef<GridEngine<InventoryRow> | null>(null);
  const [colPanelOpen, setColPanelOpen] = useState(false);
  const dim = isDark ? "#6b7a96" : "#6b7280";
  const bdr = isDark ? "#1e2840" : "#e5e7eb";

  const toolbarSlot = useCallback(
    (engine: GridEngine<InventoryRow>) => {
      engineRef.current = engine;
      return (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "6px 12px",
            borderBottom: `1px solid ${bdr}`,
            background: "var(--vg-bg-toolbar)",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          <span
            style={{
              fontSize: 12,
              color: "var(--vg-text-dim)",
              fontWeight: 500,
            }}
          >
            {ALL_DATA.length.toLocaleString()} rows ·{" "}
            {engine.visibleColumns.length}/{engine.orderedColumns.length} cols
          </span>
          <div style={{ flex: 1 }} />
          <button
            onClick={() => setColPanelOpen((v) => !v)}
            style={{
              padding: "4px 10px",
              borderRadius: 5,
              fontSize: 11,
              fontWeight: 600,
              border: `1.5px solid ${colPanelOpen ? "#2563eb" : bdr}`,
              background: colPanelOpen
                ? isDark
                  ? "#1e3558"
                  : "#dbeafe"
                : "transparent",
              color: colPanelOpen
                ? isDark
                  ? "#93c5fd"
                  : "#1d4ed8"
                : "var(--vg-text-dim)",
              cursor: "pointer",
            }}
          >
            {colPanelOpen ? "← Hide columns" : "Columns →"}
          </button>
          <button
            onClick={engine.resetColumns}
            style={{
              marginLeft: 6,
              padding: "4px 10px",
              borderRadius: 5,
              fontSize: 11,
              border: `1px solid ${bdr}`,
              background: "transparent",
              color: "var(--vg-text-dim)",
              cursor: "pointer",
            }}
          >
            Reset
          </button>
        </div>
      );
    },
    [bdr, colPanelOpen, isDark],
  );

  const columnManagerSlot = useCallback(
    ({ engine }: ColumnManagerRenderProps<InventoryRow>) => {
      engineRef.current = engine;
      return null;
    },
    [],
  );

  return (
    <div style={card(isDark)}>
      <div style={sectionTitle(isDark)}>
        Full grid — 300 columns, all features
      </div>
      <p style={desc(isDark)}>
        5,000 rows × 300 columns with column groups, pinning, freeze, row
        selection, resize, reorder, hide, and an external column panel toggled
        from the toolbar.
      </p>

      <div style={{ display: "flex", gap: 12, overflow: "hidden" }}>
        <div style={{ flex: 1, overflow: "hidden", borderRadius: 8 }}>
          <LatticeGrid<InventoryRow>
            columns={INVENTORY_COLUMNS}
            data={ALL_DATA}
            theme={theme}
            style={{ flex: 1, borderRadius: 8 }}
            height={420}
            rowHeight={34}
            headerHeight={36}
            groupHeaderHeight={26}
            freezeColId="dc"
            slots={{ toolbar: toolbarSlot, columnManager: columnManagerSlot }}
            features={{ toolbar: true, footer: true, rowSelection: true }}
            getRowId={(r) => r.id}
          />
        </div>

        {colPanelOpen && (
          <div
            style={{
              width: 220,
              flexShrink: 0,
              border: `1px solid ${bdr}`,
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            {engineRef.current ? (
              <ExternalColumnPanel engine={engineRef.current} isDark={isDark} />
            ) : (
              <div style={{ padding: 16, fontSize: 11, color: dim }}>
                Loading…
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  THEME PRESETS
// ─────────────────────────────────────────────────────────────────────────────

const PRESETS: Array<{ key: ThemePreset; dot: string }> = [
  { key: "light", dot: "#2563eb" },
  { key: "dark", dot: "#3b82f6" },
  { key: "ocean", dot: "#0e9eff" },
  { key: "forest", dot: "#4ade80" },
  { key: "sunset", dot: "#fb923c" },
];

// ─────────────────────────────────────────────────────────────────────────────
//  APP
// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  const [view, setView] = useState<"demo" | "docs">("demo");
  const [activePreset, setActivePreset] = useState<ThemePreset>("light");
  const [tokenOverrides, setTokenOverrides] = useState<GridTokens>({});

  const isDark = ["dark", "ocean", "forest", "sunset"].includes(activePreset);
  const pageBg = isDark ? "#070c14" : "#f0f2f7";
  const navBg = isDark ? "#0d1117" : "#ffffff";
  const borderClr = isDark ? "#1e2840" : "#e5e7eb";
  const textClr = isDark ? "#e4e8f0" : "#111827";
  const dimClr = isDark ? "#6b7a96" : "#6b7280";
  const btnBg = isDark ? "#1c2438" : "#f3f4f6";
  const btnBdr = isDark ? "#2e3648" : "#d1d5db";

  const theme = useMemo((): ThemePreset | GridTokens => {
    if (Object.keys(tokenOverrides).length === 0) return activePreset;
    return { ...GRID_THEMES[activePreset], ...tokenOverrides };
  }, [activePreset, tokenOverrides]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: pageBg,
        fontFamily: "'DM Sans', sans-serif",
        color: textClr,
        overflow: "hidden",
      }}
    >
      {/* NAV */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          height: 48,
          padding: "0 16px",
          gap: 12,
          background: navBg,
          borderBottom: `1px solid ${borderClr}`,
          flexShrink: 0,
          zIndex: 10,
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              background: "linear-gradient(135deg,#2563eb,#7c3aed)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <rect
                x="1"
                y="1"
                width="5"
                height="5"
                rx="1.2"
                fill="white"
                opacity=".9"
              />
              <rect
                x="8"
                y="1"
                width="5"
                height="5"
                rx="1.2"
                fill="white"
                opacity=".55"
              />
              <rect
                x="1"
                y="8"
                width="5"
                height="5"
                rx="1.2"
                fill="white"
                opacity=".55"
              />
              <rect
                x="8"
                y="8"
                width="5"
                height="5"
                rx="1.2"
                fill="white"
                opacity=".9"
              />
            </svg>
          </div>
          <span
            style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.02em" }}
          >
            LatticeGrid
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              padding: "2px 6px",
              background: isDark ? "#1e3558" : "#dbeafe",
              color: isDark ? "#93c5fd" : "#1d4ed8",
              borderRadius: 20,
            }}
          >
            v2.1
          </span>
        </div>

        {/* View tabs */}
        <div style={{ display: "flex", gap: 2, marginLeft: 12 }}>
          {(["demo", "docs"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                padding: "4px 12px",
                borderRadius: 5,
                border: "none",
                background:
                  view === v ? (isDark ? "#1e3558" : "#dbeafe") : "transparent",
                color: view === v ? (isDark ? "#93c5fd" : "#1d4ed8") : dimClr,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                textTransform: "capitalize",
              }}
            >
              {v === "demo" ? "Demos" : "Docs"}
            </button>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        {/* Theme dots */}
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => setActivePreset(p.key)}
              title={p.key}
              style={{
                width: 18,
                height: 18,
                borderRadius: "50%",
                background: p.dot,
                border: "none",
                cursor: "pointer",
                padding: 0,
                outline:
                  activePreset === p.key ? `2.5px solid ${textClr}` : "none",
                outlineOffset: 2,
              }}
            />
          ))}
        </div>
      </header>

      {/* BODY */}
      {view === "docs" ? (
        <Docs isDark={isDark} />
      ) : (
        <div style={{ flex: 1, overflow: "auto", padding: 20 }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <Demo1ServerSort isDark={isDark} />
            <Demo2SmoothScroll isDark={isDark} />
            <Demo3CustomHeader isDark={isDark} />
            <Demo4ColumnManager isDark={isDark} />
            <Demo5FullGrid isDark={isDark} theme={theme} />
          </div>
        </div>
      )}
    </div>
  );
}
