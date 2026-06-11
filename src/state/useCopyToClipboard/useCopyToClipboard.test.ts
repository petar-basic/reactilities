import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCopyToClipboard } from './index'

// Mock document.execCommand
Object.defineProperty(document, 'execCommand', {
  value: vi.fn(),
  writable: true,
})

describe('useCopyToClipboard', () => {
  let mockWriteText: ReturnType<typeof vi.fn>
  let mockExecCommand: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockWriteText = vi.fn()
    mockExecCommand = vi.fn()
    
    // Ensure clipboard exists and set writeText
    if (!navigator.clipboard) {
      ;(navigator as any).clipboard = {}
    }
    navigator.clipboard.writeText = mockWriteText
    
    // Mock document.execCommand
    document.execCommand = mockExecCommand
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with null state', () => {
    const { result } = renderHook(() => useCopyToClipboard())
    
    expect(result.current[0]).toBe(null)
    expect(typeof result.current[1]).toBe('function')
  })

  it('should copy text using modern clipboard API', async () => {
    mockWriteText.mockResolvedValue(undefined)
    
    const { result } = renderHook(() => useCopyToClipboard())
    
    await act(async () => {
      result.current[1]('test text')
    })
    
    expect(mockWriteText).toHaveBeenCalledWith('test text')
    expect(result.current[0]).toBe('test text')
  })

  it('should update state with copied value', async () => {
    mockWriteText.mockResolvedValue(undefined)
    
    const { result } = renderHook(() => useCopyToClipboard())
    
    await act(async () => {
      result.current[1]('first text')
    })
    
    expect(result.current[0]).toBe('first text')
    
    await act(async () => {
      result.current[1]('second text')
    })
    
    expect(result.current[0]).toBe('second text')
  })

  it('should fallback to execCommand when clipboard API fails', async () => {
    mockWriteText.mockRejectedValue(new Error('Clipboard API failed'))
    mockExecCommand.mockReturnValue(true)
    
    const { result } = renderHook(() => useCopyToClipboard())
    
    await act(async () => {
      result.current[1]('fallback text')
    })
    
    expect(mockWriteText).toHaveBeenCalledWith('fallback text')
    expect(mockExecCommand).toHaveBeenCalledWith('copy')
    expect(result.current[0]).toBe('fallback text')
  })

  it('should fallback to execCommand when clipboard API is not available', async () => {
    // Mock clipboard as undefined
    const originalClipboard = navigator.clipboard
    ;(navigator as any).clipboard = undefined
    
    mockExecCommand.mockReturnValue(true)
    
    const { result } = renderHook(() => useCopyToClipboard())
    
    await act(async () => {
      result.current[1]('no clipboard api')
    })
    
    expect(mockWriteText).not.toHaveBeenCalled()
    expect(mockExecCommand).toHaveBeenCalledWith('copy')
    expect(result.current[0]).toBe('no clipboard api')
    
    // Restore clipboard
    ;(navigator as any).clipboard = originalClipboard
  })

  it('should fallback when writeText is not available', async () => {
    // Mock clipboard without writeText
    const originalClipboard = navigator.clipboard
    ;(navigator as any).clipboard = {}
    
    mockExecCommand.mockReturnValue(true)
    
    const { result } = renderHook(() => useCopyToClipboard())
    
    await act(async () => {
      result.current[1]('no writeText')
    })
    
    expect(mockExecCommand).toHaveBeenCalledWith('copy')
    expect(result.current[0]).toBe('no writeText')
    
    // Restore clipboard
    ;(navigator as any).clipboard = originalClipboard
  })

  it('should handle multiple copy operations', async () => {
    mockWriteText.mockResolvedValue(undefined)
    
    const { result } = renderHook(() => useCopyToClipboard())
    
    await act(async () => {
      result.current[1]('text 1')
    })
    
    expect(result.current[0]).toBe('text 1')
    
    await act(async () => {
      result.current[1]('text 2')
    })
    
    expect(result.current[0]).toBe('text 2')
    
    await act(async () => {
      result.current[1]('text 3')
    })
    
    expect(result.current[0]).toBe('text 3')
    expect(mockWriteText).toHaveBeenCalledTimes(3)
  })

  it('should handle empty string', async () => {
    mockWriteText.mockResolvedValue(undefined)
    
    const { result } = renderHook(() => useCopyToClipboard())
    
    await act(async () => {
      result.current[1]('')
    })
    
    expect(mockWriteText).toHaveBeenCalledWith('')
    expect(result.current[0]).toBe('')
  })

  it('should handle special characters', async () => {
    mockWriteText.mockResolvedValue(undefined)
    
    const specialText = 'Hello\nWorld\t"Special" & <Characters>'
    const { result } = renderHook(() => useCopyToClipboard())
    
    await act(async () => {
      result.current[1](specialText)
    })
    
    expect(mockWriteText).toHaveBeenCalledWith(specialText)
    expect(result.current[0]).toBe(specialText)
  })

  it('should use fallback when clipboard API fails', async () => {
    mockWriteText.mockRejectedValue(new Error('Failed'))
    mockExecCommand.mockReturnValue(true)

    const { result } = renderHook(() => useCopyToClipboard())

    await act(async () => {
      result.current[1]('test')
    })

    expect(mockWriteText).toHaveBeenCalledWith('test')
    expect(mockExecCommand).toHaveBeenCalledWith('copy')
    expect(result.current[0]).toBe('test')
  })

  it('should not leak a textarea when execCommand throws in the fallback', async () => {
    // Force the legacy fallback path, then make execCommand throw.
    mockWriteText.mockRejectedValue(new Error('Clipboard API failed'))
    mockExecCommand.mockImplementation(() => {
      throw new Error('execCommand blew up')
    })

    const { result } = renderHook(() => useCopyToClipboard())
    // Baseline measured after mount so renderHook's own container is excluded.
    const baselineTextareas = document.querySelectorAll('textarea').length

    let copyResult: boolean | undefined
    await act(async () => {
      // handleCopy must not reject even though execCommand throws.
      copyResult = await result.current[1]('leaky text')
    })

    // Mutation-proof rationale: without try/finally + removeChild in the
    // fallback, the thrown execCommand leaves the temporary <textarea> attached
    // to document.body. Asserting that no extra <textarea> remains in the DOM
    // fails on the original code and only passes once the removeChild runs in a
    // finally block. (Counting textareas, not all children, isolates this from
    // renderHook's container element.)
    expect(document.querySelectorAll('textarea').length).toBe(baselineTextareas)
    // And specifically: no textarea carrying the copied value was left behind.
    const leaked = Array.from(document.querySelectorAll('textarea')).some(
      (ta) => ta.value === 'leaky text'
    )
    expect(leaked).toBe(false)
    // The hook should report failure rather than rejecting.
    expect(copyResult).toBe(false)
    expect(result.current[0]).toBe(null)
  })

  it('should resolve true when the modern clipboard API succeeds', async () => {
    mockWriteText.mockResolvedValue(undefined)

    const { result } = renderHook(() => useCopyToClipboard())

    let copyResult: boolean | undefined
    await act(async () => {
      copyResult = await result.current[1]('awaited text')
    })

    expect(copyResult).toBe(true)
    expect(result.current[0]).toBe('awaited text')
  })

  it('should resolve true when the execCommand fallback succeeds', async () => {
    mockWriteText.mockRejectedValue(new Error('Clipboard API failed'))
    mockExecCommand.mockReturnValue(true)

    const { result } = renderHook(() => useCopyToClipboard())

    let copyResult: boolean | undefined
    await act(async () => {
      copyResult = await result.current[1]('fallback ok')
    })

    expect(copyResult).toBe(true)
    expect(result.current[0]).toBe('fallback ok')
  })

  it('should resolve false (and not update state) when the fallback copy fails', async () => {
    mockWriteText.mockRejectedValue(new Error('Clipboard API failed'))
    mockExecCommand.mockReturnValue(false)

    const { result } = renderHook(() => useCopyToClipboard())

    let copyResult: boolean | undefined
    await act(async () => {
      copyResult = await result.current[1]('fallback fail')
    })

    expect(copyResult).toBe(false)
    expect(result.current[0]).toBe(null)
    // Textarea cleaned up on the success-returning-false path too.
    expect(document.querySelector('textarea')).toBeNull()
  })

  it('should return a thenable Promise from the copy function', async () => {
    mockWriteText.mockResolvedValue(undefined)

    const { result } = renderHook(() => useCopyToClipboard())

    let returned: unknown
    await act(async () => {
      returned = result.current[1]('promise check')
      await returned
    })

    expect(returned).toBeInstanceOf(Promise)
  })
})
