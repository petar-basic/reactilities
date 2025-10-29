# useThrottle

Hook for throttling rapidly changing values. Limits the rate at which the returned value can update. Useful for scroll events, resize handlers, and performance optimization.

## Usage

```tsx
import { useThrottle } from 'reactilities';

function ScrollTracker() {
  const [scrollY, setScrollY] = useState(0);
  const throttledScrollY = useThrottle(scrollY, 100);
  
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  return <div>Scroll position: {throttledScrollY}px</div>;
}
```

## API

### Parameters

- **`value`** (`T`) - The value to throttle
- **`interval`** (`number`, optional) - Minimum time in milliseconds between updates (default: 500ms)

### Returns

`T` - The throttled value

## Examples

### Scroll Position Tracking

```tsx
function ScrollIndicator() {
  const [scrollY, setScrollY] = useState(0);
  const throttledScroll = useThrottle(scrollY, 100);
  
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const scrollPercentage = (throttledScroll / document.body.scrollHeight) * 100;
  
  return (
    <div className="scroll-indicator">
      <div 
        className="progress-bar" 
        style={{ width: `${scrollPercentage}%` }}
      />
    </div>
  );
}
```

### Mouse Position Tracking

```tsx
function MouseTracker() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const throttledPos = useThrottle(mousePos, 50);
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  
  return (
    <div>
      Mouse: {throttledPos.x}, {throttledPos.y}
    </div>
  );
}
```

### Window Resize Handler

```tsx
function ResponsiveLayout() {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const throttledWidth = useThrottle(windowWidth, 200);
  
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const isMobile = throttledWidth < 768;
  
  return (
    <div>
      {isMobile ? <MobileLayout /> : <DesktopLayout />}
    </div>
  );
}
```

### Infinite Scroll

```tsx
function InfiniteScroll() {
  const [scrollPos, setScrollPos] = useState(0);
  const throttledScroll = useThrottle(scrollPos, 300);
  
  useEffect(() => {
    const handleScroll = () => {
      const position = window.scrollY + window.innerHeight;
      setScrollPos(position);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  useEffect(() => {
    const nearBottom = throttledScroll >= document.body.scrollHeight - 100;
    if (nearBottom) {
      loadMoreItems();
    }
  }, [throttledScroll]);
  
  return <div>Content...</div>;
}
```

### Drag and Drop

```tsx
function DraggableElement() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const throttledPosition = useThrottle(position, 16); // ~60fps
  
  const handleDrag = (e: React.DragEvent) => {
    setPosition({ x: e.clientX, y: e.clientY });
  };
  
  return (
    <div
      draggable
      onDrag={handleDrag}
      style={{
        transform: `translate(${throttledPosition.x}px, ${throttledPosition.y}px)`
      }}
    >
      Drag me
    </div>
  );
}
```

### Search with Rate Limiting

```tsx
function ThrottledSearch() {
  const [query, setQuery] = useState('');
  const throttledQuery = useThrottle(query, 500);
  
  useEffect(() => {
    if (throttledQuery) {
      // API call happens at most once every 500ms
      searchAPI(throttledQuery);
    }
  }, [throttledQuery]);
  
  return (
    <input
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Search (throttled)..."
    />
  );
}
```

### Animation Frame Updates

```tsx
function AnimationTracker() {
  const [frameCount, setFrameCount] = useState(0);
  const throttledCount = useThrottle(frameCount, 1000);
  
  useEffect(() => {
    let animationId: number;
    
    const animate = () => {
      setFrameCount(c => c + 1);
      animationId = requestAnimationFrame(animate);
    };
    
    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, []);
  
  return (
    <div>
      FPS: {throttledCount} (updates every second)
    </div>
  );
}
```

## Features

- ✅ Limits update frequency
- ✅ Ensures minimum time between updates
- ✅ TypeScript generics support
- ✅ Configurable interval
- ✅ Automatic cleanup
- ✅ Performance optimization

## Notes

- Updates happen at most once per interval period
- First update happens immediately
- Subsequent updates are throttled
- Different from debounce - throttle guarantees regular updates
- Perfect for high-frequency events (scroll, mousemove, resize)
- Interval is in milliseconds (e.g., 100 = 10 updates per second max)

## Debounce vs Throttle

| Feature | Debounce | Throttle |
|---------|----------|----------|
| Updates | After inactivity | At regular intervals |
| Use case | Search input | Scroll tracking |
| Behavior | Waits for pause | Limits frequency |
| Example | "Wait until done typing" | "Update max 10x/second" |

## When to Use

- **Scroll events** - Track position without excessive updates
- **Mouse tracking** - Follow cursor at limited rate
- **Window resize** - Handle resize efficiently
- **Drag and drop** - Smooth dragging with performance
- **Animation** - Limit render frequency
- **API calls** - Rate limit requests
