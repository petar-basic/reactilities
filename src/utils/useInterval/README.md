# useInterval

Hook for running a callback on a fixed interval with automatic cleanup. Safely handles callback updates without resetting the interval timer. Pass `null` as the delay to pause the interval.

## Usage

```tsx
import { useInterval } from 'reactilities';

function Clock() {
  const [time, setTime] = useState(new Date());

  useInterval(() => setTime(new Date()), 1000);

  return <p>{time.toLocaleTimeString()}</p>;
}
```

## API

### Parameters

- **`callback`** (`() => void`) — function to call on each tick
- **`delay`** (`number | null`) — interval duration in milliseconds, or `null` to pause

### Returns

`void`

## Examples

### Pausable interval

```tsx
function Timer() {
  const [count, setCount] = useState(0);
  const [running, setRunning] = useState(false);

  useInterval(() => setCount(c => c + 1), running ? 1000 : null);

  return (
    <div>
      <p>{count}s</p>
      <button onClick={() => setRunning(r => !r)}>
        {running ? 'Pause' : 'Start'}
      </button>
    </div>
  );
}
```

### Polling

```tsx
function LiveDashboard() {
  const [stats, setStats] = useState(null);

  useInterval(async () => {
    const data = await fetchStats();
    setStats(data);
  }, 5000);

  return <StatsDisplay stats={stats} />;
}
```

### Auto-advancing slideshow

```tsx
function Slideshow({ images }: { images: string[] }) {
  const [index, setIndex] = useState(0);

  useInterval(
    () => setIndex(i => (i + 1) % images.length),
    3000
  );

  return <img src={images[index]} alt="" />;
}
```

### Dynamic speed control

```tsx
function SpeedTest() {
  const [speed, setSpeed] = useState(1000);
  const [ticks, setTicks] = useState(0);

  useInterval(() => setTicks(t => t + 1), speed);

  return (
    <div>
      <p>Ticks: {ticks}</p>
      <input
        type="range" min="100" max="2000" value={speed}
        onChange={e => setSpeed(Number(e.target.value))}
      />
    </div>
  );
}
```

## Features

- Callback is always up to date via `useRef` — changing the callback does not reset the interval
- Pass `null` to pause without unmounting the component
- Interval is automatically cleared on unmount
- Works with async callbacks (fire-and-forget)

## Notes

- Changing `delay` resets the interval timer
- Changing only `callback` does **not** reset the timer — the new callback fires on the next tick
- For a one-shot delayed call, use `useTimeout` instead
- For a full countdown/stopwatch, use `useCountdown`
