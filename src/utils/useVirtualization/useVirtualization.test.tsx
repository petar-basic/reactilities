import { describe, it, expect } from 'vitest'
import { renderHook, render, act, fireEvent } from '@testing-library/react'
import { useState } from 'react'
import { useVirtualization } from './index'

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

  it('should grow the rendered window as overscan increases', () => {
    const { result: withZero } = renderHook(() =>
      useVirtualization(100, { itemHeight: 50, containerHeight: 100, overscan: 0 })
    )
    const { result: withFive } = renderHook(() =>
      useVirtualization(100, { itemHeight: 50, containerHeight: 100, overscan: 5 })
    )

    // scrollTop 0, containerHeight 100, itemHeight 50:
    //   endIndex = ceil((0 + 100) / 50) + overscan = 2 + overscan
    //   indices 0..endIndex inclusive => (endIndex + 1) items
    // overscan 0 -> indices 0..2 => 3 items
    // overscan 5 -> indices 0..7 => 8 items (5 extra trailing buffer items)
    expect(withZero.current.virtualItems.length).toBe(3)
    expect(withFive.current.virtualItems.length).toBe(8)
    expect(withFive.current.virtualItems.length - withZero.current.virtualItems.length).toBe(5)
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
    // containerRef is a callback ref (a function) that is still valid as a
    // React `ref` prop, so `<div ref={containerRef}>` keeps working.
    expect(result.current.containerRef).toBeDefined()
    expect(typeof result.current.containerRef).toBe('function')
  })

  it('should have stable scrollToIndex reference across re-renders', () => {
    const { result, rerender } = renderHook(() =>
      useVirtualization(100, { itemHeight: 50, containerHeight: 400 })
    )

    const first = result.current.scrollToIndex
    rerender()
    expect(result.current.scrollToIndex).toBe(first)
  })

  // --- BUG 2 mutation-proof: scroll listener actually updates the window ---

  it('should update the visible window when the container scrolls', () => {
    // Renders a real component so the callback ref attaches to a real DOM node.
    function VirtualList() {
      const { containerRef, virtualItems } = useVirtualization<HTMLDivElement>(
        100,
        { itemHeight: 50, containerHeight: 200, overscan: 0 }
      )
      return (
        <div ref={containerRef} data-testid="scroller">
          {virtualItems.map((item) => (
            <div key={item.index} data-index={item.index}>
              Item {item.index}
            </div>
          ))}
        </div>
      )
    }

    const { getByTestId, container } = render(<VirtualList />)
    const scroller = getByTestId('scroller')

    // Initially the window starts at index 0.
    expect(container.querySelector('[data-index="0"]')).not.toBeNull()
    expect(container.querySelector('[data-index="20"]')).toBeNull()

    // Simulate a user scroll. jsdom doesn't lay out, so set scrollTop manually
    // then fire the scroll event the listener subscribes to.
    act(() => {
      Object.defineProperty(scroller, 'scrollTop', { value: 1000, configurable: true })
      fireEvent.scroll(scroller)
    })

    // Listener must have been attached and updated the window to include item 20
    // (scrollTop 1000 / itemHeight 50 = index 20). Fails if the listener is
    // never attached (BUG 2) because the window would stay at index 0.
    expect(container.querySelector('[data-index="20"]')).not.toBeNull()
    expect(container.querySelector('[data-index="0"]')).toBeNull()
  })

  it('should attach the scroll listener even when the container mounts later (late/conditional ref)', () => {
    // The container is rendered conditionally and only appears after a flip.
    // With the old single-shot effect, the listener would never attach.
    function LateList({ ready }: { ready: boolean }) {
      const { containerRef, virtualItems } = useVirtualization<HTMLDivElement>(
        100,
        { itemHeight: 50, containerHeight: 200, overscan: 0 }
      )
      return (
        <div data-testid="root">
          {ready && (
            <div ref={containerRef} data-testid="scroller">
              {virtualItems.map((item) => (
                <div key={item.index} data-index={item.index}>
                  Item {item.index}
                </div>
              ))}
            </div>
          )}
        </div>
      )
    }

    // Mount with NO container; flip to render it afterwards.
    const { rerender, queryByTestId, container } = render(<LateList ready={false} />)
    expect(queryByTestId('scroller')).toBeNull()

    rerender(<LateList ready />)
    const scroller = queryByTestId('scroller')!
    expect(scroller).not.toBeNull()

    act(() => {
      Object.defineProperty(scroller, 'scrollTop', { value: 1000, configurable: true })
      fireEvent.scroll(scroller)
    })

    // If the subscription follows the late-mounted node, the window updates.
    expect(container.querySelector('[data-index="20"]')).not.toBeNull()
  })

  it('should re-subscribe when the container node is swapped', () => {
    // Two different DOM nodes; toggling swaps which one holds the ref.
    function SwapList() {
      const [useSecond, setUseSecond] = useState(false)
      const { containerRef, virtualItems } = useVirtualization<HTMLDivElement>(
        100,
        { itemHeight: 50, containerHeight: 200, overscan: 0 }
      )
      const children = virtualItems.map((item) => (
        <div key={item.index} data-index={item.index}>
          Item {item.index}
        </div>
      ))
      return (
        <div>
          <button onClick={() => setUseSecond(true)}>swap</button>
          {useSecond ? (
            <div ref={containerRef} data-testid="second">
              {children}
            </div>
          ) : (
            <div ref={containerRef} data-testid="first">
              {children}
            </div>
          )}
        </div>
      )
    }

    const { getByText, getByTestId, container } = render(<SwapList />)

    act(() => {
      fireEvent.click(getByText('swap'))
    })

    const second = getByTestId('second')
    act(() => {
      Object.defineProperty(second, 'scrollTop', { value: 1000, configurable: true })
      fireEvent.scroll(second)
    })

    // Scrolling the new (swapped-in) node must update the window.
    expect(container.querySelector('[data-index="20"]')).not.toBeNull()
  })
})
