# useBoolean

Hook for managing boolean state with explicit named controls. Cleaner than a plain `useState(false)` when you only need true/false semantics.

## Usage

```tsx
import { useBoolean } from 'reactilities';

function Modal() {
  const { value: isOpen, setTrue: open, setFalse: close } = useBoolean(false);

  return (
    <>
      <button onClick={open}>Open</button>
      {isOpen && (
        <dialog open>
          <p>Hello!</p>
          <button onClick={close}>Close</button>
        </dialog>
      )}
    </>
  );
}
```

## API

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `initialValue` | `boolean` | `false` | Starting value |

### Returns

| Property | Type | Description |
|----------|------|-------------|
| `value` | `boolean` | Current boolean value |
| `setTrue` | `() => void` | Set value to `true` |
| `setFalse` | `() => void` | Set value to `false` |
| `toggle` | `() => void` | Flip current value |
| `set` | `(value: boolean) => void` | Set an explicit value |

All functions have stable references via `useCallback`.

## Examples

### Loading State

```tsx
const { value: isLoading, setTrue: startLoading, setFalse: stopLoading } = useBoolean(false);

const handleSubmit = async () => {
  startLoading();
  try {
    await submitForm();
  } finally {
    stopLoading();
  }
};
```

### Sidebar Toggle

```tsx
const { value: isSidebarOpen, toggle } = useBoolean(true);

return (
  <>
    <button onClick={toggle}>{isSidebarOpen ? 'Hide' : 'Show'} sidebar</button>
    {isSidebarOpen && <Sidebar />}
  </>
);
```

## Notes

- Semantically clearer than `const [open, setOpen] = useState(false)` — avoids `setOpen(true)` and `setOpen(false)` scattered everywhere
- Destructure with aliases for self-documenting code: `const { setTrue: openModal, setFalse: closeModal } = useBoolean()`
