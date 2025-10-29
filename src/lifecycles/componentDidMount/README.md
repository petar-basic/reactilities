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

- **`fn`** (`() => void`) - Function to run after component mounts

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
- ✅ Class component lifecycle equivalent
- ✅ TypeScript support
- ✅ Simple API

## Notes

- Function runs only once after initial render
- Equivalent to `useEffect(() => { ... }, [])`
- Does not run on re-renders
- No cleanup function (use `componentWillUnmount` for cleanup)
