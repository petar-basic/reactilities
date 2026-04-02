# useAutoSave

Hook for automatically saving data after a debounce delay. Tracks save status (`idle`, `pending`, `saving`, `saved`, `error`) and the timestamp of the last successful save. Useful for text editors, notes, and any form with draft auto-save behavior.

## Usage

```tsx
import { useAutoSave } from 'reactilities';

function NoteEditor() {
  const [content, setContent] = useState('');

  const { status, lastSavedAt } = useAutoSave({
    data: content,
    onSave: (text) => api.saveNote(noteId, text),
    delay: 1500
  });

  return (
    <>
      <textarea value={content} onChange={(e) => setContent(e.target.value)} />
      <span>{status === 'saved' ? `Saved ${lastSavedAt?.toLocaleTimeString()}` : status}</span>
    </>
  );
}
```

## API

### Parameters

- **`options.data`** (`T`) - The data to watch and save whenever it changes
- **`options.onSave`** (`(data: T) => Promise<void> | void`) - Function called to persist the data
- **`options.delay`** (`number`) - Debounce delay in milliseconds before auto-saving (default: `2000`)

### Returns

| Property | Type | Description |
|---|---|---|
| `status` | `'idle' \| 'pending' \| 'saving' \| 'saved' \| 'error'` | Current save lifecycle status |
| `lastSavedAt` | `Date \| null` | Timestamp of the last successful save |
| `save` | `() => Promise<void>` | Trigger a save immediately, bypassing the debounce |

### Status Values

| Status | Meaning |
|---|---|
| `idle` | No changes detected since the last save (initial state) |
| `pending` | Data has changed and the debounce timer is counting down |
| `saving` | The `onSave` function is currently executing |
| `saved` | The last save completed successfully |
| `error` | The last save threw an error |

## Examples

### Document editor with save indicator

```tsx
function DocumentEditor({ docId }: { docId: string }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const { status } = useAutoSave({
    data: { title, body },
    onSave: (doc) => api.updateDocument(docId, doc),
    delay: 2000
  });

  const statusLabel = {
    idle: '',
    pending: 'Unsaved changes',
    saving: 'Saving...',
    saved: 'Saved',
    error: 'Save failed'
  }[status];

  return (
    <div>
      <header>
        <input value={title} onChange={(e) => setTitle(e.target.value)} />
        <span className="save-status">{statusLabel}</span>
      </header>
      <textarea value={body} onChange={(e) => setBody(e.target.value)} />
    </div>
  );
}
```

### Manual save with Ctrl+S

```tsx
function CodeEditor({ fileId }: { fileId: string }) {
  const [code, setCode] = useState('');

  const { status, save } = useAutoSave({
    data: code,
    onSave: (src) => api.saveFile(fileId, src),
    delay: 3000
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        save();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [save]);

  return (
    <div>
      <textarea value={code} onChange={(e) => setCode(e.target.value)} />
      <span>{status}</span>
    </div>
  );
}
```

### Profile settings form

```tsx
function ProfileSettings() {
  const [profile, setProfile] = useObjectState({ name: '', bio: '', website: '' });

  const { status, lastSavedAt } = useAutoSave({
    data: profile,
    onSave: (data) => api.updateProfile(data),
    delay: 1000
  });

  return (
    <form>
      <input value={profile.name} onChange={(e) => setProfile({ name: e.target.value })} />
      <textarea value={profile.bio} onChange={(e) => setProfile({ bio: e.target.value })} />
      {lastSavedAt && <small>Last saved at {lastSavedAt.toLocaleTimeString()}</small>}
      {status === 'error' && <p className="error">Failed to save. Check your connection.</p>}
    </form>
  );
}
```

## Features

- ✅ Debounced auto-save triggered by data changes
- ✅ Fine-grained status: `idle`, `pending`, `saving`, `saved`, `error`
- ✅ Timestamp of last successful save
- ✅ Manual `save()` function to bypass the debounce
- ✅ Skips auto-save on initial mount (only saves on changes)
- ✅ Always calls the latest `onSave` — no stale closure issues

## Notes

- Auto-save does **not** fire on initial mount — only when `data` changes after mount
- The `save` function returned is stable and safe to use in keyboard event handlers or dependency arrays
- If `onSave` throws, `status` is set to `'error'`; errors are not rethrown by the hook
