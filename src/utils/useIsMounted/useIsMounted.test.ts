import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useIsMounted } from '../useIsMounted'

describe('useIsMounted', () => {
  it('should return true while mounted', () => {
    const { result } = renderHook(() => useIsMounted())
    expect(result.current()).toBe(true)
  })

  it('should return false after unmount', () => {
    const { result, unmount } = renderHook(() => useIsMounted())
    unmount()
    expect(result.current()).toBe(false)
  })

  it('should return a stable function reference', () => {
    const { result, rerender } = renderHook(() => useIsMounted())
    const fn = result.current
    rerender()
    expect(result.current).toBe(fn)
  })

  it('should return a function', () => {
    const { result } = renderHook(() => useIsMounted())
    expect(typeof result.current).toBe('function')
  })
})
