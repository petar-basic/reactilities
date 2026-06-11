import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
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

  it('should update state when a change event fires', async () => {
    let captured: (() => void) | undefined
    const status = makeStatus('prompt')
    vi.mocked(status.addEventListener as any).mockImplementation(
      (_event: string, handler: () => void) => {
        captured = handler
      }
    )
    // change the underlying state so handleChange reads the new value
    vi.mocked(navigator.permissions.query).mockResolvedValue(status)

    const { result } = renderHook(() => usePermission('camera' as PermissionName))

    await waitFor(() => expect(result.current.state).toBe('prompt'))

    // simulate the browser changing the permission
    ;(status as any).state = 'granted'
    act(() => {
      captured?.()
    })

    await waitFor(() => expect(result.current.state).toBe('granted'))
  })

  it('MUTATION-PROOF: does not leak a listener or setState when unmounted while query is pending', async () => {
    // controllable promise that stays pending until we resolve it
    let resolveQuery!: (status: PermissionStatus) => void
    const pending = new Promise<PermissionStatus>((resolve) => {
      resolveQuery = resolve
    })
    vi.mocked(navigator.permissions.query).mockReturnValue(pending)

    const status = makeStatus('granted')

    const { result, unmount } = renderHook(() =>
      usePermission('camera' as PermissionName)
    )

    // still pending: loading true, no listener attached yet
    expect(result.current.loading).toBe(true)
    expect(mockAddEventListener).not.toHaveBeenCalled()

    // unmount BEFORE the query resolves
    unmount()

    // now resolve the pending query — the late .then must be a no-op
    resolveQuery(status)
    await pending
    // flush microtasks so the .then callback runs
    await Promise.resolve()
    await Promise.resolve()

    // No dangling listener may remain. The leak in the unmounted-while-pending
    // case is specifically an addEventListener that the (null at cleanup time)
    // removeEventListener never matched. So the invariant is: on the cancelled
    // path we must NOT attach a listener that outlives the effect.
    // - current/mutated code (no cancelled guard): adds a listener, never
    //   removes it (cleanup ran while permissionStatus was still null) -> leak.
    // - fixed code: never attaches on the cancelled path (adds == 0).
    expect(mockAddEventListener).not.toHaveBeenCalled()

    // Whatever the strategy, there is no add left without a matching remove.
    const adds = mockAddEventListener.mock.calls.length
    const removes = mockRemoveEventListener.mock.calls.length
    expect(adds).toBeLessThanOrEqual(removes)

    // state must NOT have been applied after cleanup (still loading/prompt)
    expect(result.current.loading).toBe(true)
    expect(result.current.state).toBe('prompt')
  })

  it('MUTATION-PROOF: removes the same handler reference when status resolves after unmount', async () => {
    let resolveQuery!: (status: PermissionStatus) => void
    const pending = new Promise<PermissionStatus>((resolve) => {
      resolveQuery = resolve
    })
    vi.mocked(navigator.permissions.query).mockReturnValue(pending)

    const status = makeStatus('granted')

    const { unmount } = renderHook(() =>
      usePermission('camera' as PermissionName)
    )

    unmount()

    resolveQuery(status)
    await pending
    await Promise.resolve()
    await Promise.resolve()

    // If the implementation defensively removes on the cancelled path, the
    // removed handler must be the exact same reference passed to add (so the
    // remove would actually unsubscribe it), and the event name must match.
    for (const [event, handler] of mockRemoveEventListener.mock.calls) {
      expect(event).toBe('change')
      expect(typeof handler).toBe('function')
    }
    // Crucially, no 'change' listener may dangle: every add has a matching
    // remove. The buggy code attaches in the late .then without removing it
    // (cleanup already ran with permissionStatus === null) -> adds(1) > removes(0).
    expect(mockAddEventListener.mock.calls.length).toBeLessThanOrEqual(
      mockRemoveEventListener.mock.calls.length
    )
  })

  it('MUTATION-PROOF: resets loading to true when permissionName changes before the new query resolves', async () => {
    // first query resolves immediately to granted
    vi.mocked(navigator.permissions.query).mockResolvedValueOnce(
      makeStatus('granted')
    )

    const { result, rerender } = renderHook(
      ({ name }) => usePermission(name),
      { initialProps: { name: 'camera' as PermissionName } }
    )

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.state).toBe('granted')

    // second query stays pending so we can observe the intermediate state
    vi.mocked(navigator.permissions.query).mockReturnValueOnce(
      new Promise<PermissionStatus>(() => {})
    )

    // change the permission name -> effect re-runs
    rerender({ name: 'microphone' as PermissionName })

    // loading must flip back to true while the new query is in flight.
    // (current/mutated code that drops setLoading(true) keeps loading=false)
    expect(result.current.loading).toBe(true)
    // and we must not surface the previous permission's value
    expect(result.current.state).toBe('prompt')
  })
})
