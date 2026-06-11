import { describe, it, expect, vi } from 'vitest'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { renderHook } from '@testing-library/react'
import { fireEvent } from '@testing-library/react'
import { useKeyboardShortcuts, createShortcut, COMMON_SHORTCUTS } from '../useKeyboardShortcuts'

describe('useKeyboardShortcuts', () => {
  it('should call handler when matching key is pressed', () => {
    const handler = vi.fn()
    renderHook(() => useKeyboardShortcuts([{ key: 'a', handler }]))

    fireEvent.keyDown(document, { key: 'a' })

    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('should call handler with modifier key combination', () => {
    const handler = vi.fn()
    renderHook(() => useKeyboardShortcuts([{ key: 's', ctrl: true, handler }]))

    fireEvent.keyDown(document, { key: 's', ctrlKey: true })

    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('should not call handler when modifier key does not match', () => {
    const handler = vi.fn()
    renderHook(() => useKeyboardShortcuts([{ key: 's', ctrl: true, handler }]))

    // Pressed without ctrl
    fireEvent.keyDown(document, { key: 's' })

    expect(handler).not.toHaveBeenCalled()
  })

  it('should not call handler when wrong key is pressed', () => {
    const handler = vi.fn()
    renderHook(() => useKeyboardShortcuts([{ key: 'a', handler }]))

    fireEvent.keyDown(document, { key: 'b' })

    expect(handler).not.toHaveBeenCalled()
  })

  it('should not fire shortcuts when disabled', () => {
    const handler = vi.fn()
    renderHook(() => useKeyboardShortcuts([{ key: 'a', handler }], { enabled: false }))

    fireEvent.keyDown(document, { key: 'a' })

    expect(handler).not.toHaveBeenCalled()
  })

  it('should stop at first matching shortcut (break after first match)', () => {
    const handler1 = vi.fn()
    const handler2 = vi.fn()
    renderHook(() =>
      useKeyboardShortcuts([
        { key: 'a', handler: handler1 },
        { key: 'a', handler: handler2 },
      ])
    )

    fireEvent.keyDown(document, { key: 'a' })

    expect(handler1).toHaveBeenCalledTimes(1)
    expect(handler2).not.toHaveBeenCalled()
  })

  it('should handle multiple different shortcuts', () => {
    const saveHandler = vi.fn()
    const closeHandler = vi.fn()
    renderHook(() =>
      useKeyboardShortcuts([
        { key: 's', ctrl: true, handler: saveHandler },
        { key: 'Escape', handler: closeHandler },
      ])
    )

    fireEvent.keyDown(document, { key: 's', ctrlKey: true })
    expect(saveHandler).toHaveBeenCalledTimes(1)
    expect(closeHandler).not.toHaveBeenCalled()

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(closeHandler).toHaveBeenCalledTimes(1)
  })

  it('should remove event listener on unmount', () => {
    const handler = vi.fn()
    const { unmount } = renderHook(() => useKeyboardShortcuts([{ key: 'a', handler }]))

    unmount()
    fireEvent.keyDown(document, { key: 'a' })

    expect(handler).not.toHaveBeenCalled()
  })

  it('should handle shift modifier', () => {
    const handler = vi.fn()
    renderHook(() => useKeyboardShortcuts([{ key: 'Tab', shift: true, handler }]))

    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true })
    expect(handler).toHaveBeenCalledTimes(1)

    fireEvent.keyDown(document, { key: 'Tab' })
    expect(handler).toHaveBeenCalledTimes(1) // Not called again without shift
  })

  it('should pass the keyboard event to the handler', () => {
    const handler = vi.fn()
    renderHook(() => useKeyboardShortcuts([{ key: 'Enter', handler }]))

    fireEvent.keyDown(document, { key: 'Enter' })

    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ key: 'Enter' }))
  })

  it('should update shortcuts without re-registering the listener', () => {
    const handler1 = vi.fn()
    const handler2 = vi.fn()

    const { rerender } = renderHook(
      ({ shortcuts }) => useKeyboardShortcuts(shortcuts),
      { initialProps: { shortcuts: [{ key: 'a', handler: handler1 }] } }
    )

    rerender({ shortcuts: [{ key: 'a', handler: handler2 }] })

    fireEvent.keyDown(document, { key: 'a' })

    // Should call the updated handler
    expect(handler2).toHaveBeenCalledTimes(1)
    expect(handler1).not.toHaveBeenCalled()
  })

  it('should server-render without document defined (SSR-safe default target)', () => {
    // Faithful SSR reproduction: render a real component that calls the hook
    // with no `target`, via react-dom/server's renderToString. On the server,
    // React runs the render phase but NOT effects, and `document` does not
    // exist. We delete `globalThis.document` to model that exactly.
    //
    // With the SSR fix, `document` is only referenced inside the effect (which
    // the server never runs), so this renders cleanly. If the fix is reverted
    // (default `target = document` back in the render-scope destructuring),
    // rendering throws `ReferenceError: document is not defined`.
    const realDocument = globalThis.document
    const handler = vi.fn()

    function Editor() {
      useKeyboardShortcuts([{ key: 'a', handler }])
      return createElement('textarea')
    }

    let renderError: unknown = null
    let markup = ''
    // @ts-expect-error - intentionally removing document to emulate SSR
    delete globalThis.document
    try {
      markup = renderToString(createElement(Editor))
    } catch (err) {
      renderError = err
    } finally {
      globalThis.document = realDocument
    }

    expect(renderError).toBeNull()
    expect(markup).toContain('<textarea')
    // Effects never ran on the server, so the handler was never wired up.
    expect(handler).not.toHaveBeenCalled()
  })

  it('should attach to document via the effect when no target is given', () => {
    // Regression for the SSR fix: the default target must still resolve to
    // `document` inside the effect, so the listener fires on document events.
    const handler = vi.fn()
    renderHook(() => useKeyboardShortcuts([{ key: 'k', handler }]))

    fireEvent.keyDown(document, { key: 'k' })

    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('should attach to a custom target and not to document', () => {
    const handler = vi.fn()
    const target = document.createElement('div')

    renderHook(() => useKeyboardShortcuts([{ key: 'a', handler }], { target }))

    // Event on the custom target is received.
    fireEvent.keyDown(target, { key: 'a' })
    expect(handler).toHaveBeenCalledTimes(1)

    // Event on document is NOT received: proves the listener attached to the
    // resolved custom target, not the default document.
    fireEvent.keyDown(document, { key: 'a' })
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('should clean up the listener from the custom target on unmount', () => {
    const handler = vi.fn()
    const target = document.createElement('div')

    const { unmount } = renderHook(() =>
      useKeyboardShortcuts([{ key: 'a', handler }], { target })
    )

    unmount()
    fireEvent.keyDown(target, { key: 'a' })

    expect(handler).not.toHaveBeenCalled()
  })
})

describe('createShortcut', () => {
  it('should create a shortcut with key and handler', () => {
    const handler = vi.fn()
    const shortcut = createShortcut('s', { ctrl: true }, handler)

    expect(shortcut.key).toBe('s')
    expect(shortcut.ctrl).toBe(true)
    expect(shortcut.handler).toBe(handler)
  })

  it('should set preventDefault to true by default', () => {
    const handler = vi.fn()
    const shortcut = createShortcut('s', {}, handler)
    expect(shortcut.preventDefault).toBe(true)
  })

  it('should allow overriding preventDefault', () => {
    const handler = vi.fn()
    const shortcut = createShortcut('s', {}, handler, { preventDefault: false })
    expect(shortcut.preventDefault).toBe(false)
  })
})

describe('COMMON_SHORTCUTS', () => {
  it('should create SAVE shortcut (Ctrl+S)', () => {
    const handler = vi.fn()
    const shortcut = COMMON_SHORTCUTS.SAVE(handler)
    expect(shortcut.key).toBe('s')
    expect(shortcut.ctrl).toBe(true)
  })

  it('should create UNDO shortcut (Ctrl+Z)', () => {
    const handler = vi.fn()
    const shortcut = COMMON_SHORTCUTS.UNDO(handler)
    expect(shortcut.key).toBe('z')
    expect(shortcut.ctrl).toBe(true)
  })

  it('should create REDO shortcut (Ctrl+Shift+Z)', () => {
    const handler = vi.fn()
    const shortcut = COMMON_SHORTCUTS.REDO(handler)
    expect(shortcut.key).toBe('z')
    expect(shortcut.ctrl).toBe(true)
    expect(shortcut.shift).toBe(true)
  })

  it('should create CLOSE shortcut (Escape)', () => {
    const handler = vi.fn()
    const shortcut = COMMON_SHORTCUTS.CLOSE(handler)
    expect(shortcut.key).toBe('Escape')
  })
})
