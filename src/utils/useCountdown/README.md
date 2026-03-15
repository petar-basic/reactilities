# useCountdown

Hook for creating a countdown (or count-up) timer with `start`, `stop`, and `reset` controls.

## Usage

```tsx
import { useCountdown } from 'reactilities';

function OTPForm() {
  const { count, isRunning, start, reset } = useCountdown({
    countStart: 60,
    countStop: 0,
  });

  const handleResend = () => {
    sendOTP();
    reset();
    start();
  };

  return (
    <button onClick={handleResend} disabled={isRunning}>
      {isRunning ? `Resend in ${count}s` : 'Resend OTP'}
    </button>
  );
}
```

## API

### Parameters

`UseCountdownOptions` object:

| Option        | Type      | Default  | Description                                        |
|---------------|-----------|----------|----------------------------------------------------|
| `countStart`  | `number`  | required | Starting count value                               |
| `countStop`   | `number`  | `0`      | Value at which the countdown automatically stops   |
| `intervalMs`  | `number`  | `1000`   | Interval between ticks in milliseconds             |
| `isIncrement` | `boolean` | `false`  | Count up instead of down                           |

### Returns

| Property    | Type         | Description                               |
|-------------|--------------|-------------------------------------------|
| `count`     | `number`     | Current count value                       |
| `isRunning` | `boolean`    | Whether the timer is currently running    |
| `start`     | `() => void` | Start the timer                           |
| `stop`      | `() => void` | Pause the timer                           |
| `reset`     | `() => void` | Reset count to `countStart` and stop      |

## Examples

### Auction countdown

```tsx
function AuctionTimer({ endsAt }: { endsAt: number }) {
  const secondsLeft = Math.max(0, Math.floor((endsAt - Date.now()) / 1000));

  const { count, start } = useCountdown({ countStart: secondsLeft });

  useEffect(() => { start(); }, []);

  const h = Math.floor(count / 3600);
  const m = Math.floor((count % 3600) / 60);
  const s = count % 60;

  return (
    <span className="timer">
      {String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
    </span>
  );
}
```

### Stopwatch (count-up)

```tsx
function Stopwatch() {
  const { count, isRunning, start, stop, reset } = useCountdown({
    countStart: 0,
    countStop: 3600, // auto-stop at 1 hour
    isIncrement: true,
  });

  return (
    <div>
      <p>{count}s</p>
      <button onClick={isRunning ? stop : start}>
        {isRunning ? 'Stop' : 'Start'}
      </button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}
```

### Quiz timer

```tsx
function QuizQuestion({ onTimeUp }: { onTimeUp: () => void }) {
  const { count, start } = useCountdown({ countStart: 30 });

  useEffect(() => {
    start();
  }, []);

  useEffect(() => {
    if (count === 0) onTimeUp();
  }, [count, onTimeUp]);

  return (
    <div>
      <p style={{ color: count <= 10 ? 'red' : 'inherit' }}>
        {count}s remaining
      </p>
    </div>
  );
}
```

### Fast ticker

```tsx
function ProgressBar({ durationMs }: { durationMs: number }) {
  const steps = 100;
  const { count, start } = useCountdown({
    countStart: 0,
    countStop: steps,
    intervalMs: durationMs / steps,
    isIncrement: true,
  });

  useEffect(() => { start(); }, []);

  return <progress value={count} max={steps} />;
}
```

## Features

- Auto-stops when `countStop` is reached — no manual cleanup needed
- `start()` is idempotent — calling it on a running timer has no effect
- `reset()` stops the timer and returns to `countStart`
- Interval is cleared on unmount — no memory leaks
- Supports both countdown and count-up via `isIncrement`
