# useSessionStorage

Hook for managing sessionStorage with React state synchronization. Similar to `useLocalStorage` but data persists only for the browser session (cleared when tab is closed).

## Usage

```tsx
import { useSessionStorage } from 'reactilities';

function ShoppingCart() {
  const [cart, setCart] = useSessionStorage('cart', []);
  
  return (
    <div>
      <p>Items in cart: {cart.length}</p>
    </div>
  );
}
```

## API

### Parameters

- **`key`** (`string`) - The sessionStorage key to manage
- **`initialValue`** (`string`) - Initial value to use if key doesn't exist

### Returns

`[any, (value: string | ((prevValue: string) => string)) => void]` - Array containing:
- **`storedValue`** - Current value from sessionStorage
- **`setValue`** - Function to update the value

## Examples

### Form Data Persistence

```tsx
function MultiStepForm() {
  const [formData, setFormData] = useSessionStorage('form-data', {
    step1: {},
    step2: {},
    step3: {}
  });
  const [currentStep, setCurrentStep] = useSessionStorage('current-step', 1);
  
  return (
    <div>
      <p>Step {currentStep} of 3</p>
      {/* Form persists during session, cleared when tab closes */}
    </div>
  );
}
```

### Checkout Process

```tsx
function Checkout() {
  const [checkoutStep, setCheckoutStep] = useSessionStorage('checkout-step', 1);
  const [shippingInfo, setShippingInfo] = useSessionStorage('shipping', {});
  
  const nextStep = () => {
    setCheckoutStep(step => step + 1);
  };
  
  return (
    <div>
      <h2>Step {checkoutStep}</h2>
      <button onClick={nextStep}>Continue</button>
    </div>
  );
}
```

### Temporary UI State

```tsx
function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useSessionStorage('sidebar-open', true);
  const [selectedTab, setSelectedTab] = useSessionStorage('selected-tab', 'overview');
  
  return (
    <div>
      <button onClick={() => setSidebarOpen(!sidebarOpen)}>
        Toggle Sidebar
      </button>
      {sidebarOpen && <Sidebar />}
    </div>
  );
}
```

### Search Filters

```tsx
function ProductList() {
  const [filters, setFilters] = useSessionStorage('filters', {
    category: 'all',
    priceRange: [0, 1000],
    inStock: false
  });
  
  const updateFilter = (key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  return (
    <div>
      <select 
        value={filters.category}
        onChange={(e) => updateFilter('category', e.target.value)}
      >
        <option value="all">All Categories</option>
        <option value="electronics">Electronics</option>
      </select>
    </div>
  );
}
```

### Wizard State

```tsx
function SetupWizard() {
  const [wizardData, setWizardData] = useSessionStorage('wizard', {
    completed: false,
    steps: {
      account: null,
      profile: null,
      preferences: null
    }
  });
  
  const completeStep = (step: string, data: any) => {
    setWizardData(prev => ({
      ...prev,
      steps: {
        ...prev.steps,
        [step]: data
      }
    }));
  };
  
  return <div>Setup Wizard</div>;
}
```

### Draft Content

```tsx
function BlogEditor() {
  const [draft, setDraft] = useSessionStorage('blog-draft', '');
  const [lastSaved, setLastSaved] = useSessionStorage('last-saved', null);
  
  const saveDraft = (content: string) => {
    setDraft(content);
    setLastSaved(new Date().toISOString());
  };
  
  return (
    <div>
      <textarea 
        value={draft}
        onChange={(e) => saveDraft(e.target.value)}
      />
      {lastSaved && <p>Last saved: {lastSaved}</p>}
    </div>
  );
}
```

## Features

- ✅ Session-only persistence (cleared when tab closes)
- ✅ Automatic JSON serialization/deserialization
- ✅ Functional updates support
- ✅ TypeScript support
- ✅ SSR-safe (throws error on server)
- ✅ Handles sessionStorage errors gracefully

## Notes

- Data persists only for the current browser session
- Cleared when the browser tab is closed
- Not shared across tabs (unlike localStorage)
- Values are automatically serialized to JSON
- Setting value to `null` or `undefined` removes the item
- If sessionStorage is unavailable, errors are logged to console
- Perfect for temporary data like form drafts, wizard state, or UI preferences

## Differences from useLocalStorage

| Feature | useLocalStorage | useSessionStorage |
|---------|----------------|-------------------|
| Persistence | Permanent (until cleared) | Session only |
| Cross-tab sync | ✅ Yes | ❌ No |
| Survives tab close | ✅ Yes | ❌ No |
| Use case | Long-term preferences | Temporary session data |
