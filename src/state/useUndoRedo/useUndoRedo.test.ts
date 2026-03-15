import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useUndoRedo } from '../useUndoRedo'

describe('useUndoRedo', () => {
  it('should return initial state as present', () => {
    const { result } = renderHook(() => useUndoRedo('hello'))
    expect(result.current.state).toBe('hello')
  })

  it('should start with empty past and future', () => {
    const { result } = renderHook(() => useUndoRedo(0))
    expect(result.current.past).toHaveLength(0)
    expect(result.current.future).toHaveLength(0)
    expect(result.current.canUndo).toBe(false)
    expect(result.current.canRedo).toBe(false)
  })

  it('should update state when set is called', () => {
    const { result } = renderHook(() => useUndoRedo('a'))

    act(() => result.current.set('b'))

    expect(result.current.state).toBe('b')
    expect(result.current.past).toEqual(['a'])
    expect(result.current.canUndo).toBe(true)
  })

  it('should clear future when set is called', () => {
    const { result } = renderHook(() => useUndoRedo('a'))

    act(() => result.current.set('b'))
    act(() => result.current.undo())
    expect(result.current.canRedo).toBe(true)

    act(() => result.current.set('c'))
    expect(result.current.future).toHaveLength(0)
    expect(result.current.canRedo).toBe(false)
  })

  it('should undo to previous state', () => {
    const { result } = renderHook(() => useUndoRedo(1))

    act(() => result.current.set(2))
    act(() => result.current.set(3))
    act(() => result.current.undo())

    expect(result.current.state).toBe(2)
    expect(result.current.canRedo).toBe(true)
  })

  it('should redo to next state', () => {
    const { result } = renderHook(() => useUndoRedo('x'))

    act(() => result.current.set('y'))
    act(() => result.current.undo())
    act(() => result.current.redo())

    expect(result.current.state).toBe('y')
    expect(result.current.canRedo).toBe(false)
  })

  it('should do nothing when undoing with no past', () => {
    const { result } = renderHook(() => useUndoRedo(42))

    act(() => result.current.undo())

    expect(result.current.state).toBe(42)
  })

  it('should do nothing when redoing with no future', () => {
    const { result } = renderHook(() => useUndoRedo(42))

    act(() => result.current.redo())

    expect(result.current.state).toBe(42)
  })

  it('should reset to new initial value and clear history', () => {
    const { result } = renderHook(() => useUndoRedo('a'))

    act(() => result.current.set('b'))
    act(() => result.current.set('c'))
    act(() => result.current.reset('fresh'))

    expect(result.current.state).toBe('fresh')
    expect(result.current.past).toHaveLength(0)
    expect(result.current.future).toHaveLength(0)
    expect(result.current.canUndo).toBe(false)
    expect(result.current.canRedo).toBe(false)
  })

  it('should support multiple undos', () => {
    const { result } = renderHook(() => useUndoRedo(0))

    act(() => result.current.set(1))
    act(() => result.current.set(2))
    act(() => result.current.set(3))
    act(() => result.current.undo())
    act(() => result.current.undo())

    expect(result.current.state).toBe(1)
    expect(result.current.past).toEqual([0])
    expect(result.current.future).toEqual([2, 3])
  })

  it('should have stable set/undo/redo/reset references', () => {
    const { result, rerender } = renderHook(() => useUndoRedo(0))

    const { set, undo, redo, reset } = result.current
    rerender()

    expect(result.current.set).toBe(set)
    expect(result.current.undo).toBe(undo)
    expect(result.current.redo).toBe(redo)
    expect(result.current.reset).toBe(reset)
  })

  it('should work with object state', () => {
    const { result } = renderHook(() => useUndoRedo({ count: 0 }))

    act(() => result.current.set({ count: 1 }))
    act(() => result.current.undo())

    expect(result.current.state).toEqual({ count: 0 })
  })
})
