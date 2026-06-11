import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSpeechRecognition } from './index'

interface MockResultEvent {
  resultIndex: number
  results: {
    isFinal: boolean
    0: { transcript: string }
    length: number
  }[]
}

// Single shared instance that tests can reach
let recognitionInstance: {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((e: MockResultEvent) => void) | null
  onstart: (() => void) | null
  onend: (() => void) | null
  onerror: ((e: { error: string }) => void) | null
  start: ReturnType<typeof vi.fn>
  stop: ReturnType<typeof vi.fn>
  fireResult: (transcript: string, isFinal: boolean) => void
  fireError: (error: string) => void
}

describe('useSpeechRecognition', () => {
  beforeEach(() => {
    recognitionInstance = {
      lang: '',
      continuous: false,
      interimResults: false,
      onresult: null,
      onstart: null,
      onend: null,
      onerror: null,
      start: vi.fn(function (this: typeof recognitionInstance) {
        this.onstart?.()
      }),
      stop: vi.fn(function (this: typeof recognitionInstance) {
        this.onend?.()
      }),
      fireResult(transcript: string, isFinal: boolean) {
        this.onresult?.({
          resultIndex: 0,
          results: [{ isFinal, 0: { transcript }, length: 1 }]
        })
      },
      fireError(error: string) {
        this.onerror?.({ error })
        this.onend?.()
      }
    }

    // Use a class so `new` works
    class MockSpeechRecognition {
      constructor() {
        return recognitionInstance
      }
    }

    vi.stubGlobal('SpeechRecognition', MockSpeechRecognition)
    vi.stubGlobal('webkitSpeechRecognition', MockSpeechRecognition)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('should report isSupported as true when API is available', () => {
    const { result } = renderHook(() => useSpeechRecognition())
    expect(result.current.isSupported).toBe(true)
  })

  it('should start with empty transcript and not listening', () => {
    const { result } = renderHook(() => useSpeechRecognition())
    expect(result.current.transcript).toBe('')
    expect(result.current.isListening).toBe(false)
  })

  it('should set isListening to true after start()', () => {
    const { result } = renderHook(() => useSpeechRecognition())

    act(() => { result.current.start() })

    expect(result.current.isListening).toBe(true)
  })

  it('should set isListening to false after stop()', () => {
    const { result } = renderHook(() => useSpeechRecognition())

    act(() => { result.current.start() })
    act(() => { result.current.stop() })

    expect(result.current.isListening).toBe(false)
  })

  it('should accumulate final transcript results', () => {
    const { result } = renderHook(() => useSpeechRecognition())

    act(() => { result.current.start() })
    act(() => { recognitionInstance.fireResult('Hello ', true) })
    act(() => { recognitionInstance.fireResult('world', true) })

    expect(result.current.transcript).toBe('Hello world')
  })

  it('should set interimTranscript for non-final results', () => {
    const { result } = renderHook(() => useSpeechRecognition())

    act(() => { result.current.start() })
    act(() => { recognitionInstance.fireResult('typing...', false) })

    expect(result.current.interimTranscript).toBe('typing...')
    expect(result.current.transcript).toBe('')
  })

  it('should call onResult callback with transcript and isFinal flag', () => {
    const onResult = vi.fn()
    const { result } = renderHook(() => useSpeechRecognition({ onResult }))

    act(() => { result.current.start() })
    act(() => { recognitionInstance.fireResult('test', true) })

    expect(onResult).toHaveBeenCalledWith('test', true)
  })

  it('should call onError callback on recognition error', () => {
    const onError = vi.fn()
    const { result } = renderHook(() => useSpeechRecognition({ onError }))

    act(() => { result.current.start() })
    act(() => { recognitionInstance.fireError('no-speech') })

    expect(onError).toHaveBeenCalledWith('no-speech')
  })

  it('should reset transcript and stop on reset()', () => {
    const { result } = renderHook(() => useSpeechRecognition())

    act(() => { result.current.start() })
    act(() => { recognitionInstance.fireResult('some text', true) })
    expect(result.current.transcript).toBe('some text')

    act(() => { result.current.reset() })

    expect(result.current.transcript).toBe('')
    expect(result.current.isListening).toBe(false)
  })

  it('should set lang on the recognition instance', () => {
    const { result } = renderHook(() => useSpeechRecognition({ lang: 'fr-FR' }))

    act(() => { result.current.start() })

    expect(recognitionInstance.lang).toBe('fr-FR')
  })

  it('should stop recognition on unmount', () => {
    const { result, unmount } = renderHook(() => useSpeechRecognition())

    act(() => { result.current.start() })
    unmount()

    expect(recognitionInstance.stop).toHaveBeenCalled()
  })

  it('should not start if already listening', () => {
    const { result } = renderHook(() => useSpeechRecognition())

    act(() => { result.current.start() })
    act(() => { result.current.start() })

    expect(recognitionInstance.start).toHaveBeenCalledTimes(1)
  })

  it('should reject a second synchronous start() before onstart fires (no orphaned session)', () => {
    // Real browsers fire onstart asynchronously. Simulate that by making the
    // mock's start() NOT invoke onstart synchronously, and count how many
    // SpeechRecognition instances get constructed + started.
    let constructed = 0
    const startSpy = vi.fn() // does NOT call onstart — mimics async browser behavior

    class AsyncMockSpeechRecognition {
      lang = ''
      continuous = false
      interimResults = false
      onresult: ((e: MockResultEvent) => void) | null = null
      onstart: (() => void) | null = null
      onend: (() => void) | null = null
      onerror: ((e: { error: string }) => void) | null = null
      start = startSpy
      stop = vi.fn()
      constructor() {
        constructed++
      }
    }

    vi.stubGlobal('SpeechRecognition', AsyncMockSpeechRecognition)
    vi.stubGlobal('webkitSpeechRecognition', AsyncMockSpeechRecognition)

    const { result } = renderHook(() => useSpeechRecognition())

    // Two rapid synchronous calls — the double-click scenario.
    act(() => {
      result.current.start()
      result.current.start()
    })

    // Only the first call may create + start a recognition session.
    // If the guard were async-only (set in onstart), both calls would pass and
    // a second instance would be constructed/started, orphaning the first.
    expect(constructed).toBe(1)
    expect(startSpy).toHaveBeenCalledTimes(1)
  })
})
