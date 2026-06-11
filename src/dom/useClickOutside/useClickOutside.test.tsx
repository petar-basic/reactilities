import { render, renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useClickOutside } from './index';
import { useRef } from 'react';

/**
 * Dispatch a real PointerEvent at `target`. jsdom's PointerEvent may be missing,
 * so fall back to a MouseEvent typed as 'pointerdown' (the listener only reads
 * `event.target`, so either constructor exercises the same code path).
 */
function dispatchPointerDown(target: EventTarget): Event {
  const Ctor =
    typeof PointerEvent !== 'undefined' ? PointerEvent : MouseEvent;
  const event = new Ctor('pointerdown', { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'target', { value: target, enumerable: true });
  document.dispatchEvent(event);
  return event;
}

describe('useClickOutside', () => {
  let container: HTMLDivElement;
  let element: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    element = document.createElement('div');
    container.appendChild(element);
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should call handler when pressing (pointerdown) outside element', () => {
    const handler = vi.fn();

    renderHook(() => {
      const ref = useRef<HTMLDivElement>(element);
      useClickOutside(ref, handler);
      return ref;
    });

    const outsideElement = document.createElement('div');
    document.body.appendChild(outsideElement);

    const event = dispatchPointerDown(outsideElement);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(event);

    document.body.removeChild(outsideElement);
  });

  it('should not call handler when pressing inside element', () => {
    const handler = vi.fn();

    renderHook(() => {
      const ref = useRef<HTMLDivElement>(element);
      useClickOutside(ref, handler);
      return ref;
    });

    dispatchPointerDown(element);

    expect(handler).not.toHaveBeenCalled();
  });

  it('should not call handler when pressing on a child element', () => {
    const handler = vi.fn();
    const childElement = document.createElement('span');
    element.appendChild(childElement);

    renderHook(() => {
      const ref = useRef<HTMLDivElement>(element);
      useClickOutside(ref, handler);
      return ref;
    });

    dispatchPointerDown(childElement);

    expect(handler).not.toHaveBeenCalled();
  });

  it('should not call handler when ref is null', () => {
    const handler = vi.fn();

    renderHook(() => {
      const ref = useRef<HTMLDivElement>(null);
      useClickOutside(ref, handler);
      return ref;
    });

    dispatchPointerDown(document.body);

    expect(handler).not.toHaveBeenCalled();
  });

  // ---- MUTATION-PROOF: BUG 2 (wrong event) ----

  it('does NOT fire when a press starts inside and the release/click lands outside (text-selection drag)', () => {
    // Reproduces the original bug: with a `click` listener, mousedown inside +
    // mouseup outside produces a `click` whose target is a common ancestor
    // (body), closing the element mid-selection. A `pointerdown` listener only
    // sees the press, which is inside, so the handler must NOT fire.
    const handler = vi.fn();

    renderHook(() => {
      const ref = useRef<HTMLDivElement>(element);
      useClickOutside(ref, handler);
      return ref;
    });

    // The press (pointerdown) starts inside the element.
    dispatchPointerDown(element);
    expect(handler).not.toHaveBeenCalled();

    // A subsequent `click` whose target is a common ancestor (the release of a
    // drag that began inside) must be ignored — the hook does not listen to it.
    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(clickEvent, 'target', {
      value: document.body,
      enumerable: true,
    });
    document.dispatchEvent(clickEvent);

    expect(handler).not.toHaveBeenCalled();
  });

  it('fires exactly once for a single outside tap (no touchstart + click double-fire)', () => {
    // Original bug: separate `click` + `touchstart` listeners both fired for one
    // tap on touch devices. A single `pointerdown` listener fires exactly once.
    const handler = vi.fn();

    renderHook(() => {
      const ref = useRef<HTMLDivElement>(element);
      useClickOutside(ref, handler);
      return ref;
    });

    const outsideElement = document.createElement('div');
    document.body.appendChild(outsideElement);

    // A tap surfaces as one pointerdown...
    dispatchPointerDown(outsideElement);
    // ...and the browser would synthesize a follow-up `click`. If the hook also
    // listened to `click`, this would double-fire. It must not.
    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(clickEvent, 'target', {
      value: outsideElement,
      enumerable: true,
    });
    document.dispatchEvent(clickEvent);

    expect(handler).toHaveBeenCalledTimes(1);

    document.body.removeChild(outsideElement);
  });

  // ---- MUTATION-PROOF: BUG 3 (listener churn across renders) ----

  it('attaches the document listener once and does not tear it down on re-render', () => {
    const addSpy = vi.spyOn(document, 'addEventListener');
    const removeSpy = vi.spyOn(document, 'removeEventListener');

    const { rerender } = renderHook(
      ({ handler }: { handler: () => void }) => {
        const ref = useRef<HTMLDivElement>(element);
        useClickOutside(ref, handler);
        return ref;
      },
      { initialProps: { handler: () => {} } }
    );

    const pointerAddsAfterMount = addSpy.mock.calls.filter(
      ([type]) => type === 'pointerdown'
    ).length;
    expect(pointerAddsAfterMount).toBe(1);

    // Re-render with a brand-new inline handler identity (the common consumer
    // pattern). The listener must NOT be re-added or removed.
    rerender({ handler: () => {} });
    rerender({ handler: () => {} });

    const pointerAddsTotal = addSpy.mock.calls.filter(
      ([type]) => type === 'pointerdown'
    ).length;
    const pointerRemovesTotal = removeSpy.mock.calls.filter(
      ([type]) => type === 'pointerdown'
    ).length;

    expect(pointerAddsTotal).toBe(1);
    expect(pointerRemovesTotal).toBe(0);

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });

  it('always invokes the latest handler even though the listener is attached once', () => {
    const first = vi.fn();
    const second = vi.fn();

    const { rerender } = renderHook(
      ({ handler }: { handler: () => void }) => {
        const ref = useRef<HTMLDivElement>(element);
        useClickOutside(ref, handler);
        return ref;
      },
      { initialProps: { handler: first } }
    );

    rerender({ handler: second });

    const outsideElement = document.createElement('div');
    document.body.appendChild(outsideElement);
    dispatchPointerDown(outsideElement);

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);

    document.body.removeChild(outsideElement);
  });

  it('removes the pointerdown listener on unmount', () => {
    const removeSpy = vi.spyOn(document, 'removeEventListener');

    const { unmount } = renderHook(() => {
      const ref = useRef<HTMLDivElement>(element);
      useClickOutside(ref, () => {});
      return ref;
    });

    unmount();

    expect(removeSpy).toHaveBeenCalledWith('pointerdown', expect.any(Function));

    removeSpy.mockRestore();
  });

  // ---- MUTATION-PROOF: BUG 1 (ref type rejects useRef(null)) ----
  // This is a runtime test of the real consumer pattern from the JSDoc/README:
  // `useRef<HTMLDivElement>(null)` (typed `RefObject<HTMLDivElement | null>`)
  // passed straight to the hook AND attached to a concrete <div ref={ref} />.
  // Note: vitest transpiles via SWC (no type-check), so the authoritative
  // compile-time guard for BUG 1 lives in `index.ts` and is enforced by `tsc`.
  it('works with useRef<HTMLDivElement>(null) attached to a real <div> (JSDoc usage)', () => {
    const handler = vi.fn();

    function Component() {
      const ref = useRef<HTMLDivElement>(null);
      useClickOutside(ref, handler);
      return (
        <div ref={ref} data-testid="inside">
          inside
        </div>
      );
    }

    const { getByTestId } = render(<Component />);
    const inside = getByTestId('inside');

    // Press inside the mounted div: handler must not fire.
    dispatchPointerDown(inside);
    expect(handler).not.toHaveBeenCalled();

    // Press outside: handler must fire.
    const outside = document.createElement('div');
    document.body.appendChild(outside);
    dispatchPointerDown(outside);
    expect(handler).toHaveBeenCalledTimes(1);

    document.body.removeChild(outside);
  });
});
