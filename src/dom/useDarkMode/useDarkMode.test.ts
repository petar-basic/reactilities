import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDarkMode } from '../useDarkMode'

// Make the localStorage mock actually store values so useLocalStorage works
beforeEach(() => {
  const store: Record<string, string | null> = {}
  document.documentElement.classList.remove('dark')

  vi.mocked(localStorage.getItem).mockImplementation((key) => store[key] ?? null)
  vi.mocked(localStorage.setItem).mockImplementation((key, value) => { store[key] = value })
  vi.mocked(localStorage.removeItem).mockImplementation((key) => { delete store[key] })
})

describe('useDarkMode', () => {
  it('should default to system preference', () => {
    const { result } = renderHook(() => useDarkMode())
    // matchMedia returns false (light) in jsdom — system = light
    expect(result.current.colorScheme).toBe('system')
    expect(result.current.isDark).toBe(false)
  })

  it('should be dark when colorScheme is set to dark', async () => {
    const { result } = renderHook(() => useDarkMode())

    await act(async () => result.current.setColorScheme('dark'))

    expect(result.current.isDark).toBe(true)
  })

  it('should not be dark when colorScheme is set to light', async () => {
    const { result } = renderHook(() => useDarkMode())

    await act(async () => result.current.setColorScheme('dark'))
    await act(async () => result.current.setColorScheme('light'))

    expect(result.current.isDark).toBe(false)
  })

  it('should add dark class to <html> when dark', async () => {
    const { result } = renderHook(() => useDarkMode())

    await act(async () => result.current.setColorScheme('dark'))

    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('should remove dark class from <html> when light', async () => {
    const { result } = renderHook(() => useDarkMode())

    await act(async () => result.current.setColorScheme('dark'))
    await act(async () => result.current.setColorScheme('light'))

    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('should toggle between dark and light', async () => {
    const { result } = renderHook(() => useDarkMode())

    await act(async () => result.current.setColorScheme('light'))
    await act(async () => result.current.toggle())
    expect(result.current.isDark).toBe(true)

    await act(async () => result.current.toggle())
    expect(result.current.isDark).toBe(false)
  })

  // MUTATION-PROOF: `toggle` must keep a stable identity across re-renders that
  // do not change the dark state, so memo-ized children receiving it don't
  // re-render on every parent render. This fails if `toggle` is recreated each
  // render (i.e. if the useCallback wrapper is removed), because a re-render
  // with unchanged state would then yield a brand-new function reference.
  it('keeps a stable toggle reference across re-renders that do not change state', () => {
    const { result, rerender } = renderHook(() => useDarkMode())

    const firstToggle = result.current.toggle
    const firstReturn = result.current

    // Force re-renders that don't touch colorScheme / isDark.
    rerender()
    rerender()

    // Same identity for the callback...
    expect(Object.is(result.current.toggle, firstToggle)).toBe(true)
    // ...and for the returned object as a whole.
    expect(Object.is(result.current, firstReturn)).toBe(true)
  })

  // The stable reference must still flip correctly after a state change, and a
  // genuine dark-state change is allowed to produce a new identity.
  it('returns a new toggle identity only when dark state changes, and still toggles', async () => {
    const { result } = renderHook(() => useDarkMode())

    await act(async () => result.current.setColorScheme('light'))
    const lightToggle = result.current.toggle

    await act(async () => result.current.toggle())
    expect(result.current.isDark).toBe(true)
    // dark state flipped, so a new toggle identity is expected here
    expect(Object.is(result.current.toggle, lightToggle)).toBe(false)

    await act(async () => result.current.toggle())
    expect(result.current.isDark).toBe(false)
  })

  it('should persist preference to localStorage', async () => {
    const { result } = renderHook(() => useDarkMode('test-color-scheme'))

    await act(async () => result.current.setColorScheme('dark'))

    expect(localStorage.setItem).toHaveBeenCalledWith(
      'test-color-scheme',
      expect.stringContaining('dark')
    )
  })

  it('should expose colorScheme value', async () => {
    const { result } = renderHook(() => useDarkMode())

    await act(async () => result.current.setColorScheme('dark'))
    expect(result.current.colorScheme).toBe('dark')

    await act(async () => result.current.setColorScheme('system'))
    expect(result.current.colorScheme).toBe('system')
  })

  // System-preference branch. The default jsdom matchMedia mock reports
  // matches:false, so the existing "should default to system preference" test
  // never exercises the dark side of `colorScheme === 'system' && systemPrefersDark`.
  // Here we mock matchMedia to matches:true and assert the system preference
  // actually drives isDark to true.
  // MUTATION-PROOF: this fails if the systemPrefersDark term is dropped from the
  // isDark expression, or if useMediaQuery stops reading the real match.
  it('should be dark when colorScheme is system and OS prefers dark', () => {
    const originalMatchMedia = window.matchMedia
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: true,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })) as unknown as typeof window.matchMedia

    try {
      const { result } = renderHook(() => useDarkMode())
      expect(result.current.colorScheme).toBe('system')
      expect(result.current.isDark).toBe(true)
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    } finally {
      window.matchMedia = originalMatchMedia
    }
  })

  it('should stay light in system mode when OS does not prefer dark', () => {
    // Default mock reports matches:false.
    const { result } = renderHook(() => useDarkMode())
    expect(result.current.colorScheme).toBe('system')
    expect(result.current.isDark).toBe(false)
  })

  it('explicit light preference overrides a dark OS preference', async () => {
    const originalMatchMedia = window.matchMedia
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: true,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })) as unknown as typeof window.matchMedia

    try {
      const { result } = renderHook(() => useDarkMode())
      // Sanity: with OS dark and system scheme, isDark is true.
      expect(result.current.isDark).toBe(true)

      // Explicit light must win even though the OS prefers dark.
      await act(async () => result.current.setColorScheme('light'))
      expect(result.current.colorScheme).toBe('light')
      expect(result.current.isDark).toBe(false)
    } finally {
      window.matchMedia = originalMatchMedia
    }
  })

  // SSR — drives the getServerSnapshot path of the composed useMediaQuery and
  // useLocalStorage through renderToString.
  // MUTATION-PROOF: useDarkMode composes useMediaQuery, whose pre-fix
  // getServerSnapshot threw "client-only hook", crashing the server render.
  // This fails if that throwing behaviour returns.
  describe('SSR (getServerSnapshot)', () => {
    it('renders without throwing and defaults to light (SSR)', async () => {
      const { renderToString } = await import('react-dom/server')
      const React = await import('react')

      function SsrConsumer() {
        const { isDark } = useDarkMode()
        return React.createElement('span', null, isDark ? 'dark' : 'light')
      }

      let html = ''
      expect(() => {
        html = renderToString(React.createElement(SsrConsumer))
      }).not.toThrow()

      // Server default: system preference resolves to false, stored scheme is
      // 'system', so isDark is false -> 'light'.
      expect(html).toContain('light')
    })

    it('honors defaultDark option on the server snapshot (SSR)', async () => {
      const { renderToString } = await import('react-dom/server')
      const React = await import('react')

      function SsrConsumer() {
        const { isDark } = useDarkMode('color-scheme', { defaultDark: true })
        return React.createElement('span', null, isDark ? 'dark' : 'light')
      }

      let html = ''
      expect(() => {
        html = renderToString(React.createElement(SsrConsumer))
      }).not.toThrow()

      // MUTATION-PROOF: with defaultDark:true the system preference resolves to
      // dark on the server, so isDark is true -> 'dark'. Fails if defaultDark is
      // ignored or not forwarded to useMediaQuery's defaultValue.
      expect(html).toContain('dark')
    })
  })
})
