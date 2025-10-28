import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useDocumentTitle } from '../useDocumentTitle'

describe('useDocumentTitle', () => {
  let originalTitle: string

  beforeEach(() => {
    originalTitle = document.title
  })

  afterEach(() => {
    document.title = originalTitle
  })

  it('should set the document title', () => {
    renderHook(() => useDocumentTitle('Test Title'))
    expect(document.title).toBe('Test Title')
  })

  it('should update the document title when title changes', () => {
    const { rerender } = renderHook(
      ({ title }) => useDocumentTitle(title),
      { initialProps: { title: 'Initial Title' } }
    )

    expect(document.title).toBe('Initial Title')

    rerender({ title: 'Updated Title' })
    expect(document.title).toBe('Updated Title')
  })

  it('should handle empty string title', () => {
    renderHook(() => useDocumentTitle(''))
    expect(document.title).toBe('')
  })

  it('should handle special characters in title', () => {
    const specialTitle = 'Test & Title <with> "special" characters'
    renderHook(() => useDocumentTitle(specialTitle))
    expect(document.title).toBe(specialTitle)
  })

  it('should handle unicode characters in title', () => {
    const unicodeTitle = 'Test 🚀 Title with émojis and àccénts'
    renderHook(() => useDocumentTitle(unicodeTitle))
    expect(document.title).toBe(unicodeTitle)
  })

  it('should update title multiple times', () => {
    const { rerender } = renderHook(
      ({ title }) => useDocumentTitle(title),
      { initialProps: { title: 'Title 1' } }
    )

    expect(document.title).toBe('Title 1')

    rerender({ title: 'Title 2' })
    expect(document.title).toBe('Title 2')

    rerender({ title: 'Title 3' })
    expect(document.title).toBe('Title 3')
  })

  it('should not update title if same title is passed', () => {
    const { rerender } = renderHook(
      ({ title }) => useDocumentTitle(title),
      { initialProps: { title: 'Same Title' } }
    )

    expect(document.title).toBe('Same Title')

    // Rerender with same title
    rerender({ title: 'Same Title' })
    expect(document.title).toBe('Same Title')
  })
})
