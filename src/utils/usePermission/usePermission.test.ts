import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { usePermission } from '../usePermission'

const mockAddEventListener = vi.fn()
const mockRemoveEventListener = vi.fn()

function makeStatus(state: PermissionState) {
  return {
    state,
    addEventListener: mockAddEventListener,
    removeEventListener: mockRemoveEventListener,
  } as unknown as PermissionStatus
}

describe('usePermission', () => {
  beforeEach(() => {
    mockAddEventListener.mockClear()
    mockRemoveEventListener.mockClear()
  })

  it('should return loading true initially', () => {
    vi.mocked(navigator.permissions.query).mockReturnValue(new Promise(() => {}))
    const { result } = renderHook(() => usePermission('camera' as PermissionName))
    expect(result.current.loading).toBe(true)
  })

  it('should return granted state', async () => {
    vi.mocked(navigator.permissions.query).mockResolvedValue(makeStatus('granted'))

    const { result } = renderHook(() => usePermission('camera' as PermissionName))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.state).toBe('granted')
  })

  it('should return denied state', async () => {
    vi.mocked(navigator.permissions.query).mockResolvedValue(makeStatus('denied'))

    const { result } = renderHook(() => usePermission('camera' as PermissionName))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.state).toBe('denied')
  })

  it('should return prompt state', async () => {
    vi.mocked(navigator.permissions.query).mockResolvedValue(makeStatus('prompt'))

    const { result } = renderHook(() => usePermission('notifications' as PermissionName))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.state).toBe('prompt')
  })

  it('should subscribe to change events on the status object', async () => {
    vi.mocked(navigator.permissions.query).mockResolvedValue(makeStatus('prompt'))

    renderHook(() => usePermission('microphone' as PermissionName))

    await waitFor(() => expect(mockAddEventListener).toHaveBeenCalledWith('change', expect.any(Function)))
  })

  it('should unsubscribe from change events on unmount', async () => {
    vi.mocked(navigator.permissions.query).mockResolvedValue(makeStatus('granted'))

    const { unmount } = renderHook(() => usePermission('camera' as PermissionName))

    await waitFor(() => expect(mockAddEventListener).toHaveBeenCalled())
    unmount()

    expect(mockRemoveEventListener).toHaveBeenCalledWith('change', expect.any(Function))
  })

  it('should return unsupported when query rejects', async () => {
    vi.mocked(navigator.permissions.query).mockRejectedValue(new Error('not supported'))

    const { result } = renderHook(() => usePermission('camera' as PermissionName))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.state).toBe('unsupported')
  })

  it('should return unsupported when permissions API is unavailable', async () => {
    const original = navigator.permissions
    ;(navigator as any).permissions = undefined

    const { result } = renderHook(() => usePermission('camera' as PermissionName))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.state).toBe('unsupported')

    ;(navigator as any).permissions = original
  })
})
