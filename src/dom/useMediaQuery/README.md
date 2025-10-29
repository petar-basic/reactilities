# useMediaQuery

Hook for responsive design using CSS media queries. Returns boolean indicating if the media query currently matches. Uses `useSyncExternalStore` for optimal performance and SSR safety.

## Usage

```tsx
import { useMediaQuery, MEDIA_QUERIES } from 'reactilities';

function ResponsiveComponent() {
  const isMobile = useMediaQuery(MEDIA_QUERIES.IS_SMALL_DEVICE);
  
  return (
    <div>
      {isMobile ? <MobileView /> : <DesktopView />}
    </div>
  );
}
```

## API

### Parameters

- **`query`** (`string`) - CSS media query string to evaluate

### Returns

`boolean` - `true` if the media query matches, `false` otherwise

### Predefined Queries

```tsx
export const MEDIA_QUERIES = {
  IS_SMALL_DEVICE: 'only screen and (max-width : 768px)',
  IS_MEDIUM_DEVICE: 'only screen and (min-width : 769px) and (max-width : 992px)',
  IS_LARGE_DEVICE: 'only screen and (min-width : 993px) and (max-width : 1200px)',
  IS_LARGER_DEVICE: 'only screen and (min-width : 993px)',
  IS_EXTRA_LARGE_DEVICE: 'only screen and (min-width : 1201px)'
}
```

## Examples

### Responsive Navigation

```tsx
function Navigation() {
  const isMobile = useMediaQuery(MEDIA_QUERIES.IS_SMALL_DEVICE);
  
  return (
    <nav>
      {isMobile ? (
        <MobileMenu />
      ) : (
        <DesktopMenu />
      )}
    </nav>
  );
}
```

### Dark Mode Detection

```tsx
function ThemedApp() {
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
  
  return (
    <div className={prefersDark ? 'dark-theme' : 'light-theme'}>
      <h1>Auto-themed App</h1>
    </div>
  );
}
```

### Orientation Detection

```tsx
function OrientationAware() {
  const isPortrait = useMediaQuery('(orientation: portrait)');
  const isLandscape = useMediaQuery('(orientation: landscape)');
  
  return (
    <div>
      {isPortrait && <p>Please rotate your device to landscape</p>}
      {isLandscape && <VideoPlayer />}
    </div>
  );
}
```

### High DPI Display

```tsx
function ImageOptimizer() {
  const isRetina = useMediaQuery('(min-resolution: 2dppx)');
  
  return (
    <img 
      src={isRetina ? '/image@2x.png' : '/image.png'}
      alt="Optimized for display"
    />
  );
}
```

### Multiple Breakpoints

```tsx
function ResponsiveGrid() {
  const isMobile = useMediaQuery(MEDIA_QUERIES.IS_SMALL_DEVICE);
  const isTablet = useMediaQuery(MEDIA_QUERIES.IS_MEDIUM_DEVICE);
  const isDesktop = useMediaQuery(MEDIA_QUERIES.IS_LARGER_DEVICE);
  
  const columns = isMobile ? 1 : isTablet ? 2 : 3;
  
  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: `repeat(${columns}, 1fr)` 
    }}>
      {items.map(item => <Card key={item.id} {...item} />)}
    </div>
  );
}
```

### Print Media

```tsx
function PrintOptimized() {
  const isPrint = useMediaQuery('print');
  
  return (
    <div>
      <Header />
      <Content />
      {!isPrint && <Sidebar />}
      {!isPrint && <Footer />}
    </div>
  );
}
```

### Hover Capability

```tsx
function InteractiveElement() {
  const canHover = useMediaQuery('(hover: hover)');
  
  return (
    <button className={canHover ? 'with-hover-effects' : 'touch-optimized'}>
      Click me
    </button>
  );
}
```

### Reduced Motion

```tsx
function AnimatedComponent() {
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  
  return (
    <div className={prefersReducedMotion ? 'no-animations' : 'with-animations'}>
      <AnimatedContent />
    </div>
  );
}
```

## Features

- ✅ Real-time media query matching
- ✅ Automatic updates when query match changes
- ✅ SSR-safe with `useSyncExternalStore`
- ✅ Predefined breakpoint constants
- ✅ TypeScript support
- ✅ Optimized performance
- ✅ Supports all CSS media queries

## Notes

- Uses `window.matchMedia()` API under the hood
- Automatically subscribes/unsubscribes to media query changes
- Throws error when used in SSR context (use with proper guards)
- Supports all standard CSS media query features
- Multiple hooks can be used in the same component
- Changes are detected immediately without polling
