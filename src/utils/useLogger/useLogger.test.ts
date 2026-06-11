import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { StrictMode, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { useLogger } from './index'

describe('useLogger', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should log Mounted on first render', () => {
    renderHook(() => useLogger('TestComponent', { value: 1 }))

    expect(console.log).toHaveBeenCalledWith(
      '[TestComponent] Mounted',
      { value: 1 }
    )
  })

  it('should log Updated with changed props on re-render', () => {
    const { rerender } = renderHook(
      ({ props }) => useLogger('TestComponent', props),
      { initialProps: { props: { value: 1, name: 'Alice' } } }
    )

    rerender({ props: { value: 2, name: 'Alice' } })

    expect(console.log).toHaveBeenCalledWith(
      '[TestComponent] Updated',
      { value: 2, name: 'Alice' },
      '— changed:',
      { value: 2 }
    )
  })

  it('should log Unmounted when component unmounts', () => {
    const { unmount } = renderHook(() => useLogger('TestComponent', {}))
    unmount()

    expect(console.log).toHaveBeenCalledWith('[TestComponent] Unmounted')
  })

  it('should include component name in all log messages', () => {
    const { rerender, unmount } = renderHook(
      ({ p }) => useLogger('MyWidget', p),
      { initialProps: { p: { x: 1 } } }
    )

    rerender({ p: { x: 2 } })
    unmount()

    const calls = (console.log as ReturnType<typeof vi.fn>).mock.calls
    expect(calls.every(call => (call[0] as string).includes('MyWidget'))).toBe(true)
  })

  it('should log empty changed object when no props changed', () => {
    const props = { value: 42 }

    const { rerender } = renderHook(
      ({ p }) => useLogger('TestComponent', p),
      { initialProps: { p: props } }
    )

    // Re-render with the exact same object reference
    rerender({ p: props })

    const updateCall = (console.log as ReturnType<typeof vi.fn>).mock.calls
      .find(call => (call[0] as string).includes('Updated'))

    expect(updateCall).toBeDefined()
    expect(updateCall?.[3]).toEqual({})
  })

  it('should detect newly added keys as changed', () => {
    const { rerender } = renderHook(
      ({ p }) => useLogger('C', p),
      { initialProps: { p: { a: 1 } as Record<string, unknown> } }
    )

    rerender({ p: { a: 1, b: 2 } })

    const updateCall = (console.log as ReturnType<typeof vi.fn>).mock.calls
      .find(call => (call[0] as string).includes('Updated'))

    expect(updateCall?.[3]).toEqual({ b: 2 })
  })

  it('should only call Mounted once across multiple re-renders', () => {
    const { rerender } = renderHook(
      ({ v }) => useLogger('C', { v }),
      { initialProps: { v: 1 } }
    )

    rerender({ v: 2 })
    rerender({ v: 3 })

    const mountCalls = (console.log as ReturnType<typeof vi.fn>).mock.calls
      .filter(call => (call[0] as string).includes('Mounted'))

    expect(mountCalls).toHaveLength(1)
  })

  describe('under React.StrictMode', () => {
    // `renderHook` does NOT replay StrictMode's dev mount -> cleanup -> remount
    // effect cycle, so to faithfully exercise the bug we render a real component
    // into a real DOM container via `createRoot` wrapped in <StrictMode>. That
    // double-invokes effects exactly as React does in development.
    function renderStrict(componentName: string, props?: Record<string, unknown>) {
      const Probe = () => {
        useLogger(componentName, props)
        return null
      }
      const container = document.createElement('div')
      document.body.appendChild(container)
      const root = createRoot(container)
      act(() => {
        root.render(createElement(StrictMode, null, createElement(Probe)))
      })
      const unmount = () => {
        act(() => {
          root.unmount()
        })
        container.remove()
      }
      return { unmount }
    }

    function messages() {
      return (console.log as ReturnType<typeof vi.fn>).mock.calls.map(
        call => call[0] as string
      )
    }

    it('should not log a phantom "Updated ... changed: {}" on initial mount', () => {
      const { unmount } = renderStrict('StrictComponent', { value: 1 })

      // StrictMode's simulated cleanup must reset the first-render flag so the
      // remount logs `Mounted` again instead of a confusing phantom `Updated`.
      const updateCalls = (console.log as ReturnType<typeof vi.fn>).mock.calls
        .filter(call => (call[0] as string).includes('Updated'))
      expect(updateCalls).toHaveLength(0)

      unmount()
    })

    it('should produce a sane Mounted/Unmounted/Mounted sequence (no phantom diff)', () => {
      const { unmount } = renderStrict('StrictComponent', { value: 1 })

      // The exact dev double-invoke order: mount, simulated cleanup, remount.
      expect(messages()).toEqual([
        '[StrictComponent] Mounted',
        '[StrictComponent] Unmounted',
        '[StrictComponent] Mounted',
      ])

      unmount()
    })

    it('should still log a real Updated diff after the StrictMode mount settles', () => {
      // Sanity: the StrictMode cleanup must not break normal update logging.
      const { rerender } = renderHook(
        ({ v }) => useLogger('Settled', { v }),
        { initialProps: { v: 1 } }
      )
      rerender({ v: 2 })

      const updateCall = (console.log as ReturnType<typeof vi.fn>).mock.calls
        .find(call => (call[0] as string).includes('Updated'))
      expect(updateCall?.[3]).toEqual({ v: 2 })
    })

    it('should accept undefined props without throwing', () => {
      expect(() => {
        const { unmount } = renderStrict('NoProps')
        unmount()
      }).not.toThrow()
    })
  })
})
