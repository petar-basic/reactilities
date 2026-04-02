import { DragEvent, useCallback, useRef, useState } from "react";

interface UseDragAndDropOptions {
  accept?: string[];
  maxFiles?: number;
  maxSize?: number;
  onDrop?: (files: File[]) => void;
  onError?: (error: Error) => void;
}

interface DragAndDropRootProps {
  onDragEnter: (e: DragEvent) => void;
  onDragLeave: (e: DragEvent) => void;
  onDragOver: (e: DragEvent) => void;
  onDrop: (e: DragEvent) => void;
}

interface UseDragAndDropReturn {
  isDragging: boolean;
  files: File[];
  error: Error | null;
  getRootProps: () => DragAndDropRootProps;
  reset: () => void;
}

/**
 * Hook for handling file drag-and-drop with validation
 * Returns prop getters for the drop zone element and tracks dragging state, dropped files, and errors
 * Supports file type, count, and size validation
 *
 * @param options.accept - Allowed MIME types or file extensions, e.g. ['image/png', '.pdf']
 * @param options.maxFiles - Maximum number of files allowed per drop
 * @param options.maxSize - Maximum file size in bytes per file
 * @param options.onDrop - Callback fired with the validated files after a successful drop
 * @param options.onError - Callback fired when validation fails
 * @returns Object with drag state, dropped files, error, prop getter, and reset function.
 *   When validation fails, `files` is cleared to `[]` so stale valid files never show alongside a new error.
 *
 * @example
 * function DropZone() {
 *   const { isDragging, files, getRootProps } = useDragAndDrop({
 *     accept: ['image/jpeg', 'image/png'],
 *     maxFiles: 5,
 *     maxSize: 5 * 1024 * 1024, // 5 MB
 *     onDrop: (files) => uploadFiles(files)
 *   });
 *
 *   return (
 *     <div
 *       {...getRootProps()}
 *       style={{ border: isDragging ? '2px solid blue' : '2px dashed gray' }}
 *     >
 *       {files.length ? files.map(f => <p key={f.name}>{f.name}</p>) : 'Drop files here'}
 *     </div>
 *   );
 * }
 *
 * @example
 * // Simple drop zone without validation
 * const { isDragging, files, getRootProps } = useDragAndDrop();
 */
export function useDragAndDrop({
  accept,
  maxFiles,
  maxSize,
  onDrop,
  onError
}: UseDragAndDropOptions = {}): UseDragAndDropReturn {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<Error | null>(null);

  // Track nested drag enter/leave to avoid flicker when dragging over child elements
  const dragCounterRef = useRef(0);
  const onDropRef = useRef(onDrop);
  const onErrorRef = useRef(onError);

  onDropRef.current = onDrop;
  onErrorRef.current = onError;

  const validateFiles = useCallback((incoming: File[]): File[] | Error => {
    if (maxFiles !== undefined && incoming.length > maxFiles) {
      return new Error(`Too many files. Maximum is ${maxFiles}.`);
    }
    for (const file of incoming) {
      if (maxSize !== undefined && file.size > maxSize) {
        return new Error(`File "${file.name}" exceeds the maximum size of ${maxSize} bytes.`);
      }
      if (accept && !accept.some(type => {
        if (type.startsWith('.')) {
          return file.name.toLowerCase().endsWith(type.toLowerCase());
        }
        if (type.endsWith('/*')) {
          return file.type.startsWith(type.slice(0, -1));
        }
        return file.type === type;
      })) {
        return new Error(`File type "${file.type}" is not accepted.`);
      }
    }
    return incoming;
  }, [accept, maxFiles, maxSize]);

  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    dragCounterRef.current++;
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    dragCounterRef.current = 0;
    setIsDragging(false);
    setError(null);

    const droppedFiles = Array.from(e.dataTransfer.files);
    const result = validateFiles(droppedFiles);

    if (result instanceof Error) {
      setFiles([]);
      setError(result);
      onErrorRef.current?.(result);
    } else {
      setFiles(result);
      onDropRef.current?.(result);
    }
  }, [validateFiles]);

  const reset = useCallback(() => {
    setFiles([]);
    setError(null);
    setIsDragging(false);
    dragCounterRef.current = 0;
  }, []);

  const getRootProps = useCallback((): DragAndDropRootProps => ({
    onDragEnter: handleDragEnter,
    onDragLeave: handleDragLeave,
    onDragOver: handleDragOver,
    onDrop: handleDrop
  }), [handleDragEnter, handleDragLeave, handleDragOver, handleDrop]);

  return { isDragging, files, error, getRootProps, reset };
}
