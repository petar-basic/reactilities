type ClassValue = string | number | boolean | undefined | null | ClassValue[] | Record<string, boolean | undefined | null>;

/**
 * A utility function for conditionally joining classNames together.
 * Accepts strings, numbers, arrays, objects, and handles falsy values gracefully.
 * 
 * @param classes - Any number of class values to combine
 * @returns A string of combined class names
 * 
 * @example
 * classnames('foo', 'bar'); // 'foo bar'
 * classnames('foo', { bar: true, baz: false }); // 'foo bar'
 * classnames('foo', ['bar', 'baz']); // 'foo bar baz'
 * classnames('foo', null, undefined, 'bar'); // 'foo bar'
 */
export function classnames(...classes: ClassValue[]): string {
  const result: string[] = [];

  for (const cls of classes) {
    // Skip all falsy primitives (false, true, null, undefined, 0, NaN, '')
    // to match clsx behaviour precisely.
    if ((typeof cls === 'string' && cls) || (typeof cls === 'number' && cls)) {
      result.push(String(cls));
    } else if (Array.isArray(cls)) {
      const nested = classnames(...cls);
      if (nested) result.push(nested);
    } else if (cls && typeof cls === 'object') {
      for (const [key, value] of Object.entries(cls)) {
        if (value) result.push(key);
      }
    }
  }

  return result.join(' ');
}

// Export with multiple aliases for compatibility with popular libraries
export { classnames as cn };
export { classnames as clsx };
export { classnames as cls };
export { classnames as cx };