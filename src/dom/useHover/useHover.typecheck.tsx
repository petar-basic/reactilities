/**
 * Compile-time (type-only) fixture for useHover — NOT a runtime test.
 *
 * Checked by `tsconfig.typecheck.json` (`npm run typecheck`), excluded from the
 * lib build (so it never reaches dist) and from vitest/eslint.
 *
 * useHover returns a *callback ref* (`HoverRef<T>`) rather than a plain
 * `RefObject`. This probe pins down two guarantees:
 *   1. The returned ref is assignable to the JSX `ref` prop of the matching
 *      element, so `<div ref={ref}>` keeps compiling for consumers. If the
 *      callback signature is ever broken (e.g. wrong element type or a return
 *      type other than void/cleanup), this stops compiling.
 *   2. The ref still exposes a `.current` of type `T | null` for RefObject-style
 *      reads, matching the documented hybrid shape.
 */
import { useHover } from './index';

export function HoverTypeProbe() {
  const [ref, isHovered] = useHover<HTMLDivElement>();

  // RefObject-style read must be typed as the element or null.
  const el: HTMLDivElement | null = ref.current;
  void el;

  // Hover flag is a boolean.
  const flag: boolean = isHovered;
  void flag;

  // Callback ref must be valid as a JSX `ref` prop on the matching element.
  return <div ref={ref} data-hovered={isHovered} />;
}

// A button-typed usage to confirm the generic flows through to other elements.
export function HoverButtonTypeProbe() {
  const [ref] = useHover<HTMLButtonElement>();
  const el: HTMLButtonElement | null = ref.current;
  void el;
  return <button ref={ref}>hover</button>;
}
