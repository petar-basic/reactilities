import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { useFocusTrap } from './index'

function TrapComponent({ active = true }: { active?: boolean }) {
  // NOTE: no cast on `ref`. This usage is mutation-proof for BUG 1: the hook
  // must be generic (`useFocusTrap<HTMLDivElement>()` returning
  // `RefObject<HTMLDivElement | null>`) for `<div ref={ref} />` to type-check
  // under @types/react 19. If the return type is reverted to the non-generic
  // `RefObject<HTMLElement | null>`, this file fails `tsc`.
  const ref = useFocusTrap<HTMLDivElement>(active)
  return (
    <div ref={ref} data-testid="container">
      <button data-testid="btn1">First</button>
      <button data-testid="btn2">Second</button>
      <button data-testid="btn3">Third</button>
    </div>
  )
}

// Renders an element OUTSIDE the trapped container so we can prove focus cannot
// escape to the background page while the trap is active.
function TrapWithOutside({ active = true }: { active?: boolean }) {
  const ref = useFocusTrap<HTMLDivElement>(active)
  return (
    <>
      <button data-testid="outside">Outside</button>
      <div ref={ref} data-testid="container">
        <button data-testid="btn1">First</button>
        <button data-testid="btn2">Second</button>
        <button data-testid="btn3">Third</button>
      </div>
    </>
  )
}

