import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSpeechSynthesis } from './index'

const mockSpeak = vi.fn()
const mockCancel = vi.fn()
const mockPause = vi.fn()
const mockResume = vi.fn()
const mockGetVoices = vi.fn().mockReturnValue([])
const mockAddEventListener = vi.fn()
const mockRemoveEventListener = vi.fn()

const mockSynthesis = {
  speak: mockSpeak,
  cancel: mockCancel,
  pause: mockPause,
  resume: mockResume,
  getVoices: mockGetVoices,
  addEventListener: mockAddEventListener,
  removeEventListener: mockRemoveEventListener
}

let lastUtterance: {
  text: string
  voice: SpeechSynthesisVoice | null
  rate: number
  pitch: number
  volume: number
  lang: string
  onstart: (() => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
} | null = null

describe('useSpeechSynthesis', () => {
  beforeEach(() => {
    lastUtterance = null

    vi.stubGlobal('speechSynthesis', mockSynthesis)

    vi.stubGlobal('SpeechSynthesisUtterance', class {
      text: string
      voice: SpeechSynthesisVoice | null = null
      rate = 1
      pitch = 1
      volume = 1
      lang = ''
      onstart: (() => void) | null = null
      onend: (() => void) | null = null
      onerror: (() => void) | null = null

      constructor(text: string) {
        this.text = text
        lastUtterance = this
      }
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('should report isSupported as true when speechSynthesis exists', () => {
    const { result } = renderHook(() => useSpeechSynthesis())
    expect(result.current.isSupported).toBe(true)
  })

  it('should start with isSpeaking and isPaused as false', () => {
    const { result } = renderHook(() => useSpeechSynthesis())
    expect(result.current.isSpeaking).toBe(false)
    expect(result.current.isPaused).toBe(false)
  })

  it('should call speechSynthesis.speak when speak() is called', () => {
    const { result } = renderHook(() => useSpeechSynthesis())

    act(() => {
      result.current.speak('Hello world')
    })

    expect(mockSpeak).toHaveBeenCalledTimes(1)
  })

  it('should set isSpeaking to true on utterance start', () => {
    const { result } = renderHook(() => useSpeechSynthesis())

    act(() => {
      result.current.speak('Hello')
      lastUtterance?.onstart?.()
    })

    expect(result.current.isSpeaking).toBe(true)
  })

  it('should set isSpeaking to false on utterance end', () => {
    const { result } = renderHook(() => useSpeechSynthesis())

    act(() => {
      result.current.speak('Hello')
      lastUtterance?.onstart?.()
    })

    act(() => {
      lastUtterance?.onend?.()
    })

    expect(result.current.isSpeaking).toBe(false)
  })

  it('should call speechSynthesis.cancel when cancel() is called', () => {
    const { result } = renderHook(() => useSpeechSynthesis())

    act(() => { result.current.cancel() })

    expect(mockCancel).toHaveBeenCalled()
  })

  it('should set isSpeaking to false on cancel', () => {
    const { result } = renderHook(() => useSpeechSynthesis())

    act(() => {
      result.current.speak('Hello')
      lastUtterance?.onstart?.()
    })

    act(() => { result.current.cancel() })

    expect(result.current.isSpeaking).toBe(false)
  })

  it('should call speechSynthesis.pause when pause() is called', () => {
    const { result } = renderHook(() => useSpeechSynthesis())

    act(() => { result.current.pause() })

    expect(mockPause).toHaveBeenCalled()
  })

  it('should set isPaused to true on pause', () => {
    const { result } = renderHook(() => useSpeechSynthesis())

    act(() => { result.current.pause() })

    expect(result.current.isPaused).toBe(true)
  })

  it('should call speechSynthesis.resume when resume() is called', () => {
    const { result } = renderHook(() => useSpeechSynthesis())

    act(() => { result.current.resume() })

    expect(mockResume).toHaveBeenCalled()
  })

  it('should set isPaused to false on resume', () => {
    const { result } = renderHook(() => useSpeechSynthesis())

    act(() => { result.current.pause() })
    act(() => { result.current.resume() })

    expect(result.current.isPaused).toBe(false)
  })

  it('should cancel speech on unmount', () => {
    const { unmount } = renderHook(() => useSpeechSynthesis())
    unmount()
    expect(mockCancel).toHaveBeenCalled()
  })

  it('should load voices and subscribe to voiceschanged', () => {
    renderHook(() => useSpeechSynthesis())
    expect(mockGetVoices).toHaveBeenCalled()
    expect(mockAddEventListener).toHaveBeenCalledWith('voiceschanged', expect.any(Function))
  })
})
