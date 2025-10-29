# useKeyboardShortcuts

Hook for handling keyboard shortcuts. Supports modifier keys (Ctrl, Alt, Shift, Meta) and custom key combinations.

## Usage

```tsx
import { useKeyboardShortcuts } from 'reactilities';

function Editor() {
  useKeyboardShortcuts({
    'ctrl+s': (e) => {
      e.preventDefault();
      saveDocument();
    },
    'ctrl+z': () => undo(),
    'ctrl+shift+z': () => redo()
  });
  
  return <textarea />;
}
```

## API

### Parameters

- **`shortcuts`** (`Record<string, (event: KeyboardEvent) => void>`) - Object mapping key combinations to handler functions

### Returns

`void`

## Examples

### Text Editor Shortcuts

```tsx
function TextEditor() {
  const [content, setContent] = useState('');
  
  useKeyboardShortcuts({
    'ctrl+s': (e) => {
      e.preventDefault();
      saveContent(content);
    },
    'ctrl+b': (e) => {
      e.preventDefault();
      formatBold();
    },
    'ctrl+i': (e) => {
      e.preventDefault();
      formatItalic();
    },
    'ctrl+z': () => undo(),
    'ctrl+y': () => redo()
  });
  
  return (
    <textarea 
      value={content}
      onChange={(e) => setContent(e.target.value)}
    />
  );
}
```

### Modal Controls

```tsx
function Modal({ isOpen, onClose }) {
  useKeyboardShortcuts({
    'escape': onClose,
    'enter': handleSubmit
  });
  
  if (!isOpen) return null;
  
  return (
    <div className="modal">
      <p>Press ESC to close or Enter to submit</p>
    </div>
  );
}
```

### Navigation Shortcuts

```tsx
function App() {
  const navigate = useNavigate();
  
  useKeyboardShortcuts({
    'ctrl+h': () => navigate('/'),
    'ctrl+d': () => navigate('/dashboard'),
    'ctrl+p': () => navigate('/profile'),
    'ctrl+/': () => toggleCommandPalette()
  });
  
  return <Routes />;
}
```

### Media Player Controls

```tsx
function VideoPlayer() {
  const videoRef = useRef(null);
  
  useKeyboardShortcuts({
    'space': (e) => {
      e.preventDefault();
      togglePlayPause();
    },
    'arrowleft': () => seek(-10),
    'arrowright': () => seek(10),
    'arrowup': () => volumeUp(),
    'arrowdown': () => volumeDown(),
    'f': () => toggleFullscreen(),
    'm': () => toggleMute()
  });
  
  return <video ref={videoRef} />;
}
```

### Search Shortcut

```tsx
function SearchBar() {
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef(null);
  
  useKeyboardShortcuts({
    'ctrl+k': (e) => {
      e.preventDefault();
      setIsOpen(true);
      inputRef.current?.focus();
    },
    'escape': () => setIsOpen(false)
  });
  
  return isOpen && (
    <input ref={inputRef} placeholder="Search..." />
  );
}
```

## Features

- ✅ Modifier key support (Ctrl, Alt, Shift, Meta)
- ✅ Multiple key combinations
- ✅ Event prevention support
- ✅ Automatic cleanup
- ✅ TypeScript support
- ✅ Case-insensitive keys

## Supported Modifiers

- `ctrl` - Control key
- `alt` - Alt/Option key
- `shift` - Shift key
- `meta` - Command (Mac) / Windows key

## Key Format

Shortcuts are defined as strings with modifiers and keys separated by `+`:
- `'ctrl+s'` - Ctrl + S
- `'ctrl+shift+z'` - Ctrl + Shift + Z
- `'alt+f4'` - Alt + F4
- `'escape'` - Just Escape key

## Notes

- Keys are case-insensitive
- Modifiers must come before the main key
- Automatically removes listeners on unmount
- Handlers receive the keyboard event
- Use `e.preventDefault()` to prevent default browser behavior
