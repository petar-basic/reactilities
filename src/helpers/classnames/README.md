# classnames

Utility function for conditionally joining CSS class names together. Supports strings, objects, arrays, and handles falsy values gracefully.

## Usage

```tsx
import { classnames } from 'reactilities';

function Button({ primary, disabled }) {
  return (
    <button className={classnames('btn', {
      'btn-primary': primary,
      'btn-disabled': disabled
    })}>
      Click me
    </button>
  );
}
```

## API

### Parameters

- **`...args`** (`ClassValue[]`) - Any number of class values (strings, objects, arrays, booleans, etc.)

### Returns

`string` - Joined class names

## Examples

### Basic Usage

```tsx
classnames('foo', 'bar'); // 'foo bar'
classnames('foo', { bar: true }); // 'foo bar'
classnames({ foo: true }, { bar: true }); // 'foo bar'
classnames({ foo: true, bar: false }); // 'foo'
```

### Conditional Classes

```tsx
function Alert({ type, dismissible }) {
  return (
    <div className={classnames('alert', {
      'alert-success': type === 'success',
      'alert-error': type === 'error',
      'alert-dismissible': dismissible
    })}>
      Alert message
    </div>
  );
}
```

### With Arrays

```tsx
classnames(['foo', 'bar']); // 'foo bar'
classnames(['foo', { bar: true, baz: false }]); // 'foo bar'
```

### Dynamic Button Styles

```tsx
function Button({ variant, size, disabled, className }) {
  return (
    <button className={classnames(
      'btn',
      `btn-${variant}`,
      `btn-${size}`,
      { 'btn-disabled': disabled },
      className
    )}>
      Button
    </button>
  );
}

<Button variant="primary" size="lg" disabled className="custom-class" />
// className="btn btn-primary btn-lg btn-disabled custom-class"
```

### Card Component

```tsx
function Card({ elevated, interactive, selected }) {
  return (
    <div className={classnames('card', {
      'card-elevated': elevated,
      'card-interactive': interactive,
      'card-selected': selected
    })}>
      Card content
    </div>
  );
}
```

### Form Input

```tsx
function Input({ error, disabled, large }) {
  return (
    <input className={classnames(
      'input',
      {
        'input-error': error,
        'input-disabled': disabled,
        'input-lg': large
      }
    )} />
  );
}
```

### Navigation Link

```tsx
function NavLink({ active, disabled, children }) {
  return (
    <a className={classnames('nav-link', {
      'active': active,
      'disabled': disabled
    })}>
      {children}
    </a>
  );
}
```

### Complex Example

```tsx
function Component({ theme, size, state, custom }) {
  const classes = classnames(
    'component',
    `component-${theme}`,
    {
      'component-sm': size === 'small',
      'component-lg': size === 'large',
      'is-loading': state === 'loading',
      'is-error': state === 'error',
      'is-success': state === 'success'
    },
    custom && `custom-${custom}`,
    ['additional', 'classes']
  );
  
  return <div className={classes}>Content</div>;
}
```

## Features

- ✅ Handles strings, objects, arrays
- ✅ Filters out falsy values
- ✅ Supports nested arrays
- ✅ TypeScript support
- ✅ Zero dependencies
- ✅ Tiny bundle size

## Notes

- Falsy values (`false`, `null`, `undefined`, `0`, `''`) are ignored
- Object keys with truthy values are included
- Arrays are flattened and processed recursively
- Empty strings and whitespace are trimmed
- Perfect for conditional CSS classes
- Compatible with CSS Modules, Tailwind, etc.

## Type Definition

```typescript
type ClassValue = 
  | string 
  | number 
  | boolean 
  | undefined 
  | null 
  | ClassArray 
  | ClassDictionary;

interface ClassDictionary {
  [key: string]: any;
}

interface ClassArray extends Array<ClassValue> {}
```
