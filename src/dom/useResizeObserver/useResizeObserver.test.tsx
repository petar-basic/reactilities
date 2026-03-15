import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import React from 'react';
import { useResizeObserver } from './index';

let observerCallback: ResizeObserverCallback;
let mockObserve: ReturnType<typeof vi.fn>;
let mockDisconnect: ReturnType<typeof vi.fn>;

function ResizeTarget({ onUpdate }: { onUpdate: (w: number, h: number) => void }) {
  const { ref, width, height } = useResizeObserver<HTMLDivElement>();
  onUpdate(width, height);
  return <div ref={ref} data-testid="target" />;
}

describe('useResizeObserver', () => {
  beforeEach(() => {
    mockObserve = vi.fn();
    mockDisconnect = vi.fn();

    vi.mocked(ResizeObserver).mockImplementation(class {
      constructor(callback: ResizeObserverCallback) {
        observerCallback = callback;
      }
      observe = mockObserve;
      disconnect = mockDisconnect;
      unobserve = vi.fn();
    } as unknown as typeof ResizeObserver);
  });

  it('should return ref and initial dimensions of zero', () => {
    const { result } = renderHook(() => useResizeObserver());
    expect(result.current.ref).toBeDefined();
    expect(result.current.width).toBe(0);
    expect(result.current.height).toBe(0);
    expect(result.current.entry).toBeUndefined();
  });

  it('should call observe when ref is attached to a DOM element', () => {
    render(<ResizeTarget onUpdate={() => {}} />);
    expect(mockObserve).toHaveBeenCalled();
  });

  it('should update dimensions when observer fires', () => {
    const onUpdate = vi.fn();
    render(<ResizeTarget onUpdate={onUpdate} />);

    act(() => {
      const entry = {
        contentRect: { width: 400, height: 200, top: 0, left: 0, right: 400, bottom: 200, x: 0, y: 0, toJSON: () => ({}) } as DOMRectReadOnly,
        borderBoxSize: [{ inlineSize: 400, blockSize: 200 }],
        contentBoxSize: [{ inlineSize: 400, blockSize: 200 }],
        devicePixelContentBoxSize: [],
      } as unknown as ResizeObserverEntry;

      observerCallback([entry], {} as ResizeObserver);
    });

    expect(onUpdate).toHaveBeenCalledWith(400, 200);
  });

  it('should disconnect observer on unmount', () => {
    const { unmount } = render(<ResizeTarget onUpdate={() => {}} />);
    unmount();
    expect(mockDisconnect).toHaveBeenCalled();
  });

  it('should return zero dimensions before any resize fires', () => {
    const onUpdate = vi.fn();
    render(<ResizeTarget onUpdate={onUpdate} />);
    expect(onUpdate).toHaveBeenLastCalledWith(0, 0);
  });
});
