import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWindowSize } from './index';

describe('useWindowSize', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 768, writable: true, configurable: true });
  });

  it('should return the current window size', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1280, writable: true, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 800, writable: true, configurable: true });

    const { result } = renderHook(() => useWindowSize());

    expect(result.current.width).toBe(1280);
    expect(result.current.height).toBe(800);
  });

  it('should update on window resize', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 768, writable: true, configurable: true });

    const { result } = renderHook(() => useWindowSize());

    expect(result.current.width).toBe(1024);
    expect(result.current.height).toBe(768);

    act(() => {
      Object.defineProperty(window, 'innerWidth', { value: 375, writable: true, configurable: true });
      Object.defineProperty(window, 'innerHeight', { value: 667, writable: true, configurable: true });
      window.dispatchEvent(new Event('resize'));
    });

    expect(result.current.width).toBe(375);
    expect(result.current.height).toBe(667);
  });

  it('should clean up event listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useWindowSize());

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
  });

  it('should handle multiple resize events', () => {
    const { result } = renderHook(() => useWindowSize());
    const sizes = [320, 768, 1024, 1440];

    sizes.forEach(width => {
      act(() => {
        Object.defineProperty(window, 'innerWidth', { value: width, writable: true, configurable: true });
        window.dispatchEvent(new Event('resize'));
      });
      expect(result.current.width).toBe(width);
    });
  });

  it('should return width and height as numbers', () => {
    const { result } = renderHook(() => useWindowSize());

    expect(typeof result.current.width).toBe('number');
    expect(typeof result.current.height).toBe('number');
  });
});
