# useClipboard

Hook for reading from and writing to the system clipboard. Supports both the modern Clipboard API and a legacy `execCommand` fallback for copy. Tracks the last copied or read value and provides a timed `hasCopied` flag.

## Usage

```tsx
import { useClipboard } from 'reactilities';

function CopyButton({ text }: { text: string }) {
  const { copy, hasCopied } = useClipboard();

  return (
    <button onClick={() => copy(text)}>
      {hasCopied ? 'Copied!' : 'Copy'}
    </button>
  );
}
```

## API

### Parameters

- **`resetDelay`** (`number`) - Milliseconds before `hasCopied` resets to `false` (default: `2000`, pass `0` to disable auto-reset)

### Returns

| Property | Type | Description |
|---|---|---|
| `value` | `string \| null` | Last copied or read clipboard value |
| `hasCopied` | `boolean` | `true` for `resetDelay`ms after a successful copy |
| `copy` | `(text: string) => Promise<boolean>` | Write text to clipboard, returns success flag |
| `read` | `() => Promise<string \| null>` | Read current clipboard text |
| `reset` | `() => void` | Clear `value` and `hasCopied` |

## Examples

### Copy to clipboard button

```tsx
function CodeBlock({ code }: { code: string }) {
  const { copy, hasCopied } = useClipboard(3000);

  return (
    <div className="code-block">
      <pre>{code}</pre>
      <button onClick={() => copy(code)}>
        {hasCopied ? '✓ Copied' : 'Copy'}
      </button>
    </div>
  );
}
```

### Copy link to share

```tsx
function ShareButton() {
  const { copy, hasCopied } = useClipboard();

  const shareUrl = window.location.href;

  return (
    <button onClick={() => copy(shareUrl)}>
      {hasCopied ? 'Link copied!' : 'Share'}
    </button>
  );
}
```

### Read from clipboard

```tsx
function PasteInput() {
  const { read, value } = useClipboard();

  return (
    <div>
      <button onClick={read}>Paste from clipboard</button>
      {value && (
        <p>Clipboard contents: <code>{value}</code></p>
      )}
    </div>
  );
}
```

### Copy with error handling

```tsx
function SecureCopy({ secret }: { secret: string }) {
  const { copy } = useClipboard();
  const [error, setError] = useState(false);

  const handleCopy = async () => {
    const success = await copy(secret);
    if (!success) setError(true);
  };

  return (
    <div>
      <button onClick={handleCopy}>Copy API Key</button>
      {error && <span>Copy failed — please copy manually</span>}
    </div>
  );
}
```

## Features

- ✅ Modern `navigator.clipboard.writeText` with legacy `execCommand` fallback
- ✅ `hasCopied` flag with configurable auto-reset delay
- ✅ `read()` for reading clipboard contents (requires `clipboard-read` permission)
- ✅ Returns `boolean` from `copy()` to handle failures gracefully
- ✅ Zero external dependencies

## Notes

- `copy()` falls back to `document.execCommand('copy')` in environments that don't support the Clipboard API
- `read()` requires the user to grant the `clipboard-read` browser permission — it logs a warning and returns `null` if denied
- Pass `0` as `resetDelay` to keep `hasCopied` as `true` indefinitely
- `value` tracks the last successful copy or read, whichever happened last
