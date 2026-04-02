# useStep

Hook for managing multi-step wizard and onboarding flow state. Tracks the current step index with boundary-safe navigation controls and convenience flags for first/last step detection.

## Usage

```tsx
import { useStep } from 'reactilities';

function Wizard() {
  const steps = ['Account', 'Profile', 'Review'];
  const { step, isFirst, isLast, next, prev } = useStep(steps.length);

  return (
    <div>
      <h2>{steps[step]}</h2>
      <button onClick={prev} disabled={isFirst}>Back</button>
      <button onClick={next} disabled={isLast}>
        {isLast ? 'Finish' : 'Next'}
      </button>
    </div>
  );
}
```

## API

### Parameters

- **`totalSteps`** (`number`) - Total number of steps in the sequence
- **`initialStep`** (`number`) - Starting step index (default: `0`)

### Returns

| Property | Type | Description |
|---|---|---|
| `step` | `number` | Current step index (0-based) |
| `isFirst` | `boolean` | Whether the current step is the first |
| `isLast` | `boolean` | Whether the current step is the last |
| `next` | `() => void` | Go to the next step (clamped at last) |
| `prev` | `() => void` | Go to the previous step (clamped at first) |
| `goTo` | `(step: number) => void` | Jump to a specific step (clamped to valid range) |
| `reset` | `() => void` | Return to the initial step |

## Examples

### Onboarding wizard

```tsx
const STEPS = ['Welcome', 'Set up account', 'Choose plan', 'Done'];

function Onboarding({ onComplete }: { onComplete: () => void }) {
  const { step, isFirst, isLast, next, prev } = useStep(STEPS.length);

  return (
    <div>
      <ProgressBar value={((step + 1) / STEPS.length) * 100} />
      <h2>Step {step + 1} of {STEPS.length}: {STEPS[step]}</h2>

      <StepContent step={step} />

      <div>
        {!isFirst && <button onClick={prev}>Back</button>}
        {isLast
          ? <button onClick={onComplete}>Finish</button>
          : <button onClick={next}>Next</button>
        }
      </div>
    </div>
  );
}
```

### Checkout flow with step navigation

```tsx
const STEPS = ['Cart', 'Shipping', 'Payment', 'Confirmation'];

function Checkout() {
  const { step, goTo, next, isLast } = useStep(STEPS.length);

  return (
    <div>
      <nav>
        {STEPS.map((label, i) => (
          <button
            key={label}
            onClick={() => goTo(i)}
            style={{ fontWeight: i === step ? 'bold' : 'normal' }}
          >
            {label}
          </button>
        ))}
      </nav>

      {step === 0 && <CartStep onContinue={next} />}
      {step === 1 && <ShippingStep onContinue={next} />}
      {step === 2 && <PaymentStep onContinue={next} />}
      {step === 3 && <ConfirmationStep />}
    </div>
  );
}
```

### Survey with progress indicator

```tsx
function Survey({ questions }: { questions: Question[] }) {
  const { step, next, prev, isLast, reset } = useStep(questions.length);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const answer = (value: string) => {
    setAnswers(a => ({ ...a, [step]: value }));
    if (!isLast) next();
  };

  const submit = () => {
    submitSurvey(answers);
    reset();
  };

  return (
    <div>
      <span>{step + 1} / {questions.length}</span>
      <QuestionCard question={questions[step]} onAnswer={answer} />
      {isLast && <button onClick={submit}>Submit</button>}
    </div>
  );
}
```

### Starting on a specific step

```tsx
// Resume from the last saved step
const savedStep = parseInt(localStorage.getItem('checkoutStep') ?? '0', 10);
const { step, next } = useStep(4, savedStep);
```

## Features

- ✅ Boundary-safe — `next` and `prev` never go out of range
- ✅ `goTo` clamped to valid range
- ✅ `isFirst` and `isLast` convenience flags
- ✅ Configurable initial step for resumable flows
- ✅ Zero external dependencies

## Notes

- Steps are 0-based indices
- `next` on the last step and `prev` on the first step are no-ops
- `goTo` with an out-of-range value is clamped silently to `[0, totalSteps - 1]`
