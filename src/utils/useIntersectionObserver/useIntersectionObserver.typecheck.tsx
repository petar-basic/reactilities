/**
 * Compile-time (type-only) fixture for useIntersectionObserver — NOT a runtime test.
 *
 * Checked by `tsconfig.typecheck.json` (`npm run typecheck`), excluded from the
 * lib build, vitest and eslint. If the hook drops its generic and returns
 * `RefObject<HTMLElement | null>`, attaching the returned ref to a concrete
 * `<div ref={ref} />` stops compiling under @types/react 19 (TS2322) and
 * `npm run typecheck` fails.
 */
import { useIntersectionObserver } from './index';

export function IntersectionObserverTypeProbe() {
  const { ref } = useIntersectionObserver<HTMLDivElement>();
  return <div ref={ref} />;
}
