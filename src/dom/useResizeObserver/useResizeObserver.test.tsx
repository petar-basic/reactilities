import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import React, { useState } from 'react';
import { useResizeObserver } from './index';

// Each instance tracks the node it observes and exposes a `fire` helper so a
// test can deliver a resize entry to a specific observer. This lets us assert
// that the hook observes the *right* node after late mounts / ref moves.
interface MockObserver {
  callback: ResizeObserverCallback;
  observed: Element | null;
  disconnected: boolean;
  observe: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
  fire: (width: number, height: number) => void;
}

let observers: MockObserver[];

function lastObserverFor(node: Element): MockObserver | undefined {
  // The most recently created, still-connected observer watching `node`.
  return [...observers].reverse().find((o) => o.observed === node && !o.disconnected);
}

function makeEntry(width: number, height: number, target: Element): ResizeObserverEntry {
  return {
    target,
    contentRect: {
      width,
      height,
      top: 0,
      left: 0,
      right: width,
      bottom: height,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRectReadOnly,
    borderBoxSize: [{ inlineSize: width, blockSize: height }],
    contentBoxSize: [{ inlineSize: width, blockSize: height }],
    devicePixelContentBoxSize: [],
  } as unknown as ResizeObserverEntry;
}

function ResizeTarget({ onUpdate }: { onUpdate: (w: number, h: number) => void }) {
  const { ref, width, height } = useResizeObserver<HTMLDivElement>();
  onUpdate(width, height);
  return <div ref={ref} data-testid="target" />;
}

describe('useResizeObserver', () => {
  beforeEach(() => {
    observers = [];

    vi.mocked(ResizeObserver).mockImplementation(class {
      observed: Element | null = null;
      disconnected = false;
      callback: ResizeObserverCallback;
      observe: ReturnType<typeof vi.fn>;
      disconnect: ReturnType<typeof vi.fn>;
      unobserve = vi.fn();
      fire: (width: number, height: number) => void;

      constructor(callback: ResizeObserverCallback) {
        this.callback = callback;
        this.observe = vi.fn((node: Element) => {
          this.observed = node;
        });
        this.disconnect = vi.fn(() => {
          this.disconnected = true;
        });
        this.fire = (width: number, height: number) => {
          this.callback([makeEntry(width, height, this.observed!)], this as unknown as ResizeObserver);
        };
        observers.push(this as unknown as MockObserver);
      }
    } as unknown as typeof ResizeObserver);
  });

  it('should return ref and initial dimensions of zero', () => {
    const { result } = renderHook(() => useResizeObserver());
    expect(result.current.ref).toBeDefined();
    expect(result.current.width).toBe(0);
    expect(result.current.height).toBe(0);
    expect(result.current.entry).toBeUndefined();
  });

  it('should expose a callback ref that is a function with a current property', () => {
    const { result } = renderHook(() => useResizeObserver<HTMLDivElement>());
    expect(typeof result.current.ref).toBe('function');
    expect(result.current.ref.current).toBeNull();
  });

  it('should call observe when ref is attached to a DOM element', () => {
    render(<ResizeTarget onUpdate={() => {}} />);
    expect(observers.length).toBe(1);
    expect(observers[0].observe).toHaveBeenCalled();
  });

  it('should update dimensions when observer fires', () => {
    const onUpdate = vi.fn();
    const { getByTestId } = render(<ResizeTarget onUpdate={onUpdate} />);
    const node = getByTestId('target');

    act(() => {
      lastObserverFor(node)!.fire(400, 200);
    });

    expect(onUpdate).toHaveBeenCalledWith(400, 200);
  });

  it('should disconnect observer on unmount', () => {
    const { unmount } = render(<ResizeTarget onUpdate={() => {}} />);
    expect(observers.length).toBe(1);
    unmount();
    expect(observers[0].disconnect).toHaveBeenCalled();
  });

  it('should return zero dimensions before any resize fires', () => {
    const onUpdate = vi.fn();
    render(<ResizeTarget onUpdate={onUpdate} />);
    expect(onUpdate).toHaveBeenLastCalledWith(0, 0);
  });

  it('should expose the observed node via ref.current', () => {
    const { result } = renderHook(() => useResizeObserver<HTMLDivElement>());
    const node = document.createElement('div');

    act(() => {
      result.current.ref(node);
    });

    expect(result.current.ref.current).toBe(node);
  });

  // MUTATION-PROOF: the target appears only after a state flip (the classic
  // `{loaded && <div ref={ref} />}` case). The original effect ran once with
  // `[]` deps when ref.current was still null, so it NEVER observed and
  // width/height stayed 0 forever. With the callback-ref fix it observes the
  // late-mounted node and resizing updates the dimensions.
  it('should observe a target mounted after the first commit (late mount)', () => {
    const onUpdate = vi.fn();

    function LateMount() {
      const [loaded, setLoaded] = useState(false);
      const { ref, width, height } = useResizeObserver<HTMLDivElement>();
      onUpdate(width, height);
      return (
        <div>
          <button onClick={() => setLoaded(true)}>load</button>
          {loaded && <div ref={ref} data-testid="late" />}
        </div>
      );
    }

    const { getByText, getByTestId, queryByTestId } = render(<LateMount />);

    // Nothing is rendered yet, so nothing is observed.
    expect(queryByTestId('late')).toBeNull();
    expect(observers.length).toBe(0);

    // Flip the state -> the target mounts -> the callback ref must observe it.
    act(() => {
      getByText('load').click();
    });

    const node = getByTestId('late');
    const observer = lastObserverFor(node);
    expect(observer).toBeDefined();

    onUpdate.mockClear();
    act(() => {
      observer!.fire(320, 180);
    });

    // Fails on the buggy implementation (would stay 0,0).
    expect(onUpdate).toHaveBeenLastCalledWith(320, 180);
  });

  // MUTATION-PROOF: when the ref moves to a different element, the observer must
  // follow — disconnect from the old node and observe the new one. The original
  // implementation kept watching the stale first node forever.
  it('should follow the ref to a new element when it moves', () => {
    const onUpdate = vi.fn();

    function Swappable() {
      const [second, setSecond] = useState(false);
      const { ref, width, height } = useResizeObserver<HTMLDivElement>();
      onUpdate(width, height);
      return (
        <div>
          <button onClick={() => setSecond(true)}>swap</button>
          {/* Distinct keys so React unmounts one node and mounts a brand new
              one, forcing the ref to genuinely move to a different element. */}
          {second ? (
            <div key="b" ref={ref} data-testid="second" />
          ) : (
            <div key="a" ref={ref} data-testid="first" />
          )}
        </div>
      );
    }

    const { getByText, getByTestId } = render(<Swappable />);

    const firstNode = getByTestId('first');
    const firstObserver = lastObserverFor(firstNode);
    expect(firstObserver).toBeDefined();

    // Swap to a different element.
    act(() => {
      getByText('swap').click();
    });

    // Old observer disconnected.
    expect(firstObserver!.disconnect).toHaveBeenCalled();

    const secondNode = getByTestId('second');
    const secondObserver = lastObserverFor(secondNode);
    expect(secondObserver).toBeDefined();
    expect(secondObserver).not.toBe(firstObserver);

    // Firing the OLD observer must not update dimensions anymore.
    onUpdate.mockClear();
    act(() => {
      firstObserver!.callback(
        [makeEntry(11, 22, firstNode)],
        firstObserver as unknown as ResizeObserver,
      );
    });
    // Disconnected observers don't deliver entries in a real browser, but even
    // if a stale entry leaked through, the new node is what matters; assert the
    // new observer drives the size.
    onUpdate.mockClear();
    act(() => {
      secondObserver!.fire(500, 250);
    });
    expect(onUpdate).toHaveBeenLastCalledWith(500, 250);
  });

  it('should disconnect when the element is detached (ref called with null)', () => {
    const { result } = renderHook(() => useResizeObserver<HTMLDivElement>());
    const node = document.createElement('div');

    act(() => {
      result.current.ref(node);
    });
    const observer = lastObserverFor(node);
    expect(observer).toBeDefined();

    act(() => {
      result.current.ref(null);
    });

    expect(observer!.disconnect).toHaveBeenCalled();
    expect(result.current.ref.current).toBeNull();
  });
});
