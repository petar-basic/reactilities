import { useCallback, useEffect, useRef, useState } from "react";

type AutoSaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

interface UseAutoSaveOptions<T> {
  data: T;
  onSave: (data: T) => Promise<void> | void;
  delay?: number;
}

interface UseAutoSaveReturn {
  status: AutoSaveStatus;
  lastSavedAt: Date | null;
  save: () => Promise<void>;
}

/**
 * Hook for automatically saving data after a debounce delay
 * Tracks save status (pending, saving, saved, error) and timestamp of last successful save
 * Useful for text editors, notes, and any form with draft auto-save behavior
 *
 * @param options.data - The data to watch and save
 * @param options.onSave - Async or sync function called to persist the data
 * @param options.delay - Debounce delay in milliseconds before auto-saving (default: 2000ms)
 * @returns Object with save status, last saved timestamp, and a manual save trigger
 *
 * @example
 * function NoteEditor() {
 *   const [content, setContent] = useState('');
 *
 *   const { status, lastSavedAt } = useAutoSave({
 *     data: content,
 *     onSave: (text) => api.saveNote(noteId, text),
 *     delay: 1500
 *   });
 *
 *   return (
 *     <>
 *       <textarea value={content} onChange={(e) => setContent(e.target.value)} />
 *       <span>{status === 'saved' ? `Saved at ${lastSavedAt?.toLocaleTimeString()}` : status}</span>
 *     </>
 *   );
 * }
 *
 * @example
 * // Manual save on Ctrl+S with auto-save fallback
 * const { status, save } = useAutoSave({ data: formData, onSave: submitDraft, delay: 3000 });
 *
 * useKeyboardShortcuts({ 'ctrl+s': save });
 */
export function useAutoSave<T>({
  data,
  onSave,
  delay = 2000
}: UseAutoSaveOptions<T>): UseAutoSaveReturn {
  const [status, setStatus] = useState<AutoSaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const onSaveRef = useRef(onSave);
  const dataRef = useRef(data);
  const isFirstRender = useRef(true);

  onSaveRef.current = onSave;
  dataRef.current = data;

  const save = useCallback(async () => {
    clearTimeout(timerRef.current);
    setStatus('saving');
    try {
      await onSaveRef.current(dataRef.current);
      setStatus('saved');
      setLastSavedAt(new Date());
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    // Skip auto-save on initial mount
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    setStatus('pending');
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(save, delay);

    return () => {
      clearTimeout(timerRef.current);
    };
  }, [data, delay, save]);

  return { status, lastSavedAt, save };
}
