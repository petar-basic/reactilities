import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import useFavicon from '../useFavicon'

describe('useFavicon', () => {
  let mockLink: HTMLLinkElement
  let mockQuerySelector: ReturnType<typeof vi.fn>
  let mockCreateElement: ReturnType<typeof vi.fn>
  let mockAppendChild: ReturnType<typeof vi.fn>

  beforeEach(() => {
    // Create a real DOM element for testing
    mockLink = document.createElement('link') as HTMLLinkElement
    vi.spyOn(mockLink, 'setAttribute')

    mockQuerySelector = vi.fn()
    mockCreateElement = vi.fn().mockReturnValue(mockLink)
    mockAppendChild = vi.fn()

    vi.spyOn(document, 'querySelector').mockImplementation(mockQuerySelector)
    vi.spyOn(document, 'createElement').mockImplementation(mockCreateElement)
    vi.spyOn(document.head, 'appendChild').mockImplementation(mockAppendChild)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should create new favicon link when none exists', () => {
    mockQuerySelector.mockReturnValue(null)

    renderHook(() => useFavicon('/favicon.ico'))

    expect(document.querySelector).toHaveBeenCalledWith(`link[rel~="icon"]`)
    expect(document.createElement).toHaveBeenCalledWith('link')
    expect(mockLink.setAttribute).toHaveBeenCalledWith('type', 'image/x-icon')
    expect(mockLink.setAttribute).toHaveBeenCalledWith('rel', 'icon')
    expect(mockLink.setAttribute).toHaveBeenCalledWith('href', '/favicon.ico')
    expect(document.head.appendChild).toHaveBeenCalledWith(mockLink)
  })

  it('should update existing favicon link', () => {
    mockQuerySelector.mockReturnValue(mockLink)

    renderHook(() => useFavicon('/new-favicon.ico'))

    expect(document.querySelector).toHaveBeenCalledWith(`link[rel~="icon"]`)
    expect(document.createElement).not.toHaveBeenCalledWith('link')
    expect(mockLink.setAttribute).toHaveBeenCalledWith('href', '/new-favicon.ico')
    expect(document.head.appendChild).not.toHaveBeenCalled()
  })

  it('should update favicon when URL changes', () => {
    mockQuerySelector.mockReturnValue(mockLink)

    const { rerender } = renderHook(
      ({ url }) => useFavicon(url),
      { initialProps: { url: '/favicon1.ico' } }
    )

    expect(mockLink.setAttribute).toHaveBeenCalledWith('href', '/favicon1.ico')

    rerender({ url: '/favicon2.ico' })

    expect(mockLink.setAttribute).toHaveBeenCalledWith('href', '/favicon2.ico')
  })

  it('should handle data URLs', () => {
    mockQuerySelector.mockReturnValue(null)
    const dataUrl = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"><circle r="10"/></svg>'

    renderHook(() => useFavicon(dataUrl))

    expect(mockLink.setAttribute).toHaveBeenCalledWith('href', dataUrl)
  })

  it('should handle empty string URL', () => {
    mockQuerySelector.mockReturnValue(mockLink)

    renderHook(() => useFavicon(''))

    expect(mockLink.setAttribute).toHaveBeenCalledWith('href', '')
  })

  it('should handle relative URLs', () => {
    mockQuerySelector.mockReturnValue(null)

    renderHook(() => useFavicon('./favicon.png'))

    expect(mockLink.setAttribute).toHaveBeenCalledWith('href', './favicon.png')
  })

  it('should handle absolute URLs', () => {
    mockQuerySelector.mockReturnValue(null)

    renderHook(() => useFavicon('https://example.com/favicon.ico'))

    expect(mockLink.setAttribute).toHaveBeenCalledWith('href', 'https://example.com/favicon.ico')
  })

  it('should not create multiple links when called multiple times', () => {
    mockQuerySelector.mockReturnValue(null).mockReturnValueOnce(null).mockReturnValue(mockLink)

    const { rerender } = renderHook(
      ({ url }) => useFavicon(url),
      { initialProps: { url: '/favicon1.ico' } }
    )

    expect(document.createElement).toHaveBeenCalledWith('link')
    expect(document.head.appendChild).toHaveBeenCalledTimes(1)

    rerender({ url: '/favicon2.ico' })

    // Should not create another link element
    expect(document.createElement).toHaveBeenCalledTimes(2) // 1 for div container, 1 for link
    expect(document.head.appendChild).toHaveBeenCalledTimes(1)
    expect(mockLink.setAttribute).toHaveBeenCalledWith('href', '/favicon2.ico')
  })
})
