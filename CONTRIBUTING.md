# Contributing to Reactilities

Thanks for your interest in improving Reactilities! This guide covers the local
setup and the conventions the project follows.

## Getting started

```bash
git clone https://github.com/petar-basic/reactilities.git
cd reactilities
npm install
```

Requires Node 20+.

## Scripts

| Script | What it does |
| --- | --- |
| `npm test` | Run the test suite in watch mode (Vitest) |
| `npm run test:run` | Run the suite once (CI mode) |
| `npm run test:coverage` | Run with coverage |
| `npm run lint` | ESLint |
| `npm run typecheck` | Type-check sources **and** the `*.typecheck.tsx` type-regression fixtures |
| `npm run build` | Build the dist bundles (tsup) + add the `"use client"` banner |
| `npm run publint` | Validate the published package shape |
| `npm run attw` | Validate that the types resolve in every module mode |

Before opening a PR, make sure `npm run lint`, `npm run typecheck`, and
`npm run test:run` all pass. CI runs these (plus `build`, `publint`, `attw`) on a
React 18 + 19 matrix.

## Project layout

Each hook lives in its own folder with three files:

```
src/<category>/<hookName>/
  index.ts                 # the implementation
  <hookName>.test.ts(x)    # tests
  README.md                # documentation
```

Categories: `state`, `dom`, `utils`, `lifecycles`, `helpers`. The barrel
`lib/main.ts` re-exports every category, and `tsup.config.ts` auto-discovers each
folder to create its per-hook subpath export — so adding a hook needs no manual
export wiring.

## Adding or changing a hook

1. Create `src/<category>/<hookName>/index.ts` and export the hook by name.
2. Add `<hookName>.test.ts(x)`. Tests must assert **observable behavior**, not
   mocks you configured yourself — a good test fails if the implementation is
   broken (write it so it would fail before your fix).
3. Add a `README.md` whose documented signature, options, return type, and
   examples match the code exactly.
4. SSR: anything reading `window`/`document`/`navigator` must do so inside an
   effect or behind `useSyncExternalStore` with a server snapshot — never during
   render or at module scope. Hooks that take/return element refs should be
   generic over the element type.
5. For a public type guarantee that tests can't catch (tests aren't type-checked
   by the build), add a `<hookName>.typecheck.tsx` fixture; it's checked by
   `npm run typecheck` and excluded from the published bundle.

## Commit & PR conventions

- Keep PRs focused; one logical change per PR.
- Update `CHANGELOG.md` under `[Unreleased]` for any user-facing change.
- Describe what changed and why, and how you verified it.

## License

By contributing, you agree that your contributions are licensed under the MIT
License.
