# Reactilities

A React utility library built with Vite.

## Installation

```bash
npm install reactilities
```

## Usage

```jsx
import { App } from 'reactilities'
import 'reactilities/style.css'

function MyApp() {
  return (
    <div>
      <App />
    </div>
  )
}
```

## Development

This library is built using Vite in library mode.

### Available Scripts

- `npm run dev` - Start development server with demo/test page
- `npm run build` - Build the library for production
- `npm run build:lib` - Build library only (without TypeScript compilation)
- `npm run lint` - Run ESLint
- `npm run preview` - Preview the built library

### Adding New Components

1. Create your component in the `src/` directory
2. Export it from `lib/main.ts`
3. Build the library with `npm run build`

### Library Structure

- `lib/main.ts` - Main entry point for the library exports
- `src/` - Source code and components
- `dist/` - Built library files (generated)
- `index.html` - Development/demo page

## Publishing

The library is configured to automatically build before publishing:

```bash
npm publish
```

## Peer Dependencies

This library requires React >= 16.8.0 as a peer dependency.
