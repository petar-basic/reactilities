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

  it('should clamp an out-of-range initialStep to the last valid step', () => {
    // totalSteps=10 -> valid indices 0..9. initialStep 10 is out of range.
    const { result } = renderHook(() => useStep(10, 10))

    // Without clamping, step would be 10 (out of bounds).
    expect(result.current.step).toBe(9)
    expect(result.current.isLast).toBe(true)
  })

  it('should not jump backward on first next() with an out-of-range initialStep', () => {
    // Reproduces the reported bug: useStep(3, 10) yielded step=10, isLast=false,
    // and the first next() jumped backward to 2.
    const { result } = renderHook(() => useStep(3, 10))

    // Initial step must already be clamped to the max valid index (2), not 10.
    expect(result.current.step).toBe(2)
    expect(result.current.isLast).toBe(true)

    act(() => result.current.next())
    // next() must stay at 2, never jump backward.
    expect(result.current.step).toBe(2)
  })

  it('should clamp a negative initialStep up to the first step', () => {
    const { result } = renderHook(() => useStep(5, -3))

    expect(result.current.step).toBe(0)
    expect(result.current.isFirst).toBe(true)
  })

  it('should never produce a negative step when totalSteps is 0', () => {
    const { result } = renderHook(() => useStep(0))

    // maxStep clamps to 0; step must not be negative.
    expect(result.current.step).toBe(0)

    act(() => result.current.goTo(0))
    // Without the totalSteps<=0 guard, goTo(0) computed min(max(0,0), -1) = -1.
    expect(result.current.step).toBe(0)

    act(() => result.current.next())
    expect(result.current.step).toBe(0)

    act(() => result.current.prev())
    expect(result.current.step).toBe(0)
  })

  it('should never produce a negative step when totalSteps is negative', () => {
    const { result } = renderHook(() => useStep(-5, 3))

    expect(result.current.step).toBe(0)

    act(() => result.current.goTo(2))
    expect(result.current.step).toBe(0)
  })

  it('should reset to a clamped initial step when initialStep was out of range', () => {
    const { result } = renderHook(() => useStep(4, 99))

    expect(result.current.step).toBe(3)

    act(() => result.current.goTo(1))
    expect(result.current.step).toBe(1)

    act(() => result.current.reset())
    // reset must restore the clamped value (3), not the raw 99.
    expect(result.current.step).toBe(3)
  })
})
