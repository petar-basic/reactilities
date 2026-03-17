import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCounter } from '../useCounter'

describe('useCounter', () => {
  it('should start at 0 by default', () => {
    const { result } = renderHook(() => useCounter())
    expect(result.current.count).toBe(0)
  })

  it('should start at the given initial value', () => {
    const { result } = renderHook(() => useCounter(10))
    expect(result.current.count).toBe(10)
  })

  it('should increment by 1', () => {
    const { result } = renderHook(() => useCounter(0))
    act(() => result.current.increment())
    expect(result.current.count).toBe(1)
  })

  it('should decrement by 1', () => {
    const { result } = renderHook(() => useCounter(5))
    act(() => result.current.decrement())
    expect(result.current.count).toBe(4)
  })

  it('should reset to initial value', () => {
    const { result } = renderHook(() => useCounter(3))
    act(() => result.current.increment())
    act(() => result.current.increment())
    act(() => result.current.reset())
    expect(result.current.count).toBe(3)
  })

  it('should set to specific value', () => {
    const { result } = renderHook(() => useCounter(0))
    act(() => result.current.set(42))
    expect(result.current.count).toBe(42)
  })

  it('should respect max bound on increment', () => {
    const { result } = renderHook(() => useCounter(9, { max: 10 }))
    act(() => result.current.increment())
    expect(result.current.count).toBe(10)
    act(() => result.current.increment())
    expect(result.current.count).toBe(10)
  })

  it('should respect min bound on decrement', () => {
    const { result } = renderHook(() => useCounter(1, { min: 0 }))
    act(() => result.current.decrement())
    expect(result.current.count).toBe(0)
    act(() => result.current.decrement())
    expect(result.current.count).toBe(0)
  })

  it('should clamp set() to min/max', () => {
    const { result } = renderHook(() => useCounter(5, { min: 0, max: 10 }))
    act(() => result.current.set(100))
    expect(result.current.count).toBe(10)
    act(() => result.current.set(-5))
    expect(result.current.count).toBe(0)
  })

  it('should use custom step', () => {
    const { result } = renderHook(() => useCounter(0, { step: 5 }))
    act(() => result.current.increment())
    expect(result.current.count).toBe(5)
    act(() => result.current.decrement())
    expect(result.current.count).toBe(0)
  })

  it('should have stable function references across re-renders', () => {
    const { result, rerender } = renderHook(() => useCounter(0))
    const { increment, decrement, reset, set } = result.current
    rerender()
    expect(result.current.increment).toBe(increment)
    expect(result.current.decrement).toBe(decrement)
    expect(result.current.reset).toBe(reset)
    expect(result.current.set).toBe(set)
  })
})
