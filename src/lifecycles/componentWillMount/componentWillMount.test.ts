import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { StrictMode, createElement, type ReactNode } from 'react';
import { componentWillMount } from './index';

const StrictModeWrapper = ({ children }: { children: ReactNode }) =>
  createElement(StrictMode, null, children);

describe('componentWillMount', () => {
  it('should call function once before render', () => {
    const mockFn = vi.fn();

    renderHook(() => componentWillMount(mockFn));

    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should not call function again on re-render', () => {
    const mockFn = vi.fn();

    const { rerender } = renderHook(() => componentWillMount(mockFn));

    expect(mockFn).toHaveBeenCalledTimes(1);

    rerender();
    rerender();

    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should handle function that returns a value', () => {
    const mockFn = vi.fn(() => 'init value');

    renderHook(() => componentWillMount(mockFn));

    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveReturnedWith('init value');
  });

  it('should handle synchronous side effects', () => {
    let initialized = false;
    const mockFn = vi.fn(() => {
      initialized = true;
    });

    renderHook(() => componentWillMount(mockFn));

    expect(initialized).toBe(true);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  // BUG C (mutation-proof) — must run DURING the render phase, before any render
  // output. The pre-fix code used `useLayoutEffect(..., [])`, which runs AFTER
  // the first commit, producing the order ['render', 'willMount']. The render-
  // phase guard runs first, so the order is ['willMount', 'render'].
  it('runs before the render output is produced', () => {
    const callOrder: string[] = [];
    const mockFn = vi.fn(() => {
      callOrder.push('willMount');
    });

    renderHook(() => {
      componentWillMount(mockFn);
      callOrder.push('render');
    });

    expect(callOrder).toEqual(['willMount', 'render']);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  // BUG C (mutation-proof) — exactly once. A side effect set during the first
  // render must be observable, and the function must not run a second time even
  // across re-renders.
  it('runs exactly once across multiple renders', () => {
    let runCount = 0;
    const mockFn = vi.fn(() => {
      runCount += 1;
    });

    const { rerender } = renderHook(() => componentWillMount(mockFn));

    expect(runCount).toBe(1);

    rerender();
    rerender();

    expect(runCount).toBe(1);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('stays idempotent under StrictMode (may double-invoke in dev)', () => {
    // StrictMode double-invokes render-phase code in development to surface
    // impurities. Whether the ref-guard mutation survives that double render is
    // version-dependent (React 19 keeps it → one call; React 18 discards it →
    // two). The stable contract is "exactly once per mount in production"
    // (covered by the tests above) plus "func must be idempotent" — so under
    // StrictMode we only assert it ran, not a dev-only exact count.
    const mockFn = vi.fn();

    renderHook(() => componentWillMount(mockFn), { wrapper: StrictModeWrapper });

    expect(mockFn).toHaveBeenCalled();
  });

  // BUG C (mutation-proof, SSR) — the render-phase guard must work on the server
  // without emitting React's "useLayoutEffect does nothing on the server"
  // warning that the pre-fix useLayoutEffect implementation produced.
  it('runs once on the server with no useLayoutEffect warning (SSR)', async () => {
    const { renderToString } = await import('react-dom/server');
    const React = await import('react');

    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    const mockFn = vi.fn();

    function SsrConsumer() {
      componentWillMount(mockFn);
      return React.createElement('span', null, 'ssr');
    }

    let html = '';
    expect(() => {
      html = renderToString(React.createElement(SsrConsumer));
    }).not.toThrow();

    expect(html).toContain('ssr');
    expect(mockFn).toHaveBeenCalledTimes(1);

    const sawLayoutEffectWarning = consoleErrorSpy.mock.calls.some((call) =>
      call.some(
        (arg) => typeof arg === 'string' && arg.includes('useLayoutEffect')
      )
    );
    expect(sawLayoutEffectWarning).toBe(false);

    consoleErrorSpy.mockRestore();
  });
});
