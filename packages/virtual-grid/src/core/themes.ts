// =============================================================================
//  @virtual-grid/core — Design Token System
//
//  Tokens are CSS custom properties injected onto the grid root element.
//  Consumers can override any token by:
//    1. Passing theme="dark" (preset)
//    2. Passing theme={{ '--vg-accent': '#e11d48' }} (partial override)
//    3. Passing a full GridTokens map (complete custom theme)
// =============================================================================

import type { GridTokens, ThemePreset } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
//  BASE TOKENS  (shared defaults — override per-theme below)
// ─────────────────────────────────────────────────────────────────────────────

const BASE: GridTokens = {
  '--vg-font':         "'DM Sans', 'Segoe UI', system-ui, sans-serif",
  '--vg-font-mono':    "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
  '--vg-font-size':    '12.5px',
  '--vg-line-height':  '1.45',

  '--vg-row-height':   '36px',
  '--vg-header-height':'38px',
  '--vg-group-height': '28px',

  '--vg-radius':       '7px',
  '--vg-radius-sm':    '4px',
  '--vg-radius-xs':    '3px',

  '--vg-transition':   '0.12s ease',

  '--vg-z-pinned':     '3',
  '--vg-z-header':     '4',
  '--vg-z-panel':      '100',

  '--vg-scrollbar-width': '6px',
};

// ─────────────────────────────────────────────────────────────────────────────
//  THEME PRESETS
// ─────────────────────────────────────────────────────────────────────────────

