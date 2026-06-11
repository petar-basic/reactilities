import { describe, it, expect } from 'vitest'
import { classnames, cn, clsx, cls, cx } from './index'

describe('classnames', () => {
  it('should handle string arguments', () => {
    expect(classnames('foo')).toBe('foo')
    expect(classnames('foo', 'bar')).toBe('foo bar')
    expect(classnames('foo', 'bar', 'baz')).toBe('foo bar baz')
  })

  it('should handle number arguments', () => {
    expect(classnames(1)).toBe('1')
    expect(classnames('foo', 2, 'bar')).toBe('foo 2 bar')
    // clsx omits the falsy number 0
    expect(classnames(0)).toBe('')
  })

  it('should handle boolean arguments', () => {
    expect(classnames(true)).toBe('')
    expect(classnames(false)).toBe('')
    expect(classnames('foo', true, 'bar')).toBe('foo bar')
    expect(classnames('foo', false, 'bar')).toBe('foo bar')
  })

  it('should handle null and undefined arguments', () => {
    expect(classnames(null)).toBe('')
    expect(classnames(undefined)).toBe('')
    expect(classnames('foo', null, 'bar')).toBe('foo bar')
    expect(classnames('foo', undefined, 'bar')).toBe('foo bar')
  })

  it('should handle object arguments', () => {
    expect(classnames({ foo: true })).toBe('foo')
    expect(classnames({ foo: false })).toBe('')
    expect(classnames({ foo: true, bar: false })).toBe('foo')
    expect(classnames({ foo: true, bar: true })).toBe('foo bar')
    expect(classnames('baz', { foo: true, bar: false })).toBe('baz foo')
  })

  it('should handle array arguments', () => {
    expect(classnames(['foo'])).toBe('foo')
    expect(classnames(['foo', 'bar'])).toBe('foo bar')
    expect(classnames('baz', ['foo', 'bar'])).toBe('baz foo bar')
    expect(classnames(['foo', { bar: true, baz: false }])).toBe('foo bar')
  })

  it('should handle nested arrays', () => {
    expect(classnames(['foo', ['bar', 'baz']])).toBe('foo bar baz')
    expect(classnames(['foo', ['bar', { baz: true, qux: false }]])).toBe('foo bar baz')
  })

  it('should handle mixed arguments', () => {
    expect(classnames('foo', { bar: true }, ['baz', 'qux'], null, undefined, 42)).toBe('foo bar baz qux 42')
    expect(classnames('foo', { bar: false }, ['baz', { qux: true }], 'quux')).toBe('foo baz qux quux')
  })

  it('should handle empty arguments', () => {
    expect(classnames()).toBe('')
    expect(classnames('')).toBe('')
    expect(classnames([], {})).toBe('')
  })

  it('should handle complex nested structures', () => {
    expect(classnames(
      'base',
      {
        active: true,
        disabled: false
      },
      [
        'nested',
        {
          highlighted: true,
          hidden: false
        }
      ],
      null,
      'final'
    )).toBe('base active nested highlighted final')
  })

  // Mutation-proof: these fail on the old implementation which pushed
  // any string/number via String(cls) and only skipped null/undefined/
  // false/true. They guarantee clsx-compatible falsy filtering.
  describe('falsy primitives (clsx-compatible)', () => {
    it('omits 0 from short-circuit expressions', () => {
      const count = 0
      // old code -> 'foo 0'
      expect(classnames('foo', count && 'bar')).toBe('foo')
      expect(classnames('foo', 0)).toBe('foo')
    })

    it('omits NaN instead of emitting the class "NaN"', () => {
      // old code -> 'foo NaN'
      expect(classnames('foo', NaN)).toBe('foo')
      expect(classnames(NaN)).toBe('')
    })

    it('omits empty strings (no double spaces)', () => {
      // old code -> 'foo  bar' (double space) / 'foo '
      expect(classnames('foo', '', 'bar')).toBe('foo bar')
      expect(classnames('foo', '')).toBe('foo')
      expect(classnames('')).toBe('')
    })

    it('omits falsy values nested in arrays', () => {
      // old code -> 'foo 0  bar NaN'
      expect(classnames(['foo', 0, '', 'bar', NaN])).toBe('foo bar')
    })

    it('omits falsy values nested in objects', () => {
      expect(classnames({ foo: true, bar: 0, baz: NaN, qux: '' })).toBe('foo')
    })

    it('matches clsx for a mixed bag of falsy values', () => {
      expect(
        classnames('a', 0, NaN, '', false, null, undefined, ['b', 0, ['c', '']], { d: true, e: 0 })
      ).toBe('a b c d')
    })
  })

  describe('aliases', () => {
    it('should export cn alias', () => {
      expect(cn('foo', 'bar')).toBe('foo bar')
      expect(cn).toBe(classnames)
    })

    it('should export clsx alias', () => {
      expect(clsx('foo', 'bar')).toBe('foo bar')
      expect(clsx).toBe(classnames)
    })

    it('should export cls alias', () => {
      expect(cls('foo', 'bar')).toBe('foo bar')
      expect(cls).toBe(classnames)
    })

    it('should export cx alias', () => {
      expect(cx('foo', 'bar')).toBe('foo bar')
      expect(cx).toBe(classnames)
    })
  })
})
