# useSpeechRecognition

Hook for voice input via the Web Speech Recognition API. Returns real-time interim transcripts as the user speaks and final transcripts when the user pauses. Supports continuous listening, multi-language recognition, and result callbacks.

## Usage

```tsx
import { useSpeechRecognition } from 'reactilities';

function VoiceSearch() {
  const { transcript, isListening, start, stop, reset } = useSpeechRecognition();

  return (
    <div>
      <input value={transcript} readOnly placeholder="Speak to search..." />
      <button onClick={isListening ? stop : start}>
        {isListening ? 'Stop' : 'Start'}
      </button>
      <button onClick={reset}>Clear</button>
    </div>
  );
}
```

## API

### Parameters

- **`options.lang`** (`string`) - Recognition language code, e.g. `'en-US'`, `'de-DE'` (default: `'en-US'`)
- **`options.continuous`** (`boolean`) - Keep listening after each result (default: `false`)
- **`options.interimResults`** (`boolean`) - Emit in-progress transcripts while the user speaks (default: `true`)
- **`options.onResult`** (`(transcript: string, isFinal: boolean) => void`) - Callback for each recognition result
- **`options.onError`** (`(error: string) => void`) - Callback when recognition fails

### Returns

| Property | Type | Description |
|---|---|---|
| `transcript` | `string` | Accumulated final transcript text |
| `interimTranscript` | `string` | Current unfinished partial transcript |
| `isListening` | `boolean` | Whether recognition is active |
| `isSupported` | `boolean` | Whether the Speech Recognition API is available |
| `start` | `() => void` | Start listening |
| `stop` | `() => void` | Stop listening |
| `reset` | `() => void` | Stop and clear all transcript state |

## Examples

### Voice command input

```tsx
function VoiceInput({ onSubmit }: { onSubmit: (text: string) => void }) {
  const { transcript, interimTranscript, isListening, start, stop, reset } =
    useSpeechRecognition({ lang: 'en-US' });

  const handleSubmit = () => {
    onSubmit(transcript);
    reset();
  };

  return (
    <div>
      <div className="transcript">
        {transcript}
        <span className="interim">{interimTranscript}</span>
      </div>
      <button onClick={isListening ? stop : start}>
        {isListening ? '🎙 Listening...' : '🎤 Speak'}
      </button>
      <button onClick={handleSubmit} disabled={!transcript}>Submit</button>
    </div>
  );
}
```

### Continuous transcription

```tsx
function LiveTranscription() {
  const { transcript, isListening, start, stop } = useSpeechRecognition({
    lang: 'en-US',
    continuous: true,
    onResult: (text, isFinal) => {
      if (isFinal) saveTranscriptLine(text);
    }
  });

  return (
    <div>
      <button onClick={isListening ? stop : start}>
        {isListening ? 'Stop Recording' : 'Start Recording'}
      </button>
      <div className="transcript">{transcript}</div>
    </div>
  );
}
```

### Multi-language support

```tsx
function LanguageSelector() {
  const [lang, setLang] = useState('en-US');
  const { transcript, start, stop, isListening, reset } = useSpeechRecognition({ lang });

  return (
    <div>
      <select value={lang} onChange={(e) => { setLang(e.target.value); reset(); }}>
        <option value="en-US">English</option>
        <option value="es-ES">Spanish</option>
        <option value="fr-FR">French</option>
        <option value="de-DE">German</option>
      </select>
      <button onClick={isListening ? stop : start}>
        {isListening ? 'Stop' : 'Speak'}
      </button>
      <p>{transcript}</p>
    </div>
  );
}
```

## Features

- ✅ Real-time interim transcripts as the user speaks
- ✅ Accumulated final transcript — does not reset between pauses
- ✅ Configurable language, continuous mode, and interim result streaming
- ✅ `onResult` and `onError` callbacks stored in refs — safe to pass inline
- ✅ `isSupported` flag for graceful fallback
- ✅ `reset()` stops listening and clears all transcript state
- ✅ Recognition stopped automatically on unmount
- ✅ `webkitSpeechRecognition` fallback for Chrome/Safari

## Notes

- `continuous: false` (default) stops recognition after a single pause. Use `continuous: true` for dictation.
- `transcript` accumulates final results — call `reset()` to start fresh
- `interimTranscript` is cleared when recognition ends or `reset()` is called
- The API requires user permission for microphone access

## Browser Support

The Speech Recognition API is widely supported in Chrome and Edge. Safari supports `webkitSpeechRecognition`. Firefox does not support it at all — always check `isSupported`.
