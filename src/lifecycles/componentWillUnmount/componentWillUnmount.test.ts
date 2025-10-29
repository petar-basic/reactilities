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
