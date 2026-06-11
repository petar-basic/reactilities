# useIntersectionObserver

Hook for detecting when an element enters or exits the viewport using the Intersection Observer API. Perfect for lazy loading, infinite scroll, and animations on scroll.

## Usage

```tsx
import { useIntersectionObserver } from 'reactilities';

function LazyImage({ src }) {
  const { ref, isIntersecting } = useIntersectionObserver<HTMLDivElement>();

  return (
    <div ref={ref}>
      {isIntersecting && <img src={src} alt="Lazy loaded" />}
    </div>
  );
}
```

> Pass the element type as a type argument (e.g. `useIntersectionObserver<HTMLDivElement>()`)
> so the returned `ref` matches the JSX element you attach it to. It defaults to
> `HTMLElement` if omitted.

## API

### Type parameter

- **`T extends HTMLElement = HTMLElement`** - the type of the element you attach `ref` to.

### Parameters

- **`options`** (`IntersectionObserverInit & { freezeOnceVisible?: boolean }`, optional) - native Intersection Observer options plus:
  - **`freezeOnceVisible`** (`boolean`, default `false`) - once the element becomes visible, stop observing and keep the state frozen as visible.

### Returns

An object:

- **`ref`** (`RefObject<T | null>`) - attach to the element you want to observe.
- **`isIntersecting`** (`boolean`) - `true` while the element is intersecting (visible).
- **`entry`** (`IntersectionObserverEntry | null`) - the latest observer entry, or `null` before the first event.

## Examples

### Lazy Loading Images

```tsx
function LazyImage({ src, alt }) {
  const { ref, isIntersecting } = useIntersectionObserver<HTMLDivElement>({
    threshold: 0.1,
    rootMargin: '50px',
  });

  return (
    <div ref={ref} className="image-container">
      {isIntersecting ? (
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
  const { ref, isIntersecting } = useIntersectionObserver<HTMLDivElement>({
    threshold: 0.3,
    freezeOnceVisible: true,
  });

  return (
    <div ref={ref} className={`fade-in ${isIntersecting ? 'visible' : ''}`}>
      {children}
    </div>
  );
}
```

### Infinite Scroll

```tsx
function InfiniteList() {
  const [items, setItems] = useState([]);
  const { ref, isIntersecting } = useIntersectionObserver<HTMLDivElement>();

  useEffect(() => {
    if (isIntersecting) {
      loadMoreItems().then((newItems) => {
        setItems((prev) => [...prev, ...newItems]);
      });
    }
  }, [isIntersecting]);

  return (
    <div>
      {items.map((item) => (
        <div key={item.id}>{item.content}</div>
      ))}
      <div ref={ref}>Loading more...</div>
    </div>
  );
}
```

### Analytics Tracking

```tsx
function TrackableSection({ id, children }) {
  const { ref, isIntersecting } = useIntersectionObserver<HTMLElement>({
    threshold: 0.5,
  });

  useEffect(() => {
    if (isIntersecting) {
      analytics.track('Section Viewed', { sectionId: id });
    }
  }, [isIntersecting, id]);

  return <section ref={ref}>{children}</section>;
}
```

### Video Auto-Play

```tsx
function AutoPlayVideo({ src }) {
  const { ref, isIntersecting } = useIntersectionObserver<HTMLVideoElement>({
    threshold: 0.5,
  });

  useEffect(() => {
    if (!ref.current) return;
    if (isIntersecting) {
      ref.current.play();
    } else {
      ref.current.pause();
    }
  }, [isIntersecting]);

  return <video ref={ref} src={src} muted loop />;
}
```

## Features

- ✅ Viewport visibility detection
- ✅ Configurable thresholds (including inline arrays like `[0, 0.5, 1]` without re-render churn)
- ✅ Root margin support
- ✅ Attaches even when the target element mounts after the first render
- ✅ Automatic cleanup
- ✅ Strongly typed, generic ref (`useIntersectionObserver<HTMLDivElement>()`)
- ✅ Performance optimized

## Notes

- Uses the native Intersection Observer API.
- Automatically unobserves the element on unmount.
- Inline array/object options (e.g. `threshold: [0, 0.5, 1]`) are normalized internally, so passing them inline does not recreate the observer on every render.
- The returned `ref` is a standard `RefObject` (you can read `ref.current`); assigning it to a late-mounted element still attaches the observer.
- More performant than scroll event listeners.
