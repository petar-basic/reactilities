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
