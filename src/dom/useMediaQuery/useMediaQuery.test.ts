import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useMediaQuery, MEDIA_QUERIES } from '../useMediaQuery'

/**
 * Build a matchMedia mock that reports a fixed `matches` value and records the
 * change listener so we can verify subscribe/unsubscribe behaviour.
 */
function mockMatchMedia(matches: boolean) {
  const listeners = new Set<() => void>()
  const impl = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn((_: string, cb: () => void) => listeners.add(cb)),
    removeEventListener: vi.fn((_: string, cb: () => void) => listeners.delete(cb)),
    dispatchEvent: vi.fn(),
  }))
  window.matchMedia = impl as unknown as typeof window.matchMedia
  return { impl, listeners }
}

describe('useMediaQuery', () => {
  beforeEach(() => {
    // Reset to a known light/false matchMedia between tests.
    mockMatchMedia(false)
  })

  describe('client behaviour', () => {
    it('returns false when the query does not match', () => {
      mockMatchMedia(false)
      const { result } = renderHook(() => useMediaQuery(MEDIA_QUERIES.IS_SMALL_DEVICE))
      expect(result.current).toBe(false)
    })

    it('returns true when matchMedia reports a match (real value after mount)', () => {
      mockMatchMedia(true)
      const { result } = renderHook(() => useMediaQuery('(prefers-color-scheme: dark)'))
      // The real matchMedia value must win on the client regardless of the
      // server default. If getServerSnapshot's value leaked into the mounted
      // render this would be false.
      expect(result.current).toBe(true)
    })

    it('reads the value from window.matchMedia for the given query', () => {
      const { impl } = mockMatchMedia(true)
      renderHook(() => useMediaQuery('(orientation: landscape)'))
      expect(impl).toHaveBeenCalledWith('(orientation: landscape)')
    })

    it('subscribes to and unsubscribes from change events', () => {
      const { listeners } = mockMatchMedia(false)
      const { unmount } = renderHook(() => useMediaQuery('(min-width: 600px)'))
      expect(listeners.size).toBe(1)
      unmount()
      expect(listeners.size).toBe(0)
    })

    it('exposes the predefined MEDIA_QUERIES constants', () => {
      expect(MEDIA_QUERIES.IS_SMALL_DEVICE).toContain('max-width')
      expect(MEDIA_QUERIES.IS_LARGER_DEVICE).toContain('min-width')
    })
  })

  // SSR — drives the getServerSnapshot path through renderToString.
  // MUTATION-PROOF: the pre-fix getServerSnapshot threw
  // "useMediaQuery is a client-only hook", so renderToString crashed. These
  // tests fail if that throwing behaviour is restored.
  describe('SSR (getServerSnapshot)', () => {
    it('renders without throwing and uses the default of false (SSR)', async () => {
      const { renderToString } = await import('react-dom/server')
      const React = await import('react')

      function SsrConsumer() {
        const matches = useMediaQuery('(prefers-color-scheme: dark)')
        return React.createElement('span', null, String(matches))
      }

      let html = ''
      expect(() => {
        html = renderToString(React.createElement(SsrConsumer))
      }).not.toThrow()

      // Default server snapshot is false.
      expect(html).toContain('false')
      expect(html).not.toContain('true')
    })

    it('honors defaultValue on the server snapshot (SSR)', async () => {
      const { renderToString } = await import('react-dom/server')
      const React = await import('react')

      function SsrConsumer() {
        const matches = useMediaQuery('(prefers-color-scheme: dark)', {
          defaultValue: true,
        })
        return React.createElement('span', null, String(matches))
      }

      let html = ''
      expect(() => {
        html = renderToString(React.createElement(SsrConsumer))
      }).not.toThrow()

      // MUTATION-PROOF: if getServerSnapshot ignored the option (e.g. hardcoded
      // false) or threw, this assertion fails.
      expect(html).toContain('true')
    })

    it('honors serverDefault alias on the server snapshot (SSR)', async () => {
      const { renderToString } = await import('react-dom/server')
      const React = await import('react')

      function SsrConsumer() {
        const matches = useMediaQuery('(prefers-color-scheme: dark)', {
          serverDefault: true,
        })
        return React.createElement('span', null, String(matches))
      }

      let html = ''
      expect(() => {
        html = renderToString(React.createElement(SsrConsumer))
      }).not.toThrow()

      expect(html).toContain('true')
    })
  })
})
