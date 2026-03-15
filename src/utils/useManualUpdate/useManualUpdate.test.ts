import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useManualUpdate } from '../useManualUpdate'

describe('useManualUpdate', () => {
  it('should return a function', () => {
    const { result } = renderHook(() => useManualUpdate())
    expect(typeof result.current).toBe('function')
  })

  it('should trigger a re-render when called', () => {
    let renderCount = 0
    const { result } = renderHook(() => {
      renderCount++
      return useManualUpdate()
    })

    expect(renderCount).toBe(1)
    act(() => result.current())
    expect(renderCount).toBe(2)
  })

  it('should trigger multiple re-renders on multiple calls', () => {
    let renderCount = 0
    const { result } = renderHook(() => {
      renderCount++
      return useManualUpdate()
    })

    act(() => {
      result.current()
      result.current()
    })

    expect(renderCount).toBeGreaterThan(1)
  })

  it('should return a stable function reference across renders', () => {
    const { result, rerender } = renderHook(() => useManualUpdate())
    const firstRef = result.current
    rerender()
    expect(result.current).toBe(firstRef)
  })

  it('should work independently across multiple hook instances', () => {
    let countA = 0
    let countB = 0

    const { result: resultA } = renderHook(() => {
      countA++
      return useManualUpdate()
    })
    const { result: resultB } = renderHook(() => {
      countB++
      return useManualUpdate()
    })

    act(() => resultA.current())
    expect(countA).toBe(2)
    expect(countB).toBe(1) // B should not be affected

    act(() => resultB.current())
    expect(countB).toBe(2)
  })
})
