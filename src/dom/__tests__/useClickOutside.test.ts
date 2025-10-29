import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useClickOutside } from '../useClickOutside';
import { useRef } from 'react';

describe('useClickOutside', () => {
  let container: HTMLDivElement;
  let element: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    element = document.createElement('div');
    container.appendChild(element);
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should call handler when clicking outside element', () => {
    const handler = vi.fn();
    
    renderHook(() => {
      const ref = useRef<HTMLDivElement>(element);
      useClickOutside(ref, handler);
      return ref;
    });

    const outsideElement = document.createElement('div');
    document.body.appendChild(outsideElement);

    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(clickEvent, 'target', {
      value: outsideElement,
      enumerable: true
    });

    document.dispatchEvent(clickEvent);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(clickEvent);

    document.body.removeChild(outsideElement);
  });

  it('should not call handler when clicking inside element', () => {
    const handler = vi.fn();
    
    renderHook(() => {
      const ref = useRef<HTMLDivElement>(element);
      useClickOutside(ref, handler);
      return ref;
    });

    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(clickEvent, 'target', {
      value: element,
      enumerable: true
    });

    document.dispatchEvent(clickEvent);

    expect(handler).not.toHaveBeenCalled();
  });

  it('should call handler on touch events outside element', () => {
    const handler = vi.fn();
    
    renderHook(() => {
      const ref = useRef<HTMLDivElement>(element);
      useClickOutside(ref, handler);
      return ref;
    });

    const outsideElement = document.createElement('div');
    document.body.appendChild(outsideElement);

    const touchEvent = new TouchEvent('touchstart', {
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(touchEvent, 'target', {
      value: outsideElement,
      enumerable: true
    });

    document.dispatchEvent(touchEvent);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(touchEvent);

    document.body.removeChild(outsideElement);
  });

  it('should not call handler on touch events inside element', () => {
    const handler = vi.fn();
    
    renderHook(() => {
      const ref = useRef<HTMLDivElement>(element);
      useClickOutside(ref, handler);
      return ref;
    });

    const touchEvent = new TouchEvent('touchstart', {
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(touchEvent, 'target', {
      value: element,
      enumerable: true
    });

    document.dispatchEvent(touchEvent);

    expect(handler).not.toHaveBeenCalled();
  });

  it('should not call handler when ref is null', () => {
    const handler = vi.fn();
    
    renderHook(() => {
      const ref = useRef<HTMLDivElement | null>(null);
      useClickOutside(ref as any, handler);
      return ref;
    });

    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(clickEvent, 'target', {
      value: document.body,
      enumerable: true
    });

    document.dispatchEvent(clickEvent);

    expect(handler).not.toHaveBeenCalled();
  });

  it('should remove event listeners on unmount', () => {
    const handler = vi.fn();
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
    
    const { unmount } = renderHook(() => {
      const ref = useRef<HTMLDivElement>(element);
      useClickOutside(ref, handler);
      return ref;
    });

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('touchstart', expect.any(Function));

    removeEventListenerSpy.mockRestore();
  });

  it('should handle clicking on child elements', () => {
    const handler = vi.fn();
    const childElement = document.createElement('span');
    element.appendChild(childElement);
    
    renderHook(() => {
      const ref = useRef<HTMLDivElement>(element);
      useClickOutside(ref, handler);
      return ref;
    });

    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(clickEvent, 'target', {
      value: childElement,
      enumerable: true
    });

    document.dispatchEvent(clickEvent);

    expect(handler).not.toHaveBeenCalled();
  });
});
