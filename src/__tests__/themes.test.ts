// =============================================================================
//  @lattice-grid-lib/core — Theme system unit tests
// =============================================================================

import { describe, it, expect } from 'vitest';
import { resolveTokens, GRID_THEMES } from '../core/themes';

describe('resolveTokens', () => {
  it('returns light theme for undefined', () => {
    expect(resolveTokens(undefined)).toEqual(GRID_THEMES.light);
  });

  it('returns light theme for "light"', () => {
    expect(resolveTokens('light')).toEqual(GRID_THEMES.light);
  });

  it('returns dark theme for "dark"', () => {
    expect(resolveTokens('dark')).toEqual(GRID_THEMES.dark);
  });

  it('returns ocean theme for "ocean"', () => {
    expect(resolveTokens('ocean')).toEqual(GRID_THEMES.ocean);
  });

  it('falls back to light for unknown preset string', () => {
    // @ts-expect-error testing bad input
    expect(resolveTokens('not-a-theme')).toEqual(GRID_THEMES.light);
  });

  it('merges partial token map on top of light preset', () => {
    const custom = { '--vg-accent': '#e11d48' } as const;
    const result = resolveTokens(custom);
    expect(result['--vg-accent']).toBe('#e11d48');
    // all other light tokens should be present
    expect(result['--vg-bg']).toBe(GRID_THEMES.light['--vg-bg']);
  });

  it('full custom token map is used as-is merged with light', () => {
    const custom = {
      '--vg-bg':     '#ff0000',
      '--vg-accent': '#00ff00',
    };
    const result = resolveTokens(custom);
    expect(result['--vg-bg']).toBe('#ff0000');
    expect(result['--vg-accent']).toBe('#00ff00');
  });

  it('all preset themes contain required base tokens', () => {
    const requiredTokens = [
      '--vg-font', '--vg-bg', '--vg-text', '--vg-accent',
      '--vg-border', '--vg-radius',
    ] as const;

    for (const [name, theme] of Object.entries(GRID_THEMES)) {
      for (const token of requiredTokens) {
        expect(theme[token], `${name} missing ${token}`).toBeDefined();
      }
    }
  });
});
