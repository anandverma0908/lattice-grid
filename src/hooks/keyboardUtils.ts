import type { FocusTarget } from "../types/keyboard";

export function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

export function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement
    ? Boolean(
        target.closest(
          'input, textarea, select, button, a[href], [contenteditable="true"], [role="button"], [role="textbox"], [role="checkbox"], [role="combobox"], [role="menuitem"], [role="option"], [role="radio"], [role="searchbox"], [role="slider"], [role="switch"], [role="spinbutton"], [role="tab"]',
        ),
      )
    : false;
}

export function isSameFocusTarget(
  a: FocusTarget | null,
  b: FocusTarget | null,
): boolean {
  if (!a || !b || a.kind !== b.kind) return false;
  if (a.kind === "cell" && b.kind === "cell") {
    return a.rowIndex === b.rowIndex && a.colIndex === b.colIndex;
  }
  if (a.kind === "header" && b.kind === "header") {
    return a.colIndex === b.colIndex;
  }
  if (a.kind === "groupHeader" && b.kind === "groupHeader") {
    return a.groupId === b.groupId;
  }
  return false;
}

export function findFocusableInGrid(root: ParentNode, selector: string) {
  const matches = Array.from(root.querySelectorAll<HTMLElement>(selector));
  return (
    matches.find((el) => el.getAttribute("aria-hidden") !== "true") ??
    matches[0] ??
    null
  );
}
