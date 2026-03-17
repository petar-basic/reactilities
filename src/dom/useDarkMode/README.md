# useDarkMode

Hook for dark mode with system preference detection, manual override, and localStorage persistence. Applies a `dark` class to `<html>` automatically — compatible with Tailwind CSS dark mode and custom CSS variables.

Composes `useMediaQuery` and `useLocalStorage` internally — no extra dependencies.

## Usage

```tsx
import { useDarkMode } from 'reactilities';

function ThemeToggle() {
  const { isDark, toggle } = useDarkMode();

  return (
    <button onClick={toggle}>
      {isDark ? '☀️ Light mode' : '🌙 Dark mode'}
    </button>
  );
}
```

## API

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `storageKey` | `string` | `'color-scheme'` | localStorage key for persisting the preference |

### Returns

| Property | Type | Description |
|----------|------|-------------|
| `isDark` | `boolean` | Whether dark mode is currently active |
| `colorScheme` | `'dark' \| 'light' \| 'system'` | The currently stored preference |
| `setColorScheme` | `(scheme) => void` | Explicitly set the color scheme |
| `toggle` | `() => void` | Toggle between dark and light (never 'system') |

## Color Scheme Values

| Value | Behavior |
|-------|----------|
| `'dark'` | Always dark, regardless of OS setting |
| `'light'` | Always light, regardless of OS setting |
| `'system'` | Follows the OS/browser `prefers-color-scheme` setting |

## Examples

### Full Settings Panel

```tsx
function AppearanceSettings() {
  const { colorScheme, setColorScheme } = useDarkMode();

  return (
    <fieldset>
      <legend>Theme</legend>
      {(['system', 'light', 'dark'] as const).map((scheme) => (
        <label key={scheme}>
          <input
            type="radio"
            checked={colorScheme === scheme}
            onChange={() => setColorScheme(scheme)}
          />
          {scheme.charAt(0).toUpperCase() + scheme.slice(1)}
        </label>
      ))}
    </fieldset>
  );
}
```

### Tailwind CSS Setup

In `tailwind.config.js`:
```js
module.exports = {
  darkMode: 'class', // useDarkMode adds/removes the 'dark' class on <html>
}
```

Then use `dark:` variants normally:
```tsx
<div className="bg-white dark:bg-gray-900 text-black dark:text-white">
  Content
</div>
```

### CSS Variables Setup

```css
:root { --bg: #ffffff; --text: #000000; }
html.dark { --bg: #1a1a1a; --text: #ffffff; }
```

## Notes

- The `dark` class is added/removed on `document.documentElement` (`<html>`)
- `toggle()` switches between `'dark'` and `'light'` — it does not toggle back to `'system'`
- To reset to system preference, call `setColorScheme('system')`
- Preference persists across page reloads via localStorage
- Reactively updates if the user changes their OS preference while `colorScheme === 'system'`
