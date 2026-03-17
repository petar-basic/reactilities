# useIsMounted

Returns a stable function that tells you whether the component is currently mounted. Use it to guard async state updates against the "Can't perform a React state update on an unmounted component" scenario.

## Usage

```tsx
import { useIsMounted } from 'reactilities';

function UserCard({ userId }) {
  const isMounted = useIsMounted();
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchUser(userId).then((data) => {
      if (isMounted()) setUser(data);
    });
  }, [userId]);

  return user ? <Profile user={user} /> : <Spinner />;
}
```

## API

### Parameters

None.

### Returns

`() => boolean` — a stable function. Returns `true` while the component is mounted, `false` after it unmounts.

## Examples

### Guarding multiple async operations

```tsx
function Dashboard() {
  const isMounted = useIsMounted();
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    Promise.all([fetchStats(), fetchAlerts()]).then(([s, a]) => {
      if (!isMounted()) return;
      setStats(s);
      setAlerts(a);
    });
  }, []);
}
```

### Manual polling

```tsx
function LiveFeed() {
  const isMounted = useIsMounted();

  useEffect(() => {
    const poll = async () => {
      while (isMounted()) {
        const data = await fetchLatest();
        if (isMounted()) setFeed(data);
        await sleep(5000);
      }
    };
    poll();
  }, []);
}
```

## Notes

- The returned function has a stable reference (via `useCallback`) — safe to include in effect dependency arrays
- Uses a `useRef` internally so checking `isMounted()` never triggers a re-render
- This hook is a building block — the library's own `useAsync` and `useFetch` use this pattern internally
