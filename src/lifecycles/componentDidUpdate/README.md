# componentDidUpdate

Hook that mimics the `componentDidUpdate` lifecycle method from class components. Runs a function after every render **except** the initial mount, just like the class lifecycle method (which only fires on updates).

## Usage

```tsx
import { componentDidUpdate } from 'reactilities';

function Component({ value }) {
  componentDidUpdate(() => {
    console.log('Component updated!', value);
  });
  
  return <div>{value}</div>;
}
```

## API

### Parameters

- **`fn`** (`() => void`) - Function to run after every render except the first

### Returns

`void`

## Examples

### Logging Updates

```tsx
function Counter({ count }) {
  componentDidUpdate(() => {
    console.log('Count updated to:', count);
  });
  
  return <div>Count: {count}</div>;
}
```

### Side Effects on Update

```tsx
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  
  componentDidUpdate(() => {
    if (userId) {
      fetchUser(userId).then(setUser);
    }
  });
  
  return <div>{user?.name}</div>;
}
```

### Analytics Tracking

```tsx
function Page({ pageName }) {
  componentDidUpdate(() => {
    analytics.track('Page Changed', { page: pageName });
  });
  
  return <div>{pageName}</div>;
}
```

## Features

- ✅ Runs after every render except the first
- ✅ Class component lifecycle equivalent
- ✅ TypeScript support
- ✅ Skips the initial mount
- ✅ StrictMode-safe

## Notes

- Function runs after every render **except** the initial mount
- Skips the first render, so it only fires on updates (re-renders)
- StrictMode-safe: the simulated unmount/remount in development does not produce a spurious update call
- Use with caution - can cause performance issues if not careful
- Consider using `useEffect` with dependencies for more control
