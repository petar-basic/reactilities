# useToggle

Hook for managing boolean toggle state with flexible value setting. Provides a boolean state and a toggle function that can accept explicit values or toggle automatically.

## Usage

```tsx
import { useToggle } from 'reactilities';

function Component() {
  const [isVisible, toggleVisible] = useToggle(false);
  
  return (
    <div>
      <button onClick={() => toggleVisible()}>
        {isVisible ? 'Hide' : 'Show'}
      </button>
      {isVisible && <div>Content</div>}
    </div>
  );
}
```

## API

### Parameters

- **`initialValue`** (`boolean`, optional) - Initial boolean value (default: `true`)

### Returns

`[boolean, (value?: unknown) => void]` - Array containing:
- **`state`** - Current boolean state
- **`toggle`** - Function to toggle state (can accept explicit boolean or toggle automatically)

## Examples

### Basic Toggle

```tsx
function Accordion() {
  const [isOpen, toggle] = useToggle(false);
  
  return (
    <div>
      <button onClick={() => toggle()}>
        {isOpen ? '▼' : '▶'} Click to expand
      </button>
      {isOpen && (
        <div className="content">
          Accordion content here
        </div>
      )}
    </div>
  );
}
```

### Explicit Value Setting

```tsx
function Modal() {
  const [isOpen, setOpen] = useToggle(false);
  
  return (
    <>
      <button onClick={() => setOpen(true)}>Open Modal</button>
      {isOpen && (
        <div className="modal">
          <h2>Modal Title</h2>
          <button onClick={() => setOpen(false)}>Close</button>
          <button onClick={() => setOpen()}>Toggle</button>
        </div>
      )}
    </>
  );
}
```

### Visibility Toggle

```tsx
function PasswordInput() {
  const [showPassword, togglePassword] = useToggle(false);
  
  return (
    <div>
      <input 
        type={showPassword ? 'text' : 'password'}
        placeholder="Enter password"
      />
      <button onClick={() => togglePassword()}>
        {showPassword ? '🙈' : '👁️'}
      </button>
    </div>
  );
}
```

### Multiple Toggles

```tsx
function Settings() {
  const [notifications, toggleNotifications] = useToggle(true);
  const [darkMode, toggleDarkMode] = useToggle(false);
  const [autoSave, toggleAutoSave] = useToggle(true);
  
  return (
    <div>
      <label>
        <input 
          type="checkbox"
          checked={notifications}
          onChange={() => toggleNotifications()}
        />
        Enable Notifications
      </label>
      
      <label>
        <input 
          type="checkbox"
          checked={darkMode}
          onChange={() => toggleDarkMode()}
        />
        Dark Mode
      </label>
      
      <label>
        <input 
          type="checkbox"
          checked={autoSave}
          onChange={() => toggleAutoSave()}
        />
        Auto Save
      </label>
    </div>
  );
}
```

### Dropdown Menu

```tsx
function Dropdown() {
  const [isOpen, setIsOpen] = useToggle(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  useClickOutside(dropdownRef, () => setIsOpen(false));
  
  return (
    <div ref={dropdownRef}>
      <button onClick={() => setIsOpen()}>
        Menu {isOpen ? '▲' : '▼'}
      </button>
      {isOpen && (
        <ul className="dropdown-menu">
          <li onClick={() => setIsOpen(false)}>Option 1</li>
          <li onClick={() => setIsOpen(false)}>Option 2</li>
          <li onClick={() => setIsOpen(false)}>Option 3</li>
        </ul>
      )}
    </div>
  );
}
```

### Sidebar Toggle

```tsx
function Layout() {
  const [sidebarOpen, toggleSidebar] = useToggle(true);
  
  return (
    <div className="layout">
      <button onClick={() => toggleSidebar()}>
        {sidebarOpen ? '◀' : '▶'} Toggle Sidebar
      </button>
      
      <div className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <nav>
          <a href="/dashboard">Dashboard</a>
          <a href="/settings">Settings</a>
        </nav>
      </div>
      
      <main className={sidebarOpen ? 'with-sidebar' : 'full-width'}>
        Content
      </main>
    </div>
  );
}
```

### Loading State

```tsx
function DataFetcher() {
  const [isLoading, setLoading] = useToggle(false);
  const [data, setData] = useState(null);
  
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/data');
      const result = await response.json();
      setData(result);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      <button onClick={fetchData} disabled={isLoading}>
        {isLoading ? 'Loading...' : 'Fetch Data'}
      </button>
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
}
```

## Features

- ✅ Simple boolean state management
- ✅ Toggle without arguments
- ✅ Set explicit true/false values
- ✅ TypeScript support
- ✅ Memoized toggle function
- ✅ Accepts truthy/falsy initial values

## Notes

- Calling `toggle()` without arguments flips the current state
- Calling `toggle(true)` or `toggle(false)` sets explicit value
- Initial value can be any truthy/falsy value, converted to boolean
- Toggle function is memoized and won't cause unnecessary re-renders
- Perfect for UI state like modals, dropdowns, sidebars, etc.
