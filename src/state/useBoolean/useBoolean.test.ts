import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useBoolean } from '../useBoolean'

describe('useBoolean', () => {
  it('should default to false', () => {
    const { result } = renderHook(() => useBoolean())
    expect(result.current.value).toBe(false)
  })

  it('should start with provided initial value', () => {
    const { result } = renderHook(() => useBoolean(true))
    expect(result.current.value).toBe(true)
  })

  it('should set to true with setTrue', () => {
    const { result } = renderHook(() => useBoolean(false))
    act(() => result.current.setTrue())
    expect(result.current.value).toBe(true)
  })

  it('should set to false with setFalse', () => {
    const { result } = renderHook(() => useBoolean(true))
    act(() => result.current.setFalse())
    expect(result.current.value).toBe(false)
  })

  it('should toggle the value', () => {
    const { result } = renderHook(() => useBoolean(false))
    act(() => result.current.toggle())
    expect(result.current.value).toBe(true)
    act(() => result.current.toggle())
    expect(result.current.value).toBe(false)
  })

  it('should set an explicit value', () => {
    const { result } = renderHook(() => useBoolean(false))
    act(() => result.current.set(true))
    expect(result.current.value).toBe(true)
    act(() => result.current.set(false))
    expect(result.current.value).toBe(false)
  })

  it('should have stable function references', () => {
    const { result, rerender } = renderHook(() => useBoolean(false))
    const { setTrue, setFalse, toggle, set } = result.current
    rerender()
    expect(result.current.setTrue).toBe(setTrue)
    expect(result.current.setFalse).toBe(setFalse)
    expect(result.current.toggle).toBe(toggle)
    expect(result.current.set).toBe(set)
  })
})
