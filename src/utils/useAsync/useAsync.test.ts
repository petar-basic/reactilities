import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAsync } from './index';

describe('useAsync', () => {
  it('should start with idle state when immediate is false', () => {
    const asyncFn = vi.fn().mockResolvedValue('data');
    const { result } = renderHook(() => useAsync(asyncFn, false));

    expect(result.current.status).toBe('idle');
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(asyncFn).not.toHaveBeenCalled();
  });

  it('should execute immediately when immediate is true', async () => {
    const asyncFn = vi.fn().mockResolvedValue('hello');
    const { result } = renderHook(() => useAsync(asyncFn, true));

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.data).toBe('hello');
    expect(asyncFn).toHaveBeenCalledTimes(1);
  });

  it('should set loading state while running', async () => {
    let resolve: (value: string) => void;
    const asyncFn = vi.fn().mockReturnValue(new Promise<string>(r => { resolve = r; }));

    const { result } = renderHook(() => useAsync(asyncFn, false));

    act(() => { result.current.execute(); });
    expect(result.current.status).toBe('loading');
    expect(result.current.loading).toBe(true);

    await act(async () => { resolve!('done'); });
    expect(result.current.status).toBe('success');
    expect(result.current.loading).toBe(false);
  });

  it('should set error state on rejection', async () => {
    const error = new Error('Something went wrong');
    const asyncFn = vi.fn().mockRejectedValue(error);

    const { result } = renderHook(() => useAsync(asyncFn, false));
    await act(async () => { await result.current.execute(); });

    expect(result.current.status).toBe('error');
    expect(result.current.error).toBe(error);
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('should wrap non-Error rejections in Error object', async () => {
    const asyncFn = vi.fn().mockRejectedValue('plain string error');
    const { result } = renderHook(() => useAsync(asyncFn, false));

    await act(async () => { await result.current.execute(); });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('plain string error');
  });

  it('should reset state to idle', async () => {
    const asyncFn = vi.fn().mockResolvedValue('data');
    const { result } = renderHook(() => useAsync(asyncFn, true));

    await waitFor(() => expect(result.current.status).toBe('success'));

    act(() => result.current.reset());
    expect(result.current.status).toBe('idle');
    expect(result.current.data).toBeNull();
  });

  it('should allow manual re-execution', async () => {
    const asyncFn = vi.fn()
      .mockResolvedValueOnce('first')
      .mockResolvedValueOnce('second');

    const { result } = renderHook(() => useAsync(asyncFn, true));
    await waitFor(() => expect(result.current.data).toBe('first'));

    await act(async () => { await result.current.execute(); });
    expect(result.current.data).toBe('second');
    expect(asyncFn).toHaveBeenCalledTimes(2);
  });

  it('should not update state after unmount', async () => {
    let resolve: (value: string) => void;
    const asyncFn = vi.fn().mockReturnValue(new Promise<string>(r => { resolve = r; }));

    const { result, unmount } = renderHook(() => useAsync(asyncFn, false));
    act(() => { result.current.execute(); });

    unmount();

    await act(async () => { resolve!('late data'); });

    // No crash = test passes; state remains loading since unmounted
    expect(result.current.status).toBe('loading');
  });

  it('should handle object data', async () => {
    const user = { id: 1, name: 'Alice' };
    const asyncFn = vi.fn().mockResolvedValue(user);
    const { result } = renderHook(() => useAsync(asyncFn, true));

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.data).toEqual(user);
  });

  // BUG 2 (isolated): an AbortError from the LATEST, still-mounted request must
  // be swallowed, not surfaced as error state. Here there is no newer execute()
  // and the hook stays mounted, so the request-id/mounted guards do NOT apply —
  // only the explicit isAbortError check prevents the error dispatch.
  // Mutation-proof: remove `if (isAbortError(err)) return;` and the loading
  // state flips to 'error', failing the assertions below.
  it('should swallow AbortError from the latest request without erroring', async () => {
    let reject: ((reason: unknown) => void) | undefined;
    const asyncFn = vi.fn().mockReturnValue(
      new Promise<string>((_, r) => { reject = r; })
    );

    const { result } = renderHook(() => useAsync(asyncFn, false));

    act(() => { result.current.execute(); });
    expect(result.current.status).toBe('loading');

    await act(async () => {
      reject?.(new DOMException('The operation was aborted.', 'AbortError'));
      await Promise.resolve();
    });

    expect(result.current.status).toBe('loading');
    expect(result.current.error).toBeNull();
  });

  // BUG 3: out-of-order results. A slower, OLDER execute() must not overwrite a
  // newer one's result. Mutation-proof: without the request-id guard in
  // useAsync, resolving the first (older) call AFTER the second (newer) call
  // dispatches 'first', so the final data would be 'first' instead of 'second'.
  it('should ignore an older execute() result that resolves after a newer one', async () => {
    let resolveFirst: ((value: string) => void) | undefined;
    let resolveSecond: ((value: string) => void) | undefined;

    const asyncFn = vi
      .fn()
      .mockReturnValueOnce(new Promise<string>(r => { resolveFirst = r; }))
      .mockReturnValueOnce(new Promise<string>(r => { resolveSecond = r; }));

    const { result } = renderHook(() => useAsync(asyncFn, false));

    // Kick off two overlapping executions.
    act(() => { result.current.execute(); });
    act(() => { result.current.execute(); });

    // Resolve the NEWER (second) one first -> it wins.
    await act(async () => { resolveSecond?.('second'); });
    expect(result.current.data).toBe('second');

    // Now resolve the OLDER (first) one late -> it must be ignored.
    await act(async () => { resolveFirst?.('first'); });

    expect(result.current.status).toBe('success');
    expect(result.current.data).toBe('second');
  });
});
