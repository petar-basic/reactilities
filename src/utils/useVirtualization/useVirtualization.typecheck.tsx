/**
 * Compile-time (type-only) fixture for useVirtualization.
 *
 * This is NOT a runtime test — it exists so that `tsc -b` fails if BUG 1
 * regresses. The hook's own JSDoc example spreads `containerRef` onto a
 * `<div>`; under React 19 types that only typechecks when the hook is generic
 * over the element type (`useVirtualization<HTMLDivElement>(...)`) and exposes
 * a ref compatible with `Ref<HTMLDivElement>`. If `containerRef` reverts to a
 * non-element-specific `RefObject<HTMLElement | null>`, the `ref={containerRef}`
 * assignment below stops compiling (TS2322) and the build breaks.
 *
 * Intentionally excluded from the public barrel (see ./index re-export).
 */
import { useVirtualization } from './index';

// Must compile: generic element + callback ref spread onto a matching <div>.
export function VirtualizationTypeFixture() {
  const { containerRef, virtualItems, totalSize } = useVirtualization<HTMLDivElement>(
    1000,
    { itemHeight: 50, containerHeight: 400, overscan: 5 }
  );

  return (
    <div ref={containerRef} style={{ height: 400, overflow: 'auto' }}>
      <div style={{ height: totalSize, position: 'relative' }}>
        {virtualItems.map((item) => (
          <div
            key={item.index}
            style={{ position: 'absolute', top: item.start, height: item.size, width: '100%' }}
          >
            Item {item.index}
          </div>
        ))}
      </div>
    </div>
  );
}

// Also exercise a non-default element type and the default (HTMLDivElement).
export function VirtualizationDefaultElementFixture() {
  const { containerRef } = useVirtualization(10, { itemHeight: 10, containerHeight: 100 });
  return <div ref={containerRef} />;
}

export function VirtualizationCustomElementFixture() {
  const { containerRef } = useVirtualization<HTMLUListElement>(10, {
    itemHeight: 10,
    containerHeight: 100,
  });
  return <ul ref={containerRef} />;
}
