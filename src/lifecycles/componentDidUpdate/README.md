# componentDidUpdate

Hook that mimics the `componentDidUpdate` lifecycle method from class components. Runs a function after every render (including the first one).

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

- **`fn`** (`() => void`) - Function to run after every render

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

- ✅ Runs after every render
- ✅ Class component lifecycle equivalent
- ✅ TypeScript support
- ✅ Includes first render

## Notes

- Function runs after every render (including mount)
- Equivalent to `useEffect(() => { ... })` (no dependency array)
- Runs on mount AND updates
- Use with caution - can cause performance issues if not careful
- Consider using `useEffect` with dependencies for more control
