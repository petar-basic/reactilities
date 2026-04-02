# useImageLazyLoad

Hook for lazy loading images — only starts loading when the image enters the viewport. Higher-level than `useIntersectionObserver`: handles the full load lifecycle with status tracking and optional placeholder support.

## Usage

```tsx
import { useImageLazyLoad } from 'reactilities';

function LazyImage({ src, alt }: { src: string; alt: string }) {
  const { ref, src: currentSrc, isLoaded } = useImageLazyLoad(src, {
    placeholder: '/placeholder.jpg'
  });

  return (
    <img
      ref={ref}
      src={currentSrc}
      alt={alt}
      style={{ opacity: isLoaded ? 1 : 0.3, transition: 'opacity 0.3s' }}
    />
  );
}
```

## API

### Parameters

- **`imageSrc`** (`string`) - The real image URL to load when visible
- **`options.threshold`** (`number`) - IntersectionObserver threshold (default: `0`)
- **`options.rootMargin`** (`string`) - Margin before triggering load (default: `'200px'`, pre-loads 200px before visible)
- **`options.placeholder`** (`string`) - URL shown while the real image loads (default: `''`)

### Returns

| Property | Type | Description |
|---|---|---|
| `ref` | `RefObject<HTMLImageElement>` | Ref to attach to the `<img>` element |
| `src` | `string` | Current image src — placeholder until loaded, then real URL |
| `status` | `'idle' \| 'loading' \| 'loaded' \| 'error'` | Current load status |
| `isLoaded` | `boolean` | `true` once the image has fully loaded |

## Examples

### Gallery with fade-in

```tsx
function GalleryImage({ src, alt }: { src: string; alt: string }) {
  const { ref, src: currentSrc, isLoaded } = useImageLazyLoad(src, {
    placeholder: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
  });

  return (
    <div className="gallery-item">
      <img
        ref={ref}
        src={currentSrc}
        alt={alt}
        style={{
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 0.4s ease',
          width: '100%'
        }}
      />
    </div>
  );
}
```

### Blur-up effect

```tsx
function BlurUpImage({ lowResSrc, highResSrc, alt }: BlurUpProps) {
  const { ref, isLoaded } = useImageLazyLoad(highResSrc, {
    placeholder: lowResSrc,
    rootMargin: '400px'
  });

  return (
    <img
      ref={ref}
      src={isLoaded ? highResSrc : lowResSrc}
      alt={alt}
      style={{
        filter: isLoaded ? 'none' : 'blur(20px)',
        transition: 'filter 0.6s'
      }}
    />
  );
}
```

### Status-driven loading skeleton

```tsx
function ProductImage({ src }: { src: string }) {
  const { ref, src: currentSrc, status } = useImageLazyLoad(src);

  return (
    <div className="product-image-container">
      {status === 'idle' && <div className="skeleton" />}
      {status === 'loading' && <Spinner />}
      {status === 'error' && <ErrorIcon />}
      <img
        ref={ref}
        src={currentSrc}
        alt="Product"
        style={{ display: status === 'loaded' ? 'block' : 'none' }}
      />
    </div>
  );
}
```

### Product listing with early load

```tsx
// Load images 500px before they enter the viewport
function ProductCard({ product }: { product: Product }) {
  const { ref, src, isLoaded } = useImageLazyLoad(product.imageUrl, {
    rootMargin: '500px',
    placeholder: product.thumbnailUrl
  });

  return (
    <article>
      <img ref={ref} src={src} alt={product.name} className={isLoaded ? 'loaded' : 'loading'} />
      <h3>{product.name}</h3>
    </article>
  );
}
```

## Features

- ✅ Only loads the image when it enters (or is near) the viewport
- ✅ Configurable `rootMargin` to pre-load before visible (default `200px`)
- ✅ Optional placeholder src shown during loading
- ✅ Full status lifecycle: `idle` → `loading` → `loaded` / `error`
- ✅ `isLoaded` convenience boolean
- ✅ Observer disconnects immediately after triggering to avoid repeated loads
- ✅ Zero external dependencies

## Notes

- The `ref` must be attached to the actual `<img>` element — not a wrapper div
- `rootMargin: '200px'` means the image starts loading 200px before it scrolls into view, reducing the chance of a visible blank state
- The observer is disconnected as soon as the element becomes visible — it does not re-trigger on scroll
