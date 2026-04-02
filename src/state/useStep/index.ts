import { useCallback, useState } from "react";

interface UseStepReturn {
  step: number;
  isFirst: boolean;
  isLast: boolean;
  next: () => void;
  prev: () => void;
  goTo: (step: number) => void;
  reset: () => void;
}

/**
 * Hook for managing multi-step wizard or onboarding flow state
 * Tracks the current step index with boundary-safe navigation controls
 *
 * @param totalSteps - Total number of steps in the sequence
 * @param initialStep - Starting step index (default: 0)
 * @returns Object with current step, boundary flags, and navigation functions
 *
 * @example
 * function OnboardingWizard() {
 *   const steps = ['Profile', 'Preferences', 'Review'];
 *   const { step, isFirst, isLast, next, prev } = useStep(steps.length);
 *
 *   return (
 *     <div>
 *       <h2>Step {step + 1}: {steps[step]}</h2>
 *       <StepContent step={step} />
 *       <button onClick={prev} disabled={isFirst}>Back</button>
 *       <button onClick={next} disabled={isLast}>
 *         {isLast ? 'Finish' : 'Next'}
 *       </button>
 *     </div>
 *   );
 * }
 *
 * @example
 * // Jump to a specific step and show a progress bar
 * const { step, goTo, reset } = useStep(5);
 *
 * const progress = ((step + 1) / 5) * 100;
 *
 * <ProgressBar value={progress} />
 * <button onClick={() => goTo(0)}>Restart</button>
 */
export function useStep(totalSteps: number, initialStep = 0): UseStepReturn {
  const [step, setStep] = useState(initialStep);

  const next = useCallback(() => {
    setStep(s => Math.min(s + 1, totalSteps - 1));
  }, [totalSteps]);

  const prev = useCallback(() => {
    setStep(s => Math.max(s - 1, 0));
  }, []);

  const goTo = useCallback((target: number) => {
    setStep(Math.min(Math.max(target, 0), totalSteps - 1));
  }, [totalSteps]);

  const reset = useCallback(() => {
    setStep(initialStep);
  }, [initialStep]);

  return {
    step,
    isFirst: step === 0,
    isLast: step === totalSteps - 1,
    next,
    prev,
    goTo,
    reset
  };
}
