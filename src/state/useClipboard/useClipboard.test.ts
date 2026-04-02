import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useClipboard } from './index'

describe('useClipboard', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // navigator.clipboard is already defined in setup.ts — just set up the mocks
    navigator.clipboard.writeText = vi.fn().mockResolvedValue(undefined)
    navigator.clipboard.readText = vi.fn().mockResolvedValue('clipboard content')
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('should start with null value and hasCopied false', () => {
    const { result } = renderHook(() => useClipboard())
    expect(result.current.value).toBeNull()
    expect(result.current.hasCopied).toBe(false)
  })

  it('should copy text and set value', async () => {
    const { result } = renderHook(() => useClipboard())

    await act(async () => {
      await result.current.copy('hello world')
    })

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('hello world')
    expect(result.current.value).toBe('hello world')
  })

  it('should set hasCopied to true after successful copy', async () => {
    const { result } = renderHook(() => useClipboard())

    await act(async () => {
      await result.current.copy('test')
    })

    expect(result.current.hasCopied).toBe(true)
  })

  it('should reset hasCopied after the delay', async () => {
    const { result } = renderHook(() => useClipboard(1000))

    await act(async () => {
      await result.current.copy('test')
    })

    expect(result.current.hasCopied).toBe(true)

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(result.current.hasCopied).toBe(false)
  })

  it('should not reset hasCopied when resetDelay is 0', async () => {
    const { result } = renderHook(() => useClipboard(0))

    await act(async () => {
      await result.current.copy('test')
    })

    act(() => {
      vi.advanceTimersByTime(10000)
    })

    expect(result.current.hasCopied).toBe(true)
  })

  it('should return true on successful copy', async () => {
    const { result } = renderHook(() => useClipboard())
    let success = false

    await act(async () => {
      success = await result.current.copy('text')
    })

    expect(success).toBe(true)
  })

  it('should return false when copy fails', async () => {
    navigator.clipboard.writeText = vi.fn().mockRejectedValue(new Error('Permission denied'))
    const { result } = renderHook(() => useClipboard())
    let success = true

    await act(async () => {
      success = await result.current.copy('text')
    })

    expect(success).toBe(false)
    expect(result.current.hasCopied).toBe(false)
  })

  it('should read clipboard text and set value', async () => {
    const { result } = renderHook(() => useClipboard())

    await act(async () => {
      await result.current.read()
    })

    expect(navigator.clipboard.readText).toHaveBeenCalledTimes(1)
    expect(result.current.value).toBe('clipboard content')
  })

  it('should return the read text from read()', async () => {
    const { result } = renderHook(() => useClipboard())
    let text: string | null = null

    await act(async () => {
      text = await result.current.read()
    })

    expect(text).toBe('clipboard content')
  })

  it('should return null when read fails', async () => {
    navigator.clipboard.readText = vi.fn().mockRejectedValue(new Error('Permission denied'))
    const { result } = renderHook(() => useClipboard())
    let text: string | null = 'something'

    await act(async () => {
      text = await result.current.read()
    })

    expect(text).toBeNull()
  })

  it('should use the legacy execCommand fallback when the Clipboard API is unavailable', async () => {
    Object.defineProperty(navigator.clipboard, 'writeText', {
      value: undefined,
      configurable: true,
      writable: true
    })
    const execCommandMock = vi.fn().mockReturnValue(true)
    Object.defineProperty(document, 'execCommand', {
      value: execCommandMock,
      configurable: true,
      writable: true
    })

    const { result } = renderHook(() => useClipboard())
    let success = false
    await act(async () => { success = await result.current.copy('hello') })

    expect(success).toBe(true)
    expect(result.current.value).toBe('hello')
    expect(execCommandMock).toHaveBeenCalledWith('copy')
    // Textarea must be removed from the DOM after the call
    expect(document.body.querySelectorAll('textarea')).toHaveLength(0)
  })

  it('should remove the legacy textarea even when execCommand throws', async () => {
    Object.defineProperty(navigator.clipboard, 'writeText', {
      value: undefined,
      configurable: true,
      writable: true
    })
    Object.defineProperty(document, 'execCommand', {
      value: vi.fn().mockImplementation(() => { throw new Error('not supported') }),
      configurable: true,
      writable: true
    })

    const { result } = renderHook(() => useClipboard())
    let success = true
    await act(async () => { success = await result.current.copy('test') })

    expect(success).toBe(false)
    // Textarea must be removed even though execCommand threw
    expect(document.body.querySelectorAll('textarea')).toHaveLength(0)
  })

  it('should reset value and hasCopied on reset()', async () => {
    const { result } = renderHook(() => useClipboard())

    await act(async () => {
      await result.current.copy('test')
    })

    act(() => {
      result.current.reset()
    })

    expect(result.current.value).toBeNull()
    expect(result.current.hasCopied).toBe(false)
  })
})
