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
});
