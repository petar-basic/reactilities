
import { useCallback, useState } from "react";

function oldSchoolCopy(text: string) {
  const tempTextArea = document.createElement("textarea");
  tempTextArea.value = text;
  document.body.appendChild(tempTextArea);
  tempTextArea.select();
  document.execCommand("copy");
  document.body.removeChild(tempTextArea);
}

/**
 * Hook for copying text to clipboard with fallback support
 * Uses modern Clipboard API when available, falls back to legacy method
 * Tracks the last copied value for UI feedback
 * 
 * @returns Array containing [copiedValue, copyFunction]
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
 *     await copyToClipboard(url);
 *     setShowFeedback(true);
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
export function useCopyToClipboard(): [string | null, (value: string) => void] {
  const [state, setState] = useState<string | null>(null);

  const copyToClipboard = useCallback((value: string) => {
    const handleCopy = async () => {
      try {
        if (navigator?.clipboard?.writeText) {
          await navigator.clipboard.writeText(value);
          setState(value);
        } else {
          throw new Error("writeText not supported");
        }
      } catch (e) {
        oldSchoolCopy(value);
        setState(value);
      }
    }

    handleCopy()
  }, []);

  return [state, copyToClipboard];
}