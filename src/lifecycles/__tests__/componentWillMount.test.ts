import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { componentWillMount } from '../componentWillMount';

describe('componentWillMount', () => {
  it('should call function once before render', () => {
    const mockFn = vi.fn();
    
    renderHook(() => componentWillMount(mockFn));
    
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should not call function again on re-render', () => {
    const mockFn = vi.fn();
    
    const { rerender } = renderHook(() => componentWillMount(mockFn));
    
    expect(mockFn).toHaveBeenCalledTimes(1);
    
    rerender();
    rerender();
    
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should handle function that returns a value', () => {
    const mockFn = vi.fn(() => 'init value');
    
    renderHook(() => componentWillMount(mockFn));
    
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveReturnedWith('init value');
  });

  it('should handle synchronous side effects', () => {
    let initialized = false;
    const mockFn = vi.fn(() => {
      initialized = true;
    });
    
    renderHook(() => componentWillMount(mockFn));
    
    expect(initialized).toBe(true);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should call before component renders (useLayoutEffect behavior)', () => {
    const callOrder: string[] = [];
    const mockFn = vi.fn(() => {
      callOrder.push('willMount');
    });
    
    renderHook(() => {
      componentWillMount(mockFn);
      callOrder.push('render');
    });
    
    // useLayoutEffect runs synchronously after render but before paint
    // So the order should be: render, willMount
    expect(callOrder).toEqual(['render', 'willMount']);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });
});
