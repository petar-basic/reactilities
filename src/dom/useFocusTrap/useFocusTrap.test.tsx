import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { useFocusTrap } from '../useFocusTrap'

function TrapComponent({ active = true }: { active?: boolean }) {
  const ref = useFocusTrap(active)
  return (
    <div ref={ref as React.RefObject<HTMLDivElement>} data-testid="container">
      <button data-testid="btn1">First</button>
      <button data-testid="btn2">Second</button>
      <button data-testid="btn3">Third</button>
    </div>
  )
}

function EmptyTrapComponent() {
  const ref = useFocusTrap(true)
  return <div ref={ref as React.RefObject<HTMLDivElement>} data-testid="empty" />
}

describe('useFocusTrap', () => {
  it('should focus first focusable element on mount when active', () => {
    render(<TrapComponent />)
    expect(document.activeElement).toBe(screen.getByTestId('btn1'))
  })

  it('should not focus anything when active is false', () => {
    const before = document.activeElement
    render(<TrapComponent active={false} />)
    expect(document.activeElement).toBe(before)
  })

  it('should wrap focus from last to first on Tab', () => {
    render(<TrapComponent />)
    const last = screen.getByTestId('btn3')
    last.focus()

    fireEvent.keyDown(screen.getByTestId('container'), { key: 'Tab', shiftKey: false })

    expect(document.activeElement).toBe(screen.getByTestId('btn1'))
  })

  it('should wrap focus from first to last on Shift+Tab', () => {
    render(<TrapComponent />)
    const first = screen.getByTestId('btn1')
    first.focus()

    fireEvent.keyDown(screen.getByTestId('container'), { key: 'Tab', shiftKey: true })

    expect(document.activeElement).toBe(screen.getByTestId('btn3'))
  })

  it('should not wrap focus when pressing Tab on non-last element', () => {
    render(<TrapComponent />)
    const second = screen.getByTestId('btn2')
    second.focus()

    fireEvent.keyDown(screen.getByTestId('container'), { key: 'Tab', shiftKey: false })

    // Natural Tab behavior — focus stays on btn2 (we don't intercept non-boundary Tab)
    expect(document.activeElement).toBe(second)
  })

  it('should not intercept non-Tab keys', () => {
    render(<TrapComponent />)
    const btn1 = screen.getByTestId('btn1')
    btn1.focus()

    const preventDefault = vi.fn()
    fireEvent.keyDown(screen.getByTestId('container'), {
      key: 'Enter',
      preventDefault,
    })

    expect(document.activeElement).toBe(btn1)
  })

  it('should handle container with no focusable elements gracefully', () => {
    expect(() => render(<EmptyTrapComponent />)).not.toThrow()
  })

  it('should return a ref object', () => {
    let capturedRef: ReturnType<typeof useFocusTrap> | null = null

    function TestHook() {
      capturedRef = useFocusTrap(true)
      return null
    }

    render(<TestHook />)

    expect(capturedRef).toHaveProperty('current')
  })
})
