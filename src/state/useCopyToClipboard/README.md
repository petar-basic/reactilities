# useCopyToClipboard

Hook for copying text to clipboard with fallback support. Uses modern Clipboard API when available, falls back to legacy `document.execCommand` method. Tracks the last copied value for UI feedback.

## Usage

```tsx
import { useCopyToClipboard } from 'reactilities';

function CopyButton({ text }) {
  const [copiedValue, copyToClipboard] = useCopyToClipboard();
  const isCopied = copiedValue === text;
  
  return (
    <button onClick={() => copyToClipboard(text)}>
      {isCopied ? 'Copied!' : 'Copy'}
    </button>
  );
}
```

## API

### Parameters

None

### Returns

`[string | null, (value: string) => void]` - Array containing:
- **`copiedValue`** - The last successfully copied text (or `null` if nothing copied yet)
- **`copyToClipboard`** - Function to copy text to clipboard

## Examples

### Basic Copy Button

```tsx
function CodeBlock({ code }) {
  const [copiedValue, copy] = useCopyToClipboard();
  
  return (
    <div className="code-block">
      <pre>{code}</pre>
      <button onClick={() => copy(code)}>
        {copiedValue === code ? '✓ Copied' : 'Copy Code'}
      </button>
    </div>
  );
}
```

### Share Link

```tsx
function ShareLink({ url }) {
  const [copiedValue, copyToClipboard] = useCopyToClipboard();
  const [showFeedback, setShowFeedback] = useState(false);
  
  const handleCopy = async () => {
    copyToClipboard(url);
    setShowFeedback(true);
    setTimeout(() => setShowFeedback(false), 2000);
  };
  
  return (
    <div>
      <input value={url} readOnly />
      <button onClick={handleCopy}>
        📋 Copy Link
      </button>
      {showFeedback && (
        <span className="success">✓ Link copied!</span>
      )}
    </div>
  );
}
```

### Copy Multiple Items

```tsx
function ContactInfo() {
  const [copied, copy] = useCopyToClipboard();
  
  const email = 'contact@example.com';
  const phone = '+1 (555) 123-4567';
  const address = '123 Main St, City, State';
  
  return (
    <div>
      <div>
        <span>Email: {email}</span>
        <button onClick={() => copy(email)}>
          {copied === email ? '✓' : '📋'}
        </button>
      </div>
      <div>
        <span>Phone: {phone}</span>
        <button onClick={() => copy(phone)}>
          {copied === phone ? '✓' : '📋'}
        </button>
      </div>
      <div>
        <span>Address: {address}</span>
        <button onClick={() => copy(address)}>
          {copied === address ? '✓' : '📋'}
        </button>
      </div>
    </div>
  );
}
```

### API Key Display

```tsx
function ApiKeyDisplay({ apiKey }) {
  const [copied, copy] = useCopyToClipboard();
  const [revealed, setRevealed] = useState(false);
  
  const displayKey = revealed 
    ? apiKey 
    : apiKey.slice(0, 8) + '••••••••';
  
  return (
    <div className="api-key">
      <code>{displayKey}</code>
      <button onClick={() => setRevealed(!revealed)}>
        {revealed ? '🙈 Hide' : '👁️ Show'}
      </button>
      <button onClick={() => copy(apiKey)}>
        {copied === apiKey ? '✓ Copied' : '📋 Copy'}
      </button>
    </div>
  );
}
```

### Copy with Notification

```tsx
function CopyWithToast({ text, label }) {
  const [copied, copy] = useCopyToClipboard();
  const [showToast, setShowToast] = useState(false);
  
  useEffect(() => {
    if (copied === text) {
      setShowToast(true);
      const timer = setTimeout(() => setShowToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [copied, text]);
  
  return (
    <>
      <button onClick={() => copy(text)}>
        Copy {label}
      </button>
      {showToast && (
        <div className="toast">
          ✓ {label} copied to clipboard!
        </div>
      )}
    </>
  );
}
```

### Copy JSON Data

```tsx
function JsonViewer({ data }) {
  const [copied, copy] = useCopyToClipboard();
  const jsonString = JSON.stringify(data, null, 2);
  
  return (
    <div>
      <pre>{jsonString}</pre>
      <button onClick={() => copy(jsonString)}>
        {copied === jsonString ? '✓ Copied JSON' : '📋 Copy JSON'}
      </button>
    </div>
  );
}
```

### Copy Table Data

```tsx
function DataTable({ rows }) {
  const [copied, copy] = useCopyToClipboard();
  
  const copyRow = (row: any) => {
    const text = Object.values(row).join('\t');
    copy(text);
  };
  
  const copyAllData = () => {
    const text = rows
      .map(row => Object.values(row).join('\t'))
      .join('\n');
    copy(text);
  };
  
  return (
    <div>
      <button onClick={copyAllData}>
        Copy All Data
      </button>
      <table>
        {rows.map((row, i) => (
          <tr key={i}>
            <td>{row.name}</td>
            <td>{row.value}</td>
            <td>
              <button onClick={() => copyRow(row)}>
                Copy Row
              </button>
            </td>
          </tr>
        ))}
      </table>
    </div>
  );
}
```

### Copy with Formatting

```tsx
function CopyFormatted() {
  const [copied, copy] = useCopyToClipboard();
  
  const copyAsMarkdown = (title: string, content: string) => {
    const markdown = `# ${title}\n\n${content}`;
    copy(markdown);
  };
  
  const copyAsHtml = (title: string, content: string) => {
    const html = `<h1>${title}</h1><p>${content}</p>`;
    copy(html);
  };
  
  return (
    <div>
      <button onClick={() => copyAsMarkdown('Title', 'Content')}>
        Copy as Markdown
      </button>
      <button onClick={() => copyAsHtml('Title', 'Content')}>
        Copy as HTML
      </button>
    </div>
  );
}
```

## Features

- ✅ Modern Clipboard API support
- ✅ Automatic fallback to legacy method
- ✅ Tracks last copied value
- ✅ TypeScript support
- ✅ Works in all browsers
- ✅ Async operation support
- ✅ No external dependencies

## Notes

- Uses `navigator.clipboard.writeText()` when available (modern browsers)
- Falls back to `document.execCommand('copy')` for older browsers
- The `copiedValue` state persists until next copy operation
- Useful for showing "Copied!" feedback in UI
- Works with any string content
- Requires user interaction (button click) to work due to browser security
- May require HTTPS in production for Clipboard API to work
