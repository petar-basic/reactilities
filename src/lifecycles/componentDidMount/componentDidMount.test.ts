import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { componentDidMount } from './index';

describe('componentDidMount', () => {
  it('should call function once after mount', () => {
    const mockFn = vi.fn();
    
    renderHook(() => componentDidMount(mockFn));
    
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should not call function again on re-render', () => {
    const mockFn = vi.fn();
    
    const { rerender } = renderHook(() => componentDidMount(mockFn));
    
    expect(mockFn).toHaveBeenCalledTimes(1);
    
    rerender();
    rerender();
    
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should handle function that returns a value', () => {
    const mockFn = vi.fn(() => 'test value');
    
    renderHook(() => componentDidMount(mockFn));
    
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveReturnedWith('test value');
  });

  it('should handle async function', async () => {
    const mockFn = vi.fn(async () => {
      return Promise.resolve('async result');
    });
    
    renderHook(() => componentDidMount(mockFn));
    
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should handle function with side effects', () => {
    let counter = 0;
    const mockFn = vi.fn(() => {
      counter++;
    });
    
    renderHook(() => componentDidMount(mockFn));
    
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(counter).toBe(1);
  });
});
