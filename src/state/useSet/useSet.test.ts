import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSet } from './index';

describe('useSet', () => {
  it('should initialize with an empty set by default', () => {
    const { result } = renderHook(() => useSet());
    expect(result.current.set.size).toBe(0);
  });

  it('should initialize with provided values', () => {
    const { result } = renderHook(() => useSet([1, 2, 3]));
    expect(result.current.set.size).toBe(3);
    expect(result.current.set.has(1)).toBe(true);
  });

  it('add() should add a value', () => {
    const { result } = renderHook(() => useSet<string>());
    act(() => result.current.add('hello'));
    expect(result.current.set.has('hello')).toBe(true);
    expect(result.current.set.size).toBe(1);
  });

  it('add() should not duplicate values', () => {
    const { result } = renderHook(() => useSet([1]));
    act(() => result.current.add(1));
    expect(result.current.set.size).toBe(1);
  });

  it('remove() should remove a value', () => {
    const { result } = renderHook(() => useSet([1, 2, 3]));
    act(() => result.current.remove(2));
    expect(result.current.set.has(2)).toBe(false);
    expect(result.current.set.size).toBe(2);
  });

  it('remove() on non-existent value should not throw', () => {
    const { result } = renderHook(() => useSet([1]));
    act(() => result.current.remove(99));
    expect(result.current.set.size).toBe(1);
  });

  it('toggle() should add value if not present', () => {
    const { result } = renderHook(() => useSet<number>());
    act(() => result.current.toggle(5));
    expect(result.current.set.has(5)).toBe(true);
  });

  it('toggle() should remove value if already present', () => {
    const { result } = renderHook(() => useSet([5]));
    act(() => result.current.toggle(5));
    expect(result.current.set.has(5)).toBe(false);
  });

  it('has() should return correct boolean', () => {
    const { result } = renderHook(() => useSet([1, 2]));
    expect(result.current.has(1)).toBe(true);
    expect(result.current.has(99)).toBe(false);
  });

  it('clear() should empty the set', () => {
    const { result } = renderHook(() => useSet([1, 2, 3]));
    act(() => result.current.clear());
    expect(result.current.set.size).toBe(0);
  });

  it('reset() should replace set with new values', () => {
    const { result } = renderHook(() => useSet([1, 2, 3]));
    act(() => result.current.reset([10, 20]));
    expect(result.current.set.size).toBe(2);
    expect(result.current.set.has(10)).toBe(true);
    expect(result.current.set.has(1)).toBe(false);
  });

  it('reset() with no args should empty the set', () => {
    const { result } = renderHook(() => useSet([1, 2]));
    act(() => result.current.reset());
    expect(result.current.set.size).toBe(0);
  });

  it('should create new Set references on mutation (immutability)', () => {
    const { result } = renderHook(() => useSet<number>());
    const before = result.current.set;
    act(() => result.current.add(1));
    expect(result.current.set).not.toBe(before);
  });
});
