# useObjectState

Hook for managing object state with partial updates. Similar to class component `setState` - merges partial updates with existing state. Supports both direct object updates and functional updates.

## Usage

```tsx
import { useObjectState } from 'reactilities';

function UserProfile() {
  const [user, setUser] = useObjectState({
    name: 'John',
    age: 30,
    email: 'john@example.com'
  });
  
  return (
    <div>
      <button onClick={() => setUser({ name: 'Jonathan' })}>
        Update Name
      </button>
    </div>
  );
}
```

## API

### Parameters

- **`initialValue`** (`T extends Record<string, unknown>`) - Initial object state

### Returns

`[T, (update: Partial<T> | ((prevState: T) => Partial<T>)) => void]` - Array containing:
- **`state`** - Current object state
- **`setState`** - Function to update state with partial object or updater function

## Examples

### Basic Partial Updates

```tsx
function Settings() {
  const [settings, setSettings] = useObjectState({
    theme: 'light',
    language: 'en',
    notifications: true,
    fontSize: 14
  });
  
  return (
    <div>
      <button onClick={() => setSettings({ theme: 'dark' })}>
        Dark Mode
      </button>
      <button onClick={() => setSettings({ notifications: false })}>
        Disable Notifications
      </button>
      {/* Other properties remain unchanged */}
    </div>
  );
}
```

### Functional Updates

```tsx
function Counter() {
  const [state, setState] = useObjectState({
    count: 0,
    lastUpdated: Date.now()
  });
  
  const increment = () => {
    setState(s => ({
      count: s.count + 1,
      lastUpdated: Date.now()
    }));
  };
  
  return (
    <div>
      <p>Count: {state.count}</p>
      <button onClick={increment}>+1</button>
    </div>
  );
}
```

### Form State Management

```tsx
function ContactForm() {
  const [formData, setFormData] = useObjectState({
    name: '',
    email: '',
    message: '',
    subscribe: false
  });
  
  const handleChange = (field: string, value: any) => {
    setFormData({ [field]: value });
  };
  
  return (
    <form>
      <input 
        value={formData.name}
        onChange={(e) => handleChange('name', e.target.value)}
        placeholder="Name"
      />
      <input 
        value={formData.email}
        onChange={(e) => handleChange('email', e.target.value)}
        placeholder="Email"
      />
      <textarea 
        value={formData.message}
        onChange={(e) => handleChange('message', e.target.value)}
        placeholder="Message"
      />
      <label>
        <input 
          type="checkbox"
          checked={formData.subscribe}
          onChange={(e) => handleChange('subscribe', e.target.checked)}
        />
        Subscribe to newsletter
      </label>
    </form>
  );
}
```

### Complex State Updates

```tsx
function ShoppingCart() {
  const [cart, setCart] = useObjectState({
    items: [],
    total: 0,
    discount: 0,
    tax: 0
  });
  
  const addItem = (item: any) => {
    setCart(prev => ({
      items: [...prev.items, item],
      total: prev.total + item.price
    }));
  };
  
  const applyDiscount = (amount: number) => {
    setCart({ discount: amount });
  };
  
  return (
    <div>
      <p>Items: {cart.items.length}</p>
      <p>Total: ${cart.total}</p>
      <p>Discount: ${cart.discount}</p>
    </div>
  );
}
```

### Multi-Step Form

```tsx
function MultiStepForm() {
  const [formState, setFormState] = useObjectState({
    step: 1,
    personalInfo: { name: '', email: '' },
    address: { street: '', city: '', zip: '' },
    preferences: { newsletter: false, theme: 'light' }
  });
  
  const nextStep = () => {
    setFormState(s => ({ step: s.step + 1 }));
  };
  
  const updatePersonalInfo = (info: any) => {
    setFormState({ personalInfo: { ...formState.personalInfo, ...info } });
  };
  
  return (
    <div>
      <h2>Step {formState.step}</h2>
      {formState.step === 1 && (
        <div>
          <input 
            value={formState.personalInfo.name}
            onChange={(e) => updatePersonalInfo({ name: e.target.value })}
          />
          <button onClick={nextStep}>Next</button>
        </div>
      )}
    </div>
  );
}
```

### Toggle Multiple Flags

```tsx
function FeatureFlags() {
  const [flags, setFlags] = useObjectState({
    darkMode: false,
    betaFeatures: false,
    analytics: true,
    notifications: true
  });
  
  const toggleFlag = (flag: string) => {
    setFlags(prev => ({ [flag]: !prev[flag] }));
  };
  
  return (
    <div>
      {Object.entries(flags).map(([key, value]) => (
        <label key={key}>
          <input 
            type="checkbox"
            checked={value}
            onChange={() => toggleFlag(key)}
          />
          {key}
        </label>
      ))}
    </div>
  );
}
```

### Pagination State

```tsx
function DataTable() {
  const [pagination, setPagination] = useObjectState({
    page: 1,
    pageSize: 10,
    total: 0,
    sortBy: 'name',
    sortOrder: 'asc'
  });
  
  const nextPage = () => {
    setPagination(p => ({ page: p.page + 1 }));
  };
  
  const changePageSize = (size: number) => {
    setPagination({ pageSize: size, page: 1 });
  };
  
  const sort = (field: string) => {
    setPagination(p => ({
      sortBy: field,
      sortOrder: p.sortBy === field && p.sortOrder === 'asc' ? 'desc' : 'asc'
    }));
  };
  
  return <div>Table with pagination</div>;
}
```

## Features

- ✅ Partial object updates (like class component setState)
- ✅ Functional updates with previous state
- ✅ Type-safe with TypeScript generics
- ✅ Automatic state merging
- ✅ Validates plain objects
- ✅ Memoized setState function

## Notes

- Only updates the properties you specify - other properties remain unchanged
- Supports functional updates: `setState(prev => ({ count: prev.count + 1 }))`
- Non-plain-object updates are ignored (arrays, dates, etc. must be wrapped)
- Perfect for form state, settings, complex UI state
- More convenient than multiple `useState` calls for related data
- Similar API to class component `this.setState()`
