import { useCallback, useMemo, useRef, useSyncExternalStore } from 'react';

export interface CookieOptions {
  /** Expiry date or number of days from now */
  expires?: Date | number;
  /** Cookie path (default: '/') */
  path?: string;
  /** Cookie domain */
  domain?: string;
  /** Restrict to HTTPS only */
  secure?: boolean;
  /** SameSite policy */
  sameSite?: 'Strict' | 'Lax' | 'None';
}

/** Custom event name used to broadcast cookie writes to every hook instance. */
const COOKIE_EVENT = 'reactilities-cookie';

interface CookieEventDetail {
  name: string;
}

/**
 * Read a single cookie value from `document.cookie`.
 *
 * Iterates the cookie pairs and returns the FIRST match. A previous
 * implementation used `split('; name=')` and only accepted a result when
 * exactly two parts came back, which returned `null` whenever the same cookie
 * name appeared more than once (e.g. set on both `/` and `/admin`).
 */
function getCookieValue(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const encodedName = encodeURIComponent(name);
  const pairs = document.cookie ? document.cookie.split('; ') : [];
  for (const pair of pairs) {
    const eq = pair.indexOf('=');
    if (eq === -1) continue;
    if (pair.slice(0, eq) === encodedName) {
      return decodeURIComponent(pair.slice(eq + 1));
    }
  }
  return null;
}

function setCookieString(name: string, value: string, options: CookieOptions = {}): void {
  const { expires, path = '/', domain, secure, sameSite } = options;
  let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

  if (expires !== undefined) {
    const expiryDate = typeof expires === 'number'
      ? new Date(Date.now() + expires * 864e5) // days to ms
      : expires;
    cookie += `; expires=${expiryDate.toUTCString()}`;
  }

  if (path) cookie += `; path=${path}`;
  if (domain) cookie += `; domain=${domain}`;
  if (secure) cookie += '; secure';
  if (sameSite) cookie += `; SameSite=${sameSite}`;

  document.cookie = cookie;
}

/** Broadcast a cookie change so other hook instances on the same name re-read. */
function emitCookieChange(name: string): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<CookieEventDetail>(COOKIE_EVENT, { detail: { name } })
  );
}

/**
 * Subscribe to cookie changes for a specific name.
 *
 * Listens to the library's own `reactilities-cookie` event (fired from
 * `setCookie`/`deleteCookie`) so multiple instances of the hook on the same
 * name stay in sync. When the native CookieStore API is available it also
 * listens for its `change` event, picking up writes made outside the hook.
 */
function createSubscribe(name: string) {
  return (onStoreChange: () => void): (() => void) => {
    if (typeof window === 'undefined') return () => {};

    const handleCustom = (event: Event) => {
      const detail = (event as CustomEvent<CookieEventDetail>).detail;
      // No detail (or matching name) -> re-read to be safe.
      if (!detail || detail.name === name) onStoreChange();
    };

    window.addEventListener(COOKIE_EVENT, handleCustom);

    // Feature-detected CookieStore subscription for out-of-hook changes.
    const cookieStore = (globalThis as { cookieStore?: EventTarget }).cookieStore;
    const handleStoreChange = () => onStoreChange();
    if (cookieStore && typeof cookieStore.addEventListener === 'function') {
      cookieStore.addEventListener('change', handleStoreChange);
    }

    return () => {
      window.removeEventListener(COOKIE_EVENT, handleCustom);
      if (cookieStore && typeof cookieStore.removeEventListener === 'function') {
        cookieStore.removeEventListener('change', handleStoreChange);
      }
    };
  };
}

/**
 * Hook for reading and writing browser cookies with React state synchronization
 * Zero external dependencies — uses native document.cookie API
 *
 * Built on `useSyncExternalStore` keyed on the cookie `name`:
 * - Reactive to `name` changes — passing a new name re-reads that cookie.
 * - Synced across instances — every hook on the same name updates when one of
 *   them calls `setCookie`/`deleteCookie` (via a custom `reactilities-cookie`
 *   event, plus the native CookieStore `change` event when available).
 * - SSR-safe — `getServerSnapshot` returns `null`, so the server render and the
 *   first client render agree (no hydration mismatch). The real cookie value is
 *   read after mount, so expect `null` on that very first client render.
 *
 * @param name - The cookie name to manage
 * @returns Tuple of [value, setCookie, deleteCookie]
 *
 * @example
 * function ConsentBanner() {
 *   const [consent, setConsent, deleteConsent] = useCookie('cookie-consent');
 *
 *   if (consent === 'accepted') return null;
 *
 *   return (
 *     <div className="banner">
 *       <p>We use cookies.</p>
 *       <button onClick={() => setConsent('accepted', { expires: 365 })}>
 *         Accept
 *       </button>
 *       <button onClick={deleteConsent}>Decline</button>
 *     </div>
 *   );
 * }
 *
 * @example
 * // Auth token cookie
 * function useAuth() {
 *   const [token, setToken, removeToken] = useCookie('auth-token');
 *
 *   const login = (jwt: string) =>
 *     setToken(jwt, { expires: 7, secure: true, sameSite: 'Strict' });
 *
 *   const logout = removeToken;
 *
 *   return { token, login, logout };
 * }
 *
 * @example
 * // Session preference
 * const [theme, setTheme] = useCookie('theme');
 * setTheme('dark', { path: '/' });
 *
 * @example
 * // Deleting a cookie that was scoped to a custom path/domain
 * const [, setAdminFlag, deleteAdminFlag] = useCookie('admin-flag');
 * setAdminFlag('1', { path: '/admin' });
 * deleteAdminFlag({ path: '/admin' }); // forwards path so it is actually removed
 */
export function useCookie(name: string): [
  string | null,
  (value: string, options?: CookieOptions) => void,
  (options?: Pick<CookieOptions, 'path' | 'domain'>) => void,
] {
  // subscribe/getSnapshot must be referentially stable per `name`;
  // useSyncExternalStore re-subscribes whenever their identity changes.
  const subscribe = useMemo(() => createSubscribe(name), [name]);
  const getSnapshot = useCallback(() => getCookieValue(name), [name]);
  // Server (and the first client render) report `null`; the real value is read
  // from the cookie after hydration. Returning a constant keeps server/client
  // markup identical and avoids hydration mismatches.
  const getServerSnapshot = useCallback(() => null, []);

  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Remember the last write's path/domain so a bare `deleteCookie()` can remove
  // a cookie that was created with a custom path/domain. An explicit options
  // argument to deleteCookie always wins over the remembered values.
  const lastScopeRef = useRef<Pick<CookieOptions, 'path' | 'domain'>>({});

  const setCookie = useCallback(
    (newValue: string, options: CookieOptions = {}) => {
      setCookieString(name, newValue, options);
      lastScopeRef.current = { path: options.path, domain: options.domain };
      emitCookieChange(name);
    },
    [name]
  );

  const deleteCookie = useCallback(
    (options: Pick<CookieOptions, 'path' | 'domain'> = {}) => {
      const path = options.path ?? lastScopeRef.current.path ?? '/';
      const domain = options.domain ?? lastScopeRef.current.domain;
      setCookieString(name, '', { expires: new Date(0), path, domain });
      emitCookieChange(name);
    },
    [name]
  );

  return [value, setCookie, deleteCookie];
}
