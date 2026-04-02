import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDragAndDrop } from './index'
import { DragEvent } from 'react'

function makeDragEvent(files: File[] = []): DragEvent {
  return {
    preventDefault: vi.fn(),
    dataTransfer: { files }
  } as unknown as DragEvent
}

describe('useDragAndDrop', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should start with isDragging false, empty files, and null error', () => {
    const { result } = renderHook(() => useDragAndDrop())
    expect(result.current.isDragging).toBe(false)
    expect(result.current.files).toEqual([])
    expect(result.current.error).toBeNull()
  })

  it('should set isDragging to true on drag enter', () => {
    const { result } = renderHook(() => useDragAndDrop())

    act(() => {
      result.current.getRootProps().onDragEnter(makeDragEvent())
    })

    expect(result.current.isDragging).toBe(true)
  })

  it('should set isDragging to false on drag leave', () => {
    const { result } = renderHook(() => useDragAndDrop())

    act(() => {
      result.current.getRootProps().onDragEnter(makeDragEvent())
    })

    act(() => {
      result.current.getRootProps().onDragLeave(makeDragEvent())
    })

    expect(result.current.isDragging).toBe(false)
  })

  it('should not reset isDragging until all drag enter events are balanced by leave events', () => {
    const { result } = renderHook(() => useDragAndDrop())
    const props = result.current.getRootProps()

    act(() => {
      props.onDragEnter(makeDragEvent())
      props.onDragEnter(makeDragEvent()) // nested enter
    })

    act(() => {
      props.onDragLeave(makeDragEvent()) // one leave
    })

    expect(result.current.isDragging).toBe(true)

    act(() => {
      props.onDragLeave(makeDragEvent()) // second leave
    })

    expect(result.current.isDragging).toBe(false)
  })

  it('should call preventDefault on drag over', () => {
    const { result } = renderHook(() => useDragAndDrop())
    const event = makeDragEvent()

    act(() => {
      result.current.getRootProps().onDragOver(event)
    })

    expect(event.preventDefault).toHaveBeenCalled()
  })

  it('should accept dropped files and set files state', () => {
    const { result } = renderHook(() => useDragAndDrop())
    const file = new File(['content'], 'test.txt', { type: 'text/plain' })

    act(() => {
      result.current.getRootProps().onDrop(makeDragEvent([file]))
    })

    expect(result.current.files).toEqual([file])
    expect(result.current.isDragging).toBe(false)
  })

  it('should call onDrop callback with files', () => {
    const onDrop = vi.fn()
    const { result } = renderHook(() => useDragAndDrop({ onDrop }))
    const file = new File(['content'], 'test.txt')

    act(() => {
      result.current.getRootProps().onDrop(makeDragEvent([file]))
    })

    expect(onDrop).toHaveBeenCalledWith([file])
  })

  it('should reject when file count exceeds maxFiles', () => {
    const onError = vi.fn()
    const { result } = renderHook(() => useDragAndDrop({ maxFiles: 1, onError }))

    const files = [
      new File(['a'], 'a.txt'),
      new File(['b'], 'b.txt')
    ]

    act(() => {
      result.current.getRootProps().onDrop(makeDragEvent(files))
    })

    expect(result.current.files).toEqual([])
    expect(result.current.error).toBeInstanceOf(Error)
    expect(onError).toHaveBeenCalledWith(result.current.error)
  })

  it('should reject when a file exceeds maxSize', () => {
    const { result } = renderHook(() => useDragAndDrop({ maxSize: 5 }))
    const largeFile = new File(['more than 5 bytes'], 'large.txt')

    act(() => {
      result.current.getRootProps().onDrop(makeDragEvent([largeFile]))
    })

    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.files).toEqual([])
  })

  it('should reject when file type is not in accept list', () => {
    const { result } = renderHook(() => useDragAndDrop({ accept: ['image/png'] }))
    const file = new File(['text'], 'doc.txt', { type: 'text/plain' })

    act(() => {
      result.current.getRootProps().onDrop(makeDragEvent([file]))
    })

    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.files).toEqual([])
  })

  it('should reset all state on reset()', () => {
    const { result } = renderHook(() => useDragAndDrop())
    const file = new File(['content'], 'test.txt')

    act(() => {
      result.current.getRootProps().onDrop(makeDragEvent([file]))
    })

    expect(result.current.files).toHaveLength(1)

    act(() => {
      result.current.reset()
    })

    expect(result.current.files).toEqual([])
    expect(result.current.error).toBeNull()
    expect(result.current.isDragging).toBe(false)
  })

  it('should clear stale valid files when a subsequent drop fails validation', () => {
    const { result } = renderHook(() => useDragAndDrop({ maxFiles: 1 }))

    // Drop one valid file
    act(() => {
      result.current.getRootProps().onDrop(makeDragEvent([new File(['a'], 'a.txt')]))
    })
    expect(result.current.files).toHaveLength(1)

    // Drop two files (exceeds maxFiles) — files must be cleared, not show the previous valid set
    act(() => {
      result.current.getRootProps().onDrop(makeDragEvent([
        new File(['a'], 'a.txt'),
        new File(['b'], 'b.txt')
      ]))
    })

    expect(result.current.files).toEqual([])
    expect(result.current.error).toBeInstanceOf(Error)
  })

  it('should clear error on a valid subsequent drop', () => {
    const { result } = renderHook(() => useDragAndDrop({ maxFiles: 1 }))

    act(() => {
      result.current.getRootProps().onDrop(makeDragEvent([
        new File(['a'], 'a.txt'),
        new File(['b'], 'b.txt')
      ]))
    })

    expect(result.current.error).not.toBeNull()

    act(() => {
      result.current.getRootProps().onDrop(makeDragEvent([new File(['a'], 'a.txt')]))
    })

    expect(result.current.error).toBeNull()
  })
})
