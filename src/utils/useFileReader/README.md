# useFileReader

Hook for reading `File` objects using the FileReader API. Supports reading files as text, data URLs (base64), or ArrayBuffers. Tracks loading and error state during the read operation.

## Usage

```tsx
import { useFileReader } from 'reactilities';

function ImagePreview() {
  const { result, loading, readAsDataURL } = useFileReader();

  return (
    <>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => e.target.files?.[0] && readAsDataURL(e.target.files[0])}
      />
      {loading && <span>Loading...</span>}
      {result && <img src={result as string} alt="Preview" />}
    </>
  );
}
```

## API

### Returns

| Property | Type | Description |
|---|---|---|
| `result` | `string \| ArrayBuffer \| null` | The file contents after reading |
| `error` | `Error \| null` | Error object if reading failed |
| `loading` | `boolean` | Whether a read is in progress |
| `readAsText` | `(file: File, encoding?: string) => void` | Read file as a UTF-8 (or specified encoding) string |
| `readAsDataURL` | `(file: File) => void` | Read file as a base64 data URL |
| `readAsArrayBuffer` | `(file: File) => void` | Read file as a raw ArrayBuffer |
| `reset` | `() => void` | Clear result, error, and loading state |

## Examples

### Image preview before upload

```tsx
function AvatarUpload() {
  const { result, loading, error, readAsDataURL } = useFileReader();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) readAsDataURL(file);
  };

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleChange} />
      {loading && <Spinner />}
      {error && <p>Failed to load image: {error.message}</p>}
      {result && (
        <img
          src={result as string}
          alt="Preview"
          style={{ width: 120, height: 120, objectFit: 'cover' }}
        />
      )}
    </div>
  );
}
```

### CSV file reader

```tsx
function CSVImport() {
  const { result, loading, readAsText } = useFileReader();

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) readAsText(file);
  };

  useEffect(() => {
    if (result) {
      const rows = parseCSV(result as string);
      importRows(rows);
    }
  }, [result]);

  return (
    <div>
      <input type="file" accept=".csv" onChange={handleFile} />
      {loading && <p>Parsing CSV...</p>}
    </div>
  );
}
```

### Binary file reader

```tsx
function BinaryInspector() {
  const { result, readAsArrayBuffer } = useFileReader();

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) readAsArrayBuffer(file);
  };

  const bytes = result instanceof ArrayBuffer
    ? new Uint8Array(result).slice(0, 16)
    : null;

  return (
    <div>
      <input type="file" onChange={handleFile} />
      {bytes && <pre>Header bytes: {Array.from(bytes).map(b => b.toString(16)).join(' ')}</pre>}
    </div>
  );
}
```

### Reset after processing

```tsx
function FileProcessor() {
  const { result, readAsText, reset } = useFileReader();

  const handleProcess = () => {
    processText(result as string);
    reset(); // Clear for next file
  };

  return (
    <div>
      <input type="file" onChange={(e) => e.target.files?.[0] && readAsText(e.target.files[0])} />
      {result && <button onClick={handleProcess}>Process & Clear</button>}
    </div>
  );
}
```

## Features

- ✅ Supports all three FileReader read modes: text, data URL, and ArrayBuffer
- ✅ Loading and error state tracking
- ✅ Custom text encoding support (e.g. `'UTF-16'`)
- ✅ `reset()` to clear state between reads
- ✅ Zero external dependencies

## Notes

- Each call to a read method starts a fresh read and clears the previous result
- `readAsDataURL` returns a `string` starting with `data:<mimetype>;base64,...`
- `readAsText` defaults to UTF-8 encoding; pass a second argument to override
- `result` is `null` until the read completes
