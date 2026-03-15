# useList

Hook for managing array state with a rich set of immutable operations. All mutations produce new array references, ensuring React re-renders correctly.

## Usage

```tsx
import { useList } from 'reactilities';

function TodoList() {
  const { list, push, removeAt, updateAt } = useList<string>([]);

  return (
    <div>
      <button onClick={() => push('New todo')}>Add</button>
      <ul>
        {list.map((item, i) => (
          <li key={i}>
            {item}
            <button onClick={() => removeAt(i)}>Remove</button>
            <button onClick={() => updateAt(i, item + ' ✓')}>Done</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## API

### Parameters

- **`initialList`** (`T[]`, optional) — initial array value, defaults to `[]`

### Returns

| Property   | Type                                              | Description                                  |
|------------|---------------------------------------------------|----------------------------------------------|
| `list`     | `T[]`                                             | Current array state                          |
| `set`      | `(list: T[]) => void`                             | Replace the entire list                      |
| `push`     | `(...items: T[]) => void`                         | Append one or more items to the end          |
| `removeAt` | `(index: number) => void`                         | Remove the item at the given index           |
| `insertAt` | `(index: number, item: T) => void`                | Insert an item at the given index            |
| `updateAt` | `(index: number, item: T) => void`                | Replace the item at the given index          |
| `filter`   | `(predicate: (item: T, index: number) => boolean) => void` | Keep only items passing the predicate |
| `sort`     | `(compareFn?: (a: T, b: T) => number) => void`    | Sort the list (returns a new sorted array)   |
| `clear`    | `() => void`                                      | Empty the list                               |

## Examples

### Shopping cart

```tsx
interface CartItem { id: number; name: string; qty: number }

function Cart() {
  const { list, push, removeAt, updateAt } = useList<CartItem>([]);

  const addItem = (item: CartItem) => push(item);

  const updateQty = (index: number, qty: number) =>
    updateAt(index, { ...list[index], qty });

  return (
    <ul>
      {list.map((item, i) => (
        <li key={item.id}>
          {item.name} × {item.qty}
          <button onClick={() => updateQty(i, item.qty + 1)}>+</button>
          <button onClick={() => removeAt(i)}>Remove</button>
        </li>
      ))}
    </ul>
  );
}
```

### Sorted leaderboard

```tsx
function Leaderboard() {
  const { list, push, sort } = useList<{ name: string; score: number }>([]);

  const addScore = (name: string, score: number) => {
    push({ name, score });
    sort((a, b) => b.score - a.score);
  };

  return (
    <ol>
      {list.map((entry, i) => (
        <li key={i}>{entry.name}: {entry.score}</li>
      ))}
    </ol>
  );
}
```

### Filter completed tasks

```tsx
function TaskManager() {
  const { list: tasks, push, filter } = useList<{ text: string; done: boolean }>([]);

  return (
    <div>
      <button onClick={() => push({ text: 'New task', done: false })}>Add</button>
      <button onClick={() => filter(t => !t.done)}>Remove completed</button>
      <ul>
        {tasks.map((task, i) => <li key={i}>{task.text}</li>)}
      </ul>
    </div>
  );
}
```

## Features

- All operations are immutable — each mutation returns a new array reference
- `push` accepts multiple items: `push(a, b, c)`
- `sort` does not mutate the existing array — it creates a sorted copy
- All callbacks are stable (`useCallback`) — safe to pass as props without `useMemo`
