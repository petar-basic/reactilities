import { describe, it, expect, vi } from 'vitest'
import { renderHook, act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { useRovingTabIndex } from './index'

function Menu({ count, orientation = 'vertical', loop = true }: {
  count: number
  orientation?: 'vertical' | 'horizontal'
  loop?: boolean
}) {
  const { getContainerProps, getItemProps } = useRovingTabIndex(count, { orientation, loop })
  return (
    <ul {...getContainerProps()}>
      {Array.from({ length: count }, (_, i) => (
        <li key={i} {...getItemProps(i)}>Item {i}</li>
      ))}
    </ul>
  )
}

describe('useRovingTabIndex', () => {
  it('should return getContainerProps and getItemProps', () => {
    const { result } = renderHook(() => useRovingTabIndex(3))
    expect(typeof result.current.getContainerProps).toBe('function')
    expect(typeof result.current.getItemProps).toBe('function')
  })

  it('should set tabIndex=0 on the first item', () => {
    const { result } = renderHook(() => useRovingTabIndex(3))
    expect(result.current.getItemProps(0).tabIndex).toBe(0)
  })

  it('should set tabIndex=-1 on all other items', () => {
    const { result } = renderHook(() => useRovingTabIndex(3))
    expect(result.current.getItemProps(1).tabIndex).toBe(-1)
    expect(result.current.getItemProps(2).tabIndex).toBe(-1)
  })

  it('should move focus to next item on ArrowDown', async () => {
    const user = userEvent.setup()
    render(<Menu count={3} />)
    const items = screen.getAllByRole('listitem')

    await act(async () => { items[0].focus() })
    await user.keyboard('{ArrowDown}')

    expect(document.activeElement).toBe(items[1])
  })

  it('should move focus to previous item on ArrowUp', async () => {
    const user = userEvent.setup()
    render(<Menu count={3} />)
    const items = screen.getAllByRole('listitem')

    await act(async () => { items[2].focus() })
    await user.keyboard('{ArrowUp}')

    expect(document.activeElement).toBe(items[1])
  })

  it('should loop from last to first item with ArrowDown when loop=true', async () => {
    const user = userEvent.setup()
    render(<Menu count={3} loop={true} />)
    const items = screen.getAllByRole('listitem')

    await act(async () => { items[2].focus() })
    await user.keyboard('{ArrowDown}')

    expect(document.activeElement).toBe(items[0])
  })

  it('should not loop past last item when loop=false', async () => {
    const user = userEvent.setup()
    render(<Menu count={3} loop={false} />)
    const items = screen.getAllByRole('listitem')

    await act(async () => { items[2].focus() })
    await user.keyboard('{ArrowDown}')

    expect(document.activeElement).toBe(items[2])
  })

  it('should not loop past first item when loop=false', async () => {
    const user = userEvent.setup()
    render(<Menu count={3} loop={false} />)
    const items = screen.getAllByRole('listitem')

    await act(async () => { items[0].focus() })
    await user.keyboard('{ArrowUp}')

    expect(document.activeElement).toBe(items[0])
  })

  it('should move focus to first item on Home key', async () => {
    const user = userEvent.setup()
    render(<Menu count={3} />)
    const items = screen.getAllByRole('listitem')

    await act(async () => { items[2].focus() })
    await user.keyboard('{Home}')

    expect(document.activeElement).toBe(items[0])
  })

  it('should move focus to last item on End key', async () => {
    const user = userEvent.setup()
    render(<Menu count={3} />)
    const items = screen.getAllByRole('listitem')

    await act(async () => { items[0].focus() })
    await user.keyboard('{End}')

    expect(document.activeElement).toBe(items[2])
  })

  it('should use ArrowLeft/ArrowRight for horizontal orientation', async () => {
    const user = userEvent.setup()
    render(<Menu count={3} orientation="horizontal" />)
    const items = screen.getAllByRole('listitem')

    await act(async () => { items[0].focus() })
    await user.keyboard('{ArrowRight}')

    expect(document.activeElement).toBe(items[1])
  })

  // --- Mutation-proof DOM tabIndex roving tests ---
  // These assert the ACTUAL rendered `tabIndex` attribute, not just document.activeElement.
  // A ref-only implementation focuses the element but never re-renders, so the DOM
  // `tabindex` attributes stay frozen (all roving items keep their initial values).
  // These tests therefore fail on the ref-based bug and pass once focus is state-driven.

  it('should render tabIndex=0 only on the first item initially (DOM)', () => {
    render(<Menu count={3} />)
    const items = screen.getAllByRole('listitem')
    expect(items[0]).toHaveAttribute('tabindex', '0')
    expect(items[1]).toHaveAttribute('tabindex', '-1')
    expect(items[2]).toHaveAttribute('tabindex', '-1')
  })

  it('should rove the DOM tabIndex attribute on ArrowDown', async () => {
    const user = userEvent.setup()
    render(<Menu count={3} />)
    const items = screen.getAllByRole('listitem')

    await act(async () => { items[0].focus() })
    await user.keyboard('{ArrowDown}')

    // Previously-active item must now be removed from the tab order...
    expect(items[0]).toHaveAttribute('tabindex', '-1')
    // ...and the newly-focused item must be the single tabbable element.
    expect(items[1]).toHaveAttribute('tabindex', '0')
    expect(items[2]).toHaveAttribute('tabindex', '-1')
    // Programmatic focus must still have happened too.
    expect(document.activeElement).toBe(items[1])
  })

  it('should rove the DOM tabIndex attribute on ArrowRight (horizontal)', async () => {
    const user = userEvent.setup()
    render(<Menu count={3} orientation="horizontal" />)
    const items = screen.getAllByRole('listitem')

    await act(async () => { items[0].focus() })
    await user.keyboard('{ArrowRight}{ArrowRight}')

    expect(items[0]).toHaveAttribute('tabindex', '-1')
    expect(items[1]).toHaveAttribute('tabindex', '-1')
    expect(items[2]).toHaveAttribute('tabindex', '0')
    expect(document.activeElement).toBe(items[2])
  })

  it('should rove the DOM tabIndex attribute on Home/End', async () => {
    const user = userEvent.setup()
    render(<Menu count={3} />)
    const items = screen.getAllByRole('listitem')

    await act(async () => { items[0].focus() })
    await user.keyboard('{End}')
    expect(items[2]).toHaveAttribute('tabindex', '0')
    expect(items[0]).toHaveAttribute('tabindex', '-1')

    await user.keyboard('{Home}')
    expect(items[0]).toHaveAttribute('tabindex', '0')
    expect(items[2]).toHaveAttribute('tabindex', '-1')
  })

  it('should rove the DOM tabIndex attribute when item is focused externally (onFocus)', async () => {
    const user = userEvent.setup()
    render(<Menu count={3} />)
    const items = screen.getAllByRole('listitem')

    // Simulate a click/focus landing on the last item, then arrow back.
    await act(async () => { items[2].focus() })
    await user.keyboard('{ArrowUp}')

    expect(items[2]).toHaveAttribute('tabindex', '-1')
    expect(items[1]).toHaveAttribute('tabindex', '0')
    expect(document.activeElement).toBe(items[1])
  })

  it('should keep exactly one item with tabIndex=0 after several moves', async () => {
    const user = userEvent.setup()
    render(<Menu count={4} />)
    const items = screen.getAllByRole('listitem')

    await act(async () => { items[0].focus() })
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowUp}')

    const tabbable = items.filter(el => el.getAttribute('tabindex') === '0')
    expect(tabbable).toHaveLength(1)
    expect(tabbable[0]).toBe(items[1])
  })

  it('should return stable getContainerProps and getItemProps references', () => {
    const { result, rerender } = renderHook(() => useRovingTabIndex(3))
    const { getContainerProps, getItemProps } = result.current
    rerender()
    expect(result.current.getContainerProps).toBe(getContainerProps)
    expect(result.current.getItemProps).toBe(getItemProps)
  })

  it('should include onFocus in getItemProps return value', () => {
    const { result } = renderHook(() => useRovingTabIndex(3))
    const itemProps = result.current.getItemProps(0)
    expect(typeof itemProps.onFocus).toBe('function')
  })

  it('should update focused index via onFocus so subsequent keyboard nav is correct', async () => {
    const user = userEvent.setup()
    render(<Menu count={3} />)
    const items = screen.getAllByRole('listitem')

    // Focus the last item by click (triggers onFocus, updating focusedIndexRef to 2)
    await act(async () => { items[2].focus() })
    // ArrowDown from last item should loop to first
    await user.keyboard('{ArrowDown}')

    expect(document.activeElement).toBe(items[0])
  })

  it('should handle itemCount decreasing without errors', () => {
    const { result, rerender } = renderHook(
      ({ count }) => useRovingTabIndex(count),
      { initialProps: { count: 5 } }
    )

    rerender({ count: 2 })

    expect(result.current.getItemProps(0).tabIndex).toBe(0)
    expect(result.current.getItemProps(1).tabIndex).toBe(-1)
    expect(() => result.current.getContainerProps()).not.toThrow()
  })

  it('should call onKeyDown from getContainerProps', () => {
    const { result } = renderHook(() => useRovingTabIndex(3))
    const { onKeyDown } = result.current.getContainerProps()
    const mockEvent = {
      key: 'ArrowDown',
      preventDefault: vi.fn()
    } as unknown as React.KeyboardEvent

    expect(() => act(() => onKeyDown(mockEvent))).not.toThrow()
    expect(mockEvent.preventDefault).toHaveBeenCalled()
  })
})
