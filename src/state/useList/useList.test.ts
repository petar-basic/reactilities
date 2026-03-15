import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useList } from './index';

describe('useList', () => {
  it('should initialize with empty array by default', () => {
    const { result } = renderHook(() => useList());
    expect(result.current.list).toEqual([]);
  });

  it('should initialize with provided list', () => {
    const { result } = renderHook(() => useList([1, 2, 3]));
    expect(result.current.list).toEqual([1, 2, 3]);
  });

  it('set() should replace the entire list', () => {
    const { result } = renderHook(() => useList([1, 2, 3]));
    act(() => result.current.set([10, 20]));
    expect(result.current.list).toEqual([10, 20]);
  });

  it('push() should append items to the end', () => {
    const { result } = renderHook(() => useList([1, 2]));
    act(() => result.current.push(3));
    expect(result.current.list).toEqual([1, 2, 3]);
  });

  it('push() should append multiple items at once', () => {
    const { result } = renderHook(() => useList<number>([]));
    act(() => result.current.push(1, 2, 3));
    expect(result.current.list).toEqual([1, 2, 3]);
  });

  it('removeAt() should remove item at given index', () => {
    const { result } = renderHook(() => useList(['a', 'b', 'c']));
    act(() => result.current.removeAt(1));
    expect(result.current.list).toEqual(['a', 'c']);
  });

  it('insertAt() should insert item at given index', () => {
    const { result } = renderHook(() => useList(['a', 'c']));
    act(() => result.current.insertAt(1, 'b'));
    expect(result.current.list).toEqual(['a', 'b', 'c']);
  });

  it('updateAt() should replace item at given index', () => {
    const { result } = renderHook(() => useList(['a', 'b', 'c']));
    act(() => result.current.updateAt(1, 'B'));
    expect(result.current.list).toEqual(['a', 'B', 'c']);
  });

  it('filter() should keep only items matching predicate', () => {
    const { result } = renderHook(() => useList([1, 2, 3, 4, 5]));
    act(() => result.current.filter(n => n % 2 === 0));
    expect(result.current.list).toEqual([2, 4]);
  });

  it('sort() should sort the list', () => {
    const { result } = renderHook(() => useList([3, 1, 2]));
    act(() => result.current.sort((a, b) => a - b));
    expect(result.current.list).toEqual([1, 2, 3]);
  });

  it('sort() should not mutate original list reference', () => {
    const initial = [3, 1, 2];
    const { result } = renderHook(() => useList(initial));
    act(() => result.current.sort((a, b) => a - b));
    expect(initial).toEqual([3, 1, 2]); // original unchanged
    expect(result.current.list).toEqual([1, 2, 3]);
  });

  it('clear() should empty the list', () => {
    const { result } = renderHook(() => useList([1, 2, 3]));
    act(() => result.current.clear());
    expect(result.current.list).toEqual([]);
  });

  it('should handle objects in the list', () => {
    const { result } = renderHook(() => useList<{ id: number; name: string }>([]));
    act(() => result.current.push({ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }));
    expect(result.current.list).toHaveLength(2);
    expect(result.current.list[0].name).toBe('Alice');
  });
});
