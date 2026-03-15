import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useState } from 'react';
import { usePrevious } from './index';

describe('usePrevious', () => {
  it('should return undefined on first render', () => {
    const { result } = renderHook(() => usePrevious('initial'));
    expect(result.current).toBeUndefined();
  });

  it('should return previous string value after update', () => {
    const { result, rerender } = renderHook(
      ({ value }) => usePrevious(value),
      { initialProps: { value: 'first' } }
    );

    expect(result.current).toBeUndefined();

    rerender({ value: 'second' });
    expect(result.current).toBe('first');

    rerender({ value: 'third' });
    expect(result.current).toBe('second');
  });

  it('should return previous number value', () => {
    const { result, rerender } = renderHook(
      ({ value }) => usePrevious(value),
      { initialProps: { value: 0 } }
    );

    rerender({ value: 42 });
    expect(result.current).toBe(0);

    rerender({ value: 100 });
    expect(result.current).toBe(42);
  });

  it('should return previous boolean value', () => {
    const { result, rerender } = renderHook(
      ({ value }) => usePrevious(value),
      { initialProps: { value: false } }
    );

    rerender({ value: true });
    expect(result.current).toBe(false);
  });

  it('should return previous object reference', () => {
    const obj1 = { name: 'Alice' };
    const obj2 = { name: 'Bob' };

    const { result, rerender } = renderHook(
      ({ value }) => usePrevious(value),
      { initialProps: { value: obj1 } }
    );

    rerender({ value: obj2 });
    expect(result.current).toBe(obj1);
  });

  it('should return previous null value', () => {
    const { result, rerender } = renderHook(
      ({ value }) => usePrevious(value),
      { initialProps: { value: 'hello' as string | null } }
    );

    rerender({ value: null });
    expect(result.current).toBe('hello');

    rerender({ value: 'world' });
    expect(result.current).toBeNull();
  });

  it('should work with useState updates', () => {
    const { result } = renderHook(() => {
      const [count, setCount] = useState(0);
      const prev = usePrevious(count);
      return { count, prev, setCount };
    });

    expect(result.current.prev).toBeUndefined();
    expect(result.current.count).toBe(0);

    act(() => result.current.setCount(5));
    expect(result.current.prev).toBe(0);
    expect(result.current.count).toBe(5);

    act(() => result.current.setCount(10));
    expect(result.current.prev).toBe(5);
    expect(result.current.count).toBe(10);
  });

  it('should not update when same value is passed', () => {
    const { result, rerender } = renderHook(
      ({ value }) => usePrevious(value),
      { initialProps: { value: 'same' } }
    );

    rerender({ value: 'changed' });
    expect(result.current).toBe('same');

    rerender({ value: 'changed' });
    expect(result.current).toBe('changed');
  });
});
