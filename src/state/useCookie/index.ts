import { useCallback, useState } from 'react';

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

function getCookieValue(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${encodeURIComponent(name)}=`);
  if (parts.length === 2) return decodeURIComponent(parts.pop()!.split(';')[0]);
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

/**
 * Hook for reading and writing browser cookies with React state synchronization
 * Zero external dependencies — uses native document.cookie API
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
 */
export function useCookie(name: string): [
  string | null,
  (value: string, options?: CookieOptions) => void,
  () => void,
] {
  const [value, setValue] = useState<string | null>(() => getCookieValue(name));

  const setCookie = useCallback(
    (newValue: string, options: CookieOptions = {}) => {
      setCookieString(name, newValue, options);
      setValue(newValue);
    },
    [name]
  );

  const deleteCookie = useCallback(() => {
    setCookieString(name, '', { expires: new Date(0) });
    setValue(null);
  }, [name]);

  return [value, setCookie, deleteCookie];
}
