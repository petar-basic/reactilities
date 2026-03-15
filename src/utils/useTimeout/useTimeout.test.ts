import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTimeout } from './index';

describe('useTimeout', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('should call callback after the given delay', () => {
    const callback = vi.fn();
    renderHook(() => useTimeout(callback, 1000));

    expect(callback).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(999));
    expect(callback).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(1));
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should call callback only once', () => {
    const callback = vi.fn();
    renderHook(() => useTimeout(callback, 500));

    act(() => vi.advanceTimersByTime(5000));
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should not call callback when delay is null', () => {
    const callback = vi.fn();
    renderHook(() => useTimeout(callback, null));

    act(() => vi.advanceTimersByTime(10000));
    expect(callback).not.toHaveBeenCalled();
  });

  it('should clear timeout and not call callback', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useTimeout(callback, 1000));

    act(() => result.current.clear());
    act(() => vi.advanceTimersByTime(2000));
    expect(callback).not.toHaveBeenCalled();
  });

  it('should reset timeout and restart the timer', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useTimeout(callback, 1000));

    act(() => vi.advanceTimersByTime(700));
    expect(callback).not.toHaveBeenCalled();

    act(() => result.current.reset());

    act(() => vi.advanceTimersByTime(700));
    expect(callback).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(300));
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should clean up on unmount', () => {
    const callback = vi.fn();
    const { unmount } = renderHook(() => useTimeout(callback, 1000));

    unmount();
    act(() => vi.advanceTimersByTime(2000));
    expect(callback).not.toHaveBeenCalled();
  });

  it('should use updated callback', () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    const { rerender } = renderHook(
      ({ cb }) => useTimeout(cb, 1000),
      { initialProps: { cb: callback1 } }
    );

    act(() => vi.advanceTimersByTime(500));
    rerender({ cb: callback2 });
    act(() => vi.advanceTimersByTime(500));

    expect(callback1).not.toHaveBeenCalled();
    expect(callback2).toHaveBeenCalledTimes(1);
  });

  it('should restart when delay changes', () => {
    const callback = vi.fn();
    const { rerender } = renderHook(
      ({ delay }) => useTimeout(callback, delay),
      { initialProps: { delay: 1000 as number | null } }
    );

    act(() => vi.advanceTimersByTime(800));
    rerender({ delay: 2000 });
    act(() => vi.advanceTimersByTime(1000));
    expect(callback).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(1000));
    expect(callback).toHaveBeenCalledTimes(1);
  });
});
