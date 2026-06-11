/**
 * Compile-time (type-level) tests for `useWorker`.
 *
 * This file intentionally lives OUTSIDE the `*.test.*` naming convention so that
 * it is included by `tsconfig.lib.json` and therefore type-checked by `tsc -b`.
 * (Vitest test files are excluded from `tsc -b`, so they cannot guard the public
 * type signature.) It has no runtime side effects and is never imported by the
 * library entry (`lib/main.ts`), so it is tree-shaken out of the JS bundle and
 * never appears in the public `main.d.ts` API surface.
 *
 * MUTATION-PROOF: if the generic signature is reverted to
 * `useWorker<T>(fn: (...args: unknown[]) => T)`, the typed callbacks below stop
 * compiling and `tsc -b` fails. This guarantees the fix cannot be silently
 * regressed.
 */
import { useWorker } from './index';

// Helper: assert that two types are exactly equal at compile time.
type Equals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2)
    ? true
    : false;
type Expect<T extends true> = T;

export function typeChecks() {
  // The hook's own JSDoc/README example: a typed parameter must be accepted
  // WITHOUT erasing the parameter type to `unknown[]`.
  const sum = useWorker((numbers: number[]) =>
    numbers.reduce((a, b) => a + b, 0),
  );

  // `run` must accept the original, correctly-typed arguments.
  sum.run([1, 2, 3]);

  // `result` must be inferred as `number | null` (not `unknown | null`).
  type ResultIsNumberOrNull = Expect<Equals<typeof sum.result, number | null>>;
  // `run` must accept exactly `(numbers: number[])`.
  type RunAcceptsNumberArray = Expect<
    Equals<typeof sum.run, (numbers: number[]) => void>
  >;

  // Multiple typed arguments are preserved as a tuple.
  const add = useWorker((a: number, b: number) => a + b);
  add.run(10, 20);
  type AddRunSignature = Expect<
    Equals<typeof add.run, (a: number, b: number) => void>
  >;

  // Wrong argument types must be rejected by the compiler.
  // @ts-expect-error - run expects number[], not a string.
  sum.run('wrong');
  // @ts-expect-error - run expects (number, number), not (string, string).
  add.run('a', 'b');

  // Reference the asserted aliases so `noUnusedLocals` stays happy and a broken
  // assertion (Expect<false>) surfaces as a compile error.
  return {} as Record<
    | 'ResultIsNumberOrNull'
    | 'RunAcceptsNumberArray'
    | 'AddRunSignature',
    true
  > satisfies {
    ResultIsNumberOrNull: ResultIsNumberOrNull;
    RunAcceptsNumberArray: RunAcceptsNumberArray;
    AddRunSignature: AddRunSignature;
  };
}
