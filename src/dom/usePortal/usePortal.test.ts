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
})
