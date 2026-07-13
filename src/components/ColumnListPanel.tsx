import { useMemo, useState, type CSSProperties, type ReactNode, type Ref } from "react";
import type { PinSide, ResolvedColumn } from "../types";

export interface ColumnListPanelTexts {
  columns: string;
  hidden: string;
  showAll: string;
  reset: string;
  noPin: string;
  pinLeft: string;
  pinRight: string;
  done: string;
  searchPlaceholder: string;
  noMatch: (search: string) => string;
}

const DEFAULT_TEXTS: ColumnListPanelTexts = {
  columns: "Columns",
  hidden: "hidden",
  showAll: "Show all",
  reset: "Reset",
  noPin: "No pin",
  pinLeft: "Pin left",
  pinRight: "Pin right",
  done: "Done",
  searchPlaceholder: "Search columns…",
  noMatch: (search) => `No columns match "${search}"`,
};

export interface ColumnListPanelProps<TData> {
  columns: ResolvedColumn<TData>[];
  toggleColumnVisibility: (id: string) => void;
  pinColumn: (id: string, side: PinSide | null) => void;
  showAllColumns: () => void;
  resetColumns?: (() => void) | undefined;
  columnPinEnabled?: boolean;
  searchable?: boolean;
  onClose?: (() => void) | undefined;
  texts?: Partial<ColumnListPanelTexts> | undefined;
  panelRef?: Ref<HTMLDivElement> | undefined;
  style?: CSSProperties | undefined;
  className?: string | undefined;
  role?: string | undefined;
  ariaLabel?: string | undefined;
}

