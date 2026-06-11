/**
 * Type-only fixture for `useResizeObserver`.
 *
 * Checked by `npm run typecheck` (tsconfig.typecheck.json), and excluded from
 * build (tsconfig.lib.json), vitest, and eslint. It guards the public ref shape:
 * the returned `ref` must be usable as a JSX `ref` prop AND still expose
 * `.current` (the README documents `ref.current!`).
 */
import { useEffect } from 'react';
import { useResizeObserver } from './index';
import type { UseResizeObserverReturn, UseResizeObserverRef } from './index';

// 1. The callback ref must be assignable to a `<div>`'s `ref` prop.
export function RefPropOnDiv() {
  const { ref, width, height } = useResizeObserver<HTMLDivElement>();
  return (
    <div ref={ref}>
      {width}x{height}
    </div>
  );
}

// 2. Works for other element types via the generic param.
export function RefPropOnParagraph() {
  const { ref } = useResizeObserver<HTMLParagraphElement>();
  return <p ref={ref} />;
}

// 3. `ref.current` is accessible and typed as the element (README D3 example).
export function CurrentAccess() {
  const { ref, width, height } = useResizeObserver<HTMLDivElement>();

  useEffect(() => {
    if (ref.current) {
      // `ref.current` is `HTMLDivElement | null`; property access must typecheck.
      const tag: string = ref.current.tagName;
      void tag;
    }
  }, [ref, width, height]);

  return <div ref={ref} />;
}

// 4. The ref is callable as a function (callback ref contract).
export function CallableRef() {
  const { ref } = useResizeObserver<HTMLDivElement>();
  const callable: (node: HTMLDivElement | null) => void = ref;
  void callable;
  return null;
}

// 5. Public return / ref types are exported and shaped as expected.
export function ShapeCheck() {
  const _return: UseResizeObserverReturn<HTMLDivElement> = useResizeObserver<HTMLDivElement>();
  const _ref: UseResizeObserverRef<HTMLDivElement> = _return.ref;
  const _width: number = _return.width;
  const _height: number = _return.height;
  const _current: HTMLDivElement | null = _ref.current;
  void _ref;
  void _width;
  void _height;
  void _current;
  return null;
}
