# componentWillMount

Hook that mimics the `componentWillMount` lifecycle method from class components. Runs a function synchronously before the first render.

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

- ✅ Runs before first render
- ✅ Synchronous execution
- ✅ Class component lifecycle equivalent
- ✅ TypeScript support

## Notes

- Function runs once before the first render
- Uses `useLayoutEffect` for synchronous execution
- Equivalent to `useLayoutEffect(() => { ... }, [])`
- Runs before DOM paint
- Use sparingly - can block rendering
- Prefer `componentDidMount` for async operations
