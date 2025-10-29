# componentWillUnmount

Hook that mimics the `componentWillUnmount` lifecycle method from class components. Runs a cleanup function when the component unmounts.

## Usage

```tsx
import { componentWillUnmount } from 'reactilities';

function Component() {
  componentWillUnmount(() => {
    console.log('Component will unmount!');
    cleanup();
  });
  
  return <div>Content</div>;
}
```

## API

### Parameters

- **`fn`** (`() => void`) - Cleanup function to run before component unmounts

### Returns

`void`

## Examples

### Event Listener Cleanup

```tsx
function WindowListener() {
  useEffect(() => {
    const handleResize = () => console.log('Resized');
    window.addEventListener('resize', handleResize);
    
    componentWillUnmount(() => {
      window.removeEventListener('resize', handleResize);
    });
  }, []);
  
  return <div>Listening to window resize</div>;
}
```

### Timer Cleanup

```tsx
function Timer() {
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('Tick');
    }, 1000);
    
    componentWillUnmount(() => {
      clearInterval(interval);
    });
  }, []);
  
  return <div>Timer running</div>;
}
```

### Subscription Cleanup

```tsx
function DataSubscription() {
  useEffect(() => {
    const subscription = subscribeToData(handleData);
    
    componentWillUnmount(() => {
      subscription.unsubscribe();
    });
  }, []);
  
  return <div>Subscribed to data</div>;
}
```

## Features

- ✅ Runs before unmount
- ✅ Class component lifecycle equivalent
- ✅ TypeScript support
- ✅ Perfect for cleanup

## Notes

- Function runs only when component unmounts
- Equivalent to `useEffect(() => { return () => { ... } }, [])`
- Use for cleaning up subscriptions, timers, listeners
- Does not run on re-renders
