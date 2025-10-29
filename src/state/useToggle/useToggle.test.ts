import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useToggle } from './index';

describe('useToggle', () => {
  it('should initialize with default value true', () => {
    const { result } = renderHook(() => useToggle());
    
    expect(result.current[0]).toBe(true);
  });

  it('should initialize with provided boolean value', () => {
    const { result } = renderHook(() => useToggle(false));
    
    expect(result.current[0]).toBe(false);
  });

  it('should initialize with truthy value', () => {
    const { result } = renderHook(() => useToggle('hello' as any));
    
    expect(result.current[0]).toBe(true);
  });

  it('should initialize with falsy value', () => {
    const { result } = renderHook(() => useToggle(0 as any));
    
    expect(result.current[0]).toBe(false);
  });

  it('should toggle value when called without arguments', () => {
    const { result } = renderHook(() => useToggle(false));
    
    expect(result.current[0]).toBe(false);
    
    act(() => {
      result.current[1]();
    });
    
    expect(result.current[0]).toBe(true);
    
    act(() => {
      result.current[1]();
    });
    
    expect(result.current[0]).toBe(false);
  });

  it('should set to true when called with true', () => {
    const { result } = renderHook(() => useToggle(false));
    
    expect(result.current[0]).toBe(false);
    
    act(() => {
      result.current[1](true);
    });
    
    expect(result.current[0]).toBe(true);
  });

  it('should set to false when called with false', () => {
    const { result } = renderHook(() => useToggle(true));
    
    expect(result.current[0]).toBe(true);
    
    act(() => {
      result.current[1](false);
    });
    
    expect(result.current[0]).toBe(false);
  });

  it('should toggle when called with non-boolean value', () => {
    const { result } = renderHook(() => useToggle(false));
    
    expect(result.current[0]).toBe(false);
    
    act(() => {
      result.current[1]('string' as any);
    });
    
    expect(result.current[0]).toBe(true);
  });

  it('should handle multiple toggles', () => {
    const { result } = renderHook(() => useToggle(false));
    
    act(() => {
      result.current[1]();
      result.current[1]();
      result.current[1]();
    });
    
    expect(result.current[0]).toBe(true);
  });

  it('should handle explicit value setting multiple times', () => {
    const { result } = renderHook(() => useToggle(false));
    
    act(() => {
      result.current[1](true);
    });
    expect(result.current[0]).toBe(true);
    
    act(() => {
      result.current[1](true);
    });
    expect(result.current[0]).toBe(true);
    
    act(() => {
      result.current[1](false);
    });
    expect(result.current[0]).toBe(false);
  });
});
