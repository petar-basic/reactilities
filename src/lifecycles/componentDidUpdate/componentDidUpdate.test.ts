import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { componentDidUpdate } from './index';
import { useState, StrictMode, createElement, type ReactNode } from 'react';

const StrictModeWrapper = ({ children }: { children: ReactNode }) =>
  createElement(StrictMode, null, children);

describe('componentDidUpdate', () => {
  // BUG B (mutation-proof) — must NOT fire on the initial mount, mirroring the
  // class lifecycle. The pre-fix code used `useEffect(() => { func() })` with no
  // dep array, which ran after every commit INCLUDING the first mount.
  it('does not fire on initial mount', () => {
    const mockFn = vi.fn();

    renderHook(() => componentDidUpdate(mockFn));

    expect(mockFn).not.toHaveBeenCalled();
  });

  it('fires on re-render, once per update', () => {
    const mockFn = vi.fn();

    const { rerender } = renderHook(() => componentDidUpdate(mockFn));

    // Not called on mount.
    expect(mockFn).toHaveBeenCalledTimes(0);

    rerender();
    expect(mockFn).toHaveBeenCalledTimes(1);

    rerender();
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('fires on state changes (but not the initial state)', () => {
    const mockFn = vi.fn();

    const { rerender } = renderHook(({ count }) => {
      const [state, setState] = useState(count);
      componentDidUpdate(mockFn);
      return { state, setState };
    }, { initialProps: { count: 0 } });

    expect(mockFn).toHaveBeenCalledTimes(0);

    rerender({ count: 1 });
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('invokes the provided function on update', () => {
    const mockFn = vi.fn(() => 'update value');

    const { rerender } = renderHook(() => componentDidUpdate(mockFn));

    rerender();
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveReturnedWith('update value');
  });

  it('runs side effects only on updates', () => {
    let counter = 0;
    const mockFn = vi.fn(() => {
      counter++;
    });

    const { rerender } = renderHook(() => componentDidUpdate(mockFn));

    // Mount: no side effect.
    expect(counter).toBe(0);

    rerender();
    rerender();

    expect(counter).toBe(2);
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  // BUG B (mutation-proof, StrictMode) — StrictMode in dev simulates an extra
  // unmount/remount on mount (setup -> cleanup -> setup). A naive skip-first
  // ref flag flips during the discarded pass and then treats the real mount as
  // an "update", firing func spuriously. With the mount-only cleanup re-arming
  // the flag, mount must still produce ZERO calls under StrictMode.
  it('does not fire on mount under StrictMode', () => {
    const mockFn = vi.fn();

    renderHook(() => componentDidUpdate(mockFn), { wrapper: StrictModeWrapper });

    expect(mockFn).not.toHaveBeenCalled();
  });

  it('fires on re-render under StrictMode', () => {
    const mockFn = vi.fn();

    const { rerender } = renderHook(() => componentDidUpdate(mockFn), {
      wrapper: StrictModeWrapper,
    });

    expect(mockFn).not.toHaveBeenCalled();

    rerender();
    // StrictMode double-invokes effects, so a single update may invoke func
    // twice in dev. The contract we assert is that an update fires it, and
    // mount did not.
    expect(mockFn).toHaveBeenCalled();
  });
});
