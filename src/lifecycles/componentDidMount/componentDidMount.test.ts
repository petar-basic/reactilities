import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { StrictMode, createElement, type ReactNode } from 'react';
import { componentDidMount } from './index';

const StrictModeWrapper = ({ children }: { children: ReactNode }) =>
  createElement(StrictMode, null, children);

describe('componentDidMount', () => {
  it('should call function once after mount', () => {
    const mockFn = vi.fn();
    
    renderHook(() => componentDidMount(mockFn));
    
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should not call function again on re-render', () => {
    const mockFn = vi.fn();
    
    const { rerender } = renderHook(() => componentDidMount(mockFn));
    
    expect(mockFn).toHaveBeenCalledTimes(1);
    
    rerender();
    rerender();
    
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should handle function that returns a value', () => {
    const mockFn = vi.fn(() => 'test value');
    
    renderHook(() => componentDidMount(mockFn));
    
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveReturnedWith('test value');
  });

  it('should handle async function', async () => {
    const mockFn = vi.fn(async () => {
      return Promise.resolve('async result');
    });
    
    renderHook(() => componentDidMount(mockFn));
    
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should handle function with side effects', () => {
    let counter = 0;
    const mockFn = vi.fn(() => {
      counter++;
    });

    renderHook(() => componentDidMount(mockFn));

    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(counter).toBe(1);
  });

  // BUG A (mutation-proof) — a function returning a cleanup must have that
  // cleanup invoked on unmount. The pre-fix code did `useEffect(() => { func() }, [])`
  // and threw the return value away, so the cleanup never ran (silent leak).
  it('runs the returned cleanup function on unmount', () => {
    const cleanup = vi.fn();
    const effect = vi.fn(() => cleanup);

    const { unmount } = renderHook(() => componentDidMount(effect));

    expect(effect).toHaveBeenCalledTimes(1);
    expect(cleanup).not.toHaveBeenCalled();

    unmount();

    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  // Guards against a "naive" fix that returns the value unconditionally:
  // a non-function return must not be invoked as a cleanup (React would throw).
  it('does not treat a non-function return value as a cleanup on unmount', () => {
    const effect = vi.fn(() => 'not a cleanup');

    const { unmount } = renderHook(() => componentDidMount(effect));

    expect(() => unmount()).not.toThrow();
  });

  // Mirrors the real-world setInterval port from the bug report end-to-end.
  it('clears an interval started in the effect when the component unmounts', () => {
    vi.useFakeTimers();
    try {
      const tick = vi.fn();

      const { unmount } = renderHook(() =>
        componentDidMount(() => {
          const id = setInterval(tick, 1000);
          return () => clearInterval(id);
        })
      );

      vi.advanceTimersByTime(2000);
      expect(tick).toHaveBeenCalledTimes(2);

      unmount();
      vi.advanceTimersByTime(5000);

      // No further ticks after unmount: the interval was cleared.
      expect(tick).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('runs the cleanup on unmount under StrictMode', () => {
    const cleanup = vi.fn();
    const effect = vi.fn(() => cleanup);

    const { unmount } = renderHook(() => componentDidMount(effect), {
      wrapper: StrictModeWrapper,
    });

    unmount();

    // StrictMode double-invokes mount effects (setup -> cleanup -> setup) in dev,
    // so cleanup may run during the simulated remount too; the contract we care
    // about is that it has run on the real unmount at least once.
    expect(cleanup).toHaveBeenCalled();
  });
});
