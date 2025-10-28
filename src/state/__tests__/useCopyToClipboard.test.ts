import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCopyToClipboard } from '../useCopyToClipboard'

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
})
