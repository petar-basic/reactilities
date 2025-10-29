# useIntersectionObserver

Hook for detecting when an element enters or exits the viewport using the Intersection Observer API. Perfect for lazy loading, infinite scroll, and animations on scroll.

## Usage

```tsx
import { useIntersectionObserver } from 'reactilities';

function LazyImage({ src }) {
  const ref = useRef(null);
  const isVisible = useIntersectionObserver(ref);
  
  return (
    <div ref={ref}>
      {isVisible && <img src={src} alt="Lazy loaded" />}
    </div>
  );
}
```

## API

### Parameters

- **`ref`** (`RefObject<HTMLElement>`) - React ref pointing to the element to observe
- **`options`** (`IntersectionObserverInit`, optional) - Intersection Observer options

### Returns

`boolean` - `true` if element is intersecting (visible), `false` otherwise

## Examples

### Lazy Loading Images

```tsx
function LazyImage({ src, alt }) {
  const imgRef = useRef(null);
  const isVisible = useIntersectionObserver(imgRef, {
    threshold: 0.1,
    rootMargin: '50px'
  });
  
  return (
    <div ref={imgRef} className="image-container">
      {isVisible ? (
        <img src={src} alt={alt} />
      ) : (
        <div className="placeholder">Loading...</div>
      )}
    </div>
  );
}
```

### Fade In Animation

```tsx
function FadeInSection({ children }) {
  const ref = useRef(null);
  const isVisible = useIntersectionObserver(ref, { threshold: 0.3 });
  
  return (
    <div 
      ref={ref}
      className={`fade-in ${isVisible ? 'visible' : ''}`}
    >
      {children}
    </div>
  );
}
```

### Infinite Scroll

```tsx
function InfiniteList() {
  const [items, setItems] = useState([]);
  const loaderRef = useRef(null);
  const isLoaderVisible = useIntersectionObserver(loaderRef);
  
  useEffect(() => {
    if (isLoaderVisible) {
      loadMoreItems().then(newItems => {
        setItems(prev => [...prev, ...newItems]);
      });
    }
  }, [isLoaderVisible]);
  
  return (
    <div>
      {items.map(item => (
        <div key={item.id}>{item.content}</div>
      ))}
      <div ref={loaderRef}>Loading more...</div>
    </div>
  );
}
```

### Analytics Tracking

```tsx
function TrackableSection({ id, children }) {
  const ref = useRef(null);
  const isVisible = useIntersectionObserver(ref, { threshold: 0.5 });
  
  useEffect(() => {
    if (isVisible) {
      analytics.track('Section Viewed', { sectionId: id });
    }
  }, [isVisible, id]);
  
  return (
    <section ref={ref}>
      {children}
    </section>
  );
}
```

### Video Auto-Play

```tsx
function AutoPlayVideo({ src }) {
  const videoRef = useRef(null);
  const isVisible = useIntersectionObserver(videoRef, { threshold: 0.5 });
  
  useEffect(() => {
    if (videoRef.current) {
      if (isVisible) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  }, [isVisible]);
  
  return <video ref={videoRef} src={src} muted loop />;
}
```

## Features

- ✅ Viewport visibility detection
- ✅ Configurable thresholds
- ✅ Root margin support
- ✅ Automatic cleanup
- ✅ TypeScript support
- ✅ Performance optimized

## Notes

- Uses native Intersection Observer API
- Automatically disconnects observer on unmount
- Supports all Intersection Observer options
- Perfect for lazy loading and scroll animations
- More performant than scroll event listeners
