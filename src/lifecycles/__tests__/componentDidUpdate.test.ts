import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { componentDidUpdate } from '../componentDidUpdate';
import { useState } from 'react';

describe('componentDidUpdate', () => {
  it('should call function after every render', () => {
    const mockFn = vi.fn();
    
    const { rerender } = renderHook(() => componentDidUpdate(mockFn));
    
    // First render - useEffect runs
    expect(mockFn).toHaveBeenCalledTimes(1);
    
    rerender();
    expect(mockFn).toHaveBeenCalledTimes(2);
    
    rerender();
    expect(mockFn).toHaveBeenCalledTimes(3);
  });

  it('should call function on state changes', () => {
    const mockFn = vi.fn();
    
    const { rerender } = renderHook(({ count }) => {
      const [state, setState] = useState(count);
      componentDidUpdate(mockFn);
      return { state, setState };
    }, { initialProps: { count: 0 } });
    
    expect(mockFn).toHaveBeenCalledTimes(1);
    
    rerender({ count: 1 });
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('should handle function that returns a value', () => {
    const mockFn = vi.fn(() => 'update value');
    
    const { rerender } = renderHook(() => componentDidUpdate(mockFn));
    
    expect(mockFn).toHaveBeenCalledTimes(1);
    
    rerender();
    expect(mockFn).toHaveBeenCalledTimes(2);
    expect(mockFn).toHaveReturnedWith('update value');
  });

  it('should handle side effects on every update', () => {
    let counter = 0;
    const mockFn = vi.fn(() => {
      counter++;
    });
    
    const { rerender } = renderHook(() => componentDidUpdate(mockFn));
    
    expect(counter).toBe(1);
    
    rerender();
    rerender();
    
    expect(counter).toBe(3);
    expect(mockFn).toHaveBeenCalledTimes(3);
  });

  it('should call function on mount and updates', () => {
    const mockFn = vi.fn();
    
    renderHook(() => componentDidUpdate(mockFn));
    
    // Called on mount
    expect(mockFn).toHaveBeenCalledTimes(1);
  });
});
