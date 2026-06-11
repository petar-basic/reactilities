import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCookie } from './index';

/** Wipe every cookie visible at the test document's path. */
function clearAllCookies() {
  document.cookie.split(';').forEach(cookie => {
    const name = cookie.split('=')[0].trim();
    if (name) {
      document.cookie = `${name}=; expires=${new Date(0).toUTCString()}; path=/`;
    }
  });
}

describe('useCookie', () => {
  beforeEach(() => {
    clearAllCookies();
  });

  afterEach(() => {
    clearAllCookies();
    vi.restoreAllMocks();
  });

  it('should return null when cookie does not exist', () => {
    const { result } = renderHook(() => useCookie('nonexistent'));
    expect(result.current[0]).toBeNull();
  });

  it('should read an existing cookie present before mount', () => {
    document.cookie = 'preexisting=already-here; path=/';
    const { result } = renderHook(() => useCookie('preexisting'));
    expect(result.current[0]).toBe('already-here');
  });

  it('should handle special characters in cookie value', () => {
    const { result } = renderHook(() => useCookie('encoded'));

    act(() => result.current[1]('hello world & more'));
    expect(result.current[0]).toBe('hello world & more');
    // The raw stored cookie must be URL-encoded.
    expect(document.cookie).toContain(encodeURIComponent('hello world & more'));
  });

  it('should handle updating cookie value', () => {
    const { result } = renderHook(() => useCookie('updatable'));

    act(() => result.current[1]('first'));
    expect(result.current[0]).toBe('first');

    act(() => result.current[1]('second'));
    expect(result.current[0]).toBe('second');
    expect(document.cookie).toContain('updatable=second');
  });

  it('should accept cookie options', () => {
    const { result } = renderHook(() => useCookie('options-cookie'));

    act(() => result.current[1]('value', { path: '/', secure: false, sameSite: 'Lax' }));
    expect(result.current[0]).toBe('value');
  });

  it('should return stable setCookie and deleteCookie references', () => {
    const { result, rerender } = renderHook(() => useCookie('stable'));

    const setCookie1 = result.current[1];
    const deleteCookie1 = result.current[2];

    rerender();

    expect(result.current[1]).toBe(setCookie1);
    expect(result.current[2]).toBe(deleteCookie1);
  });

  // ---------------------------------------------------------------------------
  // Mutation-proof regression tests for the five fixed bugs.
  //
  // The pre-fix hook held per-instance optimistic state and never round-tripped
  // through `document.cookie`, so each of these is designed to FAIL if its fix
  // is reverted.
  // ---------------------------------------------------------------------------

  // FIX 1+2 / BUG 3 (round-trip) — setCookie must actually write to
  // document.cookie AND the rendered value must reflect the persisted cookie.
  // Reverting to optimistic `setValue` local state would still pass the rendered
  // assertion, so we ALSO assert the raw document.cookie write. Both directions
  // are checked: write -> document.cookie, and document.cookie -> rendered.
  it('setCookie writes to document.cookie and the rendered value reflects it (round-trip)', () => {
    const { result } = renderHook(() => useCookie('rt-key'));

    act(() => result.current[1]('persisted'));

    // 1. The value was actually written to the real cookie jar.
    expect(document.cookie).toContain('rt-key=persisted');
    // 2. The rendered value is sourced from that cookie (getSnapshot), not
    //    from optimistic local state.
    expect(result.current[0]).toBe('persisted');
  });

  // FIX 5 / BUG: deleteCookie must remove the cookie from document.cookie.
  it('deleteCookie removes the cookie from document.cookie', () => {
    const { result } = renderHook(() => useCookie('del-key'));

    act(() => result.current[1]('value'));
    expect(document.cookie).toContain('del-key=value');
    expect(result.current[0]).toBe('value');

    act(() => result.current[2]());

    expect(document.cookie).not.toContain('del-key=value');
    expect(result.current[0]).toBeNull();
  });

  // BUG 1 — name change must re-read the NEW cookie. The pre-fix
  // useState(initializer) captured the value at mount and never reacted to
  // `name` changes, so this returned the stale first cookie's value.
  it('re-reads the new cookie when the name changes', () => {
    document.cookie = 'prefs-1=alice; path=/';
    document.cookie = 'prefs-2=bob; path=/';

    const { result, rerender } = renderHook(
      ({ id }) => useCookie(`prefs-${id}`),
      { initialProps: { id: 1 } }
    );

    expect(result.current[0]).toBe('alice');

    rerender({ id: 2 });

    expect(result.current[0]).toBe('bob');
  });

  // BUG 3 — two hook instances on the same name stay in sync. The pre-fix hook
  // used per-instance useState; writing in one left the other showing the old
  // value. With the custom-event + useSyncExternalStore wiring both re-read.
  it('keeps two instances on the same name in sync after setCookie in one', () => {
    const { result: a } = renderHook(() => useCookie('shared'));
    const { result: b } = renderHook(() => useCookie('shared'));

    expect(a.current[0]).toBeNull();
    expect(b.current[0]).toBeNull();

    act(() => a.current[1]('synced'));

    expect(a.current[0]).toBe('synced');
    // The second instance picked up the change via the broadcast event.
    expect(b.current[0]).toBe('synced');

    act(() => b.current[2]());

    expect(b.current[0]).toBeNull();
    expect(a.current[0]).toBeNull();
  });

  // BUG 2 — SSR. getServerSnapshot must return null and renderToString must not
  // throw, with no hydration-time cookie read on the server.
  it('renders null on the server without throwing (SSR)', async () => {
    const { renderToString } = await import('react-dom/server');
    const React = await import('react');

    function SsrConsumer() {
      const [value] = useCookie('ssr-key');
      return React.createElement('span', null, value === null ? 'NULL' : String(value));
    }

    let html = '';
    expect(() => {
      html = renderToString(React.createElement(SsrConsumer));
    }).not.toThrow();

    expect(html).toContain('NULL');
  });

  // BUG 4 — a cookie name that appears more than once (e.g. set on both '/' and
  // '/admin') must return the first match, not null. jsdom only surfaces a
  // single-path cookie jar, so we stub document.cookie to return a duplicated
  // name string directly. The pre-fix code used `split('; name='); length === 2`
  // which returned null for duplicates.
  it('returns the value (not null) when the cookie name appears more than once', () => {
    const dupCookie = 'dup=root-value; dup=admin-value; other=x';
    const cookieSpy = vi
      .spyOn(document, 'cookie', 'get')
      .mockReturnValue(dupCookie);

    const { result } = renderHook(() => useCookie('dup'));

    expect(result.current[0]).toBe('root-value');

    cookieSpy.mockRestore();
  });

  // BUG 5 — deleteCookie must forward a custom path so a cookie scoped to that
  // path is actually expired. We spy on the document.cookie setter and assert
  // the delete write carries `path=/admin`. The pre-fix deleteCookie always
  // wrote `path=/` regardless of where the cookie lived.
  it('forwards a custom path when deleting (explicit options)', () => {
    const writes: string[] = [];
    vi.spyOn(document, 'cookie', 'set').mockImplementation((v: string) => {
      writes.push(v);
    });

    const { result } = renderHook(() => useCookie('scoped'));

    act(() => result.current[2]({ path: '/admin' }));

    const deleteWrite = writes.find(w => w.startsWith('scoped='));
    expect(deleteWrite).toBeDefined();
    expect(deleteWrite).toContain('path=/admin');
  });

  // BUG 5 (companion) — a bare deleteCookie() after setCookie with a custom path
  // remembers that path so the cookie is removed from where it was written.
  it('remembers the last setCookie path for a bare deleteCookie()', () => {
    const writes: string[] = [];
    vi.spyOn(document, 'cookie', 'set').mockImplementation((v: string) => {
      writes.push(v);
    });

    const { result } = renderHook(() => useCookie('remembered'));

    act(() => result.current[1]('v', { path: '/admin', domain: 'example.com' }));
    act(() => result.current[2]());

    const deleteWrite = writes.reverse().find(w => w.startsWith('remembered=') && w.includes('expires'));
    expect(deleteWrite).toBeDefined();
    expect(deleteWrite).toContain('path=/admin');
    expect(deleteWrite).toContain('domain=example.com');
  });
});
