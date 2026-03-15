import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useState } from 'react';
import { useInterval } from './index';

describe('useInterval', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('should call callback at the given interval', () => {
    const callback = vi.fn();
    renderHook(() => useInterval(callback, 1000));

    expect(callback).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(1000));
    expect(callback).toHaveBeenCalledTimes(1);

    act(() => vi.advanceTimersByTime(1000));
    expect(callback).toHaveBeenCalledTimes(2);

    act(() => vi.advanceTimersByTime(3000));
    expect(callback).toHaveBeenCalledTimes(5);
  });

  it('should not call callback when delay is null', () => {
    const callback = vi.fn();
    renderHook(() => useInterval(callback, null));

    act(() => vi.advanceTimersByTime(5000));
    expect(callback).not.toHaveBeenCalled();
  });

  it('should pause when delay changes to null', () => {
    const callback = vi.fn();
    const { rerender } = renderHook(
      ({ delay }) => useInterval(callback, delay),
      { initialProps: { delay: 1000 as number | null } }
    );

    act(() => vi.advanceTimersByTime(2000));
    expect(callback).toHaveBeenCalledTimes(2);

    rerender({ delay: null });
    act(() => vi.advanceTimersByTime(3000));
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('should resume when delay changes from null', () => {
    const callback = vi.fn();
    const { rerender } = renderHook(
      ({ delay }) => useInterval(callback, delay),
      { initialProps: { delay: null as number | null } }
    );

    act(() => vi.advanceTimersByTime(2000));
    expect(callback).toHaveBeenCalledTimes(0);

    rerender({ delay: 500 });
    act(() => vi.advanceTimersByTime(1000));
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('should use updated callback without resetting interval', () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    const { rerender } = renderHook(
      ({ cb }) => useInterval(cb, 1000),
      { initialProps: { cb: callback1 } }
    );

    act(() => vi.advanceTimersByTime(500));
    rerender({ cb: callback2 });
    act(() => vi.advanceTimersByTime(500));

    expect(callback1).not.toHaveBeenCalled();
    expect(callback2).toHaveBeenCalledTimes(1);
  });

  it('should clear interval on unmount', () => {
    const callback = vi.fn();
    const { unmount } = renderHook(() => useInterval(callback, 1000));

    unmount();
    act(() => vi.advanceTimersByTime(5000));
    expect(callback).not.toHaveBeenCalled();
  });

  it('should work with state updates in callback', () => {
    const { result } = renderHook(() => {
      const [count, setCount] = useState(0);
      useInterval(() => setCount(c => c + 1), 1000);
      return count;
    });

    expect(result.current).toBe(0);
    act(() => vi.advanceTimersByTime(3000));
    expect(result.current).toBe(3);
  });
});
