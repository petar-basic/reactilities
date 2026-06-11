/**
 * Compile-time (type-level) tests for `useLogger`.
 *
 * This file intentionally lives OUTSIDE the `*.test.*` naming convention so that
 * it is included by `tsconfig.typecheck.json` (which adds `src/**\/*.tsx` to the
 * include set and, unlike `tsconfig.lib.json`, does NOT exclude `*.typecheck.*`)
 * and is therefore type-checked by `npm run typecheck` (`tsc -p
 * tsconfig.typecheck.json`). It is excluded from:
 *   - the build (`tsconfig.lib.json` excludes `**\/*.typecheck.*`),
 *   - vitest (its default include only matches `*.test.*` / `*.spec.*`),
 *   - eslint (`eslint.config.js` globally ignores `**\/*.typecheck.tsx`).
 * It has no runtime side effects and is never imported by the library entry, so
 * it is tree-shaken out of the JS bundle and never appears in the public API.
 *
 * MUTATION-PROOF: if the `props` parameter is reverted to
 * `props: Record<string, unknown>`, the `interface`-typed props below stop
 * compiling (TS2345 — an interface type has no index signature and is therefore
 * not assignable to `Record<string, unknown>`) and `npm run typecheck` fails.
 * This guarantees the fix cannot be silently regressed.
 */
import { useLogger } from './index';

// An `interface` (no index signature) — the exact shape that previously failed
// with TS2345 against the old `Record<string, unknown>` parameter type.
interface Props {
  userId: string;
}

// A type alias with extra structure, to confirm arbitrary object props work too.
interface ChartProps {
  data: number[];
  config: { theme: 'light' | 'dark' };
  onClose: () => void;
}

export function typeChecks() {
  // 1. Interface-typed props must be accepted (the BUG 2 regression guard).
  const props: Props = { userId: '42' };
  useLogger('Interface', props);

  // 2. Passing an interface-typed object inline must also compile.
  const chartProps: ChartProps = {
    data: [1, 2, 3],
    config: { theme: 'dark' },
    onClose: () => {},
  };
  useLogger('Chart', chartProps);

  // 3. Inline object literals (the README/JSDoc examples) keep working.
  useLogger('Inline', { userId: '1', theme: 'dark' });

  // 4. The `props` argument is optional.
  useLogger('NoProps');

  // 5. componentName must still be a string.
  // @ts-expect-error - componentName must be a string, not a number.
  useLogger(123, props);

  // 6. Non-object props must be rejected (the generic is `P extends object`).
  // @ts-expect-error - a string is not an object of tracked values.
  useLogger('Bad', 'not-an-object');
}
