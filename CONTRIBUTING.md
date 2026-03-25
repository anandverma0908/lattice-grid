# Contributing to LatticeGrid

Thank you for taking the time to contribute. This document explains the
development workflow, code standards, and how to submit changes.

---

## Table of contents

1. [Repository layout](#repository-layout)
2. [Getting started](#getting-started)
3. [Development workflow](#development-workflow)
4. [Code standards](#code-standards)
5. [Writing tests](#writing-tests)
6. [Commit conventions](#commit-conventions)
7. [Submitting a pull request](#submitting-a-pull-request)
8. [Release process](#release-process)

---

## Repository layout

```
lattice-grid/                   ← monorepo root
├── packages/
│   └── lattice-grid/           ← @lattice-grid/core  (npm package)
│       ├── src/
│       │   ├── core/           ← pure state logic, context, themes
│       │   ├── hooks/          ← custom React hooks
│       │   ├── components/     ← React components
│       │   └── types/          ← public TypeScript types
│       └── src/__tests__/      ← unit tests
└── apps/
    └── demo/                   ← documentation + live demo site
```

The library (`packages/lattice-grid`) has **zero runtime dependencies**.
The demo app (`apps/demo`) only depends on the library itself plus React.

---

## Getting started

**Prerequisites:** Node ≥ 20, npm ≥ 10.

```bash
# 1. Clone
git clone https://github.com/yourorg/lattice-grid.git
cd lattice-grid

# 2. Install workspace deps
npm install

# 3. Start the demo (hot-reloads library source)
npm run dev

# 4. Run tests in watch mode
npm run test:watch --workspace=packages/lattice-grid
```

The demo app is aliased to read from `packages/lattice-grid/src/index.ts`
directly (see `apps/demo/vite.config.ts`), so any change to the library is
immediately reflected in the browser.

---

## Development workflow

### Adding a new hook

1. Create `packages/lattice-grid/src/hooks/useYourHook.ts`
2. Export types + hook from `src/index.ts`
3. Add unit tests in `src/__tests__/useYourHook.test.ts`
4. Document with JSDoc — consumers rely on hover-docs in their editor

### Adding a new component

1. Create `packages/lattice-grid/src/components/YourComponent.tsx`
2. Export from `src/index.ts` if it is a public component
3. Components must consume CSS variables exclusively — never hardcode colours
4. Keep components `memo`-wrapped to minimise re-renders

### Changing the theme system

- Tokens live in `src/core/themes.ts`
- Every token must exist in all five presets
- Run the theme test (`npm test`) after adding tokens — it verifies required tokens
  are present in every preset

---

## Code standards

### TypeScript

- `strict: true` — no exceptions
- `exactOptionalPropertyTypes: true` — distinguish `undefined` from missing
- `noUncheckedIndexedAccess: true` — all array accesses are potentially `undefined`
- Use `type` imports for types (`import type { Foo } from './foo'`)
- No `any` in library code; use `unknown` with type narrowing
- Export all public types from `src/index.ts`

### React

- All components must be wrapped in `React.memo`
- Use `useCallback` for all event handlers that are passed as props
- Use `useMemo` for all derived data structures
- No `useEffect` for derived state — use `useMemo` instead
- `useReducer` for multi-field state that transitions together
- Context providers live in `src/core/` — no context in component files

### Styling

- **All visual values must be CSS variables.** Never hardcode a colour, font,
  radius, or shadow inside a component.
- Inline `style` props only — no CSS-in-JS, no classnames, no stylesheets.
  This keeps the library zero-dependency and side-effect-free.
- New tokens must be added to `BASE` + all five presets in `themes.ts`

### Performance rules

- Never use `Array.find` or `Array.filter` inside a render path without `useMemo`
- `buildColumnOffsets` runs in a single O(n) pass — keep it that way
- Virtualiser hooks must remain pure `useMemo` with no DOM access

---

## Writing tests

Tests live in `packages/lattice-grid/src/__tests__/` and run via Vitest.

```bash
# Run all tests once
npm run test --workspace=packages/lattice-grid

# Watch mode
npm run test:watch --workspace=packages/lattice-grid

# With coverage
npm run test -- --coverage --workspace=packages/lattice-grid
```

### Test conventions

- One `describe` block per exported function / hook / component
- Group tests by behaviour, not implementation
- Use `renderHook` from `@testing-library/react` for hooks
- Wrap state mutations in `act()`
- Avoid testing React internals — test the public API only
- No snapshot tests — they break on trivial style changes
- Aim for ≥ 90% branch coverage on `core/` and `hooks/`

### What to test

| Layer | What to test |
|---|---|
| `core/useGridEngine` | Every action (resize, pin, hide, sort, move, reset) |
| `hooks/useVirtualizer` | Start/end index calculation, total size, edge cases (empty, single row) |
| `hooks/useRowSelection` | Toggle, range, select-all, clear, single mode |
| `hooks/useColumnFilter` | AND-combination, custom matcher, clear |
| `hooks/useGridPagination` | Page navigation, clamping, pageData slice, server-side mode |
| `hooks/useGridExport` | CSV escaping, JSON shape, null handling |
| `core/themes` | All presets contain required tokens, partial overrides merge correctly |

---

## Commit conventions

We use [Conventional Commits](https://www.conventionalcommits.org/).

```
<type>(<scope>): <short description>

[optional body]

[optional footer]
```

| Type | When to use |
|---|---|
| `feat` | New feature or hook |
| `fix` | Bug fix |
| `perf` | Performance improvement |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `test` | Adding or correcting tests |
| `docs` | Documentation only |
| `chore` | Build, CI, dependency updates |
| `breaking` | Breaking API change (also add `!` after type) |

**Examples:**

```
feat(hooks): add useGridExport with CSV and JSON support
fix(virtualizer): correct binary-search for scrollLeft=0 edge case
perf(engine): replace linear scan with Map lookup in orderedColumns
docs(readme): add server-side pagination example
feat!: rename onColumnPin to onColumnPinChange
```

---

## Submitting a pull request

1. **Fork** the repository and create a feature branch from `main`:
   ```bash
   git checkout -b feat/my-feature
   ```

2. **Make your changes** following the code standards above.

3. **Write or update tests.** CI will block merge if coverage drops below 85%.

4. **Run the full check suite locally:**
   ```bash
   npm run typecheck
   npm run lint
   npm run test --workspace=packages/lattice-grid
   npm run build
   ```

5. **Open a PR** against `main`. Fill in the PR template:
   - What does this change?
   - Why is it needed?
   - What edge cases were considered?
   - Link to any related issues

6. A maintainer will review within 48 hours. Address feedback and push to the
   same branch — the PR will update automatically.

---

## Release process

Releases are managed by maintainers via git tags.

```bash
# 1. Update version in packages/lattice-grid/package.json
# 2. Update CHANGELOG.md
# 3. Commit
git commit -m "chore: release v1.1.0"

# 4. Tag
git tag v1.1.0
git push origin main --tags
```

The CI pipeline automatically publishes to npm when a `v*` tag is pushed,
using the `NPM_TOKEN` secret configured in the repository environment.

---

## Licence

By contributing, you agree your code will be licensed under the [MIT licence](./packages/lattice-grid/README.md#licence).
