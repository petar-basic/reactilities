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
