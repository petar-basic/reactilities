import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMap } from './index';

describe('useMap', () => {
  it('should initialize with empty map by default', () => {
    const { result } = renderHook(() => useMap());
    expect(result.current.map.size).toBe(0);
  });

  it('should initialize with provided entries', () => {
    const { result } = renderHook(() =>
      useMap<string, number>([['a', 1], ['b', 2]])
    );
    expect(result.current.map.size).toBe(2);
    expect(result.current.map.get('a')).toBe(1);
  });

  it('set() should add a new key-value pair', () => {
    const { result } = renderHook(() => useMap<string, string>());
    act(() => result.current.set('name', 'Alice'));
    expect(result.current.map.get('name')).toBe('Alice');
    expect(result.current.map.size).toBe(1);
  });

  it('set() should update existing key', () => {
    const { result } = renderHook(() => useMap<string, number>([['count', 0]]));
    act(() => result.current.set('count', 5));
    expect(result.current.map.get('count')).toBe(5);
    expect(result.current.map.size).toBe(1);
  });

  it('get() should return correct value', () => {
    const { result } = renderHook(() => useMap<string, string>([['key', 'value']]));
    expect(result.current.get('key')).toBe('value');
    expect(result.current.get('missing')).toBeUndefined();
  });

  it('delete() should remove a key', () => {
    const { result } = renderHook(() => useMap<string, number>([['a', 1], ['b', 2]]));
    act(() => result.current.delete('a'));
    expect(result.current.map.has('a')).toBe(false);
    expect(result.current.map.size).toBe(1);
  });

  it('has() should return correct boolean', () => {
    const { result } = renderHook(() => useMap<string, number>([['x', 42]]));
    expect(result.current.has('x')).toBe(true);
    expect(result.current.has('y')).toBe(false);
  });

  it('clear() should empty the map', () => {
    const { result } = renderHook(() => useMap<string, number>([['a', 1], ['b', 2]]));
    act(() => result.current.clear());
    expect(result.current.map.size).toBe(0);
  });

  it('reset() should replace map with new entries', () => {
    const { result } = renderHook(() => useMap<string, number>([['old', 1]]));
    act(() => result.current.reset([['new1', 10], ['new2', 20]]));
    expect(result.current.map.size).toBe(2);
    expect(result.current.map.has('old')).toBe(false);
    expect(result.current.map.get('new1')).toBe(10);
  });

  it('reset() with no args should empty the map', () => {
    const { result } = renderHook(() => useMap<string, number>([['a', 1]]));
    act(() => result.current.reset());
    expect(result.current.map.size).toBe(0);
  });

  it('should create new Map references on mutation', () => {
    const { result } = renderHook(() => useMap<string, number>());
    const before = result.current.map;
    act(() => result.current.set('x', 1));
    expect(result.current.map).not.toBe(before);
  });
});
