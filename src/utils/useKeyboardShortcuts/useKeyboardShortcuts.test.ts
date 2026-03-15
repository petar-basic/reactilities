import { describe, it, expect, vi } from 'vitest'
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
