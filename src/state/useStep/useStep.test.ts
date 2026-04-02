import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useStep } from './index'

describe('useStep', () => {
  it('should start at step 0 by default', () => {
    const { result } = renderHook(() => useStep(5))
    expect(result.current.step).toBe(0)
  })

  it('should start at the provided initial step', () => {
    const { result } = renderHook(() => useStep(5, 2))
    expect(result.current.step).toBe(2)
  })

  it('should report isFirst as true on step 0', () => {
    const { result } = renderHook(() => useStep(5))
    expect(result.current.isFirst).toBe(true)
    expect(result.current.isLast).toBe(false)
  })

  it('should report isLast as true on the last step', () => {
    const { result } = renderHook(() => useStep(5, 4))
    expect(result.current.isLast).toBe(true)
    expect(result.current.isFirst).toBe(false)
  })

  it('should advance to the next step', () => {
    const { result } = renderHook(() => useStep(5))

    act(() => {
      result.current.next()
    })

    expect(result.current.step).toBe(1)
  })

  it('should not advance past the last step', () => {
    const { result } = renderHook(() => useStep(3, 2))

    act(() => {
      result.current.next()
    })

    expect(result.current.step).toBe(2)
  })

  it('should go to the previous step', () => {
    const { result } = renderHook(() => useStep(5, 3))

    act(() => {
      result.current.prev()
    })

    expect(result.current.step).toBe(2)
  })

  it('should not go before the first step', () => {
    const { result } = renderHook(() => useStep(5, 0))

    act(() => {
      result.current.prev()
    })

    expect(result.current.step).toBe(0)
  })

  it('should jump to a specific step with goTo', () => {
    const { result } = renderHook(() => useStep(5))

    act(() => {
      result.current.goTo(3)
    })

    expect(result.current.step).toBe(3)
  })

  it('should clamp goTo to the valid range', () => {
    const { result } = renderHook(() => useStep(5))

    act(() => {
      result.current.goTo(-1)
    })
    expect(result.current.step).toBe(0)

    act(() => {
      result.current.goTo(100)
    })
    expect(result.current.step).toBe(4)
  })

  it('should reset to the initial step', () => {
    const { result } = renderHook(() => useStep(5, 2))

    act(() => {
      result.current.goTo(4)
    })

    expect(result.current.step).toBe(4)

    act(() => {
      result.current.reset()
    })

    expect(result.current.step).toBe(2)
  })

  it('should correctly report isFirst and isLast as navigation happens', () => {
    const { result } = renderHook(() => useStep(3))

    expect(result.current.isFirst).toBe(true)
    expect(result.current.isLast).toBe(false)

    act(() => result.current.next())
    expect(result.current.isFirst).toBe(false)
    expect(result.current.isLast).toBe(false)

    act(() => result.current.next())
    expect(result.current.isFirst).toBe(false)
    expect(result.current.isLast).toBe(true)
  })

  it('should have stable function references across renders', () => {
    const { result, rerender } = renderHook(() => useStep(5))
    const { next, prev, goTo, reset } = result.current
    rerender()
    expect(result.current.next).toBe(next)
    expect(result.current.prev).toBe(prev)
    expect(result.current.goTo).toBe(goTo)
    expect(result.current.reset).toBe(reset)
  })

  it('should handle a single step', () => {
    const { result } = renderHook(() => useStep(1))

    expect(result.current.isFirst).toBe(true)
    expect(result.current.isLast).toBe(true)

    act(() => result.current.next())
    expect(result.current.step).toBe(0)

    act(() => result.current.prev())
    expect(result.current.step).toBe(0)
  })
})
