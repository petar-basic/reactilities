import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCookie } from './index';

describe('useCookie', () => {
  beforeEach(() => {
    // Clear all cookies between tests
    document.cookie.split(';').forEach(cookie => {
      const name = cookie.split('=')[0].trim();
      document.cookie = `${name}=; expires=${new Date(0).toUTCString()}; path=/`;
    });
  });

  it('should return null when cookie does not exist', () => {
    const { result } = renderHook(() => useCookie('nonexistent'));
    expect(result.current[0]).toBeNull();
  });

  it('should set a cookie and update state', () => {
    const { result } = renderHook(() => useCookie('test-cookie'));

    act(() => result.current[1]('hello'));
    expect(result.current[0]).toBe('hello');
    expect(document.cookie).toContain('test-cookie');
  });

  it('should delete a cookie', () => {
    const { result } = renderHook(() => useCookie('delete-me'));

    act(() => result.current[1]('value'));
    expect(result.current[0]).toBe('value');

    act(() => result.current[2]());
    expect(result.current[0]).toBeNull();
  });

  it('should handle special characters in cookie value', () => {
    const { result } = renderHook(() => useCookie('encoded'));

    act(() => result.current[1]('hello world & more'));
    expect(result.current[0]).toBe('hello world & more');
  });

  it('should handle updating cookie value', () => {
    const { result } = renderHook(() => useCookie('updatable'));

    act(() => result.current[1]('first'));
    expect(result.current[0]).toBe('first');

    act(() => result.current[1]('second'));
    expect(result.current[0]).toBe('second');
  });

  it('should accept cookie options', () => {
    const { result } = renderHook(() => useCookie('options-cookie'));

    act(() => result.current[1]('value', { path: '/', secure: false, sameSite: 'Lax' }));
    expect(result.current[0]).toBe('value');
  });

  it('should return stable setCookie and deleteCookie references', () => {
    const { result, rerender } = renderHook(() => useCookie('stable'));

    const setCookie1 = result.current[1];
    const deleteCookie1 = result.current[2];

    rerender();

    expect(result.current[1]).toBe(setCookie1);
    expect(result.current[2]).toBe(deleteCookie1);
  });
});
