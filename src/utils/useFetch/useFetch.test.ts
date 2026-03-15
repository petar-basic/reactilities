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
});
