# useInfiniteScroll

Hook for infinite scroll using IntersectionObserver. Attach the `loaderRef` to a sentinel element at the bottom of your list — `onLoadMore` is called automatically when it becomes visible.

## Usage

```tsx
import { useInfiniteScroll } from 'reactilities';

function Feed() {
  const [items, setItems] = useState<Post[]>([]);
  const [hasMore, setHasMore] = useState(true);

  const { loaderRef, isLoading } = useInfiniteScroll({
    onLoadMore: async () => {
      const next = await fetchPosts({ cursor: items.at(-1)?.id });
      setItems(prev => [...prev, ...next]);
      if (next.length < PAGE_SIZE) setHasMore(false);
    },
    hasMore,
  });

  return (
    <div>
      {items.map(post => <PostCard key={post.id} post={post} />)}

      {hasMore && (
        <div ref={loaderRef} style={{ padding: 16, textAlign: 'center' }}>
          {isLoading ? 'Loading more...' : ''}
        </div>
      )}
    </div>
  );
}
```

## API

### Parameters (options object)

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `onLoadMore` | `() => void \| Promise<void>` | — | Called when the loader enters the viewport |
| `hasMore` | `boolean` | — | Whether there is more content to load |
| `isLoading` | `boolean` | `false` | External loading flag (prevents double-trigger) |
| `threshold` | `number` | `0.1` | IntersectionObserver threshold (0–1) |
| `rootMargin` | `string` | `'0px'` | IntersectionObserver root margin |

### Returns

| Property | Type | Description |
|----------|------|-------------|
| `loaderRef` | `RefObject<HTMLElement \| null>` | Attach to the sentinel/loader element |
| `isLoading` | `boolean` | True while an async `onLoadMore` is in progress |

## Examples

### With External Loading State

```tsx
function ProductList() {
  const [products, setProducts] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const { loaderRef } = useInfiniteScroll({
    onLoadMore: async () => {
      setLoading(true);
      const more = await api.getProducts({ page: Math.ceil(products.length / 20) + 1 });
      setProducts(p => [...p, ...more]);
      if (more.length < 20) setHasMore(false);
      setLoading(false);
    },
    hasMore,
    isLoading: loading,
  });

  return (
    <>
      <ProductGrid products={products} />
      <div ref={loaderRef}>{loading && <Spinner />}</div>
    </>
  );
}
```

### Early Trigger with rootMargin

```tsx
// Start loading when sentinel is 200px before entering the viewport
const { loaderRef } = useInfiniteScroll({
  onLoadMore: loadNextPage,
  hasMore,
  rootMargin: '200px',
});
```

## Notes

- `onLoadMore` is deduplicated — it won't be called again while `isLoading` is true
- Always uses the latest `onLoadMore` reference (via ref pattern), so closures stay fresh
- When `hasMore` becomes false, remove or stop rendering the sentinel element to clean up
- The IntersectionObserver is disconnected on unmount
