import { useCallback, useRef } from 'react';
import { useAsync } from '../useAsync';
import type { UseAsyncReturn } from '../useAsync';

/**
 * Hook for data fetching with automatic abort on re-fetch or unmount
 * Built on top of useAsync with AbortController support
 * Throws on non-2xx responses, handles JSON parsing automatically
 *
 * @param url - URL to fetch
 * @param options - Standard fetch RequestInit options
 * @returns Same interface as useAsync: { data, loading, error, status, execute, reset }
 *
 * @example
 * function UserList() {
 *   const { data, loading, error } = useFetch<User[]>('/api/users');
 *
 *   if (loading) return <Spinner />;
 *   if (error) return <p>Error: {error.message}</p>;
 *
 *   return (
 *     <ul>
 *       {data?.map(user => <li key={user.id}>{user.name}</li>)}
 *     </ul>
 *   );
 * }
 *
 * @example
 * // Re-fetch when params change
 * function SearchResults({ query }: { query: string }) {
 *   const { data, loading } = useFetch<SearchResult[]>(
 *     `/api/search?q=${encodeURIComponent(query)}`
 *   );
 *
 *   return loading ? <Spinner /> : <ResultList items={data ?? []} />;
 * }
 *
 * @example
 * // POST request
 * function SubmitForm() {
 *   const { execute, loading, status } = useFetch('/api/submit', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({ name: 'Alice' }),
 *   }, false);
 *
 *   return (
 *     <button onClick={execute} disabled={loading}>
 *       {status === 'success' ? 'Submitted!' : 'Submit'}
 *     </button>
 *   );
 * }
 */
export function useFetch<T>(
  url: string,
  options?: RequestInit,
  immediate = true
): UseAsyncReturn<T> {
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchFn = useCallback(async (): Promise<T> => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const response = await fetch(url, {
      ...options,
      signal: abortControllerRef.current.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }, [url, options]);

  return useAsync<T>(fetchFn, immediate);
}
