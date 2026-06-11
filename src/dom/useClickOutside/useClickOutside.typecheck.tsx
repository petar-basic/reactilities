/**
 * Compile-time (type-only) fixture for useClickOutside — NOT a runtime test.
 *
 * Checked by `tsconfig.typecheck.json` (`npm run typecheck`), excluded from the
 * lib build (so it never reaches dist) and from vitest/eslint. If the `ref`
 * parameter is ever tightened back to `RefObject<T>` (dropping `| null`), the
 * canonical `useRef<HTMLDivElement>(null)` usage below stops compiling under
 * @types/react 19 (TS2345) and `npm run typecheck` fails.
 */
import { useRef } from 'react';
import { useClickOutside } from './index';

export function ClickOutsideTypeProbe() {
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => {});
  return <div ref={ref} />;
}
