import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFileReader } from './index'

// Use a proper class so it can be called with `new`
class MockFileReader {
  result: string | ArrayBuffer | null = null
  onload: (() => void) | null = null
  onerror: (() => void) | null = null

  readAsText = vi.fn((_file: File, _encoding?: string) => {
    this.result = 'file text content'
    setTimeout(() => this.onload?.(), 0)
  })

  readAsDataURL = vi.fn((_file: File) => {
    this.result = 'data:text/plain;base64,dGVzdA=='
    setTimeout(() => this.onload?.(), 0)
  })

  readAsArrayBuffer = vi.fn((_file: File) => {
    this.result = new ArrayBuffer(8)
    setTimeout(() => this.onload?.(), 0)
  })
}

let mockReaderInstance: MockFileReader

describe('useFileReader', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mockReaderInstance = new MockFileReader()
    vi.stubGlobal('FileReader', class {
      result = mockReaderInstance.result
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      readAsText = (...args: Parameters<MockFileReader['readAsText']>) => {
        mockReaderInstance.onload = this.onload
        mockReaderInstance.onerror = this.onerror
        mockReaderInstance.readAsText(...args)
        Object.defineProperty(this, 'result', { get: () => mockReaderInstance.result, configurable: true })
      }
      readAsDataURL = (...args: Parameters<MockFileReader['readAsDataURL']>) => {
        mockReaderInstance.onload = this.onload
        mockReaderInstance.onerror = this.onerror
        mockReaderInstance.readAsDataURL(...args)
        Object.defineProperty(this, 'result', { get: () => mockReaderInstance.result, configurable: true })
      }
      readAsArrayBuffer = (...args: Parameters<MockFileReader['readAsArrayBuffer']>) => {
        mockReaderInstance.onload = this.onload
        mockReaderInstance.onerror = this.onerror
        mockReaderInstance.readAsArrayBuffer(...args)
        Object.defineProperty(this, 'result', { get: () => mockReaderInstance.result, configurable: true })
      }
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('should start with null result and no loading or error', () => {
    const { result } = renderHook(() => useFileReader())
    expect(result.current.result).toBeNull()
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should set loading to true while reading', () => {
    const { result } = renderHook(() => useFileReader())
    const file = new File(['hello'], 'test.txt', { type: 'text/plain' })

    act(() => {
      result.current.readAsText(file)
    })

    expect(result.current.loading).toBe(true)
  })

  it('should call readAsText on the FileReader', () => {
    const { result } = renderHook(() => useFileReader())
    const file = new File(['hello'], 'test.txt')

    act(() => {
      result.current.readAsText(file)
    })

    expect(mockReaderInstance.readAsText).toHaveBeenCalledWith(file, undefined)
  })

  it('should call readAsText with custom encoding', () => {
    const { result } = renderHook(() => useFileReader())
    const file = new File(['hello'], 'test.txt')

    act(() => {
      result.current.readAsText(file, 'UTF-16')
    })

    expect(mockReaderInstance.readAsText).toHaveBeenCalledWith(file, 'UTF-16')
  })

  it('should set result and stop loading after readAsText completes', async () => {
    const { result } = renderHook(() => useFileReader())
    const file = new File(['hello'], 'test.txt')

    act(() => { result.current.readAsText(file) })

    await act(async () => { vi.runAllTimers() })

    expect(result.current.loading).toBe(false)
    expect(result.current.result).not.toBeNull()
  })

  it('should call readAsDataURL on the FileReader', () => {
    const { result } = renderHook(() => useFileReader())
    const file = new File(['img'], 'photo.png', { type: 'image/png' })

    act(() => { result.current.readAsDataURL(file) })

    expect(mockReaderInstance.readAsDataURL).toHaveBeenCalledWith(file)
  })

  it('should call readAsArrayBuffer on the FileReader', () => {
    const { result } = renderHook(() => useFileReader())
    const file = new File(['binary'], 'data.bin')

    act(() => { result.current.readAsArrayBuffer(file) })

    expect(mockReaderInstance.readAsArrayBuffer).toHaveBeenCalledWith(file)
  })

  it('should set error and stop loading when FileReader errors', async () => {
    mockReaderInstance.readAsText = vi.fn((_file: File) => {
      setTimeout(() => mockReaderInstance.onerror?.(), 0)
    })

    const { result } = renderHook(() => useFileReader())
    const file = new File(['hello'], 'test.txt')

    act(() => { result.current.readAsText(file) })

    await act(async () => { vi.runAllTimers() })

    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeInstanceOf(Error)
  })

  it('should reset state when reset() is called', async () => {
    const { result } = renderHook(() => useFileReader())
    const file = new File(['hello'], 'test.txt')

    act(() => { result.current.readAsText(file) })
    await act(async () => { vi.runAllTimers() })

    act(() => { result.current.reset() })

    expect(result.current.result).toBeNull()
    expect(result.current.error).toBeNull()
    expect(result.current.loading).toBe(false)
  })

  it('should immediately clear state when reset() is called during a read', () => {
    const { result } = renderHook(() => useFileReader())
    const file = new File(['hello'], 'test.txt')

    act(() => { result.current.readAsText(file) })
    expect(result.current.loading).toBe(true)

    // Reset before the async timer fires — state must clear immediately
    act(() => { result.current.reset() })
    expect(result.current.loading).toBe(false)
    expect(result.current.result).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('should clear previous result when starting a new read', async () => {
    const { result } = renderHook(() => useFileReader())
    const file1 = new File(['hello'], 'first.txt')
    const file2 = new File(['world'], 'second.txt')

    act(() => { result.current.readAsText(file1) })
    await act(async () => { vi.runAllTimers() })

    act(() => { result.current.readAsText(file2) })

    // Result should be cleared immediately when a new read starts
    expect(result.current.result).toBeNull()
  })
})
