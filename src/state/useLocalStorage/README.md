# useLocalStorage

Hook for managing localStorage with React state synchronization. Automatically syncs with localStorage changes across tabs/windows and provides a setState-like interface with JSON serialization.

## Usage

```tsx
import { useLocalStorage } from 'reactilities';

function UserPreferences() {
  const [theme, setTheme] = useLocalStorage('theme', 'light');
  
  return (
    <select value={theme} onChange={(e) => setTheme(e.target.value)}>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  );
}
```

## API

### Parameters

- **`key`** (`string`) - The localStorage key to manage
- **`initialValue`** (`T`) - Initial value to use if key doesn't exist in localStorage

### Returns

`[T, (value: T | ((prevValue: T) => T) | null | undefined) => void]` - Array containing:
- **`storedValue`** - Current value from localStorage
- **`setValue`** - Function to update the value (supports functional updates)

## Examples

### Basic Usage

```tsx
function App() {
  const [user, setUser] = useLocalStorage('user', { name: '', email: '' });
  
  return (
    <div>
      <input 
        value={user.name}
        onChange={(e) => setUser({ ...user, name: e.target.value })}
      />
    </div>
  );
}
```

### Functional Updates

```tsx
function Counter() {
  const [count, setCount] = useLocalStorage('count', 0);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(c => c + 1)}>Increment</button>
      <button onClick={() => setCount(c => c - 1)}>Decrement</button>
    </div>
  );
}
```

### Complex Objects

```tsx
function Settings() {
  const [settings, setSettings] = useLocalStorage('settings', {
    notifications: true,
    theme: 'light',
    language: 'en',
    fontSize: 14
  });
  
  const toggleNotifications = () => {
    setSettings(prev => ({
      ...prev,
      notifications: !prev.notifications
    }));
  };
  
  return (
    <div>
      <label>
        <input 
          type="checkbox"
          checked={settings.notifications}
          onChange={toggleNotifications}
        />
        Enable Notifications
      </label>
    </div>
  );
}
```

### Removing Values

```tsx
function AuthToken() {
  const [token, setToken] = useLocalStorage<string | null>('auth-token', null);
  
  const login = (newToken: string) => {
    setToken(newToken);
  };
  
  const logout = () => {
    setToken(null); // Removes from localStorage
  };
  
  return (
    <div>
      {token ? (
        <button onClick={logout}>Logout</button>
      ) : (
        <button onClick={() => login('abc123')}>Login</button>
      )}
    </div>
  );
}
```

### Cross-Tab Synchronization

```tsx
function SyncedCounter() {
  const [count, setCount] = useLocalStorage('shared-count', 0);
  
  // Changes in one tab automatically reflect in other tabs
  return (
    <div>
      <p>Shared Count: {count}</p>
      <button onClick={() => setCount(c => c + 1)}>+1</button>
      <p>Open this page in multiple tabs to see sync!</p>
    </div>
  );
}
```

### Array Data

```tsx
function TodoList() {
  const [todos, setTodos] = useLocalStorage<string[]>('todos', []);
  const [input, setInput] = useState('');
  
  const addTodo = () => {
    setTodos(prev => [...prev, input]);
    setInput('');
  };
  
  const removeTodo = (index: number) => {
    setTodos(prev => prev.filter((_, i) => i !== index));
  };
  
  return (
    <div>
      <input value={input} onChange={(e) => setInput(e.target.value)} />
      <button onClick={addTodo}>Add</button>
      <ul>
        {todos.map((todo, i) => (
          <li key={i}>
            {todo}
            <button onClick={() => removeTodo(i)}>×</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## Features

- ✅ Automatic JSON serialization/deserialization
- ✅ Cross-tab synchronization
- ✅ Functional updates support
- ✅ TypeScript generics support
- ✅ SSR-safe (throws error on server)
- ✅ Automatic cleanup
- ✅ Handles localStorage errors gracefully

## Notes

- Values are automatically serialized to JSON when stored
- Setting value to `null` or `undefined` removes the item from localStorage
- Changes in one tab/window automatically sync to other tabs/windows
- If localStorage is unavailable or quota is exceeded, errors are logged to console
- Initial value is used if the key doesn't exist in localStorage
- Supports all JSON-serializable types
