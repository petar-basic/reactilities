# componentDidMount

Hook that mimics the `componentDidMount` lifecycle method from class components. Runs a function once after the component mounts.

## Usage

```tsx
import { componentDidMount } from 'reactilities';

function Component() {
  componentDidMount(() => {
    console.log('Component mounted!');
    fetchData();
  });
  
  return <div>Content</div>;
}
```

## API

### Parameters

- **`fn`** (`() => void | (() => void)`) - Function to run after component mounts. May optionally return a cleanup function to run on unmount.

### Returns

`void`

## Examples

### Data Fetching

```tsx
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  
  componentDidMount(() => {
    fetchUser(userId).then(setUser);
  });
  
  return user ? <div>{user.name}</div> : <div>Loading...</div>;
}
```

### Analytics

```tsx
function Page() {
  componentDidMount(() => {
    analytics.track('Page Viewed', { page: 'Home' });
  });
  
  return <div>Home Page</div>;
}
```

### Initialization

```tsx
function App() {
  componentDidMount(() => {
    initializeApp();
    loadUserPreferences();
    setupEventListeners();
  });
  
  return <div>App Content</div>;
}
```

## Features

- ✅ Runs once after mount
- ✅ Optional cleanup on unmount (return a function)
- ✅ Class component lifecycle equivalent
- ✅ TypeScript support
- ✅ Simple API

## Examples

### Subscription with cleanup

```tsx
function Clock() {
  componentDidMount(() => {
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  });

  return <div>Clock</div>;
}
```

## Notes

- Function runs only once after initial render
- Equivalent to `useEffect(() => { ...; return cleanup; }, [])`
- Does not run on re-renders
- If the function returns another function, it is treated as the unmount cleanup (same contract as `useEffect`). You can also use `componentWillUnmount` for cleanup.