export const GRID_THEMES: Record<ThemePreset, GridTokens> = {

  // ── Light ──────────────────────────────────────────────────────────────────
  light: {
    ...BASE,
    '--vg-bg':                '#ffffff',
    '--vg-bg-header':         '#f7f8fa',
    '--vg-bg-group':          '#f0f2f6',
    '--vg-bg-row-alt':        '#fafbfc',
    '--vg-bg-row-hover':      '#f0f5ff',
    '--vg-bg-row-selected':   '#e8efff',
    '--vg-bg-pinned':         '#ffffff',
    '--vg-bg-frozen':         '#eff6ff',
    '--vg-bg-toolbar':        '#ffffff',
    '--vg-bg-panel':          '#ffffff',
    '--vg-bg-btn':            '#f3f4f6',
    '--vg-bg-btn-hover':      '#e9eaec',
    '--vg-bg-btn-active':     '#dbeafe',
    '--vg-bg-tag':            '#f0f2f6',
    '--vg-bg-input':          '#ffffff',

    '--vg-text':              '#111827',
    '--vg-text-dim':          '#6b7280',
    '--vg-text-header':       '#374151',
    '--vg-text-group':        '#1e2939',
    '--vg-text-placeholder':  '#9ca3af',

    '--vg-border':            '#e5e7eb',
    '--vg-border-strong':     '#d1d5db',
    '--vg-border-focus':      '#2563eb',

    '--vg-accent':            '#2563eb',
    '--vg-accent-hover':      '#1d4ed8',
    '--vg-accent-bg':         '#dbeafe',
    '--vg-accent-text':       '#1d4ed8',
    '--vg-accent-fg':         '#ffffff',

    '--vg-shadow-pin':        '4px 0 12px rgba(0,0,0,0.06)',
    '--vg-shadow-panel':      '0 8px 24px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.06)',

    '--vg-scrollbar-track':   '#f1f3f5',
    '--vg-scrollbar-thumb':   '#d1d5db',

    '--vg-sort-icon':         '#9ca3af',
    '--vg-sort-active':       '#2563eb',
    '--vg-resize-hover':      '#2563eb',
    '--vg-drag-indicator':    '#2563eb',
  },

  // ── Dark ───────────────────────────────────────────────────────────────────
  dark: {
    ...BASE,
    '--vg-bg':                '#0d1117',
    '--vg-bg-header':         '#161c28',
    '--vg-bg-group':          '#1a2235',
    '--vg-bg-row-alt':        '#111620',
    '--vg-bg-row-hover':      '#1c2438',
    '--vg-bg-row-selected':   '#1a3558',
    '--vg-bg-pinned':         '#0d1117',
    '--vg-bg-frozen':         '#0f2040',
    '--vg-bg-toolbar':        '#161c28',
    '--vg-bg-panel':          '#161c28',
    '--vg-bg-btn':            '#1c2438',
    '--vg-bg-btn-hover':      '#242e48',
    '--vg-bg-btn-active':     '#1e3558',
    '--vg-bg-tag':            '#1c2438',
    '--vg-bg-input':          '#1c2438',

    '--vg-text':              '#e2e8f4',
    '--vg-text-dim':          '#8896b4',
    '--vg-text-header':       '#b4c0d8',
    '--vg-text-group':        '#d0daf0',
    '--vg-text-placeholder':  '#4a5670',

    '--vg-border':            '#1e2840',
    '--vg-border-strong':     '#283550',
    '--vg-border-focus':      '#3b82f6',

    '--vg-accent':            '#3b82f6',
    '--vg-accent-hover':      '#60a5fa',
    '--vg-accent-bg':         '#1e3558',
    '--vg-accent-text':       '#93c5fd',
    '--vg-accent-fg':         '#ffffff',

    '--vg-shadow-pin':        '4px 0 16px rgba(0,0,0,0.4)',
    '--vg-shadow-panel':      '0 8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)',

    '--vg-scrollbar-track':   '#161c28',
    '--vg-scrollbar-thumb':   '#283550',

    '--vg-sort-icon':         '#3a4a68',
    '--vg-sort-active':       '#3b82f6',
    '--vg-resize-hover':      '#3b82f6',
    '--vg-drag-indicator':    '#3b82f6',
  },

  // ── Ocean ──────────────────────────────────────────────────────────────────
  ocean: {
    ...BASE,
    '--vg-bg':                '#081425',
    '--vg-bg-header':         '#0c1e38',
    '--vg-bg-group':          '#0f2444',
    '--vg-bg-row-alt':        '#0a1830',
    '--vg-bg-row-hover':      '#112440',
    '--vg-bg-row-selected':   '#0e2c58',
    '--vg-bg-pinned':         '#081425',
    '--vg-bg-frozen':         '#051830',
    '--vg-bg-toolbar':        '#0c1e38',
    '--vg-bg-panel':          '#0c1e38',
    '--vg-bg-btn':            '#0f2444',
    '--vg-bg-btn-hover':      '#163058',
    '--vg-bg-btn-active':     '#0e2c58',
    '--vg-bg-tag':            '#0f2444',
    '--vg-bg-input':          '#0f2444',

    '--vg-text':              '#b8d4f8',
    '--vg-text-dim':          '#3c6080',
    '--vg-text-header':       '#6aabf0',
    '--vg-text-group':        '#9ccaf0',
    '--vg-text-placeholder':  '#2a4860',

    '--vg-border':            '#0f2444',
    '--vg-border-strong':     '#163058',
    '--vg-border-focus':      '#0e9eff',

    '--vg-accent':            '#0e9eff',
    '--vg-accent-hover':      '#40b6ff',
    '--vg-accent-bg':         '#0e2c58',
    '--vg-accent-text':       '#7dd0ff',
    '--vg-accent-fg':         '#ffffff',

    '--vg-shadow-pin':        '4px 0 16px rgba(0,0,0,0.5)',
    '--vg-shadow-panel':      '0 8px 40px rgba(0,10,30,0.7)',

    '--vg-scrollbar-track':   '#0c1e38',
    '--vg-scrollbar-thumb':   '#163058',

    '--vg-sort-icon':         '#1a4070',
    '--vg-sort-active':       '#0e9eff',
    '--vg-resize-hover':      '#0e9eff',
    '--vg-drag-indicator':    '#0e9eff',
  },

  // ── Forest ─────────────────────────────────────────────────────────────────
  forest: {
    ...BASE,
    '--vg-bg':                '#0a140c',
    '--vg-bg-header':         '#0f1e12',
    '--vg-bg-group':          '#132418',
    '--vg-bg-row-alt':        '#0c1810',
    '--vg-bg-row-hover':      '#162c1c',
    '--vg-bg-row-selected':   '#143a1a',
    '--vg-bg-pinned':         '#0a140c',
    '--vg-bg-frozen':         '#0a1f0a',
    '--vg-bg-toolbar':        '#0f1e12',
    '--vg-bg-panel':          '#0f1e12',
    '--vg-bg-btn':            '#132418',
    '--vg-bg-btn-hover':      '#1e3828',
    '--vg-bg-btn-active':     '#143a1a',
    '--vg-bg-tag':            '#132418',
    '--vg-bg-input':          '#132418',

    '--vg-text':              '#b8d8a8',
    '--vg-text-dim':          '#406840',
    '--vg-text-header':       '#72b860',
    '--vg-text-group':        '#98c888',
    '--vg-text-placeholder':  '#284828',

    '--vg-border':            '#132418',
    '--vg-border-strong':     '#1e3828',
    '--vg-border-focus':      '#4ade80',

    '--vg-accent':            '#4ade80',
    '--vg-accent-hover':      '#86efac',
    '--vg-accent-bg':         '#143a1a',
    '--vg-accent-text':       '#86efac',
    '--vg-accent-fg':         '#0a140c',

    '--vg-shadow-pin':        '4px 0 16px rgba(0,0,0,0.5)',
    '--vg-shadow-panel':      '0 8px 40px rgba(0,10,0,0.7)',

    '--vg-scrollbar-track':   '#0f1e12',
    '--vg-scrollbar-thumb':   '#1e3828',

    '--vg-sort-icon':         '#204020',
    '--vg-sort-active':       '#4ade80',
    '--vg-resize-hover':      '#4ade80',
    '--vg-drag-indicator':    '#4ade80',
  },

  // ── Sunset ─────────────────────────────────────────────────────────────────
  sunset: {
    ...BASE,
    '--vg-bg':                '#160a04',
    '--vg-bg-header':         '#221008',
    '--vg-bg-group':          '#2e160c',
    '--vg-bg-row-alt':        '#1c0e06',
    '--vg-bg-row-hover':      '#2e1a0c',
    '--vg-bg-row-selected':   '#3a1a08',
    '--vg-bg-pinned':         '#160a04',
    '--vg-bg-frozen':         '#1f0d04',
    '--vg-bg-toolbar':        '#221008',
    '--vg-bg-panel':          '#221008',
    '--vg-bg-btn':            '#2e160c',
    '--vg-bg-btn-hover':      '#3e2018',
    '--vg-bg-btn-active':     '#3a1a08',
    '--vg-bg-tag':            '#2e160c',
    '--vg-bg-input':          '#2e160c',

    '--vg-text':              '#f0c8a0',
    '--vg-text-dim':          '#805030',
    '--vg-text-header':       '#e09060',
    '--vg-text-group':        '#f0a870',
    '--vg-text-placeholder':  '#503020',

    '--vg-border':            '#2e160c',
    '--vg-border-strong':     '#3e2018',
    '--vg-border-focus':      '#fb923c',

    '--vg-accent':            '#fb923c',
    '--vg-accent-hover':      '#fdba74',
    '--vg-accent-bg':         '#3a1a08',
    '--vg-accent-text':       '#fdba74',
    '--vg-accent-fg':         '#160a04',

    '--vg-shadow-pin':        '4px 0 16px rgba(0,0,0,0.5)',
    '--vg-shadow-panel':      '0 8px 40px rgba(20,0,0,0.7)',

    '--vg-scrollbar-track':   '#221008',
    '--vg-scrollbar-thumb':   '#3e2018',

    '--vg-sort-icon':         '#50280c',
    '--vg-sort-active':       '#fb923c',
    '--vg-resize-hover':      '#fb923c',
    '--vg-drag-indicator':    '#fb923c',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
//  TOKEN RESOLVER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolves a theme prop (preset name or partial token map) into a full
 * GridTokens map ready to be injected as inline CSS variables.
 */
export function resolveTokens(
  theme: ThemePreset | GridTokens | undefined,
): GridTokens {
  if (!theme || theme === 'light') return GRID_THEMES.light;
  if (typeof theme === 'string') {
    return GRID_THEMES[theme] ?? GRID_THEMES.light;
  }
  // Partial override: merge on top of light preset
  return { ...GRID_THEMES.light, ...theme };
}

/**
 * Converts a GridTokens map to a React `style` prop object.
 */
export function tokensToStyle(tokens: GridTokens): Record<string, string> {
  return tokens as Record<string, string>;
}
