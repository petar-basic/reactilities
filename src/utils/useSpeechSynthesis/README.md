# useSpeechSynthesis

Hook for text-to-speech via the Web Speech Synthesis API. Provides controls to speak, pause, resume, and cancel speech, and returns the list of available voices for language and accent selection.

## Usage

```tsx
import { useSpeechSynthesis } from 'reactilities';

function ReadAloud({ text }: { text: string }) {
  const { speak, cancel, isSpeaking } = useSpeechSynthesis();

  return (
    <button onClick={isSpeaking ? cancel : () => speak(text)}>
      {isSpeaking ? 'Stop' : 'Read aloud'}
    </button>
  );
}
```

## API

### Parameters

- **`options.voice`** (`SpeechSynthesisVoice | null`) - Specific voice to use (from the `voices` array)
- **`options.rate`** (`number`) - Speech rate: `0.1` to `10` (default: `1`)
- **`options.pitch`** (`number`) - Pitch: `0` to `2` (default: `1`)
- **`options.volume`** (`number`) - Volume: `0` to `1` (default: `1`)
- **`options.lang`** (`string`) - Language code, e.g. `'en-US'`, `'fr-FR'`

### Returns

| Property | Type | Description |
|---|---|---|
| `speak` | `(text: string) => void` | Start speaking the given text |
| `cancel` | `() => void` | Stop speaking immediately |
| `pause` | `() => void` | Pause current speech |
| `resume` | `() => void` | Resume paused speech |
| `isSpeaking` | `boolean` | Whether speech is currently playing |
| `isPaused` | `boolean` | Whether speech is currently paused |
| `voices` | `SpeechSynthesisVoice[]` | Available system voices |
| `isSupported` | `boolean` | Whether the API is available in this browser |

## Examples

### Article reader with controls

```tsx
function ArticleReader({ content }: { content: string }) {
  const { speak, cancel, pause, resume, isSpeaking, isPaused } = useSpeechSynthesis({
    rate: 1.1,
    pitch: 1
  });

  return (
    <div>
      <article>{content}</article>
      <div className="controls">
        {!isSpeaking && <button onClick={() => speak(content)}>▶ Play</button>}
        {isSpeaking && !isPaused && <button onClick={pause}>⏸ Pause</button>}
        {isPaused && <button onClick={resume}>▶ Resume</button>}
        {isSpeaking && <button onClick={cancel}>⏹ Stop</button>}
      </div>
    </div>
  );
}
```

### Voice selector

```tsx
function VoiceSelector() {
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const { speak, voices } = useSpeechSynthesis({ voice: selectedVoice });

  return (
    <div>
      <select onChange={(e) => setSelectedVoice(voices[Number(e.target.value)] ?? null)}>
        <option value="">Default voice</option>
        {voices.map((voice, i) => (
          <option key={voice.name} value={i}>
            {voice.name} ({voice.lang})
          </option>
        ))}
      </select>
      <button onClick={() => speak('Hello! This is how I sound.')}>Preview</button>
    </div>
  );
}
```

### Accessibility announcement

```tsx
function LiveRegion({ message }: { message: string }) {
  const { speak, isSupported } = useSpeechSynthesis();

  useEffect(() => {
    if (isSupported && message) {
      speak(message);
    }
  }, [message]);

  return <div aria-live="polite">{message}</div>;
}
```

## Features

- ✅ Full playback controls: speak, cancel, pause, resume
- ✅ Voice selection from all system-available voices
- ✅ Configurable rate, pitch, volume, and language
- ✅ `isSpeaking` and `isPaused` state flags
- ✅ `isSupported` flag for graceful degradation
- ✅ Cancels speech on unmount

## Notes

- Browser support varies — always check `isSupported` before rendering speech controls
- Voices load asynchronously after page load; the `voices` array may be empty on first render and populate shortly after
- Calling `speak()` while already speaking cancels the current utterance and starts a new one
- `cancel()` also clears any queued utterances
