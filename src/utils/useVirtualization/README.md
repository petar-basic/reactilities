# useVirtualization

Hook for virtualizing large lists to improve performance. Only renders visible items in the viewport, dramatically reducing DOM nodes for large datasets.

## Usage

```tsx
import { useVirtualization } from 'reactilities';

function VirtualList({ items }) {
  const { containerRef, virtualItems, totalSize, scrollToIndex } = useVirtualization(
    items.length,
    { itemHeight: 50, containerHeight: 600 }
  );

  return (
    <div ref={containerRef} style={{ height: 600, overflow: 'auto' }}>
      <div style={{ height: totalSize, position: 'relative' }}>
        {virtualItems.map(({ index, start, size }) => (
          <div
            key={index}
            style={{ position: 'absolute', top: start, height: size, width: '100%' }}
          >
            {items[index]}
          </div>
        ))}
      </div>
    </div>
  );
}
```

## API

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `itemCount` | `number` | Total number of items |
| `options` | `object` | Configuration options (see below) |

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `itemHeight` | `number` | — | Height of each item in pixels |
| `containerHeight` | `number` | — | Height of the scrollable container |
| `overscan` | `number` | `5` | Extra items to render above/below visible range |
| `scrollingDelay` | `number` | `150` | Milliseconds before `isScrolling` resets to false |

### Returns

| Property | Type | Description |
|----------|------|-------------|
| `containerRef` | `RefObject<HTMLElement \| null>` | Attach to the scroll container element |
| `virtualItems` | `VirtualItem[]` | Array of currently visible items |
| `totalSize` | `number` | Total pixel height of all items combined |
| `scrollToIndex` | `(index: number) => void` | Programmatically scroll to an item |
| `isScrolling` | `boolean` | True while the user is actively scrolling |

#### VirtualItem shape

```ts
interface VirtualItem {
  index: number;  // position in original array
  start: number;  // top offset in pixels
  end: number;    // bottom offset in pixels
  size: number;   // item height in pixels
}
```

## Examples

### Large Data List

```tsx
function ProductList() {
  const products = Array.from({ length: 10000 }, (_, i) => ({
    id: i,
    name: `Product ${i}`,
    price: Math.random() * 100
  }));

  const { containerRef, virtualItems, totalSize } = useVirtualization(
    products.length,
    { itemHeight: 60, containerHeight: 500 }
  );

  return (
    <div ref={containerRef} style={{ height: 500, overflow: 'auto' }}>
      <div style={{ height: totalSize, position: 'relative' }}>
        {virtualItems.map(({ index, start, size }) => {
          const product = products[index];
          return (
            <div
              key={product.id}
              style={{ position: 'absolute', top: start, height: size, width: '100%' }}
            >
              <h4>{product.name}</h4>
              <p>${product.price.toFixed(2)}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

### Scroll to Item Button

```tsx
function VirtualListWithNav({ items }) {
  const { containerRef, virtualItems, totalSize, scrollToIndex } = useVirtualization(
    items.length,
    { itemHeight: 50, containerHeight: 400 }
  );

  return (
    <>
      <button onClick={() => scrollToIndex(500)}>Jump to item 500</button>
      <div ref={containerRef} style={{ height: 400, overflow: 'auto' }}>
        <div style={{ height: totalSize, position: 'relative' }}>
          {virtualItems.map(({ index, start, size }) => (
            <div key={index} style={{ position: 'absolute', top: start, height: size }}>
              {items[index]}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
```

## Features

- Only renders visible items + overscan buffer
- `containerRef` API — no data attributes needed
- `scrollToIndex` with stable reference (via `useCallback`)
- `isScrolling` state for scroll-aware UI
- TypeScript support
- Works with any fixed-height list

## Notes

- All items must have the same height (`itemHeight`)
- Container must have a fixed height and `overflow: auto` or `overflow: scroll`
- Items use absolute positioning inside a full-height wrapper
- Ideal for lists with 100+ items

## Performance

| Items | Without Virtualization | With Virtualization |
|-------|----------------------|---------------------|
| 100 | 100 DOM nodes | ~20 DOM nodes |
| 1,000 | 1,000 DOM nodes | ~20 DOM nodes |
| 10,000 | 10,000 DOM nodes | ~20 DOM nodes |
| 100,000 | ❌ Browser crash | ~20 DOM nodes |
