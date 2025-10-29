import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useObjectState } from '../useObjectState';

describe('useObjectState', () => {
  it('should initialize with provided object', () => {
    const initialState = { name: 'John', age: 30 };
    const { result } = renderHook(() => useObjectState(initialState));
    
    expect(result.current[0]).toEqual(initialState);
  });

  it('should update with partial object', () => {
    const { result } = renderHook(() => 
      useObjectState({ name: 'John', age: 30, email: 'john@example.com' })
    );
    
    act(() => {
      result.current[1]({ name: 'Jane' });
    });
    
    expect(result.current[0]).toEqual({
      name: 'Jane',
      age: 30,
      email: 'john@example.com'
    });
  });

  it('should update with functional updater', () => {
    const { result } = renderHook(() => 
      useObjectState({ name: 'John', age: 30 })
    );
    
    act(() => {
      result.current[1]((s) => ({ age: s.age + 1 }));
    });
    
    expect(result.current[0]).toEqual({
      name: 'John',
      age: 31
    });
  });

  it('should handle multiple partial updates', () => {
    const { result } = renderHook(() => 
      useObjectState({ name: 'John', age: 30, city: 'NYC' })
    );
    
    act(() => {
      result.current[1]({ name: 'Jane' });
      result.current[1]({ age: 25 });
      result.current[1]({ city: 'LA' });
    });
    
    expect(result.current[0]).toEqual({
      name: 'Jane',
      age: 25,
      city: 'LA'
    });
  });

  it('should handle functional update with multiple properties', () => {
    const { result } = renderHook(() => 
      useObjectState({ count: 0, total: 100 })
    );
    
    act(() => {
      result.current[1]((s) => ({ 
        count: s.count + 1,
        total: s.total - 10
      }));
    });
    
    expect(result.current[0]).toEqual({
      count: 1,
      total: 90
    });
  });

  it('should ignore non-plain-object updates', () => {
    const { result } = renderHook(() => 
      useObjectState({ name: 'John', age: 30 })
    );
    
    const initialState = result.current[0];
    
    act(() => {
      result.current[1]('string' as any);
    });
    
    expect(result.current[0]).toEqual(initialState);
  });

  it('should ignore functional updates that return non-plain-object', () => {
    const { result } = renderHook(() => 
      useObjectState({ name: 'John', age: 30 })
    );
    
    const initialState = result.current[0];
    
    act(() => {
      result.current[1](() => 'string' as any);
    });
    
    expect(result.current[0]).toEqual(initialState);
  });

  it('should handle empty object update', () => {
    const { result } = renderHook(() => 
      useObjectState({ name: 'John', age: 30 })
    );
    
    act(() => {
      result.current[1]({});
    });
    
    expect(result.current[0]).toEqual({
      name: 'John',
      age: 30
    });
  });

  it('should handle adding new properties', () => {
    const { result } = renderHook(() => 
      useObjectState({ name: 'John' } as any)
    );
    
    act(() => {
      result.current[1]({ age: 30 } as any);
    });
    
    expect(result.current[0]).toEqual({
      name: 'John',
      age: 30
    });
  });

  it('should handle complex nested updates', () => {
    const { result } = renderHook(() => 
      useObjectState({ 
        user: { name: 'John' }, 
        settings: { theme: 'light' } 
      } as any)
    );
    
    act(() => {
      result.current[1]({ 
        user: { name: 'Jane' } 
      } as any);
    });
    
    expect(result.current[0]).toEqual({
      user: { name: 'Jane' },
      settings: { theme: 'light' }
    });
  });
});
