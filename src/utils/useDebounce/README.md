# useDebounce

Hook for debouncing rapidly changing values. Delays updating the returned value until after the specified delay period. Useful for search inputs, API calls, and performance optimization.

## Usage

```tsx
import { useDebounce } from 'reactilities';

function SearchComponent() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  
  useEffect(() => {
    if (debouncedSearchTerm) {
      searchAPI(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm]);
  
  return (
    <input
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="Search..."
    />
  );
}
```

## API

### Parameters

- **`value`** (`T`) - The value to debounce
- **`delay`** (`number`) - Delay in milliseconds before updating the debounced value

### Returns

`T` - The debounced value

## Examples

### Search Input

```tsx
function SearchBar() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const [results, setResults] = useState([]);
  
  useEffect(() => {
    if (debouncedQuery) {
      fetch(`/api/search?q=${debouncedQuery}`)
        .then(res => res.json())
        .then(setResults);
    }
  }, [debouncedQuery]);
  
  return (
    <div>
      <input 
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search products..."
      />
      <ul>
        {results.map(item => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

### Form Validation

```tsx
function EmailInput() {
  const [email, setEmail] = useState('');
  const debouncedEmail = useDebounce(email, 500);
  const [isValid, setIsValid] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  
  useEffect(() => {
    if (debouncedEmail) {
      setIsChecking(true);
      validateEmail(debouncedEmail)
        .then(setIsValid)
        .finally(() => setIsChecking(false));
    }
  }, [debouncedEmail]);
  
  return (
    <div>
      <input 
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      {isChecking && <span>Checking...</span>}
      {!isChecking && debouncedEmail && (
        <span>{isValid ? '✓ Valid' : '✗ Invalid'}</span>
      )}
    </div>
  );
}
```

### Auto-Save

```tsx
function Editor() {
  const [content, setContent] = useState('');
  const debouncedContent = useDebounce(content, 1000);
  
  useEffect(() => {
    if (debouncedContent) {
      // Auto-save after 1 second of no typing
      saveToServer(debouncedContent);
    }
  }, [debouncedContent]);
  
  return (
    <textarea
      value={content}
      onChange={(e) => setContent(e.target.value)}
      placeholder="Start typing... (auto-saves)"
    />
  );
}
```

### Window Resize

```tsx
function ResponsiveComponent() {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });
  const debouncedSize = useDebounce(windowSize, 250);
  
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return (
    <div>
      Window size: {debouncedSize.width} x {debouncedSize.height}
    </div>
  );
}
```

### Filter Results

```tsx
function ProductFilter() {
  const [filters, setFilters] = useState({
    minPrice: 0,
    maxPrice: 1000,
    category: 'all'
  });
  const debouncedFilters = useDebounce(filters, 400);
  
  useEffect(() => {
    fetchProducts(debouncedFilters).then(setProducts);
  }, [debouncedFilters]);
  
  return (
    <div>
      <input 
        type="range"
        value={filters.minPrice}
        onChange={(e) => setFilters(f => ({ 
          ...f, 
          minPrice: Number(e.target.value) 
        }))}
      />
      <select 
        value={filters.category}
        onChange={(e) => setFilters(f => ({ 
          ...f, 
          category: e.target.value 
        }))}
      >
        <option value="all">All</option>
        <option value="electronics">Electronics</option>
      </select>
    </div>
  );
}
```

### API Rate Limiting

```tsx
function LivePreview() {
  const [code, setCode] = useState('');
  const debouncedCode = useDebounce(code, 800);
  const [preview, setPreview] = useState('');
  
  useEffect(() => {
    // Compile/render code only after user stops typing
    if (debouncedCode) {
      compileCode(debouncedCode)
        .then(setPreview)
        .catch(err => setPreview(`Error: ${err.message}`));
    }
  }, [debouncedCode]);
  
  return (
    <div className="split-view">
      <textarea 
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Enter code..."
      />
      <div className="preview">
        {preview}
      </div>
    </div>
  );
}
```

## Features

- ✅ Delays value updates until user stops changing it
- ✅ Prevents excessive API calls
- ✅ Improves performance
- ✅ TypeScript generics support
- ✅ Automatic cleanup
- ✅ Configurable delay

## Notes

- The debounced value updates only after the delay period has passed without changes
- Each value change resets the timer
- Perfect for search inputs, form validation, and API calls
- Helps reduce unnecessary renders and network requests
- The delay is in milliseconds (e.g., 500 = 0.5 seconds)
- Timer is automatically cleared on unmount

## When to Use

- **Search inputs** - Wait for user to finish typing before searching
- **Form validation** - Validate after user stops typing
- **Auto-save** - Save draft after inactivity period
- **API calls** - Reduce number of requests
- **Window resize** - Handle resize events efficiently
- **Filter updates** - Apply filters after user finishes adjusting
