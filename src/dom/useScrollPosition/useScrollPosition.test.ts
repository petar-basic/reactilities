import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useScrollPosition } from './index';

describe('useScrollPosition', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(window, 'scrollX', { value: 0, writable: true, configurable: true });
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true, configurable: true });
  });

  it('should return initial scroll position as 0', () => {
    Object.defineProperty(window, 'scrollX', { value: 0, writable: true, configurable: true });
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true, configurable: true });

    const { result } = renderHook(() => useScrollPosition());
    expect(result.current).toEqual({ x: 0, y: 0 });
  });

  it('should update on scroll event', () => {
    const { result } = renderHook(() => useScrollPosition());

    act(() => {
      Object.defineProperty(window, 'scrollX', { value: 100, writable: true, configurable: true });
      Object.defineProperty(window, 'scrollY', { value: 500, writable: true, configurable: true });
      window.dispatchEvent(new Event('scroll'));
    });

    expect(result.current).toEqual({ x: 100, y: 500 });
  });

  it('should track multiple scroll events', () => {
    const { result } = renderHook(() => useScrollPosition());

    act(() => {
      Object.defineProperty(window, 'scrollY', { value: 200, writable: true, configurable: true });
      window.dispatchEvent(new Event('scroll'));
    });
    expect(result.current.y).toBe(200);

    act(() => {
      Object.defineProperty(window, 'scrollY', { value: 0, writable: true, configurable: true });
      window.dispatchEvent(new Event('scroll'));
    });
    expect(result.current.y).toBe(0);
  });

  it('should clean up event listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useScrollPosition());

    unmount();
    expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
  });

  it('should return x and y as numbers', () => {
    const { result } = renderHook(() => useScrollPosition());
    expect(typeof result.current.x).toBe('number');
    expect(typeof result.current.y).toBe('number');
  });
});
