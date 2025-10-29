# useVirtualization

Hook for virtualizing large lists to improve performance. Only renders visible items in the viewport, dramatically reducing DOM nodes for large datasets.

## Usage

```tsx
import { useVirtualization } from 'reactilities';

function VirtualList({ items }) {
  const { virtualItems, totalHeight, containerRef } = useVirtualization({
    itemCount: items.length,
    itemHeight: 50,
    containerHeight: 600
  });
  
  return (
    <div ref={containerRef} style={{ height: 600, overflow: 'auto' }}>
      <div style={{ height: totalHeight, position: 'relative' }}>
        {virtualItems.map(({ index, start }) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              top: start,
              height: 50,
              width: '100%'
            }}
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

Object containing:
- **`itemCount`** (`number`) - Total number of items
- **`itemHeight`** (`number`) - Height of each item in pixels
- **`containerHeight`** (`number`) - Height of the scrollable container

### Returns

Object containing:
- **`virtualItems`** - Array of visible items with `index` and `start` position
- **`totalHeight`** - Total height of all items
- **`containerRef`** - Ref to attach to scroll container

## Examples

### Large Data List

```tsx
function ProductList() {
  const products = Array.from({ length: 10000 }, (_, i) => ({
    id: i,
    name: `Product ${i}`,
    price: Math.random() * 100
  }));
  
  const { virtualItems, totalHeight, containerRef } = useVirtualization({
    itemCount: products.length,
    itemHeight: 60,
    containerHeight: 500
  });
  
  return (
    <div ref={containerRef} style={{ height: 500, overflow: 'auto' }}>
      <div style={{ height: totalHeight, position: 'relative' }}>
        {virtualItems.map(({ index, start }) => {
          const product = products[index];
          return (
            <div
              key={product.id}
              style={{
                position: 'absolute',
                top: start,
                height: 60,
                width: '100%',
                borderBottom: '1px solid #eee'
              }}
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

### Chat Messages

```tsx
function ChatMessages({ messages }) {
  const { virtualItems, totalHeight, containerRef } = useVirtualization({
    itemCount: messages.length,
    itemHeight: 80,
    containerHeight: 600
  });
  
  return (
    <div ref={containerRef} className="chat-container">
      <div style={{ height: totalHeight, position: 'relative' }}>
        {virtualItems.map(({ index, start }) => (
          <Message
            key={messages[index].id}
            message={messages[index]}
            style={{ position: 'absolute', top: start }}
          />
        ))}
      </div>
    </div>
  );
}
```

### Table Rows

```tsx
function VirtualTable({ data }) {
  const { virtualItems, totalHeight, containerRef } = useVirtualization({
    itemCount: data.length,
    itemHeight: 40,
    containerHeight: 400
  });
  
  return (
    <div ref={containerRef} style={{ height: 400, overflow: 'auto' }}>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Status</th>
          </tr>
        </thead>
      </table>
      <div style={{ height: totalHeight, position: 'relative' }}>
        {virtualItems.map(({ index, start }) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              top: start,
              height: 40
            }}
          >
            <table>
              <tbody>
                <tr>
                  <td>{data[index].name}</td>
                  <td>{data[index].email}</td>
                  <td>{data[index].status}</td>
                </tr>
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Features

- ✅ Renders only visible items
- ✅ Handles large datasets efficiently
- ✅ Smooth scrolling
- ✅ Automatic viewport calculation
- ✅ TypeScript support
- ✅ Performance optimized

## Notes

- Only renders items visible in viewport + small buffer
- Dramatically reduces DOM nodes for large lists
- All items must have the same height
- Container must have fixed height
- Uses absolute positioning for items
- Perfect for lists with 1000+ items

## Performance Benefits

| Items | Without Virtualization | With Virtualization |
|-------|----------------------|-------------------|
| 100 | 100 DOM nodes | ~20 DOM nodes |
| 1,000 | 1,000 DOM nodes | ~20 DOM nodes |
| 10,000 | 10,000 DOM nodes | ~20 DOM nodes |
| 100,000 | ❌ Browser crash | ~20 DOM nodes |

## When to Use

- Lists with 100+ items
- Tables with many rows
- Chat message history
- Infinite scroll feeds
- Large datasets
- Performance-critical lists
