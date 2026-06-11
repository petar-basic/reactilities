
import { useCallback, useState } from "react";

function oldSchoolCopy(text: string): boolean {
  const tempTextArea = document.createElement("textarea");
  tempTextArea.value = text;
  // Keep the textarea off-screen and invisible so it never flashes in the UI.
  tempTextArea.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0";
  document.body.appendChild(tempTextArea);
  try {
    tempTextArea.select();
    // Capture the boolean result so callers can report whether the copy worked.
    return document.execCommand("copy");
  } finally {
    // Always remove the textarea, even if select()/execCommand() throws,
    // so we never leak a focused, invisible textarea into the DOM.
    document.body.removeChild(tempTextArea);
  }
}

/**
 * Hook for copying text to clipboard with fallback support
 * Uses modern Clipboard API when available, falls back to legacy method
 * Tracks the last copied value for UI feedback
 *
 * @returns Array containing [copiedValue, copyFunction]
 *   - copyFunction returns a Promise<boolean> that resolves to whether the copy succeeded
 *
 * @example
 * function CopyButton({ text }) {
 *   const [copiedValue, copyToClipboard] = useCopyToClipboard();
 *   const isCopied = copiedValue === text;
 *
 *   return (
 *     <button onClick={() => copyToClipboard(text)}>
 *       {isCopied ? 'Copied!' : 'Copy'}
 *     </button>
 *   );
 * }
 *
 * // Advanced usage with feedback
 * function ShareLink({ url }) {
 *   const [copiedValue, copyToClipboard] = useCopyToClipboard();
 *   const [showFeedback, setShowFeedback] = useState(false);
 *
 *   const handleCopy = async () => {
 *     const ok = await copyToClipboard(url);
 *     if (ok) setShowFeedback(true);
 *     setTimeout(() => setShowFeedback(false), 2000);
 *   };
 *
 *   return (
 *     <div>
 *       <input value={url} readOnly />
 *       <button onClick={handleCopy}>Copy Link</button>
 *       {showFeedback && <span>Link copied to clipboard!</span>}
 *     </div>
 *   );
 * }
 */
export function useCopyToClipboard(): [string | null, (value: string) => Promise<boolean>] {
  const [state, setState] = useState<string | null>(null);

  const copyToClipboard = useCallback(async (value: string): Promise<boolean> => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        setState(value);
        return true;
      }
      throw new Error("writeText not supported");
    } catch {
      // execCommand is deprecated but kept as a fallback for older browsers.
      // Guard the fallback too: select()/execCommand() can throw, and we must
      // never let the copy function reject unexpectedly. oldSchoolCopy always
      // cleans up its temporary textarea via finally, but a thrown error still
      // needs to be swallowed here so the Promise resolves to false instead.
      // Only update state when the copy actually succeeded.
      try {
        const success = oldSchoolCopy(value);
        if (success) setState(value);
        return success;
      } catch {
        return false;
      }
    }
  }, []);

  return [state, copyToClipboard];
}
