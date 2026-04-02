import { useCallback, useEffect, useRef, useState } from "react";

interface UseClipboardReturn {
  value: string | null;
  hasCopied: boolean;
  copy: (text: string) => Promise<boolean>;
  read: () => Promise<string | null>;
  reset: () => void;
}

/**
 * Hook for reading from and writing to the clipboard
 * Supports both the modern Clipboard API and a legacy execCommand fallback for copy
 * The legacy fallback safely removes its temporary textarea even if execCommand throws
 * Tracks the last copied/read value and provides a timed hasCopied flag
 *
 * @param resetDelay - Milliseconds before hasCopied resets to false (default: 2000, pass 0 to disable)
 * @returns Object with clipboard value, copy/read functions, hasCopied flag, and reset
 *
 * @example
 * function CopyButton({ text }: { text: string }) {
 *   const { copy, hasCopied } = useClipboard();
 *
 *   return (
 *     <button onClick={() => copy(text)}>
 *       {hasCopied ? 'Copied!' : 'Copy'}
 *     </button>
 *   );
 * }
 *
 * @example
 * // Read from clipboard on paste button click
 * const { read, value } = useClipboard();
 *
 * <button onClick={read}>Paste from clipboard</button>
 * {value && <p>Clipboard contents: {value}</p>}
 */
export function useClipboard(resetDelay = 2000): UseClipboardReturn {
  const [value, setValue] = useState<string | null>(null);
  const [hasCopied, setHasCopied] = useState(false);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    return () => clearTimeout(resetTimerRef.current);
  }, []);

  const copy = useCallback(async (text: string): Promise<boolean> => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Legacy fallback for environments without Clipboard API
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0';
        document.body.appendChild(textarea);
        try {
          textarea.select();
          document.execCommand('copy');
        } finally {
          document.body.removeChild(textarea);
        }
      }

      setValue(text);
      setHasCopied(true);

      if (resetDelay > 0) {
        clearTimeout(resetTimerRef.current);
        resetTimerRef.current = setTimeout(() => setHasCopied(false), resetDelay);
      }

      return true;
    } catch {
      return false;
    }
  }, [resetDelay]);

  const read = useCallback(async (): Promise<string | null> => {
    try {
      const text = await navigator.clipboard.readText();
      setValue(text);
      return text;
    } catch {
      console.warn('useClipboard: read failed. Ensure the clipboard-read permission is granted.');
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    clearTimeout(resetTimerRef.current);
    setValue(null);
    setHasCopied(false);
  }, []);

  return { value, hasCopied, copy, read, reset };
}
