import { useCallback, useEffect, useReducer, useRef } from 'react';

type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

type AsyncState<T> =
  | { status: 'idle'; data: null; error: null }
  | { status: 'loading'; data: null; error: null }
  | { status: 'success'; data: T; error: null }
  | { status: 'error'; data: null; error: Error };

type AsyncAction<T> =
  | { type: 'loading' }
  | { type: 'success'; data: T }
  | { type: 'error'; error: Error }
  | { type: 'reset' };

export interface UseAsyncReturn<T> {
  /** Current execution status */
  status: AsyncStatus;
  /** Result data, available when status is 'success' */
  data: T | null;
  /** Error object, available when status is 'error' */
  error: Error | null;
  /** True while the async function is running */
  loading: boolean;
  /** Manually trigger the async function */
  execute: () => Promise<void>;
  /** Reset state back to idle */
  reset: () => void;
}

function asyncReducer<T>(_state: AsyncState<T>, action: AsyncAction<T>): AsyncState<T> {
  switch (action.type) {
    case 'loading':
      return { status: 'loading', data: null, error: null };
    case 'success':
      return { status: 'success', data: action.data, error: null };
    case 'error':
      return { status: 'error', data: null, error: action.error };
    case 'reset':
      return { status: 'idle', data: null, error: null };
  }
}

const initialState = { status: 'idle' as const, data: null, error: null };

/**
 * Hook for managing async operations with loading, success, and error states
 * Prevents state updates after unmount and supports manual re-execution
 *
 * @param asyncFn - Async function to execute
 * @param immediate - Whether to execute immediately on mount (default: true)
 * @returns Object with status, data, error, loading, execute, and reset
 *
 * @example
 * function UserProfile({ userId }: { userId: string }) {
 *   const { data, loading, error, execute } = useAsync(
 *     () => fetchUser(userId),
 *     true
 *   );
 *
 *   if (loading) return <Spinner />;
 *   if (error) return <ErrorMessage message={error.message} />;
 *   if (!data) return null;
 *
 *   return (
 *     <div>
 *       <h1>{data.name}</h1>
 *       <button onClick={execute}>Refresh</button>
 *     </div>
 *   );
 * }
 *
 * @example
 * // Manual trigger — form submission
 * function ContactForm() {
 *   const { loading, error, status, execute } = useAsync(
 *     () => submitForm(formData),
 *     false // don't run on mount
 *   );
 *
 *   return (
 *     <form onSubmit={e => { e.preventDefault(); execute(); }}>
 *       <button disabled={loading}>
 *         {loading ? 'Sending...' : 'Send'}
 *       </button>
 *       {status === 'success' && <p>Sent!</p>}
 *       {error && <p>{error.message}</p>}
 *     </form>
 *   );
 * }
 */
export function useAsync<T>(
  asyncFn: () => Promise<T>,
  immediate = true
): UseAsyncReturn<T> {
  const [state, dispatch] = useReducer(asyncReducer<T>, initialState);
  const mountedRef = useRef(true);
  const asyncFnRef = useRef(asyncFn);

  useEffect(() => {
    asyncFnRef.current = asyncFn;
  }, [asyncFn]);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const execute = useCallback(async () => {
    dispatch({ type: 'loading' });
    try {
      const data = await asyncFnRef.current();
      if (mountedRef.current) dispatch({ type: 'success', data });
    } catch (err) {
      if (mountedRef.current) {
        dispatch({ type: 'error', error: err instanceof Error ? err : new Error(String(err)) });
      }
    }
  }, []);

  const reset = useCallback(() => dispatch({ type: 'reset' }), []);

  useEffect(() => {
    if (immediate) execute();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    ...state,
    loading: state.status === 'loading',
    execute,
    reset,
  };
}
