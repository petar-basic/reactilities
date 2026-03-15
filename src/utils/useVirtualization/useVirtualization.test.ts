import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useVirtualization } from '../useVirtualization'

describe('useVirtualization', () => {
  it('should calculate correct totalSize', () => {
    const { result } = renderHook(() =>
      useVirtualization(1000, { itemHeight: 50, containerHeight: 400 })
    )
    expect(result.current.totalSize).toBe(50000) // 1000 * 50
  })

  it('should return zero totalSize for empty list', () => {
    const { result } = renderHook(() =>
      useVirtualization(0, { itemHeight: 50, containerHeight: 400 })
    )
    expect(result.current.totalSize).toBe(0)
    expect(result.current.virtualItems).toHaveLength(0)
  })

  it('should calculate correct item positions', () => {
    const { result } = renderHook(() =>
      useVirtualization(10, { itemHeight: 30, containerHeight: 90, overscan: 0 })
    )

    const { virtualItems } = result.current

    virtualItems.forEach((item) => {
      expect(item.start).toBe(item.index * 30)
      expect(item.end).toBe((item.index + 1) * 30)
      expect(item.size).toBe(30)
    })
  })

  it('should limit virtualItems to total itemCount', () => {
    const { result } = renderHook(() =>
      useVirtualization(5, { itemHeight: 50, containerHeight: 400, overscan: 10 })
    )
    expect(result.current.virtualItems.length).toBeLessThanOrEqual(5)
  })

  it('should include overscan items above and below visible range', () => {
    const { result } = renderHook(() =>
      useVirtualization(100, { itemHeight: 50, containerHeight: 100, overscan: 2 })
    )

    const { virtualItems } = result.current
    // Visible = 100/50 = 2 items. With overscan 2 on each side: max 6 items from start
    expect(virtualItems.length).toBeGreaterThan(2)
  })

  it('should return isScrolling as false initially', () => {
    const { result } = renderHook(() =>
      useVirtualization(100, { itemHeight: 50, containerHeight: 400 })
    )
    expect(result.current.isScrolling).toBe(false)
  })

  it('should return scrollToIndex function', () => {
    const { result } = renderHook(() =>
      useVirtualization(100, { itemHeight: 50, containerHeight: 400 })
    )
    expect(typeof result.current.scrollToIndex).toBe('function')
  })

  it('should update virtualItems when scrollToIndex is called', () => {
    const { result } = renderHook(() =>
      useVirtualization(100, { itemHeight: 50, containerHeight: 200, overscan: 0 })
    )

    // Initially shows items from index 0
    expect(result.current.virtualItems[0].index).toBe(0)

    // Scroll to item 20
    act(() => {
      result.current.scrollToIndex(20)
    })

    // Now virtual items should include item 20
    const indices = result.current.virtualItems.map((item) => item.index)
    expect(indices).toContain(20)
  })

  it('should use default overscan of 5', () => {
    const { result: withDefault } = renderHook(() =>
      useVirtualization(100, { itemHeight: 50, containerHeight: 50 })
    )
    const { result: withExplicit } = renderHook(() =>
      useVirtualization(100, { itemHeight: 50, containerHeight: 50, overscan: 5 })
    )

    expect(withDefault.current.virtualItems.length).toBe(withExplicit.current.virtualItems.length)
  })

  it('should have items with consecutive indices', () => {
    const { result } = renderHook(() =>
      useVirtualization(50, { itemHeight: 40, containerHeight: 200, overscan: 0 })
    )

    const { virtualItems } = result.current
    for (let i = 1; i < virtualItems.length; i++) {
      expect(virtualItems[i].index).toBe(virtualItems[i - 1].index + 1)
    }
  })

  it('should expose a containerRef', () => {
    const { result } = renderHook(() =>
      useVirtualization(100, { itemHeight: 50, containerHeight: 400 })
    )
    expect(result.current.containerRef).toBeDefined()
    expect(result.current.containerRef).toHaveProperty('current')
  })

  it('should have stable scrollToIndex reference across re-renders', () => {
    const { result, rerender } = renderHook(() =>
      useVirtualization(100, { itemHeight: 50, containerHeight: 400 })
    )

    const first = result.current.scrollToIndex
    rerender()
    expect(result.current.scrollToIndex).toBe(first)
  })
})