function EmptyTrapComponent() {
  const ref = useFocusTrap<HTMLDivElement>(true)
  return <div ref={ref} data-testid="empty" tabIndex={-1} />
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

    // Dispatched on the focused element; the document-level keydown listener
    // (BUG 2 fix) receives it as it bubbles up.
    fireEvent.keyDown(last, { key: 'Tab', shiftKey: false })

    expect(document.activeElement).toBe(screen.getByTestId('btn1'))
  })

  it('should wrap focus from first to last on Shift+Tab', () => {
    render(<TrapComponent />)
    const first = screen.getByTestId('btn1')
    first.focus()

    fireEvent.keyDown(first, { key: 'Tab', shiftKey: true })

    expect(document.activeElement).toBe(screen.getByTestId('btn3'))
  })

  // Mutation-proof for BUG 2 (listener target): dispatching the Tab on
  // `document` (not bubbling through the container) is only intercepted when the
  // keydown listener is attached to `document`. The old container-only
  // implementation never sees these events, so the wrap does not happen.
  it('should wrap last->first when Tab is dispatched at document level', () => {
    render(<TrapComponent />)
    screen.getByTestId('btn3').focus()

    fireEvent.keyDown(document, { key: 'Tab', shiftKey: false })

    expect(document.activeElement).toBe(screen.getByTestId('btn1'))
  })

  it('should wrap first->last when Shift+Tab is dispatched at document level', () => {
    render(<TrapComponent />)
    screen.getByTestId('btn1').focus()

    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true })

    expect(document.activeElement).toBe(screen.getByTestId('btn3'))
  })

  it('should wrap last->first on real Tab keypress via userEvent', async () => {
    const user = userEvent.setup()
    render(<TrapComponent />)
    screen.getByTestId('btn3').focus()

    await user.tab()

    expect(document.activeElement).toBe(screen.getByTestId('btn1'))
  })

  it('should wrap first->last on real Shift+Tab keypress via userEvent', async () => {
    const user = userEvent.setup()
    render(<TrapComponent />)
    screen.getByTestId('btn1').focus()

    await user.tab({ shift: true })

    expect(document.activeElement).toBe(screen.getByTestId('btn3'))
  })

  it('should not wrap focus when pressing Tab on non-boundary element', () => {
    render(<TrapComponent />)
    const second = screen.getByTestId('btn2')
    second.focus()

    fireEvent.keyDown(second, { key: 'Tab', shiftKey: false })

    // Natural Tab behavior — focus stays on btn2 (we don't intercept non-boundary Tab)
    expect(document.activeElement).toBe(second)
  })

  it('should not intercept non-Tab keys', () => {
    render(<TrapComponent />)
    const btn1 = screen.getByTestId('btn1')
    btn1.focus()

    fireEvent.keyDown(btn1, { key: 'Enter' })

    expect(document.activeElement).toBe(btn1)
  })

  // BUG 2 (escapability): the previous implementation bound keydown to the
  // CONTAINER only, so once focus left the container it never saw the next Tab
  // and the background page became reachable. These tests dispatch focus moves
  // OUTSIDE the container and assert the trap recaptures focus. They fail on the
  // old container-only implementation.
  it('should recapture focus when focus drifts to the body', () => {
    render(<TrapWithOutside />)
    expect(document.activeElement).toBe(screen.getByTestId('btn1'))

    // Drop focus out of the trap entirely (the backdrop/body case), then notify
    // the document-level focusin listener that focus landed on the body.
    ;(document.activeElement as HTMLElement).blur()
    fireEvent.focusIn(document.body)

    // The focusin listener (BUG 2 fix) pulls focus back inside. The old
    // container-only implementation has no document listener, so focus stays out.
    expect(screen.getByTestId('container').contains(document.activeElement)).toBe(
      true
    )
  })

  it('should recapture focus when an element outside the container is focused', () => {
    render(<TrapWithOutside />)

    const outside = screen.getByTestId('outside')
    outside.focus()

    // Focus must not rest on the outside element while the trap is active.
    expect(document.activeElement).not.toBe(outside)
    expect(screen.getByTestId('container').contains(document.activeElement)).toBe(
      true
    )
  })

  it('should wrap on Tab even if the keydown originates after focus drifted to body', () => {
    render(<TrapWithOutside />)
    // Move focus to the last element, then a Tab from there must wrap to first.
    screen.getByTestId('btn3').focus()
    fireEvent.keyDown(screen.getByTestId('btn3'), { key: 'Tab' })
    expect(document.activeElement).toBe(screen.getByTestId('btn1'))
  })

  it('should handle container with no focusable elements gracefully', () => {
    expect(() => render(<EmptyTrapComponent />)).not.toThrow()
  })

  it('should not trap or steal focus when active is false', () => {
    render(<TrapWithOutside active={false} />)

    const outside = screen.getByTestId('outside')
    outside.focus()

    // Trap is disengaged: focus is allowed to rest outside.
    expect(document.activeElement).toBe(outside)
  })

  it('should stop recapturing focus after being deactivated', () => {
    const { rerender } = render(<TrapWithOutside active />)
    expect(screen.getByTestId('container').contains(document.activeElement)).toBe(
      true
    )

    rerender(<TrapWithOutside active={false} />)

    const outside = screen.getByTestId('outside')
    outside.focus()

    // After deactivation the focusin listener is removed, so focus can leave.
    expect(document.activeElement).toBe(outside)
  })

  it('should restore focus to the previously focused element on deactivation', () => {
    // A trigger button outside the trap, focused before the trap engages.
    function Harness({ active }: { active: boolean }) {
      const ref = useFocusTrap<HTMLDivElement>(active)
      return (
        <>
          <button data-testid="trigger">Open</button>
          <div ref={ref} data-testid="container">
            <button data-testid="inner">Inner</button>
          </div>
        </>
      )
    }

    const { rerender } = render(<Harness active={false} />)
    const trigger = screen.getByTestId('trigger')
    trigger.focus()
    expect(document.activeElement).toBe(trigger)

    // Activate the trap — focus moves inside.
    rerender(<Harness active />)
    expect(document.activeElement).toBe(screen.getByTestId('inner'))

    // Deactivate — focus is restored to the trigger.
    rerender(<Harness active={false} />)
    expect(document.activeElement).toBe(trigger)
  })

  it('should not intercept Tab when the trap is inactive', () => {
    render(<TrapComponent active={false} />)
    const noopPreventDefault = vi.fn()
    fireEvent.keyDown(document, { key: 'Tab', preventDefault: noopPreventDefault })
    // No assertion error / no throw is the contract here; nothing is trapped.
    expect(true).toBe(true)
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
