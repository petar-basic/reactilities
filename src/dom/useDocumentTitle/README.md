# useDocumentTitle

Hook for dynamically setting the document title. Updates the browser tab title whenever the title parameter changes.

## Usage

```tsx
import { useDocumentTitle } from 'reactilities';

function Dashboard() {
  useDocumentTitle('My App - Dashboard');
  
  return <div>Dashboard Content</div>;
}
```

## API

### Parameters

- **`title`** (`string`) - The title to set for the document

### Returns

`void`

## Examples

### Static Title

```tsx
function HomePage() {
  useDocumentTitle('Home - My App');
  
  return <h1>Welcome Home</h1>;
}
```

### Dynamic Title Based on State

```tsx
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  
  useDocumentTitle(user ? `${user.name} - Profile` : 'Loading...');
  
  useEffect(() => {
    fetchUser(userId).then(setUser);
  }, [userId]);
  
  return <div>{user?.name}</div>;
}
```

### Title with Notification Count

```tsx
function Inbox() {
  const [unreadCount, setUnreadCount] = useState(0);
  
  useDocumentTitle(
    unreadCount > 0 
      ? `(${unreadCount}) Inbox - My App` 
      : 'Inbox - My App'
  );
  
  return <div>Inbox with {unreadCount} unread messages</div>;
}
```

### Conditional Title

```tsx
function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  
  useDocumentTitle(isLogin ? 'Login' : 'Sign Up');
  
  return (
    <div>
      <button onClick={() => setIsLogin(!isLogin)}>
        Switch to {isLogin ? 'Sign Up' : 'Login'}
      </button>
    </div>
  );
}
```

## Features

- ✅ Automatically updates document title
- ✅ Syncs with component lifecycle
- ✅ Supports dynamic titles
- ✅ TypeScript support
- ✅ Lightweight and simple

## Notes

- The title updates whenever the `title` parameter changes
- Previous title is not restored when component unmounts
- Works in all modern browsers
