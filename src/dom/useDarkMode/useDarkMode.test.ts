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
})
