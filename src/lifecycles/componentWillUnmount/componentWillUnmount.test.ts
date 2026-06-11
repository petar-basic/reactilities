import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { componentWillUnmount } from './index';

describe('componentWillUnmount', () => {
  it('should call cleanup function on unmount', () => {
    const mockFn = vi.fn();
    
    const { unmount } = renderHook(() => componentWillUnmount(mockFn));
    
    expect(mockFn).not.toHaveBeenCalled();
    
    unmount();
    
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should not call cleanup function before unmount', () => {
    const mockFn = vi.fn();
    
    const { rerender } = renderHook(() => componentWillUnmount(mockFn));
    
    rerender();
    rerender();
    
    expect(mockFn).not.toHaveBeenCalled();
  });

  it('should handle cleanup function that returns a value', () => {
    const mockFn = vi.fn(() => 'cleanup value');
    
    const { unmount } = renderHook(() => componentWillUnmount(mockFn));
    
    unmount();
    
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveReturnedWith('cleanup value');
  });

  it('should handle cleanup with side effects', () => {
    let cleaned = false;
    const mockFn = vi.fn(() => {
      cleaned = true;
    });
    
    const { unmount } = renderHook(() => componentWillUnmount(mockFn));
    
    expect(cleaned).toBe(false);
    
    unmount();
    
    expect(cleaned).toBe(true);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should invoke the LATEST callback on unmount, not the first-render one', () => {
    // Simulate a callback that closes over a changing state/prop value.
    // The hook is called every render with a fresh closure; the cleanup
    // must observe the most recent value, not the one captured at mount.
    let observed: string | undefined;

    const { rerender, unmount } = renderHook(
      ({ value }: { value: string }) =>
        componentWillUnmount(() => {
          observed = value;
        }),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'updated' });
    rerender({ value: 'latest' });

    expect(observed).toBeUndefined();

    unmount();

    expect(observed).toBe('latest');
  });

  it('should run the cleanup exactly once on unmount, even after re-renders', () => {
    const mockFn = vi.fn();

    const { rerender, unmount } = renderHook(() => componentWillUnmount(mockFn));

    rerender();
    rerender();

    expect(mockFn).not.toHaveBeenCalled();

    unmount();

    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should handle event listener cleanup', () => {
    const removeEventListener = vi.fn();
    const mockFn = vi.fn(() => {
      removeEventListener('click', () => {});
    });
    
    const { unmount } = renderHook(() => componentWillUnmount(mockFn));
    
    unmount();
    
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(removeEventListener).toHaveBeenCalledTimes(1);
  });
});
