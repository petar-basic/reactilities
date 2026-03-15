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
| `[2]` | `() => void`                                            | Delete the cookie                    |

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
- SSR-safe — returns `null` when `document` is not available
- `expires` accepts either a `Date` object or a number of days for convenience
- Deleting a cookie sets it to an expired date, which is the standard browser mechanism

## Notes

- Cookie state is local to the component — changes made by other tabs or direct `document.cookie` writes are not automatically reflected
- For cross-tab sync, pair with `useLocalStorage` or a `storage` event listener
