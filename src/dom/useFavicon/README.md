# useFavicon

Hook for dynamically setting the website favicon. Creates or updates the favicon link element in the document head.

## Usage

```tsx
import { useFavicon } from 'reactilities';

function App() {
  useFavicon('/favicon.ico');
  
  return <div>My App</div>;
}
```

## API

### Parameters

- **`url`** (`string`) - URL or path to the favicon image

### Returns

`void`

## Examples

### Static Favicon

```tsx
function App() {
  useFavicon('/assets/favicon.ico');
  
  return <h1>My Application</h1>;
}
```

### Dynamic Favicon Based on State

```tsx
function App() {
  const [isOnline, setIsOnline] = useState(true);
  
  useFavicon(
    isOnline 
      ? '/favicon-online.ico' 
      : '/favicon-offline.ico'
  );
  
  return (
    <div>
      Status: {isOnline ? 'Online' : 'Offline'}
    </div>
  );
}
```

### Notification Badge Favicon

```tsx
function Notifications() {
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Generate favicon with badge
  const faviconUrl = useMemo(() => {
    if (unreadCount === 0) return '/favicon.ico';
    
    // Create canvas with badge
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    
    // Draw red circle with count
    ctx.fillStyle = 'red';
    ctx.arc(24, 8, 8, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = 'white';
    ctx.font = 'bold 10px Arial';
    ctx.fillText(String(unreadCount), 20, 12);
    
    return canvas.toDataURL();
  }, [unreadCount]);
  
  useFavicon(faviconUrl);
  
  return <div>{unreadCount} notifications</div>;
}
```

### SVG Favicon

```tsx
function ThemedApp() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  const svgFavicon = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="40" fill="${theme === 'light' ? '#fff' : '#000'}" />
    <text x="50" y="50" text-anchor="middle" dy=".3em" font-size="40">${theme === 'light' ? '☀️' : '🌙'}</text>
  </svg>`;
  
  useFavicon(svgFavicon);
  
  return (
    <button onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}>
      Toggle Theme
    </button>
  );
}
```

### Animated Favicon

```tsx
function LoadingIndicator() {
  const [frame, setFrame] = useState(0);
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  
  useEffect(() => {
    const interval = setInterval(() => {
      setFrame(f => (f + 1) % frames.length);
    }, 100);
    return () => clearInterval(interval);
  }, []);
  
  const animatedFavicon = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <text x="50" y="50" text-anchor="middle" dy=".3em" font-size="60">${frames[frame]}</text>
  </svg>`;
  
  useFavicon(animatedFavicon);
  
  return <div>Loading...</div>;
}
```

## Features

- ✅ Dynamically updates favicon
- ✅ Creates link element if it doesn't exist
- ✅ Supports image files (ico, png, svg)
- ✅ Supports data URLs
- ✅ TypeScript support
- ✅ Automatic cleanup

## Notes

- If no favicon link exists, one will be created
- Supports all image formats browsers support for favicons
- Changes are immediate and visible in the browser tab
- Works with relative and absolute URLs
- Can use data URLs for dynamic/generated favicons