export function ColumnListPanel<TData>({
  columns,
  toggleColumnVisibility,
  pinColumn,
  showAllColumns,
  resetColumns,
  columnPinEnabled = true,
  searchable = false,
  onClose,
  texts: textsProp,
  panelRef,
  style,
  className,
  role,
  ariaLabel,
}: ColumnListPanelProps<TData>): ReactNode {
  const texts = { ...DEFAULT_TEXTS, ...textsProp };
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () =>
      searchable
        ? columns.filter((c) => c.label.toLowerCase().includes(search.toLowerCase()))
        : columns,
    [columns, search, searchable],
  );

  const hiddenCount = columns.filter((c) => c.hidden).length;

  return (
    <div
      ref={panelRef}
      role={role}
      aria-label={ariaLabel}
      className={className}
      style={{
        display: "flex",
        flexDirection: "column",
        fontFamily: "var(--vg-font, sans-serif)",
        fontSize: "var(--vg-font-size, 12.5px)",
        background: "var(--vg-bg-panel, #fff)",
        border: "1px solid var(--vg-border-strong, #d1d5db)",
        borderRadius: "var(--vg-radius, 7px)",
        boxShadow: "var(--vg-shadow-panel, 0 8px 24px rgba(0,0,0,0.1))",
        overflow: "hidden",
        minWidth: 260,
        maxHeight: 420,
        ...style,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px 8px",
          borderBottom: "1px solid var(--vg-border, #e5e7eb)",
          gap: 8,
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontWeight: 700,
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "var(--vg-text-dim, #6b7280)",
          }}
        >
          {texts.columns}
          {hiddenCount > 0 && (
            <span
              style={{
                marginLeft: 6,
                background: "var(--vg-accent-bg, #dbeafe)",
                color: "var(--vg-accent-text, #1d4ed8)",
                borderRadius: 10,
                padding: "1px 6px",
                fontSize: 10,
              }}
            >
              {hiddenCount} {texts.hidden}
            </span>
          )}
        </span>
        <div style={{ display: "flex", gap: 6 }}>
          {hiddenCount > 0 && (
            <button
              onClick={showAllColumns}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 11,
                color: "var(--vg-accent, #2563eb)",
                fontWeight: 600,
                fontFamily: "var(--vg-font, sans-serif)",
                padding: "2px 4px",
              }}
            >
              {texts.showAll}
            </button>
          )}
          {resetColumns && (
            <button
              onClick={resetColumns}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 11,
                color: "var(--vg-text-dim, #6b7280)",
                fontFamily: "var(--vg-font, sans-serif)",
                padding: "2px 4px",
              }}
            >
              {texts.reset}
            </button>
          )}
        </div>
      </div>

      {searchable && (
        <div
          style={{
            padding: "8px 14px",
            borderBottom: "1px solid var(--vg-border, #e5e7eb)",
            flexShrink: 0,
          }}
        >
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={texts.searchPlaceholder}
            style={{
              width: "100%",
              padding: "5px 9px",
              border: "1px solid var(--vg-border-strong, #d1d5db)",
              borderRadius: "var(--vg-radius-sm, 4px)",
              background: "var(--vg-bg, #fff)",
              color: "var(--vg-text, #111827)",
              fontSize: 12,
              outline: "none",
              fontFamily: "var(--vg-font, sans-serif)",
              boxSizing: "border-box",
            }}
          />
        </div>
      )}

      <div style={{ overflow: "auto", flex: 1 }}>
        {filtered.map((col) => (
          <div
            key={col.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 14px",
              fontSize: "var(--vg-font-size, 12.5px)",
              color: col.hidden ? "var(--vg-text-dim, #6b7280)" : "var(--vg-text, #111827)",
              transition: "background var(--vg-transition, 0.15s)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "var(--vg-bg-row-hover, #f0f5ff)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
          >
            <input
              type="checkbox"
              id={`vg-col-${col.id}`}
              checked={!col.hidden}
              onChange={() => toggleColumnVisibility(col.id)}
              style={{
                accentColor: "var(--vg-accent, #2563eb)",
                cursor: "pointer",
                width: 13,
                height: 13,
                flexShrink: 0,
              }}
            />
            <label
              htmlFor={`vg-col-${col.id}`}
              style={{
                flex: 1,
                cursor: "pointer",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {col.label}
            </label>
            {columnPinEnabled && (
              <select
                value={col.pinned ?? ""}
                onChange={(e) => pinColumn(col.id, (e.target.value as PinSide) || null)}
                style={{
                  fontSize: 11,
                  padding: "2px 5px",
                  background: "var(--vg-bg-btn, #f3f4f6)",
                  color: "var(--vg-text, #111827)",
                  border: "1px solid var(--vg-border-strong, #d1d5db)",
                  borderRadius: "var(--vg-radius-xs, 3px)",
                  cursor: "pointer",
                  fontFamily: "var(--vg-font, sans-serif)",
                  outline: "none",
                }}
              >
                <option value="">{texts.noPin}</option>
                <option value="left">{texts.pinLeft}</option>
                <option value="right">{texts.pinRight}</option>
              </select>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div
            style={{
              padding: "20px 14px",
              textAlign: "center",
              fontSize: 12,
              color: "var(--vg-text-dim, #6b7280)",
            }}
          >
            {texts.noMatch(search)}
          </div>
        )}
      </div>

      {/* Footer */}
      {onClose && (
        <div
          style={{
            padding: "10px 14px",
            borderTop: "1px solid var(--vg-border, #e5e7eb)",
            flexShrink: 0,
          }}
        >
          <button
            onClick={onClose}
            style={{
              width: "100%",
              padding: "7px 12px",
              background: "var(--vg-accent, #2563eb)",
              color: "var(--vg-accent-fg, #fff)",
              border: "none",
              borderRadius: "var(--vg-radius-sm, 4px)",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "var(--vg-font-size, 12.5px)",
              fontFamily: "var(--vg-font, sans-serif)",
              transition: "background var(--vg-transition, 0.15s)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "var(--vg-accent-hover, #1d4ed8)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "var(--vg-accent, #2563eb)";
            }}
          >
            {texts.done}
          </button>
        </div>
      )}
    </div>
  );
}
