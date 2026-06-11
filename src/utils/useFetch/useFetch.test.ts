import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useFetch } from './index';

describe('useFetch', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const mockFetch = (data: unknown, ok = true, status = 200) => {
    vi.mocked(fetch).mockResolvedValue({
      ok,
      status,
      statusText: ok ? 'OK' : 'Not Found',
      json: () => Promise.resolve(data),
    } as Response);
  };

  it('should fetch data on mount and set success state', async () => {
    const data = [{ id: 1, name: 'Alice' }];
    mockFetch(data);

    const { result } = renderHook(() => useFetch('/api/users'));

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.data).toEqual(data);
    expect(result.current.loading).toBe(false);
    expect(fetch).toHaveBeenCalledWith('/api/users', expect.objectContaining({ signal: expect.any(AbortSignal) }));
  });

  it('should set error state on non-2xx response', async () => {
    mockFetch(null, false, 404);

    const { result } = renderHook(() => useFetch('/api/missing'));

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error?.message).toContain('404');
  });

  it('should set error state on network error', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useFetch('/api/fail'));

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error?.message).toBe('Network error');
  });

  it('should not fetch when immediate is false', () => {
    const { result } = renderHook(() => useFetch('/api/users', undefined, false));

    expect(result.current.status).toBe('idle');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('should allow manual execution', async () => {
    mockFetch({ id: 1 });
    const { result } = renderHook(() => useFetch('/api/user', undefined, false));

    expect(fetch).not.toHaveBeenCalled();
    await act(async () => { await result.current.execute(); });

    expect(result.current.status).toBe('success');
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('should show loading state while fetching', async () => {
    let resolve: (value: unknown) => void;
    vi.mocked(fetch).mockReturnValue(
      new Promise(r => { resolve = r; }) as Promise<Response>
    );

    const { result } = renderHook(() => useFetch('/api/slow'));
    expect(result.current.loading).toBe(true);

    await act(async () => {
      resolve!({ ok: true, status: 200, json: () => Promise.resolve({}) } as Response);
    });
  });

  it('should reset state', async () => {
    mockFetch({ id: 1 });
    const { result } = renderHook(() => useFetch('/api/user'));

    await waitFor(() => expect(result.current.status).toBe('success'));
    act(() => result.current.reset());
    expect(result.current.status).toBe('idle');
    expect(result.current.data).toBeNull();
  });

  // BUG 1: a changed `url` prop must trigger a NEW fetch for the new url.
  // Mutation-proof: if the re-fetch-on-asyncFn-change effect is reverted to an
  // empty dep array, fetch is never called for '/api/users/2' and the final
  // data stays { id: 1 }, failing both assertions below.
  it('should re-fetch when the url prop changes', async () => {
    vi.mocked(fetch).mockImplementation((input: RequestInfo | URL) =>
      Promise.resolve({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: () =>
          Promise.resolve(
            String(input) === '/api/users/2' ? { id: 2 } : { id: 1 }
          ),
      } as Response)
    );

    const { result, rerender } = renderHook(
      ({ url }: { url: string }) => useFetch<{ id: number }>(url),
      { initialProps: { url: '/api/users/1' } }
    );

    await waitFor(() => expect(result.current.data).toEqual({ id: 1 }));

    rerender({ url: '/api/users/2' });

    await waitFor(() => expect(result.current.data).toEqual({ id: 2 }));
    expect(fetch).toHaveBeenCalledWith(
      '/api/users/2',
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
  });

  // BUG 2: aborting the previous in-flight request (on re-fetch) must NOT leave
  // the hook in an error state. The aborted fetch rejects with an AbortError.
  // Mutation-proof: if useAsync stops ignoring AbortError (or drops the
  // request-id guard), the aborted first request dispatches { type: 'error' }
  // and the final status is 'error' (AbortError) instead of the latest success.
  it('should not surface AbortError when a re-fetch aborts the previous request', async () => {
    // First request resolves only after we have aborted it; the abort makes its
    // signal fire 'AbortError'. Second request resolves promptly with success.
    let resolveFirst: ((value: Response) => void) | undefined;

    vi.mocked(fetch).mockImplementation(
      (input: RequestInfo | URL, init?: RequestInit) => {
        const signal = init?.signal;
        if (String(input) === '/api/v1') {
          return new Promise<Response>((resolve, reject) => {
            resolveFirst = resolve;
            signal?.addEventListener('abort', () =>
              reject(
                new DOMException('The operation was aborted.', 'AbortError')
              )
            );
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          statusText: 'OK',
          json: () => Promise.resolve({ id: 2 }),
        } as Response);
      }
    );

    const { result, rerender } = renderHook(
      ({ url }: { url: string }) => useFetch<{ id: number }>(url),
      { initialProps: { url: '/api/v1' } }
    );

    // First request is in-flight (loading), not yet resolved.
    expect(result.current.status).toBe('loading');

    // Change url -> new fetchFn -> useAsync re-runs execute(), which aborts the
    // first controller and starts the second request.
    rerender({ url: '/api/v2' });

    // The second (latest) request wins with success.
    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.data).toEqual({ id: 2 });

    // Even if the (now-aborted/stale) first request were to settle late, it must
    // not flip the hook into an error state.
    await act(async () => {
      resolveFirst?.({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: () => Promise.resolve({ id: 1 }),
      } as Response);
      await Promise.resolve();
    });

    expect(result.current.status).toBe('success');
    expect(result.current.data).toEqual({ id: 2 });
    expect(result.current.error).toBeNull();
  });

  // ALSO: useFetch documents "automatic abort on unmount". Mutation-proof: if
  // the unmount-cleanup abort effect is removed, the controller's signal is
  // never aborted and this assertion fails.
  it('should abort the in-flight request on unmount', async () => {
    let capturedSignal: AbortSignal | undefined;

    vi.mocked(fetch).mockImplementation(
      (_input: RequestInfo | URL, init?: RequestInit) => {
        capturedSignal = init?.signal ?? undefined;
        // Never resolves — request stays in-flight until aborted.
        return new Promise<Response>(() => {});
      }
    );

    const { result, unmount } = renderHook(() => useFetch('/api/slow'));

    expect(result.current.status).toBe('loading');
    expect(capturedSignal).toBeDefined();
    expect(capturedSignal?.aborted).toBe(false);

    unmount();

    expect(capturedSignal?.aborted).toBe(true);
  });
});
