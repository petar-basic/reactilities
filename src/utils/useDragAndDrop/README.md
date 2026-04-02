# useDragAndDrop

Hook for handling file drag-and-drop with built-in validation. Returns prop getters for the drop zone element and tracks dragging state, dropped files, and validation errors. Supports file type, count, and size restrictions.

## Usage

```tsx
import { useDragAndDrop } from 'reactilities';

function DropZone() {
  const { isDragging, files, getRootProps } = useDragAndDrop({
    accept: ['image/jpeg', 'image/png'],
    maxFiles: 5,
    onDrop: (files) => uploadFiles(files)
  });

  return (
    <div
      {...getRootProps()}
      style={{ border: isDragging ? '2px solid blue' : '2px dashed gray' }}
    >
      {files.length ? files.map(f => <p key={f.name}>{f.name}</p>) : 'Drop files here'}
    </div>
  );
}
```

## API

### Parameters

- **`options.accept`** (`string[]`) - Allowed MIME types or file extensions, e.g. `['image/png', '.pdf']`
- **`options.maxFiles`** (`number`) - Maximum number of files per drop
- **`options.maxSize`** (`number`) - Maximum file size in bytes per file
- **`options.onDrop`** (`(files: File[]) => void`) - Called with validated files after a successful drop
- **`options.onError`** (`(error: Error) => void`) - Called when validation fails

### Returns

| Property | Type | Description |
|---|---|---|
| `isDragging` | `boolean` | Whether files are currently being dragged over the zone |
| `files` | `File[]` | List of accepted files from the last drop |
| `error` | `Error \| null` | Validation error from the last drop |
| `getRootProps` | `() => DragAndDropRootProps` | Returns event handler props to spread onto the drop zone |
| `reset` | `() => void` | Clear files, error, and dragging state |

## Examples

### Image uploader with preview

```tsx
function ImageUploader() {
  const { isDragging, files, error, getRootProps, reset } = useDragAndDrop({
    accept: ['image/jpeg', 'image/png', 'image/gif'],
    maxFiles: 3,
    maxSize: 5 * 1024 * 1024, // 5 MB
    onDrop: (files) => handleUpload(files)
  });

  return (
    <div>
      <div
        {...getRootProps()}
        className={`drop-zone ${isDragging ? 'dragging' : ''}`}
      >
        <p>Drag images here or click to browse</p>
        {isDragging && <p>Release to drop!</p>}
      </div>

      {error && <p className="error">{error.message}</p>}

      <div className="previews">
        {files.map(file => (
          <img key={file.name} src={URL.createObjectURL(file)} alt={file.name} />
        ))}
      </div>

      {files.length > 0 && <button onClick={reset}>Clear</button>}
    </div>
  );
}
```

### Document drop zone (no restrictions)

```tsx
function DocumentDropZone() {
  const { isDragging, files, getRootProps } = useDragAndDrop();

  return (
    <div
      {...getRootProps()}
      style={{
        padding: 40,
        background: isDragging ? '#e8f4ff' : '#f5f5f5',
        border: '2px dashed #ccc'
      }}
    >
      {files.length > 0
        ? <ul>{files.map(f => <li key={f.name}>{f.name} ({f.size} bytes)</li>)}</ul>
        : <p>Drop any file here</p>
      }
    </div>
  );
}
```

### Single PDF upload

```tsx
function PDFUpload({ onUpload }: { onUpload: (file: File) => void }) {
  const { isDragging, files, error, getRootProps } = useDragAndDrop({
    accept: ['.pdf', 'application/pdf'],
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10 MB
    onDrop: ([file]) => onUpload(file)
  });

  return (
    <label
      {...getRootProps()}
      className={`pdf-drop ${isDragging ? 'active' : ''}`}
    >
      {files[0]?.name ?? 'Drop a PDF here'}
      {error && <span className="error">{error.message}</span>}
    </label>
  );
}
```

## Features

- ✅ Tracks drag state accurately even when dragging over child elements (via counter)
- ✅ Validates file type, count, and size before accepting
- ✅ `onDrop` and `onError` callbacks stored in refs — safe to pass inline
- ✅ `getRootProps()` pattern — spreads cleanly onto any element
- ✅ `reset()` clears all state for reuse
- ✅ Zero external dependencies

## Notes

- The drag counter approach prevents the `isDragging` flickering that occurs when dragging over child elements
- Validation runs in order: count → size → type. The first failing check sets the error.
- Files from failed drops are not stored in `files` — only validated drops populate it
- Call `getRootProps()` fresh each render (do not destructure and cache)
