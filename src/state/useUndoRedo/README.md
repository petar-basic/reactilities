# useUndoRedo

Hook for managing state with a full undo/redo history. Built on `useReducer` with no external dependencies.

## Usage

```tsx
import { useUndoRedo } from 'reactilities';

function TextEditor() {
  const { state, set, undo, redo, canUndo, canRedo } = useUndoRedo('');

  return (
    <div>
      <div>
        <button onClick={undo} disabled={!canUndo}>↩ Undo</button>
        <button onClick={redo} disabled={!canRedo}>↪ Redo</button>
      </div>
      <textarea
        value={state}
        onChange={(e) => set(e.target.value)}
      />
    </div>
  );
}
```

## API

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `initialState` | `T` | The initial present value |

### Returns

| Property | Type | Description |
|----------|------|-------------|
| `state` | `T` | Current present value |
| `set` | `(value: T) => void` | Set new value (pushes current to history) |
| `undo` | `() => void` | Revert to previous state |
| `redo` | `() => void` | Re-apply undone state |
| `reset` | `(value: T) => void` | Reset to a new value and clear all history |
| `canUndo` | `boolean` | Whether there is past history to undo |
| `canRedo` | `boolean` | Whether there is future history to redo |
| `past` | `T[]` | Array of past states (oldest first) |
| `future` | `T[]` | Array of future states (next first) |

All callback functions (`set`, `undo`, `redo`, `reset`) have stable references via `useCallback`.

## Examples

### Drawing Canvas

```tsx
function Canvas() {
  const { state: strokes, set, undo, canUndo } = useUndoRedo<Stroke[]>([]);

  const addStroke = (stroke: Stroke) => set([...strokes, stroke]);

  return (
    <>
      <button onClick={undo} disabled={!canUndo}>Undo stroke</button>
      <canvas onPointerUp={(e) => addStroke(captureStroke(e))} />
    </>
  );
}
```

### Form State

```tsx
function ProfileForm() {
  const { state, set, undo, canUndo, reset } = useUndoRedo({
    name: '',
    email: '',
    bio: ''
  });

  return (
    <form>
      <input
        value={state.name}
        onChange={(e) => set({ ...state, name: e.target.value })}
      />
      <button type="button" onClick={undo} disabled={!canUndo}>
        Undo last change
      </button>
      <button type="button" onClick={() => reset({ name: '', email: '', bio: '' })}>
        Reset form
      </button>
    </form>
  );
}
```

## Notes

- Calling `set` always clears the redo future
- `reset` clears both past and future — useful for loading saved state
- Works with any serializable type: strings, numbers, objects, arrays
- History grows unboundedly — consider slicing `past` for memory-sensitive apps
