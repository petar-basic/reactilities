import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMousePosition } from '../useMousePosition'

function fireMouseMove(x: number, y: number) {
  window.dispatchEvent(new MouseEvent('mousemove', { clientX: x, clientY: y }))
}

describe('useMousePosition', () => {
  it('should start at (0, 0)', () => {
    const { result } = renderHook(() => useMousePosition())
    expect(result.current).toEqual({ x: 0, y: 0 })
  })

  it('should update on mousemove', () => {
    const { result } = renderHook(() => useMousePosition())

    act(() => fireMouseMove(150, 300))

    expect(result.current).toEqual({ x: 150, y: 300 })
  })

  it('should update on subsequent mousemove events', () => {
    const { result } = renderHook(() => useMousePosition())

    act(() => fireMouseMove(100, 200))
    act(() => fireMouseMove(50, 75))

    expect(result.current).toEqual({ x: 50, y: 75 })
  })

  it('should remove event listener on unmount', () => {
    const spy = vi.spyOn(window, 'removeEventListener')
    const { unmount } = renderHook(() => useMousePosition())
    unmount()
    expect(spy).toHaveBeenCalledWith('mousemove', expect.any(Function))
    spy.mockRestore()
  })
})
