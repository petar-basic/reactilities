import { useEffect, useRef } from 'react';

type KeyboardEventHandler = (event: KeyboardEvent) => void;

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  handler: KeyboardEventHandler;
  preventDefault?: boolean;
  stopPropagation?: boolean;
}

interface UseKeyboardShortcutsOptions {
  target?: HTMLElement | Document | Window;
  enabled?: boolean;
}

/**
 * Hook for managing keyboard shortcuts with modifier key support
 * Handles complex key combinations and provides flexible event handling
 * 
 * @param shortcuts - Array of keyboard shortcut configurations
 * @param options - Configuration options for event handling
 * 
 * @example
 * useKeyboardShortcuts([
 *   {
 *     key: 's',
 *     ctrl: true,
 *     handler: () => handleSave(),
 *     preventDefault: true
 *   },
 *   {
 *     key: 'Escape',
 *     handler: () => handleClose()
 *   },
 *   {
 *     key: 'ArrowDown',
 *     shift: true,
 *     handler: () => handleMultiSelect()
 *   }
 * ], {
 *   target: document,
 *   enabled: true
 * });
 */
export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  options: UseKeyboardShortcutsOptions = {}
): void {
  const { target = document, enabled = true } = options;
  const shortcutsRef = useRef(shortcuts);

  // Update shortcuts ref when shortcuts change
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: Event) => {
      const keyboardEvent = event as KeyboardEvent;
      const currentShortcuts = shortcutsRef.current;

      for (const shortcut of currentShortcuts) {
        const {
          key,
          ctrl = false,
          shift = false,
          alt = false,
          meta = false,
          handler,
          preventDefault = false,
          stopPropagation = false
        } = shortcut;

        // Check if the key matches (case-insensitive for letters)
        const keyMatches = 
          keyboardEvent.key.toLowerCase() === key.toLowerCase() ||
          keyboardEvent.code.toLowerCase() === key.toLowerCase();

        // Check modifier keys
        const ctrlMatches = keyboardEvent.ctrlKey === ctrl;
        const shiftMatches = keyboardEvent.shiftKey === shift;
        const altMatches = keyboardEvent.altKey === alt;
        const metaMatches = keyboardEvent.metaKey === meta;

        if (keyMatches && ctrlMatches && shiftMatches && altMatches && metaMatches) {
          if (preventDefault) {
            keyboardEvent.preventDefault();
          }
          if (stopPropagation) {
            keyboardEvent.stopPropagation();
          }

          handler(keyboardEvent);
          break; // Stop after first match
        }
      }
    };

    const eventTarget = target as EventTarget;
    eventTarget.addEventListener('keydown', handleKeyDown);

    return () => {
      eventTarget.removeEventListener('keydown', handleKeyDown);
    };
  }, [target, enabled]);
}

/**
 * Utility function to create keyboard shortcut objects
 * Provides a more readable way to define shortcuts
 * 
 * @example
 * const shortcuts = [
 *   createShortcut('s', { ctrl: true }, handleSave),
 *   createShortcut('Escape', {}, handleClose),
 *   createShortcut('Enter', { shift: true }, handleSubmit)
 * ];
 */
export function createShortcut(
  key: string,
  modifiers: Partial<Pick<KeyboardShortcut, 'ctrl' | 'shift' | 'alt' | 'meta'>> = {},
  handler: KeyboardEventHandler,
  options: Partial<Pick<KeyboardShortcut, 'preventDefault' | 'stopPropagation'>> = {}
): KeyboardShortcut {
  return {
    key,
    ...modifiers,
    handler,
    preventDefault: true,
    ...options
  };
}

/**
 * Common keyboard shortcuts for typical applications
 */
export const COMMON_SHORTCUTS = {
  SAVE: (handler: KeyboardEventHandler) => createShortcut('s', { ctrl: true }, handler),
  COPY: (handler: KeyboardEventHandler) => createShortcut('c', { ctrl: true }, handler),
  PASTE: (handler: KeyboardEventHandler) => createShortcut('v', { ctrl: true }, handler),
  CUT: (handler: KeyboardEventHandler) => createShortcut('x', { ctrl: true }, handler),
  UNDO: (handler: KeyboardEventHandler) => createShortcut('z', { ctrl: true }, handler),
  REDO: (handler: KeyboardEventHandler) => createShortcut('z', { ctrl: true, shift: true }, handler),
  SELECT_ALL: (handler: KeyboardEventHandler) => createShortcut('a', { ctrl: true }, handler),
  FIND: (handler: KeyboardEventHandler) => createShortcut('f', { ctrl: true }, handler),
  NEW: (handler: KeyboardEventHandler) => createShortcut('n', { ctrl: true }, handler),
  OPEN: (handler: KeyboardEventHandler) => createShortcut('o', { ctrl: true }, handler),
  CLOSE: (handler: KeyboardEventHandler) => createShortcut('Escape', {}, handler),
  DELETE: (handler: KeyboardEventHandler) => createShortcut('Delete', {}, handler),
  ENTER: (handler: KeyboardEventHandler) => createShortcut('Enter', {}, handler),
  TAB: (handler: KeyboardEventHandler) => createShortcut('Tab', {}, handler),
  SHIFT_TAB: (handler: KeyboardEventHandler) => createShortcut('Tab', { shift: true }, handler)
};
