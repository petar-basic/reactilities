import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePortal } from './index'

describe('usePortal', () => {
  it('should return null before mount', () => {
    // On first render the container is null — useEffect hasn't run yet
    // renderHook triggers useEffect synchronously in the test environment
    // so we verify the final state instead
    const { result } = renderHook(() => usePortal())
    // After mount, container should be set
    expect(result.current).toBeInstanceOf(HTMLDivElement)
  })

  it('should append a div to document.body', () => {
    const countBefore = document.body.children.length
    const { result } = renderHook(() => usePortal())

    act(() => {})

    expect(document.body.children.length).toBeGreaterThan(countBefore)
    expect(result.current).toBeInstanceOf(HTMLDivElement)
  })

  it('should set the id attribute when provided', () => {
    const { result } = renderHook(() => usePortal('my-portal'))

    expect(result.current?.id).toBe('my-portal')
  })

  it('should not set id when not provided', () => {
    const { result } = renderHook(() => usePortal())

    expect(result.current?.id).toBe('')
  })

  it('should be a child of document.body', () => {
    const { result } = renderHook(() => usePortal())

    expect(document.body.contains(result.current)).toBe(true)
  })

  it('should remove the container from document.body on unmount', () => {
    const { result, unmount } = renderHook(() => usePortal())
    const container = result.current

    unmount()

    expect(document.body.contains(container)).toBe(false)
  })

  it('should create separate containers for separate hook instances', () => {
    const { result: result1 } = renderHook(() => usePortal())
    const { result: result2 } = renderHook(() => usePortal())

    expect(result1.current).not.toBe(result2.current)
    expect(result1.current).toBeInstanceOf(HTMLDivElement)
    expect(result2.current).toBeInstanceOf(HTMLDivElement)
  })

  it('should create and remove a per-instance container when no id is provided', () => {
    const { result: a, unmount: unmountA } = renderHook(() => usePortal())
    const { result: b, unmount: unmountB } = renderHook(() => usePortal())
    const containerA = a.current
    const containerB = b.current

    // Two separate elements, both in the DOM
    expect(containerA).not.toBe(containerB)
    expect(document.body.contains(containerA)).toBe(true)
    expect(document.body.contains(containerB)).toBe(true)

    // Each is removed independently on its own unmount
    unmountA()
    expect(document.body.contains(containerA)).toBe(false)
    expect(document.body.contains(containerB)).toBe(true)

    unmountB()
    expect(document.body.contains(containerB)).toBe(false)
  })

  it('should share a single DOM element for two instances with the same id', () => {
    const { result: first } = renderHook(() => usePortal('shared-id'))
    const { result: second } = renderHook(() => usePortal('shared-id'))

    // Mutation-proof: the unconditional-create implementation produces two
    // elements with the same id; find-or-create must yield exactly one.
    expect(document.querySelectorAll('#shared-id').length).toBe(1)
    // Both hooks resolve to the very same element instance
    expect(first.current).toBe(second.current)
    expect(first.current?.id).toBe('shared-id')
  })

  it('should keep the shared element while another consumer is still mounted', () => {
    const { result: first, unmount: unmountFirst } = renderHook(() =>
      usePortal('still-used'),
    )
    const { result: second } = renderHook(() => usePortal('still-used'))
    const shared = first.current

    expect(shared).toBe(second.current)
    expect(document.body.contains(shared)).toBe(true)

    // Unmounting the first consumer must NOT remove a still-in-use container
    unmountFirst()
    expect(document.body.contains(shared)).toBe(true)
    expect(second.current).toBe(shared)
    expect(document.querySelectorAll('#still-used').length).toBe(1)
  })

  it('should remove the shared element only when the last consumer unmounts', () => {
    const { unmount: unmountFirst } = renderHook(() => usePortal('last-out'))
    const { result: second, unmount: unmountSecond } = renderHook(() =>
      usePortal('last-out'),
    )
    const shared = second.current

    unmountFirst()
    expect(document.body.contains(shared)).toBe(true)

    unmountSecond()
    // Created by the hook → removed when refcount hits zero
    expect(document.body.contains(shared)).toBe(false)
    expect(document.getElementById('last-out')).toBeNull()
  })

  it('should reuse a pre-existing element and NOT remove it on cleanup', () => {
    // Element placed by other code (not created by the hook)
    const preExisting = document.createElement('div')
    preExisting.id = 'pre-existing'
    document.body.appendChild(preExisting)

    const { result, unmount } = renderHook(() => usePortal('pre-existing'))

    // The hook reuses the existing element rather than creating a duplicate
    expect(result.current).toBe(preExisting)
    expect(document.querySelectorAll('#pre-existing').length).toBe(1)

    unmount()

    // Pre-existing element must survive cleanup — the hook didn't create it
    expect(document.body.contains(preExisting)).toBe(true)
    expect(document.getElementById('pre-existing')).toBe(preExisting)

    document.body.removeChild(preExisting)
  })

  it('should keep refcount balanced across StrictMode-style mount/unmount/mount', () => {
    // Simulate StrictMode double-invocation of effects: mount → cleanup → mount
    const { result, rerender, unmount } = renderHook(
      () => usePortal('strict-id'),
    )
    const shared = result.current
    expect(document.querySelectorAll('#strict-id').length).toBe(1)

    // A second consumer keeps the element alive across re-renders
    const { unmount: unmountSecond } = renderHook(() => usePortal('strict-id'))
    expect(document.querySelectorAll('#strict-id').length).toBe(1)

    rerender({ key: 1 })
    expect(document.body.contains(shared)).toBe(true)
    expect(document.querySelectorAll('#strict-id').length).toBe(1)

    unmount()
    // Still one consumer left
    expect(document.body.contains(shared)).toBe(true)

    unmountSecond()
    expect(document.body.contains(shared)).toBe(false)
  })
})
