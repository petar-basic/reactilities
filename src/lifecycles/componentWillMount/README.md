# componentWillMount

Hook that mimics the `componentWillMount` lifecycle method from class components. Runs a function exactly once, synchronously, during the first render — before any render output is produced. It runs in the render phase, so it is SSR-safe (no `useLayoutEffect` warning on the server). Keep the function side-effect-light and idempotent.

## Usage

```tsx
import { componentWillMount } from 'reactilities';

function Component() {
  componentWillMount(() => {
    console.log('Component will mount!');
    initialize();
  });
  
  return <div>Content</div>;
}
```

## API

### Parameters

- **`fn`** (`() => void`) - Function to run before first render

### Returns

`void`

## Examples

### Initialization

```tsx
function App() {
  componentWillMount(() => {
    initializeConfig();
    setupGlobalState();
  });
  
  return <div>App Content</div>;
}
```

### Preload Data

```tsx
function Dashboard() {
  componentWillMount(() => {
    preloadCriticalData();
  });
  
  return <div>Dashboard</div>;
}
```

### Setup

```tsx
function Component() {
  componentWillMount(() => {
    setupEventBus();
    registerHandlers();
  });
  
  return <div>Component</div>;
}
```

## Features

- ✅ Runs once during the first render, before render output
- ✅ Synchronous execution
- ✅ SSR-safe (no `useLayoutEffect` warning on the server)
- ✅ Class component lifecycle equivalent
- ✅ TypeScript support

## Notes

- Function runs exactly once, synchronously, during the first render
- Implemented with a render-phase ref guard (no effect), so it runs before any render output and on the server too
- Keep the function side-effect-light and idempotent — it runs during render
- Use `componentDidMount` for imperative side effects (DOM access, timers, subscriptions) and async operations
