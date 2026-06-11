# useCookie

Hook for reading and writing browser cookies with React state synchronization. Zero external dependencies — uses the native `document.cookie` API.

## Usage

```tsx
import { useCookie } from 'reactilities';

function ConsentBanner() {
  const [consent, setConsent, deleteConsent] = useCookie('cookie-consent');

  if (consent === 'accepted') return null;

  return (
    <div className="banner">
      <p>We use cookies.</p>
      <button onClick={() => setConsent('accepted', { expires: 365 })}>Accept</button>
      <button onClick={deleteConsent}>Decline</button>
    </div>
  );
}
```

## API

### Parameters

- **`name`** (`string`) — the name of the cookie to manage

### Returns

`[value, setCookie, deleteCookie]`

| Index | Type                                                    | Description                          |
|-------|---------------------------------------------------------|--------------------------------------|
| `[0]` | `string \| null`                                        | Current cookie value, or `null` if not set |
| `[1]` | `(value: string, options?: CookieOptions) => void`      | Set the cookie value                 |
| `[2]` | `(options?: Pick<CookieOptions, 'path' \| 'domain'>) => void` | Delete the cookie. Pass the same `path`/`domain` the cookie was created with so a scoped cookie is actually removed. If omitted, the last `setCookie` `path`/`domain` is reused. |

### CookieOptions

| Option     | Type                          | Description                                  |
|------------|-------------------------------|----------------------------------------------|
| `expires`  | `Date \| number`              | Expiry date or number of days from now       |
| `path`     | `string`                      | Cookie path (default: `'/'`)                 |
| `domain`   | `string`                      | Cookie domain                                |
| `secure`   | `boolean`                     | Restrict to HTTPS only                       |
| `sameSite` | `'Strict' \| 'Lax' \| 'None'` | SameSite policy                              |

## Examples

### Auth token

```tsx
function useAuth() {
  const [token, setToken, removeToken] = useCookie('auth-token');

  const login = (jwt: string) =>
    setToken(jwt, { expires: 7, secure: true, sameSite: 'Strict' });

  const logout = removeToken;

  return { isLoggedIn: token !== null, login, logout };
}
```

### Theme preference

```tsx
function ThemeToggle() {
  const [theme, setTheme] = useCookie('theme');
  const current = theme ?? 'light';

  return (
    <button onClick={() => setTheme(current === 'light' ? 'dark' : 'light', { expires: 365 })}>
      Switch to {current === 'light' ? 'dark' : 'light'} mode
    </button>
  );
}
```

### Session-only cookie

```tsx
function useSessionFlag(key: string) {
  const [value, setValue, clear] = useCookie(key);
  // No `expires` option = session cookie, cleared when browser closes
  const set = () => setValue('true');
  return { isSet: value === 'true', set, clear };
}
```

## Features

- Zero dependencies — no `js-cookie` or other libraries
- Names and values are automatically encoded/decoded with `encodeURIComponent` / `decodeURIComponent`
- Built on `useSyncExternalStore` keyed on the cookie `name`:
  - **Reactive to `name` changes** — passing a new name (e.g. `useCookie(`prefs-${userId}`)`) re-reads that cookie
  - **In-app sync** — every instance of the hook on the same name updates when one of them calls `setCookie`/`deleteCookie`
  - When the native [CookieStore](https://developer.mozilla.org/en-US/docs/Web/API/CookieStore) API is available it is feature-detected and used to pick up cookie changes made outside the hook
- SSR-safe — `getServerSnapshot` returns `null`, so the server render and the first client render agree (no hydration mismatch)
- Correctly reads a cookie even when the same name appears more than once (e.g. set on both `/` and `/admin`) — the first match is returned
- `expires` accepts either a `Date` object or a number of days for convenience
- Deleting a cookie sets it to an expired date, which is the standard browser mechanism

## Notes

- On the very first client render the value is `null`; the real cookie value is read immediately after mount (this is what keeps SSR hydration safe)
- Sync is in-app (same document). For cross-tab sync, pair with `useLocalStorage` or a `storage` event listener
- To delete a cookie that was set with a custom `path` or `domain`, pass them to `deleteCookie({ path, domain })` (or rely on the hook reusing the last `setCookie` scope) — browsers only remove a cookie when the delete write matches its scope
