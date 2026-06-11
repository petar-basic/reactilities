import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCountdown } from './index';

describe('useCountdown', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('should initialize with countStart value', () => {
    const { result } = renderHook(() => useCountdown({ countStart: 10 }));
    expect(result.current.count).toBe(10);
    expect(result.current.isRunning).toBe(false);
  });

  it('should count down on start', () => {
    const { result } = renderHook(() => useCountdown({ countStart: 5 }));

    act(() => result.current.start());
    expect(result.current.isRunning).toBe(true);

    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.count).toBe(4);

    act(() => vi.advanceTimersByTime(2000));
    expect(result.current.count).toBe(2);
  });

  it('should stop at countStop value', () => {
    const { result } = renderHook(() => useCountdown({ countStart: 3, countStop: 0 }));

    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(5000));

    expect(result.current.count).toBe(0);
    expect(result.current.isRunning).toBe(false);
  });

  it('should stop countdown', () => {
    const { result } = renderHook(() => useCountdown({ countStart: 10 }));

    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(3000));
    expect(result.current.count).toBe(7);

    act(() => result.current.stop());
    expect(result.current.isRunning).toBe(false);

    act(() => vi.advanceTimersByTime(3000));
    expect(result.current.count).toBe(7);
  });

  it('should reset to countStart', () => {
    const { result } = renderHook(() => useCountdown({ countStart: 10 }));

    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(3000));
    expect(result.current.count).toBe(7);

    act(() => result.current.reset());
    expect(result.current.count).toBe(10);
    expect(result.current.isRunning).toBe(false);
  });

  it('should support count-up (isIncrement)', () => {
    const { result } = renderHook(() =>
      useCountdown({ countStart: 0, countStop: 5, isIncrement: true })
    );

    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(3000));
    expect(result.current.count).toBe(3);

    act(() => vi.advanceTimersByTime(2000));
    expect(result.current.count).toBe(5);
    expect(result.current.isRunning).toBe(false);
  });

  it('should count up past 0 and keep running with default countStop in increment mode', () => {
    // Default countStop in increment mode must be Infinity (unbounded stopwatch),
    // NOT 0 — otherwise the first tick (next=1 >= 0) immediately clamps to 0 and stops.
    const { result } = renderHook(() =>
      useCountdown({ countStart: 0, isIncrement: true })
    );

    act(() => result.current.start());
    expect(result.current.isRunning).toBe(true);

    // Multiple ticks: count must keep climbing, never resetting to 0.
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.count).toBe(1);
    expect(result.current.isRunning).toBe(true);

    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.count).toBe(2);
    expect(result.current.isRunning).toBe(true);

    act(() => vi.advanceTimersByTime(3000));
    expect(result.current.count).toBe(5);
    expect(result.current.isRunning).toBe(true);
  });

  it('should stop at explicit countStop in increment mode', () => {
    const { result } = renderHook(() =>
      useCountdown({ countStart: 0, countStop: 3, isIncrement: true })
    );

    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(2000));
    expect(result.current.count).toBe(2);
    expect(result.current.isRunning).toBe(true);

    // Overshoot the interval — must clamp at countStop and stop.
    act(() => vi.advanceTimersByTime(5000));
    expect(result.current.count).toBe(3);
    expect(result.current.isRunning).toBe(false);
  });

  it('should still stop at default countStop of 0 in decrement mode', () => {
    // Decrement default behavior must be unchanged: stops at 0.
    const { result } = renderHook(() => useCountdown({ countStart: 3 }));

    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(2000));
    expect(result.current.count).toBe(1);
    expect(result.current.isRunning).toBe(true);

    act(() => vi.advanceTimersByTime(5000));
    expect(result.current.count).toBe(0);
    expect(result.current.isRunning).toBe(false);
  });

  it('should respect explicit countStop of 0 in increment mode (caller intent preserved)', () => {
    // If a caller explicitly passes countStop: 0 while incrementing, the timer
    // is "already done" — count must stay clamped at 0 and not run.
    const { result } = renderHook(() =>
      useCountdown({ countStart: 0, countStop: 0, isIncrement: true })
    );

    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(3000));
    expect(result.current.count).toBe(0);
    expect(result.current.isRunning).toBe(false);
  });

  it('should support custom interval', () => {
    const { result } = renderHook(() =>
      useCountdown({ countStart: 10, intervalMs: 500 })
    );

    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.count).toBe(8);
  });

  it('should not start multiple intervals on repeated start calls', () => {
    const { result } = renderHook(() => useCountdown({ countStart: 10 }));

    act(() => result.current.start());
    act(() => result.current.start());
    act(() => result.current.start());

    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.count).toBe(9);
  });

  it('should clean up interval on unmount', () => {
    const { result, unmount } = renderHook(() => useCountdown({ countStart: 10 }));

    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.count).toBe(9);

    unmount();

    // After unmount, advancing time should not change count further
    act(() => vi.advanceTimersByTime(5000));
    expect(result.current.count).toBe(9);
  });
});
